'use client';

import { useCallback, useState } from 'react';
import { parseEther } from 'viem';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';

const VOT_CONTRACT = process.env.NEXT_PUBLIC_VOT_CONTRACT as `0x${string}` | undefined;

const VOT_ABI = [
    {
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        name: 'transfer',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;

type PaymentStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

type PaymentState = {
    status: PaymentStatus;
    error?: string;
    hash?: `0x${string}`;
};

export function useVOTPayment() {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const { writeContractAsync, isPending: isWriting } = useWriteContract();

    const [paymentState, setPaymentState] = useState<PaymentState>({ status: 'idle' });

    const resetPayment = useCallback(() => {
        setPaymentState({ status: 'idle' });
    }, []);

    const payWithVOT = useCallback(
        async (to: `0x${string}`, amount: string) => {
            if (!address) {
                setPaymentState({ status: 'error', error: 'No wallet connected' });
                return;
            }

            if (!publicClient) {
                setPaymentState({ status: 'error', error: 'Public client unavailable' });
                return;
            }

            if (!VOT_CONTRACT) {
                setPaymentState({ status: 'error', error: 'VOT contract address not configured' });
                return;
            }

            try {
                setPaymentState({ status: 'pending' });

                const amountWei = parseEther(amount);

                const txHash = await writeContractAsync({
                    address: VOT_CONTRACT,
                    abi: VOT_ABI,
                    functionName: 'transfer',
                    args: [to, amountWei],
                });

                setPaymentState({ status: 'confirming', hash: txHash });

                const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

                if (receipt.status === 'success') {
                    setPaymentState({ status: 'success', hash: txHash });
                } else {
                    setPaymentState({
                        status: 'error',
                        error: 'Transaction reverted',
                        hash: txHash,
                    });
                }
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Payment failed';
                setPaymentState({ status: 'error', error: message });
            }
        },
        [address, publicClient, writeContractAsync]
    );

    return {
        payWithVOT,
        paymentState,
        isWriting,
        resetPayment,
    };
}
