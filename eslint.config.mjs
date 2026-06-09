import js from "@eslint/js";
import path from "node:path";
import {fileURLToPath} from "node:url";
import tseslint from "typescript-eslint";

const configDir = path.dirname(fileURLToPath(import.meta.url));

export default [
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: [".agents/skills/notion-notes/src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: configDir
      }
    },
    rules: {
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-namespace": "error",
      "no-restricted-syntax": [
        "error",
        {
          "selector": "TSModuleDeclaration",
          "message": "Namespaces are not allowed in this renderer."
        }
      ],
      "no-var": "error",
      "prefer-const": "error"
    }
  }
]
