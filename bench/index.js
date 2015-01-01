"use strict"

const test = require('tape')
const OrderedSet = require('../ordered-set')
const SET_SIZE = 10000
const rand = require('seedrandom')(0)
const assert = require('assert')

const Interface = require('matcha/lib/matcha/interface')

const matcha = require('matcha')

const {Suite, Bench, utils} = matcha

let parent = new matcha.Suite()
let runner = new matcha.Runner(parent)
setTimeout(() => {
  runner.run(() => {})
})

Reporter(runner, utils)

const SIZES = [
  0,
  1,
  5,
  10,
  100,
  200,
  1000,
  5000,
  10000,
  100000,
  500000,
  1000000,
  5000000
]

const SIZES_TO_1000 = SIZES.slice(0, SIZES.indexOf(1000) + 1)

OrderedSet.Set = function VanillaSet(items) { return new Set(items) }

let SETS = Object.freeze(Object.keys(OrderedSet).map(name => OrderedSet[name]))

createSuite('initialising', suite => {
  SIZES_TO_1000.forEach(size => {
    let items = generateItems(size)
    createSuite(`${suite.title} ${size} items`, suite => {
      SETS.forEach(TestSet => {
        suite.addBench(new matcha.Bench(`${TestSet.name} ${suite.title}`, () => {
          let set = new TestSet(items)
          assert.equal(set.size, size, `set size ${set.size} matches input size ${size}`)
        }))
      })
    })
  })
})

createSuite('add', suite => {
  SIZES_TO_1000.forEach(size => {
    let items = generateItems(size)
    createSuite(`${suite.title} ${size} items`, suite => {
      SETS.forEach(TestSet => {
        let set = new TestSet()
        suite.addBench(new matcha.Bench(`${TestSet.name} ${suite.title}`, () => {
          for (let i = 0; i < items.length; i++) {
            set.add(items[i])
          }
          assert.equal(set.size, size, `set size ${set.size} matches input size ${size}`)
        }))
      })
    })
  })
})

createSuite('add only duplicate', suite => {
  SIZES_TO_1000.forEach(size => {
    createSuite(`${suite.title} ${size} items`, suite => {
      SETS.forEach(TestSet => {
        let set = new TestSet([1])
        suite.addBench(new matcha.Bench(`${TestSet.name} ${suite.title}`, () => {
          for (let i = 0; i < size; i++) {
            set.add(1)
          }
          assert.equal(set.size, 1, `set size ${set.size} is 1`)
        }))
      })
    })
  })
})

createSuite('deleting all', suite => {
  SIZES_TO_1000.forEach(size => {
    let items = generateItems(size)
    createSuite(`${suite.title} ${size} items`, suite => {
      SETS.forEach(TestSet => {
        let set = new TestSet(items)
        suite.addBench(new matcha.Bench(`${TestSet.name} ${suite.title}`, () => {
          for (let i = 0; i < items.length; i++) {
            set.delete(items[i])
          }
          assert.equal(set.size, 0, `set size ${set.size} is 0`)
        }))
      })
    })
  })
})

createSuite('add, delete', suite => {
  SIZES_TO_1000.forEach(size => {
    let items = generateItems(size)
    createSuite(`${suite.title} ${size} items`, suite => {
      SETS.forEach(TestSet => {
        let set = new TestSet()
        suite.addBench(new matcha.Bench(`${TestSet.name} ${suite.title}`, () => {
          for (let i = 0; i < items.length; i++) {
            set.add(items[i])
          }
          for (let i = 0; i < items.length; i++) {
            set.delete(items[i])
          }
          assert.equal(set.size, 0, `set size ${set.size} is 0`)
        }))
      })
    })
  })
})

