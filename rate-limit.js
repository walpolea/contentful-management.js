/**
 * Promise-based rate limiting of a function. Assumes that the passed in
 * function will return a Promise.
 */
'use strict';

var Promise = require('bluebird');

module.exports = function (count, delay, fn) {
  count = parseInt(count, 10);
  if (isNaN(count) || count < 1) {
    throw new TypeError('count must be greater than 0');
  }

  var sem = count;
  var callQueue = [];

  function shift () {
    if (sem < 1) {
      return;
    }
    var call = callQueue.shift();
    if (call) {
      sem--;

      try {
        call.resolve(fn.apply(call.self, call.args).finally(shift));
      } catch (err) {
        call.reject(err);
      }

      setTimeout(function () {
        sem++;
        shift();
      }, delay);
    }
  }

  return function () {
    var self = this;
    var args = Array.prototype.slice.call(arguments);
    return new Promise(function (resolve, reject) {
      callQueue.push({
        reject: reject,
        resolve: resolve,
        self: self,
        args: args
      });
      shift();
    });
  };
};
