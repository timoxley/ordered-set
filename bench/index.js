"use strict"

const assert = require('assert')
const OrderedSet = require('../ordered-set')

// Note: magic Array size that slowed reads to a crawl when mutating arrays
// during values() iteration.
const SET_SIZE = 118311

const NUM_READS = 100 // number of loop iterations
const NUM_INITS = 10 // number of times to create initialise new set instances

const NUMBERS = function getSequence(count) {
  let numbers = []
  while (count-- > 0) {
    numbers.push(SET_SIZE - count - 1)
  }
  return numbers
}(SET_SIZE)

const NUMBERS_REVERSED = NUMBERS.slice().reverse()
const EXPECTED_TOTAL = NUMBERS.reduce((total, item) => total + item, 0)

Object.freeze(NUMBERS)
Object.freeze(NUMBERS_REVERSED)

console.log(`SET_SIZE = ${SET_SIZE}`)

let toSort = NUMBERS.slice()
time('sort overhead')
toSort.sort(OrderedSet.prototype.sortFunction)
timeEnd('sort overhead')

bench('vanilla set', (items = NUMBERS) => {
  // compare against unsorted, regular set
  return new Set(items)
})

bench('ordered set', (items = NUMBERS) => {
  return new OrderedSet(items)
})

bench('ordered set: input reversed', (items = NUMBERS_REVERSED) => {
  return new OrderedSet(items)
})

bench('naive ordered set: OrderedSetNoCache', (items = NUMBERS) => {
  return new OrderedSet.OrderedSetNoCache(items)
})

//bench('naive ordered set: OrderedSetCacheOnRead', (items = NUMBERS) => {
  //return new OrderedSet.OrderedSetCacheOnRead(items)
//})
/*

//  Too slow to bench
bench('naive ordered set: OrderedSetCacheOnWrite', () => {
  return new OrderedSet.OrderedSetCacheOnWrite(NUMBERS)
})

*/

function bench(name, fn) {

  test(`${name} ${NUM_INITS} set initialisations.`, t => {
    for (let i = 0; i < NUM_INITS; i++) {
      let a = fn()
    }
  })

  test(name + ' various adds & removes', t => {
    let set = fn([])
    let items = NUMBERS
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
  })

  test(`${name} ${NUM_READS} for...of iterations`, t => {
    let set = fn()
    for (let i = 0; i < NUM_READS; i++) {
      let total = 0
      for (let item of set) {
        total += item
      }
      t.equal(total, EXPECTED_TOTAL)
    }
  })

  test(`${name} ${NUM_READS} forEach iterations`, t => {
    let set = fn()
    for (let i = 0; i < NUM_READS; i++) {
      let total = 0
      set.forEach(item => {
        total += item
      })
      t.equal(total, EXPECTED_TOTAL)
    }
  })
}

function test(name, fn) {
  time(name)
  fn(assert)
  timeEnd(name)
}

function time(name) {
  time[name] = Date.now()
  return () => timeEnd(name)
}

function timeEnd(name) {
  let start = time[name]
  if (!start) throw new Error(`No such label: ${name}`)
  let end = Date.now()
  let diff = end - start
  console.log('%s: %dms', name, diff)
  return diff
}
