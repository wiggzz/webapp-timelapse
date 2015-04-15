var git = require('nodegit');
var ReadWriteLock = require('rwlock');
var Promise = require('nodegit-promise');
var path = require('path');

module.exports = function(repoUrl, localPath) {
  var RepoWrapper = {};

  var gitRepo = undefined;
  var firstCommit = undefined;
  var lock = new ReadWriteLock();

  RepoWrapper.walkCommits = function(callback, max) {
    return processCommitHistory(firstCommit, max, callback)
      .then(function () {
        // checkout first commit last, to re
        return processCommit(firstCommit, callback)
      }, function(err) {
        console.log('Unable to process commit history: ' + err);
      });
  };

  function processCommitHistory(commit, max, callback) {
    return new Promise(function(resolve, reject) {
      var history = commit.history(git.Revwalk.SORT.Time);

      history.on("end", function(commits) {
        console.log('got ' + commits.length + ' commits');
        if (max) commits = commits.slice(0, max-1);
        Promise.all(commits.map(function(c) {
          return processCommit(c, callback);
        })).then(function (res) {
          console.log('processed ' + commits.length + ' commits');
          resolve();
        },function(err) {
          console.log('failed processing commit, error: ' + err);
          reject();
        });
      });

      history.start();
    });
  }

  function processCommit(commit, callback) {
    return new Promise(function(resolve, reject) {
      lock.writeLock(function (release) {
        console.log('checking out commit ' + commit.sha() + ' (' + commit.date() + ')');
        git.Checkout.tree(gitRepo, commit).then(function() {
          return callback(commit);
        }, function(err) {
          console.log('failed checking out tree on commit ' + commit.sha() + ':' + err);
          reject();
        }).then(function() {
          console.log('done with commit ' + commit.sha());
          release(); // write lock
          resolve();
        });
      });
    });
  }

  function getRepo(repoUrl, localPath) {
    localPath = path.resolve(localPath);

    if (!repoUrl) {
      return openRepo(localPath);
    } else {
      return cloneRepo(repoUrl, localPath);
    }
  }

  function cloneRepo(repoUrl, localPath) {
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
  }

  function openRepo(repoPath) {
    console.log('Opening repo "' + repoPath +'"');
    return git.Repository.open(repoPath);
  }

  return getRepo(repoUrl, localPath).then(function (repo) {
    console.log('Repo opened, getting master commit');
    gitRepo = repo;
    return repo.getMasterCommit();
  }, function(err) {
    console.log('Failed to get repository: ' + err);
    throw err;
  }).then(function(masterCommit) {
    console.log('Got master commit, repository opened');
    firstCommit = masterCommit;
    return RepoWrapper;
  }, function(err) {
    console.log('Failed to get first commit: ' + err);
    throw err;
  });
};
