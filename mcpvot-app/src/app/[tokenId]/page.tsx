/**
 * VOT Machine NFT Viewer - Root Level Route (Server Component)
 * 
 * URL: mcpvot.xyz/{tokenId}
 * 
 * Displays the minted VOT Machine NFT directly at the root level.
 * Each NFT is a full animated HTML page pinned to IPFS.
 * 
 * Flow:
 * 1. mcpvot.xyz/47 → This page
 * 2. Fetches tokenURI from ERC-1155 contract
 * 3. Gets IPFS metadata
 * 4. Renders the animation_url (full HTML page)
 */

import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ tokenId: string }>;
}

export default async function VOTMachineViewer({ params }: Props) {
  const { tokenId } = await params;
  
  // Validate tokenId is a number
  const id = parseInt(tokenId, 10);
  
  if (isNaN(id) || id < 1) {
    // Not a valid tokenId, redirect to home
    redirect('/');
  }
  
  // Redirect to the existing NFT viewer
  // TODO: In production, render the IPFS HTML directly here
  redirect(`/nft/${tokenId}`);
}
