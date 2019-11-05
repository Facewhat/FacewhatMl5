/**
 * 拆包解包、管理所有会话数据，包括聊天室?
 * 注意，它与layim中cache.chat不是一个概念
 * 不允许依赖jquery这样的第三方UI库,已完成清理 by cy [20190402]
 */
(function (factory) {
  return factory(XoW);
}(function (XoW) {
  'use strict';
  XoW.ChatManager =function(globalManager) {//此处无法改成es6的函数形式，改之后无法识别为构造函数
    // region Fields
    let _this = this;
      let _gblMgr = null; // 私有变量
      let _jidChats = [];
      let _RoomMsg = [];
    this.classInfo = 'ChatManager';
    // endregion Fields

    // region Private methods
    let _init = ()=> {
      XoW.logger.ms(_this.classInfo, '_init()');
      _gblMgr = globalManager;
      // 监听消息节
      _RoomMsg = [];
      _gblMgr.getConnMgr().addHandler(_onMessage.bind(_this), null, 'message');
      XoW.logger.me(_this.classInfo, '_init()');
    };
    //var _addJidChat = function (item) {
    //  XoW.logger.ms(_this.classInfo, '_addJidChat()');
    //  var gpIndex = _findIndexOfFriendGroup(item.groupid);
    //  var group = null;
    //  if (gpIndex < 0) {
    //    group = new XoW.FriendGroup(item.groupid);
    //    _friendGroups.push(group);
    //  } else {
    //    group = _friendGroups.find(function (x) {
    //      return x.id === item.groupid
    //    });
    //  }
    //  // 类似于引用类型哦
    //  if (group) {
    //    group.list.push(item);
    //  }
    //  XoW.logger.me(_this.classInfo, '_addJidChat');
    //};
    let _onMessage = (stanza)=> {
      XoW.logger.ms(_this.classInfo, '_onMessage()');
      var fromDomain = XoW.utils.getDomainFromJid(stanza.getAttribute('from'));
      var myDomain = XoW.utils.getDomainFromJid(_gblMgr.getCurrentUser().jid);
      let isType = stanza.getAttribute('type');

      if(_filterComponentMessage(stanza)){ return true;}
      let fromDomain = XoW.utils.getDomainFromJid(stanza.getAttribute('from'));
      let myDomain = XoW.utils.getDomainFromJid(_gblMgr.getCurrentUser().jid);
      // 以这种方式来区分是会议室的消息/会议室的私聊 还是个人消息
      // 如果两个doamin相同，则说明是个人消息
      XoW.logger.d(_this.classInfo, 'fromDomain：{0} toDomain: {1}'.f(fromDomain, myDomain));
      if (fromDomain == myDomain) {
        // 到时候这边看看要不要把type=errror的消息拦截下来。在外面进行统一的处理。
        let theMsg = new XoW.Message();
        theMsg.cid = stanza.getAttribute('id');
        theMsg.to = stanza.getAttribute('to'); // 非纯jid，是全jid
        theMsg.from = stanza.getAttribute('from');
        theMsg.thread = stanza.getElementsByTagName('thread').length > 0 ?
          stanza.getElementsByTagName('thread')[0].textContent : '';
        let type = stanza.getAttribute('type');
        if (!type) {
          // 如果没有type，则认为是normal
          XoW.logger.w(_this.classInfo + '刚到的消息没有类型！');
          // 如果刚到的消息里面有body，则认为是 noraml msg
          if (stanza.getElementsByTagName('body').length > 0) {
            theMsg.type = XoW.MessageType.CONTACT_CHAT;
            theMsg.contentType = XoW.MessageContentType.MSG;
            theMsg.content = stanza.getElementsByTagName('body')[0].textContent;
            if (stanza.getElementsByTagName('delay').length > 0) {
              theMsg.timestamp = stanza.getElementsByTagName('delay')[0].getAttribute('stamp');
              theMsg.contentType = XoW.MessageContentType.DELAYMSG;
            }
          } else {
	          // msg 时候 是delivered / displayed 消息，是不是指ack？
            // alert('检查一下这是什么信息:)');
            // 可能是invite信息。。。
          }
        } else {
          switch (type) {
            case 'chat' :
              // 一对一聊天，或者是在聊天室中的私聊
              XoW.logger.i(_this.classInfo + '刚到的消息是一个chat！');
              theMsg.type = XoW.MessageType.CONTACT_CHAT;
              if (stanza.getElementsByTagName('active').length > 0) {
                theMsg.contentType = 'active';
                theMsg.isRead = true;
              } else if (stanza.getElementsByTagName('inactive').length > 0) {
                theMsg.contentType = 'inactive';
                theMsg.isRead = true;
              } else if (stanza.getElementsByTagName('composing').length > 0) {
                theMsg.contentType = 'composing';
                theMsg.isRead = true;
              } else if (stanza.getElementsByTagName('paused').length > 0) {
                theMsg.contentType = 'paused';
                theMsg.isRead = true;
              } else if (stanza.getElementsByTagName('gone').length > 0) {
                theMsg.contentType = 'gone';
                theMsg.isRead = true;
              }
              if (stanza.getElementsByTagName('body').length > 0) {
                theMsg.content = stanza.getElementsByTagName('body')[0].textContent;
                theMsg.isRead = false;
                theMsg.contentType = 'msg';
              }
              if (stanza.getElementsByTagName('delay').length > 0) {
                theMsg.timestamp = stanza.getElementsByTagName('delay')[0].getAttribute('stamp');
                theMsg.contentType = 'delaymsg';
              }
              XoW.logger.d(_this.classInfo + "消息内容");
              XoW.logger.p({type: theMsg.type, contentType: theMsg.contentType});
              break;
            case 'error' :
              XoW.logger.w(_this.classInfo + "刚到的消息是一个error！");
              // 错误
             // theMsg.type = XoW.MessageType.ERROR;
            //  XoW.logger.d(_this.classInfo + "有个错误的消息节");

              if(stanza.getAttribute('type') == 'error'){
                if((stanza.getElementsByTagName('subject').textContent)){
                  _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_FORBIT_MEMBERSPEARK, "权限不够，发送失败");
                  return true;
                }
                if(stanza.getElementsByTagName('reason')[0]&&stanza.getElementsByTagName('error')[0].getAttribute('code')=="403"){
                  _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_NO_INVITATION_PERMISSION,"你没有邀请权限");
                  return true
                }
                if(stanza.getElementsByTagName('error')[0].getAttribute('code')=="403") {
                  _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_FORBIT_MEMBERSPEARK, "您被禁言,发送失败");
                  _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_BANSPEAKED, "权限不够，发送失败");
                  return true;
                }
                if(stanza.getElementsByTagName('reason')[0]&&stanza.getElementsByTagName('error')[0].getAttribute('code')=="403"){
                  _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.NO_POWER_INVITION,"你没有邀请权限");
                  return true
                }
                if(stanza.getElementsByTagName('error')[0].getAttribute('code')=="403") {
                  _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_BANSPEAKED, "您被禁言,发送失败");
                  return true;
                }
              }


              break;
            case 'groupchat' :
              // groupchat由room那边接管来做，这里不处理。
              XoW.logger.d(_this.classInfo + "刚到的消息是一个groupchat！");
              //todo g关于群组消息设置
              if(stanza.getAttribute('type')==undefined && XoW.utils.getNodeFromJid(stanza.getAttribute('to'))==XoW.utils.getNodeFromJid(_gblMgr.getCurrentUser().jid)&&stanza.getElementsByTagName('decline')[0]){
                _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_DISAGREE_INVITE,{from:stanza.getElementsByTagName('decline')[0].getAttribute('from'),reason:stanza.getElementsByTagName('reason')[0].textContent,roomjid:stanza.getAttribute('from')});
              }
              if(stanza.getAttribute('type') == 'error'){
                if((stanza.getElementsByTagName('subject').textContent)){
                  _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_FORBIT_MEMBERSPEARK, "权限不够，发送失败");
                  return true;
                }
                if(stanza.getElementsByTagName('reason')[0]&&stanza.getElementsByTagName('error')[0].getAttribute('code')=="403"){
                  _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_NO_INVITATION_PERMISSION,"你没有邀请权限");
                  return true
                }
                if(stanza.getElementsByTagName('error')[0].getAttribute('code')=="403") {
                  _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_FORBIT_MEMBERSPEARK, "您被禁言,发送失败");
                _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.DISAGREE_INVITATION,{from:stanza.getElementsByTagName('decline')[0].getAttribute('from'),reason:stanza.getElementsByTagName('reason')[0].textContent,roomjid:stanza.getAttribute('from')});
              }
              if(stanza.getAttribute('type') == 'error'){
                if((stanza.getElementsByTagName('subject').textContent)){
                  _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_BANSPEAKED, "权限不够，发送失败");
                  return true;
                }
                if(stanza.getElementsByTagName('reason')[0]&&stanza.getElementsByTagName('error')[0].getAttribute('code')=="403"){
                  _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.NO_POWER_INVITION,"你没有邀请权限");
                  return true
                }
                if(stanza.getElementsByTagName('error')[0].getAttribute('code')=="403") {
                  _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_BANSPEAKED, "您被禁言,发送失败");
                  return true;
                }
              }
              if(_gblMgr.getRoomMgr().isNew_room_title(stanza)){
                return true;
              }
              let pureJid = XoW.utils.getBareJidFromJid(stanza.getAttribute('from'));
              let theMsg1 = new XoW.Message();
              theMsg1.cid = stanza.getAttribute('id');
              theMsg1.to = stanza.getAttribute('to');
              theMsg1.from = stanza.getAttribute('from');
              if(_GetmineRoomMsg(theMsg1.cid)==false) {
                _RoomMsg.push(theMsg1.cid);
                theMsg1.type = 'group';
                theMsg1.contentType = 'msg';
                if (stanza.getElementsByTagName('body').length > 0) {
                  theMsg1.content = stanza.getElementsByTagName('body')[0].textContent;
                }
                theMsg1.fromid = XoW.utils.getResourceFromJid(theMsg1.from);
                if (stanza.getElementsByTagName('delay').length > 0) {
                  theMsg1.timestamp = stanza.getElementsByTagName('delay')[0].getAttribute('stamp');
                  theMsg1.contentType = 'delaymsg';
                }

                if(theMsg1.content  == "" || theMsg1.content  == undefined || theMsg1.content  == null || (theMsg1.content.length>0 && theMsg1.content .trim().length == 0)){
                  return true;
                }
                _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_MSG_RCV, theMsg1);
                return true;
              }
              break;
            case 'headline' :
              // 警告，通知，不期望应答的临时消息（新闻，运动更新）
              XoW.logger.d(_this.classInfo + "刚到的消息是一个headline！");
              theMsg.Type = XoW.MessageType.HEADLINE;
              // msg.contentType = 'msg';
              theMsg.content = stanza.getElementsByTagName('body').length > 0 ?
                stanza.getElementsByTagName('body')[0].textContent : '';
              break;
            case 'normal' :
              XoW.logger.d(_this.classInfo + "刚到的消息是一个normal！");
              theMsg.type = XoW.MessageType.NORMAL;
              theMsg.contentType = 'msg';
              theMsg.content = stanza.getElementsByTagName('body').length > 0 ?
                stanza.getElementsByTagName('body')[0].textContent : '';
              if (stanza.getElementsByTagName('delay').length > 0) {
                theMsg.timestamp = stanza.getElementsByTagName('delay')[0].getAttribute('stamp');
                theMsg.contentType = 'delaymsg';
              }
              // 在一对一会话和群聊之外被发送的独立消息，并且它期望收到接收者应答
              // 暂时还没看到这种消息类型的消息。
              // 所以暂不处理。
              break;
            default :
              // msgType = 'normal';
              XoW.logger.e(_this.classInfo + "未知类型的节" + type);
              break;
          }
        }
        if (XoW.MessageType.CONTACT_CHAT === theMsg.type ||
          XoW.MessageType.HEADLINE == theMsg.type ||
          XoW.MessageType.NORMAL == theMsg.type) {
          // 放行
          let theChat = _this.getOrCreateChatByJid(stanza.getAttribute('from'));
          theChat.addMessage(theMsg);
          let param = { chat: theChat, msg: theMsg};
          _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.CHAT_MSG_RCV, param);
        } else if (type == 'error') {
          // 错误节
        } else if (type == 'groupchat') {
          // 群聊节
        } else {
          XoW.logger.w("这个节没有类型");
        }
      } else {
        if (isType == 'chat') {
          let  theMsg = new XoW.Message();
          theMsg.cid = stanza.getAttribute('id');
          theMsg.contentType = XoW.MessageContentType.MSG;
          theMsg.to = stanza.getAttribute('to'); // 非纯jid，是全jid
          theMsg.from = stanza.getAttribute('from');
          theMsg.content = stanza.getElementsByTagName('body').length > 0 ? stanza.getElementsByTagName('body')[0].textContent : '';
          let  type = stanza.getAttribute('type');
          let theChat = _this.getOrCreateChatByJid(stanza.getAttribute('from'));
          theChat.addMessage(theMsg);
          let  param = { chat: theChat, msg: theMsg};
          _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.CHAT_MSG_RCV, param);
          return true;
        }else{
        //todo g关于群组消息设置
        if(stanza.getAttribute('type')==undefined && XoW.utils.getNodeFromJid(stanza.getAttribute('to'))==XoW.utils.getNodeFromJid(_gblMgr.getCurrentUser().jid)&&stanza.getElementsByTagName('decline')[0]){
          _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_DISAGREE_INVITE, {
            from: stanza.getElementsByTagName('decline')[0].getAttribute('from'),
            reason: stanza.getElementsByTagName('reason')[0].textContent,
            roomjid: stanza.getAttribute('from')
          });
        }
        if(stanza.getAttribute('type') == 'error'){
          if((stanza.getElementsByTagName('subject').textContent)){
            _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_FORBIT_MEMBERSPEARK, "权限不够，发送失败");
            return true;
          }
          if(stanza.getElementsByTagName('reason')[0]&&stanza.getElementsByTagName('error')[0].getAttribute('code')=="403"){
            _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_NO_INVITATION_PERMISSION,"你没有邀请权限");
            return true
          }
          if(stanza.getElementsByTagName('error')[0].getAttribute('code')=="403") {
            _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_FORBIT_MEMBERSPEARK, "您被禁言,发送失败");
        //todo g关于群组消息设置
        if(stanza.getAttribute('type')==undefined && XoW.utils.getNodeFromJid(stanza.getAttribute('to'))==XoW.utils.getNodeFromJid(_gblMgr.getCurrentUser().jid)&&stanza.getElementsByTagName('decline')[0]){
          _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.DISAGREE_INVITATION,{from:stanza.getElementsByTagName('decline')[0].getAttribute('from'),reason:stanza.getElementsByTagName('reason')[0].textContent,roomjid:stanza.getAttribute('from')});
        }
        if(stanza.getAttribute('type') == 'error'){
          if((stanza.getElementsByTagName('subject').textContent)){
            _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_BANSPEAKED, "权限不够，发送失败");
            return true;
          }
          if(stanza.getElementsByTagName('reason')[0]&&stanza.getElementsByTagName('error')[0].getAttribute('code')=="403"){
            _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.NO_POWER_INVITION,"你没有邀请权限");
            return true
          }
          if(stanza.getElementsByTagName('error')[0].getAttribute('code')=="403") {
            _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_BANSPEAKED, "您被禁言,发送失败");
            return true;
          }
        }
        if(_gblMgr.getRoomMgr().isNew_room_title(stanza)){
          return true;
        }
        let pureJid = XoW.utils.getBareJidFromJid(stanza.getAttribute('from'));
        let theMsg1 = new XoW.Message();
        theMsg1.cid = stanza.getAttribute('id');
        theMsg1.to = stanza.getAttribute('to');
        theMsg1.from = stanza.getAttribute('from');
        if(_GetmineRoomMsg(theMsg1.cid)==false) {
          _RoomMsg.push(theMsg1.cid);
          theMsg1.type = 'group';
          theMsg1.contentType = 'msg';
          if (stanza.getElementsByTagName('body').length > 0) {
            theMsg1.content = stanza.getElementsByTagName('body')[0].textContent;
          }
          theMsg1.fromid = XoW.utils.getResourceFromJid(theMsg1.from);
          if (stanza.getElementsByTagName('delay').length > 0) {
            theMsg1.timestamp = stanza.getElementsByTagName('delay')[0].getAttribute('stamp');
            theMsg1.contentType = 'delaymsg';
          }
          if (theMsg1.content == "" || theMsg1.content == undefined || theMsg1.content == null || (theMsg1.content.length > 0 && theMsg1.content.trim().length == 0)) {
          if(theMsg1.content  == "" || theMsg1.content  == undefined || theMsg1.content  == null || (theMsg1.content.length>0 && theMsg1.content .trim().length == 0)){
            return true;
          }
          _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_MSG_RCV, theMsg1);
          return true;
        }
      }
      }
      XoW.logger.me(_this.classInfo, "_onMessage()");
      return true; // 必须返回true
    };
    /**
     * 创建chat
     * @param to to表示是好友，from表示是我
     */
    let _createChatByJid = (to)=> {
      XoW.logger.ms(_this.classInfo, '_createChatByJid({0})'.f(to));
      let chat = new XoW.Chat(to);
      _jidChats.push(chat);
      XoW.logger.me(_this.classInfo, '_createChatByJid({0})'.f(to));
      return chat;
    };
    // endregion Private Methods

    // region Public Methods
    //this.getJidChats = function () {
    //  XoW.logger.ms(_this.classInfo, 'getJidChats()');
    //  return _jidChats;
    //};
    /**
     * 根据好友的jid得到chat
     * @param pJid bare jid or full jid of remote peer.
     */
    this.getChatByJid = (pJid)=> {
      XoW.logger.ms(_this.classInfo, 'getChatByJid({0})'.f(pJid));
      pJid = XoW.utils.getBareJidFromJid(pJid);
      return _jidChats.find((x)=> {
        return x.to === pJid;
      });
    };
    /**
     * 根据好友的jid去获得chat，如果chat不存在，则创建
     * @param jid 要求纯的jid或全jid
     */
    this.getOrCreateChatByJid = (jid)=> {
      XoW.logger.ms(_this.classInfo, 'getOrCreateChatByJid({0})'.f(jid));
      jid = XoW.utils.getBareJidFromJid(jid);
      let chat = _this.getChatByJid(jid);
      if (null == chat) {
        chat = _createChatByJid(jid);
      }
      XoW.logger.me(_this.classInfo, 'getOrCreateChatByJid({0})'.f(jid));
      return chat;
    };
    this.sendMessage = (content, toJid, fromJid)=> {
      XoW.logger.ms(_this.classInfo, 'sendMessage({0})'.f(toJid));
      let chat = this.getOrCreateChatByJid(toJid);
      let msg = new XoW.Message();
      msg.cid = XoW.utils.getUniqueId('msg');
      msg.to = toJid;
      msg.fromid = fromJid;
      msg.type = XoW.MessageType.CONTACT_CHAT;
      msg.contentType = 'msg';
      msg.isRead = false;
      msg.content = content;
      chat.addMessage(msg);

      // $msg strophe定义
      let xmppmsg = $msg({
        id: msg.cid,
        from: msg.fromid,
        to: msg.to,
        type: 'chat'
      }).c('body').t(msg.content);
      _gblMgr.getConnMgr().send(xmppmsg);
      XoW.logger.me(_this.classInfo, 'sendMessage({0})'.f(toJid));
    };

    this.groupsendMessage = (content, toJid, fromJid)=>{   //群组发送消息
      XoW.logger.ms(_this.classInfo, 'sendMessage({0})'.f(toJid));
      let chat = this.getOrCreateChatByJid(toJid);
      let msg = new XoW.Message();
      msg.cid = XoW.utils.getUniqueId('msg');
      msg.to = toJid;
      msg.fromid = fromJid;
      msg.type = 'groupchat';
      msg.contentType = "msg";
      msg.isRead = false;
      msg.content = content;
      chat.addMessage(msg);
      _RoomMsg.push(msg.cid);
      // $msg strophe定义
      let xmppmsg = $msg({
        id: msg.cid,
        from: msg.fromid,
        to: msg.to,
        type: msg.type
      }).c("body").t(msg.content);
      _gblMgr.getConnMgr().send(xmppmsg);
      XoW.logger.me(_this.classInfo, 'sendMessage({0})'.f(toJid));
    };
    let _GetmineRoomMsg =(sid)=>{

      for(let i = 0;i<_RoomMsg.length;i++){
        if(_RoomMsg[i] ==sid) {

          return true;
        }
      }
      return false;
    }
    var _filterComponentMessage = function(stanza){   //过滤组件的消息
        if(stanza.getAttribute('from') == "filetransfer."+ XoW.config.domain){
            return true;
        }
        if(XoW.utils.getDomainFromJid(stanza.getAttribute('from')) == "intelligentcusservice."+ XoW.config.domain){
          let msg = stanza.getElementsByTagName('body')[0].textContent;
          var theMsg = new XoW.Message();
          theMsg.cid = XoW.utils.getUniqueId("msg");
          theMsg.mine = false;
          theMsg.username = XoW.utils.getNodeFromJid(stanza.getAttribute('from'));
          theMsg.content = msg;
         _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.KEFUMSGREV, theMsg);
             return true;
        }
        return false;
      }
    // endregion Public Methods

    // construct
    _init();
  };

  return XoW;
}));

