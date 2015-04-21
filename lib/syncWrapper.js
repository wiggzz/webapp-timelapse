'use strict'

var promiseChain = require('./promiseChain');

module.exports = function(obj, chain) {
  var self = {};

  var chain = chain || promiseChain();

  mixinFunctions(self, obj);

  function mixinFunctions(dest, src) {
    for (var item in src) {
      if (typeof src[item] === 'function') {
        dest[item] = getWrapper(src, src[item]);
      }
    }
  }

  function getWrapper(object, func) {
    return function() {
      var args = arguments;
      return chain.push(function() {
        return resolveArguments(args).then(function(resolvedArgs) {
          return func.apply(object, resolvedArgs);
        });
      });
    }
  }

  self.whenDone = function() {
    return chain.get();
  };

  function resolveArguments(args) {
    if (args && args.length) {
      args = Array.prototype.slice.call(args);
      return Promise.all(args.map(function(arg) {
        return Promise.resolve(arg);
      }));
    } else {
      return Promise.resolve(args);
    }
  }

  return self;
};
