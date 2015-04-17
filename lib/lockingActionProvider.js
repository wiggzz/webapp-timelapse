var Promise = require('nodegit-promise');
var ReadWriteLock = require('rwlock');


// ensures only one action happens at once during an iteration
var lockingActionProvider = function(actionProvider) {
  var self = {};

  self.watcher = function() {
    console.log('Generating lockingActionProvider watcher');
    var watcher = {};

    var subWatcher = undefined;

    var lock = new ReadWriteLock();

    watcher.update = function(item) {
      console.log('updating ' + item.sha() + ' in lockingActionProvider.watcher');
      return lockAndApply(function(w) {
        return w.update(item);
      });
    };

    watcher.done = function() {
      console.log('done in lockingActionProvider.watcher');
      return lockAndApply(function(w) {
        return w.done();
      });
    }

    function lockAndApply(f) {
      return new Promise(function(resolve,reject) {
        lock.writeLock(function (release) {
          console.log('directory locked');
          f(subWatcher).then(function(res) {
              console.log('unlocking directory');
              release();
              resolve();
            },function(err) {
              console.log('error, unlocking');
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
