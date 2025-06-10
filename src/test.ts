import { Console, Effect } from "effect";
import { IpInfo } from "./worker/service.ts";

const program = Effect.gen(function* () {
  const ip = yield* IpInfo;
  const _data = yield* ip.getMyIp("https://wtfismyip.com/json");

  // return data;
}).pipe(Effect.catchAllCause((cause) => Console.log(cause)));

Effect.runFork(program.pipe(Effect.provide(IpInfo.Default)));
