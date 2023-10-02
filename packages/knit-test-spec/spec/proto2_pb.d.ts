// @generated by protoc-gen-es v1.3.1
// @generated from file spec/proto2.proto (package spec, syntax proto2)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto2 } from "@bufbuild/protobuf";

/**
 * @generated from enum spec.Proto2Enum
 */
export declare enum Proto2Enum {
  /**
   * @generated from enum value: UNSPECIFIED = 1;
   */
  UNSPECIFIED = 1,

  /**
   * @generated from enum value: SOMETHING = 2;
   */
  SOMETHING = 2,
}

/**
 * @generated from message spec.Proto2Message
 */
export declare class Proto2Message extends Message<Proto2Message> {
  /**
   * @generated from field: required int32 required_field = 1;
   */
  requiredField: number;

  /**
   * @generated from field: optional uint32 optional_field = 2;
   */
  optionalField?: number;

  /**
   * @generated from field: optional spec.Proto2Enum enum = 3;
   */
  enum?: Proto2Enum;

  /**
   * @generated from field: optional spec.Proto2Child child = 4;
   */
  child?: Proto2Child;

  constructor(data?: PartialMessage<Proto2Message>);

  static readonly runtime: typeof proto2;
  static readonly typeName = "spec.Proto2Message";
  static readonly fields: FieldList;

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Proto2Message;

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Proto2Message;

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Proto2Message;

  static equals(a: Proto2Message | PlainMessage<Proto2Message> | undefined, b: Proto2Message | PlainMessage<Proto2Message> | undefined): boolean;
}

/**
 * @generated from message spec.Proto2Child
 */
export declare class Proto2Child extends Message<Proto2Child> {
  /**
   * @generated from field: optional string id = 1;
   */
  id?: string;

  constructor(data?: PartialMessage<Proto2Child>);

  static readonly runtime: typeof proto2;
  static readonly typeName = "spec.Proto2Child";
  static readonly fields: FieldList;

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Proto2Child;

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Proto2Child;

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Proto2Child;

  static equals(a: Proto2Child | PlainMessage<Proto2Child> | undefined, b: Proto2Child | PlainMessage<Proto2Child> | undefined): boolean;
}

