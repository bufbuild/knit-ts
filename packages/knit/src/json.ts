/* eslint-disable no-case-declarations */
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

import {
  type JsonObject,
  type JsonValue,
  protoBase64,
} from "@bufbuild/protobuf";
import { getAlias } from "./alias.js";
import {
  type Schema,
  type Schema_Field_Type,
  type Schema_Field_Type_MapType,
  Schema_Field_Type_ScalarType,
  type Schema_Field_Type_RepeatedType,
  Error as PBError,
} from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import { getOneof, makeOneof } from "./oneof.js";
import type { AnyRecord } from "./utils/types.js";
import { Duration } from "./wkt/duration.js";
import { Timestamp } from "./wkt/timestamp.js";
import { FieldMask } from "./wkt/field_mask.js";
import {
  Duration as DurationPb,
  Timestamp as TimestampPb,
  FieldMask as FieldMaskPb,
} from "@bufbuild/protobuf";
import { Code } from "@connectrpc/connect";
import { KnitError } from "./error.js";

/**
 * Formats a value to Json serializable value.
 *
 * @internal
 */
export function format(data: unknown): JsonValue {
  switch (typeof data) {
    case "bigint":
      return data.toString();
    case "boolean":
    case "string":
      return data;
    case "number":
      if (isNaN(data)) {
        return "NaN";
      }
      if (data === Number.POSITIVE_INFINITY) {
        return "Infinity";
      }
      if (data === Number.NEGATIVE_INFINITY) {
        return "-Infinity";
      }
      return data;
    case "undefined":
      return null;
    case "object":
      if (data === null) {
        return null;
      }
      if (data instanceof Timestamp) {
        return new TimestampPb(data).toJson();
      }
      if (data instanceof Duration) {
        return new DurationPb(data).toJson();
      }
      if (data instanceof FieldMask) {
        return new FieldMaskPb(data).toJson();
      }
      if (data instanceof Uint8Array) {
        return protoBase64.enc(data);
      }
      if (data instanceof Array) {
        return data.map((element) => format(element));
      }
      const entries = Object.entries(data);
      const fields: JsonObject = {};
      for (let [key, value] of entries) {
        if (typeof value === "object" && value !== null) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const alias = getAlias(value);
          if (alias !== undefined) {
            key = alias.alias;
            value = alias.value;
          } else {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const oneof = getOneof(value);
            if (oneof !== undefined) {
              key = oneof.case;
              value = oneof.value;
            }
          }
        }
        fields[key] = format(value);
      }
      return fields;
    default:
      throw new Error(`Invalid type ${typeof data}`);
  }
}

/**
 * Decodes any `JsonObject` into a valid Knit result type using the provided `Schema`.
 *
 * @internal
 */
export function decodeMessage(
  oneofTable: Record<string, string>,
  data: JsonValue | undefined,
  schema: Schema | undefined,
  path: string,
) {
  if (schema === undefined) {
    throw missingTypeInfoErr(path);
  }
  if (data === null || data === undefined) {
    return undefined;
  }
  if (isError(data)) {
    return decodeError(data);
  }
  // Check for WKTs
  if (schema.name in wktDecodersTable) {
    return wktDecodersTable[schema.name as keyof typeof wktDecodersTable](
      data,
      path,
    );
  }
  // Assert that this is a json object and not a primitive or array.
  assertJsonObject(data, path);
  const result: { [k: string]: unknown } = {};
  for (const field of schema.fields) {
    const fieldPath = path + "." + field.name;
    const value = decodeField(
      oneofTable,
      data[field.jsonName !== "" ? field.jsonName : field.name],
      field.type?.value,
      fieldPath,
    );
    if (value === undefined) {
      continue;
    }
    const oneOfField = oneofTable[fieldPath];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (oneOfField !== undefined) {
      result[oneOfField] = makeOneof({
        [field.name]: value,
      } as AnyRecord);
      continue;
    }
    result[field.name] = value;
  }
  return result;
}

