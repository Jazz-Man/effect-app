import { BunRuntime, BunWorkerRunner } from "@effect/platform-bun";
import * as Runner from "@effect/platform/WorkerRunner";
import { Effect, Layer, Stream } from "effect";

const WorkerLive = Effect.gen(function* () {
	// Випадкова затримка
	const delay = Math.floor(Math.random() * 3000) + 1000;
	yield* Effect.sleep(delay);

	yield* Runner.make((n: number) => {
		return Stream.range(0, n);
	});
	yield* Effect.log("worker started TEST");
	yield* Effect.addFinalizer(() => Effect.log("worker closed"));
}).pipe(Layer.scopedDiscard, Layer.provide(BunWorkerRunner.layer));

BunRuntime.runMain(Runner.launch(WorkerLive));
