var git = require('nodegit');
var ReadWriteLock = require('rwlock');
var Promise = require('nodegit-promise');
var path = require('path');
var os = require('os');
var sha1 = require('sha1');
var rimraf = require('rimraf');
var commitSelection = require('./commitSelection');
var commitIterator = require('./commitIterator');

module.exports = function(repoUrl, localPath) {
  var RepoWrapper = {};

  var gitRepo = undefined;
  var firstCommitIt = commitIterator();
  var lastCommitIt = commitIterator();
  var lock = new ReadWriteLock();
  var cleanupClonedFiles = false;
  var actionProviders = [];

  RepoWrapper.performActions = function() {
    return RepoWrapper.walkCommits(function (commitIt) {
      var actionPromises = actionProviders.map(function (actionProvider) {
        return actionProvider.performActions(commitIt);
      });
      return Promise.all(actionPromises);
    }).then(function() {
      return RepoWrapper;
    });
  };

  RepoWrapper.walkCommits = function(callback, max) {
    return processCommit(firstCommitIt, callback)
      .then(function () {
        return processCommitHistory(firstCommitIt, max, callback);
      }, function(err) {
        console.log('Unable to process first commit: ' + err);
      }).then(function() {
        // restore master commit
        return checkoutCommit(firstCommitIt);
      });
  };

  RepoWrapper.cleanup = function() {
      if (cleanupClonedFiles) {
        cleanupClonedFiles = false;
        console.log('Cleaning up repository at ' + localPath);
        return new Promise(function(resolve, reject) {
          rimraf(localPath, function(err) {
            if (err) reject(err);
            else resolve();
          });
        });
      } else {
        return Promise.resolve();
      }
  }

  RepoWrapper.getFirstCommitIterator = function() {
    return firstCommitIt;
  };

  RepoWrapper.getLastCommitIterator = function() {
    return lastCommitIt;
  };

  RepoWrapper.commits = function() {
    console.log('Returning commit selection');
    return commitSelection(RepoWrapper);
  }

  RepoWrapper.attach = function(actionProvider) {
    console.log('Attaching action provider');
    actionProviders.push(actionProvider);
  };

  function processCommitHistory(commitIt, max, callback) {
    return new Promise(function(resolve, reject) {
      var history = commitIt.commit().history(git.Revwalk.SORT.Time);

      history.on("end", function(commits) {
        console.log('got ' + commits.length + ' commits');
        lastCommitIt.commit(commits.slice(-1)[0]);
        if (max) commits = commits.slice(0, max-1);
        Promise.all(commits.map(function(c) {
          return processCommit(commitIterator(c), callback);
        })).then(function (res) {
          console.log('processed ' + commits.length + ' commits');
          resolve();
        },function(err) {
          console.log('failed processing commits, error: ' + err);
          reject(err);
        });
      });

      history.start();
    });
  }

  function processCommit(commitIt, callback) {
    return new Promise(function(resolve, reject) {
      lock.writeLock(function (release) {
        console.log('checking out commit ' + commitIt + ' (' + commitIt.commit().date() + ')');

        checkoutCommit(commitIt).then(function() {
            return callback(commitIt);
          }).then(function() {
            console.log('done with commit ' + commitIt);
            release(); // write lock
            resolve();
          }, function(err) {
            console.log('Error in commit: ' + commitIt + ': ' + err);
            release();  // write lock
            reject(err);
        });
      });
    });
  }

  function checkoutCommit(commitIt) {
    var checkoutOpts = {
      checkoutStrategy: git.Checkout.STRATEGY.FORCE
    };

    return git.Checkout.tree(gitRepo, commitIt.commit(), checkoutOpts)
      .catch(function(err) {
        console.log('failed checking out tree on commit ' + commitIt + ':' + err);
        throw err;
      });
  }

  function getRepo() {
    if (!localPath && !repoUrl) throw "Must specify repository url or path.";

    if (!localPath) {
      localPath = path.join(os.tmpdir(),sha1(repoUrl));
    } else {
      localPath = path.resolve(localPath);
    }

    if (!repoUrl) {
      return openRepo();
    } else {
      return cloneRepo();
    }
  }

  function cloneRepo() {
    console.log('Cloning "' + repoUrl +'" into "' + localPath + '"');

    var cloneOptions = {};

    // override cert check for mac os x!
    if (/^https/.test(repoUrl) && process.platform == "darwin") {
      console.log('Warning: overriding certificate check for Mac OS X');
      cloneOptions.remoteCallbacks = {
        certificateCheck: function() { return 1; }
      };
    }

    return git.Clone(repoUrl, localPath, cloneOptions).then(function(repo) {
      cleanupClonedFiles = true;
      return repo;
    });
  }

  function openRepo() {
    console.log('Opening repo "' + localPath +'"');
    return git.Repository.open(localPath);
  }

  return getRepo().then(function (repo) {
    console.log('Repo opened, getting master commit');
    gitRepo = repo;
    return repo.getMasterCommit();
  }, function(err) {
    console.log('Failed to get repository: ' + err);
    throw err;
  }).then(function(masterCommit) {
    console.log('Got master commit, repository opened');
    firstCommitIt = commitIterator(masterCommit);
    return RepoWrapper;
  }, function(err) {
    console.log('Failed to get first commit: ' + err);
    throw err;
  });
};
