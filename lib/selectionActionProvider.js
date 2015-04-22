'use strict';

var commitMatcher = require('./commitMatcher');

var selectionActionProvider = function(beginMatcher, endMatcher) {
  var self = {};

  var actions = {
    beforeAll: [],
    afterAll: [],
    forEach: []
  };

  beginMatcher = initMatcher(beginMatcher, true);
  endMatcher = initMatcher(endMatcher, false);

  function initMatcher(matcher, constant) {
    if (!matcher) {
      return commitMatcher.constant(constant);
    }
    if (typeof matcher === 'string') {
      return commitMatcher.sha(matcher);
    } else {
      return matcher;
    }
  }

  // control selection
  self.begin = function(_) {
    if (!arguments.length) return beginMatcher;
    beginMatcher = _;
    return self;
  };

  self.end = function(_) {
    if (!arguments.length) return endMatcher;
    endMatcher = _;
    return self;
  };

  // register new actions
  self.beforeAll = function(callback) {
    actions.beforeAll.push(callback);
    return self;
  };

  self.afterAll = function(callback) {
    actions.afterAll.push(callback);
    return self;
  };

  self.forEach = function(callback) {
    actions.forEach.push(callback);
    return self;
  };

  self.watcher = function() {
    var watcher = {};

    var started = false;
    var ended = false;
    var actionMap = {};

    function getActions(item) {
      if (item.sha() in actionMap) {
        return actionMap[item.sha()];
      }
      var actionList = [];
      if (!started && !ended && beginMatcher.equals(item)) {
        started = true;
        actionList = actionList.concat(actions.beforeAll);
      }
      if (started && !ended) {
        actionList = actionList.concat(actions.forEach);
      }
      if (started && !ended && endMatcher.equals(item)) {
        ended = true;
        actionList = actionList.concat(actions.afterAll);
      }
      actionMap[item.sha()] = actionList;
      return actionMap[item.sha()];
    }

    watcher.hasActions = function(item) {
      return getActions(item).length > 0;
    };

    watcher.update = function(item) {
      var actionList = getActions(item);
      return apply(actionList, item);
    };

    watcher.done = function() {
      if (started && !ended) {
        ended = true;
        return apply(actions.afterAll);
      }
      return Promise.resolve();
    };

    function apply(actionList, item) {
      var chain = Promise.resolve();
      actionList.forEach(function(action) {
        chain = chain.then(function() {
          return Promise.resolve(action(item));
        });
      });
      return chain;
    }

    return Promise.resolve(watcher);
  };

  return self;
};

module.exports = selectionActionProvider;
