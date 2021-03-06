'use strict';

var cpExec = require('child_process').exec;
var cpSpawn = require('child_process').spawn;

function executionContext(workingDirectory) {
  var self = {};

  self.exec = function(cmd, opts) {
    opts = injectWorkingDirectory(opts);
    return new Promise(function(resolve, reject) {
      console.log('Executing ' + cmd);
      cpExec(cmd, opts, function(err, stdout, stderr) {
        if (err) reject(err);
        else {
          console.log(stdout);
          resolve();
        }
      });
    });
  };

  self.spawn = function(cmd, opts) {
    opts = injectWorkingDirectory(opts);
    var cmdAndArgs = cmd.split(' ');
    console.log('Spawning ' + cmd);
    var child = cpSpawn(cmdAndArgs[0], cmdAndArgs.slice(1), opts);
    child.on('error', handleError);
    child.stdout.on('data', handleStdout);
    return child;
  };

  self.kill = function(child) {
    console.log('killing server...');
    child.kill();
  };

  self.wait = function(time) {
    console.log('Waiting ' + time + 'ms');
    return new Promise(function (resolve) {
      setTimeout(resolve, time);
    });
  };

  function handleError(err) {
    console.log(err);
    throw err;
  }

  function handleStdout(data) {
    console.log(data.toString());
  }

  function injectWorkingDirectory(opts) {
    if (!opts) opts = {};
    if (!opts.cwd) opts.cwd = workingDirectory;
    return opts;
  }

  return self;
}

module.exports = executionContext;
