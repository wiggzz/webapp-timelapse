'use strict';

var minimist = require('minimist');
var path = require('path');
var BrowserWrapper = require('./browserWrapper');
var RepoWrapper = require('./repoWrapper');
var Promise = require('nodegit-promise');
var exec = require('child_process').exec;
var fs = require('fs');

exports.run = function() {
  var argv = minimist(process.argv.slice(2));


  if (argv.help) {
    printHelp();
    process.exit(0);
  }

  if (argv.version) {
    printVersion();
    process.exit(0);
  }

  if (!argv.local) argv.local = './';

  if (!argv.output) argv.output = './screenshots';

  var browserOpts = parseBrowserOptions(argv);

  RepoWrapper(argv.url,argv.local).then(function(repo) {
    return snapshotRepository(repo, browserOpts);
  }, function(err) {
    console.log('Couldn\'t open repository:' + err);
    throw err;
  }).done(function() {
    // workaround for nodegit exit issue...
    process.exit(0);
  });

  var snapshotRepository = function(repo, browserOpts) {
    return BrowserWrapper(browserOpts).then(function (browser) {
      console.log('Snapshot started, walking commits.');
      return repo.walkCommits(function (commit) {
        return snapshotCommit(browser, commit);
      }, argv.max).then(function() {
        return browser.shutdown();
      }, function(err) {
        console.log('Couldn\'t walk commits: ' + err);
        throw err;
      });
    }, function (err) {
      console.log('Couldn\'t start snapshot: ' + err);
      throw err;
    });
  };

  var snapshotCommit = function(browser, commit) {
    return new Promise(function (resolve, reject) {
      if (!argv.start) {
        resolve();
      } else {
        exec(argv.start, function (error, stdout, stderr) {
          if (error) { reject('Start command failed with error code' + error.code); }
          resolve();
        });
      }
    }).then(function() {
      return saveScreenshot(browser, commit);
    }, function(err) {
      console.log('Couldn\'t execute start command: ' + err);
      throw err;
    });
  }

  var saveScreenshot = function(browser, commit) {
    return browser.takeScreenshot().then(function (png) {
      return new Promise(function (resolve, reject) {
        if (!png) reject('No png to save');
        var path = screenshotPath(commit)
        var stream = fs.createWriteStream(path);
        if (!stream) reject('Unable to open screenshot path: ' + path);
        stream.write(new Buffer(png, 'base64'));
        stream.end();
        resolve();
      });
    },function(reason) {
      console.log('Snapshot failed: ' + reason);
      throw reason;
    });
  };

  var screenshotPath = function(commit) {
    return path.join(argv.output, commit.date().getTime().toString() + commit.sha().slice(0,10) + '.png');
  };
};

var printHelp = function() {
  console.log('TODO: help');
};

var printVersion = function() {
  console.log('Version ' + require(path.join(__dirname, '../package.json')).version);
};

var parseBrowserOptions = function(argv) {
  var browserOpts = {}

  if (argv.protractorConfigFile) {
    browserOpts.configFile = argv.protractorConfigFile;
  } else {
    console.log('No protractor config specified, using defaults.');
    browserOpts.additionalConfig = require('./protractorDefaults.conf.js').config;
  }

  if (argv.seleniumAddress) browserOpts.additionalConfig.seleniumAddress = argv.seleniumAddress;
  console.log('Selenium Address: ' + browserOpts.additionalConfig.seleniumAddress);
  if (argv.baseUrl) browserOpts.additionalConfig.baseUrl = argv.baseUrl;

  return browserOpts;
}
