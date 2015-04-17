'use strict'

var timelapse = require('../lib/timelapse');
var path = require('path');

timelapse.clone('file://'+path.join(__dirname,'../font-dragr'))

.then(function (repo) {
  console.log('Repository cloned');

  return repo.select()
    //.from(timelapse.commitMatcher('a9866e6084'))
    //.to(timelapse.commitMatcher('4991f9761c'))
    .beforeAll(function (checkout) {
      console.log('This runs before all the commit actions.');
    }).afterAll(function(checkout) {
      console.log('This runs after all the commit actions.');
    }).forEach(function(checkout) {
      console.log('This runs for each commit.');
    }).apply();
})

.then(function(repo){
  console.log('cleaning up...');
  return repo.cleanup();
})

.then(function() {
  console.log('Repository cleaned up.');
});
