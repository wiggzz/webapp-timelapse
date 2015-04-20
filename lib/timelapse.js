var fs = require('fs');
var path = require('path');
var Promise = require('nodegit-promise');
var selectionActionProvider = require('./selectionActionProvider');
var commitMatcher = require('./commitMatcher');
var actionIterator = require('./actionIterator');
var groupActionProvider = require('./groupActionProvider');
var checkoutActionProvider = require('./checkoutActionProvider');
var lockingActionProvider = require('./lockingActionProvider');
var commitMatcher = require('./commitMatcher');
var executionContext = require('./executionContext');
var RepoWrapper = require('./repoWrapper');

exports.clone = function(url) {
  return RepoWrapper(url).then(function (wrapper) {
    var provider = selectionProvider(wrapper);
    return {
      select: function() {
        return selectionWrapper(provider.base(), provider);
      },
      cleanup: function() {
        return wrapper.cleanup();
      },
      in: function(callback, workingDirectory) {
        if (!workingDirectory) workingDirectory = wrapper.localPath();
        var context = executionContext(workingDirectory);
        var result = callback(context);
        return context.queue().then(function() {
          return result;
          });
      }
    };
  });
};

exports.commitMatcher = require('./commitMatcher');

exports.browser = require('./browserWrapper');

exports.promise = require('nodegit-promise');


exports.saveScreenshot = function(browser, commit) {
  return browser.takeScreenshot().then(function(png) {
    return exports.savePng(png, screenshotPath(commit));
  })
};

exports.savePng = function(png, path) {
  return new Promise(function (resolve, reject) {
    if (!png) {reject('No png to save'); return;}
    if (!path) {reject('path not specified'); return;}
    var stream = fs.createWriteStream(path);
    if (!stream) {reject('Unable to open screenshot path: ' + path); return;}
    stream.write(new Buffer(png, 'base64'));
    stream.end();
    resolve();
  });
};

function screenshotPath(commit) {
  return path.join('./screenshots', commit.date().getTime().toString() + commit.sha().slice(0,10) + '.png');
};

function selectionProvider(repoWrapper) {
  var self = {};

  // we have:
  // lockingActionProvider -> groupActionProvider -> checkoutActionProvider
  //                                 |-> selectionActionProvider
  //                                 |---> selectionActionProvider
  //                                 | ...

  var checkout = checkoutActionProvider(repoWrapper.repository());
  var group = groupActionProvider();
  group.registerActionProvider(checkout);
  var selection = selectionActionProvider();
  group.registerActionProvider(selection);
  var locker = lockingActionProvider(group);

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
function selectionWrapper(selection, selectionProvider) {
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

  return self;
};
