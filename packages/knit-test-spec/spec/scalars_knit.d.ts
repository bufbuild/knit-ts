// @generated by protoc-gen-knit-ts v0.0.3
// @generated from file spec/scalars.proto (package spec, syntax proto3)
/* eslint-disable */
// @ts-nocheck

export interface Scalar {
    fields?: ScalarFields;
    repeated?: ScalarRepeated;
    map?: ScalarMap;
    oneof?: ScalarOneof;
}
export interface ScalarFields {
    str: string;
    bl: boolean;
    i32: number;
    i64: bigint;
    u32: number;
    u64: bigint;
    s32: number;
    s64: bigint;
    f32: number;
    f64: bigint;
    sf32: number;
    sf64: bigint;
    by: Uint8Array;
    db: number;
    fl: number;
}
export interface ScalarFieldsOptional {
    str?: string;
    bl?: boolean;
    i32?: number;
    i64?: bigint;
    u32?: number;
    u64?: bigint;
    s32?: number;
    s64?: bigint;
    f32?: number;
    f64?: bigint;
    sf32?: number;
    sf64?: bigint;
    by?: Uint8Array;
    db?: number;
    fl?: number;
}
export interface ScalarRepeated {
    str: Array<string>;
    bl: Array<boolean>;
    i32: Array<number>;
    i64: Array<bigint>;
    u32: Array<number>;
    u64: Array<bigint>;
    s32: Array<number>;
    s64: Array<bigint>;
    f32: Array<number>;
    f64: Array<bigint>;
    sf32: Array<number>;
    sf64: Array<bigint>;
    by: Array<Uint8Array>;
    db: Array<number>;
    fl: Array<number>;
}
export interface ScalarMap {
    str: {
        "@map": {
            [k: string]: string;
        };
    };
    bl: {
        "@map": {
            [k: string]: boolean;
        };
    };
    i32: {
        "@map": {
            [k: string]: number;
        };
    };
    i64: {
        "@map": {
            [k: string]: bigint;
        };
    };
    u32: {
        "@map": {
            [k: string]: number;
        };
    };
    u64: {
        "@map": {
            [k: string]: bigint;
        };
    };
    s32: {
        "@map": {
            [k: string]: number;
        };
    };
    s64: {
        "@map": {
            [k: string]: bigint;
        };
    };
    f32: {
        "@map": {
            [k: string]: number;
        };
    };
    f64: {
        "@map": {
            [k: string]: bigint;
        };
    };
    sf32: {
        "@map": {
            [k: string]: number;
        };
    };
    sf64: {
        "@map": {
            [k: string]: bigint;
        };
    };
    by: {
        "@map": {
            [k: string]: Uint8Array;
        };
    };
    db: {
        "@map": {
            [k: string]: number;
        };
    };
    fl: {
        "@map": {
            [k: string]: number;
        };
    };
}
export interface ScalarOneof {
    oneofValue?: {
        "@oneof": {
            str: string;
            bl: boolean;
            i32: number;
            i64: bigint;
            u32: number;
            u64: bigint;
            s32: number;
            s64: bigint;
            f32: number;
            f64: bigint;
            sf32: number;
            sf64: bigint;
            by: Uint8Array;
            db: number;
            fl: number;
        };
    };
}
