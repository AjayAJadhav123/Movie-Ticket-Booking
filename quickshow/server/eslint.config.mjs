import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    ignores: [
      "*.cjs",
      "test*.js",
      "scripts/",
      "diagnose-mongo.js"
    ]
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        Buffer: "readonly",
        AbortController: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "off",
      "no-console": "off",
      "no-undef": "error",
      "no-useless-escape": "off",
      "no-prototype-builtins": "off"
    }
  }
];
