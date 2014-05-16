(function(window,undefined){

var PENDING = undefined, FULFILLED = 1, REJECTED = 2;

var isFunction = function(obj){
	return 'function' === typeof obj;
}

var isArray = function(obj) {
  	return Object.prototype.toString.call(obj) === "[object Array]";
}

var isPromise = function(obj){
  	return obj && typeof obj['then'] == 'function';
}

var fireQueue = function(val){
    var fn,
    	st = this._status === FULFILLED,
    	queue = this[st ? '_resolves' : '_rejects'];
    
    while(fn = queue.shift()) {
        val = fn.call(this, val) || val;
    }
    this[st ? '_value' : '_reason'] = val;
}

var transition = function(status,val){
	var that = this;
	if(that._status !== PENDING) return;
	// 所以的执行都是异步调用，保证then是先执行的
	setTimeout(function(){
		that._status = status;
		fireQueue.call(that,val);
	});
}

var Promise = function(resolver){
	if (!isFunction(resolver)) {
	    throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
	}
	if(!(this instanceof Promise)) return new Promise(resolver);

	var that = this;
	that._status = PENDING;
	that._resolves = [];
	that._rejects = [];
	that._value;
	that._reason;
	// 传入函数resolver里resolve与reject方法
	// promise内部resolve或reject调用时执行
	// then时push进_resolves或_rejects里的回调
	var resolve = function(value){
		transition.apply(that,[FULFILLED].concat([value]));
	}
	var reject = function(reason){
		transition.apply(that,[REJECTED].concat([reason]));
	}
	resolver(resolve,reject);
}

Promise.prototype.then = function(onFulfilled,onRejected){
	var that = this;
	return Promise(function(resolve,reject){
		// 被接受时触发的回调(即内部resolve)
		// 如果onFulfilled返回的是promise，
		// 等待此promise被resolve或reject，在触发我们then链的下一个promise
		// 如果返回的是值，则直接触发回调
		function callback(value){
	      var ret = isFunction(onFulfilled) && onFulfilled(value) || value;
	      if(isPromise(ret)){
	        ret.then(function(value){
	           resolve(value);
	        },function(reason){
	           reject(reason);
	        });
	      }else{
	        resolve(ret);
	      }
	    }
	    // 被拒绝时触发的回调(即内部reject)
	    // 并触发下一个promise对象的reject(即每次then返回的新promise)
	    function errback(reason){
	    	reason = isFunction(onRejected) && onRejected(reason) || reason;
	    	reject(reason);
	    }
	    // then方法PENDING的时候添加onFulfilled与onRejected的回调
	    // 在内部resolve和reject的时候调用
		if(that._status === PENDING){
       		that._resolves.push(callback);
       		that._rejects.push(errback);
       	}else if(that._status === FULFILLED){
       		callback(that._value);
       	}else if(that._status === REJECTED){
       		errback(that._reason);
       	}
	});
}

Promise.prototype.catch = function(onRejected){
	return this.then(undefined, onRejected);
}

Promise.resolve = function(arg){
	return Promise(function(resolve,reject){
		resolve(arg)
	})
}

Promise.reject = function(arg){
	return Promise(function(resolve,reject){
		reject(arg)
	})
}

Promise.all = function(promises){
	if (!isArray(promises)) {
    	throw new TypeError('You must pass an array to all.');
  	}
  	return Promise(function(resolve,reject){
  		var i = 0,
  			result = [],
  			len = promises.length;

  		function resolver(index) {
	      return function(value) {
	        resolveAll(index, value);
	      };
	    }

	    function rejecter(reason){
	    	reject(reason);
	    }

	    function resolveAll(index,value){
	    	result[index] = value;
	    	if(index == len - 1){
	    		resolve(result);
	    	}
	    }

  		for (; i < len; i++) {
  			promises[i].then(resolver(i),rejecter);
  		}
  	});
}

Promise.race = function(promises){
	if (!isArray(promises)) {
    	throw new TypeError('You must pass an array to race.');
  	}
  	return Promise(function(resolve,reject){
  		var i = 0,
  			len = promises.length;

  		function resolver(value) {
  			resolve(value);
	    }

	    function rejecter(reason){
	    	reject(reason);
	    }

  		for (; i < len; i++) {
  			promises[i].then(resolver,rejecter);
  		}
  	});
}

window.Promise = Promise;

})(window);