import { createPublicClient, http, type Address } from 'viem';
import { base, mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';
import { resolveBaseName as resolveBaseNameUtil } from '../baseNameUtils';
import type { ResolvedName } from './types';

export class NameResolver {
    private baseClient;
    private mainnetClient;
    private cache: Map<Address, ResolvedName>;

    constructor(baseRpcUrl?: string, mainnetRpcUrl?: string) {
        this.baseClient = createPublicClient({
            chain: base,
            transport: http(baseRpcUrl || 'https://mainnet.base.org')
        });

        this.mainnetClient = createPublicClient({
            chain: mainnet,
            transport: http(mainnetRpcUrl || 'https://ethereum-rpc.publicnode.com')
        });

        this.cache = new Map();
    }

    async resolveBasename(address: Address): Promise<string | null> {
        try {
            const result = await resolveBaseNameUtil(address as `0x${string}`);
            return result;
        } catch (error) {
            console.warn('Basename resolution failed:', error);
            return null;
        }
    }

    async resolveENS(address: Address): Promise<string | null> {
        try {
            const name = await this.mainnetClient.getEnsName({ address });
            if (name) {
                return name;
            }

            const response = await fetch(`https://api.web3.bio/profile/${address}`, {
                headers: { accept: 'application/json' },
                cache: 'no-store'
            });

            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    for (const profile of data) {
                        if (profile.identity && profile.identity.endsWith('.eth') && profile.platform === 'ens') {
                            return profile.identity as string;
                        }
                    }
                }
            }

            return null;
        } catch (error) {
            console.warn('ENS resolution failed:', error);
            return null;
        }
    }

    async getEnsAvatar(name: string): Promise<string | null> {
        try {
            const avatar = await this.mainnetClient.getEnsAvatar({ name: normalize(name) });
            return avatar;
        } catch (error) {
            console.warn('ENS avatar fetch failed:', error);
            return null;
        }
    }

    async resolveAllNames(address: Address): Promise<ResolvedName> {
        if (this.cache.has(address)) {
            return this.cache.get(address)!;
        }

        const [basename, ensName] = await Promise.all([
            this.resolveBasename(address),
            this.resolveENS(address)
        ]);

        let actualBasename = basename;
        let actualEnsName = ensName;

        if (ensName && ensName.endsWith('.base.eth')) {
            actualBasename = ensName.slice(0, -8);
            actualEnsName = null;
        }

        const primaryName = actualBasename || actualEnsName;
        let avatar: string | null = null;
        if (primaryName) {
            const fullName = actualBasename ? `${primaryName}.base.eth` : `${primaryName}.eth`;
            avatar = await this.getEnsAvatar(fullName);
        }

        const resolved: ResolvedName = {
            address,
            basename: actualBasename || undefined,
            ensName: actualEnsName || undefined,
            displayName: actualBasename || actualEnsName || undefined,
            avatar: avatar || undefined
        };

        this.cache.set(address, resolved);
        return resolved;
    }

    getDisplayName(resolved: ResolvedName): string {
        if (resolved.basename) return resolved.basename;
        if (resolved.ensName) return resolved.ensName;
        const addr = resolved.address;
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }

    clearCache(): void {
        this.cache.clear();
    }

    async preloadNames(addresses: Address[]): Promise<Map<Address, ResolvedName>> {
        const results = await Promise.all(addresses.map(addr => this.resolveAllNames(addr)));
        const map = new Map<Address, ResolvedName>();
        results.forEach(result => {
            map.set(result.address, result);
        });
        return map;
    }
}

let resolverInstance: NameResolver | null = null;

export function getNameResolver(baseRpcUrl?: string, mainnetRpcUrl?: string): NameResolver {
    if (!resolverInstance) {
        resolverInstance = new NameResolver(baseRpcUrl, mainnetRpcUrl);
    }
    return resolverInstance;
}

export function clearNameResolverCache(): void {
    resolverInstance?.clearCache();
}

export async function resolveName(address: Address): Promise<ResolvedName> {
    const resolver = getNameResolver();
    return resolver.resolveAllNames(address);
}
