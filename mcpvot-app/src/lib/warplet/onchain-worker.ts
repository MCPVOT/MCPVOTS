import { createPublicClient, decodeEventLog, http, Log, Transaction as ViemTransaction } from 'viem';
import { base } from 'viem/chains';
import { VOT_TOKEN_ABI } from '../contracts/vot-token';

interface OnChainSignal {
    txHash: string;
    blockNumber: number;
    timestamp: Date;
    type: 'swap' | 'liquidity' | 'mint' | 'burn' | 'transfer';
    tokenAddress: string;
    amount: bigint;
    value: bigint;
    sender: string;
    receiver?: string;
    contract: string;
    significance: 'high' | 'medium' | 'low';
}

export class OnChainWorker {
    private client = createPublicClient({
        chain: base,
        transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
    });

    private signals: OnChainSignal[] = [];

    async collectSignals(hoursBack: number = 24): Promise<OnChainSignal[]> {
        try {
            const latestBlock = await this.client.getBlockNumber();
            const blocksBack = BigInt(Math.floor(hoursBack * 3600 / 2)); // ~2s per block
            const fromBlock = latestBlock - blocksBack;

            // Monitor key contracts (VOT token, Uniswap pools, etc.)
            const contracts = [
                '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07', // VOT token
                '0x33128a8fC17869897dcE68Ed026d694621f6F19bb', // Uniswap V3 Factory on Base
                // Add more contracts as needed
            ];

            const allSignals: OnChainSignal[] = [];

            for (const contract of contracts) {
                const logs = await this.client.getLogs({
                    address: contract as `0x${string}`,
                    fromBlock,
                    toBlock: latestBlock,
                    events: [
                        // ERC20 Transfer
                        {
                            type: 'event',
                            name: 'Transfer',
                            inputs: [
                                { type: 'address', name: 'from', indexed: true },
                                { type: 'address', name: 'to', indexed: true },
                                { type: 'uint256', name: 'value', indexed: false },
                            ],
                        },
                        // Add more events as needed
                    ],
                });

                for (const log of logs) {
                    const block = await this.client.getBlock({ blockNumber: log.blockNumber });
                    const tx = await this.client.getTransaction({ hash: log.transactionHash }) as ViemTransaction;

                    const signal: OnChainSignal = {
                        txHash: log.transactionHash,
                        blockNumber: Number(log.blockNumber),
                        timestamp: new Date(Number(block.timestamp) * 1000),
                        type: this.classifyTransaction(log),
                        tokenAddress: contract,
                        amount: this.extractAmount(log),
                        value: tx.value,
                        sender: this.extractSender(log),
                        receiver: this.extractReceiver(log),
                        contract,
                        significance: this.assessSignificance(log, tx),
                    };

                    allSignals.push(signal);
                }
            }

            // Sort by significance and recency
            allSignals.sort((a, b) => {
                const sigOrder = { high: 3, medium: 2, low: 1 };
                const sigDiff = sigOrder[b.significance] - sigOrder[a.significance];
                if (sigDiff !== 0) return sigDiff;
                return b.timestamp.getTime() - a.timestamp.getTime();
            });

            this.signals = allSignals.slice(0, 200); // Keep top 200
            return this.signals;
        } catch (error) {
            console.error('Error collecting on-chain signals:', error);
            return [];
        }
    }

    private classifyTransaction(log: Log): OnChainSignal['type'] {
        try {
            const decodedLog = decodeEventLog({
                abi: VOT_TOKEN_ABI,
                data: log.data,
                topics: log.topics,
            });

            if (decodedLog.eventName === 'Transfer') {
                const args = decodedLog.args as { from?: string; to?: string; };
                if (args.from === '0x0000000000000000000000000000000000000000') return 'mint';
                if (args.to === '0x0000000000000000000000000000000000000000') return 'burn';
                return 'transfer';
            }
            if (decodedLog.eventName === 'Swap') {
                return 'swap';
            }
        } catch {
            // Ignore decoding errors for now
        }
        return 'transfer';
    }

    private extractAmount(log: Log): bigint {
        // Extract amount from event data (simplified)
        try {
            const decodedLog = decodeEventLog({
                abi: VOT_TOKEN_ABI,
                data: log.data,
                topics: log.topics,
            });
            const args = decodedLog.args as { value?: bigint };
            return args.value || BigInt(0);
        } catch {
            return BigInt(0);
        }
    }

    private extractSender(log: Log): string {
        return log.topics[1] || '0x0000000000000000000000000000000000000000';
    }

    private extractReceiver(log: Log): string | undefined {
        return log.topics[2];
    }

    private assessSignificance(log: Log, tx: ViemTransaction): 'high' | 'medium' | 'low' {
        const value = Number(tx.value || BigInt(0));
        const amount = Number(this.extractAmount(log) || BigInt(0));

        if (value > 1000000000000000000 || amount > 1000000000000000000000) { // >1 ETH or >1000 tokens
            return 'high';
        }
        if (value > 100000000000000000 || amount > 100000000000000000) { // >0.1 ETH or >100 tokens
            return 'medium';
        }
        return 'low';
    }

    getSignals(): OnChainSignal[] {
        return this.signals;
    }

    getActivitySummary() {
        const summary: Record<string, number> = {
            swaps: 0,
            transfers: 0,
            mints: 0,
            burns: 0,
            liquidity: 0,
            total: this.signals.length,
            highSignificance: 0,
        };

        for (const signal of this.signals) {
            const key = signal.type + 's';
            summary[key] = (summary[key] || 0) + 1;
            if (signal.significance === 'high') summary.highSignificance++;
        }

        return summary;
    }
}
