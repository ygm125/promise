(function(global, undefined) {
  var PENDING = undefined,
    FULFILLED = 1,
    REJECTED = 2;
  var isFunction = function(obj) {
    return 'function' === typeof obj;
  }
  var isArray = function(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  }
  var isBoolean = function(obj) {
    return obj != null && obj != undefined && (typeof obj == 'boolean' || typeof obj == 'number');
  }
  var isThenable = function(obj) {
    return obj && typeof obj['then'] == 'function';
  }
  var transition = function(status, value) {
    var promise = this;
    if (promise._status !== PENDING) return;
    setTimeout(0, function() {
      promise._status = status;
      publish.call(promise, value);
    });
  }
  var publish = function(val) {
    var promise = this,
      fn, st = promise._status === FULFILLED,
      queue = promise[st ? '_resolves' : '_rejects'];
    while (fn = queue.shift()) {
      val = fn.call(promise, val) || val;
    }
    promise[st ? '_value' : '_reason'] = val;
    promise['_resolves'] = promise['_rejects'] = undefined;
  }
  var Promise = function(resolver) {
    if (!isFunction(resolver)) {
      resolver = function(resolve, reject) {
        setTimeout(0, function() {
          resolve()
        })
      };
    }
    if (!(this instanceof Promise)) return new Promise(resolver);
    var promise = this;
    promise._value;
    promise._reason;
    promise._status = PENDING;
    promise._resolves = [];
    promise._rejects = [];
    var resolve = function(value) {
      transition.apply(promise, [FULFILLED].concat([value]));
    }
    var reject = function(reason) {
      transition.apply(promise, [REJECTED].concat([reason]));
    }
    resolver(resolve, reject);
  }
  Promise.prototype.then = function(onFulfilled, onRejected) {
    var promise = this;
    return Promise(function(resolve, reject) {

      function callback(value) {
        var ret,isf;
        try {
          isf = isFunction(onFulfilled)
          ret = isf && onFulfilled(value);
          if (ret == undefined || !isf) {
             ret = value
          }
          if (isThenable(ret)) {
            ret.then(function(value) {
              resolve(value);
            }, function(reason) {
              reject(reason);
            });
          } else {
            resolve(ret)
          }
        } catch (e) {
          reject(e)
        }
      }

      function errback(reason) {
        try {
          reason = isFunction(onRejected) && onRejected(reason) || reason;
        } catch (e) {
          reason = e
        }
        reject(reason);
      }
      if (promise._status === PENDING) {
        promise._resolves.push(callback)
        promise._rejects.push(errback)
      } else if (promise._status === FULFILLED) {
        callback(promise._value);
      } else if (promise._status === REJECTED) {
        errback(promise._reason);
      }
    });
  }
  Promise.prototype.catch = function(onRejected) {
    return this.then(undefined, onRejected)
  }
  Promise.prototype.delay = function(s, val) {
    return this.then(function(ori) {
      return Promise.delay(s, val || ori);
    })
  }
  Promise.delay = function(s, val) {
    return Promise(function(resolve, reject) {
      setTimeout(s, function() {
        resolve(val);
      });
    })
  }
  Promise.resolve = function(arg) {
    return Promise(function(resolve, reject) {
      resolve(arg)
    })
  }
  Promise.reject = function(arg) {
    return Promise(function(resolve, reject) {
      reject(arg)
    })
  }
  Promise.all = function(promises) {
    if (!isArray(promises)) {
      throw new TypeError('You must pass an array to all.');
    }
    return Promise(function(resolve, reject) {
      var i = 0,
        result = [],
        len = promises.length,
        count = len

      function resolver(index) {
        return function(value) {
          resolveAll(index, value);
        };
      }

      function rejecter(reason) {
        reject(reason);
      }

      function resolveAll(index, value) {
        result[index] = value;
        if (--count == 0) {
          resolve(result)
        }
      }
      for (; i < len; i++) {
        promises[i].then(resolver(i), rejecter);
      }
    });
  }
  Promise.race = function(promises) {
    if (!isArray(promises)) {
      throw new TypeError('You must pass an array to race.');
    }
    return Promise(function(resolve, reject) {
      var i = 0,
        len = promises.length;

      function resolver(value) {
        resolve(value);
      }

      function rejecter(reason) {
        reject(reason);
      }
      for (; i < len; i++) {
        promises[i].then(resolver, rejecter);
      }
    });
  }

  Promise.prototype.until = function(func, timeout, stepTime, timeoutMsg) {
    return this.then(function() {
      return Promise.until(func, timeout, stepTime, timeoutMsg);
    })
  }
  // 递归执行 直到 func 返回true 或 超时
  Promise.until = function(func, timeout = 5, stepTime = .5, timeoutMsg) {
    if (!isFunction(func)) {
      throw new TypeError('You must pass an function.');
    }
    var p = function(count) {
      return Promise().delay(stepTime).then(function(){
        if (count <= 0) {
          if (timeoutMsg && timeoutMsg.length > 0) {
            throw timeoutMsg
          }
          return false;
        }
        var ret = func(count);
        if (!ret) {
          return p(count-1);
        } else {
          return true;
        }
      });
    }
    return p(timeout*(1.0/stepTime));
  }
  
  Promise.prototype.forEach = function(items, func) {
    return this.then(function() {
      return Promise.forEach(items, func);
    })
  }

  // 递归串行promise
  Promise.forEach = function(items, func) {
    if (!items) {
      return Promise()
    }
    let i = 0
    if (!isArray(items)) {
      throw new TypeError('You must pass an array.');
    }
    if (!isFunction(func)) {
      throw new TypeError('You must pass an function.');
    }
    let p = function() {
      return Promise().then(function() {
        let item = items[i]
        let index = i
        i++
        if (item != undefined) {

          let ret = func(item, index)
          if (isThenable(ret)) {
            return ret.then(function(){
              return p()
            })
          } else if (isBoolean(ret)) {
            if (ret) {
              return p()
            }
          } else {
            return p()
          }
        }
      })
    }
    return p()
  }
  global.Promise = Promise;
})(global);