// @generated by protoc-gen-es v1.3.0
// @generated from file spec/wkt.proto (package spec, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { Any, BinaryReadOptions, BoolValue, BytesValue, DoubleValue, Duration, Empty, FieldList, FieldMask, FloatValue, Int32Value, Int64Value, JsonReadOptions, JsonValue, ListValue, NullValue, PartialMessage, PlainMessage, StringValue, Struct, Timestamp, UInt32Value, UInt64Value, Value } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";

/**
 * @generated from message spec.Wkt
 */
export declare class Wkt extends Message<Wkt> {
  /**
   * @generated from field: spec.WktFields fields = 1;
   */
  fields?: WktFields;

  /**
   * @generated from field: spec.WktOneof oneofs = 2;
   */
  oneofs?: WktOneof;

  /**
   * @generated from field: spec.WktMap maps = 3;
   */
  maps?: WktMap;

  /**
   * @generated from field: spec.WktRepeated repeated = 4;
   */
  repeated?: WktRepeated;

  constructor(data?: PartialMessage<Wkt>);

  static readonly runtime: typeof proto3;
  static readonly typeName = "spec.Wkt";
  static readonly fields: FieldList;

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Wkt;

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Wkt;

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Wkt;

  static equals(a: Wkt | PlainMessage<Wkt> | undefined, b: Wkt | PlainMessage<Wkt> | undefined): boolean;
}

/**
 * @generated from message spec.WktFields
 */
export declare class WktFields extends Message<WktFields> {
  /**
   * @generated from field: google.protobuf.DoubleValue double_value = 1;
   */
  doubleValue?: number;

  /**
   * @generated from field: google.protobuf.BoolValue bool_value = 2;
   */
  boolValue?: boolean;

  /**
   * @generated from field: google.protobuf.FloatValue float_value = 3;
   */
  floatValue?: number;

  /**
   * @generated from field: google.protobuf.Int64Value int64_value = 4;
   */
  int64Value?: bigint;

  /**
   * @generated from field: google.protobuf.UInt64Value uint64_value = 5;
   */
  uint64Value?: bigint;

  /**
   * @generated from field: google.protobuf.Int32Value int32_value = 6;
   */
  int32Value?: number;

  /**
   * @generated from field: google.protobuf.UInt32Value uint32_value = 7;
   */
  uint32Value?: number;

  /**
   * @generated from field: google.protobuf.StringValue string_value = 8;
   */
  stringValue?: string;

  /**
   * @generated from field: google.protobuf.BytesValue bytes_value = 9;
   */
  bytesValue?: Uint8Array;

  /**
   * @generated from field: google.protobuf.Any any = 10;
   */
  any?: Any;

  /**
   * @generated from field: google.protobuf.Duration duration = 11;
   */
  duration?: Duration;

  /**
   * @generated from field: google.protobuf.Empty empty = 12;
   */
  empty?: Empty;

  /**
   * @generated from field: google.protobuf.FieldMask field_mask = 13;
   */
  fieldMask?: FieldMask;

  /**
   * @generated from field: google.protobuf.Timestamp timestamp = 14;
   */
  timestamp?: Timestamp;

  /**
   * @generated from field: google.protobuf.Struct struct = 15;
   */
  struct?: Struct;

  /**
   * @generated from field: google.protobuf.ListValue list_value = 16;
   */
  listValue?: ListValue;

  /**
   * @generated from field: google.protobuf.Value value = 17;
   */
  value?: Value;

  /**
   * @generated from field: google.protobuf.NullValue null_value = 18;
   */
  nullValue: NullValue;

  constructor(data?: PartialMessage<WktFields>);

  static readonly runtime: typeof proto3;
  static readonly typeName = "spec.WktFields";
  static readonly fields: FieldList;

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): WktFields;

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): WktFields;

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): WktFields;

  static equals(a: WktFields | PlainMessage<WktFields> | undefined, b: WktFields | PlainMessage<WktFields> | undefined): boolean;
}

/**
 * @generated from message spec.WktOneof
 */
