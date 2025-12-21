import llmCache from '@/lib/llm-cache';
import OpenAI from 'openai';

const USE_VERCEL_AI_SDK = process.env.USE_VERCEL_AI_SDK === 'true';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
// Default to a cost-conscious model; can be overridden via OPENROUTER_MODEL env
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'kwaipilot/kat-coder-pro:free';

export async function summarizePurchaseFailure(params: {
    entryId: string;
    payer: string;
    usdAmount: number;
    errorMessage?: string | null;
    stdout?: string | null;
    stderr?: string | null;
    paymentHash?: string | null;
}): Promise<{ issueType: string; severity: string; recommendedActions: string[]; explanation?: string } | null> {
    const LLM_ENABLED = process.env.LLM_SUMMARY_ENABLED === 'true' && !!OPENROUTER_API_KEY;
    if (!LLM_ENABLED) {
        console.warn('[OpenRouter] API key not configured; skipping summarization.');
        return null;
    }

    const ttlHours = Number(process.env.LLM_SUMMARY_TTL_HOURS ?? '24');
    const cached = await llmCache.getLLMSummary(params.entryId, ttlHours);
    if (cached) {
        try {
            const parsed = JSON.parse(cached.summary);
            return parsed as { issueType: string; severity: string; recommendedActions: string[]; explanation?: string };
        } catch (err) {
            console.warn('[OpenRouter] Failed to parse cached LLM summary, will re-run:', err);
        }
    }

    try {
        // Sanitize logs: only keep first 3 lines from stdout/stderr and redact hex strings
        const sanitize = (s?: string | null) => {
            if (!s) return '';
            const lines = s.split('\n').slice(0, 3);
            return lines.map((l) => l.replace(/0x[a-fA-F0-9]{6,}/g, '<REDACTED_ADDR>')).join('\n');
        };

        const userMessage = `x402 purchase failed\n- entryId: ${params.entryId}\n- payer: ${params.payer}\n- usdAmount: ${params.usdAmount}\n- paymentHash: ${params.paymentHash}\n- errorMessage: ${params.errorMessage}\n- stdout:\n${sanitize(params.stdout)}\n- stderr:\n${sanitize(params.stderr)}\n\nPlease analyze and return a JSON object with the following fields: {"issueType":"string","severity":"low|medium|high","recommendedActions":["..."],"explanation":"string"}. Keep the response concise and do not include any private keys or signatures.`;

        let raw: string | null = null;
        // Try Vercel AI SDK streaming path if configured and available
        if (USE_VERCEL_AI_SDK) {
            try {
                // Use an indirect dynamic import to avoid the Next.js bundler complaining when
                // @openrouter/ai-sdk-provider or 'ai' is not installed in the environment.
                const module1 = await new Function('m', 'return import(m)')("@openrouter/ai-sdk-provider").catch(() => null);
                const module2 = await new Function('m', 'return import(m)')('ai').catch(() => null);
                if (module1 && module2) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const { createOpenRouter } = module1 as any;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const { streamText } = module2 as any;
                    const openrouter = createOpenRouter({ apiKey: OPENROUTER_API_KEY });
                    const response = streamText({ model: openrouter(OPENROUTER_MODEL), prompt: userMessage });
                    await response.consumeStream();
                    raw = response.text;
                }
            } catch (err) {
                console.warn('[OpenRouter] Vercel AI SDK not available or failed to run; falling back to OpenAI client:', err);
            }
        }

        // Fallback to OpenAI client (openrouter baseURL)
        if (!raw) {
            const client = new OpenAI({ apiKey: OPENROUTER_API_KEY, baseURL: 'https://openrouter.ai/api/v1' } as never);
            const completion = await client.chat.completions.create({
                model: OPENROUTER_MODEL,
                messages: [
                    { role: 'system', content: 'You are an assistant for diagnosing MCPVOT x402 purchase failures. Provide concise, actionable remediation steps.' },
                    { role: 'user', content: userMessage }
                ],
                max_tokens: 300,
                temperature: 0
            });
            raw = completion.choices?.[0]?.message?.content ?? null;
        }
        if (!raw) return null;

        // Try to parse JSON from the model output - allow the model to return code fences
        const jsonText = (() => {
            const match = raw.match(/```json\s*([\s\S]*?)```/i);
            if (match) return match[1].trim();
            return raw.trim();
        })();

        try {
            const parsed = JSON.parse(jsonText);
            // Cache the parsed summary
            try {
                await llmCache.setLLMSummary(params.entryId, OPENROUTER_MODEL, parsed);
            } catch (err) { console.warn('[OpenRouter] Failed to cache LLM summary:', err); }
            return {
                issueType: parsed.issueType ?? 'unknown',
                severity: parsed.severity ?? 'medium',
                recommendedActions: parsed.recommendedActions ?? [],
                explanation: parsed.explanation ?? ''
            };
        } catch (parseErr: unknown) {
            console.warn('[OpenRouter] parse JSON failed:', parseErr);
            // Fallback: return the raw message as explanation
            return {
                issueType: 'unparsed-response',
                severity: 'low',
                recommendedActions: ['OpenRouter returned non-JSON response'],
                explanation: raw
            };
        }
    } catch (err) {
        console.warn('[OpenRouter] Summarize failed:', err instanceof Error ? err.message : String(err));
        return null;
    }
}

export default summarizePurchaseFailure;
