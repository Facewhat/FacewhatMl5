
(function(factory) {
	return factory(XoW);
}(function(XoW) {
	"user strict"

	
/**
 * UserManager创建之前
 * 		RosterManager要存在
 */
XoW.UserManager = function(globalManager) {
	this._gblMgr = globalManager;
	
	this._friendListChangeHandlers = [];
	this.handlers = []; 
	// 如果新增了一个好友，那么他的属性上是没有任何触发器的。
	// 因为所有的触发器都是在新建该用户的时候放上去的。
	// 所以在这里有个  friendHandler，来存放所有的好友都需要有的handler
	// 如果新增了一个好友,就把这些handler加到他的身上。
	this._allFriendHandlers = []; // 所有好友都有的handler 
	this._allFriendGroupHandlers = []; // 所有好友分组都有的handler
	
	this.userSerachAbility = null;
	
	
	this.friends = []; // 所有的好友
	this.friendLists = []; // 保存好友分组的

	// 可监听的
	// friends 全部改变的时候
	// addFriend 增加一个好友的时候
	// friendLists 分组全部改变的时候
	// addFriendList 增加一个分组的时候
	// removeFriend 删除一个好友 
	this.handler = null;
	this.classInfo = "【UserManager】";
	this._rosterMgr = null;
	this._vcardMgr = null;
	this._presenceMgr = null;
	this._init();
};
XoW.UserManager.prototype = {
		
	getRosterMgr : function() {
		return this._rosterMgr;
	},
	getVcardMgr : function() {
		return this._vcardMgr;
	},
	getPresenceMgr : function() {
		return this._presenceMgr;
	},
		

	_init : function() {
		XoW.logger.ms(this.classInfo + "_init()");
		XoW.logger.d(this.classInfo + "初始化了XoW.UserManager");
		
		this.handler = new XoW.Handler();
		// roster管理
		this._rosterMgr = new XoW.RosterManager(this._gblMgr);
		// 新建vcard管理对象
		this._vcardMgr = new XoW.VcardManager(this._gblMgr);
		// 新建出席节管理对象
		this._presenceMgr = new XoW.PresenceManager(this._gblMgr);
		
		
		// friendLists监听好友的添加
		this.addHandlerToUserMgr('addFriend', this._friendIntoFriendListCb.bind(this));
		
		// friendLists监听好友的删除
		this.addHandlerToUserMgr('removeFriend', this._removeFriendFromFriendListCb.bind(this));
		

		
		// 监听好友列表的解析
		this._rosterMgr.addHandlerToRosterMgr('rosterSet', this._rosterSetCb.bind(this));
		// 监听rosterMgr的roster节
		//this._gblMgr.getRosterMgr().addHandlerToRoster('allRoster', this._roster_cb.bind(this));
		// 监听vcardMgr的vcard消息
		//this._gblMgr.getVcardMgr().addVcardHandler(this._vcard_cb.bind(this));
		// 监听presence的出席节
		//this._gblMgr.getPresenceMgr().addPresenceHandler(this._presence_cb.bind(this));
		
		
		// 好友列表改变了更新好友分组
		//x this.addFriendListChangeHandler(this._friendListToFriendGroupList.bind(this));
		
		
		XoW.logger.me(this.classInfo + "_init()");
	},
	
	// 将所有好友设置为离线状态
	setAllFriendsOffline : function() {
		for(var i = 0;  i < this.friends.length; i++) {
			this.friends[i].setState(5);
		}
	},
	getFriends : function(){ return this.friends; },
	setFriends : function(_friends){ 
		var params = {
			oldValue : this.friends,
			newValue : _friends,
		 };
		 this.friends = _friends;
		 this.triggerHandlerInUserMgr("friends", params);
	},
	addFriend : function(_friend) {
		XoW.logger.ms(this.classInfo + "addFriend");
		var params = {
			oldValue : this.friendList,
			addValue : _friend,
		};
		this.friends.push(_friend);
		this.triggerHandlerInUserMgr("addFriend", params);
		XoW.logger.me(this.classInfo + "addFriend");
	},
	removeFriend : function (jid) {
		XoW.logger.ms(this.classInfo + "removeFriend");
		var removeFriend = null;
		for(var i = 0; i < this.friends.length; i++) {
			if(this.friends[i].jid == jid) {
				removeFriend = this.friends[i];
				this.friends.splice(i, 1);
			}
		}
		var params = {
			removeValue : removeFriend,  
			removeJid : jid,
		};
		this.triggerHandlerInUserMgr("removeFriend", params);
		XoW.logger.me(this.classInfo + "removeFriend");
	},
	getFriendLists : function(){ return this.friendLists; },
	setFriendLists : function(_friendLists){ 
		XoW.logger.ms(this.classInfo + "setFriendLists");
		var params = {
			oldValue : this.friendLists,
			newValue : _friendLists,
		};
		this.friendLists = _friendLists; 
		this.triggerHandlerInUserMgr("friendLists", params);
		XoW.logger.me(this.classInfo + "setFriendLists");
	},
	addFriendList : function(_friendList) {
		XoW.logger.ms(this.classInfo + "addFriendList");
		var params = {
				oldValue : this.friendLists,
				addValue : _friendList,
		};
		this.friendLists.push(_friendList); 
		this.triggerHandlerInUserMgr("addFriendList", params);
		XoW.logger.me(this.classInfo + "addFriendList");
	},
	
	sendOnline : function() {
		XoW.logger.ms(this.classInfo + "sendOnline()");
		this._presenceMgr.sendOnline();
		XoW.logger.me(this.classInfo + "sendOnline()");
	},
	sendOnlineToRoom : function(roomJid) {
		XoW.logger.ms(this.classInfo + "sendOnlineToRoom()");
		this._presenceMgr.sendOnlineToRoom(roomJid);
		XoW.logger.me(this.classInfo + "sendOnlineToRoom()");
	},
	sendChat: function() {
		XoW.logger.ms(this.classInfo + "sendChat()");
		this._presenceMgr.sendChat();
		XoW.logger.me(this.classInfo + "sendChat()");
	},
	sendAway : function() {
		XoW.logger.ms(this.classInfo + "sendAway()");
		this._presenceMgr.sendAway();
		XoW.logger.me(this.classInfo + "sendAway()");
	},
	sendDnd : function() {
		XoW.logger.ms(this.classInfo + "sendDnd()");
		this._presenceMgr.sendDnd();
		XoW.logger.me(this.classInfo + "sendDnd()");
	},
	sendOffline1 : function() {
		XoW.logger.ms(this.classInfo + "sendOffline1()");
		this._presenceMgr.sendOffline1();
		XoW.logger.me(this.classInfo + "sendOffline1()");
	},
	
	getVcard : function(jid, successCb, errorCb, timeout) {
		XoW.logger.ms(this.classInfo + "getVcard()");
		this._vcardMgr.getVcard(jid, successCb, errorCb, timeout);
		XoW.logger.me(this.classInfo + "getVcard()");
	},
	
	/**
     * 回调与触发。
     * @param proName
     * @param callback
     */
    addHandlerToUserMgr : function(proName, callback) {
    	XoW.logger.ms(this.classInfo + "addHandlerToUserMgr()");
    	XoW.logger.d(this.classInfo + "添加了一个监听，监听属性： " + proName);
    	this.handler.addHandler(proName, callback);
    	XoW.logger.me(this.classInfo + "addHandlerToUserMgr()");
    },
    deleteHandlerInUserMgr : function(id) {
    	XoW.logger.ms(this.classInfo + "deleteHandlerInUserMgr()");
    	this.handler.deleteHandler(id);
    	XoW.logger.me(this.classInfo + "deleteHandlerInUserMgr()");
    },
    triggerHandlerInUserMgr : function(proName, params) {
    	XoW.logger.ms(this.classInfo + "triggerHandlerInUserMgr()");
    	XoW.logger.d(this.classInfo + "触发的属性是： " + proName);
    	this.handler.triggerHandler(proName, params);
    	XoW.logger.me(this.classInfo + "triggerHandlerInUserMgr()");
    },
    /**
	 * 根据 组的id，在组的列表里找到这个组，存在返回该组，不存在返回null
	 * @param groupName 组名
	 * @returns 该组或null
	 */
	getFriendListByListId: function(listId) {
		XoW.logger.ms(this.classInfo + "getFriendGroupByGroupId()");

		for(var i = 0; i < this.friendLists.length; i++) {
			if(this.friendLists[i].listId == listId) {
				return this.friendLists[i];
			} 
		}
		XoW.logger.me(this.classInfo + "getFriendGroupByGroupId()");
		return null;
	},
    /**
	 * 根据 组名，在组的列表里找到这个组，存在返回该组，不存在返回null
	 * @param groupName 组名
	 * @returns 该组或null
	 */
	getFriendListByName : function(name) {
		XoW.logger.ms(this.classInfo + "getFriendListByName()");
		
		if(null == name || "" == $.trim(name)) {
			XoW.logger.w(this.classInfo + "分组名无效");
			return null;
		}
		for(var i = 0; i < this.friendLists.length; i++) {
			if($.trim(this.friendLists[i].getName()) == $.trim(name)) {
				return this.friendLists[i];
			} 
		}
		XoW.logger.me(this.classInfo + "getFriendListByName()");
		return null;
	},
	
	/**
	 * 根据组名创建组，做些初始化，并将该组放到 组的列表中
	 * @param groupName  组名
	 * @returns 
	 */
	createFriendListByName : function(name) {
		XoW.logger.ms(this.classInfo + "createFriendListByName()");
		
		// 新建分组
		var list = new XoW.UserList({
			listId : XoW.utils.getUniqueId("friendList"),
			name : name,
		});
		// 分组放入分组列表中
		// this.friendList.push(list); // 存组中
		this.addFriendList(list);
		
		XoW.logger.me(this.classInfo + "createFriendListByName()");
		return list; 
	},
	
	/** 根据jid获得好友
	 * @param jid 要求为纯jid或全jid
	 * @returns
	 */
	getFriendByJid : function(jid) {
		XoW.logger.ms(this.classInfo + "getFriendByJid()");
		
		jid = XoW.utils.getBareJidFromJid(jid);
		for(var i = 0; i < this.friends.length; i++) {
			if(this.friends[i].getJid() == jid) {
				XoW.logger.d(this.classInfo + "取得好友" + this.friends[i].toStringAll());
				XoW.logger.me(this.classInfo + "getFriendByJid()");
				return this.friends[i];
			}
		}
		XoW.logger.w(this.classInfo + "不存在该好友，jid为 " + jid);
		XoW.logger.me(this.classInfo + "getFriendByJid()");
		// 遍历完了不存在该好友
		return null;
	},
	
	
	
	_removeFriendFromFriendListCb : function(params) {
//		var params = {
//				removeValue : removeFriend,
//				removeJid : jid,
//			};
		XoW.logger.ms(this.classInfo + "_removeFriendFromFriendListCb");
		for(var i = 0; i < this.friendLists.length; i++) {
			// 调用移除方法，是否移除由方法removeItem中判断
			this.friendLists[i].removeItem(params.removeJid);
//			for(var j = 0; j < fl.item.length; j++) {
//				var user = fl.item[j];
//				if(user.jid == jid) {
//					fl.item.splice(j, 1);
//					this.triggerHandlerInUserMgr('', params)
//				}
//			}
		}
		XoW.logger.me(this.classInfo + "_removeFriendFromFriendListCb");
		return true;
	}, 
	
	_friendGroupChangeToFriendListCb : function(params) {
		
		// 这个分组移动/复制的过程中，目标分组一定会存在的。
//		var params = {
//				oldValue : this.group,
//				newValue : _group,
//				user : this,
//		};
//		this.group = _group; 
		XoW.logger.ms(this.classInfo + "_friendGroupChangeToFriendListCb");
		
		var friendGroupList = params.newValue;
		var friend = params.user;
		
		if(friendGroupList.length == 0) {
			// 如果这个人没有在某个分组中，即没有 <it           em>中没有<group/>元素
			var group = this.getFriendListByName("未分组联系人");
			if(null == group) { // 如果取得的分组为空，说明还没有改分组，则创建该分组
				group = this.createFriendListByName("未分组联系人");
			} 
			// 将该好友放入该分组中。
			group.addItem(friend); 
		} else {
//			遍历所有存在的分组，
//			如果好友的分组包括循环到的这个分组，则进行加入，加入原则：先判断是否已经存在该用户了，存在则不添加。
//			如果好友的分组不包括循环到的这个分组，判断该分组中是否有该用户，存在则进行删除
			for(var i = 0; i < this.friendLists.length; i++) {
				var isInThisGroup = false;
				for(var j = 0; j < friendGroupList.length; j++) {
					if(this.friendLists[i].name == friendGroupList[j]) {
						// 改好友在这个分组中
						isInThisGroup = true;
						break;
					}
				}
				if(isInThisGroup) {
					// 在这个分组中。addItem会判断这个好友是否在这个分组中
					// 不存在才添加。
					this.friendLists[i].addItem(friend); 
				} else {
					// 不在这个分组中，removeItem中会自己判断是否这个好友在这个
					// 分组中，有才删除
					this.friendLists[i].removeItem(friend.jid); 
				}
			}
		}
	
		XoW.logger.me(this.classInfo + "_friendGroupChangeToFriendListCb");
		return true;
	},
	
	/**
	 * 对新增的用户进行操作，加入到，friendList。
	 * @param params
	 */
	_friendIntoFriendListCb : function(params) {
//		var params = {
//				oldValue : this.friendList,
//				addValue : _friend,
//			 };
		XoW.logger.ms(this.classInfo + "_friendIntoFriendListCb");
		
		
		XoW.logger.d(this.classInfo + "新增了一个用户" + params.addValue.toStringAll());
		
		var friend = params.addValue;
		// friendLists监听好友分组的setGroup方法
		friend.addHandlerToUser('group', this._friendGroupChangeToFriendListCb.bind(this));
		
		
		// 将该好友的根据分组房间不同的分组中
		var friendGroupList = friend.getGroup();
		if(friendGroupList.length == 0) {
			// 如果这个人没有在某个分组中，即没有 <it           em>中没有<group/>元素
			var group = this.getFriendListByName("未分组联系人");
			if(null == group) { // 如果取得的分组为空，说明还没有改分组，则创建该分组
				group = this.createFriendListByName("未分组联系人");
			} 
			// 将该好友放入该分组中。
			group.addItem(friend); 
		} else {
			for(var j = 0; j < friendGroupList.length; j++) {
				// 根据分组名去分组列表friendGroupList中取得分组。
				var group = this.getFriendListByName(friendGroupList[j]);
				if(null == group) { // 如果取得的分组为空，说明还没有改分组，则创建该分组
					group = this.createFriendListByName(friendGroupList[j]);
				} 
				// 此处是新增好友触发的，所以该分组之前并不会有该好友。
				// 将该好友放入该分组中。
				group.addItem(friend); 
			}
		}
		
		XoW.logger.me(this.classInfo + "_friendIntoFriendListCb");
		return true;
	},
	
	/**
	 * 添加好友的friendList
	 * @param user
	 */
	addFriendToFriendList : function(user) {
		// 1,请求vcard
		// 2,监听加了一个好友的行为，然后改变好友分组。使用 addFriend 会触发在监听friendList的人
		XoW.logger.ms(this.classInfo + "addFriendToFriendList");
		
		
		
		XoW.logger.me(this.classInfo + "addFriendToFriendList");
	},
	/**
	 * 根据指定的jid清空其所在的userGroup的blinkInterval
	 * 但是如果该friendGroup仍然有其他成员在闪烁，则不能清空
	 * 判断这个父元素下还有没有其他子元素在闪烁，如果有，则该父元素的闪烁不能停止，如果没有，则停止
	 */
	crearFriendListBlinkInterval : function(jid) {
		XoW.logger.ms(this.classInfo + "crearFriendListBlinkInterval()");
		for(var i = 0; i < this.friendLists.length; i++) {
			var oneFriendGroup = this.friendLists[i];
			if(oneFriendGroup.contain(jid)) {
				var stopFlag = true;
				// 如果该分组包含该好友
				// 如果子元素中还有在闪烁的，则不能停止
				for(var j = 0; j < oneFriendGroup.getItem().length; j++) {
					var friend = oneFriendGroup.getItem()[j];
					if("" != friend.getBlinkInterval()) {
						stopFlag = false;
					}
				}
				if(stopFlag) {
					clearInterval(oneFriendGroup.getBlinkInterval());
					oneFriendGroup.setBlinkInterval("");
				} 
			}
		}
		XoW.logger.me(this.classInfo + "crearFriendListBlinkInterval()");
	},
	
	
	getRoster : function(successCb, errorCb, timeout) {
		XoW.logger.ms(this.classInfo + "getRoster()");
		
		return this._rosterMgr.getRoster(function(stanza) {
			XoW.logger.d(this.classInfo + "获取好友列表成功，要进行解析");
			$roster = $(stanza);
			
			$('item', $roster).each(function(index, item) {
				var $item = $(item);
				var user = new XoW.User(this);
				user.jid = $item.attr('jid');
				user.name = $item.attr('name');
				user.subscription = $item.attr('subscription');
				user.ask = $item.attr("ask");
				user.state = XoW.UserStateEnum.OFFLINE; // 默认离线
				
				// 是在这里判断如果没有分组，则加入未分组联系人呢
				// 还是到时候在friendlist那边再进行操作？
				var $group = $('group', $item); 
				if($group.length > 0) {
					$group.each(function(index, groupItem) {
						user.addGroup($(groupItem).text());
					});
				} 
//				else {
//					user.addGroup("未分组联系人");
//				}
				// 请求vcard
				user.getVcardFromServer();
				// 加入好友列表中。加入好友列表中会触发监听器addFriend，
				this.addFriend(user); 
				XoW.logger.d(this.classInfo + user.toStringAll());
				
			}.bind(this));
			if(successCb) {
				successCb(stanza);
			}
			XoW.logger.me(this.classInfo + "getRoster()");
		}.bind(this), function(errorStanza) {
			XoW.logger.e(this.classInfo + "获取好友列表失败！" + errorStanza);
			if(errorCb) {
				errorCb(errorStanza);
			}
			XoW.logger.md(this.classInfo + "getRoster()");
		}.bind(this), timeout);
		
	},
	/**
	 * 得到所有的分组名
	 */
	getFriendListsNames : function() {
		var names = [];
		for(var i = 0; i < this.friendLists.length; i++) {
			names.push(this.friendLists[i].name);
		}
		return names;
	},
	
	/**
	 * 获得指定jid可以移动到的分组
	 * @param jid
	 */
	getFriendListsNamesCanMoveOrCopyTo : function(jid) {
		XoW.logger.ms(this.classInfo + "getFriendListsNamesCanMoveOrCopyTo:" + jid);
		var friendListsNames = [];
		for(var i = 0; i < this.friendLists.length; i++) {
			if(!this.friendLists[i].contain(jid)) {
				friendListsNames.push(this.friendLists[i].name);
			}
		}
		XoW.logger.me(this.classInfo + "getFriendListsNamesCanMoveOrCopyTo:" + jid);
		return friendListsNames;
	},
	getFriendListsCanCopyTo : function() {
		
	},
	
	/**
	 * 拒绝好友申请
	 * @param jid
	 */
	denyFirendSubscribe : function(jid) {
		XoW.logger.ms(this.classInfo + "denyFirendSubscribe");
		// 发送拒绝
		this._presenceMgr.sendUnsubscribe(jid, this._gblMgr.getCurrentUser().getJid());
		// 发送remove
		// this._rosterMgr.setIQRosterRemove(jid);
		XoW.logger.me(this.classInfo + "denyFirendSubscribe");
	},
	
	aggreeFriendSubscribe : function(jid) {
		XoW.logger.ms(this.classInfo + "aggreeFriendSubscribe");
		this._presenceMgr.sendSubscribed(jid, this._gblMgr.getCurrentUser().getJid());
		XoW.logger.me(this.classInfo + "aggreeFriendSubscribe");
	},
	sendSubscribe : function (jid) {
		
		XoW.logger.ms(this.classInfo + "sendSubscribe");
		this._presenceMgr.sendSubscribe(jid, this._gblMgr.getCurrentUser().getJid());
		XoW.logger.me(this.classInfo + "sendSubscribe");
	},
	
	getNewUser : function(jid) {
		var user = new XoW.User(this);
		user.jid = jid;
		return user;
	},
	
	_rosterSetCb :function(params) {
//		var params = {
//			user : user,
//			stanza : stanza
//		};
//		this.triggerHandlerInRosterMgr('rosterSet', params);
		
		XoW.logger.ms(this.classInfo + "_rosterSetCb");
		var user = params.user;
		var thisUser = this.getFriendByJid(user.jid);
		
		switch(user.subscription) {
			case 'none' :
			case 'to' :
			case 'from' :
			case 'both' :
				// 如果该好友不存在，则新增其，如果存在，则更改其subscription
				if(null === thisUser) {
					XoW.logger.d(this.classInfo + "新增好友");
					user.getVcardFromServer();
					this.addFriend(user);
				} else {
					XoW.logger.ms(this.classInfo + "原来信息" + thisUser.toStringAll());
					XoW.logger.ms(this.classInfo + "新信息" + user.toStringAll());
					XoW.logger.d(this.classInfo + "更新好友状态");
					if(thisUser.subscription != user.subscription) {
						XoW.logger.d(this.classInfo + "订阅状态改变");
						// 订阅状态改变，无人监听
						thisUser.setSubscription(user.subscription);
					} 
					if(thisUser.ask != user.ask) {
						XoW.logger.d(this.classInfo + "订阅状态的处理状态改变");
						// 订阅状态的处理状态，无人监听
						thisUser.setAsk(user.ask);
					}
					//if(thisUser.name != user.name) {
					XoW.logger.d(this.classInfo + "昵称改变");
					// 昵称改变。界面监听。 
					thisUser.setName(user.name);
					//}
					XoW.logger.d(this.classInfo + "分组一定改变。。");
					thisUser.setGroup(user.group);
					
					/*if(thisUser.group.length != user.group.length) {
						// 分组长度不同，则分组改变
						thisUser.group = user.group;
						
					} else {
						// 分组长度相同，对分组内容进行比较。
						// 通常来说，分组个数都比较少。所以直接双层循环来比较
						var isSame = true;
						for(var i = 0; i < thisUser.group.length; i++) {
							var flag = false;
							for(var j = 0; j < user.group.length; j++) {
								if(thisUser.group[i] == user.group[j]) {
									// 如果遇到相同的，则flag=true并推出循环
									flag = true;
									break;
								}
							}
							if(!flag) {
								// 如果发现某次循环结束时flag = false，则说明该次循环的分组不同。
								isSame = false;
								break;
							}
						}
						if(!isSame) {
							
						}
					}*/
					
				}
				break;
			// 收到remove就将该好友从名单中移除。
			case 'remove' :
				// 删除好友。。。界面以及内存中删除该好友
				XoW.logger.d(this.classInfo + "删除好友");
				this.removeFriend(user.jid);
				break;
			default : 
				// 其他情况，忽略
				break;
		}
		
		XoW.logger.me(this.classInfo + "_rosterSetCb");
		return true;
	},
	
	
	/**
	 * 获得userSearch服务器的jid
	 * @returns
	 */
	getUserSerachServerName : function() {
		XoW.logger.ms(this.classInfo + "getUserSerachServerName");
		if(!this.userSerachAbility) {
			this.userSerachAbility = this._gblMgr.getServerMgr().getAbilityByCategroy('directory', 'user');
		}
		if(!this.userSerachAbility) {
			XoW.logger.d(this.classInfo + "没有找到该服务器");
			XoW.logger.me(this.classInfo + "");
			return null;
		} else {
			XoW.logger.me(this.classInfo + "getUserSerachServerName");
			return this.userSerachAbility.jid;
		}
	},
	
	/**
	 * 会返回name和jid相符的用户
	 * @param username
	 */
	searchUserFromFriends : function(username) {
		XoW.logger.ms(this.classInfo + "searchUserFromFriends");
		
		var items = [];
		// 本地用户？
		for(var i = 0; i < this.friends.length; i++) {
			var friend = this.friends[i];
			var jidNode = XoW.utils.getNodeFromJid(friend.jid);
			var name = friend.name != null ? friend.name : ''; 
			XoW.logger.p({name : name, jidNode : jidNode, username : username});
			if(-1 != name.indexOf(username) || -1 != jidNode.indexOf(username)) {
				items.push(friend);
			}
		}
		XoW.logger.me(this.classInfo + "searchUserFromFriends");
		return items;
	},
	
	/**
	 * 用户名，即用户 node@domain/resource 中的node
	 * 只会返回 jid与搜索相符的用户
	 * @param username
	 */
	searchUserFromServer : function(username, successCb, errorCb, timeout) {
		XoW.logger.ms(this.classInfo + "searchUserFromServer");
		
		
		var jid = this.getUserSerachServerName();
		if(!jid) {
			XoW.logger.i(this.classInfo + "没有用户搜索服务器，无法搜索");
			errorCb();
			return;
		}
//		var iq = $iq({ type : 'get',
//			from : this._gblMgr.getCurrentUser().getFullJid(),
//			to : jid,
//			id : XoW.utils.getUniqueId('serachServer'),
//		}).c("query", {xmlns : XoW.NS.USER_SERACH});
//		
//		this._gblMgr.getConnMgr().send(iq);
		
		var iq2 = $iq({type : 'set',
			id : XoW.utils.getUniqueId('searchUser'),
			to : jid,
		}).c('query', {xmlns : XoW.NS.USER_SERACH,
		}).c('x', {xmlns : XoW.NS.FORM_DATA,
			type : 'submit',
		}).c('field', {'var' : 'search'}).c('value').t('*' + username + '*').up().up()
		.c('field', {'var' : 'Username'}).c('value').t('1'); //.up().up()
		//.c('field', {'var' : 'Name'}).c('value').t('1').up().up()
		//.c('field', {'var' : 'Email'}).c('value').t('1'); // .up().up()
		
		this._gblMgr.getConnMgr().sendIQ(iq2, function(stanza) {
			$userSearch = $(stanza);
			
			var params = {
				stanza : stanza,
				items : [], // 全部符合条件的
				itemsExcludeMyFriend : [], // 不在我好友列表中的 -- 用这个
				itemsIsMyFriend : [], // 属于我好友列表中的
			};
			$('item', $userSearch).each(function(index, item) {
				var $item = $(item);
				var item = {
						username : $('field[var="Username"] value', $item).text(),
						jid : $('field[var="jid"] value', $item).text(),
				};
				if(!this.getFriendByJid(item.jid)) {
					// 如果自己的好友列表没有这个人了
					params.itemsExcludeMyFriend.push(item);
				}  else {
					params.itemsIsMyFriend.push(item);
				}
				params.items.push(item);
			}.bind(this));
			
			if(successCb) {
				successCb(params);
			}
		}.bind(this), errorCb, timeout);
		XoW.logger.me(this.classInfo + "searchUserFromServer");
	},
	
	line_______________________________________ : function() {
		
	},
	
	/**
	 * 向friendList中添加一个好友
	 */
	addNewFriendToFriendList : function(userModel) {
		XoW.logger.ms(this.classInfo + "addNewFriendToFriendList");
		// 添加监听器 
		for(var i = 0; i < this._allFriendHandlers.length; i++) {
			var h = this._allFriendHandlers[i];
			userModel.addHandler(h.proName, h.callback);
		};
		// 请求vcard
		this._gblMgr.getVcardMgr().sendIQVcard(userModel.jid);
		
		// 加入friendList
		this.friendList.push(userModel);
		// this._friendListChange();
		this.addOneFirendToFriendGroupList(userModel);
		
		// this.triggerHandler("addNewFriend", params)
		XoW.logger.me(this.classInfo + "addNewFriendToFriendList");
		
		
//		var _handler = {
//				'proName' : proName,
//				'callback' : callback
//			};
	},
	
	

	
	/**public
	 * 在属性上添加handler 
	 * @param proName 监听的属性，以XoW.UserModelEnum中定义作为参数
	 * @param callback 回调函数，该属性改变时触发的回调
	 */
	/*
	addHandler : function(proName, callback) {
		var _handler = {
			id : XoW.utils.getUniqueId("userMgrHandler"), // 这个handler的id，用于后面dele用的
			listenPropery : proName, // 监听的属性名
			cb : callback // 回调函数
		};
		
		this.handlers.push(_handler); // 加入处理器数组中
		return _handler.id; // 返回该处理器id
	},
	*/
	/**public
	 * 在属性上移除handler
	 * @param id handler的id。
	 * 感觉一般都有没有用到 
	 */
	/*
	deleteHandler : function(id) {
		for (var i = 0; i < this.handlers.length; i++) {
            var _handler = this.handlers[i];
            if(_handler.id == id) {
            	var index = this.handlers.indexOf(_handler);
                if (index >= 0) {
                	this.handlers.splice(index, 1);
                }
            	break;
            };
		};
	},
	*/
	/**public 
	 * 属性改变触发回调
	 * @param proName 改变的属性的名称
	 * @param params 调用回调传过去的参数
	 * 如果回调返回的不是true，则将该回调删除。
	 */
	/*
	triggerHandler : function(proName, params) {
		for (var i = 0; i < this.handlers.length; i++) {
            var _handler = this.handlers[i];
            if(_handler.listenPropery ==  proName) {
        	    if(!_handler.cb(params)) {
        	    	// 如果返回的不是true则将该触发器移除。
        	    	delete this.handlers[i];
        	    }
            };
		};
	},
	
	*/
	
	/**public
	 * 在UserManager中给friendList中的好友的属性添加监听
	 * @param jid 要求如果JID为NULL则表示给全部的好友添加该事件，
	 * @param proName表示需要添加事件的属性，必须指定，比如指定 name变化时的处理
	 * @param callback 回调函数
	 */
	addHandlerToOneFriend : function(jid, proName, callback) {
		XoW.logger.ms(this.classInfo + "addHandlerToOneFriend()");
		if(null != jid && "" == $.trim(jid)) {
			var fri = this.getFriendByJid(jid); // 要求是纯jid
			fri.addHandler(proName, callback);
		}
		XoW.logger.me(this.classInfo + "addHandlerToOneFriend()");
	},
	addHandlerToEveryFriend : function( proName, callback) {
		XoW.logger.ms(this.classInfo + "addHandlerToEveryFriend()");
		// 将这个handler保存起来
		var _handler = {
			'proName' : proName,
			'callback' : callback
		};
		this._allFriendHandlers.push(_handler);
		// 给全部好友加上这个handler
		for(var i = 0; i < this.friendList.length; i++) {
			this.friendList[i].addHandler(proName, callback);
		}
		XoW.logger.me(this.classInfo + "addHandlerToEveryFriend()");
	},
	/**
	 * addOne的感觉暂时用不到，先锁了，要用了需要修改
	 * @param groupId
	 * @param proName
	 * @param callback
	 */
/*	addHandlerToOneFriendGroup : function(groupId, proName, callback) {
		XoW.logger.ms(this.classInfo + "addHandlerToOneFriendGroup()");
		if(groupId != jid && "" == $.trim(groupId)) {
			var fri = this.getFriendByJid(jid); // 要求是纯jid
			fri.addHandler(proName, callback);
		}
		XoW.logger.me(this.classInfo + "addHandlerToOneFriendGroup()");
	},*/
	addHandlerToEveryFriendGroup : function(proName, callback) {
		XoW.logger.ms(this.classInfo + "addHandlerToEveryFriendGroup()");
		// 将这个handler保存起来
		var _handler = {
			'proName' : proName,
			'callback' : callback
		};
		this._allFriendGroupHandlers.push(_handler);
		// 给全部好友分组加上这个handler
		for(var i = 0; i < this.friendLists.length; i++) {
			this.friendLists[i].addHandler(proName, callback);
		}
		XoW.logger.me(this.classInfo + "addHandlerToEveryFriendGroup()");
	},
	/**
	 * 好友改变，触发handler
	 */
	_friendListChange : function() {
		XoW.logger.ms(this.classInfo + "_friendListChange()");
		// 重新刷新一下好友分组，先放这，也可以放在好友加载完那里，即roster_cb里面
		this._friendListToFriendGroupList(); 
		for (var i = 0; i < this._friendListChangeHandlers.length; i++) {
            var _handler = this._friendListChangeHandlers[i];
            _handler.cb();
		};
		XoW.logger.me(this.classInfo + "_friendListChange()");
	},
	 /**public
	 * 添加连接结果回调
	 * @param callback 回调函数
	 */
    addFriendListChangeHandler : function(callback) {
    	XoW.logger.ms(this.classInfo + "addFriendListChangeHandler()");
    	var _handler = {
			id : XoW.utils.getUniqueId("friendListChangeHandler"), // 这个handler的id，用于后面dele用的
			cb : callback // 回调函数
		};
    	this._friendListChangeHandlers.push(_handler); // 加入处理器数组中
    	XoW.logger.me(this.classInfo + "addFriendListChangeHandler()");
    	return _handler.id; // 返回该处理器id
    },
	/**public
	 * 删除指定处理器id的回调函数
	 */
	deleteFriendListChangeHandler : function(id) {
		XoW.logger.ms(this.classInfo + "deleteFriendListChangeHandler()");
		if(null == id || "" == id) {
			return;
		}
		for (var i = 0; i < this._friendListChangeHandlers.length; i++) {
            var _handler = this._friendListChangeHandlers[i];
            if(_handler.id == id) {
            	var index = this._friendListChangeHandlers.indexOf(_handler);
                if (index >= 0) {
                    this._friendListChangeHandlers.splice(index, 1);
                }
            	break;
            };
		};
		XoW.logger.me(this.classInfo + "deleteFriendListChangeHandler()");
	},
	
	/**
	 * 将好友列表转换为可在界面显示的，以分组为主的好友列表
	 * @param friendListManager
	 */
	_friendListToFriendGroupList : function() {
		XoW.logger.ms(this.classInfo + "_friendListToFriendGroupList()");
		
		this.friendGroupList = []; // 先清空
		for(var i = 0; i < this.friendList.length; i++) {
			this.addOneFirendToFriendGroupList(this.friendList[i]);
//			var oneFriend = this.friendList[i];
//			var oneFriendGroupList = oneFriend.getGroup();
//			if(oneFriendGroupList.length == 0) {
//				// 如果这个人没有在某个分组中，即没有 <item>中没有<group/>元素
//				group = this.createFriendListByName("未分组联系人");
//				// 将该好友放入该分组中。
//				group.addFriend(oneFriend); 
//			} else {
//				for(var j = 0; j < oneFriendGroupList.length; j++) {
//					// 根据分组名去分组列表friendGroupList中取得分组。
//					var group = this.getFriendGroupByGroupName(oneFriendGroupList[j]);
//					if(null == group) { // 如果取得的分组为空，说明还没有改分组，则创建该分组
//						group = this.createFriendListByName(oneFriendGroupList[j]);
//					} 
//					// 将该好友放入该分组中。
//					group.addFriend(oneFriend); 
//				}
//			}
		};
		XoW.logger.me(this.classInfo + "_friendListToFriendGroupList()");
	},
	addOneFirendToFriendGroupList : function(oneFriend) {
		var oneFriendGroupList = oneFriend.getGroup();
		if(oneFriendGroupList.length == 0) {
			// 如果这个人没有在某个分组中，即没有 <item>中没有<group/>元素
			var group = this.getFriendListByName("未分组联系人");
			if(null == group) { // 如果取得的分组为空，说明还没有改分组，则创建该分组
				group = this.createFriendListByName("未分组联系人");
			} 
			// 将该好友放入该分组中。
			group.addFriend(oneFriend); 
		} else {
			for(var j = 0; j < oneFriendGroupList.length; j++) {
				// 根据分组名去分组列表friendGroupList中取得分组。
				var group = this.getFriendListByName(oneFriendGroupList[j]);
				if(null == group) { // 如果取得的分组为空，说明还没有改分组，则创建该分组
					group = this.createFriendListByName(oneFriendGroupList[j]);
				} 
				// 将该好友放入该分组中。
				group.addFriend(oneFriend); 
			}
		}
	},
	
	

	
	
	
	
	
	
	
};








/**
 * 用户对象可监听属性枚举
 */
XoW.UserlEnum = {
	JID : "jid",
	NAME : "name",
	GROUP : "group", //
	ASK : "ask", //
	SUBSCRIPTION : "subscription", //
	FACE : "face", //
	VCARD : "vcard",
	STATE : "state",
	PRES : "pres",
	BLINKINTERVAL : "blinkInterval",
	RESOURCE : "resource" 
};

return XoW;
}));

