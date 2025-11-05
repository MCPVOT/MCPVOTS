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

## Neynar API Reference

This section documents the Neynar API rate limits and credit costs for various endpoints used in the Farcaster ecosystem analyzer.

### Rate Limits (RPM - Requests Per Minute)

| API | Starter (RPM) | Growth (RPM) | Scale (RPM) | Enterprise |
|-----|---------------|--------------|-------------|------------|
| POST v2/farcaster/frame/validate | 5k | 10k | 20k | Custom |
| GET v2/farcaster/signer | 3k | 6k | 12k | Custom |
| GET v2/farcaster/signer/developer_managed | 3k | 6k | 12k | Custom |
| GET v2/farcaster/cast/search | 60 | 120 | 240 | Custom |
| All others | 300 | 600 | 1200 | Custom |

### Global Rate Limits (RPM)

These limits apply across all APIs (excluding /validate, /signer, and signer/developer_managed).

| API | Starter (RPM) | Growth (RPM) | Scale (RPM) | Enterprise |
|-----|---------------|--------------|-------------|------------|
| Across all APIs | 500 | 1000 | 2000 | Custom |

### Onchain Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v2 | POST | /farcaster/nft/mint | 100 |
| v2 | POST | /v2/farcaster/fungible/send | 200 |
| v2 | POST | /v2/farcaster/user/register | 500 |
| v2 | POST | /v2/fungible | 50000 |
| v2 | GET | /farcaster/nft/mint | 25 |
| v2 | GET | /v2/farcaster/fungible/owner/relevant | 40 |
| v2 | GET | /v2/farcaster/user/balance | 100 |

### Auth Address Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v2 | GET | /v2/farcaster/auth_address/developer_managed | 0 |
| v2 | POST | /v2/farcaster/auth_address/developer_managed/signed_key | 5 |

**Add-ons:** Sponsored Signer (Neynar Sponsored Signer: 4000 cu)

### Ban Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v2 | POST | /v2/farcaster/ban | 2 |
| v2 | DELETE | /v2/farcaster/ban | 2 |
| v2 | GET | /v2/farcaster/ban/list | 2 |

### Block Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v2 | POST | /v2/farcaster/block | 2 |
| v2 | DELETE | /v2/farcaster/block | 2 |
| v2 | GET | /v2/farcaster/block/list | 2 |

### Cast Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v2 | GET | /v2/farcaster/cast | 4 |
| v2 | GET | /v2/farcaster/cast/conversation | 10 |
| v2 | GET | /v2/farcaster/cast/conversation/summary | 20 |
| v2 | GET | /v2/farcaster/cast/embed/crawl | 25 |
| v2 | GET | /v2/farcaster/cast/quotes | 3 |
| v2 | GET | /v2/farcaster/cast/search | 10 |
| v2 | GET | /v2/farcaster/casts | 4 |
| v1 | GET | /v1/farcaster/recent-casts | 2 |
| v1 | GET | /v1/castById | 100 |
| v1 | GET | /v1/castsByFid | 200 |
| v1 | GET | /v1/castsByMention | 100 |
| v1 | GET | /v1/castsByParent | 200 |
| v2 | POST | /v2/farcaster/cast | 150 |
| v2 | DELETE | /v2/farcaster/cast | 10 |

### Metrics Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v2 | GET | /v2/farcaster/cast/metrics | 50 |

