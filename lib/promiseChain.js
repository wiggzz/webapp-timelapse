'use strict';

module.exports = function() {
  var self = {};

  var chain = Promise.resolve();

  self.push = function(f) {
    return chain = chain.then(f);
  };

  self.get = function() {
    return chain;
  }

  return self;
}
