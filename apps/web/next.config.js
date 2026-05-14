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

  // Next 12.1.4's static-image-import handling probes image dimensions
  // through `squoosh`, which loads its WASM via fetch(barePath). Node
  // 18+ undici rejects non-URL fetch targets and the build dies with
  // "TypeError: Failed to parse URL from .../mozjpeg_node_dec.wasm".
  // Switching imports to plain URL strings sidesteps squoosh entirely.
  // Call sites read these as src URLs already; no StaticImageData
  // shape was being used meaningfully.
  images: { disableStaticImages: true },

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
    // disableStaticImages removes Next's built-in image asset rule, so
    // raster image imports need an explicit loader. Webpack 5
    // asset/resource emits the file and exports its public URL string.
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|webp|avif|ico)$/i,
      type: 'asset/resource',
    });
    if (!options.isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  },
};