createSuite('Array.from(set)', suite => {
  SIZES_TO_1000.forEach(size => {
    let items = generateItems(size)
    createSuite(`Array.from(set) with ${size} items`, suite => {
      SETS.forEach(TestSet => {
        let set = new TestSet(items)
        suite.addBench(new matcha.Bench(`${TestSet.name} ${suite.title}`, () => {
          let values = Array.from(set)
          assert.equal(values.length, size, `values length ${values.length} is ${size}`)
        }))
      })
    })
  })
})

createSuite('forEach iteration', suite => {
  SIZES_TO_1000.forEach(size => {
    let items = generateItems(size)
    createSuite(`deleting all ${size} items.`, suite => {
      SETS.forEach(TestSet => {
        let set = new TestSet(items)
        suite.addBench(new matcha.Bench(`${TestSet.name} ${suite.title}`, () => {
          let result = []
          set.forEach(item => result.push(item))
          assert.equal(result.length, size, `iterations count ${result.length} is ${size}`)
        }))
      })
    })
  })
})

createSuite('add then iterate 10% of time', suite => {
  SIZES_TO_1000.forEach(size => {
    let items = generateItems(size)
    createSuite(`add then iterate ${size} items`, suite => {
      SETS.forEach(TestSet => {
        let set = new TestSet()
        suite.addBench(new matcha.Bench(`${TestSet.name} ${suite.title}`, () => {
          for (let i = 0; i < items.length; i++) {
            set.add(items[i])
            if (i % 10 === 0) {
              Array.from(set)
            }
          }
          let result = Array.from(set)
          assert.equal(result.length, size, `result length ${result.length} is ${size}`)
        }))
      })
    })
  })
})

function percent(text, ...vars) {
  return text.map((t,i) => {
    if (!(i in vars)) return t
    if (text[i + 1][0] === '%') {
      return t + Math.round(vars[i] * 100)
    } else {
      return t + vars[i]
    }
  }).join('')
}

createSuite('many writes, few reads', suite => {
  const DELETE_CHANCE = 0.5
  const READ_CHANCE = 0.3
  SIZES_TO_1000.forEach(size => {
    let items = generateItems(size)
    createSuite(`adds, ${DELETE_CHANCE}% deletes & ${READ_CHANCE}% iterations with ${size} items.`, suite => {
      SETS.forEach(TestSet => {
        let set = new TestSet()
        suite.addBench(new matcha.Bench(percent`${TestSet.name} ${suite.title}`, () => {
          for (let i = 0; i < items.length; i++) {
            set.add(items[i])
            let deleteIndex = Math.floor(set.size * rand())
            if (rand() > DELETE_CHANCE) set.delete(items[deleteIndex])
            if (rand() > READ_CHANCE) Array.from(set)
          }
        }))
      })
    })
  })
})

function createSuite(name, fn) {
  let suite = Suite.create(parent, name)
  suite.options.delay = 1
  fn(suite)
}

function generateItems(iterations) {
  let result = []
  //let rand = Rand(0)
  for (let i = 0; i < iterations; i++) {
    result.push(rand())
  }
  return result
}

