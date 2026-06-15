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
import { describe, expect, test } from "@jest/globals";
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
  test("fetch", async () => {
    const response = await knitClient.fetch({
      requests: [
        {
          method: `${AllService.typeName}.${AllService.method.getAll.name}`,
          ...sharedRequest,
        },
      ],
    });
    expect(response).toMatchInlineSnapshot(`
{
  "$typeName": "buf.knit.gateway.v1alpha1.FetchResponse",
  "responses": [
    {
      "$typeName": "buf.knit.gateway.v1alpha1.Response",
      "body": {
        "$typeName": "google.protobuf.Value",
        "kind": {
          "case": "structValue",
          "value": {
            "$typeName": "google.protobuf.Struct",
            "fields": {
              "relSelfParam": {
                "$typeName": "google.protobuf.Value",
                "kind": {
                  "case": "structValue",
                  "value": {
                    "$typeName": "google.protobuf.Struct",
                    "fields": {
                      "scalars": {
                        "$typeName": "google.protobuf.Value",
                        "kind": {
                          "case": "structValue",
                          "value": {
                            "$typeName": "google.protobuf.Struct",
                            "fields": {
                              "fields": {
                                "$typeName": "google.protobuf.Value",
                                "kind": {
                                  "case": "structValue",
                                  "value": {
                                    "$typeName": "google.protobuf.Struct",
                                    "fields": {
                                      "str": {
                                        "$typeName": "google.protobuf.Value",
                                        "kind": {
                                          "case": "stringValue",
                                          "value": "foo",
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              "scalars": {
                "$typeName": "google.protobuf.Value",
                "kind": {
                  "case": "structValue",
                  "value": {
                    "$typeName": "google.protobuf.Struct",
                    "fields": {
                      "fields": {
                        "$typeName": "google.protobuf.Value",
                        "kind": {
                          "case": "structValue",
                          "value": {
                            "$typeName": "google.protobuf.Struct",
                            "fields": {
                              "str": {
                                "$typeName": "google.protobuf.Value",
                                "kind": {
                                  "case": "stringValue",
                                  "value": "foo",
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "method": "spec.AllService.GetAll",
      "schema": {
        "$typeName": "buf.knit.gateway.v1alpha1.Schema",
        "fields": [
          {
            "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
            "jsonName": "",
            "name": "scalars",
            "type": {
              "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
              "value": {
                "case": "message",
                "value": {
                  "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                  "fields": [
                    {
                      "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                      "jsonName": "",
                      "name": "fields",
                      "type": {
                        "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                        "value": {
                          "case": "message",
                          "value": {
                            "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                            "fields": [
                              {
                                "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                                "jsonName": "",
                                "name": "str",
                                "type": {
                                  "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                                  "value": {
                                    "case": "scalar",
                                    "value": 9,
                                  },
                                },
                              },
                            ],
                            "name": "spec.ScalarFields",
                          },
                        },
                      },
                    },
                  ],
                  "name": "spec.Scalar",
                },
              },
            },
          },
          {
            "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
            "jsonName": "",
            "name": "relSelfParam",
            "type": {
              "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
              "value": {
                "case": "message",
                "value": {
                  "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                  "fields": [
                    {
                      "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                      "jsonName": "",
                      "name": "scalars",
                      "type": {
                        "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                        "value": {
                          "case": "message",
                          "value": {
                            "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                            "fields": [
                              {
                                "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                                "jsonName": "",
                                "name": "fields",
                                "type": {
                                  "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                                  "value": {
                                    "case": "message",
                                    "value": {
                                      "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                                      "fields": [
                                        {
                                          "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                                          "jsonName": "",
                                          "name": "str",
                                          "type": {
                                            "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                                            "value": {
                                              "case": "scalar",
                                              "value": 9,
                                            },
                                          },
                                        },
                                      ],
                                      "name": "spec.ScalarFields",
                                    },
                                  },
                                },
                              },
                            ],
                            "name": "spec.Scalar",
                          },
                        },
                      },
                    },
                  ],
                  "name": "spec.All",
                },
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
          method: `${AllService.typeName}.${AllService.method.createAll.name}`,
          ...sharedRequest,
        },
      ],
    });
    expect(response).toMatchInlineSnapshot(`
{
  "$typeName": "buf.knit.gateway.v1alpha1.DoResponse",
  "responses": [
    {
      "$typeName": "buf.knit.gateway.v1alpha1.Response",
      "body": {
        "$typeName": "google.protobuf.Value",
        "kind": {
          "case": "structValue",
          "value": {
            "$typeName": "google.protobuf.Struct",
            "fields": {
              "relSelfParam": {
                "$typeName": "google.protobuf.Value",
                "kind": {
                  "case": "structValue",
                  "value": {
                    "$typeName": "google.protobuf.Struct",
                    "fields": {
                      "scalars": {
                        "$typeName": "google.protobuf.Value",
                        "kind": {
                          "case": "structValue",
                          "value": {
                            "$typeName": "google.protobuf.Struct",
                            "fields": {
                              "fields": {
                                "$typeName": "google.protobuf.Value",
                                "kind": {
                                  "case": "structValue",
                                  "value": {
                                    "$typeName": "google.protobuf.Struct",
                                    "fields": {
                                      "str": {
                                        "$typeName": "google.protobuf.Value",
                                        "kind": {
                                          "case": "stringValue",
                                          "value": "foo",
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              "scalars": {
                "$typeName": "google.protobuf.Value",
                "kind": {
                  "case": "structValue",
                  "value": {
                    "$typeName": "google.protobuf.Struct",
                    "fields": {
                      "fields": {
                        "$typeName": "google.protobuf.Value",
                        "kind": {
                          "case": "structValue",
                          "value": {
                            "$typeName": "google.protobuf.Struct",
                            "fields": {
                              "str": {
                                "$typeName": "google.protobuf.Value",
                                "kind": {
                                  "case": "stringValue",
                                  "value": "foo",
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "method": "spec.AllService.CreateAll",
      "schema": {
        "$typeName": "buf.knit.gateway.v1alpha1.Schema",
        "fields": [
          {
            "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
            "jsonName": "",
            "name": "scalars",
            "type": {
              "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
              "value": {
                "case": "message",
                "value": {
                  "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                  "fields": [
                    {
                      "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                      "jsonName": "",
                      "name": "fields",
                      "type": {
                        "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                        "value": {
                          "case": "message",
                          "value": {
                            "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                            "fields": [
                              {
                                "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                                "jsonName": "",
                                "name": "str",
                                "type": {
                                  "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                                  "value": {
                                    "case": "scalar",
                                    "value": 9,
                                  },
                                },
                              },
                            ],
                            "name": "spec.ScalarFields",
                          },
                        },
                      },
                    },
                  ],
                  "name": "spec.Scalar",
                },
              },
            },
          },
          {
            "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
            "jsonName": "",
            "name": "relSelfParam",
            "type": {
              "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
              "value": {
                "case": "message",
                "value": {
                  "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                  "fields": [
                    {
                      "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                      "jsonName": "",
                      "name": "scalars",
                      "type": {
                        "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                        "value": {
                          "case": "message",
                          "value": {
                            "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                            "fields": [
                              {
                                "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                                "jsonName": "",
                                "name": "fields",
                                "type": {
                                  "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                                  "value": {
                                    "case": "message",
                                    "value": {
                                      "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                                      "fields": [
                                        {
                                          "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                                          "jsonName": "",
                                          "name": "str",
                                          "type": {
                                            "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                                            "value": {
                                              "case": "scalar",
                                              "value": 9,
                                            },
                                          },
                                        },
                                      ],
                                      "name": "spec.ScalarFields",
                                    },
                                  },
                                },
                              },
                            ],
                            "name": "spec.Scalar",
                          },
                        },
                      },
                    },
                  ],
                  "name": "spec.All",
                },
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
        method: `${AllService.typeName}.${AllService.method.streamAll.name}`,
        ...sharedRequest,
      },
    });
    let count = 0;
    let lastResponse: ListenResponse["response"];
    for await (const response of listenResponse) {
      if (count == 0) {
        expect(response.response).toMatchInlineSnapshot(`
{
  "$typeName": "buf.knit.gateway.v1alpha1.Response",
  "body": {
    "$typeName": "google.protobuf.Value",
    "kind": {
      "case": "structValue",
      "value": {
        "$typeName": "google.protobuf.Struct",
        "fields": {
          "relSelfParam": {
            "$typeName": "google.protobuf.Value",
            "kind": {
              "case": "structValue",
              "value": {
                "$typeName": "google.protobuf.Struct",
                "fields": {
                  "scalars": {
                    "$typeName": "google.protobuf.Value",
                    "kind": {
                      "case": "structValue",
                      "value": {
                        "$typeName": "google.protobuf.Struct",
                        "fields": {
                          "fields": {
                            "$typeName": "google.protobuf.Value",
                            "kind": {
                              "case": "structValue",
                              "value": {
                                "$typeName": "google.protobuf.Struct",
                                "fields": {
                                  "str": {
                                    "$typeName": "google.protobuf.Value",
                                    "kind": {
                                      "case": "stringValue",
                                      "value": "foo",
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "scalars": {
            "$typeName": "google.protobuf.Value",
            "kind": {
              "case": "structValue",
              "value": {
                "$typeName": "google.protobuf.Struct",
                "fields": {
                  "fields": {
                    "$typeName": "google.protobuf.Value",
                    "kind": {
                      "case": "structValue",
                      "value": {
                        "$typeName": "google.protobuf.Struct",
                        "fields": {
                          "str": {
                            "$typeName": "google.protobuf.Value",
                            "kind": {
                              "case": "stringValue",
                              "value": "foo",
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  "method": "spec.AllService.StreamAll",
  "schema": {
    "$typeName": "buf.knit.gateway.v1alpha1.Schema",
    "fields": [
      {
        "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
        "jsonName": "",
        "name": "scalars",
        "type": {
          "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
          "value": {
            "case": "message",
            "value": {
              "$typeName": "buf.knit.gateway.v1alpha1.Schema",
              "fields": [
                {
                  "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                  "jsonName": "",
                  "name": "fields",
                  "type": {
                    "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                    "value": {
                      "case": "message",
                      "value": {
                        "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                        "fields": [
                          {
                            "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                            "jsonName": "",
                            "name": "str",
                            "type": {
                              "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                              "value": {
                                "case": "scalar",
                                "value": 9,
                              },
                            },
                          },
                        ],
                        "name": "spec.ScalarFields",
                      },
                    },
                  },
                },
              ],
              "name": "spec.Scalar",
            },
          },
        },
      },
      {
        "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
        "jsonName": "",
        "name": "relSelfParam",
        "type": {
          "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
          "value": {
            "case": "message",
            "value": {
              "$typeName": "buf.knit.gateway.v1alpha1.Schema",
              "fields": [
                {
                  "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                  "jsonName": "",
                  "name": "scalars",
                  "type": {
                    "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                    "value": {
                      "case": "message",
                      "value": {
                        "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                        "fields": [
                          {
                            "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                            "jsonName": "",
                            "name": "fields",
                            "type": {
                              "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                              "value": {
                                "case": "message",
                                "value": {
                                  "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                                  "fields": [
                                    {
                                      "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                                      "jsonName": "",
                                      "name": "str",
                                      "type": {
                                        "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                                        "value": {
                                          "case": "scalar",
                                          "value": 9,
                                        },
                                      },
                                    },
                                  ],
                                  "name": "spec.ScalarFields",
                                },
                              },
                            },
                          },
                        ],
                        "name": "spec.Scalar",
                      },
                    },
                  },
                },
              ],
              "name": "spec.All",
            },
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
    }),
  );
  describe("fetch", () => {
    test("default", async () => {
      await expect(
        knitClient.fetch({
          requests: [
            {
              method: `${AllService.typeName}.${AllService.method.getAll.name}`,
              ...sharedRequest,
            },
          ],
        }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"[failed_precondition] Relation error"`,
      );
    });
    test("catch-source", async () => {
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
      expect(response.responses).toMatchInlineSnapshot(`
[
  {
    "$typeName": "buf.knit.gateway.v1alpha1.Response",
    "body": {
      "$typeName": "google.protobuf.Value",
      "kind": {
        "case": "structValue",
        "value": {
          "$typeName": "google.protobuf.Struct",
          "fields": {
            "relSelfParam": {
              "$typeName": "google.protobuf.Value",
              "kind": {
                "case": "structValue",
                "value": {
                  "$typeName": "google.protobuf.Struct",
                  "fields": {
                    "[@error]": {
                      "$typeName": "google.protobuf.Value",
                      "kind": {
                        "case": "structValue",
                        "value": {
                          "$typeName": "google.protobuf.Struct",
                          "fields": {},
                        },
                      },
                    },
                    "code": {
                      "$typeName": "google.protobuf.Value",
                      "kind": {
                        "case": "stringValue",
                        "value": "FAILED_PRECONDITION",
                      },
                    },
                    "details": {
                      "$typeName": "google.protobuf.Value",
                      "kind": {
                        "case": "listValue",
                        "value": {
                          "$typeName": "google.protobuf.ListValue",
                          "values": [],
                        },
                      },
                    },
                    "message": {
                      "$typeName": "google.protobuf.Value",
                      "kind": {
                        "case": "stringValue",
                        "value": "[failed_precondition] Relation error",
                      },
                    },
                    "path": {
                      "$typeName": "google.protobuf.Value",
                      "kind": {
                        "case": "stringValue",
                        "value": "",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "method": "spec.AllService.GetAll",
    "schema": {
      "$typeName": "buf.knit.gateway.v1alpha1.Schema",
      "fields": [
        {
          "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
          "jsonName": "",
          "name": "relSelfParam",
          "type": {
            "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
            "value": {
              "case": "message",
              "value": {
                "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                "fields": [],
                "name": "spec.All",
              },
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
            method: `${AllService.typeName}.${AllService.method.getAll.name}`,
            ...sharedRequest,
            onError: { case: "catch", value: {} },
          },
        ],
      });
      expect(response.responses).toMatchInlineSnapshot(`
[
  {
    "$typeName": "buf.knit.gateway.v1alpha1.Response",
    "body": {
      "$typeName": "google.protobuf.Value",
      "kind": {
        "case": "structValue",
        "value": {
          "$typeName": "google.protobuf.Struct",
          "fields": {
            "[@error]": {
              "$typeName": "google.protobuf.Value",
              "kind": {
                "case": "structValue",
                "value": {
                  "$typeName": "google.protobuf.Struct",
                  "fields": {},
                },
              },
            },
            "code": {
              "$typeName": "google.protobuf.Value",
              "kind": {
                "case": "stringValue",
                "value": "FAILED_PRECONDITION",
              },
            },
            "details": {
              "$typeName": "google.protobuf.Value",
              "kind": {
                "case": "listValue",
                "value": {
                  "$typeName": "google.protobuf.ListValue",
                  "values": [],
                },
              },
            },
            "message": {
              "$typeName": "google.protobuf.Value",
              "kind": {
                "case": "stringValue",
                "value": "[failed_precondition] Relation error",
              },
            },
            "path": {
              "$typeName": "google.protobuf.Value",
              "kind": {
                "case": "stringValue",
                "value": "",
              },
            },
          },
        },
      },
    },
    "method": "spec.AllService.GetAll",
    "schema": {
      "$typeName": "buf.knit.gateway.v1alpha1.Schema",
      "fields": [
        {
          "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
          "jsonName": "",
          "name": "scalars",
          "type": {
            "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
            "value": {
              "case": "message",
              "value": {
                "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                "fields": [
                  {
                    "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                    "jsonName": "",
                    "name": "fields",
                    "type": {
                      "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                      "value": {
                        "case": "message",
                        "value": {
                          "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                          "fields": [
                            {
                              "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                              "jsonName": "",
                              "name": "str",
                              "type": {
                                "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                                "value": {
                                  "case": "scalar",
                                  "value": 9,
                                },
                              },
                            },
                          ],
                          "name": "spec.ScalarFields",
                        },
                      },
                    },
                  },
                ],
                "name": "spec.Scalar",
              },
            },
          },
        },
        {
          "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
          "jsonName": "",
          "name": "relSelfParam",
          "type": {
            "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
            "value": {
              "case": "message",
              "value": {
                "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                "fields": [
                  {
                    "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                    "jsonName": "",
                    "name": "scalars",
                    "type": {
                      "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                      "value": {
                        "case": "message",
                        "value": {
                          "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                          "fields": [
                            {
                              "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                              "jsonName": "",
                              "name": "fields",
                              "type": {
                                "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                                "value": {
                                  "case": "message",
                                  "value": {
                                    "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                                    "fields": [
                                      {
                                        "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                                        "jsonName": "",
                                        "name": "str",
                                        "type": {
                                          "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                                          "value": {
                                            "case": "scalar",
                                            "value": 9,
                                          },
                                        },
                                      },
                                    ],
                                    "name": "spec.ScalarFields",
                                  },
                                },
                              },
                            },
                          ],
                          "name": "spec.Scalar",
                        },
                      },
                    },
                  },
                ],
                "name": "spec.All",
              },
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
            method: `${AllService.typeName}.${AllService.method.createAll.name}`,
            ...sharedRequest,
          },
        ],
      });
      expect(response.responses).toMatchInlineSnapshot(`
[
  {
    "$typeName": "buf.knit.gateway.v1alpha1.Response",
    "body": {
      "$typeName": "google.protobuf.Value",
      "kind": {
        "case": "structValue",
        "value": {
          "$typeName": "google.protobuf.Struct",
          "fields": {
            "relSelfParam": {
              "$typeName": "google.protobuf.Value",
              "kind": {
                "case": "structValue",
                "value": {
                  "$typeName": "google.protobuf.Struct",
                  "fields": {
                    "[@error]": {
                      "$typeName": "google.protobuf.Value",
                      "kind": {
                        "case": "structValue",
                        "value": {
                          "$typeName": "google.protobuf.Struct",
                          "fields": {},
                        },
                      },
                    },
                    "code": {
                      "$typeName": "google.protobuf.Value",
                      "kind": {
                        "case": "stringValue",
                        "value": "FAILED_PRECONDITION",
                      },
                    },
                    "details": {
                      "$typeName": "google.protobuf.Value",
                      "kind": {
                        "case": "listValue",
                        "value": {
                          "$typeName": "google.protobuf.ListValue",
                          "values": [],
                        },
                      },
                    },
                    "message": {
                      "$typeName": "google.protobuf.Value",
                      "kind": {
                        "case": "stringValue",
                        "value": "[failed_precondition] Relation error",
                      },
                    },
                    "path": {
                      "$typeName": "google.protobuf.Value",
                      "kind": {
                        "case": "stringValue",
                        "value": "",
                      },
                    },
                  },
                },
              },
            },
            "scalars": {
              "$typeName": "google.protobuf.Value",
              "kind": {
                "case": "structValue",
                "value": {
                  "$typeName": "google.protobuf.Struct",
                  "fields": {
                    "fields": {
                      "$typeName": "google.protobuf.Value",
                      "kind": {
                        "case": "structValue",
                        "value": {
                          "$typeName": "google.protobuf.Struct",
                          "fields": {
                            "str": {
                              "$typeName": "google.protobuf.Value",
                              "kind": {
                                "case": "stringValue",
                                "value": "foo",
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "method": "spec.AllService.CreateAll",
    "schema": {
      "$typeName": "buf.knit.gateway.v1alpha1.Schema",
      "fields": [
        {
          "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
          "jsonName": "",
          "name": "scalars",
          "type": {
            "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
            "value": {
              "case": "message",
              "value": {
                "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                "fields": [
                  {
                    "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                    "jsonName": "",
                    "name": "fields",
                    "type": {
                      "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                      "value": {
                        "case": "message",
                        "value": {
                          "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                          "fields": [
                            {
                              "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                              "jsonName": "",
                              "name": "str",
                              "type": {
                                "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                                "value": {
                                  "case": "scalar",
                                  "value": 9,
                                },
                              },
                            },
                          ],
                          "name": "spec.ScalarFields",
                        },
                      },
                    },
                  },
                ],
                "name": "spec.Scalar",
              },
            },
          },
        },
        {
          "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
          "jsonName": "",
          "name": "relSelfParam",
          "type": {
            "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
            "value": {
              "case": "message",
              "value": {
                "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                "fields": [
                  {
                    "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                    "jsonName": "",
                    "name": "scalars",
                    "type": {
                      "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                      "value": {
                        "case": "message",
                        "value": {
                          "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                          "fields": [
                            {
                              "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                              "jsonName": "",
                              "name": "fields",
                              "type": {
                                "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                                "value": {
                                  "case": "message",
                                  "value": {
                                    "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                                    "fields": [
                                      {
                                        "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                                        "jsonName": "",
                                        "name": "str",
                                        "type": {
                                          "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                                          "value": {
                                            "case": "scalar",
                                            "value": 9,
                                          },
                                        },
                                      },
                                    ],
                                    "name": "spec.ScalarFields",
                                  },
                                },
                              },
                            },
                          ],
                          "name": "spec.Scalar",
                        },
                      },
                    },
                  },
                ],
                "name": "spec.All",
              },
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
      expect(response.responses).toMatchInlineSnapshot(`
[
  {
    "$typeName": "buf.knit.gateway.v1alpha1.Response",
    "body": {
      "$typeName": "google.protobuf.Value",
      "kind": {
        "case": "structValue",
        "value": {
          "$typeName": "google.protobuf.Struct",
          "fields": {
            "[@error]": {
              "$typeName": "google.protobuf.Value",
              "kind": {
                "case": "structValue",
                "value": {
                  "$typeName": "google.protobuf.Struct",
                  "fields": {},
                },
              },
            },
            "code": {
              "$typeName": "google.protobuf.Value",
              "kind": {
                "case": "stringValue",
                "value": "FAILED_PRECONDITION",
              },
            },
            "details": {
              "$typeName": "google.protobuf.Value",
              "kind": {
                "case": "listValue",
                "value": {
                  "$typeName": "google.protobuf.ListValue",
                  "values": [],
                },
              },
            },
            "message": {
              "$typeName": "google.protobuf.Value",
              "kind": {
                "case": "stringValue",
                "value": "[failed_precondition] Relation error",
              },
            },
            "path": {
              "$typeName": "google.protobuf.Value",
              "kind": {
                "case": "stringValue",
                "value": "",
              },
            },
          },
        },
      },
    },
    "method": "spec.AllService.CreateAll",
    "schema": {
      "$typeName": "buf.knit.gateway.v1alpha1.Schema",
      "fields": [
        {
          "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
          "jsonName": "",
          "name": "relSelfParam",
          "type": {
            "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
            "value": {
              "case": "message",
              "value": {
                "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                "fields": [],
                "name": "spec.All",
              },
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
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"[failed_precondition] Relation error"`,
      );
    });
  });
  describe("listen", () => {
    test("default", async () => {
      await expect(async () => {
        const response = knitClient.listen({
          request: {
            method: `${AllService.typeName}.${AllService.method.streamAll.name}`,
            ...sharedRequest,
          },
        });
        for await (const next of response) {
          expect(next).toBe(true); // This must never be called.
        }
      }).rejects.toThrowErrorMatchingInlineSnapshot(
        `"[failed_precondition] Relation error"`,
      );
    });
    test("catch-source", async () => {
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
          expect(next.response).toMatchInlineSnapshot(`
{
  "$typeName": "buf.knit.gateway.v1alpha1.Response",
  "body": {
    "$typeName": "google.protobuf.Value",
    "kind": {
      "case": "structValue",
      "value": {
        "$typeName": "google.protobuf.Struct",
        "fields": {
          "relSelfParam": {
            "$typeName": "google.protobuf.Value",
            "kind": {
              "case": "structValue",
              "value": {
                "$typeName": "google.protobuf.Struct",
                "fields": {
                  "[@error]": {
                    "$typeName": "google.protobuf.Value",
                    "kind": {
                      "case": "structValue",
                      "value": {
                        "$typeName": "google.protobuf.Struct",
                        "fields": {},
                      },
                    },
                  },
                  "code": {
                    "$typeName": "google.protobuf.Value",
                    "kind": {
                      "case": "stringValue",
                      "value": "FAILED_PRECONDITION",
                    },
                  },
                  "details": {
                    "$typeName": "google.protobuf.Value",
                    "kind": {
                      "case": "listValue",
                      "value": {
                        "$typeName": "google.protobuf.ListValue",
                        "values": [],
                      },
                    },
                  },
                  "message": {
                    "$typeName": "google.protobuf.Value",
                    "kind": {
                      "case": "stringValue",
                      "value": "[failed_precondition] Relation error",
                    },
                  },
                  "path": {
                    "$typeName": "google.protobuf.Value",
                    "kind": {
                      "case": "stringValue",
                      "value": "",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  "method": "spec.AllService.StreamAll",
  "schema": {
    "$typeName": "buf.knit.gateway.v1alpha1.Schema",
    "fields": [
      {
        "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
        "jsonName": "",
        "name": "relSelfParam",
        "type": {
          "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
          "value": {
            "case": "message",
            "value": {
              "$typeName": "buf.knit.gateway.v1alpha1.Schema",
              "fields": [],
              "name": "spec.All",
            },
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
          method: `${AllService.typeName}.${AllService.method.streamAll.name}`,
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
  "$typeName": "buf.knit.gateway.v1alpha1.Response",
  "body": {
    "$typeName": "google.protobuf.Value",
    "kind": {
      "case": "structValue",
      "value": {
        "$typeName": "google.protobuf.Struct",
        "fields": {
          "[@error]": {
            "$typeName": "google.protobuf.Value",
            "kind": {
              "case": "structValue",
              "value": {
                "$typeName": "google.protobuf.Struct",
                "fields": {},
              },
            },
          },
          "code": {
            "$typeName": "google.protobuf.Value",
            "kind": {
              "case": "stringValue",
              "value": "FAILED_PRECONDITION",
            },
          },
          "details": {
            "$typeName": "google.protobuf.Value",
            "kind": {
              "case": "listValue",
              "value": {
                "$typeName": "google.protobuf.ListValue",
                "values": [],
              },
            },
          },
          "message": {
            "$typeName": "google.protobuf.Value",
            "kind": {
              "case": "stringValue",
              "value": "[failed_precondition] Relation error",
            },
          },
          "path": {
            "$typeName": "google.protobuf.Value",
            "kind": {
              "case": "stringValue",
              "value": "",
            },
          },
        },
      },
    },
  },
  "method": "spec.AllService.StreamAll",
  "schema": {
    "$typeName": "buf.knit.gateway.v1alpha1.Schema",
    "fields": [
      {
        "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
        "jsonName": "",
        "name": "scalars",
        "type": {
          "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
          "value": {
            "case": "message",
            "value": {
              "$typeName": "buf.knit.gateway.v1alpha1.Schema",
              "fields": [
                {
                  "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                  "jsonName": "",
                  "name": "fields",
                  "type": {
                    "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                    "value": {
                      "case": "message",
                      "value": {
                        "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                        "fields": [
                          {
                            "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                            "jsonName": "",
                            "name": "str",
                            "type": {
                              "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                              "value": {
                                "case": "scalar",
                                "value": 9,
                              },
                            },
                          },
                        ],
                        "name": "spec.ScalarFields",
                      },
                    },
                  },
                },
              ],
              "name": "spec.Scalar",
            },
          },
        },
      },
      {
        "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
        "jsonName": "",
        "name": "relSelfParam",
        "type": {
          "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
          "value": {
            "case": "message",
            "value": {
              "$typeName": "buf.knit.gateway.v1alpha1.Schema",
              "fields": [
                {
                  "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                  "jsonName": "",
                  "name": "scalars",
                  "type": {
                    "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                    "value": {
                      "case": "message",
                      "value": {
                        "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                        "fields": [
                          {
                            "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                            "jsonName": "",
                            "name": "fields",
                            "type": {
                              "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                              "value": {
                                "case": "message",
                                "value": {
                                  "$typeName": "buf.knit.gateway.v1alpha1.Schema",
                                  "fields": [
                                    {
                                      "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field",
                                      "jsonName": "",
                                      "name": "str",
                                      "type": {
                                        "$typeName": "buf.knit.gateway.v1alpha1.Schema.Field.Type",
                                        "value": {
                                          "case": "scalar",
                                          "value": 9,
                                        },
                                      },
                                    },
                                  ],
                                  "name": "spec.ScalarFields",
                                },
                              },
                            },
                          },
                        ],
                        "name": "spec.Scalar",
                      },
                    },
                  },
                },
              ],
              "name": "spec.All",
            },
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
  expect(headers.get("Custom-Header")).toEqual("Custom-Value");
}

function expectOperation(headers: Headers, operation: string) {
  // Multiple headers with same key are combined into one by joining them using `, `
  const operations = headers.get("Knit-Operations")?.split(", ");
  try {
    expect(operations?.[operations?.length - 1]).toEqual(operation);
    expect(operations?.[0]).toMatch(
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
