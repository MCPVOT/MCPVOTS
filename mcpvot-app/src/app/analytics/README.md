# Warplet Analytics Dashboard

This dashboard provides real-time analytics from the Warplet system, combining Farcaster social sentiment analysis with on-chain transaction data to drive automated VOT token purchases.

## Features

- **Real-time Analytics**: Live Farcaster sentiment analysis and on-chain activity monitoring
- **Purchase Recommendations**: AI-driven decision making for VOT token purchases based on social signals
- **MCP Memory Integration**: All payment records stored in vector memory for historical analysis
- **Interactive Dashboard**: Modern UI showing sentiment trends, engagement metrics, and purchase decisions

## Setup

### Environment Variables

Add these to your `.env.local` file:

```bash
# Neynar API for Farcaster data
NEYNAR_API_KEY=your_neynar_api_key

# Payment facilitator wallet private key
X402_PAYMENT_PRIVATE_KEY=your_payment_wallet_private_key

# Admin secret for API access
ADMIN_SECRET=your_admin_secret

# IPFS URL (optional)
IPFS_URL=https://ipfs.infura.io:5001

# MCP Memory Server (optional, defaults to localhost:3001)
MCP_ENDPOINT=http://localhost:3001
```

### Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npm run dev
   ```

3. **Access the Dashboard**
   Navigate to `http://localhost:3000/analytics`

## API Endpoints

### Analytics Feed
- **GET** `/api/warplet-feed` - Get latest analytics (requires JWT auth)
- **POST** `/api/warplet-feed` - Trigger fresh analytics collection (admin only)

### Purchase System
- **GET** `/api/vot-purchase` - Get current purchase analysis
- **POST** `/api/vot-purchase` - Trigger purchase analysis with actions:
  - `analyze` - Run analysis and potentially execute purchase
  - `analytics` - Get analytics summary only
  - `status` - Get system status

### Neynar Farcaster
- **GET** `/api/neynar/search-casts` - Search Farcaster casts
- **GET** `/api/neynar/user/[fid]` - Get user information
- **GET** `/api/neynar/user/[fid]/balance` - Get user balance
- **GET** `/api/neynar/hub-status` - Get hub status

## Architecture

### Warplet Collector
- **FarcasterWorker**: Analyzes social sentiment from Farcaster casts
- **OnChainWorker**: Monitors blockchain transactions and activity
- **IPFSWorker**: Decentralized storage for analytics data

### VOT Purchase System
- **Signal Analysis**: Processes sentiment, engagement, and trend signals
- **Decision Engine**: Makes purchase decisions based on confidence scoring
- **Payment Execution**: Facilitates VOT token purchases through micro-payments

### MCP Memory Integration
- **Payment Records**: All transactions stored as vector embeddings
- **Historical Analysis**: Query past payments and performance
- **Knowledge Graph**: Connect payment patterns with market signals

## Usage

### Manual Analysis
Click "Run Analysis" in the dashboard to trigger a fresh analysis cycle.

### Automated Purchasing
The system automatically analyzes signals every time the dashboard loads or when manually triggered. If confidence exceeds 60% and multiple signals are detected, it will execute a VOT token purchase.

### Signal Types
- **Sentiment**: Positive/negative sentiment from Farcaster discussions
- **Engagement**: High engagement posts (likes, recasts, replies)
- **Trends**: On-chain transaction activity patterns

## Security

- All analytics endpoints require authentication
- Payment execution uses dedicated facilitator wallet
- Admin operations protected by secret tokens
- MCP memory stores encrypted payment records

## Monitoring

Check the dashboard for:
- Real-time signal strength
- Purchase decision confidence
- Last purchase timestamp
- System status indicators

## Troubleshooting

### Common Issues

1. **"Neynar MCP service unavailable"**
   - Ensure MCP server is running on port 3001
   - Check NEYNAR_API_KEY is set

2. **"Payment facilitator wallet required"**
   - Set X402_PAYMENT_PRIVATE_KEY in environment
   - Ensure wallet has sufficient ETH for gas

3. **"Analytics collection failed"**
   - Check network connectivity
   - Verify API keys are valid

### Logs
Check browser console and server logs for detailed error information.
