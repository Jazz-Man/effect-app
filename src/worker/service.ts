import { Context, Data, type Effect } from "effect";

import type { ServiceName, ServiceUrl } from "./ipServices";

import type { Lookup } from "geoip-lite";

export type TGeoIPParam = string | number;

export class GeoIpNotFoundError extends Data.TaggedError(
  "GeoIpNotFoundError",
) {}

export class GeoIpService extends Context.Tag("GeoIpService")<
  GeoIpService,
  {
    lookup: (
      ip: TGeoIPParam,
    ) => Effect.Effect<Lookup, GeoIpNotFoundError, never>;
  }
>() {}

export class ServiceRegistry extends Context.Tag("ServiceRegistry")<
  ServiceRegistry,
  {
    getRandomizedServices: () => Effect.Effect<ServiceName[]>;
    getServiceUrl: (name: ServiceName) => Effect.Effect<ServiceUrl>;
  }
>() {}
