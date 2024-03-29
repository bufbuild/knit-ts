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

import type { Schema_Field } from "@buf/bufbuild_knit.bufbuild_es/buf/knit/gateway/v1alpha1/knit_pb.js";
import type {
  JsonObject,
  AnyMessage,
  PlainMessage,
  IMessageTypeRegistry,
} from "@bufbuild/protobuf";
import type { Relation, ResolverContext } from "./gateway.js";
import {
  formatValue,
  type ErrorPatch,
  type Patch,
  formatError,
} from "./json.js";
import { Code, ConnectError } from "@connectrpc/connect";
import { makeResolverHeaders } from "./headers.js";

interface Batch {
  bases: AnyMessage[];
  formatTargets: JsonObject[];
  errorPatches: (ErrorPatch | undefined)[];
  field: PlainMessage<Schema_Field> & {
    relation: Relation;
    operations: string[];
  };
}

/**
 * Stitches the patches into the targets.
 */
export async function stitch(
  patches: Patch[],
  fallbackCatch: boolean,
  typeRegistry: IMessageTypeRegistry | undefined,
  context: ResolverContext,
) {
  while (patches.length > 0) {
    const batches = makeBatches(patches);
    const resolves: Promise<Patch[]>[] = [];
    for (const batch of batches) {
      resolves.push(resolveBatch(batch, fallbackCatch, typeRegistry, context));
    }
    patches = (await Promise.all(resolves)).flat();
  }
}

async function resolveBatch(
  { field, bases, formatTargets, errorPatches }: Batch,
  fallbackCatch: boolean,
  typeRegistry: IMessageTypeRegistry | undefined,
  context: ResolverContext,
): Promise<Patch[]> {
  let results: unknown[];
  try {
    const headers = new Headers(context.headers);
    headers.set("Knit-Operations", field.operations.join(","));
    results = await field.relation.resolver(bases, field.params, {
      ...context,
      headers: makeResolverHeaders(context.headers, field.operations),
    });
    if (results.length !== formatTargets.length) {
      throw new ConnectError(
        `resolver returned ${results.length} results, expected ${formatTargets.length}`,
        Code.Internal,
      );
    }
  } catch (err) {
    const knitError = formatError(err, "", typeRegistry);
    for (const errorPatch of errorPatches) {
      if (errorPatch === undefined) {
        throw err;
      }
      errorPatch.target[errorPatch.name] = knitError;
    }
    return [];
  }
  const patches: Patch[] = [];
  for (let i = 0; i < results.length; i++) {
    const target = formatTargets[i];
    const result = results[i];
    const [formattedResult, resultPatches] = formatValue(
      result,
      field.relation.field,
      field.relation.runtime,
      field.type?.value.value,
      errorPatches[i],
      fallbackCatch,
      typeRegistry,
    );
    if (formattedResult === undefined) continue;
    target[field.name] = formattedResult;
    patches.push(...resultPatches);
  }
  return patches;
}

function makeBatches(patches: Patch[]) {
  // Maps only support reference checks for objects, so we use nested maps
  // as an alternative to composite keys.
  const groups = new Map<Relation, Map<AnyMessage | undefined, Batch>>();
  const batches: Batch[] = [];
  for (const patch of patches) {
    let relationPatches = groups.get(patch.field.relation);
    if (relationPatches === undefined) {
      relationPatches = new Map();
      groups.set(patch.field.relation, relationPatches);
    }
    let batch = relationPatches.get(patch.field.params);
    if (batch === undefined) {
      batch = {
        bases: [],
        formatTargets: [],
        errorPatches: [],
        field: patch.field,
      };
      relationPatches.set(patch.field.params, batch);
      batches.push(batch);
    }
    batch.bases.push(patch.base);
    batch.formatTargets.push(patch.target);
    batch.errorPatches.push(patch.errorPatch);
  }
  return batches;
}
