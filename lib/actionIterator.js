var Promise = require('nodegit-promise');
var ReadWriteLock = require('rwlock');

var actionIterator = function(iterable, actionProvider) {
  var self = {};

  self.start = function() {
    return actionProvider.watcher().then(function (watcher) {
        return iterable.map(function(item) {
            if (watcher.hasActions(item)) {
              return watcher.update(item).then(null, function(err) {
                console.log('Ignoring error: ' + err);
                console.log(err.stack);
              });
            } else {
              return Promise.resolve();
            }
          }).then(function() {
            return watcher.done();
          });
      });
  };

  return self;
};

module.exports = actionIterator;
