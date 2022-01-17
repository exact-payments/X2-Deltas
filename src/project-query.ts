import { Query } from './query'

export type ProjectQuery<Q extends Query, P extends Record<string, string>> = {
  [F in keyof Q as F extends `$${string}`
    ? F
    : F extends keyof P
      ? P[F]
      : F
  ]: Q[F]
}

const projectPath = <P extends Record<string, string>>(path: string, projection: P) => {
  if (path.startsWith('$')) { return path }
  return projection[path] ?? path
}

export const projectQuery = <Q extends Query, P extends Record<string, string>>(query: Q, projection: P): ProjectQuery<Q, P> =>
  Object.fromEntries(Object.entries(query).map(([f, v]) =>
    [projectPath(f, projection), v])) as any
