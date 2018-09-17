module.exports = (withComputed=false) => {
  if(withComputed) { 
    return { 
      arr: [1,2,3,4],
      obj: { 
        nestedProp: 1, 
        nestedObj: { 
          veryNestedProp: 2
        }
      },
      num: 1,
      num2: 1,
      num3: 1,
      string: 'asdf',
      null: null,
      bool: true, 
      computed: { 
        numPlus: function(store) { 
          return store.state.num + 1;
        }, 
        nullAndBool: function(store) { 
          return store.state.null && store.state.bool;
        }, 
        firstOfArr: function(store) { 
          return store.state.arr[0];
        }, 
        'obj.nestedProp': function(store) { 
          return store.state.num2 * 10;
        }, 
        'obj.nestedObj.generatedObj.num3Times2': function(store) { 
          return store.state.num3 * 2; 
        }
      }
    }; 
  } else { 
    return { 
      arr: [1,2,3,4],
      obj: { 
        nestedProp: 1, 
        nestedObj: { 
          veryNestedProp: 2
        }
      },
      num: 1,
      string: 'asdf',
      null: null,
      bool: true
    }; 
  }
}; 