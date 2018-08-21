/**
 * 代码模板，改动请咨询cy
 */
(function (factory) {
  factory(XoW);
}(function (XoW) {
  'use strict'
  /**
   * 拆包解包、管理花名册数据
   * @param globalManager
   * @constructor
   */
  XoW.RosterManager = function(globalManager) {
    // function继承自object
    //var instance;
    //// 实现单例
    //return function( globalManager ){
    //  if ( !instance ){
    //    this.init(globalManager);
    //    return instance = this;
    //  }
    //  return instance;
    //};

    // region Fields
    var _this = this;
    var _gblMgr =  null; // 私有变量
    var _friendGroups = []; // 好友分組列表,即好友列表
    this.classInfo = 'RosterManager'; // 公有变量
    // endregion Fields

    // region Private Methods
    var _init = function () {
      XoW.logger.ms(_this.classInfo, '_init()');
      // 监听服务器的iq set roster节
      _gblMgr = globalManager;
      _gblMgr.getConnMgr().addHandler(_setRosterCb.bind(_this), Strophe.NS.ROSTER, 'iq', 'set');
      // this._gblMgr.getConnMgr().addHandler(this._setRosterCb.bind(this), Strophe.NS.ROSTER, 'iq', 'set');
      XoW.logger.me(_this.classInfo, '_init()');
    };
    var _findIndexOfFriendGroup = function (groupid) {
      XoW.logger.ms(_this.classInfo, '_existFriendGroup');
      return _friendGroups.findIndex(function (x) {
        return x.id === groupid
      });
    };
    var _addFriend = function(item) {
      XoW.logger.ms(_this.classInfo, '_addFriend()');
      var gpIndex = _findIndexOfFriendGroup(item.groupid);
      var group = null;
      if( gpIndex < 0 ) {
        group = new XoW.FriendGroup(item.groupid);
        _friendGroups.push(group);
      } else {
        group = _friendGroups.find(function (x) {
          return x.id === item.groupid
        });
      }
      // 类似于引用类型哦
      if(group) {
        group.list.push(item);
      }
      XoW.logger.me(_this.classInfo, '_addFriend()');
    };
    var _getRosterCb = function (stanza) {
      XoW.logger.ms(_this.classInfo, '_getRosterCb()');
      var $roster = $(stanza);
      $('item', $roster).each(function(index, item) {
        var $item = $(item);
        var user = new XoW.Friend($item.attr('jid'));
        if ($item.attr('name')){
          user.username = $item.attr('name'); // xmpp name 即给好友设置的昵称
        }
        user.subscription = $item.attr('subscription');
        user.ask = $item.attr('ask');
        // 是在这里判断如果没有分组，则加入未分组联系人呢
        // 还是到时候在friendlist那边再进行操作？
        var $group = $('group', $item);
        if ($group.length > 0) {
          $group.each(function (index, groupItem) {
            user.groupid = ($(groupItem).text());
          });
        }
        _addFriend(user);
       });
      XoW.logger.d(_this.classInfo + ' 获得好友列表: ' + JSON.stringify(_friendGroups));
      _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROSTER_RECEIVED, _friendGroups);
      XoW.logger.me(_this.classInfo, '_getRosterCb()');
    };
    var _errorBackCb = function (stanza) {
      XoW.logger.ms(_this.classInfo, '_errorBackCb()');
      _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ERROR, stanza);
    };
    var _setRosterCb = function (stanza) {
      XoW.logger.ms(_this.classInfo, '_setRosterCb()');
      // 有多种情况
      // 好友修改了（分组移动/好友name变动）
      // 好友增加了   区分增加和修改，就看原来自己的friends里面有没有该好友，如果有，就是修改，如果没有，就是新增。
      // 好友删除了  remove
      // 但很奇怪= =，spark以另一种方式实现了。
      // 它使用 unsubscribe解除自己订阅对方 和 unsubscribed解除对方对自己的订阅。。。这样就O了，然后subscription变成了none，就移除了联系人列表。
      var $stanza = $(stanza);
      var $item = $('item', $stanza);

      var user = new XoW.Friend();
      user.id = $item.attr('jid');
      user.username = user.name = $item.attr('name'); // xmpp name 即给好友设置的昵称
      user.subscription = $item.attr('subscription');
      user.ask = $item.attr('ask');
      var $group = $('group', $item);
      if ($group.length > 0) {
        $group.each(function (index, groupItem) {
          user.groupname = ($(groupItem).text()); // groupname todo
        });
      }
      //var params = {
      //  user: user,
      //  stanza: stanza
      //};
      // _this.triggerHandlerInRosterMgr('rosterSet', params);
      var iqResult = $iq({
        from: _this._gblMgr.getCurrentUser().getFullJid(), // todo
        type: 'result',
        id: $stanza.attr('id')
      });
      _this._gblMgr.getConnMgr().send(iqResult);
      XoW.logger.me(_this.classInfo,  '_setRosterCb()');
      return true;
    };
    // endregion Private Methods

    // region Public Methods -- with 'this'
    this.getFriendGroups = function () {
      XoW.logger.ms(_this.classInfo, 'getFriendGroups()');
      return _friendGroups;
    };
    /**public
     *  发送iq-get-roster请求好友列表
     */
    this.getRoster = function (timeout) {
      XoW.logger.ms(_this.classInfo, 'getRoster()');
      var roster = $iq({
        id: XoW.utils.getUniqueId('roster'),
        type: 'get'
      }).c('query', {xmlns: Strophe.NS.ROSTER});
      _gblMgr.getConnMgr().sendIQ(roster, _getRosterCb.bind(_this),
        _errorBackCb.bind(_this), timeout);
      XoW.logger.me(_this.classInfo + 'getRoster()');
    };
    this.getFriendByJid = function (jid) {
      XoW.logger.ms(_this.classInfo,  'getFriendByJid({0})'.f(jid));
      jid = XoW.utils.getBareJidFromJid(jid);
      for(var i = 0; i < _friendGroups.length; i++) {
        var item =  _friendGroups[i].list.find(function (x) {
          return x.jid === jid
        });
        if(item) {
          XoW.logger.d('找到好友{0}: '.f(item.id));
          return item;
        }
      }
      XoW.logger.d('未找到好友{0}'.f(jid));
      return null;
    };
    this.getFriendById = function (pId) {
      XoW.logger.ms(_this.classInfo,  'getFriendById({0})'.f(pId));
      for(var i = 0; i < _friendGroups.length; i++) {
        var item =  _friendGroups[i].list.find(function (x) {
          return x.id === pId
        });
        if(item) {
          XoW.logger.d('找到好友{0}: '.f(item.id));
          return item;
        }
      }
      XoW.logger.d('未找到好友{0}'.f(pId));
      return null;
    }
    // endregion Public Methods

    // construct
    _init();
  };
  return XoW;
}));