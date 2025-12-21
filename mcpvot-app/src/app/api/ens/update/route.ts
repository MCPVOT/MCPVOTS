/**
 * ENS Update API Route - v3 Bug Fixed
 * Direct ENS interaction for contenthash and text record management
 * 
 * @created December 9, 2025
 * @updated December 9, 2025 - v3: Added auth, fixed rate limit leak, improved validation
 * @endpoint POST /api/ens/update
 * @endpoint GET /api/ens/update
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  createENSClient, 
  TEXT_RECORD_KEYS, 
  isValidCID,
  isValidENSName,
  isValidPrivateKey,
  type BatchUpdateOptions 
} from '@/lib/direct-ens-client';

// =============================================================================
// TYPES
// =============================================================================

type ENSAction = 
  | 'setContenthash'
  | 'setText'
  | 'setAvatar'
  | 'setDescription'
  | 'batchUpdate'
  | 'createSubdomain'
  | 'getProfile'
  | 'estimateGas';

interface UpdateRequest {
  action: ENSAction;
  ipfsHash?: string;
  key?: string;
  value?: string;
  avatar?: string;
  description?: string;
  records?: BatchUpdateOptions;
  label?: string;
  ownerAddress?: string;
  domain?: string;
}

interface APIResponse {
  success: boolean;
  action?: string;
  domain?: string;
  data?: unknown;
  error?: string;
  code?: string;
  details?: string;
  timestamp: string;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  defaultDomain: process.env.NEXT_PUBLIC_ENS_DOMAIN || 'mcpvot.eth',
  ethereumRpc: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
  privateKey: process.env.ENS_OWNER_PRIVATE_KEY,
  apiKey: process.env.ENS_API_KEY, // Optional API key for write operations
};

// =============================================================================
// RATE LIMITING (FIXED: with cleanup)
// =============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT = { 
  maxRequests: 10, 
  windowMs: 60000,
  cleanupInterval: 300000, // Clean up every 5 minutes
};

let lastCleanup = Date.now();

function cleanupRateLimitMap(): void {
  const now = Date.now();
  if (now - lastCleanup < RATE_LIMIT.cleanupInterval) {
    return;
  }
  
  // Remove expired entries
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
  
  lastCleanup = now;
  console.log(`[ENS API] Rate limit cleanup: ${rateLimitMap.size} entries remaining`);
}

function checkRateLimit(ip: string): boolean {
  cleanupRateLimitMap();
  
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return true;
  }
  
  if (record.count >= RATE_LIMIT.maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

// =============================================================================
// AUTHENTICATION
// =============================================================================

function validateAuth(request: NextRequest): { valid: boolean; error?: string } {
  // If no API key is configured, allow all requests (backward compatible)
  if (!CONFIG.apiKey) {
    return { valid: true };
  }
  
  // Check for API key in header
  const authHeader = request.headers.get('x-api-key') || request.headers.get('authorization');
  
  if (!authHeader) {
    return { valid: false, error: 'Missing API key. Provide x-api-key header.' };
  }
  
  // Support both "Bearer <key>" and just "<key>"
  const providedKey = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;
  
  if (providedKey !== CONFIG.apiKey) {
    return { valid: false, error: 'Invalid API key' };
  }
  
  return { valid: true };
}

// =============================================================================
// VALIDATION
// =============================================================================

function validateConfig(): { valid: boolean; error?: string } {
  if (!CONFIG.privateKey) {
    return { valid: false, error: 'ENS_OWNER_PRIVATE_KEY not configured' };
  }
  
  if (!isValidPrivateKey(CONFIG.privateKey)) {
    return { valid: false, error: 'ENS_OWNER_PRIVATE_KEY is invalid (expected 64 hex chars)' };
  }
  
  return { valid: true };
}

function createResponse(data: Partial<APIResponse>, status: number = 200): NextResponse {
  return NextResponse.json(
    {
      ...data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

// =============================================================================
// POST HANDLER - Write Operations
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    if (!checkRateLimit(ip)) {
      return createResponse({
        success: false,
        error: 'Rate limit exceeded',
        code: 'RATE_LIMITED',
        details: 'Maximum 10 requests per minute. Try again later.',
      }, 429);
    }

    // Authentication for write operations
    const authCheck = validateAuth(request);
    if (!authCheck.valid) {
      return createResponse({
        success: false,
        error: authCheck.error,
        code: 'UNAUTHORIZED',
      }, 401);
    }

    // Check configuration for write operations
    const configCheck = validateConfig();
    if (!configCheck.valid) {
      return createResponse({
        success: false,
        error: configCheck.error,
        code: 'CONFIG_ERROR',
        details: 'Please set ENS_OWNER_PRIVATE_KEY in environment variables (64 hex chars)',
      }, 500);
    }

    // Parse request body
    let body: UpdateRequest;
    try {
      body = await request.json();
    } catch {
      return createResponse({
        success: false,
        error: 'Invalid JSON body',
        code: 'INVALID_REQUEST',
      }, 400);
    }

    const { action } = body;

    if (!action) {
      return createResponse({
        success: false,
        error: 'Missing action parameter',
        code: 'INVALID_REQUEST',
        details: 'Supported: setContenthash, setText, setAvatar, setDescription, batchUpdate, createSubdomain, estimateGas',
      }, 400);
    }

    // Validate domain
    const domain = body.domain || CONFIG.defaultDomain;
    if (!isValidENSName(domain)) {
      return createResponse({
        success: false,
        error: `Invalid ENS domain: ${domain}`,
        code: 'INVALID_DOMAIN',
      }, 400);
    }

    // Create ENS client
    const client = createENSClient(domain, CONFIG.privateKey!, CONFIG.ethereumRpc);

    console.log(`[ENS API] ${action} on ${domain} from ${ip} - started`);

    // Handle actions
    switch (action) {
      case 'setContenthash': {
        if (!body.ipfsHash) {
          return createResponse({
            success: false,
            error: 'Missing ipfsHash parameter',
            code: 'INVALID_REQUEST',
          }, 400);
        }

        if (!isValidCID(body.ipfsHash)) {
          return createResponse({
            success: false,
            error: `Invalid IPFS CID format: ${body.ipfsHash}`,
            code: 'INVALID_CID',
            details: 'Expected Qm... (CIDv0, 46 chars) or bafy... (CIDv1, 59+ chars)',
          }, 400);
        }

        const result = await client.setContenthash(body.ipfsHash);
        
        console.log(`[ENS API] setContenthash completed in ${Date.now() - startTime}ms`);
        
        return createResponse({
          success: result.success,
          action: 'setContenthash',
          domain,
          data: {
            ipfsHash: body.ipfsHash,
            ipfsUrl: `ipfs://${body.ipfsHash}`,
            ensLimoUrl: `https://${domain}.limo`,
            gatewayUrl: `https://ipfs.io/ipfs/${body.ipfsHash}`,
            txHash: result.hash,
            gasUsed: result.gasUsed?.toString(),
            totalCost: result.totalCost,
            blockNumber: result.blockNumber?.toString(),
          },
        });
      }

      case 'setText': {
        if (!body.key || body.value === undefined) {
          return createResponse({
            success: false,
            error: 'Missing key or value parameter',
            code: 'INVALID_REQUEST',
          }, 400);
        }

        const result = await client.setText(body.key, body.value);
        
        return createResponse({
          success: result.success,
          action: 'setText',
          domain,
          data: {
            key: body.key,
            value: body.value,
            txHash: result.hash,
            gasUsed: result.gasUsed?.toString(),
            totalCost: result.totalCost,
          },
        });
      }

      case 'setAvatar': {
        if (!body.avatar) {
          return createResponse({
            success: false,
            error: 'Missing avatar parameter',
            code: 'INVALID_REQUEST',
          }, 400);
        }

        const result = await client.setText(TEXT_RECORD_KEYS.AVATAR, body.avatar);
        
        return createResponse({
          success: result.success,
          action: 'setAvatar',
          domain,
          data: {
            avatar: body.avatar,
            txHash: result.hash,
            gasUsed: result.gasUsed?.toString(),
            totalCost: result.totalCost,
          },
        });
      }

      case 'setDescription': {
        if (!body.description) {
          return createResponse({
            success: false,
            error: 'Missing description parameter',
            code: 'INVALID_REQUEST',
          }, 400);
        }

        const result = await client.setText(TEXT_RECORD_KEYS.DESCRIPTION, body.description);
        
        return createResponse({
          success: result.success,
          action: 'setDescription',
          domain,
          data: {
            description: body.description,
            txHash: result.hash,
            gasUsed: result.gasUsed?.toString(),
            totalCost: result.totalCost,
          },
        });
      }

      case 'batchUpdate': {
        if (!body.records || Object.keys(body.records).length === 0) {
          return createResponse({
            success: false,
            error: 'Missing or empty records parameter',
            code: 'INVALID_REQUEST',
          }, 400);
        }

        if (body.records.contenthash && !isValidCID(body.records.contenthash)) {
          return createResponse({
            success: false,
            error: `Invalid IPFS CID in records: ${body.records.contenthash}`,
            code: 'INVALID_CID',
          }, 400);
        }

        const result = await client.batchUpdate(body.records);
        
        return createResponse({
          success: result.success,
          action: 'batchUpdate',
          domain,
          data: {
            recordsUpdated: Object.keys(body.records),
            recordCount: Object.keys(body.records).length,
            txHash: result.hash,
            gasUsed: result.gasUsed?.toString(),
            totalCost: result.totalCost,
          },
        });
      }

      case 'createSubdomain': {
        if (!body.label) {
          return createResponse({
            success: false,
            error: 'Missing label parameter',
            code: 'INVALID_REQUEST',
          }, 400);
        }

        if (!body.ownerAddress) {
          return createResponse({
            success: false,
            error: 'Missing ownerAddress parameter',
            code: 'INVALID_REQUEST',
          }, 400);
        }

        if (!/^0x[a-fA-F0-9]{40}$/.test(body.ownerAddress)) {
          return createResponse({
            success: false,
            error: 'Invalid ownerAddress format',
            code: 'INVALID_ADDRESS',
            details: 'Expected 0x-prefixed 40 character hex string',
          }, 400);
        }

        const result = await client.createSubdomain(
          body.label.toLowerCase(), 
          body.ownerAddress as `0x${string}`
        );
        
        const subdomain = `${body.label.toLowerCase()}.${domain}`;
        
        return createResponse({
          success: result.success,
          action: 'createSubdomain',
          domain,
          data: {
            subdomain,
            owner: body.ownerAddress,
            ensLimoUrl: `https://${subdomain}.limo`,
            txHash: result.hash,
            gasUsed: result.gasUsed?.toString(),
            totalCost: result.totalCost,
          },
        });
      }

      case 'estimateGas': {
        const operation = body.ipfsHash ? 'setContenthash' : 
                         body.key ? 'setText' : 
                         body.label ? 'createSubdomain' : null;
        
        if (!operation) {
          return createResponse({
            success: false,
            error: 'Provide ipfsHash, key+value, or label+ownerAddress for gas estimation',
            code: 'INVALID_REQUEST',
          }, 400);
        }

        const estimate = await client.estimateGas(
          operation as 'setContenthash' | 'setText' | 'createSubdomain',
          {
            cid: body.ipfsHash,
            key: body.key,
            value: body.value,
            label: body.label,
            owner: body.ownerAddress as `0x${string}`,
          }
        );

        return createResponse({
          success: true,
          action: 'estimateGas',
          domain,
          data: {
            operation,
            gasLimit: estimate.gasLimit.toString(),
            gasPrice: estimate.gasPrice.toString(),
            gasPriceGwei: (Number(estimate.gasPrice) / 1e9).toFixed(2),
            estimatedCostEth: estimate.estimatedCost,
          },
        });
      }

      default:
        return createResponse({
          success: false,
          error: `Unknown action: ${action}`,
          code: 'INVALID_ACTION',
          details: 'Supported: setContenthash, setText, setAvatar, setDescription, batchUpdate, createSubdomain, estimateGas',
        }, 400);
    }

  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(`[ENS API] Error after ${duration}ms:`, error);
    
    if (errorMessage.includes('insufficient funds')) {
      return createResponse({
        success: false,
        error: 'Insufficient ETH for gas',
        code: 'INSUFFICIENT_FUNDS',
        details: 'The ENS owner wallet needs more ETH on Mainnet',
      }, 400);
    }
    
    if (errorMessage.includes('execution reverted') || errorMessage.includes('Transaction reverted')) {
      return createResponse({
        success: false,
        error: 'Transaction reverted',
        code: 'TX_REVERTED',
        details: 'Check wallet permissions and domain ownership',
      }, 400);
    }

    if (errorMessage.includes('simulation failed')) {
      return createResponse({
        success: false,
        error: 'Transaction simulation failed',
        code: 'SIMULATION_FAILED',
        details: errorMessage,
      }, 400);
    }

    if (errorMessage.includes('read-only')) {
      return createResponse({
        success: false,
        error: 'Client in read-only mode',
        code: 'READ_ONLY',
        details: 'Configure ENS_OWNER_PRIVATE_KEY for write operations',
      }, 403);
    }

    return createResponse({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: errorMessage,
    }, 500);
  }
}

// =============================================================================
// GET HANDLER - Read Operations (no auth required)
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') || CONFIG.defaultDomain;
    const action = searchParams.get('action') || 'profile';

    if (!isValidENSName(domain)) {
      return createResponse({
        success: false,
        error: `Invalid ENS domain: ${domain}`,
        code: 'INVALID_DOMAIN',
      }, 400);
    }

    // Create read-only client
    const client = createENSClient(domain, undefined, CONFIG.ethereumRpc);

    switch (action) {
      case 'profile': {
        const profile = await client.getProfile();
        const gasPrice = await client.getGasPrice();

        return createResponse({
          success: true,
          action: 'getProfile',
          domain,
          data: {
            ...profile,
            gas: {
              currentPriceWei: gasPrice.toString(),
              currentPriceGwei: (Number(gasPrice) / 1e9).toFixed(2),
              estimatedSetContenthash: `~${(Number(gasPrice) * 60000 / 1e18).toFixed(6)} ETH`,
              estimatedSetText: `~${(Number(gasPrice) * 50000 / 1e18).toFixed(6)} ETH`,
              estimatedBatchUpdate: `~${(Number(gasPrice) * 150000 / 1e18).toFixed(6)} ETH`,
            },
          },
        });
      }

      case 'contenthash': {
        const [contenthash, rawContenthash] = await Promise.all([
          client.getContenthash(),
          client.getRawContenthash(),
        ]);
        
        return createResponse({
          success: true,
          action: 'getContenthash',
          domain,
          data: {
            ipfsCid: contenthash,
            rawContenthash,
            ipfsUrl: contenthash ? `ipfs://${contenthash}` : null,
            gatewayUrl: contenthash ? `https://ipfs.io/ipfs/${contenthash}` : null,
          },
        });
      }

      case 'owner': {
        const owner = await client.getOwner();
        
        return createResponse({
          success: true,
          action: 'getOwner',
          domain,
          data: { owner },
        });
      }

      case 'text': {
        const key = searchParams.get('key');
        if (!key) {
          return createResponse({
            success: false,
            error: 'Missing key parameter',
            code: 'INVALID_REQUEST',
          }, 400);
        }

        const value = await client.getText(key);
        
        return createResponse({
          success: true,
          action: 'getText',
          domain,
          data: { key, value },
        });
      }

      default:
        return createResponse({
          success: false,
          error: `Unknown action: ${action}`,
          code: 'INVALID_ACTION',
          details: 'Supported GET actions: profile, contenthash, owner, text',
        }, 400);
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[ENS API] GET Error:', error);
    
    return createResponse({
      success: false,
      error: 'Failed to fetch ENS data',
      code: 'FETCH_ERROR',
      details: errorMessage,
    }, 500);
  }
}
