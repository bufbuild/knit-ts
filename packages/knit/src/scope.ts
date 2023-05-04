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

/* eslint-disable @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-explicit-any */
import type { Schema } from "./schema.js";
import type { Client } from "./client.js";
import type { AnyQuery } from "./protocol.js";

/**
 * Scopes the client a package or package prefix.
 *
 * @example
 * ```ts
 * client.do({
 *  "com.example.foo.v1.FooService": {
 *      ...
 *  },
 *  "com.example.bar.v1.BarService": {
 *      ...
 *  },
 * });
 * // The above call can be simplified.
 * const scopedClient = makeScopedClient(client, "com.example");
 * // `com.example` is be omitted:
 * scopedClient.do({
 *  "foo.v1.FooService": {
 *      ...
 *  },
 *  "bar.v1.BarService": {
 *      ...
 *  },
 * });
 *
 *
 * ```
 * @param client Any Knit client.
 * @param scope The prefix to which to scope client.
 */
export function makeScopedClient<
  S extends Schema,
  P extends Split<Cast<keyof S, string>, ".">
>(client: Client<S>, scope: P): Client<Scope<S, P>> {
  return {
    fetch: async (query) => {
      return scopeResult(
        (await client.fetch(
          unscopeQuery(query as AnyQuery, scope) as any
        )) as any,
        scope
      ) as any;
    },
    do: async (query) => {
      return scopeResult(
        (await client.do(unscopeQuery(query as AnyQuery, scope) as any)) as any,
        scope
      ) as any;
    },
    listen: (query) => {
      const resultIterable = client.listen(
        unscopeQuery(query as AnyQuery, scope) as any
      );
      return scopeResultIterable(resultIterable as any, scope) as any;
    },
  };
}

async function* scopeResultIterable(
  result: AsyncIterable<{ [k: string]: unknown }>,
  scope: string
) {
  for await (const next of result) {
    yield scopeResult(next, scope);
  }
}

function unscopeQuery(scopedQuery: AnyQuery, scope: string): AnyQuery {
  const query: { [k: string]: any } = {};
  for (const [k, v] of Object.entries(scopedQuery)) {
    query[scope + "." + k] = v;
  }
  return query;
}

function scopeResult(result: { [k: string]: unknown }, scope: string) {
  const scopedResult: typeof result = {};
  for (const [k, v] of Object.entries(result as object)) {
    if (!k.startsWith(scope + ".")) {
      // Should not happen but could be another extension so we
      // just ignore.
      continue;
    }
    scopedResult[k.slice(scope.length + 1)] = v;
  }
  return scopedResult;
}

/**
 * For the string `com.example.foo.v1.FooService` as S and `.` as C, the expected
 * result is "com" | "com.example" | "com.example.foo" | "com.example.foo.v1"
 */
// prettier-ignore
type Split<
  S extends string,
  C extends string,
  P extends string = ""
> = 
  // Check to see if S has at least one `C` somewhere.
  // This always matches the first `C`.
  //
  // For com.example.foo.v1.FooService
  // L -> com
  // R -> example.foo.v1.FooService
  S extends `${infer L}${C}${infer R}`
    // Prefix `L` with `P`, for the first run P is always ''.
    //
    // For com.example.foo.v1.FooService
    // 
    // First iteration:
    // "com" | Split<"example.foo.v1.FooService", ".", "com.">
    //
    // Second iteration:
    // "com.example" | Split<"foo.v1.FooService", ".", "com.example.">    
    ? `${P}${L}` | Split<R, C, `${P}${L}${C}`>
    // Last iteration:
    // `never`. `|` with never is a noop.
    : never;

/**
 * Scope a Schema to only include services that have the prefix `P` and
 * strip `P` from their names.
 */
type Scope<S extends Schema, P extends string> = {
  [K in keyof S as K extends `${P}.${infer R}` ? R : never]: S[K];
};

/**
 * Useful to narrow the type.
 *
 * Eg: keyof T = string | number;
 *
 * But if we know that T will only have string keys or
 * if we only care about string keys. Cast<keyof T, string>
 * can be used to get a union of all the string keys.
 */
type Cast<T, V> = T extends V ? T : never;
