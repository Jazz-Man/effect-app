import type {
  HttpBody as Body,
  FileSystem,
  Headers,
  UrlParams,
} from "@effect/platform";
import type * as PlatformError from "@effect/platform/Error";

import * as internal from "./internal/httpBunClientRequest";

import type {
  HttpClientRequest as BaseHttpClientRequest,
  Options as HttpClientRequestOption,
} from "@effect/platform/HttpClientRequest";
import type { HttpMethod } from "@effect/platform/HttpMethod";
import type { Effect, Option, Schema } from "effect";
import type { Redacted } from "effect/Redacted";
import type { ParseOptions } from "effect/SchemaAST";
import type * as Stream from "effect/Stream";

export const TypeId: unique symbol = Symbol.for(
  "@effect-app/BunHttpClientRequest",
);

export type TypeId = typeof TypeId;

export interface HttpClientRequest extends BaseHttpClientRequest {
  readonly [TypeId]: TypeId;
}

export interface Options extends HttpClientRequestOption {
  readonly tls: BunFetchRequestInitTLS | undefined;
  readonly verbose: boolean | undefined;
  readonly proxy: string | undefined;
  readonly s3: Bun.S3Options | undefined;
  readonly unix: string | undefined;
}

export declare namespace Options {
  export interface NoBody extends Omit<Options, "method" | "url" | "body"> {}

  export interface NoUrl extends Omit<Options, "method" | "url"> {}
}

export const make: <M extends HttpMethod>(
  method: M,
) => (
  url: string | URL,
  options?:
    | (M extends "GET" | "HEAD" ? Options.NoBody : Options.NoUrl)
    | undefined,
) => HttpClientRequest = internal.make;

export const get: (
  url: string | URL,
  options?: Options.NoBody,
) => HttpClientRequest = internal.get;

export const post: (
  url: string | URL,
  options?: Options.NoUrl,
) => HttpClientRequest = internal.post;

export const patch: (
  url: string | URL,
  options?: Options.NoUrl,
) => HttpClientRequest = internal.patch;

export const put: (
  url: string | URL,
  options?: Options.NoUrl,
) => HttpClientRequest = internal.put;

export const del: (
  url: string | URL,
  options?: Options.NoUrl,
) => HttpClientRequest = internal.del;

export const head: (
  url: string | URL,
  options?: Options.NoBody,
) => HttpClientRequest = internal.head;

export const options: (
  url: string | URL,
  options?: Options.NoUrl,
) => HttpClientRequest = internal.options;

export const modify: {
  (options: Options): (self: HttpClientRequest) => HttpClientRequest;
  (self: HttpClientRequest, options: Options): HttpClientRequest;
} = internal.modify;

export const setMethod: {
  (method: HttpMethod): (self: HttpClientRequest) => HttpClientRequest;
  (self: HttpClientRequest, method: HttpMethod): HttpClientRequest;
} = internal.setMethod;

export const setHeader: {
  (key: string, value: string): (self: HttpClientRequest) => HttpClientRequest;
  (self: HttpClientRequest, key: string, value: string): HttpClientRequest;
} = internal.setHeader;

export const setHeaders: {
  (input: Headers.Input): (self: HttpClientRequest) => HttpClientRequest;
  (self: HttpClientRequest, input: Headers.Input): HttpClientRequest;
} = internal.setHeaders;

export const basicAuth: {
  (
    username: string | Redacted,
    password: string | Redacted,
  ): (self: HttpClientRequest) => HttpClientRequest;
  (
    self: HttpClientRequest,
    username: string | Redacted,
    password: string | Redacted,
  ): HttpClientRequest;
} = internal.basicAuth;

export const bearerToken: {
  (token: string | Redacted): (self: HttpClientRequest) => HttpClientRequest;
  (self: HttpClientRequest, token: string | Redacted): HttpClientRequest;
} = internal.bearerToken;

export const accept: {
  (mediaType: string): (self: HttpClientRequest) => HttpClientRequest;
  (self: HttpClientRequest, mediaType: string): HttpClientRequest;
} = internal.accept;

export const acceptJson: (self: HttpClientRequest) => HttpClientRequest =
  internal.acceptJson;

export const setUrl: {
  (url: string | URL): (self: HttpClientRequest) => HttpClientRequest;
  (self: HttpClientRequest, url: string | URL): HttpClientRequest;
} = internal.setUrl;

export const prependUrl: {
  (path: string): (self: HttpClientRequest) => HttpClientRequest;
  (self: HttpClientRequest, path: string): HttpClientRequest;
} = internal.prependUrl;

export const appendUrl: {
  (path: string): (self: HttpClientRequest) => HttpClientRequest;
  (self: HttpClientRequest, path: string): HttpClientRequest;
} = internal.appendUrl;

export const updateUrl: {
  (f: (url: string) => string): (self: HttpClientRequest) => HttpClientRequest;
  (self: HttpClientRequest, f: (url: string) => string): HttpClientRequest;
} = internal.updateUrl;

export const setUrlParam: {
  (key: string, value: string): (self: HttpClientRequest) => HttpClientRequest;
  (self: HttpClientRequest, key: string, value: string): HttpClientRequest;
} = internal.setUrlParam;

