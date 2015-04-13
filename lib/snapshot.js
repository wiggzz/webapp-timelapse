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
