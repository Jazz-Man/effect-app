import { FetchHttpClient } from "@effect/platform";
import { Effect, Layer } from "effect";
import geoIp from "geoip-lite";

import ipServices, { getRandomizedServices } from "./worker/ipServices";
import { getProxyUrl } from "./worker/proxy";
import {
  GeoIpNotFoundError,
  GeoIpService,
  ServiceRegistry,
} from "./worker/service";

export const BunFetchLive = FetchHttpClient.layer.pipe(
  Layer.provide(
    Layer.succeed(FetchHttpClient.RequestInit, {
      // verbose: true,
      tls: {
        rejectUnauthorized: false,
      },
      proxy: getProxyUrl(),
      referrer:
        "https://www.bing.com/search?pc=OA1&q=public%20IP%20checking%20services%20list",
      signal: AbortSignal.timeout(60000),
    } as BunFetchRequestInit),
  ),
);

export const ServiceRegistryLive = Layer.succeed(ServiceRegistry, {
  getRandomizedServices: () => Effect.succeed(getRandomizedServices()),
  getServiceUrl: (name) =>
    Effect.succeed(ipServices[name as keyof typeof ipServices]),
});

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

export const AppServices = Layer.mergeAll(
  BunFetchLive,
  GeoIpServiceLive,
  ServiceRegistryLive,
);
