import { FetchHttpClient } from "@effect/platform";
import { Effect, Layer } from "effect";
import geoIp from "geoip-lite";

import ipServices, { getRandomizedServices } from "./worker/ipServices";
import { getProxyUrl, getRandomUsername } from "./worker/proxy";
import {
  GeoIpNotFoundError,
  GeoIpService,
  ProxyService,
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

const ProxyServiceLive = Layer.succeed(ProxyService, {
  getProxyUrl: (user) => Effect.succeed(getProxyUrl(user)),
  getRandomUsername: () => Effect.succeed(getRandomUsername()),
});

const ServiceRegistryLive = Layer.succeed(ServiceRegistry, {
  getRandomizedServices: () => Effect.succeed(getRandomizedServices()),
  getServiceUrl: (name) =>
    Effect.succeed(ipServices[name as keyof typeof ipServices]),
});

export const GeoIpServiceLive = Layer.succeed(GeoIpService, {
  lookup: (ip) =>
    Effect.try({
      try: () => geoIp.lookup(ip),
      catch: () => new GeoIpNotFoundError(ip),
    }),
});

export const AppServices = Layer.mergeAll(
  BunFetchLive,
  GeoIpServiceLive,
  ProxyServiceLive,
  ServiceRegistryLive,
);