function decodeField(
  oneofTable: Record<string, string>,
  data: JsonValue | undefined,
  type: Schema_Field_Type["value"] | undefined,
  path: string,
): unknown {
  if (type === undefined || type.case === undefined) {
    throw missingTypeInfoErr(path);
  }
  switch (type.case) {
    case "map":
      return decodeMap(oneofTable, data, type.value, path);
    case "repeated":
      return decodeRepeated(oneofTable, data, type.value, path);
    case "message":
      return decodeMessage(oneofTable, data, type.value, path);
    case "scalar":
      return decodeScalar(data, type.value, path);
  }
}

function decodeMap(
  oneofTable: Record<string, string>,
  data: JsonValue | undefined,
  type: Schema_Field_Type_MapType,
  path: string,
) {
  if (data === undefined || data === null) return {};
  if (isError(data)) {
    return decodeError(data);
  }
  assertJsonObject(data, path);
  const valueType = type.value;
  if (valueType.case === undefined) {
    throw missingTypeInfoErr(path);
  }
  let decodeValue: (data: JsonValue, path: string) => unknown;
  switch (valueType.case) {
    case "message":
      decodeValue = (data, path) =>
        decodeMessage(oneofTable, data, valueType.value, path);
      break;
    case "scalar":
      decodeValue = (data, path) => decodeScalar(data, valueType.value, path);
      break;
  }
  const result: { [k: string]: unknown } = {};
  for (const [k, v] of Object.entries(data)) {
    result[k] = decodeValue(v, path + `["${k}"]`);
  }
  return result;
}

function decodeRepeated(
  oneofTable: Record<string, string>,
  data: JsonValue | undefined,
  type: Schema_Field_Type_RepeatedType,
  path: string,
) {
  if (data === undefined || data === null) {
    return [];
  }
  if (isError(data)) {
    return decodeError(data);
  }
  assertJsonArray(data, path);
  const elementType = type.element;
  if (elementType.case === undefined) {
    throw missingTypeInfoErr(path);
  }
  let decodeElement: (data: JsonValue, path: string) => unknown;
  switch (elementType.case) {
    case "message":
      decodeElement = (data, path) =>
        decodeMessage(oneofTable, data, elementType.value, path);
      break;
    case "scalar":
      decodeElement = (data, path) =>
        decodeScalar(data, elementType.value, path);
      break;
  }
  const result: ReturnType<typeof decodeElement>[] = [];
  for (const [i, v] of data.entries()) {
    result.push(decodeElement(v, path + `[${i}]`));
  }
  return result;
}

function decodeScalar(
  data: JsonValue | undefined,
  type: Schema_Field_Type_ScalarType,
  path: string,
) {
  if (type === Schema_Field_Type_ScalarType.NULL && data === null) {
    return null;
  }
  if (data === undefined || data === null) {
    return undefined;
  }
  if (isError(data)) {
    return decodeError(data);
  }
  switch (type) {
    case Schema_Field_Type_ScalarType.BOOL:
      return decodeBoolean(data, path);
    case Schema_Field_Type_ScalarType.BYTES:
      return decodeBytes(data, path);
    case Schema_Field_Type_ScalarType.DOUBLE:
    case Schema_Field_Type_ScalarType.FLOAT:
      return decodeFloat(data, path);
    case Schema_Field_Type_ScalarType.ENUM:
      return decodeEnum(data, path);
    case Schema_Field_Type_ScalarType.STRING:
      return decodeString(data, path);
    case Schema_Field_Type_ScalarType.INT32:
    case Schema_Field_Type_ScalarType.UINT32:
      return decodeInt(data, path);
    case Schema_Field_Type_ScalarType.INT64:
    case Schema_Field_Type_ScalarType.UINT64:
      return decodeBigInt(data, path);
    default:
      throw new Error(`invalid scalar type: ${type}`);
  }
}

