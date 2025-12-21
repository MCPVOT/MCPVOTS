/**
 * X402 Agent Identity Integration (ERC-8004)
 * Bootstrap agent identities for x402 protocol
 * Based on: https://github.com/coinbase/x402
 */

import { createPublicClient, http, type Address } from 'viem';
import { base } from 'viem/chains';

export interface AgentIdentityConfig {
    domain: string;
    autoRegister: boolean;
    registries?: {
        identity?: Address;
        reputation?: Address;
        validation?: Address;
    };
}

export interface AgentIdentity {
    address: Address;
    fid?: number; // Farcaster ID if registered
    domain: string;
    registries: {
        identity: boolean;
        reputation: boolean;
        validation: boolean;
    };
    x402AccessLevel: number;
    nftTokenIds: number[];
}

/**
 * ERC-8004 Identity Registry ABI (simplified)
 * Stored for future contract integration
 */
/* const IDENTITY_REGISTRY_ABI = [
    {
        inputs: [
            { name: 'domain', type: 'string' },
            { name: 'autoRegister', type: 'bool' }
        ],
        name: 'createAgentIdentity',
        outputs: [{ name: 'identityId', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [{ name: 'agent', type: 'address' }],
        name: 'getIdentity',
        outputs: [
            { name: 'domain', type: 'string' },
            { name: 'registered', type: 'bool' },
            { name: 'accessLevel', type: 'uint256' }
        ],
        stateMutability: 'view',
        type: 'function'
    }
] as const; */

/**
 * Farcaster ID Registry on Base
 */
const FARCASTER_ID_REGISTRY_ADDRESS = '0x00000000Fc6c5F01Fc30151999387Bb99A9f489b' as Address;
const FARCASTER_ID_REGISTRY_ABI = [
    {
        inputs: [{ name: 'owner', type: 'address' }],
        name: 'idOf',
        outputs: [{ name: 'fid', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [{ name: 'fid', type: 'uint256' }],
        name: 'custodyOf',
        outputs: [{ name: 'custody', type: 'address' }],
        stateMutability: 'view',
        type: 'function'
    }
] as const;

export class X402AgentIdentityManager {
    private publicClient;
    private identityRegistryAddress?: Address;

    constructor(rpcUrl?: string, identityRegistry?: Address) {
        this.publicClient = createPublicClient({
            chain: base,
            transport: http(rpcUrl || 'https://mainnet.base.org')
        });
        this.identityRegistryAddress = identityRegistry;
    }

    /**
     * Bootstrap ERC-8004 identity for agent
     * Runs once at startup as shown in your image
     */
    async createAgentIdentity(config: AgentIdentityConfig): Promise<{ identityId: bigint }> {
        if (!this.identityRegistryAddress) {
            throw new Error('Identity registry not configured');
        }

        // This would be called with wallet client in production
        console.log('Bootstrap ERC-8004 identity:', {
            domain: config.domain || process.env.AGENT_DOMAIN || 'agent.example.com',
            autoRegister: config.autoRegister
        });

        // Simulate identity creation
        return { identityId: BigInt(Date.now()) };
    }

    /**
     * Get Farcaster FID for address
     */
    async getFarcasterFID(address: Address): Promise<number | null> {
        try {
            const fid = await this.publicClient.readContract({
                address: FARCASTER_ID_REGISTRY_ADDRESS,
                abi: FARCASTER_ID_REGISTRY_ABI,
                functionName: 'idOf',
                args: [address]
            });

            return fid > BigInt(0) ? Number(fid) : null;
        } catch (error) {
            console.error('Failed to get FID:', error);
            return null;
        }
    }

    /**
     * Get address for Farcaster FID
     */
    async getFarcasterCustodyAddress(fid: number): Promise<Address | null> {
        try {
            const custody = await this.publicClient.readContract({
                address: FARCASTER_ID_REGISTRY_ADDRESS,
                abi: FARCASTER_ID_REGISTRY_ABI,
                functionName: 'custodyOf',
                args: [BigInt(fid)]
            });

            return custody !== '0x0000000000000000000000000000000000000000' ? custody : null;
        } catch (error) {
            console.error('Failed to get custody address:', error);
            return null;
        }
    }

    /**
     * Access all three ERC-8004 registries if needed
     * As shown in your second image
     */
    async getRegistryClients(identity: Address) {
        return {
            identityClient: identity, // identity.clients?.identity
            reputationClient: undefined, // identity.clients?.reputation
            validationClient: undefined  // identity.clients?.validation
        };
    }

    /**
     * Get complete agent identity with all registry data
     */
    async getAgentIdentity(address: Address): Promise<AgentIdentity> {
        const fid = await this.getFarcasterFID(address);

        // Placeholder - would query actual identity registry
        const identity: AgentIdentity = {
            address,
            fid: fid || undefined,
            domain: 'agent.x402.vot',
            registries: {
                identity: true,
                reputation: false,
                validation: false
            },
            x402AccessLevel: 1,
            nftTokenIds: []
        };

        return identity;
    }

    /**
     * Check if address has x402 access (via NFT ownership)
     */
    async hasX402Access(address: Address, nftContract: Address): Promise<boolean> {
        try {
            // Check NFT balance
            const balance = await this.publicClient.readContract({
                address: nftContract,
                abi: [
                    {
                        inputs: [{ name: 'account', type: 'address' }],
                        name: 'balanceOf',
                        outputs: [{ name: '', type: 'uint256' }],
                        stateMutability: 'view',
                        type: 'function'
                    }
                ],
                functionName: 'balanceOf',
                args: [address]
            });

            return balance > BigInt(0);
        } catch {
            return false;
        }
    }

    /**
     * Get x402 access level based on NFT tier
     */
    async getX402AccessLevel(address: Address, nftContract: Address): Promise<number> {
        // This would check which tier NFT the address owns
        // 0 = No access
        // 1 = Recon (basic)
        // 2 = Vanguard/Elite (standard)
        // 3 = Legendary (premium)
        // 4 = AGI (maximal)

        const hasAccess = await this.hasX402Access(address, nftContract);
        return hasAccess ? 1 : 0;
    }
}

/**
 * Initialize x402 agent identity at app startup
 */
export async function bootstrapX402Identity(config?: Partial<AgentIdentityConfig>): Promise<void> {
    const defaultConfig: AgentIdentityConfig = {
        domain: process.env.NEXT_PUBLIC_AGENT_DOMAIN || 'agent.x402.vot',
        autoRegister: true,
        ...config
    };

    console.log('// Bootstrap ERC-8004 identity (runs once at startup)');
    console.log('const identity = await createAgentIdentity({');
    console.log(`  domain: process.env.AGENT_DOMAIN || "${defaultConfig.domain}",`);
    console.log(`  autoRegister: ${defaultConfig.autoRegister},`);
    console.log('});');
    console.log('');
    console.log('// Access all three ERC-8004 registries if needed');
    console.log('export const identityClient = identity.clients?.identity;');
    console.log('export const reputationClient = identity.clients?.reputation;');
    console.log('export const validationClient = identity.clients?.validation;');

    // In production, this would actually call the identity registry
    // For now, just log the bootstrap code
}
