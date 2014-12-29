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
orderedSet.use((a, b) => b - a) // e.g. reversed ordering

orderedSet.forEach(item => console.log('orderedSet custom sortFunction', item))
// orderedSet custom sortFunction 3
// orderedSet custom sortFunction 2
// orderedSet custom sortFunction 1
let regularSet = new Set()
regularSet.add(2)
regularSet.add(1)
regularSet.add(3)
regularSet.forEach(item => console.log('regular set', item))
// regular set 2
// regular set 1
// regular set 3
orderedSet = new OrderedSet([3,2,1])
orderedSet.add(0)
console.log('orderedSet.size', orderedSet.size) // set.size 4
orderedSet.delete(0)
console.log('orderedSet.size', orderedSet.size) // set.size 3

