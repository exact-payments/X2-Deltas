/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from 'chai'
import { validateDelta } from '../validate-delta'

describe('validateDelta(delta, allowedOperators, allowedPaths) -> [err]', () => {
  it('returns a undefined only allowed operators and paths are used', () => {
    const err = validateDelta({ $set: { foo: 'bar' } }, ['$set'], ['foo'])
    expect(err).is.equal(undefined)
  })

  it('returns a undefined only allowed operators and paths are used ($set at root)', () => {
    const err = validateDelta({ foo: 'bar' }, ['$set'], ['foo'])
    expect(err).is.equal(undefined)
  })

  it('returns a undefined only allowed operators and paths are used (wildcard paths)', () => {
    const err = validateDelta({ $set: { 'foo.bar.baz': 'foo' } }, ['$set'], ['foo.*.baz'])
    expect(err).is.equal(undefined)
  })

  it('returns a undefined only allowed operators and paths are used (recursive wildcard paths)', () => {
    const err = validateDelta({ $set: { 'foo.bar.baz': 'foo' } }, ['$set'], ['foo.**'])
    expect(err).is.equal(undefined)
  })

  it('returns a undefined only allowed operators and paths are used (empty recursive wildcard paths)', () => {
    const err = validateDelta({ $set: { foo: 'foo' } }, ['$set'], ['foo.**'])
    expect(err).is.equal(undefined)
  })

  it('returns an error if disallowed operators are used', () => {
    const err = validateDelta({ $rename: { foo: 'bar' } }, ['$set'], ['foo'])
    expect(err).is.ok
    expect(err?.errors[0]?.kind).is.equal('disallowedOperator')
    expect(err?.errors[0]?.path).equal('$rename')
  })

  it('returns an error if disallowed paths are used', () => {
    const err = validateDelta({ $set: { bar: 'foo' } }, ['$set'], ['foo'])
    expect(err).is.ok
    expect(err?.errors[0].kind).equal('disallowedPath')
    expect(err?.errors[0]?.path).equal('$set.bar')
  })

  it('returns an error if disallowed paths are used (wildcard paths)', () => {
    const err = validateDelta({ $set: { 'foo.bar.ack': 'foo' } }, ['$set'], ['foo.*.baz'])
    expect(err).is.ok
    expect(err?.errors[0].kind).equal('disallowedPath')
    expect(err?.errors[0]?.path).equal('$set.foo.bar.ack')
  })

  it('returns an error if disallowed paths are used (empty wildcard paths)', () => {
    const err = validateDelta({ $set: { foo: 'foo' } }, ['$set'], ['foo.*'])
    expect(err).is.ok
    expect(err?.errors[0].kind).equal('disallowedPath')
    expect(err?.errors[0]?.path).equal('$set.foo')
  })

  it('returns an error if disallowed paths are used (recursive wildcard paths)', () => {
    const err = validateDelta({ $set: { 'foo.baz': 'foo' } }, ['$set'], ['foo.bar.**'])
    expect(err).is.ok
    expect(err?.errors[0].kind).equal('disallowedPath')
    expect(err?.errors[0]?.path).equal('$set.foo.baz')
  })
})
