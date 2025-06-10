import * as Effect from "effect/Effect";
import * as Either from "effect/Either";
import { dual } from "effect/Function";
import * as Inspectable from "effect/Inspectable";
import * as Option from "effect/Option";
import { pipeArguments } from "effect/Pipeable";
import * as Redacted from "effect/Redacted";
import type * as Schema from "effect/Schema";
import type { ParseOptions } from "effect/SchemaAST";
import type * as Stream from "effect/Stream";

import type * as BunHttpClientRequest from "../BunHttpClientRequest";

import {
  HttpBody as Body,
  type FileSystem,
  Headers,
  type HttpBody,
  type Error as PlatformError,
  UrlParams,
} from "@effect/platform";
import type { HttpMethod } from "@effect/platform/HttpMethod";

/** @internal */
export const TypeId: BunHttpClientRequest.TypeId = Symbol.for(
  "@effect/platform/HttpClientRequest",
) as BunHttpClientRequest.TypeId;

const Proto = {
  [TypeId]: TypeId,
  ...Inspectable.BaseProto,
  toJSON(this: BunHttpClientRequest.HttpClientRequest): unknown {
    return {
      _id: "@effect/platform/HttpClientRequest",
      method: this.method,
      url: this.url,
      urlParams: this.urlParams,
      hash: this.hash,
      headers: Inspectable.redact(this.headers),
      body: this.body.toJSON(),
      tls: this.tls,
      verbose: this.verbose,
      proxy: this.proxy,
      s3: this.s3,
      unix: this.unix,
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
  body: HttpBody.HttpBody,
  tls: BunFetchRequestInitTLS | undefined,
  verbose: boolean | undefined,
  proxy: string | undefined,
  s3: Bun.S3Options | undefined,
  unix: string | undefined,
): BunHttpClientRequest.HttpClientRequest {
  const self = Object.create(Proto);
  self.method = method;
  self.url = url;
  self.urlParams = urlParams;
  self.hash = hash;
  self.headers = headers;
  self.body = body;
  self.tls = tls;
  self.verbose = verbose;
  self.proxy = proxy;
  self.s3 = s3;
  self.unix = unix;
  return self;
}

/** @internal */
export const isClientRequest = (
  u: unknown,
): u is BunHttpClientRequest.HttpClientRequest =>
  typeof u === "object" && u !== null && TypeId in u;

/** @internal */
export const empty: BunHttpClientRequest.HttpClientRequest = makeInternal(
  "GET",
  "",
  UrlParams.empty,
  Option.none(),
  Headers.empty,
  Body.empty,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
);

/** @internal */
export const make =
  <M extends HttpMethod>(method: M) =>
  (
    url: string | URL,
    options?: M extends "GET" | "HEAD"
      ? BunHttpClientRequest.BunOptions.NoBody
      : BunHttpClientRequest.BunOptions.NoUrl,
  ) =>
    modify(empty, {
      method,
      url,
      ...(options ?? undefined),
    });

/** @internal */
export const get = make("GET");

/** @internal */
export const post = make("POST");

/** @internal */
export const put = make("PUT");

/** @internal */
export const patch = make("PATCH");

/** @internal */
export const del = make("DELETE");

/** @internal */
export const head = make("HEAD");

/** @internal */
export const options = make("OPTIONS");

/** @internal */
export const modify = dual<
  (
    options: BunHttpClientRequest.BunOptions,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    options: BunHttpClientRequest.BunOptions,
  ) => BunHttpClientRequest.HttpClientRequest
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

  if (options.tls) {
    result = setTls(result, options.tls);
  }

  if (options.verbose) {
    result = setVerbose(result, options.verbose);
  }

  if (options.proxy) {
    result = setProxy(result, options.proxy);
  }

  if (options.s3) {
    result = setS3(result, options.s3);
  }

  if (options.unix) {
    result = setUnix(result, options.unix);
  }

  return result;
});

/** @internal */
export const setVerbose = dual<
  (
    value: boolean,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    value: boolean,
  ) => BunHttpClientRequest.HttpClientRequest
