var Promise = require('nodegit-promise');
var cpExec = require('child_process').exec;
var cpSpawn = require('child_process').spawn;


function executionContext(workingDirectory) {
  var self = {};

  var queue = Promise.resolve();

  self.exec = function(cmd, opts) {
    opts = injectWorkingDirectory(opts);
    queue = queue.then(function() {
      return new Promise(function(resolve, reject) {
        console.log('Executing ' + cmd);
        cpExec(cmd, opts, function(err, stdout, stderr) {
          if (err) reject(err);
          else resolve();
        });
      });
    });
    return queue;
  };

  self.spawn = function(cmd, opts) {
    opts = injectWorkingDirectory(opts);
    var cmdAndArgs = cmd.split(' ');
    queue = queue.then(function() {
      console.log('Spawning ' + cmd);
      return cpSpawn(cmdAndArgs[0], cmdAndArgs.slice(1), opts);
    });
    return queue;
  };

  self.kill = function(childOrPromise) {
    return applyToObjectOrPromise(function(child) {
      console.log('killing server...');
      child.kill();
    }, childOrPromise);
  };

  self.wait = function(time) {
    queue = queue.then(function() {
      console.log('Waiting ' + time + 'ms');
      return new Promise(function (resolve) {
        setTimeout(resolve, time);
      });
    });
    return queue;
  };

  self.queue = function() {
    return queue;
  }

  function injectWorkingDirectory(opts) {
    if (!opts) opts = {};
    if (!opts.cwd) opts.cwd = workingDirectory;
    return opts;
  }

  function applyToObjectOrPromise(f, obj) {
    if (obj.then) {
      queue = queue.then(function() {
        return obj.then(function(res) {
          return f(res);
        });
      });
      return queue;
    } else {
      queue = queue.then(function() {
        return f(obj);
      });
      return queue;
    }
  }

  return self;
}

module.exports = executionContext;
