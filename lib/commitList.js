'use strict';

var git = require('nodegit');

var commitList = function(firstCommit) {
  var self = {};

  self.map = function(f) {
    return new Promise(function (resolve, reject) {
      var history = firstCommit.history(git.Revwalk.SORT.Time);

      history.on('error', function(err) {
        reject(err);
      });

      history.on('end', function(commits) {
        console.log('processing ' + commits.length + ' commits');
        try {
          Promise.all(commits.map(function(c) {
            return f(c);
          })).then(function(res) {
            console.log('finished ' + res.length + ' commits');
            resolve();
          }, function(err) {
            console.log('error during processing commits: ' + err);
            console.log(err.stack);
            reject(err);
          });
        } catch (err) {
          reject(err);
        }
      });

      history.start();
    });
  };

  return self;
};

module.exports = commitList;
