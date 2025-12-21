'use client';

import { Button } from '@/components/ui/button';
import { useSmartPayment } from '@/hooks/useEmbeddedWalletsPayment';
import { CreditCard, Loader2, Smartphone, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useAccount } from 'wagmi';

interface EmbeddedX402PaymentButtonProps {
    endpoint: string;
    amount?: number;
    description?: string;
    onSuccess?: (response: Response) => void;
    onError?: (error: Error) => void;
    className?: string;
}

/**
 * Enhanced X402 Payment Button with Coinbase Embedded Wallets Support
 *
 * Automatically detects if the user is in a Coinbase Embedded Wallet environment
 * and uses the new useX402 hook for seamless payment processing.
 */
export function EmbeddedX402PaymentButton({
    endpoint,
    amount = 1.00,
    description = 'Pay with USDC',
    onSuccess,
    onError,
    className = ''
}: EmbeddedX402PaymentButtonProps) {
    const { address } = useAccount();
    const [isProcessing, setIsProcessing] = useState(false);

    const smartPayment = useSmartPayment();

    const handlePayment = async () => {
        if (!address) {
            onError?.(new Error('Wallet not connected'));
            return;
        }

        setIsProcessing(true);

        try {
            const response = await smartPayment.makeSmartPayment(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-payment-amount': amount.toString(),
                },
                body: JSON.stringify({
                    amount,
                    description,
                    userAddress: address,
                    timestamp: new Date().toISOString(),
                }),
            });

            onSuccess?.(response);
        } catch (error) {
            const paymentError = error instanceof Error ? error : new Error('Payment failed');
            onError?.(paymentError);
        } finally {
            setIsProcessing(false);
        }
    };

    // Determine button appearance based on environment
    const isEmbeddedWalletsAvailable = smartPayment.isEmbeddedWalletsAvailable();

    const getButtonContent = () => {
        if (isProcessing) {
            return (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                </>
            );
        }

        if (smartPayment.isUsingEmbeddedWallets) {
            return (
                <>
                    <Smartphone className="mr-2 h-4 w-4" />
                    Pay with Coinbase Wallet
                </>
            );
        }

        return (
            <>
                <CreditCard className="mr-2 h-4 w-4" />
                {description}
            </>
        );
    };

    const getButtonVariant = () => {
        if (smartPayment.isUsingEmbeddedWallets) {
            return 'default';
        }
        return 'secondary';
    };

    return (
        <div className={`embedded-payment-button ${className}`}>
            <Button
                onClick={handlePayment}
                disabled={isProcessing || !address}
                variant={getButtonVariant()}
                className="w-full"
            >
                {getButtonContent()}
            </Button>

            {/* Status indicators */}
            <div className="mt-2 space-y-1 text-xs">
                {smartPayment.isUsingEmbeddedWallets && (
                    <div className="flex items-center text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                        Coinbase Embedded Wallets Ready
                    </div>
                )}

                {isEmbeddedWalletsAvailable && !smartPayment.isUsingEmbeddedWallets && (
                    <div className="text-yellow-600">
                        Embedded Wallets Available - Connect Coinbase Wallet
                    </div>
                )}

                {smartPayment.error && (
                    <div className="text-red-600">
                        Error: {smartPayment.error}
                    </div>
                )}

                {!address && (
                    <div className="text-red-600">
                        Please connect your wallet
                    </div>
                )}
            </div>

            {/* Payment method info */}
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-center space-x-4">
                    <span>💰 USDC Payment</span>
                    <span>⚡ Gasless</span>
                    <span>🛡️ x402 Protocol</span>
                </div>
            </div>
        </div>
    );
}

/**
 * Legacy VOT Payment Button (for comparison)
 */
export function LegacyVOTPaymentButton({
    onSuccess,
    onError,
    className = ''
}: {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
    className?: string;
}) {
    const { address } = useAccount();
    const [isProcessing, setIsProcessing] = useState(false); const handlePayment = async () => {
        if (!address) {
            onError?.(new Error('Wallet not connected'));
            return;
        }

        setIsProcessing(true);

        try {
            // Legacy payment logic would go here
            // This would use traditional USDC permits and wallet signatures

            onSuccess?.();
        } catch (error) {
            const paymentError = error instanceof Error ? error : new Error('Payment failed');
            onError?.(paymentError);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className={`legacy-payment-button ${className}`}>
            <Button
                onClick={handlePayment}
                disabled={isProcessing || !address}
                variant="outline"
                className="w-full"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <Wallet className="mr-2 h-4 w-4" />
                        Pay with Traditional Wallet
                    </>
                )}
            </Button>

            {!address && (
                <div className="mt-2 text-xs text-red-600">
                    Please connect your wallet
                </div>
            )}
        </div>
    );
}

/**
 * Payment Method Selector Component
 */
export function PaymentMethodSelector({
    endpoint,
    amount = 1.00,
    description = 'Purchase VOT',
    onSuccess,
    onError,
    className = ''
}: EmbeddedX402PaymentButtonProps) {
    const smartPayment = useSmartPayment();
    const isEmbeddedWalletsAvailable = smartPayment.isEmbeddedWalletsAvailable();

    return (
        <div className={`payment-method-selector ${className}`}>
            <h3 className="text-lg font-semibold mb-4 text-center">
                Choose Payment Method
            </h3>

            <div className="space-y-4">
                {/* Embedded Wallets Option */}
                {isEmbeddedWalletsAvailable && (
                    <div className="border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
                        <h4 className="font-medium text-green-600 mb-2">Coinbase Embedded Wallets</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Seamless payments with your Coinbase wallet. No gas fees!
                        </p>
                        <EmbeddedX402PaymentButton
                            endpoint={endpoint}
                            amount={amount}
                            description={description}
                            onSuccess={onSuccess}
                            onError={onError}
                        />
                    </div>
                )}

                {/* Traditional Wallet Option */}
                <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Traditional Wallet</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Use MetaMask, Coinbase Wallet, or any EVM-compatible wallet.
                    </p>
                    <LegacyVOTPaymentButton
                        amount={amount}
                        onSuccess={onSuccess}
                        onError={onError}
                    />
                </div>
            </div>

            {/* Environment Info */}
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
                <div className="font-medium mb-1">Environment Info:</div>
                <div>Embedded Wallets: {isEmbeddedWalletsAvailable ? 'Available' : 'Not Available'}</div>
                <div>Smart Payment: {smartPayment.isUsingEmbeddedWallets ? 'Active' : 'Inactive'}</div>
            </div>
        </div>
    );
}
