import { BunRuntime } from "@effect/platform-bun";
import { Console, Effect, Layer, Random } from "effect";
import { IpServicesNotAvailableError } from "./worker/error.ts";
import ipServices from "./worker/ipServices.ts";
import { GeoInfo, IpInfo } from "./worker/service.ts";

const program = Effect.gen(function* () {
  const ip = yield* IpInfo;
  const geo = yield* GeoInfo;
  const ipProviders = yield* Random.shuffle(ipServices);

  const testList = ["https://api.ip2location.io"];

  const ipData = yield* Effect.firstSuccessOf(
    testList.map((service) => ip.getMyIp(service)),
    // A.fromIterable(ipProviders).map((service) => ip.getMyIp(service)),
  ).pipe(Effect.catchAll(() => Effect.fail(new IpServicesNotAvailableError())));

  const geoData = yield* geo.lookup(ipData.ip);

  console.log({ ipData, geoData });

  return { ipData, geoData };
}).pipe(Effect.catchAllCause((cause) => Console.log(cause)));

export const AppServices = Layer.mergeAll(
  IpInfo.Default,
  GeoInfo.Default,
  // BunContext.layer,
);

BunRuntime.runMain(program.pipe(Effect.provide(AppServices)));
