
var shaMatcher = function(partialSha) {
  var self = {};

  shaMatcher.equals = function(commitIterator) {
    return commitIterator.startsWith(partialSha);
  };

  return self;
}
