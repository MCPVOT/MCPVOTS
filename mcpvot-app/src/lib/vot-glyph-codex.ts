/**
 * VOT Glyph Codex - Sumerian Cuneiform Glyphs for MCPVOT
 * 
 * These are the official MCPVOT glyphs from alien-glyph-codex.json
 * Each glyph has meaning in the x402/OTC/Agentic ecosystem
 */

// Import the codex JSON
import codexData from '@/data/alien-glyph-codex.json';

export interface GlyphEntry {
  id: string;
  glyph: string;
  label: string;
  transliteration: string;
  meaning: string;
  tone: 'cyan' | 'amber' | 'magenta' | 'emerald';
}

// Type the imported data
export const GLYPH_CODEX: GlyphEntry[] = codexData as GlyphEntry[];

// Create a lookup map by ID
export const GLYPHS = Object.fromEntries(
  GLYPH_CODEX.map(entry => [entry.id, entry.glyph])
) as Record<string, string>;

// Named exports for common glyphs used in UI
export const VOT_GLYPHS = {
  // Core tokens/protocols
  vot: '𒁹',           // VU-TAR - Value vector
  x402: '𒇻',          // AK-SU - Prime facilitator spine
  mcp: '𒃲',           // MEK-PI - Memory conductor protocol
  
  // Actions
  burn: '𒋼',          // NU-GI - Reduces circulating VOT
  mint: '𒂍',          // ZI-LA - Creates intelligence NFTs
  flow: '𒇲',          // SI-GA - Stable sequence USDC → VOT
  
  // Infrastructure
  facilitator: '𒂗',   // PA-TE - Safeguarded gateway
  vault: '𒉣',         // UR-RA - Treasury buffer
  base: '𒉿',          // BESU - Settlement plane
  
  // Social/Cast
  farcaster: '𒈦',     // FA-RA - Social relay lattice
  signal: '𒅗',        // KU-UL - Broadcast path
  beacon: '𒁕',        // DI-IR - Status emitter
  
  // Status/State
  pulse: '𒄿',         // RU-DA - Heartbeat metric
  gate: '𒀰',          // EN-KI - Permissions boundary
  oracle: '𒆜',        // SHU-LAM - Signal seer
  
  // Memory/Archive
  memory: '𒂅',        // PA-AMA - On-chain log
  archive: '𒀸',       // AL-PA - IPFS preservation
  circuit: '𒈾',       // NI-KA - Agent subroutines
  
  // Advanced
  agentic: '𒀭',       // AN-KU - Self-directed intelligence
  protocol: '𒄑',      // ZI-KIR - Binding contract lattice
  ecosystem: '𒆠',     // KI-RA - Connected field
  sentinel: '𒊕',      // GU-RU - Guardian agent
  ascend: '𒊭',        // SA-EN - Phase 3 unlock
  
  // BEEPER Machine Glyphs
  beeper: '𒄠',        // BI-PA - Dino mascot guardian of x402 V2
  dino: '𒀯',          // DI-NO - Primordial beast avatar
  rarity: '𒆷',        // RA-TI - Cosmic dice roll for tier

  // ═══════════════════════════════════════════════════════════
  // NEW: Ethereum Core Glyphs (Dec 2025)
  // ═══════════════════════════════════════════════════════════
  eth: '𒂊',           // E-TER-UM - Ethereum primordial chain
  ens: '𒂗𒈾𒊓',        // EN-NA-SA - Ethereum Name Service
  basename: '𒁀𒊓',     // BA-SE - Base L2 .base names

  // ═══════════════════════════════════════════════════════════
  // NEW: Pectra/Fusaka Upgrade Glyphs (Dec 2025)
  // ═══════════════════════════════════════════════════════════
  pectra: '𒉿𒂊𒋫',     // PE-EK-TRA - Prague+Electra fork (EIP-7702)
  fusaka: '𒄷𒊓𒂵',     // FU-SA-KA - Fulu+Osaka fork (secp256r1)
  passkey: '𒉺𒊓𒆠',    // PA-AS-KI - WebAuthn biometric auth
  blob: '𒁀𒇻𒁀',       // BLO-OB - EIP-4844 data blobs
  eoa: '𒂊𒀀',         // E-O-A - Externally Owned Account
  delegate: '𒁲𒇷',     // DE-LE - LLM agent authorization
  precompile: '𒉿𒊏𒂵', // PRE-KOM - Native EVM opcodes
  peerdas: '𒉿𒁕𒊓',    // PIR-DAS - Decentralized blob verification

  // ═══════════════════════════════════════════════════════════
  // NEW: AI/Agent Glyphs (Dec 2025)
  // ═══════════════════════════════════════════════════════════
  llm: '𒇷𒇷𒈦',        // EL-EM - Large Language Model
  agent: '𒀀𒂗𒋾',      // A-GEN - Autonomous LLM executor
  openrouter: '𒀀𒉿𒊏',  // O-RU-TA - Multi-model gateway
  claude: '𒆠𒇷𒁕',     // KLA-UD - Anthropic AI brain

  // ═══════════════════════════════════════════════════════════
  // NEW: DeFi/Token Glyphs (Dec 2025)
  // ═══════════════════════════════════════════════════════════
  usdc: '𒌋𒊓𒁕',       // US-DC - Circle stablecoin
  weth: '𒉿𒂊𒋾',       // WE-TH - Wrapped ETH
  swap: '𒊓𒉿𒀀',       // SWA-AP - Token exchange
  amm: '𒀀𒈦𒈦',        // A-EM-EM - Automated Market Maker
  liquidity: '𒇷𒅊𒄴',   // LI-KWI - Pool depth
  slippage: '𒊓𒇷𒉿',   // SLI-PA - Price impact

  // ═══════════════════════════════════════════════════════════
  // NEW: Infrastructure Glyphs (Dec 2025)
  // ═══════════════════════════════════════════════════════════
  ipfs: '𒅊𒉿𒄷',       // IP-FS - InterPlanetary File System
  cid: '𒆠𒅊𒁕',        // SI-ID - Content Identifier
  layer2: '𒇷𒁹𒁹',      // LA-YER - L2 rollup chains
  rollup: '𒊏𒀀𒇷',     // RO-LUP - Batch execution
  sequencer: '𒊓𒂊𒄴',   // SE-QU-EN - L2 block producer
  gasless: '𒄀𒊓',      // GA-LES - Zero-fee transactions
  wallet: '𒉿𒀀𒇷',     // WA-LET - Key custody interface
  coinbase: '𒆠𒁀',     // KO-BA - Exchange + wallet provider
  smartwallet: '𒊓𒉿𒀀', // SMA-WAL - ERC-4337 account abstraction
  x402v2: '𒇻𒁹𒁹',     // X4-02-V2 - x402 Facilitator V2
} as const;

