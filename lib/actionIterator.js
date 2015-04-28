'use strict';

var actionIterator = function(iterable, actionProvider) {
  var self = {};

  self.start = function() {
    return actionProvider.watcher().then(function (watcher) {
        var errorList = [];
        return iterable.map(function(item) {
            if (watcher.hasActions(item)) {
              var promise;
              try {
                promise = watcher.update(item);
              } catch (err) {
                promise = Promise.reject(err);
              }
              return promise.then(null, function(err) {
                errorList.push(err);
              });
            } else {
              return Promise.resolve();
            }
          }).then(function() {
            return watcher.done();
          }).then(function() {
            if (errorList.length > 0) throw errorList;
          });
      });
  };

  return self;
};

module.exports = actionIterator;
