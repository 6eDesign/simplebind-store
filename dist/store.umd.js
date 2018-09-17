(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.store = factory());
}(this, (function () { 'use strict';

	var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	/*
	 * Copyright 2016 Google Inc. All rights reserved.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
	 * use this file except in compliance with the License. You may obtain a copy of
	 * the License at
	 *
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
	 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
	 * License for the specific language governing permissions and limitations under
	 * the License.
	 */

	var proxy = function proxyPolyfill() {
	  let lastRevokeFn = null;
	  let ProxyPolyfill;

	  /**
	   * @param {*} o
	   * @return {boolean} whether this is probably a (non-null) Object
	   */
	  function isObject(o) {
	    return o ? (typeof o === 'object' || typeof o === 'function') : false;
	  }

	  /**
	   * @constructor
	   * @param {!Object} target
	   * @param {{apply, construct, get, set}} handler
	   */
	  ProxyPolyfill = function(target, handler) {
	    if (!isObject(target) || !isObject(handler)) {
	      throw new TypeError('Cannot create proxy with a non-object as target or handler');
	    }

	    // Construct revoke function, and set lastRevokeFn so that Proxy.revocable can steal it.
	    // The caller might get the wrong revoke function if a user replaces or wraps scope.Proxy
	    // to call itself, but that seems unlikely especially when using the polyfill.
	    let throwRevoked = function() {};
	    lastRevokeFn = function() {
	      throwRevoked = function(trap) {
	        throw new TypeError(`Cannot perform '${trap}' on a proxy that has been revoked`);
	      };
	    };

	    // Fail on unsupported traps: Chrome doesn't do this, but ensure that users of the polyfill
	    // are a bit more careful. Copy the internal parts of handler to prevent user changes.
	    const unsafeHandler = handler;
	    handler = { 'get': null, 'set': null, 'apply': null, 'construct': null };
	    for (let k in unsafeHandler) {
	      if (!(k in handler)) {
	        throw new TypeError(`Proxy polyfill does not support trap '${k}'`);
	      }
	      handler[k] = unsafeHandler[k];
	    }
	    if (typeof unsafeHandler === 'function') {
	      // Allow handler to be a function (which has an 'apply' method). This matches what is
	      // probably a bug in native versions. It treats the apply call as a trap to be configured.
	      handler.apply = unsafeHandler.apply.bind(unsafeHandler);
	    }

	    // Define proxy as this, or a Function (if either it's callable, or apply is set).
	    // TODO(samthor): Closure compiler doesn't know about 'construct', attempts to rename it.
	    let proxy = this;
	    let isMethod = false;
	    let isArray = false;
	    if (typeof target === 'function') {
	      proxy = function ProxyPolyfill() {
	        const usingNew = (this && this.constructor === proxy);
	        const args = Array.prototype.slice.call(arguments);
	        throwRevoked(usingNew ? 'construct' : 'apply');

	        if (usingNew && handler['construct']) {
	          return handler['construct'].call(this, target, args);
	        } else if (!usingNew && handler.apply) {
	          return handler.apply(target, this, args);
	        }

	        // since the target was a function, fallback to calling it directly.
	        if (usingNew) {
	          // inspired by answers to https://stackoverflow.com/q/1606797
	          args.unshift(target);  // pass class as first arg to constructor, although irrelevant
	          // nb. cast to convince Closure compiler that this is a constructor
	          const f = /** @type {!Function} */ (target.bind.apply(target, args));
	          return new f();
	        }
	        return target.apply(this, args);
	      };
	      isMethod = true;
	    } else if (target instanceof Array) {
	      proxy = [];
	      isArray = true;
	    }

	    // Create default getters/setters. Create different code paths as handler.get/handler.set can't
	    // change after creation.
	    const getter = handler.get ? function(prop) {
	      throwRevoked('get');
	      return handler.get(this, prop, proxy);
	    } : function(prop) {
	      throwRevoked('get');
	      return this[prop];
	    };
	    const setter = handler.set ? function(prop, value) {
	      throwRevoked('set');
	      const status = handler.set(this, prop, value, proxy);
	      // TODO(samthor): If the calling code is in strict mode, throw TypeError.
	      // if (!status) {
	        // It's (sometimes) possible to work this out, if this code isn't strict- try to load the
	        // callee, and if it's available, that code is non-strict. However, this isn't exhaustive.
	      // }
	    } : function(prop, value) {
	      throwRevoked('set');
	      this[prop] = value;
	    };

	    // Clone direct properties (i.e., not part of a prototype).
	    const propertyNames = Object.getOwnPropertyNames(target);
	    const propertyMap = {};
	    propertyNames.forEach(function(prop) {
	      if ((isMethod || isArray) && prop in proxy) {
	        return;  // ignore properties already here, e.g. 'bind', 'prototype' etc
	      }
	      const real = Object.getOwnPropertyDescriptor(target, prop);
	      const desc = {
	        enumerable: !!real.enumerable,
	        get: getter.bind(target, prop),
	        set: setter.bind(target, prop),
	      };
	      Object.defineProperty(proxy, prop, desc);
	      propertyMap[prop] = true;
	    });

	    // Set the prototype, or clone all prototype methods (always required if a getter is provided).
	    // TODO(samthor): We don't allow prototype methods to be set. It's (even more) awkward.
	    // An alternative here would be to _just_ clone methods to keep behavior consistent.
	    let prototypeOk = true;
	    if (Object.setPrototypeOf) {
	      Object.setPrototypeOf(proxy, Object.getPrototypeOf(target));
	    } else if (proxy.__proto__) {
	      proxy.__proto__ = target.__proto__;
	    } else {
	      prototypeOk = false;
	    }
	    if (handler.get || !prototypeOk) {
	      for (let k in target) {
	        if (propertyMap[k]) {
	          continue;
	        }
	        Object.defineProperty(proxy, k, { get: getter.bind(target, k) });
	      }
	    }

	    // The Proxy polyfill cannot handle adding new properties. Seal the target and proxy.
	    Object.seal(target);
	    Object.seal(proxy);

	    return proxy;  // nb. if isMethod is true, proxy != this
	  };

	  ProxyPolyfill.revocable = function(target, handler) {
	    const p = new ProxyPolyfill(target, handler);
	    return { 'proxy': p, 'revoke': lastRevokeFn };
	  };

	  return ProxyPolyfill;
	};

	(function(scope) {
	  if (scope['Proxy']) {
	    return;
	  }
	  scope.Proxy = proxy();
	  scope.Proxy['revocable'] = scope.Proxy.revocable;
	})(
	  ('undefined' !== typeof process &&
	    '[object process]' === {}.toString.call(process)) ||
	  ('undefined' !== typeof navigator && navigator.product === 'ReactNative')
	    ? commonjsGlobal
	    : self
	);

	let stringify = o => JSON.stringify(o);

	function isEqual(a,b) { 
	  if(typeof a != 'object' || typeof b != 'object') return a === b; 
	  return stringify(a) == stringify(b);
	}

	function observe(o, callback) {
	  var buildProxy = function(prefix, o) {
	    return new Proxy(o, {
	      set(target, property, value) {
	        // same as above, but add prefix
	        callback(prefix + property, target, property, value);
	        return true;
	      },
	      get(target, property) {
	        // return a new proxy if possible, add to prefix
	        const out = target[property];
	        if (out instanceof Object) {
	          return buildProxy(prefix + property + '.', out);
	        }
	        return out;  // primitive, ignore
	      },
	    });
	  };
	  return buildProxy('', o);
	}

	merge({},{something:true});
	function store(obj,opts) { 
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
	}
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

	return store;

})));
