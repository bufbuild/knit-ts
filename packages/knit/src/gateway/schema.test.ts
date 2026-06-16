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

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { computeSchema } from "./schema.js";
import type {
  GatewaySchema,
  GatewaySchemaField,
  GatewaySchemaFieldType,
} from "./schema.js";
import {
  MaskFieldSchema,
  SchemaSchema,
  Schema_Field_Type_ScalarType,
} from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import {
  create,
  type DescMessage,
  type MessageInitShape,
} from "@bufbuild/protobuf";
import {
  ScalarSchema,
  ScalarFieldsSchema,
  ScalarRepeatedSchema,
} from "@bufbuild/knit-test-spec/spec/scalars_pb.js";
import { AllSchema } from "@bufbuild/knit-test-spec/spec/all_pb.js";
import { WktFieldsSchema } from "@bufbuild/knit-test-spec/spec/wkt_pb.js";
import {
  AnySchema,
  BoolValueSchema,
  BytesValueSchema,
  DoubleValueSchema,
  DurationSchema,
  EmptySchema,
  FieldMaskSchema,
  FloatValueSchema,
  Int32ValueSchema,
  Int64ValueSchema,
  ListValueSchema,
  StringValueSchema,
  StructSchema,
  TimestampSchema,
  UInt32ValueSchema,
  UInt64ValueSchema,
  ValueSchema,
} from "@bufbuild/protobuf/wkt";
import {
  KeysSchema,
  MapSchema as ProtoMapSchema,
} from "@bufbuild/knit-test-spec/spec/map_pb.js";
import { MessageSchema } from "@bufbuild/knit-test-spec/spec/messages_pb.js";

