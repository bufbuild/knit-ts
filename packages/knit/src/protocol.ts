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

import { type PartialMessage, Value } from "@bufbuild/protobuf";
import {
  type ListenResponse,
  type MaskField,
  type Request,
  type Response,
  type Schema,
} from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import { decodeMessage, format } from "./json.js";
import { isOneofQuery } from "./oneof.js";
import { KnitError, knitErrorFromReason } from "./error.js";
import { Code } from "@connectrpc/connect";

/**
 * @internal
 */
export type AnyQuery = {
  [k: string]: AnyQuery;
};

/**
 *
 * @internal
 */
export function makeRequests(
  query: AnyQuery,
): [PartialMessage<Request>[], Record<string, string>[]] {
  const requests: PartialMessage<Request>[] = [];
  const oneofs: Record<string, string>[] = [];
  for (const [service, methods] of Object.entries(query)) {
    for (const [method, request] of Object.entries(methods)) {
      const [maskField, oneofTable] = makeMaskField(
        request,
        service + "." + method,
      );
      requests.push({
        method: service + "." + capitalize(method),
        body: maskField.params,
        mask: maskField.mask,
        onError: maskField.onError,
      });
      oneofs.push(oneofTable);
    }
  }
  return [requests, oneofs];
}

function makeMaskField(
  value: AnyQuery,
  path: string,
): [PartialMessage<MaskField>, Record<string, string>] {
  let params: PartialMessage<Value> | undefined = undefined;
  let onError: PartialMessage<MaskField>["onError"] = undefined;
  const mask: PartialMessage<MaskField>[] = [];
  let oneofTable: Record<string, string> = {};
  for (const [k, v] of Object.entries(value)) {
    if (k === "$") {
      params = Value.fromJson(format(v));
      continue;
    }
    if (k === "@throw") {
      onError = { case: "throw", value: {} };
      continue;
    }
    if (k === "@catch") {
      onError = { case: "catch", value: {} };
      continue;
    }
    if (isOneofQuery(v)) {
      for (const [oneOfKey, oneOfValue] of Object.entries(v["@oneof"])) {
        const keyPath = path + "." + oneOfKey;
        const [maskField, fieldOneofTable] = makeMaskField(oneOfValue, keyPath);
        mask.push({ ...maskField, name: oneOfKey });
        oneofTable = {
          ...oneofTable,
          [keyPath]: k,
          ...fieldOneofTable,
        };
      }
      continue;
    }
    const [maskField, fieldOneofTable] = makeMaskField(v, path + "." + k);
    mask.push({ ...maskField, name: k });
    oneofTable = {
      ...oneofTable,
      ...fieldOneofTable,
    };
  }
  return [{ params, mask, onError }, oneofTable];
}

/**
 *
 * @internal
 */
export function makeResult(
  oneofs: Record<string, string>[],
  responses: Response[],
) {
  const result: { [k: string]: { [k: string]: unknown } } = {};
  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];
    const serviceParts = response.method.split(".");
    const method = uncapitalize(serviceParts.pop() as string);
    const service = serviceParts.join(".");
    let serviceResult = result[service];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (serviceResult === undefined) {
      result[service] = serviceResult = {};
    }
    serviceResult[method] = decodeMessage(
      oneofs[i],
      response.body?.toJson(),
      response.schema,
      service + "." + method,
    );
  }
  return result;
}

/**
 *
 * @internal
 */
export async function* makeResultIterable(
  oneofs: Record<string, string>,
  response: AsyncIterable<ListenResponse>,
) {
  let schema: Schema | undefined = undefined;
  try {
    for await (const next of response) {
      if (next.response === undefined) {
        throw new KnitError(Code.Unknown, "no response", [], "");
      }
      if (schema === undefined) {
        schema = next.response.schema;
      } else {
        next.response.schema = schema;
      }
      yield makeResult([oneofs], [next.response]);
    }
  } catch (reason) {
    throw knitErrorFromReason(reason);
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function uncapitalize(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