### Channel Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v2 | GET | /v2/farcaster/channel | 2 |
| v2 | GET | /v2/farcaster/channel/bulk | 2 |
| v2 | GET | /v2/farcaster/channel/followers | 1 |
| v2 | GET | /v2/farcaster/channel/followers/relevant | 10 |
| v2 | GET | /v2/farcaster/channel/list | 2 |
| v2 | GET | /v2/farcaster/channel/member/invite/list | 2 |
| v2 | GET | /v2/farcaster/channel/member/list | 3 |
| v2 | GET | /v2/farcaster/channel/search | 5 |
| v2 | GET | /v2/farcaster/channel/trending | 4 |
| v2 | GET | /v2/farcaster/channel/user | 3 |
| v2 | GET | /v2/farcaster/user/channels | 2 |
| v2 | GET | /v2/farcaster/user/memberships/list | 2 |
| v2 | POST | /v2/farcaster/channel/follow | 10 |
| v2 | POST | /v2/farcaster/channel/member/invite | 10 |
| v2 | DELETE | /v2/farcaster/channel/follow | 10 |
| v2 | DELETE | /v2/farcaster/channel/member | 10 |
| v2 | PUT | /v2/farcaster/channel/member/invite | 10 |

### Feed Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v2 | GET | /v2/farcaster/feed | 4 |
| v2 | GET | /v2/farcaster/feed/channels | 4 |
| v2 | GET | /v2/farcaster/feed/following | 4 |
| v2 | GET | /v2/farcaster/feed/for_you | 4 |
| v2 | GET | /v2/farcaster/feed/parent_urls | 4 |
| v2 | GET | /v2/farcaster/feed/trending | 8 |
| v2 | GET | /v2/farcaster/feed/user/casts | 4 |
| v2 | GET | /v2/farcaster/feed/user/popular | 10 |
| v2 | GET | /v2/farcaster/feed/user/replies_and_recasts | 4 |

### Fname Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v2 | GET | /v2/farcaster/fname/availability | 1 |

### Follow Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v2 | GET | /v2/farcaster/followers | 4 |
| v2 | GET | /v2/farcaster/followers/reciprocal | 8 |
| v2 | GET | /v2/farcaster/followers/relevant | 40 |
| v2 | GET | /v2/farcaster/following | 4 |
| v2 | GET | /v2/farcaster/following/suggested | 8 |
| v2 | POST | /v2/farcaster/user/follow | 10 |

### Frame Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v2 | GET | /v2/farcaster/frame/catalog | 10 |
| v2 | GET | /v2/farcaster/frame/notification_tokens | 1 |
| v2 | GET | /v2/farcaster/frame/notifications | 10 |
| v2 | GET | /v2/farcaster/frame/relevant | 20 |
| v2 | GET | /v2/farcaster/frame/search | 20 |
| v2 | GET | /v2/farcaster/frame/transaction/pay | 10 |
| v2 | POST | /v2/farcaster/frame/notifications | 100 |
| v2 | POST | /v2/farcaster/frame/notifications/open | 0 |
| v2 | POST | /v2/farcaster/frame/transaction/pay | 25 |

### Signer Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v2 | GET | /v2/farcaster/login/authorize | 2 |
| v2 | GET | /v2/farcaster/login/nonce | 0 |
| v2 | GET | /v2/farcaster/signer | 0 |
| v2 | GET | /v2/farcaster/signer/developer_managed | 0 |
| v2 | GET | /v2/farcaster/signer/list | 0 |
| v2 | POST | /v2/farcaster/message | 125 |
| v2 | POST | /v2/farcaster/signer | 2 |
| v2 | POST | /v2/farcaster/signer/developer_managed/signed_key | 20 |
| v2 | POST | /v2/farcaster/signer/signed_key | 5 |

**Add-ons:**

- Prune Message: Additional 125 cu when message causes protocol-level prune
- Sponsored Signer: Neynar Sponsored Signer (4000 cu for developer_managed, 40000 cu for signed_key)

### Mute Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v2 | POST | /v2/farcaster/mute | 2 |
| v2 | DELETE | /v2/farcaster/mute | 2 |
| v2 | GET | /v2/farcaster/mute/list | 2 |

### Notification Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v2 | GET | /v2/farcaster/notifications | 12 |
| v2 | GET | /v2/farcaster/notifications/channel | 5 |
| v2 | GET | /v2/farcaster/notifications/parent_url | 5 |
| v2 | POST | /v2/farcaster/notifications/seen | 20 |

