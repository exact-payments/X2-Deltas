export type Query = {
  $and?: Record<string, any>[]
  $not?: Record<string, any>[]
  $nor?: Record<string, any>[]
  $or ?: Record<string, any>[]
  [k: string]: any
}
