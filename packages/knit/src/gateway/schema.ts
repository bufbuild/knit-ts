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

import { Schema_Field_Type_ScalarType } from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import type { MaskField } from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import { Code, ConnectError } from "@connectrpc/connect";
import { ScalarType, fromJson, toJson } from "@bufbuild/protobuf";
import type {
  DescEnum,
  DescField,
  DescMessage,
  Message,
} from "@bufbuild/protobuf";
import { ValueSchema } from "@bufbuild/protobuf/wkt";
import { wktSet } from "./wkt.js";
import type { Gateway, Relation } from "./gateway.js";

// The gateway uses its own representation of the knit Schema message. It mirrors
// the wire type buf.knit.gateway.v1alpha1.Schema (so it remains assignable to
// the message's init shape and can be serialized into a Response), but adds
// fields used internally for projection, error handling, and relations.
//
// protobuf-es v2 generates message types as type aliases (not interfaces), so
// the previous approach of augmenting the generated Schema via declaration
// merging is no longer possible.

/**
 * @internal
 */
export interface GatewaySchema {
  name: string;
  fields: GatewaySchemaField[];
  localNameTable: Map<string, GatewaySchemaField>;
}

/**
 * @internal
 */
export interface GatewaySchemaField {
  name: string;
  jsonName: string;
  type: GatewaySchemaFieldType;
  path: string;
  onError: MaskField["onError"];
  operations: string[];
  params?: Message;
  relation?: Relation;
}

/**
 * @internal
 */
export interface GatewaySchemaFieldType {
  value:
    | { case: "message"; value: GatewaySchema }
    | { case: "scalar"; value: Schema_Field_Type_ScalarType }
    | { case: "repeated"; value: GatewaySchemaRepeatedType }
    | { case: "map"; value: GatewaySchemaMapType }
    | { case: undefined; value?: undefined };
}

/**
 * @internal
 */
export interface GatewaySchemaRepeatedType {
  element:
    | { case: "message"; value: GatewaySchema }
    | { case: "scalar"; value: Schema_Field_Type_ScalarType }
    | { case: undefined; value?: undefined };
}

/**
 * @internal
 */
export interface GatewaySchemaMapType {
  key: Schema_Field_Type_ScalarType;
  value:
    | { case: "message"; value: GatewaySchema }
    | { case: "scalar"; value: Schema_Field_Type_ScalarType }
    | { case: undefined; value?: undefined };
}

export function computeSchema(
  message: DescMessage,
  mask: MaskField[],
  path: string,
  relations: RelationsMap,
  schemaCache: Map<string, GatewaySchema>,
  operations: string[],
): GatewaySchema {
  return applyMask(
    getMessageSchema(message, relations, schemaCache),
    mask,
    path,
    operations,
  );
}

function applyMask(
  schema: GatewaySchema,
  mask: MaskField[],
  path: string,
  operations: string[],
): GatewaySchema {
  const fields: GatewaySchemaField[] = [];
  const localNameTable = new Map<string, GatewaySchemaField>();
  for (const maskField of mask) {
    const schemaField = schema.localNameTable.get(maskField.name);
    const fieldPath = `${path}.${maskField.name}`;
    if (schemaField === undefined) {
      throw new ConnectError(
        `field ${fieldPath} not found`,
        Code.InvalidArgument,
      );
    }
    const fieldOperations =
      schemaField.relation !== undefined
        ? [...operations, schemaField.relation.method]
        : operations;
    const field: GatewaySchemaField = {
      ...schemaField,
      path: fieldPath,
      type: applyMaskToType(
        schemaField.type.value,
        maskField.mask,
        fieldPath,
        fieldOperations,
      ),
      operations: fieldOperations,
      onError: maskField.onError,
    };
    if (schemaField.relation?.params !== undefined) {
      if (maskField.params === undefined) {
        throw new ConnectError(
          `params for field ${fieldPath} not found`,
          Code.InvalidArgument,
        );
      }
      try {
        field.params = fromJson(
          schemaField.relation.params,
          toJson(ValueSchema, maskField.params),
        );
      } catch (err) {
        // Must be invalid json
        throw new ConnectError(
          `Invalid params passed at ${fieldPath}`,
          Code.InvalidArgument,
          undefined,
          undefined,
          err,
        );
      }
    }
    fields.push(field);
    localNameTable.set(maskField.name, field);
  }
  return {
    name: schema.name,
    fields,
    localNameTable,
  };
}

function applyMaskToType(
  type: GatewaySchemaFieldType["value"],
  mask: MaskField[],
  path: string,
  operations: string[],
): GatewaySchemaFieldType {
  switch (type.case) {
    case "map":
      if (type.value.value.case === "message") {
        return {
          value: {
            case: "map",
            value: {
              key: type.value.key,
              value: {
                case: "message",
                value: applyMask(
                  type.value.value.value,
                  mask,
                  path,
                  operations,
                ),
              },
            },
          },
        };
      }
      break;
    case "message":
      return {
        value: {
          case: "message",
          value: applyMask(type.value, mask, path, operations),
        },
      };
    case "repeated":
      if (type.value.element.case === "message") {
        return {
          value: {
            case: "repeated",
            value: {
              element: {
                case: "message",
                value: applyMask(
                  type.value.element.value,
                  mask,
                  path,
                  operations,
                ),
              },
            },
          },
        };
      }
      break;
    case "scalar":
      break;
    case undefined:
      // shouldn't happen
      throw new ConnectError(`type information not found`, Code.Internal);
  }
  return { value: type };
}

