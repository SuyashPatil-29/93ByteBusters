// @ts-nocheck
import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin'

export default {
  webpack: (config, isServer) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
  experimental: {
    // Set maximum execution time for serverless functions to 59 seconds
    serverComponentsExternalPackages: ['prisma'],
  },
  // Global timeout configuration for API routes
  async rewrites() {
    return [];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};