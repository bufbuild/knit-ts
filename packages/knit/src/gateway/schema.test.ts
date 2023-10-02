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

import { describe, expect, test } from "@jest/globals";
import { computeSchema } from "./schema.js";
import {
  MaskField,
  Schema,
  Schema_Field,
  Schema_Field_Type_ScalarType,
} from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import type { MessageType, PartialMessage } from "@bufbuild/protobuf";
import {
  Scalar,
  ScalarFields,
  ScalarRepeated,
} from "@bufbuild/knit-test-spec/spec/scalars_pb.js";
import { All } from "@bufbuild/knit-test-spec/spec/all_pb.js";
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
  StringValue,
  Struct,
  Timestamp,
  UInt32Value,
  UInt64Value,
  Value,
} from "@bufbuild/protobuf";
import { Keys, Map as ProtoMap } from "@bufbuild/knit-test-spec/spec/map_pb.js";
import { Message } from "@bufbuild/knit-test-spec/spec/messages_pb.js";

describe("valid mask", () => {
  const scalar = (type: Schema_Field_Type_ScalarType) =>
    ({
      value: {
        case: "scalar",
        value: type,
      },
    }) as const;
  const messageElement = (
    type: MessageType,
    fields?: PartialMessage<Schema_Field>[],
  ) => message(type, fields).value;
  const scalarElement = (type: Schema_Field_Type_ScalarType) =>
    scalar(type).value;
  const message = (
    type: MessageType,
    fields?: PartialMessage<Schema_Field>[],
  ) =>
    ({
      value: {
        case: "message",
        value: {
          name: type.typeName,
          fields: fields,
        } satisfies PartialMessage<Schema>,
      },
    }) as const;
  const testCases: {
    name: string;
    message: MessageType;
    mask: PartialMessage<MaskField>[];
    schema: PartialMessage<Schema>;
  }[] = [
    {
      name: "empty mask",
      mask: [],
      schema: {
        name: All.typeName,
        fields: [],
      },
      message: All,
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
        name: ScalarFields.typeName,
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
        ],
      },
      message: ScalarFields,
    },
    {
      name: "WKT",
      message: WktFields,
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
        name: WktFields.typeName,
        fields: [
          { name: "doubleValue", type: message(DoubleValue) },
          { name: "boolValue", type: message(BoolValue) },
          { name: "floatValue", type: message(FloatValue) },
          { name: "int64Value", type: message(Int64Value) },
          { name: "uint64Value", type: message(UInt64Value) },
          { name: "int32Value", type: message(Int32Value) },
          { name: "uint32Value", type: message(UInt32Value) },
          { name: "stringValue", type: message(StringValue) },
          { name: "bytesValue", type: message(BytesValue) },
          { name: "any", type: message(Any) },
          { name: "duration", type: message(Duration) },
          { name: "empty", type: message(Empty) },
          { name: "fieldMask", type: message(FieldMask) },
          { name: "timestamp", type: message(Timestamp) },
          { name: "struct", type: message(Struct) },
          { name: "listValue", type: message(ListValue) },
          { name: "value", type: message(Value) },
          {
            name: "nullValue",
            type: scalar(Schema_Field_Type_ScalarType.NULL),
          },
        ],
      },
    },
    {
      name: "Maps",
      message: ProtoMap,
      mask: [
        {
          name: "message",
          mask: [{ name: "enum" }, { name: "keys", mask: [{ name: "str" }] }],
        },
      ],
      schema: {
        name: ProtoMap.typeName,
        fields: [
          {
            name: "message",
            type: {
              value: {
                case: "map",
                value: {
                  key: Schema_Field_Type_ScalarType.STRING,
                  value: messageElement(ProtoMap, [
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
                      type: message(Keys, [
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
        ],
      },
    },
    {
      name: "Repeated scalar",
      message: Scalar,
      mask: [{ name: "repeated", mask: [{ name: "str" }] }],
      schema: {
        name: Scalar.typeName,
        fields: [
          {
            name: "repeated",
            type: message(ScalarRepeated, [
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
        ],
      },
    },
    {
      name: "Repeated message",
      message: Message,
      mask: [{ name: "selfs", mask: [{ name: "id" }] }],
      schema: {
        name: Message.typeName,
        fields: [
          {
            name: "selfs",
            type: {
              value: {
                case: "repeated",
                value: {
                  element: messageElement(Message, [
                    {
                      name: "id",
                      type: scalar(Schema_Field_Type_ScalarType.STRING),
                    },
                  ]),
                },
              },
            },
          },
        ],
      },
    },
  ];
  for (const testCase of testCases) {
    test(testCase.name, () => {
      expect(
        new Schema(
          computeSchema(
            testCase.message,
            testCase.mask.map((m) => new MaskField(m)),
            "",
            new Map(),
            new Map(),
            [],
          ),
        ),
      ).toEqual(new Schema(testCase.schema));
    });
  }
});

describe("invalid mask", () => {
  const testCases: {
    name: string;
    message: MessageType;
    mask: PartialMessage<MaskField>[];
  }[] = [
    {
      name: "Can't select WKTs",
      message: Timestamp,
      mask: [{ name: "seconds" }],
    },
    {
      name: "Can't select unknown fields",
      message: All,
      mask: [{ name: "notPartOfAll" }],
    },
  ];
  for (const testCase of testCases) {
    test(testCase.name, () => {
      expect(() =>
        computeSchema(
          testCase.message,
          testCase.mask.map((m) => new MaskField(m)),
          "",
          new Map(),
          new Map(),
          [],
        ),
      ).toThrow();
    });
  }
});
