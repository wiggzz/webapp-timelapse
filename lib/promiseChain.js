'use strict';

module.exports = function() {
  var self = {};

  var chain = Promise.resolve();

  self.push = function(f) {
    chain = chain.then(f);
    return chain;
  };

  self.get = function() {
    return chain;
  };

  return self;
};
