var util = require('util'),
    sinon = require('sinon'),
    assert = require('chai').assert,
    EventEmitter = require('events'),
    RedisSubscriberAdapter = require('../'),
    options = {},
    client, adapter;

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

function getClient() {
  return new FakeClient();
}

function getAdapter(opts) {
  return new RedisSubscriberAdapter(opts);
}

describe('RedisSubscriberAdapter', function () {
  beforeEach(function beforeEach(done) {
    client = getClient();

    adapter = getAdapter(client);
    done();
  });

  afterEach(function afterEach(done) {
    adapter = null;
    client = null;
    done();
  });

  it('should subscribe to keys', function(done) {
    adapter.on('subscribed', function(key) {
      assert.strictEqual(key, 'some-key');
      done();
    });

    adapter.subscribe('some-key');
  });

  it('should emit published messages', function(done) {
    var expected_key = 'some-key',
        expected_message = 'some-message';

    adapter.on('message', function(actual_key, actual_message) {
      assert.strictEqual(actual_key, expected_key);
      assert.strictEqual(actual_message, expected_message);
      done();
    });

    client.emit('pmessage', expected_key, 'some-channel', expected_message);
  });

  it('should unsubscribe from keys', function(done) {
    adapter.on('unsubscribed', function(key) {
      assert.strictEqual(key, 'some-key');
      done();
    });

    adapter.unsubscribe('some-key');
  });

  it('should emit an error when the client emits an error', function(done) {
    var error = new Error( 'Some error' );

    adapter.on('error', function(e) {
      assert.instanceOf(e, Error);
      done();
    });

    client.emit('error', error);
  });
});