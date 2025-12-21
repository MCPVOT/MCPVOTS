"use client";

import X402GaslessOrderPanel from "@/components/X402GaslessOrderPanel";
import { useOptionalFarcasterContext } from "@/providers/FarcasterMiniAppProvider";

const USD_OPTIONS = [1, 10, 100, 1000];

export function MAXXOrderPanel() {
    const farcasterContext = useOptionalFarcasterContext();
    const isMiniApp = farcasterContext?.isInMiniApp ?? false;

    const ctaLabel = isMiniApp ? "Submit MAXX Request" : "Launch x402 MAXX Payment";
    const orderLabel = isMiniApp ? "Get MAXX + VOT Bonus" : "Launch x402 MAXX Payment";
    const quoteExpiryHint = "Quote expires in ~20 seconds, so the flow auto-refreshes if you wait too long.";
    const farcasterNote = isMiniApp
        ? `Connect your Base wallet to purchase MAXX. Get 10,000 VOT bonus with every purchase! ${quoteExpiryHint}`
        : `Buy MAXX tokens + receive 10,000 VOT bonus! Treasury covers gas. ${quoteExpiryHint}`;
    const quoteBottom = isMiniApp
        ? `After confirmation, MAXX + VOT bonus delivered to your wallet. ${quoteExpiryHint}`
        : `After confirmation, receive MAXX tokens + 10,000 VOT bonus! ${quoteExpiryHint}`;

    return (
        <X402GaslessOrderPanel
            tokenSymbol="MAXX"
            tokenName="MAXX"
            quoteEndpoint="/api/maxx/order"
            orderEndpoint="/api/maxx/order"
            x402Endpoint="/api/x402/facilitator"
            usdOptions={USD_OPTIONS}
            headerTitle="▶ MAXX FACILITATOR"
            description="Gasless $USDC → $MAXX • x402 Protocol • +10,000 VOT Bonus!"
            highlightBadge="+ VOT BONUS"
            primerDescription="$1 • $10 • $100 • $1000 presets — vault pays gas • 🎁 10K VOT bonus included!"
            farcasterNote={farcasterNote}
            disclaimers={[
                "x402 facilitator executes swap: USDC → ETH → MAXX (native ETH).",
                "🎁 BONUS: Every MAXX purchase includes 10,000 VOT from treasury!",
                "Treasury covers all gas fees — completely gasless for you.",
                "Settlement reference stored in MCP Memory for verification."
            ]}
            ctaLabel={ctaLabel}
            orderButtonLabel={orderLabel}
            gradientStyle="emerald"
            quoteInstructions={{
                bottom: quoteBottom
            }}
        />
    );
}

export default MAXXOrderPanel;