export declare class WktOneof extends Message<WktOneof> {
  /**
   * @generated from oneof spec.WktOneof.oneof_value
   */
  oneofValue: {
    /**
     * @generated from field: google.protobuf.DoubleValue double_value = 1;
     */
    value: DoubleValue;
    case: "doubleValue";
  } | {
    /**
     * @generated from field: google.protobuf.BoolValue bool_value = 2;
     */
    value: BoolValue;
    case: "boolValue";
  } | {
    /**
     * @generated from field: google.protobuf.FloatValue float_value = 3;
     */
    value: FloatValue;
    case: "floatValue";
  } | {
    /**
     * @generated from field: google.protobuf.Int64Value int64_value = 4;
     */
    value: Int64Value;
    case: "int64Value";
  } | {
    /**
     * @generated from field: google.protobuf.UInt64Value uint64_value = 5;
     */
    value: UInt64Value;
    case: "uint64Value";
  } | {
    /**
     * @generated from field: google.protobuf.Int32Value int32_value = 6;
     */
    value: Int32Value;
    case: "int32Value";
  } | {
    /**
     * @generated from field: google.protobuf.UInt32Value uint32_value = 7;
     */
    value: UInt32Value;
    case: "uint32Value";
  } | {
    /**
     * @generated from field: google.protobuf.StringValue string_value = 8;
     */
    value: StringValue;
    case: "stringValue";
  } | {
    /**
     * @generated from field: google.protobuf.BytesValue bytes_value = 9;
     */
    value: BytesValue;
    case: "bytesValue";
  } | {
    /**
     * @generated from field: google.protobuf.Any any = 10;
     */
    value: Any;
    case: "any";
  } | {
    /**
     * @generated from field: google.protobuf.Duration duration = 11;
     */
    value: Duration;
    case: "duration";
  } | {
    /**
     * @generated from field: google.protobuf.Empty empty = 12;
     */
    value: Empty;
    case: "empty";
  } | {
    /**
     * @generated from field: google.protobuf.FieldMask field_mask = 13;
     */
    value: FieldMask;
    case: "fieldMask";
  } | {
    /**
     * @generated from field: google.protobuf.Timestamp timestamp = 14;
     */
    value: Timestamp;
    case: "timestamp";
  } | {
    /**
     * @generated from field: google.protobuf.Struct struct = 15;
     */
    value: Struct;
    case: "struct";
  } | {
    /**
     * @generated from field: google.protobuf.ListValue list_value = 16;
     */
    value: ListValue;
    case: "listValue";
  } | {
    /**
     * @generated from field: google.protobuf.Value value = 17;
     */
    value: Value;
    case: "value";
  } | {
    /**
     * @generated from field: google.protobuf.NullValue null_value = 18;
     */
    value: NullValue;
    case: "nullValue";
  } | { case: undefined; value?: undefined };

  constructor(data?: PartialMessage<WktOneof>);

  static readonly runtime: typeof proto3;
  static readonly typeName = "spec.WktOneof";
  static readonly fields: FieldList;

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): WktOneof;

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): WktOneof;

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): WktOneof;

  static equals(a: WktOneof | PlainMessage<WktOneof> | undefined, b: WktOneof | PlainMessage<WktOneof> | undefined): boolean;
}

/**
 * @generated from message spec.WktMap
 */
export declare class WktMap extends Message<WktMap> {
  /**
   * @generated from field: map<string, google.protobuf.DoubleValue> double_value = 1;
   */
  doubleValue: { [key: string]: DoubleValue };

  /**
   * @generated from field: map<string, google.protobuf.BoolValue> bool_value = 2;
   */
  boolValue: { [key: string]: BoolValue };

  /**
   * @generated from field: map<string, google.protobuf.FloatValue> float_value = 3;
   */
  floatValue: { [key: string]: FloatValue };

  /**
   * @generated from field: map<string, google.protobuf.Int64Value> int64_value = 4;
   */
  int64Value: { [key: string]: Int64Value };

  /**
   * @generated from field: map<string, google.protobuf.UInt64Value> uint64_value = 5;
   */
  uint64Value: { [key: string]: UInt64Value };

  /**
   * @generated from field: map<string, google.protobuf.Int32Value> int32_value = 6;
   */
  int32Value: { [key: string]: Int32Value };

  /**
   * @generated from field: map<string, google.protobuf.UInt32Value> uint32_value = 7;
   */
  uint32Value: { [key: string]: UInt32Value };

  /**
   * @generated from field: map<string, google.protobuf.StringValue> string_value = 8;
   */
  stringValue: { [key: string]: StringValue };

  /**
   * @generated from field: map<string, google.protobuf.BytesValue> bytes_value = 9;
   */
  bytesValue: { [key: string]: BytesValue };

