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

const forbiddenHeaders = new Set<string>([
  "accept",
  "connect",
  "connection",
  "expect",
  "host",
  "http2-settings",
  "keep-alive",
  "origin",
  "proxy-connection",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const forbiddenPrefixes = [
  ":",
  "accept-",
  "connect-",
  "content-",
  "grpc-",
  "if-",
] as const;

const operationsHeaderKey = "Knit-Operations";

export function makeOutboundHeader(
  requestHeader: Headers | HeadersInit
): Headers {
  const outboundHeader = new Headers();
  new Headers(requestHeader).forEach((v, k) => {
    const lowerK = k.toLowerCase();
    if (forbiddenHeaders.has(lowerK)) {
      return;
    }
    if (forbiddenPrefixes.findIndex((e) => lowerK.startsWith(e)) >= 0) {
      return;
    }
    outboundHeader.set(k, v);
  });
  return outboundHeader;
}

export function makeResolverHeaders(
  baseHeaders: Headers | undefined,
  operations: string[]
) {
  const headers = new Headers(baseHeaders);
  headers.delete(operationsHeaderKey);
  for (const operation of operations) {
    headers.append(operationsHeaderKey, operation);
  }
  return headers;
}
