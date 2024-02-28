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

/* eslint-disable no-case-declarations,@typescript-eslint/unbound-method */
import { createEcmaScriptPlugin } from "@bufbuild/protoplugin";

import { version } from "../package.json";

import type { Schema } from "@bufbuild/protoplugin";
import {
  type GeneratedFile,
  type Printable,
  localName,
  findCustomMessageOption,
  type ImportSymbol,
} from "@bufbuild/protoplugin/ecmascript";
import {
  type DescEnum,
  type DescField,
  type DescFile,
  type DescMessage,
  type DescMethod,
  type DescService,
  MethodIdempotency,
  MethodKind,
  ScalarType,
} from "@bufbuild/protobuf";
import { RelationConfig } from "@buf/bufbuild_knit.bufbuild_es/buf/knit/v1alpha1/options_pb.js";

export const protocGenKnitTs = createEcmaScriptPlugin({
  name: "protoc-gen-knit-ts",
  version: `v${version}`,
  generateTs,
  // eslint-disable-next-line  @typescript-eslint/no-empty-function
  generateJs: () => { },
});

function generateTs(schema: Schema) {
  for (const file of schema.files) {
    const g = schema.generateFile(file.name + "_knit.ts");
    generateSchema(g, file);
  }
}

function generateSchema(g: GeneratedFile, file: DescFile) {
  g.preamble(file);
  for (const service of file.services) {
    generateService(g, service);
  }
  for (const message of file.messages) {
    generateMessage(g, message);
  }
  for (const _enum of file.enums) {
    generateEnum(g, _enum);
  }
  for (const service of file.services) {
    generateRelations(g, service);
  }
}

function generateService(g: GeneratedFile, service: DescService) {
  g.print("export type ", localName(service), " = {");
  g.print(indent(1), '"', service.typeName, '": {');
  for (const op of ["fetch", "do", "listen"]) {
    g.print(indent(2), op, ": {");
    for (const method of service.methods) {
      if (methodOp(method) !== op) {
        continue;
      }
      g.print(
        indent(3),
        localName(method),
        ": ",
        getMethodType(g, method),
        ";",
      );
    }
    g.print(indent(2), "};");
  }
  g.print(indent(1), "};");
  g.print("};\n");
}

function getMethodType(g: GeneratedFile, method: DescMethod): Printable {
  return [
    "{ $: ",
    getTypeOfMessage(g.import, method.input),
    "; value: ",
    getTypeOfMessage(g.import, method.output),
    "; }",
  ];
}

function methodOp(method: DescMethod) {
  if (method.methodKind === MethodKind.Unary) {
    if (method.idempotency === MethodIdempotency.NoSideEffects) {
      return "fetch";
    }
    return "do";
  }
  if (method.methodKind === MethodKind.ServerStreaming) {
    return "listen";
  }
  return undefined;
}

function generateMessage(g: GeneratedFile, message: DescMessage) {
  g.print("export interface ", localName(message), " {");
  for (const member of message.members) {
    switch (member.kind) {
      case "field":
        let propertyModifier: Printable = [": "];
        if (
          !member.repeated &&
          (member.optional || member.fieldKind === "message")
        ) {
          propertyModifier = ["?: "];
        }
        g.print(
          indent(1),
          localName(member),
          propertyModifier,
          getFieldType(member, g.import),
          ";",
        );
        break;
      case "oneof":
        g.print(indent(1), localName(member), "?: ", '{ "@oneof": ');
        g.print(indent(2), "{");
        for (const field of member.fields) {
          g.print(
            indent(3),
            localName(field),
            ": ",
            getFieldType(field, g.import),
            ";",
          );
        }
        g.print(indent(2), "};");
        g.print(indent(1), "};");
        break;
    }
  }
  g.print("};\n");
  for (const nestedMessage of message.nestedMessages) {
    generateMessage(g, nestedMessage);
  }
  for (const nestedEnum of message.nestedEnums) {
    generateEnum(g, nestedEnum);
  }
}

function generateRelations(g: GeneratedFile, service: DescService) {
  for (const method of service.methods) {
    const config = getRelationConfig(method);
    if (config === undefined) continue;
    generateRelation(g, method, config);
  }
}

