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

import type { AnyRecord, ExactlyOne, OneOrMore } from "./utils/types.js";

const oneOfSymbol = Symbol("oneof");

/**
 * Represents a Oneof type.
 *
 * The type has `case` and `value` getters. `case`
 * is the name of the field that is set, and `value` is the corresponding value.
 *
 * This can be used in a switch statement exhaustively check all possible cases.
 *
 * @remarks
 *
 * This type can be passed to a {@link https://www.npmjs.com/package/@bufbuild/protobuf | @bufbuild/protobuf }'s
 * `Message` constructor that expects a oneof field. The inverse is not possible. To make a `Oneof` use {@link makeOneof}.
 *
 * @example
 * Here's an example of using it in a switch case:
 * ```ts
 * let result: Oneof<{value: number; error: string}>;
 *
 * switch(result.case) {
 *  case "value":
 *    console.log(`The result is ${result.value}`);
 *                                     // ^? number
 *    break;
 *  case "error":
 *    throw new Error(result.value);
 *                        // ^? string
 * }
 * ```
 *
 * @privateRemarks
 *
 * We use the symbol identify oneofs at runtime. This is needed for parameter types, to make the result and parameter
 * types interoperable we also return the result with the symbol set.
 */
export type Oneof<T extends AnyRecord> = {
  [K in keyof T]-?: {
    [oneOfSymbol]: "result";
    get case(): K;
    get value(): T[K];
  };
}[keyof T];

/**
 * Used to query oneof fields.
 *
 * @example
 * Here's an example of querying oneof fields:
 * ```ts
 * client.fetch({
 *  "pet.v1.PetService": {
 *    getPet: {
 *      $: {},
 *      pet: {
 *        // Only oneof the following will be fetched.
 *        order: oneof({
 *          stripe: {},
 *          apple: {},
 *        })
 *      }
 *    }
 *  }
 * })
 * ```
 */
export function oneof<T extends AnyRecord>(value: OneOrMore<T>): OneofQuery<T> {
  return {
    [oneOfSymbol]: "query",
    ...value,
  };
}

/**
 * Creates a new {@link Oneof}.
 *
 * @example
 * ```ts
 * type Result = Oneof<{value: number; error: string;}>;
 *
 * let result = makeOneof<Result>({
 *   value: 1,
 * })
 *
 * result = makeOneof<Result>({
 *   error: "error",
 * })
 *
 * \@ts-expect-error
 * result = makeOneof<Result>({
 *   value: 1,
 *   error: "error",
 * })
 * ```
 */
export function makeOneof<T extends AnyRecord>(value: ExactlyOne<T>): Oneof<T> {
  const keys = Object.keys(value);
  if (keys.length !== 1)
    throw new Error("Oneof should have exactly one value set");
  const key = keys[0];
  return {
    [oneOfSymbol]: "result",
    get ["case"]() {
      return key;
    },
    get value() {
      return value[key];
    },
  };
}

/**
 * Checks if an object is a `OneofQuery`.
 *
 * @internal
 */
export function isOneofQuery(v: object) {
  return oneOfSymbol in v && v[oneOfSymbol] === "query";
}

/**
 * Returns the object as a {@link Oneof} if it is one or `undefined`.
 *
 * @internal
 */
export function getOneof(
  v: object
): { case: string; value: unknown } | undefined {
  if (!(oneOfSymbol in v && v[oneOfSymbol] === "result")) {
    return undefined;
  }
  return v as Oneof<Record<string, unknown>>;
}

/**
 * The type of the oneof query.
 *
 * @internal
 */
export type OneofQuery<T extends AnyRecord> = {
  [oneOfSymbol]: "query";
} & OneOrMore<T>;
