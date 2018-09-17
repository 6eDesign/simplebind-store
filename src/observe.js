export default function observe(o, callback) {
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
  }
  return buildProxy('', o);
}