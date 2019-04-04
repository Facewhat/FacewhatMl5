/**
 * Created by Administrator on 2018/3/20.
 * 不允许依赖jquery这样的第三方UI库,已完成清理 by cy [20190402]
 */
(function(factory) {
  return factory(XoW);
}(function(XoW) {
  'use strict';
  /**
   * 拆包、解包，处理用户出席与订阅功能
   * ‘尽量’不要触发view事件
   * 1，presence 出席节
   * 2, error 错误
   * 3, subscribe 请求加好友
   * 4, 收到一个同意订阅
   * 5, unsubscribe 收到一个拒绝节
   * 6, unsubscribed 收到一个订阅撤销节
   * 7, unknown 未知节
   * @param globalManager
   * @constructor
   */
  XoW.PresenceManager = function(globalManager) {
    // region Fields
    var _this = this;
    var _gblMgr =  null; // 私有变量
    _this.classInfo = 'PresenceManager'; // 公有变量
    // endregion Fields

    // region Private Methods
    var _init = function () {
      XoW.logger.ms(_this.classInfo, '_init()');
      // 监听服务器的iq set roster节
      _gblMgr = globalManager;
      // 监听presence节
      _gblMgr.getConnMgr().addHandler(_onPresence.bind(_this), null, 'presence');
      XoW.logger.me(_this.classInfo, '_init()');
    };
    var _encapsulationToInfo = function(stanza) {
      XoW.logger.ms(_this.classInfo, '_encapsulationToInfo()');      
      var enCap = new XoW.Presence(stanza.getAttribute('from'));
      enCap.type = stanza.getAttribute('type');
      enCap.id = XoW.utils.getUniqueId(enCap.type);
      enCap.time = XoW.utils.getCurrentDatetime();
      enCap.status = 'untreated';
      enCap.to = stanza.getAttribute('to');
      return enCap;
    };
    var _encapsulationToPresence = function(stanza) {
      XoW.logger.ms(_this.classInfo, '_encapsulationToPresence()');     
      var presTemp = new XoW.Presence(stanza.getAttribute('from'));
      presTemp.to = stanza.getAttribute('to');
      presTemp.id = stanza.getAttribute('id');
      presTemp.type = stanza.getAttribute('type');
      presTemp.status = stanza.getElementsByTagName('status').length > 0 ?
        stanza.getElementsByTagName('status')[0].textContent : '';
      presTemp.priority = stanza.getElementsByTagName('priority').length > 0 ?
        stanza.getElementsByTagName('priority')[0].textContent : '';
      //presTemp.show = stanza.getElementsByTagName('show')[0].textContent;
      // jquery is not allowed
      //presTemp.show = $('show', $pres).text();
      //presTemp.photoHash = $('photo',$('x', $pres)).text();
      //presTemp.avatarHash = $('hash',$('x', $pres)).text();
      presTemp.time = XoW.utils.getCurrentDatetime();
      return presTemp;
    };
    /**
     * 出席的handler，用于处理接收到的出席消息。
     * @param stanza 接收到的出席节
     * @returns {Boolean} 表示该handler仍然有效
     */
    var _onPresence = function(stanza) {
      XoW.logger.ms(_this.classInfo, '_onPresence()');
      var subMsg, contact;
      var params = {
        preType : '',
        data: null
      };
      var type = stanza.getAttribute('type');
      if(type) {
        XoW.logger.d('get presence type: ' + type);
        switch (type) {
          case 'subscribe' :
            XoW.logger.i(_this.classInfo + ' the remote ask to subscribe me.');
            subMsg = new XoW.SubMsg();
            subMsg.cid = stanza.getAttribute('id') || XoW.utils.getUniqueId(stanza.getAttribute('type'));
            subMsg.from = stanza.getAttribute('from');
            subMsg.to = stanza.getAttribute('to');
            contact = _gblMgr.getContactByJid(subMsg.from);
            if(!contact) {
              subMsg.content = '申请添加您为好友';
              subMsg.remark = stanza.getElementsByTagName('status').length > 0 ?
                stanza.getElementsByTagName('status')[0].textContent : '';
              subMsg.type = XoW.SERVICE_EVENT.SUB_ME_REQ_RCV;
              contact = new XoW.Friend(subMsg.from);
              subMsg.item = contact;
              _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.SUB_ME_REQ_RCV, subMsg);
            } else {
              subMsg.type = XoW.SERVICE_EVENT.SUB_CONTACT_BE_APPROVED;
              subMsg.content = '{0} 已同意您的好友请求'.f(contact.username);
              _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.SUB_CONTACT_BE_APPROVED, subMsg);
              _this.approveSub(subMsg.from, subMsg.to);
            }
            break;
          case 'subscribed' :
            XoW.logger.i(_this.classInfo + ' the remote approve my subscription request.');
            //var $presence = $(stanza);
            //subMsg = new XoW.SubMsg();
            //subMsg.cid = $presence.attr('id') || XoW.utils.getUniqueId($presence.attr('type'));
            //subMsg.from = $presence.attr('from');
            //subMsg.to = $presence.attr('to');
            //subMsg.type = XoW.SERVICE_EVENT.SUB_CONTACT_BE_APPROVED;
            //user = _gblMgr.getContactByJid(subMsg.from);
            //
            //if(user && user.subscription !== 'from') {
            //  subMsg.item = user;
            //  subMsg.content = '{0} 已同意您的好友请求'.f(user.username);
            //  _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.SUB_CONTACT_BE_APPROVED, subMsg);
            //} else {
            //  XoW.logger.i('The contact approve my auto sub request.');
            //}
            break;
          case 'unsubscribe' : // should be deal by roster module
            subMsg = new XoW.SubMsg();
            subMsg.cid = stanza.getAttribute('id') || XoW.utils.getUniqueId(stanza.getAttribute('type'));
            subMsg.from = stanza.getAttribute('from');
            subMsg.to = stanza.getAttribute('to');
            subMsg.type = XoW.SERVICE_EVENT.SUB_CONTACT_BE_DENIED;
            contact = _gblMgr.getContactByJid(subMsg.from);
            if(contact && contact.subscription !== 'both') {
              subMsg.item = contact;
              subMsg.content = '{0} 已拒绝您的好友请求'.f(contact.username);
              // 此时of不会再发roster set给咱了
              _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.SUB_CONTACT_BE_DENIED, subMsg);
            } else {
              XoW.logger.i('The contact deny my auto sub request.');
            }
            break;
          case 'unsubscribed':
           break;
          case 'unavailable' :
            params.preType = 'presence';
            break;
          case 'error' :
            params.preType = 'error';
            // todo
            window.alert("收到了一个错误Presence节");
            break;
          default :
            params.preType = 'unknown';
            break;
        }
      } else { // no type
        XoW.logger.d('get presence with no type');
        params.preType = 'presence';
      }
      if('presence' == params.preType) {
        params.data = _encapsulationToPresence(stanza);
        _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.PRESENCE_RCV, params.data);
      }
      XoW.logger.me(_this.classInfo, '_onPresence()');
      return true;
    };
    /**
     * 调用XoW.ConnectionManager的send()方法来发送出席节
     * 不在sendOnline...等几个方法中直接用this._connMgr.send(pres); 而要经过这个方法。
     * 这样做的原因是这可以在这里面做一些日志或者其他什么东西。也便于修改
     * （如果_conn的send()方法改名了，这样只需改动一处）
     *
     * @param pres 需要发送的出席节
     */
    var _sendPresence = function(pres) {
      XoW.logger.ms(_this.classInfo, '_sendPresence({0})'.f(pres));
      _gblMgr.getConnMgr().send(pres);
      XoW.logger.me(_this.classInfo, '_sendPresence()');
    };
    var _sendSubscription = function (type, to, from, pStatus) {
      XoW.logger.ms(_this.classInfo, '_sendSubscription({0},{1})'.f(type, to));
      var pres = $pres({
        id: XoW.utils.getUniqueId(type),
        to: XoW.utils.getBareJidFromJid(to),
        type: type,
        from: XoW.utils.getBareJidFromJid(from)
      }).c('status').t(pStatus);

      _sendPresence(pres);
      XoW.logger.me(_this.classInfo, '_sendSubscription()');
    };
    // endregioin Private Methods

    // region Public Methods
    this.sendOnline = function() {
      XoW.logger.ms(_this.classInfo, 'sendOnline()');
      var p1 = $pres({
        id : XoW.utils.getUniqueId("presOnline")
      }).c('status').t('在线')
        .up().c('priority').t('1');
      _sendPresence(p1);
      // _gblMgr.getCurrentUser().state = 1;
      XoW.logger.me(_this.classInfo, 'sendOnline()');
    };
    this.sendOffline1 = function() {
      XoW.logger.ms(_this.classInfo, 'sendOffline1()');
      var pres = $pres({id : XoW.utils.getUniqueId('presOffline'),
        type : 'unavailable'
      }).c('status').t('Offline')
        .up().c('priority').t('0');
      _sendPresence(pres2);

      //_gblMgr.getUserMgr().setAllFriendsOffline();
      //_gblMgr.getCurrentUser().state = 5;
      XoW.logger.me(_this.classInfo, 'sendOffline1()');
    };

    this.subscribe = function (to, from, pRemark) {
      XoW.logger.ms(_this.classInfo, 'subscribe({0})'.f(to));
      _sendSubscription('subscribe', to, from, pRemark);
      XoW.logger.me(_this.classInfo, 'subscribe()');
    };
    this.unSubscribe = function (to, from) {
      XoW.logger.ms(_this.classInfo, 'unSubscribe({0})'.f(to));
      _sendSubscription('unsubscribe', to, from);
      XoW.logger.me(_this.classInfo, 'unSubscribe()');
    };
    this.approveSub = function (to, from, pRemark) {
      XoW.logger.ms(_this.classInfo, 'approveSub({0})'.f(to));
      _sendSubscription('subscribed', to, from, pRemark);
      XoW.logger.me(_this.classInfo, 'approveSub()');
    };
    this.denySub = function (to, from) {
      XoW.logger.ms(_this.classInfo, 'denySub({0})'.f(to));
      _sendSubscription('unsubscribed', to, from);
      XoW.logger.me(_this.classInfo, 'denySub()');
    };

    this.cancelSub = function (to, from) {
      XoW.logger.ms(_this.classInfo, 'denySub({0})'.f(to));
      _this.denySub(to, from);
      XoW.logger.me(_this.classInfo, 'denySub()');
    };
    // endregion Public Methods
    _init();
  };
  return XoW;
}));
