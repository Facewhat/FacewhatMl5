/**
 * Created by cy on 2018/3/12.
 * 1.不要包含任何操作main页面的DOM代码，需要移出去！
 * 2.不得依赖jquery或zepto，layim-mobile 是不支持zepto的
 * 3.尽量不依赖layui组件
 * 4.layui内置组件中layer、util、element、flow依赖jquery
 */
'use strict';
var MODULE_DEPED = {};
var CSS_DEPED = {};

var LOGIN_OPTION = {
  id: XoW.utils.getUrlPar('token') ? JSON.parse(XoW.utils.getUrlPar('token')).from : XoW.config.userId,
  password: XoW.config.password,
  serviceUrl: XoW.config.serviceUrl,
  resource: XoW.utils.getUrlPar('res') ? XoW.utils.getUrlPar('res') : XoW.config.resource,
  mode: XoW.utils.getUrlPar('mode')? XoW.utils.getUrlPar('mode') : XoW.ClientMode.NORMAL
};

if(LOGIN_OPTION.resource === 'fwh5_desktop'){
  MODULE_DEPED = {
    layim: 'layim',
    layImEx: 'layImEx',
  };
  CSS_DEPED = {
	  mobile: 'layui.css',
    login: '../../skin/css/login.css?v=2.0.2'
  }
} else {
  MODULE_DEPED = {
    layim : 'mobile',
    layImEx: 'layImExMobile'
  };
  CSS_DEPED = {
	  mobile: 'layui.mobile.css',
    login: '../../skin/css/login.mobile.css?v=2.0.2'
  }
}

