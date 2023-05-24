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

import { createPromiseClient, createRouterTransport } from "@bufbuild/connect";
import { describe, expect, test } from "@jest/globals";
import { createKnitService } from "./service.js";
import { AllService } from "@bufbuild/knit-test-spec/spec/all_connect.js";
import { AllResolverService } from "@bufbuild/knit-test-spec/spec/relations_connect.js";
import { All } from "@bufbuild/knit-test-spec/spec/all_pb.js";
import { Value } from "@bufbuild/protobuf";
import { KnitService } from "@buf/bufbuild_knit.bufbuild_connect-es/buf/knit/gateway/v1alpha1/knit_connect.js";
import { ListenResponse } from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";

describe("success", () => {
  const routerTransport = createRouterTransport(({ service }) => {
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
      async getAllRelSelfParam(request) {
        return {
          values: request.bases.map((base) => ({
            relSelfParam: base,
          })),
        };
      },
    });
  });
  const knitTransport = createRouterTransport(({ service }) => {
    const knitServiceHandler = createKnitService({
      transport: routerTransport,
      configure({ service, relation }) {
        service(AllService);
        relation(AllResolverService, {
          getAllRelSelfParam: { name: "rel_self_param" },
        });
      },
    });
    service(KnitService, {
      do: knitServiceHandler.do,
      fetch: knitServiceHandler.fetch,
      listen: knitServiceHandler.listen,
    });
  });
  const knitClient = createPromiseClient(KnitService, knitTransport);
  test("fetch", async () => {
    const response = await knitClient.fetch({
      requests: [
        {
          method: `${AllService.typeName}.${AllService.methods.getAll.name}`,
          body: Value.fromJson(
            new All({
              scalars: {
                fields: {
                  str: "fetch",
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
                    "str": "fetch",
                  },
                },
              },
              "scalars": {
                "fields": {
                  "str": "fetch",
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
          body: Value.fromJson(
            new All({
              scalars: {
                fields: {
                  str: "do",
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
                    "str": "do",
                  },
                },
              },
              "scalars": {
                "fields": {
                  "str": "do",
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
        body: Value.fromJson(
          new All({
            scalars: {
              fields: {
                str: "do",
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
                    "str": "do",
                  },
                },
              },
              "scalars": {
                "fields": {
                  "str": "do",
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
