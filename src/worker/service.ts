import { BunContext } from "@effect/platform-bun";
import { Effect, Schema } from "effect";
import geoIp from "geoip-lite";
import { BunFetchHttpClient, BunHttpClient } from "../fetch/index.ts";
import { GeoIpNotFoundError, IpIsUndefinedError } from "./error.ts";
import { getProxyUrl } from "./proxy.ts";
import { IpInfoResponseUnion } from "./schema.ts";

export class GeoInfo extends Effect.Service<GeoInfo>()("GeoInfo", {
  effect: Effect.gen(function* () {
    const lookup = (ip: string) =>
      Effect.try({
        try: () => {
          const res = geoIp.lookup(ip);
          if (res === null) {
            throw new GeoIpNotFoundError();
          }
          return res;
        },
        catch: () => new GeoIpNotFoundError(),
      });

    return { lookup } as const;
  }),
  dependencies: [BunContext.layer],
}) {}

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

              console.log(result);

              const data =
                yield* Schema.decodeUnknown(IpInfoResponseUnion)(result);

              const ip = Object.values(data).at(0);

              if (!ip) {
                return yield* Effect.fail(new IpIsUndefinedError());
              }

              return { ip, proxy };
            }),
          ),
        );

    return { getMyIp } as const;
  }),
  dependencies: [BunFetchHttpClient.layer, BunContext.layer],
}) {}
