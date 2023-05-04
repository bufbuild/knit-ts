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
import {
  MethodKind,
  type ServiceType,
  type MethodInfo,
} from "@bufbuild/protobuf";

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
   * Add the service methods as entry points.
   */
  addService<S extends ServiceType>(
    service: S,
    options?: GatewayServiceOptions<S>
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
  return {
    entryPoints,
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
  };
}
