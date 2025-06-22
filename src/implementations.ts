import { FetchHttpClient } from "@effect/platform";
import { Layer } from "effect";
import { getProxyUrl } from "./worker/proxy.ts";

export const BunFetchLive = FetchHttpClient.layer.pipe(
  Layer.provide(
    Layer.succeed(FetchHttpClient.RequestInit, {
      // verbose: true,
      tls: {
        rejectUnauthorized: false,
      },
      proxy: getProxyUrl(),

      signal: AbortSignal.timeout(60000),
    } as BunFetchRequestInit),
    // Layer.succeed(FetchHttpClient.RequestInit, (...args) => {
    //   return args;
    // }),
  ),
);

export const AppServices = Layer.mergeAll(BunFetchLive);
