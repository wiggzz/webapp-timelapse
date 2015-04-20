'use strict'

var timelapse = require('../lib/timelapse');
var path = require('path');

var browserOptions = {
  baseUrl: 'http://localhost:9000'
};

var repositoryUrl = 'file://'+path.join(__dirname,'../font-dragr');

function installAndStartServer(repo) {
  console.log('Installing and starting server..');
  return repo.in(function(ctx) {
    ctx.exec('sed -i.bak "s/\\"grunt-bower-hooks\\": \\"~0.2.0\\"/\\"grunt-bower-requirejs\\": \\"~0.4.0\\"/" package.json');
    ctx.exec('npm install');
    ctx.exec('bower install --dev');
    var child = ctx.spawn('grunt server');
    ctx.wait(2000);
    return child;
  });
}

function teardownServer(repo, child) {
  return repo.in(function(ctx) {
    ctx.kill(child);
    ctx.exec('npm uninstall');
  });
}

timelapse.promise.all([
  timelapse.browser(browserOptions),
  timelapse.clone(repositoryUrl)
  ])

.then(function(res) {
  console.log('Browser created and repository cloned');
  var browser = res[0];
  var repo = res[1];

  return repo.select()
    .from('a9866e6084')
    .to('4991f9761c')
    .forEach(function(commit) {
      return installAndStartServer(repo).then(function(child) {
        return timelapse.saveScreenshot(browser, commit)
          .then(function () {
            return teardownServer(repo, child);
          });
        });
    }).apply()

    .then(function() {
      return timelapse.promise.all([
        repo.cleanup(),
        browser.shutdown()
      ]);
    });
})

.then(function() {
  console.log('done');
  process.exit(0);
});
