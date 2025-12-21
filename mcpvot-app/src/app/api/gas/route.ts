import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Base mainnet RPC endpoint
        const baseRpcUrl = 'https://mainnet.base.org';

        // Fetch gas price from Base network
        const gasPriceResponse = await fetch(baseRpcUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_gasPrice',
                params: [],
                id: 1
            }),
            next: { revalidate: 10 } // Cache for 10 seconds
        });

        if (!gasPriceResponse.ok) {
            throw new Error('RPC request failed');
        }

        const gasPriceData = await gasPriceResponse.json();

        if (gasPriceData.error) {
            throw new Error(gasPriceData.error.message);
        }

        // Convert hex gas price to decimal and then to gwei
        const gasPriceHex = gasPriceData.result;
        const gasPriceWei = parseInt(gasPriceHex, 16);
        const gasPriceGwei = gasPriceWei / 1e9; // Convert wei to gwei

        // Estimate gas costs for common operations
        const transferGas = 21000; // Standard ETH transfer
        const swapGas = 150000; // Approximate swap gas
        const contractGas = 100000; // Contract interaction

        const estimates = {
            transfer: {
                gas: transferGas,
                costWei: transferGas * gasPriceWei,
                costEth: (transferGas * gasPriceWei) / 1e18
            },
            swap: {
                gas: swapGas,
                costWei: swapGas * gasPriceWei,
                costEth: (swapGas * gasPriceWei) / 1e18
            },
            contract: {
                gas: contractGas,
                costWei: contractGas * gasPriceWei,
                costEth: (contractGas * gasPriceWei) / 1e18
            }
        };

        return NextResponse.json({
            success: true,
            data: {
                gasPrice: {
                    wei: gasPriceWei,
                    gwei: gasPriceGwei,
                    timestamp: Date.now()
                },
                estimates,
                network: 'Base Mainnet'
            }
        });

    } catch (error) {
        console.error('Gas API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch gas price',
            timestamp: Date.now()
        }, { status: 500 });
    }
}
