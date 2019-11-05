/**
 * Created by cy on 2018/3/2.
 */
(function (factory) {
  return factory(XoW);
}(function (XoW) {
  /**
   * 好友分組实体，不要添加逻辑
   * 格式兼容layim.cache.friend
   *  "friend": [{"groupname": "前端的同学"
            ,"id": 1
            ,"online": 2
            ,"list": []}
   	    ,{
              "groupname": "前端的同学2"
              ,"id": 100
              ,"online": 2
              ,"list": []
            }]
   * 代码调用：
   *  var a = new FriendGroup ( 'sven1' );
   var b = new FriendGroup ( 'sven2' );
   alert(a.toStringAll()); // [group]  groupname = sven1, name = undefined online = 0, count = 0 [friend]
   alert(b.toStringAll()); // [group]  groupname = sven2, name = undefined online = 0, count = 0 [friend]
   */
  XoW.FriendGroup = function (groupname) {
    var _this = this;
    // region 兼容layim的属性
    this.groupname = ''; //  xmpp roster 仅返回 groupname
    this.id = ''; // 与groupname值相同
    this.online = 0;
    this.list = []; // 分組内好友
    // endregion 兼容layim的属性
    this.count = 0;
    this.blinkInterval = ""; // 闪烁的interval，在页面中，指示是否闪烁以及intever的句柄
    this.classInfo = 'FriendGroup' + this.groupname;

    var _init = function () {
      XoW.logger.ms(_this.classInfo, '_init()');
      _this.groupname = groupname;
      _this.id = groupname;
      XoW.logger.me(_this.classInfo, '_init()');
    };
    this.getItemByJid = function(jid) {
      if(jid == null || jid == "") {
        return null;
      }
      jid = XoW.utils.getBareJidFromJid(jid);
      for(var i = 0; i < this.list.length; i++) {
        if(_this.list[i].id == jid) {
          return _this.list[i];
        }
      }
      return null;
    };
    _init();
  };

  XoW.Room = function() {
    this.jid = "";
    this.name = "";
    this.type = "";
    this.groupname="";
    this.id = "";
    this.to - "";
    // this.roomConfig = null; // RoomConfig对象
    // 从RoomConfig中取出的配置，因为如果要多次使用的话，不能一直去执行parse操作。
    // 每次取config的时候，都先判断一个config是不是为空，是的话就调用roomConfig的parse方法。
    this.config = null;
    this.occupants = 0;
  };
  XoW.Room.prototype = {


    getConfig : function(){ return this.config; },
    setConfig : function(_config){ this.config = _config;
      // this.propertyChanged(XoW.FileModelEnum.CONFIG);
    },


    // feature 判断是否包含某一中类型
    isIncludeRoomType : function(type) {
      for(var i = 0; i < this.config.features.length; i++) {
        var feature = this.config.features[i];
        if(type == feature) {
          return true;
        }
      }
      return false;
    },
    isPublic : function() {
      return this.isIncludeRoomType('muc_public');
    },
    isOpen : function() {
      return this.isIncludeRoomType('muc_open');
    },
    isUnmoderated : function() {
      return this.isIncludeRoomType('muc_unmoderated');
    },
    isNonanonymous : function() {
      return this.isIncludeRoomType('muc_nonanonymous');
    },
    isUnsecured : function() {
      return this.isIncludeRoomType('muc_unsecured');
    },
    isPersistent : function() {
      return this.isIncludeRoomType('muc_persistent');
    },



    // identity
    getName : function() {
      return this.config.identities[0].name;
    },
    getType : function() {
      return this.config.identities[0].type;
    },
    getCategory : function() {
      return this.config.identities[0].category;
    },
    // x 我现在已经假设了，0就是描述，1就是主题了，没有再做判断
    getDescription : function() {
      return this.config.x[0].value;
    },
    getSubject : function() {
      return this.config.x[1].value;
    },
    getOccupants : function() {
      return this.config.x[2].value;
    },
    getCreationdate : function() {
      return this.config.x[3].value;
    },


    /**
     * 得到配置
     */
    parseConfig : function() {
      XoW.logger.ms(this.classInfo + "parseConfig");
      var baseInfo = {
        'jid' : this.jid,
        'name' : this.config.identities[0].name,
        'type' : this.config.identities[0].type,
        'category' : this.config.identities[0].category,
      };
      // 'features' : config.identities[0].category,
      var xInfo = [
        this.config.x[0],
        this.config.x[1],
        this.config.x[2],
        this.config.x[3],
      ];
      var roomInfo = [];
      // 这边我是怕房间的属性的顺序不同，所以使用了比较麻烦的方式来做
      for(var i = 0; i < this.config.features.length; i++) {
        var feature =  this.config.features[i];
        XoW.logger.w("房间类型 " + feature);
        if(feature.indexOf('muc_') === 0) {
          XoW.logger.w("进来了房间类型 " + feature);
          roomInfo.push(feature);
        }
      }
      XoW.logger.me(this.classInfo + "parseConfig");
      return {
        'baseInfo' : baseInfo,
        'xInfo' : xInfo,
        'roomInfo' : roomInfo
      };
    },
  };



  XoW.RoomPresence = function() {
    this.room;
    this.type; // error,unavailable,join,changeNick
    this.errorCode;
    this.message;
  };
  XoW.RoomPresence.prototype = {

  };

  return XoW;
}));