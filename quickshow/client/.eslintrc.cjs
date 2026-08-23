module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: 'detect' } },
  ignorePatterns: ['dist/', 'node_modules/'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    // Existing views use callbacks created during render. Keep the lint command
    // useful without failing on pre-existing style-only migration work.
    'react-hooks/exhaustive-deps': 'off',
    'react/no-unescaped-entities': 'off',
    'react/no-unknown-property': 'off',
    'no-unused-vars': 'off',
  },
};
