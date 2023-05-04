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

import {
  Schema,
  Schema_Field,
  Schema_Field_Type_ScalarType,
} from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import { ConnectError } from "@bufbuild/connect";
import type { JsonValue, PartialMessage } from "@bufbuild/protobuf";
import { test, expect, describe } from "@jest/globals";

import { applyMask } from "./mask.js";

describe("valid", () => {
  const scalar = (type: Schema_Field_Type_ScalarType) =>
    ({
      value: {
        case: "scalar",
        value: type,
      },
    } as const);
  const message = (fields: PartialMessage<Schema_Field>[]) =>
    ({
      value: {
        case: "message",
        value: {
          fields: fields,
        } satisfies PartialMessage<Schema>,
      },
    } as const);
  const messageElement = (fields: PartialMessage<Schema_Field>[]) =>
    message(fields).value;
  const testCases: {
    name: string;
    i: JsonValue;
    o: JsonValue;
    schema: PartialMessage<Schema>;
  }[] = [
    {
      name: "missing-property",
      i: {},
      o: {},
      schema: {
        fields: [
          { name: "a", type: scalar(Schema_Field_Type_ScalarType.STRING) },
        ],
      },
    },
    {
      name: "wkt-Timestamp",
      i: "1970-01-01T00:00:00Z",
      o: "1970-01-01T00:00:00Z",
      schema: {
        name: "google.protobuf.Timestamp",
      },
    },
    {
      name: "wkt-Duration",
      i: "3.00",
      o: "3.00",
      schema: {
        name: "google.protobuf.Duration",
      },
    },
    {
      name: "wkt-Any",
      i: { "@type": "url" },
      o: { "@type": "url" },
      schema: {
        name: "google.protobuf.Any",
      },
    },
    {
      name: "wkt-DoubleValue",
      i: "123.321",
      o: "123.321",
      schema: { name: "google.protobuf.DoubleValue" },
    },
    {
      name: "wkt-BoolValue",
      i: true,
      o: true,
      schema: { name: "google.protobuf.BoolValue" },
    },
    {
      name: "wkt-FloatValue",
      i: 123.321,
      o: 123.321,
      schema: { name: "google.protobuf.FloatValue" },
    },
    {
      name: "wkt-Int64Value",
      i: "123",
      o: "123",
      schema: { name: "google.protobuf.Int64Value" },
    },
    {
      name: "wkt-UInt64Value",
      i: "123",
      o: "123",
      schema: { name: "google.protobuf.UInt64Value" },
    },
    {
      name: "wkt-Int32Value",
      i: 12321,
      o: 12321,
      schema: { name: "google.protobuf.Int32Value" },
    },
    {
      name: "wkt-UInt32Value",
      i: 12321,
      o: 12321,
      schema: { name: "google.protobuf.UInt32Value" },
    },
    {
      name: "wkt-StringValue",
      i: "some",
      o: "some",
      schema: { name: "google.protobuf.StringValue" },
    },
    {
      name: "wkt-BytesValue",
      i: "asd",
      o: "asd",
      schema: { name: "google.protobuf.BytesValue" },
    },
    {
      name: "wkt-Empty",
      i: {},
      o: {},
      schema: { name: "google.protobuf.Empty" },
    },
    {
      name: "wkt-FieldMask",
      i: "foo,bar",
      o: "foo,bar",
      schema: { name: "google.protobuf.FieldMask" },
    },
    {
      name: "wkt-Struct",
      i: { some: 1 },
      o: { some: 1 },
      schema: { name: "google.protobuf.Struct" },
    },
    {
      name: "wkt-ListValue",
      i: [1],
      o: [1],
      schema: { name: "google.protobuf.ListValue" },
    },
    {
      name: "wkt-Value",
      i: { some: 1 },
      o: { some: 1 },
      schema: { name: "google.protobuf.Value" },
    },
    {
      name: "wkt-NullValue",
      i: null,
      o: null,
      schema: { name: "google.protobuf.NullValue" },
    },
    {
      name: "scalars",
      i: {
        enum: "SOME_ENUM",
        int32: 12321,
        uint32: 12321,
        int64: 12321,
        uint64: 12321,
        float: 12.21,
        double: 123.321,
        bool: true,
        string: "some",
        bytes: "bytes",
        null: null,
      },
      o: {
        enum: "SOME_ENUM",
        int32: 12321,
        uint32: 12321,
        int64: 12321,
        uint64: 12321,
        float: 12.21,
        double: 123.321,
        bool: true,
        string: "some",
        bytes: "bytes",
        null: null,
      },
      schema: {
        fields: [
          { name: "enum", type: scalar(Schema_Field_Type_ScalarType.ENUM) },
          { name: "int32", type: scalar(Schema_Field_Type_ScalarType.INT32) },
          { name: "uint32", type: scalar(Schema_Field_Type_ScalarType.UINT32) },
          { name: "int64", type: scalar(Schema_Field_Type_ScalarType.INT64) },
          { name: "uint64", type: scalar(Schema_Field_Type_ScalarType.UINT64) },
          { name: "float", type: scalar(Schema_Field_Type_ScalarType.FLOAT) },
          { name: "double", type: scalar(Schema_Field_Type_ScalarType.DOUBLE) },
          { name: "bool", type: scalar(Schema_Field_Type_ScalarType.BOOL) },
          { name: "string", type: scalar(Schema_Field_Type_ScalarType.STRING) },
          { name: "bytes", type: scalar(Schema_Field_Type_ScalarType.BYTES) },
          { name: "null", type: scalar(Schema_Field_Type_ScalarType.NULL) },
        ],
      },
    },
    {
      name: "deep-nested",
      i: {
        some: {
          include: {
            a: 1,
            b: 2,
            array: [
              {
                some: {
                  "@mapKey": {
                    mapValueKey: "12",
                  },
                },
                else: {
                  a: 1,
                },
              },
            ],
          },
        },
        other: {
          c: 3,
        },
      },
      o: {
        some: {
          include: {
            array: [
              {
                some: {
                  "@mapKey": {
                    mapValueKey: "12",
                  },
                },
              },
            ],
          },
        },
      },
      schema: {
        fields: [
          {
            name: "some",
            type: message([
              {
                name: "include",
                type: message([
                  {
                    name: "array",
                    type: {
                      value: {
                        case: "repeated",
                        value: {
                          element: messageElement([
                            {
                              name: "someOther",
                              jsonName: "some",
                              type: {
                                value: {
                                  case: "map",
                                  value: {
                                    key: Schema_Field_Type_ScalarType.STRING,
                                    value: messageElement([
                                      {
                                        name: "mapValueKey",
                                        type: scalar(
                                          Schema_Field_Type_ScalarType.INT64
                                        ),
                                      },
                                    ]),
                                  },
                                },
                              },
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
        ],
      },
    },
  ];
  for (const testCase of testCases) {
    test(testCase.name, () => {
      expect(applyMask(testCase.i, new Schema(testCase.schema))).toEqual(
        testCase.o
      );
    });
  }
});

// We test that if it throws it is a ConnectError
describe("throws connect errors on invalid input", () => {
  const testCases: {
    name: string;
    i: JsonValue;
    schema: PartialMessage<Schema>;
  }[] = [
    {
      name: "not an object",
      i: 123,
      schema: {},
    },
    {
      name: "not an array",
      i: { some: 1 },
      schema: {
        fields: [
          {
            name: "some",
            type: {
              value: {
                case: "repeated",
                value: { element: { case: "message", value: {} } },
              },
            },
          },
        ],
      },
    },
    {
      name: "map value not an object",
      i: { some: 1 },
      schema: {
        fields: [
          {
            name: "some",
            type: {
              value: {
                case: "map",
                value: {
                  value: { case: "message", value: {} },
                },
              },
            },
          },
        ],
      },
    },
    {
      name: "missing type",
      i: { some: 1 },
      schema: {
        fields: [
          {
            name: "some",
          },
        ],
      },
    },
  ];
  for (const testCase of testCases) {
    test(testCase.name, () => {
      expect(() => applyMask(testCase.i, new Schema(testCase.schema))).toThrow(
        ConnectError
      );
    });
  }
});
