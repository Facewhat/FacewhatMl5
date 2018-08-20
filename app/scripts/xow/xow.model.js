(function (factory) {
  return factory(XoW);
}(function (XoW) {
  /**
   * 用户对象
   */
  XoW.User = function (userManager) {
    this._userMgr = userManager;

    this.jid = "";
    this.name = "";
    this.group = [];
    this.ask = "";
    this.subscription = "";

    this.face = ""; // 默认头像
    this.state = "5"; // 默认离线状态，XoW.UserStateEnum.OFFLINE; 为5
    this.blinkInterval = ""; // 界面闪烁的指示，这里居然有了界面的东西。。。

    // 解析roster的时候获取不到，后面再拿
    this.vcard = null;
    // 后面对方发送来了出席节才有的
    this.pres = []; // 出席节集合
    this.resource = ""; // 对方所在的资源

    // this.handlers = []; // 所有属性set方法触发的handlers

    this.handler = null;

    this.classInfo = "【User" + this.jid + "】";
    this._init();

  };
  XoW.User.prototype = {
    _init: function () {
      XoW.logger.ms(this.classInfo + "_init()");
      this.handler = new XoW.Handler();
      this._userMgr.getPresenceMgr().addHandlerToPresenceMgr('presence', this._presenceCb.bind(this));
      XoW.logger.me(this.classInfo + "_init()");
    },

    setUserMgr: function (_userManager) {
      this._userMgr = _userManager;
    },

    sendOnline: function () {
      XoW.logger.ms(this.classInfo + "sendOnline()");
      this._userMgr.sendOnline();
      XoW.logger.me(this.classInfo + "sendOnline()");
    },
    sendOnlineToRoom: function (roomJid) {
      XoW.logger.ms(this.classInfo + "sendOnlineToRoom()");
      this._userMgr.sendOnlineToRoom(roomJid);
      XoW.logger.me(this.classInfo + "sendOnlineToRoom()");
    },
    sendChat: function () {
      XoW.logger.ms(this.classInfo + "sendChat()");
      this._userMgr.sendChat();
      XoW.logger.me(this.classInfo + "sendChat()");
    },
    sendAway: function () {
      XoW.logger.ms(this.classInfo + "sendAway()");
      this._userMgr.sendAway();
      XoW.logger.me(this.classInfo + "sendAway()");
    },
    sendDnd: function () {
      XoW.logger.ms(this.classInfo + "sendDnd()");
      this._userMgr.sendDnd();
      XoW.logger.me(this.classInfo + "sendDnd()");
    },
    sendOffline1: function () {
      XoW.logger.ms(this.classInfo + "sendOffline1()");
      this._userMgr.sendOffline1();
      XoW.logger.me(this.classInfo + "sendOffline1()");
    },

    _presenceCb: function (params) {
      XoW.logger.ms(this.classInfo + "_presenceCb()");
//		var params = {
//				preType : preType,
//				presenceStanza : stanza,
//				presence : presence
//		};
      var presence = params.presence;

      XoW.logger.p({from: presence.from, me: this.jid});
      if (XoW.utils.getBareJidFromJid(presence.from) == this.jid) {
        // 那么就是发送给自己的出席节
        XoW.logger.i(this.classInfo + "是该用户的出席节");
        XoW.logger.d(this.classInfo + params.presence.toStringAll());
        // 更新res
        var res = XoW.utils.getResourceFromJid(presence.from);
        if (res) {
          this.setResource(res);
        }
        // 加入出席节，
        this.addPres(presence);
        // 修改状态 ,判断该好友的状态是否改变
        // 如果当前状态friend.getState()和新来出席节的状态 presTemp.getState()
        // 一致：则不用调用friend.setState()
        // 不一致： 调用friend.setState()
        var oldState = this.getState();
        var newState = presence.getState();
        XoW.logger.p({"旧状态": oldState, "新状态: ": newState});
        if (oldState != newState) {
          this.setState(newState);
          // 这里去监听实现= =
//				if(newState == XoW.UserStateEnum.OFFLINE 
//						|| oldState == XoW.UserStateEnum.OFFLINE) {
//					// 说明某个好友刚刚上线了或者下线了，那么要通知friendGroup去改变当前在线人数
//					
//					this._notifyFriendGroupChangeCurrentNums(friend.getJid());
//				}
        }

        // 通过比较photo和hash中的字符串判断头像是否被改变了
        // 如果出席节=1，那么就是第一次发送出席节给我，两种情况：
        // 第一种，我登录时他已登录，那么我在登录过程出会请求他的vacrd
        // 然后我发送出席节，它才发送第一个出席节给我，此时感觉没必要再请求一次vcard
        // 第二种，我登录时他没登录，那么我在登录过程出会请求他的vacrd
        // 然他登陆时，给我发送一个出席节，此时他的头像应该是没有变的。
        // 所以考虑当该好友的pres节数量<=1时，不考虑该人的头像是否变化
        var pres = this.getPres();
        if (pres.length > 1) {
          // 取出倒二个,因为我已经把presTemp放进去了
          var lastButOne = pres[pres.length - 2];

          // 如果哈希码都能对的上，说明头像没有变
          if (lastButOne.photoHash == presence.photoHash
            && lastButOne.avatarHash == presence.avatarHash) {
            XoW.logger.d(this.classInfo + "没有改变头像");
          } else {
            // 用户更新了头像，要去它的新vcard
            XoW.logger.d(this.classInfo + "改变了头像");
            this.getVcardFromServer();
          }
        }
      }

      XoW.logger.me(this.classInfo + "_presenceCb()");
      return true;
    },

    getVcardFromServer: function (successCb, errorCb, timeout) {
      XoW.logger.ms(this.classInfo + "getVcardFromServer()");
      this._userMgr.getVcard(this.jid, function (params) {
        XoW.logger.ms(this.classInfo + "获取vcard成功");
//			var params = {
//					vcard : vcardTemp , // 解析后
//					vcardStanza : stanza, // 解析前
//				};
        // 那个设置头像
        var vcard = params.vcard;
        XoW.logger.d(this.classInfo + "来了一个vcard");
        if (this.getFace() != vcard.PHOTO.BINVAL) {
          this.setFace(vcard.PHOTO.BINVAL);
        }
        // 保存vcard
        this.setVcard(vcard);
        if (successCb) {
          successCb(params);
        }
      }.bind(this), errorCb, timeout);
      XoW.logger.me(this.classInfo + "getVcardFromServer()");
    },

    getRosterFromServer: function (successCb, errorCb, timeout) {
      XoW.logger.ms(this.classInfo + "getRosterFromServer()");
      this._userMgr.getRoster(successCb, errorCb, timeout);
      XoW.logger.me(this.classInfo + "getRosterFromServer()");
    },


    /**
     * 回调与触发。
     * @param proName
     * @param callback
     */
    addHandlerToUser: function (proName, callback) {
      XoW.logger.ms(this.classInfo + "addHandlerToUser()");
      XoW.logger.d(this.classInfo + "添加了一个监听，监听属性： " + proName);
      this.handler.addHandler(proName, callback);
      XoW.logger.me(this.classInfo + "addHandlerToUser()");
    },
    deleteHandlerInUser: function (id) {
      XoW.logger.ms(this.classInfo + "deleteHandlerInUser()");
      this.handler.deleteHandler(id);
      XoW.logger.me(this.classInfo + "deleteHandlerInUser()");
    },
    triggerHandlerInUser: function (proName, params) {
      XoW.logger.ms(this.classInfo + "triggerHandlerInUser()");
      XoW.logger.d(this.classInfo + "触发的属性是： " + proName);
      this.handler.triggerHandler(proName, params);
      XoW.logger.me(this.classInfo + "triggerHandlerInUser()");
    },

    // 通过get/set方法来修改属性，以触发属性上绑定的handler。
    getJid: function () {
      return this.jid;
    },
    setJid: function (_jid) {
      var params = {
        oldValue: this.jid,
        newValue: _jid,
      };
      this.jid = _jid;
      this.triggerHandlerInUser("jid", params);
    },
    getName: function () {
      return this.name;
    },
    setName: function (_name) {
      var params = {
        oldValue: this._name,
        newValue: _name,
        user: this,
      };
      this.name = _name;
      this.triggerHandlerInUser('name', params);
    },
    getGroup: function () {
      return this.group;
    },
    setGroup: function (_group) {

      var params = {
        oldValue: this.group,
        newValue: _group,
        user: this,
      };
      this.group = _group;
      this.triggerHandlerInUser('group', params);
    },
    addGroup: function (_group) {
      var params = {
        oldValue: this.group,
        addValue: _group,
      };
      this.group.push(_group);
      this.triggerHandlerInUser('addGroup', params);
    },
    getAsk: function () {
      return this.ask;
    },
    setAsk: function (_ask) {
      var params = {
        oldValue: this.ask,
        newValue: _ask,
      };
      this.ask = _ask;
      this.triggerHandlerInUser('ask', params);
    },
    getSubscription: function () {
      return this.subscription;
    },
    setSubscription: function (_subscription) {
      var params = {
        oldValue: this.subscription,
        newValue: _subscription,
      };
      this.subscription = _subscription;
      this.triggerHandlerInUser('subscription', params);
    },
    getFace: function () {
      return this.face;
    },
    setFace: function (_face) {
      var params = {
        friend: this,
        oldValue: this.face,
        newValue: _face,
      };
      this.face = _face;
      this.triggerHandlerInUser('face', params);
    },
    getVcard: function () {
      return this.vcard;
    },
    setVcard: function (_vcard) {
      var params = {
        oldValue: this.vcard,
        newValue: _vcard,
      };
      this.vcard = _vcard;
      this.triggerHandlerInUser('vcard', params);
    },


    getState: function () {
      return this.state;
    },
    setState: function (_state) {
      var params = {
        friend: this,
        oldValue: this.state,
        newValue: _state,
      };
      this.state = _state;
      this.triggerHandlerInUser('state', params);
    },
    getPres: function () {
      return this.pres;
    },
    setPres: function (_pres) {
      var params = {
        oldValue: this.pres,
        newValue: _pres,
      };
      this.pres = _pres;
      this.triggerHandlerInUser('pres', params);
    },
    addPres: function (_pres) {
      var params = {
        oldValue: this.pres,
        addValue: _pres,
      };
      this.pres.push(_pres);
      this.triggerHandlerInUser('addPres', params);
    },
    getBlinkInterval: function () {
      return this.blinkInterval;
    },
    setBlinkInterval: function (_blinkInterval) {
      var params = {
        oldValue: this.blinkInterval,
        newValue: _blinkInterval,
      };
      this.blinkInterval = _blinkInterval;
      this.triggerHandlerInUser('blinkInterval', params);
    },
    getResource: function () {
      return this.resource;
    },
    setResource: function (_resource) {
      var params = {
        oldValue: this.resource,
        newValue: _resource,
      };
      this.resource = _resource;
      this.triggerHandlerInUser('resource', params);
    },


    /**
     * 判断是不是自己的纯jid
     * @param jid
     * @returns {Boolean}
     */
    isMyBareJid: function (jid) {
      if (this.jid == XoW.utils.getBareJidFromJid(jid)) {
        return true;
      }
      return false;
    },
    getFullJid: function () {
      // if(null == this.resource || '' == this.resource) {}
      return this.jid + "/" + this.resource;
    },

    /**public
     * 在属性上添加handler
     * @param proName 监听的属性，以XoW.UserModelEnum中定义作为参数
     * @param callback 回调函数，该属性改变时触发的回调
     */
//	addHandler : function(proName, callback) {
//		var _handler = {
//			id : XoW.utils.getUniqueId("friHandler"), // 这个handler的id，用于后面dele用的
//			listenPropery : proName, // 监听的属性名
//			cb : callback // 回调函数
//		};
//		
//		this.handlers.push(_handler); // 加入处理器数组中
//		return _handler.id; // 返回该处理器id
//	},
    /**public
     * 在属性上移除handler
     * @param id handler的id。
     * 感觉一般都有没有用到
     */
//	deleteHandler : function(id) {
//		for (var i = 0; i < this.handlers.length; i++) {
//            var _handler = this.handlers[i];
//            if(_handler.id == id) {
//            	var index = this.handlers.indexOf(_handler);
//                if (index >= 0) {
//                	this.handlers.splice(index, 1);
//                }
//            	break;
//            };
//		};
//	},
    /**public
     * 属性改变触发回调
     * @param proName 改变的属性的名称
     */
//	propertyChanged : function(proName) {
//		for (var i = 0; i < this.handlers.length; i++) {
//            var _handler = this.handlers[i];
//            if(_handler.listenPropery ==  proName) {
//        	    _handler.cb(this.jid);
//            };
//		};
//	},
    /**public
     * toStringAll方法显示信息
     */
    toStringAll: function () {
      var str = "属性值[jid : " + this.jid + "  , name : " + this.name
        + "  , group : " + this.group + "  , ask : " + this.ask
        + "  , subscription : " + this.subscription
        + "  , state : " + this.state
        + "  , blinkInterval : " + this.blinkInterval
        + "  , resource : " + this.resource + "  ]";
      return str;
    },
  };


  /**
   * 用户对象可监听属性枚举
   */
//XoW.UserModelEnum = {
//	JID : "jid",
//	NAME : "name",
//	GROUP : "group", //
//	ASK : "ask", //
//	SUBSCRIPTION : "subscription", //
//	FACE : "face", //
//	VCARD : "vcard",
//	STATE : "state",
//	PRES : "pres",
//	BLINKINTERVAL : "blinkInterval",
//	RESOURCE : "resource" 
//};

//好友列表可监听属性枚举
  XoW.UserGroupModelEnum = {
    GROUPID: "groupId",
    NAME: "name",
    CURRENTNUMS: "currentNums",
    TOTALNUMS: "totalNums",
    ITEM: "item",
    BLINKINTERVAL: "blinkInterval"
  },
  /**
   * 界面好友列表中显示的好友分组
   * 有这个的是，如果直接使用FriendManager中所有好友的数据，在
   * 页面将要显示的好友列表的时候，程序就必须进行分组判断，该
   * 组人数，在线人数等等的计算以及判断，比较麻烦，这算是向页面
   * 妥协，但是仔细一想，即使我使用的不是layim这个页面，按照spark
   * 的显示好友列表的样子来看，建一个UserListModel也是有道理的。
   *
   * @param params 参数
   *
   */
    XoW.UserList = function (params) {
      this.listId = params.listId || ""; // 和friend一样，这个id不能变
      this.name = params.name || ""; // 分组名
      this.currentNums = 0; // 当前人数
      this.totalNums = 0; // 总人数
      this.item = []; // 好友
      // 闪烁的interval，在页面中，指示是否闪烁以及intever的句柄
      this.blinkInterval = "";

      // this.handlers = [];


      this.classInfo = "【UserList】";
      this.handler = null;
      this._init();
    };

  XoW.UserList.prototype = {

    _init: function () {
      XoW.logger.ms(this.classInfo + "_init");

      this.handler = new XoW.Handler();

      XoW.logger.me(this.classInfo + "_init");
    },
    /**
     * 回调与触发。
     * @param proName
     * @param callback
     */
    addHandlerToUserList: function (proName, callback) {
      XoW.logger.ms(this.classInfo + "addHandlerToUserList()");
      XoW.logger.d(this.classInfo + "添加了一个监听，监听属性： " + proName);
      this.handler.addHandler(proName, callback);
      XoW.logger.me(this.classInfo + "addHandlerToUserList()");
    },
    deleteHandlerInUserList: function (id) {
      XoW.logger.ms(this.classInfo + "deleteHandlerInUserList()");
      this.handler.deleteHandler(id);
      XoW.logger.me(this.classInfo + "deleteHandlerInUserList()");
    },
    triggerHandlerInUserList: function (proName, params) {
      XoW.logger.ms(this.classInfo + "triggerHandlerInUserList()");
      XoW.logger.d(this.classInfo + "触发的属性是： " + proName);
      this.handler.triggerHandler(proName, params);
      XoW.logger.me(this.classInfo + "triggerHandlerInUserList()");
    },
    getListId: function () {
      return this.listId;
    },
    setListId: function (_listId) {
      var params = {
        oldValue: this.listId,
        newValue: _listId,
      };
      this.listId = _listId;
      this.triggerHandlerInUserList('listId', params);
      //this.propertyChanged(XoW.UserGroupModelEnum.GROUPID);
    },
    getName: function () {
      return this.name;
    },
    setName: function (_name) {
      XoW.logger.ms(this.classInfo + "setName");
      var params = {
        oldValue: this.name,
        newValue: _name,
        friendList: this,
      };
      this.name = _name;
      this.triggerHandlerInUserList('name', params);
      XoW.logger.me(this.classInfo + "setName");
    },
    getCurrentNums: function () {
      // 不是用currentNums而使用这种方式，是因为这种方式比较准
      var cn = 0; // 当前人数
      for (var i = 0; i < this.item.length; i++) {
        // 当有一个人不是在线状态时，进行++
        if (XoW.UserStateEnum.OFFLINE != this.item[i].getState()) {
          cn++;
        }
      }
      return cn;
    },
    setCurrentNums: function (_currentNums) {
      var params = {
        friendList: this,
        oldValue: this.currentNums,
        newValue: _currentNums,
      };
      this.currentNums = _currentNums;
      this.triggerHandlerInUserList('currentNums', params);
    },
    getTotalNums: function () {
      // 这个使用 item.length 不是用totalNums，因为这个比较准。
      return this.item.length;
    },
    setTotalNums: function (_totalNums) {
      var params = {
        friendList: this,
        oldValue: this.totalNums,
        newValue: _totalNums,
      };
      this.totalNums = _totalNums;
      this.triggerHandlerInUserList('totalNums', params);
    },
    getItem: function () {
      return this.item;
    },
    setItem: function (_item) {
      var params = {
        friendList: this,
        oldValue: this.item,
        newValue: _item,
      };
      this.item = _item;
      this.triggerHandlerInUserList('item', params);
    },
    removeItem: function (_jid) {

      XoW.logger.ms(this.classInfo + "removeItem");
      XoW.logger.d(this.classInfo + "从分组中移除jid为" + _jid);
      var params = {
        oldValue: this.item,
        removeJid: _jid,
        friendList: this,
      };
      if (!this.contain(_jid)) {
        XoW.logger.i(this.classInfo + "如果该分组不存在该用户，不进行移除。");
        XoW.logger.me(this.classInfo + "removeItem");
        return;
      }
      for (var i = 0; i < this.item.length; i++) {
        if (this.item[i].jid == _jid) {
          this.item.splice(i, 1);
        }
      }
      this.triggerHandlerInUserList('removeItem', params);
      XoW.logger.me(this.classInfo + "removeItem");
    },
    addItem: function (_friend) {
      XoW.logger.ms(this.classInfo + "addItem");
      var params = {
        friendList: this,
        oldValue: this.item,
        addValue: _friend,
      };
      // 在加入好友的到分组的时候，给这个好友加上一个监听器，
      // 监听其state变化，以更新自己的currentNums
      if (this.contain(_friend.jid)) {
        // 如果该分组已经存在该用户，则不进行添加。
        XoW.logger.i(this.classInfo + "如果该分组已经存在该用户，不进行添加。");
        XoW.logger.me(this.classInfo + "addItem");
        return;
      }
      this.item.push(_friend);
      _friend.addHandlerToUser("state", this._friendStateChagneCb.bind(this));
      this.triggerHandlerInUserList('addItem', params);
      XoW.logger.me(this.classInfo + "addItem");
    },
    _friendStateChagneCb: function (params) {
      //var params = {
//				friend : this,
//				oldValue : this.state,
//				newValue : _state,
//			};
      var newState = params.newValue;
      var oldState = params.oldValue;
      if (newState == XoW.UserStateEnum.OFFLINE || oldState == XoW.UserStateEnum.OFFLINE) {
        // 说明某个好友刚刚上线了或者下线了，那么要去改变当前在线人数
        // this.setTotalNums(this.getTotalNums);
        this.setCurrentNums(this.getCurrentNums());
      }
      return true;
    },
    /*
     removeItem : function(jid) {
     XoW.logger.ms(this.classInfo + "removeItem");
     for(var i = 0; i < this.item.length; i++) {
     if(this.item[i].jid == jid) {
     XoW.logger.ms(this.classInfo + "removeItem 包含该用户，进行移除：" + jid);
     var params = {
     removeJid : jid,
     friendList : this,
     };
     // 删除
     this.item.splice(i, 1);
     // 触发回调
     this.triggerHandlerInUserList('removeItem', params);
     // 这里考虑到的一个问题是
     // 如果我移除了该好友，如何移除我添加在该好友身上的监听器，或者说加在这个好友身上的监听会一同消失？
     // 如果没有消失，该如何移除？
     // 是不是在每次监听好友属性触发回调时，判断一下该好友在不在自己的列表中，
     // 如果在，则进行下一步操作。
     // 如果不在，return false将该监听器移除。
     }
     }
     XoW.logger.me(this.classInfo + "removeItem");
     },

     */

    getBlinkInterval: function () {
      return this.blinkInterval;
    },
    setBlinkInterval: function (_blinkInterval) {
      var params = {
        oldValue: this.blinkInterval,
        newValue: _blinkInterval,
      };
      this.blinkInterval = _blinkInterval;
      this.triggerHandlerInUserList('blinkInterval', params);
    },
    getItemCount: function () {
      return this.item.length;
    },
    /**public
     * 根据JID判断该分组中是否包含该好友
     * @param jid 要求是纯jid
     */
    contain: function (jid) {
      XoW.logger.ms(this.classInfo + "contain");

      for (var i = 0; i < this.item.length; i++) {
        if (jid == this.item[i].getJid()) {
          XoW.logger.d(this.classInfo + "找到了");
          XoW.logger.me(this.classInfo + "contain");
          return true;
        }
      }
      XoW.logger.d(this.classInfo + "没找到");
      XoW.logger.me(this.classInfo + "contain");
      return false;
    },

    line____________________: function () {

    },

    /**public
     *
     * 根据Jid得到该分组中的好友
     * @param jid 要求要是纯jid，我UserModel里面存的也是纯jid
     */
    getFriendByJid: function (jid) {
      if (jid == null || jid == "") {
        return null;
      }
      for (var i = 0; i < this.item.length; i++) {
        if (this.item[i].getJid() == jid) {
          return this.item[i];
        }
      }
      // 遍历完了不存在该好友
      return null;
    },


    /**public
     * 可能有用户下线了或者上线了，刷新一下在线人数。
     * 改变当前在线人数，此处通过计算在这个分组里面，所有好友的状态
     * 不为离线的，则算在线，因为如果用下线一个人-1，上线一个人+1的话，
     * 这样算，容易多线程问题。
     *
     */
    refreshCurrentNums: function (jid) {
      XoW.logger.ms(this.classInfo + "refreshCurrentNums()");

      if (this.contain(jid)) {

        var cn = 0; // 当前人数
        for (var i = 0; i < this.item.length; i++) {
          // 当有一个人不是在线状态时，进行++
          if (XoW.UserStateEnum.OFFLINE != this.item[i].getState()) {
            cn++;
          }
        }
        XoW.logger.d(this.classInfo + "新的在线人数：" + cn);
        this.setCurrentNums(cn); // 调用set方法，会触发监听currentNums属性的回调

      }
      XoW.logger.me(this.classInfo + "refreshCurrentNums()");
    },
    /**public
     * toStringAll方法显示信息
     */
    toStringAll: function () {
      var groupStr = "[group ] "
        + " id = " + this.id + ", name = " + this.name
        + " currentNums = " + this.currentNums + ", totalNums = " + this.totalNums;
      var friendStr = "[friend ]";
      for (var i = 0; i < this.item.length; i++) {
        friendStr += " ( " + this.item[i].toStringAll() + " )";
      }
      return groupStr + friendStr;
    },
//	
//	/**public
//	 * 添加
//	 */
//	addHandler : function(proName, callback) {
//		var _handler = {
//			id : XoW.utils.getUniqueId("friGroupHandler"), // 这个handler的id，用于后面dele用的
//			listenPropery : proName, // 监听的属性名
//			cb : callback // 回调函数
//		};
//		
//		this.handlers.push(_handler); // 加入处理器数组中
//		return _handler.id; // 返回该处理器id
//	},
//	/**public
//	 * 删除
//	 */
//	deleteHandler : function(id) {
//		for (var i = 0; i < this.handlers.length; i++) {
//            var _handler = this.handlers[i];
//            if(_handler.id == id) {
//            	var index = this.handlers.indexOf(_handler);
//                if (index >= 0) {
//                    this.handlers.splice(index, 1);
//                }
//            	break;
//            };
//		};
//	},
//	/**
//	 * 触发
//	 */
//	propertyChanged : function(proName) {
//		XoW.logger.ms(this.classInfo + "propertyChanged()" + proName);
//		
//		 for (var j = 0; j < this.handlers.length; j++) {
//            var _handler = this.handlers[j];
//            if(_handler.listenPropery ==  proName) {
//            	XoW.logger.d(this.classInfo + "触发的监听属性为" + proName );
//            	_handler.cb(this.groupId); // 该分组的ID
//            };
//		 };
//		 
//		 XoW.logger.me(this.classInfo + "propertyChanged()");
//	},
  };

// 对于message 不再建模？
// 这个Message类用来承载： message, headline, normal
// groupchat另外的类来
// error暂时未知是什么情况

//消息内容类型
  XoW.MessageContentType = {
    MSG: "msg", // 普通消息
    DELAYMSG: "delaymsg", // 延迟消息
    ACTIVE: 'active', // 聊天状态信息
    GONE: "gone",
    INACTIVE: 'inactive',
    COMPOSING: 'composing',
    PAUSED: 'paused'
  },
//消息类型
    XoW.MessageType = {
      NORMAL: "normal", // 缺省值，该消息是一个在一对一聊天会话或群聊上下文之外的被发送的独立消息
      CHAT: "chat", // 一对一聊天
      GROUPCHAT: "groupchat", // 聊天室
      HEADLINE: "headline", // 通知，不期望回复
      ERROR: "error" // 错误
    },

    XoW.Chat = function (chatManager, to) {
      this.to = to;
      this.threadId = "";
      this.chatManager = chatManager;

      // 所有消息，包括文件，普通消息
      this.allMessage = [];

      this.classInfo = "【ChatModel】";
      // this.handlers = []; // 属性监听器

      // 可以监听
      // 1，allMessage
      // 2, addMessage
      // 3,threadId
      this.handler = null;
      this._init();

    };
  XoW.Chat.prototype = {
    _init: function () {
      XoW.logger.ms(this.classInfo + "_init");

      this.handler = new XoW.Handler();

      XoW.logger.me(this.classInfo + "_init");
    },

    /**
     * 回调与触发。
     * @param proName
     * @param callback
     */
    addHandlerToChat: function (proName, callback) {
      XoW.logger.ms(this.classInfo + "addHandlerToChat()");
      XoW.logger.d(this.classInfo + "添加了一个监听，监听属性： " + proName);
      this.handler.addHandler(proName, callback);
      XoW.logger.me(this.classInfo + "addHandlerToChat()");
    },
    deleteHandlerInChat: function (id) {
      XoW.logger.ms(this.classInfo + "deleteHandlerInChat()");
      this.handler.deleteHandler(id);
      XoW.logger.me(this.classInfo + "deleteHandlerInChat()");
    },
    triggerHandlerInChat: function (proName, params) {
      XoW.logger.ms(this.classInfo + "triggerHandlerInChat()");
      XoW.logger.d(this.classInfo + "触发的属性是： " + proName);
      this.handler.triggerHandler(proName, params);
      XoW.logger.me(this.classInfo + "triggerHandlerInChat()");
    },

    getThreadId: function () {
      return this.threadId;
    },
    setThreadId: function (_threadId) {
      var params = {
        oldValue: this.threadId,
        newValue: _threadId,
        chat: this,
      };
      this.threadId = _threadId;
      this.triggerHandlerInChat("threadId", params);
    },
    getAllMessage: function () {
      return this.allMessage;
    },
    setAllMessage: function (_allMessage) {
      var params = {
        oldValue: this.allMessage,
        newValue: _allMessage,
        chat: this,
      };
      this.allMessage = _allMessage;
      this.triggerHandlerInChat("allMessage", params);
    },
    addMessage: function (_message) {
      var params = {
        oldValue: this.allMessage,
        addValue: _message,
        chat: this,
      };
      this.allMessage.push(_message);
      this.triggerHandlerInChat("addMessage", params);
    },

    getUnreadCount: function () {
      var uc = 0;
      for (var i = 0; i < this.allMessage.length; i++) {
        if (!this.allMessage[i].isRead) {
          uc++;
        }
      }
      return uc;
    },

    sendMessage: function (sendMsg) {
      XoW.logger.ms(this.classInfo + "sendMessage()");
      //var lastMsg = this.getLastMessage();
      // if(lastMsg.getFrom() != this.getTo()) {
      // 如果是自己发的，即发送这不等于该接收者
      var msg = $msg({
        id: sendMsg.id,
        from: sendMsg.from,
        to: sendMsg.to,
        type: sendMsg.type
      }).c("body").t(sendMsg.body);
      this.chatManager.send(msg);
      XoW.logger.me(this.classInfo + "sendMessage()");
    },


    getFileById: function (id) {
      XoW.logger.ms(this.classInfo + "getFileById()");
      for (var i = 0; i < this.allMessage.length; i++) {
        var msg = this.allMessage[i];
        if (msg instanceof XoW.FileModel) {
          if (id == msg.getId()) {
            XoW.logger.me(this.classInfo + "getFileById()");
            return msg;
          }
        }
      }
      XoW.logger.w(this.classInfo + "未找到该文件");
      XoW.logger.me(this.classInfo + "getFileById()");
      return null;
    },

    getFileBySid: function (sid) {
      XoW.logger.ms(this.classInfo + "getFileBySid()");
      for (var i = 0; i < this.allMessage.length; i++) {
        var msg = this.allMessage[i];
        if ('file' == msg.type) {
          if (sid == msg.sid) {
            XoW.logger.me(this.classInfo + "getFileBySid()");
            return msg;
          }
        }
      }
      XoW.logger.w(this.classInfo + "未找到该文件");
      XoW.logger.me(this.classInfo + "getFileBySid()");
      return null;
    },

    line______________: function () {

    },


    /**
     * 获得最后一条消息
     */
    getLastMessage: function () {
      if (this.allMessage != 0) {
        return this.allMessage[this.allMessage.length - 1];
      } else {
        return null;
      }
    },


    /**
     * 获得
     */
//	XoW.MessageContentType = {
//		MSG : "msg", // 普通消息
//		DELAYMSG : "delaymsg", // 延迟消息
//		ACTIVE : 'active', // 聊天状态信息
//		GONE : "gone",
//		INACTIVE : 'inactive',
//		COMPOSING : 'composing',
//		PAUSED : 'paused'
//	},
    getUnreadMsgCount: function () {
      XoW.logger.ms(this.classInfo + "getUnreadMsgCount()");
      var count = 0;

      for (var i = 0; i < this.allMessage.length; i++) {
        var msg = this.allMessage[i];
        if (msg instanceof XoW.MessageModel) {
          // isRead属性为false表示未读
          if (!msg.getIsRead()) {
            // 并且类型是msg
            if (XoW.MessageContentType.MSG == msg.getContentType()) {
              count++;
            }
            ;
          }
          ;
        }
        ;
        // 这里后面还要判断文件是否已读
      }
      XoW.logger.d(this.classInfo + "未读MSG数量" + count);
      XoW.logger.me(this.classInfo + "getUnreadMsgCount()");
      return count;
    },

    getUnreadDelayMsgCount: function () {
      XoW.logger.ms(this.classInfo + "getUnreadDelayMsgCount()");
      var count = 0;
      for (var i = 0; i < this.allMessage.length; i++) {
        var msg = this.allMessage[i];
        if (msg instanceof XoW.MessageModel) {
          // isRead属性为false表示未读
          if (!msg.getIsRead()) {
            // 并且类型是msg
            if (XoW.MessageContentType.DELAYMSG == msg.getContentType()) {
              count++;
            }
          }
        }
        // 这里后面还要判断文件是否已读
      }
      XoW.logger.d(this.classInfo + "未读DELAYMSG数量" + count);
      XoW.logger.me(this.classInfo + "getUnreadDelayMsgCount()");
      return count;
    },
    getUnreadFileCount: function () {
      XoW.logger.ms(this.classInfo + "getUnreadFileCount()");
      var count = 0;
      for (var i = 0; i < this.allMessage.length; i++) {
        var msg = this.allMessage[i];
        if (msg instanceof XoW.FileModel) {
          // isRead属性为false表示未读
          if (!msg.getIsRead()) {
            count++;
          }
        }
        // 这里后面还要判断文件是否已读
      }
      XoW.logger.d(this.classInfo + "未读文件数量" + count);
      XoW.logger.me(this.classInfo + "getUnreadFileCount()");
      return count;
    },


    /**
     * 获得未读消息的数量，包括msg,delaymsg,fileMsg 。 不包括chatstate那些
     */
    getUnReadCount: function () {
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
    },
  };


// 未操作之前是 unreceive
// 拒接接受就是 denyReceive 
// open之后就是 receiving
// close 之后就是 receive
  XoW.FileReceiveState = {
    UNRECEIVE: "unreceive", 	// 未接受  before open
    RECEIVE: "receive", 	// 已接受 after close
    DENYRECEIVE: "denyReceive",// 已拒绝接受
    OPEN: "open", 		// 同意接收，但是还未正式开始接收数据
    RECEIVING: "receiving", 	// 接收中 data
    MESTOP: "meStop", 	// 对方发送，则自己终止接收文件，自己发送，则自己终止发送文件
    NOMESTOP: 'noMeStop',   // 对方发送，则对方终止发送文件，自己发送，则对方终止接收文件
    //FRIENDSTOP : "friendStop",  // 对方发送，则对方终止发送文件，自己发送，则对方终止接收文件
    ERROR: "error", 		// 未知错误，各种错误= =
  };


  /**
   * IBB带内文件传输的model
   */
  XoW.File = function () {
    this.id = "";
    this.from = "";
    this.to = "";
    this.sid = "";
    this.filename = "";
    this.size = "";
    this.mime = "";
    this.data = "";
    this.isRead = false;
    this.receiveState = XoW.FileReceiveState.UNRECEIVE; // 默认未接受
    //this.savePath = ""; // 保存路径，感觉是找不到的。。
    this.receiveCb = null; // 接收文件的回调
    this.type = 'file'; // 类型，缺省值normal
    this.contentType = 'file'; // 内容类型 file
    this.time = ""; // 时间
    this.seq = -1; // 默认-1，每次收到一个data时，只要seq + 1 == data 那么就说明seq是对的。
    this.blocksize = 4096; // 块大小默认4096
    // 要加入已读等等信息，改的时候记住啊 16.12.16
    this.classInfo = "【FileModel】";

    // 可监听的属性
    // 1,receiveState
    this.handler = null;
    this._init();
  };
  XoW.File.prototype = {

    _init: function () {
      XoW.logger.ms(this.classInfo + "_init");
      this.handler = new XoW.Handler();

      XoW.logger.me(this.classInfo + "_init");
    },
    addData: function (_data) {
      this.data += _data;
    },
    /**
     * 回调与触发。
     * @param proName
     * @param callback
     */
    addHandlerToFile: function (proName, callback) {
      XoW.logger.ms(this.classInfo + "addHandlerToFile()");
      XoW.logger.d(this.classInfo + "添加了一个监听，监听属性： " + proName);
      this.handler.addHandler(proName, callback);
      XoW.logger.me(this.classInfo + "addHandlerToFile()");
    },
    deleteHandlerInFile: function (id) {
      XoW.logger.ms(this.classInfo + "deleteHandlerInFile()");
      this.handler.deleteHandler(id);
      XoW.logger.me(this.classInfo + "deleteHandlerInFile()");
    },
    triggerHandlerInFile: function (proName, params) {
      XoW.logger.ms(this.classInfo + "triggerHandlerInFile()");
      XoW.logger.d(this.classInfo + "触发的属性是： " + proName);
      this.handler.triggerHandler(proName, params);
      XoW.logger.me(this.classInfo + "triggerHandlerInFile()");
    },
    setReceiveState: function (_receiveState) {
      var params = {
        oldValue: this.receiveState,
        newValue: _receiveState,
        file: this,
      };
      this.receiveState = _receiveState;
      this.triggerHandlerInFile('receiveState', params);
    },

    toStringAll: function () {
      var str = "【属性值】"
        + "[ id : " + this.id + " ]"
        + "[ to : " + this.to + " ]"
        + "[ from : " + this.from + " ]"
        + "[ sid : " + this.sid + " ]"
        + "[ filename : " + this.filename + " ]"
        + "[ size : " + this.size + " ]"
        + "[ mime : " + this.mime + " ]"
        + "[ isRead : " + this.isRead + " ]"
        + "[ receiveState : " + this.receiveState + " ]"
        + "[ savePath : " + this.savePath + " ]"
        + "[ type : " + this.type + " ]"
        + "[ time : " + this.time + " ]"
        + "[ seq : " + this.seq + " ]"
        + "[ blocksize : " + this.blocksize + " ]";
      return str;
    },

    /**
     * 因为文件接收/发送状态，是不可逆的，比如当文件的状态为 receive(已接收)，那么它就不能
     * 返回 receiving（接收中）状态。
     * unreceive -> open,denyreceive（finanl）,ERROR（final）
     * open -> nomestop（final）, receiving, mestop（final）,ERROR（final）
     * receiving -> nomestop(final), receive(final), mestop(final),ERROR（final）
     * @param newState
     * return boolean 如果可以切换状态，return true ，否则false
     */
    changeReceiveState: function (newState) {
      XoW.logger.ms(this.classInfo + "changeReceiveState()");
      XoW.logger.p({"oldState": this.receiveState, "newState": newState});
      var flag = false;
      if (newState == this.receiveState) {
        // 如果新旧状态一致直接返回。true
        // 传进来的是处于final的状态，也会是true
        flag = true;
      } else if (XoW.FileReceiveState.UNRECEIVE == this.receiveState) {
        if (XoW.FileReceiveState.OPEN == newState
          || XoW.FileReceiveState.DENYRECEIVE == newState
          || XoW.FileReceiveState.ERROR == newState) {
          flag = true;
        }
      } else if (XoW.FileReceiveState.OPEN == this.receiveState) {
        if (XoW.FileReceiveState.NOMESTOP == newState
          || XoW.FileReceiveState.MESTOP == newState
          || XoW.FileReceiveState.ERROR == newState
          || XoW.FileReceiveState.RECEIVING == newState) {
          flag = true;
        }
      } else if (XoW.FileReceiveState.RECEIVING == this.receiveState) {
        if (XoW.FileReceiveState.NOMESTOP == newState
          || XoW.FileReceiveState.MESTOP == newState
          || XoW.FileReceiveState.ERROR == newState
          || XoW.FileReceiveState.RECEIVE == newState) {
          flag = true;
        }
      }
      if (flag) {
        XoW.logger.me(this.classInfo + "changeReceiveState() 新状态" + this.receiveState);
        this.setReceiveState(newState);
      } else {
        XoW.logger.me(this.classInfo + "changeReceiveState() 没有更新到新状态");
      }
      return flag;
    },
  };


//Room我这边用来显示一些配置信息的，这个在XmppRoom中没有，如当前人数等信息 
//XmppRoom 这个就是其中有个roster{}，保存了所有在这个房间的人，这个对我也有用。
//获取所有的XmppRoom的方法是： .getStropheConnection().muc.rooms;
  XoW.Room = function () {
    this.jid = "";
    this.name = "";
    // this.roomConfig = null; // RoomConfig对象
    // 从RoomConfig中取出的配置，因为如果要多次使用的话，不能一直去执行parse操作。
    // 每次取config的时候，都先判断一个config是不是为空，是的话就调用roomConfig的parse方法。
    this.config = null;
    this.occupants = 0;
  };
  XoW.Room.prototype = {


    getConfig: function () {
      return this.config;
    },
    setConfig: function (_config) {
      this.config = _config;
      // this.propertyChanged(XoW.FileModelEnum.CONFIG);
    },


    // feature 判断是否包含某一中类型
    isIncludeRoomType: function (type) {
      for (var i = 0; i < this.config.features.length; i++) {
        var feature = this.config.features[i];
        if (type == feature) {
          return true;
        }
      }
      return false;
    },
    isPublic: function () {
      return this.isIncludeRoomType('muc_public');
    },
    isOpen: function () {
      return this.isIncludeRoomType('muc_open');
    },
    isUnmoderated: function () {
      return this.isIncludeRoomType('muc_unmoderated');
    },
    isNonanonymous: function () {
      return this.isIncludeRoomType('muc_nonanonymous');
    },
    isUnsecured: function () {
      return this.isIncludeRoomType('muc_unsecured');
    },
    isPersistent: function () {
      return this.isIncludeRoomType('muc_persistent');
    },


    // identity
    getName: function () {
      return this.config.identities[0].name;
    },
    getType: function () {
      return this.config.identities[0].type;
    },
    getCategory: function () {
      return this.config.identities[0].category;
    },
    // x 我现在已经假设了，0就是描述，1就是主题了，没有再做判断
    getDescription: function () {
      return this.config.x[0].value;
    },
    getSubject: function () {
      return this.config.x[1].value;
    },
    getOccupants: function () {
      return this.config.x[2].value;
    },
    getCreationdate: function () {
      return this.config.x[3].value;
    },


    /**
     * 得到配置
     */
    parseConfig: function () {
      XoW.logger.ms(this.classInfo + "parseConfig");
      var baseInfo = {
        'jid': this.jid,
        'name': this.config.identities[0].name,
        'type': this.config.identities[0].type,
        'category': this.config.identities[0].category,
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
      for (var i = 0; i < this.config.features.length; i++) {
        var feature = this.config.features[i];
        XoW.logger.w("房间类型 " + feature);
        if (feature.indexOf('muc_') === 0) {
          XoW.logger.w("进来了房间类型 " + feature);
          roomInfo.push(feature);
        }
      }
      XoW.logger.me(this.classInfo + "parseConfig");
      return {
        'baseInfo': baseInfo,
        'xInfo': xInfo,
        'roomInfo': roomInfo
      };
    },
  };


  XoW.RoomPresence = function () {
    this.room;
    this.type; // error,unavailable,join,changeNick
    this.errorCode;
    this.message;
  };
  XoW.RoomPresence.prototype = {};

  return XoW;
}));
