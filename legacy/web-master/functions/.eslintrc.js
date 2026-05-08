
module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'airbnb-typescript',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json', 'tsconfig.dev.json'],
    sourceType: 'module',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: [
    '/lib/**/*', // Ignore built files.
  ],
  plugins: [
    '@typescript-eslint',
    'import',
  ],
  rules: {
    // We can remove these after we no longer have javascript files
    'no-param-reassign': 'off',
    // Firebase SDK
    'import/no-extraneous-dependencies': 'off',
    // Remove this line when no more js files
    'react/jsx-filename-extension': 'off', 
    // Remove forced line between class members
    'lines-between-class-members': 'off',
    '@typescript-eslint/lines-between-class-members': 0,
    'no-unused-vars': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
  },
};
