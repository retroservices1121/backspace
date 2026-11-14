// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // Resolve the `@/` tsconfig path alias and workspace TypeScript packages.
    // In the pnpm workspace the hoisted resolver otherwise cannot read
    // `extends: "expo/tsconfig.base"`, so every alias import is reported as unresolved.
    settings: {
      'import/resolver': {
        typescript: { project: `${__dirname}/tsconfig.json` },
        node: true,
      },
    },
  },
]);
