import { X2ErrorSet } from '@exactpayments/x2-errors'
import { FilterQuery } from 'mongodb'

const getPaths = (obj: any, prefix: string = '') => {
  const keys = Object.keys(obj)
  prefix = prefix ? prefix + '.' : ''
  return keys.reduce((result: any[], key: string) => {
    if (Object.prototype.toString.call(obj[key]) === '[object Object]') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      result = result.concat(getPaths(obj[key], prefix + key))
    } else {
      result.push(prefix + key)
    }
    return result
  }, [])
}

export const validateDelta = <D>(deltaOrSet: Partial<D> | FilterQuery<D>, allowedOpts: string[], allowedPaths: string[]) => {
  const containsRootOperator = Object.keys(deltaOrSet).some(p => p[0] === '$')
  const delta = (containsRootOperator
    ? deltaOrSet
    : { $set: deltaOrSet }) as FilterQuery<D>

  const disallowedOperators = Object.keys(delta).filter(p => !allowedOpts.includes(p))
  if (disallowedOperators.length > 0) {
    return new X2ErrorSet(disallowedOperators.map(operator => ({
      message   : `${operator} is a disallowed operator`,
      kind      : 'disallowedOperator',
      statusCode: 400,
      path      : operator,
    })))
  }

  const disallowedPaths = []
  for (const operator in delta) {
    const paths = getPaths(delta[operator])
    const disallowedOperatorPaths = paths.filter(path => !allowedPaths.some((allowedPath) => {
      const pathChunks        = path.split('.')
      const allowedPathChunks = allowedPath.split('.')
      if (
        pathChunks.length !== allowedPathChunks.length &&
        allowedPathChunks[allowedPathChunks.length - 1] !== '**'
      ) { return false }
      for (let i = 0; i < allowedPathChunks.length; i += 1) {
        if (
          pathChunks[i] === allowedPathChunks[i] ||
          (allowedPathChunks[i] === '*' && pathChunks[i] !== undefined)
        ) { continue }
        if (allowedPathChunks[i] === '**' && i === allowedPathChunks.length - 1) { break }
        return false
      }
      return true
    }))

    if (disallowedOperatorPaths.length > 0) {
      disallowedPaths.push(...disallowedOperatorPaths.map(p => `${operator}.${p}`))
    }
  }

  if (disallowedPaths.length > 0) {
    return new X2ErrorSet(disallowedPaths.map(path => ({
      message   : `${path} is a disallowed path`,
      kind      : 'disallowedPath',
      statusCode: 400,
      path,
    })))
  }
}
