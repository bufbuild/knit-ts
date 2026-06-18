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

import { Schema_Field_Type_ScalarType } from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import {
  ScalarFieldsOptionalSchema,
  ScalarRepeatedSchema,
} from "@bufbuild/knit-test-spec/spec/scalars_pb.js";
import { KeysSchema } from "@bufbuild/knit-test-spec/spec/map_pb.js";
import { create } from "@bufbuild/protobuf";
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatMessage } from "./json.js";
import type { GatewaySchema, GatewaySchemaField } from "./schema.js";

// Regression tests: scalar zero values inside repeated fields and map values
// must be emitted, not dropped to `null` (which the client decodes as
// `undefined`, corrupting the round-trip).

test("repeated int32 emits a zero element", () => {
  const schema: GatewaySchema = {
    name: ScalarRepeatedSchema.typeName,
    localNameTable: new Map(),
    fields: [
      {
        name: "i32",
        type: {
          value: {
            case: "repeated",
            value: {
              element: {
                case: "scalar",
                value: Schema_Field_Type_ScalarType.INT32,
              },
            },
          },
        },
      },
    ] as GatewaySchemaField[],
  };
  const out = formatMessage(
    create(ScalarRepeatedSchema, { i32: [0, 1, 2] }),
    ScalarRepeatedSchema,
    schema,
    undefined,
    false,
    undefined,
  )[0];
  assert.deepStrictEqual(out, { i32: [0, 1, 2] });
});

test("map<string,string> emits an empty-string (zero) value", () => {
  const schema: GatewaySchema = {
    name: KeysSchema.typeName,
    localNameTable: new Map(),
    fields: [
      {
        name: "str",
        type: {
          value: {
            case: "map",
            value: {
              key: Schema_Field_Type_ScalarType.STRING,
              value: {
                case: "scalar",
                value: Schema_Field_Type_ScalarType.STRING,
              },
            },
          },
        },
      },
    ] as GatewaySchemaField[],
  };
  const out = formatMessage(
    create(KeysSchema, { str: { a: "", b: "x" } }),
    KeysSchema,
    schema,
    undefined,
    false,
    undefined,
  )[0];
  assert.deepStrictEqual(out, { str: { a: "", b: "x" } });
});

test("unset optional int64 singular field is omitted, not a crash", () => {
  const schema: GatewaySchema = {
    name: ScalarFieldsOptionalSchema.typeName,
    localNameTable: new Map(),
    fields: [
      {
        name: "i64",
        type: {
          value: {
            case: "scalar",
            value: Schema_Field_Type_ScalarType.INT64,
          },
        },
      },
    ] as GatewaySchemaField[],
  };
  const out = formatMessage(
    create(ScalarFieldsOptionalSchema, {}), // i64 unset -> undefined
    ScalarFieldsOptionalSchema,
    schema,
    undefined,
    false,
    undefined,
  )[0];
  assert.deepStrictEqual(out, {});
});
