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
  Schema,
  Schema_Field_Type_ScalarType,
} from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import { Code, ConnectError } from "@connectrpc/connect";
import { ScalarType } from "@bufbuild/protobuf";
import { wktSet } from "./wkt.js";
import type {
  MaskField,
  Schema_Field,
  Schema_Field_Type,
} from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import type {
  MessageType,
  FieldInfo,
  EnumType,
  PlainMessage,
  AnyMessage,
} from "@bufbuild/protobuf";
import type { Gateway, Relation } from "./gateway.js";

// Instead of creating new types which can be tedious, we use declaration merging to
// add the fields we need to the existing types. These fields are ignored by
// `@bufbuild/protobuf`.
//
// We also bundle the remote packages this means we are not actually polluting the
// interface for users of this package, if they choose to use the remote package
// for some reason.
declare module "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js" {
  interface Schema {
    localNameTable: Map<string, PlainSchemaField>;
  }

  interface Schema_Field {
    params?: AnyMessage;
    relation?: Relation;
    operations: string[];
    path: string;
    onError: MaskField["onError"];
  }
}

export function computeSchema(
  message: MessageType,
  mask: MaskField[],
  path: string,
  relations: RelationsMap,
  schemaCache: Map<string, PlainSchema>,
  operations: string[],
): PlainSchema {
  return applyMask(
    getMessageSchema(message, relations, schemaCache),
    mask,
    path,
    operations,
  );
}

function applyMask(
  schema: PlainSchema,
  mask: MaskField[],
  path: string,
  operations: string[],
): PlainSchema {
  const fields: PlainSchemaField[] = [];
  const localNameTable = new Map<string, PlainSchemaField>();
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
    const field = {
      ...schemaField,
      path: fieldPath,
      type: applyMaskToType(
        schemaField.type?.value,
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
        field.params = schemaField.relation.params.fromJson(
          maskField.params.toJson(),
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
  type: PlainSchemaFieldType["value"] | undefined,
  mask: MaskField[],
  path: string,
  operations: string[],
): PlainSchemaFieldType {
  switch (type?.case) {
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
  message: MessageType,
  relations: RelationsMap,
  schemaCache: Map<string, PlainSchema>,
): PlainSchema {
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
  message: MessageType,
  relations: RelationsMap,
  schemaCache: Map<string, PlainSchema>,
): PlainSchemaField[] {
  if (wktSet.has(message.typeName)) {
    return [];
  }
  const fields: PlainSchemaField[] = [];
  for (const protoField of message.fields.list()) {
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
  protoField: FieldInfo,
  relations: RelationsMap,
  schemaCache: Map<string, PlainSchema>,
): PlainSchemaFieldType {
  if (protoField.kind === "map") {
    return computeMapType(protoField, relations, schemaCache);
  }
  if (protoField.repeated) {
    return computeRepeatedType(protoField, relations, schemaCache);
  }
  switch (protoField.kind) {
    case "enum":
    case "scalar":
      return {
        value: { case: "scalar", value: computeScalarType(protoField) },
      };
    case "message":
      return {
        value: {
          case: "message",
          value: getMessageSchema(protoField.T, relations, schemaCache),
        },
      };
  }
}

function computeRepeatedType(
  protoField: FieldInfo & { readonly repeated: boolean } & {
    kind: "scalar" | "enum" | "message";
  },
  relations: RelationsMap,
  schemaCache: Map<string, PlainSchema>,
): PlainSchemaFieldType {
  return {
    value: {
      case: "repeated",
      value: {
        element:
          protoField.kind === "message"
            ? {
              case: "message",
              value: getMessageSchema(protoField.T, relations, schemaCache),
            }
            : {
              case: "scalar",
              value: computeScalarType(protoField),
            },
      },
    },
  };
}

function computeMapType(
  protoField: FieldInfo & { kind: "map" },
  relations: RelationsMap,
  schemaCache: Map<string, PlainSchema>,
): PlainSchemaFieldType {
  return {
    value: {
      case: "map",
      value: {
        key: protoScalarToKnitTable[protoField.K],
        value:
          protoField.V.kind === "message"
            ? {
              case: "message",
              value: getMessageSchema(protoField.V.T, relations, schemaCache),
            }
            : {
              case: "scalar",
              value: computeScalarType(protoField.V),
            },
      },
    },
  };
}

const protoScalarToKnitTable = {
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
  protoField:
    | {
      kind: "scalar";
      T: ScalarType;
    }
    | { kind: "enum"; T: EnumType },
): Schema_Field_Type_ScalarType {
  if (protoField.kind === "enum") {
    if (protoField.T.typeName === "google.protobuf.NullValue") {
      return Schema_Field_Type_ScalarType.NULL;
    }
    return Schema_Field_Type_ScalarType.ENUM;
  }
  return protoScalarToKnitTable[protoField.T];
}

type RelationsMap = Gateway["relations"];
type PlainSchema = PlainMessage<Schema>;
type PlainSchemaField = PlainMessage<Schema_Field>;
type PlainSchemaFieldType = PlainMessage<Schema_Field_Type>;
