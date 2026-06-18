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

import { test } from "node:test";
import assert from "node:assert/strict";
import { stitch } from "./stitch.js";
import type { Patch } from "./json.js";
import { AllSchema } from "@bufbuild/knit-test-spec/spec/all_pb.js";
import { create, toJson } from "@bufbuild/protobuf";
import type { MessageShape } from "@bufbuild/protobuf";
import { GetAllRelSelfParamResponse_AllParamResultSchema } from "@bufbuild/knit-test-spec/spec/relations_pb.js";
import type { Relation } from "./gateway.js";
import type { GatewaySchemaField, GatewaySchemaFieldType } from "./schema.js";

test("stitch", async () => {
  const base = create(AllSchema, {});
  const relationFieldInfo =
    GetAllRelSelfParamResponse_AllParamResultSchema.fields.find(
      (f) => f.number === 1,
    )!;
  assert.ok(relationFieldInfo !== undefined);
  const target = {};
  const params = { scalars: { fields: { str: "param" } } };
  const relation = {
    field: relationFieldInfo,
    base: AllSchema,
    method: "",
    resolver: async (bases, gotParams) => {
      assert.deepStrictEqual(
        toJson(AllSchema, gotParams as MessageShape<typeof AllSchema>),
        params,
      );
      return Array(bases.length).fill(create(AllSchema, {}));
    },
  } satisfies Relation;
  const localName = relationFieldInfo.localName;
  const terminalField = {
    name: localName,
    path: localName + "." + localName,
    jsonName: "",
    relation: relation,
    operations: [],
    params: create(AllSchema, params),
    onError: { case: undefined },
    type: {
      value: {
        case: "message",
        value: {
          localNameTable: new Map(),
          name: AllSchema.typeName,
          fields: [],
        },
      },
    },
  } satisfies GatewaySchemaField;
  const type = {
    value: {
      case: "message",
      value: {
        localNameTable: new Map([[localName, terminalField]]),
        name: AllSchema.typeName,
        fields: [terminalField],
      },
    },
  } satisfies GatewaySchemaFieldType;
  const patch = {
    base: base,
    target: target,
    errorPatch: undefined,
    field: {
      name: localName,
      relation: relation,
      path: localName,
      jsonName: "",
      type: type,
      operations: [],
      onError: { case: undefined },
      params: create(AllSchema, params),
    },
  } satisfies Patch;
  await stitch([patch], false, undefined, {});
  assert.deepStrictEqual(target, {
    [localName]: {
      [localName]: {},
    },
  });
});
