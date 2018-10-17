(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('simplebind.js')) :
  typeof define === 'function' && define.amd ? define(['exports', 'simplebind.js'], factory) :
  (factory((global.simpleBindStore = {}),global.simpleBind));
}(this, (function (exports,simpleBind) { 'use strict';

  simpleBind = simpleBind && simpleBind.hasOwnProperty('default') ? simpleBind['default'] : simpleBind;

  var defaults = { 
    middleware: [], 
  }; 

  var watchers = { }; 

  function Store(name,state,conf) {
    if ( conf === void 0 ) conf={};
   
    if(!(this instanceof Store)) { return new Store(name,state,conf); } 
    watchers[name] = this.externalStoreChange.bind(this); 
    this.name = name;
    this.state = state; 
    this.conf = Object.keys(defaults).reduce(function (obj,key) {
      obj[key] = typeof conf[key] != 'undefined' ? conf[key] : defaults[key]; 
      return obj;
    },{});
    return this;
  }
  Store.prototype.externalStoreChange = function(obj) { 
    this.state = obj;
    this.runMiddleware();
  }; 

  Store.prototype.runMiddleware = function() {
    var this$1 = this;
   
    this.conf.middleware.reduce(function (state,mw) { return mw.call(this$1,state); }, this.state);
    return this;
  };

  Store.prototype.commit = function() { 
    this.runMiddleware();
    simpleBind.bind(this.name,this.state);
    return this;
  };

  function extendStore(child) { 
  	child.prototype = Object.create(Store.prototype);
  	child.prototype.constructor = child;
  }
  simpleBind.registerPlugin({
    name: 'simplebindStore',
    preBind: function(objName,obj) { 
      if(watchers[objName]) { watchers[objName](obj); }
      return obj;
    }
  });

  exports.Store = Store;
  exports.extendStore = extendStore;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=simpleBindStore.umd.js.map
