import { describe, expect, test } from "@jest/globals";
import { createClientWithTransport } from "./client.js";
import {
  type HandlerContext,
  createRouterTransport,
} from "@connectrpc/connect";
import type { AllService } from "@bufbuild/knit-test-spec/spec/all_knit.js";
import { All } from "@bufbuild/knit-test-spec/spec/all_pb.js";
import { KnitService } from "@buf/bufbuild_knit.connectrpc_es/buf/knit/gateway/v1alpha1/knit_connect.js";
import { type PartialMessage, Value } from "@bufbuild/protobuf";
import {
  FetchRequest,
  FetchResponse,
  Schema,
  Schema_Field_Type_ScalarType,
} from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import {
  Scalar,
  ScalarFields,
} from "@bufbuild/knit-test-spec/spec/scalars_pb.js";
import type { Query } from "./schema.js";

describe("client", () => {
  const schema: PartialMessage<Schema> = {
    name: All.typeName,
    fields: [
      {
        name: "scalars",
        type: {
          value: {
            case: "message",
            value: {
              name: Scalar.typeName,
              fields: [
                {
                  name: "fields",
                  type: {
                    value: {
                      case: "message",
                      value: {
                        name: ScalarFields.typeName,
                        fields: [
                          {
                            name: "str",
                            type: {
                              value: {
                                case: "scalar",
                                value: Schema_Field_Type_ScalarType.STRING,
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    ],
  };
  const request = {
    scalars: { fields: { str: "request" } },
  };
  const response = {
    scalars: { fields: { str: "response" } },
  };
  const headerKey = "Authorization";
  const headerValue = "some-token";
  const unary = (
    { requests }: FetchRequest,
    { requestHeader }: HandlerContext,
  ): PartialMessage<FetchResponse> => {
    expect(requests).toHaveLength(1);
    expect(requests[0].body?.toJson()).toEqual(request);
    expect(requestHeader.get(headerKey)).toEqual(headerValue);
    return {
      responses: [
        {
          body: Value.fromJson(response),
          schema: schema,
          method: requests[0].method,
        },
      ],
    };
  };
  const client = createClientWithTransport<AllService>(
    createRouterTransport(({ service }) => {
      service(KnitService, {
        fetch: unary,
        do: unary,
        async *listen(
          { request: actualRequest },
          { requestHeader }: HandlerContext,
        ) {
          expect(requestHeader.get(headerKey)).toEqual(headerValue);
          expect(actualRequest?.body?.toJson()).toEqual(request);
          for (let i = 0; i < 5; i++) {
            yield {
              response: {
                body: Value.fromJson(response),
                schema: schema,
                method: actualRequest?.method,
              },
            };
          }
        },
      });
    }),
    { headers: { [headerKey]: headerValue } },
  );
  const allQuery = {
    scalars: {
      fields: {
        str: {},
      },
    },
  } satisfies Query<All>;
  test("fetch", async () => {
    const fetchResponse = await client.fetch({
      "spec.AllService": {
        getAll: {
          $: request,
          ...allQuery,
        },
      },
    });
    expect(fetchResponse["spec.AllService"].getAll).toEqual(response);
  });
  test("do", async () => {
    const fetchResponse = await client.do({
      "spec.AllService": {
        createAll: {
          $: request,
          ...allQuery,
        },
      },
    });
    expect(fetchResponse["spec.AllService"].createAll).toEqual(response);
  });
  test("listen", async () => {
    const listenResponse = client.listen({
      "spec.AllService": {
        streamAll: {
          $: request,
          ...allQuery,
        },
      },
    });
    let count = 0;
    for await (const next of listenResponse) {
      expect(next["spec.AllService"].streamAll).toEqual(response);
      count++;
    }
    expect(count).toBe(5);
  });
});
