(function(factory) {
	return factory(XoW);
}(function(XoW) {

	XoW.ServerMananger = function(globalManager) {
		this._gblMgr = globalManager;
		this.serverDomain = "";
		this.serverItems = [];
		this.classInfo = 'ServerMananger';
		this._init();
	};
	XoW.ServerMananger.prototype = {
		getServerDomain : function() {
			XoW.logger.ms(this.classInfo  + "getServerDomain");
			return this.serverDomain;
			XoW.logger.me(this.classInfo  + "getServerDomain");
		},
		_init : function() {
			XoW.logger.ms(this.classInfo  + "_init");
			this.serverDomain = XoW.utils.getDomainFromJid(this._gblMgr.getCurrentUser1().jid);
			this.getServerAbility();
			XoW.logger.me(this.classInfo  + "_init");
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
			XoW.logger.ms(this.classInfo  + "getAbilityByCategroy");
			for(var i = 0; i < this.serverItems.length; i++) {
				var item = this.serverItems[i][0];
				for(var j = 0; j < item.identity.length; j++) {
					if(item.identity[j].category == categroy && item.identity[j].type == type) {
						// 我当前默认就只会有一个会议服务
						return item;
					}
				}
			}
			return null;
			XoW.logger.me(this.classInfo  + "getAbilityByCategroy");
		},
		/**
		 * 获得会议室的信息
		 * 现在假设这个时候 服务器的能力已经获取完毕了
		 * @param success
		 * @param error
		 * @returns
		 */
		getRoomAbility : function() {
			XoW.logger.ms(this.classInfo  + "getRoomAbility");
			var roomIdetityCategory = 'conference';
			for(var i = 0; i < this.serverItems.length; i++) {
				var item = this.serverItems[i][0];
				for(var j = 0; j < item.identity.length; j++) {
					if(item.identity[j].category == roomIdetityCategory) {
						// 我当前默认就只会有一个会议服务
						return item;
					}
				}
			}
			return null;
			XoW.logger.me(this.classInfo  + "getRoomAbility");
		},

		/**
		 * 获得服务器的能力。
		 * @param successCb
		 * @param errorCb
		 * @param timeout
		 */
		getServerAbility : function(successCb, errorCb, timeout) {
			XoW.logger.ms(this.classInfo  + "getServerAbility");
			this.serverItems = [];
			// 获取服务器自己的features
			this.getDiscoInfo(this.serverDomain, function(params2) {
				this.serverItems.push(params2.infos);
			}.bind(this));
			this.getDiscoItem(XoW.config.domain, function(params1) {
				var items = params1.items;
				for(var i = 0; i < items.length; i++) {
					this.getDiscoInfo(items[i].jid, function(params2) {
						this.serverItems.push(params2.infos);
					}.bind(this), function(errorStanza) {
						this._gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ERROR, "获取服务" + items[i].jid + "能力失败！"); //todo wshengt modify
					}, timeout);
				}
				if(successCb) {
					var params = {
						serverItems : this.serverItems,
					};
					successCb(params);
				}
			}.bind(this), function(errorStanza) {
				this._gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ERROR, "获取服务器能力失败!");
			}, timeout);
			XoW.logger.me(this.classInfo  + "getServerAbility");
		},
		/**
		 * 获取某项服务的具体信息
		 * @param toJid 服务的jid。也可以是请求某个实体的能力。。
		 * @param callback
		 * @param errback
		 * @param timeout
		 */
		getDiscoInfo : function(toJid, successCb, errorCb, timeout) {
			XoW.logger.ms(this.classInfo  + "getDiscoInfo");
			var iq = $iq({id : XoW.utils.getUniqueId("discoInfo"),
				//from : this.jid,
				to : toJid,
				type : "get",
			}).c("query",{xmlns : Strophe.NS.DISCO_INFO});
			this._gblMgr.getConnMgr().sendIQ(iq, function(stanza) {
				var infos = [];
				var identity = [];
				var feature = [];
				//for(var item of stanza.getElementsByTagName('item')) {
				// stanza.getElementsByTagName('identity').forEach(function (index, item) {
				for(let item of stanza.getElementsByTagName('identity')) {
					identity.push({
						category: item.getAttribute('category'),
						name: item.getAttribute('name'),
						type: item.getAttribute('type'),
					});
				}

				// $('feature', discoInfo).each(function(index, item) {
				//stanza.getElementsByTagName('feature').forEach(function (index, item) {
				for(let item of stanza.getElementsByTagName('feature')) {
					feature.push(item.getAttribute('var'));
				}

				infos.push({ jid : toJid, identity : identity, feature : feature});
				var params = {
					discoInfoStanza : stanza,
					infos : infos,
				};
				if(successCb) {
					successCb(params);
				}
			}, errorCb, timeout);
			XoW.logger.me(this.classInfo  + "getDiscoInfo");
		},
		/**
		 * 获得服务器提供的服务
		 * @param to 服务器domain
		 * @param callback
		 * @param errback
		 * @param timeout
		 */
		getDiscoItem : function(toDomain, successCb, errorCb, timeout) {
			XoW.logger.ms(this.classInfo  + "getDiscoItem");
			var iq = $iq({id : XoW.utils.getUniqueId("discoItem"),
				//from : this.jid,
				to : toDomain,
				type : "get",
			}).c("query",{xmlns : Strophe.NS.DISCO_ITEMS});

			this._gblMgr.getConnMgr().sendIQ(iq, function(stanza) {
				var items = [];
				//stanza.getElementsByTagName('item').each(function (index, item) {
				for(let item of stanza.getElementsByTagName('item')) {
					items.push({
						jid: item.getAttribute('jid'),
						name: item.getAttribute('name'),
					});
				}

				var params = {
					items : items,
					discoItemStanza : stanza,
				};
				if(successCb) {
					successCb(params);
				}
			}, errorCb, timeout);
			XoW.logger.me(this.classInfo  + "getDiscoItem");
		},
		line________________________ : function() {},
		/**
		 * 获得服务器的一些信息
		 * @param to 服务器
		 */
		getVersion : function(to, successCb, errorCb, timeout) {
			XoW.logger.ms(this.classInfo  + "getVersion");
			var getServerVersion = $iq({type : "get", id : XoW.utils.getUniqueId("SerVerion"),
				to : to
			}).c("query", {xmlns : Strophe.NS.VERSION});
			this._gblMgr.getConnMgr().send(getServerVersion, successCb, errorCb, timeout);
			XoW.logger.me(this.classInfo  + "getVersion");
		},
		/**
		 * 回调函数：处理服务器向客户端发送来的ping节
		 * @param ping
		 * @returns {Boolean}
		 */
		_pingHandler : function(ping) {
			XoW.logger.ms(this.classInfo  + "_pingHandler");
			var pingId = ping.getAttribute("id");
			var from = ping.getAttribute("from");
			var to = ping.getAttribute("to");
			var pong = $iq({type   : "result",
				"to"   : from,
				id     : pingId,
				"from" : to});
			this._gblMgr.getConnMgr().send(pong); // 发送pong
			return true;
			XoW.logger.me(this.classInfo  + "_pingHandler");
		},

		/**
		 * 回调函数：处理客户端向服务器发送ping之后收到的pong，暂时空实现
		 * @param pong
		 * @returns {Boolean}
		 */
		pongHandler : function(pong) {
			XoW.logger.ms(this.classInfo  + "pongHandler");
			return true;
			XoW.logger.me(this.classInfo  + "pongHandler");
		},
		/**
		 * 给服务器发送一个ping
		 * @param to 服务器
		 */
		sendIQPing : function(to) {
			XoW.logger.ms(this.classInfo  + "sendIQPing");
			var ping = $iq({id : XoW.utils.getUniqueId("ping"), to : to, type : "get"})
				.c("ping", {xmlns : XoW.NS.PING});
			this._gblMgr.getConnMgr().send(ping);
			XoW.logger.me(this.classInfo  + "sendIQPing");
		},
	};

	return XoW;
}));
