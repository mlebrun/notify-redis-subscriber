/*globals module */
var debug = require('debug')('notify:RedisSubscriberAdapter'),
    util = require('util'),
    EventEmitter = require('events');

(function() {
  'use strict';

  function RedisSubscriberAdapter(client) {
    this.client = client;
    this.bindListeners(this.client);

    EventEmitter.call(this);
  }

  RedisSubscriberAdapter.prototype.bindListeners = function(client) {
    client.on('error', function(error) {
      debug('[ Subscriber: Error ]', { error: error });
      this.emit('error', error);
    }.bind(this));

    client.on('psubscribe', function(key, count) {
      debug('[ Subscriber: Subscribed ]', { key: key, count: count });
      this.emit('subscribed', key);
    }.bind(this));

    client.on('punsubscribe', function(key, count) {
      debug('[ Subscriber: Unsubscribed ]', { key: key, count: count });
      this.emit('unsubscribed', key);
    }.bind(this));

    client.on('pmessage', function(key, channel, message) {
      debug('[ Subscriber: Message ]', { key: key, message: message });
      this.emit('message', key, message);
    }.bind(this));
  };

  RedisSubscriberAdapter.prototype.subscribe = function(key) {
    debug('[ Subscriber: Subscribing ]', { key: key });
    this.client.psubscribe(key);
  };

  RedisSubscriberAdapter.prototype.unsubscribe = function(key) {
    debug('[ Subscriber: Unsubscribing ]', { key: key });
    this.client.punsubscribe(key);
  };

  util.inherits(RedisSubscriberAdapter, EventEmitter);

  module.exports = RedisSubscriberAdapter;
}());
