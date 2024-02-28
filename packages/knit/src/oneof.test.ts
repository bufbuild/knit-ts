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

import { describe, test } from "@jest/globals";
import type { Oneof } from "./oneof.js";
type Cases = { a: string; b: number };

describe("Oneof", () => {
  const f = (_: Oneof<Cases>) => {};
  test("works for correct cases", () => {
    f({ "@case": "a", value: "str" });
    f({ "@case": "b", value: 123 });
  });
  test("fails on empty object", () => {
    //@ts-expect-error
    const _ = {} satisfies Oneof<Cases>;
  });
  test("fails if not made from `makeOneof`", () => {
    // @ts-expect-error
    const _ = { a: "string" } satisfies Oneof<Cases>;
  });
});
