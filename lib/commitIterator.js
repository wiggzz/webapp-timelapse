

var commitIterator = function(commit) {
  var self = {};

  self.commit = function(_) {
    if (!arguments.length) return commit;
    commit = _;
    return self;
  };

  self.toString = function() {
    if (commit) return commit.sha();
    else return 'null iterator';
  };

  self.sha = function() {
    if (commit) return commit.sha();
    else return undefined;
  };

  self.equals = function(other) {
    if (other.commit)
      return commit == other.commit();
    else
      return other.equals(self);
  };

  return self;
};

module.exports = commitIterator;
