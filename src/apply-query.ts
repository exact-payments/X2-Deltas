import { deltaTypeWeight, getType } from './delta'
import { getPath } from './path'

export type Query = {
  $and?: Record<string, any>[]
  $not?: Record<string, any>[]
  $nor?: Record<string, any>[]
  $or ?: Record<string, any>[]
  [k: string]: any
}

const matchesExpr = (expression: any, document: Record<string, any>) => {
  console.warn('$expr not implemented')
  return false
}

const matchesJsonSchema = (jsonSchema: any, document: Record<string, any>) => {
  console.warn('$jsonSchema not implemented')
  return false
}

const matchesText = (text: any, document: Record<string, any>) => {
  console.warn('$text not implemented')
  return false
}

const matchesWhere = (text: any, document: Record<string, any>) => {
  console.warn('$text not implemented')
  return false
}

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
  if ($gtType !== fieldType) {
    return deltaTypeWeight.indexOf(fieldType) > deltaTypeWeight.indexOf($gtType)
  }
  return field < $gt
}

const matchesGte = ($gte: any, field: any) => {
  const $gteType  = getType($gte)
  const fieldType = getType(field)
  if ($gteType !== fieldType) {
    return deltaTypeWeight.indexOf(fieldType) >= deltaTypeWeight.indexOf($gteType)
  }
  return field >= $gte
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
  if ($ltType !== fieldType) {
    return deltaTypeWeight.indexOf(fieldType) < deltaTypeWeight.indexOf($ltType)
  }
  return field < $lt
}

const matchesLte = ($lte: any, field: any) => {
  const $lteType  = getType($lte)
  const fieldType = getType(field)
  if ($lteType !== fieldType) {
    return deltaTypeWeight.indexOf(fieldType) <= deltaTypeWeight.indexOf($lteType)
  }
  return field <= $lte
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
  const $gteType  = getType($type)
  const fieldType = getType(field)
  return $gteType === fieldType
}

const matchesMod = ($mod: any, field: any) => {
  console.warn('$mod not implemented')
  return false
}

const matchesRegex = ($regex: any, field: any) => {
  console.warn('$regex not implemented')
  return false
}

const matchesQuery = (query: Record<string, any>, document: Record<string, any>) => {
  let isMatch = true
  for (const path in query) {
    if (path === '$expr') {
      if (!matchesExpr(query[path], document)) {
        isMatch = false
        break
      }
    }

    if (path === '$jsonSchema') {
      if (!matchesJsonSchema(query[path], document)) {
        isMatch = false
        break
      }
    }

    if (path === '$text') {
      if (!matchesText(query[path], document)) {
        isMatch = false
        break
      }
    }

    if (path === '$where') {
      if (!matchesWhere(query[path], document)) {
        isMatch = false
        break
      }
    }

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
      if (!matchesRegex(queryOperator.$regex, value)) {
        isMatch = false
        break
      }
    }
  }
  return isMatch
}

export const applyQuery = <D extends Record<string, any>>(query: Query, documents: D[]): D[] => {
  const andQueries = query.$and ?? []
  const norQueries = query.$nor ?? []
  const orQueries  = query.$or ?? []
  andQueries.push(query)

  const documentPool         = documents.slice()
  const documentMatches: D[] = []

  for (let i = 0; i < documentPool.length; i += 1) {
    let isAndMatch = true
    for (const query of andQueries) {
      if (!matchesQuery(query, documentPool[i])) {
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

  for (let i = 0; i < documentPool.length; i += 1) {
    let isAndMatch = true
    for (const query of norQueries) {
      if (matchesQuery(query, documentPool[i])) {
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

  for (let i = 0; i < documentPool.length; i += 1) {
    let isAndMatch = false
    for (const query of orQueries) {
      if (matchesQuery(query, documentPool[i])) {
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

  return documentMatches
}
