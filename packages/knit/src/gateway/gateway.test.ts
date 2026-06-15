// Copyright 2023-2024 Buf Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { describe, test, expect } from "@jest/globals";
import { createGateway } from "./gateway.js";
import {
  AllService,
  AllSchema,
  type All,
} from "@bufbuild/knit-test-spec/spec/all_pb.js";
import { AllResolverService } from "@bufbuild/knit-test-spec/spec/relations_pb.js";
import { createRouterTransport } from "@connectrpc/connect";
import { create, toJson } from "@bufbuild/protobuf";

describe("service", () => {
  test("defaults to all supported methods", () => {
    const gateway = createGateway({ transport: {} as any });
    gateway.service(AllService);
    expect([...gateway.entryPoints.keys()].sort()).toEqual(
      [
        "spec.AllService.GetAll",
        "spec.AllService.CreateAll",
        "spec.AllService.StreamAll",
      ].sort(),
    );
  });
  test("respects methods option", () => {
    const gateway = createGateway({ transport: {} as any });
    gateway.service(AllService, { methods: ["getAll"] });
    expect([...gateway.entryPoints.keys()]).toEqual(["spec.AllService.GetAll"]);
  });
  test("respects transport override", () => {
    const gateway = createGateway({ transport: { kind: "base" } as any });
    gateway.service(AllService, { transport: { kind: "override" } as any });
    expect(
      [...gateway.entryPoints.values()].map((v) => v.transport),
    ).toContainEqual({
      kind: "override",
    });
  });
});

describe("relation", () => {
  test("adds relation", async () => {
    const gateway = createGateway({
      transport: createRouterTransport(({ service }) => {
        service(AllResolverService, {
          getAllRelSelf: ({ bases }) => {
            return {
              values: bases.map((base) => ({
                relSelf: base,
              })),
            };
          },
        });
      }),
    });
    gateway.relation(AllResolverService, {
      getAllRelSelf: {
        name: "rel_self",
      },
    });
    const base = create(AllSchema, {
      scalars: {
        fields: {
          str: "foo",
        },
      },
    });
    const response = await gateway.relations
      .get(AllSchema.typeName)
      ?.get("rel_self")
      ?.resolver([base], undefined, {});
    expect(response).toHaveLength(1);
    expect(toJson(AllSchema, response?.[0]! as All)).toEqual(
      toJson(AllSchema, base),
    );
  });
});
