// @generated by protoc-gen-es v1.3.1
// @generated from file spec/json.proto (package spec, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { proto3 } from "@bufbuild/protobuf";

/**
 * @generated from message spec.CustomJsonName
 */
export const CustomJsonName = proto3.makeMessageType(
  "spec.CustomJsonName",
  () => [
    { no: 1, name: "name", jsonName: "not_name", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ],
);

