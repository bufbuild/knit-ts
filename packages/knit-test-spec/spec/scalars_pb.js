// @generated by protoc-gen-es v1.5.0
// @generated from file spec/scalars.proto (package spec, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { proto3 } from "@bufbuild/protobuf";

/**
 * @generated from message spec.Scalar
 */
export const Scalar = proto3.makeMessageType(
  "spec.Scalar",
  () => [
    { no: 1, name: "fields", kind: "message", T: ScalarFields },
    { no: 2, name: "repeated", kind: "message", T: ScalarRepeated },
    { no: 3, name: "map", kind: "message", T: ScalarMap },
    { no: 4, name: "oneof", kind: "message", T: ScalarOneof },
  ],
);

/**
 * @generated from message spec.ScalarFields
 */
export const ScalarFields = proto3.makeMessageType(
  "spec.ScalarFields",
  () => [
    { no: 1, name: "str", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "bl", kind: "scalar", T: 8 /* ScalarType.BOOL */ },
    { no: 3, name: "i32", kind: "scalar", T: 5 /* ScalarType.INT32 */ },
    { no: 4, name: "i64", kind: "scalar", T: 3 /* ScalarType.INT64 */ },
    { no: 5, name: "u32", kind: "scalar", T: 13 /* ScalarType.UINT32 */ },
    { no: 6, name: "u64", kind: "scalar", T: 4 /* ScalarType.UINT64 */ },
    { no: 7, name: "s32", kind: "scalar", T: 17 /* ScalarType.SINT32 */ },
    { no: 8, name: "s64", kind: "scalar", T: 18 /* ScalarType.SINT64 */ },
    { no: 9, name: "f32", kind: "scalar", T: 7 /* ScalarType.FIXED32 */ },
    { no: 10, name: "f64", kind: "scalar", T: 6 /* ScalarType.FIXED64 */ },
    { no: 11, name: "sf32", kind: "scalar", T: 15 /* ScalarType.SFIXED32 */ },
    { no: 12, name: "sf64", kind: "scalar", T: 16 /* ScalarType.SFIXED64 */ },
    { no: 13, name: "by", kind: "scalar", T: 12 /* ScalarType.BYTES */ },
    { no: 14, name: "db", kind: "scalar", T: 1 /* ScalarType.DOUBLE */ },
    { no: 15, name: "fl", kind: "scalar", T: 2 /* ScalarType.FLOAT */ },
  ],
);

/**
 * @generated from message spec.ScalarFieldsOptional
 */
