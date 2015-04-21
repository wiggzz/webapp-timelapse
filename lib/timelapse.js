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
var syncWrapper = require('./syncWrapper');


exports.clone = function(url) {
  var repoPromise = RepoWrapper(url);
  var provider = selectionProvider(repoPromise);
  var contextPromise = repoPromise.then(function(wrapper) {
    return executionContext(wrapper.localPath());
  });

  return {
    select: function() {
      return selectionWrapper(provider.base(), provider);
    },
    cleanup: function() {
      return repoPromise.then(function(wrapper) {
        return wrapper.cleanup();
      });
    },
    context: function(callback) {
      return repoPromise.then(function(wrapper) {
        var context = executionContext(wrapper.localPath())

        context.saveScreenshot = function(browser, commit) {
          return browser.takeScreenshot().then(function(png) {
            return savePng(png, screenshotPath(commit));
          });
        };

        return syncWrapper(context);
      }).then(callback);
    }
  };
};

exports.commitMatcher = require('./commitMatcher');

var browserWrapper = require('./browserWrapper');

exports.browser = function(opts) {
  var browserPromise = browserWrapper(opts);

  var chain = exports.chain;

  return {
    takeScreenshot: function(url) {
      return browserPromise.then(function(browser) {
        return browser.takeScreenshot(url);
      });
    },
    shutdown: function() {
      return browserPromise.then(function(browser) {
        return browser.shutdown();
      });
    }
  };
}

exports.promise = require('nodegit-promise');

function savePng(png, path) {
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

function selectionProvider(repoWrapperPromise) {
  var self = {};

  // we have:
  // lockingActionProvider -> groupActionProvider -> checkoutActionProvider
  //                                 |-> selectionActionProvider
  //                                 |---> selectionActionProvider
  //                                 | ...

  var checkout = checkoutActionProvider();
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
    return repoWrapperPromise.then(function(wrapper) {
      checkout.repository(wrapper.repository());
      return actionIterator(wrapper.commits(), locker).start();
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