describe("valid mask", () => {
  const scalar = (
    type: Schema_Field_Type_ScalarType,
  ): GatewaySchemaFieldType => ({
    value: {
      case: "scalar" as const,
      value: type,
    },
  });
  const scalarElement = (
    type: Schema_Field_Type_ScalarType,
  ): { case: "scalar"; value: Schema_Field_Type_ScalarType } => ({
    case: "scalar" as const,
    value: type,
  });
  // Accepts partial field shapes (only name+type required) for test data brevity
  type PartialField = Pick<GatewaySchemaField, "name" | "type">;
  const message = (
    desc: DescMessage,
    fields?: PartialField[],
  ): GatewaySchemaFieldType => ({
    value: {
      case: "message" as const,
      value: {
        name: desc.typeName,
        fields: (fields ?? []) as unknown as GatewaySchemaField[],
        localNameTable: new Map(),
      } satisfies GatewaySchema,
    },
  });
  const messageElement = (desc: DescMessage, fields?: PartialField[]) =>
    message(desc, fields).value as { case: "message"; value: GatewaySchema };
  const testCases: {
    name: string;
    message: DescMessage;
    mask: MessageInitShape<typeof MaskFieldSchema>[];
    schema: GatewaySchema;
  }[] = [
    {
      name: "empty mask",
      mask: [],
      schema: {
        name: AllSchema.typeName,
        fields: [],
        localNameTable: new Map(),
      },
      message: AllSchema,
    },
    {
      name: "Scalars",
      mask: [
        { name: "str" },
        { name: "bl" },
        { name: "i32" },
        { name: "i64" },
        { name: "u32" },
        { name: "u64" },
        { name: "s32" },
        { name: "s64" },
        { name: "f32" },
        { name: "f64" },
        { name: "sf32" },
        { name: "sf64" },
        { name: "by" },
        { name: "db" },
        { name: "fl" },
      ],
      schema: {
        name: ScalarFieldsSchema.typeName,
        localNameTable: new Map(),
        fields: [
          {
            name: "str",
            type: scalar(Schema_Field_Type_ScalarType.STRING),
          },
          { name: "bl", type: scalar(Schema_Field_Type_ScalarType.BOOL) },
          { name: "i32", type: scalar(Schema_Field_Type_ScalarType.INT32) },
          { name: "i64", type: scalar(Schema_Field_Type_ScalarType.INT64) },
          {
            name: "u32",
            type: scalar(Schema_Field_Type_ScalarType.UINT32),
          },
          {
            name: "u64",
            type: scalar(Schema_Field_Type_ScalarType.UINT64),
          },
          { name: "s32", type: scalar(Schema_Field_Type_ScalarType.INT32) },
          { name: "s64", type: scalar(Schema_Field_Type_ScalarType.INT64) },
          {
            name: "f32",
            type: scalar(Schema_Field_Type_ScalarType.UINT32),
          },
          {
            name: "f64",
            type: scalar(Schema_Field_Type_ScalarType.UINT64),
          },
          {
            name: "sf32",
            type: scalar(Schema_Field_Type_ScalarType.INT32),
          },
          {
            name: "sf64",
            type: scalar(Schema_Field_Type_ScalarType.INT64),
          },
          { name: "by", type: scalar(Schema_Field_Type_ScalarType.BYTES) },
          { name: "db", type: scalar(Schema_Field_Type_ScalarType.DOUBLE) },
          { name: "fl", type: scalar(Schema_Field_Type_ScalarType.FLOAT) },
        ] as GatewaySchemaField[],
      },
      message: ScalarFieldsSchema,
    },
    {
      name: "WKT",
      message: WktFieldsSchema,
      mask: [
        { name: "doubleValue" },
        { name: "boolValue" },
        { name: "floatValue" },
        { name: "int64Value" },
        { name: "uint64Value" },
        { name: "int32Value" },
        { name: "uint32Value" },
        { name: "stringValue" },
        { name: "bytesValue" },
        { name: "any" },
        { name: "duration" },
        { name: "empty" },
        { name: "fieldMask" },
        { name: "timestamp" },
        { name: "struct" },
        { name: "listValue" },
        { name: "value" },
        { name: "nullValue" },
      ],
      schema: {
        name: WktFieldsSchema.typeName,
        localNameTable: new Map(),
        fields: [
          { name: "doubleValue", type: message(DoubleValueSchema) },
          { name: "boolValue", type: message(BoolValueSchema) },
          { name: "floatValue", type: message(FloatValueSchema) },
          { name: "int64Value", type: message(Int64ValueSchema) },
          { name: "uint64Value", type: message(UInt64ValueSchema) },
          { name: "int32Value", type: message(Int32ValueSchema) },
          { name: "uint32Value", type: message(UInt32ValueSchema) },
          { name: "stringValue", type: message(StringValueSchema) },
          { name: "bytesValue", type: message(BytesValueSchema) },
          { name: "any", type: message(AnySchema) },
          { name: "duration", type: message(DurationSchema) },
          { name: "empty", type: message(EmptySchema) },
          { name: "fieldMask", type: message(FieldMaskSchema) },
          { name: "timestamp", type: message(TimestampSchema) },
          { name: "struct", type: message(StructSchema) },
          { name: "listValue", type: message(ListValueSchema) },
          { name: "value", type: message(ValueSchema) },
          {
            name: "nullValue",
            type: scalar(Schema_Field_Type_ScalarType.NULL),
          },
        ] as GatewaySchemaField[],
      },
    },
    {
      name: "Maps",
      message: ProtoMapSchema,
      mask: [
        {
          name: "message",
          mask: [{ name: "enum" }, { name: "keys", mask: [{ name: "str" }] }],
        },
      ],
      schema: {
        name: ProtoMapSchema.typeName,
        localNameTable: new Map(),
        fields: [
          {
            name: "message",
            type: {
              value: {
                case: "map",
                value: {
                  key: Schema_Field_Type_ScalarType.STRING,
                  value: messageElement(ProtoMapSchema, [
                    {
                      name: "enum",
                      type: {
                        value: {
                          case: "map",
                          value: {
                            key: Schema_Field_Type_ScalarType.STRING,
                            value: scalarElement(
                              Schema_Field_Type_ScalarType.ENUM,
                            ),
                          },
                        },
                      },
                    },
                    {
                      name: "keys",
                      type: message(KeysSchema, [
                        {
                          name: "str",
                          type: {
                            value: {
                              case: "map",
                              value: {
                                key: Schema_Field_Type_ScalarType.STRING,
                                value: scalarElement(
                                  Schema_Field_Type_ScalarType.STRING,
                                ),
                              },
                            },
                          },
                        },
                      ]),
                    },
                  ]),
                },
              },
            },
          },
        ] as GatewaySchemaField[],
      },
    },
    {
      name: "Repeated scalar",
      message: ScalarSchema,
      mask: [{ name: "repeated", mask: [{ name: "str" }] }],
      schema: {
        name: ScalarSchema.typeName,
        localNameTable: new Map(),
        fields: [
          {
            name: "repeated",
            type: message(ScalarRepeatedSchema, [
              {
                name: "str",
                type: {
                  value: {
                    case: "repeated",
                    value: {
                      element: scalarElement(
                        Schema_Field_Type_ScalarType.STRING,
                      ),
                    },
                  },
                },
              },
            ]),
          },
        ] as GatewaySchemaField[],
      },
    },
    {
      name: "Repeated message",
      message: MessageSchema,
      mask: [{ name: "selfs", mask: [{ name: "id" }] }],
      schema: {
        name: MessageSchema.typeName,
        localNameTable: new Map(),
        fields: [
          {
            name: "selfs",
            type: {
              value: {
                case: "repeated",
                value: {
                  element: messageElement(MessageSchema, [
                    {
                      name: "id",
                      type: scalar(Schema_Field_Type_ScalarType.STRING),
                    },
                  ]),
                },
              },
            },
          },
        ] as GatewaySchemaField[],
      },
    },
  ];
  for (const testCase of testCases) {
    test(testCase.name, () => {
      assert.deepStrictEqual(
        create(
          SchemaSchema,
          computeSchema(
            testCase.message,
            testCase.mask.map((m) => create(MaskFieldSchema, m)),
            "",
            new Map(),
            new Map(),
            [],
          ),
        ),
        create(SchemaSchema, testCase.schema),
      );
    });
  }
});

describe("invalid mask", () => {
  const testCases: {
    name: string;
    message: DescMessage;
    mask: MessageInitShape<typeof MaskFieldSchema>[];
  }[] = [
    {
      name: "Can't select WKTs",
      message: TimestampSchema,
      mask: [{ name: "seconds" }],
    },
    {
      name: "Can't select unknown fields",
      message: AllSchema,
      mask: [{ name: "notPartOfAll" }],
    },
  ];
  for (const testCase of testCases) {
    test(testCase.name, () => {
      assert.throws(() =>
        computeSchema(
          testCase.message,
          testCase.mask.map((m) => create(MaskFieldSchema, m)),
          "",
          new Map(),
          new Map(),
          [],
        ),
      );
    });
  }
});
