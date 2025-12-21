'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import AnimatedNFTViewer from './AnimatedNFTViewer';

const TOKEN_TYPES = [
    { id: 0, name: 'BASIC AGENT', maxSupply: 27328, price: 2.00, rarity: 'basic', desc: 'STANDARD NEURAL CORE' },
    { id: 1, name: 'PREMIUM AGENT', maxSupply: 6000, price: 2.00, rarity: 'premium', desc: 'ENHANCED PROTOCOLS' },
    { id: 2, name: 'LEGENDARY: MCPVOT', maxSupply: 1, price: 2.00, rarity: 'legendary', desc: 'UNIQUE ENTITY' },
    { id: 3, name: 'LEGENDARY: BASE', maxSupply: 1, price: 2.00, rarity: 'legendary', desc: 'UNIQUE ENTITY' },
    { id: 4, name: 'LEGENDARY: FARCASTER', maxSupply: 1, price: 2.00, rarity: 'legendary', desc: 'UNIQUE ENTITY' },
    { id: 5, name: 'LEGENDARY: WARPCAST', maxSupply: 1, price: 2.00, rarity: 'legendary', desc: 'UNIQUE ENTITY' },
    { id: 6, name: 'LEGENDARY: NEYNAR', maxSupply: 1, price: 2.00, rarity: 'legendary', desc: 'UNIQUE ENTITY' },
];

export default function NFTMint() {
    const { address, isConnected } = useAccount();
    const [selectedTokenId, setSelectedTokenId] = useState<number>(0);
    const [mintAmount, setMintAmount] = useState<number>(1);
    const [isMinting, setIsMinting] = useState(false);
    const [mintStatus, setMintStatus] = useState<string>('');

    const selectedToken = TOKEN_TYPES[selectedTokenId];
    const totalCost = selectedToken.price * mintAmount;

    const handleMint = async () => {
        if (!isConnected) {
            setMintStatus('⚠️ CONNECT WALLET REQUIRED');
            return;
        }

        setIsMinting(true);
        setMintStatus('🔄 INITIATING x402 PAYMENT...');

        try {
            // x402 handles the payment automatically
            // The payment flow is: User approves → x402 processes USDC → Mint executes
            const response = await fetch('/api/mint-nft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tokenId: selectedTokenId,
                    amount: mintAmount,
                    address: address,
                }),
            });

            const result = await response.json();

            if (result.success) {
                setMintStatus(`✅ AGENT #${result.tokenId} DEPLOYED`);
            } else {
                setMintStatus(`❌ DEPLOYMENT FAILED: ${result.error}`);
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setMintStatus(`❌ ERROR: ${errorMessage}`);
        } finally {
            setIsMinting(false);
        }
    };

    return (
        <div className="nft-mint-arcade">
            {/* Arcade Border */}
            <div className="arcade-border"></div>

            {/* Main Display */}
            <div className="arcade-screen">
                {/* Header */}
                <div className="arcade-header">
                    <div className="header-line"></div>
                    <h1 className="arcade-title">
                        <span className="glitch" data-text="AGENT DEPLOYMENT">AGENT DEPLOYMENT</span>
                    </h1>
                    <div className="header-line"></div>
                </div>

                {/* 3D Preview */}
                <div className="preview-zone">
                    <AnimatedNFTViewer
                        tokenId={selectedTokenId}
                        rarity={selectedToken.rarity as 'basic' | 'premium' | 'legendary'}
                    />
                    <div className="scanline"></div>
                </div>

                {/* Selection Grid */}
                <div className="selection-grid">
                    <div className="grid-label">SELECT AGENT TYPE:</div>
                    <div className="token-buttons">
                        {TOKEN_TYPES.slice(0, 3).map((token) => (
                            <button
                                key={token.id}
                                className={`token-btn ${selectedTokenId === token.id ? 'active' : ''}`}
                                onClick={() => setSelectedTokenId(token.id)}
                            >
                                <span className="btn-bracket">[</span>
                                {token.name}
                                <span className="btn-bracket">]</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats Display */}
                <div className="stats-panel">
                    <div className="stat-row">
                        <span className="stat-label">DESIGNATION:</span>
                        <span className="stat-value">{selectedToken.name}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">CLASSIFICATION:</span>
                        <span className="stat-value">{selectedToken.desc}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">MAX UNITS:</span>
                        <span className="stat-value">{selectedToken.maxSupply.toLocaleString()}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">COST PER UNIT:</span>
                        <span className="stat-value glow">${selectedToken.price.toFixed(2)} USDC</span>
                    </div>
                </div>

                {/* Amount Input */}
                {selectedToken.maxSupply > 1 && (
                    <div className="amount-input">
                        <label className="input-label">DEPLOYMENT QUANTITY:</label>
                        <input
                            type="number"
                            min="1"
                            max={Math.min(10, selectedToken.maxSupply)}
                            value={mintAmount}
                            onChange={(e) => setMintAmount(Math.max(1, parseInt(e.target.value) || 1))}
                            className="qty-input"
                        />
                    </div>
                )}

                {/* Deploy Button */}
                <button
                    onClick={handleMint}
                    disabled={!isConnected || isMinting}
                    className="deploy-btn"
                >
                    {isMinting ? (
                        <span className="btn-text">
                            <span className="loading-dots">PROCESSING</span>
                        </span>
                    ) : (
                        <span className="btn-text">
                            ▶ DEPLOY AGENT - ${totalCost.toFixed(2)} USDC
                        </span>
                    )}
                </button>

                {/* Status Display */}
                {mintStatus && (
                    <div className="status-terminal">
                        <div className="terminal-text">{mintStatus}</div>
                    </div>
                )}

                {/* Footer Info */}
                <div className="arcade-footer">
                    <div className="footer-text">
                        💳 POWERED BY x402 • PAYMENTS PROCESSED AUTOMATICALLY
                    </div>
                </div>
            </div>

        </div>
    );
}
