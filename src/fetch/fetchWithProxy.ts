import {
  fetchTagKey,
  requestInitTagKey,
} from "@effect/platform/internal/fetchHttpClient";
import { Headers, client } from "@effect/platform/internal/httpClient";
import { Effect, FiberRef } from "effect";

const proxyUrlFiberRef = FiberRef.unsafeMake<string | undefined>(undefined);

// Розширюємо стандартний fetch, додаючи proxy через FiberRef
const fetchWithProxy = client.make((request, url, signal, fiber) => {
  const context = fiber.getFiberRef(proxyUrlFiberRef);
  const fetch: typeof globalThis.fetch =
    context.unsafeMap.get(fetchTagKey) ?? globalThis.fetch;
  const options: RequestInit = context.unsafeMap.get(requestInitTagKey) ?? {};

  // Отримуємо поточний proxyUrl з FiberRef
  const proxyUrl = fiber.getFiberRef(proxyUrlFiberRef);

  return client.make((request, url, signal, fiber) => {
    const headers = options.headers
      ? Headers.merge(Headers.fromInput(options.headers), request.headers)
      : request.headers;

    const finalUrl = proxyUrl
      ? `${proxyUrl}?url=${encodeURIComponent(url)}`
      : url;

    return Effect.tryPromise({
      try: () =>
        fetch(finalUrl, {
          ...options,
          method: request.method,
          headers,
          body: request.body._tag === "Raw" ? request.body.body : undefined,
          signal,
        }),
      catch: (cause) =>
        new Error.RequestError({ request, reason: "Transport", cause }),
    });
  })(request, url, signal, fiber);
});
