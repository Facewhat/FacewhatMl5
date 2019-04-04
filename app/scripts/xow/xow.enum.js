/**
 * Created by cy on 2018/3/1.
 * Framework, Const values
 */
(function (factory) {
  // 暂时不用amd那个东西，因为还不知道那个的具体用处
  window.XoW = factory(Strophe);
}(function (Strophe) {
  var XoW = {
      // 命名空间
      NS: {
        PING: 'urn:xmpp:ping',
        VCARD: 'vcard-temp'/*server不支持'urn:ietf:params:xml:ns:vcard-4.0'*/,
        USER_SERACH: 'jabber:iq:search',
        FORM_DATA: 'jabber:x:data',
        ARCHIVE: 'urn:xmpp:archive',
        FW_ORGNIZATION: 'http://facewhat.com/orgnization',
        FW_FILESI: 'http://facewhat.com/fileid'
      },
      // 节类型
      StanzaType: {
        SET: 'set',
        GET: 'get',
        RESULT: 'result',
        ERROR: 'error'
      },
      // 回调类型
      SERVICE_EVENT: {
        // XMPP
        UNKNOWN: 'UNKNOWN',
        CONNECT_RCV: 'CONNECT_RCV',
        DISCONNECT_RCV: 'DISCONNECT_RCV',
        CARD_RCV: 'CARD_RCV',
        PRESENCE_RCV: 'PRESENCE_RCV',

        ROSTER_RCV: 'ROSTER_RCV',
        ROSTER_CONTACT_DISSOLVED: 'ROSTER_CONTACT_DISSOLVED',
        ROSTER_CONTACT_REMOVED: 'ROSTER_CONTACT_REMOVED',
        ROSTER_CONTACT_ADDED: 'ROSTER_CONTACT_ADDED',
        ROSTER_CONTACT_MODIFIED: 'ROSTER_CONTACT_MODIFIED',

        SUB_CONTACT_READY: 'SUB_CONTACT_READY',
        SUB_CONTACT_REQ_SUC: 'SUB_CONTACT_REQ_SUC',
        SUB_CONTACT_BE_APPROVED: 'SUB_CONTACT_BE_APPROVED',
        SUB_CONTACT_BE_DENIED: 'SUB_CONTACT_BE_DENIED',
        SUB_ME_REQ_RCV: 'SUB_ME_REQ_RCV',
        UN_SUB_ME_REQ_RCV: 'UN_SUB_ME_REQ_RCV',
        UN_SUB_CONTACT_REQ_SUC: 'UN_SUB_CONTACT_REQ_SUC',
        CHAT_MSG_RCV: 'CHAT_MSG_RCV',
        CHAT_FILE_TRANS_REQ_RCV: 'CHAT_FILE_TRANS_REQ_RCV',
        CHAT_IMAGE_TRANS_REQ_RCV: 'CHAT_IMAGE_TRANS_REQ_RCV',
        CHAT_IMAGE_RCV: 'CHAT_IMAGE_RCV',
        CHAT_IMAGE_TRANS_REQ_SUC: 'CHAT_IMAGE_TRANS_REQ_SUC',
        CHAT_FILE_TRANS_REQ_SUC: 'CHAT_FILE_TRANS_REQ_SUC',
        CHAT_FILE_STATE_CHANGED: 'CHAT_FILE_STATE_CHANGED',
        USER_SEARCH_RSP_RCV: 'USER_SEARCH_RSP_RCV',
        ERROR: 'ERROR',
      },
      VIEW_EVENT: {
        V_LOGIN_STATE_CHANGED: 'V_LOGIN_STATE_CHANGED',
        V_DISCONNECTED: 'V_DISCONNECTED',

        V_FRIEND_AVATAR_CHANGED: 'V_FRIEND_AVATAR_CHANGED',
        V_FRIEND_NICKNAME_CHANGED: 'V_FRIEND_NICKNAME_CHANGED',
        V_FRIEND_SIGN_CHANGED: 'V_FRIEND_SIGN_CHANGED',
        V_FRIEND_GROUP_CHANGED: 'V_FRIEND_GROUP_CHANGED',
        V_FRIEND_STATUS_CHANGED: 'V_FRIEND_STATUS_CHANGED',
        V_FRIEND_ADDED: 'V_FRIEND_ADDED',
        V_FRIEND_REMOVED: 'V_FRIEND_REMOVED',
        V_NEW_INFO_ADDED: 'V_NEW_INFO_ADDED',
        V_SUB_ME_REQ_RCV: 'V_SUB_ME_REQ_RCV',
        V_SUB_CONTACT_REQ_SUC: 'V_SUB_CONTACT_REQ_SUC',
        V_SUB_CONTACT_BE_APPROVED: 'V_SUB_CONTACT_BE_APPROVED',
        V_SUB_CONTACT_BE_DENIED: 'V_SUB_CONTACT_BE_DENIED',

        V_CHAT_MSG_RCV: 'V_CHAT_MSG_RCV',
        V_CHAT_FILE_TRANS_REQ_RCV: 'V_CHAT_FILE_TRANS_REQ_RCV',
        V_CHAT_IMAGE_RCV: 'V_CHAT_IMAGE_RCV',
        V_CHAT_IMAGE_TRANS_REQ_SUC: 'V_CHAT_IMAGE_TRANS_REQ_SUC',
        V_CHAT_FILE_TRANS_REQ_SUC: 'V_CHAT_FILE_TRANS_REQ_SUC', // file selected and wait for negotiation
        V_FILE_STATE_CHANGED: 'V_FILE_STATE_CHANGED',
        V_FILE_OVERDUE: 'V_FILE_OVERDUE',
        V_USER_SEARCH_RSP_RCV: 'V_USER_SEARCH_RSP_RCV',

        V_ERROR_PROMPT: 'V_ERROR_PROMPT',
      },
      // 在线状态枚举
      UserState: {
        ONLINE: 'online', // 在线
        CHAT: 2, // 空闲
        DND: 3, // 正忙
        AWAY: 4, // 离开
        HIDE: 'hide', // 隐身
        OFFLINE: 'offline'
      },
      //消息内容类型
      MessageContentType: {
        MSG: 'msg', // 普通消息
        DELAYMSG: 'delaymsg', // 延迟消息
        ACTIVE: 'active', // 聊天状态信息
        GONE: 'gone',
        INACTIVE: 'inactive',
        COMPOSING: 'composing',
        PAUSED: 'paused'
      },
      //消息类型,适配Xmpp message节type属性,但是值与layim
      MessageType: {
        NORMAL: 'normal', // 缺省值，该消息是一个在一对一聊天会话或群聊上下文之外的被发送的独立消息
        CONTACT_CHAT: 'friend', // 一对一聊天，xmpp对应'chat'
        GROUP_CHAT: 'group', // 聊天室, xmpp对应'groupchat'
        HEADLINE: 'headline', // 通知，不期望回复
        ERROR: 'error' // 错误
      },
      DefaultImage: {
        AVATAR_DEFAULT: '../skin/images/avatar_male.bmp',
        AVATAR_MALE: '../skin/images/avatar_male.bmp',
        AVATAR_FEMALE: '../skin/images/avatar_male.bmp',
        AVATAR_KEFU: '../skin/images/kefu.png',
        AVATAR_STRANGER: '../skin/images/avatar_stranger.png',
        AVATAR_ROOM: '../skin/images/avatar_room.png',
        FILE_IMAGE_DAMAGE: '../skin/images/img_damage.png',
	      SYSINFO_NOTIFY: '../skin/images/sysinfo_notify.png'
      },
      ClientMode: {
        KEFU: 'kefu', // 独立客服页面
        BRIEF_KEFU: 'briefkefu', // 嵌入式客服页面(暂不支持)
        NORMAL: 'normal' // 默认
      },
      FileReceiveState: {
        UNACCEPTED: 'unaccepted', 	 // initialization
        CANCELED: 'canceled',         // local canceled the si
        ACCEPTED: 'accepted',        // negotiation result
        REJECTED: 'rejected',        // negotiation result
        CLOSED: 'received', 	       // after close
        OPEN: 'open', 		             // before receiving
        RECEIVING: 'receiving', 	   // data transferring，
        LOCAL_STOPPED: 'localStopped',   // canceled by myself when transferring
        REMOTE_STOPPED: 'remoteStopped', // canceled by remote when transferring
        ERROR: 'error',
        OVERDUE: 'overdue'
      }
    };
  return XoW;
}));

