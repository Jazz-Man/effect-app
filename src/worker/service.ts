import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import { Console, Effect, Layer, Schema } from "effect";

const Post = Schema.Struct({
  id: Schema.Number,
  title: Schema.String,
});

const CustomFetchLive = FetchHttpClient.layer.pipe(
  Layer.provide(
    Layer.succeed(FetchHttpClient.RequestInit, {
      verbose: true,
      tls: {
        rejectUnauthorized: false,
      },
    } as BunFetchRequestInit),
  ),
);

const program = Effect.gen(function* () {
  const client = (yield* HttpClient.HttpClient).pipe(
    HttpClient.tapRequest(Console.log),
    HttpClient.filterStatusOk,
    HttpClient.mapRequest(
      HttpClientRequest.prependUrl("https://jsonplaceholder.typicode.com"),
    ),
  );

  const response = yield* client.get("/posts/1");

  return yield* HttpClientResponse.schemaBodyJson(Post)(response);
  // const json = yield* response.json;
  // console.log(json);
}).pipe(Effect.provide(CustomFetchLive));

// program.pipe(Effect.andThen(Console.log));
Effect.runPromise(program.pipe(Effect.andThen(Console.log)));
