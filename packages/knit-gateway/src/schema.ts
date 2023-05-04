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
  type MaskField,
  Schema,
  type Schema_Field,
  type Schema_Field_Type,
  Schema_Field_Type_ScalarType,
} from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import { Code, ConnectError } from "@bufbuild/connect";
import {
  type MessageType,
  type FieldInfo,
  ScalarType,
  type EnumType,
  type PlainMessage,
} from "@bufbuild/protobuf";
import { wktSet } from "./wkt.js";

export function computeSchema(
  message: MessageType,
  mask: MaskField[],
  path: string
): Schema {
  return new Schema(applyMask(getMessageSchema(message), mask, path));
}

function applyMask(
  schema: ComputedSchema,
  mask: MaskField[],
  path: string
): PlainMessage<Schema> {
  let fields: PlainMessage<Schema_Field>[] = [];
  for (const maskField of mask) {
    const field = schema.localNameTable.get(maskField.name);
    const fieldPath = `${path}.${maskField.name}`;
    if (field === undefined) {
      throw new ConnectError(
        `field ${fieldPath} not found`,
        Code.InvalidArgument
      );
    }
    fields = [
      ...fields,
      {
        ...field,
        type: applyMaskToType(field.type?.value, maskField.mask, fieldPath),
      },
    ];
  }
  return {
    name: schema.name,
    fields,
  };
}

function applyMaskToType(
  type: PlainMessage<Schema_Field_Type>["value"] | undefined,
  mask: MaskField[],
  path: string
): PlainMessage<Schema_Field_Type> {
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
                  type.value.value.value as ComputedSchema,
                  mask,
                  path
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
          value: applyMask(type.value as ComputedSchema, mask, path),
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
                  type.value.element.value as ComputedSchema,
                  mask,
                  path
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

type ComputedSchema = PlainMessage<Schema> & {
  localNameTable: Map<string, PlainMessage<Schema_Field>>;
};

const messageToSchemaTable = new Map<string, ComputedSchema>();

function getMessageSchema(message: MessageType): ComputedSchema {
  let schema = messageToSchemaTable.get(message.typeName);
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
  messageToSchemaTable.set(message.typeName, schema);
  const fields = computeMessageFields(message);
  schema.fields = fields;
  schema.localNameTable = new Map(fields.map((f) => [f.name, f]));
  return schema;
}

function computeMessageFields(
  message: MessageType
): PlainMessage<Schema_Field>[] {
  if (wktSet.has(message.typeName)) {
    return [];
  }
  let fields: PlainMessage<Schema_Field>[] = [];
  for (const protoField of message.fields.list()) {
    fields = [
      ...fields,
      {
        name: protoField.localName,
        jsonName:
          protoField.jsonName !== protoField.localName
            ? protoField.jsonName
            : "",
        type: computeFieldType(protoField),
      },
    ];
  }
  return fields;
}

function computeFieldType(
  protoField: FieldInfo
): PlainMessage<Schema_Field_Type> {
  if (protoField.kind === "map") {
    return computeMapType(protoField);
  }
  if (protoField.repeated) {
    return computeRepeatedType(protoField);
  }
  switch (protoField.kind) {
    case "enum":
    case "scalar":
      return {
        value: { case: "scalar", value: computeScalarType(protoField) },
      };
    case "message":
      return {
        value: { case: "message", value: getMessageSchema(protoField.T) },
      };
  }
}

function computeRepeatedType(
  protoField: FieldInfo & { readonly repeated: boolean } & {
    kind: "scalar" | "enum" | "message";
  }
): PlainMessage<Schema_Field_Type> {
  return {
    value: {
      case: "repeated",
      value: {
        element:
          protoField.kind === "message"
            ? {
                case: "message",
                value: getMessageSchema(protoField.T),
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
  protoField: FieldInfo & { kind: "map" }
): PlainMessage<Schema_Field_Type> {
  return {
    value: {
      case: "map",
      value: {
        key: protoScalarToKnitTable[protoField.K],
        value:
          protoField.V.kind === "message"
            ? {
                case: "message",
                value: getMessageSchema(protoField.V.T),
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
    | { kind: "enum"; T: EnumType }
): Schema_Field_Type_ScalarType {
  if (protoField.kind === "enum") {
    if (protoField.T.typeName === "google.protobuf.NullValue") {
      return Schema_Field_Type_ScalarType.NULL;
    }
    return Schema_Field_Type_ScalarType.ENUM;
  }
  return protoScalarToKnitTable[protoField.T];
}
