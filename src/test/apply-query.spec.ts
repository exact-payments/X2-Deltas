import { applyQuery } from '../apply-query'

describe('applyQuery(collection, query) -> filteredCollection', () => {
  describe('$and', () => {
    it('filters out collection items that do not match all queries', async () => {
      const collection = [{ item: 'a', name: 'A' }, { item: 'a', name: 'B' }, { item: 'b', name: 'B' }]
      const query      = { $and: [{ item: 'a' }, { name: 'A' }] }
      const results    = applyQuery(collection, query)
      expect(results).toEqual([{ item: 'a', name: 'A' }])
    })
  })

  describe('$nor', () => {
    it('filters out collection items that match any of the queries', async () => {
      const collection = [{ item: 'a', name: 'A' }, { item: 'a', name: 'B' }, { item: 'b', name: 'B' }]
      const query      = { $nor: [{ item: 'a' }, { name: 'A' }] }
      const results    = applyQuery(collection, query)
      expect(results).toEqual([{ item: 'b', name: 'B' }])
    })
  })

  describe('$or', () => {
    it('filters out collection items that do not at least one of the queries', async () => {
      const collection = [{ item: 'a', name: 'A' }, { item: 'a', name: 'B' }, { item: 'b', name: 'B' }]
      const query      = { $or: [{ item: 'a' }, { name: 'A' }] }
      const results    = applyQuery(collection, query)
      expect(results).toEqual([{ item: 'a', name: 'A' }, { item: 'a', name: 'B' }])
    })
  })

  describe('direct match ($eq)', () => {
    it('filters out items that do not match the direct value', () => {
      const collection = [{ item: 'a', name: 'A' }, { item: 'a', name: 'B' }, { item: 'b', name: 'B' }]
      const query      = { item: 'a' }
      const results    = applyQuery(collection, query)
      expect(results).toEqual([{ item: 'a', name: 'A' }, { item: 'a', name: 'B' }])
    })
  })

  describe('$eq', () => {
    it('filters out items that do not match the eq value', () => {
      const collection = [{ item: 'a', name: 'A' }, { item: 'a', name: 'B' }, { item: 'b', name: 'B' }]
      const query      = { item: { $eq: 'a' } }
      const results    = applyQuery(collection, query)
      expect(results).toEqual([{ item: 'a', name: 'A' }, { item: 'a', name: 'B' }])
    })

    it('filters out items where the field is an array but does not contain the eq value', () => {
      const collection = [{ item: ['a', 'b'], name: 'A' }, { item: ['a', 'c'], name: 'B' }, { item: ['b', 'd'], name: 'B' }]
      const query      = { item: { $eq: 'a' } }
      const results    = applyQuery(collection, query)
      expect(results).toEqual([{ item: ['a', 'b'], name: 'A' }, { item: ['a', 'c'], name: 'B' }])
    })

    it('filters out items where the field is an object but does not match the eq value sub field by sub field', () => {
      const collection = [{ item: { subItem: 'a' }, name: 'A' }, { item: { subItem: 'a' }, name: 'B' }, { item: { subItem: 'b' }, name: 'B' }]
      const query      = { item: { $eq: { subItem: 'a' } } }
      const results    = applyQuery(collection, query)
      expect(results).toEqual([{ item: { subItem: 'a' }, name: 'A' }, { item: { subItem: 'a' }, name: 'B' }])
    })
  })

  describe('$gt', () => {
    it('filters out items that are less than or equal to the gt value', () => {
      const collection = [{ item: 1, name: 'A' }, { item: 2, name: 'B' }, { item: 3, name: 'B' }]
      const query      = { item: { $gt: 1 } }
      const results    = applyQuery(collection, query)
      expect(results).toEqual([{ item: 2, name: 'B' }, { item: 3, name: 'B' }])
    })
  })

  describe('$gte', () => {
    it('filters out items that are less than the gte value', () => {
      const collection = [{ item: 1, name: 'A' }, { item: 2, name: 'B' }, { item: 3, name: 'B' }]
      const query      = { item: { $gte: 2 } }
      const results    = applyQuery(collection, query)
      expect(results).toEqual([{ item: 2, name: 'B' }, { item: 3, name: 'B' }])
    })
  })

  describe('$in', () => {
    it('filters out items that are not in the in array', () => {
      const collection = [{ item: 'a', name: 'A' }, { item: 'b', name: 'B' }, { item: 'c', name: 'B' }]
      const query      = { item: { $in: ['a', 'b'] } }
      const results    = applyQuery(collection, query)
      expect(results).toEqual([{ item: 'a', name: 'A' }, { item: 'b', name: 'B' }])
    })
  })

  describe('$lt', () => {
    it('filters out items that greater than or equal to the lt value', () => {
      const collection = [{ item: 1, name: 'A' }, { item: 2, name: 'B' }, { item: 3, name: 'B' }]
      const query      = { item: { $lt: 3 } }
      const results    = applyQuery(collection, query)
      expect(results).toEqual([{ item: 1, name: 'A' }, { item: 2, name: 'B' }])
    })
  })

  describe('$lte', () => {
    it('filters out items that greater than lt value', () => {
      const collection = [{ item: 1, name: 'A' }, { item: 2, name: 'B' }, { item: 3, name: 'B' }]
      const query      = { item: { $lte: 2 } }
      const results    = applyQuery(collection, query)
      expect(results).toEqual([{ item: 1, name: 'A' }, { item: 2, name: 'B' }])
    })
  })

  describe('$ne', () => {
    it('filters out items that are equal to the ne value', () => {
      const collection = [{ item: 1, name: 'A' }, { item: 2, name: 'B' }, { item: 3, name: 'B' }]
      const query      = { item: { $ne: 2 } }
      const results    = applyQuery(collection, query)
      expect(results).toEqual([{ item: 1, name: 'A' }, { item: 3, name: 'B' }])
    })
  })

  describe('$nin', () => {
    it('filters out items that are in the nin value', () => {
      const collection = [{ item: 'a', name: 'A' }, { item: 'b', name: 'B' }, { item: 'c', name: 'B' }]
      const query      = { item: { $nin: ['a', 'b'] } }
      const results    = applyQuery(collection, query)
      expect(results).toEqual([{ item: 'c', name: 'B' }])
    })
  })

  describe('$exists', () => {
    it('filters out items that do not have the field exists is set to true on', () => {
      const collection = [{ item: 'a', name: 'A' }, { item: 'b', name: 'B' }, { name: 'C' }]
      const query      = { item: { $exists: true } }
      const results    = applyQuery(collection, query)
      expect(results).toEqual([{ item: 'a', name: 'A' }, { item: 'b', name: 'B' }])
    })

    it('filters out items that have the field exists is set to false on', () => {
      const collection = [{ item: 'a', name: 'A' }, { item: 'b', name: 'B' }, { name: 'C' }]
      const query      = { item: { $exists: false } }
      const results    = applyQuery(collection, query)
      expect(results).toEqual([{ name: 'C' }])
    })
  })

  describe('$type', () => {
    it('filters out items that are not the type given', () => {
      const collection = [{ item: 'a', name: 'A' }, { item: 'b', name: 'B' }, { item: 1, name: 'C' }]
      const query      = { item: { $type: 'number' } }
      const results    = applyQuery(collection, query)
      expect(results).toEqual([{ item: 1, name: 'C' }])
    })
  })

  describe('$mod', () => {
    it('filters out items that to do not result in the remander when divided by the divisor', () => {
      const collection = [{ item: 1, name: 'A' }, { item: 2, name: 'B' }, { item: 3, name: 'C' }]
      const query      = { item: { $mod: [2, 0] } }
      const results    = applyQuery(collection, query)
      expect(results).toEqual([{ item: 2, name: 'B' }])
    })
  })

  describe('$regex', () => {
    it('filters out items that to not match the regex', () => {
      const collection = [{ item: 'a', name: 'A' }, { item: 'b', name: 'B' }, { item: 'c', name: 'C' }]
      const query      = { item: { $regex: /[a,b]/ } }
      const results    = applyQuery(collection, query)
      expect(results).toEqual([{ item: 'a', name: 'A' }, { item: 'b', name: 'B' }])
    })
  })
})
