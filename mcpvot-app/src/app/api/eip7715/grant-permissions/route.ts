/**
 * EIP-7715 Grant Permissions API Endpoint
 * 
 * Provides JSON-RPC endpoint for MetaMask users to grant EIP-7702 delegations
 * to third-party contracts (e.g., x402 facilitator for gasless VOT transactions).
 * 
 * This enables portable delegations - users aren't locked into any specific wallet.
 * Permissions can migrate to Rainbow, Coinbase, or any ERC-7715 compatible wallet.
 */

import { NextRequest, NextResponse } from 'next/server';

// x402 Facilitator address on Base mainnet
const X402_FACILITATOR_ADDRESS = process.env.X402_FACILITATOR_ADDRESS || '0x6CA6d1e2D5347Bfab1d91e883F1915560e09129D';

// VOT Token contract address
const VOT_TOKEN_ADDRESS = '0xFB7a83abe4F4A4E51c77B92E521390B769ff6467';

// Base chain IDs
const CHAIN_IDS = {
  base: 8453,
  baseSepolia: 84532,
};

interface PermissionRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: 'wallet_grantPermissions' | 'wallet_revokePermissions' | 'wallet_getPermissions';
  params: {
    userAddress: string;
    delegateAddress?: string;
    chainId?: number;
    allowance?: string; // hex-encoded wei
    expiration?: number; // Unix timestamp
    permissionType?: 'contract-execution' | 'token-transfer' | 'batch-execution';
    policies?: Array<{
      type: string;
      params: Record<string, unknown>;
    }>;
    permissionId?: string; // For revoke/get
  };
}

interface Permission {
  id: string;
  type: string;
  granted: boolean;
  userAddress: string;
  delegateAddress: string;
  chainId: number;
  allowance: string;
  expiration: number;
  createdAt: number;
  policies: Array<{
    type: string;
    params: Record<string, unknown>;
  }>;
}

// In-memory permission store (replace with DB in production)
const permissionStore = new Map<string, Permission>();

