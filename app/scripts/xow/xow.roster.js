
(function(factory) {
	return factory(XoW);
}(function(XoW) {

/**
 *  RosterManager创建之前
 * 	GlobalManager要存在
 * 	ConnectionManager要存在
 */
XoW.RosterManager = function(globalManager) {
	this._gblMgr = globalManager;
	
	
	// 用来存储监听iq result roster的，获取全部好友。
	this._rosterCbHandlers = [];
	
	// 监听iq roster节的
	// 1， allRoster 所有人的roster回调
	// 2, rosterSet roster的 增删改
	this.handler = null;
	
	this.classInfo = "【RosterManager】";
	this._init();
};
XoW.RosterManager.prototype = {
		
	_init : function() {
		XoW.logger.ms(this.classInfo + "_init()");
		
		this.handler = new XoW.Handler();
		// 添加监听器
		// this._gblMgr.getConnMgr().addHandler(this._rosterCb.bind(this),Strophe.NS.ROSTER, "iq", "result");
		// 监听服务器的iq set roster节
		this._gblMgr.getConnMgr().addHandler(this._setRosterCb.bind(this),Strophe.NS.ROSTER, "iq", "set");
		XoW.logger.me(this.classInfo + "_init()");
	},
	
	/**
	 * 获取联系人列表
	 * @param successCb
	 * @param errorCb
	 * @param timeout
	 * @returns
	 */
	getRoster : function(successCb, errorCb, timeout) {
		XoW.logger.ms(this.classInfo + "getRoster()");

		var roster = $iq({id : XoW.utils.getUniqueId("roster"), 
			type : "get"
		}).c("query",{xmlns : Strophe.NS.ROSTER});
		
		XoW.logger.me(this.classInfo + "getRoster()");
		return this._gblMgr.getConnMgr().sendIQ(roster, successCb, errorCb, timeout);
	},
	
	
	
	_setRosterCb : function(stanza) {
		XoW.logger.ms(this.classInfo + "_setRosterCb");
		// 有多种情况
		// 好友修改了（分组移动/好友name变动）    
		// 好友增加了   区分增加和修改，就看原来自己的friends里面有没有该好友，如果有，就是修改，如果没有，就是新增。
		// 好友删除了  remove
		// 但很奇怪= =，spark以另一种方式实现了。
		// 它使用 unsubscribe解除自己订阅对方 和 unsubscribed解除对方对自己的订阅。。。这样就O了，然后subscription变成了none，就移除了联系人列表。
		var $stanza = $(stanza);
		var $item = $('item', $stanza);
		
		var user = new XoW.User(this._gblMgr.getUserMgr());
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
		
		
		var params = {
			user : user,
			stanza : stanza
		};
		this.triggerHandlerInRosterMgr('rosterSet', params);
		
		var iqResult = $iq({from : this._gblMgr.getCurrentUser().getFullJid(), 
			type : 'result',
			id : $stanza.attr('id'),
		});
		this._gblMgr.getConnMgr().send(iqResult);
		XoW.logger.me(this.classInfo + "_setRosterCb");
		return true;
	},
	
	/**
     * 回调与触发。
     * @param proName
     * @param callback
     */
    addHandlerToRosterMgr : function(proName, callback) {
    	XoW.logger.ms(this.classInfo + "addHandlerToRosterMgr()");
    	XoW.logger.d(this.classInfo + "添加了一个监听，监听属性： " + proName);
    	this.handler.addHandler(proName, callback);
    	XoW.logger.me(this.classInfo + "addHandlerToRosterMgr()");
    },
    deleteHandlerInRosterMgr : function(id) {
    	XoW.logger.ms(this.classInfo + "deleteHandlerInRosterMgr()");
    	this.handler.deleteHandler(id);
    	XoW.logger.me(this.classInfo + "deleteHandlerInRosterMgr()");
    },
    triggerHandlerInRosterMgr : function(proName, params) {
    	XoW.logger.ms(this.classInfo + "triggerHandlerInRosterMgr()");
    	XoW.logger.d(this.classInfo + "触发的属性是： " + proName);
    	this.handler.triggerHandler(proName, params);
    	XoW.logger.me(this.classInfo + "triggerHandlerInRosterMgr()");
    },
    
    setIQRosterRemoveByFriend : function(friend, successCb, errorCb, timeout) {
    	XoW.logger.ms(this.classInfo + "setIQRosterRemove");
    	// var pureJid = XoW.utils.getBareJidFromJid(jid);
    	var iq = $iq({id : XoW.utils.getUniqueId('setIQRosterRemove'),
    		type : 'set'
    	}).c('query', { xmlns : Strophe.NS.ROSTER
    	}).c('item', { jid: friend.jid,
    		subscription : 'remove',    		
    	});
    	for(var i = 0; i < friend.group.length; i++) {
    		iq.c('group').t(friend.group[i]).up();
    	}
    	this._gblMgr.getConnMgr().sendIQ(iq, successCb, errorCb, timeout);
    	XoW.logger.me(this.classInfo + "setIQRosterRemove");
    },
    setIQRosterRemove : function(jid, successCb, errorCb, timeout) {
    	XoW.logger.ms(this.classInfo + "setIQRosterRemove");
    	var pureJid = XoW.utils.getBareJidFromJid(jid);
    	var iq = $iq({id : XoW.utils.getUniqueId('setIQRosterRemove'),
			type : 'set'
		}).c('query', { xmlns : Strophe.NS.ROSTER
		}).c('item', { jid: pureJid,
			subscription : 'remove',
		});
    	this._gblMgr.getConnMgr().sendIQ(iq, successCb, errorCb, timeout);
    	XoW.logger.me(this.classInfo + "setIQRosterRemove");
    },
    
    /**
     * 将一个好友设置到我的 花名册中，此处并未往 friends中添加该好友
     * 等待服务器发送的iq roster set再将其添加到好友列表
     * @param userModel
     * @param successCb
     * @param errorCb
     * @param timeout
     */
    setIQRoster : function(userModel, successCb, errorCb, timeout) {
    	XoW.logger.ms(this.classInfo + "setIQRoster");
		var iq = $iq({id : XoW.utils.getUniqueId('setIQRoster'),
			type : 'set'
		}).c('query', { xmlns : Strophe.NS.ROSTER
		}).c('item', { jid: userModel.jid,
			name : userModel.name
		});
		var userGroup = userModel.getGroup();
		for(var i = 0; i < userGroup.length; i++) {
			iq.c('group').t(userGroup[i]).up();
		}
		
		// 这里应该有对界面的一些处理。然后才将节返回。暂时直接返回看看
		// 这里新增了一个好友，等等还会收到服务器发来的set节。
		this._gblMgr.getConnMgr().sendIQ(iq, successCb, errorCb, timeout);
//		function(stanza) {
//			// 在这里要把新的人放到 UserMgr的friendList中
//			// 然后要给这个人加上handler
//			// 然后要更新friendList
//			
//			// XoW.logger.d(this.classInfo + "添加用户到friendList：" + userModel.jid);
//			// this._gblMgr.getUserMgr().addNewFriendToFriendList(userModel);
//			
//			if(successCb) {
//				successCb(stanza);
//			}
//		}.bind(this)
		XoW.logger.me(this.classInfo + "setIQRoster");
	},
	setIQRosterWay2 : function(jid, name, group, successCb, errorCb, timeout) {
		XoW.logger.ms(this.classInfo + "setIQRoster");
		var iq = $iq({id : XoW.utils.getUniqueId('setIQRoster'),
			type : 'set'
		}).c('query', { xmlns : Strophe.NS.ROSTER
		}).c('item', { jid: jid,
			name : name
		});
		var userGroup = group;
		for(var i = 0; i < userGroup.length; i++) {
			iq.c('group').t(userGroup[i]).up();
		}
		
		// 这里应该有对界面的一些处理。然后才将节返回。暂时直接返回看看
		// 这里新增了一个好友，等等还会收到服务器发来的set节。
		this._gblMgr.getConnMgr().sendIQ(iq, successCb, errorCb, timeout);
//		function(stanza) {
//			// 在这里要把新的人放到 UserMgr的friendList中
//			// 然后要给这个人加上handler
//			// 然后要更新friendList
//			
//			// XoW.logger.d(this.classInfo + "添加用户到friendList：" + userModel.jid);
//			// this._gblMgr.getUserMgr().addNewFriendToFriendList(userModel);
//			
//			if(successCb) {
//				successCb(stanza);
//			}
//		}.bind(this)
		XoW.logger.me(this.classInfo + "setIQRoster");
	},
	
    line________________________ : function() {
    	
    },

	/**public
	 *  发送iq-get-roster请求好友列表
	 */ 
	sendIQRoster : function() {
		XoW.logger.ms(this.classInfo + "sendIQRoster()");
		
		var roster = $iq({id : XoW.utils.getUniqueId("roster"), type : "get"})
						.c("query",{xmlns : Strophe.NS.ROSTER});
		this._gblMgr.getConnMgr().send(roster);
		
		XoW.logger.me(this.classInfo + "sendIQRoster()");
	},
	/**
	 * 回调函数：对服务器返回的好友列表进行处理。
	 * @param rosterResult   一个IQ result节的roster，
	 * @returns {Boolean}  true表示这个函数继续有效，false表示撤销这个函数
	 */
	_rosterCb : function(stanza) {
		XoW.logger.ms(this.classInfo + "_rosterCb()");

		var params = {
			stanza : stanza, // 节
		};
		this.triggerHandlerInRosterMgr('allRoster', params);

		XoW.logger.me(this.classInfo + "_rosterCb()");
		return true;
	},
	
};
return XoW;
}));