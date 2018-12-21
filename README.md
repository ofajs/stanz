# stanz 5

由于开发stanz4时候没有考虑好改动状态，导致代码较不整齐，新的stanz5将启用改动id机制，每个改动都有自己的id，保证数据同步不会重复；

新的stanz5将架起简易脚手架，看起来更舒畅；

兼容stanz4；

# stanz 4

融合xml优势，添加数组型结构的操纵方法，全arrayLike式操作；同时拥有了json和xml优势；

将原来数据同步修改方式转为全异步，因此watch的同步数据监听和listen；

相比 stanz3 体积减少，功能增强；

## stanz 3

由于 stanz2 沿用了 `emitChange` 机制，导致同步数据的 `entrend` 容易出现问题，所以重构；

将 `entrend` 和 `setHandler` 公用一个修改入口；

添加 `keylist`，方便从上寻源；

打算完全兼容 stanz 2，只是架构上大改，提升可维护性和扩展性；

### stanz 2

使用 stanz 1.0 时候没考虑好数组类型数据，导致需要顺序型的数据类型时，变得非常复杂，所以重新构建一种新类型数据；

新类型数据融合 json 和 xml 的优势，ArrayLike类型，拥有数据绑定和数据监听的功能；