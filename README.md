promise
=======

es6 promise

一个小的 promise 库，仿照 es6 promise api 做了简单实现

- 实例化

    ```
        new Promise(function(resolve,reject){
            setTimeout(function(){
                resolve('ok')
            },500)
        }).then(function(msg){
            console.log(msg)
        }).catch(function(err){
            console.log(err)
        })
    ```

    ```
        // 每隔2秒打印数组元素 当遍历到第3个后 停止遍历
        let array = [1,2,3,4,5,6,7]
        return Promise.forEach(array, function(item, index){
            console.log(item)
            console.log(index)
            if (index > 3) {
                return false
            } else {
                return Promise.delay(2) 
            }
        })
    ```
    
    ```
        // 每隔 0.5秒 检查一次condition 是否true  最多检查5次
        // 可选参数： timeout 默认值 5 stepTime 默认 0.5 timeoutMsg 超时异常信息 不设置时，不抛出异常，由后续succ自行控制
        let timeout = 5, stepTime = .5
        let condition = false
        return Promise.until(function(){
            return condition
        }, timeout, stepTime, timeoutMsg)
        .then(function(succ){
            if (succ) {
                // 符合条件
            } else {
                // 超时
                throw 'timeout'
            }
        })
    ```
- api

    - Promise.all
    - Promise.race
    - Promise.resolve
    - Promise.reject
    - Promise.delay
    - Promise.until
    - Promise.forEach


简单提供了一个 delay 方法，可以循环处理，如

```
var pro = Promise.resolve()
for (var i = 0; i < 5; i++) {
    pro = pro.delay(500).then(function(){
        console.log(Date.now())
    })
}
```

另外补上当时写的实现说明链接 https://gmiam.com/post/shi-xian-ge-promise.html