export const ScalarFieldsOptional = proto3.makeMessageType(
  "spec.ScalarFieldsOptional",
  () => [
    { no: 1, name: "str", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
    { no: 2, name: "bl", kind: "scalar", T: 8 /* ScalarType.BOOL */, opt: true },
    { no: 3, name: "i32", kind: "scalar", T: 5 /* ScalarType.INT32 */, opt: true },
    { no: 4, name: "i64", kind: "scalar", T: 3 /* ScalarType.INT64 */, opt: true },
    { no: 5, name: "u32", kind: "scalar", T: 13 /* ScalarType.UINT32 */, opt: true },
    { no: 6, name: "u64", kind: "scalar", T: 4 /* ScalarType.UINT64 */, opt: true },
    { no: 7, name: "s32", kind: "scalar", T: 17 /* ScalarType.SINT32 */, opt: true },
    { no: 8, name: "s64", kind: "scalar", T: 18 /* ScalarType.SINT64 */, opt: true },
    { no: 9, name: "f32", kind: "scalar", T: 7 /* ScalarType.FIXED32 */, opt: true },
    { no: 10, name: "f64", kind: "scalar", T: 6 /* ScalarType.FIXED64 */, opt: true },
    { no: 11, name: "sf32", kind: "scalar", T: 15 /* ScalarType.SFIXED32 */, opt: true },
    { no: 12, name: "sf64", kind: "scalar", T: 16 /* ScalarType.SFIXED64 */, opt: true },
    { no: 13, name: "by", kind: "scalar", T: 12 /* ScalarType.BYTES */, opt: true },
    { no: 14, name: "db", kind: "scalar", T: 1 /* ScalarType.DOUBLE */, opt: true },
    { no: 15, name: "fl", kind: "scalar", T: 2 /* ScalarType.FLOAT */, opt: true },
  ],
);

/**
 * @generated from message spec.ScalarRepeated
 */
export const ScalarRepeated = proto3.makeMessageType(
  "spec.ScalarRepeated",
  () => [
    { no: 1, name: "str", kind: "scalar", T: 9 /* ScalarType.STRING */, repeated: true },
    { no: 2, name: "bl", kind: "scalar", T: 8 /* ScalarType.BOOL */, repeated: true },
    { no: 3, name: "i32", kind: "scalar", T: 5 /* ScalarType.INT32 */, repeated: true },
    { no: 4, name: "i64", kind: "scalar", T: 3 /* ScalarType.INT64 */, repeated: true },
    { no: 5, name: "u32", kind: "scalar", T: 13 /* ScalarType.UINT32 */, repeated: true },
    { no: 6, name: "u64", kind: "scalar", T: 4 /* ScalarType.UINT64 */, repeated: true },
    { no: 7, name: "s32", kind: "scalar", T: 17 /* ScalarType.SINT32 */, repeated: true },
    { no: 8, name: "s64", kind: "scalar", T: 18 /* ScalarType.SINT64 */, repeated: true },
    { no: 9, name: "f32", kind: "scalar", T: 7 /* ScalarType.FIXED32 */, repeated: true },
    { no: 10, name: "f64", kind: "scalar", T: 6 /* ScalarType.FIXED64 */, repeated: true },
    { no: 11, name: "sf32", kind: "scalar", T: 15 /* ScalarType.SFIXED32 */, repeated: true },
    { no: 12, name: "sf64", kind: "scalar", T: 16 /* ScalarType.SFIXED64 */, repeated: true },
    { no: 13, name: "by", kind: "scalar", T: 12 /* ScalarType.BYTES */, repeated: true },
    { no: 14, name: "db", kind: "scalar", T: 1 /* ScalarType.DOUBLE */, repeated: true },
    { no: 15, name: "fl", kind: "scalar", T: 2 /* ScalarType.FLOAT */, repeated: true },
  ],
);

/**
 * @generated from message spec.ScalarMap
 */
export const ScalarMap = proto3.makeMessageType(
  "spec.ScalarMap",
  () => [
    { no: 1, name: "str", kind: "map", K: 9 /* ScalarType.STRING */, V: {kind: "scalar", T: 9 /* ScalarType.STRING */} },
    { no: 2, name: "bl", kind: "map", K: 9 /* ScalarType.STRING */, V: {kind: "scalar", T: 8 /* ScalarType.BOOL */} },
    { no: 3, name: "i32", kind: "map", K: 9 /* ScalarType.STRING */, V: {kind: "scalar", T: 5 /* ScalarType.INT32 */} },
    { no: 4, name: "i64", kind: "map", K: 9 /* ScalarType.STRING */, V: {kind: "scalar", T: 3 /* ScalarType.INT64 */} },
    { no: 5, name: "u32", kind: "map", K: 9 /* ScalarType.STRING */, V: {kind: "scalar", T: 13 /* ScalarType.UINT32 */} },
    { no: 6, name: "u64", kind: "map", K: 9 /* ScalarType.STRING */, V: {kind: "scalar", T: 4 /* ScalarType.UINT64 */} },
    { no: 7, name: "s32", kind: "map", K: 9 /* ScalarType.STRING */, V: {kind: "scalar", T: 17 /* ScalarType.SINT32 */} },
    { no: 8, name: "s64", kind: "map", K: 9 /* ScalarType.STRING */, V: {kind: "scalar", T: 18 /* ScalarType.SINT64 */} },
    { no: 9, name: "f32", kind: "map", K: 9 /* ScalarType.STRING */, V: {kind: "scalar", T: 7 /* ScalarType.FIXED32 */} },
    { no: 10, name: "f64", kind: "map", K: 9 /* ScalarType.STRING */, V: {kind: "scalar", T: 6 /* ScalarType.FIXED64 */} },
    { no: 11, name: "sf32", kind: "map", K: 9 /* ScalarType.STRING */, V: {kind: "scalar", T: 15 /* ScalarType.SFIXED32 */} },
    { no: 12, name: "sf64", kind: "map", K: 9 /* ScalarType.STRING */, V: {kind: "scalar", T: 16 /* ScalarType.SFIXED64 */} },
    { no: 13, name: "by", kind: "map", K: 9 /* ScalarType.STRING */, V: {kind: "scalar", T: 12 /* ScalarType.BYTES */} },
    { no: 14, name: "db", kind: "map", K: 9 /* ScalarType.STRING */, V: {kind: "scalar", T: 1 /* ScalarType.DOUBLE */} },
    { no: 15, name: "fl", kind: "map", K: 9 /* ScalarType.STRING */, V: {kind: "scalar", T: 2 /* ScalarType.FLOAT */} },
  ],
);

/**
 * @generated from message spec.ScalarOneof
 */
export const ScalarOneof = proto3.makeMessageType(
  "spec.ScalarOneof",
  () => [
    { no: 1, name: "str", kind: "scalar", T: 9 /* ScalarType.STRING */, oneof: "oneof_value" },
    { no: 2, name: "bl", kind: "scalar", T: 8 /* ScalarType.BOOL */, oneof: "oneof_value" },
    { no: 3, name: "i32", kind: "scalar", T: 5 /* ScalarType.INT32 */, oneof: "oneof_value" },
    { no: 4, name: "i64", kind: "scalar", T: 3 /* ScalarType.INT64 */, oneof: "oneof_value" },
    { no: 5, name: "u32", kind: "scalar", T: 13 /* ScalarType.UINT32 */, oneof: "oneof_value" },
    { no: 6, name: "u64", kind: "scalar", T: 4 /* ScalarType.UINT64 */, oneof: "oneof_value" },
    { no: 7, name: "s32", kind: "scalar", T: 17 /* ScalarType.SINT32 */, oneof: "oneof_value" },
    { no: 8, name: "s64", kind: "scalar", T: 18 /* ScalarType.SINT64 */, oneof: "oneof_value" },
    { no: 9, name: "f32", kind: "scalar", T: 7 /* ScalarType.FIXED32 */, oneof: "oneof_value" },
    { no: 10, name: "f64", kind: "scalar", T: 6 /* ScalarType.FIXED64 */, oneof: "oneof_value" },
    { no: 11, name: "sf32", kind: "scalar", T: 15 /* ScalarType.SFIXED32 */, oneof: "oneof_value" },
    { no: 12, name: "sf64", kind: "scalar", T: 16 /* ScalarType.SFIXED64 */, oneof: "oneof_value" },
    { no: 13, name: "by", kind: "scalar", T: 12 /* ScalarType.BYTES */, oneof: "oneof_value" },
    { no: 14, name: "db", kind: "scalar", T: 1 /* ScalarType.DOUBLE */, oneof: "oneof_value" },
    { no: 15, name: "fl", kind: "scalar", T: 2 /* ScalarType.FLOAT */, oneof: "oneof_value" },
  ],
);

