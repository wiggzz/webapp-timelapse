'use strict';

var git = require('nodegit');
var Promise = require('nodegit-promise');

var checkoutActionProvider = function(repository) {
  var self = {};

  var resetWhenDone = true;

  self.repository = function(_) {
    if (!arguments.length) return repository;
    repository = _;
    return self;
  }

  self.resetWhenDone = function(_) {
    if (!arguments.length) return resetWhenDone;
    resetWhenDone = _;
    return self;
  }

  self.watcher = function() {
    var watcher = {};

    watcher.hasActions = function(commit) {
      return false;
    }

    watcher.update = function(commit) {
      return checkout(commit);
    }

    watcher.done = function() {
      if (resetWhenDone) {
        console.log('Resetting repository');
        return repository.getMasterCommit().then(checkout);
      } else {
        return Promise.resolve();
      }
    }

    function checkout(commit) {
      var checkoutOpts = {
        checkoutStrategy: git.Checkout.STRATEGY.FORCE
      };

      console.log('Starting checkout of ' + commit.sha());
      return git.Checkout.tree(repository, commit, checkoutOpts)
        .then(function() {
          console.log('checked out ' + commit.sha());
        }, function(err) {
          console.log('failed checking out tree on commit ' + commit.sha() + ':' + err);
          throw err;
        });
    }

    return Promise.resolve(watcher);
  };

  return self;
};

module.exports = checkoutActionProvider;
