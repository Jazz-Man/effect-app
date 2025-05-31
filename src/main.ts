import { Effect, Layer, Console, Scope } from "effect"
import { HttpRouter, HttpServer, HttpServerResponse } from "@effect/platform"
import { BunHttpServer, BunRuntime, BunWorker } from "@effect/platform-bun"
import { Worker } from "@effect/platform"
import { UserService, UserServiceLive } from "./UserService"
import type { WorkerMessage, WorkerResponse, User } from "./models"
import * as path from "node:path"

// Process all users through workers
const processAllUsers = Effect.gen(function* () {
  const userService = yield* UserService
  
  // Create worker pool
  const pool = yield* Worker.makePool<WorkerMessage, WorkerResponse>({
    size: 4,
    onCreate: () => Effect.sync(() => {
      console.log("Worker created")
    }),
    onTerminate: () => Effect.sync(() => {
      console.log("Worker terminated")
    })
  }).pipe(
    Effect.provide(
      BunWorker.layer(() => 
        new globalThis.Worker(path.join(__dirname, "worker.ts"))
      )
    )
  )
  
  // Get all users from the service
  const users = yield* userService.getAllUsers()
  yield* Effect.log(`Starting to process ${users.length} users`)
  
  const startTime = Date.now()
  
  // Process users in parallel using the worker pool
  const processing = yield* Effect.forEach(
    users,
    (user) => 
      pool.execute({ user }).pipe(
        Effect.tap((response) => 
          Effect.log(
            `Processed user ${user.id}: hired=${response.user.isHired}, time=${response.processingTime}ms`
          )
        ),
        Effect.catchAll((error) =>
          Effect.gen(function* () {
            yield* Effect.log(`Failed to process user ${user.id}: ${error}`)
            return { user, processingTime: 0 } as WorkerResponse
          })
        )
      ),
    { concurrency: "unbounded" }
  )
  
  // Update all users in the service
  yield* Effect.forEach(
    processing,
    (response) => userService.updateUser(response.user),
    { concurrency: "inherit" }
  )
  
  const totalTime = Date.now() - startTime
  
  return {
    processedCount: processing.length,
    totalTime,
    averageTime: totalTime / processing.length,
    results: processing
  }
})

// Create HTTP routes
const router = HttpRouter.empty.pipe(
  // Root route
  HttpRouter.get(
    "/",
    HttpServerResponse.text(
      "Worker Pool Demo - Use /process to process all users or /users to see current users"
    )
  ),
  
  // Get all users
  HttpRouter.get(
    "/users",
    Effect.gen(function* () {
      const userService = yield* UserService
      const users = yield* userService.getAllUsers()
      return yield* HttpServerResponse.json(users)
    })
  ),
  
  // Process all users
  HttpRouter.post(
    "/process",
    Effect.gen(function* () {
      yield* Effect.log("Received request to process all users")
      
      // Run processing in a scope to ensure proper cleanup
      const result = yield* processAllUsers.pipe(Effect.scoped)
      
      return yield* HttpServerResponse.json({
        message: "Processing completed",
        processedCount: result.processedCount,
        totalTimeMs: result.totalTime,
        averageTimeMs: result.averageTime.toFixed(2)
      })
    })
  ),
  
  // Get specific user
  HttpRouter.get(
    "/users/:id",
    Effect.gen(function* () {
      const userService = yield* UserService
      const users = yield* userService.getAllUsers()
      const params = yield* HttpRouter.params
      const userId = params.id
      const user = users.find((u: User) => u.id === userId)
      
      if (!user) {
        return yield* HttpServerResponse.empty({ status: 404 })
      }
      
      return yield* HttpServerResponse.json(user)
    })
  )
)

// Application setup
const ServerLive = BunHttpServer.layer({ port: 3000 })

const app = router.pipe(
  HttpServer.serve(),
  HttpServer.withLogAddress
)

const AppLive = Layer.mergeAll(
  ServerLive,
  UserServiceLive
)

// Run the application
BunRuntime.runMain(
  app.pipe(
    Layer.provide(AppLive),
    Layer.launch,
    Effect.tap(() =>
      Console.log(`
🚀 Worker Pool Demo Ready!
📍 Server running at http://localhost:3000

Available endpoints:
- GET  /         - Welcome message
- GET  /users    - List all users
- GET  /users/:id - Get specific user
- POST /process  - Process all users through workers

Workers in pool: 4
Each worker will randomly modify user data and simulate API calls.
      `)
    )
  )
)