/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix lockfile warning by setting explicit root
  outputFileTracingRoot: __dirname,

  // Improve performance and compatibility
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material', 'framer-motion'],
  },

  // Optimize build output
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Better chunk handling for deployment
  webpack: (config, { isServer }) => {
    // Fix chart.js SSR issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };

      // Fix module resolution for dynamic imports
      config.resolve.alias = {
        ...config.resolve.alias,
        'react-chartjs-2': require.resolve('react-chartjs-2'),
        'chart.js': require.resolve('chart.js'),
      };
    }
    return config;
  },

  // Output configuration for better deployment
  output: 'standalone',

  // Performance optimizations
  poweredByHeader: false,
  compress: true,

  // Static asset optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Headers for better PWA support
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;