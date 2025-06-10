import { Context, Effect, Schema } from "effect";

import type { Lookup } from "geoip-lite";

import { FetchHttpClient, HttpClient } from "@effect/platform";

import { type GeoIpNotFoundError, IpServicesFailedError } from "./error.ts";
import { IPInfoResponseUnion } from "./schema.ts";

export type TGeoIPParam = string | number;

export class GeoIpService extends Context.Tag("GeoIpService")<
  GeoIpService,
  {
    lookup: (
      ip: TGeoIPParam,
    ) => Effect.Effect<Lookup, GeoIpNotFoundError, never>;
  }
>() {}

export class IpInfo extends Effect.Service<IpInfo>()("IpInfo", {
  effect: Effect.gen(function* () {
    const client = (yield* HttpClient.HttpClient).pipe(
      HttpClient.filterStatusOk,
      HttpClient.followRedirects,
    );

    const getMyIp = (url: string) =>
      client
        .get(url, {
          urlParams: {
            test: "test",
          },
        })
        .pipe(
          Effect.flatMap((response) =>
            Effect.gen(function* () {
              const isJson =
                response.headers["content-type"]?.includes(
                  "application/json",
                ) ?? false;

              return yield* Schema.decodeUnknown(IPInfoResponseUnion)(
                isJson ? yield* response.json : yield* response.text,
              );
            }),
          ),
          Effect.mapError(() => new IpServicesFailedError()),
        );

    return { getMyIp } as const;
  }),
  dependencies: [FetchHttpClient.layer],
}) {}