function getMessageSchema(
  message: DescMessage,
  relations: RelationsMap,
  schemaCache: Map<string, GatewaySchema>,
): GatewaySchema {
  let schema = schemaCache.get(message.typeName);
  if (schema !== undefined) {
    return schema;
  }
  schema = {
    name: message.typeName,
    fields: [],
    localNameTable: new Map(),
  };
  // To handle recursive types, we need to add the schema to the table before
  // computing the fields.
  schemaCache.set(message.typeName, schema);
  const fields = computeMessageFields(message, relations, schemaCache);
  schema.fields = fields;
  schema.localNameTable = new Map(fields.map((f) => [f.name, f]));
  return schema;
}

function computeMessageFields(
  message: DescMessage,
  relations: RelationsMap,
  schemaCache: Map<string, GatewaySchema>,
): GatewaySchemaField[] {
  if (wktSet.has(message.typeName)) {
    return [];
  }
  const fields: GatewaySchemaField[] = [];
  for (const protoField of message.fields) {
    fields.push({
      name: protoField.localName,
      jsonName:
        protoField.jsonName !== protoField.localName ? protoField.jsonName : "",
      type: computeFieldType(protoField, relations, schemaCache),
      path: "",
      onError: { case: undefined },
      operations: [],
    });
  }
  for (const relation of relations.get(message.typeName)?.values() ?? []) {
    fields.push({
      name: relation.field.localName,
      jsonName: "",
      type: computeFieldType(relation.field, relations, schemaCache),
      path: "",
      relation: relation,
      onError: { case: undefined },
      operations: [],
    });
  }
  return fields;
}

function computeFieldType(
  protoField: DescField,
  relations: RelationsMap,
  schemaCache: Map<string, GatewaySchema>,
): GatewaySchemaFieldType {
  switch (protoField.fieldKind) {
    case "map":
      return computeMapType(protoField, relations, schemaCache);
    case "list":
      return computeRepeatedType(protoField, relations, schemaCache);
    case "enum":
    case "scalar":
      return {
        value: {
          case: "scalar",
          value: computeScalarType(protoField.scalar, protoField.enum),
        },
      };
    case "message":
      return {
        value: {
          case: "message",
          value: getMessageSchema(protoField.message, relations, schemaCache),
        },
      };
  }
}

function computeRepeatedType(
  protoField: DescField & { fieldKind: "list" },
  relations: RelationsMap,
  schemaCache: Map<string, GatewaySchema>,
): GatewaySchemaFieldType {
  return {
    value: {
      case: "repeated",
      value: {
        element:
          protoField.listKind === "message"
            ? {
                case: "message",
                value: getMessageSchema(
                  protoField.message,
                  relations,
                  schemaCache,
                ),
              }
            : {
                case: "scalar",
                value: computeScalarType(protoField.scalar, protoField.enum),
              },
      },
    },
  };
}

function computeMapType(
  protoField: DescField & { fieldKind: "map" },
  relations: RelationsMap,
  schemaCache: Map<string, GatewaySchema>,
): GatewaySchemaFieldType {
  return {
    value: {
      case: "map",
      value: {
        key: protoScalarToKnitTable[protoField.mapKey],
        value:
          protoField.mapKind === "message"
            ? {
                case: "message",
                value: getMessageSchema(
                  protoField.message,
                  relations,
                  schemaCache,
                ),
              }
            : {
                case: "scalar",
                value: computeScalarType(protoField.scalar, protoField.enum),
              },
      },
    },
  };
}

const protoScalarToKnitTable: Record<ScalarType, Schema_Field_Type_ScalarType> =
  {
    [ScalarType.DOUBLE]: Schema_Field_Type_ScalarType.DOUBLE,
    [ScalarType.FLOAT]: Schema_Field_Type_ScalarType.FLOAT,
    [ScalarType.UINT32]: Schema_Field_Type_ScalarType.UINT32,
    [ScalarType.FIXED32]: Schema_Field_Type_ScalarType.UINT32,
    [ScalarType.UINT64]: Schema_Field_Type_ScalarType.UINT64,
    [ScalarType.FIXED64]: Schema_Field_Type_ScalarType.UINT64,
    [ScalarType.BOOL]: Schema_Field_Type_ScalarType.BOOL,
    [ScalarType.STRING]: Schema_Field_Type_ScalarType.STRING,
    [ScalarType.BYTES]: Schema_Field_Type_ScalarType.BYTES,
    [ScalarType.INT32]: Schema_Field_Type_ScalarType.INT32,
    [ScalarType.SINT32]: Schema_Field_Type_ScalarType.INT32,
    [ScalarType.SFIXED32]: Schema_Field_Type_ScalarType.INT32,
    [ScalarType.INT64]: Schema_Field_Type_ScalarType.INT64,
    [ScalarType.SINT64]: Schema_Field_Type_ScalarType.INT64,
    [ScalarType.SFIXED64]: Schema_Field_Type_ScalarType.INT64,
  };

function computeScalarType(
  scalar: ScalarType | undefined,
  enumType: DescEnum | undefined,
): Schema_Field_Type_ScalarType {
  if (enumType !== undefined) {
    if (enumType.typeName === "google.protobuf.NullValue") {
      return Schema_Field_Type_ScalarType.NULL;
    }
    return Schema_Field_Type_ScalarType.ENUM;
  }
  return protoScalarToKnitTable[scalar as ScalarType];
}

type RelationsMap = Gateway["relations"];
