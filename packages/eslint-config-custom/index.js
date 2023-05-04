// Copyright 2023 Buf Technologies, Inc.
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

/** @type { import('eslint').Linter.Config } */
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  ignorePatterns: [
    "dist/**",
    "node_modules/**",
    "src/**.test.ts",
    "jest.config.js",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    project: "./tsconfig.json", // Because we use turbo this is relative to the package root.
  },
  plugins: ["@typescript-eslint", "notice"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "turbo",
    "prettier",
  ],
  rules: {
    "no-console": "error",
    "@typescript-eslint/strict-boolean-expressions": "error",
    "@typescript-eslint/no-unnecessary-condition": "error",
    "@typescript-eslint/array-type": "off", // we use complex typings, where Array is actually more readable than T[]
    "@typescript-eslint/switch-exhaustiveness-check": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/no-unnecessary-boolean-literal-compare": "error",
    "@typescript-eslint/no-invalid-void-type": "error",
    "@typescript-eslint/no-base-to-string": "error",
    "notice/notice": [
      "error",
      {
        templateFile: "../eslint-config-custom/license-header",
      },
    ],
  },
};
