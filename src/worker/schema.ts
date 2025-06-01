import { ParseResult, Schema } from "effect";

import { isIPv4, isIPv6 } from "node:net";

export const BaseIPResponse = Schema.Struct({
  ip: Schema.String,
  serviceName: Schema.optional(Schema.String),
  serviceNameUrl: Schema.optional(Schema.String),
  proxy: Schema.optional(Schema.String),
  proxyUser: Schema.optional(Schema.String),
});

export const ServiceSchemas = {
  "wtfismyip.com": Schema.Struct({ YourFuckingIPAddress: Schema.String }),
  "myip.wtf": Schema.Struct({ YourFuckingIPAddress: Schema.String }),
  "api.my-ip.io/v2/ip.json": Schema.Struct({ ip: Schema.String }),
  "check.torproject.org": Schema.Struct({ IP: Schema.String }),
  "httpbin.org": Schema.Struct({ origin: Schema.String }),
  "ifconfig.pro": Schema.Struct({ ip: Schema.String }),
} as const;

export type ServiceSchemas = typeof ServiceSchemas;

export const IPInfo = Schema.Struct({
  ip: Schema.String,
  serviceName: Schema.optional(Schema.String),
  serviceNameUrl: Schema.optional(Schema.String),
  proxy: Schema.optional(Schema.String),
  proxyUser: Schema.optional(Schema.String),
  rawResponse: Schema.optional(Schema.Union(Schema.String, Schema.Unknown)),
});

export type IPInfo = Schema.Schema.Type<typeof IPInfo>;

export const GeoIPInfo = Schema.Struct({
  ...IPInfo.fields,
  range: Schema.optional(Schema.Array(Schema.Number)),
  country: Schema.optional(Schema.String),
  region: Schema.optional(Schema.String),
  city: Schema.optional(Schema.String),
  lat: Schema.optional(Schema.Number),
  lon: Schema.optional(Schema.Number),
  timezone: Schema.optional(Schema.String),
  offset: Schema.optional(Schema.Number),
  currency: Schema.optional(Schema.String),
});

export type GeoIPInfo = Schema.Schema.Type<typeof GeoIPInfo>;

const isValidIP = (s: string): boolean => isIPv4(s) || isIPv6(s);

const IPField = Schema.String.pipe(
  Schema.filter(isValidIP, { message: () => "Invalid IPv4 or IPv6 address" }),
);

const IpFromString = Schema.transformOrFail(
  Schema.NonEmptyString,
  Schema.Trim,
  {
    strict: true,
    decode: (input, _, ast) => {
      if (isValidIP(input)) {
        return ParseResult.succeed(input);
      }

      const fail = ParseResult.fail(
        new ParseResult.Type(ast, input, "Failed to parse IP from string"),
      );

      const rawIp = input.split(" - ")?.at(0);

      if (!rawIp) {
        return fail;
      }

      if (!isValidIP(rawIp)) {
        return fail;
      }

      return ParseResult.succeed(rawIp);
    },

    encode: (input) => ParseResult.succeed(input.toString()),
  },
);

export const IPInfoResponse = Schema.Struct({
  YourFuckingIPAddress: Schema.optional(IPField),
  origin: Schema.optional(IPField),
  IP: Schema.optional(IPField),
  ip: Schema.optional(IPField),
  remote_addr: Schema.optional(IPField),
  raw: Schema.optional(IpFromString),
});
