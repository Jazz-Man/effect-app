import { Context, Effect, Schema } from "effect";

import type { Lookup } from "geoip-lite";

import { BunFetchHttpClient, BunHttpClient } from "../fetch/index.ts";
import { type GeoIpNotFoundError, IpIsUndefinedError } from "./error.ts";
import { getProxyUrl } from "./proxy.ts";
import { IpInfoResponseUnion } from "./schema.ts";

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
    const client = (yield* BunHttpClient.HttpClient).pipe(
      BunHttpClient.filterStatusOk,
      BunHttpClient.followRedirects(2),
    );

    const getMyIp = (url: string, proxy: string = getProxyUrl()) =>
      client
        .get(url, {
          verbose: true,
          proxy,
          headers: {
            "User-Agent": "curl/8.7.1",
          },
        })
        .pipe(
          Effect.flatMap((response) =>
            Effect.gen(function* () {
              const isJson =
                response.headers["content-type"]?.includes(
                  "application/json",
                ) ?? false;

              const result = isJson
                ? yield* response.json
                : { raw: (yield* response.text).trim() };

              const data =
                yield* Schema.decodeUnknown(IpInfoResponseUnion)(result);

              console.log({ res: data.toString() });

              const ip = Object.values(data).at(0);

              if (!ip) {
                throw new IpIsUndefinedError();
              }

              return ip;
            }),
          ),
          // Effect.mapError(() => new IpServicesFailedError()),
        );

    return { getMyIp } as const;
  }),
  dependencies: [BunFetchHttpClient.layer],
}) {}
