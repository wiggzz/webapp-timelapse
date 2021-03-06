'use strict';

var protractor  = require('protractor');
var protractorModule = require.cache[require.resolve('protractor')];
var protractorConfigParser = protractorModule.require('./configParser');
var protractorRunner = protractorModule.require('./runner');

module.exports = function(opts) {
  var browserWrapper = {};

  if (!opts) opts = {};
  if (!opts.url) opts.url = '/';
  if (!opts.configFile && !opts.additionalConfig) opts.additionalConfig = require('./protractorDefaults.conf.js').config;
  if (opts.baseUrl) opts.additionalConfig.baseUrl = opts.baseUrl;

  var config = getConfig(opts.configFile, opts.additionalConfig);

  var runner = runnerWrapper(config);

  var browser;

  browserWrapper.takeScreenshot = function (url) {
    if (!url) url = opts.url;

    return browser.get(url, 5000).then(function() {
      console.log('Taking screenshot of ' + url);
      return browser.takeScreenshot();
    }, function(err) {
      console.log('Failed to get ' + url + ': ' + err);
      throw err;
    });
  };

  browserWrapper.getDriver = function() {
    return browser;
  };

  browserWrapper.shutdown = function() {
    return runner.closeBrowser();
  };

  function getConfig(configFile, additionalConfig) {
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

  return runner.startBrowser().then(function(b) {
    browser = b;
    return browserWrapper;
  }, function(err) {
    console.log('Failed to start browser: ' + err);
    throw err;
  });
};

var runnerWrapper = function(config) {
  var runnerWrapper = {};

  var runner = new protractorRunner(config);

  var browser;

  runnerWrapper.startBrowser = function(config) {
    if (browser) return Promise.resolve(browser);

    return runner.driverprovider_.setupEnv().then(function() {
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
  };

  return runnerWrapper;
};