const wktDecodersTable = {
  "google.protobuf.Any": (data: JsonValue) => data,
  "google.protobuf.Struct": (data: JsonValue) => data,
  "google.protobuf.Value": (data: JsonValue) => data,
  "google.protobuf.ListValue": decodeListValue,
  "google.protobuf.Duration": decodeDuration,
  "google.protobuf.Timestamp": decodeTimestamp,
  "google.protobuf.DoubleValue": decodeFloat,
  "google.protobuf.FloatValue": decodeFloat,
  "google.protobuf.BoolValue": decodeBoolean,
  "google.protobuf.Int64Value": decodeBigInt,
  "google.protobuf.UInt64Value": decodeBigInt,
  "google.protobuf.Int32Value": decodeInt,
  "google.protobuf.UInt32Value": decodeInt,
  "google.protobuf.StringValue": decodeString,
  "google.protobuf.BytesValue": decodeBytes,
  "google.protobuf.Empty": () => ({}),
  "google.protobuf.FieldMask": decodeFieldMask,
} as const;

function decodeBigInt(data: JsonValue, path: string) {
  switch (typeof data) {
    case "string":
    case "number":
      return BigInt(data);
    default:
      throw parseError("string | number", typeof data, "bigint", path);
  }
}

function decodeFloat(data: JsonValue, path: string) {
  switch (typeof data) {
    case "number":
      return data;
    case "string":
      if (data === "NaN") {
        return Number.NaN;
      }
      if (data === "Infinity") {
        return Number.POSITIVE_INFINITY;
      }
      if (data === "-Infinity") {
        return Number.NEGATIVE_INFINITY;
      }
      return parseFloat(data);
    default:
      throw parseError("string | number", typeof data, "float", path);
  }
}

function decodeInt(data: JsonValue, path: string) {
  switch (typeof data) {
    case "number":
      return data;
    case "string":
      return parseInt(data);
    default:
      throw parseError("string | number", typeof data, "int", path);
  }
}

function decodeBoolean(data: JsonValue, path: string) {
  if (typeof data !== "boolean") {
    throw parseError("boolean", typeof data, "boolean", path);
  }
  return data;
}

function decodeString(data: JsonValue, path: string) {
  if (typeof data !== "string") {
    throw parseError("string", typeof data, "string", path);
  }
  return data;
}

function decodeEnum(data: JsonValue, path: string) {
  switch (typeof data) {
    case "number":
    case "string":
      return data;
    default:
      throw parseError("string | number", typeof data, "enum", path);
  }
}

function decodeBytes(data: JsonValue, path: string) {
  if (typeof data !== "string") {
    throw parseError("string", typeof data, "bytes", path);
  }
  return protoBase64.dec(data);
}

function decodeListValue(data: JsonValue, path: string) {
  assertJsonArray(data, path);
  return data;
}

function decodeTimestamp(data: JsonValue) {
  return new Timestamp(TimestampPb.fromJson(data));
}

function decodeDuration(data: JsonValue) {
  return new Duration(DurationPb.fromJson(data));
}

function decodeFieldMask(data: JsonValue) {
  return new FieldMask(FieldMaskPb.fromJson(data));
}

function decodeError(data: JsonObject) {
  const error = PBError.fromJson(data, { ignoreUnknownFields: true });
  return new KnitError(
    error.code as unknown as Code,
    error.message,
    error.details.map((detail) => ({
      type: detail.type,
      value: detail.value,
      debug: detail.debug?.toJson(),
    })),
    error.path,
  );
}

function isError(data: NonNullable<JsonValue>): data is JsonObject {
  return typeof data === "object" && "[@error]" in data;
}

function assertJsonObject(
  data: JsonValue,
  path: string,
): asserts data is JsonObject {
  if (data === null) {
    throw parseError("object", "null", "message", path);
  }
  switch (typeof data) {
    case "string":
    case "number":
    case "boolean":
      throw parseError("object", typeof data, "message", path);
    default:
      break;
  }
  if (data instanceof Array) {
    throw parseError("object", "Array", "message", path);
  }
}

function assertJsonArray(
  data: JsonValue,
  path: string,
): asserts data is JsonValue[] {
  if (!(data instanceof Array)) {
    throw parseError("Array", typeof data, "ListValue", path);
  }
}

function parseError(
  expectedWireType: string,
  gotWireType: string,
  fieldType: string,
  path: string,
) {
  return new Error(
    `expected ${expectedWireType} for ${fieldType} field '${path}' got ${gotWireType}`,
  );
}

function missingTypeInfoErr(path: string) {
  return Error(`missing type information for '${path}'`);
}
