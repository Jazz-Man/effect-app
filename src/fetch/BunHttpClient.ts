import type {
  HttpClientResponse as ClientResponse,
  HttpClientError,
} from "@effect/platform";

import { Context, type Effect } from "effect";

import type { RuntimeFiber } from "effect/Fiber";

import type { Cookies } from "@effect/platform/Cookies";

import type { Layer } from "effect/Layer";

import type { FiberRef } from "effect/FiberRef";
import type { Inspectable } from "effect/Inspectable";
import type { Pipeable } from "effect/Pipeable";
import type { Predicate } from "effect/Predicate";
import type { Ref } from "effect/Ref";
import type { Schedule } from "effect/Schedule";
import type { Scope } from "effect/Scope";
import type { NoExcessProperties } from "effect/Types";
import type * as BunHttpClientRequest from "./BunHttpClientRequest";
import * as internal from "./internal/httpBunClient.ts";

/**
 * @since 1.0.0
 * @category type ids
 */
export const TypeId: unique symbol = internal.TypeId;

export type TypeId = typeof TypeId;

export interface BunHttpClient
  extends BunHttpClientWith<HttpClientError.HttpClientError> {}

export interface BunHttpClientWith<E, R = never> extends Pipeable, Inspectable {
  readonly [TypeId]: TypeId;
  readonly execute: (
    request: BunHttpClientRequest.HttpClientRequest,
  ) => Effect.Effect<ClientResponse.HttpClientResponse, E, R>;

  readonly get: (
    url: string | URL,
    options?: BunHttpClientRequest.BunOptions.NoBody,
  ) => Effect.Effect<ClientResponse.HttpClientResponse, E, R>;
  readonly head: (
    url: string | URL,
    options?: BunHttpClientRequest.BunOptions.NoBody,
  ) => Effect.Effect<ClientResponse.HttpClientResponse, E, R>;
  readonly post: (
    url: string | URL,
    options?: BunHttpClientRequest.BunOptions.NoUrl,
  ) => Effect.Effect<ClientResponse.HttpClientResponse, E, R>;
  readonly patch: (
    url: string | URL,
    options?: BunHttpClientRequest.BunOptions.NoUrl,
  ) => Effect.Effect<ClientResponse.HttpClientResponse, E, R>;
  readonly put: (
    url: string | URL,
    options?: BunHttpClientRequest.BunOptions.NoUrl,
  ) => Effect.Effect<ClientResponse.HttpClientResponse, E, R>;
  readonly del: (
    url: string | URL,
    options?: BunHttpClientRequest.BunOptions.NoUrl,
  ) => Effect.Effect<ClientResponse.HttpClientResponse, E, R>;
  readonly options: (
    url: string | URL,
    options?: BunHttpClientRequest.BunOptions.NoUrl,
  ) => Effect.Effect<ClientResponse.HttpClientResponse, E, R>;
}

export type BunHttpClientPreprocess<E, R> = (
  request: BunHttpClientRequest.HttpClientRequest,
) => Effect.Effect<BunHttpClientRequest.HttpClientRequest, E, R>;

export type BunHttpClientPostprocess<E = never, R = never> = (
  request: Effect.Effect<BunHttpClientRequest.HttpClientRequest, E, R>,
) => Effect.Effect<ClientResponse.HttpClientResponse, E, R>;

export type BunHttpClientResponseType = Effect.Effect<
  ClientResponse.HttpClientResponse,
  HttpClientError.HttpClientError,
  BunHttpClient
>;

export const tag = Context.GenericTag<BunHttpClient>(
  "@effect/platform/BunHttpClient",
);

export const HttpClient: Context.Tag<BunHttpClient, BunHttpClient> = tag;

export const execute: (
  request: BunHttpClientRequest.HttpClientRequest,
) => BunHttpClientResponseType = internal.execute;

export const get: (
  url: string | URL,
  options?: BunHttpClientRequest.BunOptions.NoBody | undefined,
) => BunHttpClientResponseType = internal.get;

export const head: (
  url: string | URL,
  options?: BunHttpClientRequest.BunOptions.NoBody | undefined,
) => BunHttpClientResponseType = internal.head;

export const post: (
  url: string | URL,
  options?: BunHttpClientRequest.BunOptions.NoUrl | undefined,
) => BunHttpClientResponseType = internal.post;

export const patch: (
  url: string | URL,
  options?: BunHttpClientRequest.BunOptions.NoUrl | undefined,
) => BunHttpClientResponseType = internal.patch;

