"use client";

import { Shield, Sparkles, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { base } from 'wagmi/chains';
import { useEIP7702 } from '../hooks/useEIP7702';
import { EnhancedConnectButton } from './EnhancedConnectButton';

interface EIP7702ConnectButtonProps {
    className?: string;
    variant?: 'default' | 'compact' | 'mobile';
    enableFeatures?: {
        gasless?: boolean;
        batching?: boolean;
        erc20Payment?: boolean;
    };
}

export function EIP7702ConnectButton({
    className,
    variant = 'default',
    enableFeatures = {
        gasless: true,
        batching: true,
        erc20Payment: true,
    }
}: EIP7702ConnectButtonProps) {
    const { isConnected, connector } = useAccount();
    const chainId = useChainId();
    
    const [isEIP7702Enabled, setIsEIP7702Enabled] = useState(false);
    const [smartWalletAddress, setSmartWalletAddress] = useState<string | null>(null);
    const [showEIP7702Modal, setShowEIP7702Modal] = useState(false);

    const {
        error,
        getSmartWalletAddress,
        enableERC20GasPayment,
    } = useEIP7702();

    // Check if EIP-7702 is available and enabled
    useEffect(() => {
        const checkWalletSupport = async (): Promise<boolean> => {
            // Check wallet capabilities
            if (connector?.id === 'metaMask') {
                // MetaMask v11+ supports EIP-7702
                return true;
            }
            if (connector?.name?.includes('Coinbase')) {
                // Coinbase Smart Wallet supports EIP-7702
                return true;
            }
            if (connector?.name?.includes('Rainbow')) {
                // Rainbow supports EIP-7702
                return true;
            }
            return false;
        };

        const checkEIP7702Support = async () => {
            if (isConnected && chainId === base.id) {
                try {
                    // Check if wallet supports EIP-7702
                    const supported = await checkWalletSupport();
                    setIsEIP7702Enabled(supported);
                    
                    if (supported) {
                        const smartAddr = await getSmartWalletAddress();
                        setSmartWalletAddress(smartAddr);
                    }
                } catch (err) {
                    console.warn('EIP-7702 not supported:', err);
                    setIsEIP7702Enabled(false);
                }
            }
        };

        checkEIP7702Support();
    }, [isConnected, chainId, getSmartWalletAddress, connector?.id, connector?.name]);

    // Enable EIP-7702 features
    const enableEIP7702Features = useCallback(async () => {
        if (!isConnected || !isEIP7702Enabled) return;

        try {
            // Get smart wallet address
            const smartAddr = await getSmartWalletAddress();
            setSmartWalletAddress(smartAddr);

            // Enable ERC-20 gas payment if requested
            if (enableFeatures.erc20Payment) {
                // Use USDC as example gas token on Base
                const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`;
                await enableERC20GasPayment(USDC_ADDRESS, smartAddr);
            }

            console.log('EIP-7702 features enabled successfully');
        } catch (err) {
            console.error('Failed to enable EIP-7702 features:', err);
        }
    }, [isConnected, isEIP7702Enabled, getSmartWalletAddress, enableERC20GasPayment, enableFeatures.erc20Payment]);

    // Trigger EIP-7702 feature activation when connected
    useEffect(() => {
        if (isConnected && isEIP7702Enabled) {
            // Use setTimeout to avoid calling async function directly in effect
            const timer = setTimeout(() => {
                enableEIP7702Features();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isConnected, isEIP7702Enabled, enableEIP7702Features]);

    // Custom enhanced button with EIP-7702 features
    const renderEIP7702EnhancedButton = () => {
        if (!isConnected) {
            return (
                <EnhancedConnectButton 
                    className={className}
                    variant={variant}
                />
            );
        }

        if (chainId !== base.id) {
            return (
                <EnhancedConnectButton 
                    className={className}
                    variant={variant}
                />
            );
        }

        return (
            <div className={`space-y-3 ${className}`}>
                {/* Smart Wallet Status */}
                {isEIP7702Enabled && smartWalletAddress && (
                    <div className="p-3 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 border border-emerald-500/30 rounded-lg">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-emerald-300">
                                <Shield size={14} />
                                <span>EIP-7702 Enabled</span>
                            </div>
                            <button
                                onClick={() => setShowEIP7702Modal(true)}
                                className="text-blue-300 hover:text-blue-200 transition-colors"
                            >
                                Details
                            </button>
                        </div>
                        <div className="mt-1 text-xs text-emerald-400/80 font-mono truncate">
                            Smart Wallet: {smartWalletAddress.slice(0, 10)}...{smartWalletAddress.slice(-6)}
                        </div>
                    </div>
                )}

                {/* Enhanced Connect Button with EIP-7702 features */}
                <div className="relative">
                    <EnhancedConnectButton 
                        className={className}
                        variant={variant}
                    />
                    
                    {/* EIP-7702 Feature Indicator */}
                    {isEIP7702Enabled && (
                        <div className="absolute -top-1 -right-1">
                            <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                                <Sparkles size={10} className="text-white" />
                            </div>
                        </div>
                    )}
                </div>

                {/* EIP-7702 Features Summary */}
                {isEIP7702Enabled && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        {enableFeatures.gasless && (
                            <div className="text-center p-2 bg-black/30 rounded border border-green-500/20">
                                <Zap size={12} className="text-green-400 mx-auto mb-1" />
                                <span className="text-green-300">Gasless</span>
                            </div>
                        )}
                        {enableFeatures.batching && (
                            <div className="text-center p-2 bg-black/30 rounded border border-blue-500/20">
                                <span className="text-blue-400 text-lg">🔄</span>
                                <span className="text-blue-300 block">Batch</span>
                            </div>
                        )}
                        {enableFeatures.erc20Payment && (
                            <div className="text-center p-2 bg-black/30 rounded border border-purple-500/20">
                                <span className="text-purple-400 text-lg">💰</span>
                                <span className="text-purple-300 block">ERC-20 Gas</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="p-2 bg-red-600/20 border border-red-500/30 rounded text-xs text-red-300">
                        EIP-7702 Error: {error}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {renderEIP7702EnhancedButton()}

            {/* EIP-7702 Features Modal */}
            {showEIP7702Modal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowEIP7702Modal(false)}>
                    <div className="pixel-frame-thick p-6 bg-black/95 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-6 text-center">
                            <h3 className="text-xl font-orbitron tracking-[0.2em] text-yellow-300 mb-2">⚡ EIP-7702 SMART WALLET</h3>
                            <p className="text-xs text-blue-300/70 font-mono mb-4">Enhanced wallet features enabled</p>
                        </div>
                        
                        <div className="space-y-4 text-sm">
                            <div className="p-3 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded">
                                <h4 className="font-semibold text-green-300 mb-2">🚀 Gasless Transactions</h4>
                                <p className="text-green-400/80">Pay gas fees with ERC-20 tokens instead of ETH. Perfect for seamless DeFi interactions.</p>
                            </div>
                            
                            <div className="p-3 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded">
                                <h4 className="font-semibold text-blue-300 mb-2">🔄 Transaction Batching</h4>
                                <p className="text-blue-400/80">Combine multiple operations into single transactions for better UX and lower costs.</p>
                            </div>
                            
                            <div className="p-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded">
                                <h4 className="font-semibold text-purple-300 mb-2">💰 ERC-20 Gas Payment</h4>
                                <p className="text-purple-400/80">Use USDC, DAI, or other tokens to pay for transaction fees.</p>
                            </div>
                            
                            {smartWalletAddress && (
                                <div className="p-3 bg-black/50 border border-yellow-500/30 rounded font-mono text-xs">
                                    <div className="text-yellow-300 mb-1">Smart Wallet Address:</div>
                                    <div className="text-yellow-400 break-all">{smartWalletAddress}</div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setShowEIP7702Modal(false)}
                            className="w-full mt-4 px-4 py-2 border border-cyan-500/30 bg-cyan-600/10 text-cyan-300 hover:bg-cyan-600/20 transition-all font-mono text-xs rounded-lg"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

