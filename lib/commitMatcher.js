'use strict';

if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(str) {
    return this.substr(0, str.length) === str;
  };
}

exports.sha = function(partialSha) {
  var self = {};

  self.equals = function(commit) {
    return commit.sha().startsWith(partialSha);
  };

  return self;
};

exports.constant = function(constant) {
  var self = {};

  self.equals = function(commit) {
    return constant;
  };

  return self;
};
