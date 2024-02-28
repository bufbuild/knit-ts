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

import {
  Schema,
  Schema_Field,
  Schema_Field_Type_ScalarType,
} from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import {
  Scalar,
  ScalarFields,
  ScalarRepeated,
} from "@bufbuild/knit-test-spec/spec/scalars_pb.js";
import { WktFields } from "@bufbuild/knit-test-spec/spec/wkt_pb.js";
import {
  Any,
  BoolValue,
  BytesValue,
  DoubleValue,
  Duration,
  Empty,
  FieldMask,
  FloatValue,
  Int32Value,
  Int64Value,
  ListValue,
  Message,
  NullValue,
  protoBase64,
  StringValue,
  Struct,
  Timestamp,
  UInt32Value,
  UInt64Value,
  Value,
  type PartialMessage,
  type JsonValue,
  createRegistry,
} from "@bufbuild/protobuf";
import { test, expect, describe } from "@jest/globals";

import { formatMessage } from "./json.js";
import { All } from "@bufbuild/knit-test-spec/spec/all_pb.js";
import {
  Message as Message$1,
  Message_Inner,
} from "@bufbuild/knit-test-spec/spec/messages_pb.js";

describe("valid", () => {
  const scalar = (type: Schema_Field_Type_ScalarType) =>
    ({
      value: {
        case: "scalar",
        value: type,
      },
    }) as const;
  const scalarElement = (type: Schema_Field_Type_ScalarType) =>
    scalar(type).value;
  const message = (typeName: string, fields: PartialMessage<Schema_Field>[]) =>
    ({
      value: {
        case: "message",
        value: {
          name: typeName,
          fields: fields,
        } satisfies PartialMessage<Schema>,
      },
    }) as const;
  const messageElement = (
    typeName: string,
    fields: PartialMessage<Schema_Field>[],
  ) => message(typeName, fields).value;
  const testCases: {
    name: string;
    i: Message;
    o: JsonValue;
    schema: PartialMessage<Schema>;
  }[] = [
      {
        name: "missing-property",
        i: new ScalarFields({}),
        o: {},
        schema: {
          name: ScalarFields.typeName,
          fields: [
            { name: "str", type: scalar(Schema_Field_Type_ScalarType.STRING) },
          ],
        },
      },
      {
        name: "wkt-Timestamp",
        i: Timestamp.fromJson("1970-01-01T00:00:00Z"),
        o: "1970-01-01T00:00:00Z",
        schema: { name: Timestamp.typeName },
      },
      {
        name: "wkt-Duration",
        i: Duration.fromJson("3s"),
        o: "3s",
        schema: { name: Duration.typeName },
      },
      {
        name: "wkt-Any",
        i: Any.pack(new BoolValue({ value: true })),
        o: { "@type": `type.googleapis.com/${BoolValue.typeName}`, value: true },
        schema: { name: Any.typeName },
      },
      {
        name: "wkt-DoubleValue",
        i: DoubleValue.fromJson("123.321"),
        o: 123.321,
        schema: { name: DoubleValue.typeName },
      },
      {
        name: "wkt-BoolValue",
        i: BoolValue.fromJson(true),
        o: true,
        schema: { name: BoolValue.typeName },
      },
      {
        name: "wkt-FloatValue",
        i: FloatValue.fromJson(123.321),
        o: 123.321,
        schema: { name: FloatValue.typeName },
      },
      {
        name: "wkt-Int64Value",
        i: Int64Value.fromJson("123"),
        o: "123",
        schema: { name: Int64Value.typeName },
      },
      {
        name: "wkt-UInt64Value",
        i: UInt64Value.fromJson("123"),
        o: "123",
        schema: { name: UInt64Value.typeName },
      },
      {
        name: "wkt-Int32Value",
        i: Int32Value.fromJson(12321),
        o: 12321,
        schema: { name: Int32Value.typeName },
      },
      {
        name: "wkt-UInt32Value",
        i: UInt32Value.fromJson(12321),
        o: 12321,
        schema: { name: UInt32Value.typeName },
      },
      {
        name: "wkt-StringValue",
        i: StringValue.fromJson("some"),
        o: "some",
        schema: { name: StringValue.typeName },
      },
      {
        name: "wkt-BytesValue",
        i: BytesValue.fromJson("asd"),
        o: "asc=",
        schema: { name: BytesValue.typeName },
      },
      {
        name: "wkt-Empty",
        i: Empty.fromJson({}),
        o: {},
        schema: { name: Empty.typeName },
      },
      {
        name: "wkt-FieldMask",
        i: FieldMask.fromJson("foo,bar"),
        o: "foo,bar",
        schema: { name: FieldMask.typeName },
      },
      {
        name: "wkt-Struct",
        i: Struct.fromJson({ some: 1 }),
        o: { some: 1 },
        schema: { name: Struct.typeName },
      },
      {
        name: "wkt-ListValue",
        i: ListValue.fromJson([1]),
        o: [1],
        schema: { name: ListValue.typeName },
      },
      {
        name: "wkt-Value",
        i: Value.fromJson({ some: 1 }),
        o: { some: 1 },
        schema: { name: Value.typeName },
      },
      {
        name: "wkt-NullValue",
        i: new WktFields({ nullValue: NullValue.NULL_VALUE }),
        o: { nullValue: null },
        schema: {
          name: WktFields.typeName,
          fields: [
            {
              name: "nullValue",
              type: scalar(Schema_Field_Type_ScalarType.NULL),
            },
          ],
        },
      },
      {
        name: "scalars",
        i: new ScalarFields({
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
          by: protoBase64.enc(new TextEncoder().encode("asd")),
          db: 64.64,
          fl: 32.32,
        },
        schema: {
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
          ],
        },
      },
      {
        name: "deep-nested",
        i: new All({
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
        schema: new Schema({
          name: All.typeName,
          fields: [
            {
              name: "scalars",
              type: message(Scalar.typeName, [
                {
                  name: "fields",
                  type: message(ScalarFields.typeName, [
                    {
                      name: "str",
                      type: scalar(Schema_Field_Type_ScalarType.STRING),
                    },
                  ]),
                },
                {
                  name: "repeated",
                  type: message(ScalarRepeated.typeName, [
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
              type: message(Message$1.typeName, [
                {
                  name: "inner",
                  type: message(Message_Inner.typeName, [
                    {
                      name: "mess",
                      type: message(Message$1.typeName, [
                        {
                          name: "selfMap",
                          type: {
                            value: {
                              case: "map",
                              value: {
                                key: Schema_Field_Type_ScalarType.STRING,
                                value: messageElement(Message$1.typeName, [
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
          ],
        }),
      },
    ];
  const typeRegistry = createRegistry(BoolValue);
  for (const testCase of testCases) {
    test(testCase.name, () => {
      expect(
        formatMessage(
          testCase.i,
          new Schema(testCase.schema),
          undefined,
          false,
          typeRegistry,
        )[0],
      ).toEqual(testCase.o);
    });
  }
});
