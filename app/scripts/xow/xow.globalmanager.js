/**
 * Created by chenyi on 2018/2/26.
 * 命名规则：
 * 1.类名首字母大写
 * 2.类中私有变量和函数首字母下划线'_'
 * 3.类中公有函数首字母小写，驼峰命名
 * 4.windows全局变量首字母大写，驼峰命名
 * 5.回调命名 on + object + verb (with tense)
 */
(function (factory) {
  return factory(XoW);
}(function (XoW) {
  /**
   * 代理类（核心）：
   * 1.接受ui操作（API），下发至业务组件
   * 2.通知界面进行绘制(xxCb函数) -- 包含调用各组件的数据来拼攒成ui需要的内容格式（与layim强相关的放在View层做）
   * 3.事件总线
   *
   * 要求：各业务组件不要直接跟layim相关；业务组件只懂xmpp，业务组件也尽量别和strohpe勾搭；connection是strophe的代理
   * @constructor
   */
  XoW.GlobalManager = function () {
    // region Fields
    var _this = this;
    var _connMgr = null; // strophe的代理
    var _handlerMgr = null;
    var _rosterMgr = null;
    var _vCardMgr = null;
    var _presMgr = null;
    var _chatMgr = null;
    var _fileMgr = null;
    var _currentUserJid;
    var _currentUserPwd;
    var _mine;

    _this.classInfo = 'GlobalManager';
    // endregion Fields

    // region Private Methods
    var _init = function () {
      XoW.logger.ms(_this.classInfo, '_init()');
      _handlerMgr = new XoW.Handler();
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.CONNECT_RECEIVED, _connectCb.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.DISCONNECT_RECEIVED, _disconnectCb.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.ROSTER_RECEIVED, _onRosterRcv.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.VCARD_RECEIVED, _onVCardRcv.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.CHAT_MSG_RECEIVED, _onChatMsgRcv.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.CHAT_FILE_TRANS_REQ_RECEIVED, _onFileTransReqRcv.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.CHAT_FILE_TRANS_REQUESTED, _onFileTransRequested.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.CHAT_FILE_STATE_CHANGED, _onFileTransStatusChanged.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.CHAT_IMAGE_TRANS_REQ_RECEIVED, _onImageTransReqRcv.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.CHAT_IMAGE_RECEIVED, _onImageRcv.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.CHAT_IMAGE_TRANS_REQUESTED, _onFileTransRequested.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.PRESENCE_RECEIVED, _onPresRcv.bind(_this));
      _connMgr = new XoW.ConnectionManager(_handlerMgr);

      // 设置状态为在线。1是在线，因为刚开始登录的时候，有收不到自己出席的节的时候。
      // _currentUser.setState(1)
      XoW.logger.me(_this.classInfo, '_init()');
    };
    var _initMgrsAfterConnected = function () {
      XoW.logger.ms(_this.classInfo, '_initMgrsAfterConnected()');
      _rosterMgr = new XoW.RosterManager(_this);
      _vCardMgr = new XoW.VCardManager(_this);
      _presMgr = new XoW.PresenceManager(_this);
      _chatMgr = new XoW.ChatManager(_this);
      _fileMgr = new XoW.FileManager(_this);
      XoW.logger.me(_this.classInfo, '_initMgrsAfterConnected()');
    };
    var _actionsAfterConnected = function () {
      XoW.logger.ms(_this.classInfo, '_actionsAfterConnected()');
      _rosterMgr.getRoster();
      _presMgr.sendOnline();
      XoW.logger.me(_this.classInfo, '_actionsAfterConnected()');
    };
    var _connectCb = function (params) {
      XoW.logger.ms(_this.classInfo, '_connectCb({0})'.f(params.succ));
      if (params.succ) {
        _mine = new XoW.Friend(_currentUserJid);
        _mine.username = _mine.name;
        _mine.status = XoW.UserState.ONLINE;
        _mine.id = XoW.utils.getNodeFromJid(_currentUserJid);
        _initMgrsAfterConnected();
        _actionsAfterConnected();
      } else {
        // 非成功哦
        _handlerMgr.triggerHandler(XoW.VIEW_EVENT.LOGIN_STATE_CHANGED, params);
      }
      XoW.logger.me(_this.classInfo, '_connectCb()');
      return true; // return true 就不会删除该handler
    };
    var _disconnectCb = function (params) {
      XoW.logger.ms(_this.classInfo, '_disconnectCb({0})'.f(params));
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.DISCONNECTED, params);
      XoW.logger.me(_this.classInfo, '_disconnectCb()');
      return true;
    };
    var _onRosterRcv = function (pFriendGroups) {
      XoW.logger.ms(_this.classInfo, '_onRosterRcv()');
      // 登录成功
      var data = {mine: _mine, friend: pFriendGroups};
      var params = {data: data, succ: true};
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.LOGIN_STATE_CHANGED, params);

      // get vCard for myself
      _vCardMgr.getVCard();
      // get vCards for friends
      pFriendGroups.forEach(function (friendgp, gpIndex) {
        friendgp.list.forEach(function (friend, friendIndex) {
          _vCardMgr.getVCard(friend.jid);
        });
      });
      XoW.logger.me(_this.classInfo, '_onRosterRcv()');
    };

    var _onVCardRcv = function (pVCard) {
      XoW.logger.ms(_this.classInfo, '_onVCardRcv()');
      var friend = null;
      if (pVCard.isMine) {
        friend = _mine;
      } else {
        // 找好友列表
        friend = _rosterMgr.getFriendByJid(pVCard.jid);
        // 找群组、找通讯录....
      }
      if (friend) {
        friend.vcard = pVCard;
        if (pVCard.PHOTO.BINVAL) {
          friend.avatar = "data:image/;base64," + pVCard.PHOTO.BINVAL;
          _handlerMgr.triggerHandler(XoW.VIEW_EVENT.FRIEND_AVATAR_CHANGED, friend);
        }
        if (pVCard.NICKNAME && pVCard.NICKNAME != friend.name) {
          if (!friend.username || pVCard.isMine) {
            friend.username = friend.name = pVCard.NICKNAME;
          } else {
            friend.name = pVCard.NICKNAME;
          }
          _handlerMgr.triggerHandler(XoW.VIEW_EVENT.FRIEND_NICKNAME_CHANGED, friend);
        }
      }
      XoW.logger.me(_this.classInfo, '_onVCardRcv()');
    };

    var _perfectPeerMsgInfo = function (pMsg, pChat) {
      XoW.logger.ms(_this.classInfo, '_perfectPeerMsgInfo()');
      pMsg.id = pMsg.fromid = XoW.utils.getNodeFromJid(pMsg.from);
      if (!pChat.username) { // 如果是好友则会被设置为昵称
        // 说明是第一条消息，先查好友列表再查群组之类的
        var theFriend = _rosterMgr.getFriendByJid(XoW.utils.getBareJidFromJid(pMsg.from));
        if (theFriend && theFriend.username != pMsg.id) { // 备注名
          pChat.username = theFriend.username
        }
        var theVCard = _vCardMgr.getVCardByJid(XoW.utils.getBareJidFromJid(pMsg.from));
        if (theVCard) {
          if (theVCard.PHOTO.BINVAL) {
            pChat.avatar = 'data:image/;base64,' + theVCard.PHOTO.BINVAL;
          } else {
            pChat.avatar = XoW.DefaultImage.AVATAR_DEFAULT; // 要怎么判定是客服呢？
          }
          if (theVCard.NICKNAME && !pChat.username) {
            pChat.username = theVCard.NICKNAME;
          }
        }
      }
      if (!pChat.username) {
        pChat.username = XoW.utils.getNodeFromJid(pMsg.from);
      }
      pMsg.avatar = pChat.avatar;
      pMsg.username = pChat.username;
      XoW.logger.me(_this.classInfo, '_perfectPeerMsgInfo()');
    };

    var _onChatMsgRcv = function (param) {
      XoW.logger.ms(_this.classInfo, '_onChatMsgRcv({0})'.f(param.msg.from));
      var theMsg = param.msg;
      var theChat = param.chat;
      _perfectPeerMsgInfo(theMsg, theChat);
      if (theMsg.contentType === XoW.MessageContentType.MSG ||
        theMsg.contentType === XoW.MessageContentType.DELAYMSG) {
        _handlerMgr.triggerHandler(XoW.VIEW_EVENT.CHAT_MSG_RECEIVED, theMsg);
      }
      XoW.logger.me(_this.classInfo, '_onChatMsgRcv({0})'.f(theMsg.cid));
    };

    /**
     * 收到对端发起的文件传输请求
     * @param param
     * @private
     */
    var _onFileTransReqRcv = function (pFile) {
      XoW.logger.ms(_this.classInfo, '_onFileTransReqRcv({0})'.f(pFile.from));
      var theChat = _this.getChatMgr().getOrCreateChatByJid(pFile.from);
      theChat.addMessage(pFile);
      _perfectPeerMsgInfo(pFile, theChat);
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.CHAT_FILE_TRANS_REQ_RECEIVED, pFile);
      XoW.logger.me(_this.classInfo, '_onFileTransReqRcv()');
    };

    /**
     * 本端发起文件请求了
     * @param pFile
     * @private
     */
    var _onFileTransRequested = function (pFile) {
      XoW.logger.ms(_this.classInfo, '_onFileTransRequested({0})'.f(pFile.to));
      if(pFile.getIsImage()) {
        _handlerMgr.triggerHandler(XoW.VIEW_EVENT.CHAT_IMAGE_TRANS_REQUESTED, pFile);
      } else {
        // 不需要填写对端信息的
        _handlerMgr.triggerHandler(XoW.VIEW_EVENT.CHAT_FILE_TRANS_REQUESTED, pFile);
      }
      XoW.logger.me(_this.classInfo, '_onFileTransRequested()');
    };

    var _onFileTransStatusChanged = function (pFile) {
      XoW.logger.ms(_this.classInfo, '_onFileTransStatusChanged()');
      // 不需要填写对端信息的
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.FILE_STATE_CHANGED, pFile);
      XoW.logger.me(_this.classInfo, '_onFileTransStatusChanged()');
    };

    var _onImageTransReqRcv = function (pFile) {
      XoW.logger.ms(_this.classInfo, '_onImageTransReqRcv({0},{1})'.f(pFile.from, pFile.sid));
      var theChat = _this.getChatMgr().getOrCreateChatByJid(pFile.from);
      theChat.addMessage(pFile); // just add to the chat，render when entire img received
      _perfectPeerMsgInfo(pFile, theChat);
      XoW.logger.me(_this.classInfo, '_onImageTransReqRcv()');
    };

    var _onImageRcv = function (pFile) {
      XoW.logger.ms(_this.classInfo, '_onImageRcv({0},{1})'.f(pFile.from, pFile.sid));
      var theChat = _this.getChatMgr().getChatByJid(pFile.from);
      if (!theChat) {
        XoW.logger.e('Could not find the chat, return.');
      }
      _perfectPeerMsgInfo(pFile, theChat);
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.CHAT_IMAGE_RECEIVED, pFile);
      XoW.logger.me(_this.classInfo, '_onImageRcv()');
    };

    var _onPresRcv = function (pPres) {
      XoW.logger.ms(_this.classInfo, '_onPresRcv({0})'.f(pPres.from));
      if (pPres.isMeToMe()) {
        return;
      }
      var bareJid = XoW.utils.getBareJidFromJid(pPres.from);
      var friend = _rosterMgr.getFriendByJid(bareJid);
      if (friend) {
        var res = XoW.utils.getResourceFromJid(pPres.from);
        if (res) {
          friend.resource = res;
        }
        var newStatus = pPres.getStatus();
        if (newStatus != friend.status) {
          friend.status = newStatus;
          _handlerMgr.triggerHandler(XoW.VIEW_EVENT.FRIEND_STATUS_CHANGED, friend);
        }

        var newRes = pPres.getFromResource();
        friend.resource = newRes;
      }
      XoW.logger.me(_this.classInfo, '_onPresRcv({0})'.f(pPres.from));
    }
    // endregion Private Methods

    // region Public Methods -- Properties
    this.getCurrentUser = function () {
      XoW.logger.ms(_this.classInfo, 'getCurrentUser()');
      return _mine;
    };
    this.getHandlerMgr = function () {
      XoW.logger.ms(_this.classInfo, 'getHandlerMgr()');
      return _handlerMgr;
    };
    this.getConnMgr = function () {
      XoW.logger.ms(_this.classInfo, 'getConnMgr()');
      return _connMgr;
    };
    this.getRosterMgr = function () {
      XoW.logger.ms(_this.classInfo, 'getRosterMgr()');
      return _rosterMgr;
    };
    this.getVCardMgr = function () {
      XoW.logger.ms(_this.classInfo, 'getVCardMgr()');
      return _vCardMgr;
    };
    this.getChatMgr = function () {
      return _chatMgr;
    };
    // endregion Public Methods Properties

    // region Public Methods -- API
    this.on = function (event, callback) {
      XoW.logger.ms(_this.classInfo, 'on({0})'.f(event));
      if (typeof callback === 'function') {
        _handlerMgr.addHandler(event, callback);
      }
    };
    this.login = function (serviceURL, username, pass, pResource) {
      XoW.logger.ms(_this.classInfo, 'login()');
      _this.connect(serviceURL, username, pass, pResource);
      XoW.logger.me(_this.classInfo, 'login()');
    };
    /**
     * 新建XoW.Connection对象并开始连接
     * @param serviceURL 服务器URL
     * @param username 用户名，不包含后面的ip等
     * @param pass 密码
     * @param pResource
     */
    this.connect = function (serviceURL, username, pass, pResource) {
      XoW.logger.ms(_this.classInfo, 'connect({0},{1},{2})'.f(serviceURL, username, pass));
      _currentUserJid = username + '@' + XoW.utils.getIPFromURL(serviceURL) + '/' + pResource;
      _currentUserPwd = pass;
      // 开始连接_currentUserJid
      _connMgr.connect(serviceURL, _currentUserJid, _currentUserPwd);
      _connMgr.addHandler(function (stanza) {
        XoW.logger.d('open-->' + Strophe.serialize(stanza));
      }, null, 'open');
      XoW.logger.me(_this.classInfo, 'connect()');
    };
    this.sendMessage = function (content, toJid) {
      XoW.logger.ms(_this.classInfo, 'sendMessage({0})'.f(toJid));
      _chatMgr.sendMessage(content, toJid, _currentUserJid);
      XoW.logger.me(_this.classInfo, 'sendMessage({0})'.f(toJid));
    };
    this.getFriendById = function (pId) {
      XoW.logger.ms(_this.classInfo, 'getFriendById({0})'.f(pId));
      return _rosterMgr.getFriendById(pId);
    };

    // region file transfer
    this.sendFile = function (filename, filesize, filetype, pFulljid, data) {
      XoW.logger.ms(_this.classInfo, 'sendFile'.f(filename, filesize, filetype));
      _fileMgr.sendFile(filename, filesize, filetype, pFulljid, data);
      XoW.logger.me(_this.classInfo, 'sendFile');
    };

    /**
     *
     * @param pSid
     * @param pRemoteJid may be bare jid
     */
    this.acceptFile = function (pSid, pRemoteJid) {
      XoW.logger.ms(_this.classInfo, 'acceptFile({0}, {1})'.f(pSid, pRemoteJid));
      _fileMgr.dealSiReq(true, pSid, pRemoteJid);
      XoW.logger.me(_this.classInfo, 'acceptFile({0})'.f(pSid));
    };

    this.rejectFile = function (pSid, pRemoteJid) {
      XoW.logger.ms(_this.classInfo, 'rejectFile({0}, {1})'.f(pSid, pRemoteJid));
      _fileMgr.dealSiReq(false, pSid, pRemoteJid);
      XoW.logger.me(_this.classInfo, 'rejectFile({0})'.f(pSid));
    };

    this.stopFileTrans = function (pSid, pRemoteJid) {
      XoW.logger.ms(_this.classInfo, 'stopFileTrans({0})'.f(pSid));
      _fileMgr.stopFileTrans(pSid, pRemoteJid);
      XoW.logger.me(_this.classInfo, 'stopFileTrans()');
    };

    this.cancelFile = function (pSid, pRemoteJid) {
      XoW.logger.ms(_this.classInfo, 'stopFileTrans({0})'.f(pSid));
      _fileMgr.cancelFile(pSid, pRemoteJid);
      XoW.logger.me(_this.classInfo, 'stopFileTrans()');
    };

    this.downLoadFile = function (pSid, pRemoteJid) {
      XoW.logger.ms(_this.classInfo, 'downLoadFile({0})'.f(pSid));
      _fileMgr.downLoadFile(pSid,pRemoteJid);
      XoW.logger.me(_this.classInfo, 'downLoadFile()');
    };
    // endregion file transfer
    // endregion Public Methods

    _init();
  };
  return XoW;
}));
