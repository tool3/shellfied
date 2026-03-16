import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Enable SCSS support
  sassOptions: {
    includePaths: [path.join(process.cwd(), 'src/styles')],
    additionalData: `@use "@/styles/abstracts" as *;`,
  },

  // Transpile shellfie package
  transpilePackages: ['shellfie'],

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
  },

  // Webpack configuration for handling node: modules in browser
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Add alias to ignore node: protocol modules in client bundle
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve.alias as Record<string, string | false>),
        // These modules are only used by shellfie for font embedding
        // which we don't need on the client side
        'node:fs': false,
        'node:fs/promises': false,
        'node:path': false,
      };

      // Add NormalModuleReplacementPlugin to stub out node: modules
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const webpack = require('webpack');
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:/,
          (resource: { request: string }) => {
            resource.request = resource.request.replace(/^node:/, '');
          }
        )
      );

      // Set fallbacks for core Node.js modules
      config.resolve.fallback = {
        ...(config.resolve.fallback as Record<string, string | false>),
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
      };
    }
    return config;
  },

  // Headers for static image serving
  async headers() {
    return [
      {
        source: '/api/image',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/api/og',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
