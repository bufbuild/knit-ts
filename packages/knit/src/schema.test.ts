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

import type { Message } from "@bufbuild/knit-test-spec/spec/messages_knit.js";
import type {
  Wkt,
  WktService,
} from "@bufbuild/knit-test-spec/spec/wkt_knit.js";
import type { Map, MapEnum } from "@bufbuild/knit-test-spec/spec/map_knit.js";
import { describe, test } from "@jest/globals";
import { type DeepDiff, expectType } from "./jest/util.js";
import { oneof, type Oneof } from "./oneof";
import type { Mask, Parameter, Query } from "./schema.js";
import type { Equal } from "./utils/types.js";
import type { PartialMessage } from "@bufbuild/protobuf";
import type { Message as ProtoMessage } from "@bufbuild/knit-test-spec/spec/messages_pb.js";
import { alias } from "./alias";
import type { CustomJsonName } from "@bufbuild/knit-test-spec/spec/json_knit.js";
import type {
  EnumShell,
  EnumShell_InsideMessage,
  TopLevel,
} from "@bufbuild/knit-test-spec/spec/enum_knit.js";
import type {
  OneofEnum,
  Oneof as OneofFullMessage,
} from "@bufbuild/knit-test-spec/spec/oneof_knit.js";
import type {
  All,
  AllService,
} from "@bufbuild/knit-test-spec/spec/all_knit.js";
import type { Client } from "./client.js";
import type * as _ from "@bufbuild/knit-test-spec/spec/relations_knit.js";
import { Timestamp } from "./wkt/timestamp.js";
import { Duration } from "./wkt/duration.js";
import type { Empty } from "./wkt/empty.js";
import type { Value, Struct } from "./wkt/struct.js";
import type { Any } from "./wkt/any.js";
import { FieldMask } from "./wkt/field_mask.js";
import type { KnitError } from "./error.js";
import type { ScalarFields } from "@bufbuild/knit-test-spec/spec/scalars_knit.js";

