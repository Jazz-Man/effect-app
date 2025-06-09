import {
  HttpBody as Body,
  HttpClientRequest as ClientRequest,
  HttpClientResponse as ClientResponse,
  Headers,
  HttpClientError,
  UrlParams,
} from "@effect/platform";
import {
  accept,
  acceptJson,
  setBody,
  setHash,
  setHeaders,
  setMethod,
  setUrl,
  setUrlParams,
} from "@effect/platform/HttpClientRequest";
import type { HttpMethod } from "@effect/platform/HttpMethod";

import { Context, Effect, Inspectable, Layer, Option } from "effect";
import { dual } from "effect/Function";

import { pipeArguments } from "effect/Pipeable";

export const TypeId: unique symbol = Symbol.for("BunHttpClientRequest");

export type TypeId = typeof TypeId;

export interface BunHttpClientRequest extends ClientRequest.HttpClientRequest {
  readonly [TypeId]: TypeId;
}

export interface BunHttpClientOptions {
  readonly method?: HttpMethod | undefined;
  readonly url?: string | URL | undefined;
  readonly urlParams?: UrlParams.Input | undefined;
  readonly hash?: string | undefined;
  readonly headers?: Headers.Input | undefined;
  readonly body?: Body.HttpBody | undefined;
  readonly accept?: string | undefined;
  readonly acceptJson?: boolean | undefined;
}

/**
 * @since 1.0.0
 */
export declare namespace BunHttpOptions {
  /**
   * @since 1.0.0
   * @category models
   */
  export interface NoBody
    extends Omit<BunHttpClientOptions, "method" | "url" | "body"> {}

  /**
   * @since 1.0.0
   * @category models
   */
  export interface NoUrl extends Omit<BunHttpClientOptions, "method" | "url"> {}
}

const Proto = {
  [TypeId]: TypeId,
  ...Inspectable.BaseProto,
  toJSON(this: BunHttpClientRequest): unknown {
    return {
      _id: "@effect/platform/HttpClientRequest",
      method: this.method,
      url: this.url,
      urlParams: this.urlParams,
      hash: this.hash,
      headers: Inspectable.redact(this.headers),
      body: this.body.toJSON(),
    };
  },
  pipe() {
    return pipeArguments(this, arguments);
  },
};

function makeInternal(
  method: HttpMethod,
  url: string,
  urlParams: UrlParams.UrlParams,
  hash: Option.Option<string>,
  headers: Headers.Headers,
  body: Body.HttpBody,
): BunHttpClientRequest {
  const self = Object.create(Proto);
  self.method = method;
  self.url = url;
  self.urlParams = urlParams;
  self.hash = hash;
  self.headers = headers;
  self.body = body;
  return self;
}

export const isClientRequest = (u: unknown): u is BunHttpClientRequest =>
  typeof u === "object" && u !== null && TypeId in u;

/** @internal */
export const empty: BunHttpClientRequest = makeInternal(
  "GET",
  "",
  UrlParams.empty,
  Option.none(),
  Headers.empty,
  Body.empty,
);

/** @internal */
export const make =
  <M extends HttpMethod>(method: M) =>
  (
    url: string | URL,
    options?: M extends "GET" | "HEAD"
      ? BunHttpOptions.NoBody
      : BunHttpOptions.NoUrl,
  ) =>
    modify(empty, {
      method,
      url,
      ...(options ?? undefined),
    });

/** @internal */
export const modify = dual<
  (
    options: ClientRequest.Options,
  ) => (self: BunHttpClientRequest) => ClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest,
    options: BunHttpClientOptions,
  ) => BunHttpClientRequest
>(2, (self, options) => {
  let result = self;

  if (options.method) {
    result = setMethod(result, options.method);
  }
  if (options.url) {
    result = setUrl(result, options.url);
  }
  if (options.headers) {
    result = setHeaders(result, options.headers);
  }
  if (options.urlParams) {
    result = setUrlParams(result, options.urlParams);
  }
  if (options.hash) {
    result = setHash(result, options.hash);
  }
  if (options.body) {
    result = setBody(result, options.body);
  }
  if (options.accept) {
    result = accept(result, options.accept);
  }
  if (options.acceptJson) {
    result = acceptJson(result);
  }

  return result;
});

// 3. Конвертація запиту Effect-TS у опції Bun fetch
const toBunFetchOptions = (
  request: BunHttpClientRequest,
): BunFetchRequestInit => {
  const base: RequestInit = {
    method: request.method,
    headers: Object.fromEntries(request.headers),
    body: request.body?.body,
  };

  return {
    ...base,
    proxy: request.headers.get("x-bun-proxy")?.toString(),
    tls: request.headers.has("x-bun-tls")
      ? JSON.parse(request.headers.get("x-bun-tls")!)
      : undefined,
    s3: request.headers.has("x-bun-s3")
      ? JSON.parse(request.headers.get("x-bun-s3")!)
      : undefined,
    unix: request.headers.get("x-bun-unix")?.toString(),
    verbose: request.headers.get("x-bun-verbose") === "true",
  };
};

// 4. Створення тегу через Context.Tag з унікальним символом
const BunHttpClientTag = Context.Tag("BunHttpClientTag");

// 5. Створення сервісу
const makeBunHttpClient = Effect.gen(function* () {
  const execute = (request: BunHttpClientRequest) =>
    Effect.tryPromise({
      try: async () => {
        const response = await fetch(request.url, toBunFetchOptions(request));

        return ClientResponse.fromWeb(request, response);
      },
      catch: (cause) =>
        new HttpClientError.RequestError({
          request,
          reason: "Transport",
          cause,
        }),
    });

  return {
    execute,
    get: (url, options) => execute(ClientRequest.get(url, options)),
    head: (url, options) => execute(ClientRequest.head(url, options)),
    post: (url, options) => execute(ClientRequest.post(url, options)),
    patch: (url, options) => execute(ClientRequest.patch(url, options)),
    put: (url, options) => execute(ClientRequest.put(url, options)),
    del: (url, options) => execute(ClientRequest.del(url, options)),
    options: (url, options) => execute(ClientRequest.options(url, options)),
  };
});

// 6. Експорт шару для впровадження
export const layer = Layer.effect(BunHttpClientTag, makeBunHttpClient);
