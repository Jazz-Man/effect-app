import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { Schema } from "@effect/schema";
import { Database, type SqliteClient } from "@effect/sql-sqlite-bun";

import { Context, Data, Effect, Layer } from "effect";

// 1. Define a User schema using effect/schema
const User = Schema.Struct({
	id: Schema.PositiveBigInt,
	username: Schema.NonEmptyString,
	email: Schema.NonEmptyString.pipe(Schema.pattern(/^.+@.+\..+$/)),

	// email: Schema.String.pipe(
	// 	Schema.nonEmptyString(),
	// 	Schema.pattern(/^.+@.+\..+$/),
	// ),
});
// Define a schema for creating a User (without the ID)
const CreateUser = Schema.Struct({
	username: Schema.NonEmptyString,
	email: Schema.String.pipe(
		Schema.nonEmptyString(),
		Schema.pattern(/^.+@.+\..+$/),
	),
});

// Define a schema for updating a User (optional fields, requires ID)
const UpdateUser = Schema.Struct({
	id: Schema.PositiveBigInt,
	username: Schema.optional(
		Schema.String.pipe(Schema.nonEmptyString()),
	).toOption(),
	email: Schema.optional(
		Schema.String.pipe(Schema.nonEmptyString(), Schema.pattern(/^.+@.+\..+$/)),
	).toOption(),
});

// Infer the TypeScript types
type User = Schema.Schema.Type<typeof User>;
type CreateUser = Schema.Schema.Type<typeof CreateUser>;
type UpdateUser = Schema.Schema.Type<typeof UpdateUser>;

// Define a service/repository to encapsulate database operations
class UserRepository extends Context.Tag("UserRepository")<
	UserRepository,
	{
		createTable: Effect.Effect<void, SqliteClient.SqlError, SqliteClient>;
		insert: (
			user: CreateUser,
		) => Effect.Effect<User, SqliteClient.SqlError, SqliteClient>;
		getAll: Effect.Effect<Array<User>, SqliteClient.SqlError, SqliteClient>;
		getUserById: (
			id: number,
		) => Effect.Effect<User | undefined, SqliteClient.SqlError, SqliteClient>;
		update: (
			user: UpdateUser,
		) => Effect.Effect<number, SqliteClient.SqlError, SqliteClient>; // Returns number of affected rows
		delete: (
			id: number,
		) => Effect.Effect<number, SqliteClient.SqlError, SqliteClient>; // Returns number of affected rows
	}
>() {}

// Implementation of the UserRepository
const UserRepositoryLive = Layer.effect(
	UserRepository,
	Effect.map(SqlClient, (sql) => ({
		// Create the users table if it doesn't exist
		createTable: sql`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE
      );
    `.execute(),

		// Insert a new user
		insert: (user) =>
			Effect.gen(function* () {
				// Optional: Validate the input user data before inserting
				yield* Schema.validate(CreateUser)(user);

				const result = yield* sql`
          INSERT INTO users (username, email)
          VALUES (${user.username}, ${user.email})
          RETURNING id, username, email; -- SQLite often supports RETURNING
        `.selectOne(); // Use selectOne for a single row result

				// Decode the result from the database into the User schema
				const decodedUser = yield* Schema.decode(User)(result);

				return decodedUser;
			}),

		// Get all users
		getAll: Effect.gen(function* () {
			const rows = yield* sql`SELECT id, username, email FROM users;`.select();
			// Decode the results from the database into an Array of User schema
			const decodedUsers = yield* Schema.decode(Schema.Array(User))(rows);
			return decodedUsers;
		}),

		// Get a user by their ID
		getUserById: (id) =>
			Effect.gen(function* () {
				const row =
					yield* sql`SELECT id, username, email FROM users WHERE id = ${id};`.selectOne();
				// If row is undefined (user not found), Schema.decode will handle it based on the schema definition
				if (!row) {
					return undefined; // Or Effect.fail(new UserNotFound({ id })) if you have a custom error
				}
				const decodedUser = yield* Schema.decode(User)(row);
				return decodedUser;
			}),

		// Update a user by ID
		update: (user) =>
			Effect.gen(function* () {
				// Validate the update input
				yield* Schema.validate(UpdateUser)(user);

				// Use the query builder for a more structured update
				const updateQuery = sql`UPDATE users SET`;
				const updates: Array<SqlClient.Parameter | SqlClient.Sql> = [];

				if (user.username._tag === "Some") {
					updates.push(sql`username = ${user.username.value}`);
				}
				if (user.email._tag === "Some") {
					updates.push(sql`email = ${user.email.value}`);
				}

				if (updates.length === 0) {
					console.log("No fields to update.");
					return 0; // No rows affected if nothing to update
				}

				// Join the updates with commas
				const setClause = sql.join(updates, ", ");

				// Construct the final query
				const result = yield* updateQuery
					.append(setClause)
					.append(sql`WHERE id = ${user.id}`)
					.execute();

				return result.changes; // Return the number of affected rows
			}),

		// Delete a user by ID
		delete: (id) =>
			Effect.gen(function* () {
				const result = yield* sql`DELETE FROM users WHERE id = ${id}`.execute();
				return result.changes; // Return the number of affected rows
			}),
	})),
);