>(2, (self, verbose) =>
  makeInternal(
    self.method,
    self.url,
    self.urlParams,
    self.hash,
    self.headers,
    self.body,
    self.tls,
    verbose,
    self.proxy,
    self.s3,
    self.unix,
  ),
);

/** @internal */
export const setHeader = dual<
  (
    key: string,
    value: string,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    key: string,
    value: string,
  ) => BunHttpClientRequest.HttpClientRequest
>(3, (self, key, value) =>
  makeInternal(
    self.method,
    self.url,
    self.urlParams,
    self.hash,
    Headers.set(self.headers, key, value),
    self.body,
    self.tls,
    self.verbose,
    self.proxy,
    self.s3,
    self.unix,
  ),
);

/** @internal */
export const setHeaders = dual<
  (
    input: Headers.Input,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    input: Headers.Input,
  ) => BunHttpClientRequest.HttpClientRequest
>(2, (self, input) =>
  makeInternal(
    self.method,
    self.url,
    self.urlParams,
    self.hash,
    Headers.setAll(self.headers, input),
    self.body,
    self.tls,
    self.verbose,
    self.proxy,
    self.s3,
    self.unix,
  ),
);

const stringOrRedacted = (value: string | Redacted.Redacted): string =>
  typeof value === "string" ? value : Redacted.value(value);

/** @internal */
export const basicAuth = dual<
  (
    username: string | Redacted.Redacted,
    password: string | Redacted.Redacted,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    username: string | Redacted.Redacted,
    password: string | Redacted.Redacted,
  ) => BunHttpClientRequest.HttpClientRequest
>(3, (self, username, password) =>
  setHeader(
    self,
    "Authorization",
    `Basic ${btoa(`${stringOrRedacted(username)}:${stringOrRedacted(password)}`)}`,
  ),
);

/** @internal */
export const bearerToken = dual<
  (
    token: string | Redacted.Redacted,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    token: string | Redacted.Redacted,
  ) => BunHttpClientRequest.HttpClientRequest
>(2, (self, token) =>
  setHeader(self, "Authorization", `Bearer ${stringOrRedacted(token)}`),
);

/** @internal */
export const accept = dual<
  (
    mediaType: string,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    mediaType: string,
  ) => BunHttpClientRequest.HttpClientRequest
>(2, (self, mediaType) => setHeader(self, "Accept", mediaType));

/** @internal */
export const setTls = dual<
  (
    tls: BunFetchRequestInitTLS,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    tls: BunFetchRequestInitTLS,
  ) => BunHttpClientRequest.HttpClientRequest
>(2, (self, tls) =>
  makeInternal(
    self.method,
    self.url,
    self.urlParams,
    self.hash,
    self.headers,
    self.body,
    tls,
    self.verbose,
    self.proxy,
    self.s3,
    self.unix,
  ),
);

/** @internal */
export const setS3 = dual<
  (
    s3: Bun.S3Options,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    s3: Bun.S3Options,
  ) => BunHttpClientRequest.HttpClientRequest
>(2, (self, s3) =>
  makeInternal(
    self.method,
    self.url,
    self.urlParams,
    self.hash,
    self.headers,
    self.body,
    self.tls,
    self.verbose,
    self.proxy,
    s3,
    self.unix,
  ),
);

/** @internal */
export const setUnix = dual<
  (
    unix: string,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    unix: string,
  ) => BunHttpClientRequest.HttpClientRequest
>(2, (self, unix) =>
  makeInternal(
    self.method,
    self.url,
    self.urlParams,
    self.hash,
    self.headers,
    self.body,
    self.tls,
    self.verbose,
    self.proxy,
    self.s3,
    unix,
  ),
);

/** @internal */
export const setProxy = dual<
  (
    proxy: string,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    proxy: string,
  ) => BunHttpClientRequest.HttpClientRequest
>(2, (self, proxy) =>
  makeInternal(
    self.method,
    self.url,
    self.urlParams,
    self.hash,
    self.headers,
    self.body,
    self.tls,
    self.verbose,
    proxy,
    self.s3,
    self.unix,
  ),
);