export const put: (
  url: string | URL,
  options?: BunHttpClientRequest.BunOptions.NoUrl | undefined,
) => BunHttpClientResponseType = internal.put;

export const del: (
  url: string | URL,
  options?: BunHttpClientRequest.BunOptions.NoUrl | undefined,
) => BunHttpClientResponseType = internal.del;

export const options: (
  url: string | URL,
  options?: BunHttpClientRequest.BunOptions.NoUrl | undefined,
) => BunHttpClientResponseType = internal.options;

export const catchAll: {
  <E, E2, R2>(
    f: (e: E) => Effect.Effect<ClientResponse.HttpClientResponse, E2, R2>,
  ): <R>(self: BunHttpClientWith<E, R>) => BunHttpClientWith<E2, R2 | R>;
  <E, R, A2, E2, R2>(
    self: BunHttpClientWith<E, R>,
    f: (e: E) => Effect.Effect<A2, E2, R2>,
  ): BunHttpClientWith<E2, R | R2>;
} = internal.catchAll;

export const catchTag: {
  <K extends E extends { _tag: string } ? E["_tag"] : never, E, E1, R1>(
    tag: K,
    f: (
      e: Extract<E, { _tag: K }>,
    ) => Effect.Effect<ClientResponse.HttpClientResponse, E1, R1>,
  ): <R>(
    self: BunHttpClientWith<E, R>,
  ) => BunHttpClientWith<E1 | Exclude<E, { _tag: K }>, R1 | R>;
  <R, E, K extends E extends { _tag: string } ? E["_tag"] : never, R1, E1>(
    self: BunHttpClientWith<E, R>,
    tag: K,
    f: (
      e: Extract<E, { _tag: K }>,
    ) => Effect.Effect<ClientResponse.HttpClientResponse, E1, R1>,
  ): BunHttpClientWith<E1 | Exclude<E, { _tag: K }>, R1 | R>;
} = internal.catchTag;

export const catchTags: {
  <
    E,
    Cases extends {
      [K in Extract<E, { _tag: string }>["_tag"]]+?: (
        error: Extract<E, { _tag: K }>,
      ) => Effect.Effect<ClientResponse.HttpClientResponse, any, any>;
    } & (unknown extends E
      ? {}
      : {
          [K in Exclude<
            keyof Cases,
            Extract<E, { _tag: string }>["_tag"]
          >]: never;
        }),
  >(
    cases: Cases,
  ): <R>(self: BunHttpClientWith<E, R>) => BunHttpClientWith<
    | Exclude<E, { _tag: keyof Cases }>
    | {
        [K in keyof Cases]: Cases[K] extends (
          ...args: any[]
        ) => Effect.Effect<any, infer E, any>
          ? E
          : never;
      }[keyof Cases],
    | R
    | {
        [K in keyof Cases]: Cases[K] extends (
          ...args: any[]
        ) => Effect.Effect<any, any, infer R>
          ? R
          : never;
      }[keyof Cases]
  >;
  <
    E extends { _tag: string },
    R,
    Cases extends {
      [K in Extract<E, { _tag: string }>["_tag"]]+?: (
        error: Extract<E, { _tag: K }>,
      ) => Effect.Effect<ClientResponse.HttpClientResponse, any, any>;
    } & (unknown extends E
      ? {}
      : {
          [K in Exclude<
            keyof Cases,
            Extract<E, { _tag: string }>["_tag"]
          >]: never;
        }),
  >(
    self: BunHttpClientWith<E, R>,
    cases: Cases,
  ): BunHttpClientWith<
    | Exclude<E, { _tag: keyof Cases }>
    | {
        [K in keyof Cases]: Cases[K] extends (
          ...args: any[]
        ) => Effect.Effect<any, infer E, any>
          ? E
          : never;
      }[keyof Cases],
    | R
    | {
        [K in keyof Cases]: Cases[K] extends (
          ...args: any[]
        ) => Effect.Effect<any, any, infer R>
          ? R
          : never;
      }[keyof Cases]
  >;
} = internal.catchTags;

/**
 * Filters the result of a response, or runs an alternative effect if the predicate fails.

 */
