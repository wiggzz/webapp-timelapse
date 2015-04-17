var git = require('nodegit');
var ReadWriteLock = require('rwlock');
var Promise = require('nodegit-promise');
var path = require('path');
var os = require('os');
var sha1 = require('sha1');
var rimraf = require('rimraf');
var convenience = require('./convenience');
var commitList = require('./commitList');

module.exports = function(repoUrl, localPath) {
  var RepoWrapper = {};

  var gitRepo = undefined;
  var commits = undefined;

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
  };

  RepoWrapper.select = function() {
    var provider = convenience.selectionProvider(gitRepo, commits);
    console.log('built provider');
    return convenience.selectionWrapper(provider.base(), provider);
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
    console.log('Got master commit, getting commit set');
    commits = commitList(masterCommit);
    console.log('Got commit set, repository opened');
    return RepoWrapper;
  }, function(err) {
    console.log('Failed to get first commit: ' + err);
    throw err;
  }).catch(function(err) {
    console.log('Failed: ' + err);
    throw err;
  });
};
