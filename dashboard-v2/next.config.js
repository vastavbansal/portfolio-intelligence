/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow reading files outside the project root (the ../data/ folder)
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Disable static optimization for API routes that read local files
  // This ensures fresh data on each request in development
}

module.exports = nextConfig
