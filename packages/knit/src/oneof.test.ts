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

import { describe, test, expect } from "@jest/globals";
import { makeOneof, type Oneof, oneof } from "./oneof.js";

type Cases = { a: string; b: number };

describe("makeOneof", () => {
  test("accepts one", () => {
    const p = makeOneof<Cases>({ a: "knit" });
    expect(p).toHaveProperty("case", "a");
    expect(p).toHaveProperty("value", "knit");
    const q = makeOneof<Cases>({ b: 1 });
    expect(q).toHaveProperty("case", "b");
    expect(q).toHaveProperty("value", 1);
  });
  test("throws if not one", () => {
    expect(() => makeOneof<Cases>({} as any)).toThrowError();
  });
});

describe("oneof", () => {
  type OneofQuery = {
    a: {};
    b: {};
  };
  test("accepts one", () => {
    const query = oneof<OneofQuery>({
      a: {},
    });
    expect(query).toHaveProperty("a", {});
  });
  test("accepts multiple", () => {
    const query = oneof<OneofQuery>({
      a: {},
      b: {},
    });
    expect(query).toHaveProperty("a", {});
    expect(query).toHaveProperty("b", {});
  });
});

describe("OneofQuery", () => {
  test("fails on empty object", () => {
    //@ts-expect-error
    const _ = {} satisfies OneofQuery<Cases>;
  });
  test("fails if not made from `oneof`", () => {
    //@ts-expect-error
    const _ = { a: "string" } satisfies OneofQuery<Cases>;
  });
});

describe("Oneof", () => {
  test("fails on empty object", () => {
    //@ts-expect-error
    const _ = {} satisfies Oneof<Cases>;
  });
  test("fails if not made from `makeOneof`", () => {
    // @ts-expect-error
    const _ = { a: "string" } satisfies Oneof<Cases>;
  });
});
