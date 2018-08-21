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
        VCARD: 'vcard-temp',
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
        CONNECT_RECEIVED: 'conn_evt_result',
        DISCONNECT_RECEIVED: 'conn_evt_disconnected',
        ROSTER_RECEIVED: 'roster_evt_rcv',
        ROSTER_REMOVE_FRIEND: 'roster_evt_remove_friend',
        VCARD_RECEIVED: 'vard_evt_rcv',
        CHAT_MSG_RECEIVED: 'chat_evt_msg_rcv',
        CHAT_FILE_TRANS_REQ_RECEIVED: 'chat_evt_file_trans_req_rcv',
        CHAT_IMAGE_TRANS_REQ_RECEIVED: 'chat_evt_img_trans_req_rcv',
        CHAT_IMAGE_RECEIVED: 'chat_evt_img_rcv',
        CHAT_IMAGE_TRANS_REQUESTED: 'chat_evt_img_trans_requested',
        CHAT_FILE_TRANS_REQUESTED: 'chat_evt_file_trans_requested',
        CHAT_FILE_STATE_CHANGED: 'chat_evt_file_state_changed',
        PRESENCE_RECEIVED: 'pre_evt_received',
        ERROR: 'evt_error',
      },
      VIEW_EVENT: {
        LOGIN_STATE_CHANGED: 'view_login_state_changed',
        DISCONNECTED: 'view_disconnected',
        FRIEND_AVATAR_CHANGED: 'view_friend_avatar_changed',
        FRIEND_NICKNAME_CHANGED: 'view_friend_nickname_changed',
        FRIEND_STATUS_CHANGED: 'view_friend_status_changed',
        CHAT_MSG_RECEIVED: 'view_chat_message_rcv',
        CHAT_FILE_TRANS_REQ_RECEIVED: 'view_file_trans_req_rcv',
        CHAT_IMAGE_RECEIVED: 'view_img_rcv',
        CHAT_FILE_TRANS_REQUESTED: 'view_file_ready', // file selected and wait for negotiation
        FILE_STATE_CHANGED: 'view_file_state_changed',
        FILE_OVERDUE: 'view_file_overdue',
        FILE_MSG_NOTIFY: 'view_file_getmessage_notify',
        ERROR_PROMPT: 'view_error_throwed',
      },
      // 在线状态枚举
      UserState: {
        ONLINE: 'online', // 在线
        CHAT: 2, // 空闲
        DND: 3, // 正忙
        AWAY: 4, // 离开
        OFFLINE: 'offline' // 隐身
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
      //消息类型,对应Xmpp message节type属性
      MessageType: {
        NORMAL: 'normal', // 缺省值，该消息是一个在一对一聊天会话或群聊上下文之外的被发送的独立消息
        CHAT: 'chat', // 一对一聊天
        GROUPCHAT: 'groupchat', // 聊天室
        HEADLINE: 'headline', // 通知，不期望回复
        ERROR: 'error' // 错误
      },
      DefaultImage: {
        AVATAR_DEFAULT: '../skin/images/avatar_male.bmp',
        AVATAR_MALE: '../skin/images/avatar_male.bmp',
        AVATAR_FEMALE: '../skin/images/avatar_male.bmp',
        AVATAR_KEFU: '../skin/images/kefu.png',
        TransFile_IMAGE: '../skin/images/defaultTransImg.png'
      },
      ClientMode: {
        KEFU: 'kefu', // 独立客服页面
        BRIEFKEFU: 'briefkefu', // 嵌入式客服页面(暂不支持)
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

