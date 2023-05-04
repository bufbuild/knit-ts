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

const aliasSymbol = Symbol("alias");

/**
 * Alias is the type expected by a parameter field that uses a custom json name.
 *
 * @see {@link alias} to create one.
 *
 * @internal
 * @param K is always a literal string
 */
export type Alias<K extends string, V> = {
  [aliasSymbol]: K;
  value: V;
};

/**
 * Parameter fields that use a custom {@link https://protobuf.com/docs/language-spec#pseudo-options | json_name}
 * option expect a special type. This is needed to determine the special name. This function can be used
 * to create the special type.
 *
 * @example
 * For the following protobuf code:
 * ```protobuf
 * message Example {
 *    int32 field = 1 [json_name = "someName"];
 * }
 * ```
 *  We would pass a parameter value of 123 for `field` like so:
 * ```ts
 * const example: Parameter<Example> = {
 *  field: alias("someName", 123),
 * };
 * ```
 *
 * @remarks
 *
 * The generated type exactly matches the custom `json_name` option. This eliminates typos and the need to
 * refer to the sources/generated code as it will result in a compile time error in TypeScript.
 *
 * We expect the `json_name` option usage to be minimal. If that is not the case we are open to exploring
 * alternatives.
 *
 * @param k The custom json name of the field.
 * @param v The value of the field.
 * @returns The aliased field.
 *
 * @privateRemarks
 *
 * This is needed to support the Json interop with protobuf's Json mapping. If we ever decide on a fully custom
 * Json mapping for Knit this will no longer be needed.
 */
export function alias<K extends string, V>(k: K, v: V): Alias<K, V> {
  return {
    [aliasSymbol]: k,
    value: v,
  };
}

/**
 * Checks if an object is an `Alias` and returns the alias and value.
 *
 * @internal
 */
export function getAlias(
  v: object
): { alias: string; value: unknown } | undefined {
  if (!(aliasSymbol in v && "value" in v)) {
    return undefined;
  }
  return { alias: v[aliasSymbol] as string, value: v["value"] };
}
