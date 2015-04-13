'use strict';

var minimist = require('minimist');

exports.run = function() {
  var argv = minimist(process.argv.slice(2));

  // the process:
  // optionally clone a repo
  // enter working directory of repo
  // checkout requested commit
  // launch server
  // launch protractor and website
  // take screenshot
  // shutdown protractor/server
  // repeat
  // done.

};
