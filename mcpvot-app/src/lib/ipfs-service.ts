/**
 * ENS IPFS Website Machine - IPFS Service
 * 
 * Handles pinning content to IPFS via multiple providers:
 * 1. Local IPFS MCP Server
 * 2. Pinata API (fallback)
 * 3. Web3.Storage (fallback)
 */

// Configuration
const IPFS_CONFIG = {
  // Local MCP server (if running)
  mcpServerUrl: process.env.IPFS_MCP_URL || 'http://localhost:3100',
  
  // Pinata API
  pinataJwt: process.env.PINATA_JWT || '',
  pinataGateway: process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
  
  // Web3.Storage
  web3StorageToken: process.env.WEB3_STORAGE_TOKEN || '',
  
  // IPFS gateways for retrieval
  gateways: [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://dweb.link/ipfs/',
  ],
};

export interface IPFSPinResult {
  success: boolean;
  cid: string | null;
  url: string | null;
  gateway: string | null;
  error?: string;
  provider: 'mcp' | 'pinata' | 'web3storage';
}

export interface IPFSContentMetadata {
  name: string;
  description?: string;
  keyvalues?: Record<string, string>;
}

/**
 * Pin content to IPFS via MCP server
 */
async function pinViaMCP(content: string): Promise<IPFSPinResult> {
  try {
    // The MCP server exposes pin_content tool
    // In production, this would call the actual MCP server
    const response = await fetch(`${IPFS_CONFIG.mcpServerUrl}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        encrypt: false, // Don't encrypt website content
      }),
    });
    
    if (!response.ok) {
      throw new Error(`MCP server returned ${response.status}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      cid: result.cid,
      url: `ipfs://${result.cid}`,
      gateway: `${IPFS_CONFIG.gateways[0]}${result.cid}`,
      provider: 'mcp',
    };
  } catch (error) {
    console.error('MCP IPFS pin failed:', error);
    return {
      success: false,
      cid: null,
      url: null,
      gateway: null,
      error: error instanceof Error ? error.message : 'MCP pin failed',
      provider: 'mcp',
    };
  }
}

/**
 * Pin JSON content to IPFS via Pinata API
 * (Exported for metadata pinning use cases)
 */
export async function pinViaPinata(content: string, metadata?: IPFSContentMetadata): Promise<IPFSPinResult> {
  if (!IPFS_CONFIG.pinataJwt) {
    return {
      success: false,
      cid: null,
      url: null,
      gateway: null,
      error: 'Pinata JWT not configured',
      provider: 'pinata',
    };
  }
  
  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${IPFS_CONFIG.pinataJwt}`,
      },
      body: JSON.stringify({
        pinataContent: content,
        pinataMetadata: metadata ? {
          name: metadata.name,
          keyvalues: metadata.keyvalues || {},
        } : undefined,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Pinata returned ${response.status}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      cid: result.IpfsHash,
      url: `ipfs://${result.IpfsHash}`,
      gateway: `${IPFS_CONFIG.pinataGateway}${result.IpfsHash}`,
      provider: 'pinata',
    };
  } catch (error) {
    console.error('Pinata pin failed:', error);
    return {
      success: false,
      cid: null,
      url: null,
      gateway: null,
      error: error instanceof Error ? error.message : 'Pinata pin failed',
      provider: 'pinata',
    };
  }
}

/**
 * Pin raw HTML file to IPFS via Pinata
 */
async function pinHTMLViaPinata(htmlContent: string, metadata?: IPFSContentMetadata): Promise<IPFSPinResult> {
  if (!IPFS_CONFIG.pinataJwt) {
    return {
      success: false,
      cid: null,
      url: null,
      gateway: null,
      error: 'Pinata JWT not configured',
      provider: 'pinata',
    };
  }
  
  try {
    // Create form data with the HTML file
    const formData = new FormData();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    formData.append('file', blob, 'index.html');
    
    if (metadata) {
      formData.append('pinataMetadata', JSON.stringify({
        name: metadata.name || 'ens-website.html',
        keyvalues: metadata.keyvalues || {},
      }));
    }
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${IPFS_CONFIG.pinataJwt}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Pinata returned ${response.status}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      cid: result.IpfsHash,
      url: `ipfs://${result.IpfsHash}`,
      gateway: `${IPFS_CONFIG.pinataGateway}${result.IpfsHash}`,
      provider: 'pinata',
    };
  } catch (error) {
    console.error('Pinata HTML pin failed:', error);
    return {
      success: false,
      cid: null,
      url: null,
      gateway: null,
      error: error instanceof Error ? error.message : 'Pinata HTML pin failed',
      provider: 'pinata',
    };
  }
}

/**
 * Main function: Pin HTML content to IPFS with fallbacks
 */
export async function pinToIPFS(
  htmlContent: string, 
  metadata?: IPFSContentMetadata
): Promise<IPFSPinResult> {
  // Try providers in order of preference
  
  // 1. Try Pinata first (primary production provider)
  const pinataResult = await pinHTMLViaPinata(htmlContent, metadata);
  if (pinataResult.success) {
    console.log('Pinned via Pinata:', pinataResult.cid);
    return pinataResult;
  }
  
  // 2. Try local MCP server as backup
  const mcpResult = await pinViaMCP(htmlContent);
  if (mcpResult.success) {
    console.log('Pinned via MCP server:', mcpResult.cid);
    return mcpResult;
  }
  
  // 3. All providers failed - throw error (no mock fallback in production)
  throw new Error(`IPFS pinning failed. Pinata: ${pinataResult.error}, MCP: ${mcpResult.error}`);
}

/**
 * Convert IPFS CID to ENS-compatible content hash
 * ENS expects contenthash in a specific format
 */
export function cidToENSContentHash(cid: string): string {
  // For IPFS CIDv0 (Qm...) and CIDv1 (ba...)
  // ENS expects: ipfs:// + cid
  // The actual encoding is handled by ENS libraries
  return `ipfs://${cid}`;
}

/**
 * Get content from IPFS via gateway
 */
export async function getFromIPFS(cid: string): Promise<string | null> {
  for (const gateway of IPFS_CONFIG.gateways) {
    try {
      const response = await fetch(`${gateway}${cid}`, {
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      if (response.ok) {
        return await response.text();
      }
    } catch {
      continue; // Try next gateway
    }
  }
  
  return null;
}

const ipfsExports = {
  pinToIPFS,
  cidToENSContentHash,
  getFromIPFS,
  config: IPFS_CONFIG,
};

export default ipfsExports;
