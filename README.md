# Effect-TS Worker Pool Demo with Bun

This is a proof-of-concept application demonstrating how to use Worker Pools with Effect-TS and Bun runtime. The application simulates processing user data through parallel workers that make external API calls and update user information.

## 🚀 Features

- **Worker Pool Management**: Utilizes `@effect/platform` Worker API with Bun-specific implementation
- **Parallel Processing**: Processes multiple users concurrently using a pool of 4 workers
- **HTTP Server**: Built with Effect Platform HTTP server running on Bun
- **Simulated Database**: In-memory user storage with CRUD operations
- **External API Integration**: Workers make fetch requests to httpbin.org
- **Random Processing Delays**: Simulates real-world processing times (100ms - 2000ms)
- **Type Safety**: Full TypeScript support with Effect schemas

## 📋 Prerequisites

- [Bun](https://bun.sh/) runtime (v1.0 or higher)
- [pnpm](https://pnpm.io/) package manager

## 🛠️ Installation

```bash
# Clone or navigate to the project directory
cd effect-app

# Install dependencies
pnpm install
```

## 🏃‍♂️ Running the Application

```bash
# Development mode
pnpm dev

# or
pnpm start
```

The server will start on http://localhost:3000

## 📡 API Endpoints

### GET /
Welcome message with available endpoints

### GET /users
Returns all users in the system

**Response:**
```json
[
  {
    "id": "user-1",
    "name": "User 1",
    "position": "Frontend Developer",
    "programmingLanguage": "TypeScript",
    "yearsOfExperience": 5,
    "address": "Kyiv, Ukraine",
    "age": 28,
    "hobby": "Reading",
    "isHired": true
  }
]
```

### GET /users/:id
Returns a specific user by ID

### POST /process
Processes all users through the worker pool

**Response:**
```json
{
  "message": "Processing completed",
  "processedCount": 10,
  "totalTimeMs": 3542,
  "averageTimeMs": "354.20"
}
```

## 🏗️ Architecture

### Project Structure
```
effect-app/
├── src/
│   ├── main.ts          # Main application entry point
│   ├── worker.ts        # Worker implementation
│   ├── models.ts        # Data models and schemas
│   └── UserService.ts   # User service for data management
├── package.json
├── tsconfig.json
└── README.md
```

### Components

1. **Main Application** (`main.ts`)
   - Sets up HTTP server using `@effect/platform` and `@effect/platform-bun`
   - Creates and manages the worker pool
   - Defines HTTP routes
   - Coordinates user processing

2. **Worker** (`worker.ts`)
   - Processes individual users
   - Makes HTTP requests to external API (httpbin.org)
   - Applies random modifications to user data
   - Simulates processing delays

3. **Models** (`models.ts`)
   - Defines `User` schema with all required fields
   - Defines `WorkerMessage` and `WorkerResponse` schemas for worker communication

4. **UserService** (`UserService.ts`)
   - Provides in-memory user storage
   - Implements `getAllUsers` and `updateUser` operations
   - Generates mock user data

## 🔧 How It Works

1. **Worker Pool Creation**: The application creates a pool of 4 workers using `Worker.makePool`
2. **User Processing Flow**:
   - Client sends POST request to `/process`
   - System fetches all users from UserService
   - Each user is sent to an available worker
   - Workers process users in parallel:
     - Add random delay (100-2000ms)
     - Make fetch request to httpbin.org
     - Modify user data (experience, age, hired status)
   - Results are collected and users are updated in the service
3. **Concurrency**: All workers run in parallel, significantly reducing total processing time

## ⚙️ Configuration

### Worker Pool Size
Modify the `size` parameter in `main.ts`:
```typescript
const workerPool = Worker.makePool<WorkerMessage, WorkerResponse>({
  size: 4, // Change this to adjust pool size
  // ...
})
```

### Server Port
Change the port in `main.ts`:
```typescript
const ServerLive = BunHttpServer.layer({ port: 3000 })
```

### Processing Delays
Adjust delay range in `worker.ts`:
```typescript
const delay = yield* Random.nextIntBetween(100, 2000) // milliseconds
```

## 📝 Example Usage

```bash
# 1. Start the server
pnpm dev

# 2. View all users
curl http://localhost:3000/users

# 3. Process all users (this will take a few seconds)
curl -X POST http://localhost:3000/process

# 4. View updated users
curl http://localhost:3000/users
```

## 🎯 Key Effect-TS Concepts Demonstrated

- **Effect**: Core effect type for composable, type-safe operations
- **Layer**: Dependency injection and service composition
- **Schema**: Runtime type validation and serialization
- **Worker**: Platform-agnostic worker pool implementation
- **HTTP Server**: Platform HTTP server with routing
- **Error Handling**: Comprehensive error handling with Effect
- **Logging**: Structured logging throughout the application

## 🔍 Monitoring

The application logs:
- Worker creation and termination
- User processing start/completion
- Processing times for each user
- HTTP server requests
- Any errors during processing

## 🚧 Notes

- This is a proof-of-concept demonstration
- In production, replace in-memory storage with a real database
- Consider implementing proper error recovery strategies
- Add authentication and authorization for API endpoints
- Implement rate limiting for the `/process` endpoint