export const setUrlParams: {
  (input: UrlParams.Input): (self: HttpClientRequest) => HttpClientRequest;
  (self: HttpClientRequest, input: UrlParams.Input): HttpClientRequest;
} = internal.setUrlParams;

export const appendUrlParam: {
  (key: string, value: string): (self: HttpClientRequest) => HttpClientRequest;
  (self: HttpClientRequest, key: string, value: string): HttpClientRequest;
} = internal.appendUrlParam;

export const appendUrlParams: {
  (input: UrlParams.Input): (self: HttpClientRequest) => HttpClientRequest;
  (self: HttpClientRequest, input: UrlParams.Input): HttpClientRequest;
} = internal.appendUrlParams;

export const setHash: {
  (hash: string): (self: HttpClientRequest) => HttpClientRequest;
  (self: HttpClientRequest, hash: string): HttpClientRequest;
} = internal.setHash;

export const removeHash: (self: HttpClientRequest) => HttpClientRequest =
  internal.removeHash;

export const toUrl: (self: HttpClientRequest) => Option.Option<URL> =
  internal.toUrl;

export const setBody: {
  (body: Body.HttpBody): (self: HttpClientRequest) => HttpClientRequest;
  (self: HttpClientRequest, body: Body.HttpBody): HttpClientRequest;
} = internal.setBody;

export const bodyUint8Array: {
  (
    body: Uint8Array,
    contentType?: string,
  ): (self: HttpClientRequest) => HttpClientRequest;
  (
    self: HttpClientRequest,
    body: Uint8Array,
    contentType?: string,
  ): HttpClientRequest;
} = internal.bodyUint8Array;

export const bodyText: {
  (
    body: string,
    contentType?: string,
  ): (self: HttpClientRequest) => HttpClientRequest;
  (
    self: HttpClientRequest,
    body: string,
    contentType?: string,
  ): HttpClientRequest;
} = internal.bodyText;

export const bodyJson: {
  (
    body: unknown,
  ): (
    self: HttpClientRequest,
  ) => Effect.Effect<HttpClientRequest, Body.HttpBodyError>;
  (
    self: HttpClientRequest,
    body: unknown,
  ): Effect.Effect<HttpClientRequest, Body.HttpBodyError>;
} = internal.bodyJson;

export const bodyUnsafeJson: {
  (body: unknown): (self: HttpClientRequest) => HttpClientRequest;
  (self: HttpClientRequest, body: unknown): HttpClientRequest;
} = internal.bodyUnsafeJson;

export const schemaBodyJson: <A, I, R>(
  schema: Schema.Schema<A, I, R>,
  options?: ParseOptions | undefined,
) => {
  (
    body: A,
  ): (
    self: HttpClientRequest,
  ) => Effect.Effect<HttpClientRequest, Body.HttpBodyError, R>;
  (
    self: HttpClientRequest,
    body: A,
  ): Effect.Effect<HttpClientRequest, Body.HttpBodyError, R>;
} = internal.schemaBodyJson;

export const bodyUrlParams: {
  (input: UrlParams.Input): (self: HttpClientRequest) => HttpClientRequest;
  (self: HttpClientRequest, input: UrlParams.Input): HttpClientRequest;
} = internal.bodyUrlParams;

export const bodyFormData: {
  (body: FormData): (self: HttpClientRequest) => HttpClientRequest;
  (self: HttpClientRequest, body: FormData): HttpClientRequest;
} = internal.bodyFormData;

export const bodyFormDataRecord: {
  (entries: Body.FormDataInput): (self: HttpClientRequest) => HttpClientRequest;
  (self: HttpClientRequest, entries: Body.FormDataInput): HttpClientRequest;
} = internal.bodyFormDataRecord;

export const bodyStream: {
  (
    body: Stream.Stream<Uint8Array, unknown>,
    options?:
      | {
          readonly contentType?: string | undefined;
          readonly contentLength?: number | undefined;
        }
      | undefined,
  ): (self: HttpClientRequest) => HttpClientRequest;
  (
    self: HttpClientRequest,
    body: Stream.Stream<Uint8Array, unknown>,
    options?:
      | {
          readonly contentType?: string | undefined;
          readonly contentLength?: number | undefined;
        }
      | undefined,
  ): HttpClientRequest;
} = internal.bodyStream;

export const bodyFile: {
  (
    path: string,
    options?: FileSystem.StreamOptions & { readonly contentType?: string },
  ): (
    self: HttpClientRequest,
  ) => Effect.Effect<
    HttpClientRequest,
    PlatformError.PlatformError,
    FileSystem.FileSystem
  >;
  (
    self: HttpClientRequest,
    path: string,
    options?: FileSystem.StreamOptions & { readonly contentType?: string },
  ): Effect.Effect<
    HttpClientRequest,
    PlatformError.PlatformError,
    FileSystem.FileSystem
  >;
} = internal.bodyFile;

export const bodyFileWeb: {
  (
    file: Body.HttpBody.FileLike,
  ): (self: HttpClientRequest) => HttpClientRequest;
  (self: HttpClientRequest, file: Body.HttpBody.FileLike): HttpClientRequest;
} = internal.bodyFileWeb;
