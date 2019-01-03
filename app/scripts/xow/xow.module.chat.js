(function (factory) {
  return factory(XoW);
}(function (XoW) {
  /**
   *
   * 拆包解包、管理所有会话数据，包括聊天室?
   * 注意，它与layim中cache.chat不是一个概念
   * @param globalManager
   * @constructor
   */
  XoW.ChatManager = function (globalManager) {
    // region Fields
    var _this = this;
    var _gblMgr = null; // 私有变量
    var _jidChats = [];
    this.classInfo = 'ChatManager';
    // endregion Fields

    // region Private methods
    var _init = function () {
      XoW.logger.ms(_this.classInfo, '_init()');
      _gblMgr = globalManager;
      // 监听消息节
      _gblMgr.getConnMgr().addHandler(_messageCb.bind(_this), null, 'message');
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
    var _messageCb = function (stanza) {
      XoW.logger.ms(_this.classInfo, '_messageCb()');
      var $message = $(stanza);
      var fromDomain = XoW.utils.getDomainFromJid($message.attr('from'));
      var myDomain = XoW.utils.getDomainFromJid(_gblMgr.getCurrentUser().jid);
      // 以这种方式来区分是会议室的消息/会议室的私聊 还是个人消息
      // 如果两个doamin相同，则说明是个人消息
      XoW.logger.d(_this.classInfo, 'fromDomain：{0} toDomain: {1}'.f(fromDomain, myDomain));
      if (fromDomain == myDomain) {
        // 到时候这边看看要不要把type=errror的消息拦截下来。在外面进行统一的处理。
        var theMsg = new XoW.Message();
        theMsg.cid = $message.attr('id');
        theMsg.to = $message.attr('to'); // 非纯jid，是全jid
        theMsg.from = $message.attr('from');
        theMsg.thread = $('thread', $message).html();

        var type = $message.attr('type');
        if (!type) {
          // 如果没有type，则认为是normal
          XoW.logger.w(_this.classInfo + "刚到的消息没有类型！");
          // 如果刚到的消息里面有body，则认为是 noraml msg
          if ($('body', $message).length) {
            theMsg.type = XoW.MessageType.CHAT;
            theMsg.contentType = XoW.MessageContentType.MSG;
            theMsg.content = $('body', $message).text();
            if ($('delay', $message).length) {
              theMsg.time = XoW.utils.getFromatDatetime($('delay', $message).attr('stamp'));
              theMsg.contentType = XoW.MessageContentType.DELAYMSG;
            }
          } else {
            alert('检查一下这是什么信息:)');
            // 可能是invite信息。。。
          }
        } else {
          switch (type) {
            case 'chat' :
              // 一对一聊天，或者是在聊天室中的私聊
              XoW.logger.i(_this.classInfo + "刚到的消息是一个chat！");
              theMsg.type = 'chat';
              if ($('active', $message).length) {
                theMsg.contentType = "active";
                theMsg.isRead = true;
              } else if ($('inactive', $message).length) {
                theMsg.contentType = "inactive";
                theMsg.isRead = true;
              } else if ($('composing', $message).length) {
                theMsg.contentType = "composing";
                theMsg.isRead = true;
              } else if ($('paused', $message).length) {
                theMsg.contentType = "paused";
                theMsg.isRead = true;
              } else if ($('gone', $message).length) {
                theMsg.contentType = "gone";
                theMsg.isRead = true;
              }
              if ($('body', $message).length) {
                theMsg.content = $('body', $message).text();
                theMsg.isRead = false;
                theMsg.contentType = 'msg';
              }
              if ($('delay', $message).length) {
                // msg.time = XoW.utils.getFromatDatetime($('delay', $message).attr('stamp'));
                theMsg.timestamp = $('delay', $message).attr('stamp');
                theMsg.contentType = 'delaymsg';
              }
              XoW.logger.d(_this.classInfo + "消息内容");
              XoW.logger.p({type: theMsg.type, contentType: theMsg.contentType});
              break;
            case 'error' :
              XoW.logger.w(_this.classInfo + "刚到的消息是一个error！");
              // 错误
              theMsg.type = 'error';
              XoW.logger.d(_this.classInfo + "有个错误的消息节");
              break;
            case 'groupchat' :
              // groupchat由room那边接管来做，这里不处理。
              XoW.logger.d(_this.classInfo + "刚到的消息是一个groupchat！");
              break;
            case 'headline' :
              // 警告，通知，不期望应答的临时消息（新闻，运动更新）
              XoW.logger.d(_this.classInfo + "刚到的消息是一个headline！");
              theMsg.Type = 'headline';
              // msg.contentType = 'msg';
              theMsg.content = $('body', $message).text();
              break;
            case 'normal' :
              XoW.logger.d(_this.classInfo + "刚到的消息是一个normal！");
              theMsg.type = 'normal';
              theMsg.contentType = 'msg';
              theMsg.content = $('body', $message).text();
              if ($('delay', $message).length) {
                theMsg.time = XoW.utils.getFromatDatetime($('delay', $message).attr('stamp'));
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
        if ('chat' == theMsg.type || 'headline' == theMsg.type || 'normal' == theMsg.type) {
          // 放行
          var theChat = _this.getOrCreateChatByJid($message.attr('from'));
          theChat.addMessage(theMsg);
          var param = { chat: theChat, msg: theMsg};
          _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.CHAT_MSG_RCV, param);
        } else if (type == 'error') {
          // 错误节
        } else if (type == 'groupchat') {
          // 群聊节
        } else {
          XoW.logger.w("这个节没有类型");
        }
      } else {
        XoW.logger.d(_this.classInfo + "是群聊消息，不做处理");
      }
      XoW.logger.me(_this.classInfo, "_messageCb()");
      return true; // 必须返回true
    };
    /**
     * 创建chat
     * @param to to表示是好友，from表示是我
     */
    var _createChatByJid = function (to) {
      XoW.logger.ms(_this.classInfo, '_createChatByJid({0})'.f(to));
      var chat = new XoW.Chat(to);
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
    this.getChatByJid = function (pJid) {
      XoW.logger.ms(_this.classInfo, 'getChatByJid({0})'.f(pJid));
      pJid = XoW.utils.getBareJidFromJid(pJid);
      return _jidChats.find(function (x) {
        return x.to === pJid;
      });
    };
    /**
     * 根据好友的jid去获得chat，如果chat不存在，则创建
     * @param jid 要求纯的jid或全jid
     */
    this.getOrCreateChatByJid = function (jid) {
      XoW.logger.ms(_this.classInfo, 'getOrCreateChatByJid({0})'.f(jid));
      jid = XoW.utils.getBareJidFromJid(jid);
      var chat = _this.getChatByJid(jid);
      if (null == chat) {
        chat = _createChatByJid(jid);
      }
      XoW.logger.me(_this.classInfo, 'getOrCreateChatByJid({0})'.f(jid));
      return chat;
    };
    this.sendMessage = function (content, toJid, fromJid) {
      XoW.logger.ms(_this.classInfo, 'sendMessage({0})'.f(toJid));
      var chat = this.getOrCreateChatByJid(toJid);
      var msg = new XoW.Message();
      msg.cid = XoW.utils.getUniqueId('msg');
      msg.to = toJid;
      msg.fromid = fromJid;
      msg.type = 'chat';
      msg.contentType = "msg";
      msg.isRead = false;
      msg.content = content;
      chat.addMessage(msg);

      // $msg strophe定义
      var xmppmsg = $msg({
        id: msg.cid,
        from: msg.fromid,
        to: msg.to,
        type: msg.type
      }).c("body").t(msg.content);
      _gblMgr.getConnMgr().send(xmppmsg);
      XoW.logger.me(_this.classInfo, 'sendMessage({0})'.f(toJid));
    };
    // endregion Public Methods

    // construct
    _init();
  };

  return XoW;
}));