let results = {}
function Reporter(runner, utils) {
  let {color, highlight, humanize, padBefore, cursor} = utils;
  runner.on('start', () => {
    console.log();
  });

  runner.on('end', stats => {
    console.log();
    console.log(color('  Suites:  ', 'gray') + stats.suites);
    console.log(color('  Benches: ', 'gray') + stats.benches);
    console.log(color('  Elapsed: ', 'gray') + humanize(stats.elapsed.toFixed(2)) + ' ms');
    console.log();

    let allResults = Object.keys(results).map(key => results[key])
    let setResults = allResults.filter(set => set.name !== 'VanillaSet')

    setResults.sort((a, b) => a.elapsed - b.elapsed)
    let fastest = setResults[0]
    let slowest = setResults[setResults.length - 1]

    setResults.sort((a, b) => a.fastest - b.fastest)
    let mostWins = setResults[0]
    setResults.sort((a, b) => a.slowest - b.slowest)
    let mostLosses = setResults[0]
    allResults.forEach(result => {
      let totalTime = fastest === result ? color(result.elapsed, 'green') : result.elapsed
      totalTime = slowest === result ? color(totalTime, 'red') : totalTime

      let wins = fastest === result ? color(result.fastest, 'green') : result.fastest
      let losses = slowest === result ? color(result.slowest, 'red') : result.slowest

      result.fastest
      console.log(' ', color(result.name, 'gray'), 'total time', totalTime)
      console.log(' ', color(result.name, 'gray'), 'fastest', wins, 'times')
      console.log(' ', color(result.name, 'gray'), 'slowest', losses, 'times')
      console.log()
    })
    console.log();
  });

  runner.on('suite start', suite => {
    if (suite.title) console.log(padBefore('', 23) + suite.title);
  });

  runner.on('suite end', suite => {
    let stats = suite.benches.map(bench => bench.stats)
    let sortedStats = stats.slice().sort((a, b) => a.elapsed - b.elapsed)
    let fastest = sortedStats[0]
    let slowest = sortedStats[sortedStats.length - 1]

    stats.forEach(stat => {
      let setName = getSetName(stat.title)
      if (setName) {
        results[setName] = results[setName] || {name: setName, fastest: 0, slowest: 0, elapsed: 0}
        results[setName].elapsed += stat.elapsed
        if (stat === fastest) results[setName].fastest++
        if (stat === slowest) results[setName].slowest++
      }
    })

    let maxLen = stats.reduce((max, stat) => Math.max(max, stat.title.length), 0) + 1
    stats.forEach(stat => {
      let slowerAmount = humanize(Math.round(fastest.elapsed/stat.elapsed * 100))
      if (stat === fastest) return console.log(color(padBefore('fastest', 22) + ` » ${stat.title}`, 'green'))
      if (stat === slowest) return console.log(color(padBefore(`${slowerAmount}% slower`, 22) + ` » ${stat.title}`, 'red'))
      else                  return console.log(padBefore(`${slowerAmount}% slower`, 22) + ` » ${stat.title}`)
    })
    console.log();
  });

  runner.on('bench start', bench => {
    process.stdout.write('\r' + color(padBefore('wait » ', 25), 'yellow')
                              + color(bench.title, 'gray'));
  });

  runner.on('bench end', results => {
    cursor.CR();
    let ops = humanize(results.ops.toFixed(0));
    console.log(color(padBefore(ops + ' op/s', 22), 'cyan')
              + color(' » ' + results.title, 'gray'));
  });
};

function getSetName(title) {
  if (!title) return false
  let name = title.split(' ').shift()
  if (!name) return false
  if (!(/Set/gm.test(name))) return false
  return name
}

//test('OrderedSet is faster than naive implementations for random reads & writes', t => {
  //let items = Object.freeze(testSet(SET_SIZE))
  //let suite = new matcha.Suite()
  //suite.options.iterations = BENCH_ITERATIONS

  


  //let runner = new matcha.Runner(suite)
  //runner.run(() => {
    //let stats = suite.benches.map(bench => bench.stats)
    //let orderedSetStats = stats.find(stats => stats.title === 'OrderedSet')

    //stats.filter(stats => stats !== orderedSetStats).forEach(stats => {
      //let result = orderedSetStats.elapsed
      //t.ok(result < stats.elapsed, `${stats.title} (${Math.round(stats.elapsed)}ms) is slower than orderedSet (${Math.round(result)}ms)`)
      //t.ok(stats.elapsed/result > 1.10, `${stats.title} is more than 10% slower than orderedSet (${Math.round(stats.elapsed/result * 100 - 100)}% slower)`)
    //})

    //stats.sort((a, b) => {
      //return a.elapsed - b.elapsed
    //})

    //let fastest = stats[0]
    //let secondFastest = stats[1]
    //t.comment(`fastest: ${fastest.title}: ${fastest.elapsed} by ${Math.round(secondFastest.elapsed/fastest.elapsed * 100 - 100)}%`)
    //t.end()
  //})


  //function bench(set, items) {
    //for (let j = 0; j <= items.length; j++) {
      //if (items[j] > rand()) {
        //set.add(items[j])
      //} else {
        //set.delete(items[j])
      //}
      //if (items[j] > 0.90) {
        //Array.from(set)
      //}
    //}
  //}
