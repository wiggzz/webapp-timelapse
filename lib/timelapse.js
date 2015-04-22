'use strict';

var fs = require('fs');
var path = require('path');
var selectionActionProvider = require('./selectionActionProvider');
var commitMatcher = require('./commitMatcher');
var actionIterator = require('./actionIterator');
var groupActionProvider = require('./groupActionProvider');
var checkoutActionProvider = require('./checkoutActionProvider');
var lockingActionProvider = require('./lockingActionProvider');
var commitMatcher = require('./commitMatcher');
var executionContext = require('./executionContext');
var repoWrapper = require('./repoWrapper');
var syncWrapper = require('./syncWrapper');
var browserWrapper = require('./browserWrapper');


exports.clone = function(url) {
  var repoPromise = repoWrapper(url);
  var provider = timelapseSelectionProvider(repoPromise);

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
        var context = executionContext(wrapper.localPath());

        return syncWrapper(context);
      }).then(callback);
    }
  };
};

exports.browser = function(opts) {
  var browserPromise = browserWrapper(opts);

  return {
    saveScreenshot: function(url, path) {
      return this.takeScreenshot(url).then(function(png) {
        return savePng(png, path);
      });
    },
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
};

exports.commitMatcher = require('./commitMatcher');

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
}

function timelapseSelectionProvider(repoWrapperPromise) {
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

  self.newSelection = function(base, begin, end) {
    begin = begin || base.begin();
    end = end || base.end();

    var s = selectionActionProvider(begin, end);

    group.registerActionProvider(s);

    return s;
  };

  self.apply = function() {
    return repoWrapperPromise.then(function(wrapper) {
      checkout.repository(wrapper.repository());
      console.log('creating actionIterator...');
      return actionIterator(wrapper.commits(), locker).start();
    });
  };

  return self;
}


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
    return selectionWrapper(selectionProvider.newSelection(selection, partialSha, false), selectionProvider);
  };

  self.to = function(partialSha) {
    return selectionWrapper(selectionProvider.newSelection(selection, false, partialSha), selectionProvider);
  };

  self.apply = function() {
    return selectionProvider.apply();
  };

  return self;
}
