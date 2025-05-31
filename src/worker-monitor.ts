import { Effect, Ref, Duration, Stream, Schedule, Chunk, HashMap } from "effect"
import { BunRuntime } from "@effect/platform-bun"
import { Worker } from "@effect/platform"

// Worker statistics
interface WorkerStats {
  readonly workerId: number
  readonly tasksProcessed: number
  readonly totalProcessingTime: number
  readonly averageProcessingTime: number
  readonly lastTaskTime: number
  readonly errors: number
  readonly status: "idle" | "processing" | "error"
}

// Task information
interface TaskInfo {
  readonly taskId: string
  readonly workerId: number
  readonly startTime: number
  readonly endTime?: number
  readonly status: "pending" | "processing" | "completed" | "failed"
  readonly error?: string
}

// Monitoring service
interface WorkerMonitor {
  readonly recordTaskStart: (workerId: number, taskId: string) => Effect.Effect<void>
  readonly recordTaskEnd: (workerId: number, taskId: string, success: boolean, error?: string) => Effect.Effect<void>
  readonly getWorkerStats: (workerId: number) => Effect.Effect<WorkerStats | undefined>
  readonly getAllWorkerStats: () => Effect.Effect<ReadonlyArray<WorkerStats>>
  readonly getActiveTasks: () => Effect.Effect<ReadonlyArray<TaskInfo>>
  readonly getTotalStats: () => Effect.Effect<{
    totalTasks: number
    completedTasks: number
    failedTasks: number
    averageProcessingTime: number
    activeWorkers: number
  }>
  readonly streamStats: Stream.Stream<{
    timestamp: number
    workers: ReadonlyArray<WorkerStats>
    activeTasks: number
    queueSize: number
  }>
}

// Create monitoring service
export const makeWorkerMonitor = Effect.gen(function* () {
  // State management
  const workerStatsRef = yield* Ref.make<HashMap.HashMap<number, WorkerStats>>(HashMap.empty())
  const activeTasksRef = yield* Ref.make<HashMap.HashMap<string, TaskInfo>>(HashMap.empty())
  const completedTasksRef = yield* Ref.make<number>(0)
  const failedTasksRef = yield* Ref.make<number>(0)

  // Initialize worker stats
  const initializeWorker = (workerId: number) =>
    Ref.update(workerStatsRef, (stats) =>
      HashMap.set(stats, workerId, {
        workerId,
        tasksProcessed: 0,
        totalProcessingTime: 0,
        averageProcessingTime: 0,
        lastTaskTime: 0,
        errors: 0,
        status: "idle"
      })
    )

  // Record task start
  const recordTaskStart = (workerId: number, taskId: string) =>
    Effect.gen(function* () {
      // Ensure worker is initialized
      const stats = yield* Ref.get(workerStatsRef)
      if (!HashMap.has(stats, workerId)) {
        yield* initializeWorker(workerId)
      }

      // Update worker status
      yield* Ref.update(workerStatsRef, (stats) =>
        HashMap.modify(stats, workerId, (worker) => ({
          ...worker,
          status: "processing" as const
        }))
      )

      // Add active task
      yield* Ref.update(activeTasksRef, (tasks) =>
        HashMap.set(tasks, taskId, {
          taskId,
          workerId,
          startTime: Date.now(),
          status: "processing"
        })
      )
    })

  // Record task end
  const recordTaskEnd = (workerId: number, taskId: string, success: boolean, error?: string) =>
    Effect.gen(function* () {
      const endTime = Date.now()
      
      // Get task info
      const activeTasks = yield* Ref.get(activeTasksRef)
      const taskInfo = HashMap.get(activeTasks, taskId)
      
      if (taskInfo._tag === "Some") {
        const processingTime = endTime - taskInfo.value.startTime
        
        // Update worker stats
        yield* Ref.update(workerStatsRef, (stats) =>
          HashMap.modify(stats, workerId, (worker) => {
            const newTasksProcessed = worker.tasksProcessed + 1
            const newTotalTime = worker.totalProcessingTime + processingTime
            return {
              ...worker,
              tasksProcessed: newTasksProcessed,
              totalProcessingTime: newTotalTime,
              averageProcessingTime: newTotalTime / newTasksProcessed,
              lastTaskTime: endTime,
              errors: success ? worker.errors : worker.errors + 1,
              status: "idle" as const
            }
          })
        )
        
        // Update task counters
        if (success) {
          yield* Ref.update(completedTasksRef, (n) => n + 1)
        } else {
          yield* Ref.update(failedTasksRef, (n) => n + 1)
        }
        
        // Remove from active tasks
        yield* Ref.update(activeTasksRef, (tasks) => HashMap.remove(tasks, taskId))
      }
    })

  // Get worker stats
  const getWorkerStats = (workerId: number) =>
    Ref.get(workerStatsRef).pipe(
      Effect.map((stats) => HashMap.get(stats, workerId)),
      Effect.map((option) => option._tag === "Some" ? option.value : undefined)
    )

  // Get all worker stats
  const getAllWorkerStats = () =>
    Ref.get(workerStatsRef).pipe(
      Effect.map((stats) => Chunk.toReadonlyArray(HashMap.values(stats)))
    )

  // Get active tasks
  const getActiveTasks = () =>
    Ref.get(activeTasksRef).pipe(
      Effect.map((tasks) => Chunk.toReadonlyArray(HashMap.values(tasks)))
    )

  // Get total statistics
  const getTotalStats = () =>
    Effect.gen(function* () {
      const workerStats = yield* getAllWorkerStats()
      const completed = yield* Ref.get(completedTasksRef)
      const failed = yield* Ref.get(failedTasksRef)
      const activeTasks = yield* getActiveTasks()
      
      const totalProcessingTime = workerStats.reduce((sum, w) => sum + w.totalProcessingTime, 0)
      const totalTasks = completed + failed + activeTasks.length
      
      return {
        totalTasks,
        completedTasks: completed,
        failedTasks: failed,
        averageProcessingTime: totalTasks > 0 ? totalProcessingTime / totalTasks : 0,
        activeWorkers: workerStats.filter(w => w.status === "processing").length
      }
    })

  // Stream statistics
  const streamStats = Stream.repeatEffect(
    Effect.gen(function* () {
      const workers = yield* getAllWorkerStats()
      const activeTasks = yield* getActiveTasks()
      
      return {
        timestamp: Date.now(),
        workers,
        activeTasks: activeTasks.length,
        queueSize: 0 // This would need to be passed from the worker pool
      }
    })
  ).pipe(
    Stream.schedule(Schedule.spaced(Duration.seconds(1)))
  )

  return {
    recordTaskStart,
    recordTaskEnd,
    getWorkerStats,
    getAllWorkerStats,
    getActiveTasks,
    getTotalStats,
    streamStats
  } satisfies WorkerMonitor
})

