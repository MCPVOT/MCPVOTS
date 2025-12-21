import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAddress } from 'viem';

// Allow disabling the security middleware during integration or dev via env var
const DISABLE_SECURITY_MIDDLEWARE = process.env.DISABLE_SECURITY_MIDDLEWARE === 'true' || process.env.DISABLE_SECURITY === 'true';

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

// Security configuration
const SECURITY_CONFIG = {
  MAX_REQUEST_SIZE: 1024 * 1024, // 1MB
  MAX_INPUT_LENGTH: 1024,
  ALLOWED_CONTENT_TYPES: ['application/json', 'text/plain'],
  BLOCKED_PATTERNS: /[<>"';()]/,
  SENSITIVE_HEADERS: ['authorization', 'x-api-key', 'cookie']
};

export interface SecurityContext {
  ip: string;
  userAgent: string;
  requestId: string;
  timestamp: number;
}

export class SecurityError extends Error {
  constructor(message: string, public code: string, public statusCode: number = 400) {
    super(message);
    this.name = 'SecurityError';
  }
}

// Input validation
export function validateInput(input: unknown, fieldName: string = 'input'): string {
  if (DISABLE_SECURITY_MIDDLEWARE) {
    const str = String(input ?? '').trim();
    if (str.length === 0) throw new SecurityError(`${fieldName} cannot be empty`, 'EMPTY_INPUT');
    return str;
  }
  if (input === null || input === undefined) {
    throw new SecurityError(`${fieldName} is required`, 'MISSING_INPUT');
  }
  
  const str = String(input).trim();
  
  if (str.length === 0) {
    throw new SecurityError(`${fieldName} cannot be empty`, 'EMPTY_INPUT');
  }
  
  if (str.length > SECURITY_CONFIG.MAX_INPUT_LENGTH) {
    throw new SecurityError(`${fieldName} exceeds maximum length`, 'INPUT_TOO_LONG');
  }
  
  if (SECURITY_CONFIG.BLOCKED_PATTERNS.test(str)) {
    throw new SecurityError(`${fieldName} contains invalid characters`, 'INVALID_CHARS');
  }
  
  return str;
}

// Ethereum address validation
export function validateEthereumAddress(address: string): string {
  if (DISABLE_SECURITY_MIDDLEWARE) {
    return address;
  }
  try {
    return getAddress(address);
  } catch {
    throw new SecurityError('Invalid Ethereum address format', 'INVALID_ADDRESS');
  }
}

// Rate limiting
export function checkRateLimit(identifier: string): boolean {
  if (DISABLE_SECURITY_MIDDLEWARE) return true;
  const now = Date.now();
  const windowStart = Math.floor(now / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS;
  const key = `${identifier}:${windowStart}`;
  
  const entry = rateLimitStore.get(key);
  
  if (!entry) {
    rateLimitStore.set(key, { count: 1, windowStart });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Security headers
export function addSecurityHeaders(): Record<string, string> {
  if (DISABLE_SECURITY_MIDDLEWARE) return {};
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
    'X-RateLimit-Window': String(RATE_LIMIT_WINDOW_MS)
  };
}

// Request context extraction
export function extractSecurityContext(req: NextRequest): SecurityContext {
  if (DISABLE_SECURITY_MIDDLEWARE) {
    const requestId = req.headers.get('x-request-id') || crypto.randomBytes(16).toString('hex');
    return { ip: '0.0.0.0', userAgent: req.headers.get('user-agent') || 'unknown', requestId, timestamp: Date.now() };
  }
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = (forwardedFor?.split(',')[0] || realIp || req.ip || 'unknown').trim();
  
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const requestId = req.headers.get('x-request-id') || crypto.randomBytes(16).toString('hex');
  
  return {
    ip,
    userAgent,
    requestId,
    timestamp: Date.now()
  };
}

// Enhanced rate limiting with IP tracking
export function checkAdvancedRateLimit(ctx: SecurityContext, limit: number = RATE_LIMIT_MAX_REQUESTS): boolean {
  if (DISABLE_SECURITY_MIDDLEWARE) return true;
  const now = Date.now();
  const key = `${ctx.ip}:${Math.floor(now / RATE_LIMIT_WINDOW_MS)}`;
  
  const entry = rateLimitStore.get(key);
  
  if (!entry) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return true;
  }
  
  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return true;
  }
  
  if (entry.count >= limit) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Security middleware
export function withSecurity<T extends Record<string, object>>(
  handler: (req: NextRequest, ctx: T & SecurityContext) => Promise<Response>
) {
  return async (req: NextRequest, ctx: T): Promise<Response> => {
    if (DISABLE_SECURITY_MIDDLEWARE) {
      // Bypass all security checks and simply return the handler's response
      try {
        const res = await handler(req, { ...ctx, ...extractSecurityContext(req) } as T & SecurityContext);
        return res;
      } catch (err) {
        console.warn('[Security] Middleware bypass active; handler error:', err);
        throw err;
      }
    }
    try {
      const securityCtx = extractSecurityContext(req);
      
      // Check rate limiting
      if (!checkAdvancedRateLimit(securityCtx)) {
        return new NextResponse(JSON.stringify({
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
        }), {
          status: 429,
          headers: {
            ...addSecurityHeaders(),
            'Retry-After': String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000))
          }
        });
      }
      
      // Validate content type for POST requests
      if (req.method === 'POST') {
        const contentType = req.headers.get('content-type');
        if (!contentType || !SECURITY_CONFIG.ALLOWED_CONTENT_TYPES.some(type => contentType.includes(type))) {
          return new NextResponse(JSON.stringify({
            error: 'Unsupported content type',
            code: 'UNSUPPORTED_CONTENT_TYPE'
          }), {
            status: 415,
            headers: addSecurityHeaders()
          });
        }
      }
      
      // Add security headers to response
      const response = await handler(req, { ...ctx, ...securityCtx });
      
      // Clone response to modify headers
      const responseClone = new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
      
      Object.entries(addSecurityHeaders()).forEach(([key, value]) => {
        responseClone.headers.set(key, value);
      });
      
      return responseClone;
      
    } catch (error) {
      if (error instanceof SecurityError) {
        return new NextResponse(JSON.stringify({
          error: error.message,
          code: error.code,
          requestId: extractSecurityContext(req).requestId
        }), {
          status: error.statusCode,
          headers: addSecurityHeaders()
        });
      }
      
      console.error('[Security] Unexpected error:', error);
      return new NextResponse(JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }), {
        status: 500,
        headers: addSecurityHeaders()
      });
    }
  };
}

