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
  type JsonValue,
  BoolValue,
  Value,
  protoBase64,
} from "@bufbuild/protobuf";
import { describe, expect, test } from "@jest/globals";
import { alias } from "./alias.js";
import {
  Error_Code,
  Schema,
  Schema_Field_Type_ScalarType,
} from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import { decodeMessage, format } from "./json.js";
import { Timestamp } from "./wkt/timestamp.js";
import type { Any } from "./wkt/any.js";
import type { Struct } from "./wkt/struct.js";
import { Duration } from "./wkt/duration.js";
import { FieldMask } from "./wkt/field_mask.js";
import { KnitError } from "./error.js";

describe("format", () => {
  const testCases = [
    // Primitives
    {
      name: "string",
      i: "something",
      o: "something",
    },
    {
      name: "bytes",
      i: new TextEncoder().encode("something"),
      o: "c29tZXRoaW5n",
    },
    {
      name: "bigint",
      i: BigInt("99999999999999999999999999"),
      o: "99999999999999999999999999",
    },
    {
      name: "number-regular",
      i: 123.321,
      o: 123.321,
    },
    {
      name: "number-nan",
      i: Number.NaN,
      o: "NaN",
    },
    {
      name: "number-positive-infinity",
      i: Number.POSITIVE_INFINITY,
      o: "Infinity",
    },
    {
      name: "number-negative-infinity",
      i: Number.NEGATIVE_INFINITY,
      o: "-Infinity",
    },
    {
      name: "boolean-true",
      i: true,
      o: true,
    },
    {
      name: "boolean-false",
      i: false,
      o: false,
    },
    {
      name: "undefined",
      i: undefined,
      o: null,
    },
    {
      name: "null",
      i: null,
      o: null,
    },
    {
      name: "oneof",
      i: { oneof: { "@case": "a", value: "some" } },
      o: { a: "some" },
    },
    // WKT wrappers are treated as primitives
    {
      name: "timestamp",
      i: Timestamp.fromDate(new Date("2023-02-01T00:00:00.000Z")),
      o: "2023-02-01T00:00:00Z",
    },
    {
      name: "duration",
      i: new Duration({ seconds: BigInt(1), nanos: 200000000 }),
      o: "1.200s",
    },
    {
      name: "field-mask",
      i: new FieldMask({ paths: ["foo", "foo_bar"] }),
      o: "foo,fooBar",
    },
    {
      name: "any",
      i: {
        "@type": "buf.build/protobuf/wkt/StringWrapper",
        value: "some",
      } satisfies Any,
      o: { "@type": "buf.build/protobuf/wkt/StringWrapper", value: "some" },
    },
    {
      name: "empty",
      i: {},
      o: {},
    },
    // TODO: Add tests for other WKTs once they have special types
  ];
  const check = (i: unknown, o: unknown) => {
    const formattedValue = format(i);
    expect(JSON.parse(JSON.stringify(formattedValue))).toStrictEqual(o);
    expect(Value.fromJson(formattedValue).toJson()).toStrictEqual(o);
  };
  for (const testCase of testCases) {
    test(testCase.name, () => {
      check(testCase.i, testCase.o);
    });
  }
  describe("repeated", () => {
    for (const testCase of testCases) {
      test(testCase.name, () => {
        check([testCase.i, testCase.i], [testCase.o, testCase.o]);
      });
    }
  });
  describe("messages", () => {
    const i: Record<string, any> = {};
    const o: Record<string, any> = {};
    for (const testCase of testCases) {
      i[testCase.name] = testCase.i;
      o[testCase.name] = testCase.o;
      i["aliased-" + testCase.name] = alias("og-" + testCase.name, testCase.i);
      o["og-" + testCase.name] = testCase.o;
    }
    check(i, o);
  });
  describe("function or symbol", () => {
    test("throws on function", () => {
      expect(() => format(() => null)).toThrow();
    });
    test("throws on symbol", () => {
      expect(() => format(Symbol("some"))).toThrow();
    });
  });
});

