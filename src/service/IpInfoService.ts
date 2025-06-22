import { isIPv4 } from "node:net";
import { Data, Effect, ParseResult, Schema } from "effect";
import geoIp from "geoip-lite";
import { BunFetchHttpClient, BunHttpClient } from "../fetch/index.ts";

export class GeoIpNotFoundError extends Data.TaggedError(
  "GeoIpNotFoundError",
) {}

export class IpServicesNotAvailableError extends Data.TaggedError(
  "IpServicesNotAvailableError",
) {}

export class IpServicesFailedError extends Data.TaggedError(
  "IpServicesFailedError",
) {}

export class IpIsUndefinedError extends Data.TaggedError("IpIsUndefinedError")<{
  response: unknown;
  url: string;
}> {}

const ipField = Schema.String.pipe(
  Schema.filter(isIPv4, { message: () => "Invalid IPv4 address" }),
);

const IpFromString = Schema.transformOrFail(
  Schema.NonEmptyString,
  Schema.Trim,
  {
    strict: true,
    decode: (input, _, ast) => {
      if (isIPv4(input)) {
        return ParseResult.succeed(input);
      }

      const fail = ParseResult.fail(
        new ParseResult.Type(ast, input, "Failed to parse IP from string"),
      );

      const rawIp = input.split(" - ")?.at(0);

      if (!rawIp) {
        return fail;
      }

      if (!isIPv4(rawIp)) {
        return fail;
      }

      return ParseResult.succeed(rawIp);
    },

    encode: (input) => ParseResult.succeed(input.toString()),
  },
);

const IpInfoResponse = Schema.Struct({
  origin: Schema.optional(ipField),
  IP: Schema.optional(ipField),
  ip: Schema.optional(ipField),
  remote_addr: Schema.optional(ipField),
  raw: Schema.optional(IpFromString),
});

export const IpInfoResponseUnion = Schema.Union(IpInfoResponse, IpFromString);

export class IpInfoService extends Effect.Service<IpInfoService>()("IpInfo", {
  effect: Effect.gen(function* () {
    const client = (yield* BunHttpClient.HttpClient).pipe(
      BunHttpClient.filterStatusOk,
      BunHttpClient.followRedirects(2),
    );

    const lookup = (url: string, proxy: string) =>
      client
        .get(url, {
          proxy,
          headers: {
            "User-Agent": "curl/8.7.1",
          },
        })
        .pipe(
          Effect.flatMap((response) =>
            Effect.gen(function* () {
              const isJson =
                response.headers["content-type"]?.includes(
                  "application/json",
                ) ?? false;

              const result = isJson
                ? yield* response.json
                : { raw: (yield* response.text).trim() };

              const data =
                yield* Schema.decodeUnknown(IpInfoResponseUnion)(result);

              const ip = Object.values(data).at(0);

              if (!ip) {
                return Effect.fail(
                  new IpIsUndefinedError({
                    response: result,
                    url: response.request.url,
                  }),
                );
              }

              const geoData = geoIp.lookup(ip);

              if (geoData === null) {
                return Effect.fail(new GeoIpNotFoundError());
              }

              return Effect.succeed(geoData);
            }),
          ),
        );

    return { lookup } as const;
  }),
  dependencies: [BunFetchHttpClient.layer],
}) {}
