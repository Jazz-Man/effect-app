import { HttpClient } from "@effect/platform";
import { Console, Context, Data, Effect, Schema } from "effect";
import { BunFetchLive } from "../implementations";
import type { ServiceName, ServiceUrl } from "./ipServices";
import { IPInfoResponse } from "./schema";

import type { Lookup } from "geoip-lite";

export type TGeoIPParam = string | number;

export class GeoIpNotFoundError extends Data.TaggedError("GeoIpNotFoundError")<{
  ip: TGeoIPParam;
}> {}

export class GeoIpService extends Context.Tag("GeoIpService")<
  GeoIpService,
  {
    lookup: (
      ip: TGeoIPParam,
    ) => Effect.Effect<null | Lookup, GeoIpNotFoundError, never>;
  }
>() {}

export class ProxyService extends Context.Tag("ProxyService")<
  ProxyService,
  {
    getProxyUrl: (user?: string) => Effect.Effect<string>;
    getRandomUsername: () => Effect.Effect<string>;
  }
>() {}

export class ServiceRegistry extends Context.Tag("ServiceRegistry")<
  ServiceRegistry,
  {
    getRandomizedServices: () => Effect.Effect<ServiceName[]>;
    getServiceUrl: (name: ServiceName) => Effect.Effect<ServiceUrl>;
  }
>() {}

const program = Effect.gen(function* () {
  const client = (yield* HttpClient.HttpClient).pipe(
    HttpClient.filterStatusOk,
    HttpClient.followRedirects,
  );

  const response = yield* client
    .get("https://ifconfig.pro/ip.host")
    .pipe(
      Effect.withSpan("fetch_ip", { attributes: { service: "ifconfig.pro" } }),
    );

  const isJson =
    response.headers["content-type"]?.includes("application/json") ?? false;

  const body = yield* isJson ? response.json : response.text;

  return yield* Schema.decodeUnknown(IPInfoResponse)(
    isJson ? body : { raw: String(body).trim() },
  );
}).pipe(Effect.provide(BunFetchLive));

Effect.runPromise(program.pipe(Effect.andThen(Console.log)));
