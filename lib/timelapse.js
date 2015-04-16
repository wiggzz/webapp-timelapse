var RepoWrapper = require('./repoWrapper');

exports.clone = function(url) {
  return RepoWrapper(url);
}


exports.commitMatcher = require('./commitMatcher');
