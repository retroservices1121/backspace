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
module.exports = config;
