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

import { defineConfig, type Options } from "tsup";
import { writeFileSync } from "fs";

const cjsPackageJson = {
  type: "commonjs",
};

const esmPackageJson = {
  type: "module",
  sideEffects: false,
};

const sharedOptions = {
  splitting: false, // Doesn't share code between entry points.
  dts: true,
  clean: true,
  treeshake: true,
  entry: ["./src/index.ts", "./src/gateway/index.ts"],
  outExtension() {
    return {
      js: ".js",
      dts: ".d.ts",
    };
  },
} satisfies Options;

const cjsOptions = {
  ...sharedOptions,
  format: "cjs",
  outDir: "./dist/cjs",
  onSuccess: async () =>
    writeFileSync("./dist/cjs/package.json", JSON.stringify(cjsPackageJson)),
} satisfies Options;

const esmOptions = {
  ...sharedOptions,
  format: "esm",
  outDir: "./dist/esm",
  onSuccess: async () =>
    writeFileSync("./dist/esm/package.json", JSON.stringify(esmPackageJson)),
} satisfies Options;

export default defineConfig((options) => {
  let format = "";
  if (typeof options.format === "string") {
    format = options.format;
  } else if (Array.isArray(options.format)) {
    if (options.format.length != 1) {
      throw new Error("Only one format can be specified at a time");
    }
    format = options.format[0];
  }
  switch (format) {
    case "cjs":
      return { ...cjsOptions, ...options };
    case "esm":
      return { ...esmOptions, ...options };
    default:
      throw new Error(
        `Unexpected build format ${options.format} must be either cjs or esm`,
      );
  }
});
