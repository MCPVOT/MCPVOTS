"use client";

import X402GaslessOrderPanel from "@/components/X402GaslessOrderPanel";
import { useOptionalFarcasterContext } from "@/providers/FarcasterMiniAppProvider";

const USD_OPTIONS = [1, 10, 100, 1000];

export function VOTOrderPanel() {
    const farcasterContext = useOptionalFarcasterContext();
    const isMiniApp = farcasterContext?.isInMiniApp ?? false;

    const ctaLabel = isMiniApp ? "Submit Facilitator Request" : "Launch x402 Payment";
    const orderLabel = isMiniApp ? "Notify Facilitator" : "Launch x402 Payment";
    const quoteExpiryHint = "Quote expires in ~20 seconds, so the flow auto-refreshes if you wait too long.";
    const farcasterNote = isMiniApp
        ? `Connect your Base wallet to submit the live facilitator request • Coinbase validates custody before settlement clears. ${quoteExpiryHint} • NEW: Auto resource consumption enabled`
        : `Connect any Base wallet to trigger the Coinbase facilitator checkout. Settlement references appear inside the Farcaster x402 action. ${quoteExpiryHint} • NEW: Auto resource consumption enabled`;
    const quoteBottom = isMiniApp
        ? `After confirmation, track the facilitator settlement reference inside your x402 flow. ${quoteExpiryHint}`
        : `After confirmation, the facilitator finalizes the x402 gasless payment. ${quoteExpiryHint}`;

    return (
        <X402GaslessOrderPanel
            tokenSymbol="VOT"
            tokenName="VOT"
            quoteEndpoint="/api/vot/order"
            orderEndpoint="/api/vot/order"
            x402Endpoint="/api/x402/facilitator?token=VOT"
            usdOptions={USD_OPTIONS}
            headerTitle="▶ VOT FACILITATOR"
            description="Gasless $USDC → $VOT Conversion • x402 Protocol • 1% Burn • Auto Replenish"
            highlightBadge="ONLINE"
            primerDescription="$1 • $10 • $100 • $1000 presets — vault pays gas • 1% burn on every purchase"
            farcasterNote={farcasterNote}
            gradientStyle="emerald"
            disclaimers={[
                "CDP facilitator executes x402 charge, vault covers all gas fees.",
                "1% of replenished VOT is automatically burned to reduce supply.",
                "Treasury auto-replenishes: USDC → WETH → VOT after each purchase.",
                "Settlement reference stored in MCP Memory until webhook closes the loop."
            ]}
            ctaLabel={ctaLabel}
            orderButtonLabel={orderLabel}
            quoteInstructions={{
                bottom: quoteBottom
            }}
        />
    );
}

export default VOTOrderPanel;
