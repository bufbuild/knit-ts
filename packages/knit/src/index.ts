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

/**
 * This is a simple library that provides an intuitive Typescript client for Knit.
 * Knit is a novel way for declarative data fetching from Protobuf APIs. It is
 * built on top of {@link https://connect.build/  | Connect}.
 *
 * Checkout the {@link https://github.com/bufbuild/knit/tree/main/docs | docs} to know more.
 *
 * @packageDocumentation
 */

export { makeOneof } from "./oneof.js";
export { alias } from "./alias.js";
export { createClient } from "./client.js";
export { makeScopedClient } from "./scope.js";

export { Duration } from "./wkt/duration.js";
export { FieldMask } from "./wkt/field_mask.js";
export { Timestamp } from "./wkt/timestamp.js";
export { KnitError, knitErrorFromReason } from "./error.js";

export type { Empty } from "./wkt/empty.js";
export type { Struct, Value } from "./wkt/struct.js";
export type { Any } from "./wkt/any.js";
export type { Client } from "./client.js";
export type { Oneof } from "./oneof.js";
export type {
  Mask,
  Query,
  Parameter,
  Schema,
  DoQuery,
  DoSchema,
  ListenQuery,
  ListenSchema,
  FetchQuery,
  FetchSchema,
} from "./schema.js";
