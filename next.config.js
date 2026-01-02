/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  
  // Required for Next.js 15 to handle FFmpeg binaries
  serverExternalPackages: ['ffmpeg-static', 'fluent-ffmpeg'],

  env: {
    CHARACTER_NAME: 'Atlas Economy',
    CHARACTER_STYLE: 'stick_figure'
  },

  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' }
      ]
    }
  ],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com' }
    ],
    formats: ['image/webp', 'image/avif']
  }
};

module.exports = nextConfig;