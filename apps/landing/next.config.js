/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source; tell Next to transpile
  // them on its way through the bundler.
  transpilePackages: ['@backspace/db', '@backspace/usernames'],
};
