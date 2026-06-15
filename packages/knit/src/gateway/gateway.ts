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

import type { Transport } from "@connectrpc/connect";
import type {
  DescField,
  DescMessage,
  DescMethod,
  DescMethodUnary,
  DescService,
  Message,
  MessageInitShape,
} from "@bufbuild/protobuf";
import { min } from "./util";

/**
 * Options to configure {@link Gateway}
 */
interface GatewayOptions {
  /**
   * The transport to use for forwarding requests to endpoints.
   *
   * This can be overridden at the service/method level.
   */
  transport: Transport;
  /**
   * The default timeout in millisecond for RPC calls.
   *
   * This can be overbidden at the service/method level.
   */
  timeoutMs?: number;
}

/**
 * Options to configure a service using {@link Gateway}. See {@link Gateway.service}
 */
interface GatewayServiceOptions<S extends DescService> {
  /**
   * The transport to use for the service. Defaults to the base transport of the gateway.
   */
  transport?: Transport;
  /**
   * The methods to expose on the service. Defaults to all unary and server streaming methods.
   *
   * Client and Bidi streaming methods are not supported.
   */
  methods?: UnaryAndServerStreamMethods<S>[];
  /**
   * The timeout in millisecond to use for this service.
   */
  timeoutMs?: number;
}

interface GatewayRelationOptions {
  /**
   * The transport to use for this relation. Defaults to the base transport of the gateway.
   */
  transport?: Transport;
  /**
   * The timeout in millisecond to use for this service.
   */
  timeoutMs?: number;
}

/**
 * Gateway holds the state of the KnitService
 *
 * @internal
 */
export interface Gateway {
  /**
   * The configured entry points.
   */
  readonly entryPoints: ReadonlyMap<string, EntryPoint>;
  /**
   * The configured relations.
   *
   * The key is the fully qualified typeName of the base message.
   * The value is a map with key being the relation name and value being the relation.
   */
  readonly relations: ReadonlyMap<string, ReadonlyMap<string, Relation>>;
  /**
   * Add the service methods as entry points.
   */
  service<S extends DescService>(
    service: S,
    options?: GatewayServiceOptions<S>,
  ): Gateway;
  /**
   * Add relation(s) to the gateway.
   */
  relation<S extends DescService>(
    service: S,
    methods: RelationMethodConfig<S>,
    options?: GatewayRelationOptions,
  ): Gateway;
}

/**
 * Describes a Knit entry point method.
 *
 * @internal
 */
export interface EntryPoint {
  /**
   * The service that the method belongs to.
   */
  service: DescService;
  /**
   * The method to call.
   */
  method: DescMethod;
  /**
   * The transport to use for the call.
   */
  transport: Transport;
  /**
   * The timeout in millisecond to use for the call if any.
   */
  timeoutMs?: number;
}

/**
 * Describes a Knit relation.
 *
 * @internal
 */
export interface Relation {
  /**
   * The message type of the base message.
   */
  base: DescMessage;
  /**
   * The relation field info.
   */
  field: DescField;
  /**
   * The message type of the params.
   *
   * This is the resolver's request type; the params provided by a client are
   * the fields of the request other than `bases`.
   */
  params?: DescMessage;
  /**
   * The fully-qualified rpc method that resolves the relation.
   */
  method: string;
  /**
   * The resolver to use for the relation.
   */
  resolver: (
    bases: Message[],
    params: Message | undefined,
    context: ResolverContext,
  ) => Promise<unknown[]>;
}

/**
 * The context passed to a resolver
 *
 * @internal
 */
export interface ResolverContext {
  /**
   * The headers to use for the call.
   */
  headers?: Headers;
  /**
   * The abort signal to use for the call.
   */
  signal?: AbortSignal;
  /**
   * The timeout in millisecond to use for the call.
   */
  timeoutMs?: number;
}

/**
 * Returns the union of local names of unary and server streaming methods of a service.
 *
 * @internal
 */
export type UnaryAndServerStreamMethods<S extends DescService> = {
  [K in keyof S["method"]]: S["method"][K]["methodKind"] extends
    | "unary"
    | "server_streaming"
    ? K
    : never;
}[keyof S["method"]];

/**
 * Create a new Gateway.
 *
 * @internal
 */
