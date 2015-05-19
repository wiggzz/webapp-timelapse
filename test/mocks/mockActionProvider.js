'use strict';


var mockActionProvider = function(actionMap, doneAction) {
  var self = {};

  actionMap = actionMap || {};
  doneAction = doneAction || function(){};

  self.actionMap = function(_) {
    if (!arguments.length) return actionMap;
    actionMap = _;
    return self;
  };

  self.watcher = function() {
    var watcher = {};

    watcher.hasActions = function(item) {
      return !!actionMap[item];
    };

    watcher.update = function(item) {
      return Promise.resolve(actionMap[item](item));
    };

    watcher.done = function() {
      return Promise.resolve(doneAction());
    };

    return Promise.resolve(watcher);
  };

  return self;
};

module.exports = mockActionProvider;
