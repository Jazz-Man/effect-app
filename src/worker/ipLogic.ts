import { Effect } from "effect";
import type { GeoIPInfo } from "./schema";

import { HttpClient } from "@effect/platform";
import type { ServiceName } from "./ipServices";
import { GeoIpService, ProxyService, ServiceRegistry } from "./service";

const fetchIPInfo = (serviceName: ServiceName) =>
  Effect.gen(function* (_) {
    const proxyService = yield* ProxyService;

    const serviceRegistry = yield* ServiceRegistry;
    const geoIp = yield* GeoIpService;

    const proxyUser = yield* proxyService.getRandomUsername();
    const proxy = yield* proxyService.getProxyUrl(proxyUser);
    const serviceNameUrl = yield* serviceRegistry.getServiceUrl(serviceName);

    const client = (yield* HttpClient.HttpClient).pipe(
      HttpClient.filterStatusOk,
      HttpClient.followRedirects,
    );

    const response = yield* client
      .get(serviceNameUrl)
      .pipe(
        Effect.withSpan("fetch_ip", { attributes: { service: serviceName } }),
      );

    const isJson =
      response.headers["content-type"]?.includes("application/json") ?? false;

    const body = yield* isJson ? response.json : response.text;

    // Обробка відповіді
    const data = yield* Effect.tryPromise(() =>
      response instanceof Response &&
      response.headers.get("content-type")?.includes("application/json")
        ? response.json()
        : response.text(),
    );

    // Парсинг IP
    const ipInfo = yield* parseIPResponse(serviceName, data).pipe(
      Effect.map((info) => ({
        ...info,
        serviceName,
        serviceNameUrl,
        proxy,
        proxyUser,
      })),
    );

    // Геолокація
    const geoData = yield* geoIp
      .lookup(ipInfo.ip)
      .pipe(
        Effect.mapError(
          () => new Error(`Failed to fetch IP for "${serviceName}"`),
        ),
      );

    return { ...ipInfo, ...geoData } as GeoIPInfo;
  }).pipe(
    Effect.retry({ times: 3, delay: "5 seconds" }),
    Effect.catchAll((error) =>
      Effect.fail(new Error(`IP lookup failed: ${error.message}`)),
    ),
  );

const parseIPResponse = (serviceName: ServiceName, data: unknown) =>
  Effect.succeed(() => {
    switch (serviceName) {
      case "httpbin.org":
        return { ip: (data as any).origin };
      case "check.torproject.org":
        return { ip: (data as any).IP };
      case "api.my-ip.io/v2/ip.json":
        return { ip: (data as any).ip };
      case "ifconfig.pro":
        return { ip: (data as string).split(" - ")[0] };
      case "wtfismyip.com":
      case "myip.wtf":
        return { ip: (data as any).YourFuckingIPAddress };
      default:
        return { ip: String(data) };
    }
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
