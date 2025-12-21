"use client";

import X402GaslessOrderPanel from "@/components/X402GaslessOrderPanel";

const USD_OPTIONS = [4.2];

export function X420GaslessOrderPanel() {
    return (
        <X402GaslessOrderPanel
            tokenSymbol="x420"
            tokenName="x420"
            quoteEndpoint="/api/x420/order"
            orderEndpoint="/api/x420/order"
            usdOptions={USD_OPTIONS}
            headerTitle="x420 Gasless Buy"
            description="Queue $4.20 USDC gaslessly into the x420 Base liquidity campaign via x402."
            highlightBadge="Vault sponsors gas; facilitator only debits USDC principal."
            primerDescription="Every queue entry earmarks $4.20 USDC. Treasury restocks gas immediately after facilitator settlement."
            farcasterNote="Optimized for Farcaster mini-app — wallet optional until you confirm the queue."
            disclaimers={[
                "Coinbase CDP facilitator validates the payment; treasury wallet covers gas on Base.",
                "Settlement receipts stream into MCP Memory so Farcaster mini-apps can render instant status.",
                "When the x402MKT facilitator goes live this flow will distribute native $x420 without USDC bridging."
            ]}
            modalTitleFormatter={(amount: number, _symbol: string, name: string) => `$${amount.toFixed(2)} → ${name}`}
            orderButtonLabel="Request x402 Paycode"
            ctaLabel="Launch Gasless x420 Buy"
            quoteInstructions={{
                top: "Fixed $4.20 size to keep facilitator verification deterministic."
            }}
        />
    );
}

export default X420GaslessOrderPanel;
