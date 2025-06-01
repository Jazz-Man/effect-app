import { Effect } from "effect";
import { AppServices } from "./implementations";
import { getPublicIP } from "./worker/ipLogic";

Effect.runPromise(getPublicIP.pipe(Effect.provide(AppServices)))
  .then((result) => {
    console.log("Public IP Info:", result);
  })
  .catch((error) => {
    console.error("Error:", error.message);
  });
