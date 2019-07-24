# stanz 6

stanz 5 babel转义的时候，没办法模拟 Proxy Delete 的效果；所以想把stanz的所有操作都抽象出方法来，通过 `set`和 `get` 等方法外部设置，再用Proxy转接到 set get 函数上；

尽可能的精简操作，例如像 JSON里的 undefined 值的key 是不会有实体key的，所有将 delete 改为 set undefined值；

因为底部没有了 `delete` 方法，就不会混淆 delete 数组内元素的问题了；

设定值和Proxy没有了耦合，不仅能做更好的兼容，也能从中抽象出来，方便以后通过 gui 的方式制作数据；

兼容 stanz 5；

每个动作都会有动作的Id；不在把在Object(或Array)上的拆分出来用；

在emit上做数据差集优化，确认那个属性变动只有一次才触发，而Array函数则不会有数据差集；

## stanz 5

由于开发stanz4时候没有考虑好改动状态，导致代码较不整齐，新的stanz5将启用改动id机制，每个改动都有自己的id，保证数据同步不会重复；

新的stanz5将架起简易脚手架，看起来更舒畅；

大部分兼容stanz4，改良了少量用法，相比stanz4性能和扩展性提升；

### stanz 4

融合xml优势，添加数组型结构的操纵方法，全arrayLike式操作；同时拥有了json和xml优势；

将原来数据同步修改方式转为全异步，因此watch的同步数据监听和listen；

相比 stanz3 体积减少，功能增强；

### stanz 3

由于 stanz2 沿用了 `emitChange` 机制，导致同步数据的 `entrend` 容易出现问题，所以重构；

将 `entrend` 和 `setHandler` 公用一个修改入口；

添加 `keylist`，方便从上寻源；

打算完全兼容 stanz 2，只是架构上大改，提升可维护性和扩展性；

### stanz 2

使用 stanz 1.0 时候没考虑好数组类型数据，导致需要顺序型的数据类型时，变得非常复杂，所以重新构建一种新类型数据；

新类型数据融合 json 和 xml 的优势，ArrayLike类型，拥有数据绑定和数据监听的功能；