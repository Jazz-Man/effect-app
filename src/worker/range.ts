import { WorkerRunner } from "@effect/platform";
import { BunRuntime, BunWorkerRunner } from "@effect/platform-bun";
import { Effect, Layer, Stream } from "effect";
import { IpInfoService } from "../service/IpInfoService";

const WorkerLive = Effect.gen(function* () {
  yield* WorkerRunner.make((proxy: string) =>
    Stream.fromEffect(IpInfoService.getIpData(proxy)),
  );

  yield* Effect.addFinalizer(() => Effect.log("worker closed"));
}).pipe(Layer.scopedDiscard, Layer.provide(BunWorkerRunner.layer));

BunRuntime.runMain(
  WorkerRunner.launch(WorkerLive).pipe(Effect.provide(IpInfoService.Default)),
);
