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

import { ScalarType, create, toBinary, toJson } from "@bufbuild/protobuf";
import type {
  DescField,
  DescMessage,
  JsonObject,
  JsonValue,
  Message,
  Registry,
} from "@bufbuild/protobuf";
import { base64Encode } from "@bufbuild/protobuf/wire";
import { Error_Code } from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import type { MaskField } from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import { wktSet } from "./wkt.js";
import type { Relation } from "./gateway.js";
import type {
  GatewaySchema,
  GatewaySchemaField,
  GatewaySchemaFieldType,
  GatewaySchemaMapType,
  GatewaySchemaRepeatedType,
} from "./schema.js";
import { Code, ConnectError } from "@connectrpc/connect";

type SchemaType = GatewaySchemaFieldType["value"]["value"];

export interface Patch {
  base: Message;
  target: JsonObject;
  errorPatch: ErrorPatch | undefined;
  field: GatewaySchemaField & {
    relation: Relation;
  };
}

export interface ErrorPatch {
  target: JsonObject;
  // The name of the field to patch in the target
  name: string;
}

/**
 * Formats the message as a `JsonValue` according to the schema. It also returns the
 * patches to be applied to the message.
 *
 * It doesn't verify if the json object is valid for the schema, it just tries to apply
 * the mask. It will throw an error for some mismatches like Array instead of object and doesn't
 * throw for some like string instead of number.
 *
 * @internal
 */
export function formatMessage(
  message: Message,
  messageDesc: DescMessage,
  schema: GatewaySchema,
  upstreamErrPatch: ErrorPatch | undefined,
  fallbackCatch: boolean,
  typeRegistry: Registry | undefined,
): [JsonValue, Patch[]] {
  if (wktSet.has(messageDesc.typeName)) {
    return [toJson(messageDesc, message, { registry: typeRegistry }), []];
  }
  const formattedObject: JsonObject = {};
  const patches: Patch[] = [];
  for (const field of schema.fields) {
    if (field.relation !== undefined) {
      let errorPatch = upstreamErrPatch;
      if (shouldCatch(field.onError, fallbackCatch)) {
        errorPatch = {
          target: formattedObject,
          name: field.name,
        };
      }
      patches.push({
        base: message,
        field: field as Patch["field"],
        target: formattedObject,
        errorPatch: errorPatch,
      });
      continue;
    }
    const fieldDesc = messageDesc.fields.find(
      (f) => f.localName === field.name,
    );
    if (fieldDesc === undefined) {
      // Shouldn't happen because schema is created from the message
      throw new ConnectError(
        `Field '${field.name}' not found for '${messageDesc.typeName}'`,
        Code.InvalidArgument,
      );
    }
    const [fieldValue, fieldPatches] = formatValue(
      (message as Record<string, unknown>)[field.name],
      fieldDesc,
      field.type.value.value,
      upstreamErrPatch,
      fallbackCatch,
      typeRegistry,
    );
    if (fieldValue === undefined) continue;
    formattedObject[field.name] = fieldValue;
    patches.push(...fieldPatches);
  }
  return [formattedObject, patches];
}

export function formatValue(
  value: unknown,
  fieldDesc: DescField,
  schemaType: SchemaType,
  upstreamErrPatch: ErrorPatch | undefined,
  fallbackCatch: boolean,
  typeRegistry: Registry | undefined,
): [JsonValue | undefined, Patch[]] {
  if (fieldDesc.fieldKind === "map") {
    const formattedValue: JsonObject = {};
    const patches: Patch[] = [];
    for (const [k, v] of Object.entries(value as object)) {
      const [elementValue, elementPatches] = formatSingular(
        v,
        fieldDesc,
        (schemaType as GatewaySchemaMapType).value.value,
        upstreamErrPatch,
        fallbackCatch,
        typeRegistry,
      );
      formattedValue[k] = elementValue ?? null;
      patches.push(...elementPatches);
    }
    return [formattedValue, patches];
  }
  if (fieldDesc.fieldKind === "list") {
    const formattedValue: JsonValue[] = [];
    const patches: Patch[] = [];
    for (const element of value as Array<unknown>) {
      const [elementValue, elementPatches] = formatSingular(
        element,
        fieldDesc,
        (schemaType as GatewaySchemaRepeatedType).element.value,
        upstreamErrPatch,
        fallbackCatch,
        typeRegistry,
      );
      formattedValue.push(elementValue ?? null);
      patches.push(...elementPatches);
    }
    return [formattedValue, patches];
  }
  return formatSingular(
    value,
    fieldDesc,
    schemaType,
    upstreamErrPatch,
    fallbackCatch,
    typeRegistry,
  );
}

