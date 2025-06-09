import { Console, Effect } from "effect";
import { IpInfo } from "./worker/service";

const program = Effect.gen(function* () {
  const ip = yield* IpInfo;
  const data = yield* ip.getMyIp("https://wtfismyip.com/json");
  console.log(data);

  // return data;
}).pipe(Effect.catchAllCause((cause) => Console.log(cause)));

Effect.runFork(program.pipe(Effect.provide(IpInfo.Default)));