/** @internal */
export const acceptJson = accept("application/json");

/** @internal */
export const setMethod = dual<
  (
    method: HttpMethod,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    method: HttpMethod,
  ) => BunHttpClientRequest.HttpClientRequest
>(2, (self, method) =>
  makeInternal(
    method,
    self.url,
    self.urlParams,
    self.hash,
    self.headers,
    self.body,
    self.tls,
    self.verbose,
    self.proxy,
    self.s3,
    self.unix,
  ),
);

/** @internal */
export const setUrl = dual<
  (
    url: string | URL,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    url: string | URL,
  ) => BunHttpClientRequest.HttpClientRequest
>(2, (self, url) => {
  if (typeof url === "string") {
    return makeInternal(
      self.method,
      url,
      self.urlParams,
      self.hash,
      self.headers,
      self.body,
      self.tls,
      self.verbose,
      self.proxy,
      self.s3,
      self.unix,
    );
  }
  const clone = new URL(url.toString());
  const urlParams = UrlParams.fromInput(clone.searchParams);
  const hash = clone.hash ? Option.some(clone.hash.slice(1)) : Option.none();
  clone.search = "";
  clone.hash = "";
  return makeInternal(
    self.method,
    clone.toString(),
    urlParams,
    hash,
    self.headers,
    self.body,
    self.tls,
    self.verbose,
    self.proxy,
    self.s3,
    self.unix,
  );
});

/** @internal */
export const appendUrl = dual<
  (
    path: string,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    path: string,
  ) => BunHttpClientRequest.HttpClientRequest
>(2, (self, url) =>
  makeInternal(
    self.method,
    self.url.endsWith("/") && url.startsWith("/")
      ? self.url + url.slice(1)
      : self.url + url,
    self.urlParams,
    self.hash,
    self.headers,
    self.body,
    self.tls,
    self.verbose,
    self.proxy,
    self.s3,
    self.unix,
  ),
);

/** @internal */
export const prependUrl = dual<
  (
    path: string,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    path: string,
  ) => BunHttpClientRequest.HttpClientRequest
>(2, (self, url) =>
  makeInternal(
    self.method,
    url.endsWith("/") && self.url.startsWith("/")
      ? url + self.url.slice(1)
      : url + self.url,
    self.urlParams,
    self.hash,
    self.headers,
    self.body,
    self.tls,
    self.verbose,
    self.proxy,
    self.s3,
    self.unix,
  ),
);

/** @internal */
export const updateUrl = dual<
  (
    f: (url: string) => string,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    f: (url: string) => string,
  ) => BunHttpClientRequest.HttpClientRequest
>(2, (self, f) =>
  makeInternal(
    self.method,
    f(self.url),
    self.urlParams,
    self.hash,
    self.headers,
    self.body,
    self.tls,
    self.verbose,
    self.proxy,
    self.s3,
    self.unix,
  ),
);

/** @internal */
export const appendUrlParam = dual<
  (
    key: string,
    value: string,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    key: string,
    value: string,
  ) => BunHttpClientRequest.HttpClientRequest
>(3, (self, key, value) =>
  makeInternal(
    self.method,
    self.url,
    UrlParams.append(self.urlParams, key, value),
    self.hash,
    self.headers,
    self.body,
    self.tls,
    self.verbose,
    self.proxy,
    self.s3,
    self.unix,
  ),
);

/** @internal */
export const appendUrlParams = dual<
  (
    input: UrlParams.Input,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    input: UrlParams.Input,
  ) => BunHttpClientRequest.HttpClientRequest
>(2, (self, input) =>
  makeInternal(
    self.method,
    self.url,
    UrlParams.appendAll(self.urlParams, input),
    self.hash,
    self.headers,
    self.body,
    self.tls,
    self.verbose,
    self.proxy,
    self.s3,
    self.unix,
  ),
);

/** @internal */
export const setUrlParam = dual<
  (
    key: string,
    value: string,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    key: string,
    value: string,
  ) => BunHttpClientRequest.HttpClientRequest