describe("decode", () => {
  describe("wkt", () => {
    const testCases: Array<{
      name: string;
      i: JsonValue;
      s: Schema;
      o: unknown;
    }> = [
        {
          name: "Empty",
          i: {},
          s: new Schema({ name: "google.protobuf.Empty" }),
          o: {},
        },
        {
          name: "Timestamp",
          i: "2023-02-01T00:00:00.000Z",
          s: new Schema({ name: "google.protobuf.Timestamp" }),
          o: Timestamp.fromDate(new Date("2023-02-01T00:00:00.000Z")),
        },
        {
          name: "Duration",
          i: "1.2s",
          s: new Schema({ name: "google.protobuf.Duration" }),
          o: new Duration({ seconds: BigInt(1), nanos: 200000000 }),
        },
        {
          name: "FieldMask",
          i: "foo,fooBar",
          s: new Schema({ name: "google.protobuf.FieldMask" }),
          o: new FieldMask({ paths: ["foo", "foo_bar"] }),
        },
        {
          name: "Value",
          i: { some: "string" },
          s: new Schema({ name: "google.protobuf.Value" }),
          o: { some: "string" },
        },
        {
          name: "ListValue",
          i: [""],
          s: new Schema({ name: "google.protobuf.ListValue" }),
          o: [""],
        },
        {
          name: "Struct",
          i: {} satisfies Struct,
          s: new Schema({ name: "google.protobuf.Struct" }),
          o: {},
        },
        {
          name: "Any",
          i: { "@type": "buf.build/acme/foo" } satisfies Any,
          s: new Schema({ name: "google.protobuf.Any" }),
          o: { "@type": "buf.build/acme/foo" },
        },
        {
          name: "BoolValue",
          i: true,
          s: new Schema({ name: "google.protobuf.BoolValue" }),
          o: true,
        },
        {
          name: "StringValue",
          i: "string",
          s: new Schema({ name: "google.protobuf.StringValue" }),
          o: "string",
        },
        {
          name: "BytesValue",
          i: "c29tZXRoaW5n",
          s: new Schema({ name: "google.protobuf.BytesValue" }),
          o: new TextEncoder().encode("something"),
        },
        {
          name: "DoubleValue",
          i: 1.23,
          s: new Schema({ name: "google.protobuf.DoubleValue" }),
          o: 1.23,
        },
        {
          name: "DoubleValue-string",
          i: "1.23",
          s: new Schema({ name: "google.protobuf.DoubleValue" }),
          o: 1.23,
        },
        {
          name: "DoubleValue-NaN",
          i: "NaN",
          s: new Schema({ name: "google.protobuf.DoubleValue" }),
          o: Number.NaN,
        },
        {
          name: "DoubleValue-positive-Infinity",
          i: "Infinity",
          s: new Schema({ name: "google.protobuf.DoubleValue" }),
          o: Number.POSITIVE_INFINITY,
        },
        {
          name: "DoubleValue-negative-Infinity",
          i: "-Infinity",
          s: new Schema({ name: "google.protobuf.DoubleValue" }),
          o: Number.NEGATIVE_INFINITY,
        },
        {
          name: "FloatValue",
          i: 1.23,
          s: new Schema({ name: "google.protobuf.FloatValue" }),
          o: 1.23,
        },
        {
          name: "FloatValue-string",
          i: "1.23",
          s: new Schema({ name: "google.protobuf.FloatValue" }),
          o: 1.23,
        },
        {
          name: "FloatValue-NaN",
          i: "NaN",
          s: new Schema({ name: "google.protobuf.FloatValue" }),
          o: Number.NaN,
        },
        {
          name: "FloatValue-positive-Infinity",
          i: "Infinity",
          s: new Schema({ name: "google.protobuf.DoubleValue" }),
          o: Number.POSITIVE_INFINITY,
        },
        {
          name: "FloatValue-negative-Infinity",
          i: "-Infinity",
          s: new Schema({ name: "google.protobuf.DoubleValue" }),
          o: Number.NEGATIVE_INFINITY,
        },
        {
          name: "Int32Value",
          i: 123,
          s: new Schema({ name: "google.protobuf.Int32Value" }),
          o: 123,
        },
        {
          name: "Int32Value-string",
          i: "123",
          s: new Schema({ name: "google.protobuf.Int32Value" }),
          o: 123,
        },
        {
          name: "UInt32Value",
          i: 123,
          s: new Schema({ name: "google.protobuf.UInt32Value" }),
          o: 123,
        },
        {
          name: "UInt32Value-string",
          i: "123",
          s: new Schema({ name: "google.protobuf.UInt32Value" }),
          o: 123,
        },
        {
          name: "Int64Value",
          i: "123",
          s: new Schema({ name: "google.protobuf.Int64Value" }),
          o: BigInt(123),
        },

        {
          name: "UInt64Value",
          i: "123",
          s: new Schema({ name: "google.protobuf.UInt64Value" }),
          o: BigInt(123),
        },
      ];
    for (const testCase of testCases) {
      test(testCase.name, () => {
        const result = decodeMessage({}, testCase.i, testCase.s, "");
        expect(result).toStrictEqual(testCase.o);
      });
      test(testCase.name + "-null", () => {
        const result = decodeMessage({}, null, testCase.s, "");
        expect(result).toStrictEqual(undefined);
      });
      test(testCase.name + "-undefined", () => {
        const result = decodeMessage({}, undefined, testCase.s, "");
        expect(result).toStrictEqual(undefined);
      });
      test(testCase.name + "-repeated", () => {
        const result = decodeMessage(
          {},
          { key: [testCase.i] },
          new Schema({
            fields: [
              {
                name: "key",
                type: {
                  value: {
                    case: "repeated",
                    value: {
                      element: {
                        case: "message",
                        value: testCase.s,
                      },
                    },
                  },
                },
              },
            ],
          }),
          "",
        );
        expect(result).toStrictEqual({ key: [testCase.o] });
      });
      test(testCase.name + "-map", () => {
        const result = decodeMessage(
          {},
          { key: { mapKey: testCase.i } },
          new Schema({
            fields: [
              {
                name: "key",
                type: {
                  value: {
                    case: "map",
                    value: {
                      value: {
                        case: "message",
                        value: testCase.s,
                      },
                    },
                  },
                },
              },
            ],
          }),
          "",
        );
        expect(result).toStrictEqual({ key: { mapKey: testCase.o } });
      });
      test(testCase.name + "-message", () => {
        const result = decodeMessage(
          {},
          { key: { key: testCase.i, customKey: testCase.i } },
          new Schema({
            fields: [
              {
                name: "key",
                type: {
                  value: {
                    case: "message",
                    value: {
                      fields: [
                        {
                          name: "key",
                          type: {
                            value: {
                              case: "message",
                              value: testCase.s,
                            },
                          },
                        },
                        {
                          name: "customJson",
                          jsonName: "customKey",
                          type: {
                            value: {
                              case: "message",
                              value: testCase.s,
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          }),
          "",
        );
        expect(result).toStrictEqual({
          key: { key: testCase.o, customJson: testCase.o },
        });
      });
      test(testCase.name + "-message-oneof", () => {
        const result = decodeMessage(
          { ".key.key": "oneofKey" },
          { key: { key: testCase.i } },
          new Schema({
            fields: [
              {
                name: "key",
                type: {
                  value: {
                    case: "message",
                    value: {
                      fields: [
                        {
                          name: "key",
                          type: {
                            value: {
                              case: "message",
                              value: testCase.s,
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          }),
          "",
        );
        expect(result).toStrictEqual({
          key: { oneofKey: { "@case": "key", value: testCase.o } },
        });
      });
    }
  });
  describe("primitives", () => {
    const testCases: Array<{
      name: string;
      i: JsonValue;
      s: Schema_Field_Type_ScalarType;
      o: unknown;
    }> = [
        {
          name: "NullValue",
          i: null,
          s: Schema_Field_Type_ScalarType.NULL,
          o: null,
        },
        {
          name: "enum",
          i: "ENUM_VALUE",
          s: Schema_Field_Type_ScalarType.ENUM,
          o: "ENUM_VALUE",
        },
        {
          name: "enum-open",
          i: 13,
          s: Schema_Field_Type_ScalarType.ENUM,
          o: 13,
        },
        {
          name: "boolean",
          i: true,
          s: Schema_Field_Type_ScalarType.BOOL,
          o: true,
        },
        {
          name: "string",
          i: "string",
          s: Schema_Field_Type_ScalarType.STRING,
          o: "string",
        },
        {
          name: "bytes",
          i: "c29tZXRoaW5n",
          s: Schema_Field_Type_ScalarType.BYTES,
          o: new TextEncoder().encode("something"),
        },
        {
          name: "DoubleValue",
          i: 1.23,
          s: Schema_Field_Type_ScalarType.DOUBLE,
          o: 1.23,
        },
        {
          name: "DoubleValue-string",
          i: "1.23",
          s: Schema_Field_Type_ScalarType.DOUBLE,
          o: 1.23,
        },
        {
          name: "DoubleValue-NaN",
          i: "NaN",
          s: Schema_Field_Type_ScalarType.DOUBLE,
          o: Number.NaN,
        },
        {
          name: "DoubleValue-positive-Infinity",
          i: "Infinity",
          s: Schema_Field_Type_ScalarType.DOUBLE,
          o: Number.POSITIVE_INFINITY,
        },
        {
          name: "DoubleValue-negative-Infinity",
          i: "-Infinity",
          s: Schema_Field_Type_ScalarType.DOUBLE,
          o: Number.NEGATIVE_INFINITY,
        },
        {
          name: "FloatValue",
          i: 1.23,
          s: Schema_Field_Type_ScalarType.FLOAT,
          o: 1.23,
        },
        {
          name: "FloatValue-string",
          i: "1.23",
          s: Schema_Field_Type_ScalarType.FLOAT,
          o: 1.23,
        },
        {
          name: "FloatValue-NaN",
          i: "NaN",
          s: Schema_Field_Type_ScalarType.FLOAT,
          o: Number.NaN,
        },
        {
          name: "FloatValue-positive-Infinity",
          i: "Infinity",
          s: Schema_Field_Type_ScalarType.FLOAT,
          o: Number.POSITIVE_INFINITY,
        },
        {
          name: "FloatValue-negative-Infinity",
          i: "-Infinity",
          s: Schema_Field_Type_ScalarType.FLOAT,
          o: Number.NEGATIVE_INFINITY,
        },
        {
          name: "Int32Value",
          i: 123,
          s: Schema_Field_Type_ScalarType.INT32,
          o: 123,
        },
        {
          name: "Int32Value-string",
          i: "123",
          s: Schema_Field_Type_ScalarType.INT32,
          o: 123,
        },
        {
          name: "UInt32Value",
          i: 123,
          s: Schema_Field_Type_ScalarType.UINT32,
          o: 123,
        },
        {
          name: "UInt32Value-string",
          i: "123",
          s: Schema_Field_Type_ScalarType.UINT32,
          o: 123,
        },
        {
          name: "Int64Value",
          i: "123",
          s: Schema_Field_Type_ScalarType.INT64,
          o: BigInt(123),
        },

        {
          name: "UInt64Value",
          i: "123",
          s: Schema_Field_Type_ScalarType.UINT64,
          o: BigInt(123),
        },
      ];
    for (const testCase of testCases) {
      const i = { key: testCase.i };
      const o = { key: testCase.o };
      const s = new Schema({
        fields: [
          {
            name: "key",
            type: {
              value: {
                case: "scalar",
                value: testCase.s,
              },
            },
          },
        ],
      });
      test(testCase.name, () => {
        const result = decodeMessage({}, i, s, "");
        expect(result).toStrictEqual(o);
      });
      if (testCase.s !== Schema_Field_Type_ScalarType.NULL) {
        test(testCase.name + "-null", () => {
          const result = decodeMessage({}, { key: null }, s, "");
          expect(result).toStrictEqual({});
        });
      }
      test(testCase.name + "-undefined", () => {
        const result = decodeMessage({}, {}, s, "");
        expect(result).toStrictEqual({});
      });
      test(testCase.name + "-repeated", () => {
        const result = decodeMessage(
          {},
          { key: [testCase.i] },
          new Schema({
            fields: [
              {
                name: "key",
                type: {
                  value: {
                    case: "repeated",
                    value: {
                      element: {
                        case: "scalar",
                        value: testCase.s,
                      },
                    },
                  },
                },
              },
            ],
          }),
          "",
        );
        expect(result).toStrictEqual({ key: [testCase.o] });
      });
      test(testCase.name + "-map", () => {
        const result = decodeMessage(
          {},
          { key: { mapKey: testCase.i } },
          new Schema({
            fields: [
              {
                name: "key",
                type: {
                  value: {
                    case: "map",
                    value: {
                      value: {
                        case: "scalar",
                        value: testCase.s,
                      },
                    },
                  },
                },
              },
            ],
          }),
          "",
        );
        expect(result).toStrictEqual({ key: { mapKey: testCase.o } });
      });
      test(testCase.name + "-message", () => {
        const result = decodeMessage(
          {},
          { key: { key: testCase.i, customKey: testCase.i } },
          new Schema({
            fields: [
              {
                name: "key",
                type: {
                  value: {
                    case: "message",
                    value: {
                      fields: [
                        {
                          name: "key",
                          type: {
                            value: {
                              case: "scalar",
                              value: testCase.s,
                            },
                          },
                        },
                        {
                          name: "customJson",
                          jsonName: "customKey",
                          type: {
                            value: {
                              case: "scalar",
                              value: testCase.s,
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          }),
          "",
        );
        expect(result).toStrictEqual({
          key: { key: testCase.o, customJson: testCase.o },
        });
      });
      test(testCase.name + "-message-oneof", () => {
        const result = decodeMessage(
          { ".key.key": "oneofKey" },
          { key: { key: testCase.i } },
          new Schema({
            fields: [
              {
                name: "key",
                type: {
                  value: {
                    case: "message",
                    value: {
                      fields: [
                        {
                          name: "key",
                          type: {
                            value: {
                              case: "scalar",
                              value: testCase.s,
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          }),
          "",
        );
        expect(result).toStrictEqual({
          key: { oneofKey: { "@case": "key", value: testCase.o } },
        });
      });
    }
  });
  test("[@error]", () => {
    const result = decodeMessage(
      {},
      {
        "[@error]": {},
        code: "INVALID_ARGUMENT",
        message: "invalid",
        details: [
          {
            type: "google.protobuf.BoolValue",
            debug: true,
            value: protoBase64.enc(new BoolValue({ value: true }).toBinary()),
          },
        ],
        path: "some.path",
      },
      new Schema({
        name: "google.protobuf.BoolValue",
      }),
      "",
    );
    expect(result).toBeInstanceOf(KnitError);
    expect(result).toHaveProperty("code", Error_Code.INVALID_ARGUMENT);
    expect(result).toHaveProperty("message", "invalid");
    expect(result).toHaveProperty("details", [
      {
        type: "google.protobuf.BoolValue",
        value: new BoolValue({ value: true }).toBinary(),
        debug: true,
      },
    ]);
    expect(result).toHaveProperty("path", "some.path");
  });

  test("repeated oneof", () => {
    const result = decodeMessage(
      {
        ".key1.key2.opt1": "item",
        ".key1.key2.opt2": "item",
      },
      {
        key1: [
          {
            key2: {
              opt1: {
                value: 1,
              },
            },
          },
        ],
      },
      new Schema({
        name: "some-name",
        fields: [
          {
            jsonName: "",
            name: "key1",
            type: {
              value: {
                case: "repeated",
                value: {
                  element: {
                    case: "message",
                    value: {
                      name: "somenested",
                      fields: [
                        {
                          jsonName: "",
                          name: "key2",
                          type: {
                            value: {
                              case: "message",
                              value: {
                                name: "somenested2",
                                fields: [
                                  {
                                    jsonName: "",
                                    name: "opt1",
                                    type: {
                                      value: {
                                        case: "message",
                                        value: {
                                          name: "somenested3",
                                          fields: [
                                            {
                                              jsonName: "",
                                              name: "value",
                                              type: {
                                                value: {
                                                  case: "scalar",
                                                  value:
                                                    Schema_Field_Type_ScalarType.INT32,
                                                },
                                              },
                                            },
                                          ],
                                        },
                                      },
                                    },
                                  },
                                  {
                                    jsonName: "",
                                    name: "opt2",
                                    type: {
                                      value: {
                                        case: "message",
                                        value: {
                                          name: "somenested4",
                                          fields: [
                                            {
                                              jsonName: "",
                                              name: "value",
                                              type: {
                                                value: {
                                                  case: "scalar",
                                                  value:
                                                    Schema_Field_Type_ScalarType.STRING,
                                                },
                                              },
                                            },
                                          ],
                                        },
                                      },
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        ],
      }),
      "",
    ) as any;

    expect(result.key1[0].key2.item["@case"]).toBe("opt1");
    expect(result.key1[0].key2.item.value).toStrictEqual({ value: 1 });
  });

  test("mapped oneof", () => {
    const result = decodeMessage(
      {
        ".key1.key2.opt1": "item",
        ".key1.key2.opt2": "item",
      },
      {
        key1: {
          someId: {
            key2: {
              opt1: {
                value: 1,
              },
            },
          },
        },
      },
      new Schema({
        name: "some-name",
        fields: [
          {
            jsonName: "",
            name: "key1",
            type: {
              value: {
                case: "map",
                value: {
                  key: Schema_Field_Type_ScalarType.STRING,
                  value: {
                    case: "message",
                    value: {
                      name: "somenested",
                      fields: [
                        {
                          jsonName: "",
                          name: "key2",
                          type: {
                            value: {
                              case: "message",
                              value: {
                                name: "somenested2",
                                fields: [
                                  {
                                    jsonName: "",
                                    name: "opt1",
                                    type: {
                                      value: {
                                        case: "message",
                                        value: {
                                          name: "somenested3",
                                          fields: [
                                            {
                                              jsonName: "",
                                              name: "value",
                                              type: {
                                                value: {
                                                  case: "scalar",
                                                  value:
                                                    Schema_Field_Type_ScalarType.INT32,
                                                },
                                              },
                                            },
                                          ],
                                        },
                                      },
                                    },
                                  },
                                  {
                                    jsonName: "",
                                    name: "opt2",
                                    type: {
                                      value: {
                                        case: "message",
                                        value: {
                                          name: "somenested4",
                                          fields: [
                                            {
                                              jsonName: "",
                                              name: "value",
                                              type: {
                                                value: {
                                                  case: "scalar",
                                                  value:
                                                    Schema_Field_Type_ScalarType.STRING,
                                                },
                                              },
                                            },
                                          ],
                                        },
                                      },
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        ],
      }),
      "",
    ) as any;

    expect(result.key1["someId"].key2.item["@case"]).toBe("opt1");
    expect(result.key1["someId"].key2.item.value).toStrictEqual({
      value: 1,
    });
  });
});
