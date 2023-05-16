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
  type ServiceImpl,
  type Transport,
} from "@bufbuild/connect";
import { createAsyncIterable, pipe } from "@bufbuild/connect/protocol";
import type { KnitService } from "@buf/bufbuild_knit.bufbuild_connect-es/buf/knit/gateway/v1alpha1/knit_connect.js";
import {
  DoResponse,
  FetchResponse,
  ListenResponse,
  Request,
  Response,
  Schema,
} from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import { createGateway, type Gateway } from "./gateway.js";
import {
  Value,
  MethodKind,
  MethodIdempotency,
  type PartialMessage,
  type PlainMessage,
  type AnyMessage,
  type IMessageTypeRegistry,
} from "@bufbuild/protobuf";
import { computeSchema } from "./schema.js";
import { formatMessage } from "./json.js";
import { makeOutboundHeader } from "./headers.js";
import { stitch } from "./stitch.js";

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
  return {
    async do({ requests }, { requestHeader }) {
      return new DoResponse({
        responses: await handleUnary(
          gateway,
          requests,
          requestHeader,
          typeRegistry
        ),
      });
    },
    async fetch({ requests }, { requestHeader }) {
      return new FetchResponse({
        responses: await handleUnary(
          gateway,
          requests,
          requestHeader,
          typeRegistry,
          true
        ),
      });
    },
    async *listen({ request }, { requestHeader }) {
      const iterable = await handleStream(
        gateway,
        request,
        requestHeader,
        typeRegistry
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
  requestHeader: Headers,
  typeRegistry?: IMessageTypeRegistry,
  forFetch?: boolean
): Promise<PartialMessage<Response>[]> {
  // TODO: Create a typeRegistry for the schema and use that if
  // typeRegistry is not provided. It is not sound, but it should be good enough.
  if (requests.length === 0) {
    throw new ConnectError(`No requests provided`, Code.InvalidArgument);
  }
  const outboundHeader = makeOutboundHeader(requestHeader);
  const results: Promise<PartialMessage<Response>>[] = [];
  for (const request of requests) {
    const entryPoint = entryPoints.get(request.method);
    if (entryPoint === undefined) {
      throw new ConnectError(`Method not found`, Code.NotFound);
    }
    if (entryPoint.method.kind !== MethodKind.Unary) {
      throw new ConnectError(
        `Only unary methods in "Fetch"/"Do"`,
        Code.InvalidArgument
      );
    }
    if (
      forFetch === true &&
      entryPoint.method.idempotency !== MethodIdempotency.NoSideEffects
    ) {
      throw new ConnectError(
        `Only methods with idempotency_level set to NO_SIDE_EFFECTS are allowed in "Fetch"`,
        Code.InvalidArgument
      );
    }
    const schema = computeSchema(
      entryPoint.method.O,
      request.mask,
      request.method,
      relations
    );
    results.push(
      (async () => {
        const { message } = await entryPoint.transport.unary(
          entryPoint.service,
          entryPoint.method,
          undefined, // TODO: Add abort signal if possible.
          entryPoint.timeoutMs,
          outboundHeader,
          entryPoint.method.I.fromJson(request.body?.toJson() ?? {})
        );
        return await makeResponse(request, schema, message, typeRegistry);
      })()
    );
  }
  return await Promise.all(results);
}

async function handleStream(
  { entryPoints, relations }: Gateway,
  request: Request | undefined,
  requestHeader: Headers,
  typeRegistry?: IMessageTypeRegistry
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
      Code.InvalidArgument
    );
  }
  const schema = computeSchema(
    entryPoint.method.O,
    request.mask,
    request.method,
    relations
  );
  const { message } = await entryPoint.transport.stream(
    entryPoint.service,
    entryPoint.method,
    undefined, // TODO: Add abort signal if possible.
    entryPoint.timeoutMs,
    makeOutboundHeader(requestHeader),
    createAsyncIterable([
      entryPoint.method.I.fromJson(request.body?.toJson() ?? {}),
    ])
  );
  return pipe(
    message,
    async function* (messageIterable) {
      for await (const message of messageIterable) {
        yield await makeResponse(request, schema, message, typeRegistry);
      }
    },
    {
      propagateDownStreamError: true,
    }
  );
}

async function makeResponse(
  request: Request,
  schema: PlainMessage<Schema>,
  responseMessage: AnyMessage,
  typeRegistry?: IMessageTypeRegistry
): Promise<PartialMessage<Response>> {
  const [result, patches] = formatMessage(
    responseMessage,
    schema,
    typeRegistry
  );
  await stitch(patches, typeRegistry);
  return {
    method: request.method,
    body: Value.fromJson(result),
    schema: schema,
  };
}
