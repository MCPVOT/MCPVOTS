/**
 * Direct ENS Client - v3 Bug Fixed
 * Interact with ENS contracts without deploying new contracts
 * 
 * @created December 9, 2025
 * @updated December 9, 2025 - v3: Fixed contenthash formatting, private key validation, efficiency
 * @network Ethereum Mainnet (Chain ID: 1)
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Account,
  type Chain,
  type Hex,
  type TransactionReceipt,
  encodeFunctionData,
  formatEther,
} from 'viem';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import {
  ENS_CONTRACTS,
  ENS_REGISTRY_ABI,
  ENS_RESOLVER_ABI,
  NAME_WRAPPER_ABI,
  encodeIPFSContenthash,
  decodeContenthash,
  ensNamehash,
  labelHash,
  TEXT_RECORD_KEYS,
  isValidCID,
  isValidENSName,
  isValidPrivateKey,
} from '@/abi/ens-abis';

// =============================================================================
// TYPES
// =============================================================================

export interface ENSClientConfig {
  domain: string;
  privateKey?: string;
  rpcUrl?: string;
  chain?: Chain;
  retries?: number;
  retryDelay?: number;
}

export interface ENSProfile {
  domain: string;
  owner: Hex;
  resolver: Hex;
  rawContenthash: string | null;  // Raw hex from contract
  ipfsCid: string | null;         // Decoded CID (Qm... or bafy...)
  ipfsGatewayUrl: string | null;
  ensLimoUrl: string;
  records: Record<string, string>;
  isWrapped: boolean;
}

export interface TransactionResult {
  hash: Hex;
  success: boolean;
  gasUsed?: bigint;
  effectiveGasPrice?: bigint;
  totalCost?: string;
  blockNumber?: bigint;
  error?: string;
}

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  estimatedCost: string;
  estimatedCostUsd?: string;
}

export interface BatchUpdateOptions {
  avatar?: string;
  description?: string;
  url?: string;
  email?: string;
  twitter?: string;
  github?: string;
  discord?: string;
  farcaster?: string;
  telegram?: string;
  contenthash?: string;
  'xyz.mcpvot.rank'?: string;
  'xyz.mcpvot.holdings'?: string;
  'xyz.mcpvot.builder'?: string;
  'xyz.mcpvot.fid'?: string;
  [key: string]: string | undefined;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ZERO_ADDRESS: Hex = '0x0000000000000000000000000000000000000000';
const DEFAULT_RPC_URLS = [
  'https://eth.llamarpc.com',
  'https://rpc.ankr.com/eth',
  'https://ethereum.publicnode.com',
];

const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
];

// =============================================================================
// DIRECT ENS CLIENT CLASS
// =============================================================================

export class DirectENSClient {
  private publicClient: PublicClient;
  private walletClient: WalletClient | null = null;
  private account: Account | null = null;
  private domain: string;
  private node: Hex;
  private retries: number;
  private retryDelay: number;
  private isReadOnly: boolean;
  
  // Cache resolver to avoid repeated calls
  private cachedResolver: Hex | null = null;
  private resolverCacheTime: number = 0;
  private readonly RESOLVER_CACHE_TTL = 60000; // 1 minute

  constructor(config: ENSClientConfig) {
    const { domain, privateKey, rpcUrl, chain, retries = 3, retryDelay = 1000 } = config;

    if (!isValidENSName(domain)) {
      throw new Error(`Invalid ENS domain: ${domain}`);
    }

    this.domain = domain;
    this.node = ensNamehash(domain);
    this.retries = retries;
    this.retryDelay = retryDelay;

    const primaryRpc = rpcUrl || DEFAULT_RPC_URLS[0];
    const transport = http(primaryRpc, {
      retryCount: 3,
      retryDelay: 1000,
      timeout: 30000,
    });

    const targetChain = chain || mainnet;

    this.publicClient = createPublicClient({
      chain: targetChain,
      transport,
    });

    // FIXED: Use proper private key validation
    if (privateKey && isValidPrivateKey(privateKey)) {
      try {
        const normalizedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
        this.account = privateKeyToAccount(normalizedKey as Hex);
        this.walletClient = createWalletClient({
          account: this.account,
          chain: targetChain,
          transport,
        });
        this.isReadOnly = false;
      } catch (error) {
        console.warn('[ENS] Invalid private key, running in read-only mode:', error);
        this.isReadOnly = true;
      }
    } else {
      this.isReadOnly = true;
    }

    console.log(`[ENS] Client initialized for ${domain} (${this.isReadOnly ? 'read-only' : 'read-write'})`);
  }

  // ===========================================================================
  // UTILITY - Retry wrapper
  // ===========================================================================

  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`[ENS] ${operationName} attempt ${attempt}/${this.retries} failed:`, error);
        
        if (attempt < this.retries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    throw lastError;
  }

  // ===========================================================================
  // READ METHODS
  // ===========================================================================

  /**
   * Get the resolver address for the domain (with caching)
   */
  async getResolver(): Promise<Hex> {
    const now = Date.now();
    if (this.cachedResolver && (now - this.resolverCacheTime) < this.RESOLVER_CACHE_TTL) {
      return this.cachedResolver;
    }

    const resolver = await this.withRetry(async () => {
      const result = await this.publicClient.readContract({
        address: ENS_CONTRACTS.REGISTRY,
        abi: ENS_REGISTRY_ABI,
        functionName: 'resolver',
        args: [this.node],
      });
      return result as Hex;
    }, 'getResolver');

    this.cachedResolver = resolver;
    this.resolverCacheTime = now;
    return resolver;
  }

  /**
   * Get the owner of the domain
   */
  async getOwner(): Promise<Hex> {
    return this.withRetry(async () => {
      const owner = await this.publicClient.readContract({
        address: ENS_CONTRACTS.REGISTRY,
        abi: ENS_REGISTRY_ABI,
        functionName: 'owner',
        args: [this.node],
      });
      return owner as Hex;
    }, 'getOwner');
  }

  /**
   * Check if domain exists in registry
   */
  async exists(): Promise<boolean> {
    return this.withRetry(async () => {
      const exists = await this.publicClient.readContract({
        address: ENS_CONTRACTS.REGISTRY,
        abi: ENS_REGISTRY_ABI,
        functionName: 'recordExists',
        args: [this.node],
      });
      return exists as boolean;
    }, 'exists');
  }

  /**
   * Get current contenthash (returns decoded CID)
   */
  async getContenthash(): Promise<string | null> {
    try {
      const resolver = await this.getResolver();
      if (resolver === ZERO_ADDRESS) {
        return null;
      }

      const contenthash = await this.withRetry(async () => {
        return await this.publicClient.readContract({
          address: resolver,
          abi: ENS_RESOLVER_ABI,
          functionName: 'contenthash',
          args: [this.node],
        });
      }, 'getContenthash');

      if (!contenthash || contenthash === '0x') {
        return null;
      }

      return decodeContenthash(contenthash as string);
    } catch (error) {
      console.error('[ENS] Failed to get contenthash:', error);
      return null;
    }
  }

  /**
   * Get raw contenthash bytes (hex format)
   */
  async getRawContenthash(): Promise<string | null> {
    try {
      const resolver = await this.getResolver();
      if (resolver === ZERO_ADDRESS) {
        return null;
      }

      const contenthash = await this.publicClient.readContract({
        address: resolver,
        abi: ENS_RESOLVER_ABI,
        functionName: 'contenthash',
        args: [this.node],
      });

      if (!contenthash || contenthash === '0x') {
        return null;
      }

      return contenthash as string;
    } catch {
      return null;
    }
  }

  /**
   * Get a text record
   */
  async getText(key: string, resolver?: Hex): Promise<string> {
    try {
      const resolverAddress = resolver || await this.getResolver();
      if (resolverAddress === ZERO_ADDRESS) {
        return '';
      }

      const value = await this.withRetry(async () => {
        return await this.publicClient.readContract({
          address: resolverAddress,
          abi: ENS_RESOLVER_ABI,
          functionName: 'text',
          args: [this.node, key],
        });
      }, `getText(${key})`);

      return (value as string) || '';
    } catch (error) {
      console.error(`[ENS] Failed to get text record ${key}:`, error);
      return '';
    }
  }

  /**
   * Get multiple text records in parallel (FIXED: fetches resolver once)
   */
  async getTextRecords(keys: string[]): Promise<Record<string, string>> {
    const resolver = await this.getResolver();
    if (resolver === ZERO_ADDRESS) {
      return {};
    }

    const results = await Promise.allSettled(
      keys.map(async (key) => ({ key, value: await this.getText(key, resolver) }))
    );

    const records: Record<string, string> = {};
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.value) {
        records[result.value.key] = result.value.value;
      }
    }

    return records;
  }

  /**
   * Check if domain is wrapped in NameWrapper
   */
  async isWrapped(): Promise<boolean> {
    try {
      const isWrapped = await this.publicClient.readContract({
        address: ENS_CONTRACTS.NAME_WRAPPER,
        abi: NAME_WRAPPER_ABI,
        functionName: 'isWrapped',
        args: [this.node],
      });
      return isWrapped as boolean;
    } catch {
      return false;
    }
  }

  /**
   * Get full ENS profile with all common records
   * FIXED: Proper contenthash formatting
   */
  async getProfile(): Promise<ENSProfile> {
    const [owner, resolver, contenthash, rawContenthash, isWrapped] = await Promise.all([
      this.getOwner(),
      this.getResolver(),
      this.getContenthash(),
      this.getRawContenthash(),
      this.isWrapped(),
    ]);

    const recordKeys = [
      TEXT_RECORD_KEYS.AVATAR,
      TEXT_RECORD_KEYS.DESCRIPTION,
      TEXT_RECORD_KEYS.URL,
      TEXT_RECORD_KEYS.EMAIL,
      TEXT_RECORD_KEYS.TWITTER,
      TEXT_RECORD_KEYS.GITHUB,
      TEXT_RECORD_KEYS.DISCORD,
      TEXT_RECORD_KEYS.FARCASTER,
      TEXT_RECORD_KEYS.TELEGRAM,
      TEXT_RECORD_KEYS.MCPVOT_RANK,
      TEXT_RECORD_KEYS.MCPVOT_BUILDER,
      TEXT_RECORD_KEYS.MCPVOT_FID,
    ];

    const records = await this.getTextRecords(recordKeys);

    return {
      domain: this.domain,
      owner,
      resolver,
      rawContenthash,  // Raw hex: 0xe301701220...
      ipfsCid: contenthash,  // Decoded: QmXxx... or bafyXxx...
      ipfsGatewayUrl: contenthash ? `${IPFS_GATEWAYS[0]}${contenthash}` : null,
      ensLimoUrl: `https://${this.domain}.limo`,
      records,
      isWrapped,
    };
  }

  // ===========================================================================
  // WRITE METHODS
  // ===========================================================================

  private ensureWriteAccess(): void {
    if (this.isReadOnly || !this.walletClient || !this.account) {
      throw new Error('Client is in read-only mode. Provide a valid private key for write operations.');
    }
  }

  async estimateGas(
    operation: 'setContenthash' | 'setText' | 'createSubdomain',
    params?: { cid?: string; key?: string; value?: string; label?: string; owner?: Hex }
  ): Promise<GasEstimate> {
    this.ensureWriteAccess();

    const resolver = await this.getResolver();
    if (resolver === ZERO_ADDRESS) {
      throw new Error('No resolver set for domain');
    }

    let gasLimit: bigint;

    switch (operation) {
      case 'setContenthash': {
        if (!params?.cid) throw new Error('CID required for gas estimate');
        const encodedHash = encodeIPFSContenthash(params.cid);
        gasLimit = await this.publicClient.estimateContractGas({
          address: resolver,
          abi: ENS_RESOLVER_ABI,
          functionName: 'setContenthash',
          args: [this.node, encodedHash],
          account: this.account!,
        });
        break;
      }
      case 'setText': {
        if (!params?.key || params?.value === undefined) throw new Error('Key and value required');
        gasLimit = await this.publicClient.estimateContractGas({
          address: resolver,
          abi: ENS_RESOLVER_ABI,
          functionName: 'setText',
          args: [this.node, params.key, params.value],
          account: this.account!,
        });
        break;
      }
      case 'createSubdomain': {
        if (!params?.label || !params?.owner) throw new Error('Label and owner required');
        const labelHashBytes = labelHash(params.label);
        gasLimit = await this.publicClient.estimateContractGas({
          address: ENS_CONTRACTS.REGISTRY,
          abi: ENS_REGISTRY_ABI,
          functionName: 'setSubnodeOwner',
          args: [this.node, labelHashBytes, params.owner],
          account: this.account!,
        });
        break;
      }
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    const gasPrice = await this.publicClient.getGasPrice();
    const estimatedCost = gasLimit * gasPrice;

    return {
      gasLimit,
      gasPrice,
      estimatedCost: formatEther(estimatedCost),
    };
  }

  async setContenthash(ipfsCid: string): Promise<TransactionResult> {
    this.ensureWriteAccess();

    if (!isValidCID(ipfsCid)) {
      throw new Error(`Invalid IPFS CID format: ${ipfsCid}`);
    }

    console.log(`[ENS] Setting contenthash for ${this.domain} to ipfs://${ipfsCid}`);

    const resolver = await this.getResolver();
    if (resolver === ZERO_ADDRESS) {
      throw new Error('No resolver set for domain. Call setResolver() first.');
    }

    const encodedHash = encodeIPFSContenthash(ipfsCid);
    console.log(`[ENS] Encoded contenthash: ${encodedHash}`);

    try {
      await this.publicClient.simulateContract({
        address: resolver,
        abi: ENS_RESOLVER_ABI,
        functionName: 'setContenthash',
        args: [this.node, encodedHash],
        account: this.account!,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Transaction simulation failed: ${errorMsg}`);
    }

    const hash = await this.walletClient!.writeContract({
      address: resolver,
      abi: ENS_RESOLVER_ABI,
      functionName: 'setContenthash',
      args: [this.node, encodedHash],
    });

    console.log(`[ENS] Transaction submitted: ${hash}`);

    const receipt = await this.publicClient.waitForTransactionReceipt({ 
      hash,
      confirmations: 1,
    });

    return this.formatReceipt(hash, receipt);
  }

  async setText(key: string, value: string): Promise<TransactionResult> {
    this.ensureWriteAccess();

    console.log(`[ENS] Setting text record ${key} for ${this.domain}`);

    const resolver = await this.getResolver();
    if (resolver === ZERO_ADDRESS) {
      throw new Error('No resolver set for domain');
    }

    try {
      await this.publicClient.simulateContract({
        address: resolver,
        abi: ENS_RESOLVER_ABI,
        functionName: 'setText',
        args: [this.node, key, value],
        account: this.account!,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Transaction simulation failed: ${errorMsg}`);
    }

    const hash = await this.walletClient!.writeContract({
      address: resolver,
      abi: ENS_RESOLVER_ABI,
      functionName: 'setText',
      args: [this.node, key, value],
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return this.formatReceipt(hash, receipt);
  }

  async batchUpdate(options: BatchUpdateOptions): Promise<TransactionResult> {
    this.ensureWriteAccess();

    console.log(`[ENS] Batch updating records for ${this.domain}`);

    const resolver = await this.getResolver();
    if (resolver === ZERO_ADDRESS) {
      throw new Error('No resolver set for domain');
    }

    const calls: Hex[] = [];

    const textRecordMap: Record<string, string> = {
      avatar: TEXT_RECORD_KEYS.AVATAR,
      description: TEXT_RECORD_KEYS.DESCRIPTION,
      url: TEXT_RECORD_KEYS.URL,
      email: TEXT_RECORD_KEYS.EMAIL,
      twitter: TEXT_RECORD_KEYS.TWITTER,
      github: TEXT_RECORD_KEYS.GITHUB,
      discord: TEXT_RECORD_KEYS.DISCORD,
      farcaster: TEXT_RECORD_KEYS.FARCASTER,
      telegram: TEXT_RECORD_KEYS.TELEGRAM,
    };

    for (const [key, value] of Object.entries(options)) {
      if (value === undefined || value === null) continue;

      if (key === 'contenthash') {
        if (!isValidCID(value)) {
          throw new Error(`Invalid IPFS CID: ${value}`);
        }
        const encodedHash = encodeIPFSContenthash(value);
        calls.push(
          encodeFunctionData({
            abi: ENS_RESOLVER_ABI,
            functionName: 'setContenthash',
            args: [this.node, encodedHash],
          })
        );
      } else {
        const recordKey = textRecordMap[key] || key;
        calls.push(
          encodeFunctionData({
            abi: ENS_RESOLVER_ABI,
            functionName: 'setText',
            args: [this.node, recordKey, value],
          })
        );
      }
    }

    if (calls.length === 0) {
      throw new Error('No valid records to update');
    }

    console.log(`[ENS] Executing ${calls.length} operations in batch`);

    try {
      await this.publicClient.simulateContract({
        address: resolver,
        abi: ENS_RESOLVER_ABI,
        functionName: 'multicall',
        args: [calls],
        account: this.account!,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Batch transaction simulation failed: ${errorMsg}`);
    }

    const hash = await this.walletClient!.writeContract({
      address: resolver,
      abi: ENS_RESOLVER_ABI,
      functionName: 'multicall',
      args: [calls],
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return this.formatReceipt(hash, receipt);
  }

  /**
   * Create a subdomain
   * FIXED: Properly handles setResolver for both wrapped and unwrapped domains
   */
  async createSubdomain(
    label: string,
    owner: Hex,
    setResolverAfter: boolean = true
  ): Promise<TransactionResult> {
    this.ensureWriteAccess();

    if (!label || label.length === 0 || label.length > 63) {
      throw new Error('Invalid subdomain label (must be 1-63 characters)');
    }
    if (/[^a-z0-9-]/i.test(label)) {
      throw new Error('Subdomain label can only contain alphanumeric characters and hyphens');
    }

    console.log(`[ENS] Creating subdomain ${label}.${this.domain} for ${owner}`);

    const labelHashBytes = labelHash(label);
    const wrapped = await this.isWrapped();

    let hash: Hex;

    if (wrapped) {
      // Use NameWrapper's setSubnodeRecord to set owner AND resolver in one call
      if (setResolverAfter) {
        hash = await this.walletClient!.writeContract({
          address: ENS_CONTRACTS.NAME_WRAPPER,
          abi: NAME_WRAPPER_ABI,
          functionName: 'setSubnodeRecord',
          args: [
            this.node,
            label,
            owner,
            ENS_CONTRACTS.PUBLIC_RESOLVER, // Set resolver in same tx
            BigInt(0), // TTL
            0, // No fuses
            BigInt(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60),
          ],
        });
      } else {
        hash = await this.walletClient!.writeContract({
          address: ENS_CONTRACTS.NAME_WRAPPER,
          abi: NAME_WRAPPER_ABI,
          functionName: 'setSubnodeOwner',
          args: [
            this.node,
            label,
            owner,
            0,
            BigInt(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60),
          ],
        });
      }
    } else {
      // Use Registry for unwrapped domains
      if (setResolverAfter) {
        // Use setSubnodeRecord to set owner AND resolver atomically
        hash = await this.walletClient!.writeContract({
          address: ENS_CONTRACTS.REGISTRY,
          abi: ENS_REGISTRY_ABI,
          functionName: 'setSubnodeRecord',
          args: [
            this.node,
            labelHashBytes,
            owner,
            ENS_CONTRACTS.PUBLIC_RESOLVER,
            BigInt(0), // TTL
          ],
        });
      } else {
        hash = await this.walletClient!.writeContract({
          address: ENS_CONTRACTS.REGISTRY,
          abi: ENS_REGISTRY_ABI,
          functionName: 'setSubnodeOwner',
          args: [this.node, labelHashBytes, owner],
        });
      }
    }

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    console.log(`[ENS] Subdomain ${label}.${this.domain} created successfully`);

    return this.formatReceipt(hash, receipt);
  }

  async setResolver(resolverAddress: Hex): Promise<TransactionResult> {
    this.ensureWriteAccess();

    console.log(`[ENS] Setting resolver for ${this.domain} to ${resolverAddress}`);

    const hash = await this.walletClient!.writeContract({
      address: ENS_CONTRACTS.REGISTRY,
      abi: ENS_REGISTRY_ABI,
      functionName: 'setResolver',
      args: [this.node, resolverAddress],
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    
    // Invalidate resolver cache
    this.cachedResolver = null;
    
    return this.formatReceipt(hash, receipt);
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  private formatReceipt(hash: Hex, receipt: TransactionReceipt): TransactionResult {
    const totalCost = receipt.gasUsed * (receipt.effectiveGasPrice || 0n);

    return {
      hash,
      success: receipt.status === 'success',
      gasUsed: receipt.gasUsed,
      effectiveGasPrice: receipt.effectiveGasPrice,
      totalCost: formatEther(totalCost),
      blockNumber: receipt.blockNumber,
      error: receipt.status === 'reverted' ? 'Transaction reverted' : undefined,
    };
  }

  getDomain(): string {
    return this.domain;
  }

  getNamehash(): Hex {
    return this.node;
  }

  getWalletAddress(): Hex | null {
    return this.account?.address || null;
  }

  isReadOnlyMode(): boolean {
    return this.isReadOnly;
  }

  async getGasPrice(): Promise<bigint> {
    return await this.publicClient.getGasPrice();
  }

  async getBalance(): Promise<string> {
    if (!this.account) return '0';
    const balance = await this.publicClient.getBalance({ address: this.account.address });
    return formatEther(balance);
  }

  // Clear resolver cache (useful after setResolver)
  clearCache(): void {
    this.cachedResolver = null;
    this.resolverCacheTime = 0;
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createENSClient(
  domain: string,
  privateKey?: string,
  rpcUrl?: string
): DirectENSClient {
  return new DirectENSClient({
    domain,
    privateKey,
    rpcUrl,
  });
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  ENS_CONTRACTS,
  ENS_REGISTRY_ABI,
  ENS_RESOLVER_ABI,
  TEXT_RECORD_KEYS,
  encodeIPFSContenthash,
  decodeContenthash,
  ensNamehash,
  labelHash,
  isValidCID,
  isValidENSName,
  isValidPrivateKey,
};
