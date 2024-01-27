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

import type { Oneof, OneofQuery } from "./oneof.js";
import type {
  AnyRecord,
  ExactlyOne,
  OneOrMore,
  ZeroOrOne,
} from "./utils/types.js";
import type { Alias } from "./alias.js";
import type { Struct, Value } from "./wkt/struct.js";
import type { Timestamp } from "./wkt/timestamp.js";
import type { Any } from "./wkt/any.js";
import type { Empty } from "./wkt/empty.js";
import type { Duration } from "./wkt/duration.js";
import type { FieldMask } from "./wkt/field_mask.js";
import type { KnitError } from "./error.js";

/**
 * Query type for scalar and wkt fields.
 *
 * Only possible value is `{}`.
 *
 * @privateRemarks
 *
 * Using an empty object helps keep the API open.
 */
export type ScalarQuery = Record<never, never>;

/**
 * ErrorStrategy is used to specify how to handle errors when querying a relation.
 */
export type ErrorStrategy = ZeroOrOne<ErrorStrategyThrow & ErrorStrategyCatch>;

export type ErrorStrategyThrow = { "@throw": Record<never, never> };
export type ErrorStrategyCatch = { "@catch": Record<never, never> };

/**
 * Query can be used to construct a Knit query from a generated schema:
 *
 * @example
 * For the following proto message:
 * ```protobuf
 * message Foo {
 *   string name = 1;
 * }
 * ```
 *
 * ```ts
 * import type {Foo} from './gen/foo/v1/foo_knit.pb';
 *
 * const query = {
 *   name: {},
 * } satisfies Query<Foo>;
 * ```
 *
 * @remarks
 *
 * This can be used to create reusable sub-queries that can be expanded in other queries.
 *
 */
//prettier-ignore
export type Query<T> = 
  T extends OneofMarker<infer OT>
  ? OneofQuery<Query<OT>>
  : T extends (infer E)[]
  ? Query<E>
  : T extends MapMarker<infer _ extends { [k: string | number]: infer E }> // eslint-disable-line @typescript-eslint/no-unused-vars
  ? Query<E>
  : T extends EnumMarker<unknown> // eslint-disable-line @typescript-eslint/no-unused-vars
  ? ScalarQuery
  : T extends AliasMarker<string, infer V>
  ? Query<V>
  : T extends keyof WktTypeTable
  ? ScalarQuery
  : T extends Uint8Array
  ? ScalarQuery
  : T extends RelationMarker<infer P, infer V>
  ? ( 
      P extends undefined
      ? Query<V>
      : { $: Parameter<P> } & Query<V>
    ) & ErrorStrategy
  : T extends AnyRecord
  ? { [P in keyof T]?: Query<T[P]> }
  : T extends undefined
  ? never
  : ScalarQuery;

/**
 * Parameter converts the generated schemas into their parameter variants that
 * can then be used as parameter values for a query.
 *
 * @example
 * ```ts
 * const params = {...} satisfies Parameter<Foo>;
 *
 * const query = {
 *   "foo.v1.FooService": {
 *     updateFoo: {
 *       $: params,
 *     }
 *   }
 * }
 * ```
 */
//prettier-ignore
export type Parameter<T> = 
  T extends OneofMarker<infer OT>
  ? Oneof<Parameter<OT>>
  : T extends (infer E)[]
  ? Array<Parameter<E>>
  : T extends MapMarker<infer M>
  ? { [P in keyof M]: Parameter<M[P]> }
  : T extends EnumMarker<infer E>
  ? E
  : T extends AliasMarker<infer K, infer V>
  ? Alias<K, Parameter<V>>
  : T extends keyof WktTypeTable
  ? WktTypeTable[T]
  : T extends Uint8Array
  ? Uint8Array
  : T extends AnyRecord  
  ? {
    // Exclude the Knit relation fields
      [ K in keyof T as T[K] extends RelationMarker<unknown, unknown> | undefined ? never: K]?: Parameter<T[K]>;
    }
  : T;

/**
 * Mask returns the masked result based on a {@link Query}. Useful for getting the results based on
 * a sub query.
 *
 * @example
 * For the following proto message:
 * ```protobuf
 * message Foo {
 *   string id = 1;
 *   string name = 2;
 * }
 * ```
 *
 * ```ts
 * import {Foo} from "./gen/foo/v1/foo_knit.pb";
 * const fooQuery = {
 *   name: {}
 * } satisfies Query<Foo>
 * type fooResult = Mask<typeof fooQuery, Foo>;
 * //   ^?  { name: string }
 * // Notice the missing `id`.
 * // Since the query only has name field, the result also only has the name field.
 * ```
 */
