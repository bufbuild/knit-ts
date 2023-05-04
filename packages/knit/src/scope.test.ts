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

import type { AllService } from "@bufbuild/knit-test-spec/spec/all_knit.js";
import type { WktService } from "@bufbuild/knit-test-spec/spec/wkt_knit.js";
import type { SubService } from "@bufbuild/knit-test-spec/spec/sub/sub_knit.js";
import { describe, expect, test } from "@jest/globals";
import type { Client } from "./client.js";

import { makeScopedClient } from "./scope.js";

type Schema = AllService & WktService & SubService;

const client = {
  async fetch(q: unknown) {
    return q;
  },
  async do(q: unknown) {
    return q;
  },
  listen(q: unknown) {
    return Promise.resolve();
  },
} as any as Client<Schema>;

describe("scope", () => {
  test("package", async () => {
    const scopedClient = makeScopedClient(client, "spec.sub");
    const res = await scopedClient.do({
      SubService: {
        subMethod: {
          $: {},
        },
      },
    });
    expect(res).toStrictEqual({
      SubService: {
        subMethod: {
          $: {},
        },
      },
    });
  });
  test("package prefix", async () => {
    const scopedClient = makeScopedClient(client, "spec");
    const res = await scopedClient.do({
      AllService: {
        createAll: {
          $: {},
        },
      },
      "sub.SubService": {
        subMethod: {
          $: {},
        },
      },
    });
    expect(res).toStrictEqual({
      AllService: {
        createAll: {
          $: {},
        },
      },
      "sub.SubService": {
        subMethod: {
          $: {},
        },
      },
    });
  });
});
