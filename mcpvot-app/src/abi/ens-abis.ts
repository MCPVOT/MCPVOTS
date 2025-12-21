/**
 * ENS Contract ABIs and Utilities
 * Direct interaction with ENS contracts on Ethereum Mainnet
 * 
 * @created December 9, 2025
 * @updated December 9, 2025 - v4: Updated contract addresses from official GitHub wiki
 * @network Ethereum Mainnet (Chain ID: 1)
 * 
 * Contract addresses verified against:
 * https://github.com/ensdomains/ens-contracts/wiki/ENS-Contract-Deployments
 * 
 * For production, consider using official libraries:
 * - @ensdomains/content-hash - For contenthash encoding/decoding
 * - @ensdomains/ensjs - Full ENS client with viem support
 */

import { keccak256, toBytes, concat, type Hex } from 'viem';

// =============================================================================
// CONTRACT ADDRESSES
// =============================================================================

/**
 * Official ENS Contract Addresses - Ethereum Mainnet
 * Source: https://github.com/ensdomains/ens-contracts/wiki/ENS-Contract-Deployments
 * Last verified: December 2025 (wiki updated Aug 29, 2025)
 */
export const ENS_CONTRACTS = {
  // Core contracts
  REGISTRY: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' as const,
  PUBLIC_RESOLVER: '0xF29100983E058B709F3D539b0c765937B804AC15' as const,  // Updated Dec 2025
  NAME_WRAPPER: '0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401' as const,
  REVERSE_REGISTRAR: '0xa58E81fe9b61B5c3fE2AFD33CF304c454AbFc7Cb' as const,
  ETH_REGISTRAR: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85' as const,
  
  // Additional useful contracts
  UNIVERSAL_RESOLVER: '0xED73a03F19e8D849E44a39252d222c6ad5217E1e' as const,
  ETH_REGISTRAR_CONTROLLER: '0x59E16fcCd424Cc24e280Be16E11Bcd56fb0CE547' as const,
  BULK_RENEWAL: '0xc649947a460B135e6B9a70Ee2FB429aDBB529290' as const,
  
  // Legacy resolver (for reference - many existing names still use this)
  LEGACY_PUBLIC_RESOLVER: '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63' as const,
} as const;

// =============================================================================
// ENS REGISTRY ABI
// =============================================================================

export const ENS_REGISTRY_ABI = [
  {
    name: 'resolver',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    name: 'ttl',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ name: '', type: 'uint64' }]
  },
  {
    name: 'recordExists',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'setOwner',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'owner', type: 'address' }
    ],
    outputs: []
  },
  {
    name: 'setSubnodeOwner',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'label', type: 'bytes32' },
      { name: 'owner', type: 'address' }
    ],
    outputs: [{ name: '', type: 'bytes32' }]
  },
  {
    name: 'setResolver',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'resolver', type: 'address' }
    ],
    outputs: []
  },
  {
    name: 'setSubnodeRecord',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'label', type: 'bytes32' },
      { name: 'owner', type: 'address' },
      { name: 'resolver', type: 'address' },
      { name: 'ttl', type: 'uint64' }
    ],
    outputs: []
  }
] as const;

// =============================================================================
// ENS PUBLIC RESOLVER ABI
// =============================================================================

export const ENS_RESOLVER_ABI = [
  {
    name: 'contenthash',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bytes' }]
  },
  {
    name: 'setContenthash',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'hash', type: 'bytes' }
    ],
    outputs: []
  },
  {
    name: 'text',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' }
    ],
    outputs: [{ name: '', type: 'string' }]
  },
  {
    name: 'setText',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
      { name: 'value', type: 'string' }
    ],
    outputs: []
  },
  {
    name: 'addr',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    name: 'setAddr',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'a', type: 'address' }
    ],
    outputs: []
  },
  {
    name: 'addr',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'coinType', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bytes' }]
  },
  {
    name: 'setAddr',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'coinType', type: 'uint256' },
      { name: 'a', type: 'bytes' }
    ],
    outputs: []
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ name: '', type: 'string' }]
  },
  {
    name: 'setName',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'newName', type: 'string' }
    ],
    outputs: []
  },
  {
    name: 'multicall',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'data', type: 'bytes[]' }],
    outputs: [{ name: 'results', type: 'bytes[]' }]
  },
  {
    name: 'supportsInterface',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'interfaceID', type: 'bytes4' }],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;

