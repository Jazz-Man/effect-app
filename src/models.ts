import { Schema } from "effect"

// User model with all required fields
export const User = Schema.Struct({
  // Unique identifier for the user
  id: Schema.String,
  
  // User's full name
  name: Schema.String,
  
  // Job position/title
  position: Schema.String,
  
  // Primary programming language
  programmingLanguage: Schema.String,
  
  // Years of experience in programming
  yearsOfExperience: Schema.Number,
  
  // Residential address
  address: Schema.String,
  
  // User's age
  age: Schema.Number,
  
  // User's hobby
  hobby: Schema.String,
  
  // Employment status
  isHired: Schema.Boolean
})

// Type inference from schema
export type User = Schema.Schema.Type<typeof User>

// Schema for the worker message containing user data
export const WorkerMessage = Schema.Struct({
  user: User
})

export type WorkerMessage = Schema.Schema.Type<typeof WorkerMessage>

// Schema for the worker response after processing
export const WorkerResponse = Schema.Struct({
  user: User,
  processingTime: Schema.Number
})

export type WorkerResponse = Schema.Schema.Type<typeof WorkerResponse>