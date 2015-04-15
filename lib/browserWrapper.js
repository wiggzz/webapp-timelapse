'use strict';

var protractor  = require('protractor');
var protractorModule = require.cache[require.resolve('protractor')];
var protractorConfigParser = protractorModule.require('./configParser');
var protractorRunner = protractorModule.require('./runner');
var Promise = require('nodegit-promise');

module.exports = function(opts) {
  var browserWrapper = {};

  if (!opts) opts = {};
  if (!opts.url) opts.url = '/';

  var config = getConfig(opts.configFile, opts.additionalConfig);

  var runner = runnerWrapper(config);

  var browser = undefined;

  browserWrapper.takeScreenshot = function (url) {
    if (!url) url = opts.url;

    console.log('Taking screenshot of ' + url);
    return browser.get(url, 5000).then(function() {
      return browser.takeScreenshot();
    }, function(err) {
      console.log('Failed to get ' + url + ': ' + err);
      throw err;
    });
  };

  browserWrapper.shutdown = function() {
    return runner.closeBrowser();
  };

  return runner.startBrowser().then(function(b) {
    browser = b;
    return browserWrapper;
  }, function(err) {
    console.log('Failed to start browser: ' + err);
    throw err;
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

  var browser = undefined;

  runnerWrapper.startBrowser = function(config) {
    if (browser) return Promise.resolve(browser);

    console.log('Creating browser...');
    return runner.driverprovider_.setupEnv().then(function() {
      console.log('Browser created.');
      browser = runner.createBrowser();
      return browser.getSession().then(function(session) {
        console.log('WebDriver session successfully started.');
        return browser;
      }, function(err) {
        console.log('Unable to start a WebDriver session.');
        throw err;
      });
    }, function(err) {
      console.log('Unable to setup environment: ' + err);
      throw err;
    });
  };

  runnerWrapper.closeBrowser = function(config) {
    console.log('Shutting down browser...');

    return runner.driverprovider_.teardownEnv();
  };

  runnerWrapper.browser = function() {
    return browser;
  }

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
