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
  ScalarSchema,
  ScalarFieldsSchema,
  ScalarRepeatedSchema,
} from "@bufbuild/knit-test-spec/spec/scalars_pb.js";
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
  NullValue,
  StringValueSchema,
  StructSchema,
  TimestampSchema,
  UInt32ValueSchema,
  UInt64ValueSchema,
  ValueSchema,
} from "@bufbuild/protobuf/wkt";
import {
  create,
  createRegistry,
  fromJson,
  type DescMessage,
  type JsonValue,
  type Message,
} from "@bufbuild/protobuf";
import { anyPack } from "@bufbuild/protobuf/wkt";
import { base64Encode } from "@bufbuild/protobuf/wire";
import { test, expect, describe } from "@jest/globals";

import { formatMessage } from "./json.js";
import type {
  GatewaySchema,
  GatewaySchemaField,
  GatewaySchemaFieldType,
} from "./schema.js";
import { AllSchema } from "@bufbuild/knit-test-spec/spec/all_pb.js";
import {
  MessageSchema as Message$1Schema,
  Message_InnerSchema,
} from "@bufbuild/knit-test-spec/spec/messages_pb.js";

describe("valid", () => {
  // Accepts partial field shapes (only name+type required) for test data brevity
  type PartialField = Pick<GatewaySchemaField, "name" | "type">;
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
  const message = (
    typeName: string,
    fields: PartialField[],
  ): GatewaySchemaFieldType => ({
    value: {
      case: "message" as const,
      value: {
        name: typeName,
        fields: fields as unknown as GatewaySchemaField[],
        localNameTable: new Map(),
      } satisfies GatewaySchema,
    },
  });
  const messageElement = (typeName: string, fields: PartialField[]) =>
    message(typeName, fields).value as {
      case: "message";
      value: GatewaySchema;
    };
  const testCases: {
    name: string;
    i: Message;
    desc: DescMessage;
    o: JsonValue;
    schema: GatewaySchema;
  }[] = [
    {
      name: "missing-property",
      i: create(ScalarFieldsSchema, {}),
      desc: ScalarFieldsSchema,
      o: {},
      schema: {
        name: ScalarFieldsSchema.typeName,
        localNameTable: new Map(),
        fields: [
          { name: "str", type: scalar(Schema_Field_Type_ScalarType.STRING) },
        ] as GatewaySchemaField[],
      },
    },
    {
      name: "wkt-Timestamp",
      i: fromJson(TimestampSchema, "1970-01-01T00:00:00Z"),
      desc: TimestampSchema,
      o: "1970-01-01T00:00:00Z",
      schema: {
        name: TimestampSchema.typeName,
        fields: [],
        localNameTable: new Map(),
      },
    },
    {
      name: "wkt-Duration",
      i: fromJson(DurationSchema, "3s"),
      desc: DurationSchema,
      o: "3s",
      schema: {
        name: DurationSchema.typeName,
        fields: [],
        localNameTable: new Map(),
      },
    },
    {
      name: "wkt-Any",
      i: anyPack(BoolValueSchema, create(BoolValueSchema, { value: true })),
      desc: AnySchema,
      o: {
        "@type": `type.googleapis.com/${BoolValueSchema.typeName}`,
        value: true,
      },
      schema: {
        name: AnySchema.typeName,
        fields: [],
        localNameTable: new Map(),
      },
    },
    {
      name: "wkt-DoubleValue",
      i: fromJson(DoubleValueSchema, "123.321"),
      desc: DoubleValueSchema,
      o: 123.321,
      schema: {
        name: DoubleValueSchema.typeName,
        fields: [],
        localNameTable: new Map(),
      },
    },
    {
      name: "wkt-BoolValue",
      i: fromJson(BoolValueSchema, true),
      desc: BoolValueSchema,
      o: true,
      schema: {
        name: BoolValueSchema.typeName,
        fields: [],
        localNameTable: new Map(),
      },
    },
    {
      name: "wkt-FloatValue",
      i: fromJson(FloatValueSchema, 123.321),
      desc: FloatValueSchema,
      o: 123.321,
      schema: {
        name: FloatValueSchema.typeName,
        fields: [],
        localNameTable: new Map(),
      },
    },
    {
      name: "wkt-Int64Value",
      i: fromJson(Int64ValueSchema, "123"),
      desc: Int64ValueSchema,
      o: "123",
      schema: {
        name: Int64ValueSchema.typeName,
        fields: [],
        localNameTable: new Map(),
      },
    },
    {
      name: "wkt-UInt64Value",
      i: fromJson(UInt64ValueSchema, "123"),
      desc: UInt64ValueSchema,
      o: "123",
      schema: {
        name: UInt64ValueSchema.typeName,
        fields: [],
        localNameTable: new Map(),
      },
    },
    {
      name: "wkt-Int32Value",
      i: fromJson(Int32ValueSchema, 12321),
      desc: Int32ValueSchema,
      o: 12321,
      schema: {
        name: Int32ValueSchema.typeName,
        fields: [],
        localNameTable: new Map(),
      },
    },
    {
      name: "wkt-UInt32Value",
      i: fromJson(UInt32ValueSchema, 12321),
      desc: UInt32ValueSchema,
      o: 12321,
      schema: {
        name: UInt32ValueSchema.typeName,
        fields: [],
        localNameTable: new Map(),
      },
    },
    {
      name: "wkt-StringValue",
      i: fromJson(StringValueSchema, "some"),
      desc: StringValueSchema,
      o: "some",
      schema: {
        name: StringValueSchema.typeName,
        fields: [],
        localNameTable: new Map(),
      },
    },
    {
      name: "wkt-BytesValue",
      i: fromJson(BytesValueSchema, "asd"),
      desc: BytesValueSchema,
      o: "asc=",
      schema: {
        name: BytesValueSchema.typeName,
        fields: [],
        localNameTable: new Map(),
      },
    },
    {
      name: "wkt-Empty",
      i: fromJson(EmptySchema, {}),
      desc: EmptySchema,
      o: {},
      schema: {
        name: EmptySchema.typeName,
        fields: [],
        localNameTable: new Map(),
      },
    },
    {
      name: "wkt-FieldMask",
      i: fromJson(FieldMaskSchema, "foo,bar"),
      desc: FieldMaskSchema,
      o: "foo,bar",
      schema: {
        name: FieldMaskSchema.typeName,
        fields: [],
        localNameTable: new Map(),
      },
    },
    {
      name: "wkt-Struct",
      i: fromJson(StructSchema, { some: 1 }),
      desc: StructSchema,
      o: { some: 1 },
      schema: {
        name: StructSchema.typeName,
        fields: [],
        localNameTable: new Map(),
      },
    },
    {
      name: "wkt-ListValue",
      i: fromJson(ListValueSchema, [1]),
      desc: ListValueSchema,
      o: [1],
      schema: {
        name: ListValueSchema.typeName,
        fields: [],
        localNameTable: new Map(),
      },
    },
    {
      name: "wkt-Value",
      i: fromJson(ValueSchema, { some: 1 }),
      desc: ValueSchema,
      o: { some: 1 },
      schema: {
        name: ValueSchema.typeName,
        fields: [],
        localNameTable: new Map(),
      },
    },
    {
      name: "wkt-NullValue",
      i: create(WktFieldsSchema, { nullValue: NullValue.NULL_VALUE }),
      desc: WktFieldsSchema,
      o: { nullValue: null },
      schema: {
        name: WktFieldsSchema.typeName,
        localNameTable: new Map(),
        fields: [
          {
            name: "nullValue",
            type: scalar(Schema_Field_Type_ScalarType.NULL),
          },
        ] as GatewaySchemaField[],
      },
    },
    {
      name: "scalars",
      i: create(ScalarFieldsSchema, {
        str: "some",
        bl: true,
        i32: 32,
        i64: BigInt(64),
        u32: 132,
        u64: BigInt(164),
        s32: 32,
        s64: BigInt(64),
        f32: 232,
        f64: BigInt(264),
        sf32: 332,
        sf64: BigInt(364),
        by: new TextEncoder().encode("asd"),
        db: 64.64,
        fl: 32.32,
      }),
      desc: ScalarFieldsSchema,
      o: {
        str: "some",
        bl: true,
        i32: 32,
        i64: "64",
        u32: 132,
        u64: "164",
        s32: 32,
        s64: "64",
        f32: 232,
        f64: "264",
        sf32: 332,
        sf64: "364",
        by: base64Encode(new TextEncoder().encode("asd")),
        db: 64.64,
        fl: 32.32,
      },
      schema: {
        name: ScalarFieldsSchema.typeName,
        localNameTable: new Map(),
        fields: [
          { name: "str", type: scalar(Schema_Field_Type_ScalarType.STRING) },
          { name: "bl", type: scalar(Schema_Field_Type_ScalarType.BOOL) },
          { name: "i32", type: scalar(Schema_Field_Type_ScalarType.INT32) },
          { name: "i64", type: scalar(Schema_Field_Type_ScalarType.INT64) },
          { name: "u32", type: scalar(Schema_Field_Type_ScalarType.UINT32) },
          { name: "u64", type: scalar(Schema_Field_Type_ScalarType.UINT64) },
          { name: "s32", type: scalar(Schema_Field_Type_ScalarType.INT32) },
          { name: "s64", type: scalar(Schema_Field_Type_ScalarType.INT64) },
          { name: "f32", type: scalar(Schema_Field_Type_ScalarType.UINT32) },
          { name: "f64", type: scalar(Schema_Field_Type_ScalarType.UINT64) },
          { name: "sf32", type: scalar(Schema_Field_Type_ScalarType.UINT32) },
          { name: "sf64", type: scalar(Schema_Field_Type_ScalarType.UINT64) },
          { name: "by", type: scalar(Schema_Field_Type_ScalarType.BYTES) },
          { name: "db", type: scalar(Schema_Field_Type_ScalarType.DOUBLE) },
          { name: "fl", type: scalar(Schema_Field_Type_ScalarType.FLOAT) },
        ] as GatewaySchemaField[],
      },
    },
    {
      name: "deep-nested",
      i: create(AllSchema, {
        scalars: {
          fields: {
            str: "some",
          },
          repeated: {
            u32: [1, 2, 3],
          },
        },
        message: {
          inner: {
            mess: {
              selfMap: {
                "@mapKey": {
                  id: "id",
                },
              },
            },
          },
        },
      }),
      desc: AllSchema,
      o: {
        scalars: {
          fields: {
            str: "some",
          },
          repeated: {
            u32: [1, 2, 3],
          },
        },
        message: {
          inner: {
            mess: {
              selfMap: {
                "@mapKey": {
                  id: "id",
                },
              },
            },
          },
        },
      },
      schema: {
        name: AllSchema.typeName,
        localNameTable: new Map(),
        fields: [
          {
            name: "scalars",
            type: message(ScalarSchema.typeName, [
              {
                name: "fields",
                type: message(ScalarFieldsSchema.typeName, [
                  {
                    name: "str",
                    type: scalar(Schema_Field_Type_ScalarType.STRING),
                  },
                ]),
              },
              {
                name: "repeated",
                type: message(ScalarRepeatedSchema.typeName, [
                  {
                    name: "u32",
                    type: {
                      value: {
                        case: "repeated",
                        value: {
                          element: scalarElement(
                            Schema_Field_Type_ScalarType.UINT32,
                          ),
                        },
                      },
                    },
                  },
                ]),
              },
            ]),
          },
          {
            name: "message",
            type: message(Message$1Schema.typeName, [
              {
                name: "inner",
                type: message(Message_InnerSchema.typeName, [
                  {
                    name: "mess",
                    type: message(Message$1Schema.typeName, [
                      {
                        name: "selfMap",
                        type: {
                          value: {
                            case: "map",
                            value: {
                              key: Schema_Field_Type_ScalarType.STRING,
                              value: messageElement(Message$1Schema.typeName, [
                                {
                                  name: "id",
                                  type: scalar(
                                    Schema_Field_Type_ScalarType.STRING,
                                  ),
                                },
                              ]),
                            },
                          },
                        },
                      },
                    ]),
                  },
                ]),
              },
            ]),
          },
        ] as GatewaySchemaField[],
      },
    },
  ];
  const typeRegistry = createRegistry(BoolValueSchema);
  for (const testCase of testCases) {
    test(testCase.name, () => {
      expect(
        formatMessage(
          testCase.i,
          testCase.desc,
          testCase.schema,
          undefined,
          false,
          typeRegistry,
        )[0],
      ).toEqual(testCase.o);
    });
  }
});
