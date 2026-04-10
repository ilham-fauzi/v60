/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-d1'],
  experimental: {
    // Ensure Web Bluetooth API works correctly
  },
}

module.exports = nextConfig
