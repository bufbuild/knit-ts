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

import type {
  AnyMessage,
  FieldInfo,
  IMessageTypeRegistry,
  JsonObject,
  JsonValue,
  MessageType,
  PlainMessage,
} from "@bufbuild/protobuf";
import type {
  Schema,
  Schema_Field,
  Schema_Field_Type,
  Schema_Field_Type_MapType,
  Schema_Field_Type_RepeatedType,
} from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import { wktSet } from "./wkt.js";
import type { Relation } from "./gateway.js";
import { Code, ConnectError } from "@bufbuild/connect";
import type {} from "./schema.js";

export interface Patch {
  base: AnyMessage;
  target: JsonObject;
  field: PlainMessage<Schema_Field> & {
    relation: Relation;
    params?: AnyMessage;
  };
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
  typeRegistry?: IMessageTypeRegistry
): [JsonValue, Patch[]] {
  const type = message.getType();
  if (wktSet.has(type.typeName))
    return [message.toJson({ typeRegistry: typeRegistry }), []];
  const formattedObject: JsonObject = {};
  const patches: Patch[] = [];
  for (const field of schema.fields) {
    if (field.relation !== undefined) {
      patches.push({
        base: message,
        field: field as Patch["field"],
        target: formattedObject,
      });
      continue;
    }
    const fieldInfo = type.fields.findJsonName(
      field.jsonName === "" ? field.name : field.jsonName
    );
    if (fieldInfo === undefined) {
      // Shouldn't happen because schema is created from the message
      throw new ConnectError(
        `Field '${field.name}' not found for '${type.typeName}'`,
        Code.InvalidArgument
      );
    }
    const [fieldValue, fieldPatches] = formatValue(
      message[field.name],
      fieldInfo,
      type.runtime,
      field.type?.value.value,
      typeRegistry
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
  typeRegistry?: IMessageTypeRegistry
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
        typeRegistry
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
        typeRegistry
      );
      formattedValue.push(elementValue ?? null);
      patches.push(...elementPatches);
    }
    return [formattedValue, patches];
  }
  return formatSingular(value, fieldInfo, runtime, schemaType, typeRegistry);
}

function formatSingular(
  value: unknown,
  type: (FieldInfo & { kind: "map" })["V"],
  runtime: MessageType["runtime"],
  schemaType: PlainMessage<Schema_Field_Type>["value"]["value"],
  typeRegistry?: IMessageTypeRegistry
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
        typeRegistry
      );
  }
}
