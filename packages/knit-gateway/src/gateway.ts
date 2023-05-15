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

import type { Transport } from "@bufbuild/connect";
import { MethodKind, type PlainMessage } from "@bufbuild/protobuf";
import type {
  ServiceType,
  MethodInfo,
  AnyMessage,
  FieldInfo,
  MessageType,
  PartialMessage,
} from "@bufbuild/protobuf";
import type { RelationConfig } from "@buf/bufbuild_knit.bufbuild_es/buf/knit/v1alpha1/options_pb.js";

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
 * Options to configure a service using {@link Gateway}. See {@link Gateway.addService}
 */
interface GatewayServiceOptions<S extends ServiceType> {
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
  addService<S extends ServiceType>(
    service: S,
    options?: GatewayServiceOptions<S>
  ): void;
  /**
   * Add relation(s) to the gateway.
   */
  addRelation<S extends ServiceType>(
    service: S,
    methods: RelationMethodConfig<S>,
    options?: GatewayRelationOptions
  ): void;
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
  service: ServiceType;
  /**
   * The method to call.
   */
  method: MethodInfo;
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
  base: MessageType;
  /**
   * The relation field info.
   */
  field: FieldInfo;
  /**
   * The message type of the params.
   */
  params?: MessageType;
  /**
   * The runtime to use for the relation.
   *
   * This is the runtime of the file it was defined in.
   */
  runtime: MessageType["runtime"];
  /**
   * The resolver to use for the relation.
   */
  resolver: (
    bases: AnyMessage[],
    params: PartialMessage<AnyMessage> | undefined
  ) => Promise<unknown[]>;
}

/**
 * Returns the union of local names of unary and server streaming methods of a service.
 *
 * @internal
 */
export type UnaryAndServerStreamMethods<S extends ServiceType> = {
  [K in keyof S["methods"]]: S["methods"][K]["kind"] extends
    | MethodKind.Unary
    | MethodKind.ServerStreaming
    ? K
    : never;
}[keyof S["methods"]];

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
    addService<S extends ServiceType>(
      service: S,
      options?: GatewayServiceOptions<S>
    ) {
      for (const [localName, methodInfo] of Object.entries(service.methods)) {
        switch (methodInfo.kind) {
          case MethodKind.Unary:
          case MethodKind.ServerStreaming:
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
            `Knit: ${methodInfo.name} on ${service.typeName} provided more than once`
          );
        }
        entryPoints.set(fullyQualifiedMethodName, {
          method: methodInfo,
          service: service,
          transport: options?.transport ?? transport,
          timeoutMs: options?.timeoutMs ?? timeoutMs,
        });
      }
    },
    addRelation<S extends ServiceType>(
      service: S,
      methods: RelationMethodConfig<S>,
      options?: GatewayRelationOptions
    ) {
      for (const [method, config] of Object.entries(methods)) {
        if (config === undefined) {
          throw new Error(
            `Knit: ${method}: relation config cannot be undefined`
          );
        }
        if (config.name === "") {
          throw new Error("Knit: relation name cannot be empty");
        }
        const methodInfo = service.methods[method];
        const base = getRepeatedMessage(methodInfo.I, 1, "bases");
        if (
          base.fields.list().find((f) => f.name === config.name) !== undefined
        ) {
          throw new Error(
            `Knit: ${method}: relation name '${config.name}' already exists on ${base.typeName}`
          );
        }
        const shell = getRepeatedMessage(methodInfo.O, 1, "values");
        const shellFields = shell.fields.list();
        if (shellFields.length !== 1) {
          throw new Error(
            `Knit: ${method}: relation must have exactly one field, found ${shellFields.length}`
          );
        }
        const field = shellFields[0];
        if (field.no !== 1) {
          throw new Error(
            `Knit: ${method}: relation ${field.name} must have tag 1, found ${field.no}`
          );
        }
        if (field.name !== config.name) {
          throw new Error(
            `Knit: ${method}: relation field must be named '${config.name}', found '${field.name}'`
          );
        }
        let baseRelations = relations.get(base.typeName);
        if (baseRelations === undefined) {
          baseRelations = new Map();
          relations.set(base.typeName, baseRelations);
        }
        if (baseRelations.has(config.name)) {
          throw new Error(
            `Knit: ${method}: relation name '${config.name}' already exists on ${base.typeName}`
          );
        }
        const paramFields = methodInfo.I.fields
          .list()
          .filter((f) => f.no !== 1);
        let params: MessageType | undefined = undefined;
        if (paramFields.length > 0) {
          params = methodInfo.I.runtime.makeMessageType(
            `buf.knit.params.${base.typeName}.${config.name}`,
            methodInfo.I.fields.list().filter((f) => f.no !== 1)
          );
        }
        baseRelations.set(config.name, {
          base,
          field,
          runtime: shell.runtime,
          params,
          resolver: async (bases, params) => {
            const resolverTransport = options?.transport ?? transport;
            const resolverTimeoutMs = options?.timeoutMs ?? timeoutMs;
            const response = await resolverTransport.unary(
              service,
              methodInfo,
              undefined, // TODO: add cancelation support
              resolverTimeoutMs,
              undefined, // TODO: propagate headers
              {
                bases,
                ...params,
              }
            );
            return (response.message["values"] as Array<AnyMessage>).map(
              (v: AnyMessage) => v[field.localName] as unknown
            );
          },
        });
      }
    },
  };
}

function getRepeatedMessage(message: MessageType, tag: number, name: string) {
  const field = message.fields.find(tag);
  if (field === undefined) {
    throw new Error(
      `Knit: ${message.name}: relation must have a '${name}' field with tag ${tag}`
    );
  }
  if (field.name !== name) {
    throw new Error(
      `Knit: ${message.name}: field with ${tag} must be named '${name}', found '${field.name}'`
    );
  }
  if (!field.repeated) {
    throw new Error(`Knit: ${message.name}: bases field must be repeated`);
  }
  if (field.kind !== "message") {
    throw new Error(`Knit: ${message.name}: bases field must be a message `);
  }
  return field.T;
}

type RelationMethodConfig<S extends ServiceType> = {
  [K in keyof S["methods"]]?: PlainMessage<RelationConfig>;
};
