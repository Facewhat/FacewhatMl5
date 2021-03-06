/**
 * Created by chenyi on 2018/2/26.
 * 命名规则：
 * 1.类名首字母大写
 * 2.类中私有变量和函数首字母下划线'_',UI元素变量加前缀'$'
 * 3.类中公有函数首字母小写，驼峰命名
 * 4.windows全局变量首字母大写，驼峰命名
 * 5.非一次性回调命名on + Subject + Verb(with tense)（在strophe侧，返回true继续监听，反之反之）
 * 6.一次性回调命名cb + Verb + Subject，返回值无关
 * 7.get+noun,传回调参数（隐喻返回值形式），即采用同步形式
 */
(function (factory) {
  'use strict';
  return factory(window.XoW, window.Strophe);
}(function (XoW, Strophe) {
  'use strict';
  /**
   * 代理类（核心）：
   * 1.接受ui操作（API），下发至业务组件
   * 2.通知界面进行绘制(xxCb函数) -- 包含调用各组件的数据来拼攒成ui需要的内容格式（与layim强相关的放在View层做）
   * 3.事件总线
   * 4.全局存储组件 -- cache
   *
   * 要求：各业务组件不要直接跟layim相关；业务组件只懂xmpp，业务组件也尽量别和strohpe勾搭；connection是strophe的代理
   * @constructor
   */
  XoW.GlobalManager = function () {
    // region Fields
    var _this = this;
    _this.classInfo = 'GlobalManager';
    // modules
    var _connMgr = null; // strophe的代理
    var _handlerMgr = null;
    var _rosterMgr = null;
    var _vCardMgr = null;
    var _presMgr = null;
    var _chatMgr = null;
    var _fileMgr = null;
    var _mine = null;
    var _archiveMgr = null;
    var _currentUserJid = null;
    var _serverMgr = null;
    var _roomMgr = null;
    var _httpMsg = null;
    // endregion Fields

    // region Private Methods
    //var _createData = function (data) {
    //  var mine = data.mine || {};
    //  var local = {};
    //  var obj = {
    //    base: data.options //基础配置信息
    //    , local: local //本地数据
    //    , mine: mine //我的用户信息
    //    , friend: data.friend || [] //联系人信息
    //    , group: data.group || [] //群组信息
    //    , history: local.history || {} //历史会话信息
    //  };
    //};
    var _init = function () {
      XoW.logger.ms(_this.classInfo, '_init()');
      _handlerMgr = new XoW.Handler();
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.CONNECT_RCV, _onConnect.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.DISCONNECT_RCV, _onDisconnected.bind(_this));

      _handlerMgr.addHandler(XoW.SERVICE_EVENT.ROSTER_RCV, _onRosterRcv.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.ROSTER_CONTACT_REMOVED, _onContactRemoved.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.ROSTER_CONTACT_ADDED, _onContactAdded.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.ROSTER_CONTACT_DISSOLVED, _onContactDissolved.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.ROSTER_CONTACT_MODIFIED, _onContactModified.bind(_this));

      _handlerMgr.addHandler(XoW.SERVICE_EVENT.SUB_CONTACT_READY, _onSubContactReady.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.SUB_CONTACT_REQ_SUC, _onSubContactReqSuc.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.SUB_CONTACT_BE_APPROVED, _onSubContactBeApproved.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.SUB_CONTACT_BE_DENIED, _onSubContactBeDenied.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.SUB_ME_REQ_RCV, _onSubMeReqRcv.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.UN_SUB_ME_REQ_RCV, _onUnSubMeReqRcv.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.UN_SUB_CONTACT_REQ_SUC, _onUnSubMeReqRcv.bind(_this));

      _handlerMgr.addHandler(XoW.SERVICE_EVENT.CARD_RCV, _onVCardRcv.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.CHAT_MSG_RCV, _onChatMsgRcv.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.CHAT_FILE_TRANS_REQ_RCV, _onFileTransReqRcv.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.CHAT_FILE_TRANS_REQ_SUC, _onFileTransRequested.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.CHAT_FILE_STATE_CHANGED, _onFileTransStatusChanged.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.CHAT_IMAGE_TRANS_REQ_RCV, _onImageTransReqRcv.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.CHAT_IMAGE_RCV, _onImageRcv.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.CHAT_IMAGE_TRANS_REQ_SUC, _onFileTransRequested.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.PRESENCE_RCV, _onPresRcv.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.USER_SEARCH_RSP_RCV, _onUserSearchRspRcv.bind(_this));

      _handlerMgr.addHandler(XoW.SERVICE_EVENT.ROOM_ROOMLIST_ADDED, _cbRoomListadded.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.ROOM_MSG_RCV, _cbRoomMsgRcv.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.ROOM_DISAGREE_INVITE,_cbDisagreeInvited.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.ROOM_FORBIT_MEMBERSPEARK,_cbForbitMemberSpeake.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.ROOM_NO_INVITATION_PERMISSION,_cbNoInvitePermission.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.ROOM_WRONG_PASSWORD,_cbWwrongPassword.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.ROOM_MEMBER_ONLY,_cbMemberOnly.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.ROOM_MAXNUM_PEOPLE,_cbMaximumPeopleRcv.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.ROOM_FORBIT_IN,_cbForBitIn.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.ROOM_SELF_MOVEOUT, _cbRomSelfMoveOut.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.ROOM_DESTROY_ROOM,_cbDestroyRoom.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.ROOM_ONE_EXITROOM,_cbOnePersonExitRoom.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.ROOM_INVITE_RCV,_cbRoomInvitRcv.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.ROOM_TITLE_RCV,_cbSetRoomTile.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.ROOM_OJROOMCHAT,_cbOjRoomChat.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.ROOM_ERROR_SHOW,_cbRoomErrorShow.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.ERROR,_cbError.bind(_this));

      _handlerMgr.addHandler(XoW.SERVICE_EVENT.HTTP_FILETRANSFER_CLOSE,_onHttpFileTransfer.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.HTTP_SEND_FILE_TO_USER_FROM_MINE,_onSendFileToUserFromMine.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.HTTP_CHANGE_FILE_STATUS,_onHttpChangeFileStatus.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.HTTP_FILE_STRANSFER_ERROR,_cbFileStransferError.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.HTTP_FILE_STRANSFER_SUCCESS,_cbFileStransferSuccess.bind(_this));
      // _handlerMgr.addHandler(XoW.SERVICE_EVENT.HTTP_FILE_STRANSFER_CANCEL,_cbFileStransferCancel.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.HTTP_FILE_STRANSFER_BEGIN,_cbHttpFileBegin.bind(_this));
      // _handlerMgr.addHandler(XoW.SERVICE_EVENT.HTTP_FILE_STRANSFER_SERVERERROR,_cbHttpFileServerError.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.HTTP_FILE_STRANSFER_OVERDUE,_cbHttpFileOverdue.bind(_this));
      _handlerMgr.addHandler(XoW.SERVICE_EVENT.KEFUMSGREV,_cbKEefuMsgRev.bind(_this));
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
      _archiveMgr = new XoW.ArchiveManager(_this);
      _serverMgr = new XoW.ServerMananger(_this);
      _roomMgr = new XoW.RoomManager(_this);
      _httpMsg = new XoW.HttpFileManager(_this);
      XoW.logger.me(_this.classInfo, '_initMgrsAfterConnected()');
    };
    var _actionsAfterConnected = function () {
      XoW.logger.ms(_this.classInfo, '_actionsAfterConnected()');
      _rosterMgr.getRoster();
      _presMgr.sendOnline();
      _roomMgr.getAllRoomFromSer();
      _httpMsg.getHttpFileMsgFromSevice();
      XoW.logger.me(_this.classInfo, '_actionsAfterConnected()');
    };
    var _onConnect = function (params) {
      XoW.logger.ms(_this.classInfo, '_onConnect({0})'.f(params.succ));
      if (params.succ) {
        _mine = new XoW.Friend(_currentUserJid);
        _mine.username = _mine.name;
        _mine.status = XoW.UserState.ONLINE;
        _initMgrsAfterConnected();
        _actionsAfterConnected();
      } else {
        // 非成功哦
        _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_LOGIN_STATE_CHANGED, params);
      }
      XoW.logger.me(_this.classInfo, '_onConnect()');
      return true; // return true 就不会删除该handler
    };
    var _onDisconnected = function (params) {
      XoW.logger.ms(_this.classInfo, '_onDisconnected({0})'.f(params));
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_DISCONNECTED, params);
      XoW.logger.me(_this.classInfo, '_onDisconnected()');
      return true;
    };
    var _onRosterRcv = function (pFriendGroups) {
      XoW.logger.ms(_this.classInfo, '_onRosterRcv()');
      // 登录成功
      var data = {friend: pFriendGroups};
      var loginParams = {data: data, succ: true};
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_LOGIN_STATE_CHANGED, loginParams);

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
    var _onContactRemoved = function (pUser) {
      XoW.logger.ms(_this.classInfo, '_onContactRemoved({0})'.f(pUser.jid));
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_FRIEND_REMOVED, pUser);
      XoW.logger.me(_this.classInfo, '_onContactRemoved()');
    };
    var _onContactAdded = function (pUser) {
      XoW.logger.ms(_this.classInfo, '_onContactAdded({0})'.f(pUser.jid));
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_FRIEND_ADDED, pUser);
      _vCardMgr.getVCard(pUser.jid);
      XoW.logger.me(_this.classInfo, '_onContactAdded()');
    };
    var _onContactModified = function (pParam) {
      XoW.logger.ms(_this.classInfo, '_onContactModified({0})'.f(pParam.old.jid));
      if (pParam.old.username !== pParam.latest.username) {
        pParam.old.username = pParam.latest.username;
        _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_FRIEND_NICKNAME_CHANGED, pParam.old);
      }
      if (pParam.old.groupid !== pParam.latest.groupid) {
        pParam.old.groupid = pParam.latest.groupid;
        _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_FRIEND_GROUP_CHANGED, pParam.old);
      }
      XoW.logger.me(_this.classInfo, '_onContactModified()');
    };
    var _onContactDissolved = function (pUser) {
      XoW.logger.ms(_this.classInfo, '_onContactDissolved({0})'.f(pUser.jid));
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_FRIEND_REMOVED, pUser);
      XoW.logger.me(_this.classInfo, '_onContactDissolved()');
    };
    var _onVCardRcv = function (pVCard) {
      XoW.logger.ms(_this.classInfo, '_onVCardRcv()');
      var friend = null;
      if (pVCard.isMine) {
        friend = _this.getCache().mine;
      } else {
        // 找好友列表
        friend = _this.getContactByJid(pVCard.jid);
        // 找群组、找通讯录....
      }
      if (friend) {
        friend.vcard = pVCard;
        if (pVCard.PHOTO.BINVAL) {
          friend.avatar = 'data:image/;base64,' + pVCard.PHOTO.BINVAL;
          _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_FRIEND_AVATAR_CHANGED, friend);
        }
        if (pVCard.NICKNAME &&
            pVCard.NICKNAME !== friend.username) {
          if (!friend.username || pVCard.isMine) {
            friend.username = pVCard.NICKNAME;
          } else {
            friend.username = pVCard.NICKNAME;
          }
          _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_FRIEND_NICKNAME_CHANGED, friend);
        }
        if (pVCard.DESC && pVCard.DESC !== friend.sign) {
          friend.sign = pVCard.DESC;
          _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_FRIEND_SIGN_CHANGED, friend);
        }
      }
      XoW.logger.me(_this.classInfo, '_onVCardRcv()');
    };
    // 填充msg消息体，用以显示
    var _perfectPeerMsgInfo = function (pMsg, pChat) {
      XoW.logger.ms(_this.classInfo, '_perfectPeerMsgInfo()');
      pMsg.id = pMsg.fromid = XoW.utils.getNodeFromJid(pMsg.from);
      if (!pChat.username) {
        // 如果是好友则会被设置为昵称
        // 说明是第一条消息，先查好友列表再查群组之类的
        var theFriend = _this.getContactByJid(pMsg.from);
        if (theFriend && theFriend.username !== pMsg.id) { // 备注名
          pChat.username = theFriend.username;
        }
        var theVCard = _vCardMgr.getVCardByJid(pMsg.from);
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
      // 非好友&聊天面板没打开，则设置jid让layui把jid写到聊天窗口 add by cy [20190413]
      pMsg.jid = pChat.to;
      XoW.logger.me(_this.classInfo, '_perfectPeerMsgInfo()');
    };
    var _onChatMsgRcv = function (param) {
      XoW.logger.ms(_this.classInfo, '_onChatMsgRcv({0})'.f(param.msg.from));
      var theMsg = param.msg;
      var theChat = param.chat;
      _perfectPeerMsgInfo(theMsg, theChat);
      if (theMsg.contentType === XoW.MessageContentType.MSG ||
          theMsg.contentType === XoW.MessageContentType.DELAYMSG) {
        _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_CHAT_MSG_RCV, theMsg);
      }
      XoW.logger.me(_this.classInfo, '_onChatMsgRcv({0})'.f(theMsg.cid));
    };
    var _onPresRcv = function (pPres) {
      XoW.logger.ms(_this.classInfo, '_onPresRcv({0})'.f(pPres.from));
      if (pPres.isMeToMe()) {
        return;
      }
      var friend = _this.getContactByJid(pPres.from);
      if (friend) {
        var res = XoW.utils.getResourceFromJid(pPres.from);
        if (res) {
          friend.resource = res;
        }
        var newStatus = pPres.getStatus();
        if (newStatus !== friend.status) {
          friend.status = newStatus;
          _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_FRIEND_STATUS_CHANGED, friend);
        }
      }
      XoW.logger.me(_this.classInfo, '_onPresRcv({0})'.f(pPres.from));
    };
    var _onUserSearchRspRcv = function (param) {
      XoW.logger.ms(_this.classInfo, '_onUserSearchRspRcv()');
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_USER_SEARCH_RSP_RCV, param);
      XoW.logger.me(_this.classInfo, '_onUserSearchRspRcv()');
    };

    // region file transfer
    var _onFileTransReqRcv = function (pFile) {
      XoW.logger.ms(_this.classInfo, '_onFileTransReqRcv({0})'.f(pFile.from));
      var theChat = _this.getChatMgr().getOrCreateChatByJid(pFile.from);
      theChat.addMessage(pFile);
      _perfectPeerMsgInfo(pFile, theChat);
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_CHAT_FILE_TRANS_REQ_RCV, pFile);
      XoW.logger.me(_this.classInfo, '_onFileTransReqRcv()');
    };
    var _onFileTransRequested = function (pFile) {
      XoW.logger.ms(_this.classInfo, '_onFileTransRequested({0})'.f(pFile.to));
      if (pFile.getIsImage()) {
        _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_CHAT_IMAGE_TRANS_REQ_SUC, pFile);
      } else {
        // 不需要填写对端信息的
        _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_CHAT_FILE_TRANS_REQ_SUC, pFile);
      }
      XoW.logger.me(_this.classInfo, '_onFileTransRequested()');
    };
    var _onFileTransStatusChanged = function (pFile) {
      XoW.logger.ms(_this.classInfo, '_onFileTransStatusChanged()');
      // 不需要填写对端信息的
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_FILE_STATE_CHANGED, pFile);
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
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_CHAT_IMAGE_RCV, pFile);
      XoW.logger.me(_this.classInfo, '_onImageRcv()');
    };
    var _onHttpFileTransfer = function (pFile) {
      XoW.logger.ms(_this.classInfo, '_onHttpFileTransfer()');
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_HTTP_FILETRANSFER_CLOSE, pFile);
      return true;
      XoW.logger.me(_this.classInfo, '_onHttpFileTransfer()');
    }
    var _onSendFileToUserFromMine = function (pFile) {
      XoW.logger.ms(_this.classInfo, '_onSendFileToUserFromMine()');
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_HTTP_SEND_FILE_TO_USER_FROM_MINE, pFile);
      return true;
      XoW.logger.me(_this.classInfo, '_onSendFileToUserFromMine()');
    }
    var _onHttpChangeFileStatus = function (pFile) {
      XoW.logger.ms(_this.classInfo, '_onHttpChangeFileStatus()');
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_HTTP_CHANGE_FILE_STATUS, pFile);
      return true;
      XoW.logger.me(_this.classInfo, '_onHttpChangeFileStatus()');
    }

    var _cbFileStransferError = function (data) {
      XoW.logger.ms(_this.classInfo, '_cbFileStransferError()');
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_HTTP_FILE_STRANSFER_ERROR, data);
      return true;
      XoW.logger.me(_this.classInfo, '_cbFileStransferError()');
    }
    var _cbFileStransferSuccess = function (data) {
      XoW.logger.ms(_this.classInfo, '_cbFileStransferSuccess()');
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_HTTP_FILE_STRANSFER_SUCCESS, data);
      return true;
      XoW.logger.me(_this.classInfo, '_cbFileStransferSuccess()');
    }
    // var _cbFileStransferCancel = function (data) {
    //   XoW.logger.ms(_this.classInfo, '_cbFileStransferCancel()');
    //   _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_HTTP_FILE_STRANSFER_CANCEL, data);
    //   return true;
    //   XoW.logger.me(_this.classInfo, '_cbFileStransferCancel()');
    // }

    var _cbHttpFileBegin = function (data) {
      XoW.logger.ms(_this.classInfo, '_cbHttpFileBegin()');
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_HTTP_FILE_STRANSFER_BEGIN, data);
      return true;
      XoW.logger.me(_this.classInfo, '_cbHttpFileBegin()');
    }
    // var _cbHttpFileServerError = function(params){
    //   XoW.logger.ms(_this.classInfo, '_cbHttpFileServerError()');
    //   _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_HTTP_FILE_STRANSFER_SERVERERROR,params);
    //   return true;
    //   XoW.logger.me(_this.classInfo, '_cbHttpFileServerError()');
    // }

    var _cbHttpFileOverdue = function (params) {
      XoW.logger.ms(_this.classInfo, '_cbHttpFileOverdue()');
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_HTTP_FILE_STRANSFER_OVERDUE, params);
      return true;
      XoW.logger.me(_this.classInfo, '_cbHttpFileOverdue()');
    }
    var _cbKEefuMsgRev = function (data) {
      XoW.logger.ms(_this.classInfo, '_cbKEefuMsgRev()');
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_KEFUMSGREV, data);
      return true;
      XoW.logger.me(_this.classInfo, '_cbKEefuMsgRev()');
    }
    // endregion file transfer

    // region contact subscription
    var _onSubContactReady = function (pUser) {
      XoW.logger.ms(_this.classInfo, '_onSubContactReady({0})'.f(pUser.id));
      _presMgr.subscribe(pUser.jid, _this.getCache().mine.jid, pUser.remark);
      XoW.logger.me(_this.classInfo, '_onSubContactReady()');
    };

    var _onSubContactReqSuc = function (pSubMsg) {
      XoW.logger.ms(_this.classInfo, '_onSubContactReqSuc({0},{1})'.f(pSubMsg.item.id, pSubMsg.item.subscription));
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_SUB_CONTACT_REQ_SUC, pSubMsg);
      _vCardMgr.getVCard(pSubMsg.item.jid);
      XoW.logger.me(_this.classInfo, '_onSubContactReqSuc()');
    };

    var _onSubContactBeApproved = function (pSubMsg) {
      XoW.logger.ms(_this.classInfo, '_onSubContactBeApproved({0})'.f(pSubMsg.cid));
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_SUB_CONTACT_BE_APPROVED, pSubMsg);
      XoW.logger.me(_this.classInfo, '_onSubContactBeApproved()');
    };

    var _onSubContactBeDenied = function (pSubMsg) {
      XoW.logger.ms(_this.classInfo, '_onSubContactBeDenied({0})'.f(pSubMsg.cid));
      // of 不会去remove，故roster subscription为none
      _rosterMgr.removeContact(pSubMsg.item.jid);
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_SUB_CONTACT_BE_DENIED, pSubMsg);
      XoW.logger.me(_this.classInfo, '_onSubContactBeDenied()');
    };

    var _onSubMeReqRcv = function (pSubMsg) {
      XoW.logger.ms(_this.classInfo, '_onSubMeReqRcv({0})'.f(pSubMsg.cid));
      // 涉及多终端登录，故所有没有保存在服务端的订阅记录都无法印证这是对端发起的订阅
      //>还是对端接受本端订阅后的请求
      //>由于协议没有指定pres和roster set的发送次序：
      //>1.A加B为好友，A未等B接受直接退出，登录时，roster先取到，故无此担忧
      //>2.A加B为好友, B pres通过，后面A才拿到roster set 'to', A加B的时候
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_SUB_ME_REQ_RCV, pSubMsg);
      XoW.logger.me(_this.classInfo, '_onSubMeReqRcv({0})'.f(pSubMsg.cid));
    };

    var _onUnSubMeReqRcv = function (pSubMsg) {
      XoW.logger.ms(_this.classInfo, '_onUnSubMeReqRcv({0})'.f(pSubMsg.cid));
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_NEW_INFO_ADDED, pSubMsg);
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_FRIEND_REMOVED, pSubMsg.item);
      XoW.logger.me(_this.classInfo, '_onUnSubMeReqRcv({0})'.f(pSubMsg.cid));
    };

    var _cbRoomListadded = function (params) {
      XoW.logger.ms(_this.classInfo + "_cbRoomListadded");
      var room = params.addValue;
      var roomname = XoW.utils.getNodeFromJid(room.jid);
      var peopleNumber = room.getOccupants();
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_ROOMLIST_ADDED, params);
      return true;
      XoW.logger.me(_this.classInfo, '_cbRoomListadded()');
    };
    var _cbRoomMsgRcv = function (params) {
      XoW.logger.ms(_this.classInfo, '_cbRoomMsg()');
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_ROOM_MSG_RCV, params);
      XoW.logger.me(_this.classInfo, '_cbRoomMsg()');
    };
    var _cbDisagreeInvited = (data) => {
      XoW.logger.ms(_this.classInfo + "_cbDisagreeInvited");
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_ROOM_DISAGREE_INVITE, data);
      XoW.logger.me(_this.classInfo, '_cbDisagreeInvited()');
    }
    var _cbForbitMemberSpeake = (data) => {
      XoW.logger.ms(_this.classInfo + "_cbForbitMemberSpeake");
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_ROOM_FORBIT_MEMBERSPEARK, data);
      XoW.logger.me(_this.classInfo, '_cbForbitMemberSpeake()');
    }
    var _cbNoInvitePermission = (data) => {
      XoW.logger.ms(_this.classInfo + "_cbNoInvitePermission()");
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_ROOM_NO_INVITATION_PERMISSION, data);
      XoW.logger.me(_this.classInfo, '_cbNoInvitePermission()');
    }
    var _cbWwrongPassword = (data) => {
      XoW.logger.ms(_this.classInfo + "_cbWwrongPassword()");
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_ROOM_WRONG_PASSWORD, data);
      XoW.logger.me(_this.classInfo, '_cbWwrongPassword()');
    }
    var _cbMemberOnly = (data) => {
      XoW.logger.ms(_this.classInfo + "_cbMemberOnly()");
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_ROOM_MEMBER_ONLY, data);
      XoW.logger.me(_this.classInfo, '_cbMemberOnly()');
    }
    var _cbMaximumPeopleRcv = (data) => {
      XoW.logger.ms(_this.classInfo + "_cbMaximumPeopleRcv()");
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_ROOM_MAXNUM_PEOPLE, data);
      XoW.logger.me(_this.classInfo, '_cbMaximumPeopleRcv()');
    }
    var _cbForBitIn = (params) => {
      XoW.logger.ms(_this.classInfo + "_cbForBitIn");
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_ROOM_FORBIT_IN, params);
      XoW.logger.me(_this.classInfo, '_cbForBitIn()');
    }
    var _cbRomSelfMoveOut = (params) => {
      XoW.logger.ms(_this.classInfo + "_cbRomSelfMoveOut");
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_ROOM_SELF_MOVEOUT, params);
      XoW.logger.me(_this.classInfo, '_cbRomSelfMoveOut()');
    }
    var _cbDestroyRoom = function (datta) {
      XoW.logger.ms(_this.classInfo + "_cbDestroyRoom");
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_ROOM_DESTROY, datta);
      return true
      XoW.logger.me(_this.classInfo, '_cbDestroyRoom()');
    }
    var _cbOnePersonExitRoom = (data) => {
      XoW.logger.ms(_this.classInfo + "_cbOnePersonExitRoom");
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_ROOM_ONE_EXIT, data);
      XoW.logger.me(_this.classInfo, '_cbOnePersonExitRoom()');
    }
    var _cbRoomInvitRcv = function (params) {
      XoW.logger.ms(_this.classInfo + "_cbRoomInvitRcv");
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_ROOM_INVITE_RCV, params);
      return true;
      XoW.logger.me(_this.classInfo, '_cbRoomInvitRcv()');
    };
    var _cbSetRoomTile = function (data) {
      XoW.logger.ms(_this.classInfo + "_cbSetRoomTile");
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_ROOMTILE_RCV, data);
      return true;
      XoW.logger.me(_this.classInfo, '_cbSetRoomTile()');
    };
    var _cbOjRoomChat = function (data) {
      XoW.logger.ms(_this.classInfo + "_cbOjRoomChat");
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_ROOM_OJROOMCHAT, data);
      return true;
      XoW.logger.me(_this.classInfo, '_cbOjRoomChat()');
    }
    var _cbRoomErrorShow = function (data) {
      XoW.logger.ms(_this.classInfo + "_cbRoomErrorShow");
      _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_ROOM_ERROR_SHOW, data);
      return true;
      XoW.logger.me(_this.classInfo, '_cbRoomErrorShow()');
    }
      var _cbDisagreeInvitationRcv = (data) => {
        XoW.logger.ms(_this.classInfo + "_cbDisagreeInvitationRcv");
        _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_DISAGREE_INVITATION, data);
        XoW.logger.me(_this.classInfo, '_cbDisagreeInvitationRcv()');
      }
      var _cbBandSpeaked = (data) => {
        XoW.logger.ms(_this.classInfo + "_cbBandSpeaked");
        _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_BANSPEAKE, data);
        XoW.logger.me(_this.classInfo, '_cbBandSpeaked()');
      }
      var _cbNotInvitionPowerRcv = (data) => {
        XoW.logger.ms(_this.classInfo + "_cbNotInvitionPowerRcv()");
        _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_NO_POWER_INVITION, data);
        XoW.logger.me(_this.classInfo, '_cbNotInvitionPowerRcv()');
      }
      var _cbWwrongPasswordRcv = (data) => {
        XoW.logger.ms(_this.classInfo + "_cbWwrongPasswordRcv()");
        _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_WRONGPASSWROD, data);
        XoW.logger.me(_this.classInfo, '_cbWwrongPasswordRcv()');
      }
      var _cbNotMemberRcv = (data) => {
        XoW.logger.ms(_this.classInfo + "_cbNotMemberRcv()");
        _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_NON_MEMBERS, data);
        XoW.logger.me(_this.classInfo, '_cbNotMemberRcv()');
      }
      var _cbMaximumPeopleRcv = (data) => {
        XoW.logger.ms(_this.classInfo + "_cbMaximumPeopleRcv()");
        _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_MAXIMUM_PEOPLE, data);
        XoW.logger.me(_this.classInfo, '_cbMaximumPeopleRcv()');
      }
      var _cbBandIn_Rcv = (params) => {
        XoW.logger.ms(_this.classInfo + "_cbBandIn_Rcv");
        _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_BANIN_RCV, params);
        XoW.logger.me(_this.classInfo, '_cbBandIn_Rcv()');
      }
      var _cbRoomKickOutRcv = (params) => {
        XoW.logger.ms(_this.classInfo + "_cbRoomKickOutRcv");
        _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_ROOMKICKOUT_RCV, params);
        XoW.logger.me(_this.classInfo, '_cbRoomKickOutRcv()');
      }
      var _cbDestroyRoomRcv = function (datta) {
        XoW.logger.ms(_this.classInfo + "_cbDestroyRoomRcv");
        _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_ROOMDESROY_RCV, datta);
        return true
        XoW.logger.me(_this.classInfo, '_cbDestroyRoomRcv()');
      }
      var _cbOnePersonExitRoomRcv = (data) => {
        XoW.logger.ms(_this.classInfo + "_cbOnePersonExitRoomRcv");
        _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_ONEPERSON_EXIT_ROOM, data);
        XoW.logger.me(_this.classInfo, '_cbOnePersonExitRoomRcv()');
      }
      var _cbInvitemeRoom = function (params) {
        XoW.logger.ms(_this.classInfo + "_cbInvitemeRoom");
        _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_INVITE_RCV, params);
        return true;
        XoW.logger.me(_this.classInfo, '_cbInvitemeRoom()');
      };
      var _cbGetRoomTile = function (data) {
        XoW.logger.ms(_this.classInfo + "_cbGetRoomTile");
        _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_ROOMTILE_RCV, data);
        return true
        XoW.logger.me(_this.classInfo, '_cbGetRoomTile()');
      };
      var _cbError = function (data) {
        XoW.logger.ms(_this.classInfo + "_cbError");
        _handlerMgr.triggerHandler(XoW.VIEW_EVENT.V_ERROR, data);
        return true
        XoW.logger.me(_this.classInfo, '_cbError()');
      }
      // endregion contact subscription
      // endregion Private Methods

      // region Public Methods -- Properties
      this.getHandlerMgr = function () {
        return _handlerMgr;
      };
      this.getConnMgr = function () {
        return _connMgr;
      };
      this.getRosterMgr = function () {
        return _rosterMgr;
      };
      this.getVCardMgr = function () {
        return _vCardMgr;
      };
      this.getChatMgr = function () {
        return _chatMgr;
      };
      this.getServerMgr = function () {
        return _serverMgr;
      };
      this.getRoomMgr = function () {
        return _roomMgr;
      };
      this.getPresMgrr = function () {
        return _presMgr;
      };
      this.getHttpMsg = function () {
        return _httpMsg;
      }
      // endregion Public Methods Properties

      // region Public Methods -- API
      this.on = function (event, callback) {
        XoW.logger.ms(_this.classInfo, 'on({0})'.f(event));
        if (typeof callback === 'function') {
          _handlerMgr.addHandler(event, callback);
        }
      };
      this.login = function (pParam) {
        XoW.logger.ms(_this.classInfo, 'login()');
        _this.connect(pParam.serviceUrl,
            pParam.id,
            pParam.password,
            pParam.resource);
        _currentUserJid = pParam.id + '@' + XoW.utils.getIPFromURL(pParam.serviceUrl) + '/' + pParam.resource;
        XoW.logger.me(_this.classInfo, 'login()');
      };
      this.logout = function (pReason) {
        XoW.logger.ms(_this.classInfo, 'logout()');
        _connMgr.disconnect(pReason);
        XoW.logger.me(_this.classInfo, 'logout()');
      }
      /**
       * 新建XoW.Connection对象并开始连接
       * @param serviceURL 服务器URL
       * @param  pUserId 用户名，不包含后面的ip等
       * @param pass 密码
       * @param pResource
       */
      this.connect = function (serviceURL, pUserId, pass, pResource) {
        XoW.logger.ms(_this.classInfo, 'connect({0},{1},{2},{3})'.f(serviceURL, pUserId, pass, pResource));
        var jid = pUserId + '@' + XoW.utils.getIPFromURL(serviceURL) + '/' + pResource;

        _this.getCache().temp = _this.getCache().temp || new XoW.Friend(jid);
        //_this.getCache().temp.jid = jid;
        _this.getCache().temp.password = pass;
        _this.getCache().temp.serviceURL = serviceURL;
        _this.getCache().temp.resource = pResource;

        _connMgr.connect(serviceURL, jid, pass);
        _connMgr.addHandler(function (stanza) {
          XoW.logger.d('open-->' + Strophe.serialize(stanza));
        }, null, 'stream:open');
        XoW.logger.me(_this.classInfo, 'connect()');
      };
      this.reconnect = function () {
        XoW.logger.ms(_this.classInfo, 'reconnect()');
        if (!_this.getCache().mine) {
          XoW.logger.e('There is no info of last login.')
          return;
        }
        _connMgr.connect(_this.getCache().mine.serviceURL, _this.getCache().mine.jid, _this.getCache().mine.password);
        _connMgr.addHandler(function (stanza) {
          XoW.logger.d('reopen-->' + Strophe.serialize(stanza));
        }, null, 'stream:open');
        XoW.logger.me(_this.classInfo, 'reconnect()');
      };
      this.sendMessage = function (content, toJid) {
        XoW.logger.ms(_this.classInfo, 'sendMessage({0})'.f(toJid));
        _chatMgr.sendMessage(content, toJid, _this.getCache().mine.jid);
        XoW.logger.me(_this.classInfo, 'sendMessage({0})'.f(toJid));
      };
      this.getMineInfo = function (pSucCb) {
        XoW.logger.ms(_this.classInfo, 'getMineInfo()');
        _vCardMgr.getVCardWithCb(_this.getCurrentUser().jid, pSucCb);
        // presence update vCard todo
        XoW.logger.me(_this.classInfo, 'getMineInfo()');
      };
      this.continueHttpFileStransfer = function (data, pSucCb) {
        XoW.logger.ms(_this.classInfo, 'continueHttpFileStransfer()');
        _httpMsg.continueHttpFileStransfer(data, pSucCb);
        XoW.logger.me(_this.classInfo, 'continueHttpFileStransfer()');
      }

      // this.getHttpSeviceMsg = function(pSucCb) {
      //   XoW.logger.ms(_this.classInfo, 'getHttpSeviceMsg()');
      //   _httpMsg.isExitsFileSevice(pSucCb);
      //   XoW.logger.me(_this.classInfo, 'getHttpSeviceMsg()');
      // };
      this.setMineInfo = function (pVCard, pSucCb, pTimeout) {
        XoW.logger.ms(_this.classInfo, 'setMineInfo()');
        _vCardMgr.setVCard(_this.getCurrentUser().jid, pVCard, pSucCb, pTimeout);
        XoW.logger.me(_this.classInfo, 'setMineInfo()');
      };
      this.setMineInfoWithAvatar = function (pVCard, pSucCb, pTimeout) {
        XoW.logger.ms(_this.classInfo, 'setMineInfoWithAvatar()');
        _vCardMgr.setMineInfoWithAvatar(_this.getCurrentUser().jid, pVCard, pSucCb, pTimeout);
        XoW.logger.me(_this.classInfo, 'setMineInfoWithAvatar()');
      };

      this.searchUser = function (val, pTimeout) {
        XoW.logger.ms(this.classInfo, 'searchUser({0})'.f(val));
        _rosterMgr.searchUser(val, pTimeout);
        XoW.logger.me(this.classInfo, 'searchUser()');
      };

      this.getCurrentUser1 = function () {
        XoW.logger.ms(_this.classInfo, 'getCurrentUser()');
        return _mine;
      };

      this.searchChatLog = function (pParam, pCallback, pTimeout) {
        XoW.logger.ms(this.classInfo, 'searchChatLog({0}, {1})'.f(pParam.after, pParam.keyword));
        if (pParam.after === -1) {
          //_archiveMgr.firstPage(pParam.pageSize, pParam.ownerJid, pParam.withJid,
          //  pParam.keyword, pParam.startDate, pParam.endDate, pCallback, pTimeout);
          pParam.after = null;
        }
        _archiveMgr.nextPage(pParam.pageSize, pParam.ownerJid, pParam.withJid,
            pParam.keyword, pParam.startDate, pParam.endDate, pParam.after, pCallback, pTimeout);
        XoW.logger.me(this.classInfo, 'searchChatLog()');
      };

      // region contact subscription
      this.rmvContact = function (pUser) {
        XoW.logger.ms(this.classInfo, 'rmvContact({0})'.f(pUser.jid));
        // 学spark，直接remove
        _rosterMgr.removeContact(pUser.jid);
        XoW.logger.me(this.classInfo, 'rmvContact()');
      };
      this.subContact = function (pUser) {
        XoW.logger.ms(this.classInfo, 'subContact({0})'.f(pUser.jid));
        // 方式一：各种正确但是无法实现 设置分组功能
        //_presMgr.subscribe(pUser.jid, _this.getCache().mine.jid, pUser.subRemark);

        // 方式二：待验证 todo
        pUser.groupid = 'Friends';
        _rosterMgr.setRosterForNameAndGroup(pUser);
        XoW.logger.me(this.classInfo, 'subContact()');
      };
      this.approveUserSub = function (pUser) {
        XoW.logger.ms(this.classInfo, 'approveUserSub({0})'.f(pUser.jid));
        _presMgr.approveSub(pUser.jid, _this.getCache().mine.jid, 'AUTO REPLY');
        _rosterMgr.setRosterForNameAndGroup(pUser);
        XoW.logger.me(this.classInfo, 'approveUserSub()');
      };
      this.denyUserSub = function (pUser) {
        XoW.logger.ms(this.classInfo, 'denyUserSub({0})'.f(pUser.jid));
        _presMgr.denySub(pUser.jid, _this.getCache().mine.jid);
        // of 不会去remove，故roster subscription为none
        _rosterMgr.removeContact(pUser.jid);
        XoW.logger.me(this.classInfo, 'denyUserSub({0})'.f(pUser.jid));
      };
      // endregion contact subscription

      // region shared operation to storage
      this.getCache = function () {
        XoW.logger.ms(_this.classInfo, 'getCache()');
        XoW.logger.f('If enter this function, the earth had exploded.');
      };
      this.getCurrentUser = function () {
        XoW.logger.ms(_this.classInfo, 'getCurrentUser()');
        return _this.getCache().mine;
      };
      this.getContactById = function (pId) {
        XoW.logger.ms(_this.classInfo, 'getContactById({0})'.f(pId));

        function checkId(x) {
          return x.id === pId;
        }

        for (var i = 0; i < _this.getCache().friend.length; i++) {
          var item = _this.getCache().friend[i].list.find(checkId);
          if (item) {
            return item;
          }
        }
        XoW.logger.d('There no contact of id {0}: '.f(pId));
        return null;
      };
      this.getContactByJid = function (jid) {
        XoW.logger.ms(_this.classInfo, 'getContactByJid({0})'.f(jid));
        jid = XoW.utils.getBareJidFromJid(jid);

        function checkJid(x) {
          return x.jid === jid;
        }

        for (var i = 0; i < _this.getCache().friend.length; i++) {
          var item = _this.getCache().friend[i].list.find(checkJid);
          if (item) {
            XoW.logger.d('找到好友{0}: '.f(item.id));
            return item;
          }
        }
        XoW.logger.d('未找到好友{0}'.f(jid));
        return null;
      };
      this.getMsgBox = function () {
        XoW.logger.ms(_this.classInfo, 'getMsgBox()');
        return _this.getCache().local.sysInfo || [];
      };
      // endregion shared operation to storage

      // region file transfer
      this.sendFile = function (filename, filesize, filetype, pFulljid, data) {
        XoW.logger.ms(_this.classInfo, 'sendFile'.f(filename, filesize, filetype));
        _fileMgr.sendFile(filename, filesize, filetype, pFulljid, data);
        XoW.logger.me(_this.classInfo, 'sendFile');
      };
      this.sendoffFile = function ($file, thatchat) {
        XoW.logger.ms(_this.classInfo, 'sendoffFile');
        _httpMsg.sendOffFile($file, thatchat);
        XoW.logger.me(_this.classInfo, 'sendoffFile');
      }
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
        _fileMgr.downLoadFile(pSid, pRemoteJid);
        XoW.logger.me(_this.classInfo, 'downLoadFile()');
      };
      this.groupsendMessage = function (content, toJid) {   //wshengt修改
        XoW.logger.ms(_this.classInfo, 'groupsendMessage({0})'.f(toJid));
        _chatMgr.groupsendMessage(content, toJid, _currentUserJid);
        XoW.logger.me(_this.classInfo, 'groupsendMessage({0})'.f(toJid));
      };
      // endregion file transfer
      //region start add by zjy for 处理layim-extend中的client依赖  [20190801]
      this.getCurrentUserWithCb = function (pSucCb) {
        XoW.logger.ms(_this.classInfo, 'getCurrentUserWithCb()');
        pSucCb(_this.getCache().mine);
      };
      this.getFriendGroups = function (pSucCb) {
        XoW.logger.ms(_this.classInfo, 'getFriendGroups()');
        var _friend = _rosterMgr.getFriendGroups();
        pSucCb(_friend);
      };
      this.getXmppRoom = function (param, pSucCb) {
        XoW.logger.ms(_this.classInfo, 'getXmppRoom()');
        var roomInMuc = _roomMgr.getXmppRoom(param);
        pSucCb(roomInMuc);
      };
      this.getRoomByJidFromServer = function (param, handleCb, errorCb) {
        XoW.logger.ms(_this.classInfo, 'getRoomByJidFromServer()');
        _roomMgr.getRoomByJidFromServer(param, handleCb, errorCb);
      };
      this.saveRoomConfig = function (roomjid, fields, pSuccCb, errorCb) {
        XoW.logger.ms(_this.classInfo, 'saveRoomConfig()');
        _roomMgr.saveRoomConfig(roomjid, fields, pSuccCb, errorCb);
      };
      this.getRoomByJid = function (roomjid, pSuccCb) {
        XoW.logger.ms(_this.classInfo, 'getRoomByJid()');
        var room = _roomMgr.getRoomByJid(roomjid);
        pSuccCb(room);
      };
      this.sendIq = function (iq, successCb, errorCb) {
        XoW.logger.ms(_this.classInfo, 'sendIq()');
        _connMgr.sendIQ(iq, successCb, errorCb)

      };
      this.sendMsg = function (msg) {
        XoW.logger.ms(_this.classInfo, 'send()');
        _connMgr.send(msg)

      };
      this.getSaveoutAllRoom = function (pSuccCb) {
        XoW.logger.ms(_this.classInfo, 'getSaveoutAllRoom()');
        var getallroom = _roomMgr.getSaveoutAllRoom();
        pSuccCb(getallroom);

      };
      this.getAllRFServer = function () {
        XoW.logger.ms(_this.classInfo, 'getAllRFServer()');
        _roomMgr.getAllRFServer();
      };
      this.createRoom = function (roomJid, nick, from, successCb, errorCb) {
        XoW.logger.ms(_this.classInfo, 'createRoom()');
        _roomMgr.createRoom(roomJid, nick, from, successCb, errorCb);
      };
      this.pushRoom = function (room) {
        XoW.logger.ms(_this.classInfo, 'pushRoom()');
        _roomMgr.PushRoom(room);
      };
      this.saveOutAllRoom = function (roomlist) {
        XoW.logger.ms(_this.classInfo, 'saveOutAllRoom()');
        _roomMgr.SaveoutAllRoom(roomlist);
      };
      this.getAbilityByCategroy = function (categroy, type, pSuccCb) {
        XoW.logger.ms(_this.classInfo, 'getAbilityByCategroy()');
        var roomServerAbility = _serverMgr.getAbilityByCategroy(categroy, type);
        pSuccCb(roomServerAbility);
      };
      this.getCurrentUserWithCb1 = function (pSucCb) {
        XoW.logger.ms(_this.classInfo, 'getCurrentUserWithCb1()');
        pSucCb(_mine);
      };
      this.sendOnlineToRoom = function (roomJid) {
        XoW.logger.ms(_this.classInfo, 'sendOnlineToRoom()');
        _presMgr.sendOnlineToRoom(roomJid);
      };
      this.intoRoom = function (type, roomJid) {
        XoW.logger.ms(_this.classInfo, 'intoRoom()');
        _roomMgr.me_into_a_room(type, roomJid);
      };
      this.joinInviteRoom = function (room, password) {
        XoW.logger.ms(_this.classInfo, 'joinInviteRoom()');
        _roomMgr.joinInviteRoom(room, password);
      };
      this.isCurrentUserAlreadyInRoom = function (roomJid, pSuccCb) {
        XoW.logger.ms(_this.classInfo, 'joinInviteRoom()');
        pSuccCb(_roomMgr.isCurrentUserAlreadyInRoom(roomJid));
      };
      this.denyinvitRoom = function (room, invifrom) {
        XoW.logger.ms(_this.classInfo, 'denyinvitRoom()');
        _roomMgr.denyinvitRoom(room, invifrom);
      };
      // endregion end add by zjy for 处理layim-extend中的client依赖  [20190802]
      // endregion Public Methods
      _init();
    };
    return XoW;
}));
