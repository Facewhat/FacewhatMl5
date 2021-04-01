
(function(factory) {
	return factory(XoW);
}(function(XoW) {
	
XoW.ServerMananger = function(globalManager) {
	this._gblMgr = globalManager;
	
	this.serverDomain = ''; // 服务器domain
	this.serverItems = []; // 服务提供的服务
	this.classInfo = 'ServerMananger';
	this._init();
};

XoW.ServerMananger.prototype = {
	getServerDomain : function() {
		return this.serverDomain;
	},
		
	_init : function() {
		XoW.logger.ms(this.classInfo + "_init()");

		// 获得服务器的domain
		this.serverDomain = XoW.utils.getDomainFromJid(this._gblMgr.getCurrentUser().jid);
		
		// ping IQ节监听
		// this._gblMgr.getConnMgr().addHandler(this._pingHandler.bind(this),XoW.NS.PING, "iq", "get");
		
		// 获取服务器能力
		this.getServerAbility();
		XoW.logger.me(this.classInfo + "_init()");
	},

	
	
	
	/**
	 * 会议室是 getAbilityByCategroy('conference', 'text');
	 * 根据categroy和type获取Ability
	 * @param categroy
	 * @returns 返回一个item，结构如下
	 * item{
	 * 	jid
	 * 	feature [] 
	 *  identity [] 
	 * }
	 */
	getAbilityByCategroy : function (categroy, type) {
		XoW.logger.ms(this.classInfo + "getAbilityByCategroy");
		for(var i = 0; i < this.serverItems.length; i++) {
			var item = this.serverItems[i][0];
			for(var j = 0; j < item.identity.length; j++) {
				if(item.identity[j].category == categroy && item.identity[j].type == type) {
					// 我当前默认就只会有一个会议服务
					XoW.logger.d(this.classInfo + "得到了服务器" +  categroy);
					XoW.logger.me(this.classInfo + "getAbilityByCategroy");
					return item;
				}
			}
		}
		XoW.logger.d(this.classInfo + "不存在服务器" + categroy);
		XoW.logger.me(this.classInfo + "getAbilityByCategroy");
		return null;
		
	},
	/**
	 * 获得会议室的信息
	 * 现在假设这个时候 服务器的能力已经获取完毕了
	 * @param success
	 * @param error
	 * @returns
	 */
	getRoomAbility : function() {
		XoW.logger.ms(this.classInfo + "getRoomAbility");
		var roomIdetityCategory = 'conference';
		for(var i = 0; i < this.serverItems.length; i++) {
			var item = this.serverItems[i][0];
			for(var j = 0; j < item.identity.length; j++) {
				if(item.identity[j].category == roomIdetityCategory) {
					// 我当前默认就只会有一个会议服务
					XoW.logger.d(this.classInfo + "得到了会议服务器");
					XoW.logger.me(this.classInfo + "getRoomAbility");
					return item;
				}
			}
		}
		XoW.logger.d(this.classInfo + "不存在会议服务器");
		XoW.logger.me(this.classInfo + "getRoomAbility");
		return null;
	},
	
	/**
	 * 获得服务器的能力。
	 * @param successCb
	 * @param errorCb
	 * @param timeout
	 */
	getServerAbility : function(successCb, errorCb, timeout) {
		XoW.logger.ms(this.classInfo + "getServerAbility");

		this.serverItems = [];
		
		// 获取服务器自己的features
		this.getDiscoInfo(this.serverDomain, function(params2) {
			this.serverItems.push(params2.infos);
		}.bind(this));
		
		// 获取服务器下子服务器（子域）的features
		this.getDiscoItem(this.serverDomain, function(params1) {
//			var params = {
//					items : items,
//					discoItemStanza : stanza,
//				};
			var items = params1.items;
			for(var i = 0; i < items.length; i++) {
				this.getDiscoInfo(items[i].jid, function(params2) {
//					infos.push({ jid : toJId, identity : identity, feature : feature});
//					var params = {
//						discoInfoStanza : stanza,
//						infos : infos,
//					};
					this.serverItems.push(params2.infos);
					
				}.bind(this), function(errorStanza) {
					
					XoW.logger.e(this.classInfo + "获取服务" + items[i].jid + "能力失败！");
					alert("获取服务" + items[i].jid + "能力失败！");
				}, timeout);
			}
			if(successCb) {
				var params = {
					serverItems : this.serverItems, 
				};
				successCb(params);
			}
			// this.getDiscoItem(this.serverDomain, function(Cb, errorCb, timeout) 
		}.bind(this), function(errorStanza) {
			XoW.logger.e(this.classInfo + "获取服务器能力失败！");
			alert("获取服务器能力失败！");
		}, timeout);
		XoW.logger.me(this.classInfo + "getServerAbility");
	},
	
	/**
	 * 获取某项服务的具体信息
	 * @param toJid 服务的jid。也可以是请求某个实体的能力。。
	 * @param callback
	 * @param errback
	 * @param timeout
	 */
	getDiscoInfo : function(toJid, successCb, errorCb, timeout) {
		XoW.logger.ms(this.classInfo + "getDiscoInfo");
		
		var iq = $iq({id : XoW.utils.getUniqueId("discoInfo"), 
			//from : this.jid, 
			to : toJid, 
			type : "get",
		}).c("query",{xmlns : Strophe.NS.DISCO_INFO});
		
		this._gblMgr.getConnMgr().sendIQ(iq, function(stanza) {
			var $discoInfo = $(stanza);
			
			var infos = [];
			var identity = [];
			var feature = [];
			$('identity', $discoInfo).each(function(index, item) {
				identity.push({ category : $(item).attr('category'),
					name : $(item).attr('name'),
					type : $(item).attr('type'),
				});
			});
			$('feature', $discoInfo).each(function(index, item) {
				feature.push($(item).attr('var'));
			});
			infos.push({ jid : toJid, identity : identity, feature : feature});
			var params = {
				discoInfoStanza : stanza,
				infos : infos,
			};
			if(successCb) {
				successCb(params);
			}
			
		}, errorCb, timeout);
		
		XoW.logger.me(this.classInfo + "getDiscoInfo");
	},
	/**
	 * 获得服务器提供的服务
	 * @param to 服务器domain
	 * @param callback
	 * @param errback
	 * @param timeout
	 */
	getDiscoItem : function(toDomain, successCb, errorCb, timeout) {
		XoW.logger.ms(this.classInfo + "getDiscoItem");
		
		var iq = $iq({id : XoW.utils.getUniqueId("discoItem"), 
			//from : this.jid, 
			to : toDomain, 
			type : "get",
		}).c("query",{xmlns : Strophe.NS.DISCO_ITEMS});
		
		this._gblMgr.getConnMgr().sendIQ(iq, function(stanza) {
			XoW.logger.d(this.classInfo + "获取discoitem成功");
			var $discoItem = $(stanza);
			var items = [];
			$('item', $discoItem).each(function(index, item) {
				items.push({jid : $(item).attr('jid'),
					name : $(item).attr('name'),
				});
			});
			var params = {
				items : items,
				discoItemStanza : stanza,
			};
			if(successCb) {
				successCb(params);
			}
		}, errorCb, timeout);
		
		XoW.logger.me(this.classInfo + "getDiscoItem");
	},
	
	
	line________________________ : function() {},
	
	/**
	 * 获得服务器的一些信息
	 * @param to 服务器
	 */
	getVersion : function(to, successCb, errorCb, timeout) {
		var getServerVersion;
		getServerVersion = $iq({
			type: "get", id: XoW.utils.getUniqueId("SerVerion"),
			to: to
		}).c("query", {xmlns: Strophe.NS.VERSION});
		this._gblMgr.getConnMgr().send(getServerVersion, successCb, errorCb, timeout);
	},
	
	/**
	 * 回调函数：处理服务器向客户端发送来的ping节
	 * @param ping
	 * @returns {Boolean}
	 */
	_pingHandler : function(ping) {
		var pingId = ping.getAttribute("id");
		var from = ping.getAttribute("from");
		var to = ping.getAttribute("to");
		var pong = $iq({type   : "result", 
						"to"   : from, 
						id     : pingId, 
						"from" : to});
		this._gblMgr.getConnMgr().send(pong); // 发送pong
		return true;
	},
	
	/**
	 * 回调函数：处理客户端向服务器发送ping之后收到的pong，暂时空实现
	 * @param pong
	 * @returns {Boolean}
	 */
	pongHandler : function(pong) {
		
		return true;
	},	
	
	/**
	 * 给服务器发送一个ping
	 * @param to 服务器
	 */
	sendIQPing : function(to) {
		var ping = $iq({id : XoW.utils.getUniqueId("ping"), to : to, type : "get"})
						.c("ping", {xmlns : XoW.NS.PING});
		this._gblMgr.getConnMgr().send(ping);
	},
};
	
return XoW;
}));
