// @generated by protoc-gen-connect-es v1.1.3
// @generated from file spec/relations.proto (package spec, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { GetAllRelSelfParamRequest, GetAllRelSelfParamResponse, GetAllRelSelfRequest, GetAllRelSelfResponse } from "./relations_pb.js";
import { MethodKind } from "@bufbuild/protobuf";

/**
 * @generated from service spec.AllResolverService
 */
export declare const AllResolverService: {
  readonly typeName: "spec.AllResolverService",
  readonly methods: {
    /**
     * @generated from rpc spec.AllResolverService.GetAllRelSelf
     */
    readonly getAllRelSelf: {
      readonly name: "GetAllRelSelf",
      readonly I: typeof GetAllRelSelfRequest,
      readonly O: typeof GetAllRelSelfResponse,
      readonly kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc spec.AllResolverService.GetAllRelSelfParam
     */
    readonly getAllRelSelfParam: {
      readonly name: "GetAllRelSelfParam",
      readonly I: typeof GetAllRelSelfParamRequest,
      readonly O: typeof GetAllRelSelfParamResponse,
      readonly kind: MethodKind.Unary,
    },
  }
};

