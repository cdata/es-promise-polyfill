(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.Promise = root.Promise || factory();
    root.PromisePolyfill = factory();
  }
}(this, (function (root) {

  return function () {

    var isFunction = function (obj) {
      return !!(obj && typeof obj === 'function');
    };

    var isPromise = function (obj) {
      return !!(obj instanceof Promise);
    };

    var isThenable = function (obj) {
      var type;

      if (obj === null) {
        return false;
      }

      type = typeof obj;

      return !!((type === 'object' || type === 'function') &&
                'then' in obj);
    };

    var setImmediate = (function () {
      if (root.setImmediate) {
        return root.setImmediate;
      } else if (root.requestAnimationFrame) {
        return root.requestAnimationFrame;
      }

      return function (fn) {
        root.setTimeout(fn, 0);
      };
    })();

    var bind = function (fn, context) {
      if (fn.bind) {
        return fn.bind(context);
      }

      return function () {
        return fn.apply(context, arguments);
      };
    };


    function Deferred(promise) {
      this.state = Deferred.state.PENDING;
      this.promise = promise;
      this.result = null;

      this.pendingFulfillmentHandlers = [];
      this.pendingRejectionHandlers = [];
    }

    Deferred.state = {
      PENDING: 'pending',
      FULFILLED: 'fulfilled',
      REJECTED: 'rejected'
    };

    Deferred.prototype.resolve = function (value) {
      var then;

      if (!this.isPending()) {
        return;
      }

      try {
        if (isPromise(value)) {
          return value.then(bind(this.resolve, this), bind(this.reject, this));
        } else if (isThenable(value)) {
          then = value.then;

          if (isFunction(then)) {
            return bind(function () {
              var pending = true;

              try {
                return then.call(value, bind(function (result) {
                  if (!pending) {
                    return;
                  }
                  pending = false;
                  this.resolve(result);
                }, this), bind(function (error) {
                  if (!pending) {
                    return;
                  }
                  pending = false;
                  this.reject(error);
                }, this));
              } catch(e) {
                if (!pending) {
                  return;
                }
                pending = false;
                this.reject(e);
              }
            }, this)();
          }
        }
      } catch(e) {
        return this.reject(e);
      }

      this.result = value;

      this.state = Deferred.state.FULFILLED;

      setImmediate(bind(function () {
        var onFulfilled;

        while (onFulfilled = this.pendingFulfillmentHandlers.shift()) {
          onFulfilled(value);
        }
      }, this));
    };

    Deferred.prototype.reject = function (error) {
      if (!this.isPending()) {
        return;
      }

      this.result = error;

      this.state = Deferred.state.REJECTED;

      setImmediate(bind(function() {
        var onRejected;

        while (onRejected = this.pendingRejectionHandlers.shift()) {
          onRejected(error);
        }
      }, this));
    };

    Deferred.prototype.whenResolved = function (fn) {
      if (this.isFulfilled()) {
        return setImmediate(bind(function() {
          fn(this.result);
        }, this));
      }

      if (!this.isPending()) {
        return;
      }

      this.pendingFulfillmentHandlers.push(fn);
    };

    Deferred.prototype.whenRejected = function (fn) {
      if (this.isRejected()) {
        return setImmediate(bind(function() {
          fn(this.result);
        }, this));
      }

      if (!this.isPending()) {
        return;
      }

      this.pendingRejectionHandlers.push(fn);
    };

    Deferred.prototype.isPending = function () {
      return this.state === Deferred.state.PENDING;
    };

    Deferred.prototype.isFulfilled = function () {
      return this.state === Deferred.state.FULFILLED;
    };

    Deferred.prototype.isRejected = function () {
      return this.state === Deferred.state.REJECTED;
    };


    function Promise(resolver) {
      var deferred = this.__deferred__ = new Deferred(this);

      if (!resolver) {
        throw new Error('Promise constructor takes a function argument');
      }

      resolver(bind(deferred.resolve, deferred),
               bind(deferred.reject, deferred));
    }

    Promise.prototype.then = function (onFulfilled, onRejected) {
      var promise = new Promise(function(resolve, reject) {
        resolvePromise = resolve;
        rejectPromise = reject;
      });
      var resolvePromise;
      var rejectPromise;

      this.__deferred__.whenResolved(function (value) {
        var result;

        if (isFunction(onFulfilled)) {
          try {
            result = onFulfilled(value);
          } catch (e) {
            return rejectPromise(e);
          }
        } else {
          result = value;
        }

        if (result === promise) {
          return rejectPromise(new TypeError());
        }

        resolvePromise(result);
      });

      this.__deferred__.whenRejected(function (error) {
        var result;

        if (isFunction(onRejected)) {
          try {
            result = onRejected(error);
          } catch (e) {
            return rejectPromise(e);
          }
        } else {
          return rejectPromise(error);
        }

        if (result === promise) {
          return rejectPromise(new TypeError());
        }

        resolvePromise(result);
      });

      return promise;
    };

    Promise.all = function () {

    };

    Promise.cast = function () {

    };

    Promise.resolve = function (value) {
      return new Promise(function (resolve, reject) {
        resolve(value);
      });
    };

    Promise.reject = function (error) {
      return new Promise(function (resolve, reject) {
        reject(error);
      });
    };

    Promise.race = function () {

    };

    return Promise;
  };

}(typeof global !== 'undefined' ? global : this))));
