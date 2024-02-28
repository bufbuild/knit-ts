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

import {
  Message,
  type AnyMessage,
  type FieldInfo,
  type IMessageTypeRegistry,
  type JsonObject,
  type JsonValue,
  type MessageType,
  type PlainMessage,
  protoBase64,
} from "@bufbuild/protobuf";
import {
  Error_Code,
  MaskField,
  type Schema,
  type Schema_Field,
  type Schema_Field_Type,
  type Schema_Field_Type_MapType,
  type Schema_Field_Type_RepeatedType,
} from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import { wktSet } from "./wkt.js";
import type { Relation } from "./gateway.js";
import { Code, ConnectError } from "@connectrpc/connect";
import type { } from "./schema.js";

export interface Patch {
  base: AnyMessage;
  target: JsonObject;
  errorPatch: ErrorPatch | undefined;
  field: PlainMessage<Schema_Field> & {
    relation: Relation;
    params?: AnyMessage;
    operations: string[];
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
  message: AnyMessage,
  schema: PlainMessage<Schema>,
  upstreamErrPatch: ErrorPatch | undefined,
  fallbackCatch: boolean,
  typeRegistry: IMessageTypeRegistry | undefined,
): [JsonValue, Patch[]] {
  const type = message.getType();
  if (wktSet.has(type.typeName)) {
    return [message.toJson({ typeRegistry }), []];
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
    const fieldInfo = type.fields.findJsonName(
      field.jsonName === "" ? field.name : field.jsonName,
    );
    if (fieldInfo === undefined) {
      // Shouldn't happen because schema is created from the message
      throw new ConnectError(
        `Field '${field.name}' not found for '${type.typeName}'`,
        Code.InvalidArgument,
      );
    }
    const [fieldValue, fieldPatches] = formatValue(
      message[field.name],
      fieldInfo,
      type.runtime,
      field.type?.value.value,
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
  fieldInfo: FieldInfo,
  runtime: MessageType["runtime"],
  schemaType: PlainMessage<Schema_Field_Type>["value"]["value"],
  upstreamErrPatch: ErrorPatch | undefined,
  fallbackCatch: boolean,
  typeRegistry: IMessageTypeRegistry | undefined,
): [JsonValue | undefined, Patch[]] {
  if (fieldInfo.kind === "map") {
    const formattedValue: JsonObject = {};
    const patches: Patch[] = [];
    for (const [k, v] of Object.entries(value as object)) {
      const [elementValue, elementPatches] = formatSingular(
        v,
        fieldInfo.V,
        runtime,
        (schemaType as PlainMessage<Schema_Field_Type_MapType>).value.value,
        upstreamErrPatch,
        fallbackCatch,
        typeRegistry,
      );
      formattedValue[k] = elementValue ?? null;
      patches.push(...elementPatches);
    }
    return [formattedValue, patches];
  }
  if (fieldInfo.repeated) {
    const formattedValue: JsonValue[] = [];
    const patches: Patch[] = [];
    for (const element of value as Array<unknown>) {
      const [elementValue, elementPatches] = formatSingular(
        element,
        fieldInfo as (FieldInfo & { kind: "map" })["V"],
        runtime,
        (schemaType as PlainMessage<Schema_Field_Type_RepeatedType>).element
          .value,
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
    fieldInfo,
    runtime,
    schemaType,
    upstreamErrPatch,
    fallbackCatch,
    typeRegistry,
  );
}

export function formatError(
  rawErr: unknown,
  path: string,
  typeRegistry?: IMessageTypeRegistry,
): JsonValue {
  if (typeof rawErr === "object" && rawErr !== null && "[@error]" in rawErr) {
    return rawErr as JsonValue;
  }
  const connectErr = ConnectError.from(rawErr);
  const details: JsonValue[] = [];
  for (const detail of connectErr.details) {
    let type: string, value: string, debug: JsonValue | null;
    if (detail instanceof Message) {
      type = detail.getType().typeName;
      value = protoBase64.enc(detail.toBinary());
      debug = detail.toJson({ typeRegistry });
    } else {
      type = detail.type;
      value = protoBase64.enc(detail.value);
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
  type: (FieldInfo & { kind: "map" })["V"],
  runtime: MessageType["runtime"],
  schemaType: PlainMessage<Schema_Field_Type>["value"]["value"],
  upstreamErrPatch: ErrorPatch | undefined,
  fallbackCatch: boolean,
  typeRegistry: IMessageTypeRegistry | undefined,
): [JsonValue | undefined, Patch[]] {
  switch (type.kind) {
    case "scalar":
      return [runtime.json.writeScalar(type.T, value, false), []];
    case "enum":
      if (type.T.typeName === "google.protobuf.NullValue") {
        return [null, []];
      }
      // return the number if the enum is not found
      return [
        type.T.findNumber(value as number)?.name ?? (value as number),
        [],
      ];
    case "message":
      return formatMessage(
        value as AnyMessage,
        schemaType as PlainMessage<Schema>,
        upstreamErrPatch,
        fallbackCatch,
        typeRegistry,
      );
  }
}

export function shouldCatch(
  onError: PlainMessage<MaskField>["onError"],
  fallbackCatch: boolean,
) {
  return (
    onError.case === "catch" || (fallbackCatch && onError.case !== "throw")
  );
}
