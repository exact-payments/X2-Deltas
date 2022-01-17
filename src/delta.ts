
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

export type Operator = keyof Delta

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
