/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig

// for nextjs
module.exports = {
  //https://github.com/vercel/next.js/issues/7755#issuecomment-812805708
  resolve: {
    extentions: ['.js','.jsx']
  },
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.(ogg|mp3|wav|mpe?g)$/i,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: '[name]-[hash].[ext]',
          },
        },
      ],
    });
    //These could probably be combined
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"]
    });
    if (!options.isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  },
}
