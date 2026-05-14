/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,

  // Next 12's verifyTypeScriptSetup tries to require.resolve(
  // '@types/react/index.d.ts'), which modern @types/react (17.0.83+)
  // blocks via its `exports` field. The check fails with "do not have
  // the required package(s) installed" even when @types/react is fully
  // present. Type safety is enforced by `tsc --noEmit` separately;
  // skip Next's own pre-build check.
  typescript: { ignoreBuildErrors: true },

  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.(ogg|mp3|wav|mpe?g)$/i,
      use: [
        {
          loader: 'file-loader',
          options: { name: '[name]-[hash].[ext]' },
        },
      ],
    });
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    if (!options.isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  },
};