function generateRelation(
  g: GeneratedFile,
  method: DescMethod,
  config: RelationConfig,
) {
  if (config.name === "") {
    throw new Error(`${method.name}: relation name is empty`);
  }
  const baseMessage = getRepeatedMessage(method.input, 1, "bases");
  const shellMessage = getRepeatedMessage(method.output, 1, "values");
  if (shellMessage.fields.length !== 1) {
    throw new Error(
      `${method.name}: relation must have exactly one field, found ${shellMessage.fields.length}`,
    );
  }
  const field = shellMessage.fields[0];
  if (field.number !== 1) {
    throw new Error(
      `${method.name}: relation ${field.name} must have tag 1, found ${field.number}`,
    );
  }
  const base = makeImportSymbol(g.import, baseMessage);
  g.print(
    'declare module "',
    makeImportPathRelative(getImportPath(shellMessage.file), base.from),
    '" {',
  );
  g.print(indent(1), "export interface ", base, "{");
  const valueType = [localName(shellMessage), '["', localName(field), '"]'];
  let paramType: Printable = "undefined";
  if (method.input.fields.length > 1) {
    paramType = [
      "Omit<",
      getTypeOfMessage(g.import, method.input),
      ', "bases">',
    ];
  }
  const relationType = ["{ $: ", paramType, "; value: ", valueType, " }"];
  g.print(indent(2), localName(field), "?: ", ...relationType);
  g.print(indent(1), "}");
  g.print("}\n");
}

function generateEnum(g: GeneratedFile, _enum: DescEnum) {
  g.print("export type ", localName(_enum), " = ");
  for (const member of _enum.values) {
    g.print`${indent(1)}| "${member.name}"`;
  }
  g.print(indent(1), "| number");
  g.print(";\n");
}

function getFieldType(
  field: DescField,
  importFn: GeneratedFile["import"],
): Printable {
  let type: Printable = "unknown";
  switch (field.fieldKind) {
    case "scalar":
      type = [scalarTable[field.scalar]];
      break;
    case "enum":
      type = getTypeOfEnum(importFn, field.enum);
      break;
    case "message":
      type = getTypeOfMessage(importFn, field.message);
      break;
    case "map":
      let valueType: Printable = "unknown";
      switch (field.mapValue.kind) {
        case "scalar":
          valueType = [scalarTable[field.mapValue.scalar]];
          break;
        case "enum":
          valueType = getTypeOfEnum(importFn, field.mapValue.enum);
          break;
        case "message":
          valueType = getTypeOfMessage(importFn, field.mapValue.message);
          break;
      }
      type = [
        '{ "@map": { [k: ',
        mapKeyTable[field.mapKey],
        "]: ",
        valueType,
        " }; }",
      ];
      break;
  }
  if (field.repeated) {
    type = ["Array<", type, ">"];
  }
  if (field.jsonName !== undefined) {
    type = ['{ "@alias": "', field.jsonName, '", value: ', type, "; }"];
  }
  return type;
}

function getTypeOfMessage(
  importFn: GeneratedFile["import"],
  message: DescMessage,
): Printable {
  if (wktSet.has(message.typeName)) {
    return ['"', "@wkt/", message.name, '"'];
  }
  return makeImportSymbol(importFn, message);
}

function getTypeOfEnum(
  importFn: GeneratedFile["import"],
  enumDesc: DescEnum,
): Printable {
  if (wktSet.has(enumDesc.typeName)) {
    // Must be google.protobuf.NullValue
    return ['"', "@wkt/", enumDesc.name, '"'];
  }
  return ['{ "@enum" : ', makeImportSymbol(importFn, enumDesc), "; }"];
}

function getRelationConfig(method: DescMethod): RelationConfig | undefined {
  return findCustomMessageOption(method, 1157, RelationConfig);
}

function getRepeatedMessage(message: DescMessage, tag: number, name: string) {
  for (const field of message.fields) {
    if (field.number !== tag) continue;
    if (field.name !== name) {
      throw new Error(
        `${message.name}: field with ${tag} must be named '${name}', found '${field.name}'`,
      );
    }
    if (!field.repeated) {
      throw new Error(`${message.name}: bases field must be repeated`);
    }
    if (field.fieldKind !== "message") {
      throw new Error(`${message.name}: bases field must be a message `);
    }
    return field.message;
  }
  throw new Error(
    `${message.name}: relation must have a '${name}' field with tag ${tag}`,
  );
}

