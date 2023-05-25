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
  Code,
  ConnectError,
  type Transport,
  createPromiseClient,
  createRouterTransport,
} from "@bufbuild/connect";
import { describe, expect, test } from "@jest/globals";
import { createKnitService } from "./service.js";
import { AllService } from "@bufbuild/knit-test-spec/spec/all_connect.js";
import { AllResolverService } from "@bufbuild/knit-test-spec/spec/relations_connect.js";
import { All } from "@bufbuild/knit-test-spec/spec/all_pb.js";
import { Value } from "@bufbuild/protobuf";
import { KnitService } from "@buf/bufbuild_knit.bufbuild_connect-es/buf/knit/gateway/v1alpha1/knit_connect.js";
import { ListenResponse } from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";

const sharedRequest = {
  body: Value.fromJson(
    new All({
      scalars: {
        fields: {
          str: "foo",
        },
      },
    }).toJson()
  ),
  mask: [
    {
      name: "scalars",
      mask: [{ name: "fields", mask: [{ name: "str" }] }],
    },
    {
      name: "relSelfParam",
      params: Value.fromJson({ id: "foo" }),
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
            `${AllResolverService.typeName}.${AllResolverService.methods.getAllRelSelfParam.name}`
          );
          return {
            values: request.bases.map((base) => ({
              relSelfParam: base,
            })),
          };
        },
      });
    })
  );
  test("fetch", async () => {
    const response = await knitClient.fetch({
      requests: [
        {
          method: `${AllService.typeName}.${AllService.methods.getAll.name}`,
          ...sharedRequest,
        },
      ],
    });
    expect(response).toMatchInlineSnapshot(`
      {
        "responses": [
          {
            "body": {
              "relSelfParam": {
                "scalars": {
                  "fields": {
                    "str": "foo",
                  },
                },
              },
              "scalars": {
                "fields": {
                  "str": "foo",
                },
              },
            },
            "method": "spec.AllService.GetAll",
            "schema": {
              "fields": [
                {
                  "jsonName": "",
                  "name": "scalars",
                  "type": {
                    "message": {
                      "fields": [
                        {
                          "jsonName": "",
                          "name": "fields",
                          "type": {
                            "message": {
                              "fields": [
                                {
                                  "jsonName": "",
                                  "name": "str",
                                  "type": {
                                    "scalar": "SCALAR_TYPE_STRING",
                                  },
                                },
                              ],
                              "name": "spec.ScalarFields",
                            },
                          },
                        },
                      ],
                      "name": "spec.Scalar",
                    },
                  },
                },
                {
                  "jsonName": "",
                  "name": "relSelfParam",
                  "type": {
                    "message": {
                      "fields": [
                        {
                          "jsonName": "",
                          "name": "scalars",
                          "type": {
                            "message": {
                              "fields": [
                                {
                                  "jsonName": "",
                                  "name": "fields",
                                  "type": {
                                    "message": {
                                      "fields": [
                                        {
                                          "jsonName": "",
                                          "name": "str",
                                          "type": {
                                            "scalar": "SCALAR_TYPE_STRING",
                                          },
                                        },
                                      ],
                                      "name": "spec.ScalarFields",
                                    },
                                  },
                                },
                              ],
                              "name": "spec.Scalar",
                            },
                          },
                        },
                      ],
                      "name": "spec.All",
                    },
                  },
                },
              ],
              "name": "spec.All",
            },
          },
        ],
      }
    `);
  });
  test("do", async () => {
    const response = await knitClient.do({
      requests: [
        {
          method: `${AllService.typeName}.${AllService.methods.createAll.name}`,
          ...sharedRequest,
        },
      ],
    });
    expect(response).toMatchInlineSnapshot(`
      {
        "responses": [
          {
            "body": {
              "relSelfParam": {
                "scalars": {
                  "fields": {
                    "str": "foo",
                  },
                },
              },
              "scalars": {
                "fields": {
                  "str": "foo",
                },
              },
            },
            "method": "spec.AllService.CreateAll",
            "schema": {
              "fields": [
                {
                  "jsonName": "",
                  "name": "scalars",
                  "type": {
                    "message": {
                      "fields": [
                        {
                          "jsonName": "",
                          "name": "fields",
                          "type": {
                            "message": {
                              "fields": [
                                {
                                  "jsonName": "",
                                  "name": "str",
                                  "type": {
                                    "scalar": "SCALAR_TYPE_STRING",
                                  },
                                },
                              ],
                              "name": "spec.ScalarFields",
                            },
                          },
                        },
                      ],
                      "name": "spec.Scalar",
                    },
                  },
                },
                {
                  "jsonName": "",
                  "name": "relSelfParam",
                  "type": {
                    "message": {
                      "fields": [
                        {
                          "jsonName": "",
                          "name": "scalars",
                          "type": {
                            "message": {
                              "fields": [
                                {
                                  "jsonName": "",
                                  "name": "fields",
                                  "type": {
                                    "message": {
                                      "fields": [
                                        {
                                          "jsonName": "",
                                          "name": "str",
                                          "type": {
                                            "scalar": "SCALAR_TYPE_STRING",
                                          },
                                        },
                                      ],
                                      "name": "spec.ScalarFields",
                                    },
                                  },
                                },
                              ],
                              "name": "spec.Scalar",
                            },
                          },
                        },
                      ],
                      "name": "spec.All",
                    },
                  },
                },
              ],
              "name": "spec.All",
            },
          },
        ],
      }
    `);
  });
  test("listen", async () => {
    const listenResponse = knitClient.listen({
      request: {
        method: `${AllService.typeName}.${AllService.methods.streamAll.name}`,
        ...sharedRequest,
      },
    });
    let count = 0;
    let lastResponse: ListenResponse["response"];
    for await (const response of listenResponse) {
      if (count == 0) {
        expect(response.response).toMatchInlineSnapshot(`
          {
            "body": {
              "relSelfParam": {
                "scalars": {
                  "fields": {
                    "str": "foo",
                  },
                },
              },
              "scalars": {
                "fields": {
                  "str": "foo",
                },
              },
            },
            "method": "spec.AllService.StreamAll",
            "schema": {
              "fields": [
                {
                  "jsonName": "",
                  "name": "scalars",
                  "type": {
                    "message": {
                      "fields": [
                        {
                          "jsonName": "",
                          "name": "fields",
                          "type": {
                            "message": {
                              "fields": [
                                {
                                  "jsonName": "",
                                  "name": "str",
                                  "type": {
                                    "scalar": "SCALAR_TYPE_STRING",
                                  },
                                },
                              ],
                              "name": "spec.ScalarFields",
                            },
                          },
                        },
                      ],
                      "name": "spec.Scalar",
                    },
                  },
                },
                {
                  "jsonName": "",
                  "name": "relSelfParam",
                  "type": {
                    "message": {
                      "fields": [
                        {
                          "jsonName": "",
                          "name": "scalars",
                          "type": {
                            "message": {
                              "fields": [
                                {
                                  "jsonName": "",
                                  "name": "fields",
                                  "type": {
                                    "message": {
                                      "fields": [
                                        {
                                          "jsonName": "",
                                          "name": "str",
                                          "type": {
                                            "scalar": "SCALAR_TYPE_STRING",
                                          },
                                        },
                                      ],
                                      "name": "spec.ScalarFields",
                                    },
                                  },
                                },
                              ],
                              "name": "spec.Scalar",
                            },
                          },
                        },
                      ],
                      "name": "spec.All",
                    },
                  },
                },
              ],
              "name": "spec.All",
            },
          }
        `);
        delete response.response?.schema;
        lastResponse = response.response;
      } else {
        expect(response.response).toEqual(lastResponse);
      }
      count++;
    }
    expect(count).toBe(5);
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
    })
  );
  describe("fetch", () => {
    test("default", async () => {
      await expect(
        knitClient.fetch({
          requests: [
            {
              method: `${AllService.typeName}.${AllService.methods.getAll.name}`,
              ...sharedRequest,
            },
          ],
        })
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"[failed_precondition] Relation error"`
      );
    });
    test("catch-source", async () => {
      const response = await knitClient.fetch({
        requests: [
          {
            method: `${AllService.typeName}.${AllService.methods.getAll.name}`,
            ...sharedRequest,
            mask: [
              {
                name: "relSelfParam",
                params: Value.fromJson({ id: "foo" }),
                onError: { case: "catch", value: {} },
              },
            ],
          },
        ],
      });
      expect(response.responses).toMatchInlineSnapshot(`
        [
          {
            "body": {
              "relSelfParam": {
                "[@error]": {},
                "code": "FAILED_PRECONDITION",
                "details": [],
                "message": "[failed_precondition] Relation error",
                "path": "",
              },
            },
            "method": "spec.AllService.GetAll",
            "schema": {
              "fields": [
                {
                  "jsonName": "",
                  "name": "relSelfParam",
                  "type": {
                    "message": {
                      "fields": [],
                      "name": "spec.All",
                    },
                  },
                },
              ],
              "name": "spec.All",
            },
          },
        ]
      `);
    });
    test("catch-entrypoint", async () => {
      const response = await knitClient.fetch({
        requests: [
          {
            method: `${AllService.typeName}.${AllService.methods.getAll.name}`,
            ...sharedRequest,
            onError: { case: "catch", value: {} },
          },
        ],
      });
      expect(response.responses).toMatchInlineSnapshot(`
        [
          {
            "body": {
              "[@error]": {},
              "code": "FAILED_PRECONDITION",
              "details": [],
              "message": "[failed_precondition] Relation error",
              "path": "",
            },
            "method": "spec.AllService.GetAll",
            "schema": {
              "fields": [
                {
                  "jsonName": "",
                  "name": "scalars",
                  "type": {
                    "message": {
                      "fields": [
                        {
                          "jsonName": "",
                          "name": "fields",
                          "type": {
                            "message": {
                              "fields": [
                                {
                                  "jsonName": "",
                                  "name": "str",
                                  "type": {
                                    "scalar": "SCALAR_TYPE_STRING",
                                  },
                                },
                              ],
                              "name": "spec.ScalarFields",
                            },
                          },
                        },
                      ],
                      "name": "spec.Scalar",
                    },
                  },
                },
                {
                  "jsonName": "",
                  "name": "relSelfParam",
                  "type": {
                    "message": {
                      "fields": [
                        {
                          "jsonName": "",
                          "name": "scalars",
                          "type": {
                            "message": {
                              "fields": [
                                {
                                  "jsonName": "",
                                  "name": "fields",
                                  "type": {
                                    "message": {
                                      "fields": [
                                        {
                                          "jsonName": "",
                                          "name": "str",
                                          "type": {
                                            "scalar": "SCALAR_TYPE_STRING",
                                          },
                                        },
                                      ],
                                      "name": "spec.ScalarFields",
                                    },
                                  },
                                },
                              ],
                              "name": "spec.Scalar",
                            },
                          },
                        },
                      ],
                      "name": "spec.All",
                    },
                  },
                },
              ],
              "name": "spec.All",
            },
          },
        ]
      `);
    });
  });
  describe("do", () => {
    test("default", async () => {
      const response = await knitClient.do({
        requests: [
          {
            method: `${AllService.typeName}.${AllService.methods.createAll.name}`,
            ...sharedRequest,
          },
        ],
      });
      expect(response.responses).toMatchInlineSnapshot(`
        [
          {
            "body": {
              "relSelfParam": {
                "[@error]": {},
                "code": "FAILED_PRECONDITION",
                "details": [],
                "message": "[failed_precondition] Relation error",
                "path": "",
              },
              "scalars": {
                "fields": {
                  "str": "foo",
                },
              },
            },
            "method": "spec.AllService.CreateAll",
            "schema": {
              "fields": [
                {
                  "jsonName": "",
                  "name": "scalars",
                  "type": {
                    "message": {
                      "fields": [
                        {
                          "jsonName": "",
                          "name": "fields",
                          "type": {
                            "message": {
                              "fields": [
                                {
                                  "jsonName": "",
                                  "name": "str",
                                  "type": {
                                    "scalar": "SCALAR_TYPE_STRING",
                                  },
                                },
                              ],
                              "name": "spec.ScalarFields",
                            },
                          },
                        },
                      ],
                      "name": "spec.Scalar",
                    },
                  },
                },
                {
                  "jsonName": "",
                  "name": "relSelfParam",
                  "type": {
                    "message": {
                      "fields": [
                        {
                          "jsonName": "",
                          "name": "scalars",
                          "type": {
                            "message": {
                              "fields": [
                                {
                                  "jsonName": "",
                                  "name": "fields",
                                  "type": {
                                    "message": {
                                      "fields": [
                                        {
                                          "jsonName": "",
                                          "name": "str",
                                          "type": {
                                            "scalar": "SCALAR_TYPE_STRING",
                                          },
                                        },
                                      ],
                                      "name": "spec.ScalarFields",
                                    },
                                  },
                                },
                              ],
                              "name": "spec.Scalar",
                            },
                          },
                        },
                      ],
                      "name": "spec.All",
                    },
                  },
                },
              ],
              "name": "spec.All",
            },
          },
        ]
      `);
    });
    test("throw-source", async () => {
      const response = await knitClient.do({
        requests: [
          {
            method: `${AllService.typeName}.${AllService.methods.createAll.name}`,
            ...sharedRequest,
            mask: [
              {
                name: "relSelfParam",
                params: Value.fromJson({ id: "foo" }),
                onError: { case: "throw", value: {} },
              },
            ],
          },
        ],
      });
      expect(response.responses).toMatchInlineSnapshot(`
        [
          {
            "body": {
              "[@error]": {},
              "code": "FAILED_PRECONDITION",
              "details": [],
              "message": "[failed_precondition] Relation error",
              "path": "",
            },
            "method": "spec.AllService.CreateAll",
            "schema": {
              "fields": [
                {
                  "jsonName": "",
                  "name": "relSelfParam",
                  "type": {
                    "message": {
                      "fields": [],
                      "name": "spec.All",
                    },
                  },
                },
              ],
              "name": "spec.All",
            },
          },
        ]
      `);
    });
    test("throw-all", async () => {
      await expect(
        knitClient.do({
          requests: [
            {
              method: `${AllService.typeName}.${AllService.methods.getAll.name}`,
              ...sharedRequest,
              mask: [
                {
                  name: "relSelfParam",
                  params: Value.fromJson({ id: "foo" }),
                  onError: { case: "throw", value: {} },
                },
              ],
              onError: { case: "throw", value: {} },
            },
          ],
        })
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"[failed_precondition] Relation error"`
      );
    });
  });
  describe("listen", () => {
    test("default", async () => {
      await expect(async () => {
        const response = knitClient.listen({
          request: {
            method: `${AllService.typeName}.${AllService.methods.streamAll.name}`,
            ...sharedRequest,
          },
        });
        for await (const next of response) {
          expect(next).toBe(true); // This must never be called.
        }
      }).rejects.toThrowErrorMatchingInlineSnapshot(
        `"[failed_precondition] Relation error"`
      );
    });
    test("catch-source", async () => {
      const response = await knitClient.listen({
        request: {
          method: `${AllService.typeName}.${AllService.methods.streamAll.name}`,
          ...sharedRequest,
          mask: [
            {
              name: "relSelfParam",
              params: Value.fromJson({ id: "foo" }),
              onError: { case: "catch", value: {} },
            },
          ],
        },
      });
      let count = 0;
      let last: ListenResponse["response"];
      for await (const next of response) {
        if (count == 0) {
          expect(next.response).toMatchInlineSnapshot(`
            {
              "body": {
                "relSelfParam": {
                  "[@error]": {},
                  "code": "FAILED_PRECONDITION",
                  "details": [],
                  "message": "[failed_precondition] Relation error",
                  "path": "",
                },
              },
              "method": "spec.AllService.StreamAll",
              "schema": {
                "fields": [
                  {
                    "jsonName": "",
                    "name": "relSelfParam",
                    "type": {
                      "message": {
                        "fields": [],
                        "name": "spec.All",
                      },
                    },
                  },
                ],
                "name": "spec.All",
              },
            }
          `);
          delete next.response?.schema;
          last = next.response;
        } else {
          expect(next.response).toEqual(last);
        }
        count++;
      }
      expect(count).toEqual(5);
    });
    test("catch-entrypoint", async () => {
      const response = await knitClient.listen({
        request: {
          method: `${AllService.typeName}.${AllService.methods.streamAll.name}`,
          ...sharedRequest,
          onError: { case: "catch", value: {} },
        },
      });
      let count = 0;
      let last: ListenResponse["response"];
      for await (const next of response) {
        if (count == 0) {
          expect(next.response).toMatchInlineSnapshot(`
            {
              "body": {
                "[@error]": {},
                "code": "FAILED_PRECONDITION",
                "details": [],
                "message": "[failed_precondition] Relation error",
                "path": "",
              },
              "method": "spec.AllService.StreamAll",
              "schema": {
                "fields": [
                  {
                    "jsonName": "",
                    "name": "scalars",
                    "type": {
                      "message": {
                        "fields": [
                          {
                            "jsonName": "",
                            "name": "fields",
                            "type": {
                              "message": {
                                "fields": [
                                  {
                                    "jsonName": "",
                                    "name": "str",
                                    "type": {
                                      "scalar": "SCALAR_TYPE_STRING",
                                    },
                                  },
                                ],
                                "name": "spec.ScalarFields",
                              },
                            },
                          },
                        ],
                        "name": "spec.Scalar",
                      },
                    },
                  },
                  {
                    "jsonName": "",
                    "name": "relSelfParam",
                    "type": {
                      "message": {
                        "fields": [
                          {
                            "jsonName": "",
                            "name": "scalars",
                            "type": {
                              "message": {
                                "fields": [
                                  {
                                    "jsonName": "",
                                    "name": "fields",
                                    "type": {
                                      "message": {
                                        "fields": [
                                          {
                                            "jsonName": "",
                                            "name": "str",
                                            "type": {
                                              "scalar": "SCALAR_TYPE_STRING",
                                            },
                                          },
                                        ],
                                        "name": "spec.ScalarFields",
                                      },
                                    },
                                  },
                                ],
                                "name": "spec.Scalar",
                              },
                            },
                          },
                        ],
                        "name": "spec.All",
                      },
                    },
                  },
                ],
                "name": "spec.All",
              },
            }
          `);
          delete next.response?.schema;
          last = next.response;
        } else {
          expect(next.response).toEqual(last);
        }
        count++;
      }
      expect(count).toEqual(5);
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
        })
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
    }
  );
  return createPromiseClient(KnitService, knitTransport);
}

function expectCustomHeader(headers: Headers) {
  expect(headers.get("Custom-Header")).toEqual("Custom-Value");
}

function expectOperation(headers: Headers, operation: string) {
  // Multiple headers with same key are combined into one by joining them using `, `
  const operations = headers.get("Knit-Operations")?.split(", ");
  try {
    expect(operations?.[operations?.length - 1]).toEqual(operation);
    expect(operations?.[0]).toMatch(
      /buf\.knit\.gateway\.v1alpha1\.KnitService\.(Fetch)|(Do)|(Listen)/
    );
  } catch (err) {
    throw new ConnectError(
      `operation validation failed: ${operations?.join(",")}`,
      Code.FailedPrecondition,
      undefined,
      undefined,
      err
    );
  }
}
