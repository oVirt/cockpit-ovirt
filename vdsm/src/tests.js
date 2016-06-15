import {insertSorted, debugMsg} from './helpers'

function testInsertSorted () {
  function testObj (p1) {
    return {
      name: p1
    }
  }

  let arr1 = []
  let arr2 = [testObj('aa'), testObj('ab'), testObj('ba')]
  let arr3 = arr2.slice()
  let arr4 = arr2.slice()
  let arr5 = arr2.slice()

  insertSorted(arr1, testObj('aa'), 'name')
  insertSorted(arr2, testObj('ab'), 'name')
  insertSorted(arr3, testObj('ac'), 'name')
  insertSorted(arr4, testObj('bb'), 'name')
  insertSorted(arr5, testObj('0aa'), 'name')

  debugMsg('-----------------------------------------------------------')
  debugMsg(`arr1: ${JSON.stringify(arr1)}`)
  debugMsg(`arr2: ${JSON.stringify(arr2)}`)
  debugMsg(`arr3: ${JSON.stringify(arr3)}`)
  debugMsg(`arr4: ${JSON.stringify(arr4)}`)
  debugMsg(`arr5: ${JSON.stringify(arr5)}`)
}

// Run the tests
if (typeof __DEV__ !== 'undefined') {
  testInsertSorted()
}
