import { Effect, Duration, Random, Schema } from "effect";
import { Worker } from "@effect/platform";
import {
	FetchHttpClient,
	HttpClient,
	HttpClientRequest,
} from "@effect/platform";
import { WorkerMessage, WorkerResponse, type User } from "./models";

// Function to simulate random changes to user data
const processUser = (user: User): Effect.Effect<User> =>
	Effect.gen(function* () {
		// Generate random modifications
		const randomBoolean = yield* Random.nextBoolean;
		const randomYears = yield* Random.nextIntBetween(0, 3);
		const randomAge = yield* Random.nextIntBetween(0, 2);

		// Simulate processing by making a fetch request
		const client = yield* HttpClient.HttpClient;

		// Send user data to httpbin.org echo endpoint
		const response = yield* client.pipe(
			HttpClient.filterStatusOk,
			HttpClient.post("https://httpbin.org/post", {
				body: HttpClient.body.json({
					userId: user.id,
					timestamp: new Date().toISOString(),
					processed: true,
				}),
			}),
			Effect.tapError((error) => Effect.log(`Failed to fetch: ${error}`)),
			Effect.orElse(() =>
				// Fallback if httpbin is down
				Effect.succeed({
					status: 200,
					body: JSON.stringify({ fallback: true }),
				} as any),
			),
		);

		// Apply random changes to simulate server processing
		return {
			...user,
			yearsOfExperience: Math.max(0, user.yearsOfExperience + randomYears),
			age: user.age + randomAge,
			isHired: randomBoolean ? !user.isHired : user.isHired,
			position:
				randomBoolean && user.yearsOfExperience > 5
					? `Senior ${user.position}`
					: user.position,
		};
	});

// Worker handler
const handler = Worker.makeHandler<WorkerMessage, WorkerResponse>({
	decode: Schema.decode(WorkerMessage),
	encode: Schema.encode(WorkerResponse),
	onMessage: (message) =>
		Effect.gen(function* () {
			const startTime = Date.now();

			yield* Effect.log(`Worker processing user: ${message.user.id}`);

			// Add random delay between 100ms and 2000ms
			const delay = yield* Random.nextIntBetween(100, 2000);
			yield* Effect.sleep(Duration.millis(delay));

			// Process the user
			const processedUser = yield* processUser(message.user);

			const processingTime = Date.now() - startTime;

			yield* Effect.log(
				`Worker finished processing user: ${message.user.id} in ${processingTime}ms`,
			);

			return {
				user: processedUser,
				processingTime,
			};
		}).pipe(
			Effect.provide(FetchHttpClient.layer),
			Effect.catchAll((error) =>
				Effect.gen(function* () {
					yield* Effect.log(`Worker error: ${error}`);
					// Return original user on error
					return {
						user: message.user,
						processingTime: Date.now() - Date.now(),
					};
				}),
			),
		),
});

// Run the worker
Worker.run(handler);
