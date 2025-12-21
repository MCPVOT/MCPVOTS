/**
 * x402 VOT Facilitator - Mint Queue System
 * 
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  QUEUE SYSTEM FOR RATE-LIMITED API PROCESSING                            ║
 * ║                                                                          ║
 * ║  "8 MCPVOTs ahead of you in the queue..."                               ║
 * ║                                                                          ║
 * ║  Features:                                                               ║
 * ║  - FIFO queue for mint requests                                          ║
 * ║  - Processes 1 at a time (API rate limit compliance)                     ║
 * ║  - Real-time position tracking                                           ║
 * ║  - WebSocket updates for queue position                                  ║
 * ║  - Automatic retry on failure                                            ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { EventEmitter } from 'events';

// Queue Configuration
export const QUEUE_CONFIG = {
  MAX_QUEUE_SIZE: 100,           // Maximum pending requests
  PROCESS_INTERVAL_MS: 3000,     // 3 seconds between processing (API rate limit)
  MAX_RETRIES: 3,                // Max retry attempts
  RETRY_DELAY_MS: 5000,          // 5 second retry delay
  QUEUE_TIMEOUT_MS: 300000,      // 5 minute timeout per request
  CONCURRENT_LIMIT: 1,           // Process 1 at a time
};

// Queue Item Status
export type QueueStatus = 
  | 'pending'      // Waiting in queue
  | 'processing'   // Currently being processed
  | 'completed'    // Successfully completed
  | 'failed'       // Failed after max retries
  | 'timeout'      // Timed out
  | 'cancelled';   // User cancelled

// Rarity types matching BeeperNFTV2.sol
export type RarityName = 'NODE' | 'VALIDATOR' | 'WHALE' | 'OG' | 'GENESIS' | 'ZZZ' | 'FOMO' | 'GM' | 'X402';

// Queue Item Interface
export interface MintQueueItem {
  id: string;                    // Unique queue ID
  userAddress: string;           // Wallet address
  ensName?: string;              // ENS name
  baseName?: string;             // Base name
  farcasterFid?: number;         // Farcaster ID
  svgContent: string;            // SVG to mint
  
  // Queue metadata
  position: number;              // Current position in queue
  status: QueueStatus;
  createdAt: number;             // Timestamp
  startedAt?: number;            // Processing started
  completedAt?: number;          // Completed timestamp
  
  // Result data
  tokenId?: number;
  transactionHash?: string;
  ipfsCid?: string;
  metadataCid?: string;
  votSent?: string;
  votBurned?: string;
  rarity?: RarityName;           // NFT rarity tier
  
  // Retry tracking
  retryCount: number;
  lastError?: string;
}

// Queue Statistics
export interface QueueStats {
  totalQueued: number;
  processing: number;
  completed: number;
  failed: number;
  avgWaitTimeMs: number;
  avgProcessTimeMs: number;
  estimatedWaitMs: number;
}

// Queue Event Types
export type QueueEventType = 
  | 'item-added'
  | 'item-processing'
  | 'item-completed'
  | 'item-failed'
  | 'position-updated'
  | 'queue-stats';

/**
 * x402 Mint Queue Manager
 * Singleton pattern for global queue management
 */
class MintQueueManager extends EventEmitter {
  private queue: MintQueueItem[] = [];
  private processing: MintQueueItem | null = null;
  private completedItems: MintQueueItem[] = [];
  private failedItems: MintQueueItem[] = [];
  private isProcessing = false;
  private processInterval: NodeJS.Timeout | null = null;
  
  // Stats tracking
  private totalProcessed = 0;
  private totalWaitTime = 0;
  private totalProcessTime = 0;

  constructor() {
    super();
    this.startProcessing();
  }

