'use strict';

global.Promise = global.Promise || require('lie');
var chai = require('chai')
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;
var syncWrapper = require('../lib/syncWrapper');

describe('sychronous wrapper experiment', function() {
  it('should make sure that functions are called in sequence', function() {
    var testObj = {
      count: 0,
      quickFunc: function() {
        var self = this;
        return new Promise(function(resolve) {
          resolve(++self.count);
        });
      },
      slowFunc: function() {
        var self = this;
        return new Promise(function(resolve) {
          setTimeout(function() {
            resolve(++self.count);
          }, 1000);
        })
      }
    };

    var wrappedObject = syncWrapper(testObj);

    var one = wrappedObject.slowFunc();
    var two = wrappedObject.quickFunc();

    return Promise.all([
      expect(one).to.eventually.equal(1),
      expect(two).to.eventually.equal(2)]);
  });

  it('should provide a call callback to call an arbitrary function on the chain', function() {
    var wrappedObject = syncWrapper({});

    var response = wrappedObject.call(function() {
      return 1;
    });

    return expect(response).to.eventually.equal(1);
  })

  it('should provide a whenDone function to return a promise that resolves then the chain is done', function() {
    var testObj = {
      func: function() {
        return new Promise(function(resolve) {
          setTimeout(resolve, 1000);
        });
      }
    };

    var wrappedObject = syncWrapper(testObj);

    wrappedObject.func();

    return expect(wrappedObject.whenDone()).to.be.fulfilled;
  });

  it('should translate promise arguments to their resolutions to make the underlying call', function () {
    var testObj = {
      func: function(value) {
        return ++value;
      }
    };

    var wrappedObject = syncWrapper(testObj);

    var testValue = 3;

    var three = wrappedObject.func(Promise.resolve(testValue));

    return expect(three).to.eventually.equal(testValue+1);
  });
})
