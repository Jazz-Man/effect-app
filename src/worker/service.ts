import { Context, Effect, Schema } from "effect";

import type { Lookup } from "geoip-lite";

import { FetchHttpClient, HttpClient } from "@effect/platform";

import type { GeoIpNotFoundError } from "./error";
import { IPInfoResponseUnion } from "./schema";

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
          acceptJson: true,
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
          Effect.scoped,
        );

    return { getMyIp } as const;
  }),
  dependencies: [FetchHttpClient.layer],
}) {}