>(3, (self, key, value) =>
  makeInternal(
    self.method,
    self.url,
    UrlParams.set(self.urlParams, key, value),
    self.hash,
    self.headers,
    self.body,
    self.tls,
    self.verbose,
    self.proxy,
    self.s3,
    self.unix,
  ),
);

/** @internal */
export const setUrlParams = dual<
  (
    input: UrlParams.Input,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    input: UrlParams.Input,
  ) => BunHttpClientRequest.HttpClientRequest
>(2, (self, input) =>
  makeInternal(
    self.method,
    self.url,
    UrlParams.setAll(self.urlParams, input),
    self.hash,
    self.headers,
    self.body,
    self.tls,
    self.verbose,
    self.proxy,
    self.s3,
    self.unix,
  ),
);

/** @internal */
export const setHash = dual<
  (
    hash: string,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    hash: string,
  ) => BunHttpClientRequest.HttpClientRequest
>(2, (self, hash) =>
  makeInternal(
    self.method,
    self.url,
    self.urlParams,
    Option.some(hash),
    self.headers,
    self.body,
    self.tls,
    self.verbose,
    self.proxy,
    self.s3,
    self.unix,
  ),
);

/** @internal */
export const removeHash = (
  self: BunHttpClientRequest.HttpClientRequest,
): BunHttpClientRequest.HttpClientRequest =>
  makeInternal(
    self.method,
    self.url,
    self.urlParams,
    Option.none(),
    self.headers,
    self.body,
    self.tls,
    self.verbose,
    self.proxy,
    self.s3,
    self.unix,
  );

/** @internal */
export const toUrl = (
  self: BunHttpClientRequest.HttpClientRequest,
): Option.Option<URL> =>
  Either.getRight(UrlParams.makeUrl(self.url, self.urlParams, self.hash));

/** @internal */
export const setBody = dual<
  (
    body: HttpBody.HttpBody,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    body: HttpBody.HttpBody,
  ) => BunHttpClientRequest.HttpClientRequest
>(2, (self, body) => {
  let headers = self.headers;
  if (body._tag === "Empty" || body._tag === "FormData") {
    headers = Headers.remove(headers, ["Content-type", "Content-length"]);
  } else {
    const contentType = body.contentType;
    if (contentType) {
      headers = Headers.set(headers, "content-type", contentType);
    }

    const contentLength = body.contentLength;
    if (contentLength) {
      headers = Headers.set(
        headers,
        "content-length",
        contentLength.toString(),
      );
    }
  }
  return makeInternal(
    self.method,
    self.url,
    self.urlParams,
    self.hash,
    headers,
    body,
    self.tls,
    self.verbose,
    self.proxy,
    self.s3,
    self.unix,
  );
});

/** @internal */
export const bodyUint8Array = dual<
  (
    body: Uint8Array,
    contentType?: string,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    body: Uint8Array,
    contentType?: string,
  ) => BunHttpClientRequest.HttpClientRequest
>(
  (args) => isClientRequest(args[0]),
  (self, body, contentType = "application/octet-stream") =>
    setBody(self, Body.uint8Array(body, contentType)),
);

/** @internal */
export const bodyText = dual<
  (
    body: string,
    contentType?: string,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    body: string,
    contentType?: string,
  ) => BunHttpClientRequest.HttpClientRequest
>(
  (args) => isClientRequest(args[0]),
  (self, body, contentType = "text/plain") =>
    setBody(self, Body.text(body, contentType)),
);

/** @internal */
export const bodyJson = dual<
  (
    body: unknown,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => Effect.Effect<
    BunHttpClientRequest.HttpClientRequest,
    HttpBody.HttpBodyError
  >,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    body: unknown,
  ) => Effect.Effect<
    BunHttpClientRequest.HttpClientRequest,
    HttpBody.HttpBodyError
  >
>(2, (self, body) =>
  Effect.map(Body.json(body), (body) => setBody(self, body)),
);

/** @internal */
export const bodyUnsafeJson = dual<
  (
    body: unknown,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    body: unknown,
  ) => BunHttpClientRequest.HttpClientRequest
