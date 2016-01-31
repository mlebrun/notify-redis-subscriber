var util = require('util'),
    sinon = require('sinon'),
    assert = require('chai').assert,
    EventEmitter = require('events'),
    RedisSubscriber = require('../'),
    options = {},
    client, subscriber;

function FakeClient() {
  EventEmitter.call(this);
}

util.inherits(FakeClient, EventEmitter);

FakeClient.prototype.psubscribe = function(key) {
  this.emit('psubscribe', key, 4);
};

FakeClient.prototype.punsubscribe = function(key) {
  this.emit('punsubscribe', key, 4);
};

FakeClient.prototype.quit = function() {
  this.emit('end');
};

function getClient() {
  return new FakeClient();
}

function getSubscriber(opts) {
  return new RedisSubscriber(opts);
}

describe('RedisSubscriber', function () {
  beforeEach(function beforeEach(done) {
    client = getClient();

    subscriber = getSubscriber(options);
    subscriber.connect(client);
    done();
  });

  afterEach(function afterEach(done) {
    subscriber = null;
    client = null;
    done();
  });

  it('should connect', function(done) {
    subscriber.on('connected', done);
    client.emit('ready');
  });

  it('should subscribe to keys', function(done) {
    subscriber.on('subscribed', function(key) {
      assert.strictEqual(key, 'some-key');
      done();
    });

    subscriber.subscribe('some-key');
  });

  it('should emit published messages', function(done) {
    var expected_key = 'some-key',
        expected_message = 'some-message';

    subscriber.on('message', function(actual_key, actual_message) {
      assert.strictEqual(actual_key, expected_key);
      assert.strictEqual(actual_message, expected_message);
      done();
    });

    client.emit('pmessage', expected_key, 'some-channel', expected_message);
  });

  it('should unsubscribe from keys', function(done) {
    subscriber.on('unsubscribed', function(key) {
      assert.strictEqual(key, 'some-key');
      done();
    });

    subscriber.unsubscribe('some-key');
  });

  it('should emit an error when the client emits an error', function(done) {
    var error = new Error( 'Some error' );

    subscriber.on('error', function(e) {
      assert.instanceOf(e, Error);
      done();
    });

    client.emit('error', error);
  });

  it('should disconnect', function(done) {
    subscriber.on('disconnected', done);
    subscriber.quit();
  });
});