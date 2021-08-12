import type { FilterQuery } from 'mongodb'

export const normalizeDelta = <D>(deltaOrSet: Partial<D> | FilterQuery<D>): FilterQuery<D> => {
  const containsRootOperator = Object.keys(deltaOrSet).some(p => p[0] === '$')
  return (containsRootOperator
    ? deltaOrSet
    : { $set: deltaOrSet }) as FilterQuery<D>
}
