import { z, ZodObject } from 'zod'
import { applyDelta, Delta } from './apply-delta'

export const safeParseDelta = (delta: Delta, validation: ZodObject<any, any, any>) => {
  // TODO: handle arrays properly, perhaps add an option to applyDelta to
  // pretend that all needed fields are present
  const newObject = applyDelta({}, delta)
  const result    = validation.deepPartial().safeParse(newObject)
  if (result.success) {
    return { ...result, data: delta }
  }
  return result
}

const result = safeParseDelta({
  $set: { foo: 1 },
}, z.object({
  foo: z.literal(1),
  bar: z.string(),
}))

console.log(result)
