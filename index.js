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

    client.on('psubscribe', function(room, count) {
      debug('[ Subscriber: Subscribed ]', { room: room, count: count });
      this.emit('subscribed', room);
    }.bind(this));

    client.on('punsubscribe', function(room, count) {
      debug('[ Subscriber: Unsubscribed ]', { room: room, count: count });
      this.emit('unsubscribed', room);
    }.bind(this));

    client.on('pmessage', function(room, channel, message) {
      debug('[ Subscriber: Message ]', { room: room, message: message });
      this.emit('message', room, message);
    }.bind(this));

    client.on('end', function() {
      debug('[ Subscriber: Disconnected ]');
      this.emit('disconnected');
    }.bind(this));
  };

  RedisSubscriber.prototype.subscribe = function(room) {
    debug('[ Subscriber: Subscribing ]', { room: room });
    this.client.psubscribe(room);
  };

  RedisSubscriber.prototype.unsubscribe = function(room) {
    debug('[ Subscriber: Unsubscribing ]', { room: room });
    this.client.punsubscribe(room);
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