### Reaction Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v2 | POST | /v2/farcaster/reaction | 10 |
| v2 | DELETE | /v2/farcaster/reaction | 10 |
| v2 | GET | /v2/farcaster/reactions/cast | 2 |
| v2 | GET | /v2/farcaster/reactions/user | 2 |
| v1 | GET | /v1/reactionById | 100 |
| v1 | GET | /v1/reactionsByCast | 150 |
| v1 | GET | /v1/reactionsByFid | 200 |
| v1 | GET | /v1/reactionsByTarget | 150 |

### Storage Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v2 | GET | /v2/farcaster/storage/allocations | 1 |
| v2 | GET | /v2/farcaster/storage/usage | 1 |
| v1 | GET | /v1/storageLimitsByFid | 5 |

### User Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v2 | POST | /v2/farcaster/user | 500 |
| v2 | POST | /v2/farcaster/user/verification | 10 |
| v2 | PATCH | /v2/farcaster/user | 20 |
| v2 | GET | /v2/farcaster/user/best_friends | 30 |
| v2 | GET | /v2/farcaster/user/bulk | 2 |
| v2 | GET | /v2/farcaster/user/bulk-by-address | 2 |
| v2 | GET | /v2/farcaster/user/by_location | 3 |
| v2 | GET | /v2/farcaster/user/by_username | 2 |
| v2 | GET | /v2/farcaster/user/by_x_username | 3 |
| v2 | GET | /v2/farcaster/user/custody-address | 1 |
| v2 | GET | /v2/farcaster/user/fid | 25 |
| v2 | GET | /v2/farcaster/user/interactions | 8 |
| v2 | GET | /v2/farcaster/user/power | 1 |
| v2 | GET | /v2/farcaster/user/power_lite | 1000 |
| v2 | GET | /v2/farcaster/user/search | 6 |
| v1 | GET | /v1/farcaster/recent-users | 1 |
| v1 | GET | /v1/userNameProofByName | 50 |
| v1 | GET | /v1/userNameProofsByFid | 50 |
| v2 | DELETE | /v2/farcaster/user/follow | 10 |
| v2 | DELETE | /v2/farcaster/user/verification | 10 |

### Subscription Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v2 | GET | /v2/farcaster/user/subscribed_to | 2 |
| v2 | GET | /v2/farcaster/user/subscribers | 2 |
| v2 | GET | /v2/farcaster/user/subscriptions_created | 2 |

### Webhook Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v2 | GET | /v2/farcaster/webhook | 2 |
| v2 | GET | /v2/farcaster/webhook/list | 0 |
| v2 | POST | /v2/farcaster/webhook | 20 |
| v2 | PATCH | /v2/farcaster/webhook | 0 |
| v2 | DELETE | /v2/farcaster/webhook | 2 |
| v2 | PUT | /v2/farcaster/webhook | 2 |

### Subscribers Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v2 | GET | /v2/stp/subscription_check | 2 |

### Hub Event Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v1 | GET | /v1/eventById | 25 |
| v1 | GET | /v1/events | 5000 |

### Fid Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v1 | GET | /v1/fids | 4000 |

### Info Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v1 | GET | /v1/info | 100 |

### Link Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v1 | GET | /v1/linkById | 50 |
| v1 | GET | /v1/linksByFid | 200 |
| v1 | GET | /v1/linksByTargetFid | 200 |

### Onchain Event Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v1 | GET | /v1/onChainEventsByFid | 150 |
| v1 | GET | /v1/onChainIdRegistryEventByAddress | 50 |
| v1 | GET | /v1/onChainSignersByFid | 50 |

### Message Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v1 | POST | /v1/submitMessage | 75 |
| v1 | POST | /v1/validateMessage | 4 |

**Add-ons:** Prune Message: Additional 75 cu when message causes protocol-level prune

### User Data Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v1 | GET | /v1/userDataByFid | 100 |

### Verification Credits

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v1 | GET | /v1/verificationsByFid | 50 |

### gRPC Credits