//})

//test('OrderedSet is faster than naive implementations for many reads', t => {
  //let items = Object.freeze(testSet(SET_SIZE))
  //let suite = new matcha.Suite()
  //suite.options.iterations = BENCH_ITERATIONS
  
  //let tests = Object.keys(OrderedSet)
  //tests.forEach(name => {
    //let set = new OrderedSet[name](items)
    //suite.addBench(new matcha.Bench(name, () => {
      //Array.from(set)
    //}))
  //})

  //let runner = new matcha.Runner(suite)
  //runner.run(() => {
    //let stats = suite.benches.map(bench => bench.stats)
    //let orderedSetStats = stats.find(stats => stats.title === 'OrderedSet')

    //stats.filter(stats => stats !== orderedSetStats).forEach(stats => {
      //let result = orderedSetStats.elapsed
      //t.ok(result < stats.elapsed, `${stats.title} (${Math.round(stats.elapsed)}ms) is slower than orderedSet (${Math.round(result)}ms)`)
      //t.ok(stats.elapsed/result > 1.10, `${stats.title} is more than 10% slower than orderedSet (${Math.round(stats.elapsed/result * 100 - 100)}% slower)`)
    //})
    //stats.sort((a, b) => {
      //return a.elapsed - b.elapsed
    //}).reverse()

    //let fastest = stats[0]
    //let secondFastest = stats[1]
    //t.comment(`fastest: ${fastest.title}: ${fastest.elapsed} by ${Math.round(secondFastest.elapsed/fastest.elapsed * 100 - 100)}%`)
    //t.end()
  //})
//})

//test('OrderedSet is faster than naive implementations for many reads and writes', t => {
  //let items = Object.freeze(testSet(SET_SIZE))
  //let suite = new matcha.Suite()
  //suite.options.iterations = BENCH_ITERATIONS
  
  //let tests = Object.keys(OrderedSet)
  //tests.forEach(name => {
    //let set = new OrderedSet[name](items)
    //let count = 0
    //suite.addBench(new matcha.Bench(name, () => {
      //set.add(items[count])
      //if (items[count] > 0.5) set.delete(items[count])
      //count++
    //}))
  //})

  //let runner = new matcha.Runner(suite)
  //runner.run(() => {
    //let stats = suite.benches.map(bench => bench.stats)
    //let orderedSetStats = stats.find(stats => stats.title === 'OrderedSet')

    //stats.filter(stats => stats !== orderedSetStats).forEach(stats => {
      //let result = orderedSetStats.elapsed
      //t.ok(result < stats.elapsed, `${stats.title} (${stats.elapsed}ms) is slower than orderedSet (${Math.round(result)}ms)`)
      //t.ok(stats.elapsed/result > 1.10, `${stats.title} is more than 10% slower than orderedSet (${Math.round(stats.elapsed/result * 100 - 100)}% slower)`)
    //})
    //stats.sort((a, b) => {
      //return a.elapsed - b.elapsed
    //}).reverse()

    //let fastest = stats[0]
    //let secondFastest = stats[1]
    //t.comment(`fastest: ${fastest.title}: ${fastest.elapsed} by ${Math.round(secondFastest.elapsed/fastest.elapsed * 100 - 100)}%`)
    //t.end()
  //})
//})

////const assert = require('assert')
////const OrderedSet = require('../ordered-set')