describe("wkt", () => {
  const [
    any,
    boolValue,
    bytesValue,
    doubleValue,
    duration,
    empty,
    fieldMask,
    floatValue,
    int32Value,
    int64Value,
    listValue,
    nullValue,
    stringValue,
    struct,
    timestamp,
    uint32Value,
    uint64Value,
    value,
  ] = Array<Record<never, never>>(19).fill({});

  const wktFragment = {
    any,
    boolValue,
    bytesValue,
    doubleValue,
    duration,
    empty,
    fieldMask,
    floatValue,
    int32Value,
    int64Value,
    listValue,
    nullValue,
    stringValue,
    struct,
    timestamp,
    uint32Value,
    uint64Value,
    value,
  } as const satisfies Query<Wkt["fields"]>;

  describe("schema", () => {
    test("fetch", () => {
      const query = {
        getAny: {
          $: { "@type": "type.googleapis.com/any", value: true },
        },
        getBoolValue: { $: true },
        getBytesValue: { $: new Uint8Array() },
        getDoubleValue: { $: 1.2 },
        getDuration: { $: new Duration({ seconds: BigInt("12") }) },
        getEmpty: { $: {} },
        getFieldMask: { $: new FieldMask({ paths: [] }) },
        getFloatValue: { $: 123.12 },
        getInt32Value: { $: 12 },
        getInt64Value: { $: BigInt("12") },
        getListValue: { $: [] },
        getStringValue: { $: "" },
        getStruct: { $: {} },
        getTimestamp: { $: Timestamp.fromDate(new Date()) },
        getUint32Value: { $: 123 },
        getUint64Value: { $: BigInt("123") },
        getValue: { $: {} },
      } satisfies Query<WktService["spec.WktService"]["do"]>;
      type Actual = Mask<typeof query, WktService["spec.WktService"]["do"]>;
      type Expected = {
        getAny: Any;
        getBoolValue: boolean;
        getBytesValue: Uint8Array;
        getDoubleValue: number;
        getDuration: Duration;
        getEmpty: Empty;
        getFieldMask: FieldMask;
        getFloatValue: number;
        getInt32Value: number;
        getInt64Value: bigint;
        getListValue: Value[];
        getStringValue: string;
        getStruct: Struct;
        getTimestamp: Timestamp;
        getUint32Value: number;
        getUint64Value: bigint;
        getValue: Value;
      };
      type Diff = DeepDiff<Actual, Expected>;
      expectType<Equal<Diff, never>>(true);
    });

    test("fields", () => {
      const query = {
        fields: {
          ...wktFragment,
        },
      } as const satisfies Query<Wkt>;
      type Actual = Mask<typeof query, Wkt>;
      type Expected = {
        fields?: {
          any?: Any;
          boolValue?: boolean;
          bytesValue?: Uint8Array;
          doubleValue?: number;
          duration?: Duration;
          empty?: Empty;
          fieldMask?: FieldMask;
          floatValue?: number;
          int32Value?: number;
          int64Value?: bigint;
          listValue?: Value[];
          nullValue: null;
          stringValue?: string;
          struct?: Struct;
          timestamp?: Timestamp;
          uint32Value?: number;
          uint64Value?: bigint;
          value?: Value;
        };
      };
      type Diff = DeepDiff<Actual, Expected>;
      expectType<Equal<Diff, never>>(true);
    });
    test("map", () => {
      const query = {
        maps: {
          ...wktFragment,
        },
      } as const satisfies Query<Wkt>;
      type Actual = Mask<typeof query, Wkt>;
      type Expected = {
        maps?: {
          any: Record<string, Any>;
          boolValue: Record<string, boolean>;
          bytesValue: Record<string, Uint8Array>;
          doubleValue: Record<string, number>;
          duration: Record<string, Duration>;
          empty: Record<string, Empty>;
          fieldMask: Record<string, FieldMask>;
          floatValue: Record<string, number>;
          int32Value: Record<string, number>;
          int64Value: Record<string, bigint>;
          listValue: Record<string, Value[]>;
          nullValue: Record<string, null>;
          stringValue: Record<string, string>;
          struct: Record<string, Struct>;
          timestamp: Record<string, Timestamp>;
          uint32Value: Record<string, number>;
          uint64Value: Record<string, bigint>;
          value: Record<string, Value>;
        };
      };
      type Diff = DeepDiff<Actual, Expected>;
      expectType<Equal<Diff, never>>(true);
    });
    test("repeated", () => {
      const query = {
        repeated: {
          ...wktFragment,
        },
      } as const satisfies Query<Wkt>;
      type Actual = Mask<typeof query, Wkt>;
      type Expected = {
        repeated?: {
          any: Any[];
          boolValue: boolean[];
          bytesValue: Uint8Array[];
          doubleValue: number[];
          duration: Duration[];
          empty: Empty[];
          fieldMask: FieldMask[];
          floatValue: number[];
          int32Value: number[];
          int64Value: bigint[];
          listValue: Value[][];
          nullValue: null[];
          stringValue: string[];
          struct: Struct[];
          timestamp: Timestamp[];
          uint32Value: number[];
          uint64Value: bigint[];
          value: Value[];
        };
      };
      type Diff = DeepDiff<Actual, Expected>;
      expectType<Equal<Diff, never>>(true);
    });
    test("oneof", () => {
      const query = {
        oneofs: {
          oneofValue: oneof({
            ...wktFragment,
          }),
        },
      } as const satisfies Query<Wkt>;
      type Actual = Mask<typeof query, Wkt>;
      type Expected = {
        oneofs?: {
          oneofValue?: Oneof<{
            any: Any;
            boolValue: boolean;
            bytesValue: Uint8Array;
            doubleValue: number;
            duration: Duration;
            empty: Empty;
            fieldMask: FieldMask;
            floatValue: number;
            int32Value: number;
            int64Value: bigint;
            listValue: Value[];
            nullValue: null;
            stringValue: string;
            struct: Struct;
            timestamp: Timestamp;
            uint32Value: number;
            uint64Value: bigint;
            value: Value;
          }>;
        };
      };
      type Diff = DeepDiff<Actual, Expected>;
      expectType<Equal<Diff, never>>(true);
    });

    test("oneof with nested object", () => {
      interface Schema {
        oneofs?: OneofFullMessage;
      }
      const query = {
        oneofs: {
          oneofValue: oneof({
            message: {
              id: {},
            },
            nestedMessage: {
              nested: {
                id: {},
              },
            },
          }),
        },
      } as const satisfies Query<Schema>;
      type Actual = Mask<typeof query, Schema>;
      type Expected = {
        oneofs?: {
          oneofValue?: Oneof<{
            message: {
              id: string;
            };
            nestedMessage: {
              nested?: {
                id: string;
              };
            };
          }>;
        };
      };
      type Diff = DeepDiff<Actual, Expected>;
      expectType<Equal<Diff, never>>(true);
    });
  });

  describe("params", () => {
    test("scalar types", () => {
      // @ts-ignore
      const _ = {
        any: {
          "@type": "type.googleapis.com/google.protobuf.BoolValue",
          value: true,
        },
        boolValue: true,
        bytesValue: new Uint8Array(),
        doubleValue: 1.2,
        duration: new Duration({ nanos: 1 }),
        empty: {},
        fieldMask: new FieldMask({ paths: ["foo", "fooBar"] }),
        floatValue: 12.2,
        int32Value: 12,
        int64Value: BigInt("123"),
        listValue: [],
        nullValue: null,
        stringValue: "",
        struct: {
          asd: {},
        },
        timestamp: new Timestamp(),
        uint32Value: 123,
        uint64Value: BigInt("123"),
        value: {},
      } satisfies Parameter<Wkt["fields"]>;
    });
    test("map types", () => {
      // @ts-ignore
      const _ = {
        any: {
          key: {
            "@type": "type.googleapis.com/google.protobuf.BoolValue",
            value: true,
          },
        },
        boolValue: { key: true },
        bytesValue: { key: new Uint8Array() },
        doubleValue: { key: 1.23 },
        duration: { key: new Duration() },
        empty: { key: {} },
        fieldMask: { key: new FieldMask() },
        floatValue: { key: 12.2 },
        int32Value: { key: 12 },
        int64Value: { key: BigInt("123") },
        listValue: { key: [] },
        nullValue: { key: null },
        stringValue: { key: "" },
        struct: {
          key: {
            asd: {},
          },
        },
        timestamp: { key: new Timestamp() },
        uint32Value: { key: 123 },
        uint64Value: { key: BigInt("123") },
        value: { key: {} },
      } satisfies Parameter<Wkt["maps"]>;
    });
    test("repeated types", () => {
      // @ts-ignore
      const _ = {
        any: [
          {
            "@type": "type.googleapis.com/google.protobuf.BoolValue",
            value: true,
          },
        ],
        boolValue: [true],
        bytesValue: [new Uint8Array()],
        doubleValue: [1.23],
        duration: [new Duration()],
        empty: [{}],
        fieldMask: [new FieldMask()],
        floatValue: [12.2],
        int32Value: [12],
        int64Value: [BigInt("123")],
        listValue: [[]],
        nullValue: [null],
        stringValue: [""],
        struct: [
          {
            asd: {},
          },
        ],
        timestamp: [new Timestamp()],
        uint32Value: [123],
        uint64Value: [BigInt("123")],
        value: [{}],
      } satisfies Parameter<Wkt["repeated"]>;
    });
  });
});

