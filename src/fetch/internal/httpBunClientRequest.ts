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

import {
  type FileSystem,
  Headers,
  type HttpBody,
  type HttpClientRequest,
  UrlParams,
  type Error as PlatformError,
} from "@effect/platform";
import type { HttpMethod } from "@effect/platform/HttpMethod";
import * as internalBody from "./httpBody.js";

/** @internal */
export const TypeId: HttpClientRequest.TypeId = Symbol.for(
  "@effect/platform/HttpClientRequest",
) as HttpClientRequest.TypeId;

const Proto = {
  [TypeId]: TypeId,
  ...Inspectable.BaseProto,
  toJSON(this: HttpClientRequest.HttpClientRequest): unknown {
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
  body: HttpBody.HttpBody,
): HttpClientRequest.HttpClientRequest {
  const self = Object.create(Proto);
  self.method = method;
  self.url = url;
  self.urlParams = urlParams;
  self.hash = hash;
  self.headers = headers;
  self.body = body;
  return self;
}

/** @internal */
export const isClientRequest = (
  u: unknown,
): u is HttpClientRequest.HttpClientRequest =>
  typeof u === "object" && u !== null && TypeId in u;

/** @internal */
export const empty: HttpClientRequest.HttpClientRequest = makeInternal(
  "GET",
  "",
  UrlParams.empty,
  Option.none(),
  Headers.empty,
  internalBody.empty,
);

/** @internal */
export const make =
  <M extends HttpMethod>(method: M) =>
  (
    url: string | URL,
    options?: M extends "GET" | "HEAD"
      ? HttpClientRequest.Options.NoBody
      : HttpClientRequest.Options.NoUrl,
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
    options: HttpClientRequest.Options,
  ) => (
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    options: HttpClientRequest.Options,
  ) => HttpClientRequest.HttpClientRequest
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

/** @internal */
export const setHeader = dual<
  (
    key: string,
    value: string,
  ) => (
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    key: string,
    value: string,
  ) => HttpClientRequest.HttpClientRequest
>(3, (self, key, value) =>
  makeInternal(
    self.method,
    self.url,
    self.urlParams,
    self.hash,
    Headers.set(self.headers, key, value),
    self.body,
  ),
);

/** @internal */
export const setHeaders = dual<
  (
    input: Headers.Input,
  ) => (
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    input: Headers.Input,
  ) => HttpClientRequest.HttpClientRequest
>(2, (self, input) =>
  makeInternal(
    self.method,
    self.url,
    self.urlParams,
    self.hash,
    Headers.setAll(self.headers, input),
    self.body,
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
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    username: string | Redacted.Redacted,
    password: string | Redacted.Redacted,
  ) => HttpClientRequest.HttpClientRequest
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
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    token: string | Redacted.Redacted,
  ) => HttpClientRequest.HttpClientRequest
>(2, (self, token) =>
  setHeader(self, "Authorization", `Bearer ${stringOrRedacted(token)}`),
);

/** @internal */
export const accept = dual<
  (
    mediaType: string,
  ) => (
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    mediaType: string,
  ) => HttpClientRequest.HttpClientRequest
>(2, (self, mediaType) => setHeader(self, "Accept", mediaType));

/** @internal */
export const acceptJson = accept("application/json");

/** @internal */
export const setMethod = dual<
  (
    method: HttpMethod,
  ) => (
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    method: HttpMethod,
  ) => HttpClientRequest.HttpClientRequest
>(2, (self, method) =>
  makeInternal(
    method,
    self.url,
    self.urlParams,
    self.hash,
    self.headers,
    self.body,
  ),
);

/** @internal */
export const setUrl = dual<
  (
    url: string | URL,
  ) => (
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    url: string | URL,
  ) => HttpClientRequest.HttpClientRequest
>(2, (self, url) => {
  if (typeof url === "string") {
    return makeInternal(
      self.method,
      url,
      self.urlParams,
      self.hash,
      self.headers,
      self.body,
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
  );
});

/** @internal */
export const appendUrl = dual<
  (
    path: string,
  ) => (
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    path: string,
  ) => HttpClientRequest.HttpClientRequest
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
  ),
);

/** @internal */
export const prependUrl = dual<
  (
    path: string,
  ) => (
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    path: string,
  ) => HttpClientRequest.HttpClientRequest
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
  ),
);

