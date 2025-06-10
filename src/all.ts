import { HttpClient } from "@effect/platform";
import { Effect, Schema } from "effect";
import {
  IpServicesFailedError,
  IpServicesNotAvailableError,
} from "./worker/error.ts";
import ipServices from "./worker/ipServices.ts";
import { IpInfoResponse } from "./worker/schema.ts";
import { GeoIpService } from "./worker/service.ts";
import { shuffleArray } from "./worker/utils.ts";

export type TGeoIPParam = string | number;

const fetchIpInfo = (serviceUrl: string) =>
  Effect.gen(function* () {
    const geoIp = yield* GeoIpService;

    const client = (yield* HttpClient.HttpClient).pipe(
      HttpClient.filterStatusOk,
      HttpClient.followRedirects,
    );

    const response = yield* client
      .get(serviceUrl)
      .pipe(
        Effect.withSpan("fetch_ip", { attributes: { service: serviceUrl } }),
      );

    const isJson =
      response.headers["content-type"]?.includes("application/json") ?? false;

    const body = yield* isJson ? response.json : response.text;

    const result = yield* Schema.decodeUnknown(IpInfoResponse)(
      isJson ? body : { raw: String(body).trim() },
    );

    const ip = Object.values(result).at(0) as string;

    const geoData = yield* geoIp
      .lookup(ip)
      .pipe(Effect.mapError(() => new IpServicesFailedError()));

    return geoData;
  });

const _getPublicIp = Effect.gen(function* (_) {
  const shuffledServices = yield* shuffleArray(ipServices);

  return yield* Effect.firstSuccessOf(
    shuffledServices.map((service) => fetchIpInfo(service)),
  ).pipe(Effect.catchAll(() => Effect.fail(new IpServicesNotAvailableError())));
});
// import { HttpClient } from "@effect/platform"

// Define the internal context key (dangerous - relies on internal structure)
const requestInitTagKey = "@effect/platform/FetchHttpClient/FetchOptions";

// Create a request with proxy
const myRequest = HttpClient.get("https://wtfismyip.com/json").pipe(
  Effect.locally(requestInitTagKey as any, { verbose: true } as any),
);

// Run the effect
Effect.runPromise(myRequest).then(console.log);
