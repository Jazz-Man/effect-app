import type { HttpClient } from "@effect/platform/HttpClient";
import { Context, type Layer } from "effect";

import type { fetch as bunFetch } from "bun";

import {
  fetchTagKey,
  layer as internalLayer,
  requestInitTagKey,
} from "./internal/fetchHttpClient";

export class Fetch extends Context.Tag(fetchTagKey)<Fetch, typeof bunFetch>() {}

export class RequestInit extends Context.Tag(requestInitTagKey)<
  RequestInit,
  globalThis.BunFetchRequestInit
>() {}

export const layer: Layer.Layer<HttpClient> = internalLayer;