/** @internal */
export const updateUrl = dual<
  (
    f: (url: string) => string,
  ) => (
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    f: (url: string) => string,
  ) => HttpClientRequest.HttpClientRequest
>(2, (self, f) =>
  makeInternal(
    self.method,
    f(self.url),
    self.urlParams,
    self.hash,
    self.headers,
    self.body,
  ),
);

/** @internal */
export const appendUrlParam = dual<
  (
    key: string,
    value: string,
  ) => (
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    key: string,
    value: string,
  ) => HttpClientRequest.HttpClientRequest
>(3, (self, key, value) =>
  makeInternal(
    self.method,
    self.url,
    UrlParams.append(self.urlParams, key, value),
    self.hash,
    self.headers,
    self.body,
  ),
);

/** @internal */
export const appendUrlParams = dual<
  (
    input: UrlParams.Input,
  ) => (
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    input: UrlParams.Input,
  ) => HttpClientRequest.HttpClientRequest
>(2, (self, input) =>
  makeInternal(
    self.method,
    self.url,
    UrlParams.appendAll(self.urlParams, input),
    self.hash,
    self.headers,
    self.body,
  ),
);

/** @internal */
export const setUrlParam = dual<
  (
    key: string,
    value: string,
  ) => (
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    key: string,
    value: string,
  ) => HttpClientRequest.HttpClientRequest
>(3, (self, key, value) =>
  makeInternal(
    self.method,
    self.url,
    UrlParams.set(self.urlParams, key, value),
    self.hash,
    self.headers,
    self.body,
  ),
);

/** @internal */
export const setUrlParams = dual<
  (
    input: UrlParams.Input,
  ) => (
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    input: UrlParams.Input,
  ) => HttpClientRequest.HttpClientRequest
>(2, (self, input) =>
  makeInternal(
    self.method,
    self.url,
    UrlParams.setAll(self.urlParams, input),
    self.hash,
    self.headers,
    self.body,
  ),
);

/** @internal */
export const setHash = dual<
  (
    hash: string,
  ) => (
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    hash: string,
  ) => HttpClientRequest.HttpClientRequest
>(2, (self, hash) =>
  makeInternal(
    self.method,
    self.url,
    self.urlParams,
    Option.some(hash),
    self.headers,
    self.body,
  ),
);

/** @internal */
export const removeHash = (
  self: HttpClientRequest.HttpClientRequest,
): HttpClientRequest.HttpClientRequest =>
  makeInternal(
    self.method,
    self.url,
    self.urlParams,
    Option.none(),
    self.headers,
    self.body,
  );

/** @internal */
export const toUrl = (
  self: HttpClientRequest.HttpClientRequest,
): Option.Option<URL> =>
  Either.getRight(UrlParams.makeUrl(self.url, self.urlParams, self.hash));

/** @internal */
export const setBody = dual<
  (
    body: HttpBody.HttpBody,
  ) => (
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    body: HttpBody.HttpBody,
  ) => HttpClientRequest.HttpClientRequest
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
  );
});

/** @internal */
export const bodyUint8Array = dual<
  (
    body: Uint8Array,
    contentType?: string,
  ) => (
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    body: Uint8Array,
    contentType?: string,
  ) => HttpClientRequest.HttpClientRequest
>(
  (args) => isClientRequest(args[0]),
  (self, body, contentType = "application/octet-stream") =>
    setBody(self, internalBody.uint8Array(body, contentType)),
);

/** @internal */
export const bodyText = dual<
  (
    body: string,
    contentType?: string,
  ) => (
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    body: string,
    contentType?: string,
  ) => HttpClientRequest.HttpClientRequest
>(
  (args) => isClientRequest(args[0]),
  (self, body, contentType = "text/plain") =>
    setBody(self, internalBody.text(body, contentType)),
);

/** @internal */
export const bodyJson = dual<
  (
    body: unknown,
  ) => (
    self: HttpClientRequest.HttpClientRequest,
  ) => Effect.Effect<
    HttpClientRequest.HttpClientRequest,
    HttpBody.HttpBodyError
  >,
  (
    self: HttpClientRequest.HttpClientRequest,
    body: unknown,
  ) => Effect.Effect<
    HttpClientRequest.HttpClientRequest,
    HttpBody.HttpBodyError
  >
