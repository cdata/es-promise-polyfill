// Adapted from https://github.com/domenic/promises-unwrapping/blob/master/reference-implementation/lib/aplus-adapter.js

var Promise = require('../es-promise-polyfill');

exports.deferred = function () {
  var resolvePromise, rejectPromise;
  var promise = new Promise(function(resolve, reject) {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  return {
    promise: promise,
    resolve: resolvePromise,
    reject: rejectPromise
  };
};

exports.resolved = Promise.resolve.bind(Promise);

exports.rejected = Promise.reject.bind(Promise);