function generatePermissionId(): string {
  return `perm_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

function validateAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export async function POST(request: NextRequest) {
  try {
    const body: PermissionRequest = await request.json();

    // Validate JSON-RPC structure
    if (body.jsonrpc !== '2.0' || !body.method || !body.params) {
      return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id || null,
        error: {
          code: -32600,
          message: 'Invalid Request: Missing required JSON-RPC fields',
        },
      }, { status: 400 });
    }

    const { method, params, id } = body;

    switch (method) {
      case 'wallet_grantPermissions': {
        // Validate required params
        if (!params.userAddress || !validateAddress(params.userAddress)) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32602,
              message: 'Invalid params: userAddress must be valid Ethereum address',
            },
          }, { status: 400 });
        }

        const delegateAddress = params.delegateAddress || X402_FACILITATOR_ADDRESS;
        if (!validateAddress(delegateAddress)) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32602,
              message: 'Invalid params: delegateAddress must be valid Ethereum address',
            },
          }, { status: 400 });
        }

        const chainId = params.chainId || CHAIN_IDS.base;
        const allowance = params.allowance || '0x2386F26FC10000'; // 0.01 ETH default
        const expiration = params.expiration || Math.floor(Date.now() / 1000) + 86400; // 24 hours default
        const permissionType = params.permissionType || 'contract-execution';

        // Create permission object
        const permissionId = generatePermissionId();
        const permission: Permission = {
          id: permissionId,
          type: permissionType,
          granted: true,
          userAddress: params.userAddress.toLowerCase(),
          delegateAddress: delegateAddress.toLowerCase(),
          chainId,
          allowance,
          expiration,
          createdAt: Math.floor(Date.now() / 1000),
          policies: params.policies || [
            {
              type: 'requireUserConfirmation',
              params: { threshold: '0x38D7EA4C68000' }, // 0.001 ETH
            },
            {
              type: 'allowedContracts',
              params: {
                contracts: [VOT_TOKEN_ADDRESS, X402_FACILITATOR_ADDRESS],
              },
            },
          ],
        };

        // Store permission
        permissionStore.set(permissionId, permission);

        // Return EIP-7715 compliant response
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            permissions: [
              {
                id: permissionId,
                type: permissionType,
                granted: true,
                data: {
                  userAddress: permission.userAddress,
                  delegateAddress: permission.delegateAddress,
                  chainId: permission.chainId,
                  allowance: permission.allowance,
                  expiration: permission.expiration,
                },
                policies: permission.policies,
              },
            ],
            session: {
              duration: expiration - Math.floor(Date.now() / 1000),
              createdAt: permission.createdAt,
            },
            // EIP-7702 authorization data for client-side signing
            eip7702AuthData: {
              chainId,
              nonce: '0x0', // Client should fetch actual nonce
              delegateAddress,
              // Client signs this with their EOA to create Type 4 tx
              signatureRequest: {
                domain: {
                  name: 'MCPVOT x402 Delegation',
                  version: '1',
                  chainId,
                  verifyingContract: delegateAddress,
                },
                types: {
                  Delegation: [
                    { name: 'delegate', type: 'address' },
                    { name: 'allowance', type: 'uint256' },
                    { name: 'expiration', type: 'uint256' },
                    { name: 'nonce', type: 'uint256' },
                  ],
                },
                primaryType: 'Delegation',
                message: {
                  delegate: delegateAddress,
                  allowance,
                  expiration,
                  nonce: 0,
                },
              },
            },
          },
        });
      }

      case 'wallet_revokePermissions': {
        const { permissionId } = params;
        if (!permissionId) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32602,
              message: 'Invalid params: permissionId required',
            },
          }, { status: 400 });
        }

        const permission = permissionStore.get(permissionId);
        if (!permission) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32001,
              message: 'Permission not found',
            },
          }, { status: 404 });
        }

        // Revoke by deleting
        permissionStore.delete(permissionId);

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            revoked: true,
            permissionId,
          },
        });
      }

      case 'wallet_getPermissions': {
        const { userAddress, permissionId } = params;

        if (permissionId) {
          const permission = permissionStore.get(permissionId);
          if (!permission) {
            return NextResponse.json({
              jsonrpc: '2.0',
              id,
              result: { permissions: [] },
            });
          }
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            result: { permissions: [permission] },
          });
        }

        if (userAddress && validateAddress(userAddress)) {
          const userPermissions = Array.from(permissionStore.values())
            .filter(p => p.userAddress === userAddress.toLowerCase() && p.expiration > Math.floor(Date.now() / 1000));
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            result: { permissions: userPermissions },
          });
        }

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32602,
            message: 'Invalid params: userAddress or permissionId required',
          },
        }, { status: 400 });
      }

      default:
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`,
          },
        }, { status: 404 });
    }
  } catch (error) {
    console.error('[EIP-7715] Error:', error);
    return NextResponse.json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32603,
        message: 'Internal error',
        data: error instanceof Error ? error.message : 'Unknown error',
      },
    }, { status: 500 });
  }
}

// GET endpoint for checking available permission types
export async function GET() {
  return NextResponse.json({
    name: 'MCPVOT EIP-7715 Delegation Endpoint',
    version: '1.0.0',
    description: 'JSON-RPC endpoint for EIP-7702 delegations via ERC-7715 wallet_grantPermissions',
    supportedMethods: [
      'wallet_grantPermissions',
      'wallet_revokePermissions', 
      'wallet_getPermissions',
    ],
    defaultDelegate: X402_FACILITATOR_ADDRESS,
    supportedChains: [
      { id: CHAIN_IDS.base, name: 'Base' },
      { id: CHAIN_IDS.baseSepolia, name: 'Base Sepolia' },
    ],
    permissionTypes: [
      'contract-execution',
      'token-transfer',
      'batch-execution',
    ],
    policyTypes: [
      'requireUserConfirmation',
      'allowedContracts',
      'maxGasPerTx',
      'dailySpendLimit',
    ],
    documentation: 'https://docs.metamask.io/delegation-toolkit/get-started/erc7715-quickstart',
  });
}