  /**
   * @generated from field: map<string, google.protobuf.Any> any = 10;
   */
  any: { [key: string]: Any };

  /**
   * @generated from field: map<string, google.protobuf.Duration> duration = 11;
   */
  duration: { [key: string]: Duration };

  /**
   * @generated from field: map<string, google.protobuf.Empty> empty = 12;
   */
  empty: { [key: string]: Empty };

  /**
   * @generated from field: map<string, google.protobuf.FieldMask> field_mask = 13;
   */
  fieldMask: { [key: string]: FieldMask };

  /**
   * @generated from field: map<string, google.protobuf.Timestamp> timestamp = 14;
   */
  timestamp: { [key: string]: Timestamp };

  /**
   * @generated from field: map<string, google.protobuf.Struct> struct = 15;
   */
  struct: { [key: string]: Struct };

  /**
   * @generated from field: map<string, google.protobuf.ListValue> list_value = 16;
   */
  listValue: { [key: string]: ListValue };

  /**
   * @generated from field: map<string, google.protobuf.Value> value = 17;
   */
  value: { [key: string]: Value };

  /**
   * @generated from field: map<string, google.protobuf.NullValue> null_value = 18;
   */
  nullValue: { [key: string]: NullValue };

  constructor(data?: PartialMessage<WktMap>);

  static readonly runtime: typeof proto3;
  static readonly typeName = "spec.WktMap";
  static readonly fields: FieldList;

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): WktMap;

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): WktMap;

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): WktMap;

  static equals(a: WktMap | PlainMessage<WktMap> | undefined, b: WktMap | PlainMessage<WktMap> | undefined): boolean;
}

/**
 * @generated from message spec.WktRepeated
 */
export declare class WktRepeated extends Message<WktRepeated> {
  /**
   * @generated from field: repeated google.protobuf.DoubleValue double_value = 1;
   */
  doubleValue: DoubleValue[];

  /**
   * @generated from field: repeated google.protobuf.BoolValue bool_value = 2;
   */
  boolValue: BoolValue[];

  /**
   * @generated from field: repeated google.protobuf.FloatValue float_value = 3;
   */
  floatValue: FloatValue[];

  /**
   * @generated from field: repeated google.protobuf.Int64Value int64_value = 4;
   */
  int64Value: Int64Value[];

  /**
   * @generated from field: repeated google.protobuf.UInt64Value uint64_value = 5;
   */
  uint64Value: UInt64Value[];

  /**
   * @generated from field: repeated google.protobuf.Int32Value int32_value = 6;
   */
  int32Value: Int32Value[];

  /**
   * @generated from field: repeated google.protobuf.UInt32Value uint32_value = 7;
   */
  uint32Value: UInt32Value[];

  /**
   * @generated from field: repeated google.protobuf.StringValue string_value = 8;
   */
  stringValue: StringValue[];

  /**
   * @generated from field: repeated google.protobuf.BytesValue bytes_value = 9;
   */
  bytesValue: BytesValue[];

  /**
   * @generated from field: repeated google.protobuf.Any any = 10;
   */
  any: Any[];

  /**
   * @generated from field: repeated google.protobuf.Duration duration = 11;
   */
  duration: Duration[];

  /**
   * @generated from field: repeated google.protobuf.Empty empty = 12;
   */
  empty: Empty[];

  /**
   * @generated from field: repeated google.protobuf.FieldMask field_mask = 13;
   */
  fieldMask: FieldMask[];

  /**
   * @generated from field: repeated google.protobuf.Timestamp timestamp = 14;
   */
  timestamp: Timestamp[];

  /**
   * @generated from field: repeated google.protobuf.Struct struct = 15;
   */
  struct: Struct[];

  /**
   * @generated from field: repeated google.protobuf.ListValue list_value = 16;
   */
  listValue: ListValue[];

  /**
   * @generated from field: repeated google.protobuf.Value value = 17;
   */
  value: Value[];

  /**
   * @generated from field: repeated google.protobuf.NullValue null_value = 18;
   */
  nullValue: NullValue[];

  constructor(data?: PartialMessage<WktRepeated>);

  static readonly runtime: typeof proto3;
  static readonly typeName = "spec.WktRepeated";
  static readonly fields: FieldList;

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): WktRepeated;

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): WktRepeated;

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): WktRepeated;

  static equals(a: WktRepeated | PlainMessage<WktRepeated> | undefined, b: WktRepeated | PlainMessage<WktRepeated> | undefined): boolean;
}

