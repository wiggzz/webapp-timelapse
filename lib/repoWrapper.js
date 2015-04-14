var git = require('nodegit');
var ReadWriteLock = require('rwlock');
var Promise = require('nodegit-promise');
var path = require('path');

module.exports = function(repoUrl, localPath) {
  var RepoWrapper = {};

  var gitRepo = undefined;
  var firstCommit = undefined;
  var lock = new ReadWriteLock();

  RepoWrapper.walkCommits = function(callback) {
    return new Promise(function(resolve, reject) {
      var history = firstCommit.history();

      history.on("end", function(commits) {
        console.log('got ' + commits.length + ' commits');
        commits.forEach(function(commit) {
          processCommit(commit, callback);
        });
        console.log('processed ' + commits.length + ' commits');
        resolve();
      });

      history.start();
    });
  };

  var processCommit = function(commit, callback) {
    lock.writeLock(function (release) {
      console.log('checking out commit ' + commit.sha());
      git.Checkout.tree(gitRepo, commit).then(function() {
        return callback();
      }).then(function() {
        console.log('done with commit ' + commit.sha());
        release();
      });
    });
  };

  var getRepo = function(repoUrl, localPath) {
    localPath = path.resolve(localPath);

    if (!repoUrl) {
      return openRepo(localPath);
    } else {
      return cloneRepo(repoUrl, localPath);
    }
  };

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

  return getRepo(repoUrl, localPath).then(function (repo) {
    gitRepo = repo;
    return repo.getMasterCommit();
  }).then(function(masterCommit) {
    firstCommit = masterCommit;
    return RepoWrapper;
  }, function(reason) {
    console.log('Failed to get repository: ' + reason);
  });
};
