var Promise = require('nodegit-promise');

var groupActionProvider = function() {
  var self = {};

  var actionProviders = [];

  self.registerActionProvider = function(actionProvider) {
    actionProviders.push(actionProvider);
    return self;
  }

  self.watcher = function() {
    console.log('Generating groupActionProvider watcher');
    var watcher = {};

    var subWatchers = undefined;

    watcher.update = function(item) {
      return apply(function(w) {
        return w.update(item);
      });
    };

    watcher.done = function() {
      console.log('done in groupActionProvider.watcher');
      return apply(function(w) {
        return w.done();
      });
    };

    function apply(f) {
      var chain = Promise.resolve();
      subWatchers.forEach(function(w) {
          chain = chain.then(function() {
            return f(w)
          });
        })
      return chain.then(function() {
          console.log('done with group actions');
        });
    }

    return Promise.all(actionProviders.map(function(ap) {
        return ap.watcher();
      })).then(function(watchers) {
        subWatchers = watchers;
        return watcher;
      });
  };

  return self;
};

module.exports = groupActionProvider;
