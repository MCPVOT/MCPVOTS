interface IPFSContent {
    cid: string;
    type: 'signal' | 'receipt' | 'analytics';
    data: unknown;
    timestamp: Date;
    metadata: Record<string, unknown>;
}

export class IPFSWorker {
    private gatewayUrl: string;
    private pinataJwt: string | undefined;
    private pinataGateway: string;

    constructor(ipfsUrl?: string) {
        // Use Pinata gateway for browser compatibility
        this.gatewayUrl = ipfsUrl || process.env.IPFS_URL || 'https://gateway.pinata.cloud/ipfs';
        this.pinataJwt = process.env.PINATA_JWT;
        this.pinataGateway = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';
    }

    async pinContent(content: unknown, type: IPFSContent['type'], metadata: Record<string, unknown> = {}): Promise<string> {
        // Real Pinata integration
        if (!this.pinataJwt) {
            throw new Error('PINATA_JWT environment variable not configured');
        }

        const blob = new Blob([JSON.stringify({
            type,
            data: content,
            timestamp: new Date().toISOString(),
            metadata
        })], { type: 'application/json' });

        const formData = new FormData();
        formData.append('file', blob, `${type}-${Date.now()}.json`);
        formData.append('pinataMetadata', JSON.stringify({
            name: `MCPVOT-${type}-${Date.now()}`,
            keyvalues: {
                type,
                ...metadata
            }
        }));

        const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.pinataJwt}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Pinata upload failed: ${error}`);
        }

        const result = await response.json();
        console.log(`Pinned ${type} content to IPFS: ${result.IpfsHash}`, { metadata });
        return result.IpfsHash;
    }

    async getContent(cid: string): Promise<IPFSContent | null> {
        try {
            // Use Pinata gateway to fetch content
            const response = await fetch(`${this.pinataGateway}/${cid}`);

            if (!response.ok) {
                console.warn(`Failed to fetch from IPFS gateway: ${response.status}`);
                return null;
            }

            const data = await response.json();
            return {
                cid,
                type: data.type,
                data: data.data,
                timestamp: new Date(data.timestamp),
                metadata: data.metadata || {},
            };
        } catch (error) {
            console.error('Error retrieving content from IPFS:', error);
            return null;
        }
    }

    async pinAnalyticsBatch(signals: unknown[], type: 'farcaster' | 'onchain'): Promise<string> {
        const analyticsData = {
            type: 'analytics',
            source: type,
            signals,
            summary: this.generateSummary(signals, type),
            generatedAt: new Date().toISOString(),
        };

        return this.pinContent(analyticsData, 'signal', {
            source: type,
            signalCount: signals.length,
            timeRange: '24h',
        });
    }

    async pinPaymentReceipt(receipt: {
        agentAddress: string;
        paymentTx: string;
        votAmount: string;
        dataAccess: string[];
        expiresAt: string;
    }): Promise<string> {
        return this.pinContent(receipt, 'receipt', {
            agent: receipt.agentAddress,
            paymentTx: receipt.paymentTx,
            accessType: 'warplet-analytics',
        });
    }

    private generateSummary(signals: unknown[], type: 'farcaster' | 'onchain') {
        return {
            totalSignals: signals.length,
            type,
            generatedAt: new Date().toISOString(),
        };
    }

    async listPinnedContent(): Promise<string[]> {
        if (!this.pinataJwt) {
            throw new Error('PINATA_JWT environment variable not configured');
        }

        const response = await fetch('https://api.pinata.cloud/data/pinList?status=pinned', {
            headers: {
                'Authorization': `Bearer ${this.pinataJwt}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to list pins: ${response.statusText}`);
        }

        const result = await response.json();
        return result.rows.map((pin: { ipfs_pin_hash: string }) => pin.ipfs_pin_hash);
    }

    async unpinContent(cid: string): Promise<void> {
        if (!this.pinataJwt) {
            throw new Error('PINATA_JWT environment variable not configured');
        }

        const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.pinataJwt}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to unpin: ${response.statusText}`);
        }

        console.log(`Unpinned content: ${cid}`);
    }
}
