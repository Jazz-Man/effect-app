import { Effect, Console, Schema, Layer } from "effect"
import { Worker } from "@effect/platform"
import { BunWorker, BunRuntime } from "@effect/platform-bun"
import * as path from "path"
import * as fs from "fs"

// Define simple message schemas
const SimpleMessage = Schema.Struct({
  text: Schema.String,
  value: Schema.Number
})

const SimpleResponse = Schema.Struct({
  processedText: Schema.String,
  doubledValue: Schema.Number,
  timestamp: Schema.Number
})

type SimpleMessage = Schema.Schema.Type<typeof SimpleMessage>
type SimpleResponse = Schema.Schema.Type<typeof SimpleResponse>

// Create a simple worker file
const workerCode = `
import { Effect, Schema } from "effect"
import { Worker } from "@effect/platform"

const SimpleMessage = Schema.Struct({
  text: Schema.String,
  value: Schema.Number
})

const SimpleResponse = Schema.Struct({
  processedText: Schema.String,
  doubledValue: Schema.Number,
  timestamp: Schema.Number
})

const handler = Worker.makeHandler({
  decode: Schema.decode(SimpleMessage),
  encode: Schema.encode(SimpleResponse),
  onMessage: (message) =>
    Effect.gen(function* () {
      yield* Effect.log(\`Simple worker received: \${message.text}\`)
      
      // Simple processing
      const processedText = message.text.toUpperCase()
      const doubledValue = message.value * 2
      
      return {
        processedText,
        doubledValue,
        timestamp: Date.now()
      }
    })
})

Worker.run(handler)
`

// Create the worker file
const workerPath = path.join(__dirname, "simple-worker.ts")
fs.writeFileSync(workerPath, workerCode)

// Main program
const program = Effect.gen(function* () {
  yield* Console.log("=== Simple Worker Example ===\n")
  
  // Example 1: Using a single worker
  yield* Console.log("1. Single Worker Example")
  yield* Console.log("Creating a single worker...")
  
  const singleWorker = yield* Worker.makeWorker<SimpleMessage, SimpleResponse>().pipe(
    Effect.provide(
      BunWorker.layer(() => new globalThis.Worker(workerPath))
    )
  )
  
  const response1 = yield* singleWorker.execute({
    text: "hello worker",
    value: 42
  })
  
  yield* Console.log(`Response: ${JSON.stringify(response1, null, 2)}`)
  
  // Example 2: Using a worker pool
  yield* Console.log("\n2. Worker Pool Example")
  yield* Console.log("Creating a pool of 3 workers...")
  
  const workerPool = yield* Worker.makePool<SimpleMessage, SimpleResponse>({
    size: 3,
    onCreate: () => Effect.sync(() => console.log("Pool worker created")),
    onTerminate: () => Effect.sync(() => console.log("Pool worker terminated"))
  }).pipe(
    Effect.provide(
      BunWorker.layer(() => new globalThis.Worker(workerPath))
    )
  )
  
  // Send multiple messages to the pool
  const messages = Array.from({ length: 10 }, (_, i) => ({
    text: `message ${i}`,
    value: i * 10
  }))
  
  yield* Console.log("Sending 10 messages to the worker pool...")
  const startTime = Date.now()
  
  const responses = yield* Effect.forEach(
    messages,
    (msg) => workerPool.execute(msg),
    { concurrency: "unbounded" }
  )
  
  const duration = Date.now() - startTime
  
  yield* Console.log(`\nProcessed ${responses.length} messages in ${duration}ms`)
  yield* Console.log("Sample results:")
  responses.slice(0, 3).forEach((resp, i) => {
    console.log(`  Message ${i}: "${messages[i]?.text}" -> "${resp.processedText}" (value: ${resp.doubledValue})`)
  })
  
  yield* Console.log("\n=== Example completed ===")
}).pipe(Effect.scoped) // Use scoped to ensure workers are properly cleaned up

// Run the program
BunRuntime.runMain(program).catch((error) => {
  console.error("Error running example:", error)
  // Clean up the worker file
  try {
    fs.unlinkSync(workerPath)
  } catch {}
})

// Clean up on exit
process.on("exit", () => {
  try {
    fs.unlinkSync(workerPath)
  } catch {}
})