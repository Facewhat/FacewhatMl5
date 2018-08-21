/**
 * Created by Administrator on 2018/3/15.
 */
(function (factory) {
  return factory(XoW);
}(function (XoW) {
  XoW.Message = function () {
    var _this = this;
    // region 适配layim
    this.username = ''; // 对端用户名
    this.avatar = ''; // 对端头像,每一条消息都记录一个base64串太耗存储了（layim原本记录的是地址而非值，fw存储值） todo
    this.type = 'friend'; // xmpp中对应normal广播, chat, groupchat, headline通知,到界面层再转吧
    this.content = ''; // xmpp中对应body
    this.cid = 0; // 消息id，对应xmpp id
    this.id = ''; // 消息的来源ID（如果是私聊，则是用户id;如果是群聊，则是群组id）
    this.fromid = ''; // 消息的发送者id（比如群组中的某个消息发送者），可用于自动解决浏览器多窗口时的一些问题
    this.mine = false; // 是否我发送的消息，如果为true，则会显示在右方
    this.timestamp = ''; // 服务端时间戳毫秒数。注意：如果你返回的是标准的 unix 时间戳，记得要 *1000
    // endregion 适配layim

    this.thread = '';
    this.from = ''; // not bare jid, xxx
    this.to = ''; // Bare Jid
    this.contentType = ''; // msg, delaymsg, active, inactive, gone, composing, paused
    this.isRead = false;

    this.classInfo = 'Message' + this.id;

    var _init = function () {
      XoW.logger.ms(_this.classInfo, '_init()');
      _this.timestamp =  Date.parse(new Date());
      XoW.logger.me(_this.classInfo, '_init()');
    };
    _init();
  };
}));