//prettier-ignore
export type Mask<Q, R, ES extends ErrorStrategy = ErrorStrategyThrow> = 
  R extends OneofMarker<infer OR>
  ? Q extends OneofQuery<infer OQ> ? Oneof<Mask<OQ, OR, ES>> : never
  : R extends (infer E)[]
  ? Array<Mask<Q, E, ES>>
  : R extends MapMarker<infer M>
  ? { [K in keyof M]: Mask<Q, M[K], ES> }
  : R extends EnumMarker<infer E>
  ? E
  : R extends AliasMarker<string, infer V>
  ? Mask<Q, V, ES>
  : R extends keyof WktTypeTable
  ? WktTypeTable[R]
  : R extends Uint8Array
  ? R
  : R extends RelationMarker<unknown, infer V>
  ? Mask<Q, V, ES> | ErrorMask<Q, ES>
  : R extends AnyRecord
  ? {
      [K in keyof R as K extends keyof Q ? K : never]: K extends keyof Q
        ? Mask<Q[K], R[K], ES>
        : never;
    }
  : R;

/**
 * Markers used to identify type that needs special handling.
 */
type OneofMarker<T extends AnyRecord> = { "@oneof": T };
type MapMarker<T> = { "@map": T };
type EnumMarker<T> = { "@enum": T };
type RelationMarker<P, V> = { $: P; value: V };
type AliasMarker<P extends string, V> = { "@alias": P; value: V };

/**
 * Wkt and their corresponding TS types.
 */
type WktTypeTable = {
  "@wkt/Any": Any;
  "@wkt/Struct": Struct;
  "@wkt/Value": Value;
  "@wkt/ListValue": Value[];
  "@wkt/NullValue": null;
  "@wkt/Timestamp": Timestamp;
  "@wkt/Duration": Duration;
  "@wkt/FieldMask": FieldMask;
  "@wkt/Empty": Empty;
  "@wkt/DoubleValue": number;
  "@wkt/FloatValue": number;
  "@wkt/Int64Value": bigint;
  "@wkt/UInt64Value": bigint;
  "@wkt/Int32Value": number;
  "@wkt/UInt32Value": number;
  "@wkt/BoolValue": boolean;
  "@wkt/StringValue": string;
  "@wkt/BytesValue": Uint8Array;
};

//prettier-ignore
type ErrorMask<Q, ES extends ErrorStrategy> = 
  Q extends ErrorStrategyCatch
  ? KnitError
  : Q extends ErrorStrategyThrow
  ? never
  : ES extends ErrorStrategyCatch
  ? KnitError
  : never;

/**
 * The base type for all Knit schemas.
 *
 * The generated schemas conforms to this type.
 */
export type Schema = {
  [service: string]: {
    fetch?: unknown;
    do?: unknown;
    listen?: unknown;
  };
};

/**
 * Extracting the query and result types from the schema.
 *
 * All of them have similar logic, except for at least one and exactly one semantics.
 *
 * We could probably use a generic type to handle all of them, but it's not worth it.
 *
 * All of them select the method (`fetch`, `do`, `listen`) and then the query/result
 * while applying either one or more or exactly one semantics to the service level and
 * method level.
 *
 * @internal
 */

/**
 * @internal
 */
export type FetchQuery<S extends Schema> = ExtractOneOrMoreQuery<S, "fetch">;
/**
 * @internal
 */
export type DoQuery<S extends Schema> = ExtractOneOrMoreQuery<S, "do">;
/**
 * @internal
 */
export type ListenQuery<S extends Schema> = ExactlyOne<{
  [service in keyof S]?: ExactlyOne<Query<S[service]["listen"]>>;
}>;

/**
 * @internal
 */
export type FetchSchema<S extends Schema> = ExtractMethodSchema<S, "fetch">;
/**
 * @internal
 */
export type DoSchema<S extends Schema> = ExtractMethodSchema<S, "do">;
/**
 * @internal
 */
export type ListenSchema<S extends Schema> = ExtractMethodSchema<S, "listen">;

type ExtractOneOrMoreQuery<
  S extends Schema,
  M extends keyof S[keyof S],
> = OneOrMore<{
  [service in keyof S]?: OneOrMore<Query<S[service][M]>>;
}>;

/**
 * Removes the method level (`fetch` | `do` | `listen`) from the schema replaces it
 * its children.
 *
 * Example:
 * ```ts
 * type Schema = {
 *  "foo.v1.FooService": {
 *    fetch: {
 *      getFoo: { ... }
 *    };
 *    do: {...};
 *    listen: {...}
 *  }
 * }
 *
 * type FetchSchema = ExtractMethod<Schema, "fetch">;
 * //   ^?   `{ "foo.v1.FooService": { getFoo: {...} } }`
 * ```
 */
type ExtractMethodSchema<S extends Schema, M extends keyof S[keyof S]> = {
  [service in keyof S]-?: S[service][M];
};