const wktSet = new Set<string>([
  "google.protobuf.DoubleValue",
  "google.protobuf.BoolValue",
  "google.protobuf.FloatValue",
  "google.protobuf.Int64Value",
  "google.protobuf.UInt64Value",
  "google.protobuf.Int32Value",
  "google.protobuf.UInt32Value",
  "google.protobuf.StringValue",
  "google.protobuf.BytesValue",
  "google.protobuf.Any",
  "google.protobuf.Duration",
  "google.protobuf.Empty",
  "google.protobuf.FieldMask",
  "google.protobuf.Timestamp",
  "google.protobuf.Struct",
  "google.protobuf.ListValue",
  "google.protobuf.Value",
  "google.protobuf.NullValue",
]);

const scalarTable = {
  [ScalarType.DOUBLE]: "number",
  [ScalarType.FLOAT]: "number",
  [ScalarType.INT64]: "bigint",
  [ScalarType.UINT64]: "bigint",
  [ScalarType.INT32]: "number",
  [ScalarType.FIXED64]: "bigint",
  [ScalarType.FIXED32]: "number",
  [ScalarType.BOOL]: "boolean",
  [ScalarType.STRING]: "string",
  [ScalarType.BYTES]: "Uint8Array",
  [ScalarType.UINT32]: "number",
  [ScalarType.SFIXED32]: "number",
  [ScalarType.SFIXED64]: "bigint",
  [ScalarType.SINT32]: "number",
  [ScalarType.SINT64]: "bigint",
} satisfies Record<ScalarType, string>;

const mapKeyTable = {
  [ScalarType.INT64]: "string",
  [ScalarType.UINT64]: "string",
  [ScalarType.INT32]: "number",
  [ScalarType.FIXED64]: "string",
  [ScalarType.FIXED32]: "number",
  [ScalarType.BOOL]: "string",
  [ScalarType.STRING]: "string",
  [ScalarType.UINT32]: "number",
  [ScalarType.SFIXED32]: "number",
  [ScalarType.SFIXED64]: "string",
  [ScalarType.SINT32]: "number",
  [ScalarType.SINT64]: "string",
};

function indent(multiplier: number) {
  return " ".repeat(multiplier * 2);
}

function makeImportSymbol(
  importFn: GeneratedFile["import"],
  desc: DescMessage | DescEnum,
): ImportSymbol {
  return importFn(localName(desc), getImportPath(desc.file)).toTypeOnly();
}

function getImportPath(file: DescFile) {
  return `./${file.name}_knit.js`;
}

/**
 * NOTE: Copied from @bufbuild/protoplugin
 */
const relativePathRE = /^\.{1,2}\//;

/**
 *
 * NOTE: Copied from @bufbuild/protoplugin
 *
 * Makes an import path relative to the file importing it. For example,
 * consider the following files:
 * - foo/foo.js
 * - baz.js
 * If foo.js wants to import baz.js, we return ../baz.js
 */
function makeImportPathRelative(importer: string, importPath: string): string {
  if (!relativePathRE.test(importPath)) {
    // We don't touch absolute imports, like @bufbuild/protobuf
    return importPath;
  }
  let a = importer
    .replace(/^\.\//, "")
    .split("/")
    .filter((p) => p.length > 0)
    .slice(0, -1);
  let b = importPath
    .replace(/^\.\//, "")
    .split("/")
    .filter((p) => p.length > 0);
  let matchingPartCount = 0;
  for (
    let l = Math.min(a.length, b.length);
    matchingPartCount < l;
    matchingPartCount++
  ) {
    if (a[matchingPartCount] !== b[matchingPartCount]) {
      break;
    }
  }
  a = a.slice(matchingPartCount);
  b = b.slice(matchingPartCount);
  const c = a
    .map(() => "..")
    .concat(b)
    .join("/");
  return relativePathRE.test(c) ? c : "./" + c;
}
