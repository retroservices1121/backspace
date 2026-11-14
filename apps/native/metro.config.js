const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const resolveRequestWithMobileExports = (context, moduleName, platform) => {
  if (moduleName === 'isows' || moduleName.startsWith('zustand')) {
    const next = { ...context, unstable_enablePackageExports: false };
    return next.resolveRequest(next, moduleName, platform);
  }
  if (moduleName === 'jose') {
    const next = { ...context, unstable_conditionNames: ['browser'] };
    return next.resolveRequest(next, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.resolveRequest = resolveRequestWithMobileExports;

// EXPO_PUBLIC_* values are inlined while transforming, but Metro's transform cache key does not
// include them. Without this, toggling EXPO_PUBLIC_FEATURE_MARKETS silently reuses modules built
// with the previous value (e.g. a "flag off" export shipping the Markets tabs after a "flag on" build).
config.cacheVersion = [config.cacheVersion, `feature-markets=${process.env.EXPO_PUBLIC_FEATURE_MARKETS === 'true'}`]
  .filter(Boolean)
  .join('|');

module.exports = config;