// Payment amount validation
export function validatePaymentAmount(amount: number, maxAmount: number = 1000): number {
  if (DISABLE_SECURITY_MIDDLEWARE) {
    if (!Number.isFinite(amount) || amount <= 0) throw new SecurityError('Invalid payment amount', 'INVALID_AMOUNT');
    return amount;
  }
  const usdcAmount = Number(amount);
  
  if (!Number.isFinite(usdcAmount) || usdcAmount <= 0) {
    throw new SecurityError('Invalid payment amount', 'INVALID_AMOUNT');
  }
  
  if (usdcAmount > maxAmount * 1000000) { // Convert to USDC atomic units
    throw new SecurityError('Payment amount exceeds maximum', 'AMOUNT_TOO_HIGH');
  }
  
  return usdcAmount;
}

// Nonce validation for replay attack prevention
const usedNonces = new Set<string>();
const NONCE_TTL_MS = 300000; // 5 minutes
const nonceTimestamps = new Map<string, number>();

export function validateNonce(nonce: string): void {
  if (DISABLE_SECURITY_MIDDLEWARE) return;
  if (usedNonces.has(nonce)) {
    throw new SecurityError('Replay attack detected - nonce already used', 'REPLAY_ATTACK');
  }
  
  usedNonces.add(nonce);
  nonceTimestamps.set(nonce, Date.now());
  
  // Clean up old nonces periodically
  if (usedNonces.size > 1000) {
    const now = Date.now();
    for (const [nonce, timestamp] of nonceTimestamps) {
      if (now - timestamp > NONCE_TTL_MS) {
        usedNonces.delete(nonce);
        nonceTimestamps.delete(nonce);
      }
    }
  }
}

const securityExports = {
  validateInput,
  validateEthereumAddress,
  checkRateLimit,
  addSecurityHeaders,
  withSecurity,
  validatePaymentAmount,
  validateNonce,
  SecurityError
};

export default securityExports;