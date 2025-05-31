// schema.ts
import { Schema } from "effect";

// Створення схеми користувача
export const User = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	position: Schema.String,
	programmingLanguage: Schema.String,
	experienceYears: Schema.Number,
	address: Schema.String,
	age: Schema.Number,
	hobbies: Schema.Array(Schema.String),
	employed: Schema.Boolean,
});

export type User = Schema.Schema.Type<typeof User>;

export class Todo extends Schema.Class<Todo>("Todo")({
	id: Schema.Number,
	userId: Schema.Number,
	title: Schema.String,
	completed: Schema.Boolean,
}) {}

export const TodoWithoutId = Schema.Struct(Todo.fields).pipe(Schema.omit("id"));
export type TodoWithoutId = Schema.Schema.Type<typeof TodoWithoutId>;
