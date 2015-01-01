"use strict"

const test = require('tape')
const OrderedSet = require('../ordered-set')
const SET_SIZE = 10000
const BENCH_ITERATIONS = 1
const rand = require('seedrandom')(0)
const matcha = require('matcha')
const Interface = require('matcha/lib/matcha/interface')

test('default sort', t => {
  let set = new OrderedSet(function *() {yield -1}())
  set.add(2)
  isOrdered(set, [-1, 2], 'add(2)', t)
  set.add(2)
  isOrdered(set, [-1, 2], 'add(2) again', t)
  set.add(1)
  isOrdered(set, [-1, 1, 2], 'add(1)', t)
  set.add(3)
  isOrdered(set, [-1, 1, 2, 3], 'add(3)', t)
  set.delete(2)
  isOrdered(set, [-1, 1, 3], 'delete(2)', t)
  set.add(2)
  isOrdered(set, [-1, 1, 2, 3], 'add(2) again', t)
  set.delete(2)
  set.delete(3)
  isOrdered(set, [-1, 1], 'delete(2), delete(3)', t)
  set.add(3)
  isOrdered(set, [-1, 1, 3], 'add(3)', t)
  set.delete(0)
  isOrdered(set, [-1, 1, 3], 'delete(0)', t)
  set.delete(1)
  isOrdered(set, [-1, 3], 'delete(1)', t)
  set.delete(3)
  isOrdered(set, [-1], 'delete(3)', t)
  set.delete(-1)
  isOrdered(set, [], 'delete(-1)', t)
  t.end()
})

test('custom sort', t => {
  let set = new OrderedSet(function *() {yield -1}())
  set.use(function(a, b) {
    return b - a
  })
  set.add(2)
  isOrdered(set, [2, -1], 'add(2)', t)
  set.add(2)
  isOrdered(set, [2, -1], 'add(2) again', t)
  set.add(1)
  isOrdered(set, [2, 1, -1], 'add(1)', t)
  set.add(3)
  isOrdered(set, [3, 2, 1, -1], 'add(3)', t)
  set.delete(2)
  isOrdered(set, [3, 1, -1], 'delete(2)', t)
  set.add(2)
  isOrdered(set, [3, 2, 1, -1], 'add(2) again', t)
  set.delete(2)
  set.delete(3)
  isOrdered(set, [1, -1], 'delete(2), delete(3)', t)
  set.add(3)
  isOrdered(set, [3, 1, -1], 'add(3) again', t)
  set.delete(0)
  isOrdered(set, [3, 1, -1], 'delete(0)', t)
  set.delete(1)
  isOrdered(set, [3, -1], 'delete(1)', t)
  set.delete(3)
  isOrdered(set, [-1], 'delete(3)', t)
  set.delete(-1)
  isOrdered(set, [], 'delete(-1)', t)
  t.end()
})

test('replace custom sort', t => {
  let set = new OrderedSet([1,2,3])
  t.deepEqual(Array.from(set), [1,2,3])
  set.use((a, b) => b - a)
  t.deepEqual(Array.from(set), [3,2,1])
  t.end()
})

test('add/delete/iterate sequence does not affect results', t => {
  let set = new OrderedSet()
  set.add(2)
  set.delete(2)
  t.deepEqual(Array.from(set), [])
  set.delete(2)
  set.add(2)
  t.deepEqual(Array.from(set), [2])
  set.add(2)
  set.delete(2)
  set.add(2)
  t.deepEqual(Array.from(set), [2])
  set.delete(2)
  set.add(2)
  set.delete(2)
  t.deepEqual(Array.from(set), [])
  t.end()
})



function isOrdered(set, expected, message, t) {
  t.comment(message)
  t.deepEqual(Array.from(set.values()), expected, 'values()')
  t.deepEqual(Array.from(set.keys()), expected, 'keys()')

  let forEachActual = []
  set.forEach(function(item, index, obj) {
    t.equal(forEachActual.length, index, '2nd param should be index')
    t.equal(obj, set, '3rd param should be set')
    t.equal(this, set, 'context should be set')
    forEachActual.push(item)
  })
  t.deepEqual(forEachActual, expected, 'forEach')


  let iterationActual = []
  for (let item of set) {
    iterationActual.push(item)
  }
  t.deepEqual(iterationActual, expected, 'iteration')
}

function testSet(iterations) {
  let result = []
  for (let i = 0; i < iterations; i++) {
    result.push(rand())
  }
  return result
}
