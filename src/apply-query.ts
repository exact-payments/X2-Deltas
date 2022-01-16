import { getType } from './delta'
import { getPath } from './path'
import { Query } from './query'

const matchesEq = ($eq: any, field: any) => {
  const fieldIsObject = field && typeof field === 'object'
  const $eqIsObject   = $eq && typeof $eq === 'object'

  const fieldIsArray = fieldIsObject && typeof field.length === 'number'
  const $eqIsArray   = $eqIsObject && typeof $eq.length === 'number'

  if (fieldIsArray) {
    const hasSubArrFieldMatch = field.some((f: any) => matchesEq($eq, f))
    if (hasSubArrFieldMatch) { return true }
    if (!$eqIsArray) { return false }
  }

  if ($eqIsObject && fieldIsObject) {
    const $eqEntries   = Object.entries($eq)
    const fieldEntries = Object.entries(field)

    if ($eqEntries.length !== fieldEntries.length) { return false }

    const zipped = $eqEntries.map(($eq, i) => [$eq, fieldEntries[i]])
    for (const [[$eqProp, $eqValue], [$fieldProp, $fieldValue]] of zipped) {
      if ($eqProp !== $fieldProp) { return false }
      if (!matchesEq($eqValue, $fieldValue)) { return false }
    }

    return true
  }

  return $eq === field
}

const matchesGt = ($gt: any, field: any) => {
  const $gtType   = getType($gt)
  const fieldType = getType(field)
  return $gtType === fieldType && field > $gt
}

const matchesGte = ($gte: any, field: any) => {
  const $gteType  = getType($gte)
  const fieldType = getType(field)
  return $gteType === fieldType && field >= $gte
}

const matchesIn = ($in: any, field: any) => {
  if (!$in || typeof $in !== 'object' || typeof $in.length !== 'number') {
    throw new Error('$in needs an array')
  }
  return $in.some(($eq: any) => matchesEq($eq, field))
}

const matchesLt = ($lt: any, field: any) => {
  const $ltType   = getType($lt)
  const fieldType = getType(field)
  return $ltType === fieldType && field < $lt
}

const matchesLte = ($lte: any, field: any) => {
  const $lteType  = getType($lte)
  const fieldType = getType(field)
  return $lteType === fieldType && field <= $lte
}

const matchesNe = ($ne: any, field: any) => {
  return !matchesEq($ne, field)
}

const matchesNin = ($nin: any, field: any) => {
  return !matchesIn($nin, field)
}

const matchesExists = ($exists: any, field: any) => {
  return $exists
    ? field !== undefined
    : field === undefined
}

const matchesType = ($type: any, field: any) => {
  const fieldType = getType(field)
  return $type === fieldType
}

const matchesMod = ($mod: any, field: any) => {
  if (
    !$mod ||
    typeof $mod !== 'object' ||
    $mod.length !== 2 ||
    typeof $mod[0] !== 'number' ||
    typeof $mod[1] !== 'number'
  ) { throw new Error('$mod needs an array with two numbers') }
  return field % $mod[0] === $mod[1]
}

const matchesRegex = ($regex: any, $options: any, field: any) => {
  if (typeof $regex !== 'string' && !($regex instanceof RegExp)) {
    throw new Error('$regex needs a string or regular expression')
  }
  if (!!$options && typeof $options !== 'string') {
    throw new Error('$options needs a string if provided')
  }
  if (typeof $regex === 'string') {
    $regex = RegExp($regex, $options)
  } else if ($options) {
    $regex = RegExp($regex.source, $options)
  }
  return $regex.test(field)
}

