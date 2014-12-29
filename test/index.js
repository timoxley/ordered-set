"use strict"

const test = require('tape')
const OrderedSet = require('../ordered-set')
const BENCH_ITERATIONS = 1000

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

test('OrderedSet is faster than naive implementations for many reads', t => {
  let testData = Object.freeze(testSet(BENCH_ITERATIONS))
  let prevBench = undefined
  let result = bench(OrderedSet, testData)
  let noCacheSetResult = bench(OrderedSet.OrderedSetNoCache, testData)
  let cacheOnWriteSetResult = bench(OrderedSet.OrderedSetCacheOnRead, testData)
  let cacheOnReadSetResult = bench(OrderedSet.OrderedSetCacheOnRead, testData)
  t.ok(result < noCacheSetResult, `orderedSet (${result}ms) is faster than naive implementation: noCacheSet (${noCacheSetResult}ms)`)
  t.ok(noCacheSetResult/result > 1.10, `orderedSet is more than 10% faster than naive implementation: noCacheSet (${Math.round(noCacheSetResult/result * 100 - 100)}% faster)`)
  t.ok(result < cacheOnWriteSetResult, `orderedSet (${result}ms) is faster than naive implementation: cacheOnWriteSet (${cacheOnWriteSetResult}ms)`)
  t.ok(cacheOnWriteSetResult/result > 1.10, `orderedSet is more than 10% faster than naive implementation: cacheOnWriteSet (${Math.round(cacheOnWriteSetResult/result * 100 - 100)}% faster)`)
  //t.ok(result < cacheOnReadSetResult, `orderedSet (${result}ms) is faster than naive implementation: cacheOnReadSet (${cacheOnReadSetResult}ms)`)
  //t.ok(cacheOnReadSetResult/result > 1.10, `orderedSet is more than 10% faster than naive implementation: cacheOnReadSet (${Math.round(cacheOnReadSetResult/result * 100 - 100)}% faster)`)
  t.end()

  function bench(Set, items) {
    let start = Date.now()
    let set = new Set(items.slice(0, items.length / 2))
    let result
    for (let i = 0; i < BENCH_ITERATIONS; i++) {
      for (let i = 1; i <= items.length; i++) {
        set.add(items[i])
      }
      for (let i = 1; i <= items.length; i++) {
        if (i % 6 === 0) {
          set.add(items[i]) // add again
        }
        if (i % 15 === 0) {
          set.delete(items[i])
        }
        if (i % 31 === 0) {
          // continuous deletes
          // e.g. item 31 && item 30 (15 + 15)
          set.delete(items[i])
        }
      }
      result = Array.from(set)
    }

    t.ok(result.length, Set.name + ' got some results')

    if (prevBench) t.equal(JSON.stringify(result), JSON.stringify(prevBench), 'benchmarks match')
    prevBench = result

    let end = Date.now()
    return end - start
  }
})

test('OrderedSet is faster than naive implementations for many writes and 10% as many reads', t => {
  let testData = Object.freeze(testSet(BENCH_ITERATIONS))
  let prevBench = undefined
  let orderedSet = new OrderedSet()
  let noCacheSet = new OrderedSet.OrderedSetNoCache()
  let cacheOnWriteSet = new OrderedSet.OrderedSetCacheOnWrite()
  let cacheOnReadSet = new OrderedSet.OrderedSetCacheOnRead()
  let result = bench(orderedSet, testData)
  let noCacheSetResult = bench(noCacheSet, testData)
  let cacheOnWriteSetResult = bench(cacheOnWriteSet, testData)
  let cacheOnReadSetResult = bench(cacheOnReadSet, testData)

  t.ok(result < noCacheSetResult, `orderedSet (${result}ms) is faster than naive implementation: noCacheSet (${noCacheSetResult}ms)`)
  t.ok(noCacheSetResult/result > 1.10, `orderedSet is more than 10% faster than naive implementation: noCacheSet (${Math.round(noCacheSetResult/result * 100 - 100)}% faster)`)
  t.ok(result < cacheOnWriteSetResult, `orderedSet (${result}ms) is faster than naive implementation: cacheOnWriteSet (${cacheOnWriteSetResult}ms)`)
  t.ok(cacheOnWriteSetResult/result > 1.10, `orderedSet is more than 10% faster than naive implementation: cacheOnWriteSet (${Math.round(cacheOnWriteSetResult/result * 100 - 100)}% faster)`)
  //t.ok(result < cacheOnReadSetResult, `orderedSet (${result}ms) is faster than naive implementation: cacheOnReadSet (${cacheOnReadSetResult}ms)`)
  //t.ok(cacheOnReadSetResult/result > 1.10, `orderedSet is more than 10% faster than naive implementation: cacheOnReadSet (${Math.round(cacheOnReadSetResult/result * 100 - 100)}% faster)`)
  t.end()

  function bench(set, items) {
    let start = Date.now()
    for (let i = 0; i < items.length; i++) {
      set.add(items[i])
      if (i === 0) continue
      if (i % 5 === 0 || i % 11 === 0) {
        set.delete(items[i - 1])
      }
    }

    let result = 0
    for (let i = 0; i < BENCH_ITERATIONS * 0.10; i++) {
      for (let item of set) {
        result += item
      }
    }
    let end = Date.now()
    return end - start
  }
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
    result.push(Math.random())
  }
  return result
}
