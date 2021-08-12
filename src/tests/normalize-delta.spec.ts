import { expect } from 'chai'
import { normalizeDelta } from '../normalize-delta'

describe('normalizeDelta(delta) -> delta', () => {
  it('converts delta without operators to a delta with a $set operator', () => {
    const delta = normalizeDelta({ foo: 'bar' })
    expect(delta).deep.equal({ $set: { foo: 'bar' } })
  })
})
