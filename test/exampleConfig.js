// this is an example configuration for a repository
// this is the vision of where this is going as far as a framework
// for screenshotting repos
timelapse = require('webapp-timelapse');

timelapse.clone("http://github.com/ryanseddon/font-dragr").then(function(repo) {

  var serverProcess = undefined;

  function updateDeprecatedModules(checkout) {
    checkout.execute('sed -i "s/grunt-bower-hooks/grunt-bower-requirejs/ ./package.json"');
  }

  function install(checkout) {
    checkout.execute('npm install');
    checkout.execute('bower install --dev');
  }

  function startServer(checkout) {
    serverProcess = checkout.executeAsync('grunt server');
  }

  function killServer() {
    serverProcess.kill();
  }

  repo.from(repo.firstCommit).beforeAll(function (checkout) {
    updateDeprecatedModules(checkout);
    install(checkout);
    startServer(checkout);
  }).afterAll(function(checkout) {
    killServer();
  });

  repo.snapshot('./screenshots');

  repo.cleanup();
})
