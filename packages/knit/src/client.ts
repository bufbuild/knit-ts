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

import { createConnectTransport } from "@connectrpc/connect-web";
import {
  createPromiseClient,
  type PromiseClient,
  type Transport,
} from "@connectrpc/connect";
import type {
  DoQuery,
  DoSchema,
  ErrorStrategyCatch,
  ErrorStrategyThrow,
  FetchQuery,
  FetchSchema,
  ListenQuery,
  ListenSchema,
  Mask,
  Schema,
} from "./schema.js";

import type { Subset } from "./utils/types.js";
import { KnitService } from "@buf/bufbuild_knit.connectrpc_es/buf/knit/gateway/v1alpha1/knit_connect.js";
import {
  makeRequests,
  makeResult,
  makeResultIterable,
  type AnyQuery,
} from "./protocol.js";
import { knitErrorFromReason } from "./error.js";

/**
 * The Knit client. Used to send Knit queries to a Knit gateway and deserialize the
 * responses.
 *
 * It operates on a Knit Schema type, acquired from the `protoc-gen-knit-es` plugin. For more on
 * generating a schema see {@lint https://github.com/bufbuild/knit-web/blob/main/docs/generated-code.md "Generated Code"}.
 *
 * It has 3 methods, all of them are similar with only semantic differences. They send a Knit
 * query and return the masked result.
 *
 * @example
 * Here's an example demonstrating basic usage:
 * ```ts
 * import type { FooService } from './gen/foo/v1/foo_knit.js';
 * import { createClient } from '@bufbuild/knit';
 *
 * const client = createClient<FooService>({baseUrl: "https://..."})
 *
 * const response = await client.fetch({
 *    "foo.v1.FooService": {
 *      getFoo: {
 *        $: { id: 1 },
 *        foo {
 *          name: {},
 *        }
 *      }
 *    }
 * })
 *
 * console.log(response["foo.v1.FooService"].getFoo.foo.name);
 * ```
 * @see {@link createClient}
 */
export interface Client<S extends Schema> {
  /**
   * Fetches the endpoints specified by the query. Uses `POST` for now, once connect
   * starts supporting `GET` requests, this will also start using `GET`.
   *
   * The default error strategy is to throw on errors. To catch errors, use the `@catch` decorator.
   *
   * @param query The query to fetch.
   */
  fetch<Q extends Subset<Q, FetchQuery<S>>>(
    query: Q,
  ): Promise<Mask<Q, FetchSchema<S>, ErrorStrategyThrow>>;
  /**
   * Similar to {@link Client.fetch | fetch } but uses `POST`. Should be used with state changing
   * operations such as Create, Update, Delete.
   *
   * The default error strategy is to catch errors and return them in the response.
   * To throw on errors, use the `@throw` decorator.
   *
   * @param query The query to execute.
   */
  do<Q extends Subset<Q, DoQuery<S>>>(
    query: Q,
  ): Promise<Mask<Q, DoSchema<S>, ErrorStrategyCatch>>;
  /**
   * Similar to {@link Client.fetch} but works on server streaming methods.
   *
   * The default error strategy is to throw on errors. To catch errors, use the `@catch` decorator.
   *
   * @param query The query to fetch.
   * @returns An {@link AsyncIterable} of the expected result of the query.
   */
  listen<Q extends Subset<Q, ListenQuery<S>>>(
    query: Q,
  ): AsyncIterable<Mask<Q, ListenSchema<S>, ErrorStrategyThrow>>;
}

/**
 * Options used to configure the client.
 *
 * @see {@link createClient}
 * @see {@link Client}
 */
export interface Options {
  /**
   * Base URI for the Knit Gateway.
   *
   * Requests will be made to <baseUrl>/buf.knit.KnitService/<method>
   *
   * Example: `baseUrl: "https://example.com/my-api"`
   *
   * This will make a `POST /my-api/buf.knit.KnitService/Fetch` to
   * `example.com` via HTTPS.
   */
  baseUrl: string;
  /**
   * Controls what the fetch client will do with credentials, such as
   * Cookies. The default value is "same-origin". For reference, see
   * https://fetch.spec.whatwg.org/#concept-request-credentials-mode
   */
  credentials?: RequestCredentials;
  /**
   * The default headers to send with each request.
   *
   * Use this to set headers such as `Authorization` that
   * are common to all requests.
   */
  headers?: HeadersInit;
}

