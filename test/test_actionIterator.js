var chai = require('chai')
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;
var actionIterator = require('../lib/actionIterator');

var mockIterable = require('./mocks/mockIterable');
var mockActionProvider = require('./mocks/mockActionProvider');


describe('action iterator', function() {
  it('should call watcher.update for every item that has an action', function() {
    var iterable = mockIterable([1,2]);

    var calls = 0;

    var actionMap = {
      1: function(item) {
        calls++;
      }
    };

    var actionProvider = mockActionProvider(actionMap);

    var iterator = actionIterator(iterable, actionProvider);

    return iterator.start().then(function() {
      expect(calls).to.equal(1);
    });
  });

  it('should call done after all the actions', function() {
    var iterable = mockIterable([1]);

    var calls = 0;

    var doneAction = function() {
      calls++;
    };

    var actionProvider = mockActionProvider({}, doneAction);

    var iterator = actionIterator(iterable, actionProvider);

    return iterator.start().then(function() {
      expect(calls).to.equal(1);
    });
  });
})
