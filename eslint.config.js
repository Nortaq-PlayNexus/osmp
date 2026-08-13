import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["node_modules/**", "dist/**", "coverage/**", "data/**"],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.ts", "tests/**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: 2022,
      },
      globals: {
        console: "readonly",
        process: "readonly",
        fetch: "readonly",
        URLSearchParams: "readonly",
        Date: "readonly",
        Error: "readonly",
        Map: "readonly",
        Set: "readonly",
        Math: "readonly",
        Number: "readonly",
        JSON: "readonly",
        Promise: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        URL: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "off",
      "no-console": "off",
    },
  },
];
