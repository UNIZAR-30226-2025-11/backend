import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json", // Use your TypeScript config for type checking
      },
    },
    rules: {
      // Enforce camelCase for variable and property names
      "camelcase": ["error", { "properties": "always" }],

      // Allow unused vars if prefixed with an _underscore
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      // Allow let for variables that are assigned once
      "prefer-const": "warn",

      // Detect unhandled promises (requires type checking)
      "@typescript-eslint/no-floating-promises": "error",

      "@typescript-eslint/require-await": "error",
    },
  },
);
