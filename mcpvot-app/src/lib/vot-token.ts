import { CdpClient } from '@coinbase/cdp-sdk';
import { ethers } from 'ethers';
import { createPublicClient, http, type PublicClient } from 'viem';
import { readContract } from 'viem/actions';
import { base } from 'viem/chains';

// VOT Token contract details
export const VOT_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_VOT_TOKEN || process.env.VOT_TOKEN || '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07';

export const VOT_TOKEN_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function microPayment(address to, uint256 amount, string calldata memo) external",
    "function microPaymentWithBurn(address to, uint256 amount, uint256 burnAmount, string calldata memo) external",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "function totalSupply() view returns (uint256)",
    "function getBurnStats() external view returns (uint256 totalBurned, uint256 burnRate, uint256 circulatingSupply)"
] as const;

interface ServerWallet {
    id: string;
    addressId: string;
}

export class CDPVOTTokenService {
    private cdpClient: CdpClient;
    private publicClient: ReturnType<typeof createPublicClient>;
    private serverWallet: ServerWallet | null = null;
    private initialized: boolean = false;

    constructor() {
        // Initialize CDP Client
        this.cdpClient = new CdpClient({
            apiKeyId: process.env.CDP_API_KEY_ID!,
            apiKeySecret: process.env.CDP_API_KEY_SECRET!,
            walletSecret: process.env.CDP_WALLET_SECRET!
        });

        // Initialize public client for reading
        this.publicClient = createPublicClient({
            chain: base,
            transport: http()
        }) as unknown as PublicClient;
    }

    /**
     * Initialize the Server Wallet v2
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Get or create the EOA account for x402 facilitator role
            // This is idempotent - calling multiple times with the same name returns the same account
            const eoaAccount = await this.cdpClient.evm.getOrCreateAccount({
                name: 'x402-server-wallet'
            });

            this.serverWallet = {
                id: eoaAccount.address, // Use address as the unique identifier
                addressId: eoaAccount.address
            };

            this.initialized = true;

            console.log('CDP Server Wallet v2 initialized for x402 facilitator:', {
                accountId: this.serverWallet.id,
                address: this.serverWallet.addressId,
                network: 'Base Mainnet',
                protocol: 'EIP-8004 x402'
            });

        } catch (error) {
            console.error('Failed to initialize CDP Server Wallet:', error);
            throw new Error('CDP Server Wallet initialization failed');
        }
    }

    /**
     * Get token information
     */
    async getTokenInfo() {
        await this.initialize();

        try {
            // Use readContract with public client for Base network
            const [name, symbol, decimals, totalSupply] = await Promise.all([
                readContract(this.publicClient, {
                    address: VOT_TOKEN_ADDRESS,
                    abi: VOT_TOKEN_ABI,
                    functionName: 'name',
                }),
                readContract(this.publicClient, {
                    address: VOT_TOKEN_ADDRESS,
                    abi: VOT_TOKEN_ABI,
                    functionName: 'symbol',
                }),
                readContract(this.publicClient, {
                    address: VOT_TOKEN_ADDRESS,
                    abi: VOT_TOKEN_ABI,
                    functionName: 'decimals',
                }),
                readContract(this.publicClient, {
                    address: VOT_TOKEN_ADDRESS,
                    abi: VOT_TOKEN_ABI,
                    functionName: 'totalSupply',
                }),
            ]);

            return {
                address: VOT_TOKEN_ADDRESS,
                name: name as string,
                symbol: symbol as string,
                decimals: Number(decimals),
                totalSupply: (totalSupply as bigint).toString()
            };
        } catch (error) {
            console.error('Failed to get token info:', error);
            throw error;
        }
    }

    /**
     * Get balance for an address
     */
    async getBalance(address: string): Promise<string> {
        await this.initialize();

        try {
            const balance = await readContract(this.publicClient, {
                address: VOT_TOKEN_ADDRESS,
                abi: VOT_TOKEN_ABI,
                functionName: 'balanceOf',
                args: [address],
            });

            return (balance as bigint).toString();
        } catch (error) {
            console.error('Failed to get balance:', error);
            throw error;
        }
    }

    /**
     * Get formatted balance (human readable)
     */
    async getFormattedBalance(address: string): Promise<string> {
        const [balance, decimals] = await Promise.all([
            this.getBalance(address),
            this.getTokenInfo().then(info => info.decimals)
        ]);

        return ethers.formatUnits(balance, decimals);
    }

    /**
     * Get burn statistics
     */
    async getBurnStats() {
        await this.initialize();

        try {
            const result = await readContract(this.publicClient, {
                address: VOT_TOKEN_ADDRESS,
                abi: VOT_TOKEN_ABI,
                functionName: 'getBurnStats',
            }) as readonly [bigint, bigint, bigint];

            return {
                totalBurned: result[0].toString(),
                burnRate: result[1].toString(),
                circulatingSupply: result[2].toString()
            };
        } catch (error) {
            console.error('Failed to get burn stats:', error);
            throw error;
        }
    }

