(function (factory) {
  return factory(XoW);
}(function (XoW) {
  "use strict";
  /**
   * @param globalManager XoW.GlobalManager对象
   * 用于管理连接的，建议作为strophe代理
   */
  XoW.ConnectionManager = function (eventManager) {
    this._eventMgr = eventManager;
    this._stropheConn = null;
    this.classInfo = "ConnectionManager";
    this._init();
  };

  XoW.ConnectionManager.prototype = {
    _init: function () {
      XoW.logger.ms(this.classInfo, '_init()');
      XoW.logger.me(this.classInfo,'_init()');
    },

    // region Private Methods
    /**
     * Strophe.Connection.connect方法的回调函数
     * @param cond 登录结果代码
     */
    _connectCb: function (cond) {
      XoW.logger.ms(this.classInfo, '_connectCb({0})'.f(cond));
      var msg = "";
      var succ = false;
      var success = false;
      if (cond == Strophe.Status.Error) {
        msg = ' 发生错误！';
      } else if (cond == Strophe.Status.CONNECTING) {
        msg = ' 连接中...';
      } else if (cond == Strophe.Status.CONNFAIL) {
        msg = ' 连接失败！';
      } else if (cond == Strophe.Status.AUTHENTICATING) {
        msg = ' 身份认证中...';
      } else if (cond == Strophe.Status.AUTHFAIL) {
        msg = ' 身份认证失败！';
      } else if (cond == Strophe.Status.CONNECTED) {
        msg = ' 登录成功！';
        succ = true;
      } else if (cond == Strophe.Status.DISCONNECTED) {
        var msg = '连接断开';
        this._eventMgr.triggerHandler(XoW.SERVICE_EVENT.DISCONNECT_RCV, msg);
        return true;
      } else if (cond == Strophe.Status.DISCONNECTING) {
        msg = ' 断开连接中...';
      } else if (cond == Strophe.Status.ATTACHED) {
        msg = ' 附加！';
      } else if (cond == Strophe.Status.REDIRECT) {
        msg = ' 重定向！';
      } else if (cond == Strophe.Status.CONNTIMEOUT) {
        msg = ' 连接超时！';
      }
      var params = { data : msg, succ : succ };
      this._eventMgr.triggerHandler(XoW.SERVICE_EVENT.CONNECT_RCV, params);
      XoW.logger.me(this.classInfo, '_connectCb()');
      return true;
    },
    /**
     * 重写Strophe.Connection的rowInput和rowOutput方法
     * 用来打印报文到指定 divId的div中。
     * 如果divId不存在则说明不需要打日志
     * 该方法该不该放在这？
     */
    _redirectInputOutput: function () {
      XoW.logger.ms(this.classInfo, '_redirectInputOutput()');
      this._stropheConn.rawInput = function (data) {
        XoW.logger.receivePackage(data);
      }.bind(this);
      this._stropheConn.rawOutput = function (data) {
        XoW.logger.sendPackage(data);
      }.bind(this);
      XoW.logger.me(this.classInfo, '_redirectInputOutput()');
    },
    // endregion Private Methods

    // region Public Methods
    /**
     * 获得_StropheConn
     * @returns {___anonymous__stropheConn}
     */
    getStropheConnection: function () {
      return this._stropheConn;
    },
    /**
     * 连接服务器
     * @param serviceURL
     * @param jid
     * @param pass
     * @param cb 传过来的回调函数，用于返回连接的结果
     */
    connect: function (serviceURL, jid, pass) {
      XoW.logger.ms(this.classInfo, 'connect()');

      // 新建一个Strophe.Connection对象，此时并未开始连接服务器
      this._stropheConn = new Strophe.Connection(serviceURL);
      this._redirectInputOutput();
      this._stropheConn.connect(jid, pass, this._connectCb.bind(this));

      XoW.logger.me(this.classInfo, 'connect()');
    },
    /**public
     * 发送节
     * @param target 节
     */
    send: function (target) {
      XoW.logger.ms(this.classInfo, 'send()');

      this._stropheConn.send(target);

      XoW.logger.me(this.classInfo, 'send()');
    },
    /**
     * 断开连接
     * @param reason
     */
    disconnect: function (reason) {
      XoW.logger.ms(this.classInfo, 'disconnect({0})'.f(reason));
      this._stropheConn.disconnect(reason);
      XoW.logger.me(this.classInfo, 'disconnect()');
    },
    /**
     * 发送节，对Strophe本身的sendIQ的一层封装
     * @param elem 发送的元素
     * @param callback(result节) 成功的回调，会返回节
     * @param errback(error节)
     * @param timeout 设置超时
     * @returns 返回的发送的iq节的id。
     */
    sendIQ: function (elem, callback, errback, timeout) {
      XoW.logger.ms(this.classInfo, 'sendIQ()');
      this._stropheConn.sendIQ(elem, callback, errback, timeout);
      XoW.logger.me(this.classInfo, 'sendIQ()');
    },
    /**public
     * 添加节监听器到Strophe.Connection对象上。这里只是做了一步封装。
     * @param handler should return true to keep handler active
     * @param ns
     * @param name
     * @param type
     * @param id
     * @param from
     * @param options
     */
    addHandler: function (handler, ns, name, type, id, from, options) {
      XoW.logger.ms(this.classInfo, 'addHandler({0})'.f(name));
      this._stropheConn.addHandler(handler, ns, name, type, id, from, options);
      XoW.logger.me(this.classInfo, 'addHandler()');
    },

    // region si ibb file transfer -- 纯代理，不要加动作
    // region local start initiation
    /**
     * Stream initiation（start negotiation）
     * @param pFile
     * @param callback
     */
    sendFileSi: function (id, fullJid, sid, name, size, type, callback) {
      XoW.logger.ms(this.classInfo, 'sendFileSi()');
      this._stropheConn.si_filetransfer.send(id,
        fullJid, sid, name, size, type, callback);
      XoW.logger.me(this.classInfo, 'sendFileSi()');
    },
    cancelFileSi: function (id, fullJid, sid, callback) {
      XoW.logger.ms(this.classInfo, 'cancelFileSi()');
      this._stropheConn.si_filetransfer.cancel(id,
        fullJid, sid, callback);
      XoW.logger.me(this.classInfo, 'cancelFileSi()');
    },
    /**
     * ibb progress：
     * open: function (to, sid, bs, cb)
     * data: function (to, sid, seq, data, cb)
     * close: function (to, sid, cb)
     * @param pFile
     * @param callback
     */
    openIBB: function (fullJid, sid, blockSize, callback) {
      XoW.logger.ms(this.classInfo, 'openIBB()');
      this._stropheConn.ibb.open(fullJid, sid, blockSize, callback);
      XoW.logger.me(this.classInfo, 'openIBB()');
    },
    sendDataByIBB: function (fullJid, sid, seq, dataFragment, callback) {
      XoW.logger.ms(this.classInfo, 'sendDataByIBB({0},{1})'.f(sid, seq));
      this._stropheConn.ibb.data(fullJid, sid, seq, dataFragment, callback);
      XoW.logger.me(this.classInfo, 'sendDataByIBB()');
    },
    closeIBB: function (fullJid, sid, callback) {
      XoW.logger.ms(this.classInfo, 'closeIBB()');
      this._stropheConn.ibb.close(fullJid, sid, callback);
      XoW.logger.me(this.classInfo, 'closeIBB()');
    },
    // endregion local start initiation

    // region remote start initiation
    /**
     *
     * @param callback
     * @constructor
     */
    addReceiveFileSiHandler: function (callback) {
      XoW.logger.ms(this.classInfo, 'addReceiveFileSiHandler()');
      this._stropheConn.si_filetransfer.addFileHandler(callback);
      XoW.logger.me(this.classInfo, 'addReceiveFileSiHandler()');
    },

    addIBBHandler: function (callback) {
      XoW.logger.ms(this.classInfo, 'addIBBHandler()');
      this._stropheConn.ibb.addIBBHandler(callback);
      XoW.logger.me(this.classInfo, 'addIBBHandler()');
    },
    /**
     * response of si negotiation from remote peer.
     * @param doAccept do accept or reject
     * @param from local
     * @param to remote
     * @param sid si session id, no use now.
     * @param siId si session id
     */
    sendFileSiResult: function (doAccept, from, to, sid, iqId) {
      XoW.logger.ms(this.classInfo, 'sendFileSiResult({0}, {1}).f(sid, iqId)');
      this._stropheConn.si_filetransfer._receive_2(doAccept, from, to, sid, iqId);
      XoW.logger.ms(this.classInfo, 'sendFileSiResult()');
    }
    // endregion remote start initiation
    // endregion si ibb file transfer
    // endregion Public Methods
  };
  return XoW;
}));