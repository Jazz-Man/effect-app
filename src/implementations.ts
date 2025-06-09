import { FetchHttpClient } from "@effect/platform";
import { Effect, Layer } from "effect";
import geoIp from "geoip-lite";

import { GeoIpNotFoundError } from "./worker/error";
import { getProxyUrl } from "./worker/proxy";
import { GeoIpService } from "./worker/service";

export const BunFetchLive = FetchHttpClient.layer.pipe(
  Layer.provide(
    // Layer.succeed(FetchHttpClient.RequestInit, {
    //   // verbose: true,
    //   tls: {
    //     rejectUnauthorized: false,
    //   },
    //   proxy: getProxyUrl(),

    //   signal: AbortSignal.timeout(60000),
    // } as BunFetchRequestInit),
    // Layer.succeed(FetchHttpClient.RequestInit, (...args) => {
    //   return args;
    // }),
    Layer.succeed(FetchHttpClient.Fetch, (...args) => {
      console.log(args);
      return fetch(...args);
    }),
  ),
);

export const GeoIpServiceLive = Layer.succeed(GeoIpService, {
  lookup: (ip) =>
    Effect.try({
      try: () => {
        const res = geoIp.lookup(ip);
        if (res === null) {
          throw new GeoIpNotFoundError();
        }
        return res;
      },
      catch: () => new GeoIpNotFoundError(),
    }),
});

export const AppServices = Layer.mergeAll(BunFetchLive, GeoIpServiceLive);