  /**
   * Add a new mint request to the queue
   */
  addToQueue(request: {
    userAddress: string;
    ensName?: string;
    baseName?: string;
    farcasterFid?: number;
    svgContent: string;
  }): MintQueueItem {
    // Check queue size limit
    if (this.queue.length >= QUEUE_CONFIG.MAX_QUEUE_SIZE) {
      throw new Error(`Queue is full (${QUEUE_CONFIG.MAX_QUEUE_SIZE} max). Please try again later.`);
    }

    // Check if user already has pending request
    const existingPending = this.queue.find(
      item => item.userAddress.toLowerCase() === request.userAddress.toLowerCase() &&
              item.status === 'pending'
    );
    if (existingPending) {
      throw new Error(`You already have a pending mint request (Position: ${existingPending.position})`);
    }

    const queueItem: MintQueueItem = {
      id: `mint-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      ...request,
      position: this.queue.length + 1,
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0,
    };

    this.queue.push(queueItem);
    this.emit('item-added', queueItem);
    this.updatePositions();

    console.log(`[MintQueue] Added to queue: ${queueItem.id} (Position: ${queueItem.position})`);
    
    return queueItem;
  }

  /**
   * Get current queue position for a user
   */
  getQueuePosition(userAddress: string): {
    found: boolean;
    position?: number;
    status?: QueueStatus;
    item?: MintQueueItem;
    aheadOfYou: number;
    estimatedWaitMs: number;
    message: string;
  } {
    const address = userAddress.toLowerCase();
    
    // Check if currently processing
    if (this.processing?.userAddress.toLowerCase() === address) {
      return {
        found: true,
        position: 0,
        status: 'processing',
        item: this.processing,
        aheadOfYou: 0,
        estimatedWaitMs: QUEUE_CONFIG.PROCESS_INTERVAL_MS,
        message: '🔄 Your MCPVOT is being minted now...',
      };
    }
    
    // Check queue
    const queueIndex = this.queue.findIndex(
      item => item.userAddress.toLowerCase() === address
    );
    
    if (queueIndex === -1) {
      // Check completed
      const completed = this.completedItems.find(
        item => item.userAddress.toLowerCase() === address
      );
      if (completed) {
        return {
          found: true,
          position: 0,
          status: 'completed',
          item: completed,
          aheadOfYou: 0,
          estimatedWaitMs: 0,
          message: `✅ Your MCPVOT #${completed.tokenId} was minted successfully!`,
        };
      }
      
