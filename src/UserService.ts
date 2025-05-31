import { Context, Effect, Layer } from "effect";
import type { User } from "./models";

// Service interface
export interface UserService {
	readonly getAllUsers: () => Effect.Effect<User[]>;
	readonly updateUser: (user: User) => Effect.Effect<User>;
}

// Service tag
export const UserService = Context.Tag<UserService>("UserService");

// Mock data generator
const generateMockUsers = (): User[] => {
	const positions = [
		"Frontend Developer",
		"Backend Developer",
		"DevOps Engineer",
		"Data Scientist",
		"Product Manager",
	];
	const languages = [
		"TypeScript",
		"Python",
		"Go",
		"Rust",
		"Java",
		"JavaScript",
		"C#",
	];
	const hobbies = [
		"Reading",
		"Gaming",
		"Hiking",
		"Cooking",
		"Photography",
		"Music",
		"Sports",
	];
	const addresses = [
		"Kyiv, Ukraine",
		"Lviv, Ukraine",
		"Odesa, Ukraine",
		"Kharkiv, Ukraine",
		"Dnipro, Ukraine",
	];

	return Array.from({ length: 10 }, (_, i) => ({
		id: `user-${i + 1}`,
		name: `User ${i + 1}`,
		position: positions[i % positions.length]!,
		programmingLanguage: languages[i % languages.length]!,
		yearsOfExperience: Math.floor(Math.random() * 15) + 1,
		address: addresses[i % addresses.length]!,
		age: Math.floor(Math.random() * 30) + 22,
		hobby: hobbies[i % hobbies.length]!,
		isHired: Math.random() > 0.3,
	}));
};

// In-memory storage
const users: User[] = generateMockUsers();

// Service implementation
const make = (): UserService => ({
	getAllUsers: () => Effect.succeed(users),

	updateUser: (updatedUser: User) =>
		Effect.sync(() => {
			const index = users.findIndex((u) => u.id === updatedUser.id);
			if (index !== -1) {
				users[index] = updatedUser;
				return updatedUser;
			}
			throw new Error(`User with id ${updatedUser.id} not found`);
		}),
});

// Service layer
export const UserServiceLive = Layer.succeed(UserService, make());
