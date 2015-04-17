var Promise = require('nodegit-promise');
var ReadWriteLock = require('rwlock');

var actionIterator = function(iterable, actionProvider) {
  var self = {};

  self.start = function() {
    console.log('starting actionIterator');
    return actionProvider.watcher().then(function (watcher) {
        console.log('begining to iterate');
        return iterable.map(function(item) {
            return watcher.update(item);
          }).then(function() {
            return watcher.done();
          });
      });
  };

  return self;
};

module.exports = actionIterator;