// =============================================================================
// NAME WRAPPER ABI
// =============================================================================

export const NAME_WRAPPER_ABI = [
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    name: 'getData',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'fuses', type: 'uint32' },
      { name: 'expiry', type: 'uint64' }
    ]
  },
  {
    name: 'setSubnodeOwner',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'parentNode', type: 'bytes32' },
      { name: 'label', type: 'string' },
      { name: 'owner', type: 'address' },
      { name: 'fuses', type: 'uint32' },
      { name: 'expiry', type: 'uint64' }
    ],
    outputs: [{ name: '', type: 'bytes32' }]
  },
  {
    name: 'setSubnodeRecord',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'parentNode', type: 'bytes32' },
      { name: 'label', type: 'string' },
      { name: 'owner', type: 'address' },
      { name: 'resolver', type: 'address' },
      { name: 'ttl', type: 'uint64' },
      { name: 'fuses', type: 'uint32' },
      { name: 'expiry', type: 'uint64' }
    ],
    outputs: [{ name: '', type: 'bytes32' }]
  },
  {
    name: 'isWrapped',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'setResolver',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'resolver', type: 'address' }
    ],
    outputs: []
  }
] as const;

// =============================================================================
// COIN TYPES (SLIP-44)
// =============================================================================

export const COIN_TYPES = {
  ETH: 60,
  BTC: 0,
  LTC: 2,
  DOGE: 3,
  BASE: 8453,
  OP: 10,
  ARB: 42161,
  POLYGON: 137,
  SOL: 501,
  AVAX: 9000,
} as const;

// =============================================================================
// TEXT RECORD KEYS
// =============================================================================

export const TEXT_RECORD_KEYS = {
  AVATAR: 'avatar',
  DESCRIPTION: 'description',
  DISPLAY: 'display',
  EMAIL: 'email',
  KEYWORDS: 'keywords',
  MAIL: 'mail',
  NOTICE: 'notice',
  LOCATION: 'location',
  PHONE: 'phone',
  URL: 'url',
  TWITTER: 'com.twitter',
  GITHUB: 'com.github',
  DISCORD: 'com.discord',
  TELEGRAM: 'org.telegram',
  FARCASTER: 'xyz.farcaster',
  LENS: 'xyz.lens',
  MCPVOT_RANK: 'xyz.mcpvot.rank',
  MCPVOT_HOLDINGS: 'xyz.mcpvot.holdings',
  MCPVOT_BUILDER: 'xyz.mcpvot.builder',
  MCPVOT_FID: 'xyz.mcpvot.fid',
  MCPVOT_WALLET: 'xyz.mcpvot.wallet',
} as const;

// =============================================================================
// BASE58 ENCODING/DECODING
// =============================================================================

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE58_MAP = new Map<string, number>();
for (let i = 0; i < BASE58_ALPHABET.length; i++) {
  BASE58_MAP.set(BASE58_ALPHABET[i], i);
}

export function base58Decode(str: string): Uint8Array {
  if (str.length === 0) return new Uint8Array(0);
  
  let leadingZeros = 0;
  for (let i = 0; i < str.length && str[i] === '1'; i++) {
    leadingZeros++;
  }
  
  const size = Math.ceil(str.length * 733 / 1000) + 1;
  const bytes = new Uint8Array(size);
  
  let length = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const value = BASE58_MAP.get(char);
    
    if (value === undefined) {
      throw new Error(`Invalid base58 character: ${char}`);
    }
    
    let carry = value;
    for (let j = 0; j < length || carry; j++) {
      carry += 58 * (bytes[j] || 0);
      bytes[j] = carry & 0xff;
      carry >>= 8;
      if (j >= length) length = j + 1;
    }
  }
  
  const result = new Uint8Array(leadingZeros + length);
  for (let i = 0; i < length; i++) {
    result[leadingZeros + length - 1 - i] = bytes[i];
  }
  
  return result;
}

