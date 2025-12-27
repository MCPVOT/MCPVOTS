import type { NextConfig } from "next";

// CORS: Allow all origins for API routes (required for x402 and IPFS clients)
const allowedOrigin = '*';

const DEFAULT_DEV_HOSTS = [
  "localhost",
  "127.0.0.1",
  // Primary LAN device the user is testing from (falls back to warning IP from logs)
  process.env.NEXT_DEV_LAN_HOST || "192.168.18.44",
];

const EXTRA_DEV_HOSTS = (process.env.NEXT_ALLOWED_DEV_ORIGINS || "")
  .split(",")
  .map((host) => host.trim())
  .filter((host) => host.length > 0)
  .map((host) => host.replace(/^https?:\/\//, ""));

const allowedDevOrigins = Array.from(new Set([...DEFAULT_DEV_HOSTS, ...EXTRA_DEV_HOSTS]));

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // ESLint config moved to eslint.config.mjs per Next.js 16 requirements

  // PERFORMANCE OPTIMIZATION: Use all 32 CPU threads (i9-14900K)
  experimental: {
    // Disable worker threads to keep nextConfig serializable during build
    workerThreads: false,
    cpus: 1,
  },

  // Allow local devices (including LAN IPs) to load Next.js dev assets without cross-origin warnings
  allowedDevOrigins,

  // Enable compiler optimizations for dev
  compiler: {
    removeConsole: false, // Keep console logs in dev
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: allowedOrigin, // Allow x402 client from configured origin
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, X-PAYMENT',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL', // Allow Farcaster iframes from any origin
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: allowedOrigin, // Allow configured origin for mini-app iframes
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, X-Requested-With, Accept, Authorization, X-PAYMENT',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'Access-Control-Expose-Headers',
            value: 'X-Settlement-TxHash, X-Payment-Hash, X-Facilitator-Signature, X-Payer-Address, X-Settlement-Status, X-Settlement-Error, X-RateLimit-Remaining'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // Serve from /manifest.json for compatibility
      {
        source: '/manifest.json',
        destination: '/.well-known/farcaster.json',
        permanent: false,
      },
      // Redirect /mint to /machine (consolidated VOT Machine)
      {
        source: '/mint',
        destination: '/machine',
        permanent: true,
      },
      // Redirect old ens-machine URLs to machine (unified VOT Machine)
      {
        source: '/ens-machine',
        destination: '/machine',
        permanent: true,
      },
      {
        source: '/ens-machine/:path*',
        destination: '/machine',
        permanent: true,
      },
      // svg-machine redirects to machine
      {
        source: '/svg-machine',
        destination: '/machine',
        permanent: true,
      },
      {
        source: '/svg-machine/:path*',
        destination: '/machine',
        permanent: true,
      },
    ];
  },

  images: {
    unoptimized: true, // Required for static export
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
      },
      {
        protocol: 'https',
        hostname: 'dexscreener.com',
      },
      {
        protocol: 'https',
        hostname: 'basescan.org',
      },
    ],
  },
} satisfies NextConfig & { allowedDevOrigins: string[] };

export default nextConfig;