    /**
     * Settle x402 payment using CDP Server Wallet v2 (EIP-8004 facilitator)
     */
    async settleX402Payment(
        to: string,
        amount: string,
        memo: string,
        nonce: string
    ) {
        await this.initialize();

        try {
            // Get token decimals
            const decimals = await this.getTokenInfo().then(info => info.decimals);
            const amountWei = ethers.parseUnits(amount, decimals);

            // Create contract instance for encoding the transaction
            const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
            const contract = new ethers.Contract(VOT_TOKEN_ADDRESS, VOT_TOKEN_ABI, provider);

            // Encode the microPayment function call
            const settlementMemo = `${memo} | x402 Settlement | Nonce: ${nonce} | EIP-8004`;
            const data = contract.interface.encodeFunctionData('microPayment', [
                to,
                amountWei,
                settlementMemo
            ]);

            // Create transaction object for CDP SDK
            const transaction = {
                to: VOT_TOKEN_ADDRESS as `0x${string}`,
                data: data as `0x${string}`,
                value: BigInt(0) // No ETH value, just token transfer
            };

            // Send transaction using CDP Server Wallet v2
            const txResult = await this.cdpClient.evm.sendTransaction({
                address: this.serverWallet!.addressId as `0x${string}`,
                transaction: transaction,
                network: 'base'
            });

            return {
                txHash: txResult.transactionHash,
                blockNumber: null, // CDP SDK doesn't return block number immediately
                gasUsed: null, // CDP SDK doesn't return gas used immediately
                amount: amount,
                amountWei: amountWei.toString(),
                to,
                memo: settlementMemo,
                nonce,
                facilitatorAddress: this.serverWallet!.addressId,
                protocol: 'EIP-8004 x402',
                walletId: this.serverWallet!.id
            };

        } catch (error) {
            console.error('x402 settlement failed:', error);
            throw new Error(`EIP-8004 x402 settlement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Check if wallet has sufficient balance
     */
    async hasSufficientBalance(requiredAmount: string): Promise<boolean> {
        await this.initialize();

        try {
            const balance = await this.getFormattedBalance(this.serverWallet!.addressId);
            return parseFloat(balance) >= parseFloat(requiredAmount);

        } catch (error) {
            console.error('Failed to check balance:', error);
            return false;
        }
    }

    /**
     * Get facilitator address (Server Wallet address)
     */
    async getFacilitatorAddress(): Promise<string> {
        await this.initialize();

        return this.serverWallet!.addressId;
    }

    /**
     * Get wallet information
     */
    async getWalletInfo() {
        await this.initialize();

        return {
            walletId: this.serverWallet!.id,
            networkId: 'base-mainnet',
            address: this.serverWallet!.addressId,
            type: 'CDP Server Wallet v2'
        };
    }
}

// Legacy ethers-based service for backward compatibility
export class VOTTokenService {
    private contract: ethers.Contract;
    private provider: ethers.Provider;
    private signer?: ethers.Signer;

    constructor(
        providerUrl: string = 'https://mainnet.base.org',
        privateKey?: string
    ) {
        this.provider = new ethers.JsonRpcProvider(providerUrl);

        if (privateKey) {
            this.signer = new ethers.Wallet(privateKey, this.provider);
            this.contract = new ethers.Contract(VOT_TOKEN_ADDRESS, VOT_TOKEN_ABI, this.signer);
        } else {
            this.contract = new ethers.Contract(VOT_TOKEN_ADDRESS, VOT_TOKEN_ABI, this.provider);
        }
    }

    async getTokenInfo() {
        const [name, symbol, decimals, totalSupply] = await Promise.all([
            this.contract.name(),
            this.contract.symbol(),
            this.contract.decimals(),
            this.contract.totalSupply()
        ]);

        return {
            address: VOT_TOKEN_ADDRESS,
            name,
            symbol,
            decimals,
            totalSupply: totalSupply.toString()
        };
    }

    async getBalance(address: string): Promise<string> {
        const balance = await this.contract.balanceOf(address);
        return balance.toString();
    }

    async getFormattedBalance(address: string): Promise<string> {
        const [balance, decimals] = await Promise.all([
            this.contract.balanceOf(address),
            this.contract.decimals()
        ]);

        return ethers.formatUnits(balance, decimals);
    }

    async getBurnStats() {
        const [totalBurned, burnRate, circulatingSupply] = await this.contract.getBurnStats();

        return {
            totalBurned: totalBurned.toString(),
            burnRate: burnRate.toString(),
            circulatingSupply: circulatingSupply.toString()
        };
    }

    async microPayment(
        to: string,
        amount: string,
        memo: string = 'x402 API Payment'
    ) {
        if (!this.signer) {
            throw new Error('Signer required for payments');
        }

        const decimals = await this.contract.decimals();
        const amountWei = ethers.parseUnits(amount, decimals);

        const tx = await this.contract.microPayment(to, amountWei, memo);
        const receipt = await tx.wait();

        return {
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            amount: amount,
            amountWei: amountWei.toString(),
            to,
            memo
        };
    }

    async hasSufficientBalance(address: string, requiredAmount: string): Promise<boolean> {
        const balance = await this.getFormattedBalance(address);
        return parseFloat(balance) >= parseFloat(requiredAmount);
    }

    async amountToWei(amount: string): Promise<bigint> {
        const decimals = await this.contract.decimals();
        return ethers.parseUnits(amount, decimals);
    }

    async getFacilitatorAddress(): Promise<string> {
        if (!this.signer) {
            throw new Error('Signer required to get facilitator address');
        }
        return await this.signer.getAddress();
    }
}

// CDP-based service (new default)
let cdpVotService: CDPVOTTokenService | null = null;

export function getVOTTokenService(): CDPVOTTokenService {
    if (!cdpVotService) {
        cdpVotService = new CDPVOTTokenService();
    }
    return cdpVotService;
}

// Legacy service for backward compatibility
export function createVOTPaymentService(privateKey?: string): VOTTokenService {
    return new VOTTokenService('https://mainnet.base.org', privateKey);
}

// CDP-based payment service
export function createCDPVOTPaymentService(): CDPVOTTokenService {
    return getVOTTokenService();
}
