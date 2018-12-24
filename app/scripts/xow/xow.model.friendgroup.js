/**
 * Created by cy on 2018/3/2.
 */
(function (factory) {
  return factory(XoW);
}(function (XoW) {
  /**
   * 好友分組实体，不要添加逻辑
   * 格式兼容layim.cache.friend
   *  "friend": [{"groupname": "前端的同学"
            ,"id": 1
            ,"online": 2
            ,"list": []}
            ,{
              "groupname": "前端的同学2"
              ,"id": 100
              ,"online": 2
              ,"list": []
            }]
   * 代码调用：
   *  var a = new FriendGroup ( 'sven1' );
      var b = new FriendGroup ( 'sven2' );
      alert(a.toStringAll()); // [group]  groupname = sven1, name = undefined online = 0, count = 0 [friend]
      alert(b.toStringAll()); // [group]  groupname = sven2, name = undefined online = 0, count = 0 [friend]
   */
  XoW.FriendGroup = function (groupname) {
    var _this = this;
    // region 兼容layim的属性
    this.groupname = ''; //  xmpp roster 仅返回 groupname
    this.id = ''; // 与groupname值相同
    this.online = 0;
    this.list = []; // 分組内好友
    // endregion 兼容layim的属性
    this.count = 0;
    this.blinkInterval = ""; // 闪烁的interval，在页面中，指示是否闪烁以及intever的句柄
    this.classInfo = 'FriendGroup' + this.groupname;
    
    var _init = function () {
      XoW.logger.ms(_this.classInfo, '_init()');
      _this.groupname = groupname;
      _this.id = groupname;
      XoW.logger.me(_this.classInfo, '_init()');
    };
    this.getItemByJid = function(jid) {
      if(jid == null || jid == "") {
        return null;
      }
      jid = XoW.utils.getBareJidFromJid(jid);
      for(var i = 0; i < this.list.length; i++) {
        if(_this.list[i].id == jid) {
          return _this.list[i];
        }
      }
      return null;
    };
    _init();
  };
}));