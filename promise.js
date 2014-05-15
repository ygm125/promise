(function(window){

var PENDING = 'pending', SUCCEED = 'fulfilled', FAILURE = 'rejected';

var isFunction = function(arg){
	return 'function' === typeof arg;
}

var isPromise = function(obj){
  	return obj != null && typeof obj['then'] == 'function';
}

var fireQueue = function(val){
    var fn,
    	st = this._status === SUCCEED,
    	queue = this[st ? '_resolves' : '_rejects'];
    
    while(fn = queue.shift()) {
        val = fn.call(this, val) || val;
    }
    this[st ? '_value' : '_reason'] = val;
    return this;
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
	// 无new实例构造
	if(!(this instanceof Promise)) return new Promise(resolver);
	// 参数初始化
	var that = this;
	that._status = PENDING;
	//这里目前可以不用数组，后续改进
	that._resolves = [];
	that._rejects = [];
	that._value;
	that._reason;
	// 传入函数resolver里resolve与reject方法
	// promise内部resolve或reject调用时执行
	// then时push进_resolves或_rejects里的回调
	var resolve = function(value){
		transition.apply(that,[SUCCEED].concat(value));
	}
	var reject = function(reason){
		transition.apply(that,[FAILURE].concat(reason));
	}
	if(isFunction(resolver)){
		resolver(resolve,reject);
	}
}

Promise.prototype.then = function(onFulfilled,onRejected){
	var that = this;
	// 返回promise供then链式调用
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
       	}else if(that._status === SUCCEED){
       		callback(that._value);
       	}else if(that._status === FAILURE){
       		errback(that._reason);
       	}
	});
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

window.Promise = Promise;

})(window);