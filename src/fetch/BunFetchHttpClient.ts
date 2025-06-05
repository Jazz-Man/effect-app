import type { HttpClient } from "@effect/platform/HttpClient";
import { Context, type Layer } from "effect";

import * as internal from "./internal/fetchHttpClient";

export class Fetch extends Context.Tag(internal.fetchTagKey)<
  Fetch,
  typeof globalThis.fetch
>() {}

export class RequestInit extends Context.Tag(internal.requestInitTagKey)<
  RequestInit,
  globalThis.BunFetchRequestInit
>() {}

export const layer: Layer.Layer<HttpClient> = internal.layer;
