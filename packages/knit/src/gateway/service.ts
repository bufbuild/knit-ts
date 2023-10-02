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
  type HandlerContext,
  type ServiceImpl,
  type Transport,
} from "@connectrpc/connect";
import { KnitService } from "@buf/bufbuild_knit.connectrpc_es/buf/knit/gateway/v1alpha1/knit_connect.js";
import {
  DoResponse,
  FetchResponse,
  ListenResponse,
  Request,
  Response,
  Schema,
} from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import {
  createGateway,
  type Gateway,
  type ResolverContext,
} from "./gateway.js";
import {
  Value,
  MethodKind,
  MethodIdempotency,
  type PartialMessage,
  type PlainMessage,
  type AnyMessage,
  type IMessageTypeRegistry,
  type JsonValue,
} from "@bufbuild/protobuf";
import { computeSchema } from "./schema.js";
import {
  formatError,
  formatMessage,
  type ErrorPatch,
  shouldCatch,
} from "./json.js";
import { makeOutboundHeader } from "./headers.js";
import { stitch } from "./stitch.js";
import { min } from "./util.js";

const doOperation = `${KnitService.typeName}.${KnitService.methods.do.name}`;
const fetchOperation = `${KnitService.typeName}.${KnitService.methods.fetch.name}`;
const listenOperation = `${KnitService.typeName}.${KnitService.methods.listen.name}`;

/**
 * Options accepted by {@link createKnitService}.
 */
export interface CreateKnitServiceOptions {
  /**
   * The transport to use for forwarding requests to endpoints.
   *
   * This can be overridden at the service/method level.
   */
  transport: Transport;
  /**
   * The type registry to use for encoding/decoding messages.
   */
  typeRegistry?: IMessageTypeRegistry;
  /**
   * The default timeout in millisecond for RPC calls.
   *
   * This can be overbidden at the service/method level.
   */
  timeoutMs?: number;
  /**
   *  Callback to configure the services and relations to expose.
   *
   * @example
   * ```ts
   *     createKnitService({
   *       transport: transport,
   *       configure({service, relation}) {
   *          service(ElizaService);
   *          ....
   *       },
   *     })
   * ```
   */
  configure: (gateway: Gateway) => void;
}

/**
 * Creates the handler for {@link KnitService} that can be used with {@link @bufbuild/connect#ConnectRouter}.
 *
 * @example
 * ```ts
 * export default function (router: ConnectRouter) {
 *   router.service(
 *     KnitService,
 *     createKnitService({
 *       transport: transport,
 *       configure({service, relation}) {
 *          service(ElizaService);
 *          ....
 *       },
 *     })
 *   );
 * }
 * ```
 */
export function createKnitService({
  transport,
  timeoutMs,
  configure,
  typeRegistry,
}: CreateKnitServiceOptions): ServiceImpl<typeof KnitService> {
  const gateway = createGateway({ transport, timeoutMs });
  configure(gateway);
  const schemaCache = new Map<string, PlainMessage<Schema>>();
  return {
    async do({ requests }, context) {
      return new DoResponse({
        responses: await handleUnary(
          gateway,
          requests,
          context,
          false,
          typeRegistry,
          schemaCache,
        ),
      });
    },
    async fetch({ requests }, context) {
      return new FetchResponse({
        responses: await handleUnary(
          gateway,
          requests,
          context,
          true,
          typeRegistry,
          schemaCache,
        ),
      });
    },
    async *listen({ request }, context) {
      const iterable = await handleStream(
        gateway,
        request,
        context,
        typeRegistry,
        schemaCache,
      );
      for await (const response of iterable) {
        yield new ListenResponse({ response });
      }
    },
  };
}

