/**
 * ENS Content Hash Management for MCPVOT App
 * Handles IPFS content publishing and ENS record updates
 */

import { ethers } from 'ethers';
import { getMainnetProvider } from './provider';

interface ContentMetadata {
    name: string;
    description: string;
    version: string;
    timestamp: string;
    contentHash: string;
    ipfsHash: string;
    backupGateways: string[];
    checksums: {
        sha256: string;
        md5: string;
    };
}

interface PublishingResult {
    success: boolean;
    ipfsHash?: string;
    ensTxHash?: string;
    metadata?: ContentMetadata;
    error?: string;
}

class ENSContentManager {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private ipfsNodeUrl: string;
    private ipfsApiKey?: string;

    constructor() {
        this.provider = getMainnetProvider();
        // Only initialize wallet if private key is available (not during build)
        if (process.env.OWNER_PRIVATE_KEY && process.env.OWNER_PRIVATE_KEY !== '[ REDACTED ]') {
            this.wallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, this.provider);
        } else {
            // Create a dummy wallet for build time
            this.wallet = ethers.Wallet.createRandom().connect(this.provider);
        }
        this.ipfsNodeUrl = process.env.NEXT_PUBLIC_IPFS_NODE_URL || 'http://localhost:5001';
        this.ipfsApiKey = process.env.IPFS_API_KEY;
    }

    /**
     * Publish content to IPFS with security measures
     */
    async publishToIPFS(content: string | Buffer | object, options: {
        pin?: boolean;
        metadata?: Partial<ContentMetadata>;
        encryption?: boolean;
    } = {}): Promise<{ hash: string; size: number }> {
        try {
            // Prepare content
            let contentData: string;
            if (typeof content === 'object') {
                contentData = JSON.stringify(content, null, 2);
            } else if (Buffer.isBuffer(content)) {
                contentData = content.toString('utf8');
            } else {
                contentData = content;
            }

            // Calculate checksums for integrity
            const crypto = await import('crypto');
            const sha256 = crypto.createHash('sha256').update(contentData).digest('hex');
            const md5 = crypto.createHash('md5').update(contentData).digest('hex');

            // Prepare metadata
            const metadata: ContentMetadata = {
                name: options.metadata?.name || 'MCPVOT App Content',
                description: options.metadata?.description || 'MCPVOT decentralized application content',
                version: options.metadata?.version || '1.0.0',
                timestamp: new Date().toISOString(),
                contentHash: sha256,
                ipfsHash: '',
                backupGateways: [
                    'https://ipfs.io',
                    'https://cloudflare-ipfs.com',
                    'https://gateway.pinata.cloud'
                ],
                checksums: { sha256, md5 }
            };

            // Add metadata to content
            const finalContent = JSON.stringify({
                content: contentData,
                metadata
            });

            // Publish to IPFS
            const formData = new FormData();
            const blob = new Blob([finalContent], { type: 'application/json' });
            formData.append('file', blob, 'mcpvot-content.json');

            const response = await fetch(`${this.ipfsNodeUrl}/api/v0/add?pin=${options.pin || true}`, {
                method: 'POST',
                headers: {
                    ...(this.ipfsApiKey && { 'Authorization': `Bearer ${this.ipfsApiKey}` })
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`IPFS upload failed: ${response.statusText}`);
            }

            const result = await response.json();
            const ipfsHash = result.Hash;

            // Update metadata with IPFS hash
            metadata.ipfsHash = ipfsHash;

            // Store metadata for verification
            await this.storeContentMetadata(ipfsHash, metadata);

            return {
                hash: ipfsHash,
                size: result.Size
            };
        } catch (error) {
            console.error('[ENS Content] IPFS publishing failed:', error);
            throw new Error(`IPFS publishing failed: ${error.message}`);
        }
    }

    /**
     * Set ENS content hash for your domain
     */
    async setENSContentHash(domain: string, ipfsHash: string): Promise<string> {
        try {
            // Get ENS resolver
            const ensRegistryAddress = process.env.NEXT_PUBLIC_ENS_REGISTRY_ADDRESS!;
            const ensRegistry = new ethers.Contract(
                ensRegistryAddress,
                ['function resolver(bytes32 node) view returns (address)', 'function setResolver(bytes32 node, address resolver) external returns (bool)'],
                this.wallet
            );

            // Get domain node
            const namehash = this.ensNamehash(domain);
            
            // Get resolver
            const resolverAddress = await ensRegistry.resolver(namehash);
            if (!resolverAddress || resolverAddress === ethers.ZeroAddress) {
                throw new Error('No resolver found for domain');
            }

            // Set content hash using resolver
            const resolver = new ethers.Contract(
                resolverAddress,
                [
                    'function setContenthash(bytes32 node, bytes contenthash) external',
                    'function contenthash(bytes32 node) view returns (bytes)'
                ],
                this.wallet
            );

            // Format IPFS hash for ENS
            const contentHash = await this.formatIPFSHashForENS(ipfsHash);

            // Set content hash
            const tx = await resolver.setContenthash(namehash, contentHash);
            await tx.wait();

            console.log(`[ENS Content] Successfully set content hash for ${domain}: ${ipfsHash}`);
            return tx.hash;
        } catch (error) {
            console.error('[ENS Content] Failed to set ENS content hash:', error);
            throw error;
        }
    }

    /**
     * Publish app content and update ENS record
     */
    async publishAppContent(options: {
        content?: string | object;
        filePath?: string;
        pinToIPFS?: boolean;
        updateENS?: boolean;
        domain?: string;
    } = {}): Promise<PublishingResult> {
        try {
            console.log('[ENS Content] Starting app content publishing...');

            // Get latest app build or content
            let content: string | object;
            if (options.filePath) {
                // Read from file
                const fs = await import('fs/promises');
                const fileContent = await fs.readFile(options.filePath, 'utf8');
                content = fileContent;
            } else if (options.content) {
                content = options.content;
            } else {
                // Generate dynamic content
                content = await this.generateAppContent();
            }

            // Publish to IPFS
            const ipfsResult = await this.publishToIPFS(content, {
                pin: options.pinToIPFS ?? true,
                metadata: {
                    name: 'MCPVOT App',
                    description: 'MCPVOT decentralized trading application',
                    version: process.env.npm_package_version || '1.0.0'
                }
            });

            console.log(`[ENS Content] Content published to IPFS: ${ipfsResult.hash}`);

            let ensTxHash: string | undefined;
            
            // Update ENS record if requested
            if (options.updateENS !== false) {
                const domain = options.domain || process.env.NEXT_PUBLIC_ENS_DOMAIN || 'mcpvot.eth';
                ensTxHash = await this.setENSContentHash(domain, ipfsResult.hash);
                console.log(`[ENS Content] ENS record updated: ${ensTxHash}`);
            }

            // Get stored metadata
            const metadata = await this.getContentMetadata(ipfsResult.hash);

            return {
                success: true,
                ipfsHash: ipfsResult.hash,
                ensTxHash,
                metadata
            };
        } catch (error) {
            console.error('[ENS Content] Publishing failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Verify content integrity
     */
    async verifyContent(ipfsHash: string, expectedChecksum?: string): Promise<boolean> {
        try {
            // Retrieve content from IPFS
            const response = await fetch(`${process.env.NEXT_PUBLIC_IPFS_GATEWAY}/ipfs/${ipfsHash}`);
            if (!response.ok) {
                throw new Error('Failed to retrieve content from IPFS');
            }

            const contentData = await response.json();
            const actualContent = contentData.content;
            const metadata = contentData.metadata;

            // Verify checksums
            if (expectedChecksum) {
                const crypto = await import('crypto');
                const actualChecksum = crypto.createHash('sha256').update(actualContent).digest('hex');
                if (actualChecksum !== expectedChecksum) {
                    throw new Error('Content checksum mismatch');
                }
            }

            // Verify metadata integrity
            if (metadata.ipfsHash !== ipfsHash) {
                throw new Error('IPFS hash mismatch in metadata');
            }

            console.log('[ENS Content] Content verification successful');
            return true;
        } catch (error) {
            console.error('[ENS Content] Content verification failed:', error);
            return false;
        }
    }

    /**
     * Get current ENS content hash
     */
    async getCurrentENSContentHash(domain: string): Promise<string | null> {
        try {
            const ensRegistryAddress = process.env.NEXT_PUBLIC_ENS_REGISTRY_ADDRESS!;
            const ensRegistry = new ethers.Contract(
                ensRegistryAddress,
                ['function resolver(bytes32 node) view returns (address)'],
                this.provider
            );

            const namehash = this.ensNamehash(domain);
            const resolverAddress = await ensRegistry.resolver(namehash);
            
            if (!resolverAddress || resolverAddress === ethers.ZeroAddress) {
                return null;
            }

            const resolver = new ethers.Contract(
                resolverAddress,
                ['function contenthash(bytes32 node) view returns (bytes)'],
                this.provider
            );

            const contentHash = await resolver.contenthash(namehash);
            return contentHash ? await this.parseContentHash(contentHash) : null;
        } catch (error) {
            console.error('[ENS Content] Failed to get ENS content hash:', error);
            return null;
        }
    }

    // Helper methods
    private ensNamehash(name: string): string {
        return ethers.namehash(name);
    }

    private async formatIPFSHashForENS(ipfsHash: string): Promise<string> {
        // Convert IPFS hash to ENS content hash format
        const multihash = await this.base58To0x(ipfsHash);
        return '0x' + multihash;
    }

    private async parseContentHash(contentHash: string): Promise<string> {
        // Parse ENS content hash back to IPFS hash
        const multihash = contentHash.slice(2);
        return await this.base58Encode(multihash);
    }

    private async base58To0x(base58: string): Promise<string> {
        // Convert base58 IPFS hash to hex
        const bs58 = await import('bs58');
        return Buffer.from(bs58.default.decode(base58)).toString('hex');
    }

    private async base58Encode(hex: string): Promise<string> {
        // Convert hex to base58 IPFS hash
        const bs58 = await import('bs58');
        return bs58.default.encode(Buffer.from(hex, 'hex'));
    }

    private async storeContentMetadata(hash: string, metadata: ContentMetadata): Promise<void> {
        // Store metadata locally for verification
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const metadataDir = path.join(process.cwd(), '.ens-metadata');
        await fs.mkdir(metadataDir, { recursive: true });
        
        const metadataFile = path.join(metadataDir, `${hash}.json`);
        await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
    }

    private async getContentMetadata(hash: string): Promise<ContentMetadata | null> {
        try {
            const fs = await import('fs/promises');
            const path = await import('path');
            
            const metadataFile = path.join(process.cwd(), '.ens-metadata', `${hash}.json`);
            const metadataContent = await fs.readFile(metadataFile, 'utf8');
            return JSON.parse(metadataContent);
        } catch {
            return null;
        }
    }

    private async generateAppContent(): Promise<object> {
        // Generate dynamic app content
        return {
            name: 'MCPVOT',
            description: 'Decentralized AI-powered trading platform',
            version: process.env.npm_package_version || '1.0.0',
            urls: {
                main: 'https://mcpvot.xyz',
                eth: 'https://mcpvot.eth.link',
                ipfs: ''
            },
            features: [
                'AI-powered trading signals',
                'Real-time analytics',
                'Farcaster integration',
                'ENS name resolution',
                'x402 intelligence'
            ],
            lastUpdated: new Date().toISOString()
        };
    }
}

// Export singleton instance
export const ensContentManager = new ENSContentManager();

// CLI interface for easy use
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];

    async function runCLI() {
        const manager = new ENSContentManager();

        try {
            switch (command) {
                case 'publish':
                    const result = await manager.publishAppContent({
                        updateENS: true,
                        pinToIPFS: true
                    });
                    console.log('Publishing result:', result);
                    break;
                    
                case 'verify':
                    const hash = args[1];
                    const isValid = await manager.verifyContent(hash);
                    console.log(`Content verification: ${isValid ? 'PASSED' : 'FAILED'}`);
                    break;
                    
                case 'status':
                    const currentHash = await manager.getCurrentENSContentHash('mcpvot.eth');
                    console.log(`Current ENS content hash: ${currentHash || 'None'}`);
                    break;
                    
                default:
                    console.log('Available commands: publish, verify, status');
            }
        } catch (error) {
            console.error('CLI error:', error);
            process.exit(1);
        }
    }

    runCLI();
}