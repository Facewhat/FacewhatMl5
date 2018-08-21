/**
 * Created by Administrator on 2018/3/20.
 */
(function(factory) {
  return factory(XoW);
}(function(XoW) {
  'use strict'
  /**
   * 拆包、解包，处理用户出席与订阅功能
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
    this.classInfo = 'PresenceManager'; // 公有变量
    var _currentState;
    // endregion Fields

    // region Private Methods
    var _init = function () {
      XoW.logger.ms(_this.classInfo, '_init()');
      // 监听服务器的iq set roster节
      _gblMgr = globalManager;
      // 监听presence节
      _gblMgr.getConnMgr().addHandler(_presenceCb.bind(_this), null, 'presence');
      XoW.logger.me(_this.classInfo, '_init()');
    };
    var _encapsulationToInfo = function(stanza) {
      XoW.logger.ms(_this.classInfo, '_encapsulationToInfo()');
      var $info = $(stanza);
      var encap = new XoW.Presence();
      encap.type = $info.attr('type');
      encap.id = XoW.utils.getUniqueId(encap.type);
      encap.time = XoW.utils.getCurrentDatetime();
      encap.status = 'untreated';
      encap.from = $info.attr('from');
      encap.to = $info.attr('to');
      return encap;
    };
    var _encapsulationToPresence = function(stanza) {
      XoW.logger.ms(_this.classInfo, '_encapsulationToPresence()');
      var $pres = $(stanza);
      var presTemp = new XoW.Presence();
      presTemp.from = $pres.attr("from");
      presTemp.to = $pres.attr("to");
      presTemp.id = $pres.attr("id");
      presTemp.type = $pres.attr("type");
      presTemp.status = $('status', $pres).text();
      presTemp.priority = $('priority', $pres).text();
      presTemp.show = $('show', $pres).text();
      presTemp.photoHash = $('photo',$('x', $pres)).text();
      presTemp.avatarHash = $('hash',$('x', $pres)).text();
      presTemp.time = XoW.utils.getCurrentDatetime();
      return presTemp;
    };
    /**
     * 出席的handler，用于处理接收到的出席消息。
     * @param pres 接收到的出席节
     * @returns {Boolean} 表示该handler仍然有效
     */
    var _presenceCb = function(stanza) {
      XoW.logger.ms(_this.classInfo, '_presenceCb()');
      var $presence = $(stanza);
      var params = {
        preType : '',
        data: null
      };
      var type = $presence.attr('type');
      if(type) {
        XoW.logger.d('get presence type: ' + type);
        switch (type) {
          case 'error' :
            params.preType = 'error';
            // todo
            alert("收到了一个错误Presence节");
            break;
          case 'subscribe' :
            params.preType = 'subscribe';
            params.data = _encapsulationToInfo(stanza);
            break;
          case 'subscribed' :
            params.preType = 'subscribed'; // 同意订阅
            params.data = _encapsulationToInfo(stanza);
            params.data.status = 'none';
            break;
          case 'unsubscribe' : // 拒绝
            params.preType = 'unsubscribe';
            params.data = _encapsulationToInfo(stanza);
            params.data.status = 'none';
            // 收到一个unsubsribe就要发送remove
            _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROSTER_REMOVE_FRIEND, $presence.attr('from'));
            break;
          case 'unsubscribed' :
            params.preType = 'unsubscribed';
            params.data = _encapsulationToInfo(stanza);
            params.data.status = 'none';
            break;
          case 'unavailable' :
            params.preType = 'presence';
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
        _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.PRESENCE_RECEIVED, params.data);
      }
      XoW.logger.me(_this.classInfo, '_presenceCb()');
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
    var _sendPres = function(pres) {
      XoW.logger.ms(_this.classInfo, '_sendPres({0})'.f(pres));
      _gblMgr.getConnMgr().send(pres);
      XoW.logger.me(_this.classInfo, '_sendPres()');
    };
    // endregioin Private Methods

    // region Public Methods
    this.sendOnline = function() {
      XoW.logger.ms(_this.classInfo, 'sendOnline()');
      var p1 = $pres({
        id : XoW.utils.getUniqueId("presOnline")
      }).c("status").t("在线")
        .up().c("priority").t('1');
      _sendPres(p1);
      _gblMgr.getCurrentUser().state = 1;
      XoW.logger.me(_this.classInfo, 'sendOnline()');
    };
    this.sendOffline1 = function() {
      XoW.logger.ms(_this.classInfo, 'sendOffline1()');
      var pres = $pres({id : XoW.utils.getUniqueId("presOffline"),
        type : "unavailable"
      }).c("status").t('Offline')
        .up().c("priority").t('0');
      _sendPres(pres2);

      //_gblMgr.getUserMgr().setAllFriendsOffline();
      _gblMgr.getCurrentUser().state = 5;
      XoW.logger.me(_this.classInfo, 'sendOffline1()');
    };
    // endregion Public Methods
    _init();
  };
  return XoW;
}));
