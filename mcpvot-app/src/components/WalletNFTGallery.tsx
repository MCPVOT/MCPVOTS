'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import ArcadeNFTTerminal from './ArcadeNFTTerminal';

interface NFT {
    tokenId: number;
    name: string;
    rarity: 'root' | 'operator' | 'sentinel' | 'architekt' | 'legendary';
    balance: number;
}

export default function WalletNFTGallery() {
    const { address, isConnected } = useAccount();
    const [nfts, setNfts] = useState<NFT[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isConnected || !address) {
            setNfts([]);
            return;
        }

        const fetchWalletNFTs = async () => {
            setLoading(true);
            setError(null);

            try {
                // Call our API to get user's NFTs
                const response = await fetch(`/api/wallet-nfts?address=${address}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch NFTs');
                }

                const data = await response.json();
                setNfts(data.nfts || []);
            } catch (err) {
                console.error('Error fetching wallet NFTs:', err);
                setError('Failed to load your NFTs. Please try again.');
                setNfts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchWalletNFTs();
    }, [address, isConnected]);

    if (!isConnected) {
        return (
            <div className="wallet-nft-gallery">
                <div className="empty-state">
                    <div className="empty-icon">🔌</div>
                    <h3>Connect Wallet</h3>
                    <p>Connect your wallet to view your MCPVOT Agent NFTs</p>
                </div>

                <style jsx>{`
                    .wallet-nft-gallery {
                        padding: 40px 20px;
                        text-align: center;
                    }

                    .empty-state {
                        max-width: 400px;
                        margin: 0 auto;
                        padding: 60px 40px;
                        background: #000000ee;
                        border: 2px solid #00ff8844;
                        border-radius: 12px;
                    }

                    .empty-icon {
                        font-size: 64px;
                        margin-bottom: 20px;
                        opacity: 0.5;
                    }

                    h3 {
                        color: #00ff88;
                        font-size: 24px;
                        font-weight: bold;
                        letter-spacing: 2px;
                        margin-bottom: 12px;
                        text-transform: uppercase;
                    }

                    p {
                        color: #00ff88aa;
                        font-size: 14px;
                        line-height: 1.6;
                    }
                `}</style>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="wallet-nft-gallery">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading your Agent NFTs...</p>
                </div>

                <style jsx>{`
                    .wallet-nft-gallery {
                        padding: 40px 20px;
                        text-align: center;
                    }

                    .loading-state {
                        max-width: 400px;
                        margin: 0 auto;
                        padding: 60px 40px;
                    }

                    .loading-spinner {
                        width: 60px;
                        height: 60px;
                        margin: 0 auto 24px;
                        border: 4px solid #00ff8822;
                        border-top-color: #00ff88;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }

                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }

                    p {
                        color: #00ff88;
                        font-size: 16px;
                        letter-spacing: 2px;
                        text-transform: uppercase;
                    }
                `}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div className="wallet-nft-gallery">
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <h3>Error Loading NFTs</h3>
                    <p>{error}</p>
                </div>

                <style jsx>{`
                    .wallet-nft-gallery {
                        padding: 40px 20px;
                        text-align: center;
                    }

                    .error-state {
                        max-width: 400px;
                        margin: 0 auto;
                        padding: 60px 40px;
                        background: #ff444422;
                        border: 2px solid #ff4444;
                        border-radius: 12px;
                    }

                    .error-icon {
                        font-size: 64px;
                        margin-bottom: 20px;
                    }

                    h3 {
                        color: #ff4444;
                        font-size: 24px;
                        font-weight: bold;
                        letter-spacing: 2px;
                        margin-bottom: 12px;
                        text-transform: uppercase;
                    }

                    p {
                        color: #ff4444aa;
                        font-size: 14px;
                        line-height: 1.6;
                    }
                `}</style>
            </div>
        );
    }

    if (nfts.length === 0) {
        return (
            <div className="wallet-nft-gallery">
                <div className="empty-state">
                    <div className="empty-icon">📦</div>
                    <h3>No Agents Found</h3>
                    <p>You don&apos;t have any MCPVOT Agent NFTs yet. Mint your first agent to unlock live intelligence access!</p>
                    <a href="#mint" className="mint-cta">
                        Mint Now
                    </a>
                </div>

                <style jsx>{`
                    .wallet-nft-gallery {
                        padding: 40px 20px;
                        text-align: center;
                    }

                    .empty-state {
                        max-width: 500px;
                        margin: 0 auto;
                        padding: 60px 40px;
                        background: #000000ee;
                        border: 2px solid #00ff8844;
                        border-radius: 12px;
                    }

                    .empty-icon {
                        font-size: 64px;
                        margin-bottom: 20px;
                        opacity: 0.5;
                    }

                    h3 {
                        color: #00ff88;
                        font-size: 24px;
                        font-weight: bold;
                        letter-spacing: 2px;
                        margin-bottom: 12px;
                        text-transform: uppercase;
                    }

                    p {
                        color: #00ff88aa;
                        font-size: 14px;
                        line-height: 1.6;
                        margin-bottom: 24px;
                    }

                    .mint-cta {
                        display: inline-block;
                        padding: 12px 32px;
                        background: linear-gradient(135deg, #00ff88 0%, #00cc66 100%);
                        border: 2px solid #00ff88;
                        color: #000000;
                        font-size: 14px;
                        font-weight: bold;
                        letter-spacing: 2px;
                        text-decoration: none;
                        text-transform: uppercase;
                        border-radius: 8px;
                        transition: all 0.3s;
                    }

                    .mint-cta:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 0 30px #00ff8866;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="wallet-nft-gallery">
            <div className="gallery-header">
                <h2>Your Intelligence Agents</h2>
                <p className="collection-count">
                    {nfts.length} Agent{nfts.length !== 1 ? 's' : ''} • Total Balance: {nfts.reduce((sum, nft) => sum + nft.balance, 0)}
                </p>
            </div>

            <div className="nft-grid">
                {nfts.map((nft) => (
                    <div key={nft.tokenId} className="nft-card">
                        <div className="nft-preview">
                            <ArcadeNFTTerminal
                                tokenId={nft.tokenId}
                                rarity={nft.rarity}
                                width={280}
                                height={350}
                            />
                        </div>
                        <div className="nft-info">
                            <h3 className="nft-name">{nft.name}</h3>
                            <div className="nft-meta">
                                <span className="nft-tier">{nft.rarity.toUpperCase()}</span>
                                {nft.balance > 1 && (
                                    <span className="nft-balance">×{nft.balance}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .wallet-nft-gallery {
                    padding: 40px 20px;
                }

                .gallery-header {
                    text-align: center;
                    margin-bottom: 40px;
                }

                .gallery-header h2 {
                    color: #00ff88;
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 3px;
                    margin-bottom: 12px;
                    text-transform: uppercase;
                    text-shadow: 0 0 20px #00ff88;
                }

                .collection-count {
                    color: #00ff88aa;
                    font-size: 14px;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                }

                .nft-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 24px;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .nft-card {
                    background: #000000ee;
                    border: 2px solid #00ff8844;
                    border-radius: 12px;
                    padding: 16px;
                    transition: all 0.3s;
                }

                .nft-card:hover {
                    border-color: #00ff88;
                    box-shadow: 0 0 30px #00ff8833;
                    transform: translateY(-4px);
                }

                .nft-preview {
                    margin-bottom: 16px;
                }

                .nft-info {
                    text-align: center;
                }

                .nft-name {
                    color: #00ff88;
                    font-size: 16px;
                    font-weight: bold;
                    letter-spacing: 2px;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                }

                .nft-meta {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                }

                .nft-tier {
                    color: #00ff88aa;
                    font-size: 12px;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    padding: 4px 12px;
                    background: #00ff8822;
                    border: 1px solid #00ff8844;
                    border-radius: 4px;
                }

                .nft-balance {
                    color: #ffaa00;
                    font-size: 14px;
                    font-weight: bold;
                    letter-spacing: 1px;
                }
            `}</style>
        </div>
    );
}
