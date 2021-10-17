
export type GetFirstPathKey<P> = P extends `${infer K}.${string}`
  ? K
  : P

export type GetPathRemainder<P> = P extends `${string}.${infer SP}`
  ? SP
  : P

export type GetValueAtPath<O, P> = P extends `${string}.${string}`
  ? GetFirstPathKey<P> extends keyof O
    ? GetValueAtPath<O[GetFirstPathKey<P>], GetPathRemainder<P>>
    : never
  : P extends keyof O
    ? O[P]
    : undefined

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

export type ApplyRename<O, U> = U extends { $rename: infer D }
  ? D extends Record<string, string>
    ? & DeepUnset<O, ExpandPathObject<{ [K in keyof D]: true }>>
      & ExpandPathObject<{ [K in keyof D as D[K]]: GetValueAtPath<O, K> }>
    : O
  : O

export type ApplyCurrentDate<O, U> = U extends { $currentDate: infer D }
  ? D extends Record<string, any>
    ? DeepUnset<O, D> & ExpandPathObject<{ [K in keyof D]: Date }>
    : O
  : O

export type ApplySet<O, U> = U extends { $set: infer D }
  ? D extends Record<string, any>
    ? DeepUnset<O, D> & ExpandPathObject<D>
    : O
  : O

export type ApplyUnset<O, U> = U extends { $unset: infer D }
  ? DeepUnset<O, ExpandPathObject<D>> : O

export const deltaOperators = [
  '$currentDate',
  '$inc',
  '$min',
  '$max',
  '$mul',
  '$rename',
  '$set',
  '$setOnInsert',
  '$unset',
  '$addToSet',
  '$pop',
  '$pull',
  '$push',
  '$pullAll',
] as const

export type Delta = {
  // eslint-disable-next-line @exactpayments/x2/alignment
  $currentDate?: Record<string, { $type: 'date' } | true>
  $inc?        : Record<string, number>
  $min?        : Record<string, any>
  $max?        : Record<string, any>
  $mul?        : Record<string, number>
  $rename?     : Record<string, string>
  $set?        : Record<string, any>
  $setOnInsert?: Record<string, any>
  $unset?      : Record<string, any>
  $addToSet?   : Record<string, any>
  $pop?        : Record<string, -1 | 1>
  $pull?       : Record<string, any>
  $push?       : Record<string, any>
  $pullAll?    : Record<string, any[]>
}

export type Operator = keyof Delta

export type ApplyDeltaResult<
  O extends Record<string, any>,
  U extends Delta,
> = ApplyCurrentDate<ApplySet<ApplyUnset<ApplyRename<O, U>, U>, U>, U>

export const deltaTypeWeight = [
  'unknown',
  'regex',
  'date',
  'boolean',
  'buffer',
  'array',
  'object',
  'string',
  'number',
  'null',
]

export const getType = (value: any) => {
  if (value instanceof RegExp) {
    return 'regex'
  } else if (value instanceof Date) {
    return 'date'
  } else if (typeof value === 'boolean') {
    return 'boolean'
  } else if (value instanceof Buffer || value instanceof ArrayBuffer) {
    return 'buffer'
  } else if (value instanceof Array) {
    return 'array'
  } else if (typeof value === 'object') {
    return 'object'
  } else if (typeof value === 'string') {
    return 'string'
  } else if (typeof value === 'number') {
    return 'number'
  } else if (value === null) {
    return 'null'
  } else {
    return 'unknown'
  }
}

export const getMin = <A, B>(a: A, b: B): A | B => {
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.min(a, b) as any
  } else if (a instanceof Date && b instanceof Date) {
    return new Date(Math.min(a.getTime(), b.getTime())) as any
  } else {
    return deltaTypeWeight.indexOf(getType(a)) > deltaTypeWeight.indexOf(getType(b))
      ? a as any
      : b as any
  }
}

export const getMax = <A, B>(a: A, b: B): A | B => {
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.max(a, b) as any
  } else if (a instanceof Date && b instanceof Date) {
    return new Date(Math.max(a.getTime(), b.getTime())) as any
  } else {
    return deltaTypeWeight.indexOf(getType(a)) < deltaTypeWeight.indexOf(getType(b))
      ? a as any
      : b as any
  }
}

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

export const applyCurrentDate = (object: Record<string, any>, currentDatePaths: Record<string, { $type: 'date' } | true>) => {
  for (const path in currentDatePaths) {
    setPath(object, path, new Date())
  }
}

export const applyInc = (object: Record<string, any>, incPaths: Record<string, number>) => {
  for (const path in incPaths) {
    const currentValue = getPath(object, path)
    if (currentValue === undefined) {
      setPath(object, path, incPaths[path])
    } else if (typeof currentValue === 'number') {
      setPath(object, path, currentValue + incPaths[path])
    }
  }
}

export const applyMin = (object: Record<string, any>, minPaths: Record<string, any>) => {
  for (const path in minPaths) {
    const minValue     = minPaths[path]
    const currentValue = getPath(object, path)
    const newValue = currentValue === undefined
      ? minValue
      : getMin(currentValue, minValue)
    setPath(object, path, newValue)
  }
}