export const filterOrElse: {
  <E2, R2>(
    predicate: Predicate<ClientResponse.HttpClientResponse>,
    orElse: (
      response: ClientResponse.HttpClientResponse,
    ) => Effect.Effect<ClientResponse.HttpClientResponse, E2, R2>,
  ): <E, R>(self: BunHttpClientWith<E, R>) => BunHttpClientWith<E2 | E, R2 | R>;
  <E, R, E2, R2>(
    self: BunHttpClientWith<E, R>,
    predicate: Predicate<ClientResponse.HttpClientResponse>,
    orElse: (
      response: ClientResponse.HttpClientResponse,
    ) => Effect.Effect<ClientResponse.HttpClientResponse, E2, R2>,
  ): BunHttpClientWith<E2 | E, R2 | R>;
} = internal.filterOrElse;

/**
 * Filters the result of a response, or throws an error if the predicate fails.
 */
export const filterOrFail: {
  <E2>(
    predicate: Predicate<ClientResponse.HttpClientResponse>,
    orFailWith: (response: ClientResponse.HttpClientResponse) => E2,
  ): <E, R>(self: BunHttpClientWith<E, R>) => BunHttpClientWith<E2 | E, R>;
  <E, R, E2>(
    self: BunHttpClientWith<E, R>,
    predicate: Predicate<ClientResponse.HttpClientResponse>,
    orFailWith: (response: ClientResponse.HttpClientResponse) => E2,
  ): BunHttpClientWith<E2 | E, R>;
} = internal.filterOrFail;

/**
 * Filters responses by HTTP status code.
 *
 * @since 1.0.0
 * @category filters
 */
export const filterStatus: {
  (
    f: (status: number) => boolean,
  ): <E, R>(
    self: BunHttpClientWith<E, R>,
  ) => BunHttpClientWith<E | HttpClientError.ResponseError, R>;
  <E, R>(
    self: BunHttpClientWith<E, R>,
    f: (status: number) => boolean,
  ): BunHttpClientWith<E | HttpClientError.ResponseError, R>;
} = internal.filterStatus;

/**
 * Filters responses that return a 2xx status code.
 *
 * @since 1.0.0
 * @category filters
 */
export const filterStatusOk: <E, R>(
  self: BunHttpClientWith<E, R>,
) => BunHttpClientWith<E | HttpClientError.ResponseError, R> =
  internal.filterStatusOk;

/**
 * @since 1.0.0
 * @category constructors
 */
export const makeWith: <E2, R2, E, R>(
  postprocess: (
    request: Effect.Effect<BunHttpClientRequest.HttpClientRequest, E2, R2>,
  ) => Effect.Effect<ClientResponse.HttpClientResponse, E, R>,
  preprocess: BunHttpClientPreprocess<E2, R2>,
) => BunHttpClientWith<E, R> = internal.makeWith;

/**
 * @since 1.0.0
 * @category constructors
 */
export const make: (
  f: (
    request: BunHttpClientRequest.HttpClientRequest,
    url: URL,
    signal: AbortSignal,
    fiber: RuntimeFiber<
      ClientResponse.HttpClientResponse,
      HttpClientError.HttpClientError
    >,
  ) => Effect.Effect<
    ClientResponse.HttpClientResponse,
    HttpClientError.HttpClientError
  >,
) => BunHttpClient = internal.make;

/**
 * @since 1.0.0
 * @category mapping & sequencing
 */
export const transform: {
  <E, R, E1, R1>(
    f: (
      effect: Effect.Effect<ClientResponse.HttpClientResponse, E, R>,
      request: BunHttpClientRequest.HttpClientRequest,
    ) => Effect.Effect<ClientResponse.HttpClientResponse, E1, R1>,
  ): (self: BunHttpClientWith<E, R>) => BunHttpClientWith<E | E1, R | R1>;
  <E, R, E1, R1>(
    self: BunHttpClientWith<E, R>,
    f: (
      effect: Effect.Effect<ClientResponse.HttpClientResponse, E, R>,
      request: BunHttpClientRequest.HttpClientRequest,
    ) => Effect.Effect<ClientResponse.HttpClientResponse, E1, R1>,
  ): BunHttpClientWith<E | E1, R | R1>;
} = internal.transform;

/**
 * @since 1.0.0
 * @category mapping & sequencing
 */
export const transformResponse: {
  <E, R, E1, R1>(
    f: (
      effect: Effect.Effect<ClientResponse.HttpClientResponse, E, R>,
    ) => Effect.Effect<ClientResponse.HttpClientResponse, E1, R1>,
  ): (self: BunHttpClientWith<E, R>) => BunHttpClientWith<E1, R1>;
  <E, R, E1, R1>(
    self: BunHttpClientWith<E, R>,
    f: (
      effect: Effect.Effect<ClientResponse.HttpClientResponse, E, R>,
    ) => Effect.Effect<ClientResponse.HttpClientResponse, E1, R1>,
  ): BunHttpClientWith<E1, R1>;
} = internal.transformResponse;

