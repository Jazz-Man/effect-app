import { Effect, Schema } from "effect";
import { IPInfoResponse } from "./schema.ts";

import { HttpClient } from "@effect/platform";
import { GeoIpService } from "./service.ts";

const fetchIpInfo = (serviceName: string) =>
  Effect.gen(function* () {
    const client = (yield* HttpClient.HttpClient).pipe(
      HttpClient.filterStatusOk,
      HttpClient.followRedirects,
    );

    const geoIp = yield* GeoIpService;

    const response = yield* client
      .get(serviceName)
      .pipe(
        Effect.withSpan("fetch_ip", { attributes: { service: serviceName } }),
      );

    const isJson =
      response.headers["content-type"]?.includes("application/json") ?? false;

    const body = yield* isJson ? response.json : response.text;

    const result = yield* Schema.decodeUnknown(IPInfoResponse)(
      isJson ? body : { raw: String(body).trim() },
    );

    const ip = Object.values(result).at(0) as string;

    const geoData = yield* geoIp
      .lookup(ip)
      .pipe(
        Effect.mapError(
          () => new Error(`Failed to fetch IP for "${serviceName}"`),
        ),
      );

    return geoData;
  });

export const getPublicIP = Effect.gen(function* (_) {
  return yield* fetchIpInfo("https://wtfismyip.com/json").pipe(
    Effect.catchAll(() =>
      Effect.fail(new Error("All IP services are unavailable")),
    ),
  );
});
