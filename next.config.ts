import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Enable SWC minification for better performance
  swcMinify: true,

  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Performance optimizations
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material', 'framer-motion'],
  },

  // PWA-like features for mobile
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
    ];
  },

  // Bundle analyzer (uncomment to analyze bundle size)
  // webpack: (config, { dev, isServer }) => {
  //   if (!dev && !isServer) {
  //     const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
  //     config.plugins.push(
  //       new BundleAnalyzerPlugin({
  //         analyzerMode: 'static',
  //         reportFilename: './bundle-report.html',
  //         openAnalyzer: false,
  //       })
  //     );
  //   }
  //   return config;
  // },
};

export default nextConfig;
