import { expect, test } from "@jest/globals";
import { stitch } from "./stitch.js";
import type { Patch } from "./json.js";
import { All } from "@bufbuild/knit-test-spec/spec/all_pb.js";
import { type AnyMessage, type PlainMessage, proto3 } from "@bufbuild/protobuf";
import { GetAllRelSelfParamResponse_AllParamResult } from "@bufbuild/knit-test-spec/spec/relations_pb.js";
import type { Relation } from "./gateway.js";
import {
  Schema_Field,
  Schema_Field_Type,
} from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import type {} from "./schema.js";

test("stitch", async () => {
  const base = new All();
  const relationFieldInfo =
    GetAllRelSelfParamResponse_AllParamResult.fields.find(1)!;
  expect(relationFieldInfo).toBeDefined();
  const target = {};
  const params = { scalars: { fields: { str: "param" } } };
  const relation = {
    field: relationFieldInfo,
    base: All,
    runtime: proto3,
    resolver: async (bases, gotParams) => {
      expect((gotParams as AnyMessage).toJson()).toEqual(params);
      return Array(bases.length).fill(new All({}));
    },
  } satisfies Relation;
  const localName = relationFieldInfo.localName;
  const terminalField = {
    name: localName,
    path: localName + "." + localName,
    jsonName: "",
    relation: relation,
    params: new All(params),
    onError: { case: undefined },
    type: {
      value: {
        case: "message",
        value: {
          localNameTable: new Map(),
          name: All.typeName,
          fields: [],
        },
      },
    },
  } satisfies PlainMessage<Schema_Field>;
  const type = {
    value: {
      case: "message",
      value: {
        localNameTable: new Map([[localName, terminalField]]),
        name: All.typeName,
        fields: [terminalField],
      },
    },
  } satisfies PlainMessage<Schema_Field_Type>;
  const patch = {
    base: base,
    target: target,
    errorPatch: undefined,
    field: {
      name: localName,
      relation: relation,
      path: localName,
      jsonName: "",
      type: type,
      onError: { case: undefined },
      params: new All(params),
    },
  } satisfies Patch;
  await stitch([patch], false);
  expect(target).toEqual({
    [localName]: {
      [localName]: {},
    },
  });
});
