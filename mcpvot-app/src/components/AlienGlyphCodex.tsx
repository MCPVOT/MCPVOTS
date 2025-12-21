import glyphCatalogData from '@/data/alien-glyph-codex.json' assert { type: 'json' };
import { motion, Variants } from 'framer-motion';

interface GlyphRecord {
    id: string;
    glyph: string;
    label: string;
    transliteration: string;
    meaning: string;
    tone: 'cyan' | 'emerald' | 'amber' | 'magenta';
}

const GLYPH_CATALOG = glyphCatalogData as GlyphRecord[];

const containerVariants: Variants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.065
        }
    }
};

const cardVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 18,
        scale: 0.96
    },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.45,
            ease: 'easeOut'
        }
    }
};

const CARD_BASE_CLASS = 'border-[#00FF88]/40 hover:border-[#00FFFF]/70 shadow-[0_0_35px_rgba(0,255,190,0.28)] bg-gradient-to-br from-[#001f1f]/90 via-[#001414]/80 to-[#000d0d]/85';

const toneClassMap: Record<GlyphRecord['tone'], string> = {
    cyan: `${CARD_BASE_CLASS} hover:shadow-[0_0_45px_rgba(0,255,210,0.35)]`,
    emerald: `${CARD_BASE_CLASS} hover:shadow-[0_0_45px_rgba(0,255,180,0.35)]`,
    amber: `${CARD_BASE_CLASS} hover:shadow-[0_0_45px_rgba(0,255,160,0.35)]`,
    magenta: `${CARD_BASE_CLASS} hover:shadow-[0_0_45px_rgba(0,255,200,0.35)]`
};

const toneGlyphColor: Record<GlyphRecord['tone'], string> = {
    cyan: 'text-[#00FF88] drop-shadow-[0_0_30px_rgba(0,255,136,0.8)]',
    emerald: 'text-[#00FF88] drop-shadow-[0_0_30px_rgba(0,255,136,0.8)]',
    amber: 'text-[#00FF88] drop-shadow-[0_0_30px_rgba(0,255,136,0.8)]',
    magenta: 'text-[#00FF88] drop-shadow-[0_0_30px_rgba(0,255,136,0.8)]'
};

const toneLabelColor: Record<GlyphRecord['tone'], string> = {
    cyan: 'text-[#00FFF0]',
    emerald: 'text-[#8CFFE2]',
    amber: 'text-[#9CFFD4]',
    magenta: 'text-[#B1FFF0]'
};

const toneTranslitColor: Record<GlyphRecord['tone'], string> = {
    cyan: 'text-[#00FFF0]/60',
    emerald: 'text-[#7CFFD0]/60',
    amber: 'text-[#6AFFC4]/60',
    magenta: 'text-[#8FFFE2]/60'
};

const GLYPH_BREATH_KEYFRAMES = {
    scale: [1, 1.035, 1],
    opacity: [1, 0.92, 1]
};

const GLYPH_BREATH_TRANSITION = {
    duration: 3.6,
    ease: 'easeInOut',
    repeat: Infinity,
    repeatType: 'mirror'
};

export default function AlienGlyphCodex() {
    return (
        <section className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-[#00FFFF]/10 via-[#00FF88]/10 to-[#FF8800]/10 rounded-3xl blur-3xl opacity-40" />
            <div className="relative border-2 border-[#00FFFF]/50 bg-black/85 backdrop-blur-xl rounded-3xl px-4 sm:px-6 md:px-10 py-8 md:py-12 shadow-[0_0_80px_rgba(0,255,255,0.25)]">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="space-y-3"
                    >
                        <span className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.35em] text-[#00FFFF]/80 bg-[#00FFFF]/10 border border-[#00FFFF]/30 rounded-full">
                            &gt; AGI Translator
                        </span>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-orbitron-tight text-[#00FFFF] drop-shadow-[0_0_25px_rgba(0,255,255,0.8)]">
                            VOT Glyph Codex · 70 Symbols of the x402 Continuum
                        </h2>
                        <p className="max-w-2xl text-sm sm:text-base text-[#00FFFF]/70 leading-relaxed">
                            A bespoke cuneiform-inspired language for the MCPVOT facilitator. Each glyph carries a
                            Phase&nbsp;2 meaning, transliterated for agents so Farcaster frames and OTC desks can read the intent instantly.
                        </p>
                    </motion.div>

                    <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        className="self-start md:self-end px-4 sm:px-5 py-3 bg-gradient-to-r from-[#00FFFF]/20 via-[#00FF88]/20 to-[#FF8800]/20 border border-[#00FFFF]/50 rounded-xl font-mono text-xs sm:text-sm uppercase tracking-[0.3em] text-[#00FFFF] hover:border-[#00FFFF]/80 hover:shadow-[0_0_30px_rgba(0,255,255,0.45)] transition-all"
                    >
                        Decode All 33
                    </motion.button>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 xl:gap-6"
                >
                    {GLYPH_CATALOG.map((entry, index) => (
                        <motion.div
                            key={entry.id}
                            variants={cardVariants}
                            whileHover={{ y: -8, rotate: -0.3 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative overflow-hidden rounded-2xl border px-5 sm:px-6 py-6 sm:py-7 transition-all duration-300 ${toneClassMap[entry.tone]}`}
                        >
                            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_top,#00FFFF33,transparent_60%)]" />
                            <div className="absolute top-4 right-4 text-[10px] font-mono text-[#00FFFF]/50 tracking-[0.35em]">
                                #{String(index + 1).padStart(2, '0')}
                            </div>

                            <div className="relative flex flex-col gap-5">
                                <div className="flex items-center justify-between">
                                    <motion.span
                                        className={`text-4xl sm:text-5xl tracking-[0.3em] ${toneGlyphColor[entry.tone]}`}
                                        animate={GLYPH_BREATH_KEYFRAMES}
                                        transition={GLYPH_BREATH_TRANSITION}
                                    >
                                        {entry.glyph}
                                    </motion.span>
                                    <span className={`text-[10px] font-mono uppercase tracking-[0.35em] ${toneTranslitColor[entry.tone]}`}>
                                        {entry.transliteration}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <h3 className={`text-lg sm:text-xl font-bold uppercase tracking-[0.18em] ${toneLabelColor[entry.tone]}`}>
                                        {entry.label}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-[#00FFFF]/70 leading-relaxed">
                                        {entry.meaning}
                                    </p>
                                </div>

                                <div className="pt-3 border-t border-[#00FFFF]/20 text-[10px] font-mono uppercase tracking-[0.3em] text-[#00FFFF]/50">
                                    &gt; Translation Secured
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