// Create a monitored worker pool
export const makeMonitoredPool = <I, O>(
  options: Worker.WorkerPool.Options<I, O>,
  monitor: WorkerMonitor
) => {
  let taskCounter = 0
  
  return Worker.makePool<I, O>({
    ...options,
    onCreate: options.onCreate ? 
      (id) => options.onCreate!(id).pipe(
        Effect.tap(() => Effect.log(`Worker ${id} created`))
      ) : undefined,
    onTerminate: options.onTerminate ?
      (id) => options.onTerminate!(id).pipe(
        Effect.tap(() => Effect.log(`Worker ${id} terminated`))
      ) : undefined
  }).pipe(
    Effect.map((pool) => ({
      ...pool,
      execute: (input: I) => {
        const taskId = `task-${++taskCounter}`
        const workerId = Math.floor(Math.random() * (options.size || 1)) // Simplified worker assignment
        
        return Effect.gen(function* () {
          yield* monitor.recordTaskStart(workerId, taskId)
          
          try {
            const result = yield* pool.execute(input)
            yield* monitor.recordTaskEnd(workerId, taskId, true)
            return result
          } catch (error) {
            yield* monitor.recordTaskEnd(workerId, taskId, false, String(error))
            throw error
          }
        })
      }
    }))
  )
}

// Console dashboard for monitoring
export const runMonitoringDashboard = (monitor: WorkerMonitor) =>
  monitor.streamStats.pipe(
    Stream.tap((stats) =>
      Effect.sync(() => {
        console.clear()
        console.log("=== Worker Pool Monitor ===")
        console.log(`Timestamp: ${new Date(stats.timestamp).toLocaleTimeString()}`)
        console.log(`Active Tasks: ${stats.activeTasks}`)
        console.log("\nWorker Status:")
        
        stats.workers.forEach((worker) => {
          const status = worker.status === "processing" ? "🟢" : "⚪"
          console.log(`  ${status} Worker ${worker.workerId}: ${worker.tasksProcessed} tasks, avg ${worker.averageProcessingTime.toFixed(0)}ms`)
        })
        
        return Effect.void
      })
    ),
    Stream.runDrain
  )

// Example usage
if (import.meta.main) {
  const program = Effect.gen(function* () {
    const monitor = yield* makeWorkerMonitor
    
    // Run monitoring dashboard in background
    yield* Effect.fork(runMonitoringDashboard(monitor))
    
    // Simulate some tasks
    for (let i = 0; i < 20; i++) {
      yield* monitor.recordTaskStart(i % 4, `task-${i}`)
      yield* Effect.sleep(Duration.millis(Math.random() * 1000))
      yield* monitor.recordTaskEnd(i % 4, `task-${i}`, Math.random() > 0.1)
    }
    
    // Get final stats
    const stats = yield* monitor.getTotalStats()
    console.log("\nFinal Statistics:")
    console.log(JSON.stringify(stats, null, 2))
  })
  
  BunRuntime.runMain(program)
}