describe("scalars", () => {
  test("query", () => {
    const query = {
      str: {},
      bl: {},
      i32: {},
      i64: {},
      u32: {},
      u64: {},
      s32: {},
      s64: {},
      f32: {},
      f64: {},
      sf32: {},
      sf64: {},
      by: {},
      db: {},
      fl: {},
    } satisfies Query<ScalarFields>;
    type Actual = Mask<typeof query, ScalarFields>;
    type Expected = {
      str: string;
      bl: boolean;
      i32: number;
      i64: bigint;
      u32: number;
      u64: bigint;
      s32: number;
      s64: bigint;
      f32: number;
      f64: bigint;
      sf32: number;
      sf64: bigint;
      by: Uint8Array;
      db: number;
      fl: number;
    };
    type Diff = DeepDiff<Actual, Expected>;
    expectType<Equal<Diff, never>>(true);
  });
  test("params", () => {
    type Actual = Parameter<ScalarFields>;
    type Expected = {
      str?: string;
      bl?: boolean;
      i32?: number;
      i64?: bigint;
      u32?: number;
      u64?: bigint;
      s32?: number;
      s64?: bigint;
      f32?: number;
      f64?: bigint;
      sf32?: number;
      sf64?: bigint;
      by?: Uint8Array;
      db?: number;
      fl?: number;
    };
    type Diff = DeepDiff<Actual, Expected>;
    expectType<Equal<Diff, never>>(true);
  });
});

describe("messages", () => {
  test("query", () => {
    const query = {
      id: {},
      inner: {
        mess: {},
      },
      self: {
        withinInner: {
          fl: {},
        },
        selfs: {
          selfMap: {},
        },
      },
    } satisfies Query<Message>;
    type Actual = Mask<typeof query, Message>;
    type Expected = {
      id: string;
      inner?: {
        mess?: {};
      };
      self?: {
        withinInner?: {
          fl: number;
        };
        selfs: {
          selfMap: {
            [k: string]: {};
          };
        }[];
      };
    };
    type Diff = DeepDiff<Actual, Expected>;
    expectType<Equal<Diff, never>>(true);
    expectType<Actual extends PartialMessage<ProtoMessage> ? true : false>(
      true
    );
  });
  test("params ignore relations", () => {
    type Actual = Parameter<All>;
    type Expected = Parameter<Omit<All, "relSelf" | "relSelfParam">>;
    type Diff = DeepDiff<Actual, Expected>;
    expectType<Equal<Diff, never>>(true);
  });
});

