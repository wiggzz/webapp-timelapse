'use strict';

var minimist = require('minimist');
var path = require('path');
var Snapshot = require('./snapshot');
var RepoWrapper = require('./repoWrapper');

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

  RepoWrapper(argv.url,argv.local).then(function(repo) {
    // snapshot configuration might be inside repository
    return Snapshot(snapshotOpts).then(function (snapshot) {
      return repo.walkCommits(function() {
        return snapshot.take();
      }).then(function() {
        return snapshot.shutdown();
      });
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
