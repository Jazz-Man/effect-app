import os from "node:os";
import { Worker } from "@effect/platform";
import { BunRuntime, BunWorker } from "@effect/platform-bun";
import { Array as A, Console, Context, Effect, Layer, Stream } from "effect";
import type { GetIpDataType } from "./service/IpInfoService";
import { getProxyUrl } from "./worker/proxy";

class MyWorkerPool extends Context.Tag("@app/MyWorkerPool")<
  MyWorkerPool,
  Worker.WorkerPool<string, GetIpDataType, string>
>() {}

const PoolLive = Worker.makePoolLayer(MyWorkerPool, {
  size: os.availableParallelism(),
}).pipe(
  Layer.provide(
    BunWorker.layer(
      () =>
        new globalThis.Worker(
          new URL(`${__dirname}/worker/range.ts`, import.meta.url).href,
        ),
    ),
  ),
);

Effect.gen(function* () {
  const pool = yield* MyWorkerPool;

  yield* Effect.all(
    A.makeBy(5, (n) =>
      pool.execute(getProxyUrl()).pipe(
        Stream.runForEach((result) => {
          return Console.log(`worker ${n}`, result);
        }),
      ),
    ),
    { concurrency: "inherit" },
  );
}).pipe(Effect.provide(PoolLive), BunRuntime.runMain);
