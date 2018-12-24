/**
 * Created by cy on 2018/3/2.
 */
(function (factory) {
    return factory(XoW);
}(function (XoW) {
    /**
     * 用户实体，不要添加逻辑
     * 格式兼容layim.cache.friend之好友信息部分
     _layIM.addList({
        type: "group"
          ,"groupname": "Fly社区官方群"
          ,"id": "102"
          ,"avatar": "http://tp2.sinaimg.cn/5488749285/50/5719808192/1"
          ,"remark": "群主是个大哈儿"
      });
     */
    XoW.Room = function (jid) {
        var _this = this;
        // region 兼容layim的属性
        this.id = ''; // 适配layim，全局唯一ID
        this.groupname = ''; //  群账号 < 群名
        this.avatar = XoW.DefaultImage.AVATAR_ROOM;
        this.members = [];
        // endregion 兼容layim的属性

        this.jid = ''; // bare jid
        this.config = null;
        this.occupants = 0;
        this.remark = '群组太懒，什么都没留下';

        this.classInfo = 'Room' + this.id;

        var _init = function () {
            XoW.logger.ms(_this.classInfo, '_init()');
            _this.jid = XoW.utils.getBareJidFromJid(jid);
            _this.id = XoW.utils.getNodeFromJid(jid);
            XoW.logger.me(_this.classInfo, '_init()');
        };

        this.getFullJid = function () {
            XoW.logger.ms(_this.classInfo, 'getFullJid()');
            return _this.jid + '/' + _this.resource;
        };

        _init();
    };
}));