export function base58Encode(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';
  
  let leadingZeros = 0;
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    leadingZeros++;
  }
  
  const size = Math.ceil(bytes.length * 138 / 100) + 1;
  const digits = new Uint8Array(size);
  
  let length = 0;
  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < length || carry; j++) {
      carry += 256 * (digits[j] || 0);
      digits[j] = carry % 58;
      carry = Math.floor(carry / 58);
      if (j >= length) length = j + 1;
    }
  }
  
  let result = '1'.repeat(leadingZeros);
  for (let i = length - 1; i >= 0; i--) {
    result += BASE58_ALPHABET[digits[i]];
  }
  
  return result;
}

// =============================================================================
// BASE32 ENCODING/DECODING
// =============================================================================

const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';
const BASE32_MAP = new Map<string, number>();
for (let i = 0; i < BASE32_ALPHABET.length; i++) {
  BASE32_MAP.set(BASE32_ALPHABET[i], i);
}

export function base32Decode(str: string): Uint8Array {
  const cleanStr = str.toLowerCase().replace(/=+$/, '');
  if (cleanStr.length === 0) return new Uint8Array(0);
  
  const output: number[] = [];
  let buffer = 0;
  let bitsLeft = 0;
  
  for (const char of cleanStr) {
    const value = BASE32_MAP.get(char);
    if (value === undefined) {
      throw new Error(`Invalid base32 character: ${char}`);
    }
    
    buffer = (buffer << 5) | value;
    bitsLeft += 5;
    
    if (bitsLeft >= 8) {
      bitsLeft -= 8;
      output.push((buffer >> bitsLeft) & 0xff);
    }
  }
  
  return new Uint8Array(output);
}

export function base32Encode(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';
  
  let result = '';
  let buffer = 0;
  let bitsLeft = 0;
  
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bitsLeft += 8;
    
    while (bitsLeft >= 5) {
      bitsLeft -= 5;
      result += BASE32_ALPHABET[(buffer >> bitsLeft) & 0x1f];
    }
  }
  
  if (bitsLeft > 0) {
    result += BASE32_ALPHABET[(buffer << (5 - bitsLeft)) & 0x1f];
  }
  
  return result;
}

// =============================================================================
// HEX UTILITIES
// =============================================================================

export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (cleanHex.length % 2 !== 0) {
    throw new Error('Invalid hex string length');
  }
  
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }
  
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): Hex {
  return `0x${Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')}`;
}

// =============================================================================
// IPFS CONTENTHASH ENCODING/DECODING
// =============================================================================

export function encodeIPFSContenthash(cid: string): Hex {
  if (!cid || cid.length === 0) {
    throw new Error('CID cannot be empty');
  }

  if (cid.startsWith('Qm')) {
    const decoded = base58Decode(cid);
    
    if (decoded.length !== 34 || decoded[0] !== 0x12 || decoded[1] !== 0x20) {
      throw new Error('Invalid CIDv0 format');
    }
    
    const contenthash = new Uint8Array(3 + decoded.length);
    contenthash[0] = 0xe3;
    contenthash[1] = 0x01;
    contenthash[2] = 0x70;
    contenthash.set(decoded, 3);
    
    return bytesToHex(contenthash);
  } 
  
  if (cid.startsWith('bafy') || cid.startsWith('bafk') || cid.startsWith('bafz')) {
    const base32Part = cid.slice(1);
    const decoded = base32Decode(base32Part);
    
    const contenthash = new Uint8Array(1 + decoded.length);
    contenthash[0] = 0xe3;
    contenthash.set(decoded, 1);
    
    return bytesToHex(contenthash);
  }
  
  throw new Error(`Unsupported CID format: ${cid.slice(0, 10)}...`);
}

