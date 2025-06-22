import { Effect, Schema } from "effect";
import geoIp from "geoip-lite";
import { BunFetchHttpClient, BunHttpClient } from "../fetch/index.ts";
import { GeoIpNotFoundError, IpIsUndefinedError } from "./error.ts";
import { IpInfoResponseUnion } from "./schema.ts";

export class IpInfoService extends Effect.Service<IpInfoService>()("IpInfo", {
  effect: Effect.gen(function* () {
    const client = (yield* BunHttpClient.HttpClient).pipe(
      BunHttpClient.filterStatusOk,
      BunHttpClient.followRedirects(2),
    );

    const lookup = (url: string, proxy: string) =>
      client
        .get(url, {
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

              const ip = Object.values(data).at(0);

              if (!ip) {
                return Effect.fail(
                  new IpIsUndefinedError({
                    response: result,
                    url: response.request.url,
                  }),
                );
              }

              const geoData = geoIp.lookup(ip);

              if (geoData === null) {
                return Effect.fail(new GeoIpNotFoundError());
              }

              return Effect.succeed(geoData);
            }),
          ),
        );

    return { lookup } as const;
  }),
  dependencies: [BunFetchHttpClient.layer],
}) {}
