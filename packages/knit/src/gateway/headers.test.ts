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

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { makeOutboundHeader } from "./headers.js";

describe("well known headers", () => {
  const headers = [
    "Accept",
    "Connect",
    "Connection",
    "Expect",
    "Host",
    "Http2-Settings",
    "Keep-Alive",
    "Origin",
    "Proxy-Connection",
    "TE",
    "Trailer",
    "Transfer-Encoding",
    "Upgrade",
  ];
  for (const header of headers) {
    test(header, () => {
      assert.ok(
        !makeOutboundHeader(new Headers({ [header]: "foo" })).has(header),
      );
    });
  }
});

describe("well known prefix", () => {
  const prefixes = ["Accept-", "Connect-", "Content-", "If-", "Grpc-"];
  for (const prefix of prefixes) {
    test(prefix, () => {
      const header = prefix + "-FOO";
      assert.ok(
        !makeOutboundHeader(new Headers({ [header]: "foo" })).has(header),
      );
    });
  }
});

test("Allow", () => {
  assert.deepStrictEqual(
    makeOutboundHeader(new Headers({ Authorization: "foo" })).get(
      "Authorization",
    ),
    "foo",
  );
});
