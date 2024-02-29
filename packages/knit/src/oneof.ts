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

import type { AnyQuery } from "./protocol.js";
import type { AnyRecord, OneOrMore } from "./utils/types.js";

/**
 * Represents a Oneof type.
 *
 * The type has `@case` and `value` fields. `@case`
 * is the name of the field that is set, and `value` is the corresponding value.
 *
 * This can be used in a switch statement exhaustively check all possible cases.
 *
 * @remarks
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
 * We use the '@case' to identify oneofs at runtime. This is needed for parameter types, to make the result and parameter
 * types interoperable we also return the result with these same field keys.
 */
export type Oneof<T extends AnyRecord> = {
  [K in keyof T]-?: {
    "@case": K;
    value: T[K];
  };
}[keyof T];

/**
 * Checks if an object is a `OneofQuery`.
 *
 * @internal
 */
export function isOneofQuery(v: object): v is { "@oneof": AnyQuery } {
  return "@oneof" in v;
}

/**
 * Returns the object as a {@link Oneof} if it is one or `undefined`.
 *
 * @internal
 */
export function getOneof(
  v: object,
): { "@case": string; value: unknown } | undefined {
  if ("@case" in v) {
    return v as Oneof<Record<string, unknown>>;
  }
  return undefined;
}

/**
 * The type of the oneof query.
 *
 * @internal
 */
export type OneofQuery<T extends AnyRecord> = {
  "@oneof": OneOrMore<T>;
};