export function formatError(
  rawErr: unknown,
  path: string,
  typeRegistry?: Registry,
): JsonValue {
  if (typeof rawErr === "object" && rawErr !== null && "[@error]" in rawErr) {
    return rawErr as JsonValue;
  }
  const connectErr = ConnectError.from(rawErr);
  const details: JsonValue[] = [];
  for (const detail of connectErr.details) {
    let type: string, value: string, debug: JsonValue | null;
    if ("desc" in detail) {
      const message = create(detail.desc, detail.value);
      type = detail.desc.typeName;
      value = base64Encode(toBinary(detail.desc, message));
      debug = toJson(detail.desc, message, { registry: typeRegistry });
    } else {
      type = detail.type;
      value = base64Encode(detail.value);
      debug = detail.debug ?? null;
    }
    details.push({
      type: type,
      value: value,
      debug: debug,
    });
  }
  return {
    "[@error]": {},
    code: Error_Code[connectErr.code],
    message: connectErr.message,
    details: details,
    path: path,
  };
}

function formatSingular(
  value: unknown,
  fieldDesc: DescField,
  schemaType: SchemaType,
  upstreamErrPatch: ErrorPatch | undefined,
  fallbackCatch: boolean,
  typeRegistry: Registry | undefined,
): [JsonValue | undefined, Patch[]] {
  switch (elementKind(fieldDesc)) {
    case "scalar":
      return [writeScalarJson(fieldDesc.scalar as ScalarType, value), []];
    case "enum": {
      const enumDesc = fieldDesc.enum;
      if (enumDesc === undefined) {
        return [value as JsonValue, []];
      }
      if (enumDesc.typeName === "google.protobuf.NullValue") {
        return [null, []];
      }
      // return the number if the enum value is not found
      return [
        enumDesc.values.find((v) => v.number === value)?.name ??
          (value as number),
        [],
      ];
    }
    case "message":
      if (value === undefined || value === null) {
        return [undefined, []];
      }
      return formatMessage(
        value as Message,
        fieldDesc.message as DescMessage,
        schemaType as GatewaySchema,
        upstreamErrPatch,
        fallbackCatch,
        typeRegistry,
      );
  }
}

/**
 * Returns the element kind for a field: the kind of the value for singular
 * fields, the list element for repeated fields, and the map value for map
 * fields.
 */
function elementKind(field: DescField): "scalar" | "enum" | "message" {
  switch (field.fieldKind) {
    case "list":
      return field.listKind;
    case "map":
      return field.mapKind;
    default:
      return field.fieldKind;
  }
}

/**
 * Serializes a scalar value to its proto3 JSON representation, omitting default
 * (zero) values by returning `undefined`.
 */
function writeScalarJson(
  scalar: ScalarType,
  value: unknown,
): JsonValue | undefined {
  switch (scalar) {
    case ScalarType.INT64:
    case ScalarType.UINT64:
    case ScalarType.SINT64:
    case ScalarType.FIXED64:
    case ScalarType.SFIXED64: {
      const v = value as bigint | string;
      if (v === BigInt(0) || v === "0") return undefined;
      return v.toString();
    }
    case ScalarType.BYTES: {
      const v = value as Uint8Array;
      return v.length === 0 ? undefined : base64Encode(v);
    }
    case ScalarType.FLOAT:
    case ScalarType.DOUBLE: {
      const num = value as number;
      if (num === 0) return undefined;
      if (Number.isNaN(num)) return "NaN";
      if (num === Number.POSITIVE_INFINITY) return "Infinity";
      if (num === Number.NEGATIVE_INFINITY) return "-Infinity";
      return num;
    }
    case ScalarType.BOOL:
      return value === true ? true : undefined;
    case ScalarType.STRING:
      return value === "" ? undefined : (value as string);
    default:
      // INT32, UINT32, SINT32, FIXED32, SFIXED32
      return value === 0 ? undefined : (value as number);
  }
}

export function shouldCatch(
  onError: MaskField["onError"],
  fallbackCatch: boolean,
) {
  return (
    onError.case === "catch" || (fallbackCatch && onError.case !== "throw")
  );
}
