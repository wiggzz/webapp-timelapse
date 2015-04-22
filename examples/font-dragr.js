'use strict'

var timelapse = require('../lib/timelapse');
var path = require('path');
var fs = require('fs');

var browserOptions = {
  baseUrl: 'http://localhost:9000'
};

var repositoryUrl = 'https://github.com/ryanseddon/font-dragr';
//var repositoryUrl = 'file://'+path.join(__dirname,'../font-dragr'); // we can also clone local repos

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

var screenshotDir = './screenshots';

fs.mkdir(screenshotDir, function(err) {
  if (err && err.code != 'EEXIST') throw err;
});

function screenshotPath(commit) {
  return path.join(screenshotDir, commit.date().getTime().toString() + commit.sha().slice(0,10) + '.png');
}

var browser = timelapse.browser(browserOptions);
var repo = timelapse.clone(repositoryUrl);

repo.select()
  .from('0134fb69cf')
  .to('2d2d3f26e6')
  .forEach(function(commit) {
    return repo.context(function(ctx) {
      var child = installAndStartServer(ctx);

      ctx.call(function() {
        // use context.call() in order to get it to execute after
        // the previous contextual statements... these are all wrapped
        // async calls.
        return browser.saveScreenshot('/',screenshotPath(commit));
      });

      teardownServer(ctx, child);

      return ctx.whenDone();
    });
  }).apply()

.then(repo.cleanup)

.then(browser.shutdown)

.then(function() {
  console.log('Done');
  process.exit(0); // workaround until nodegit PR #546 appears on npm
}, function(err) {
  console.log('Uncaught error: ' + err);
  process.exit(1);
});
