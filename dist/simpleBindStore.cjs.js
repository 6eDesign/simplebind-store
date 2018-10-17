'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var simpleBind = _interopDefault(require('simplebind.js'));

let defaults = { 
  middleware: [], 
}; 

let watchers = { }; 

function Store(name,state,conf={}) { 
  if(!(this instanceof Store)) return new Store(name,state,conf); 
  watchers[name] = this.externalStoreChange.bind(this); 
  this.name = name;
  this.state = state; 
  this.conf = Object.keys(defaults).reduce((obj,key) => {
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
  this.conf.middleware.reduce((state,mw) => mw.call(this,state), this.state);
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
    if(watchers[objName]) watchers[objName](obj);
    return obj;
  }
});

exports.Store = Store;
exports.extendStore = extendStore;