// 2. Set up the Database and SqlClient using @effect/sql-sqlite-bun
// Use a temporary directory for the database file for this example
const dbDir = path.join(os.tmpdir(), "effect-bun-sqlite-example");
const dbPath = path.join(dbDir, "example.sqlite");

// Ensure the directory exists
fs.mkdirSync(dbDir, { recursive: true });

const SqlClientLive = Database.layer({
	filename: dbPath,
	sync: true, // Optional: sync writes to disk immediately
});

// Combine the layers
const LiveEnv = SqlClientLive.pipe(Layer.provide(UserRepositoryLive));

// The main Effect program
const program = Effect.gen(function* () {
	const userRepo = yield* UserRepository;

	// Ensure the table exists
	yield* userRepo.createTable;
	console.log("Users table ensured to exist.");

	// Insert new users
	console.log("Inserting users...");
	const user1Data: CreateUser = {
		username: "john_doe",
		email: "john@example.com",
	};
	const user2Data: CreateUser = {
		username: "jane_doe",
		email: "jane@example.com",
	};

	const insertedUser1 = yield* userRepo.insert(user1Data);
	console.log("Inserted user 1:", insertedUser1);

	const insertedUser2 = yield* userRepo.insert(user2Data);
	console.log("Inserted user 2:", insertedUser2);

	// Fetch all users
	console.log("Fetching all users...");
	const allUsers = yield* userRepo.getAll;
	console.log("All users:", allUsers);

	// Update user 1
	console.log(`Updating user with id ${insertedUser1.id}...`);
	const updateUser1Data: UpdateUser = {
		id: insertedUser1.id,
		username: Option.some("john_doe_updated"),
		email: Option.none(),
	};
	const affectedRowsUpdate = yield* userRepo.update(updateUser1Data);
	console.log(`Affected rows during update: ${affectedRowsUpdate}`);

	// Fetch user 1 again to see the update
	console.log(`Fetching user with id ${insertedUser1.id} after update...`);
	const fetchedUser1AfterUpdate = yield* userRepo.getUserById(insertedUser1.id);
	console.log("Fetched user 1 after update:", fetchedUser1AfterUpdate);

	// Delete user 2
	console.log(`Deleting user with id ${insertedUser2.id}...`);
	const affectedRowsDelete = yield* userRepo.delete(insertedUser2.id);
	console.log(`Affected rows during delete: ${affectedRowsDelete}`);

	// Fetch all users again to see the deletion
	console.log("Fetching all users after deletion...");
	const allUsersAfterDelete = yield* userRepo.getAll;
	console.log("All users after deletion:", allUsersAfterDelete);

	// Clean up the database file and directory (optional for examples)
	yield* Effect.sync(() => {
		if (fs.existsSync(dbPath)) {
			fs.unlinkSync(dbPath);
			console.log("Database file removed.");
		}
		// Check if directory is empty before removing
		if (fs.existsSync(dbDir) && fs.readdirSync(dbDir).length === 0) {
			fs.rmdirSync(dbDir);
			console.log("Database directory removed.");
		}
	});
});

// Run the program
Effect.runPromise(program.pipe(Effect.provide(LiveEnv))).catch(console.error);
