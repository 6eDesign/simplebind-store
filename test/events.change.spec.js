var test = require('tape')
  , getTestObj = require('./util/getTestObj')
  , store = require('..');

let testConfigurations = [
  {
    withComputed: false,
    name: 'base-level string property',
    expectedChanges: [ 
      { key: 'string', val: 'foo' }, 
      { key: 'string', val: 'bar' }
    ], 
    mutations: [ 
      { 
        totalExpectedChangeEvents: 1, 
        do: state => state.string = 'foo'
      }, { 
        totalExpectedChangeEvents: 2,
        do: state => state.string = 'bar'
      }
    ]
  },
  {
    withComputed: false,
    name: 'base-level array property',
    expectedChanges: [ 
      { key: 'arr', val: [1,2,3] }, 
      { key: 'arr', val: [3,2,1] }
    ], 
    mutations: [
      {
        totalExpectedChangeEvents: 1,
        do: state => state.arr = [1,2,3]
      }, { 
        totalExpectedChangeEvents: 2,
        do: state => state.arr = [3,2,1]
      }
    ]
  },
  {
    withComputed: false,
    name: 'base-level boolean property',
    expectedChanges: [ 
      { key: 'bool', val: false }, 
      { key: 'bool', val: true }, 
      { key: 'bool', val: 1 }
    ], 
    mutations: [
      {
        totalExpectedChangeEvents: 1,
        do: state => state.bool = false
      }, { 
        totalExpectedChangeEvents: 2,
        do: state => state.bool = true
      }, { 
        totalExpectedChangeEvents: 3, 
        do: state => state.bool = 1
      }
    ]
  },
  {
    withComputed: false,
    name: 'base-level numeric property',
    expectedChanges: [ 
      { key: 'num', val: 2 }, 
      { key: 'num', val: 20 }, 
      { key: 'num', val: 2e3 }
    ], 
    mutations: [
      {
        totalExpectedChangeEvents: 1,
        do: state => state.num = 2
      },{
        totalExpectedChangeEvents: 2,
        do: state => state.num = 20
      },{
        totalExpectedChangeEvents: 3,
        do: state => state.num = 2e3
      },{
        totalExpectedChangeEvents: 3,
        do: state => state.num = 2000
      }
    ]
  },
  {
    withComputed: false,
    name: 'base-level null property',
    expectedChanges: [ 
      { key: 'null', val: false }, 
      { key: 'null', val: true }, 
      { key: 'null', val: 100 }, 
      { key: 'null', val: null }
    ], 
    mutations: [
      {
        totalExpectedChangeEvents: 1,
        do: state => state.null = false
      },{
        totalExpectedChangeEvents: 2,
        do: state => state.null = true
      },{
        totalExpectedChangeEvents: 3,
        do: state => state.null = 100
      },{
        totalExpectedChangeEvents: 4,
        do: state => state.null = null
      }
    ]
  },
  { 
    withComputed: true,
    name: 'basic computed property #1',
    expectedChanges: [
      { key: 'num', val: 3 },
      { key: 'numPlus', val: 4 }
    ],
    mutations: [ 
      { 
        totalExpectedChangeEvents: 2,
        do: state => state.num = 3
      }
    ]
  },
  { 
    withComputed: true,
    name: 'basic computed property #2',
    expectedChanges: [
      { key: 'null', val: true },
      { key: 'nullAndBool', val: true }
    ],
    mutations: [ 
      { 
        totalExpectedChangeEvents: 2,
        do: state => state.null = true
      }
    ]
  },
  { 
    withComputed: true,
    name: 'computed property with array overwriting',
    expectedChanges: [
      { key: 'arr', val: [ 0, 1, 2 ] },
      { key: 'firstOfArr', val: 0 },
      { key: 'arr', val: [{hello: 'world'}] },
      { key: 'firstOfArr', val: {hello: 'world'} }
    ],
    mutations: [ 
      { 
        totalExpectedChangeEvents: 2,
        do: state => state.arr = [ 0, 1, 2 ]
      }, {
        totalExpectedChangeEvents: 4,
        do: state => state.arr = [{hello: 'world'}]
      }
    ]
  },
  { 
    withComputed: true,
    name: 'computed property with array push/unshift/edit',
    expectedChanges: [
      { key: 'arr.4', val: 5 },
      { key: 'arr.5', val: 5 },
      { key: 'arr.4', val: 4 },
      { key: 'arr.3', val: 3 },
      { key: 'arr.2', val: 2 },
      { key: 'arr.1', val: 1 },
      { key: 'arr.0', val: 0 },
      { key: 'firstOfArr', val: 0 }, 
      { key: 'arr.0', val: 10 },
      { key: 'firstOfArr', val: 10 }, 
      { key: 'arr.0', val: { hello: 'world' }},
      { key: 'firstOfArr', val: { hello: 'world' }}, 
      { key: 'arr.0.hello', val: 'galaxy' }
    ],
    mutations: [ 
      { 
        totalExpectedChangeEvents: 1,
        do: state => state.arr.push(5), 
        doNotDuplicate: true
      }, { 
        totalExpectedChangeEvents: 8, 
        do: state => state.arr.unshift(0), 
        doNotDuplicate: true
      }, { 
        totalExpectedChangeEvents: 10,
        do: state => state.arr[0] = 10
      }, { 
        totalExpectedChangeEvents: 12, 
        do: state => state.arr[0] = { hello: 'world' }
      }, { 
        totalExpectedChangeEvents: 13, 
        do: state => state.arr[0].hello = 'galaxy'
      }
    ]
  }, 
  { 
    withComputed: true,
    name: 'nested computed property that exists at initialization',
    expectedChanges: [
      { key: 'num2', val: 2 },
      { key: 'obj.nestedProp', val: 20 },
      { key: 'num2', val: 2.5 }, 
      { key: 'obj.nestedProp', val: 25 }
    ],
    mutations: [ 
      { 
        totalExpectedChangeEvents: 2,
        do: state => state.num2 = 2
      }, { 
        totalExpectedChangeEvents: 4, 
        do: state => state.num2 = 2.5
      } 
    ]
  },
  {
    withComputed: true, 
    name: `nested computed property that doesn't exist at initialization`,
    expectedChanges: [ 
      { key: 'num3', val: 2 }, 
      { key: 'obj.nestedObj.generatedObj.num3Times2', val: 4 },
      { key: 'num3', val: 0 }, 
      { key: 'obj.nestedObj.generatedObj.num3Times2', val: 0 },
    ], 
    mutations: [ 
      { 
        totalExpectedChangeEvents: 2, 
        do: state => state.num3 = 2
      }, { 
        totalExpectedChangeEvents: 4,
        do: state => state.num3 = 0
      }
    ]
  }
]; 

testConfigurations.forEach((conf,i) => {
  test(`Change event test #${i+1}: ${conf.name}`, t => {
    let testState = getTestObj(conf.withComputed)
      , firedCount = 0; 

    let testStore = store(testState, {
      subscribers: {
        change: function(key,val) {
          ++firedCount;
          // t.comment(`Change fired with key ${key} and val ${JSON.stringify(val)}`);
          let expected = conf.expectedChanges.shift(); 
          t.deepEqual(key,expected.key,`Expected change on key "${expected.key}"`);
          t.deepEqual(val,expected.val,`Expected new value of "${expected.key} to be "${expected.val}"`);
        }
      }
    });
    conf.mutations.forEach((mutation,i) => {
      mutation.do(testStore.state);
      t.equal(firedCount,mutation.totalExpectedChangeEvents,`Expected ${mutation.totalExpectedChangeEvents} change events for mutation index ${i}`);
      // perform mutation again
      if(mutation.doNotDuplicate) return;
      mutation.do(testStore.state);
      t.equal(firedCount,mutation.totalExpectedChangeEvents,`Did not expect additional change events when identical mutation performed.`);
    });
    t.comment(JSON.stringify(testStore.state,null,2));
    t.end();
  });
});