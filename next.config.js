// next.config.js - Production-ready configuration
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  
  // Environment variables accessible in browser
  env: {
    CHARACTER_NAME: 'Atlas Economy',
    CHARACTER_STYLE: 'stick_figure'
  },

  // Headers for security
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        }
      ]
    }
  ],

  // Redirects
  redirects: async () => [
    {
      source: '/health',
      destination: '/api/check-status',
      permanent: false
    }
  ],

  // Image optimization
  images: {
    domains: ['storage.googleapis.com'],
    formats: ['image/webp', 'image/avif']
  },

  // Performance optimizations
  swcMinify: true,
  productionBrowserSourceMaps: false
}

module.exports = nextConfig

module.exports = nextConfig