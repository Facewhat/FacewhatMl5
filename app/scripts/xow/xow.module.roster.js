/**
 * 代码模板，改动请咨询cy
 * 不允许依赖jquery这样的第三方UI库,已完成清理 by cy [20190402]
 * 理论上最终也要将Strophe依赖干掉，依赖xmpp不依赖于具体的协议栈
 */
(function (factory) {
  factory(XoW, Strophe);
}(function (XoW, Strophe) {
  'use strict';
  /**
   * 拆包解包、管理花名册数据
   * todo:协议封装、协议验证、状态机功能需要下沉至strophe，作为strophe的插件
   * @param pBus
   * @constructor
   */
  XoW.RosterManager = function(pBus) {
    // region Fields
    var _this = this;
    var _gblMgr =  null; // 私有变量
    var _MAX_ITEM_NUM = 20;
    this.classInfo = 'RosterManager'; // 公有变量
    // endregion Fields

    // region Private Methods
    var _init = function (pGlobalMgr) {
      XoW.logger.ms(_this.classInfo, '_init()');
      // 监听服务器的iq set roster节
      _gblMgr = pGlobalMgr;
      // handler, ns, name, type, id, from, options
      _gblMgr.getConnMgr().addHandler(_onRosterSet.bind(_this), Strophe.NS.ROSTER, 'iq', 'set');
      XoW.logger.me(_this.classInfo, '_init()');
    };
    var _findIndexOfFriendGroup = function (groupid) {
      XoW.logger.ms(_this.classInfo, '_existFriendGroup');
      _gblMgr.getCache().friend = _gblMgr.getCache().friend || [];
      return _gblMgr.getCache().friend.findIndex(function (x) {
        return x.id === groupid;
      });
    };
    var _addFriend = function(item) {
      XoW.logger.ms(_this.classInfo, '_addFriend()');
      var gpIndex = _findIndexOfFriendGroup(item.groupid);
      var group = null;
      if( gpIndex < 0 ) {
        group = new XoW.FriendGroup(item.groupid);
        _gblMgr.getCache().friend.push(group);
      } else {
        group = _gblMgr.getCache().friend.find(function (x) {
          return x.id === item.groupid;
        });
      }
      // 类似于引用类型哦
      if(group) {
        group.list.push(item);
      }
      XoW.logger.me(_this.classInfo, '_addFriend()');
    };
    var _cbGetRoster = function(stanza) {
      XoW.logger.ms(_this.classInfo, '_cbGetRoster()');
      for(var item of stanza.getElementsByTagName('item')) {
        var user = new XoW.Friend(item.getAttribute('jid'));
        if(item.getAttribute('name')){
          user.username = item.getAttribute('name'); // xmpp name 即给好友设置的昵称
        }
        user.groupid = item.getElementsByTagName('group').length > 0 ?
          item.getElementsByTagName('group')[0].textContent : '';
        user.subscription = item.getAttribute('subscription');
        user.ask = item.getAttribute('ask');
        if('both' !== user.subscription  && !user.ask) {
          return true;
        } else if('both' !== user.subscription) {
          user.username = user.username + '(Pending)';
        }
        _addFriend(user);
      }
      XoW.logger.d(_this.classInfo + ' 获得好友列表: ' + JSON.stringify(_gblMgr.getCache().friend));
      _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROSTER_RCV, _gblMgr.getCache().friend);
      XoW.logger.me(_this.classInfo, '_cbGetRoster()');
    };
    var _cbError = function (stanza) {
      XoW.logger.ms(_this.classInfo, '_cbError()');
      _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ERROR, stanza);
    };
    var _onRosterSet = function (stanza) {
      XoW.logger.ms(_this.classInfo, '_onRosterSet({0})'.f(stanza.getAttribute('id')));
      // 有多种情况
      // 好友修改--分组移动/好友name变动
      // 好友增加,就看原来自己的friends里面有没有该好友，如果有，就是修改，如果没有，就是新增。
      // 好友删除了,  remove
      // 但很奇怪= =，spark以另一种方式实现了。
      // 它使用 unsubscribe解除自己订阅对方 和 unsubscribed解除对方对自己的订阅。。。这样就O了，然后subscription变成了none，就移除了联系人列表。
      var item = stanza.getElementsByTagName('item')[0];
      var rcvUser = new XoW.Friend(item.getAttribute('jid'));
      rcvUser.subscription = item.getAttribute('subscription');
      rcvUser.ask = item.getAttribute('ask');
      rcvUser.username = item.getAttribute('name') || rcvUser.username;
      for(var groupEle of item.getElementsByTagName('group')) {
        rcvUser.groupid = groupEle.textContent;
      }
      var contact, subMsg = new XoW.SubMsg();
      subMsg.item = rcvUser;
      subMsg.cid = stanza.getAttribute('id') || XoW.utils.getUniqueId('sub');
      subMsg.from = stanza.getAttribute('from');
      XoW.logger.i('The user subscription {0}, ask {1}'.f(rcvUser.subscription, rcvUser.ask));
      switch (rcvUser.subscription) {
        case 'none':
          if(rcvUser.ask === 'subscribe') {
            // None + Pending Out
            subMsg.content = '您已发送好友请求给 {0}，请等待对方回复'.f(rcvUser.username);
            _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.SUB_CONTACT_REQ_SUC, subMsg);
          } else if(rcvUser.ask === 'unsubscribe') {
            subMsg.content = '您解除了与 {0} 的好友关系'.f(rcvUser.username);
            _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.UN_SUB_CONTACT_REQ_SUC, subMsg);
          } else {
            contact = _gblMgr.getContactByJid(rcvUser.jid);
            if(contact) {
              subMsg.content = '{0} 解除了与您的好友关系'.f(rcvUser.username);
              _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.UN_SUB_ME_REQ_RCV, subMsg);
            }
          }
          break;
        case 'from':
          if(rcvUser.ask === 'subscribe') {
            XoW.logger.i('I have approved the users sub request.');
          }
          break;
        case 'to':
          break;
        case 'both':
          contact = _gblMgr.getContactByJid(rcvUser.jid);
          if(!contact) {
            _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROSTER_CONTACT_ADDED, rcvUser);
          } else {
            contact.subscription = rcvUser.subscription;
            _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROSTER_CONTACT_MODIFIED, {'old': contact, 'latest': rcvUser });
            // todo notify to render
            // todo if group id has changed, should be notify to move to the group
          }
          break;
        case 'remove':
          // 本端主动订阅对端双向成功后，对端删除联系人，则spark直接remove
          //>对端主动订阅本端双向成功，对端删除联系人，则spark不发remove，而是直接收到subscription = none同时收到 pres = unsubscribe
          _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROSTER_CONTACT_REMOVED, rcvUser);
          break;
        default :
          break;
      }
      var iqResult = $iq({
        from: _gblMgr.getCurrentUser().jid,
        type: 'result',
        id: stanza.getAttribute('id')
      });
      _gblMgr.getConnMgr().send(iqResult);
      XoW.logger.me(_this.classInfo,  '_onRosterSet({0})'.f(stanza.getAttribute('id')));
      return true;
    };
    var _cbSearchUser = function (stanza) {
      XoW.logger.ms(_this.classInfo, '_cbSearchUser()');
      var params = {
        stanza:stanza,
        items:[],
        itemsExcludeFriend:[],
        itemsFriend:[]
      };
      var count = 0;
      for(var item of stanza.getElementsByTagName('item')) {
        count++;
        if(count > _MAX_ITEM_NUM) {
          return false;
        }
        var jid = item.querySelectorAll('field[var="jid"] value')[0].textContent;
        var name = item.querySelectorAll('field[var="Username"] value')[0].textContent;// 和layim意义对调
        var userName = item.querySelectorAll('field[var="Name"] value')[0].textContent;
        var mineNode = XoW.utils.getNodeFromJid(_gblMgr.getCurrentUser().jid);
        var userNode = XoW.utils.getNodeFromJid(jid);
        var currFriend = _gblMgr.getContactByJid(jid);
        if (mineNode === userNode) {
          return true; // continue
        } else if (!currFriend) {
          var user = new XoW.Friend(jid);
          user.username = userName || name;
          user.sign = '想看对方的签名，先订阅！';
          user.avatar = XoW.DefaultImage.AVATAR_STRANGER;
          params.itemsExcludeFriend.push(user);
        } else if (currFriend.subscription === 'none' || currFriend.subscription === 'to') {
          params.itemsExcludeFriend.push(currFriend);
        }
      }
      _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.USER_SEARCH_RSP_RCV, params);
      XoW.logger.me(_this.classInfo, '_cbSearchUser()');
    };
    // endregion Private Methods

    // region Public Methods -- with 'this'
    this.getFriendGroups = function () {
      XoW.logger.ms(_this.classInfo, 'getFriendGroups()');
      return _gblMgr.getCache().friend;
    };

    this.getRoster = function (timeout) {
      XoW.logger.ms(_this.classInfo, 'getRoster()');
      var roster = $iq({
        id: XoW.utils.getUniqueId('roster'),
        type: 'get'
      }).c('query', {xmlns: Strophe.NS.ROSTER});
      _gblMgr.getConnMgr().sendIQ(roster, _cbGetRoster.bind(_this),
        _cbError.bind(_this), timeout);
      XoW.logger.me(_this.classInfo + 'getRoster()');
    };

    this.searchUser = function(username, timeout){
      XoW.logger.ms(this.classInfo,'queryUser({0})'.f(username));
      var iq2 = $iq({type : 'set',
        id : XoW.utils.getUniqueId('searchUser'),
        to : 'search.{0}'.f(XoW.config.domain)
      }).c('query', {xmlns : XoW.NS.USER_SERACH
      }).c('x', {xmlns : XoW.NS.FORM_DATA,
        type : 'submit'
      }).c('field', {'type': 'hidden'}, {'var' : 'FORM_TYPE'}).c('value').t(XoW.NS.USER_SERACH).up().up()
        .c('field', {'type': 'text-single'}, {'var' : 'search'}).c('value').t('*' + username + '*').up().up()
        .c('field', {'type': 'boolean'}, {'var' : 'Username'}).c('value').t('1').up().up()
        .c('field', {'type': 'boolean'}, {'var' : 'Name'}).c('value').t('1');

      _gblMgr.getConnMgr().sendIQ(iq2, _cbSearchUser.bind(_this),
        _cbError.bind(_this), timeout);
      XoW.logger.me(this.classInfo,'getUserFromServer');
    };

    this.setRosterForNameAndGroup = function (pUser, timeout) {
      XoW.logger.ms(_this.classInfo, 'setRosterForNameAndGroup({0})'.f(pUser.jid));
      var iq = $iq({
        id: XoW.utils.getUniqueId('setIQRoster'),
        type: 'set'
      }).c('query', {
        xmlns: Strophe.NS.ROSTER
      }).c('item', {
        jid: pUser.jid,
        name: pUser.username
      }).c('group').t(pUser.groupid);
      // allowed belonging to multiple groups
      //var userGroup = group;
      //for (var i = 0; i < userGroup.length; i++) {
      //  iq.c('group').t(userGroup[i]).up();
      //}
      _gblMgr.getConnMgr().sendIQ(iq, function (stanza) {
        XoW.logger.ms(_this.classInfo, 'setIQRosterCb({0})'.f(stanza.getAttribute('id')));
        // if the user is already in the roster(server),the server may not replay to the sending resource with an  IQ result
        // indicating the success of the roster set, which is defined as ROSTER_FRIEND_SUB__SVR_PREPARED.
        // But, after i send presence of subscribe request, the server will replay an roster set which include the info of the friend.
        _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.SUB_CONTACT_READY, pUser);
        XoW.logger.me(_this.classInfo, 'setIQRosterCb({0})'.f(stanza.getAttribute('id')));
      }.bind(_this), _cbError.bind(_this), timeout);
      XoW.logger.me(_this.classInfo, 'setRosterForNameAndGroup()');
    };
    // region Obsolete Methods

    this.removeContact = function (jid) {
      XoW.logger.ms(_this.classInfo, 'removeContact({0})'.f(jid));
      var iq = $iq({
        id: XoW.utils.getUniqueId('rsrmv'),
        type: 'set'
      }).c('query', {
        xmlns: Strophe.NS.ROSTER
      }).c('item', {
        jid: jid,
        subscription: 'remove'
      });
      // .c('group').t(groupname);
      _gblMgr.getConnMgr().sendIQ(iq);
      XoW.logger.me(_this.classInfo, 'removeContact()');
    };
    // endregion Obsolete Methods

    // endregion Public Methods

    // constructor
    _init(pBus);
  };
  return XoW;
}));