const matchesQuery = (query: Record<string, any>, document: Record<string, any>) => {
  let isMatch = true
  for (const path in query) {
    const queryOperator = query[path]
    const value         = getPath(document, path)

    if (
      queryOperator === null ||
      typeof queryOperator !== 'object' ||
      Object.keys(queryOperator).every(k => k[0] !== '$')
    ) {
      if (!matchesEq(queryOperator, value)) {
        isMatch = false
        break
      }
      continue
    }

    if ('$eq' in queryOperator) {
      if (!matchesEq(queryOperator.$eq, value)) {
        isMatch = false
        break
      }
    }

    if ('$gt' in queryOperator) {
      if (!matchesGt(queryOperator.$gt, value)) {
        isMatch = false
        break
      }
    }

    if ('$gte' in queryOperator) {
      if (!matchesGte(queryOperator.$gte, value)) {
        isMatch = false
        break
      }
    }

    if ('$in' in queryOperator) {
      if (!matchesIn(queryOperator.$in, value)) {
        isMatch = false
        break
      }
    }

    if ('$lt' in queryOperator) {
      if (!matchesLt(queryOperator.$lt, value)) {
        isMatch = false
        break
      }
    }

    if ('$lte' in queryOperator) {
      if (!matchesLte(queryOperator.$lte, value)) {
        isMatch = false
        break
      }
    }

    if ('$ne' in queryOperator) {
      if (!matchesNe(queryOperator.$ne, value)) {
        isMatch = false
        break
      }
    }

    if ('$nin' in queryOperator) {
      if (!matchesNin(queryOperator.$nin, value)) {
        isMatch = false
        break
      }
    }

    if ('$exists' in queryOperator) {
      if (!matchesExists(queryOperator.$exists, value)) {
        isMatch = false
        break
      }
    }

    if ('$type' in queryOperator) {
      if (!matchesType(queryOperator.$type, value)) {
        isMatch = false
        break
      }
    }

    if ('$mod' in queryOperator) {
      if (!matchesMod(queryOperator.$mod, value)) {
        isMatch = false
        break
      }
    }

    if ('$regex' in queryOperator) {
      if (!matchesRegex(queryOperator.$regex, queryOperator.$options, value)) {
        isMatch = false
        break
      }
    }

    // TODO: implement geospatial query operators
  }

  return isMatch
}

export const applyQuery = <D extends Record<string, any>>(documents: D[], query: Query): D[] => {
  const andQueries = query.$and ?? []
  const norQueries = query.$nor ?? []
  const orQueries  = query.$or ?? []

  const rootQueryFields = Object.keys(query).filter(f => !f.startsWith('$'))
  if (rootQueryFields.length !== 0) {
    const rootQuery: Record<string, any> = {}
    for (const field of rootQueryFields) {
      rootQuery[field] = query[field]
    }
    andQueries.push(rootQuery)
  }

  const documentPool         = documents.slice()
  const documentMatches: D[] = []

  if (andQueries.length !== 0) {
    for (let i = 0; i < documentPool.length; i += 1) {
      let isAndMatch = true
      for (const q of andQueries) {
        if (!matchesQuery(q, documentPool[i])) {
          isAndMatch = false
          break
        }
      }
      if (isAndMatch) {
        documentMatches.push(documentPool[i])
        documentPool.splice(i, 1)
        i -= 1
      }
    }
  }

  if (norQueries.length !== 0) {
    for (let i = 0; i < documentPool.length; i += 1) {
      let isAndMatch = true
      for (const q of norQueries) {
        if (matchesQuery(q, documentPool[i])) {
          isAndMatch = false
          break
        }
      }
      if (isAndMatch) {
        documentMatches.push(documentPool[i])
        documentPool.splice(i, 1)
        i -= 1
      }
    }
  }

  if (orQueries.length !== 0) {
    for (let i = 0; i < documentPool.length; i += 1) {
      let isAndMatch = false
      for (const q of orQueries) {
        if (matchesQuery(q, documentPool[i])) {
          isAndMatch = true
          break
        }
      }
      if (isAndMatch) {
        documentMatches.push(documentPool[i])
        documentPool.splice(i, 1)
        i -= 1
      }
    }
  }

  return documentMatches
}
