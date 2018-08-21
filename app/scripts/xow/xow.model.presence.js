/**
 * todo 获取到Presence后要把resouce更新到缓存中,解决某些场景需要fullJid的情景（直接去缓存或节目获取）
 * todo 默认人（客服）要做单向订阅，不仅为了显示状态还为了获取resource
 * @constructor
 */
XoW.Presence = function() {
  var _this = this;
  this.id = '';
  this.from = ''; // 此处from 很可能带有 resource
  this.to = ''; // 此处to 很可能带有 resource
  this.type = '';
  this.status = '';
  this.show = '';
  this.priority = '';
  this.photoHash = ''; // 用于判定是否用户头像有变化，请参考facewhat1.0
  this.avatarHash = '';
  this.time = '';

  this.classInfo = 'Presence_' + this.from;

  var _init = function () {
    XoW.logger.ms(_this.classInfo, '_init()');
    XoW.logger.me(_this.classInfo, '_init()');
  };

  this.getToResource = function() {
    return XoW.utils.getResourceFromJid(_this.to);
  };
  this.getFromResource = function() {
    return XoW.utils.getResourceFromJid(_this.from);
  };
  /**
   * 判断这个出席的报文是不是自己发给自己的
   */
  this.isMeToMe = function() {
    XoW.logger.ms(_this.classInfo, 'isMeToMe()');
    if(XoW.utils.getBareJidFromJid(this.from)== XoW.utils.getBareJidFromJid(this.to)) {
      return true;
    } else {
      return false;
    }
  };

  /**
   * 得到这个出席节展示的状态 即用户的state的
   */
  this.getStatus = function() {
    // alert("showText是" + showText);
    // 在线  <status>在线</status><priority>1</priority>
    // 空闲  <status>空闲</status><priority>1</priority><show>chat</show>
    // 离开 <status>离开</status><priority>0</priority><show>away</show>
    // 正忙 <status>正忙</status><priority>0</priority><show>dnd</show>
    // 离线 <presence type="unavailable" ><status>Offline</status><priority>0</priority>
    if('unavailable' == _this.type) {
      // 离线
      return XoW.UserState.OFFLINE;
    } else if('chat' == _this.show) {
      // 空闲
      //return XoW.UserState.CHAT;
    } else if('away' == _this.show) {
      // 离开
      //return XoW.UserState.AWAY;
    } else if('dnd' == _this.show) {
      // 正忙
      //return XoW.UserState.DND;
      //	} else if("1" == this.priority) {
      // 在线
//			return XoW.UserState.ONLINE;
    } else {
      // 由于小龙的实现是在线没有包含priority，所以，如果不是上面的状态就是在线了
      return XoW.UserState.ONLINE;
    }
    return XoW.UserState.ONLINE;
  };

  _init();
};