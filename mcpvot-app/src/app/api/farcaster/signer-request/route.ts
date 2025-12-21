import * as ed from '@noble/ed25519';
import { NextRequest, NextResponse } from 'next/server';
import { mnemonicToAccount } from 'viem/accounts';

const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
    name: 'Farcaster SignedKeyRequestValidator',
    version: '1',
    chainId: 10,
    verifyingContract: '0x00000000fc700472606ed4fa22623acf62c60553',
} as const;

const SIGNED_KEY_REQUEST_TYPE = [
    { name: 'requestFid', type: 'uint256' },
    { name: 'key', type: 'bytes' },
    { name: 'deadline', type: 'uint256' },
] as const;

export async function POST(request: NextRequest) {
    try {
        console.log('🔑 Starting signer request creation...');

        const body = await request.json();
        const { fid } = body;

        console.log('📝 Received request for FID:', fid);

        if (!fid || typeof fid !== 'number') {
            console.error('❌ Invalid FID provided:', fid);
            return NextResponse.json(
                { error: 'User FID is required and must be a number' },
                { status: 400 }
            );
        }

        // Generate new Ed25519 key pair
        console.log('🔐 Generating Ed25519 key pair...');
        const privateKey = ed.utils.randomPrivateKey();
        const publicKeyBytes = await ed.getPublicKey(privateKey);
        const key = ('0x' + Buffer.from(publicKeyBytes).toString('hex')) as `0x${string}`;

        console.log('✅ Generated public key:', key);

        // Get app credentials from environment
        const appFid = process.env.FARCASTER_APP_FID;
        const appMnemonic = process.env.FARCASTER_APP_MNEMONIC;

        console.log('🔍 Checking app credentials...');
        console.log('App FID configured:', !!appFid);
        console.log('App mnemonic configured:', !!appMnemonic);

        if (!appFid || !appMnemonic) {
            console.error('❌ App credentials not configured');
            return NextResponse.json(
                { error: 'App FID and mnemonic not configured in environment' },
                { status: 500 }
            );
        }

        // Create account from mnemonic
        console.log('👤 Creating account from mnemonic...');
        const account = mnemonicToAccount(appMnemonic);

        // Generate deadline (24 hours from now)
        const deadline = Math.floor(Date.now() / 1000) + 86400;
        console.log('⏰ Generated deadline:', new Date(deadline * 1000).toISOString());

        // Sign the key request
        console.log('✍️ Signing key request...');
        const signature = await account.signTypedData({
            domain: SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
            types: {
                SignedKeyRequest: SIGNED_KEY_REQUEST_TYPE,
            },
            primaryType: 'SignedKeyRequest',
            message: {
                requestFid: BigInt(appFid),
                key,
                deadline: BigInt(deadline),
            },
        });

        console.log('✅ Generated signature:', signature);

        // Create signed key request
        const farcasterClientApi = 'https://api.farcaster.xyz';
        console.log('🌐 Submitting signed key request to Farcaster...');

        const response = await fetch(`${farcasterClientApi}/v2/signed-key-requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                key,
                requestFid: parseInt(appFid),
                signature,
                deadline,
            }),
        });

        console.log('📡 Farcaster API response status:', response.status);

        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ Signed key request failed:', response.status, errorData);
            return NextResponse.json(
                { error: `Failed to create signed key request: ${response.status} - ${errorData}` },
                { status: response.status }
            );
        }

        const result = await response.json();
        console.log('✅ Signed key request created successfully');

        const { token, deeplinkUrl } = result.result.signedKeyRequest;

        console.log('🎯 Generated token:', token);
        console.log('🔗 Generated deeplink:', deeplinkUrl);

        // Store the private key securely (in a real app, this would be encrypted and stored in a database)
        // For demo purposes, we'll return it - but this is NOT secure for production!
        const privateKeyHex = '0x' + Buffer.from(privateKey).toString('hex');

        console.log('🚀 Signer request creation completed successfully');

        return NextResponse.json({
            success: true,
            token,
            deeplinkUrl,
            privateKey: privateKeyHex, // WARNING: Never return private keys in production!
            publicKey: key,
            instructions: 'Open this deeplink on your mobile device with Farcaster installed to approve the signer',
            debug: {
                fid,
                appFid,
                deadline: new Date(deadline * 1000).toISOString(),
                keyGenerated: true,
                signatureGenerated: true,
                farcasterApiCalled: true
            }
        });

    } catch (error) {
        console.error('💥 Signer request error:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
        return NextResponse.json(
            {
                error: 'Failed to create signer request',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}
