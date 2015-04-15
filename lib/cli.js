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

  RepoWrapper(argv.url, argv.local)
    .then(snapshotRepository,
    function(err) {
      console.log('Opening repo failed: ' + err);
      throw err;
    })
    .done(function() {
      console.log('Exiting...');
      // workaround for nodegit exit issue...
      process.exit(0);
    });

  function snapshotRepository(repo) {
    console.log('Snapshotting repository');
    return BrowserWrapper(browserOpts)
      .then(function (browser) {
        return walkCommits(repo, browser);
      })
      .then(shutdownBrowser);
  };

  function walkCommits(repo, browser) {
    console.log('Walking commits');
    return repo.walkCommits(function (commit) {
        return snapshotCommit(browser, commit);
      }, argv.max).then(function() {
        return browser;
      });
  };

  function shutdownBrowser(browser) {
    return browser.shutdown();
  };

  function snapshotCommit(browser, commit) {
    console.log('Snapshotting commit ' + commit.sha());
    return preScreenshot().then(function() {
        browser.getDriver().sleep(1000); // wait for server to livereload
        return saveScreenshot(browser, commit);
      }).then(null, function(err) {
        console.log('Screenshotting failed: ' + err);
      }).then(postScreenshot);
  };

  function preScreenshot() {
    return new Promise(function (resolve, reject) {
      console.log('Running pre-screenshot commands');
      if (!argv.start) {
        resolve();
      } else {
        exec(argv.start, function (error, stdout, stderr) {
          if (error) { reject('Start command failed with error code' + error.code); }
          resolve();
        });
      }
    })
  };

  function saveScreenshot(browser, commit) {
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
    });
  };

  function postScreenshot() {
    console.log('Running post-screenshot command');
    return Promise.resolve();
  };

  function screenshotPath(commit) {
    return path.join(argv.output, commit.date().getTime().toString() + commit.sha().slice(0,10) + '.png');
  };
};

var printHelp = function() {
  printVersion();
  console.log(
    '--local LOCAL_REPOSITORY   Location of the local repository to work on...working\n'+
    '                           directory for remote repos\n'+
    '--max NUMBER_OF_COMMITS    Number of commits to walk through\n'+
    '--baseUrl SERVER_URL       Url to request when running protractor\n'+
    '--protractorConfig PATH_TO_PROTRACTOR_CONFIG    Specifies an optional protractor\n'+
    '                                                configuration to use.\n'+
    '--start START_COMMAND      A command run every time a commit is checked out, to \n'+
    '                           prepare the repository\n'+
    '--finish FINISH_COMMAND    [Not implemented yet... ] A command run after \n'+
    '                           attempting to snapshot a commit. Should run every \n'+
    '                           time\n'+
    '--url REMOTE_REPOSITORY    A remote repository to pull down into the --local \n'+
    '                           directory\n');
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
