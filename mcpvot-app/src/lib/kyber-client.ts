import { createWalletClient, http, publicActions, type Account, type Hex, type PublicClient, type WalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

const KYBER_HOST = 'https://aggregator-api.kyberswap.com';
const KYBER_CHAIN = 'base';
const KYBER_ROUTER = '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5';
const KYBER_CLIENT_ID = 'MCPVOT-TS';

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const VOT_ADDRESS = '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07';

// ERC20 ABI for approval and transfer
const ERC20_ABI = [
    {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
        outputs: [{ name: '', type: 'bool' }]
    },
    {
        name: 'allowance',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'recipient', type: 'address' }, { name: 'amount', type: 'uint256' }],
        outputs: [{ name: '', type: 'bool' }]
    },
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
    }
] as const;

export class KyberClient {
    private walletClient: WalletClient & { account: Account };
    private publicClient: PublicClient;

    constructor(privateKey: Hex) {
        const account = privateKeyToAccount(privateKey);
        this.publicClient = createWalletClient({
            account,
            chain: base,
            transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org')
        }).extend(publicActions) as PublicClient;

        this.walletClient = createWalletClient({
            account,
            chain: base,
            transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org')
        }) as WalletClient & { account: Account };
    }

    private async getRoute(tokenIn: string, tokenOut: string, amountIn: string) {
        const params = new URLSearchParams({
            tokenIn,
            tokenOut,
            amountIn,
            gasInclude: 'true',
            slippageTolerance: '50', // 0.5%
            source: KYBER_CLIENT_ID
        });

        const res = await fetch(`${KYBER_HOST}/${KYBER_CHAIN}/api/v1/routes?${params.toString()}`, {
            headers: { 'X-Client-Id': KYBER_CLIENT_ID }
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Kyber route failed: ${res.status} ${text}`);
        }

        const json = await res.json();
        if (json.code !== 0) throw new Error(`Kyber route error: ${json.message}`);
        return json.data;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async buildTx(routeSummary: any, sender: string, recipient: string) {
        const body = {
            routeSummary,
            sender,
            recipient,
            slippageTolerance: 50,
            source: KYBER_CLIENT_ID,
            deadline: Math.floor(Date.now() / 1000) + 1200, // 20 mins
            enableGasEstimation: true
        };

        const res = await fetch(`${KYBER_HOST}/${KYBER_CHAIN}/api/v1/route/build`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Client-Id': KYBER_CLIENT_ID
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Kyber build tx failed: ${res.status} ${text}`);
        }

        const json = await res.json();
        if (json.code !== 0) throw new Error(`Kyber build tx error: ${json.message}`);
        return json.data;
    }

    async executeSwap(usdcAmountAtomic: bigint, payerAddress: string) {
        const account = this.walletClient.account;

        // 1. Check Allowance
        const allowance = await this.publicClient.readContract({
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'allowance',
            args: [account.address, KYBER_ROUTER]
        });

        if (allowance < usdcAmountAtomic) {
            console.log('[KyberClient] Approving USDC...');
            const hash = await this.walletClient.writeContract({
                address: USDC_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [KYBER_ROUTER, BigInt(2) ** BigInt(256) - BigInt(1)]
            });
            await this.publicClient.waitForTransactionReceipt({ hash });
            console.log('[KyberClient] Approved USDC:', hash);
        }

        // 2. Get Route
        console.log('[KyberClient] Getting route...');
        const routeData = await this.getRoute(USDC_ADDRESS, VOT_ADDRESS, usdcAmountAtomic.toString());

        // 3. Build Transaction
        console.log('[KyberClient] Building transaction...');
        const buildData = await this.buildTx(routeData.routeSummary, account.address, account.address);

        // 4. Execute Swap
        console.log('[KyberClient] Executing swap...');
        const txHash = await this.walletClient.sendTransaction({
            to: buildData.routerAddress as Hex,
            data: buildData.data as Hex,
            value: BigInt(buildData.transactionValue || 0),
        });

        console.log('[KyberClient] Swap TX sent:', txHash);
        const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });

        if (receipt.status !== 'success') {
            throw new Error(`Swap transaction reverted: ${txHash}`);
        }

        // 5. Check VOT balance and transfer to payer
        const votBalance = await this.publicClient.readContract({
            address: VOT_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [account.address]
        });

        const amountOut = BigInt(routeData.routeSummary.amountOut);

        if (votBalance < amountOut) {
            console.warn(`[KyberClient] Warning: Balance ${votBalance} < Estimated ${amountOut}`);
        }

        const transferAmount = votBalance < amountOut ? votBalance : amountOut;

        if (transferAmount > 0n) {
            console.log(`[KyberClient] Transferring ${transferAmount} VOT to ${payerAddress}...`);
            const transferHash = await this.walletClient.writeContract({
                address: VOT_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'transfer',
                args: [payerAddress as Hex, transferAmount]
            });
            await this.publicClient.waitForTransactionReceipt({ hash: transferHash });
            console.log('[KyberClient] Transfer complete:', transferHash);

            return {
                success: true,
                txHash,
                transferHash,
                votAmount: transferAmount.toString()
            };
        } else {
            throw new Error('Swap resulted in 0 VOT');
        }
    }
}
