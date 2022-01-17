import { projectDelta } from '../project-delta'

describe('projectDelta(delta, projection) -> projectedDelta', () => {
  it('correctly projects new paths for a delta', () => {
    expect(projectDelta({
      $set: {
        a      : 1,
        'b.a.a': { a: 1 },
        d      : 1,
      },
    }, {
      a      : 'b',
      'b.a.a': 'c',
      d      : 'e.a',
    })).toMatchObject({
      $set: {
        b    : 1,
        c    : { a: 1 },
        'e.a': 1,
      },
    })
  })
})
