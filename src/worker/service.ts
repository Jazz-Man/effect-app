import { Context, type Effect } from "effect";

import type { Lookup } from "geoip-lite";

import type { GeoIpNotFoundError } from "./error";

export type TGeoIPParam = string | number;

export class GeoIpService extends Context.Tag("GeoIpService")<
  GeoIpService,
  {
    lookup: (
      ip: TGeoIPParam,
    ) => Effect.Effect<Lookup, GeoIpNotFoundError, never>;
  }
>() {}
