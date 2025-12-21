
export default function EIP7702DemoPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900 flex items-center justify-center p-8">
            <div className="max-w-4xl mx-auto text-center">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-6xl font-orbitron tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-4">
                        MCPVOT X402
                    </h1>
                    <p className="text-xl text-blue-300/80 font-mono">
                        EIP-7702 Enhanced Wallet Integration on Base
                    </p>
                </div>

                {/* EIP-7702 Features Showcase */}
                <div className="grid md:grid-cols-3 gap-8 mb-12">
                    <div className="p-6 bg-black/40 backdrop-blur-sm border border-green-500/30 rounded-xl">
                        <div className="text-4xl mb-4">⚡</div>
                        <h3 className="text-lg font-semibold text-green-300 mb-2">Gasless Transactions</h3>
                        <p className="text-green-400/70 text-sm">
                            Pay gas fees with ERC-20 tokens instead of ETH. Perfect for seamless DeFi interactions.
                        </p>
                    </div>
                    
                    <div className="p-6 bg-black/40 backdrop-blur-sm border border-blue-500/30 rounded-xl">
                        <div className="text-4xl mb-4">🔄</div>
                        <h3 className="text-lg font-semibold text-blue-300 mb-2">Transaction Batching</h3>
                        <p className="text-blue-400/70 text-sm">
                            Combine multiple operations into single transactions for better UX and lower costs.
                        </p>
                    </div>
                    
                    <div className="p-6 bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl">
                        <div className="text-4xl mb-4">💰</div>
                        <h3 className="text-lg font-semibold text-purple-300 mb-2">ERC-20 Gas Payment</h3>
                        <p className="text-purple-400/70 text-sm">
                            Use USDC, DAI, or other tokens to pay for transaction fees.
                        </p>
                    </div>
                </div>

                {/* Connect Button */}
                <div className="mb-8">
                    <h2 className="text-2xl font-orbitron tracking-[0.2em] text-cyan-300 mb-4">
                        Experience EIP-7702
                    </h2>
                    <button className="group relative overflow-hidden font-orbitron tracking-[0.2em] border border-cyan-500/50 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:scale-105 active:scale-95 uppercase px-6 py-3 text-sm min-h-[48px] w-full font-semibold transition-all duration-300 backdrop-blur-sm">
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            <span className="text-lg">⟡</span>
                            <span>Connect Wallet</span>
                            <span className="text-lg">⟡</span>
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                    </button>
                </div>

                {/* Technical Details */}
                <div className="bg-black/30 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-8">
                    <h3 className="text-xl font-semibold text-yellow-300 mb-4">🔧 Technical Implementation</h3>
                    <div className="grid md:grid-cols-2 gap-6 text-left">
                        <div>
                            <h4 className="font-medium text-cyan-300 mb-2">Core Features:</h4>
                            <ul className="text-sm text-cyan-400/80 space-y-1">
                                <li>• EIP-7702 Type 4 transactions</li>
                                <li>• Smart wallet delegation</li>
                                <li>• Multi-chain compatibility</li>
                                <li>• Gas sponsorship integration</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-blue-300 mb-2">Base Integration:</h4>
                            <ul className="text-sm text-blue-400/80 space-y-1">
                                <li>• Base mainnet (chainId: 8453)</li>
                                <li>• Coinbase Smart Wallet compatible</li>
                                <li>• USDC gas payment support</li>
                                <li>• Optimized for L2 scaling</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-blue-300/60">
                        Connect your wallet to experience EIP-7702 enhanced functionality on Base.
                        <br />
                        Compatible with MetaMask, Coinbase Wallet, and Rainbow.
                    </p>
                </div>
            </div>
        </div>
    );
}