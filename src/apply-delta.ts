import { getMax, getMin, Delta, deltaOperators, Operator } from './delta'
import { DeepUnset, deletePath, ExpandPathObject, getPath, GetValueAtPath, setPath } from './path'

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

export type ApplyDeltaResult<
  O extends Record<string, any>,
  U extends Delta,
> = ApplyCurrentDate<ApplySet<ApplyUnset<ApplyRename<O, U>, U>, U>, U>

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

export const applyMul = (object: Record<string, any>, mulPaths: Record<string, number>) => {
  for (const path in mulPaths) {
    const currentValue = getPath(object, path)
    if (currentValue === undefined) {
      setPath(object, path, 0)
    } else if (typeof currentValue === 'number') {
      setPath(object, path, currentValue * mulPaths[path])
    }
  }
}

export const applyRename = (object: Record<string, any>, renamePaths: Record<string, string>, useUndefinedForDelete: boolean) => {
  for (const currentPath in renamePaths) {
    const newPath = renamePaths[currentPath]
    const value   = getPath(object, currentPath)
    deletePath(object, currentPath, useUndefinedForDelete)
    setPath(object, newPath, value)
  }
}

export const applySet = (object: Record<string, any>, setPaths: Record<string, any>) => {
  for (const path in setPaths) {
    setPath(object, path, setPaths[path])
  }
}

export const applyUnset = (object: Record<string, any>, unsetPaths: Record<string, any>, useUndefinedForDelete: boolean) => {
  for (const path in unsetPaths) {
    deletePath(object, path, useUndefinedForDelete)
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
  asInsert?             : boolean
  useUndefinedForDelete?: boolean
  allowRootSet?         : boolean
}

export const applyDelta = <T, U, O extends ApplyDeltaOptions>(
  target: T,
  delta: U,
  options?: O,
): T extends Record<string, any>
    ? U extends Delta
      ? ApplyDeltaResult<T, U>
      : O['allowRootSet'] extends false
        ? U
        : ApplyDeltaResult<T, { $set: U }>
    : U => {
  const allowRootSet          = options?.allowRootSet !== false
  const useUndefinedForDelete = options?.useUndefinedForDelete !== false

  if (!target || typeof target !== 'object' || !delta || typeof delta !== 'object') {
    return target as any
  }

  const keys = Object.keys(delta)
  if (keys.some((k: any) => !deltaOperators.includes(k))) {
    if (!allowRootSet) {
      return delta as any
    }
    delta = { $set: delta } as any
  }

  for (const operator in delta) {
    switch (operator as Operator) {
      case '$currentDate': applyCurrentDate(target, delta[operator] as any); break
      case '$inc': applyInc(target, delta[operator] as any); break
      case '$min': applyMin(target, delta[operator] as any); break
      case '$max': applyMax(target, delta[operator] as any); break
      case '$mul': applyMul(target, delta[operator] as any); break
      case '$rename': applyRename(target, delta[operator] as any, useUndefinedForDelete); break
      case '$set': applySet(target, delta[operator] as any); break
      case '$setOnInsert': options?.asInsert && (applySet(target, delta[operator] as any)); break
      case '$unset': applyUnset(target, delta[operator] as any, useUndefinedForDelete); break
      case '$addToSet': applyAddToSet(target, delta[operator] as any); break
      case '$pop': applyPop(target, delta[operator] as any); break
      case '$pull': applyPull(target, delta[operator] as any); break
      case '$push': applyPush(target, delta[operator] as any); break
      case '$pullAll': applyPullAll(target, delta[operator] as any); break
    }
  }

  return target as any
}