#### Cast

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v1 | POST | /HubService/GetAllCastMessagesByFid | 2000 |
| v1 | POST | /HubService/GetCast | 1 |
| v1 | POST | /HubService/GetCastsByFid | 200 |
| v1 | POST | /HubService/GetCastsByMention | 100 |
| v1 | POST | /HubService/GetCastsByParent | 200 |

#### Link

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v1 | POST | /HubService/GetAllLinkMessagesByFid | 2000 |
| v1 | POST | /HubService/GetLink | 1 |
| v1 | POST | /HubService/GetLinksByFid | 200 |
| v1 | POST | /HubService/GetLinksByTarget | 200 |

#### Sync

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v1 | POST | /HubService/GetAllMessagesBySyncIds | 2000 |
| v1 | POST | /HubService/GetAllSyncIdsByPrefix | 1000 |
| v1 | POST | /HubService/GetSyncMetadataByPrefix | 1000 |
| v1 | POST | /HubService/GetSyncSnapshotByPrefix | 1000 |
| v1 | POST | /HubService/GetSyncStatus | 1 |

#### Reaction

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v1 | POST | /HubService/GetAllReactionMessagesByFid | 2000 |
| v1 | POST | /HubService/GetReaction | 1 |
| v1 | POST | /HubService/GetReactionsByCast | 150 |
| v1 | POST | /HubService/GetReactionsByFid | 200 |
| v1 | POST | /HubService/GetReactionsByTarget | 150 |

#### User Data

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v1 | POST | /HubService/GetAllUserDataMessagesByFid | 2000 |
| v1 | POST | /HubService/GetUserData | 1 |
| v1 | POST | /HubService/GetUserDataByFid | 1 |

#### Verification

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v1 | POST | /HubService/GetAllVerificationMessagesByFid | 2000 |
| v1 | POST | /HubService/GetVerification | 1 |
| v1 | POST | /HubService/GetVerificationsByFid | 5 |

#### Info

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v1 | POST | /HubService/GetCurrentPeers | 1 |
| v1 | POST | /HubService/GetInfo | 100 |

#### Storage

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v1 | POST | /HubService/GetCurrentStorageLimitsByFid | 5 |

#### Onchain Event

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v1 | POST | /HubService/GetEvent | 1 |
| v1 | POST | /HubService/GetIdRegistryOnChainEvent | 1 |
| v1 | POST | /HubService/GetIdRegistryOnChainEventByAddress | 2 |
| v1 | POST | /HubService/GetOnChainEvents | 15 |
| v1 | POST | /HubService/GetOnChainSigner | 15 |
| v1 | POST | /HubService/GetOnChainSignersByFid | 15 |

#### Fid

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v1 | POST | /HubService/GetFids | 2000 |

#### User

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v1 | POST | /HubService/GetUsernameProof | 2 |
| v1 | POST | /HubService/GetUserNameProofsByFid | 2 |

#### Message

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v1 | POST | /HubService/SubmitMessage | 150 |
| v1 | POST | /HubService/ValidateMessage | 4 |

#### Subscribe

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v1 | POST | /HubService/Subscribe | 5000 |

#### Signer

| Version | Method | Endpoint | Credits per unit |
|---------|--------|----------|------------------|
| v1 | POST | /HubService/SubmitMessage | 150 |
| v1 | POST | /HubService/ValidateMessage | 4 |

**Add-ons:** API Signer: 20000 cu per active signer monthly

### Data Credits

#### Webhooks

Data webhooks: 100 cu per webhook delivered

#### SQL Playground

Available on Growth tier and above. Reach out to get set up.

#### Parquet Export

