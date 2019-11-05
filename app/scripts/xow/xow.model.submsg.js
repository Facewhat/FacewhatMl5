/**
 * Created by cy on 2018/12/8.
 */
(function (factory) {
  return factory(XoW);
}(function (XoW) {
  /**
   * 订阅消息通知实体，不要添加逻辑
   {
       {
         "id": 76,
         "content": "申请添加你为好友",
         "uid": 168,
         "from": 166488,
         "type": 1,
         "remark": "有问题要问",
         "href": null,
         "read": 1,
         "time": "刚刚",
         "user": {
           "id": 166488,
           "avatar": "//q.qlogo.cn/qqapp/101235792/B704597964F9BD0DB648292D1B09F7E8/100",
           "username": "李彦宏",
           "sign": null
         }
       },
       {
         "id": 62,
         "content": "雷军 拒绝了你的好友申请",
         "uid": 168,
         "from": null,
         "from_group": null,
         "type": 1,
         "remark": null,
         "href": null,
         "read": 1,
         "time": "10天前",
         "user": {
           "id": null
         }
   }
   */
  XoW.SubMsg = function () {
    var _this = this;
    this.cid = '';
    this.from = '';
    this.to = '';
    this.href = '';
    this.type = XoW.SERVICE_EVENT.UNKNOWN;
    this.remarkName = ''; // 备注名
    this.remark = ''; // 备注或留言
    this.content = '';
    this.status = 'untreated';
    this.timestamp = '';
    this.item = null; // user or room

    this.classInfo = 'SubMsg';
    
    var _init = function () {
      XoW.logger.ms(_this.classInfo, '_init()');
      _this.timestamp = XoW.utils.getCurrentDatetime();
      XoW.logger.me(_this.classInfo, '_init()');
    };
    _init();
  };
}));