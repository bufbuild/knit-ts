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

import { Code, ConnectError } from "@connectrpc/connect";
import type { Client } from "./client.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { type JsonValue, Message } from "@bufbuild/protobuf";

interface ErrorDetail {
  type: string;
  value: Uint8Array;
  debug?: JsonValue;
}

/**
 * KnitError is the error type returned by {@link Client} as part of the response.
 * It is also thrown by {@link Client} when the response is not successful.
 */
export class KnitError {
  /**
   * Create a new KnitError
   * @param code The error code
   * @param message The error message
   * @param details The error details
   * @param path The path where the error has occurred
   */
  constructor(
    public code: Code,
    public message: string,
    public details: ErrorDetail[],
    public path: string,
  ) {}
}

/**
 * Convert any value - typically a caught error into a {@link KnitError},
 * following these rules:
 * - If the value is already a {@link KnitError}, return it as is.
 * - For all other values, use {@link connectErrorFromReason} to convert to
 *   a {@link ConnectError}, and then convert that to a {@link KnitError}.
 */
export function knitErrorFromReason(reason: unknown) {
  if (reason instanceof KnitError) {
    return reason;
  }
  const connectErr = ConnectError.from(reason);
  const details: ErrorDetail[] = [];
  for (const detail of connectErr.details) {
    if (detail instanceof Message) {
      details.push({
        type: detail.getType().typeName,
        value: detail.toBinary(),
        debug: detail.toJson(),
      });
      continue;
    }
    details.push({
      type: detail.type,
      debug: detail.debug ?? null,
      value: detail.value,
    });
  }
  return new KnitError(
    connectErr.code as unknown as Code,
    connectErr.message,
    details,
    "",
  );
}
