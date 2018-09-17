import 'proxy-polyfill';
import isEqual from './isEqual';
import observe from './observe';
merge({},{something:true});
export default function store(obj,opts) { 
  if(!(this instanceof store)) return new store(obj,opts); 
  opts = opts || {};
  this.state = obj;
  this.subscribers = opts.subscribers || {}; 
  this.computed = this.state.computed || {}; 
  delete this.state.computed; 
  this.generateComputed(); 
  this.state = observe(obj,this.observer.bind(this));
  this.emit('initialized');
  return this;
};

store.prototype.get = function(key) { 
  var keys = key.split('.'), target = this.state;
  while(keys.length) { 
  	var key = keys.shift(); 
    if(typeof target[key] == 'undefined') return undefined;
    target = target[key];
  }
  return target;
}; 

store.prototype.set = function(key,val) { 
  if(isEqual(this.get(key),val)) return;
	var keys = key.split('.'), target = this.state; 
  while(keys.length > 1) { 
    var thisKey = keys.shift(); 
    if(typeof target[thisKey] == 'undefined') target[thisKey] = {}; 
    target = target[thisKey];
  }
  target[keys.shift()] = val; 
  return this; 
}; 

store.prototype.generateComputed = function() { 
	for(var key in this.computed) { 
    var computedVal = this.computed[key](this);
    this.set(key, computedVal);
  }
  return this;
}; 

store.prototype.observer = function(path, target, property, value) { 
  if(!isEqual(target[property],value)) { 
    this.emit('change',[path,value]);
    target[property] = value;
  }
	if(typeof this.computed[property] != 'undefined') return;
  return this.generateComputed();
};

store.prototype.emit = function(evtName,argsArray) { 
  var fn = this.subscribers[evtName]; 
  if(typeof fn != 'function') return this; 
  fn.apply(this,argsArray||[]); 
  return this;
};