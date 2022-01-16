import { Delta } from './delta'

export type ProjectDelta<D extends Delta, P extends Record<string, string>> = {
  [O in keyof D]: {
    [K in keyof D[O] as K extends keyof P
      ? P[K] extends string ? string extends P[K] ? never : P[K] : never
      : K
    ]: D[O][K]
  }
}

export const projectDelta = <D extends Delta, P extends Record<string, string>>(delta: D, projection: P): ProjectDelta<D, P> =>
  Object.fromEntries(Object.entries(delta).map(([o, d]) =>
    [o, Object.fromEntries(Object.entries(d).map(([k, v]) =>
      [projection[k] ?? k, v]))])) as any
