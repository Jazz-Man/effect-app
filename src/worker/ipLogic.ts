import { Effect, Schema } from "effect";
import { IPInfoResponse } from "./schema";

import { HttpClient } from "@effect/platform";
import type { ServiceName } from "./ipServices";
import { GeoIpService, ServiceRegistry } from "./service";

const fetchIPInfo = (serviceName: ServiceName) =>
  Effect.gen(function* () {
    const client = (yield* HttpClient.HttpClient).pipe(
      HttpClient.filterStatusOk,
      HttpClient.followRedirects,
    );

    const serviceRegistry = yield* ServiceRegistry;
    const geoIp = yield* GeoIpService;

    const serviceNameUrl = yield* serviceRegistry.getServiceUrl(serviceName);

    const response = yield* client
      .get(serviceNameUrl)
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
  const serviceRegistry = yield* ServiceRegistry;
  const services = yield* serviceRegistry.getRandomizedServices();

  return yield* Effect.firstSuccessOf(
    services.map((service) => fetchIPInfo(service)),
  ).pipe(
    Effect.catchAll(() =>
      Effect.fail(new Error("All IP services are unavailable")),
    ),
  );
});
