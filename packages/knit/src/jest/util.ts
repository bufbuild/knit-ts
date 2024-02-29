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

import type { Equal } from "../utils/types.js";

/**
 * Useful to test types: `expectType<Equal<L, R>>(true)`
 * @param _
 */
export function expectType<T extends true | false>(_expectedValue: T) { } // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function

/**
 * The equality check is accurate, the diff may not cover all cases, only used for debugging type tests.
 */
export type DeepDiff<L, R> = Equal<L, R> extends true
  ? never
  : L extends (infer LE)[]
  ? R extends (infer RE)[]
  ? DeepDiff<LE, RE>[]
  : L | R
  : L extends Record<string, unknown>
  ? R extends Record<string, unknown>
  ? {
    [P in keyof L | keyof R as P extends keyof R & keyof L
    ? Equal<L[P], R[P]> extends true
    ? never
    : P
    : P]: P extends keyof R & keyof L
    ? DeepDiff<L[P], R[P]>
    : P extends keyof L
    ? L[P]
    : P extends keyof R
    ? R[P]
    : never;
  }
  : L | R
  : L | R;
