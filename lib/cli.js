'use strict';

var minimist = require('minimist');
var path = require('path');
var git = require('nodegit');
var Promise = require('nodegit-promise');
var Snapshot = require('./snapshot');

exports.run = function() {
  var argv = minimist(process.argv.slice(2));

  // the process:
  // optionally open configuration file
  // optionally clone a repo

  if (argv.help) {
    printHelp();
    process.exit(0);
  }

  if (argv.version) {
    printVersion();
    process.exit(0);
  }

  if (!argv.local) argv.local = './';

  var snapshotOpts = parseSnapshotOptions(argv);

  getRepo(argv.url,argv.local).then(function(repo) {
    // snapshot configuration might be inside repository
    return Promise.all([
      Snapshot(snapshotOpts),
      repo.getMasterCommit()
    ]);
  }, function (reason) {
    console.log('Couldn\'t get repository: ' + reason);
  }).then(function(res) {
    var snapshot = res[0];
    var firstCommit = res[1];
    return walkCommits(firstCommit, function(commit) {
      console.log('commit ' + commit.sha());
      console.log('Date: ' + commit.date());
      snapshot.take();
    }).then(function() {
      return snapshot.shutdown();
    });
  }).done(function() {
    // workaround for nodegit exit issue...
    process.exit(0);
  });

  // checkout requested commit
  // launch server
  // launch protractor and website
  // take screenshot
  // shutdown protractor/server
  // repeat
  // done.

};

var printHelp = function() {
  console.log('TODO: help');
};

var printVersion = function() {
  console.log('Version ' + require(path.join(__dirname, '../package.json')).version);
};

var parseSnapshotOptions = function(argv) {
  var snapshotOpts = {}

  if (argv.protractorConfigFile) {
    snapshotOpts.configFile = argv.protractorConfigFile;
  } else {
    console.log('No protractor config specified, using defaults.');
    snapshotOpts.additionalConfig = require('./protractorDefaults.conf.js').config;
  }

  if (argv.seleniumAddress) snapshotOpts.additionalConfig.seleniumAddress = argv.seleniumAddress;
  console.log('Selenium Address: ' + snapshotOpts.additionalConfig.seleniumAddress);
  if (argv.serverUrl) snapshotOpts.additionalConfig.baseUrl = argv.serverUrl;

  return snapshotOpts;
}

var getRepo = function(repoUrl, localPath) {
  localPath = path.resolve(localPath);

  if (!repoUrl) {
    return openRepo(localPath);
  } else {
    return cloneRepo(repoUrl, localPath);
  }
};

var cloneRepo = function(repoUrl, localPath) {
  console.log('Cloning "' + repoUrl +'" into "' + localPath + '"');

  var cloneOptions = {};

  // override cert check for mac os x!
  if (/^https/.test(repoUrl) && process.platform == "darwin") {
    console.log('Warning: overriding certificate check for Mac OS X');
    cloneOptions.remoteCallbacks = {
      certificateCheck: function() { return 1; }
    };
  }

  return git.Clone(repoUrl, localPath, cloneOptions);
};

var openRepo = function(repoPath) {
  console.log('Opening repo "' + repoPath);
  return git.Repository.open(repoPath);;
};

var walkCommits = function(firstCommit, callBack) {
  return new Promise(function(resolve, reject) {
    var history = firstCommit.history();

    history.on("commit", callBack);

    history.on("end", function() {
      resolve();
    });

    history.start();
  });
};
