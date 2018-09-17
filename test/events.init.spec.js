var test = require('tape')
  , getTestObj = require('./util/getTestObj')
  , store = require('..');


test('Upon initialization, store should emit an init event.', (t) => {
  let testState = getTestObj();
  let testStore = store(testState, {
    subscribers: { 
      initialized: function() { 
        t.deepEqual(this.state,testState,`Expected init to fire with this.state equal to testState.`);
        t.end();
      }
    }
  }); 
});