async function handleUnary(
  { entryPoints, relations }: Gateway,
  requests: Request[],
  context: HandlerContext,
  forFetch: boolean,
  typeRegistry: IMessageTypeRegistry | undefined,
  schemaCache: Map<string, PlainMessage<Schema>>,
): Promise<PartialMessage<Response>[]> {
  // TODO: Create a typeRegistry for the schema and use that if
  // typeRegistry is not provided. It is not sound, but it should be good enough.
  if (requests.length === 0) {
    throw new ConnectError(`No requests provided`, Code.InvalidArgument);
  }
  // Fetch does not use catch as the fallback, but Do does.
  const fallbackCatch = !forFetch;
  const headers = makeOutboundHeader(context.requestHeader);
  const results: Promise<PartialMessage<Response>>[] = [];
  for (const request of requests) {
    const entryPoint = entryPoints.get(request.method);
    if (entryPoint === undefined) {
      throw new ConnectError(`Method not found`, Code.NotFound);
    }
    if (entryPoint.method.kind !== MethodKind.Unary) {
      throw new ConnectError(
        `Only unary methods in "Fetch"/"Do"`,
        Code.InvalidArgument,
      );
    }
    if (
      forFetch &&
      entryPoint.method.idempotency !== MethodIdempotency.NoSideEffects
    ) {
      throw new ConnectError(
        `Only methods with idempotency_level set to NO_SIDE_EFFECTS are allowed in "Fetch"`,
        Code.InvalidArgument,
      );
    }
    const schema = computeSchema(
      entryPoint.method.O,
      request.mask,
      request.method,
      relations,
      schemaCache,
      [
        forFetch ? fetchOperation : doOperation,
        `${entryPoint.service.typeName}.${entryPoint.method.name}`,
      ],
    );
    results.push(
      (async () => {
        let message: AnyMessage;
        try {
          const response = await entryPoint.transport.unary(
            entryPoint.service,
            entryPoint.method,
            context.signal,
            min(context.timeoutMs(), entryPoint.timeoutMs),
            headers,
            entryPoint.method.I.fromJson(request.body?.toJson() ?? {}),
          );
          message = response.message;
        } catch (err) {
          if (!shouldCatch(request.onError, fallbackCatch)) {
            throw err;
          }
          return {
            body: Value.fromJson(
              formatError(err, request.method, typeRegistry),
            ),
            method: request.method,
            schema: schema,
          };
        }
        return await makeResponse(
          request,
          schema,
          message,
          fallbackCatch,
          typeRegistry,
          { headers, signal: context.signal, timeoutMs: context.timeoutMs() },
        );
      })(),
    );
  }
  return await Promise.all(results);
}

async function handleStream(
  { entryPoints, relations }: Gateway,
  request: Request | undefined,
  context: HandlerContext,
  typeRegistry: IMessageTypeRegistry | undefined,
  schemaCache: Map<string, PlainMessage<Schema>>,
): Promise<AsyncIterable<PartialMessage<Response>>> {
  if (request === undefined) {
    throw new ConnectError(`No request provided`, Code.InvalidArgument);
  }
  const entryPoint = entryPoints.get(request.method);
  if (entryPoint === undefined) {
    throw new ConnectError(`Method not found`, Code.NotFound);
  }
  if (entryPoint.method.kind !== MethodKind.ServerStreaming) {
    throw new ConnectError(
      `Only server streaming endpoints are allowed in "Listen"`,
      Code.InvalidArgument,
    );
  }
  const schema = computeSchema(
    entryPoint.method.O,
    request.mask,
    request.method,
    relations,
    schemaCache,
    [
      listenOperation,
      `${entryPoint.service.typeName}.${entryPoint.method.name}`,
    ],
  );
  const headers = makeOutboundHeader(context.requestHeader);
  const { message: messageIt } = await entryPoint.transport.stream(
    entryPoint.service,
    entryPoint.method,
    context.signal,
    min(context.timeoutMs(), entryPoint.timeoutMs),
    headers,
    (async function* () {
      // eslint-disable-line @typescript-eslint/require-await
      yield entryPoint.method.I.fromJson(request.body?.toJson() ?? {});
    })(),
  );
  return (async function* () {
    // TODO: Abort the stream when this function is complete.
    let schemaSent = false;
    for await (const message of messageIt) {
      const response = await makeResponse(
        request,
        schema,
        message,
        false,
        typeRegistry,
        { headers, signal: context.signal, timeoutMs: context.timeoutMs() },
      );
      if (schemaSent) {
        delete response.schema;
      } else {
        schemaSent = true;
      }
      yield response;
    }
  })();
}

async function makeResponse(
  request: Request,
  schema: PlainMessage<Schema>,
  responseMessage: AnyMessage,
  fallbackCatch: boolean,
  typeRegistry: IMessageTypeRegistry | undefined,
  context: ResolverContext,
): Promise<PartialMessage<Response>> {
  const target: { body?: JsonValue } = {};
  let errorPatch: ErrorPatch | undefined = undefined;
  if (shouldCatch(request.onError, fallbackCatch)) {
    errorPatch = {
      target: target,
      name: "body",
    };
  }
  const [result, patches] = formatMessage(
    responseMessage,
    schema,
    errorPatch,
    fallbackCatch,
    typeRegistry,
  );
  await stitch(patches, fallbackCatch, typeRegistry, context);
  return {
    method: request.method,
    body: Value.fromJson(target.body ?? result),
    schema: schema,
  };
}
