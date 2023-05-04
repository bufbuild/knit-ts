// Copyright 2023 Buf Technologies, Inc.
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
import { type Equal, expectType } from "./jest/util";
import { createGateway, type UnaryAndServerStreamMethods } from "./gateway.js";
import type { KnitService } from "@buf/bufbuild_knit.bufbuild_connect-es/buf/knit/gateway/v1alpha1/knit_connect.js";
import { AllService } from "@bufbuild/knit-test-spec/spec/all_connect";

describe("types", () => {
  test("UnaryAndServerStreamMethods", () => {
    type ExpectedType = "do" | "fetch" | "listen";
    type ActualType = UnaryAndServerStreamMethods<typeof KnitService>;
    expectType<Equal<ExpectedType, ActualType>>(true);
  });
});

describe("addService", () => {
  test("defaults to all supported methods", () => {
    const router = createGateway({ transport: {} as any });
    router.addService(AllService);
    expect([...router.entryPoints.keys()].sort()).toEqual(
      [
        "spec.AllService.GetAll",
        "spec.AllService.CreateAll",
        "spec.AllService.StreamAll",
      ].sort()
    );
  });
  test("respects methods option", () => {
    const router = createGateway({ transport: {} as any });
    router.addService(AllService, { methods: ["getAll"] });
    expect([...router.entryPoints.keys()]).toEqual(["spec.AllService.GetAll"]);
  });
  test("respects transport override", () => {
    const router = createGateway({ transport: { kind: "base" } as any });
    router.addService(AllService, { transport: { kind: "override" } as any });
    expect(
      [...router.entryPoints.values()].map((v) => v.transport)
    ).toContainEqual({
      kind: "override",
    });
  });
});
