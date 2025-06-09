import { ParseResult, Schema } from "effect";

import { isIPv4, isIPv6 } from "node:net";

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
});

export const IPInfoResponseUnion = Schema.Union(IPInfoResponse, IpFromString);
