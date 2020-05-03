import { MockRaf } from 'mock-raf'
import { Controller, SpringValue, FrameValue } from '..'

declare global {
  let mockRaf: MockRaf

  let advance: (n?: number) => Promise<void>
  let advanceByTime: (ms: number) => Promise<void>
  let advanceUntil: (test: () => boolean) => Promise<void>
  let advanceUntilIdle: () => Promise<void>
  let advanceUntilValue: <T>(spring: FrameValue<T>, value: T) => Promise<void>

  /** Take an array of values (one per animation frame) from internal test storage  */
  let getFrames: <T>(
    target: FrameValue<T> | Controller<Extract<T, object>>,
    preserve?: boolean
  ) => T[]

  /** Count the number of bounces in a spring animation */
  let countBounces: (spring: SpringValue<number>) => number

  const global: {
    mockRaf: typeof mockRaf
    advance: typeof advance
    advanceByTime: typeof advanceByTime
    advanceUntil: typeof advanceUntil
    advanceUntilIdle: typeof advanceUntilIdle
    advanceUntilValue: typeof advanceUntilValue
    countBounces: typeof countBounces
    getFrames: typeof getFrames
  }

  const setTimeout: (handler: Function, ms: number) => number
}
