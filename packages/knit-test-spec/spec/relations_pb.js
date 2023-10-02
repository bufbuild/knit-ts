// @generated by protoc-gen-es v1.3.1
// @generated from file spec/relations.proto (package spec, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { proto3 } from "@bufbuild/protobuf";
import { All } from "./all_pb.js";

/**
 * @generated from message spec.GetAllRelSelfRequest
 */
export const GetAllRelSelfRequest = proto3.makeMessageType(
  "spec.GetAllRelSelfRequest",
  () => [
    { no: 1, name: "bases", kind: "message", T: All, repeated: true },
  ],
);

/**
 * @generated from message spec.GetAllRelSelfResponse
 */
export const GetAllRelSelfResponse = proto3.makeMessageType(
  "spec.GetAllRelSelfResponse",
  () => [
    { no: 1, name: "values", kind: "message", T: GetAllRelSelfResponse_AllResult, repeated: true },
  ],
);

/**
 * @generated from message spec.GetAllRelSelfResponse.AllResult
 */
export const GetAllRelSelfResponse_AllResult = proto3.makeMessageType(
  "spec.GetAllRelSelfResponse.AllResult",
  () => [
    { no: 1, name: "rel_self", kind: "message", T: All },
  ],
  {localName: "GetAllRelSelfResponse_AllResult"},
);

/**
 * @generated from message spec.GetAllRelSelfParamRequest
 */
export const GetAllRelSelfParamRequest = proto3.makeMessageType(
  "spec.GetAllRelSelfParamRequest",
  () => [
    { no: 1, name: "bases", kind: "message", T: All, repeated: true },
    { no: 2, name: "id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ],
);

/**
 * @generated from message spec.GetAllRelSelfParamResponse
 */
export const GetAllRelSelfParamResponse = proto3.makeMessageType(
  "spec.GetAllRelSelfParamResponse",
  () => [
    { no: 1, name: "values", kind: "message", T: GetAllRelSelfParamResponse_AllParamResult, repeated: true },
  ],
);

/**
 * @generated from message spec.GetAllRelSelfParamResponse.AllParamResult
 */
export const GetAllRelSelfParamResponse_AllParamResult = proto3.makeMessageType(
  "spec.GetAllRelSelfParamResponse.AllParamResult",
  () => [
    { no: 1, name: "rel_self_param", kind: "message", T: All },
  ],
  {localName: "GetAllRelSelfParamResponse_AllParamResult"},
);

