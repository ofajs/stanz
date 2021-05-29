避免过度使用Proxy导致的性能问题，尽量减少Proxy后的中转操作;

x-if 采用组件的方式渲染

化繁为简，不需要parent和index；

parent和index是为了记录update的位置信息；而位置信息页只是方便同步远端的数据；所以只要有方法同步远端数据，就能免用这两个特性；

get 和 set 操作频繁；而watch操作更少，所以watch允许花费更多性能；

添加指定key模式，方便xhear只设置key的值

xhear

自带是否渲染完成的promise；默认添加后渲染，渲染前可添加属性 connectedCallback 后置渲染；