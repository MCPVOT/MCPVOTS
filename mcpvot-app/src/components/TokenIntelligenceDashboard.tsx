'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

interface TokenIntelligence {
    name: string;
    symbol: string;
    address: string;
    price_usd?: number;
    liquidity_usd?: number;
    volume_24h?: number;
    links?: {
        website?: string;
        twitter?: string;
        docs?: string;
    };
    intelligence_score?: {
        score: number;
        rating: string;
    };
    farcaster_data?: {
        cast_count: number;
        unique_authors: number;
        sentiment_score: number;
        top_authors: Array<{
            username: string;
            follower_count: number;
        }>;
        total_followers?: number;
        avg_followers_per_author?: number;
        power_users?: number;
        verified_users?: number;
        top_channels?: Array<{
            name: string;
            cast_count: number;
        }>;
    };
    recommendation?: string;
    analysis_timestamp?: string;
    dex_data?: {
        price: number;
        change_24h: number;
        liquidity: number;
        volume_24h: number;
        dex: string;
    };
}

interface StoredIntelligenceReport {
    id?: number;
    content: string;
    timestamp?: number;
}

// Terminal-style animated intelligence display
function IntelligenceTerminal({ tokenData }: { tokenData: TokenIntelligence }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const textRef = useRef<THREE.Mesh>(null);
    const nftFrameRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005;
            meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        }
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        }
        if (textRef.current) {
            textRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.02;
        }
        if (nftFrameRef.current) {
            nftFrameRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
        }
    });

    const getRatingColor = useCallback(() => {
        const rating = tokenData.intelligence_score?.rating || 'UNKNOWN';
        switch (rating.toUpperCase()) {
            case 'EXCELLENT': return new THREE.Color(0x00ff88);
            case 'VERY_GOOD': return new THREE.Color(0x00ccff);
            case 'GOOD': return new THREE.Color(0xffaa00);
            case 'FAIR': return new THREE.Color(0xff8844);
            default: return new THREE.Color(0xff4444);
        }
    }, [tokenData.intelligence_score?.rating]);

    const terminalMaterial = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uScanLine: { value: 0 },
            uColor: { value: getRatingColor() },
            uGlitch: { value: 0 },
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            uniform float uGlitch;
            void main() {
                vUv = uv;
                vPosition = position;
                vec3 pos = position;
                pos.x += sin(pos.y * 10.0 + uGlitch * 100.0) * uGlitch;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform float uScanLine;
            uniform vec3 uColor;
            uniform float uGlitch;
            varying vec2 vUv;
            varying vec3 vPosition;

            void main() {
                vec2 uv = vUv;

                // Terminal scan line effect
                float scan = smoothstep(0.48, 0.52, abs(uv.y - uScanLine));
                float scanGlow = smoothstep(0.45, 0.55, abs(uv.y - uScanLine));

                // Grid pattern
                vec2 grid = fract(uv * 20.0);
                float gridLine = min(
                    smoothstep(0.0, 0.02, grid.x),
                    smoothstep(0.0, 0.02, grid.y)
                );

                // Animated noise
                float noise = sin(uv.x * 50.0 + uTime * 3.0) * sin(uv.y * 30.0 + uTime * 2.0) * 0.1;

                // Glitch effect
                float glitch = sin(uv.y * 100.0 + uTime * 20.0) * uGlitch;

                vec3 color = uColor * 0.3;
                color += gridLine * uColor * 0.5;
                color += scan * uColor * 2.0;
                color += scanGlow * uColor * 0.5;
                color += noise;
                color += glitch;

                // Vignette effect
                float vignette = 1.0 - length(uv - 0.5) * 0.5;
                color *= vignette;

                gl_FragColor = vec4(color, 0.9);
            }
        `,
        transparent: true,
    }), [getRatingColor]);

    return (
        <group>
            {/* NFT Frame */}
            <mesh ref={nftFrameRef}>
                <torusGeometry args={[3, 0.1, 8, 16]} />
                <meshBasicMaterial color={getRatingColor()} transparent opacity={0.6} />
            </mesh>

            {/* Main terminal screen */}
            <mesh ref={meshRef}>
                <boxGeometry args={[2.5, 1.8, 0.1]} />
                <primitive object={terminalMaterial} ref={materialRef} />
                <lineSegments>
                    <edgesGeometry args={[new THREE.BoxGeometry(2.5, 1.8, 0.1)]} />
                    <lineBasicMaterial color={getRatingColor()} linewidth={2} />
                </lineSegments>
            </mesh>

            {/* Floating intelligence score */}
            <mesh position={[0, 0, 0.06]}>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial
                    color={getRatingColor()}
                    transparent
                    opacity={0.8}
                    emissive={getRatingColor()}
                    emissiveIntensity={0.2}
                />
            </mesh>

            {/* Floating data points */}
            {tokenData.farcaster_data && (
                <group>
                    {Array.from({ length: Math.min(tokenData.farcaster_data.cast_count, 20) }).map((_, i) => (
                        <mesh key={i} position={[
                            (Math.cos(i * Math.PI / 10) * 3),
                            Math.sin(i * 0.5) * 0.5,
                            -Math.sin(i * Math.PI / 10) * 3
                        ]}>
                            <sphereGeometry args={[0.02, 8, 8]} />
                            <meshBasicMaterial
                                color={getRatingColor()}
                                transparent
                                opacity={0.6}
                            />
                        </mesh>
                    ))}
                </group>
            )}

            {/* Data streams */}
            <group>
                {Array.from({ length: 5 }).map((_, i) => (
                    <mesh key={`stream-${i}`} position={[2.8, -0.8 + i * 0.4, 0]}>
                        <planeGeometry args={[0.5, 0.05]} />
                        <meshBasicMaterial
                            color={getRatingColor()}
                            transparent
                            opacity={0.4}
                        />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

// Intelligence metrics display
function IntelligenceMetrics({ tokenData }: { tokenData: TokenIntelligence }) {
    const [currentMetric, setCurrentMetric] = useState(0);
    const metrics = [
        { label: 'SCORE', value: tokenData.intelligence_score?.score || 0, unit: '/100' },
        { label: 'LIQUIDITY', value: tokenData.liquidity_usd || 0, unit: ' USD', format: true },
        { label: 'VOLUME', value: tokenData.volume_24h || 0, unit: ' USD', format: true },
        { label: 'CASTS', value: tokenData.farcaster_data?.cast_count || 0, unit: '' },
        { label: 'AUTHORS', value: tokenData.farcaster_data?.unique_authors || 0, unit: '' },
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentMetric((prev) => (prev + 1) % metrics.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [metrics.length]);

    const formatValue = (value: number, format: boolean = false) => {
        if (format && value > 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
        } else if (format && value > 1000) {
            return `$${(value / 1000).toFixed(1)}K`;
        }
        return format ? `$${value.toLocaleString()}` : value.toString();
    };

    const metric = metrics[currentMetric];

    return (
        <div className="intelligence-metrics">
            <div className="metric-display">
                <div className="metric-label">{metric.label}</div>
                <div className="metric-value">
                    {formatValue(metric.value, metric.format)}{metric.unit}
                </div>
            </div>
            <div className="metric-progress">
                <div
                    className="metric-progress-fill"
                    style={{
                        width: `${Math.min((metric.value / (metric.label === 'SCORE' ? 100 : metric.value * 2)) * 100, 100)}%`
                    }}
                />
            </div>
        </div>
    );
}

export default function TokenIntelligenceDashboard({ tokenAddress }: { tokenAddress: string }) {
    const [tokenData, setTokenData] = useState<TokenIntelligence | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [storedIntelligence, setStoredIntelligence] = useState<StoredIntelligenceReport[]>([]);
    const [isCasting, setIsCasting] = useState(false);
    const [castResult, setCastResult] = useState<{ success: boolean; hash?: string; error?: string } | null>(null);
    const [showStoredReports, setShowStoredReports] = useState(false);

    // Fetch token intelligence data
    useEffect(() => {
        const fetchIntelligence = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/token-intelligence?address=${tokenAddress}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch intelligence data');
                }
                const data = await response.json();
                setTokenData(data);
            } catch (err) {
                console.error('Intelligence fetch error:', err);
                setError('Failed to load intelligence data. Please try again or check API configuration.');
            } finally {
                setLoading(false);
            }
        };

        fetchIntelligence();
    }, [tokenAddress]);

    // Fetch stored intelligence from MCP memory
    const fetchStoredIntelligence = useCallback(async () => {
        try {
            const response = await fetch('/api/mcp-memory?category=clanker_intelligence&limit=10');
            if (response.ok) {
                const data = await response.json();
                setStoredIntelligence(data.memories || []);
            }
        } catch (err) {
            console.warn('Failed to fetch stored intelligence:', err);
        }
    }, []);

    useEffect(() => {
        fetchStoredIntelligence();
    }, [fetchStoredIntelligence]);

    // Cast intelligence report to Farcaster
    const castIntelligenceReport = useCallback(async () => {
        if (!tokenData) return;

        setIsCasting(true);
        setCastResult(null);

        try {
            // Format the intelligence report for Farcaster
            const reportText = `🔍 TOKEN INTELLIGENCE REPORT: ${tokenData.name} (${tokenData.symbol})

📊 Intelligence Score: ${tokenData.intelligence_score?.score || 0}/100 (${tokenData.intelligence_score?.rating || 'UNKNOWN'})

💰 Price: $${tokenData.price_usd?.toFixed(8) || 'N/A'}
💧 Liquidity: $${(tokenData.liquidity_usd || 0).toLocaleString()}
📈 24h Volume: $${(tokenData.volume_24h || 0).toLocaleString()}

📣 Social Data:
• ${tokenData.farcaster_data?.cast_count || 0} casts found
• ${tokenData.farcaster_data?.unique_authors || 0} unique authors
• Sentiment: ${tokenData.farcaster_data?.sentiment_score ? (tokenData.farcaster_data.sentiment_score > 0 ? 'POSITIVE' : tokenData.farcaster_data.sentiment_score < 0 ? 'NEGATIVE' : 'NEUTRAL') : 'N/A'}

🎯 Recommendation: ${tokenData.recommendation || 'Analysis in progress'}

#MCPVOT #TokenIntelligence #Base #DeFi #${tokenData.symbol}`;

            const response = await fetch('/api/farcaster/cast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: reportText,
                    embeds: tokenData.links?.website ? [{ url: tokenData.links.website }] : []
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setCastResult({
                    success: true,
                    hash: result.hash
                });
                console.log('Successfully cast intelligence report:', result);
            } else {
                setCastResult({
                    success: false,
                    error: result.error || 'Failed to cast report'
                });
            }
        } catch (error) {
            console.error('Error casting intelligence report:', error);
            setCastResult({
                success: false,
                error: 'Network error while casting'
            });
        } finally {
            setIsCasting(false);
        }
    }, [tokenData]);

    if (loading) {
        return (
            <div className="intelligence-dashboard intelligence-dashboard--loading">
                <div className="loading-terminal">
                    <div className="terminal-header">
                        <span className="terminal-title">MCPVOT INTELLIGENCE</span>
                        <span className="terminal-status">LOADING...</span>
                    </div>
                    <div className="terminal-screen">
                        <div className="loading-animation">
                            <div className="loading-bar" />
                            <div className="loading-text">ANALYZING TOKEN DATA...</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !tokenData) {
        return (
            <div className="intelligence-dashboard intelligence-dashboard--error">
                <div className="error-terminal">
                    <div className="terminal-header">
                        <span className="terminal-title">ERROR</span>
                        <span className="terminal-status">SYSTEM FAILURE</span>
                    </div>
                    <div className="terminal-screen">
                        <div className="error-message">{error || 'No data available'}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="intelligence-dashboard">
            {/* Header */}
            <div className="intelligence-header">
                <div className="intelligence-title">
                    <span className="title-main">TOKEN INTELLIGENCE</span>
                    <span className="title-sub">{tokenData.name} ({tokenData.symbol})</span>
                    {tokenData.analysis_timestamp && (
                        <span className="title-timestamp">
                            Analyzed: {new Date(tokenData.analysis_timestamp).toLocaleString()}
                        </span>
                    )}
                </div>
                <div className="intelligence-status">
                    <span className={`status-badge status-badge--${tokenData.intelligence_score?.rating.toLowerCase()} intelligence-score-animated`}>
                        {tokenData.intelligence_score?.rating}
                    </span>
                    <span className="status-score">{tokenData.intelligence_score?.score}/100</span>
                </div>

                {/* Cast Intelligence Button */}
                <div className="intelligence-actions">
                    <button
                        onClick={castIntelligenceReport}
                        disabled={isCasting}
                        className={`cast-intelligence-btn ${isCasting ? 'casting' : ''}`}
                    >
                        {isCasting ? (
                            <>
                                <div className="casting-spinner" />
                                CASTING...
                            </>
                        ) : (
                            <>
                                📡 CAST INTELLIGENCE
                            </>
                        )}
                    </button>

                    {castResult && (
                        <div className={`cast-result ${castResult.success ? 'success' : 'error'}`}>
                            {castResult.success ? (
                                <>
                                    ✅ Cast successful!
                                    {castResult.hash && (
                                        <a
                                            href={`https://warpcast.com/~/conversations/${castResult.hash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="cast-link"
                                        >
                                            View on Warpcast
                                        </a>
                                    )}
                                </>
                            ) : (
                                <>❌ {castResult.error}</>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="intelligence-grid">
                {/* 3D Terminal Visualization */}
                <div className="intelligence-visual">
                    <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
                        <ambientLight intensity={0.4} />
                        <pointLight position={[5, 5, 5]} intensity={0.8} color="#00ff88" />
                        <pointLight position={[-5, -5, -5]} intensity={0.6} color="#0066ff" />
                        <IntelligenceTerminal tokenData={tokenData} />
                    </Canvas>
                    <div className="visual-overlay">
                        <div className="scan-line" />
                        <div className="corner-decoration corner-decoration--tl" />
                        <div className="corner-decoration corner-decoration--tr" />
                        <div className="corner-decoration corner-decoration--bl" />
                        <div className="corner-decoration corner-decoration--br" />
                    </div>
                </div>

                {/* Intelligence Panels */}
                <div className="intelligence-panels">
                    {/* Token Info Panel */}
                    <div className="data-panel">
                        <div className="panel-header">
                            <span className="panel-title">TOKEN METADATA</span>
                        </div>
                        <div className="panel-content">
                            <div className="data-row">
                                <span className="data-label">ADDRESS</span>
                                <span className="data-value data-value--mono">
                                    {tokenData.address && typeof tokenData.address === 'string'
                                        ? `${tokenData.address.slice(0, 10)}...${tokenData.address.slice(-8)}`
                                        : 'N/A'
                                    }
                                </span>
                            </div>
                            <div className="data-row">
                                <span className="data-label">PRICE</span>
                                <span className="data-value data-value--success">
                                    ${tokenData.price_usd?.toFixed(8) || 'N/A'}
                                </span>
                            </div>
                            <div className="data-row">
                                <span className="data-label">LIQUIDITY</span>
                                <span className="data-value">
                                    ${(tokenData.liquidity_usd || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* DEX Data Panel */}
                    {tokenData.dex_data && (
                        <div className="data-panel dex-data-enhanced">
                            <div className="panel-header">
                                <span className="panel-title">DEX DATA</span>
                            </div>
                            <div className="panel-content">
                                <div className="dex-metric-enhanced">
                                    <span className="dex-label-enhanced">PRICE</span>
                                    <span className="dex-value-enhanced">
                                        ${tokenData.dex_data.price.toFixed(8)}
                                    </span>
                                </div>
                                <div className="dex-metric-enhanced">
                                    <span className="dex-label-enhanced">24H CHANGE</span>
                                    <span className={`dex-value-enhanced ${tokenData.dex_data.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {tokenData.dex_data.change_24h >= 0 ? '+' : ''}{tokenData.dex_data.change_24h.toFixed(2)}%
                                    </span>
                                </div>
                                <div className="dex-metric-enhanced">
                                    <span className="dex-label-enhanced">LIQUIDITY</span>
                                    <span className="dex-value-enhanced">
                                        ${(tokenData.dex_data.liquidity || 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="dex-metric-enhanced">
                                    <span className="dex-label-enhanced">24H VOLUME</span>
                                    <span className="dex-value-enhanced">
                                        ${(tokenData.dex_data.volume_24h || 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="dex-metric-enhanced">
                                    <span className="dex-label-enhanced">DEX</span>
                                    <span className="dex-value-enhanced">
                                        {tokenData.dex_data.dex.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Links Panel */}
                    <div className="data-panel">
                        <div className="panel-header">
                            <span className="panel-title">EXTERNAL LINKS</span>
                        </div>
                        <div className="panel-content">
                            {tokenData.links?.website && (
                                <div className="link-row">
                                    <span className="link-icon">🌐</span>
                                    <a
                                        href={tokenData.links.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link-text"
                                    >
                                        {tokenData.links.website.replace('https://', '')}
                                    </a>
                                </div>
                            )}
                            {tokenData.links?.twitter && (
                                <div className="link-row">
                                    <span className="link-icon">🐦</span>
                                    <a
                                        href={tokenData.links.twitter}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link-text"
                                    >
                                        @{tokenData.links.twitter.split('/').pop()}
                                    </a>
                                </div>
                            )}
                            {tokenData.links?.docs && (
                                <div className="link-row">
                                    <span className="link-icon">📄</span>
                                    <a
                                        href={tokenData.links.docs}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link-text"
                                    >
                                        Documentation
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Farcaster Intelligence */}
                    {tokenData.farcaster_data && (
                        <div className="data-panel data-panel--farcaster">
                            <div className="panel-header">
                                <span className="panel-title">FARCASTER INTEL</span>
                                <span className="panel-subtitle">Real-time Social Analysis</span>
                            </div>
                            <div className="panel-content">
                                <div className="farcaster-enhanced-grid">
                                    <div className="farcaster-card-enhanced">
                                        <div className="farcaster-metric-enhanced">
                                            <span className="farcaster-metric-label-enhanced">CASTS</span>
                                            <span className="farcaster-metric-value-enhanced">{tokenData.farcaster_data.cast_count}</span>
                                        </div>
                                        <div className="farcaster-metric-enhanced">
                                            <span className="farcaster-metric-label-enhanced">AUTHORS</span>
                                            <span className="farcaster-metric-value-enhanced">{tokenData.farcaster_data.unique_authors}</span>
                                        </div>
                                        <div className="farcaster-metric-enhanced">
                                            <span className="farcaster-metric-label-enhanced">TOTAL FOLLOWERS</span>
                                            <span className="farcaster-metric-value-enhanced">{tokenData.farcaster_data.total_followers?.toLocaleString() || 'N/A'}</span>
                                        </div>
                                        <div className="farcaster-metric-enhanced">
                                            <span className="farcaster-metric-label-enhanced">AVG FOLLOWERS</span>
                                            <span className="farcaster-metric-value-enhanced">{tokenData.farcaster_data.avg_followers_per_author?.toFixed(0) || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="farcaster-card-enhanced">
                                        <div className="sentiment-indicator">
                                            <span className="sentiment-label">SENTIMENT</span>
                                            <span className={`sentiment-value ${tokenData.farcaster_data.sentiment_score > 0 ? 'sentiment-positive' : tokenData.farcaster_data.sentiment_score < 0 ? 'sentiment-negative' : 'sentiment-neutral'}`}>
                                                {tokenData.farcaster_data.sentiment_score > 0 ? 'POSITIVE' :
                                                    tokenData.farcaster_data.sentiment_score < 0 ? 'NEGATIVE' : 'NEUTRAL'}
                                                ({tokenData.farcaster_data.sentiment_score.toFixed(2)})
                                            </span>
                                        </div>

                                        <div className="power-users">
                                            <span className="power-users-label">POWER USERS</span>
                                            <span className="power-users-count">{tokenData.farcaster_data.power_users || 0}</span>
                                            <span className="verified-users-count">VERIFIED: {tokenData.farcaster_data.verified_users || 0}</span>
                                        </div>
                                    </div>

                                    <div className="farcaster-card-enhanced">
                                        <div className="top-authors">
                                            <span className="authors-label">TOP AUTHORS:</span>
                                            {tokenData.farcaster_data.top_authors.slice(0, 5).map((author, i) => (
                                                <div key={i} className="author-row">
                                                    <a
                                                        href={`https://warpcast.com/${author.username.replace('@', '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="farcaster-author-enhanced"
                                                    >
                                                        <span className="author-name">{author.username}</span>
                                                        <span className="author-followers">{author.follower_count.toLocaleString()} followers</span>
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {tokenData.farcaster_data.top_channels && tokenData.farcaster_data.top_channels.length > 0 && (
                                    <div className="top-channels">
                                        <span className="channels-label">TOP CHANNELS:</span>
                                        {tokenData.farcaster_data.top_channels.slice(0, 3).map((channel, i) => (
                                            <div key={i} className="channel-row">
                                                <span className="channel-name">#{channel.name}</span>
                                                <span className="channel-count">{channel.cast_count} casts</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Recommendation Panel */}
                    <div className="data-panel data-panel--recommendation">
                        <div className="panel-header">
                            <span className="panel-title">RECOMMENDATION</span>
                        </div>
                        <div className="panel-content">
                            <div className="recommendation-text">
                                {tokenData.recommendation}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Animated Metrics Display */}
            <div className="intelligence-footer">
                <IntelligenceMetrics tokenData={tokenData} />
            </div>

            {/* Stored Intelligence Reports */}
            {storedIntelligence.length > 0 && (
                <div className="stored-intelligence-section">
                    <div className="stored-intelligence-header">
                        <h3 className="stored-intelligence-title">🧠 STORED INTELLIGENCE REPORTS</h3>
                        <button
                            className="toggle-stored-reports-btn"
                            onClick={() => setShowStoredReports(!showStoredReports)}
                        >
                            {showStoredReports ? 'Hide' : 'Show'} Historical Reports ({storedIntelligence.length})
                        </button>
                    </div>

                    {showStoredReports && (
                        <div className="stored-reports-list">
                            {storedIntelligence.map((report, index) => (
                                <div key={report.id || index} className="stored-report-card">
                                    <div className="stored-report-header">
                                        <span className="stored-report-id">Report #{report.id}</span>
                                        <span className="stored-report-timestamp">
                                            {report.timestamp ? new Date(report.timestamp * 1000).toLocaleString() : 'Unknown'}
                                        </span>
                                    </div>
                                    <div className="stored-report-content">
                                        <pre className="stored-report-text">{report.content}</pre>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
