'use strict';

var actionIterator = function(iterable, actionProvider) {
  var self = {};

  self.start = function() {
    return actionProvider.watcher().then(function (watcher) {
        var errorList = [];
        return iterable.map(function(item) {
            if (watcher.hasActions(item)) {
              var actionPromise;
              try {
                actionPromise = watcher.update(item);
              } catch(err) {
                actionPromise = Promise.reject(err);
              }
              return actionPromise.then(null, function(err) {
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
