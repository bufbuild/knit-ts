// @generated by protoc-gen-knit-ts v0.0.4
// @generated from file spec/oneof.proto (package spec, syntax proto3)
/* eslint-disable */
// @ts-nocheck

export interface Oneof {
    oneofValue?: {
        "@oneof": {
            scalar: string;
            message: OneofMessage;
            enum: {
                "@enum": OneofEnum;
            };
            nestedMessage: NestedMessage;
        };
    };
}
export interface OneofMessage {
    id: string;
}
export interface NestedMessage {
    nested?: OneofMessage;
}
export declare type OneofEnum = "ONEOF_ENUM_ZERO" | "ONEOF_ENUM_TWO" | number;
