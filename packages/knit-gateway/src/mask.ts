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

import type { JsonObject, JsonValue } from "@bufbuild/protobuf";
import type { Schema } from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import { wktSet } from "./wkt.js";
import { Code, ConnectError } from "@bufbuild/connect";

/**
 * Applies the schema as the mask to the json object.
 *
 * It doesn't verify if the json object is valid for the schema, it just tries to apply
 * the mask. It will throw an error for some mismatches like Array instead of object and doesn't
 * throw for some like string instead of number.
 *
 * @internal
 */
export function applyMask(jsonObject: JsonValue, schema: Schema): JsonValue {
  if (jsonObject === null) return null;
  if (wktSet.has(schema.name)) return jsonObject;
  if (typeof jsonObject !== "object" || Array.isArray(jsonObject)) {
    // shouldn't happen, the json object should be valid for the schema
    throw new ConnectError(
      `expected json object for ${schema.name}`,
      Code.Internal
    );
  }
  const maskedJsonObject: JsonObject = {};
  for (const field of schema.fields) {
    const jsonName = field.jsonName !== "" ? field.jsonName : field.name;
    const type = field.type?.value;
    let jsonValue = jsonObject[jsonName];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (jsonValue === undefined) {
      // Omit the key if the value is undefined, happens when JsonObject doesn't have the property.
      continue;
    }
    switch (type?.case) {
      case "scalar":
        // no need to apply the mask further.
        break;
      case "message":
        jsonValue = applyMask(jsonValue, type.value);
        break;
      case "repeated":
        if (jsonValue === null || type.value.element.case !== "message") break;
        if (!Array.isArray(jsonValue)) {
          // shouldn't happen, the json object should be valid for the schema
          throw new ConnectError(
            `expected array for ${schema.name}.${field.name}`,
            Code.Internal
          );
        }
        // eslint-disable-next-line no-case-declarations
        const elementSchema = type.value.element.value;
        jsonValue = jsonValue.map((element) =>
          applyMask(element, elementSchema)
        );
        break;
      case "map":
        if (jsonValue === null || type.value.value.case !== "message") break;
        if (typeof jsonValue !== "object" || Array.isArray(jsonValue)) {
          // shouldn't happen, the json object should be valid for the schema
          throw new ConnectError(
            `expected json object for ${schema.name}`,
            Code.Internal
          );
        }
        // eslint-disable-next-line no-case-declarations
        const valueSchema = type.value.value.value;
        jsonValue = Object.fromEntries(
          Object.entries(jsonValue).map(([key, value]) => [
            key,
            applyMask(value, valueSchema),
          ])
        );
        break;
      case undefined:
        // shouldn't happen, type will always be present for a schema.
        throw new ConnectError(
          `missing type for ${schema.name}.${field.name}`,
          Code.Internal
        );
    }
    maskedJsonObject[jsonName] = jsonValue;
  }
  return maskedJsonObject;
}