/**
 * Const values which create dynamically
 * Singleton
 * @constructor
 */
XoW.getFileStatusDescMap = (function () {
  var _fileTransStateDescMap;
  return function() {
    if (!_fileTransStateDescMap) {
      _fileTransStateDescMap = new XoW.Map();
      _fileTransStateDescMap.set(XoW.FileReceiveState.UNACCEPTED, '等待对方接收文件'); // 发送端才显示
      _fileTransStateDescMap.set(XoW.FileReceiveState.ACCEPTED, '{0}已接受请求，等待传输'); // 您或对方
      _fileTransStateDescMap.set(XoW.FileReceiveState.REJECTED, '{0}已拒绝接收文件');
      _fileTransStateDescMap.set(XoW.FileReceiveState.OPEN, '开始传输文件');
      _fileTransStateDescMap.set(XoW.FileReceiveState.LOCAL_STOPPED, '您取消了文件{0}');  // 接收或发送
      _fileTransStateDescMap.set(XoW.FileReceiveState.REMOTE_STOPPED, '对方取消了文件{0}');
      _fileTransStateDescMap.set(XoW.FileReceiveState.RECEIVING, '已传输{0}%');
      _fileTransStateDescMap.set(XoW.FileReceiveState.CLOSED, '文件传输已完成');
      _fileTransStateDescMap.set(XoW.FileReceiveState.OVERDUE, '会话已过期');
      _fileTransStateDescMap.set(XoW.FileReceiveState.ERROR, '未知错误');
    }
    return _fileTransStateDescMap;
  }
})();

