'use strict';

var minimist = require('minimist');
var path = require('path');
var git = require('nodegit');

exports.run = function() {
  var argv = minimist(process.argv.slice(2));

  // the process:
  // optionally open configuration file
  // optionally clone a repo

  if (!argv.local) argv.local = './';

  getRepo(argv.url,argv.local).then(function(repo) {
    return repo.getBranchCommit("master");
  }, function (reason) {
    console.log('Couldn\'t get repository: ' + reason);
  }).then(function(commit) {
    return commit.message();
  }).then(function(message) {
    console.log(message);
  });

  // checkout requested commit
  // launch server
  // launch protractor and website
  // take screenshot
  // shutdown protractor/server
  // repeat
  // done.

};

var getRepo = function(repoUrl, localPath) {
  if (!repoUrl) {
    return openRepo(localPath);
  } else {
    return cloneRepo(repoUrl, localPath);
  }
}

var cloneRepo = function(repoUrl, localPath) {
  console.log('Cloning "' + repoUrl +'" into "' + localPath + '"');

  var cloneOptions = {};

  // override cert check for mac os x!
  if (/^https/.test(repoUrl) && process.platform == "darwin") {
    console.log('Warning: overriding certificate check for Mac OS X');
    cloneOptions.remoteCallbacks = {
      certificateCheck: function() { return 1; }
    };
  }

  return git.Clone(repoUrl, localPath, cloneOptions);
};

var openRepo = function(repoPath) {
  console.log('Opening repo "' + repoPath);
  return git.Repository.open(repoPath);;
};