export function decodeContenthash(contenthash: string): string {
  if (!contenthash || contenthash === '0x' || contenthash === '0x0' || contenthash.length < 6) {
    return '';
  }
  
  const bytes = hexToBytes(contenthash);
  
  if (bytes.length < 2) {
    return '';
  }
  
  const namespace = bytes[0];
  
  if (namespace === 0xe3) {
    if (bytes[1] === 0x01 && bytes[2] === 0x70) {
      const multihash = bytes.slice(3);
      return base58Encode(multihash);
    } else if (bytes[1] === 0x01) {
      const cidBytes = bytes.slice(1);
      return 'b' + base32Encode(cidBytes);
    }
  } else if (namespace === 0xe5) {
    return `ipns:${bytesToHex(bytes.slice(1))}`;
  }
  
  return `unknown:${contenthash}`;
}

// =============================================================================
// NAMEHASH COMPUTATION
// =============================================================================

export function ensNamehash(name: string): Hex {
  if (!name || name.length === 0) {
    return '0x0000000000000000000000000000000000000000000000000000000000000000';
  }
  
  let node: Hex = '0x0000000000000000000000000000000000000000000000000000000000000000';
  
  const labels = name.split('.');
  
  for (let i = labels.length - 1; i >= 0; i--) {
    const label = labels[i];
    if (label.length === 0) continue;
    
    const labelBytes = toBytes(label);
    const labelHashHex = keccak256(labelBytes);
    
    const combined = concat([node, labelHashHex]);
    node = keccak256(combined);
  }
  
  return node;
}

export function labelHash(label: string): Hex {
  return keccak256(toBytes(label));
}

// =============================================================================
// VALIDATION UTILITIES (FIXED)
// =============================================================================

/**
 * Validate an IPFS CID format
 * FIXED: More flexible regex for CIDv1 (length varies based on hash function)
 */
export function isValidCID(cid: string): boolean {
  if (!cid || cid.length === 0) return false;
  
  // CIDv0: Qm + 44 base58 chars = 46 total (sha2-256)
  if (cid.startsWith('Qm')) {
    if (cid.length !== 46) return false;
    return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(cid);
  }
  
  // CIDv1: b + base32 encoded (variable length, typically 59 chars for sha2-256)
  // bafy = dag-cbor + sha2-256
  // bafk = raw + sha2-256  
  // bafz = dag-pb + sha2-256
  // Length can be 59 (sha2-256) or longer for other hashes
  if (cid.startsWith('bafy') || cid.startsWith('bafk') || cid.startsWith('bafz')) {
    // Minimum length check: 'b' + version(1) + codec(1-2) + hash(32+) encoded ~= 50+ chars
    if (cid.length < 50) return false;
    // Must be valid base32 after the 'b' prefix
    return /^b[a-z2-7]+$/.test(cid);
  }
  
  return false;
}

/**
 * Validate an ENS domain name
 */
export function isValidENSName(name: string): boolean {
  if (!name || name.length === 0) return false;
  
  const labels = name.split('.');
  if (labels.length < 2) return false; // Need at least name.tld
  
  for (const label of labels) {
    if (label.length === 0 || label.length > 63) return false;
    if (label.startsWith('-') || label.endsWith('-')) return false;
    if (!/^[a-z0-9-]+$/i.test(label)) return false;
  }
  
  return true;
}

/**
 * Validate a private key format
 */
export function isValidPrivateKey(key: string): boolean {
  if (!key || key.length === 0) return false;
  
  // With 0x prefix: 66 chars
  if (key.startsWith('0x')) {
    return key.length === 66 && /^0x[a-fA-F0-9]{64}$/.test(key);
  }
  
  // Without prefix: 64 chars
  return key.length === 64 && /^[a-fA-F0-9]{64}$/.test(key);
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ENSContractAddresses = typeof ENS_CONTRACTS;
export type CoinType = (typeof COIN_TYPES)[keyof typeof COIN_TYPES];
export type TextRecordKey = (typeof TEXT_RECORD_KEYS)[keyof typeof TEXT_RECORD_KEYS];