/**
 * Appends a transformation of the request object before sending it.
 *
 * @since 1.0.0
 * @category mapping & sequencing
 */
export const mapRequest: {
  (
    f: (
      a: BunHttpClientRequest.HttpClientRequest,
    ) => BunHttpClientRequest.HttpClientRequest,
  ): <E, R>(self: BunHttpClientWith<E, R>) => BunHttpClientWith<E, R>;
  <E, R>(
    self: BunHttpClientWith<E, R>,
    f: (
      a: BunHttpClientRequest.HttpClientRequest,
    ) => BunHttpClientRequest.HttpClientRequest,
  ): BunHttpClientWith<E, R>;
} = internal.mapRequest;

/**
 * Appends an effectful transformation of the request object before sending it.
 *
 * @since 1.0.0
 * @category mapping & sequencing
 */
export const mapRequestEffect: {
  <E2, R2>(
    f: (
      a: BunHttpClientRequest.HttpClientRequest,
    ) => Effect.Effect<BunHttpClientRequest.HttpClientRequest, E2, R2>,
  ): <E, R>(self: BunHttpClientWith<E, R>) => BunHttpClientWith<E | E2, R | R2>;
  <E, R, E2, R2>(
    self: BunHttpClientWith<E, R>,
    f: (
      a: BunHttpClientRequest.HttpClientRequest,
    ) => Effect.Effect<BunHttpClientRequest.HttpClientRequest, E2, R2>,
  ): BunHttpClientWith<E | E2, R | R2>;
} = internal.mapRequestEffect;

/**
 * Prepends a transformation of the request object before sending it.
 *
 * @since 1.0.0
 * @category mapping & sequencing
 */
export const mapRequestInput: {
  (
    f: (
      a: BunHttpClientRequest.HttpClientRequest,
    ) => BunHttpClientRequest.HttpClientRequest,
  ): <E, R>(self: BunHttpClientWith<E, R>) => BunHttpClientWith<E, R>;
  <E, R>(
    self: BunHttpClientWith<E, R>,
    f: (
      a: BunHttpClientRequest.HttpClientRequest,
    ) => BunHttpClientRequest.HttpClientRequest,
  ): BunHttpClientWith<E, R>;
} = internal.mapRequestInput;

/**
 * Prepends an effectful transformation of the request object before sending it.
 *
 * @since 1.0.0
 * @category mapping & sequencing
 */
export const mapRequestInputEffect: {
  <E2, R2>(
    f: (
      a: BunHttpClientRequest.HttpClientRequest,
    ) => Effect.Effect<BunHttpClientRequest.HttpClientRequest, E2, R2>,
  ): <E, R>(self: BunHttpClientWith<E, R>) => BunHttpClientWith<E | E2, R | R2>;
  <E, R, E2, R2>(
    self: BunHttpClientWith<E, R>,
    f: (
      a: BunHttpClientRequest.HttpClientRequest,
    ) => Effect.Effect<BunHttpClientRequest.HttpClientRequest, E2, R2>,
  ): BunHttpClientWith<E | E2, R | R2>;
} = internal.mapRequestInputEffect;

/**
 * @since 1.0.0
 * @category error handling
 */
export declare namespace Retry {
  /**
   * @since 1.0.0
   * @category error handling
   */
  export type Return<
    R,
    E,
    O extends NoExcessProperties<Effect.Retry.Options<E>, O>,
  > = BunHttpClientWith<
    | (O extends { schedule: Schedule<infer _O, infer _I, infer _R> }
        ? E
        : O extends { until: Predicate.Refinement<E, infer E2> }
          ? E2
          : E)
    | (O extends {
        while: (...args: any[]) => Effect.Effect<infer _A, infer E, infer _R>;
      }
        ? E
        : never)
    | (O extends {
        until: (...args: any[]) => Effect.Effect<infer _A, infer E, infer _R>;
      }
        ? E
        : never),
    | R
    | (O extends { schedule: Schedule<infer _O, infer _I, infer R> }
        ? R
        : never)
    | (O extends {
        while: (...args: any[]) => Effect.Effect<infer _A, infer _E, infer R>;
      }
        ? R
        : never)
    | (O extends {
        until: (...args: any[]) => Effect.Effect<infer _A, infer _E, infer R>;
      }
        ? R
        : never)
  > extends infer Z
    ? Z
    : never;
}

