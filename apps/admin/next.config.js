/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@backspace/db', '@backspace/auth'],
};

module.exports = nextConfig;