export const applyMax = (object: Record<string, any>, maxPaths: Record<string, any>) => {
  for (const path in maxPaths) {
    const maxValue     = maxPaths[path]
    const currentValue = getPath(object, path)
    const newValue = currentValue === undefined
      ? maxValue
      : getMax(currentValue, maxValue)
    setPath(object, path, newValue)
  }
}

export const applyMul = (object: Record<string, number>, mulPaths: Record<string, number>) => {
  for (const path in mulPaths) {
    const currentValue = getPath(object, path)
    if (currentValue === undefined) {
      setPath(object, path, 0)
    } else if (typeof currentValue === 'number') {
      setPath(object, path, currentValue * mulPaths[path])
    }
  }
}

export const applyRename = (object: Record<string, any>, renamePaths: Record<string, string>) => {
  for (const currentPath in renamePaths) {
    const newPath = renamePaths[currentPath]
    const value   = getPath(object, currentPath)
    deletePath(object, currentPath)
    setPath(object, newPath, value)
  }
}

export const applySet = (object: Record<string, any>, setPaths: Record<string, any>) => {
  for (const path in setPaths) {
    setPath(object, path, setPaths[path])
  }
}

export const applyUnset = (object: Record<string, any>, unsetPaths: Record<string, any>) => {
  for (const path in unsetPaths) {
    deletePath(object, path)
  }
}

export const applyAddToSet = (object: Record<string, any>, addToSetPaths: Record<string, any>) => {
  for (const path in addToSetPaths) {
    const value = getPath(object, path)
    if (!(value instanceof Array) && value !== undefined) { continue }
    const item = addToSetPaths[path]
    if (item && typeof item === 'object' && item.$each instanceof Array) {
      if (!value) {
        setPath(object, path, [...new Set(item.$each)])
        continue
      }
      for (const subItem of item.$each) {
        if (value.includes(subItem)) { continue }
        value.push(subItem)
      }
    } else {
      if (!value) {
        setPath(object, path, [item])
        continue
      }
      if (value.includes(item)) { continue }
      value.push(item)
    }
  }
}

export const applyPop = (object: Record<string, any>, popPaths: Record<string, -1 | 1>) => {
  for (const path in popPaths) {
    const value = getPath(object, path)
    if (!(value instanceof Array)) { continue }
    popPaths[path] === -1
      ? value.splice(0, 1)
      : value.splice(value.length - 1, 1)
  }
}

export const applyPull = (object: Record<string, any>, pullPaths: Record<string, any>) => {
  for (const path in pullPaths) {
    const value = getPath(object, path)
    if (!(value instanceof Array)) { continue }
    const itemToPull = pullPaths[path]
    // TODO: Once we have query matcher we should use it to check if I matches
    // a condition.
    while (true) {
      const index = value.indexOf(itemToPull)
      if (index === -1) { break }
      value.splice(index, 1)
    }
  }
}

export const applyPush = (object: Record<string, any>, pushPaths: Record<string, any>) => {
  for (const path in pushPaths) {
    const value = getPath(object, path)
    if (!(value instanceof Array)) { continue }
    const itemToPush = pushPaths[path]
    // TODO: Handle $each, $slice, $sort, and $position
    value.push(itemToPush)
  }
}

export const applyPullAll = (object: Record<string, any>, pullAllPaths: Record<string, any[]>) => {
  for (const path in pullAllPaths) {
    const value = getPath(object, path)
    if (!(value instanceof Array)) { continue }
    const itemsToPull = pullAllPaths[path]
    const newValue    = value.filter(i => !itemsToPull.includes(i))
    setPath(object, path, newValue)
  }
}

export type ApplyDeltaOptions = {
  asInsert?: boolean
}

export const applyDelta = <O extends Record<string, any>, U extends Record<string, any>>(
  object: O,
  delta: U,
  options?: ApplyDeltaOptions,
): U extends Delta ? ApplyDeltaResult<O, U> : U => {
  const keys = Object.keys(delta)

  if (keys.some((k: any) => !deltaOperators.includes(k))) {
    return delta as any
  }

  for (const operator in delta) {
    switch (operator as Operator) {
      case '$currentDate': applyCurrentDate(object, delta[operator] as any); break
      case '$inc': applyInc(object, delta[operator] as any); break
      case '$min': applyMin(object, delta[operator] as any); break
      case '$max': applyMax(object, delta[operator] as any); break
      case '$mul': applyMul(object, delta[operator] as any); break
      case '$rename': applyRename(object, delta[operator] as any); break
      case '$set': applySet(object, delta[operator] as any); break
      case '$setOnInsert': options?.asInsert && (applySet(object, delta[operator] as any)); break
      case '$unset': applyUnset(object, delta[operator] as any); break
      case '$addToSet': applyAddToSet(object, delta[operator] as any); break
      case '$pop': applyPop(object, delta[operator] as any); break
      case '$pull': applyPull(object, delta[operator] as any); break
      case '$push': applyPush(object, delta[operator] as any); break
      case '$pullAll': applyPullAll(object, delta[operator] as any); break
    }
  }

  return object as any
}
