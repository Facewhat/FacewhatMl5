/**
 * Created by cy on 2018/3/2.
 */
(function (factory) {
  return factory(XoW);
}(function (XoW) {
  /**
   * 用户实体，不要添加逻辑
   * 格式兼容layim.cache.friend之好友信息部分
   *  layim.addList({
                type: 'friend'
                ,avatar: "http://tp2.sinaimg.cn/2386568184/180/40050524279/0"
                ,username: '冲田杏梨'
                ,groupid: 2
                ,id: "1233333312121212"
                ,remark: "本人热爱工作"
            });
   */
  XoW.Friend = function (jid) {
    var _this = this;
    // region 兼容layim的属性
    this.id = ''; // 适配layim，全局唯一ID
    this.username = ''; // 即nickname, 对方账号 < 对方自己设置的昵称 < 本端给好友设置的备注名
    // this.name = ''; // 这是界面显示时集成的一个数据项，可能为friend的username或者group的goupname等，作为chat等的抬头
    this.groupid = ''; // xmpp roster 仅返回 groupname，而layim仅支持 groupid
    this.avatar = XoW.DefaultImage.AVATAR_DEFAULT;  // 适配face
    this.status = XoW.UserState.OFFLINE;
    this.sign = '这个人很懒，什么都没留下';
    this.type = 'friend';
    this.temporary = false;
    // endregion 兼容layim的属性

    this.jid = ''; // bare jid
    this.ask = '';
    this.subscription = '';
    this.blinkInterval = ''; // 界面闪烁的指示，这里居然有了界面的东西。。。

    // 解析roster的时候获取不到，后面再拿
    this.vcard = null;
    this.resource = ''; // 对方所在的资源
    this.classInfo = 'Friend' + this.id;

    var _init = function () {
      XoW.logger.ms(_this.classInfo, '_init()');
      _this.jid = XoW.utils.getBareJidFromJid(jid);
      _this.username = _this.id = XoW.utils.getNodeFromJid(jid);
      XoW.logger.me(_this.classInfo, '_init()');
    };
    /**
     * 判断是不是自己的纯jid
     * @param jid
     * @returns {Boolean}
     */
    this.isMyBareJid = function (jid) {
      XoW.logger.ms(_this.classInfo, 'isMyBareJid()');
      if (_this.jid == XoW.utils.getBareJidFromJid(jid)) {
        return true;
      }
      return false;
    };
    this.getFullJid = function () {
      XoW.logger.ms(_this.classInfo, 'getFullJid()');
      return _this.jid + '/' + _this.resource;
    };

    _init();
  };
}));