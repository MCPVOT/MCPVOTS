'use client';

import { useEffect } from 'react';

import { useVOTPayment } from '@/hooks/useVOTPayment';

interface VOTPaymentButtonProps {
    amount: string;
    description: string;
    onSuccess?: () => void;
    recipientAddress: `0x${string}`;
}

export default function VOTPaymentButton({
    amount,
    description,
    onSuccess,
    recipientAddress,
}: VOTPaymentButtonProps) {
    const { payWithVOT, paymentState, isWriting } = useVOTPayment();

    useEffect(() => {
        if (paymentState.status === 'success' && onSuccess) {
            onSuccess();
        }
    }, [paymentState.status, onSuccess]);

    const handlePayment = async () => {
        await payWithVOT(recipientAddress, amount);
    };
    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={handlePayment}
                disabled={
                    isWriting ||
                    paymentState.status === 'pending' ||
                    paymentState.status === 'confirming'
                }
                className={`
          px-6 py-3 font-mono font-bold uppercase tracking-wider
          border-2 rounded-lg transition-all
          ${paymentState.status === 'success'
                        ? 'bg-green-500/10 border-green-400 text-green-400'
                        : paymentState.status === 'error'
                            ? 'bg-red-500/10 border-red-400 text-red-400'
                            : 'bg-orange-500/10 border-orange-400 text-orange-400 hover:bg-orange-500/20 hover:shadow-[0_0_20px_rgba(255,140,0,0.4)]'
                    }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
            >
                {paymentState.status === 'idle' && `💰 Pay ${amount} VOT`}
                {paymentState.status === 'pending' && '⏳ Preparing...'}
                {paymentState.status === 'confirming' && '🔄 Confirming...'}
                {paymentState.status === 'success' && '✅ Payment Complete!'}
                {paymentState.status === 'error' && '❌ Payment Failed'}
            </button>

            <p className="text-sm text-gray-400 font-mono text-center">{description}</p>

            {paymentState.error && (
                <p className="text-sm text-red-400 font-mono text-center">{paymentState.error}</p>
            )}
        </div>
    );
}
