var Promise = require('nodegit-promise');

var commitSelection = function(repository, first_, last_) {
  var self = {};

  var actions = {
    beforeAll: [],
    afterAll: [],
    forEach: []
  };

  var first = first_ || repository.getFirstCommitIterator();
  var last = last_ || repository.getLastCommitIterator();

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


  // perform actions
  self.performActions = function(commitIterator) {
    var actionList = [];
    if (commitIterator.equals(first)) {
      actionList = actionList.concat(actions.beforeAll);
    }
    actionList = actionList.concat(actions.forEach);
    if (commitIterator.equals(last)) {
      actionList = actionList.concat(actions.afterAll);
    }

    return new Promise.all(actionList.map(function(action) {
      return new Promise(function (resolve,reject) {
        action();
        resolve();
      })
    }));
  };

  self.from = function(commitMatcher) {
    return commitSelection(repository, commitMatcher, last);
  };

  self.to = function(commitMatcher) {
    return commitSelection(repository, first, commit);
  };

  function attach() {
    repository.attach(self);
  };

  attach();

  return self;
};

module.exports = commitSelection;
