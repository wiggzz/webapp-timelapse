var Promise = require('nodegit-promise');
var commitMatcher = require('./commitMatcher');

var selectionActionProvider = function(beginMatcher, endMatcher) {
  var self = {};

  var actions = {
    beforeAll: [],
    afterAll: [],
    forEach: []
  };

  var beginMatcher = beginMatcher || commitMatcher.constant(true);
  var endMatcher = endMatcher || commitMatcher.constant(false);

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
    console.log('adding beforeAll callback');
    actions.beforeAll.push(callback);
    return self;
  };

  self.afterAll = function(callback) {
    console.log('adding afterAll callback');
    actions.afterAll.push(callback);
    return self;
  };

  self.forEach = function(callback) {
    console.log('adding forEach callback');
    actions.forEach.push(callback);
    return self;
  };

  self.watcher = function() {
    console.log('Generating selectionActionProvider watcher');
    var watcher = {};

    var started = false;
    var ended = false;

    watcher.update = function(item) {
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

      return apply(actionList);
    };

    watcher.done = function() {
      if (started && !ended) {
        return apply(actions.afterAll);
      }
      return Promise.resolve();
    };

    function apply(actionList) {
      return new Promise.all(actionList.map(function(action) {
        return new Promise(function (resolve,reject) {
          action();
          resolve();
        })
      }));
    }

    return Promise.resolve(watcher);
  };

  return self;
};

module.exports = selectionActionProvider;
