/**
 * API: Get VOT Token Balance + Facilitator Analytics
 * 
 * Fetches VOT token balance for a wallet address on Base
 * Includes x402 V2 Facilitator stats and treasury data
 * 
 * @version 2.0 - December 2025
 * @author MCPVOT Team
 */

import { NextResponse } from 'next/server';
import { createPublicClient, formatEther, http } from 'viem';
import { base } from 'viem/chains';

// VOT Token (Base) - VERIFIED CORRECT from facilitator.ts
const VOT_CONTRACT = process.env.NEXT_PUBLIC_VOT_CONTRACT || '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07';

// Treasury wallet (receives payments, holds VOT for rewards)
const TREASURY_WALLET = '0x824ea259C1e92f0c5dC1d85dcbb80290B90BE7fa';

// Burn address for VOT
const BURN_WALLET = '0x000000000000000000000000000000000000dEaD';

// ERC-20 ABI for balance and total supply
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

// Base client
const baseClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
});

// Helper function for display formatting
function formatDisplayBalance(numBalance: number): string {
  if (numBalance >= 1_000_000_000) {
    return `${(numBalance / 1_000_000_000).toFixed(2)}B`;
  } else if (numBalance >= 1_000_000) {
    return `${(numBalance / 1_000_000).toFixed(2)}M`;
  } else if (numBalance >= 1_000) {
    return `${(numBalance / 1_000).toFixed(2)}K`;
  } else {
    return numBalance.toFixed(2);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const includeFacilitator = searchParams.get('facilitator') === 'true';

    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    // Fetch VOT balance and token info in parallel
    const [rawBalance, decimals, symbol, name] = await Promise.all([
      baseClient.readContract({
        address: VOT_CONTRACT as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      }),
      baseClient.readContract({
        address: VOT_CONTRACT as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }).catch(() => 18),
      baseClient.readContract({
        address: VOT_CONTRACT as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'symbol',
      }).catch(() => 'VOT'),
      baseClient.readContract({
        address: VOT_CONTRACT as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'name',
      }).catch(() => 'VOT Token'),
    ]);

    // Format balance based on decimals
    const formattedBalance = decimals === 18 
      ? formatEther(rawBalance)
      : (Number(rawBalance) / Math.pow(10, Number(decimals))).toString();

    // Human readable format
    const numBalance = parseFloat(formattedBalance);
    let displayBalance: string;
    
    if (numBalance >= 1_000_000) {
      displayBalance = `${(numBalance / 1_000_000).toFixed(2)}M`;
    } else if (numBalance >= 1_000) {
      displayBalance = `${(numBalance / 1_000).toFixed(2)}K`;
    } else {
      displayBalance = numBalance.toFixed(2);
    }

    // Base response
    const response: Record<string, unknown> = {
      address,
      contract: VOT_CONTRACT,
      token: {
        name,
        symbol,
        decimals: Number(decimals),
      },
      balance: {
        raw: rawBalance.toString(),
        formatted: formattedBalance,
        display: displayBalance,
      },
    };

    // Add facilitator analytics if requested
    if (includeFacilitator) {
      const [totalSupply, treasuryBalance, burnedBalance] = await Promise.all([
        baseClient.readContract({
          address: VOT_CONTRACT as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'totalSupply',
        }).catch(() => BigInt(0)),
        baseClient.readContract({
          address: VOT_CONTRACT as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [TREASURY_WALLET as `0x${string}`],
        }).catch(() => BigInt(0)),
        baseClient.readContract({
          address: VOT_CONTRACT as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [BURN_WALLET as `0x${string}`],
        }).catch(() => BigInt(0)),
      ]);

      const totalSupplyFormatted = formatEther(totalSupply);
      const treasuryFormatted = formatEther(treasuryBalance);
      const burnedFormatted = formatEther(burnedBalance);
      
      // Calculate circulating supply
      const circulatingSupply = totalSupply - treasuryBalance - burnedBalance;
      const circulatingFormatted = formatEther(circulatingSupply);

      response.facilitator = {
        version: 'x402 V2.1',
        treasury: {
          wallet: TREASURY_WALLET,
          balance: treasuryFormatted,
          display: formatDisplayBalance(parseFloat(treasuryFormatted)),
        },
        burn: {
          wallet: BURN_WALLET,
          burned: burnedFormatted,
          display: formatDisplayBalance(parseFloat(burnedFormatted)),
        },
        supply: {
          total: totalSupplyFormatted,
          circulating: circulatingFormatted,
          displayTotal: formatDisplayBalance(parseFloat(totalSupplyFormatted)),
          displayCirculating: formatDisplayBalance(parseFloat(circulatingFormatted)),
        },
        rewards: {
          perMint: '69,420 VOT',
          socialBonus: '+10,000 VOT',
          noBurn: true,
        },
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('[VOT Balance API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch VOT balance' },
      { status: 500 }
    );
  }
}
