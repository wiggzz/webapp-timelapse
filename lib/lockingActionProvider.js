var Promise = require('nodegit-promise');
var ReadWriteLock = require('rwlock');


// ensures only one action happens at once during an iteration
var lockingActionProvider = function(actionProvider) {
  var self = {};

  self.watcher = function() {
    var watcher = {};

    var subWatcher = undefined;

    var lock = new ReadWriteLock();

    watcher.hasActions = function(item) {
      return subWatcher.hasActions(item);
    };

    watcher.update = function(item) {
      return lockAndApply(function(w) {
        return w.update(item);
      });
    };

    watcher.done = function() {
      return lockAndApply(function(w) {
        return w.done();
      });
    }

    function lockAndApply(f) {
      return new Promise(function(resolve,reject) {
        lock.writeLock(function (release) {
          f(subWatcher).then(function(res) {
              release();
              resolve();
            },function(err) {
              console.log('error, unlocking: ' + err);
              release();
              reject(err);
            });
          });
        });
    }

    return actionProvider.watcher().then(function(w) {
      subWatcher = w;
      return watcher;
    });
  };

  return self;
};

module.exports = lockingActionProvider;