>(2, (self, body) => setBody(self, Body.unsafeJson(body)));

/** @internal */
export const bodyFile = dual<
  (
    path: string,
    options?: FileSystem.StreamOptions & { readonly contentType?: string },
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => Effect.Effect<
    BunHttpClientRequest.HttpClientRequest,
    PlatformError.PlatformError,
    FileSystem.FileSystem
  >,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    path: string,
    options?: FileSystem.StreamOptions & { readonly contentType?: string },
  ) => Effect.Effect<
    BunHttpClientRequest.HttpClientRequest,
    PlatformError.PlatformError,
    FileSystem.FileSystem
  >
>(
  (args) => isClientRequest(args[0]),
  (self, path, options) =>
    Effect.map(Body.file(path, options), (body) => setBody(self, body)),
);

/** @internal */
export const bodyFileWeb = dual<
  (
    file: HttpBody.HttpBody.FileLike,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    file: HttpBody.HttpBody.FileLike,
  ) => BunHttpClientRequest.HttpClientRequest
>(2, (self, file) => setBody(self, Body.fileWeb(file)));

/** @internal */
export const schemaBodyJson = <A, I, R>(
  schema: Schema.Schema<A, I, R>,
  options?: ParseOptions | undefined,
): {
  (
    body: A,
  ): (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => Effect.Effect<
    BunHttpClientRequest.HttpClientRequest,
    HttpBody.HttpBodyError,
    R
  >;
  (
    self: BunHttpClientRequest.HttpClientRequest,
    body: A,
  ): Effect.Effect<
    BunHttpClientRequest.HttpClientRequest,
    HttpBody.HttpBodyError,
    R
  >;
} => {
  const encode = Body.jsonSchema(schema, options);
  return dual<
    (
      body: A,
    ) => (
      self: BunHttpClientRequest.HttpClientRequest,
    ) => Effect.Effect<
      BunHttpClientRequest.HttpClientRequest,
      HttpBody.HttpBodyError,
      R
    >,
    (
      self: BunHttpClientRequest.HttpClientRequest,
      body: A,
    ) => Effect.Effect<
      BunHttpClientRequest.HttpClientRequest,
      HttpBody.HttpBodyError,
      R
    >
  >(2, (self, body) => Effect.map(encode(body), (body) => setBody(self, body)));
};

/** @internal */
export const bodyUrlParams = dual<
  (
    input: UrlParams.Input,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    input: UrlParams.Input,
  ) => BunHttpClientRequest.HttpClientRequest
>(2, (self, body) =>
  setBody(
    self,
    Body.text(
      UrlParams.toString(UrlParams.fromInput(body)),
      "application/x-www-form-urlencoded",
    ),
  ),
);

/** @internal */
export const bodyFormData = dual<
  (
    body: FormData,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    body: FormData,
  ) => BunHttpClientRequest.HttpClientRequest
>(2, (self, body) => setBody(self, Body.formData(body)));

/** @internal */
export const bodyFormDataRecord = dual<
  (
    entries: HttpBody.FormDataInput,
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    entries: HttpBody.FormDataInput,
  ) => BunHttpClientRequest.HttpClientRequest
>(2, (self, entries) => setBody(self, Body.formDataRecord(entries)));

/** @internal */
export const bodyStream = dual<
  (
    body: Stream.Stream<Uint8Array, unknown>,
    options?: {
      readonly contentType?: string | undefined;
      readonly contentLength?: number | undefined;
    },
  ) => (
    self: BunHttpClientRequest.HttpClientRequest,
  ) => BunHttpClientRequest.HttpClientRequest,
  (
    self: BunHttpClientRequest.HttpClientRequest,
    body: Stream.Stream<Uint8Array, unknown>,
    options?: {
      readonly contentType?: string | undefined;
      readonly contentLength?: number | undefined;
    },
  ) => BunHttpClientRequest.HttpClientRequest
>(
  (args) => isClientRequest(args[0]),
  (
    self,
    body,
    { contentLength, contentType = "application/octet-stream" } = {},
  ) => setBody(self, Body.stream(body, contentType, contentLength)),
);
