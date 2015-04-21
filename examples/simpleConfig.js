'use strict'

var timelapse = require('../lib/timelapse');
var path = require('path');

var browserOptions = {
  baseUrl: 'http://localhost:9000'
};

var repositoryUrl = 'file://'+path.join(__dirname,'../font-dragr');

function installAndStartServer(ctx) {
  ctx.exec('sed -i.bak "s/\\"grunt-bower-hooks\\": \\"~0.2.0\\"/\\"grunt-bower-requirejs\\": \\"~0.4.0\\"/" package.json');
  ctx.exec('npm install');
  ctx.exec('bower install --dev');
  var child = ctx.spawn('grunt server');
  ctx.wait(2000);
  return child;
}

function teardownServer(ctx, child) {
  ctx.kill(child);
  ctx.exec('npm uninstall');
}

var browser = timelapse.browser(browserOptions);
var repo = timelapse.clone(repositoryUrl);

repo.select()
  .from('a9866e6084')
  .to('4991f9761c')
  .forEach(function(commit) {
    return repo.context(function(ctx) {
      var child = installAndStartServer(ctx);

      ctx.saveScreenshot(browser, commit);

      teardownServer(ctx, child);

      return ctx.whenDone();
    });
  }).apply()

.then(repo.cleanup)

.then(browser.shutdown);
