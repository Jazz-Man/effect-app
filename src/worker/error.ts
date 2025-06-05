import { Data } from "effect";

export class GeoIpNotFoundError extends Data.TaggedError(
  "GeoIpNotFoundError",
) {}

export class IpServicesNotAvailableError extends Data.TaggedError(
  "IpServicesNotAvailableError",
) {}

export class IpServicesFailedError extends Data.TaggedError(
  "IpServicesFailedError",
) {}
