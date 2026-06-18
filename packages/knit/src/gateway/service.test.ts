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
  Code,
  ConnectError,
  type Transport,
  createClient,
  createRouterTransport,
} from "@connectrpc/connect";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createKnitService } from "./service.js";
import { AllService, AllSchema } from "@bufbuild/knit-test-spec/spec/all_pb.js";
import { AllResolverService } from "@bufbuild/knit-test-spec/spec/relations_pb.js";
import { create, fromJson, toJson } from "@bufbuild/protobuf";
import { ValueSchema } from "@bufbuild/protobuf/wkt";
import {
  KnitService,
  type ListenResponse,
} from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";

const sharedRequest = {
  body: fromJson(
    ValueSchema,
    toJson(
      AllSchema,
      create(AllSchema, {
        scalars: {
          fields: {
            str: "foo",
          },
        },
      }),
    ),
  ),
  mask: [
    {
      name: "scalars",
      mask: [{ name: "fields", mask: [{ name: "str" }] }],
    },
    {
      name: "relSelfParam",
      params: fromJson(ValueSchema, { id: "foo" }),
      mask: [
        {
          name: "scalars",
          mask: [{ name: "fields", mask: [{ name: "str" }] }],
        },
      ],
    },
  ],
};

describe("success", () => {
  const knitClient = createKnitClient(
    createRouterTransport(({ service }) => {
      service(AllService, {
        async getAll(request, { requestHeader }) {
          expectCustomHeader(requestHeader);
          return request;
        },
        async createAll(request, { requestHeader }) {
          expectCustomHeader(requestHeader);
          return request;
        },
        async *streamAll(request, { requestHeader }) {
          expectCustomHeader(requestHeader);
          for (let i = 0; i < 5; i++) {
            yield request;
          }
        },
      });
      service(AllResolverService, {
        async getAllRelSelfParam(request, { requestHeader }) {
          expectCustomHeader(requestHeader);
          expectOperation(
            requestHeader,
            `${AllResolverService.typeName}.${AllResolverService.method.getAllRelSelfParam.name}`,
          );
          return {
            values: request.bases.map((base) => ({
              relSelfParam: base,
            })),
          };
        },
      });
    }),
  );
  test("fetch", async (t) => {
    const response = await knitClient.fetch({
      requests: [
        {
          method: `${AllService.typeName}.${AllService.method.getAll.name}`,
          ...sharedRequest,
        },
      ],
    });
    t.assert.snapshot(response);
  });
  test("do", async (t) => {
    const response = await knitClient.do({
      requests: [
        {
          method: `${AllService.typeName}.${AllService.method.createAll.name}`,
          ...sharedRequest,
        },
      ],
    });
    t.assert.snapshot(response);
  });
  test("listen", async (t) => {
    const listenResponse = knitClient.listen({
      request: {
        method: `${AllService.typeName}.${AllService.method.streamAll.name}`,
        ...sharedRequest,
      },
    });
    let count = 0;
    let lastResponse: ListenResponse["response"];
    for await (const response of listenResponse) {
      if (count == 0) {
        t.assert.snapshot(response.response);
        delete response.response?.schema;
        lastResponse = response.response;
      } else {
        assert.deepStrictEqual(response.response, lastResponse);
      }
      count++;
    }
    assert.strictEqual(count, 5);
  });
});