describe("maps", () => {
  test("query", () => {
    const [str, bl, i32, i64, u32, u64, s32, s64, f32, f64, sf32, sf64] = Array(
      12
    ).fill({});
    const query = {
      keys: {
        str,
        bl,
        i32,
        i64,
        u32,
        u64,
        s32,
        s64,
        f32,
        f64,
        sf32,
        sf64,
      },
      message: {
        keys: {
          str,
        },
      },
      enum: {},
    } satisfies Query<Map>;
    type Actual = Mask<typeof query, Map>;
    type Expected = {
      keys?: {
        str: { [k: string]: string };
        bl: { [k: string]: string };
        i32: { [k: number]: string };
        i64: { [k: string]: string };
        u32: { [k: number]: string };
        u64: { [k: string]: string };
        s32: { [k: number]: string };
        s64: { [k: string]: string };
        f32: { [k: number]: string };
        f64: { [k: string]: string };
        sf32: { [k: number]: string };
        sf64: { [k: string]: string };
      };
      message: {
        [k: string]: {
          keys?: {
            str: { [k: string]: string };
          };
        };
      };
      enum: {
        [k: string]: MapEnum;
      };
    };
    type Diff = DeepDiff<Actual, Expected>;
    expectType<Equal<Diff, never>>(true);
  });

  test("param", () => {
    // @ts-ignore
    const _ = {
      enum: { key: "MAP_ENUM_FIRST" },
      keys: {
        bl: { key: "value" },
        str: { key: "value" },
        i32: { 123: "value" },
        f32: { 123: "value" },
        u32: { 123: "value" },
        s32: { 123: "value" },
        sf32: { 123: "value" },
        f64: { "123": "value" },
        i64: { "123": "value" },
        u64: { "123": "value" },
        s64: { "123": "value" },
        sf64: { "123": "value" },
      },
      message: {
        key: {
          enum: {
            key: "MAP_ENUM_FIRST",
          },
        },
      },
    } satisfies Parameter<Map>;
  });
});

describe("json_name", () => {
  test("query and result use field name", () => {
    const query = {
      name: {},
    } satisfies Query<CustomJsonName>;
    type Actual = Mask<typeof query, CustomJsonName>;
    type Expected = {
      name: string;
    };
    type Diff = DeepDiff<Actual, Expected>;
    expectType<Equal<Diff, never>>(true);
  });

  test("parameter requires alias json name", () => {
    // @ts-ignore
    let _ = {
      // @ts-expect-error
      name: "name",
    } satisfies Parameter<CustomJsonName> as any;
    _ = {
      name: alias("not_name", "name"),
    } satisfies Parameter<CustomJsonName>;
  });
});

describe("enum", () => {
  test("query", () => {
    const query = {
      optionalEnum: {},
    } satisfies Query<EnumShell>;
    type Actual = Mask<typeof query, EnumShell>;
    type Expected = {
      optionalEnum?: EnumShell_InsideMessage;
    };
    type Diff = DeepDiff<Actual, Expected>;
    expectType<Equal<Diff, never>>(true);
  });

  test("param", () => {
    type Actual = Parameter<EnumShell>;
    type Expected = {
      optionalEnum?: EnumShell_InsideMessage;
    };
    type Diff = DeepDiff<Actual, Expected>;
    expectType<Equal<Diff, never>>(true);
  });
});

