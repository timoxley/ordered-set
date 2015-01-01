# ordered-set

`ordered-set` is a performant ES6 Set subclass that allows control
over iteration order.

Simply provide the set with the ordering function to `use` and it will
do the rest.

```js
const OrderedSet = require('ordered-set')
let orderedSet = new OrderedSet()
orderedSet.use(mySortingFunction)
orderedSet.add(item)
orderedSet.add(item2)
for (let setItem of orderedSet) {
  // iterates in order defined by mySortingFunction
}
```

## Installation

```
npm install ordered-set
```

## Usage

```js
const OrderedSet = require('ordered-set')

// Default sortFunction is numeric, ascending:
// (a, b) => a - b
let orderedSet = new OrderedSet()
orderedSet.add(2)
orderedSet.add(1)
orderedSet.add(3)

orderedSet.forEach(item => console.log('orderedSet default sortFunction', item))
// orderedSet default sortFunction 1
// orderedSet default sortFunction 2
// orderedSet default sortFunction 3
```

### Replace sorting function with `.use(fn)`

```js
orderedSet.use((a, b) => b - a) // e.g. reversed ordering

orderedSet.forEach(item => console.log('orderedSet custom sortFunction', item))
// orderedSet custom sortFunction 3
// orderedSet custom sortFunction 2
// orderedSet custom sortFunction 1
```

### Regular ES6 Set for comparison

```js
let regularSet = new Set()
regularSet.add(2)
regularSet.add(1)
regularSet.add(3)
```

### ES6 Sets iterate in insertion order

```js
regularSet.forEach(item => console.log('regular set', item))
// regular set 2
// regular set 1
// regular set 3
```

### OrderedSet Supports all regular ES6 Set operations & usage

```js
orderedSet = new OrderedSet([3,2,1])
orderedSet.add(0)
console.log('orderedSet.size', orderedSet.size) // set.size 4
orderedSet.delete(0)
console.log('orderedSet.size', orderedSet.size) // set.size 3
```

### Required ES6 Features

Although the code is compiled and published as ES5, there are some ES6
standard library features required:

* Symbols
* Set


#### How to get ES6 Features

Install [6to5](https://6to5.org/) or use [core-js](https://github.com/zloirock/core-js) directly. [traceur](https://github.com/google/traceur-compiler) also works well.
Unfortunately, did not have luck using the more lightweight & modular [es6-set](https://github.com/medikoo/es6-set) & [es6-symbol](https://github.com/medikoo/es6-symbol).

You'll need to install an ES6 polyfill yourself, such as those listed
above. There is not one included with the package on purpose – this may
seem like malpractice and I normally would advise against any kind of
implicit dependencies but after battling with these issues across
multiple projects I've concluded *npm currently has no suitable workflow
for anything that must be a singleton/mutates the global environment*.
You're better off just adding the dependency manually to your parent
package.

I feel this should be best-practice for language polyfills – by omitting
a transpiler you're free to use this with whatever transpiler you're
already using.

This lib could be easily reworked to not require these ES6 features but
the intended audience is people already compiling to ES6, or those
interested in doing so.

## License

MIT
