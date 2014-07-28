var adapter = require('./aplus-adapter');
var Promise = require('../es-promise-polyfill');
var assert = require('assert');

function PendingPromise() {
  return adapter.deferred().promise;
}

function RejectedPromise() {
  var deferred = adapter.deferred();
  deferred.reject('reason');
  return deferred.promise;
}

function ResolvedPromise() {
  var deferred = adapter.deferred();
  deferred.resolve('value');
  return deferred.promise;
}

function EventuallyResolvedPromise() {
  var deferred = adapter.deferred();

  setTimeout(function () {
    deferred.resolve('value');
  }, Math.floor(Math.random() * 1000));

  return deferred.promise;
}

function EventuallyRejectedPromise() {
  var deferred = adapter.deferred();

  setTimeout(function () {
    deferred.reject('reason');
  }, Math.floor(Math.random() * 1000));

  return deferred.promise;
}

function IterableThatResolves() {
  var items = [];

  for (var i = 0; i < 3; ++i) {
    items.push(EventuallyResolvedPromise());
  }

  return items;
}

function IterableWithManyRejections() {
  var items = [];

  for (var i = 0; i < 3; ++i) {
    items.push(EventuallyRejectedPromise());
  }

  return items;
}

function IterableWithOneRejection() {
  var iterable = IterableThatResolves();

  iterable.push(EventuallyRejectedPromise());

  return iterable;
}

function AssertPromise(value) {
  assert.ok(value)
  assert.ok(value.constructor);
  assert.equal(value.constructor, Promise);
}

describe('Promise', function () {
  describe('all', function () {
    describe('when called', function () {
      it('returns a promise', function () {
        var promise = PendingPromise();

        AssertPromise(Promise.all());
      });

      describe('with an iterable argument', function () {
        describe('that is empty', function () {
          it('eventually resolves with an empty array', function (done) {
            var iterable = [];
            var promise = Promise.all(iterable);

            promise.then(function (values) {
              try {
                assert.equal(values.length, 0);
                done();
              } catch (e) {
                done(e);
              }
            });
          });
        });
        describe('yielding non-promise values', function () {
          describe('the returned promise', function () {
            it('resolves with an array of those values', function (done) {
              var iterable = [1, 2, 3];
              var promise = Promise.all(iterable);

              promise.then(function (values) {
                try {
                  assert.deepEqual(iterable, values);
                  done();
                } catch(e) {
                  done(e);
                }
              });
            });
          });
        });

        describe('yielding any promise values', function () {
          describe('that all resolve', function () {
            describe('the returned promise', function () {
              it('resolves with an array that includes the resolved values of any promises', function (done) {
                var iterable = IterableThatResolves();
                var promise = Promise.all(iterable);

                promise.then(function (values) {
                  try {
                    assert.deepEqual(['value', 'value', 'value'], values);
                    done();
                  } catch(e) {
                    done(e);
                  }
                });
              });
            });
          });

          describe('at least one of which rejects', function () {
            describe('the returned promise', function () {
              it('is rejected with the rejection of the first rejected promise', function (done) {
                var iterable = IterableWithOneRejection();
                var promise = Promise.all(iterable);

                promise.then(function () {
                  done(new Error('Promise should be rejected'));
                }).catch(function () {
                  done();
                });
              });
            });
          });
        });
      });
    });
  });

  describe('race', function () {
    describe('when called', function () {
      it('returns a promise', function () {
        var promise = PendingPromise();

        AssertPromise(Promise.all());
      });
    });
  });

  describe('cast', function () {
    describe('when called', function () {
      describe('with a Promise argument', function () {
        it('returns the same Promise instance', function () {
          var value = PendingPromise();
          var promise = Promise.cast(value);

          assert.strictEqual(value, promise);
        });
      });

      describe('with a non-Promise argument', function () {
        it('returns a Promise resolved with the argument value', function (done) {
          var value = 'value';
          var promise = Promise.cast(value);

          AssertPromise(promise);

          promise.then(function (value) {
            try {
              assert.equal('value', value);
              done();
            } catch(e) {
              done(e);
            }
          });
        });
      });
    });
  });

  describe('catch', function () {
    describe('when called', function () {
      it('returns a promise', function () {
        var promise = PendingPromise();

        AssertPromise(promise.catch());
      });

      describe('with a function argument', function () {
        describe('if the promise is rejected', function () {
          it('calls the function with the rejection reason', function (done) {
            var promise = RejectedPromise();

            promise.catch(function (reason) {
              try {
                assert.equal(reason, 'reason');
                done();
              } catch(e) {
                done(e);
              }
            });
          });
        });

        describe('if the promise is resolved', function () {
          it('does not call the function', function () {
            var promise = ResolvedPromise();

            promise.catch(function () {
              done(new Error('Catch should not be called.'));
            }).then(function () {
              done();
            });
          });
        });
      });
    });
  });
});
