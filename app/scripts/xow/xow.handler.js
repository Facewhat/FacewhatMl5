(function (factory) {
  return factory(XoW);
}(function (XoW) {
  "use strict";

  XoW.Handler = function () {
    this.handlers = [];
    this.classInfo = 'HandlerManager';
  };
  XoW.Handler.prototype = {
    /**
     * 添加handler
     * @param proName 监听的属性
     * @param callback 回调函数，该属性改变时触发的回调
     * @return 返回处理器id
     */
    addHandler: function (proName, callback) {
      XoW.logger.ms(this.classInfo, 'addHandler({0})'.f(proName));
      var _handler = {
        id: XoW.utils.getUniqueId("handler"), // 这个handler的id，用于后面dele用的
        listenPropery: proName, // 监听的属性名
        cb: callback // 回调函数
      };
      this.handlers.push(_handler); // 加入处理器数组中
      return _handler.id; // 返回该处理器id
    },
    /**
     * 移除handler,感觉一般都有没有用到
     * @param id handler的id。
     */
    deleteHandler: function (id) {
      XoW.logger.ms(this.classInfo, 'deleteHandler({0})'.f(id));
      for (var i = 0; i < this.handlers.length; i++) {
        var _handler = this.handlers[i];
        if (_handler.id == id) {
          var index = this.handlers.indexOf(_handler);
          if (index >= 0) {
            this.handlers.splice(index, 1);
          }
          break;
        }
      }
    },
    /**
     * 属性改变触发回调.
     * 如果回调返回的不是true，则将该回调删除。
     * @param proName 改变的属性的名称
     * @param params 调用回调传过去的参数
     */
    triggerHandler: function (proName, params) {
      XoW.logger.ms(this.classInfo, 'triggerHandler({0})'.f(proName));
      var count = 0;
      for (var i = 0; i < this.handlers.length; i++) {
        var _handler = this.handlers[i];
        if (!_handler) {
          XoW.logger.e(this.classInfo + "未定义的handler，要触发的属性是" + proName);
          return;
        }
        if (_handler.listenPropery == proName) {
          count++;
          // 如果方法执行完没有返回 false，就将其删除
          // 这样做的话，如果哪次运行出错了，，某个回调没有执行完，
          // 那不就将这个回调删除了吗。。。
          // 还是说换个策略，返回true的话就将其删除，不然不删。
          // 上面的想法好像是错的。。。多虑了。如果出错了，，就直接崩了。。
          if (_handler.cb) {
            // 如果函数存在
            if (!_handler.cb(params)) {
              // 如果返回的不是true则将该触发器移除。
              //this.deleteHandler(_handler.id); // del by cy [20180316]
            }
          } else {
            // 不存在，则将其移除。
            this.deleteHandler(_handler.id);
            //delete this.handlers[i];
          }
        }
      }
      XoW.logger.me(this.classInfo, 'triggerHandler({0}), count {1}'.f(proName, count));
    }
  }
  return XoW;
}));