var Promise = require('nodegit-promise');
var selectionActionProvider = require('./selectionActionProvider');
var commitMatcher = require('./commitMatcher');
var actionIterator = require('./actionIterator');
var groupActionProvider = require('./groupActionProvider');
var checkoutActionProvider = require('./checkoutActionProvider');
var lockingActionProvider = require('./lockingActionProvider');
var commitMatcher = require('./commitMatcher');


exports.selectionProvider = function(repoWrapper) {
  var self = {};

  // we have:
  // lockingActionProvider -> groupActionProvider -> checkoutActionProvider
  //                                 |-> selectionActionProvider
  //                                 |---> selectionActionProvider
  //                                 | ...

  var checkout = checkoutActionProvider(repoWrapper.repository());
  console.log('built checkout');
  var group = groupActionProvider();
  console.log('built group');
  group.registerActionProvider(checkout);
  console.log('registered checkout');
  var selection = selectionActionProvider();
  console.log('build selection');
  group.registerActionProvider(selection);
  console.log('registered selection');
  var locker = lockingActionProvider(group);
  console.log('built locker');

  self.base = function() {
    return selection;
  };

  self.new = function(base, begin, end) {
    begin = begin || base.begin();
    end = end || base.end();

    var s = selectionActionProvider(begin, end);

    group.registerActionProvider(s);

    return s;
  };

  self.apply = function() {
    return actionIterator(repoWrapper.commits(), locker).start()
      .then(function() {
        return repoWrapper;
      });
  };

  return self;
};

// convenience API
var selectionWrapper = function(selection, selectionProvider) {
  var self = {};

  self.selection = function(_) {
    if (!arguments.length) return selection;
    selection = _;
    return self;
  };

  self.selectionProvider = function(_) {
    if (!arguments.length) return selectionProvider;
    selectionProvider = _;
    return self;
  };

  // register new actions
  self.beforeAll = function(callback) {
    selection.beforeAll(callback);
    return self;
  };

  self.afterAll = function(callback) {
    selection.afterAll(callback);
    return self;
  };

  self.forEach = function(callback) {
    selection.forEach(callback);
    return self;
  };

  self.from = function(partialSha) {
    return selectionWrapper(selectionProvider.new(selection, partialSha, false), selectionProvider);
  };

  self.to = function(partialSha) {
    return selectionWrapper(selectionProvider.new(selection, false, partialSha), selectionProvider);
  };

  self.apply = function() {
    return selectionProvider.apply();
  };

  console.log('finishing selectionWrapper construction');
  return self;
};

exports.selectionWrapper = selectionWrapper;
