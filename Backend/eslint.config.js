import globals from "globals";
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": ["error", { "vars": "all", "args": "after-used", "ignoreRestSiblings": false, "argsIgnorePattern": "^_" }],
    }
  },
];
