import { Effect } from "effect";

// Effect.runPromise(getPublicIP.pipe(Effect.provide(AppServices)))
//   .then((result) => {
//     console.log("Public IP Info:", result);
//   })
//   .catch((error) => {
//     console.error("Error:", error.message);
//   });

const program = Effect.gen(function* () {});

Effect.runSync(program);
