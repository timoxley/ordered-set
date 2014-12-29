"use strict"

const CACHE = Symbol('ordered-set-cache')
const ADDED = Symbol('ordered-set-added')
const DELETED = Symbol('ordered-set-deleted')

/**
 * Set defining iteration ordering.
 */

function SetArr() {
  let arr = {}
  let set = {
    size: 0,
    clear() {
      set.size = 0
    },
    add(item) {
      let index = arr.indexOf(item)
      if (index !== -1) return arr
      arr.push(item)
      set.size = arr.length
      return set
    },
    delete(item) {
      let index = arr.indexOf(item)
      if (index === -1) return false
      arr.splice(index, 1)
      set.size = arr.length
      return true
    },
    [Symbol.iterator]: () => arr[Symbol.iterator]()
  }
  return set
}

class OrderedSet extends Set {
  constructor(items) {
    super(items)
    this.add = add
    this[ADDED] = new Set()
    this[DELETED] = new Set()
  }

  /**
   * Produces an ordered Array of items from this Set.
   */

  sort() {
    // all returned Arrays are fresh via slice because turns out working
    // with a mutated Array can be incredibly slow for arrays larger
    // than a particular size (e.g. 118311).

    if (!this[CACHE]) {
      this[ADDED].clear()
      this[DELETED].clear()
      // generate cache if it doesn't exist
      return this[CACHE] = Array.from(super.values()).sort(this.sortFunction)
    }

    // keep already sorted items intact as much as possible by
    // keeping cache and sorting sorted added and removed items.

    if (this[ADDED].size) {
      this[CACHE].push(...Array.from(this[ADDED]).sort(this.sortFunction))
      this[CACHE] = this[CACHE].sort(this.sortFunction)
      this[ADDED].clear()
      return this[CACHE]
    }

    if (this[DELETED].size) {
      let removeIndices = []
      for (let removed of this[DELETED]) {
        removeIndices.push(this[CACHE].indexOf(removed))
      }
      removeIndices.sort()
      for (let i = 0; i < removeIndices.length; i++) {
        // reduce number of splice calls by finding adjacent removed indices
        let index = removeIndices[i]
        let count = 1
        while (i + 1 < removeIndices.length && removeIndices[i + 1] === index + 1) {
          i++
          count++
        }
        this[CACHE].splice(index, count) // remove adjacent items
      }
      // no need to sort, items will still be correctly ordered.
      this[CACHE] = this[CACHE]
      this[DELETED].clear()
      return this[CACHE]
    }

    return this[CACHE]
  }

  use(fn) {
    this.reset()
    this.sortFunction = fn
  }

  sortFunction(a, b) {
    return a - b
  }

  delete(item) {
    if (!this.has(item)) return super.delete(item)
    this[DELETED].add(item)
    this[ADDED].delete(item)
    return super.delete(item)
  }

  clear() {
    this.reset()
    return super.clear()
  }

  reset() {
    this[ADDED].clear()
    this[DELETED].clear()
    if (this[CACHE]) this[CACHE] = undefined
  }

  values() {
    return this.sort()[Symbol.iterator]()
  }

  forEach(callback) {
    let items = this.sort()
    for (let i = 0; i < items.length; i++) {
      callback.call(this, items[i], i, this)
    }
  }

  [Symbol.iterator]() {
    return this.values()
  }
}

function add(item) {
  if (this.has(item)) return Set.prototype.add.call(this, item)
  if (this[CACHE] && this[CACHE].indexOf(item) === -1) this[ADDED].add(item)
  this[DELETED].delete(item)
  return Set.prototype.add.call(this, item)
}

/**
 * OrderedSetNoCache for comparison.
 * Does no caching, sorts whenever iteration requested.
 * Ensures optimisations in OrderedSet are worth the complexity.
 */

class OrderedSetNoCache extends Set {
  use(fn) {
    this.sortFunction = fn
  }

  sort() {
    return Array.from(super.values.call(this)).sort(this.sortFunction)
  }

  values() {
    return this.sort()[Symbol.iterator]()
  }

  forEach(callback) {
    let items = this.sort()
    for (let i = 0; i < items.length; i++) {
      callback.call(this, items[i], i, this)
    }
  }

  [Symbol.iterator]() {
    return this.values()
  }
}

/**
 * OrderedSetCacheOnWrite for comparison.
 * Resets full cache on any write.
 * Ensures optimisations in OrderedSet are worth the complexity.
 */

class OrderedSetCacheOnWrite extends Set {
  constructor(items) {
    super(items)
    this.items = this.sort()
  }

  use(fn) {
    this.sortFunction = fn
    this.sort()
  }

  sort() {
    return this.items = Array.from(super.values.call(this)).sort(this.sortFunction)
  }

  values() {
    return this.sort()[Symbol.iterator]()
  }

  forEach(callback) {
    let items = this.items
    for (let i = 0; i < items.length; i++) {
      callback.call(this, items[i], i, this)
    }
  }

  sortFunction(a, b) {
    return a - b
  }

  add(item) {
    let result = super.add(item)
    this.sort()
    return result
  }

  delete(item) {
    let result = super.delete(item)
    this.sort()
    return result
  }

  clear() {
    let result = super.clear()
    this.sort()
    return result
  }

  [Symbol.iterator]() {
    return this.values()
  }
}

/**
 * OrderedSetCacheOnRead for comparison.
 * Resets full cache on read.
 * Ensures optimisations in OrderedSet are worth the complexity.
 */

class OrderedSetCacheOnRead extends Set {
  constructor(items) {
    super(items)
    this.items = []
    this.dirty = true
  }

  use(fn) {
    this.sortFunction = fn
    this.dirty = true
  }

  sort() {
    this.items = this.dirty ? Array.from(super.values()).sort(this.sortFunction) : this.items
    this.dirty = false
    return this.items
  }

  values() {
    return this.sort()[Symbol.iterator]()
  }

  forEach(callback) {
    let items = this.sort()
    for (let i = 0; i < items.length; i++) {
      callback.call(this, items[i], i, this)
    }
  }

  sortFunction(a, b) {
    return a - b
  }

  add(item) {
    this.dirty = true
    return super.add(item)
  }

  delete(item) {
    this.dirty = true
    return super.delete(item)
  }

  clear() {
    this.dirty = true
    return super.clear()
  }

  [Symbol.iterator]() {
    return this.values()
  }
}

OrderedSet = OrderedSetCacheOnRead
OrderedSet.OrderedSetNoCache = OrderedSetNoCache
OrderedSet.OrderedSetCacheOnWrite = OrderedSetCacheOnWrite
OrderedSet.OrderedSetCacheOnRead = OrderedSetCacheOnRead
OrderedSet.prototype.keys = OrderedSet.prototype.values

module.exports = OrderedSet