/**
 * Retries the request based on a provided schedule or policy.
 *
 * @since 1.0.0
 * @category error handling
 */
export const retry: {
  <E, O extends NoExcessProperties<Effect.Retry.Options<E>, O>>(
    options: O,
  ): <R>(self: BunHttpClientWith<E, R>) => Retry.Return<R, E, O>;
  <B, E, R1>(
    policy: Schedule<B, NoInfer<E>, R1>,
  ): <R>(self: BunHttpClientWith<E, R>) => BunHttpClientWith<E, R1 | R>;
  <E, R, O extends NoExcessProperties<Effect.Retry.Options<E>, O>>(
    self: BunHttpClientWith<E, R>,
    options: O,
  ): Retry.Return<R, E, O>;
  <E, R, B, R1>(
    self: BunHttpClientWith<E, R>,
    policy: Schedule<B, E, R1>,
  ): BunHttpClientWith<E, R1 | R>;
} = internal.retry;

/**
 * Retries common transient errors, such as rate limiting, timeouts or network issues.
 *
 * Specifying a `while` predicate allows you to consider other errors as
 * transient.
 *
 * @since 1.0.0
 * @category error handling
 */
export const retryTransient: {
  <B, E, R1 = never>(
    options:
      | {
          readonly while?: Predicate<NoInfer<E>>;
          readonly schedule?: Schedule<B, NoInfer<E>, R1>;
          readonly times?: number;
        }
      | Schedule<B, NoInfer<E>, R1>,
  ): <R>(self: BunHttpClientWith<E, R>) => BunHttpClientWith<E, R1 | R>;
  <E, R, B, R1 = never>(
    self: BunHttpClientWith<E, R>,
    options:
      | {
          readonly while?: Predicate<NoInfer<E>>;
          readonly schedule?: Schedule<B, NoInfer<E>, R1>;
          readonly times?: number;
        }
      | Schedule<B, NoInfer<E>, R1>,
  ): BunHttpClientWith<E, R1 | R>;
} = internal.retryTransient;

/**
 * Performs an additional effect after a successful request.
 *
 * @since 1.0.0
 * @category mapping & sequencing
 */
export const tap: {
  <_, E2, R2>(
    f: (
      response: ClientResponse.HttpClientResponse,
    ) => Effect.Effect<_, E2, R2>,
  ): <E, R>(self: BunHttpClientWith<E, R>) => BunHttpClientWith<E | E2, R | R2>;
  <E, R, _, E2, R2>(
    self: BunHttpClientWith<E, R>,
    f: (
      response: ClientResponse.HttpClientResponse,
    ) => Effect.Effect<_, E2, R2>,
  ): BunHttpClientWith<E | E2, R | R2>;
} = internal.tap;

/**
 * Performs an additional effect after an unsuccessful request.
 *
 * @since 1.0.0
 * @category mapping & sequencing
 */
export const tapError: {
  <_, E, E2, R2>(
    f: (e: NoInfer<E>) => Effect.Effect<_, E2, R2>,
  ): <R>(self: BunHttpClientWith<E, R>) => BunHttpClientWith<E | E2, R | R2>;
  <E, R, _, E2, R2>(
    self: BunHttpClientWith<E, R>,
    f: (e: NoInfer<E>) => Effect.Effect<_, E2, R2>,
  ): BunHttpClientWith<E | E2, R | R2>;
} = internal.tapError;

/**
 * Performs an additional effect on the request before sending it.
 *
 * @since 1.0.0
 * @category mapping & sequencing
 */
export const tapRequest: {
  <_, E2, R2>(
    f: (a: BunHttpClientRequest.HttpClientRequest) => Effect.Effect<_, E2, R2>,
  ): <E, R>(self: BunHttpClientWith<E, R>) => BunHttpClientWith<E | E2, R | R2>;
  <E, R, _, E2, R2>(
    self: BunHttpClientWith<E, R>,
    f: (a: BunHttpClientRequest.HttpClientRequest) => Effect.Effect<_, E2, R2>,
  ): BunHttpClientWith<E | E2, R | R2>;
} = internal.tapRequest;

/**
 * Associates a `Ref` of cookies with the client for handling cookies across requests.
 *
 * @since 1.0.0
 * @category cookies
 */
