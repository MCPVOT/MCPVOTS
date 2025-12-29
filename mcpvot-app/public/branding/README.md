# MCPVOT x402 Branding Assets

This folder contains all required branding assets for the Farcaster Mini App manifest.

## Required Assets

### 1. Icon (`icon.png`)
- **Dimensions**: 200x200px (square)
- **Format**: PNG with transparency
- **Usage**: App store listing, launcher icon
- **Design**: MCPVOT logo with cyan glow effect on dark background

### 2. Splash Screen (`splash.png`)
- **Dimensions**: 200x200px (square)
- **Format**: PNG
- **Background**: Will use `splashBackgroundColor: #06B6D4` (cyan)
- **Design**: Simplified MCPVOT icon for loading screen

### 3. Preview Image (`preview.png`)
- **Dimensions**: 1200x800px (3:2 aspect ratio)
- **Format**: PNG or JPEG
- **Usage**: Social share previews, embed cards
- **Design**: Screenshot of dashboard with "MCPVOT x402 INTELLIGENCE" header

### 4. Hero Image (`hero.png`)
- **Dimensions**: 1200x630px (recommended for OpenGraph)
- **Format**: PNG or JPEG
- **Usage**: App store hero banner
- **Design**: Full dashboard view with cyberpunk terminal aesthetic

### 5. Screenshots (`screenshot1.png`, `screenshot2.png`, `screenshot3.png`)
- **Dimensions**: 1242x2688px (mobile portrait) or 1920x1080px (desktop)
- **Format**: PNG or JPEG
- **Usage**: App store gallery
- **Content**:
  - screenshot1.png: Dashboard with intelligence cards
  - screenshot2.png: Farcaster ecosystem analytics
  - screenshot3.png: VOT trading interface

### 6. OpenGraph Image (`og-image.png`)
- **Dimensions**: 1200x630px (1.91:1 aspect ratio)
- **Format**: PNG or JPEG
- **Usage**: Social media shares (Twitter, Discord, etc.)
- **Design**: Brand tagline with visual appeal

## Color Scheme
- Primary Cyan: `#06B6D4` (cyan-600)
- Secondary Blue: `#3B82F6` (blue-600)
- Background: `#0a0a0f` (dark terminal)
- Accent Green: `#4ADE80` (green-400)

## Font
- Primary: Orbitron (headers, buttons)
- Secondary: Mono/Courier (technical text)

## Creating Assets

### Quick Generate Script
Use this to create placeholder assets:

```bash
# Navigate to branding folder
cd public/branding

# Create icon (200x200)
# Use design tool or imagemagick:
convert -size 200x200 xc:#0a0a0f \
  -fill "#06B6D4" -font Orbitron-Bold -pointsize 80 \
  -gravity center -annotate +0+0 "x402" \
  icon.png

# Create splash (same as icon)
cp icon.png splash.png

# Create preview (1200x800)
convert -size 1200x800 xc:#0a0a0f \
  -fill "#06B6D4" -font Orbitron-Bold -pointsize 120 \
  -gravity center -annotate +0-100 "MCPVOT x402" \
  -fill "#4ADE80" -pointsize 40 \
  -annotate +0+50 "INTELLIGENCE PROTOCOL" \
  preview.png

# Duplicate for hero and og-image
convert preview.png -resize 1200x630! hero.png
cp hero.png og-image.png

# Create screenshots (placeholder - replace with actual screenshots)
convert -size 1242x2688 xc:#0a0a0f \
  -fill "#06B6D4" -pointsize 60 -gravity north \
  -annotate +0+100 "SCREENSHOT 1\nDASHBOARD" \
  screenshot1.png

convert -size 1242x2688 xc:#0a0a0f \
  -fill "#06B6D4" -pointsize 60 -gravity north \
  -annotate +0+100 "SCREENSHOT 2\nANALYTICS" \
  screenshot2.png

convert -size 1242x2688 xc:#0a0a0f \
  -fill "#06B6D4" -pointsize 60 -gravity north \
  -annotate +0+100 "SCREENSHOT 3\nTRADING" \
  screenshot3.png
```

### Using Figma/Photoshop
1. Create artboards with exact dimensions
2. Export as PNG with transparent backgrounds (for icon/splash)
3. Use actual app screenshots for screenshot1-3
4. Maintain consistent branding across all assets

## Validation

After creating assets, verify:
1. All files exist in `public/branding/`
2. Dimensions are correct (use `file` or `identify` command)
3. File sizes are reasonable (<500KB each)
4. URLs in `farcaster.json` point to correct paths
5. Test manifest at: `curl https://mcpvot.vercel.app/.well-known/farcaster.json`

## Deployment

1. Commit assets to git
2. Push to main branch
3. Vercel auto-deploys
4. Test manifest: `https://mcpvot.vercel.app/.well-known/farcaster.json`
5. Preview in Farcaster: `https://farcaster.xyz/~/developers/mini-apps/preview?url=https://mcpvot.vercel.app`