describe("client", () => {
  type Schema = AllService & WktService;

  const client = {
    fetch(q: unknown) {
      return Promise.resolve();
    },
    do(q: unknown) {
      return Promise.resolve();
    },
    listen(q: unknown) {
      return Promise.resolve();
    },
  } as any as Client<Schema>;

  describe("fetch", () => {
    test("query methods with no side affects", async () => {
      const response = await client.fetch({
        "spec.AllService": {
          getAll: {
            $: {},
            enum: {},
            relSelfParam: {
              $: { id: "" },
            },
          },
        },
      });
      type Actual = typeof response;
      type Expected = {
        "spec.AllService": {
          getAll: {
            enum: TopLevel;
            relSelfParam?: {};
          };
        };
      };
      type Diff = DeepDiff<Actual, Expected>;
      expectType<Equal<Diff, never>>(true);
    });
    test("type error on non fetch methods", () => {
      client.fetch({
        "spec.AllService": {
          // @ts-expect-error
          createAll: {
            $: {},
          },
        },
      });
      client.fetch({
        "spec.AllService": {
          // @ts-expect-error
          streamAll: {
            $: {},
          },
        },
      });
    });

    test("query for oneof with nested object", async () => {
      const response = await client.fetch({
        "spec.AllService": {
          getAll: {
            $: {},
            oneof: {
              oneofValue: oneof({
                message: {
                  id: {}
                },
                nestedMessage: {
                  nested: {
                    id: {}
                  }
                }
              })
            }
          },
        },
      });
      type Actual = typeof response;
      type Expected = {
        "spec.AllService": {
          getAll: {
            oneof: {
              oneofValue?: Oneof<{
                message: {
                  id: string;
                };
                nestedMessage: {
                  nested?: {
                    id: string;
                  };
                };
              }>
            }
          };
        };
      };
      type Diff = DeepDiff<Actual, Expected>;
      expectType<Equal<Diff, never>>(true);
  });

  describe("do", () => {
    test("query methods with side effects", async () => {
      const response = await client.do({
        "spec.AllService": {
          createAll: {
            $: {},
            enum: {},
            oneof: {
              oneofValue: oneof({
                enum: {},
              }),
            },
          },
        },
        "spec.WktService": {
          getAny: {
            $: {
              "@type": "",
            },
          },
        },
      });
      type Actual = typeof response;
      type Expected = {
        "spec.AllService": {
          createAll:
            | {
                enum: TopLevel;
                oneof?: {
                  oneofValue?: Oneof<{ enum: OneofEnum }>;
                };
              }
            | KnitError;
        };
        "spec.WktService": {
          getAny: Any | KnitError;
        };
      };
      type Diff = DeepDiff<Actual, Expected>;
      expectType<Equal<Diff, never>>(true);
    });
    test("type error on non do methods", () => {
      client.do({
        "spec.AllService": {
          // @ts-expect-error
          streamAll: {
            $: {},
          },
        },
      });
    });
  });

  describe("listen", () => {
    test("query methods with server stream", async () => {
      const response = await client.listen({
        "spec.AllService": {
          streamAll: {
            $: {},
            enum: {},
            oneof: {
              oneofValue: oneof({
                enum: {},
              }),
            },
          },
        },
      });
      type Actual = typeof response;
      type Expected = AsyncIterable<{
        "spec.AllService": {
          streamAll: {
            enum: TopLevel;
            oneof?: {
              oneofValue?: Oneof<{ enum: OneofEnum }>;
            };
          };
        };
      }>;
      type Diff = DeepDiff<Actual, Expected>;
      expectType<Equal<Diff, never>>(true);
    });
    test("type error on non do methods", () => {
      client.listen({
        "spec.AllService": {
          // @ts-expect-error
          getAll: {
            $: {},
          },
        },
      });
    });
  });
});

describe("errors", () => {
  describe("defaults", () => {
    test("@catch", () => {
      const query = {
        relSelf: {
          scalars: {
            fields: {
              u32: {},
            },
          },
        },
      } satisfies Query<All>;
      type Actual = Mask<typeof query, All, { "@catch": {} }>;
      type Expected = {
        relSelf?:
          | {
              scalars?: { fields?: { u32: number } };
            }
          | KnitError;
      };
      type Diff = DeepDiff<Actual, Expected>;
      expectType<Equal<Diff, never>>(true);
    });
    test("@throw", () => {
      const query = {
        relSelf: {
          scalars: {
            fields: {
              u32: {},
            },
          },
        },
      } satisfies Query<All>;
      type Actual = Mask<typeof query, All>;
      type Expected = {
        relSelf?: {
          scalars?: { fields?: { u32: number } };
        };
      };
      type Diff = DeepDiff<Actual, Expected>;
      expectType<Equal<Diff, never>>(true);
    });
  });
  test("@catch", () => {
    const query = {
      relSelf: {
        "@catch": {},
        scalars: {
          fields: {
            u32: {},
          },
        },
      },
    } satisfies Query<All>;
    type Actual = Mask<typeof query, All>;
    type Expected = {
      relSelf?:
        | {
            scalars?: { fields?: { u32: number } };
          }
        | KnitError;
    };
    type Diff = DeepDiff<Actual, Expected>;
    expectType<Equal<Diff, never>>(true);
  });
  test("@throw", () => {
    const query = {
      relSelf: {
        "@throw": {},
        scalars: {
          fields: {
            u32: {},
          },
        },
      },
    } satisfies Query<All>;
    type Actual = Mask<typeof query, All, { "@catch": {} }>;
    type Expected = {
      relSelf?: {
        scalars?: { fields?: { u32: number } };
      };
    };
    type Diff = DeepDiff<Actual, Expected>;
    expectType<Equal<Diff, never>>(true);
  });
});
