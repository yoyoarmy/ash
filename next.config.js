/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for Amplify Hosting
  experimental: {
    appDir: true, // Ensure App Router support
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
