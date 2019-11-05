/**
 * Created by Administrator on 2018/3/14.
 * 本次会话（登录）实际收发的数据存在chat中 （历史记录和chat界面不算）
 */
XoW.Chat =  function(to) {
  var _this = this;
  this.to = to; // remote jid, bare jid(为了标记同多终端的聊天)，唯一标示该chat
  this.username = '';
  this.avatar = '';
  this.vCard = null;
  this.threadId = '';
  this.allMessage = [];// 所有消息，包括文件，普通消息,特指本次会话的消息（不含历史消息）
  this.classInfo = 'Chat_' + this.to;

  var _init = function () {
    XoW.logger.ms(_this.classInfo, '_init()');
    _this.to = to;
    XoW.logger.me(_this.classInfo, '_init()');
  };

  this.addMessage = function(pMsg) {
    XoW.logger.ms(_this.classInfo, 'addMessage()');
	  //if(pMsg instanceof XoW.File){
		 // Object.defineProperty(pMsg, 'name', {
			//  get: function() {
			//	  window.console.error('@@@@@@@@@@@@@@@@@@@@  '+ pMsg.filename);
			//	  return pMsg.filename;
			//  },
			//  set: function(newValue) {
			//	  window.console.error('#####################  '+ pMsg.filename);
			//	  pMsg.filename = newValue;
			//  }
		 // });
	  //}
    _this.allMessage.push(pMsg);
    XoW.logger.me(_this.classInfo, 'addMessage()');
  };

  /**
   * File是存储在chat中的一种msg
   * @param pIqId 协商会话id
   */
  this.getFileByIqId = function(pIqId) {
    XoW.logger.ms(_this.classInfo, 'getFileById({0})'.f(pIqId));
    for(var i = 0; i < this.allMessage.length; i++) {
      var msg = this.allMessage[i];
      if(msg instanceof XoW.File) {
        if(pIqId == msg.sid) {
          return msg;
        }
      }
    }
    XoW.logger.me(_this.classInfo, 'getFileById()');
  };

  this.getFileBySid = function(sid) {
    XoW.logger.ms(_this.classInfo, 'getFileBySid()');
    for(var i = 0; i < this.allMessage.length; i++) {
     var msg = this.allMessage[i];
     if(msg.sid && sid == msg.sid) {
       return msg;
     }
    }
	  return null;
    XoW.logger.me(_this.classInfo, 'getFileBySid()');
  };
  this.getLastMessage = function() {
    XoW.logger.ms(_this.classInfo, 'getLastMessage()');
    if(_this.allMessage != 0) {
      return _this.allMessage[_this.allMessage.length - 1];
    } else {
      return null;
    }
  };
  this.getUnreadMsgCount = function() {
    XoW.logger.ms(_this.classInfo + 'getUnreadMsgCount()');
    var count = 0;
    for(var i = 0; i < this.allMessage.length; i++) {
      var msg = this.allMessage[i];
      if(msg instanceof XoW.Message) {
        // isRead属性为false表示未读
        if(!msg.getIsRead()) {
          // 并且类型是msg
          if(XoW.MessageContentType.MSG == msg.getContentType()) {
            count++;
          };
        };
      };
      // 这里后面还要判断文件是否已读
    }
    XoW.logger.d(_this.classInfo + '未读MSG数量' + count);
    XoW.logger.me(_this.classInfo + 'getUnreadMsgCount()');
    return count;
  };
  this.getUnreadDelayMsgCount = function() {
    XoW.logger.ms(_this.classInfo + 'getUnreadDelayMsgCount()');
    var count = 0;
    for(var i = 0; i < this.allMessage.length; i++) {
      var msg = this.allMessage[i];
      if(msg instanceof XoW.MessageModel) {
        // isRead属性为false表示未读
        if(!msg.getIsRead()) {
          // 并且类型是msg
          if(XoW.MessageContentType.DELAYMSG == msg.getContentType()) {
            count++;
          }
        }
      }
      // 这里后面还要判断文件是否已读
    }
    XoW.logger.d(_this.classInfo + '未读DELAYMSG数量' + count);
    XoW.logger.me(_this.classInfo + 'getUnreadDelayMsgCount()');
    return count;
  };
  this.getUnreadFileCount = function() {
    XoW.logger.ms(_this.classInfo + 'getUnreadFileCount()');
    var count = 0;
    for(var i = 0; i < this.allMessage.length; i++) {
      var msg = this.allMessage[i];
      if(msg instanceof XoW.FileModel) {
        // isRead属性为false表示未读
        if(!msg.getIsRead()) {
          count++;
        }
      }
      // 这里后面还要判断文件是否已读
    }
    XoW.logger.d(_this.classInfo + '未读文件数量' + count);
    XoW.logger.me(_this.classInfo + 'getUnreadFileCount()');
    return count;
  };
  /**
   * 获得未读消息的数量，包括msg,delaymsg,fileMsg 。 不包括chatstate那些
   */
  this.getUnReadCount = function() {
    return this.getUnreadMsgCount() + this.getUnreadDelayMsgCount() + this.getUnreadFileCount();
//		var count = 0;
//		// 注意未读消息可能包括Message或者其他的比如File对象，所以要判断类型
//		// 因为这个是有顺序的，所以从最后往前遍历，一旦遍历到已读的消息，
//		// 就说明前面的其他消息也是已读的了。
//		for(var i = this.allMessage.length - 1; i >= 0; i--) {
//			var msg = this.allMessage[i];
//			if(msg instanceof XoW.MessageModel) {
//				if(!msg.getIsRead()) { // isRead属性为false表示未读
//					count++;
//				} else {
//					break;
//				}
//			}
//			// 这里后面还要判断文件是否已读
//		}
//		return count;
  }
  // endregion

  _init();
};