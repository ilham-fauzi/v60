/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Ensure Web Bluetooth API works correctly
  },
}

module.exports = nextConfig