>(2, (self, body) =>
  Effect.map(internalBody.json(body), (body) => setBody(self, body)),
);

/** @internal */
export const bodyUnsafeJson = dual<
  (
    body: unknown,
  ) => (
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    body: unknown,
  ) => HttpClientRequest.HttpClientRequest
>(2, (self, body) => setBody(self, internalBody.unsafeJson(body)));

/** @internal */
export const bodyFile = dual<
  (
    path: string,
    options?: FileSystem.StreamOptions & { readonly contentType?: string },
  ) => (
    self: HttpClientRequest.HttpClientRequest,
  ) => Effect.Effect<
    HttpClientRequest.HttpClientRequest,
    PlatformError.PlatformError,
    FileSystem.FileSystem
  >,
  (
    self: HttpClientRequest.HttpClientRequest,
    path: string,
    options?: FileSystem.StreamOptions & { readonly contentType?: string },
  ) => Effect.Effect<
    HttpClientRequest.HttpClientRequest,
    PlatformError.PlatformError,
    FileSystem.FileSystem
  >
>(
  (args) => isClientRequest(args[0]),
  (self, path, options) =>
    Effect.map(internalBody.file(path, options), (body) => setBody(self, body)),
);

/** @internal */
export const bodyFileWeb = dual<
  (
    file: HttpBody.HttpBody.FileLike,
  ) => (
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    file: HttpBody.HttpBody.FileLike,
  ) => HttpClientRequest.HttpClientRequest
>(2, (self, file) => setBody(self, internalBody.fileWeb(file)));

/** @internal */
export const schemaBodyJson = <A, I, R>(
  schema: Schema.Schema<A, I, R>,
  options?: ParseOptions | undefined,
): {
  (
    body: A,
  ): (
    self: HttpClientRequest.HttpClientRequest,
  ) => Effect.Effect<
    HttpClientRequest.HttpClientRequest,
    HttpBody.HttpBodyError,
    R
  >;
  (
    self: HttpClientRequest.HttpClientRequest,
    body: A,
  ): Effect.Effect<
    HttpClientRequest.HttpClientRequest,
    HttpBody.HttpBodyError,
    R
  >;
} => {
  const encode = internalBody.jsonSchema(schema, options);
  return dual<
    (
      body: A,
    ) => (
      self: HttpClientRequest.HttpClientRequest,
    ) => Effect.Effect<
      HttpClientRequest.HttpClientRequest,
      HttpBody.HttpBodyError,
      R
    >,
    (
      self: HttpClientRequest.HttpClientRequest,
      body: A,
    ) => Effect.Effect<
      HttpClientRequest.HttpClientRequest,
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
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    input: UrlParams.Input,
  ) => HttpClientRequest.HttpClientRequest
>(2, (self, body) =>
  setBody(
    self,
    internalBody.text(
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
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    body: FormData,
  ) => HttpClientRequest.HttpClientRequest
>(2, (self, body) => setBody(self, internalBody.formData(body)));

/** @internal */
export const bodyFormDataRecord = dual<
  (
    entries: HttpBody.FormDataInput,
  ) => (
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    entries: HttpBody.FormDataInput,
  ) => HttpClientRequest.HttpClientRequest
>(2, (self, entries) => setBody(self, internalBody.formDataRecord(entries)));

/** @internal */
export const bodyStream = dual<
  (
    body: Stream.Stream<Uint8Array, unknown>,
    options?: {
      readonly contentType?: string | undefined;
      readonly contentLength?: number | undefined;
    },
  ) => (
    self: HttpClientRequest.HttpClientRequest,
  ) => HttpClientRequest.HttpClientRequest,
  (
    self: HttpClientRequest.HttpClientRequest,
    body: Stream.Stream<Uint8Array, unknown>,
    options?: {
      readonly contentType?: string | undefined;
      readonly contentLength?: number | undefined;
    },
  ) => HttpClientRequest.HttpClientRequest
>(
  (args) => isClientRequest(args[0]),
  (
    self,
    body,
    { contentLength, contentType = "application/octet-stream" } = {},
  ) => setBody(self, internalBody.stream(body, contentType, contentLength)),
);
