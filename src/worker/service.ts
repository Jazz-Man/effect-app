// import {
// 	FetchHttpClient,
// 	type HttpBody,
// 	HttpClient,
// 	type HttpClientError,
// 	HttpClientRequest,
// 	HttpClientResponse,
// } from "@effect/platform";
// import { BunRuntime } from "@effect/platform-bun";
// import { Todo, TodoWithoutId } from "./schema";

// export interface TodoService {
// 	readonly create: (
// 		_: TodoWithoutId,
// 	) => Effect.Effect<
// 		Todo,
// 		| HttpClientError.HttpClientError
// 		| HttpBody.HttpBodyError
// 		| ParseResult.ParseError
// 	>;

// 	readonly list: () => Effect.Effect<
// 		| Todo[]
// 		| HttpClientError.HttpClientError
// 		| HttpBody.HttpBodyError
// 		| ParseResult.ParseError
// 	>;
// }
// const TodoService = Context.GenericTag<TodoService>(
// 	"@effect/platform-bun/examples/TodoService",
// );

// const makeTodoService = Effect.gen(function* () {
// 	const defaultClient = (yield* HttpClient.HttpClient).pipe(
// 		// Log the request before fetching
// 		HttpClient.tapRequest(Console.log),
// 	);

// 	const clientWithBaseUrl = defaultClient.pipe(
// 		HttpClient.filterStatusOk,
// 		HttpClient.mapRequest(
// 			HttpClientRequest.prependUrl("https://jsonplaceholder.typicode.com"),
// 		),
// 	);

// 	const addTodoWithoutIdBody = HttpClientRequest.schemaBodyJson(TodoWithoutId);

// 	const create = (todo: TodoWithoutId) =>
// 		addTodoWithoutIdBody(HttpClientRequest.post("/todos"), todo).pipe(
// 			Effect.flatMap(clientWithBaseUrl.execute),
// 			Effect.flatMap(HttpClientResponse.schemaBodyJson(Todo)),
// 			Effect.scoped,
// 		);

// 	const list = () => HttpClientRequest.get("/todos");
// 	// .pipe(
// 	// 	// Effect.flatMap(clientWithBaseUrl.execute),
// 	// 	// Effect.flatMap(HttpClientResponse.schemaBodyJson(Todo)),
// 	// 	Effect.scoped,
// 	// )

// 	return TodoService.of({ create, list });
// });

// const TodoServiceLive = Layer.effect(TodoService, makeTodoService).pipe(
// 	Layer.provide(FetchHttpClient.layer),
// );

// Effect.flatMap(TodoService, (todos) => {
// 	console.log(todos);

// 	return todos.create({ userId: 1, title: "test", completed: false });
// }).pipe(
// 	Effect.tap(Effect.log),
// 	Effect.provide(TodoServiceLive),
// 	BunRuntime.runMain,
// );

// import {
// 	Cookies,
// 	FetchHttpClient,
// 	HttpClient,
// 	HttpClientRequest,
// } from "@effect/platform";
// import { Console, Effect, Ref } from "effect";

// const program = Effect.gen(function* () {
// 	const ref = yield* Ref.make(Cookies.empty);

// 	// Access HttpClient
// 	const client = (yield* HttpClient.HttpClient).pipe(
// 		// Log the request before fetching
// 		HttpClient.tapRequest(Console.log),
// 		HttpClient.withCookiesRef(ref),
// 	);

// 	// Create a GET request
// 	// const req = client.get("https://jsonplaceholder.typicode.com/posts/1");

// 	// Make a GET request to the specified URL
// 	yield* client.get("https://www.google.com/");

// 	// Log the keys of the cookies stored in the reference
// 	console.log(yield* ref);

// 	// Optionally customize the request

// 	// Execute the request and get the response
// 	// const response = yield* client.execute(req);

// 	// const json = yield* response.json;

// 	// console.log(json);
// }).pipe(
// 	// Provide the HttpClient
// 	Effect.provide(FetchHttpClient.layer),
// );

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
