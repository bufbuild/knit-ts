// Copyright 2023-2024 Buf Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import js from "@eslint/js";
import { fixupPluginRules } from "@eslint/compat";
import tseslint from "typescript-eslint";
import turbo from "eslint-config-turbo/flat";
import prettier from "eslint-config-prettier";
import noticePlugin from "eslint-plugin-notice";
import globals from "globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the license header template from this package's own directory so that
// the path is always correct regardless of the CWD when eslint runs.
const licenseHeaderTemplate = readFileSync(
  join(__dirname, "license-header"),
  "utf-8",
);

/** @type {import("typescript-eslint").ConfigArray} */
const config = tseslint.config(
  // Global ignores (applied to all configs in the array).
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "src/**/*.test.ts",
      "jest.config.js",
    ],
  },

  // Base JS rules — applied to all files.
  js.configs.recommended,

  // Turbo flat config (enforces TURBO_* env var discipline).
  ...turbo,

  // Disable style rules that conflict with Prettier.
  prettier,

  // Base language options and plugins for all files.
  // Note: projectService is NOT set here — it is scoped to *.ts files below,
  // so that ESLint does not attempt to type-check JS config files.
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      // fixupPluginRules wraps the legacy plugin so context.getFilename() and
      // context.getSourceCode() are shimmed to the ESLint 10 equivalents.
      notice: fixupPluginRules(noticePlugin),
    },
    rules: {
      "no-console": "error",
      "notice/notice": [
        "error",
        {
          template: licenseHeaderTemplate,
        },
      ],
    },
  },

  // TypeScript-specific config with type-checking. Scoped to *.ts files so
  // that the project service is not invoked for JS/MJS config files.
  {
    files: ["**/*.ts"],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        sourceType: "module",
      },
    },
    rules: {
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/array-type": "off",
      // Configure to match the v6 recommended-requiring-type-checking behavior
      // where a default clause was sufficient to satisfy exhaustiveness.
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        { considerDefaultExhaustiveForUnions: true },
      ],
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "error",
      "@typescript-eslint/no-invalid-void-type": "error",
      "@typescript-eslint/no-base-to-string": "error",
      // Turn off rules that are new in typescript-eslint v8 and were not
      // enforced by the v6 recommended-requiring-type-checking preset.
      // This preserves the same effective enforcement level as the old config.
      "@typescript-eslint/only-throw-error": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      // New in v8 recommendedTypeChecked; not in v6 recommended-requiring-type-checking.
      "@typescript-eslint/prefer-promise-reject-errors": "off",
    },
  },
);

export default config;
