import { Console, Effect } from "effect";
import { getProxyUrl } from "./worker/proxy.ts";
import { IpInfo } from "./worker/service.ts";

const program = Effect.gen(function* () {
  const ip = yield* IpInfo;

  const proxy = getProxyUrl();

  const data = yield* ip.getMyIp("https://wtfismyip.com/text", proxy);

  console.log({ data, proxy });

  return data;
}).pipe(Effect.catchAllCause((cause) => Console.log(cause)));

Effect.runFork(program.pipe(Effect.provide(IpInfo.Default)));

// const getPostAsJson = Effect.gen(function* () {
//   const client = (yield* BunHttpClient.HttpClient).pipe(
//     BunHttpClient.filterStatusOk,
//     BunHttpClient.followRedirects(1),
//   );

//   const proxy = getProxyUrl();

//   const response = yield* client.get("https://wtfismyip.com/text", {
//     verbose: true,
//     proxy,
//     headers: {
//       "User-Agent": "curl/8.7.1",
//     },
//   });

//   const ipResul = yield* response.json;

//   const res = { ip: Object.values(ipResul), proxy };
//   return res;
// }).pipe(Effect.provide(BunFetchHttpClient.layer));

// getPostAsJson.pipe(
//   Effect.andThen((post) => Console.log(post)),
//   BunRuntime.runMain,
// );
