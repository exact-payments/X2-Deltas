import { applyDelta } from '../apply-delta'

describe('applyDelta', () => {
  it('returns the delta as a replacement document is it isn\'t a valid delta', () => {
    expect(applyDelta({
      a: 1,
    }, {
      x: 1,
    })).toMatchObject({
      x: 1,
    })
  })
  describe('$currentDate', () => {
    it('sets the current date at the specified paths', () => {
      expect(applyDelta({
        a: 1,
        c: { a: 1 },
        e: { a: 1 },
      }, {
        $currentDate: {
          a    : true,
          'b.a': true,
          e    : true,
        },
      })).toMatchObject({
        a: expect.any(Date),
        b: {
          a: expect.any(Date),
        },
        c: {
          a: 1,
        },
        e: expect.any(Date),
      })
    })
  })

  describe('$inc', () => {
    it('increments a field or sets it if it doesn\'t exist', () => {
      expect(applyDelta({
        a: 5,
        c: { a: 5 },
        e: 5,
        d: 5,
      }, {
        $inc: {
          a    : 1,
          'b.a': 2,
          e    : -4,
        },
      })).toMatchObject({
        a: 6,
        b: {
          a: 2,
        },
        c: {
          a: 5,
        },
        e: 1,
        d: 5,
      })
    })
  })

  describe('$min', () => {
    it('sets the min value or sets it if it doesn\'t exist', () => {
      expect(applyDelta({
        a: 5,
        c: { a: 5 },
        e: new Date(1630000000000),
        d: 5,
        f: new Date(1600000000000),
      }, {
        $min: {
          a    : 1,
          'b.a': 2,
          e    : new Date(1600000000000),
          f    : 10,
        },
      })).toMatchObject({
        a: 1,
        b: {
          a: 2,
        },
        c: {
          a: 5,
        },
        e: new Date(1600000000000),
        d: 5,
        f: 10,
      })
    })
  })

  describe('$max', () => {
    it('sets the max value or sets it if it doesn\'t exist', () => {
      expect(applyDelta({
        a: 5,
        c: { a: 5 },
        e: new Date(1630000000000),
        d: 5,
        f: new Date(1600000000000),
      }, {
        $max: {
          a    : 1,
          'b.a': 2,
          e    : new Date(1600000000000),
          f    : 10,
        },
      })).toMatchObject({
        a: 5,
        b: {
          a: 2,
        },
        c: {
          a: 5,
        },
        e: new Date(1630000000000),
        d: 5,
        f: new Date(1600000000000),
      })
    })
  })

  describe('$mul', () => {
    it('multiplies the value or sets it to zero if it doesn\'t exist', () => {
      expect(applyDelta({
        a: 5,
        c: { a: 5 },
        e: 5,
        d: 5,
      }, {
        $mul: {
          a    : 1,
          'b.a': 2,
          e    : 7,
        },
      })).toMatchObject({
        a: 5,
        b: {
          a: 0,
        },
        c: {
          a: 5,
        },
        e: 35,
        d: 5,
      })
    })
  })

  describe('$rename', () => {
    it('renames paths', () => {
      expect(applyDelta({
        a: 5,
        c: { a: 5 },
        e: 5,
        d: 5,
      }, {
        $rename: {
          a    : 'ax',
          'b.a': 'bx',
          c    : 'c.x',
          e    : 'ex',
        },
      })).toMatchObject({
        ax: 5,
        c : {
          x: {
            a: 5,
          },
        },
        ex: 5,
        d : 5,
      })
    })
  })

  describe('$set', () => {
    it('sets values', () => {
      expect(applyDelta({
        a: 5,
        c: { a: 5 },
        e: 5,
        d: 5,
      }, {
        $set: {
          a    : 1,
          'b.a': 2,
          c    : 3,
          e    : 4,
        },
      })).toMatchObject({
        a: 1,
        b: {
          a: 2,
        },
        c: 3,
        e: 4,
        d: 5,
      })
    })
  })

  describe('$setOnInsert', () => {
    it('sets values when asInsert is true', () => {
      expect(applyDelta({
        a: 5,
        c: { a: 5 },
        e: 5,
        d: 5,
      }, {
        $setOnInsert: {
          a    : 1,
          'b.a': 2,
          c    : 3,
          e    : 4,
        },
      }, { asInsert: true })).toMatchObject({
        a: 1,
        b: {
          a: 2,
        },
        c: 3,
        e: 4,
        d: 5,
      })
    })
  })

  describe('$unset', () => {
    it('unsets values', () => {
      expect(applyDelta({
        a: 5,
        c: { a: 5 },
        e: 5,
        d: 5,
      }, {
        $unset: {
          a    : true,
          'b.a': true,
          c    : false,
          e    : '',
        },
      })).toMatchObject({
        b: {},
        d: 5,
      })
    })
  })

  describe('$addToSet', () => {
    it('adds values to array if not already present', () => {
      expect(applyDelta({
        a: [1, 2, 3],
        c: { a: [1, 2, 2, 3] },
        e: 5,
        d: 5,
        f: [5, 7],
      }, {
        $addToSet: {
          a    : 4,
          'b.a': 5,
          'b.b': { $each: [5, 5] },
          'c.a': { $each: [3, 4, 5] },
          e    : 1,
          f    : 7,
        },
      })).toMatchObject({
        a: [1, 2, 3, 4],
        b: { a: [5], b: [5] },
        c: { a: [1, 2, 2, 3, 4, 5] },
        e: 5,
        d: 5,
        f: [5, 7],
      })
    })
  })

  describe('$pop', () => {
    it('removes the first or last item in an array', () => {
      expect(applyDelta({
        a: [1, 2, 3],
        c: { a: [1, 2, 2, 3] },
        d: [5],
        e: 5,
        f: 1,
      }, {
        $pop: {
          a    : 1,
          'b.a': -1,
          'c.a': -1,
          e    : 1,
          d    : 1,
        },
      })).toMatchObject({
        a: [1, 2],
        c: { a: [2, 2, 3] },
        e: 5,
        d: [],
        f: 1,
      })
    })
  })

  describe('$pull', () => {
    it('removes a value present in an array', () => {
      expect(applyDelta({
        a: [1, 2, 3],
        c: { a: [1, 2, 2, 3] },
        d: [5],
        e: 5,
        f: 1,
      }, {
        $pull: {
          a    : 1,
          'b.a': 2,
          'c.a': 2,
          d    : 1,
          e    : 5,
        },
      })).toMatchObject({
        a: [2, 3],
        c: { a: [1, 3] },
        d: [5],
        e: 5,
        f: 1,
      })
    })
  })

  describe('$push', () => {
    it('adds an item to an array', () => {
      expect(applyDelta({
        a: [1, 2, 3],
        c: { a: [1, 2, 2, 3] },
        d: [5],
        e: 5,
        f: 1,
      }, {
        $push: {
          a    : 1,
          'b.a': 2,
          'c.a': 2,
          d    : 1,
          e    : 5,
        },
      })).toMatchObject({
        a: [1, 2, 3, 1],
        c: { a: [1, 2, 2, 3, 2] },
        d: [5, 1],
        e: 5,
        f: 1,
      })
    })
  })

  describe('$pullAll', () => {
    it('adds an item to an array', () => {
      expect(applyDelta({
        a: [1, 2, 3],
        c: { a: [1, 2, 2, 3] },
        d: [5],
        e: 5,
        f: 1,
      }, {
        $pullAll: {
          a    : [1, 2],
          'b.a': [2],
          'c.a': [2, 3],
          d    : [1],
          e    : [5],
        },
      })).toMatchObject({
        a: [3],
        c: { a: [1] },
        d: [5],
        e: 5,
        f: 1,
      })
    })
  })
})
