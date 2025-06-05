import { Effect, Random } from "effect";

export const shuffleArray = <A>(
  array: ReadonlyArray<A>,
): Effect.Effect<ReadonlyArray<A>> => {
  const shuffleOnce = (
    arr: ReadonlyArray<A>,
    index: number,
  ): Effect.Effect<ReadonlyArray<A>> =>
    Random.nextIntBetween(index, arr.length).pipe(
      Effect.map((j) => {
        const mutable = [...arr];
        const temp = mutable[index];
        const elementAtJ = mutable[j];

        if (temp !== undefined && elementAtJ !== undefined) {
          mutable[index] = elementAtJ;
          mutable[j] = temp;
        }

        return mutable;
      }),
    );

  return array.reduce(
    (acc, _, i) => acc.pipe(Effect.flatMap((arr) => shuffleOnce(arr, i))),
    Effect.succeed(array),
  );
};
