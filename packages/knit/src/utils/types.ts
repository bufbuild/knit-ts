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

/**
 * A type that requires exactly one of the properties of an object to be set.
 */
export type ExactlyOne<T extends AnyRecord> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Record<Exclude<keyof T, K>, never>>; //prettier-ignore
}[keyof T];

/**
 * A type that requires at least one of the properties of an object to be set.
 *
 */
export type OneOrMore<T extends AnyRecord> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>; //prettier-ignore
}[keyof T];

/**
 * A type that requires exactly one or none of the properties of an object to be set.
 */
export type ZeroOrOne<T extends AnyRecord> =
  | ExactlyOne<T>
  | Partial<Record<keyof T, never>>;

/**
 * Allows anything object type ({}).
 */
export type AnyRecord = { [K in string]: any }; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 *
 * Checks if two types are equal.
 *
 * @link https://github.com/microsoft/TypeScript/issues/27024#issuecomment-421529650
 */
//prettier-ignore
export type Equal<L, R> =
  (<T>() => T extends L ? 1 : 2) extends (<T>() => T extends R ? 1 : 2)
  ? true
  : false;

/**
 * @link https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types
 */
export type DistributiveKeyOf<T> = T extends T ? keyof T : never;

/**
 * Seals `I` to only contain field of `T`.
 */
//prettier-ignore
export type Subset<I, T> =
  Equal<T, I> extends true
  ? T
  : T extends any[] // eslint-disable-line @typescript-eslint/no-explicit-any
  ? Array<Subset<Element<I>, Element<T>>>
  : T extends AnyRecord
  ? SubsetRecord<I, T>
  : T;

//prettier-ignore
type SubsetRecord<I, T> =
  & { [P in keyof T]: Subset<P extends keyof I ? I[P] : never, T[P]>; }
  & Record<Exclude<keyof I, DistributiveKeyOf<T>>, never>;

type Element<T> = T extends (infer E)[] ? E : never;
