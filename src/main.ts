import { Effect, Random } from "effect";
import { AppServices } from "./implementations";
import { getPublicIP } from "./worker/ipLogic";

// Effect.runPromise(getPublicIP.pipe(Effect.provide(AppServices)))
//   .then((result) => {
//     console.log("Public IP Info:", result);
//   })
//   .catch((error) => {
//     console.error("Error:", error.message);
//   });

const program = Effect.gen(function* () {
  console.log(yield* Random.next);
});

Effect.runSync(program);

const override = program.pipe(Effect.withRandom(Random.make("myseed")));

Effect.runSync(override);
