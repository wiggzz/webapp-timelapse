'use strict';

var git = require('nodegit');
var Promise = require('nodegit-promise');

module.exports = function(opts) {
  var Snapshot = {};

  if (!opts) opts = {};
  if (!opts.url) opts.url = '/';

  Snapshot.take = function (url) {
    if (!url) url = opts.url;

    return new Promise(function(resolve, reject) {
      console.log('Taking screenshot of ' + url);
      resolve();
    });
  };

  return Snapshot;
};

// couple of different paths to take here...
// could run each screenshot as a spec in a custom framework and inject
// the specs into protractor and have it launch webdriver and
// run config, etc.
// or, we do a stripped down version of webdriver construction
// with some configuration pulled from the default protractor
// config file or from our command line
// that simply loads each page and then takes a screenshot
// without all the hoo hah.

// i like option 2 more but it may be significantly more work.
