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

import { type PartialMessage, Value } from "@bufbuild/protobuf";
import { describe, expect, test } from "@jest/globals";
import type { Request } from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import { makeRequests } from "./protocol.js";

describe("makeRequests", () => {
  test("single query", () => {
    const [requests, oneofs] = makeRequests({
      "foo.v1.FooService": {
        getFoo: {
          foo: {
            name: {},
          },
        },
      },
    });
    expect(requests).toStrictEqual([
      {
        method: "foo.v1.FooService.GetFoo",
        body: undefined,
        onError: undefined,
        mask: [
          {
            name: "foo",
            params: undefined,
            onError: undefined,
            mask: [
              { name: "name", params: undefined, onError: undefined, mask: [] },
            ],
          },
        ],
      },
    ] satisfies PartialMessage<Request>[]);
    expect(oneofs).toStrictEqual([{}]);
  });
  test("single query with catch", () => {
    const [requests, oneofs] = makeRequests({
      "foo.v1.FooService": {
        getFoo: {
          "@catch": {},
          foo: {
            "@catch": {},
            name: {},
          },
        },
      },
    });
    expect(requests).toStrictEqual([
      {
        method: "foo.v1.FooService.GetFoo",
        body: undefined,
        mask: [
          {
            name: "foo",
            params: undefined,
            onError: { case: "catch", value: {} },
            mask: [
              { name: "name", params: undefined, onError: undefined, mask: [] },
            ],
          },
        ],
        onError: { case: "catch", value: {} },
      },
    ] satisfies PartialMessage<Request>[]);
    expect(oneofs).toStrictEqual([{}]);
  });
  test("single query with throw", () => {
    const [requests, oneofs] = makeRequests({
      "foo.v1.FooService": {
        getFoo: {
          "@throw": {},
          foo: {
            "@throw": {},
            name: {},
          },
        },
      },
    });
    expect(requests).toStrictEqual([
      {
        method: "foo.v1.FooService.GetFoo",
        body: undefined,
        mask: [
          {
            name: "foo",
            params: undefined,
            onError: { case: "throw", value: {} },
            mask: [
              { name: "name", params: undefined, onError: undefined, mask: [] },
            ],
          },
        ],
        onError: { case: "throw", value: {} },
      },
    ] satisfies PartialMessage<Request>[]);
    expect(oneofs).toStrictEqual([{}]);
  });
  test("single query skip params", () => {
    const [requests, oneofs] = makeRequests({
      "foo.v1.FooService": {
        getFoo: {
          $: {},
          foo: {
            name: {},
          },
        },
      },
    });
    expect(requests).toStrictEqual([
      {
        method: "foo.v1.FooService.GetFoo",
        body: Value.fromJson({}),
        onError: undefined,
        mask: [
          {
            name: "foo",
            params: undefined,
            onError: undefined,
            mask: [
              { name: "name", params: undefined, onError: undefined, mask: [] },
            ],
          },
        ],
      },
    ] satisfies PartialMessage<Request>[]);
    expect(oneofs).toStrictEqual([{}]);
  });
  test("single query with scalar oneof", () => {
    const [requests, oneofs] = makeRequests({
      "foo.v1.FooService": {
        getFoo: {
          foo: {
            oneofField: {
              "@oneof": {
                a: {},
                b: {},
              },
            },
          },
        },
      },
    });
    expect(requests).toStrictEqual([
      {
        method: "foo.v1.FooService.GetFoo",
        body: undefined,
        onError: undefined,
        mask: [
          {
            name: "foo",
            params: undefined,
            onError: undefined,
            mask: [
              { name: "a", params: undefined, onError: undefined, mask: [] },
              { name: "b", params: undefined, onError: undefined, mask: [] },
            ],
          },
        ],
      },
    ] satisfies PartialMessage<Request>[]);
    expect(oneofs).toStrictEqual([
      {
        "foo.v1.FooService.getFoo.foo.a": "oneofField",
        "foo.v1.FooService.getFoo.foo.b": "oneofField",
      },
    ]);
  });
  test("single query with message oneof", () => {
    const [requests, oneofs] = makeRequests({
      "foo.v1.FooService": {
        getFoo: {
          foo: {
            oneofField: {
              "@oneof": {
                a: {
                  sub: {},
                },
                b: {},
              },
            },
          },
        },
      },
    });
    expect(requests).toStrictEqual([
      {
        method: "foo.v1.FooService.GetFoo",
        body: undefined,
        onError: undefined,
        mask: [
          {
            name: "foo",
            params: undefined,
            onError: undefined,
            mask: [
              {
                name: "a",
                params: undefined,
                onError: undefined,
                mask: [
                  {
                    name: "sub",
                    params: undefined,
                    onError: undefined,
                    mask: [],
                  },
                ],
              },
              { name: "b", params: undefined, onError: undefined, mask: [] },
            ],
          },
        ],
      },
    ] satisfies PartialMessage<Request>[]);
    expect(oneofs).toStrictEqual([
      {
        "foo.v1.FooService.getFoo.foo.a": "oneofField",
        "foo.v1.FooService.getFoo.foo.b": "oneofField",
      },
    ]);
  });
  test("single query with multiple oneofs", () => {
    const [requests, oneofs] = makeRequests({
      "foo.v1.FooService": {
        getFoo: {
          foo: {
            oneofField: {
              "@oneof": {
                a: {
                  subOneof: {
                    "@oneof": {
                      p: {},
                      q: {},
                    },
                  },
                },
                b: {},
              },
            },
          },
        },
      },
    });
    expect(requests).toStrictEqual([
      {
        method: "foo.v1.FooService.GetFoo",
        body: undefined,
        onError: undefined,
        mask: [
          {
            name: "foo",
            params: undefined,
            onError: undefined,
            mask: [
              {
                name: "a",
                params: undefined,
                onError: undefined,
                mask: [
                  {
                    name: "p",
                    params: undefined,
                    onError: undefined,
                    mask: [],
                  },
                  {
                    name: "q",
                    params: undefined,
                    onError: undefined,
                    mask: [],
                  },
                ],
              },
              { name: "b", params: undefined, onError: undefined, mask: [] },
            ],
          },
        ],
      },
    ] satisfies PartialMessage<Request>[]);
    expect(oneofs).toStrictEqual([
      {
        "foo.v1.FooService.getFoo.foo.a": "oneofField",
        "foo.v1.FooService.getFoo.foo.a.p": "subOneof",
        "foo.v1.FooService.getFoo.foo.a.q": "subOneof",
        "foo.v1.FooService.getFoo.foo.b": "oneofField",
      },
    ]);
  });
  test("multiple services query with scalar oneof", () => {
    const [requests, oneofs] = makeRequests({
      "foo.v1.FooService": {
        getFoo: {
          foo: {
            fooOneof: {
              "@oneof": {
                a: {},
                b: {},
              },
            },
          },
        },
      },
      "bar.v1.BarService": {
        listBar: {
          bar: {
            barOneof: { "@oneof": { a: {}, b: {} } },
          },
        },
      },
    });
    expect(requests).toStrictEqual([
      {
        method: "foo.v1.FooService.GetFoo",
        body: undefined,
        onError: undefined,
        mask: [
          {
            name: "foo",
            params: undefined,
            onError: undefined,
            mask: [
              { name: "a", params: undefined, onError: undefined, mask: [] },
              { name: "b", params: undefined, onError: undefined, mask: [] },
            ],
          },
        ],
      },
      {
        method: "bar.v1.BarService.ListBar",
        body: undefined,
        onError: undefined,
        mask: [
          {
            name: "bar",
            params: undefined,
            onError: undefined,
            mask: [
              { name: "a", params: undefined, onError: undefined, mask: [] },
              { name: "b", params: undefined, onError: undefined, mask: [] },
            ],
          },
        ],
      },
    ] satisfies PartialMessage<Request>[]);
    expect(oneofs).toStrictEqual([
      {
        "foo.v1.FooService.getFoo.foo.a": "fooOneof",
        "foo.v1.FooService.getFoo.foo.b": "fooOneof",
      },
      {
        "bar.v1.BarService.listBar.bar.a": "barOneof",
        "bar.v1.BarService.listBar.bar.b": "barOneof",
      },
    ]);
  });
});
