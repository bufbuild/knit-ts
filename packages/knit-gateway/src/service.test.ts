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

import { Code, ConnectError } from "@bufbuild/connect";
import { describe, test, jest, expect, beforeEach } from "@jest/globals";
import { createKnitService } from "./service.js";
import { AllService } from "@bufbuild/knit-test-spec/spec/all_connect.js";
import {
  DoResponse,
  FetchRequest,
  ListenRequest,
  ListenResponse,
} from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import { All } from "@bufbuild/knit-test-spec/spec/all_pb.js";
import { Value } from "@bufbuild/protobuf";
import { DoRequest } from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import { createAsyncIterable, pipeTo } from "@bufbuild/connect/protocol";

const transportSpyFn = () => ({
  unary: jest.fn(),
  stream: jest.fn(),
});

describe("unary", () => {
  let transportSpy: ReturnType<typeof transportSpyFn>;
  let service: ReturnType<typeof createKnitService>;
  beforeEach(() => {
    transportSpy = transportSpyFn();
    service = createKnitService({
      transport: transportSpy as any,
      services: [{ type: AllService }] as const,
    });
  });
  test("single request without mask", async () => {
    transportSpy.unary.mockReturnValueOnce(
      Promise.resolve({ message: new All({}) })
    );
    const res = await service.do(
      new DoRequest({
        requests: [
          {
            method: `${AllService.typeName}.${AllService.methods.getAll.name}`,
          },
        ],
      }),
      {} as any
    );
    expect(res).toEqual(
      new DoResponse({
        responses: [
          {
            method: `${AllService.typeName}.${AllService.methods.getAll.name}`,
            body: Value.fromJson({}),
            schema: {
              name: All.typeName,
              fields: [],
            },
          },
        ],
      })
    );
  });
});

describe("stream", () => {
  let transportSpy: ReturnType<typeof transportSpyFn>;
  let service: ReturnType<typeof createKnitService>;
  beforeEach(() => {
    transportSpy = transportSpyFn();
    service = createKnitService({
      transport: transportSpy as any,
      services: [{ type: AllService }] as const,
    });
  });
  test("stream without mask", async () => {
    transportSpy.stream.mockReturnValueOnce(
      Promise.resolve({ message: createAsyncIterable([new All({})]) })
    );
    const res = service.listen(
      new ListenRequest({
        request: {
          method: `${AllService.typeName}.${AllService.methods.streamAll.name}`,
        },
      }),
      {} as any
    );
    expect(
      await pipeTo(res, async (res) => {
        let next;
        for await (next of res) {
        }
        return next;
      })
    ).toEqual(
      new ListenResponse({
        response: {
          method: `${AllService.typeName}.${AllService.methods.streamAll.name}`,
          body: Value.fromJson({}),
          schema: {
            name: All.typeName,
            fields: [],
          },
        },
      })
    );
  });
});

describe("errors", () => {
  const service = createKnitService({
    transport: transportSpyFn() as any,
    services: [{ type: AllService }] as const,
  });
  test("Fetch on non idempotent method", async () => {
    expect.hasAssertions();
    try {
      await service.fetch(
        new FetchRequest({
          requests: [
            {
              method: `${AllService.typeName}.${AllService.methods.createAll.name}`,
            },
          ],
        }),
        {} as any
      );
    } catch (err) {
      expect(err).toBeInstanceOf(ConnectError);
      expect(err).toHaveProperty("code", Code.InvalidArgument);
    }
  });
  test("Fetch on non unknown method", async () => {
    expect.hasAssertions();
    try {
      await service.fetch(
        new FetchRequest({
          requests: [
            {
              method: `${AllService.typeName}.notAMethod`,
            },
          ],
        }),
        {} as any
      );
    } catch (err) {
      expect(err).toBeInstanceOf(ConnectError);
      expect(err).toHaveProperty("code", Code.NotFound);
    }
  });
  test("Fetch on non streaming method", async () => {
    expect.hasAssertions();
    try {
      await service.fetch(
        new FetchRequest({
          requests: [
            {
              method: `${AllService.typeName}.${AllService.methods.streamAll.name}`,
            },
          ],
        }),
        {} as any
      );
    } catch (err) {
      expect(err).toBeInstanceOf(ConnectError);
      expect(err).toHaveProperty("code", Code.InvalidArgument);
    }
  });
  test("Fetch on zero requests", async () => {
    expect.hasAssertions();
    try {
      await service.fetch(
        new FetchRequest({
          requests: [],
        }),
        {} as any
      );
    } catch (err) {
      expect(err).toBeInstanceOf(ConnectError);
      expect(err).toHaveProperty("code", Code.InvalidArgument);
    }
  });
});