export function createGateway({
  transport,
  timeoutMs,
}: GatewayOptions): Gateway {
  const entryPoints = new Map<string, EntryPoint>();
  const relations = new Map<string, Map<string, Relation>>();
  return {
    entryPoints,
    relations,
    service<S extends DescService>(
      service: S,
      options?: GatewayServiceOptions<S>,
    ) {
      for (const [localName, methodInfo] of Object.entries(service.method)) {
        switch (methodInfo.methodKind) {
          case "unary":
          case "server_streaming":
            break;
          default:
            // stream kind not supported
            continue;
        }
        if (
          options?.methods !== undefined &&
          !options.methods.includes(localName as UnaryAndServerStreamMethods<S>)
        ) {
          continue;
        }
        const fullyQualifiedMethodName = `${service.typeName}.${methodInfo.name}`;
        if (entryPoints.has(fullyQualifiedMethodName)) {
          throw new Error(
            `Knit: ${methodInfo.name} on ${service.typeName} provided more than once`,
          );
        }
        entryPoints.set(fullyQualifiedMethodName, {
          method: methodInfo,
          service: service,
          transport: options?.transport ?? transport,
          timeoutMs: options?.timeoutMs ?? timeoutMs,
        });
      }
      return this;
    },
    relation<S extends DescService>(
      service: S,
      methods: RelationMethodConfig<S>,
      options?: GatewayRelationOptions,
    ) {
      for (const [method, config] of Object.entries(methods)) {
        if (config === undefined) {
          throw new Error(
            `Knit: ${method}: relation config cannot be undefined`,
          );
        }
        if (config.name === "") {
          throw new Error("Knit: relation name cannot be empty");
        }
        const methodInfo = service.method[method];
        const base = getRepeatedMessage(methodInfo.input, 1, "bases");
        if (base.fields.find((f) => f.name === config.name) !== undefined) {
          throw new Error(
            `Knit: ${method}: relation name '${config.name}' already exists on ${base.typeName}`,
          );
        }
        const shell = getRepeatedMessage(methodInfo.output, 1, "values");
        const shellFields = shell.fields;
        if (shellFields.length !== 1) {
          throw new Error(
            `Knit: ${method}: relation must have exactly one field, found ${shellFields.length}`,
          );
        }
        const field = shellFields[0];
        if (field.number !== 1) {
          throw new Error(
            `Knit: ${method}: relation ${field.name} must have tag 1, found ${field.number}`,
          );
        }
        if (field.name !== config.name) {
          throw new Error(
            `Knit: ${method}: relation field must be named '${config.name}', found '${field.name}'`,
          );
        }
        let baseRelations = relations.get(base.typeName);
        if (baseRelations === undefined) {
          baseRelations = new Map();
          relations.set(base.typeName, baseRelations);
        }
        if (baseRelations.has(config.name)) {
          throw new Error(
            `Knit: ${method}: relation name '${config.name}' already exists on ${base.typeName}`,
          );
        }
        const paramFields = methodInfo.input.fields.filter(
          (f) => f.number !== 1,
        );
        // The params provided by a client are all request fields other than
        // `bases`. We reuse the request type to parse and validate them.
        const params: DescMessage | undefined =
          paramFields.length > 0 ? methodInfo.input : undefined;
        const resolverMethod = methodInfo as DescMethodUnary;
        const resolverTransport = options?.transport ?? transport;
        const resolverTimeoutMs = options?.timeoutMs ?? timeoutMs;
        baseRelations.set(config.name, {
          base,
          field,
          params,
          method: `${service.typeName}.${methodInfo.name}`,
          resolver: async (bases, params, { headers, signal, timeoutMs }) => {
            const response = await resolverTransport.unary(
              resolverMethod,
              signal,
              min(timeoutMs, resolverTimeoutMs),
              headers,
              {
                ...params,
                bases,
              } as MessageInitShape<DescMessage>,
            );
            return (
              (response.message as Record<string, unknown>)[
                "values"
              ] as Message[]
            ).map((v) => (v as Record<string, unknown>)[field.localName]);
          },
        });
      }
      return this;
    },
  };
}

function getRepeatedMessage(message: DescMessage, tag: number, name: string) {
  const field = message.fields.find((f) => f.number === tag);
  if (field === undefined) {
    throw new Error(
      `Knit: ${message.name}: relation must have a '${name}' field with tag ${tag}`,
    );
  }
  if (field.name !== name) {
    throw new Error(
      `Knit: ${message.name}: field with ${tag} must be named '${name}', found '${field.name}'`,
    );
  }
  if (field.fieldKind !== "list") {
    throw new Error(`Knit: ${message.name}: bases field must be repeated`);
  }
  if (field.listKind !== "message") {
    throw new Error(`Knit: ${message.name}: bases field must be a message `);
  }
  return field.message;
}

type RelationMethodConfig<S extends DescService> = {
  [K in keyof S["method"]]?: { name: string };
};
