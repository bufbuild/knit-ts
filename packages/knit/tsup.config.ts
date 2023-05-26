import { defineConfig, type Options } from "tsup";
import { writeFileSync } from "fs";

const cjsPackageJson = {
  type: "commonjs",
  main: "./index.js",
  types: "./index.d.ts",
  exports: {
    ".": {
      types: "./index.d.ts",
      require: "./index.js",
    },
    "./gateway": {
      types: "./gateway/index.d.ts",
      require: "./gateway/index.js",
    },
  },
  typesVersions: {
    "*": {
      gateway: ["./gateway/index.d.ts"],
    },
  },
};

const esmPackageJson = {
  sideEffects: false,
  type: "module",
  types: "./index.d.ts",
  module: "./index.js",
  exports: {
    ".": {
      types: "./index.d.ts",
      import: "./index.js",
    },
    "./gateway": {
      types: "./gateway/index.d.ts",
      import: "./gateway/index.js",
    },
  },
  typesVersions: {
    "*": {
      gateway: ["./gateway/index.d.ts"],
    },
  },
};

const sharedOptions = {
  splitting: false, // Doesn't share code between entry points.
  dts: true,
  clean: true,
  treeshake: true,
  entry: ["./src/index.ts", "./src/gateway/index.ts"],
} satisfies Options;

const cjsOptions = {
  ...sharedOptions,
  format: "cjs",
  legacyOutput: true, // Outputs `.js` instead of `.cjs`.
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
        `Unexpected build format ${options.format} must be either cjs or esm`
      );
  }
});