describe("errors", () => {
  const knitClient = createKnitClient(
    createRouterTransport(({ service }) => {
      service(AllService, {
        async getAll(request) {
          return request;
        },
        async createAll(request) {
          return request;
        },
        async *streamAll(request) {
          for (let i = 0; i < 5; i++) {
            yield request;
          }
        },
      });
      service(AllResolverService, {
        async getAllRelSelfParam() {
          throw new ConnectError("Relation error", Code.FailedPrecondition);
        },
      });
    }),
  );
  describe("fetch", () => {
    test("default", async (t) => {
      await assert.rejects(
        knitClient.fetch({
          requests: [
            {
              method: `${AllService.typeName}.${AllService.method.getAll.name}`,
              ...sharedRequest,
            },
          ],
        }),
        { message: "[failed_precondition] Relation error" },
      );
    });
    test("catch-source", async (t) => {
      const response = await knitClient.fetch({
        requests: [
          {
            method: `${AllService.typeName}.${AllService.method.getAll.name}`,
            ...sharedRequest,
            mask: [
              {
                name: "relSelfParam",
                params: fromJson(ValueSchema, { id: "foo" }),
                onError: { case: "catch", value: {} },
              },
            ],
          },
        ],
      });
      t.assert.snapshot(response.responses);
    });
    test("catch-entrypoint", async (t) => {
      const response = await knitClient.fetch({
        requests: [
          {
            method: `${AllService.typeName}.${AllService.method.getAll.name}`,
            ...sharedRequest,
            onError: { case: "catch", value: {} },
          },
        ],
      });
      t.assert.snapshot(response.responses);
    });
  });
  describe("do", () => {
    test("default", async (t) => {
      const response = await knitClient.do({
        requests: [
          {
            method: `${AllService.typeName}.${AllService.method.createAll.name}`,
            ...sharedRequest,
          },
        ],
      });
      t.assert.snapshot(response.responses);
    });
    test("throw-source", async (t) => {
      const response = await knitClient.do({
        requests: [
          {
            method: `${AllService.typeName}.${AllService.method.createAll.name}`,
            ...sharedRequest,
            mask: [
              {
                name: "relSelfParam",
                params: fromJson(ValueSchema, { id: "foo" }),
                onError: { case: "throw", value: {} },
              },
            ],
          },
        ],
      });
      t.assert.snapshot(response.responses);
    });
    test("throw-all", async (t) => {
      await assert.rejects(
        knitClient.do({
          requests: [
            {
              method: `${AllService.typeName}.${AllService.method.getAll.name}`,
              ...sharedRequest,
              mask: [
                {
                  name: "relSelfParam",
                  params: fromJson(ValueSchema, { id: "foo" }),
                  onError: { case: "throw", value: {} },
                },
              ],
              onError: { case: "throw", value: {} },
            },
          ],
        }),
        { message: "[failed_precondition] Relation error" },
      );
    });
  });
  describe("listen", () => {
    test("default", async (t) => {
      await assert.rejects(
        async () => {
          const response = knitClient.listen({
            request: {
              method: `${AllService.typeName}.${AllService.method.streamAll.name}`,
              ...sharedRequest,
            },
          });
          for await (const next of response) {
            assert.fail(`listen must not yield a response: ${String(next)}`);
          }
        },
        { message: "[failed_precondition] Relation error" },
      );
    });
    test("catch-source", async (t) => {
      const response = await knitClient.listen({
        request: {
          method: `${AllService.typeName}.${AllService.method.streamAll.name}`,
          ...sharedRequest,
          mask: [
            {
              name: "relSelfParam",
              params: fromJson(ValueSchema, { id: "foo" }),
              onError: { case: "catch", value: {} },
            },
          ],
        },
      });
      let count = 0;
      let last: ListenResponse["response"];
      for await (const next of response) {
        if (count == 0) {
          t.assert.snapshot(next.response);
          delete next.response?.schema;
          last = next.response;
        } else {
          assert.deepStrictEqual(next.response, last);
        }
        count++;
      }
      assert.strictEqual(count, 5);
    });
    test("catch-entrypoint", async (t) => {
      const response = await knitClient.listen({
        request: {
          method: `${AllService.typeName}.${AllService.method.streamAll.name}`,
          ...sharedRequest,
          onError: { case: "catch", value: {} },
        },
      });
      let count = 0;
      let last: ListenResponse["response"];
      for await (const next of response) {
        if (count == 0) {
          t.assert.snapshot(next.response);
          delete next.response?.schema;
          last = next.response;
        } else {
          assert.deepStrictEqual(next.response, last);
        }
        count++;
      }
      assert.strictEqual(count, 5);
    });
  });
});

function createKnitClient(transport: Transport) {
  const knitTransport = createRouterTransport(
    ({ service }) => {
      service(
        KnitService,
        createKnitService({
          transport: transport,
          configure({ service, relation }) {
            service(AllService);
            relation(AllResolverService, {
              getAllRelSelfParam: { name: "rel_self_param" },
            });
          },
        }),
      );
    },
    {
      transport: {
        interceptors: [
          (next) => {
            return (req) => {
              req.header.set("Custom-Header", "Custom-Value");
              return next(req);
            };
          },
        ],
      },
    },
  );
  return createClient(KnitService, knitTransport);
}

function expectCustomHeader(headers: Headers) {
  assert.strictEqual(headers.get("Custom-Header"), "Custom-Value");
}

function expectOperation(headers: Headers, operation: string) {
  // Multiple headers with same key are combined into one by joining them using `, `
  const operations = headers.get("Knit-Operations")?.split(", ");
  try {
    assert.strictEqual(operations?.[operations?.length - 1], operation);
    assert.match(
      operations?.[0] ?? "",
      /buf\.knit\.gateway\.v1alpha1\.KnitService\.(Fetch)|(Do)|(Listen)/,
    );
  } catch (err) {
    throw new ConnectError(
      `operation validation failed: ${operations?.join(",")}`,
      Code.FailedPrecondition,
      undefined,
      undefined,
      err,
    );
  }
}
