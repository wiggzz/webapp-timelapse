'use strict';

var groupActionProvider = function() {
  var self = {};

  var actionProviders = [];

  self.registerActionProvider = function(actionProvider) {
    actionProviders.push(actionProvider);
    return self;
  };

  self.watcher = function() {
    var watcher = {};

    var subWatchers;

    watcher.hasActions = function(item) {
      console.log('Checking ' + subWatchers.length + ' subWatchers');
      return subWatchers.reduce(function(any, w) {
        // we order it like this because we need hasActions to be run on each
        // iteration. this isn't great.
        return w.hasActions(item) || any;
      }, false);
    };

    watcher.update = function(item) {
      return apply(function(w) {
        return w.update(item);
      });
    };

    watcher.done = function() {
      return apply(function(w) {
        return w.done();
      });
    };

    function apply(f) {
      var chain = Promise.resolve();
      subWatchers.forEach(function(w) {
          chain = chain.then(function() {
            return f(w);
          });
        });
      return chain;
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