layui.extend({
  // {/}的意思即代表采用自有路径，即不跟随 base 路径
  // mobile会强制设置base路径，so...
  client: '{/}./scripts/layxow/layim.client',
  loginLayer: '{/}./scripts/layxow/layim.login',
  layImExMobile: '{/}./scripts/layxow/layim.mobile.extend',
  layImEx: '{/}./scripts/layxow/layim.extend'
}).use(['loginLayer', MODULE_DEPED.layim, MODULE_DEPED.layImEx, 'client'], function () {
  var _this = this;
  var _client = layui.client;
  var _layLogin = layui.loginLayer;
  var _layer,_layIM, _layImEx;

  if(LOGIN_OPTION.resource === 'fwh5_desktop'){
    _layer = layui.layer; // layim 已经依赖了layer,layer 依赖jquery
    _layIM = layui.layim;
    _layImEx = layui.layImEx;
  } else {
    _layer = layui.mobile.layer;
    _layIM = /*layui.layim*/ layui.mobile.layim;
    _layImEx = /*layui.layImEx*/ layui.layImExMobile;
  }
  var _classInfo = 'ConIndex';

  // todo comm by cy 涉及界面元素的移出去 [20190310]
  (function () {
    XoW.logger.d("index.html on document ready");
    _client.getCache = _layIM.cache;
    if (LOGIN_OPTION.mode === XoW.ClientMode.KEFU) {
      let token = JSON.parse(XoW.utils.getUrlPar('token'));
      let from = token.from;
      let password = token.password;
      LOGIN_OPTION.id = from;
      LOGIN_OPTION.password = password;
      _client.login(LOGIN_OPTION);
    } else {
      var local = layui.data('layim')[0] || layui.data('layim-mobile')[0];
      if(local) {
        LOGIN_OPTION.id = local.key;
      }
      _layLogin.open(LOGIN_OPTION);
    }
  })();

  // region 网络消息回调，通知界面
  _client.on(XoW.VIEW_EVENT.V_LOGIN_STATE_CHANGED, function (params) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_LOGIN_STATE_CHANGED);
    if (params.succ) {
      if(!_layLogin.isOpen() && LOGIN_OPTION.mode !== XoW.ClientMode.KEFU){
        XoW.logger.d('Reconnected, return.');
        _layImEx.setMineStatus(XoW.UserState.ONLINE);
        _layImEx.closeReConnLoadTip();
        var msg = {
          system: true,
          content: '连接已恢复',
          Timestamp: new Date().getTime()
        };
        _layImEx.notifyToChatBoxes(msg);
        return;
      }
      _layLogin.close();
      //$('#loginPage').css({display: 'none'}); // 隐藏登录界面div
      //$('#mainPage').css({display: ''}); // 显示主页面的div
      _layInit(params.data);
    } else {
      _layLogin.setStatusDesc(params.data);
    }
  });
  _client.on(XoW.VIEW_EVENT.V_DISCONNECTED, function () {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_DISCONNECTED);
    if(_layLogin.isOpen()) {
      XoW.logger.d('Disconnected by login page, return.');
      return;
    }
    // WIFI场景下断网 websocket close 延迟厉害
    _layImEx.setMineStatus(XoW.UserState.OFFLINE);
    _layer.msg('连接断开<br>可能您打开了新的屯聊页面或网络故障导致', {
      btn: ['知道了', '尝试重连', '关闭本页面'],
      time: 0,
      btn2: function(){
        _layImEx.openReConnLoadTip();
        _client.reconnect();
      },
      btn3: function(){
        var method = navigator.userAgent.indexOf('Firefox') > -1 ?
          function(){location.href = 'about:blank';}
          :
          function(){
            // 有时候并不生效
            window.opener = null;
            window.open('', '_self', '');
            window.close();
          };
        method();
      }
    });

    var msg = {
      system: true,
      content: '连接断开',
      Timestamp: new Date().getTime()
    };
    _layImEx.notifyToChatBoxes(msg);
  });
  _client.on(XoW.VIEW_EVENT.V_FRIEND_AVATAR_CHANGED, function (pFriend) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_FRIEND_AVATAR_CHANGED);
    if (pFriend.vcard && pFriend.vcard.isMine) {
      _layImEx.changeMineAvatar(pFriend.avatar);
    } else {
      _layImEx.changeFriendAvatar(pFriend);
    }
    // layer.alert(JSON.stringify(params));
    return true;
  });
  _client.on(XoW.VIEW_EVENT.V_FRIEND_NICKNAME_CHANGED, function (pFriend) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_FRIEND_NICKNAME_CHANGED);
    if (pFriend.vcard && pFriend.vcard.isMine) {
      _layImEx.changeMineUsername(pFriend.username);
    } else {
      _layImEx.changeFriendNick(pFriend);
    }
    // layer.alert(JSON.stringify(params));
    return true;
  });
  _client.on(XoW.VIEW_EVENT.V_FRIEND_SIGN_CHANGED, function(pFriend) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_FRIEND_SIGN_CHANGED);
    if (pFriend.vcard && pFriend.vcard.isMine) {
      _layImEx.changeMineSign(pFriend.sign);
    } else {
      _layImEx.changeFriendSign(pFriend);
    }
  });
  _client.on(XoW.VIEW_EVENT.V_FRIEND_STATUS_CHANGED, function (pFriend) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_FRIEND_STATUS_CHANGED);
    _layImEx.setFriendStatus(pFriend);
	  XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_FRIEND_STATUS_CHANGED);
  });
  _client.on(XoW.VIEW_EVENT.V_ERROR_PROMPT, function (params) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_ERROR_PROMPT);
    _layer.alert(params);
    return true; // 如果返回的不是true则将该触发器会被移除。
  });
  _client.on(XoW.VIEW_EVENT.V_CHAT_MSG_RCV, function (params) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_CHAT_MSG_RCV);
    params.type = 'friend';
    if (!params.avatar) {
      params.avatar = XoW.DefaultImage.AVATAR_DEFAULT;
    }
    // test
    //var temp = '<div style="color:#00FF00"><h3>This is a header</h3><p>This is a paragraph.</p></div>';
    //params.content = _layIM.content(temp);//_layImEx.remixContent(temp);
    _layImEx.getMessage(params);
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_CHAT_MSG_RCV);
  });

  // region file transform
  _client.on(XoW.VIEW_EVENT.V_CHAT_FILE_TRANS_REQ_RCV, function (pFile) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_CHAT_FILE_TRANS_REQ_RCV);
    pFile.type = 'friend';
    if (!pFile.avatar) {
      pFile.avatar = XoW.DefaultImage.AVATAR_DEFAULT;
    }
    _layImEx.getMessage(pFile);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_CHAT_FILE_TRANS_REQ_RCV);
  });
  _client.on(XoW.VIEW_EVENT.V_CHAT_IMAGE_RCV, function (pFile) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_CHAT_IMAGE_RCV);
    _layImEx.getMessage(pFile);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_CHAT_IMAGE_RCV);
  })
  _client.on(XoW.VIEW_EVENT.V_CHAT_IMAGE_TRANS_REQ_SUC, function (params) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_CHAT_IMAGE_TRANS_REQ_SUC);
    _layImEx.pushExtMsg(params);
    // _layImEx.putFileThumbnailOnPanel(params);
  });
  _client.on(XoW.VIEW_EVENT.V_CHAT_FILE_TRANS_REQ_SUC, function (params) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_CHAT_FILE_TRANS_REQ_SUC);
    _layImEx.pushExtMsg(params);
    // _layImEx.putFileThumbnailOnPanel(params);
  });
  _client.on(XoW.VIEW_EVENT.V_FILE_STATE_CHANGED, function (params) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_FILE_STATE_CHANGED);
    _layImEx.changeFileStatus(params);
  });
  _client.on(XoW.VIEW_EVENT.V_FILE_OVERDUE, function (params) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_FILE_OVERDUE);
    _layImEx.changeFileStatus(params);
  });
  // endregion file transform

  // region contact subscription
  _client.on(XoW.VIEW_EVENT.V_USER_SEARCH_RSP_RCV, function (params) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_USER_SEARCH_RSP_RCV);
    _layImEx.setUserSearchResult(params.itemsExcludeFriend);
  });
  _client.on(XoW.VIEW_EVENT.V_FRIEND_ADDED, function (pUser) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_FRIEND_ADDED);
    pUser.groupid = pUser.groupid || _layIM.cache().friend[0].id;
    _layIM.addList(pUser);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_FRIEND_ADDED);
  });
  _client.on(XoW.VIEW_EVENT.V_FRIEND_REMOVED, function (pUser) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_FRIEND_REMOVED);
    _layIM.removeList({
      type: 'friend'
      ,id: pUser.id
    });
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_FRIEND_REMOVED);
  });
  _client.on(XoW.VIEW_EVENT.V_SUB_ME_REQ_RCV, function (pSubMsg) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_SUB_ME_REQ_RCV);
    _layImEx.pushSysInfo(pSubMsg);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_SUB_ME_REQ_RCV);
  });
  _client.on(XoW.VIEW_EVENT.V_SUB_CONTACT_REQ_SUC, function (pSubMsg) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_SUB_CONTACT_REQ_SUC);
    _layer.msg('好友申请已发送，请等待对方确认', {
      icon: 1
      ,shade: 0.5
    }, function(){
      _layer.close(_layer.index - 1);
    });
    pSubMsg.item.groupid =  pSubMsg.item.groupid || _layIM.cache().friend[0].id;
    _layImEx.pushSysInfo(pSubMsg, false);
    pSubMsg.item.username = pSubMsg.item.username + '(Pending)';
    _layIM.addList( pSubMsg.item);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_SUB_CONTACT_REQ_SUC);
  });
  _client.on(XoW.VIEW_EVENT.V_SUB_CONTACT_BE_APPROVED, function (pSubMsg) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_SUB_CONTACT_BE_APPROVED);
    _layImEx.pushSysInfo(pSubMsg);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_SUB_CONTACT_BE_APPROVED);
  });
  _client.on(XoW.VIEW_EVENT.V_ROOM_DISAGREE_INVITE, function (params) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_ROOM_DISAGREE_INVITE);
  _client.on(XoW.VIEW_EVENT.V_DISAGREE_INVITATION, function (params) {
    let nick = XoW.utils.getNodeFromJid(params.from);
    _layImEx.getMessage({
      system: true
      , id: XoW.utils.getNodeFromJid(params.roomjid)
      , type: 'group'
      , content: nick + '拒绝加入房间，reason：'+  params.reason
    });
    return true;
<<<<<<< HEAD
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_ROOM_DISAGREE_INVITE);
  });
  _client.on(XoW.VIEW_EVENT.V_ROOM_FORBIT_MEMBERSPEARK, function (Msg){
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_ROOM_FORBIT_MEMBERSPEARK);
    _layImEx.roomMasterDenyYouSpeak(Msg);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_ROOM_FORBIT_MEMBERSPEARK);
    return true
  });
  _client.on(XoW.VIEW_EVENT.V_ROOM_NO_INVITATION_PERMISSION, function (Msg){
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_ROOM_NO_INVITATION_PERMISSION);
    _layer.msg(Msg);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_ROOM_NO_INVITATION_PERMISSION);
  })
  _client.on(XoW.VIEW_EVENT.V_ROOM_WRONG_PASSWORD, function (Msg){
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_ROOM_WRONG_PASSWORD);
    _layImEx.wrongPaaswordIntoThisRoom(Msg);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_ROOM_WRONG_PASSWORD);
  })
  _client.on(XoW.VIEW_EVENT.V_ROOM_MEMBER_ONLY, function (Msg){
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_ROOM_MEMBER_ONLY);
    _layImEx.OnlyMemberIntoRoom(Msg);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_ROOM_MEMBER_ONLY)
  });
  _client.on(XoW.VIEW_EVENT.V_ROOM_MAXNUM_PEOPLE, function (Msg){
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_ROOM_MAXNUM_PEOPLE);
    _layImEx.outRoomMaxPeples(Msg)
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_ROOM_MAXNUM_PEOPLE);
  })
  _client.on(XoW.VIEW_EVENT.V_ROOM_FORBIT_IN, function (Msg){
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_ROOM_FORBIT_IN);
    _layImEx.banIntoThisRoom(Msg);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_ROOM_FORBIT_IN);
  })
  _client.on(XoW.VIEW_EVENT.V_ROOM_SELF_MOVEOUT, function (params){
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_ROOM_SELF_MOVEOUT);
      _layImEx.roomOutSide(params);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_ROOM_SELF_MOVEOUT);
  })
  _client.on(XoW.VIEW_EVENT.V_ROOM_DESTROY, function (params){
    XoW.logger.ms(_this.classInfo,XoW.VIEW_EVENT.V_ROOM_DESTROY);
    _layImEx.roomMastarDestroyThisRoom(params);
    XoW.logger.me(_this.classInfo,XoW.VIEW_EVENT.V_ROOM_DESTROY);
  });
  _client.on(XoW.VIEW_EVENT.V_ROOM_ONE_EXIT, function (params){
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_ROOM_ONE_EXIT);
  });
  _client.on(XoW.VIEW_EVENT.V_BANSPEAKE, function (Msg){
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_BANSPEAKE);
    _layImEx.roomMasterDenyYouSpeak(Msg);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_BANSPEAKE);
    return true
  });
  _client.on(XoW.VIEW_EVENT.V_NO_POWER_INVITION, function (Msg){
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_NO_POWER_INVITION);
    _layer.msg(Msg);
  })
  _client.on(XoW.VIEW_EVENT.V_WRONGPASSWROD, function (Msg){
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_WRONGPASSWROD);
    _layImEx.wrongPaaswordIntoThisRoom(Msg);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_WRONGPASSWROD);
  })
  _client.on(XoW.VIEW_EVENT.V_NON_MEMBERS, function (Msg){
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_NON_MEMBERS);
    _layImEx.OnlyMemberIntoRoom(Msg);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_NON_MEMBERS)
  });
  _client.on(XoW.VIEW_EVENT.V_MAXIMUM_PEOPLE, function (Msg){
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_MAXIMUM_PEOPLE);
    _layImEx.outRoomMaxPeples(Msg)
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_MAXIMUM_PEOPLE);
  })
  _client.on(XoW.VIEW_EVENT.V_BANIN_RCV, function (Msg){
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_BANIN_RCV);
    _layImEx.banIntoThisRoom(Msg);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_BANIN_RCV);
  })
  _client.on(XoW.VIEW_EVENT.V_ROOMKICKOUT_RCV, function (params){
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_ROOMKICKOUT_RCV);
      _layImEx.roomOutSide(params);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_ROOMKICKOUT_RCV);
  })
  _client.on(XoW.VIEW_EVENT.V_ROOMDESROY_RCV, function (params){
    XoW.logger.ms(_this.classInfo,XoW.VIEW_EVENT.V_ROOMDESROY_RCV);
    _layImEx.roomMastarDestroyThisRoom(params);
    XoW.logger.me(_this.classInfo,XoW.VIEW_EVENT.V_ROOMDESROY_RCV);
  });
  _client.on(XoW.VIEW_EVENT.V_ONEPERSON_EXIT_ROOM, function (params){
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_ONEPERSON_EXIT_ROOM);
    if(params.roomjid != XoW.utils.getNodeFromJid(_client.getCurrentUser().jid)) {
      _layImEx.getMessage({
        system: true
        , id: XoW.utils.getNodeFromJid(params.roomjid)
        , type: 'group'
        , content: params.nick + '退出房间'
      });
    }
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_ROOM_ONE_EXIT);
  })
  _client.on(XoW.VIEW_EVENT.V_ROOM_INVITE_RCV, function (params) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_ROOM_INVITE_RCV);
   _layImEx.someBodyIntoMeIntoRoom(params);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_ROOM_INVITE_RCV);
    return true;
  })
  _client.on(XoW.VIEW_EVENT.V_HTTP_FILETRANSFER_CLOSE, function (params) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_HTTP_FILETRANSFER_CLOSE);
    if(params.mine == true){
      _layImEx.completeHttpFile(params);
      // _layImEx.getMessage(params);
       return true;
    }
    if(params.type == 'friend') {
      params.id = params.fromid = XoW.utils.getNodeFromJid(params.from);
      params.avatar = '../skin/images/avatar_male.bmp';
      params.jid = params.from;
      params.username = XoW.utils.getNodeFromJid(params.from);
      _layImEx.getMessage(params);
      return true;
    }else{
      params.avatar = '../skin/images/avatar_male.bmp'
      _layImEx.getMessage(params);
      return true;
    }
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_HTTP_FILETRANSFER_CLOSE);
  })
  _client.on(XoW.VIEW_EVENT.V_HTTP_SEND_FILE_TO_USER_FROM_MINE, function (params) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_HTTP_SEND_FILE_TO_USER_FROM_MINE);
    _layImEx.getMessage(params);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_HTTP_SEND_FILE_TO_USER_FROM_MINE);
  })

  _client.on(XoW.VIEW_EVENT.V_HTTP_CHANGE_FILE_STATUS, function (params) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_HTTP_CHANGE_FILE_STATUS);
    _layImEx.changeHttpFileStatus(params);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_HTTP_CHANGE_FILE_STATUS);
  })
  // _client.on(XoW.VIEW_EVENT.V_HTTP_FILE_STRANSFER_CANCEL, function (params) {
  //   XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_HTTP_FILE_STRANSFER_CANCEL);
  //   _layImEx.cancelFileUpload(params);
  //   XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_HTTP_FILE_STRANSFER_CANCEL);
  // })
  _client.on(XoW.VIEW_EVENT.V_HTTP_FILE_STRANSFER_ERROR, function (ErrorMsg) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_HTTP_FILE_STRANSFER_ERROR);
    _layer.msg(ErrorMsg);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_HTTP_FILE_STRANSFER_ERROR);
  })

  _client.on(XoW.VIEW_EVENT.V_HTTP_FILE_STRANSFER_SUCCESS, function (succMsg) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_HTTP_FILE_STRANSFER_SUCCESS);
    _layer.msg(succMsg);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_HTTP_FILE_STRANSFER_SUCCESS);
  })

  _client.on(XoW.VIEW_EVENT.V_HTTP_FILE_STRANSFER_BEGIN, function (data) {
        XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_HTTP_FILE_STRANSFER_BEGIN);
        _layImEx.addCancelButn(data);
        XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_HTTP_FILE_STRANSFER_BEGIN);
  })

  // _client.on(XoW.VIEW_EVENT.V_HTTP_FILE_STRANSFER_SERVERERROR, function (data) {
  //   XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_HTTP_FILE_STRANSFER_SERVERERROR);
  //   _layImEx.httpFileServerError(data);
  //   XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_HTTP_FILE_STRANSFER_SERVERERROR);
  // })
  _client.on(XoW.VIEW_EVENT.V_HTTP_FILE_STRANSFER_OVERDUE, function (data) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_HTTP_FILE_STRANSFER_OVERDUE);
    _layImEx.httpFileOverdue(data);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_HTTP_FILE_STRANSFER_OVERDUE);
  })
  _client.on(XoW.VIEW_EVENT.V_KEFUMSGREV, function (data) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_KEFUMSGREV);
   _layImEx.KeFuMsgRev(data);
    return true;
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_KEFUMSGREV);
  })
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_ONEPERSON_EXIT_ROOM);
  })
  _client.on(XoW.VIEW_EVENT.V_INVITE_RCV, function (params) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_INVITE_RCV);
   _layImEx.someBodyIntoMeIntoRoom(params);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_INVITE_RCV);
    return true;
  })
  _client.on(XoW.VIEW_EVENT.V_ROOMTILE_RCV,function (data) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_ROOMTILE_RCV);
    // _layImEx.showNewtile(data);
    let nick = XoW.utils.getResourceFromJid(data.roomjid);
    _layImEx.getMessage({
      system: true
      , id: XoW.utils.getNodeFromJid(data.roomjid)
      , type: 'group'
      , content: nick + "修改了房间主题："+data.subject
    });
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_ROOMTILE_RCV);
  })
  _client.on(XoW.VIEW_EVENT.V_ROOM_OJROOMCHAT,function (roomjid) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_ROOM_OJROOMCHAT);
     let roomlist = _client.getRoomMgr().getSaveoutAllRoom();
     let flag = roomlist.findIndex(item => item.jid === roomjid);
     if(flag!=-1){
         _layIM.chat(roomlist[flag]);
         //_layImEx.setRoomChatFull();
     }else{
         _layer.msg("房间不存在,请联系管理员")
     }
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_ROOM_OJROOMCHAT);
  })
  _client.on(XoW.VIEW_EVENT.V_ROOM_ERROR_SHOW,function (PMSG) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_ROOM_ERROR_SHOW);
      _layer.msg(PMSG);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_ROOM_ERROR_SHOW);
  })
  _client.on(XoW.VIEW_EVENT.V_ROOM_AGREE_INTO, function (params) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_ROOM_AGREE_INTO);
  _client.on(XoW.VIEW_EVENT.V_AGREE_INTO_ROOM_RCV, function (params) {
    let roomlist = new XoW.RoomList();
    roomlist.type = 'group'
    roomlist.name=params.name
    roomlist.groupname=params.name
    roomlist.username=params.name
    roomlist.jid=params.jid
    roomlist.id=params.name
    // roomlist.avatar="http://tp2.sinaimg.cn/2211874245/180/40050524279/0"
    roomlist.isUnsecured=params.isUnsecured();
    if(params.isPersistent()){
      roomlist.avatar="http://tp2.sinaimg.cn/2211874245/180/40050524279/0";
    }else{
      roomlist.avatar="../skin/images/avatar_room.png";
    }
    _layIM.chat(roomlist);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_ROOM_AGREE_INTO);
  })
  _client.on(XoW.VIEW_EVENT.V_ROOM_ONE_INTO, function (params){
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_ROOM_ONE_INTO);
  })
  _client.on(XoW.VIEW_EVENT.V_ONEINTOROOM_VOICE, function (params){
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_ONEINTOROOM_VOICE);
    if(params.nick != XoW.utils.getNodeFromJid(_client.getCurrentUser().jid)) {
      _layImEx.getMessage({
        system: true
        , id: XoW.utils.getNodeFromJid(params.roomjid)
        , type: 'group'
        , content: params.nick + '加入房间'
      });
    }
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_ROOM_ONE_INTO);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_ONEINTOROOM_VOICE);
  })
  _client.on(XoW.VIEW_EVENT.V_SUB_CONTACT_BE_DENIED, function (pSubMsg) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_SUB_CONTACT_BE_DENIED);
    _layImEx.pushSysInfo(pSubMsg);
    _layIM.removeList({
      type:'friend',
      id: pSubMsg.item.id
    });
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_SUB_CONTACT_BE_DENIED);
  });
  // endregion contact subscription

  _client.on(XoW.VIEW_EVENT.V_NEW_INFO_ADDED, function (pSubMsg) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_NEW_INFO_ADDED);
    _layImEx.pushSysInfo(pSubMsg);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_NEW_INFO_ADDED);
  });
    _client.on(XoW.VIEW_EVENT.ERROR, function (pSubMsg) {
        XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.ERROR);
      console.log('**************')
        console.log(pSubMsg)
       // _layImEx.msg(pSubMsg);
        XoW.logger.me(_classInfo, XoW.VIEW_EVENT.ERROR);
    _client.on(XoW.VIEW_EVENT.V_ERROR, function (pSubMsg) {
        XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_ERROR);
       layui.msg(pSubMsg);
        XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_ERROR);
    });
  _client.on(XoW.VIEW_EVENT.V_ROOM_MSG_RCV, function (params) {
    params.type = 'group';
    params.groupname = XoW.utils.getNodeFromJid(params.from);
    params.username =  XoW.utils.getResourceFromJid(params.from);
    params.avatar="../skin/images/avatar_male.bmp";
    //var group = _client.getRoomMgr().getRoomByJid(XoW.utils.getNodeFromJid(params.from) + "@"+XoW.utils.getDomainFromJid(params.from));
    params.id =  params.groupname;
    console.log(params)
    params.avatar="http://tp2.sinaimg.cn/2211874245/180/40050524279/0";
    var group = _client.getRoomMgr().getRoomByJid(XoW.utils.getNodeFromJid(params.from) + "@"+XoW.utils.getDomainFromJid(params.from));
    params.id = group.id;
    _layImEx.getMessage(params);
  })
  _client.on(XoW.VIEW_EVENT.V_ROOMLIST_ADDED, function (params) {
    var room = params.addValue;
    var roomname = XoW.utils.getNodeFromJid(room.jid);
    var peopleNumber = room.getOccupants();
    let roomlist = new XoW.RoomList();
    roomlist.type = 'group';
    roomlist.groupname=roomname;
    roomlist.username=roomname;
    roomlist.jid=room.jid;
    roomlist.id=room.name;
    roomlist.sign=room.getDescription();
    roomlist.isPersistent = room.isPersistent();
    roomlist.isUnsecured=room.isUnsecured();
    if(room.isPersistent()){
      roomlist.avatar="http://tp2.sinaimg.cn/2211874245/180/40050524279/0";
    }else{
      roomlist.avatar="../skin/images/avatar_room.png";
    }
    // console.log(roomlist)
    console.log(roomlist)
    _layIM.addList(roomlist);
    _client.getRoomMgr().SaveoutAllRoom(roomlist);
    return true;
  })
  // endregion 网络消息回调，通知界面

  // region UI CAllBack By LayIM
  //监听在线状态的切换事件
  _layIM.on('online', function (data) {
    var msg = '暂不支持修改状态 {0}'.f(data);
    if(data === XoW.UserState.ONLINE) {
      msg += '<br>如须重新登录请刷新页面';
    }
    _layer.msg(msg);
  });
  //监听签名修改
  _layIM.on('sign', function (value) {
    _layer.msg('暂不支持修改心情');
  });
  /**
   * 监听layim建立就绪,注意：
   * 简约模式（即brief: true时）不会触发该事件
   * init直接赋值mine、friend的情况下（只有设置了url才会执行 ready 事件）
   */
  _layIM.on('ready', function (res) {
    XoW.logger.ms(_classInfo, 'on(ready, {0})'.f(res));
    _layImEx.onReady();
    if (LOGIN_OPTION.mode === XoW.ClientMode.KEFU) {
      var token = JSON.parse(XoW.utils.getUrlPar('token'));
      var toId = token.to;
      if (!toId) {
        XoW.logger.e('There is no toId, return.');
        return;
      }
      if(token.type){
          if(token.type == 'group'){
            _client.getRoomMgr().getAllroomINFPO(function (stanza) {
              let items = stanza.getElementsByTagName('item')
              let flag = false;
              for(let item of items) {
                let jid = item.getAttribute('jid')
                if (XoW.utils.getNodeFromJid(jid) == toId) {
                  flag = true;
                  _client.getRoomMgr().getKefuRoomchat(item);
                }
              }
              if(flag == false){
                 _layer.msg('不存在"'+toId+'"房间.请联系管理员')
              }
            });
            return
          }else if(token.type=='kefu'){
            theCusSvr = {
              name: toId, //名称
              username: toId,
              type: 'friend', //聊天类型不能用 kefu
              avatar: XoW.DefaultImage.AVATAR_KEFU,
              id: toId,
              jid: toId + '@intelligentcusservice.' + XoW.config.domain,
              temporary: true
            };
            _layIM.chat(theCusSvr);
             let getMsg = XoW.utils.getUrlPar('msg');
             getMsg = getMsg.replace("\"","").replace("\"","");
            _layImEx.sendMsgForTop(getMsg);
             return;
          }
      }
      // 在好友列表中找
      var theCusSvr = _client.getContactById(toId);
      if (!theCusSvr) {
        theCusSvr = {
          name: toId, //名称
          username: toId,
          type: 'friend', //聊天类型不能用 kefu
          avatar: XoW.DefaultImage.AVATAR_KEFU,
          id: toId,
          jid: toId + '@' + XoW.config.domain,
          temporary: true
        };
      } else {
        theCusSvr.type = 'friend';
        theCusSvr.temporary = false;
      }
      _layIM.chat(theCusSvr);

      // content template
      //>[linkEx(url)[{"title":"某商品","description":"价格$2.7 质量上乘","image":"../images/prod.jpg"}]

      var getMsg = XoW.utils.getUrlPar('msg');
      if(!getMsg) {
        XoW.logger.e('There is no parameter of micro data for the the page, return.');
        return;
      };
      _layImEx.sendMsgForTop( 'linkEx[{0}]'.f(getMsg));
    }
  });
  //监听发送消息
  _layIM.on('sendMessage', function (data) {
    XoW.logger.ms(_classInfo, 'sendMessage');
    if (!data.to.jid) {
      // todo 获得presence的时候需要去获得resource
      // 客服模式
      var toJid = data.to.id + '@' + XoW.utils.getIPFromURL(XoW.config.serviceUrl);
      _client.sendMessage(data.mine.content, toJid);
    } else {
      // // 主动发起的对话,data.to表示friend
      // _client.sendMessage(data.mine.content, data.to.jid);
      // 主动发起的对话,data.to表示friend
      if(data.to.type=='friend') {
        _client.sendMessage(data.mine.content, data.to.jid);
      } else{
        _client.groupsendMessage(data.mine.content, data.to.jid);
      }
    }
    //console.log(data);
  });
  //监听查看群员
  _layIM.on('f', function (data) {
    //console.log(data);
  });
  // endregion UI CAllBack By LayIM

  // region UI Callback By LayIM.extend
  _layImEx.on('login', function (pParam) {
    XoW.logger.ms(_classInfo, 'getMineInfo()');
    _client.login(pParam);
    XoW.logger.me(_classInfo, 'getMineInfo()');
  });
  
  // _layImEx.on('httpfiletransfer',function (pSucCb) {
  //    _client.getHttpSeviceMsg(pSucCb);
  // })

  _layImEx.on('getMineInfo', function (pSucCb) {
    XoW.logger.ms(_classInfo, 'getMineInfo()');
    _client.getMineInfo(pSucCb);
    XoW.logger.me(_classInfo, 'getMineInfo()');
  });
  _layImEx.on('continuehttpfilestransfer', function (data,pSucCb) {
    XoW.logger.ms(_classInfo, 'continuehttpfilestransfer()');
   _client.continueHttpFileStransfer(data,pSucCb);
    XoW.logger.me(_classInfo, 'continuehttpfilestransfer()');
  });
  _layImEx.on('setMineInfo', function (param, pSucCb) {
    XoW.logger.ms(_classInfo, 'setMineInfo()');
    var vCardTemp = new XoW.VCard();
    vCardTemp.NICKNAME = param.nickname;
    vCardTemp.BDAY = param.birthday;
    vCardTemp.DESC = param.signature;
    vCardTemp.WORK.CELL_TEL = param.telephone;
    vCardTemp.EMAIL = param.email;
    // gender not implement yet.
    _client.setMineInfo(vCardTemp, pSucCb, 3 * 1000);
    XoW.logger.me(_classInfo, 'setMineInfo()');
  });
  _layImEx.on('setMineInfoWithAvatar', function (param, pSucCb) {
    XoW.logger.ms(_classInfo, 'setMineInfoWithAvatar()');
    var vCardTemp = new XoW.VCard();
    vCardTemp.NICKNAME = param.nickname;
    vCardTemp.BDAY = param.birthday;
    vCardTemp.DESC = param.signature;
    vCardTemp.WORK.CELL_TEL = param.telephone;
    vCardTemp.EMAIL = param.email;
    vCardTemp.PHOTO.BINVAL = param.base64;
    vCardTemp.PHOTO.TYPE = param.type;
    _client.setMineInfoWithAvatar(vCardTemp, pSucCb, 3 * 1000);
    XoW.logger.me(_classInfo, 'setMineInfoWithAvatar()');
  });
  _layImEx.on('pushExtMsg', function (param) {
    XoW.logger.ms(_classInfo, 'pushExtMsg({0},{1})'.f(param.sid, param.to));
    XoW.logger.me(_classInfo, 'pushExtMsg()');
  });
  _layImEx.on('acceptFile', function (param) {
    XoW.logger.ms(_classInfo, 'acceptFile({0},{1})'.f(param.sid, param.jid));
    _client.acceptFile(param.sid, param.jid);
    XoW.logger.me(_classInfo, 'acceptFile()');
  });
  _layImEx.on('rejectFile', function (param) {
    XoW.logger.ms(_classInfo, 'rejectFile({0},{1})'.f(param.sid, param.jid));
    _client.rejectFile(param.sid, param.jid);
    XoW.logger.me(_classInfo, 'rejectFile()');
  });
  _layImEx.on('openFile', function (param) {
    XoW.logger.ms(_classInfo, 'openFile({0},{1})'.f(param.sid, param.jid));
    _client.downLoadFile(param.sid, param.jid);
    XoW.logger.me(_classInfo, 'openFile()');
  });
  _layImEx.on('stopFile', function (param) {
    XoW.logger.ms(_classInfo, 'stopFile({0},{1})'.f(param.sid, param.jid));
    _client.stopFileTrans(param.sid, param.jid);
    XoW.logger.me(_classInfo, 'stopFile()');
  });
  _layImEx.on('cancelFile', function (param) {
    XoW.logger.ms(_classInfo, 'cancelFile({0},{1})'.f(param.sid, param.jid));
    _client.cancelFile(param.sid, param.jid);
    XoW.logger.me(_classInfo, 'cancelFile()');
  });
  _layImEx.on('searchUser', function (param) {
    XoW.logger.ms(_classInfo, 'searchUser({0})'.f(param.username));
    _client.searchUser(param.username, 3 * 1000);
    XoW.logger.me(_classInfo, 'searchUser()');
  });
  _layImEx.on('rmvContact', function (pUser) {
    XoW.logger.ms(_classInfo, 'removeContact({0})'.f(pUser.id));
    _client.rmvContact(pUser);
    XoW.logger.me(_classInfo, 'removeContact()');
  });
  _layImEx.on('subContact', function (pUser) {
    XoW.logger.ms(_classInfo, 'subContact({0})'.f(pUser.id));
    _client.subContact(pUser);
    XoW.logger.me(_classInfo, 'subContact()');
  });
  _layImEx.on('approveUserSub', function (pUser) {
    XoW.logger.ms(_classInfo, 'approveUserSub({0})'.f(pUser.jid));
    _client.approveUserSub(pUser);
    XoW.logger.me(_classInfo, 'approveUserSub()');
  });
  _layImEx.on('denyUserSub', function (pUser) {
    XoW.logger.ms(_classInfo, 'approveUserSub({0})'.f(pUser.jid));
    _client.denyUserSub(pUser);
    XoW.logger.me(_classInfo, 'denyUserSub()');
  });
  _layImEx.on('searchChatLog', function (pParam, pCallback) {
    XoW.logger.ms(_classInfo, 'searchChatLog({0})'.f(pParam.withJid));
    _client.searchChatLog(pParam, pCallback,  3 * 1000);
    XoW.logger.me(_classInfo, 'searchChatLog()');
  });
  _layImEx.on('logout', function() {
    XoW.logger.ms(_classInfo, 'logout()');
    _client.logout('用户退出');
    XoW.logger.me(_classInfo, 'logout()');
  });
	_layImEx.on('sendFile', function (pThatChat, pFileInfo, pData) {
		XoW.logger.ms(_classInfo, 'sendFile()');
		var toFullJid = XoW.utils.getFullJid(pThatChat.data.jid, pThatChat.data.resource);
		_client.sendFile(pFileInfo.name, pFileInfo.size, pFileInfo.type, toFullJid, pData);
		XoW.logger.me(_classInfo, 'sendFile()');
	});
  // endregion UI Callback By LayIM.extend
    //region begin add by zjy for 处理layim-extend中的client依赖 [20190801]
    _layImEx.on('getCurrentUser', function (pSucCb) {
        XoW.logger.ms(_classInfo, 'getMineInfo()');
        _client.getCurrentUserWithCb(pSucCb);

        XoW.logger.me(_classInfo, 'getMineInfo()');
    });
    _layImEx.on('getFriendGroups', function (pSucCb) {
        XoW.logger.ms(_classInfo, 'getFriendGroups()');
        _client.getFriendGroups(pSucCb);
        XoW.logger.me(_classInfo, 'getFriendGroups()');
    });
    _layImEx.on('getXmppRoom', function (param,pSucCb) {
        XoW.logger.ms(_classInfo, 'getXmppRoom()');
        _client.getXmppRoom(param,pSucCb);
        XoW.logger.me(_classInfo, 'getXmppRoom()');
    });
    _layImEx.on('getRoomByJidFromServer', function (param,handleCb,errorCb) {
        XoW.logger.ms(_classInfo, 'getRoomByJidFromServer()');
        _client.getRoomByJidFromServer(param,handleCb,errorCb);
        XoW.logger.me(_classInfo, 'getRoomByJidFromServer()');
    });
    _layImEx.on('saveRoomConfig', function (roomjid,fields,pSuccCb,errorCb) {
        XoW.logger.ms(_classInfo, 'saveRoomConfig()');
        _client.saveRoomConfig(roomjid,fields,pSuccCb,errorCb);
        XoW.logger.me(_classInfo, 'saveRoomConfig()');
    });
    _layImEx.on('getRoomByJid', function (roomjid,pSuccCb) {
        XoW.logger.ms(_classInfo, 'getRoomByJid()');
        _client.getRoomByJid(roomjid,pSuccCb);
        XoW.logger.me(_classInfo, 'getRoomByJid()');
    });
    _layImEx.on('sendIq', function (iq,successCb, errorCb) {
        XoW.logger.ms(_classInfo, 'sendIq()');
        _client.sendIq(iq,successCb, errorCb);
        XoW.logger.me(_classInfo, 'sendIq()');
    });
    _layImEx.on('sendMsg', function (msg) {
        XoW.logger.ms(_classInfo, 'sendMsg()');
        _client.sendMsg(msg);
        XoW.logger.me(_classInfo, 'sendMsg()');
    });
    _layImEx.on('getSaveoutAllRoom', function (pSuccCb) {
        XoW.logger.ms(_classInfo, 'getSaveoutAllRoom()');
        _client.getSaveoutAllRoom(pSuccCb);
        XoW.logger.me(_classInfo, 'getSaveoutAllRoom()');
    });
    _layImEx.on('getAllRFServer', function () {
        XoW.logger.ms(_classInfo, 'getAllRFServer()');
        _client.getAllRFServer();
        XoW.logger.me(_classInfo, 'getAllRFServer()');
    });
    _layImEx.on('createRoom', function (roomJid, nick, from, successCb, errorCb) {
        XoW.logger.ms(_classInfo, 'createRoom()');
        _client.createRoom(roomJid, nick, from, successCb, errorCb);
        XoW.logger.me(_classInfo, 'createRoom()');
    });
    _layImEx.on('pushRoom', function (room) {
        XoW.logger.ms(_classInfo, 'pushRoom()');
        _client.pushRoom(room);
        XoW.logger.me(_classInfo, 'pushRoom()');
    });
    _layImEx.on('saveOutAllRoom', function (roomlist) {
        XoW.logger.ms(_classInfo, 'saveOutAllRoom()');
        _client.pushRoom(roomlist);
        XoW.logger.me(_classInfo, 'saveOutAllRoom()');
    });
    _layImEx.on('getAbilityByCategroy', function (categroy, type, pSuccCb) {
        XoW.logger.ms(_classInfo, 'getAbilityByCategroy()');
        _client.getAbilityByCategroy(categroy,type,pSuccCb);
        XoW.logger.me(_classInfo, 'getAbilityByCategroy()');
    });
    _layImEx.on('getCurrentUser1', function (pSucCb) {
        XoW.logger.ms(_classInfo, 'getCurrentUser1()');
        _client.getCurrentUserWithCb1(pSucCb);
        XoW.logger.me(_classInfo, 'getCurrentUser1()');
    });
    _layImEx.on('sendOnlineToRoom', function (roomJid) {
        XoW.logger.ms(_classInfo, 'sendOnlineToRoom()');
        _client.sendOnlineToRoom(roomJid);
        XoW.logger.me(_classInfo, 'sendOnlineToRoom()');
    });
    _layImEx.on('intoRoom', function (type,roomJid) {
        XoW.logger.ms(_classInfo, 'intoRoom()');
        _client.intoRoom(type,roomJid);
        XoW.logger.me(_classInfo, 'intoRoom()');
    });
    _layImEx.on('joinInviteRoom', function (room, password) {
        XoW.logger.ms(_classInfo, 'joinInviteRoom()');
        _client.joinInviteRoom(room, password);
        XoW.logger.me(_classInfo, 'joinInviteRoom()');
    });
    _layImEx.on('isCurrentUserAlreadyInRoom', function (roomJid,pSuccCb) {
        XoW.logger.ms(_classInfo, 'isCurrentUserAlreadyInRoom()');
        _client.isCurrentUserAlreadyInRoom(roomJid,pSuccCb);
        XoW.logger.me(_classInfo, 'isCurrentUserAlreadyInRoom()');
    });
    _layImEx.on('denyinvitRoom', function (room, invifrom) {
        XoW.logger.ms(_classInfo, 'denyinvitRoom()');
        _client.denyinvitRoom(room, invifrom);
        XoW.logger.me(_classInfo, 'denyinvitRoom()');
    });
    _layImEx.on('sendOffFile', function ($file,thatchat) {
	XoW.logger.ms(_classInfo, 'sendOffFile()');
	_client.sendoffFile($file,thatchat);
	XoW.logger.me(_classInfo, 'sendOffFile()');
     });
    // endregion UI Callback By LayIM.extend
    //endregion end add by zjy for 处理layim-extend中的client依赖 [20190802]
  // region Private Methods
  function _layInit(params) {
    XoW.logger.ms(_classInfo, '_layInit()');
    params.mine = _layIM.cache().temp ? _layIM.cache().temp : _layIM.cache().mine;
    params.mine.status = XoW.UserState.ONLINE;
    _layIM.cache().temp = null;
    //基础配置
    _layImEx.config({init: params});
    XoW.logger.me(_classInfo, '_layInit()');
  }
  // endregion Private Methods
}).addcss(
	CSS_DEPED['mobile']
).addcss(
  CSS_DEPED['login']
  ,'skin-login-css'
);