export const withCookiesRef: {
  (
    ref: Ref<Cookies>,
  ): <E, R>(self: BunHttpClientWith<E, R>) => BunHttpClientWith<E, R>;
  <E, R>(
    self: BunHttpClientWith<E, R>,
    ref: Ref<Cookies>,
  ): BunHttpClientWith<E, R>;
} = internal.withCookiesRef;

/**
 * Follows HTTP redirects up to a specified number of times.
 *
 * @since 1.0.0
 * @category redirects
 */
export const followRedirects: {
  (
    maxRedirects?: number | undefined,
  ): <E, R>(self: BunHttpClientWith<E, R>) => BunHttpClientWith<E, R>;
  <E, R>(
    self: BunHttpClientWith<E, R>,
    maxRedirects?: number | undefined,
  ): BunHttpClientWith<E, R>;
} = internal.followRedirects;

/**
 * @since 1.0.0
 * @category Tracing
 */
export const currentTracerDisabledWhen: FiberRef<
  Predicate<BunHttpClientRequest.HttpClientRequest>
> = internal.currentTracerDisabledWhen;

/**
 * Disables tracing for specific requests based on a provided predicate.
 *
 * @since 1.0.0
 * @category Tracing
 */
export const withTracerDisabledWhen: {
  (
    predicate: Predicate<BunHttpClientRequest.HttpClientRequest>,
  ): <E, R>(self: BunHttpClientWith<E, R>) => BunHttpClientWith<E, R>;
  <E, R>(
    self: BunHttpClientWith<E, R>,
    predicate: Predicate<BunHttpClientRequest.HttpClientRequest>,
  ): BunHttpClientWith<E, R>;
} = internal.withTracerDisabledWhen;

/**
 * @since 1.0.0
 * @category Tracing
 */
export const currentTracerPropagation: FiberRef<boolean> =
  internal.currentTracerPropagation;

/**
 * Enables or disables tracing propagation for the request.
 *
 * @since 1.0.0
 * @category Tracing
 */
export const withTracerPropagation: {
  (
    enabled: boolean,
  ): <E, R>(self: BunHttpClientWith<E, R>) => BunHttpClientWith<E, R>;
  <E, R>(
    self: BunHttpClientWith<E, R>,
    enabled: boolean,
  ): BunHttpClientWith<E, R>;
} = internal.withTracerPropagation;

/**
 * @since 1.0.0
 */
export const layerMergedContext: <E, R>(
  effect: Effect.Effect<BunHttpClient, E, R>,
) => Layer<BunHttpClient, E, R> = internal.layerMergedContext;

/**
 * @since 1.0.0
 * @category Tracing
 */
export interface SpanNameGenerator {
  readonly _: unique symbol;
}

/**
 * @since 1.0.0
 * @category Tracing
 */
export const SpanNameGenerator: Context.Reference<
  SpanNameGenerator,
  (request: BunHttpClientRequest.HttpClientRequest) => string
> = internal.SpanNameGenerator;

/**
 * Customizes the span names for tracing.
 *
 * ```ts
 * import { FetchHttpClient, HttpClient } from "@effect/platform"
 * import { NodeRuntime } from "@effect/platform-node"
 * import { Effect } from "effect"
 *
 * Effect.gen(function* () {
 *   const client = (yield* HttpClient.HttpClient).pipe(
 *     // Customize the span names for this HttpClient
 *     HttpClient.withSpanNameGenerator(
 *       (request) => `http.client ${request.method} ${request.url}`
 *     )
 *   )
 *
 *   yield* client.get("https://jsonplaceholder.typicode.com/posts/1")
 * }).pipe(Effect.provide(FetchHttpClient.layer), NodeRuntime.runMain)
 * ```
 *
 * @since 1.0.0
 * @category Tracing
 */
export const withSpanNameGenerator: {
  (
    f: (request: BunHttpClientRequest.HttpClientRequest) => string,
  ): <E, R>(self: BunHttpClientWith<E, R>) => BunHttpClientWith<E, R>;
  <E, R>(
    self: BunHttpClientWith<E, R>,
    f: (request: BunHttpClientRequest.HttpClientRequest) => string,
  ): BunHttpClientWith<E, R>;
} = internal.withSpanNameGenerator;

/**
 * Ties the lifetime of the `HttpClientRequest` to a `Scope`.
 *
 * @since 1.0.0
 * @category Scope
 */
export const withScope: <E, R>(
  self: BunHttpClientWith<E, R>,
) => BunHttpClientWith<E, R | Scope> = internal.withScope;