| Version | File | Credits per unit |
|---------|------|------------------|
| v1 | farcaster.account_verifications | 2 |
| v1 | farcaster.blocks | 4 |
| v1 | farcaster.casts | 4 |
| v1 | farcaster.channel_follows | 20 |
| v1 | farcaster.channel_members | 20 |
| v1 | farcaster.channels | 4 |
| v1 | farcaster.fids | 1 |
| v1 | farcaster.fnames | 2 |
| v1 | farcaster.links | 2 |
| v1 | farcaster.profile_with_addresses | 4 |
| v1 | farcaster.reactions | 2 |
| v1 | farcaster.signers | 1 |
| v1 | farcaster.storage | 2 |
| v1 | farcaster.user_data | 2 |
| v1 | farcaster.user_labels | 1 |
| v1 | farcaster.verifications | 2 |
| v1 | nindexer.casts | 4 |
| v1 | nindexer.blocks | 4 |
| v1 | nindexer.channel_follows | 20 |
| v1 | nindexer.channel_members | 20 |
| v1 | nindexer.channels | 12 |
| v1 | nindexer.fids | 1 |
| v1 | nindexer.follow_counts | 10 |
| v1 | nindexer.follows | 2 |
| v1 | nindexer.neynar_user_scores | 50 |
| v1 | nindexer.profile_external_accounts | 2 |
| v1 | nindexer.profiles | 10 |
| v1 | nindexer.reactions | 2 |
| v1 | nindexer.signers | 30 |
| v1 | nindexer.storage_rentals | 5 |
| v1 | nindexer.tier_purchases | 4 |
| v1 | nindexer.usernames | 3 |
| v1 | nindexer.user_labels | 1 |
| v1 | nindexer.verifications | 10 |
| v1 | nindexer.embeds | 900 |
| v1 | nindexer.miniapp_domains | 4000 |
| v1 | nindexer.miniapp_domain_tags | 3500 |

#### Indexer Service

| Version | Table | Credits per unit |
|---------|-------|------------------|
| v1 | farcaster.account_verifications | 6 |
| v1 | farcaster.blocks | 12 |
| v1 | farcaster.casts | 12 |
| v1 | farcaster.channel_follows | 60 |
| v1 | farcaster.channel_members | 60 |
| v1 | farcaster.channels | 12 |
| v1 | farcaster.fids | 3 |
| v1 | farcaster.fnames | 6 |
| v1 | farcaster.links | 6 |
| v1 | farcaster.profile_with_addresses | 12 |
| v1 | farcaster.reactions | 6 |
| v1 | farcaster.signers | 3 |
| v1 | farcaster.storage | 6 |
| v1 | farcaster.user_data | 6 |
| v1 | farcaster.user_labels | 3 |
| v1 | farcaster.verifications | 6 |
| v1 | nindexer.casts | 12 |
| v1 | nindexer.blocks | 12 |
| v1 | nindexer.channel_follows | 60 |
| v1 | nindexer.channel_members | 60 |
| v1 | nindexer.channels | 36 |
| v1 | nindexer.fids | 3 |
| v1 | nindexer.follow_counts | 30 |
| v1 | nindexer.follows | 6 |
| v1 | nindexer.neynar_user_scores | 150 |
| v1 | nindexer.profile_external_accounts | 6 |
| v1 | nindexer.profiles | 10 |
| v1 | nindexer.reactions | 2 |
| v1 | nindexer.signers | 90 |
| v1 | nindexer.storage_rentals | 15 |
| v1 | nindexer.tier_purchases | 12 |
| v1 | nindexer.usernames | 9 |
| v1 | nindexer.user_labels | 3 |
| v1 | nindexer.verifications | 30 |

#### Kafka Stream

| Version | Event Type | Credits per unit |
|---------|------------|------------------|
| v1 | user.created | 8 |
| v1 | user.updated | 8 |
| v1 | user.transferred | 6 |
| v1 | cast.created | 15 |
| v1 | cast.deleted | 15 |
| v1 | reaction.created | 10 |
| v1 | reaction.deleted | 10 |
| v1 | follow.created | 8 |
| v1 | follow.deleted | 8 |
| v1 | signer.created | 25 |
| v1 | signer.deleted | 25 |
| v1 | app_host.notification | 100 |
