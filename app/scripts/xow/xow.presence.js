

// 这个Prensence的sendOnline等方法有必要重新开发。
// 不应该每次有东西都加入这里，要写成触发回调的方式，所有
// 需要监听状态变化都在这里。
(function(factory) {
	return factory(XoW);
}(function(XoW) {
	
/**
 * 用户状态枚举
 */
XoW.UserStateEnum = {
	ONLINE : 1, // 在线
	CHAT : 2, // 空闲
	DND : 3, // 正忙
	AWAY : 4, // 离开
	OFFLINE : 5 // 隐身
};
	
XoW.PresenceModel = function() {
	this.id = "";
	this.from = ""; // 此处from 很可能带有 resource
	this.to = ""; // 此处to 很可能带有 resource
	this.type = ""; 
	this.status = "";
	this.show = "";
	this.priority = "";
	this.photoHash = "";
	this.avatarHash = "";
	this.time = "";
};
XoW.PresenceModel.prototype = {
		
	
	/**
	 * 得到这个出席节展示的状态 即用户的state的
	 */
	getState : function() {
		// alert("showText是" + showText);
		// 在线  <status>在线</status><priority>1</priority>
		// 空闲  <status>空闲</status><priority>1</priority><show>chat</show>
		// 离开 <status>离开</status><priority>0</priority><show>away</show>
		// 正忙 <status>正忙</status><priority>0</priority><show>dnd</show>
		// 离线 <presence type="unavailable" ><status>Offline</status><priority>0</priority>
		if("unavailable" == this.type) { 
			// 离线
			return XoW.UserStateEnum.OFFLINE;
		} else if("chat" == this.show) {
			// 空闲
			return XoW.UserStateEnum.CHAT;
		} else if("away" == this.show) {
			// 离开
			return XoW.UserStateEnum.AWAY;
		} else if("dnd" == this.show) {
			// 正忙
			return XoW.UserStateEnum.DND;
	//	} else if("1" == this.priority) {
			// 在线
//			return XoW.UserStateEnum.ONLINE;
		} else {
			// 由于小龙的实现是在线没有包含priority，所以，如果不是上面的状态就是在线了
			return XoW.UserStateEnum.ONLINE;
		}
	},
	/**
	 * 判断这个出席的报文是不是自己发给自己的
	 */
	isMeToMe : function() {
		if(XoW.utils.getBareJidFromJid(this.from)== XoW.utils.getBareJidFromJid(this.to)) {
			return true;
		} else {
			return false;
		}
	},
	getToResource : function() {
		return XoW.utils.getResourceFromJid(this.to);
	},
	getFromResource : function() {
		return XoW.utils.getResourceFromJid(this.from);
	},
	toStringAll : function() {
		var str = "属性值： [id : " 
				+ this.id + " ] [ from : "
				+ this.from + " ] [ to : "
				+ this.to + " ] [ type : "
				+ this.type + " ] [ status : "
				+ this.status + " ] [ show : " 
				+ this.show + " ] [ priority : " 
				+ this.priority + " ] [ photoHash : "
				+ this.photoHash + " ] [ avatarHash : "
				+ this.avatarHash + " ]";
		return str;
	},
};
	
XoW.PresenceManager = function(globalManager) {
	this._gblMgr = globalManager;
	this.currentState;
	this.classInfo = "【PresenceManager】";
	
	// 可监听
	// 1，presence 出席节
	// 2, error 错误
	// 3,subscribe 请求加好友
	// 4,收到一个同意订阅
	// 5, unsubscribe 收到一个拒绝节
	// 6, unsubscribed 收到一个订阅撤销节
	// 7,unknown 未知节
	this.handler = null;
	this._init();
};
XoW.PresenceManager.prototype = {
		_init : function() {
			XoW.logger.ms(this.classInfo + "_init()");
			XoW.logger.d(this.classInfo + "初始化了XoW.PresenceManager");

			this.handler = new XoW.Handler();
			// 监听presence节
			this._gblMgr.getConnMgr().addHandler(this._presenceCb.bind(this), null, "presence");
			
			XoW.logger.me(this.classInfo + "_init()");
		},
	_create : function() {
		XoW.logger.ms(this.classInfo + "_create()");
		XoW.logger.d(this.classInfo + "创建 PresenceManager");
		
		this.handler = new XoW.Handler();
	
		XoW.logger.me(this.classInfo + "_create()");
	},
	init : function(globalManager) {
		XoW.logger.ms(this.classInfo + "init()");
		XoW.logger.d(this.classInfo + "初始化 PresenceManager");
		
		this._gblMgr = globalManager;
	
		XoW.logger.me(this.classInfo + "init()");
	},
	start : function() {
		XoW.logger.ms(this.classInfo + "start()");
		XoW.logger.d(this.classInfo + "启动 PresenceManager");
		
		this._gblMgr.getConnMgr().addHandler(this._presenceCb.bind(this), null, "presence");
		
		XoW.logger.me(this.classInfo + "start()");
	},
	stop : function() {
		XoW.logger.ms(this.classInfo + "stop()");
		XoW.logger.d(this.classInfo + "停止 PresenceManager");
		
		XoW.logger.me(this.classInfo + "stop()");
	},
	destory : function() {
		XoW.logger.ms(this.classInfo + "destory()");
		XoW.logger.d(this.classInfo + "销毁 PresenceManager");
		
		this._gblMgr = null;
		this.handler = null;
		XoW.logger.me(this.classInfo + "destory()");
	},
	/**
     * 回调与触发。
     * @param proName
     * @param callback
     */
    addHandlerToPresenceMgr : function(proName, callback) {
    	XoW.logger.ms(this.classInfo + "addHandlerToPresenceMgr()");
    	XoW.logger.d(this.classInfo + "添加了一个监听，监听属性： " + proName);
    	this.handler.addHandler(proName, callback);
    	XoW.logger.me(this.classInfo + "addHandlerToPresenceMgr()");
    },
    deleteHandlerInPresenceMgr : function(id) {
    	XoW.logger.ms(this.classInfo + "deleteHandlerInPresenceMgr()");
    	this.handler.deleteHandler(id);
    	XoW.logger.me(this.classInfo + "deleteHandlerInPresenceMgr()");
    },
    triggerHandlerInPresenceMgr : function(proName, params) {
    	XoW.logger.ms(this.classInfo + "triggerHandlerInPresenceMgr()");
    	XoW.logger.d(this.classInfo + "触发的属性是： " + proName);
    	this.handler.triggerHandler(proName, params);
    	XoW.logger.me(this.classInfo + "triggerHandlerInPresenceMgr()");
    },
	
    /**
	 * 调用XoW.ConnectionManager的send()方法来发送出席节
	 * 不在sendOnline...等几个方法中直接用this._connMgr.send(pres); 而要经过这个方法。
	 * 这样做的原因是这可以在这里面做一些日志或者其他什么东西。也便于修改
	 * （如果_conn的send()方法改名了，这样只需改动一处）
	 * 
	 * @param pres 需要发送的出席节
	 */
	_send : function(pres) {
		this._gblMgr.getConnMgr().send(pres); 
	},
    /**
     * 在线
     * @param type 类型 
     * @param toJid 接收者JID。
     */
	/*sendOnline : function(type, toJid) {
		XoW.logger.ms(this.classInfo + "sendOnline()");
		XoW.logger.d(this.classInfo + "发送在线");
		var pres = $pres({
			id : XoW.utils.getUniqueId("presOnline" + type),
			to : toJid
		})
		.c("status")
			.t("在线")
			.up()
		.c("priority")
			.t('1');
		this._send(pres);
		// this._gblMgr.getCurrentUser().state = 1;
		
		XoW.logger.me(this.classInfo + "sendOnline()");
	},*/
    
	

	
	_sendPres : function(pres) {
		for(var i = 0; i < pres.length; i++) {
			this._send(pres[i]); 
		}
	},
	
	
	_sendBooking : function(type, to, from) {
		var pureJid = XoW.utils.getBareJidFromJid(to);
		var pres = $pres({ id : XoW.utils.getUniqueId(type),
			to: pureJid,
			type: type,
			from : from
		});
		this._send(pres); 
	},
	
	 // 订阅别人 
	sendSubscribe : function(to, from) {
		XoW.logger.ms(this.classInfo + "sendSubscribe");
		this._sendBooking('subscribe', to, from);
		XoW.logger.me(this.classInfo + "sendSubscribe");
	},
	// 同意别人订阅
	sendSubscribed : function(to, from) {
		XoW.logger.ms(this.classInfo + "sendSubscribe");
		this._sendBooking('subscribed', to, from);
		XoW.logger.me(this.classInfo + "sendSubscribe");
		
	},
	// 拒绝别人订阅
	sendUnsubscribe : function(to, from) {
		XoW.logger.ms(this.classInfo + "sendUnsubscribe");
		this._sendBooking('unsubscribe', to, from);
		XoW.logger.me(this.classInfo + "sendUnsubscribe");
	},
	// 取消之前的允许订阅
	sendUnsubscribed : function(to, from) {
		XoW.logger.ms(this.classInfo + "sendUnsubscribed");
		this._sendBooking('unsubscribed', to, from);
		XoW.logger.me(this.classInfo + "sendUnsubscribed");
	},

		
	/**
	 * 出席的handler，用于处理接收到的出席消息。
	 * @param pres 接收到的出席节
	 * @returns {Boolean} 表示该handler仍然有效
	 */
    _presenceCb : function(stanza) {
    	XoW.logger.ms(this.classInfo + "_presenceCb()");
		$presence = $(stanza);
		var type = $presence.attr('type');
		var params = {
			preType : '',
			presenceStanza : stanza,
		};
		if(type) {
			switch (type) {
				case 'error' : 
					// 错误节该怎么办？是不是每个人都得监听，然后也
					// 判断这个错误是不是自己造成的？还是怎么样
					// 现在还没有太多的错误节例子。。。
					params.preType = 'error';
					XoW.logger.i(this.classInfo + "收到一个错误节");
					alert("收到了一个错误节");
					
				break;
				case 'subscribe' : 
					XoW.logger.i(this.classInfo + "收到一个订阅节");
					params.preType = 'subscribe';
//					var encap = new XoW.Info();
//					
//					encap.type = 'subscribe';
//					encap.id = XoW.utils.getUniqueId('subscribe');
//					encap.time = XoW.utils.getCurrentDatetime();
//					encap.status = 'untreated';
//					encap.from = $presence.attr('from');
//					encap.to = $presence.attr('to');
					params['subscribe'] = this.encapsulationToInfo(stanza);
					break;
				case 'subscribed' : 
					params.preType = 'subscribed';
					XoW.logger.i(this.classInfo + "收到一个同意订阅节");
					// <presence xmlns="jabber:client" to="lxy4@user-20160421db" id="7IlQh-580" type="subscribed" from="lxy@user-20160421db"><x xmlns="vcard-temp:x:update"><photo>a6a0bc870a5f36bc23b71a4aa5fc57c59217b419</photo></x><x xmlns="jabber:x:avatar"><hash>a6a0bc870a5f36bc23b71a4aa5fc57c59217b419</hash></x></presence>
//					var encap = new XoW.Info();
//					encap.type = 'subscribed';
//					encap.id = XoW.utils.getUniqueId('subscribed');
//					encap.time = XoW.utils.getCurrentDatetime();
//					encap.status = 'none'; 
//					encap.from = $presence.attr('from');
//					encap.to = $presence.attr('to');
					params['subscribed'] = this.encapsulationToInfo(stanza);
					params.subscribed.status = 'none';
					
					break;
				case 'unsubscribe' : 
					// 收到一个unsubsribe就要发送remove
					XoW.logger.i(this.classInfo + "收到一个拒绝节");
					params.preType = 'unsubscribe';
//					var encap = new XoW.Info();
//					encap.type = 'unsubscribe';
//					encap.id = XoW.utils.getUniqueId('unsubscribe');
//					encap.time = XoW.utils.getCurrentDatetime();
//					encap.status = 'none'; 
//					encap.from = $presence.attr('from');
//					encap.to = $presence.attr('to');
//					params['unsubscribe'] = encap;
					params['unsubscribe'] = this.encapsulationToInfo(stanza);
					params.unsubscribe.status = 'none';
					var friend = this._gblMgr.getUserMgr().getFriendByJid($presence.attr('from'));
					// 如果从自己的roster里面没有找到该用户，说明该用户不是我的好友，不在我的好友列表中，
					// 则以jid的方式发送remove
					if(null != friend) {
						this._gblMgr.getUserMgr().getRosterMgr().setIQRosterRemoveByFriend(friend);
					} else {
						this._gblMgr.getUserMgr().getRosterMgr().setIQRosterRemove($presence.attr('from'));
					}
					break;
				case 'unsubscribed' : 
					params.preType = 'unsubscribed';
					XoW.logger.i(this.classInfo + "收到一个订阅撤销节");
//					var encap = new XoW.Info();
//					encap.type = 'unsubscribed';
//					encap.id = XoW.utils.getUniqueId('unsubscribed');
//					encap.time = XoW.utils.getCurrentDatetime();
//					encap.status = 'none'; 
//					encap.from = $presence.attr('from');
//					encap.to = $presence.attr('to');
//					params['unsubscribed'] = encap;
					params['unsubscribed'] = this.encapsulationToInfo(stanza);
					params.unsubscribed.status = 'none';
					break;
				case 'unavailable' : 
					params.preType = 'presence';
					XoW.logger.i(this.classInfo + "收到一个离线节");
					break;
				default : 
					params.preType = 'unknown';
					XoW.logger.i(this.classInfo + "收到一个未知节" + type);
					break;
			}
		} else {
			params.preType = 'presence';
			XoW.logger.i('收到出席节');
		}
		if('presence' == params.preType) {
			params['presence'] = this.encapsulationToPresence(stanza);
		}
		this.triggerHandlerInPresenceMgr(params.preType, params);
		XoW.logger.me(this.classInfo + "_presenceCb()");
		return true;
	},
	
	encapsulationToInfo : function(stanza) {
		var $info = $(stanza);
		var encap = new XoW.Info();
		encap.type = $info.attr('type');
		encap.id = XoW.utils.getUniqueId(encap.type);
		encap.time = XoW.utils.getCurrentDatetime();
		encap.status = 'untreated';
		encap.from = $presence.attr('from');
		encap.to = $presence.attr('to');
		return encap;
	},
	
	encapsulationToPresence : function(stanza) {
		XoW.logger.ms(this.classInfo + "encapsulationToPresence()");
		
		var $pres = $(stanza);
		var presTemp = new XoW.PresenceModel();
		
		presTemp.from = $pres.attr("from");
		presTemp.to = $pres.attr("to");
		presTemp.id = $pres.attr("id");
		presTemp.type = $pres.attr("type");
		presTemp.status = $('status', $pres).text();
		presTemp.priority = $('priority', $pres).text();
		presTemp.show = $('show', $pres).text();
		presTemp.photoHash = $('photo',$('x', $pres)).text();
		presTemp.avatarHash = $('hash',$('x', $pres)).text();
		presTemp.time = XoW.utils.getCurrentDatetime();
		
		XoW.logger.d(this.classInfo + presTemp.toStringAll());
		return presTemp;
	},


	
	// 以下是五个发送状态的方法
	/**public
	 * 在线
	 */
	sendOnline : function() {
		XoW.logger.d(this.classInfo + "发送在线");
		var p1 = $pres({
			id : XoW.utils.getUniqueId("presOnline")
		}).c("status").t("在线")
		.up().c("priority").t('1');
		this._send(p1);
		this._gblMgr.getCurrentUser().state = 1;
		
		// 这种做法不利于扩展性。
		// 应该也是利用类似handler的来做，在这里触发一下Handler。
		// 在需要的地方监听发送online的Handler，然后发送presence
		// 例如：这里写了
		// this.triggerHandlerInPresenceMgr('online', params)
		// 然后在OrgnizationManager中
		// 1，presenceMgr.addHandler('online', cb);
		// 当上面triggerHandlerInPresenceMgr触发后
		// 2，cb{
		// 发送orgnization的presence。
		// }
		
		var p2 = $pres({
			id : XoW.utils.getUniqueId("presOnlineToOrg"),
			to : this._gblMgr.getOrgnizationMgr().getOrgDomain(),
		}).c("status").t("在线")
		.up().c("priority").t('1');
		this._send(p2);
		
		// 发送到房间中
		var rooms = this._gblMgr.getRoomMgr().getAllXmppRoom();
		for(var key in rooms) {
			this.sendOnlineToRoom(rooms[key].name);
		}
	},
	
	sendOnlineToRoom : function (roomJid) {
		var pRoom = $pres({id : XoW.utils.getUniqueId("presOnline"),
			to : roomJid,
		}).c("status").t("在线")
		.up().c("priority").t('1');
		this._send(pRoom);
	},
	
	/**public
	 * 空闲
	 */
	sendChat : function() {
		XoW.logger.d(this.classInfo + "发送空闲");
		var pres = [];
		var p1 = $pres({id : XoW.utils.getUniqueId("presChat") })
						.c("status").t('空闲')
						.up().c("show").t('chat')
						.up().c("priority").t('1');
		pres.push(p1);
		var p2 = $pres({
			id : XoW.utils.getUniqueId("presChatToOrg"),
			to : this._gblMgr.getOrgnizationMgr().getOrgDomain()
		}).c("status").t('空闲')
		.up().c("show").t('chat')
		.up().c("priority").t('1');
//		this._send(p2);
		pres.push(p2);
		
		var rooms = this._gblMgr.getRoomMgr().getAllXmppRoom();
		for(var key in rooms) {
			var pRoom = $pres({id : XoW.utils.getUniqueId("presChat"), 
				to : rooms[key].name  
			}).c("status").t('空闲')
			.up().c("show").t('chat')
			.up().c("priority").t('1');
			pres.push(pRoom);
		}
		this._sendPres(pres);
		this._gblMgr.getCurrentUser().state = 2;
	},
	/**public
	 * 离开
	 */
	sendAway : function() {
		XoW.logger.d(this.classInfo + "发送离开");
		var pres = [];
		var p1 = $pres({id : XoW.utils.getUniqueId("presAway") 
		}).c("status").t('离开')
		.up().c("show").t('away')
		.up().c("priority").t('0');
		pres.push(p1);
		var p2 = $pres({id : XoW.utils.getUniqueId("presAwayToOrg"),
			to : this._gblMgr.getOrgnizationMgr().getOrgDomain()
		}).c("status").t('离开')
		.up().c("show").t('away')
		.up().c("priority").t('0');
		pres.push(p2);
		
		
		
		var rooms = this._gblMgr.getRoomMgr().getAllXmppRoom();
		for(var key in rooms) {
			var pRoom = $pres({id : XoW.utils.getUniqueId("presAway"), 
				to : rooms[key].name 
			}).c("status").t('离开')
			.up().c("show").t('away')
			.up().c("priority").t('0');
			pres.push(pRoom);
		}
		this._sendPres(pres);
		this._gblMgr.getCurrentUser().state = 3;
	},
	/**public
	 * 正忙
	 */
	sendDnd : function() {
		XoW.logger.d(this.classInfo + "发送正忙");
		var pres = [];
		var p1 = $pres({id : XoW.utils.getUniqueId("presDnd") 
		}).c("status").t('正忙')
		.up().c("show").t('dnd')
		.up().c("priority").t('0');
		pres.push(p1);
		var p2 = $pres({id : XoW.utils.getUniqueId("presDndToOrg"),
			to : this._gblMgr.getOrgnizationMgr().getOrgDomain() 
		}).c("status").t('正忙')
		.up().c("show").t('dnd')
		.up().c("priority").t('0');
		pres.push(p2);
		
		var rooms = this._gblMgr.getRoomMgr().getAllXmppRoom();
		for(var key in rooms) {
			var pRoom = $pres({id : XoW.utils.getUniqueId("presDnd"), to : rooms[key].name })
						.c("status").t('正忙')
						.up().c("show").t('dnd')
						.up().c("priority").t('0');
			pres.push(pRoom);
		}
		this._sendPres(pres);
		this._gblMgr.getCurrentUser().state = 4;
	},
	
	sendOffline1 : function() {
		XoW.logger.d(this.classInfo + "发送离线");
		var pres = $pres({id : XoW.utils.getUniqueId("presOffline"), 
			type : "unavailable"
		}).c("status").t('Offline')
		.up().c("priority").t('0');
		this._send(pres);
		
		var pres2 = $pres({id : XoW.utils.getUniqueId("presOfflineToOrg"),
			to : this._gblMgr.getOrgnizationMgr().getOrgDomain(), 
			type : "unavailable"
		}).c("status").t('Offline')
		.up().c("priority").t('0');
		this._send(pres2);
		this._gblMgr.getUserMgr().setAllFriendsOffline();
		this._gblMgr.getCurrentUser().state = 5;
	},
	
	/**public
	 * 离线
	 * 离线比较特殊，它会退出所有房间，而unavailable的节在room.leave()方法中来实现。
	 * 
	 */
	sendOffline : function(cb) {
		XoW.logger.d(this.classInfo + "发送离线");
		var pres = $pres({id : XoW.utils.getUniqueId("presOffline"), type : "unavailable"})
						.c("status").t('Offline')
						.up().c("priority").t('0');
		// var rooms = this._gblMgr.getRoomMgr().getAllXmppRoom();
		if(this._gblMgr.getRoomMgr().getXmppRoomLength() > 0) {
			layer.confirm('是否设置为隐身状态？', function(index) {
				// 离开房间要先发送leaveAllXmppRoom
				// 然后才能发送 pres
				
		      	this._gblMgr.getRoomMgr().leaveAllXmppRoom();
		      	this._send(pres);
		      	// 要手动关闭
		      	layer.close(index);
		      	XoW.logger.w("返回true");
		      	cb(true);
			}.bind(this), '隐身状态将会退出当前所在的会议室', function(index) {
				layer.close(index);
				cb(false);
			});
		} else {
			this._send(pres);
			cb(true);
		} 
		this._gblMgr.getUserMgr().setAllFriendsOffline();
		this._gblMgr.getCurrentUser().state = 5;
	},
	
};
return XoW;
}));