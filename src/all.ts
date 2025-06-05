import { HttpClient } from "@effect/platform";
import { Effect, Schema } from "effect";

import { AppServices } from "./implementations";
import {
  IpServicesFailedError,
  IpServicesNotAvailableError,
} from "./worker/error";
import ipServices from "./worker/ipServices";
import { IPInfoResponse } from "./worker/schema";
import { GeoIpService } from "./worker/service";
import { shuffleArray } from "./worker/utils";

export type TGeoIPParam = string | number;

const fetchIPInfo = (serviceUrl: string) =>
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

    const result = yield* Schema.decodeUnknown(IPInfoResponse)(
      isJson ? body : { raw: String(body).trim() },
    );

    const ip = Object.values(result).at(0) as string;

    const geoData = yield* geoIp
      .lookup(ip)
      .pipe(Effect.mapError(() => new IpServicesFailedError()));

    return geoData;
  });

const getPublicIP = Effect.gen(function* (_) {
  const shuffledServices = yield* shuffleArray(ipServices);

  return yield* Effect.firstSuccessOf(
    shuffledServices.map((service) => fetchIPInfo(service)),
  ).pipe(Effect.catchAll(() => Effect.fail(new IpServicesNotAvailableError())));
});

Effect.runPromise(getPublicIP.pipe(Effect.provide(AppServices)))
  .then((result) => {
    console.log("Public IP Info:", result);
  })
  .catch((error) => {
    console.error("Error:", error.message);
  });