////// Note: magic Array size that slowed reads to a crawl when mutating arrays
////// during values() iteration.
////const SET_SIZE = 118311

////const NUM_READS = 100 // number of loop iterations
////const NUM_INITS = 10 // number of times to create initialise new set instances

////const NUMBERS = function getSequence(count) {
  ////let numbers = []
  ////while (count-- > 0) {
    ////numbers.push(SET_SIZE - count - 1)
  ////}
  ////return numbers
////}(SET_SIZE)

////const NUMBERS_REVERSED = NUMBERS.slice().reverse()
////const EXPECTED_TOTAL = NUMBERS.reduce((total, item) => total + item, 0)

////Object.freeze(NUMBERS)
////Object.freeze(NUMBERS_REVERSED)

////console.log(`SET_SIZE = ${SET_SIZE}`)

////let toSort = NUMBERS.slice()
////time('sort overhead')
////toSort.sort(OrderedSet.prototype.sortFunction)
////timeEnd('sort overhead')

////bench('vanilla set', (items = NUMBERS) => {
  ////// compare against unsorted, regular set
  ////return new Set(items)
////})

////bench('ordered set', (items = NUMBERS) => {
  ////return new OrderedSet(items)
////})

////bench('ordered set: input reversed', (items = NUMBERS_REVERSED) => {
  ////return new OrderedSet(items)
////})

////bench('naive ordered set: OrderedSetNoCache', (items = NUMBERS) => {
  ////return new OrderedSet.OrderedSetNoCache(items)
////})

//////bench('naive ordered set: OrderedSetCacheOnRead', (items = NUMBERS) => {
  //////return new OrderedSet.OrderedSetCacheOnRead(items)
//////})
////[>

//////  Too slow to bench
////bench('naive ordered set: OrderedSetCacheOnWrite', () => {
  ////return new OrderedSet.OrderedSetCacheOnWrite(NUMBERS)
////})

///[>/

////function bench(name, fn) {

  ////test(`${name} ${NUM_INITS} set initialisations.`, t => {
    ////for (let i = 0; i < NUM_INITS; i++) {
      ////let a = fn()
    ////}
  ////})

  ////test(name + ' various adds & removes', t => {
    ////let set = fn([])
    ////let items = NUMBERS
    ////for (let i = 1; i <= items.length; i++) {
      ////set.add(items[i])
    ////}
    ////for (let i = 1; i <= items.length; i++) {
      ////if (i % 6 === 0) {
        ////set.add(items[i]) // add again
      ////}
      ////if (i % 15 === 0) {
        ////set.delete(items[i])
      ////}
      ////if (i % 31 === 0) {
        ////// continuous deletes
        ////// e.g. item 31 && item 30 (15 + 15)
        ////set.delete(items[i])
      ////}
    ////}
  ////})

  ////test(`${name} ${NUM_READS} for...of iterations`, t => {
    ////let set = fn()
    ////for (let i = 0; i < NUM_READS; i++) {
      ////let total = 0
      ////for (let item of set) {
        ////total += item
      ////}
      ////t.equal(total, EXPECTED_TOTAL)
    ////}
  ////})

  ////test(`${name} ${NUM_READS} forEach iterations`, t => {
    ////let set = fn()
    ////for (let i = 0; i < NUM_READS; i++) {
      ////let total = 0
      ////set.forEach(item => {
        ////total += item
      ////})
      ////t.equal(total, EXPECTED_TOTAL)
    ////}
  ////})
////}

////function test(name, fn) {
  ////time(name)
  ////fn(assert)
  ////timeEnd(name)
////}

////function time(name) {
  ////time[name] = Date.now()
  ////return () => timeEnd(name)
////}

////function timeEnd(name) {
  ////let start = time[name]
  ////if (!start) throw new Error(`No such label: ${name}`)
  ////let end = Date.now()
  ////let diff = end - start
  ////console.log('%s: %dms', name, diff)
  ////return diff
////}
