/**
 * @file next.config.ts
 * @description Next.js 15 configuration for EROS Ticketing System
 * @status PLACEHOLDER - Basic configuration, extend as needed
 */

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React Strict Mode for better development experience
  reactStrictMode: true,

  typedRoutes: false,
  output: 'standalone',
  // Experimental features for Next.js 15
  experimental: {
    // Enable server actions (enabled by default in Next.js 15)
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Image optimization configuration
  images: {
    remotePatterns: [
      // Add remote image patterns as needed
    ],
  },

  // Environment variables validation
  env: {
    // Expose public env vars here if needed
  },

  // Redirects and rewrites can be added here
  async redirects() {
    return [];
  },

  // Security Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
