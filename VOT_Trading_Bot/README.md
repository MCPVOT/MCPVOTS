# VOT Trading Bot

Ultra-aggressive volume generation bot for VOT token on Base network with integrated AI intelligence system.

## Features

- **95% Buy Probability**: Constant buying to generate massive volume
- **Weighted Buy Amounts**: 70% chance of $20 or $10 buys for volume spikes
- **$100 Whale Alert**: Triggers total liquidation on massive buys
- **AI Intelligence Reports**: Automated token analysis and Farcaster casting
- **Fresh Data Analysis**: Real-time DEX and social intelligence gathering
- **Gas Optimized**: Direct WETH usage saves ~30k gas per transaction
- **Kyber Integration**: Uses Kyber aggregator for best prices

## Strategy

The bot implements a pure volume generation strategy designed to:

1. Attract automated trading bots through massive volume swings
2. Create market volatility to trap momentum traders
3. Use whale alerts ($100+ buys) to trigger devastating sell pressure

## Intelligence System

The integrated AI intelligence system provides:

- **Multi-Source Analysis**: DEX screener, social sentiment, on-chain data
- **Farcaster Integration**: Automated report posting to social feeds
- **Trading Mentions Detection**: Identifies active trading discussions
- **24h Metrics**: Comprehensive temporal analysis
- **Trending Tokens**: Real-time trending token discovery
- **Farcaster Ecosystem Analysis**: Comprehensive platform-wide intelligence

### Generate Intelligence Report

```bash
# Generate fresh report and cast to Farcaster
python generate_retro_intelligence_svg.py --token-symbol WARP --token-address 0xd9159Ad2d5fe625CD1F54f4D328fB19CB5262B07
```

### Farcaster Ecosystem Analyzer

The `farcaster_ecosystem_analyzer.py` provides comprehensive Farcaster ecosystem intelligence:

- **Platform Overview**: Channel analysis and trending content
- **User Ecosystem**: Influencer identification and engagement metrics
- **Content Analysis**: Sentiment, temporal patterns, and content themes
- **Token/NFT Ecosystem**: Trending symbols, market sentiment, cross-ecosystem insights
- **Network Health**: API responsiveness and content freshness monitoring

#### Run Ecosystem Analysis

```bash
# Analyze last 6 hours of Farcaster activity
python farcaster_ecosystem_analyzer.py --hours 6 --output-json ecosystem_report.json

# Quick 1-hour analysis
python farcaster_ecosystem_analyzer.py --hours 1
```

The analyzer generates detailed JSON reports with actionable insights for trading and ecosystem monitoring.

## Setup

1. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Copy and configure environment:

   ```bash
   cp .env.example .env
   # Edit .env with your PRIVATE_KEY and API keys
   ```

3. Run the bot:

   ```bash
   python vot_trading_bot.py --mode live --log-level INFO
   ```

## Manual Trading

You can also perform manual sells using the standalone script:

```bash
python sell_vot.py --usd-amount 50.0
```

This allows you to sell specific amounts without running the full bot.

## Intelligence Reports

The AI system generates comprehensive intelligence reports including:

- **DEX Metrics**: Price, volume, liquidity, transactions
- **Social Intelligence**: Farcaster mentions, sentiment analysis
- **Trading Activity**: Recent trading-related casts
- **Trending Tokens**: Popular tokens and NFTs
- **Ecosystem Analysis**: Platform-wide Farcaster intelligence reports
- **Intelligence Scoring**: 0-100 rating system

Reports are automatically posted to Farcaster with proper branding.

## Trade Database

All trades are logged to `trades.db` SQLite database with:

- Timestamp
- Trade type (buy/sell)
- USD amount
- Token amount
- Price at execution
- Transaction hash
- Gas used
- Success status

## Configuration

- **Mode**: `live` for production trading
- **Buy Probability**: 95% (constant buying)
- **Sell Probability**: 5% (volume maintenance only)
- **Whale Alert**: $100+ buys trigger total liquidation
- **Gas Limit**: 200k optimized for Base network

## Files

- `vot_trading_bot.py` - Main trading bot
- `farcaster_ecosystem_analyzer.py` - Comprehensive Farcaster ecosystem analyzer
- `generate_retro_intelligence_svg.py` - AI intelligence report generator
- `unified_token_analyzer.py` - Comprehensive token analysis engine
- `kyber_vot_client.py` - Kyber aggregator client
- `sell_vot.py` - Standalone sell script
- `trades.db` - SQLite database for trade logging
- `vot_trader.log` - Trading activity log
- `requirements.txt` - Python dependencies
- `.env` - Environment configuration

## Safety

- No profit taking - all gains stay invested for bigger swings
- Whale alerts provide exit strategy on extreme events
- Gas optimizations keep costs low
- Balance tracking prevents over-leveraging
