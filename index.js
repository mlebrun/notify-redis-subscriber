/*globals module */
var debug = require('debug')('notify:RedisSubscriber'),
    util = require('util'),
    Redis = require('redis'),
    EventEmitter = require('events');

(function() {
  'use strict';

  function RedisSubscriber(options) {
    this.opts = options || {};

    EventEmitter.call(this);
  }

  RedisSubscriber.prototype.bindListeners = function(client) {
    client.on('error', function(error) {
      debug('[ Subscriber: Error ]', { error: error });
      this.emit('error', error);
    }.bind(this));

    client.on('ready', function() {
      debug('[ Subscriber: Connected ]');
      this.emit('connected');
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

    client.on('end', function() {
      debug('[ Subscriber: Disconnected ]');
      this.emit('disconnected');
    }.bind(this));
  };

  RedisSubscriber.prototype.subscribe = function(key) {
    debug('[ Subscriber: Subscribing ]', { key: key });
    this.client.psubscribe(key);
  };

  RedisSubscriber.prototype.unsubscribe = function(key) {
    debug('[ Subscriber: Unsubscribing ]', { key: key });
    this.client.punsubscribe(key);
  };

  RedisSubscriber.prototype.connect = function(client) {
    debug('[ Subscriber: Connecting ]');
    this.client = client || Redis.createClient(this.opts.port || null, this.opts.host || null);
    this.bindListeners(this.client);
  };

  RedisSubscriber.prototype.quit = function() {
    debug('[ Subscriber: Disconnecting ]');
    this.client.quit();
  };

  util.inherits(RedisSubscriber, EventEmitter);

  module.exports = RedisSubscriber;
}());
