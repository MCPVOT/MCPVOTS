import { SecurityError, validateEthereumAddress, validateNonce, validatePaymentAmount } from '@/lib/security';
import crypto from 'crypto';
import { decodePayment } from 'x402/schemes';
import type { ExactEvmPayload, PaymentPayload } from 'x402/types';

// x402-specific security configuration
const X402_SECURITY_CONFIG = {
  MAX_PAYMENT_AMOUNT: 1000, // $1000 maximum per transaction
  MIN_PAYMENT_AMOUNT: 0.01, // $0.01 minimum
  ALLOWED_TOKENS: ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'], // USDC on Base
  BLOCKED_ADDRESSES: new Set([
    '0x0000000000000000000000000000000000000000',
    '0x0000000000000000000000000000000000000001'
  ]),
  WHITELIST_ENABLED: process.env.X402_WHITELIST_ENABLED === 'true',
  REQUIRE_KYC: process.env.X402_REQUIRE_KYC === 'true',
  SUSPICIOUS_PATTERN_THRESHOLD: 5 // transactions per hour
};

// Suspicious activity tracking (placeholder for future enhancements)
// const suspiciousActivity = new Map<string, { count: number; lastSeen: number }>();
const transactionHistory = new Map<string, Array<{ timestamp: number; amount: number; status: string }>>();

export interface X402SecurityContext {
  payer: string;
  amount: number;
  token: string;
  nonce: string;
  timestamp: number;
  ip: string;
  userAgent: string;
  riskScore: number;
  flags: string[];
}

export class X402SecurityError extends SecurityError {
  constructor(message: string, code: string, public payer?: string, public details?: Record<string, unknown>) {
    super(message, code);
    this.name = 'X402SecurityError';
  }
}

// Risk scoring system
function calculateRiskScore(context: Omit<X402SecurityContext, 'riskScore' | 'flags'>): { score: number; flags: string[] } {
  const flags: string[] = [];
  let score = 0;

  // High risk: Blocked addresses
  if (X402_SECURITY_CONFIG.BLOCKED_ADDRESSES.has(context.payer.toLowerCase())) {
    score += 90;
    flags.push('BLOCKED_ADDRESS');
  }

  // Medium risk: Large amounts
  if (context.amount > 500) {
    score += 30;
    flags.push('LARGE_AMOUNT');
  } else if (context.amount > 100) {
    score += 15;
    flags.push('MEDIUM_AMOUNT');
  }

  // Medium risk: Unusual hours (UTC)
  const hour = new Date(context.timestamp).getUTCHours();
  if (hour < 6 || hour > 22) {
    score += 10;
    flags.push('UNUSUAL_HOUR');
  }

  // High risk: High frequency
  const recentTransactions = getRecentTransactions(context.payer);
  if (recentTransactions.length > 10) {
    score += 50;
    flags.push('HIGH_FREQUENCY');
  } else if (recentTransactions.length > 5) {
    score += 25;
    flags.push('MEDIUM_FREQUENCY');
  }

  // Medium risk: New IP pattern
  const payerHistory = transactionHistory.get(context.payer);
  if (payerHistory && !payerHistory.some(t => t.toString().includes(context.ip))) {
    score += 15;
    flags.push('NEW_IP_PATTERN');
  }

  // Low risk: Small amounts
  if (context.amount < 1) {
    score += 5;
    flags.push('SMALL_AMOUNT');
  }

  return { score, flags };
}

// Get recent transactions for frequency analysis
function getRecentTransactions(payer: string, hours: number = 1): Array<{ timestamp: number; amount: number; status: string }> {
  const history = transactionHistory.get(payer) || [];
  const cutoff = Date.now() - (hours * 60 * 60 * 1000);
  return history.filter(t => t.timestamp > cutoff);
}

// Add transaction to history
function recordTransaction(payer: string, transaction: { timestamp: number; amount: number; status: string }): void {
  if (!transactionHistory.has(payer)) {
    transactionHistory.set(payer, []);
  }
  
  const history = transactionHistory.get(payer)!;
  history.push(transaction);
  
  // Keep only last 100 transactions per payer
  if (history.length > 100) {
    history.splice(0, history.length - 100);
  }
}

