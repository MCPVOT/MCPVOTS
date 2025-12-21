import { mcp_maxx_memory_store_memory } from '@/lib/mcp-memory-client';

interface PaymentRecord {
    id: string;
    timestamp: Date;
    amount: number;
    tokenAmount: number;
    reason: string;
    signals: Array<{
        type: string;
        strength: number;
        reason: string;
    }>;
    confidence: number;
    transactionHash?: string;
    status: 'pending' | 'completed' | 'failed';
}

export class PaymentMemoryService {
    private static instance: PaymentMemoryService;

    static getInstance(): PaymentMemoryService {
        if (!PaymentMemoryService.instance) {
            PaymentMemoryService.instance = new PaymentMemoryService();
        }
        return PaymentMemoryService.instance;
    }

    async storePaymentRecord(record: Omit<PaymentRecord, 'id'>): Promise<string> {
        const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const fullRecord: PaymentRecord = {
            id: paymentId,
            ...record
        };

        try {
            // Convert to vector embedding (simplified - in production use proper embedding)
            const content = JSON.stringify({
                type: 'vot_payment',
                id: paymentId,
                amount: record.amount,
                confidence: record.confidence,
                signals: record.signals.length,
                timestamp: record.timestamp.toISOString(),
                reason: record.reason
            });

            // Create a simple vector based on payment characteristics
            const vector = this.createPaymentVector(fullRecord);

            await mcp_maxx_memory_store_memory({
                content,
                vector,
                category: 'payments',
                metadata: {
                    paymentId,
                    amount: record.amount,
                    confidence: record.confidence,
                    signalCount: record.signals.length,
                    timestamp: record.timestamp.toISOString()
                }
            });

            console.log(`Stored payment record: ${paymentId}`);
            return paymentId;

        } catch (error) {
            console.error('Failed to store payment record:', error);
            throw error;
        }
    }

    async getPaymentHistory(limit: number = 50): Promise<PaymentRecord[]> {
        try {
            // This would require a search function - for now return empty array
            // In production, implement search by category and date range
            console.log(`Retrieving payment history, limit: ${limit}`);
            return [];
        } catch (error) {
            console.error('Failed to retrieve payment history:', error);
            return [];
        }
    }

    async updatePaymentStatus(paymentId: string, status: PaymentRecord['status'], transactionHash?: string): Promise<void> {
        try {
            const updateRecord = {
                id: paymentId,
                status,
                transactionHash,
                updatedAt: new Date().toISOString()
            };

            const content = JSON.stringify({
                type: 'payment_update',
                paymentId,
                status,
                transactionHash
            });

            const vector = this.createUpdateVector(updateRecord);

            await mcp_maxx_memory_store_memory({
                content,
                vector,
                category: 'payment_updates',
                metadata: updateRecord
            });

            console.log(`Updated payment status: ${paymentId} -> ${status}`);

        } catch (error) {
            console.error('Failed to update payment status:', error);
            throw error;
        }
    }

    private createPaymentVector(record: PaymentRecord): number[] {
        // Create a 128-dimensional vector based on payment characteristics
        const vector = new Array(128).fill(0);

        // Amount-based features (first 32 dimensions)
        const amountNormalized = Math.min(record.amount / 100, 1); // Max $100 for scaling
        for (let i = 0; i < 32; i++) {
            vector[i] = amountNormalized * Math.sin(i * 0.1) + Math.random() * 0.1;
        }

        // Confidence-based features (next 32 dimensions)
        for (let i = 32; i < 64; i++) {
            vector[i] = record.confidence * Math.cos((i - 32) * 0.1) + Math.random() * 0.1;
        }

        // Signal count features (next 32 dimensions)
        const signalNormalized = Math.min(record.signals.length / 10, 1); // Max 10 signals
        for (let i = 64; i < 96; i++) {
            vector[i] = signalNormalized * Math.sin((i - 64) * 0.15) + Math.random() * 0.1;
        }

        // Time-based features (last 32 dimensions)
        const hourOfDay = record.timestamp.getHours() / 24;
        const dayOfWeek = record.timestamp.getDay() / 7;
        for (let i = 96; i < 128; i++) {
            if (i < 112) {
                vector[i] = hourOfDay * Math.sin((i - 96) * 0.2) + Math.random() * 0.1;
            } else {
                vector[i] = dayOfWeek * Math.cos((i - 112) * 0.2) + Math.random() * 0.1;
            }
        }

        return vector;
    }

    private createUpdateVector(update: { id: string; status: string; transactionHash?: string; updatedAt: string }): number[] {
        // Simpler vector for updates
        const vector = new Array(64).fill(0);

        // Status encoding (first 16 dimensions)
        const statusValue = update.status === 'completed' ? 1 : update.status === 'pending' ? 0.5 : 0;
        for (let i = 0; i < 16; i++) {
            vector[i] = statusValue + Math.random() * 0.2;
        }

        // Time-based features (remaining dimensions)
        const now = new Date();
        const hourOfDay = now.getHours() / 24;
        for (let i = 16; i < 64; i++) {
            vector[i] = hourOfDay * Math.sin((i - 16) * 0.1) + Math.random() * 0.1;
        }

        return vector;
    }
}
