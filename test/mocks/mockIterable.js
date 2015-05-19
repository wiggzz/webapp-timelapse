'use strict';

var mockIterable = function(list) {
  var self = {}

  self.map = function(callback) {
    return Promise.all(list.map(callback));
  };

  return self;
};

module.exports = mockIterable;