// UI-specific glyph combinations
export const VOT_UI = {
  // Payment complete celebration
  paymentComplete: `${VOT_GLYPHS.x402}${VOT_GLYPHS.vot}${VOT_GLYPHS.flow}`,  // 𒇻𒁹𒇲
  
  // Transfer/settlement
  transfer: VOT_GLYPHS.flow,           // 𒇲
  settled: VOT_GLYPHS.vault,           // 𒉣
  
  // Order details section
  receipt: VOT_GLYPHS.archive,         // 𒀸
  status: VOT_GLYPHS.pulse,            // 𒄿
  
  // Facilitator
  facilitator: VOT_GLYPHS.facilitator, // 𒂗
  
  // Amount/token
  amount: VOT_GLYPHS.vot,              // 𒁹
  
  // Network
  network: VOT_GLYPHS.base,            // 𒉿
  
  // Trade history
  history: VOT_GLYPHS.memory,          // 𒂅
  
  // View/scan
  view: VOT_GLYPHS.oracle,             // 𒆜
  
  // Social share
  share: VOT_GLYPHS.farcaster,         // 𒈦
  cast: VOT_GLYPHS.signal,             // 𒅗
  
  // BEEPER Machine UI Combinations (NEW)
  beeperMint: `${VOT_GLYPHS.beeper}${VOT_GLYPHS.mint}${VOT_GLYPHS.dino}`,  // 𒄠𒂍𒀯
  beeperRarity: `${VOT_GLYPHS.rarity}${VOT_GLYPHS.beeper}`,                // 𒆷𒄠
  beeperBurn: `${VOT_GLYPHS.beeper}${VOT_GLYPHS.burn}${VOT_GLYPHS.vot}`,   // 𒄠𒋼𒁹
  beeperX402: `${VOT_GLYPHS.x402}${VOT_GLYPHS.beeper}${VOT_GLYPHS.facilitator}`, // 𒇻𒄠𒂗

  // ═══════════════════════════════════════════════════════════
  // NEW: Ethereum Upgrade UI Combinations (Dec 2025)
  // ═══════════════════════════════════════════════════════════
  ethIdentity: `${VOT_GLYPHS.eth}${VOT_GLYPHS.ens}`,                       // 𒂊𒂗𒈾𒊓
  baseIdentity: `${VOT_GLYPHS.base}${VOT_GLYPHS.basename}`,                // 𒉿𒁀𒊓
  pectraUpgrade: `${VOT_GLYPHS.pectra}${VOT_GLYPHS.eoa}${VOT_GLYPHS.delegate}`, // 𒉿𒂊𒋫𒂊𒀀𒁲𒇷
  fusakaUpgrade: `${VOT_GLYPHS.fusaka}${VOT_GLYPHS.passkey}${VOT_GLYPHS.peerdas}`, // 𒄷𒊓𒂵𒉺𒊓𒆠𒉿𒁕𒊓
  llmAgent: `${VOT_GLYPHS.llm}${VOT_GLYPHS.agent}${VOT_GLYPHS.mcp}`,       // 𒇷𒇷𒈦𒀀𒂗𒋾𒃲
  defiSwap: `${VOT_GLYPHS.usdc}${VOT_GLYPHS.swap}${VOT_GLYPHS.weth}`,      // 𒌋𒊓𒁕𒊓𒉿𒀀𒉿𒂊𒋾
  gaslessX402: `${VOT_GLYPHS.gasless}${VOT_GLYPHS.x402v2}${VOT_GLYPHS.smartwallet}`, // 𒄀𒊓𒇻𒁹𒁹𒊓𒉿𒀀
  ipfsArchive: `${VOT_GLYPHS.ipfs}${VOT_GLYPHS.cid}${VOT_GLYPHS.archive}`, // 𒅊𒉿𒄷𒆠𒅊𒁕𒀸
} as const;

// Helper to get glyph by ID with fallback
export function getGlyph(id: string, fallback = '⬡'): string {
  return GLYPHS[id] ?? fallback;
}

// Helper to get full entry by ID
export function getGlyphEntry(id: string): GlyphEntry | undefined {
  return GLYPH_CODEX.find(entry => entry.id === id);
}

// Get tone color class for a glyph
export function getGlyphToneClass(id: string): string {
  const entry = getGlyphEntry(id);
  if (!entry) return 'text-cyan-400';
  
  switch (entry.tone) {
    case 'cyan': return 'text-cyan-400';
    case 'amber': return 'text-amber-400';
    case 'magenta': return 'text-fuchsia-400';
    case 'emerald': return 'text-emerald-400';
    default: return 'text-cyan-400';
  }
}

export default VOT_GLYPHS;
