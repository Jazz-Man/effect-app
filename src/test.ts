import { BunRuntime } from "@effect/platform-bun";
import { Array as A, Console, Effect, Random } from "effect";
import { IpServicesNotAvailableError } from "./worker/error.ts";
import ipServices from "./worker/ipServices.ts";
import { getProxyUrl } from "./worker/proxy.ts";
import { IpInfoService } from "./worker/service.ts";

const program = Effect.gen(function* () {
  const ip = yield* IpInfoService;

  const ipProviders = yield* Random.shuffle(ipServices);

  const proxy = getProxyUrl();

  const ipData = yield* Effect.firstSuccessOf(
    A.fromIterable(ipProviders).map((service) => ip.lookup(service, proxy)),
  ).pipe(Effect.catchAll(() => Effect.fail(new IpServicesNotAvailableError())));

  console.log(ipData);

  return { ipData };
}).pipe(Effect.catchAllCause((cause) => Console.log(cause)));

BunRuntime.runMain(program.pipe(Effect.provide(IpInfoService.Default)));