/**
 * Creates a {@link Client | Knit Client}.
 *
 * @example
 * Here's an example of client with a single service:
 * ```ts
 * import type { FooService } from './gen/foo/v1/foo_knit.js';
 * import { createClient } from '@bufbuild/knit';
 *
 * const client = createClient<FooService>({baseUrl: "https://..."})
 *
 * const response = await client.fetch({
 *      "foo.v1.FooService": {
 *          // Method calls
 *      }
 * })
 * ```
 * Here's an example of client for multiple services:
 * ```ts
 * import type { FooService } from './gen/foo/v1/foo_knit.js';
 * import type { BarService } from './gen/bar/v1/bar_knit.js';
 * import { createClient } from '@bufbuild/knit';
 *
 * // Create an intersection of both the types.
 * type Schema = FooService & BarService
 *
 * const client = createClient<Schema>({baseUrl: "https://..."})
 *
 * const response = await client.fetch({
 *      "foo.v1.FooService": {
 *          // Method calls
 *      },
 *      // Can also query BarService methods in the same query.
 *     "bar.v1.BarService": {
 *          // Method calls
 *      }
 * })
 * ```
 *
 * @param options The options used to configure the client see {@link Options}
 * @returns The Knit client see {@link Client}
 */
export function createClient<S extends Schema>(options: Options): Client<S> {
  return createClientWithTransport(
    createConnectTransport({
      baseUrl: options.baseUrl,
      credentials: options.credentials,
    }),
    options,
  );
}

/**
 * Creates a client with the given transport.
 *
 * Exported for testing.
 *
 * @internal
 */
export function createClientWithTransport<S extends Schema>(
  transport: Transport,
  options: OptionalOptions,
): Client<S> {
  const client = createPromiseClient(KnitService, transport);
  return {
    fetch: createFetch(client, options),
    do: createDo(client, options),
    listen: createListen(client, options),
  };
}

function createFetch<S extends Schema>(
  client: KnitServiceClient,
  options: OptionalOptions,
): Client<S>["fetch"] {
  return async function <Q extends Subset<Q, FetchQuery<S>>>(query: Q) {
    const [requests, oneofs] = makeRequests(query as AnyQuery);
    try {
      const { responses } = await client.fetch(
        { requests },
        { headers: options.headers },
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-return
      return makeResult(oneofs, responses) as any;
    } catch (reason) {
      throw knitErrorFromReason(reason);
    }
  };
}

function createDo<S extends Schema>(
  client: KnitServiceClient,
  options: OptionalOptions,
): Client<S>["do"] {
  return async function <Q extends Subset<Q, DoQuery<S>>>(query: Q) {
    const [requests, oneofs] = makeRequests(query as AnyQuery);
    try {
      const { responses } = await client.do(
        { requests },
        { headers: options.headers },
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-return
      return makeResult(oneofs, responses) as any;
    } catch (reason) {
      throw knitErrorFromReason(reason);
    }
  };
}

function createListen<S extends Schema>(
  client: KnitServiceClient,
  options: OptionalOptions,
): Client<S>["listen"] {
  return function <Q extends Subset<Q, ListenQuery<S>>>(query: Q) {
    const [requests, oneofs] = makeRequests(query as AnyQuery);
    if (requests.length !== 1) {
      throw new Error(
        `listen only accepts one request, got: ${requests.length}`,
      );
    }
    try {
      const responseIterable = client.listen(
        { request: requests[0] },
        { headers: options.headers },
      );
      return makeResultIterable(
        oneofs[0],
        responseIterable,
      ) as AsyncIterable<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    } catch (reason) {
      throw knitErrorFromReason(reason);
    }
  };
}

type KnitServiceClient = PromiseClient<typeof KnitService>;
type OptionalOptions = Omit<Options, "baseUrl" | "credentials">;