      // Not found
      return {
        found: false,
        aheadOfYou: 0,
        estimatedWaitMs: 0,
        message: 'No pending mint request found for this address.',
      };
    }
    
    const item = this.queue[queueIndex];
    const aheadOfYou = queueIndex + (this.processing ? 1 : 0);
    const estimatedWaitMs = aheadOfYou * QUEUE_CONFIG.PROCESS_INTERVAL_MS;
    
    // Generate fun message based on position
    let message: string;
    if (aheadOfYou === 0) {
      message = '🎯 You\'re next! Preparing to mint...';
    } else if (aheadOfYou === 1) {
      message = '⏳ 1 MCPVOT ahead of you in the queue...';
    } else if (aheadOfYou <= 5) {
      message = `⏳ ${aheadOfYou} MCPVOTs ahead of you in the queue...`;
    } else if (aheadOfYou <= 10) {
      message = `📊 ${aheadOfYou} MCPVOTs ahead of you. Hang tight!`;
    } else {
      message = `🔢 Position ${item.position} in queue (${aheadOfYou} ahead). ETA: ~${Math.ceil(estimatedWaitMs / 60000)} min`;
    }
    
    return {
      found: true,
      position: item.position,
      status: item.status,
      item,
      aheadOfYou,
      estimatedWaitMs,
      message,
    };
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const avgWaitTime = this.totalProcessed > 0 
      ? this.totalWaitTime / this.totalProcessed 
      : QUEUE_CONFIG.PROCESS_INTERVAL_MS;
    const avgProcessTime = this.totalProcessed > 0
      ? this.totalProcessTime / this.totalProcessed
      : QUEUE_CONFIG.PROCESS_INTERVAL_MS;
    
    const pendingCount = this.queue.length + (this.processing ? 1 : 0);
    
    return {
      totalQueued: pendingCount,
      processing: this.processing ? 1 : 0,
      completed: this.completedItems.length,
      failed: this.failedItems.length,
      avgWaitTimeMs: Math.round(avgWaitTime),
      avgProcessTimeMs: Math.round(avgProcessTime),
      estimatedWaitMs: Math.round(pendingCount * avgProcessTime),
    };
  }

  /**
   * Get full queue state (for debugging/admin)
   */
  getQueueState(): {
    queue: MintQueueItem[];
    processing: MintQueueItem | null;
    recentCompleted: MintQueueItem[];
    stats: QueueStats;
  } {
    return {
      queue: [...this.queue],
      processing: this.processing,
      recentCompleted: this.completedItems.slice(-10), // Last 10
      stats: this.getStats(),
    };
  }

  /**
   * Cancel a pending request
   */
  cancelRequest(userAddress: string): boolean {
    const index = this.queue.findIndex(
      item => item.userAddress.toLowerCase() === userAddress.toLowerCase() &&
              item.status === 'pending'
    );
    
    if (index === -1) return false;
    
    const item = this.queue[index];
    item.status = 'cancelled';
    item.completedAt = Date.now();
    
    this.queue.splice(index, 1);
    this.updatePositions();
    
    console.log(`[MintQueue] Cancelled: ${item.id}`);
    return true;
  }

  /**
   * Start the queue processing loop
   */
  private startProcessing() {
    if (this.processInterval) return;
    
    this.processInterval = setInterval(() => {
      this.processNext();
    }, QUEUE_CONFIG.PROCESS_INTERVAL_MS);
    
    console.log('[MintQueue] Queue processor started');
  }

  /**
   * Process the next item in queue
   */
  private async processNext() {
    // Skip if already processing or queue empty
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    const item = this.queue.shift()!;
    this.processing = item;
    
    item.status = 'processing';
    item.startedAt = Date.now();
    
    this.emit('item-processing', item);
    this.updatePositions();
    
    console.log(`[MintQueue] Processing: ${item.id} (${item.userAddress})`);
    
    try {
      // Execute the actual mint
      const result = await this.executeMint(item);
      
      // Success!
      item.status = 'completed';
      item.completedAt = Date.now();
      item.tokenId = result.tokenId;
      item.transactionHash = result.transactionHash;
      item.ipfsCid = result.ipfsCid;
      item.metadataCid = result.metadataCid;
      item.votSent = result.votSent;
      item.votBurned = result.votBurned;
      item.rarity = result.rarity as RarityName;
      
      this.completedItems.push(item);
      
      // Update stats
      this.totalProcessed++;
      this.totalWaitTime += (item.startedAt! - item.createdAt);
      this.totalProcessTime += (item.completedAt - item.startedAt!);
      
      this.emit('item-completed', item);
      console.log(`[MintQueue] Completed: ${item.id} → Token #${item.tokenId} (${item.rarity})`);
      
    } catch (error) {
      item.lastError = error instanceof Error ? error.message : 'Unknown error';
      item.retryCount++;
      
      if (item.retryCount < QUEUE_CONFIG.MAX_RETRIES) {
        // Retry - add back to front of queue
        item.status = 'pending';
        this.queue.unshift(item);
        console.log(`[MintQueue] Retry ${item.retryCount}/${QUEUE_CONFIG.MAX_RETRIES}: ${item.id}`);
      } else {
        // Max retries - mark as failed
        item.status = 'failed';
        item.completedAt = Date.now();
        this.failedItems.push(item);
        this.emit('item-failed', item);
        console.error(`[MintQueue] Failed: ${item.id} - ${item.lastError}`);
      }
    } finally {
      this.processing = null;
      this.isProcessing = false;
      this.updatePositions();
    }
  }

  /**
   * Execute the actual mint operation
   * This calls the x402 facilitator logic
   */
  private async executeMint(item: MintQueueItem): Promise<{
    tokenId: number;
    transactionHash: string;
    ipfsCid: string;
    metadataCid: string;
    votSent: string;
    votBurned: string;
  }> {
    // Import dynamically to avoid circular dependencies
    const { processMintRequest } = await import('./mintExecutor');
    
    return processMintRequest({
      userAddress: item.userAddress,
      ensName: item.ensName,
      baseName: item.baseName,
      farcasterFid: item.farcasterFid,
      svgContent: item.svgContent,
    });
  }

  /**
   * Update position numbers after queue changes
   */
  private updatePositions() {
    this.queue.forEach((item, index) => {
      const newPosition = index + 1;
      if (item.position !== newPosition) {
        item.position = newPosition;
        this.emit('position-updated', item);
      }
    });
    
    this.emit('queue-stats', this.getStats());
  }

  /**
   * Clean up old completed/failed items
   */
  cleanup() {
    const cutoff = Date.now() - 3600000; // 1 hour
    
    this.completedItems = this.completedItems.filter(
      item => item.completedAt && item.completedAt > cutoff
    );
    this.failedItems = this.failedItems.filter(
      item => item.completedAt && item.completedAt > cutoff
    );
  }

  /**
   * Stop the queue processor
   */
  stop() {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
      console.log('[MintQueue] Queue processor stopped');
    }
  }
}

// Singleton instance
let queueManager: MintQueueManager | null = null;

export function getMintQueue(): MintQueueManager {
  if (!queueManager) {
    queueManager = new MintQueueManager();
  }
  return queueManager;
}

// Export types for API routes
export type { MintQueueManager };
