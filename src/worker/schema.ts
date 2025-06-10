import { ParseResult, Schema } from "effect";

import { isIPv4, isIPv6 } from "node:net";

const isValidIp = (s: string): boolean => isIPv4(s) || isIPv6(s);

const ipField = Schema.String.pipe(
  Schema.filter(isValidIp, { message: () => "Invalid IPv4 or IPv6 address" }),
);

const IpFromString = Schema.transformOrFail(
  Schema.NonEmptyString,
  Schema.Trim,
  {
    strict: true,
    decode: (input, _, ast) => {
      if (isValidIp(input)) {
        return ParseResult.succeed(input);
      }

      const fail = ParseResult.fail(
        new ParseResult.Type(ast, input, "Failed to parse IP from string"),
      );

      const rawIp = input.split(" - ")?.at(0);

      if (!rawIp) {
        return fail;
      }

      if (!isValidIp(rawIp)) {
        return fail;
      }

      return ParseResult.succeed(rawIp);
    },

    encode: (input) => ParseResult.succeed(input.toString()),
  },
);

export const IpInfoResponse = Schema.Struct({
  YourFuckingIPAddress: Schema.optional(ipField),
  origin: Schema.optional(ipField),
  IP: Schema.optional(ipField),
  ip: Schema.optional(ipField),
  remote_addr: Schema.optional(ipField),
  raw: Schema.optional(ipField),
});

export const IpInfoResponseUnion = Schema.Union(IpInfoResponse, IpFromString);
