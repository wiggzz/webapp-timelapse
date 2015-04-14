'use strict';

var git = require('nodegit');
var protractor  = require('protractor');
var protractorModule = require.cache[require.resolve('protractor')];
var protractorConfigParser = protractorModule.require('./configParser');
var protractorRunner = protractorModule.require('./runner');
var Promise = require('nodegit-promise');

module.exports = function(opts) {
  var Snapshot = {};

  if (!opts) opts = {};
  if (!opts.url) opts.url = '/';

  var config = getConfig(opts.configFile, opts.additionalConfig);

  var runner = runnerWrapper(config);

  Snapshot.take = function (url) {
    if (!url) url = opts.url;

    return new Promise(function(resolve, reject) {
      console.log('Taking screenshot of ' + url);
      resolve();
    });
  };

  Snapshot.shutdown = function() {
    return runner.closeBrowser();
  };

  return runner.startBrowser().then(function(b) {
    return Snapshot;
  });
};

var getConfig = function(configFile, additionalConfig) {
  console.log('Opening protractor config...');
  var configParser = new protractorConfigParser();

  if (configFile) {
    configParser.addFileConfig(configFile);
  }
  if (additionalConfig) {
    configParser.addConfig(additionalConfig);
  }

  return configParser.getConfig();
}

var runnerWrapper = function(config) {
  var runnerWrapper = {};

  var runner = new protractorRunner(config);

  runnerWrapper.startBrowser = function(config) {
    console.log('Creating browser...');

    return runner.driverprovider_.setupEnv().then(function() {
      return runner.createBrowser();
    });
  };

  runnerWrapper.closeBrowser = function(config) {
    console.log('Shutting down browser...');

    return runner.driverprovider_.teardownEnv();
  };

  return runnerWrapper;
};

// couple of different paths to take here...
// could run each screenshot as a spec in a custom framework and inject
// the specs into protractor and have it launch webdriver and
// run config, etc.
// or, we do a stripped down version of webdriver construction
// with some configuration pulled from the default protractor
// config file or from our command line
// that simply loads each page and then takes a screenshot
// without all the hoo hah.

// i like option 2 more but it may be significantly more work.

// things to do in order to get protractor webdriver up and running:
// 1. load configuration from file ...  config = ConfigParser().addFileConfig(configFile)
// 2. create browser... browser = Runner(config).createBrowser()
// 3. do what we need to with browser
// 4. close browser...
