
export type GetFirstPathKey<P> = P extends `${infer K}.${string}`
  ? K
  : P

export type GetPathRemainder<P> = P extends `${string}.${infer SP}`
  ? SP
  : P

export type ExpandPathObject<O extends Record<string, any>> = {
  [K in keyof O as GetFirstPathKey<K>]: K extends `${string}.${string}`
    ? ExpandPathObject<{ [SK in GetPathRemainder<K>]: O[K] }>
    : O[GetPathRemainder<K>]
}

export type DeepUnset<O extends Record<string, any>, D extends Record<string, any>> = {
  [K in keyof O as K extends keyof D
    ? never
    : K
  ]: K extends keyof D
    ? DeepUnset<O[K], D[K]>
    : O[K]
}

export type GetValueAtPath<O, P> = P extends `${string}.${string}`
  ? GetFirstPathKey<P> extends keyof O
    ? GetValueAtPath<O[GetFirstPathKey<P>], GetPathRemainder<P>>
    : never
  : P extends keyof O
    ? O[P]
    : undefined

export const setPath = <O extends Record<string, any>, P extends string, V>(object: O, path: P, value: V): O & ExpandPathObject<{ [K in P]: V }> => {
  const chunks = path.split('.')
  let ctx      = object as any
  for (let i = 0; i < chunks.length - 1; i += 1) {
    /* eslint-disable @exactpayments/x2/alignment */
    ctx[chunks[i]] ??= {}
    ctx = ctx[chunks[i]]
    /* eslint-enable @exactpayments/x2/alignment */
  }
  ctx[chunks[chunks.length - 1]] = value
  return object as any
}

export const deletePath = <O extends Record<string, any>, P extends string>(object: O, path: P): DeepUnset<O, { [K in P]: true }> => {
  const chunks = path.split('.')
  let ctx      = object as any
  for (let i = 0; i < chunks.length - 1; i += 1) {
    /* eslint-disable @exactpayments/x2/alignment */
    ctx[chunks[i]] ??= {}
    ctx = ctx[chunks[i]]
    /* eslint-enable @exactpayments/x2/alignment */
  }
  delete ctx[chunks[chunks.length - 1]]
  return object as any
}

export const getPath = <O extends Record<string, any>, P extends string>(object: O, path: P): GetValueAtPath<O, P> => {
  const chunks = path.split('.')
  let ctx      = object as any
  for (let i = 0; i < chunks.length; i += 1) {
    if (!ctx[chunks[i]]) { return undefined as any }
    ctx = ctx[chunks[i]]
  }
  return ctx
}
