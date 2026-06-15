import { describe, expect, test } from "@jest/globals";
import { createClientWithTransport } from "./client.js";
import {
  type HandlerContext,
  createRouterTransport,
} from "@connectrpc/connect";
import type { AllService } from "@bufbuild/knit-test-spec/spec/all_knit.js";
import { AllSchema, type All } from "@bufbuild/knit-test-spec/spec/all_pb.js";
import {
  KnitService,
  FetchResponseSchema,
  SchemaSchema,
  Schema_Field_Type_ScalarType,
  type ListenRequest,
  type Request as KnitRequest,
} from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import { type MessageInitShape, fromJson, toJson } from "@bufbuild/protobuf";
import { ValueSchema } from "@bufbuild/protobuf/wkt";
import {
  ScalarSchema,
  ScalarFieldsSchema,
} from "@bufbuild/knit-test-spec/spec/scalars_pb.js";
import type { Query } from "./schema.js";

describe("client", () => {
  const schema: MessageInitShape<typeof SchemaSchema> = {
    name: AllSchema.typeName,
    fields: [
      {
        name: "scalars",
        type: {
          value: {
            case: "message",
            value: {
              name: ScalarSchema.typeName,
              fields: [
                {
                  name: "fields",
                  type: {
                    value: {
                      case: "message",
                      value: {
                        name: ScalarFieldsSchema.typeName,
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
    { requests }: { requests: KnitRequest[] },
    { requestHeader }: HandlerContext,
  ): MessageInitShape<typeof FetchResponseSchema> => {
    expect(requests).toHaveLength(1);
    expect(toJson(ValueSchema, requests[0].body!)).toEqual(request);
    expect(requestHeader.get(headerKey)).toEqual(headerValue);
    return {
      responses: [
        {
          body: fromJson(ValueSchema, response),
          schema: schema,
          method: requests[0].method,
        },
      ],
    };
  };
  const client = createClientWithTransport<AllService>(
    createRouterTransport(({ service }) => {
      service(KnitService, {
        fetch: unary as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        do: unary as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        async *listen(
          { request: actualRequest }: ListenRequest,
          { requestHeader }: HandlerContext,
        ) {
          expect(requestHeader.get(headerKey)).toEqual(headerValue);
          expect(
            actualRequest?.body !== undefined
              ? toJson(ValueSchema, actualRequest.body)
              : undefined,
          ).toEqual(request);
          for (let i = 0; i < 5; i++) {
            yield {
              response: {
                body: fromJson(ValueSchema, response),
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