// Validate x402 payment payload with enhanced security
export function validateX402Payment(payload: PaymentPayload | ExactEvmPayload, ip: string, userAgent: string): X402SecurityContext {
  try {
    // Basic x402 validation
    const decoded = decodePayment(payload);
    
    // Extract payment details
    const payer = validateEthereumAddress(decoded.payer);
    const amount = Number(decoded.amount);
    const token = decoded.tokenContract || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
    const nonce = decoded.nonce || decoded.permit?.nonce?.toString() || '';

    // Enhanced amount validation
    const validatedAmount = validatePaymentAmount(amount, X402_SECURITY_CONFIG.MAX_PAYMENT_AMOUNT);
    
    if (validatedAmount < X402_SECURITY_CONFIG.MIN_PAYMENT_AMOUNT * 1000000) {
      throw new X402SecurityError(
        `Payment amount below minimum threshold of $${X402_SECURITY_CONFIG.MIN_PAYMENT_AMOUNT}`,
        'AMOUNT_TOO_LOW',
        payer
      );
    }

    // Token validation
    if (!X402_SECURITY_CONFIG.ALLOWED_TOKENS.includes(token)) {
      throw new X402SecurityError(
        'Unsupported token contract',
        'UNSUPPORTED_TOKEN',
        payer,
        { token }
      );
    }

    // Nonce validation for replay attack prevention
    if (nonce) {
      try {
        validateNonce(nonce);
      } catch {
        throw new X402SecurityError(
          'Replay attack detected or invalid nonce',
          'REPLAY_ATTACK',
          payer,
          { nonce }
        );
      }
    }

    // Address blacklist check
    if (X402_SECURITY_CONFIG.BLOCKED_ADDRESSES.has(payer.toLowerCase())) {
      throw new X402SecurityError(
        'Payment from blocked address',
        'BLOCKED_ADDRESS',
        payer
      );
    }

    // Whitelist validation (if enabled)
    if (X402_SECURITY_CONFIG.WHITELIST_ENABLED) {
      // In production, this would check against a database or external service
      const isWhitelisted = process.env.X402_WHITELIST?.split(',').map(a => a.trim().toLowerCase()).includes(payer.toLowerCase());
      if (!isWhitelisted) {
        throw new X402SecurityError(
          'Address not in whitelist',
          'NOT_WHITELISTED',
          payer
        );
      }
    }

    // KYC validation (if required)
    if (X402_SECURITY_CONFIG.REQUIRE_KYC) {
      // In production, this would integrate with a KYC provider
      const kycStatus = process.env.X402_KYC_STATUS?.split(',').find(s => s.startsWith(payer.toLowerCase()));
      if (!kycStatus || !kycStatus.endsWith(':verified')) {
        throw new X402SecurityError(
          'KYC verification required',
          'KYC_REQUIRED',
          payer
        );
      }
    }

    // Risk assessment
    const timestamp = Date.now();
    const riskAssessment = calculateRiskScore({ payer, amount: validatedAmount / 1000000, token, nonce, timestamp, ip, userAgent });
    
    // Record transaction attempt
    recordTransaction(payer, { timestamp, amount: validatedAmount, status: 'pending' });

    // High risk transactions
    if (riskAssessment.score >= 70) {
      throw new X402SecurityError(
        'Transaction flagged as high risk',
        'HIGH_RISK_TRANSACTION',
        payer,
        { riskScore: riskAssessment.score, flags: riskAssessment.flags }
      );
    }

    // Medium risk transactions (log but allow)
    if (riskAssessment.score >= 30) {
      console.warn('[x402] Medium risk transaction:', {
        payer,
        amount: validatedAmount,
        riskScore: riskAssessment.score,
        flags: riskAssessment.flags,
        ip,
        userAgent
      });
    }

    return {
      payer,
      amount: validatedAmount,
      token,
      nonce,
      timestamp,
      ip,
      userAgent,
      riskScore: riskAssessment.score,
      flags: riskAssessment.flags
    };

  } catch (err) {
    if (err instanceof X402SecurityError) {
      throw err;
    }
    
    if (err instanceof SecurityError) {
      throw new X402SecurityError(
        err.message,
        err.code,
        undefined,
        { originalError: err.message }
      );
    }
    
    throw new X402SecurityError(
      'Invalid payment payload',
      'INVALID_PAYLOAD',
      undefined,
      { error: err instanceof Error ? err.message : String(err) }
    );
  }
}

// Generate secure transaction ID
export function generateTransactionId(payer: string, amount: number, timestamp: number): string {
  const data = `${payer}:${amount}:${timestamp}:${process.env.TRANSACTION_SECRET || 'default'}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
}

// Validate transaction signature
export function validateTransactionSignature(transactionId: string, signature: string, payer: string): boolean {
  try {
    const expectedSignature = crypto.createHmac('sha256', process.env.SIGNATURE_SECRET || 'default').update(transactionId + payer).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
  } catch {
    return false;
  }
}

// Monitor for suspicious patterns
export function checkSuspiciousPatterns(payer: string): { isSuspicious: boolean; reason?: string } {
  const recent = getRecentTransactions(payer, 24); // Last 24 hours
  
  // Check for rapid transactions
  const rapidTransactions = recent.filter(t => 
    t.timestamp > Date.now() - (10 * 60 * 1000) && // Last 10 minutes
    t.status === 'success'
  );
  
  if (rapidTransactions.length > 20) {
    return { isSuspicious: true, reason: 'Too many transactions in short time' };
  }
  
  // Check for amount patterns (e.g., always $99.99)
  const amounts = [...new Set(recent.map(t => t.amount))];
  if (amounts.length === 1 && amounts[0] > 50 * 1000000) {
    return { isSuspicious: true, reason: 'Suspicious fixed amount pattern' };
  }
  
  return { isSuspicious: false };
}

// Security audit logging
export function logSecurityEvent(event: {
  type: string;
  payer?: string;
  amount?: number;
  ip: string;
  userAgent: string;
  details?: Record<string, unknown>;
  riskScore?: number;
}): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event: event.type,
    payer: event.payer,
    amount: event.amount,
    ip: event.ip,
    userAgent: event.userAgent,
    riskScore: event.riskScore,
    details: event.details,
    sessionId: crypto.randomBytes(8).toString('hex')
  };
  
  console.info('[x402-security] Security event:', JSON.stringify(logEntry));
  
  // In production, this would be sent to a SIEM or security monitoring service
  // await sendToSecurityMonitoring(logEntry);
}

const x402SecurityExports = {
  validateX402Payment,
  generateTransactionId,
  validateTransactionSignature,
  checkSuspiciousPatterns,
  logSecurityEvent,
  X402SecurityError,
  recordTransaction,
  getRecentTransactions
};

export default x402SecurityExports;