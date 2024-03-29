// @generated by protoc-gen-es v1.5.0
// @generated from file spec/proto2.proto (package spec, syntax proto2)
/* eslint-disable */
// @ts-nocheck

import { proto2 } from "@bufbuild/protobuf";

/**
 * @generated from enum spec.Proto2Enum
 */
export const Proto2Enum = proto2.makeEnum(
  "spec.Proto2Enum",
  [
    {no: 1, name: "UNSPECIFIED"},
    {no: 2, name: "SOMETHING"},
  ],
);

/**
 * @generated from message spec.Proto2Message
 */
export const Proto2Message = proto2.makeMessageType(
  "spec.Proto2Message",
  () => [
    { no: 1, name: "required_field", kind: "scalar", T: 5 /* ScalarType.INT32 */ },
    { no: 2, name: "optional_field", kind: "scalar", T: 13 /* ScalarType.UINT32 */, opt: true },
    { no: 3, name: "enum", kind: "enum", T: proto2.getEnumType(Proto2Enum), opt: true },
    { no: 4, name: "child", kind: "message", T: Proto2Child, opt: true },
  ],
);

/**
 * @generated from message spec.Proto2Child
 */
export const Proto2Child = proto2.makeMessageType(
  "spec.Proto2Child",
  () => [
    { no: 1, name: "id", kind: "scalar", T: 9 /* ScalarType.STRING */, opt: true },
  ],
);

