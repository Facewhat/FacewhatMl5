(function(factory) {
	return factory(XoW);
}(function(XoW) {

XoW.RoomManager = function(globalManager) {
	this._gblMgr = globalManager;
	
	this.infos = []; // 所有的邀请
	
	this.allRooms = []; // 0,1,2,3作key, room本身作value
	this.roomReady = false; // 房间是否已经读取完毕
	this.getGroupChatRoomInterval = null;
	
	this.handlers = [];
	
	
	this.roomConfigParser = new RoomConfig();
	// 可监听 
	// 1,addRoom
	// 2,claerAllRoom
	this.handler = null;
	
	
	this.roomAbility = null;
	// 当前类的信息
	this.classInfo = "【RoomManager】";
	this._init();
};
XoW.RoomManager.prototype = {
	getRoomDomain : function() {
		// 获得房间的域。
		return this.roomAbility.jid;
	},
		
	_init : function() {
		XoW.logger.ms(this.classInfo + "_init()");
		
		XoW.logger.d(this.classInfo + "_init()初始化了XoW.RoomManager");
		
		this.handler = new XoW.Handler();
		// 监听类型为chat的message节， 监听邀请
		this._gblMgr.getConnMgr().addHandler(this._roomInviteCb.bind(this), Strophe.NS.MUC_USER, "message");
		// 监听presence节，监听房间创建
		// this._gblMgr.getConnMgr().addHandler(this._roomCreateCb.bind(this), Strophe.NS.MUC_USER, "presence");
		
		
		// 矛盾的地方。。。
		// 
//		var interval = setInterval(function() {
//			if(null != this._gblMgr.getServerMgr()) {
//				this.roomAbility = this._gblMgr.getServerMgr().getRoomAbility();
//				if(null != this.roomAbility) {
//					XoW.logger.d(this.classInfo + "_init() 得到了roomAbility");
//					clearInterval(interval);
//					this.getAllRoomsFromServer();
//				}
//			}
//			XoW.logger.d(this.classInfo + "_init() 还没得到了roomAbility");
//		}.bind(this), 500);
		XoW.logger.me(this.classInfo + "_init()");
	},
	
	_start : function() {
		var i = 0;
		var interval = setInterval(function() {
			if(null != this._gblMgr.getServerMgr()) {
				this.roomAbility = this._gblMgr.getServerMgr().getRoomAbility();
				if(null != this.roomAbility) {
					XoW.logger.d(this.classInfo + "_init() 得到了roomAbility");
					clearInterval(interval);
					this.getAllRoomsFromServer();
				}
			}
			XoW.logger.d(this.classInfo + "_init() 还没得到了roomAbility");
			i++;
			if(i == 10) {
				clearInterval(interval);
				XoW.logger.e('获取服务失败！');
			}
		}.bind(this), 500);
		XoW.logger.me(this.classInfo + "_init()");
	},
	
	
	getAllRoomsFromServer : function(successCb, errorCb, timeout) {
		XoW.logger.ms(this.classInfo + "getAllRoomsFromServer");
		var roomServerJid = this.roomAbility.jid;
		
		this._gblMgr.getConnMgr().getStropheConnection().muc.listRooms(roomServerJid, function(stanza){
			// 成功，得到房间的列表
			// 根据报文所说，如果房间数量过多，可以发送过来一个set元素（见XEP0045例5）。
			// 但是我在实际中，新建了50多个房间，还是可以全部过来，没有出现set元素，所以我现在假设，不会过来set元素
			
			XoW.logger.d(this.classInfo + "getAllRoomsFromServer() 获取房间列表成功");
			//先清空所有房间
			this.clearAllRoom();
			var $itemsResult = $(stanza);
			var $items = $("item", $itemsResult);
			$items.each(function(index, item){
				var room = new XoW.Room();
				var roomJid = $(item).attr("jid");
				room.jid = roomJid;
				room.name = $(item).attr("name");
				
				// 请求每个房间具体的信息。
				this.roomInfo(roomJid, function(roomInfoResult){
					// 请求成功后
					room.setConfig(this.roomConfigParser.parse(roomInfoResult));
					
					// 对房间进行保存
					this.addRoom(room);
				}.bind(this), function(error) {
					// 请求失败后
					XoW.logger.e("请求房间信息失败，房间jid为" + roomJid);
				});
			}.bind(this));
			if(successCb) {
				var params = {
					stanza : stanza,
					rooms : this.allRooms,
				};
				successCb(params);
			}
		}.bind(this), function(error) {
			// 失败
			XoW.logger.e("请求房间列表失败");
			// 这里的错误，特定的错误需要再处理
			if(errorCb) {
				errorCb(stanza);
			}
		});
		this.roomReady = true;
		
		XoW.logger.me(this.classInfo + "getAllRoomsFromServer");
		return true;
	},
	
	addRoom : function(_room) {
		var params = {
			oldValue : this.allRooms,
			addValue : _room,
		};
		var roomInMuc = this.getXmppRoom(_room.jid);
		if(roomInMuc) {
			// 如果存在这个这个房间，设置人数。
			_room.occupants = roomInMuc.getOccupantCount();
		}
		this.allRooms.push(_room);
		this.triggerHandlerInRoomMgr('addRoom', params);
	},
	clearAllRoom : function() {
		var params = {
			oldValue : this.allRooms,
		};
		this.allRooms = [];
		this.triggerHandlerInRoomMgr('clearAllRoom', params);
	},
	updateOneRoom : function(_room) {
		XoW.logger.ms(this.classInfo + "updateOneRoom");
		var room = this.getRoomByJid(_room.jid);
		// 存在则更新，不存在则添加
		if(null != room) {
			room.name = _room.name;
			room.config = _room.config;
		} else {
			this.addRoom(_room);
			return;
		}
		/**
		 * 只能传递room的信息，旧的信息不再了。
		 */
		var params = {
			room : room,
		};
		this.triggerHandlerInRoomMgr('updateOneRoom', params);
		XoW.logger.d(this.classInfo + "更新的房间是" + room.jid);
		XoW.logger.me(this.classInfo + "updateOneRoom");
	},
	clearOneRoom : function(roomJid) {
		XoW.logger.ms(this.classInfo + "移除的房间是" + roomJid);
		var removeRoom = null;
		for(var i = 0; i < this.allRooms.length; i++) {
			var room = this.allRooms[i];
			if(room.jid == roomJid) {
				removeRoom = room;
				this.allRooms.splice(i, 1);
			}
		}
		var params = {
			roomJid : roomJid,
			room : removeRoom,
		};
		this.triggerHandlerInRoomMgr('clearOneRoom', params);
		XoW.logger.me(this.classInfo + "移除的房间是" + roomJid);
	},
	
	
	
	/**
     * 回调与触发。
     * @param proName
     * @param callback
     */
    addHandlerToRoomMgr : function(proName, callback) {
    	XoW.logger.ms(this.classInfo + "addHandlerToRoomMgr()");
    	XoW.logger.d(this.classInfo + "添加了一个监听，监听属性： " + proName);
    	this.handler.addHandler(proName, callback);
    	XoW.logger.me(this.classInfo + "addHandlerToRoomMgr()");
    },
    deleteHandlerInRoomMgr : function(id) {
    	XoW.logger.ms(this.classInfo + "deleteHandlerInRoomMgr()");
    	this.handler.deleteHandler(id);
    	XoW.logger.me(this.classInfo + "deleteHandlerInRoomMgr()");
    },
    triggerHandlerInRoomMgr : function(proName, params) {
    	XoW.logger.ms(this.classInfo + "triggerHandlerInRoomMgr()");
    	XoW.logger.d(this.classInfo + "触发的属性是： " + proName);
    	this.handler.triggerHandler(proName, params);
    	XoW.logger.me(this.classInfo + "triggerHandlerInRoomMgr()");
    },
    getAllXmppRoom : function() {
		return this._gblMgr.getConnMgr().getStropheConnection().muc.rooms; 
	},
	getXmppRoom : function(roomJid) {
		return this.getAllXmppRoom()[roomJid];
	},
	getXmppRoomLength : function() {
		// 因为是用键值对来存放的。 所以 .length方法无效了。
		var rooms = this.getAllXmppRoom();
		var length = 0;
		for(var key in rooms) {
			length++;
		}
		return length;
	},
	
	
	/**
	 *判断domain是不是room的 
	 *@params jid 可以是包含domain的jid
	 */
	isRoomDomain : function(jid) {
		var roomServerJid = this.getRoomServerJid();
		if(null == roomServerJid) {
			return false;
		}
		if(XoW.utils.getDomainFromJid(jid) == XoW.utils.getDomainFromJid(roomServerJid)) {
			return true;
		} 
		return false;
	},
	getRoomServerJid : function() {
		// 这边不考虑服务器上有多个会议服务器。
		var roomAbility = this._gblMgr.getServerMgr().getRoomAbility();
		if(null == roomAbility) {
			return null;
		} else {
			return roomAbility.jid;
		}
	},
	getAllRooms : function() {
		return this.allRooms; 
	},
	/**
	 * 从内存中根据jid取得一个房间的数据
	 * @param jid
	 * @returns
	 */
	getRoomByJid : function(jid) {
		XoW.logger.ms(this.classInfo + "getRoomByJid");
		jid = XoW.utils.getBareJidFromJid(jid);
		for(var i = 0; i < this.allRooms.length; i++) {
			var room = this.allRooms[i];
			if(room.jid === jid) {
				XoW.logger.me(this.classInfo + "getRoomByJid有符合条件的room");
				return room;
			}
		}
		XoW.logger.me(this.classInfo + "getRoomByJid没有符合条件的room");
		return null;
	},
	
	getRoomByJidFromLocalOrServer : function(jid, successCb, errorCb) {
		// 如果本地有，就从本地拿，没有就从服务器拿。。
		var room = this.getRoomByJid(jid);
		var params = {};
		if(room) {
			params['room'] = room;
			if(successCb) {
				successCb(params);
			}
		} else {
			this.getRoomByJidFromServer(jid, successCb, errorCb);
		}
	},
	
	/**
	 * 这个和getRoomByJid(jid)相似，只不过那个是取得内存中已有的数据，这个是去服务器再次获取
	 * @param roomJid
	 * @param handleCb
	 * @param errorCb
	 */
	getRoomByJidFromServer : function(roomJid, handleCb, errorCb) {
		// 从服务器中获得一个房间后，
		// 对于allRooms，
		// 如果有这个room，要先清除，再添加，
		// 如果没有，直接添加
		this.roomInfo(roomJid, function(roomInfoResult) {
			// 请求成功后
			// this.clearOneRoom(roomJid);
			
			var room = new XoW.Room();
			room.jid = $(roomInfoResult).attr('from');
			room.setConfig(this.roomConfigParser.parse(roomInfoResult));
			room.name = room.getName();
			
			// 更新房间，存在就更新，不存在就添加
			this.updateOneRoom(room);
			// this.addRoom(room);
//			}.bind(this), function(error) {
//				// 请求失败后
//				XoW.logger.e("请求房间信息失败，房间jid为" + roomJid);
//			});
			var params = {
				stanza : roomInfoResult,
				room : room,
			};
			if(handleCb) {
				handleCb(params);
			}
		}.bind(this), errorCb);
	},
	
	
	/**
	 * 加入房间。
	 * 获得历史消息
	 * 版本一：因为可以获得房间的创建时间，所以这里默认获得自从房间成立之后的消息。{'since' : roomConfig.xInfo[3].value} 
	 * 版本二：获取自房间成立后的消息，这样不合理，可能造成流量浪费，现在只获得最后的10条消息{'maxstanzas' : 10}
	 * @param room 房间jid
	 * @param nick 用户昵称
	 * @param _msgHandlerCb 消息回调
	 * @param _presHandlerCb 出席回调
	 * @param _rosterCb 名册回调
	 * @param password 密码
	 */
	joinRoom : function(roomJid, nick, password) {
		
		XoW.logger.ms(this.classInfo + "joinRoom");
		// 当前用户是否已经在这个房间里面了
		if(this.isCurrentUserAlreadyInRoom(roomJid)) {
			XoW.logger.e("joinRoom 当前用户已在该房间中，加入失败！");
			return false;
		}
		// 获取10条历史数据
		var history = {'maxstanzas' : 10};
		// join(room, nick, msg_handler_cb, pres_handler_cb, roster_cb, password, history_attrs, extended_presence) {
		this._gblMgr.getConnMgr().getStropheConnection().muc
			.join(	roomJid, 
					nick, 
					this._msgHandlerCb.bind(this), 
					this._presHandlerCb.bind(this), 
					this._rosterCb.bind(this), 
					password, 
					history);
		XoW.logger.me(this.classInfo + "joinRoom");
		return true;
	},
	
	saveRoomConfig : function(roomJid, fields, successCb, errorCb) {
		var iq = $iq({
			id : XoW.utils.getUniqueId('saveRoomConfig'),
			type : 'set',
			to : roomJid,
		}).c('query', {
			xmlns : Strophe.NS.MUC_OWNER,
		}).c('x', {
			type : 'submit',
			xmlns : XoW.NS.FORM_DATA,
		})
		.c('field', {
			type : 'hidden',
			'var' : 'FORM_TYPE',
		}).c('value').t('http://jabber.org/protocol/muc#roomconfig').up().up()
		.c('field', {
			'var' : fields['muc#roomconfig_roomname']['var'],
		}).c('value').t(fields['muc#roomconfig_roomname'].value).up().up()
		.c('field', {
			'var' : fields['muc#roomconfig_roomdesc']['var'],
		}).c('value').t(fields['muc#roomconfig_roomdesc'].value).up().up()
		.c('field', {
			type : fields['muc#roomconfig_changesubject'].type,
			'var' : fields['muc#roomconfig_changesubject']['var'],
		}).c('value').t(fields['muc#roomconfig_changesubject'].value).up().up()
		.c('field', {
			type : fields['muc#roomconfig_publicroom'].type,
			'var' : fields['muc#roomconfig_publicroom']['var'],
		}).c('value').t(fields['muc#roomconfig_publicroom'].value).up().up()
		.c('field', {
			type : fields['muc#roomconfig_persistentroom'].type,
			'var' : fields['muc#roomconfig_persistentroom']['var'],
		}).c('value').t(fields['muc#roomconfig_persistentroom'].value).up().up()
		.c('field', {
			type : fields['muc#roomconfig_moderatedroom'].type,
			'var' : fields['muc#roomconfig_moderatedroom']['var'],
		}).c('value').t(fields['muc#roomconfig_moderatedroom'].value).up().up()
		.c('field', {
			type : fields['muc#roomconfig_membersonly'].type,
			'var' : fields['muc#roomconfig_membersonly']['var'],
		}).c('value').t(fields['muc#roomconfig_membersonly'].value).up().up()
		.c('field', {
			type : fields['muc#roomconfig_allowinvites'].type,
			'var' : fields['muc#roomconfig_allowinvites']['var'],
		}).c('value').t(fields['muc#roomconfig_allowinvites'].value).up().up()
		.c('field', {
			type : fields['muc#roomconfig_passwordprotectedroom'].type,
			'var' : fields['muc#roomconfig_passwordprotectedroom']['var'],
		}).c('value').t(fields['muc#roomconfig_passwordprotectedroom'].value).up().up()
		.c('field', {
			type : fields['muc#roomconfig_roomsecret'].type,
			'var' : fields['muc#roomconfig_roomsecret']['var'],
		}).c('value').t(fields['muc#roomconfig_roomsecret'].value).up().up()
		.c('field', {
			type : fields['muc#roomconfig_enablelogging'].type,
			'var' : fields['muc#roomconfig_enablelogging']['var'],
		}).c('value').t(fields['muc#roomconfig_enablelogging'].value).up().up()
		.c('field', {
			type : fields['x-muc#roomconfig_reservednick'].type,
			'var' : fields['x-muc#roomconfig_reservednick']['var'],
		}).c('value').t(fields['x-muc#roomconfig_reservednick'].value).up().up()
		.c('field', {
			type : fields['x-muc#roomconfig_canchangenick'].type,
			'var' : fields['x-muc#roomconfig_canchangenick']['var'],
		}).c('value').t(fields['x-muc#roomconfig_canchangenick'].value).up().up()
		.c('field', {
			type : fields['x-muc#roomconfig_registration'].type,
			'var' : fields['x-muc#roomconfig_registration']['var'],
		}).c('value').t(fields['x-muc#roomconfig_registration'].value).up().up()
		.c('field', {
			type : fields['muc#roomconfig_maxusers'].type,
			'var' : fields['muc#roomconfig_maxusers']['var'],
		}).c('value').t(fields['muc#roomconfig_maxusers'].value).up().up()
		.c('field', {
			type : fields['muc#roomconfig_whois'].type,
			'var' : fields['muc#roomconfig_whois']['var'],
		}).c('value').t(fields['muc#roomconfig_whois'].value).up().up();
		
		iq.c('field', {
			type : fields['muc#roomconfig_presencebroadcast'].type,
			'var' : fields['muc#roomconfig_presencebroadcast']['var'],
		});
		for(var i = 0; i < fields['muc#roomconfig_presencebroadcast'].value.length; i++) {
			iq.c('value').t(fields['muc#roomconfig_presencebroadcast'].value[i]).up();
		}
		iq.up().c('field', {
			type : fields['muc#roomconfig_roomadmins'].type,
			'var' : fields['muc#roomconfig_roomadmins']['var'],
		});
		for(var i = 0; i < fields['muc#roomconfig_roomadmins'].value.length; i++) {
			iq.c('value').t(fields['muc#roomconfig_roomadmins'].value[i]).up();
		}
		iq.up().c('field', {
			type : fields['muc#roomconfig_roomowners'].type,
			'var' : fields['muc#roomconfig_roomowners']['var'],
		});
		for(var i = 0; i < fields['muc#roomconfig_roomowners'].value.length; i++) {
			iq.c('value').t(fields['muc#roomconfig_roomowners'].value[i]).up();
		}
		
		this._gblMgr.getConnMgr().sendIQ(iq, successCb, errorCb);
		
	},
	
	getRoomConfig : function(roomJid, successCb, errorCb) {
		XoW.logger.ms(this.classInfo + "getRoomConfig");
		var iq = $iq({
			id : XoW.utils.getUniqueId('roomConfig'),
			to : roomJid,
			type : 'get',
		}).c('query', {
			xmlns : Strophe.NS.MUC_OWNER,
		});
		XoW.logger.me(this.classInfo + "getRoomConfig");
		// 返回id。。。
		return this._gblMgr.getConnMgr().sendIQ(iq, function(stanza) {
			
			var $stanza = $(stanza);
			var fields = [];
			$('field', $stanza).each(function(index, item) {
				var $item = $(item);
				if($item.attr('var')) {
					// muc#roomconfig_roomname	房间名
					//  muc#roomconfig_roomdesc	房间描述
					//  muc#roomconfig_changesubject	能否改变
					// muc#roomconfig_publicroom	是否是公开房间
					//  muc#roomconfig_persistentroom	是否是持久房间
					// muc#roomconfig_moderatedroom	
					// muc#roomconfig_membersonly
					//  muc#roomconfig_allowinvites
					// muc#roomconfig_passwordprotectedroom
					// muc#roomconfig_roomsecret
					// muc#roomconfig_enablelogging 
					// x-muc#roomconfig_reservednick
					// x-muc#roomconfig_canchangenick
					// x-muc#roomconfig_registration
					// muc#roomconfig_maxusers
					// muc#roomconfig_presencebroadcast
					// muc#roomconfig_whois
					// muc#roomconfig_roomadmins
					// muc#roomconfig_roomowners
					
					switch($item.attr('var')) {
						case 'muc#roomconfig_roomname' :
						case 'muc#roomconfig_roomdesc' : 
						case 'muc#roomconfig_changesubject' : 
						case 'muc#roomconfig_publicroom' : 
						case 'muc#roomconfig_persistentroom' : 
						case 'muc#roomconfig_moderatedroom' : 
						case 'muc#roomconfig_membersonly' : 
						case 'muc#roomconfig_allowinvites' : 
						case 'muc#roomconfig_passwordprotectedroom' : 
						case 'muc#roomconfig_roomsecret' : 
						case 'muc#roomconfig_enablelogging' : 
						case 'x-muc#roomconfig_reservednick' : 
						case 'x-muc#roomconfig_canchangenick' : 
						case 'x-muc#roomconfig_registration' : 
							fields[$item.attr('var')] = {
								'var' : $item.attr('var'),
								type : $item.attr('type'),
								label : $item.attr('label'),
								value : $('value', $item).text(),
							};
							break;
						case 'muc#roomconfig_maxusers' : 
						case 'muc#roomconfig_whois' :
							
							options = [];
							$item.find('option').each(function(index2, option) {
								var $option = $(option);
								options.push({
									label :  $option.attr('label'),
									value : $('value', $option).text(),
								});
							});
							fields[$item.attr('var')] = {
								'var' : $item.attr('var'),
								type : $item.attr('type'),
								label : $item.attr('label'),
								value : $item.children('value').text(),
								options : options,
							};
							break;
						case 'muc#roomconfig_presencebroadcast' : 
							options = [];
							$item.find('option').each(function(index2, option) {
								var $option = $(option);
								options.push({
									label :  $option.attr('label'),
									value : $('value', $option).text(),
								});
							});
							values = [];
							$item.children('value').each(function(index2, value) {
								values.push($(value).text());
							});
						 	fields[$item.attr('var')] = {
									'var' : $item.attr('var'),
									type : $item.attr('type'),
									label : $item.attr('label'),
									value : values,
									options : options,
							};
							break;
						case 'muc#roomconfig_roomadmins' : 
						case 'muc#roomconfig_roomowners' : 
							values = [];
							$item.children('value').each(function(index2, value) {
								values.push($(value).text());
							});
							fields[$item.attr('var')] = {
								'var' : $item.attr('var'),
								type : $item.attr('type'),
								label : $item.attr('label'),
								value : values,
							};
							break;
					}
				}
			});
			if(successCb) {
				var params = {
					stanza : stanza,
					fields : fields,
				};
				successCb(params);
			}
		}, errorCb);
	},
	
	/**
	 * 判断当前用户是否已经在这个room中。
	 * @param roomJid
	 * @returns {Boolean}
	 */
	isCurrentUserAlreadyInRoom : function(roomJid) {
		if(null != this.getXmppRoom(roomJid)) {
			return true;
		} else {
			return false;
		}
	},
	
	/**
	 * room的消息回调
	 */
	_msgHandlerCb : function(stanza, room) {
		// 暂时知道的
		// groupchat 1,房间信息 type=groupchat from=roomJid/对方昵称 to=我的全jid
		// chat		 2,房间内的私聊信息 type=chat from=roomJid/对方昵称 to=我的全jid
		// invite 	 3,邀请进入房间的信息 其中包含 <invite  不处理
		// decline	 4,邀请拒绝， 其中包含  <decline 
		// chatstat  5,聊天状态，不处理
		
		XoW.logger.d(this.classInfo + "_msgHandlerCb");
		XoW.logger.d(this.classInfo + "房间jid " + room.name + "    用户nick" + room.nick);
		// 
		var $msg = $(stanza);
		var type = $msg.attr('type');
		var msg = {
			id : '',
			from : '', // 房间名称/发消息的用户的昵称
			to : '', // 我的全jid
			time : '', // 发送时间
			
			isMeSend : false,
			type : '', // chat,groupchat,decline,invite
			contentType : '', // groupchat才有：msg和delayMsg 
			body : '', // 消息内容
			inviteFrom : '', // 邀请者
			declineFrom : '', // 拒绝者
			reason : '', // 邀请拒绝的原因
		};
		msg.id = $msg.attr('id');
		msg.from = $msg.attr('from');
		msg.to = $msg.attr('to');
		msg.time =  XoW.utils.getCurrentDatetime();
		
		switch (type) {
			case 'chat' :
				// 来自群组的私聊
				if(!$('body', $msg).length) {
					XoW.logger.d(this.classInfo + "是chatstate不处理");
					return true;
				}
				
				msg.type = 'chat';
				msg.body = $('body', $msg).html();
				
				break;
			case 'groupchat' :
				msg.type = 'groupchat';
				
				msg.contentType = 'msg';
				if($('delay', $msg).length) {
					msg.contentType = 'delayMsg';
					msg.time = XoW.utils.getFromatDatetime($('delay', $msg).attr('stamp'));
				} else {
					// 如果不是历史消息，并且，我的nick=from的res，那么就可以判断这个消息是我发的。
					if(XoW.utils.getResourceFromJid(msg.from) == room.nick) {
						msg.isMeSend = true;
					}
				}
				msg.body = $('body', $msg).html();
				// 群组消息
				break;
			default :
				// 其他消息，即拒绝和邀请
				if($('invite', $msg).length) {
					msg.type = 'invite';
					msg.inviteFrom = $('invite', $msg).attr('from');
					msg.reason = $('reason', $msg).text();
				} else if ($('decline', $msg).length) {
					msg.type = 'decline';
					msg.declineFrom = $('decline', $msg).attr('from');
					msg.reason = $('reason', $msg).text();
				} else {
					XoW.logger.e(this.classInfo + '未知类型');
				}
				break;
		}
		
		if(msg.type) {
			var params = {
				msg : msg,
				stanza :stanza,
				room : room,
			};
			XoW.logger.d("收到一个消息 类型是"  + msg.type);
			this.triggerHandlerInRoomMgr('message', params);
		}
		
		/*
		var from = XoW.utils.getResourceFromJid($msg.attr('from'));
		var bodyContent = null;
		if($('body', $msg).length > 0) {
			bodyContent = $('body', $msg).html();
		}
		var delayTime = null; 
		if($('delay', $msg).length > 0) {
			delayTime = XoW.utils.getFromatDatetime($('delay', $msg).attr('stamp'));
		}
		
		var message = new XoW.RoomMessage();
		var type = $msg.attr('type');
		if(null == from) {
			// 如果没有Nick，可能是
			// 1，房间发送给我的invite
			// 如果在这里我能接收到邀请我进入该房间的，那说明我已经在这个房间里了，不用在多做处理了。
			// 2，我邀请别人进入房间别人拒绝了
			// 如果是别人拒绝了我的邀请，我应该显示
			
			var decline = null;
			if($('decline', $msg).length > 0) {
				
				var declineParams = {
					from : $('decline', $msg).attr('from'),
					reason : $('reason', $msg).text()
				};
				message.setRoomMessage(room, null, null, null, 'me', 'decline', declineParams);
			} else {
				return true;
			}
		} else {
			// 需要判断一下发过来的消息
			if(room.nick === from && delayTime == null) {
				// 发消息的是自己，并且不是历史消息。则说明是自己发送的消息
				// 现在的假设是，如果在聊天室中，自己改名了，room.nick也会改成后来的nick，到时候要测试一下
				XoW.logger.d("我自己发送的消息");
				message.setRoomMessage(room, from, bodyContent, delayTime, 'me', type);
				// this.popMessageToGroupChat(room, from, bodyContent, delayTime, 'me');
			} else if(null != bodyContent){
				// 历史消息，都认为是别人消息。
				XoW.logger.d("别人的消息以及历史消息");
				// this.popMessageToGroupChat(room, from, bodyContent, delayTime);
				message.setRoomMessage(room, from, bodyContent, delayTime, '', type);
				
			} 
		}
		*/
		// this.triggerHandler('message', {'message' : message, 'stanza' : stanza, 'room' : room});
		
		return true;
		
	},
	
	_presHandlerCb : function(stanza, room) {
		XoW.logger.w(this.classInfo + "_presHandlerCb" + room.name + "   " + room.nick);
		// XoW.logger.w(this.classInfo + XoW.utils.xmlescape(stanza));
		// 这里实现 xxx加入房间;xxx修改nick；xxx离开房间
		

		var roomPresence = new XoW.RoomPresence();
		var $stanza = $(stanza);
		var presence = XmppRoom._parsePresence(stanza);
		var me = room.nick;
		if('error' === presence.type) {
			XoW.logger.w(this.classInfo + " 错误" + presence.errorcode);
			roomPresence.type = 'error';
			roomPresence.errorCode = presence.errorcode;
			// 这边有个bug就是，我调用join方法，strophe.muc.js就会将我要加入的这个房间
			// 放到 rooms[]中，并把roomJid放到 roomNames中。我需要将其清除。
			// 清除的依据是，如果这个房间中的roster一个人都没有。那么就说明这个房间没有人，可以删之。
			room.clearWrongRoom();
			
			// 产生错误了
			switch(presence.errorcode) {
				case '401' : 
					// XoW.logger.w("未提供密码或者密码错误！");
					// this.groupChatSystemMsg("未提供密码或者密码错误！", room);
					roomPresence.message = "未提供密码或者密码错误！"; 
					break;
				case '403' : 
					// XoW.logger.w("您已被禁止进入该房间！");
					// this.groupChatSystemMsg("您已被禁止进入该房间！", room);
					roomPresence.message = "您已被禁止进入该房间！"; 
					break;
				case '407' : 
					// XoW.logger.w("该房间仅限会员进入！");
					// this.groupChatSystemMsg("该房间仅限会员进入！", room);
					roomPresence.message = "该房间仅限会员进入！"; 
					break;
				case '409' : 
					XoW.logger.w("该用户名已被该聊天室中其他人使用！");
					// this.groupChatSystemMsg("用户名[" + room.nick + "]已被该聊天室中其他人使用，请重新输入一个用户名！", room);
					roomPresence.message = "用户名[" + room.nick + "]已被该聊天室中其他人使用，请重新输入一个用户名！";
					
					// 关于昵称冲突的情况有两种，第一种是，进入房间时设置的昵称冲突
					// <presence xmlns="jabber:client" from="lxy2的小房间@conference.user-20160421db/lxy2" to="lxy@user-20160421db/6d0jqjpl28" type="error"><x xmlns="http://jabber.org/protocol/muc"><history maxstanzas="10"/><password/></x><error code="409" type="cancel"><conflict xmlns="urn:ietf:params:xml:ns:xmpp-stanzas"/></error></presence>
					// 第二种是已经在房间中，修改昵称时的冲突
					// <presence xmlns="jabber:client" from="lxy2的小房间@conference.user-20160421db/lxy2" to="lxy@user-20160421db/6d0jqjpl28" id="69a60693-19e4-40a0-9d15-0737a1b87b3b" type="error"><error code="409" type="cancel"><conflict xmlns="urn:ietf:params:xml:ns:xmpp-stanzas"/></error></presence>
					// 这两种报文是一样的，虽然一个有<x/>一个没有，但是不能以这个作为区分的标准吧。
					break;
				case '503' : 
					// XoW.logger.w("该聊天室已达到最大人数，您无法进入！");
					// this.groupChatSystemMsg("该聊天室已达到最大人数，您无法进入！", room);
					roomPresence.message = "该聊天室已达到最大人数，您无法进入！"; 
					break;
				default : 
					// this.groupChatSystemMsg("未知错误，错误类型" + presence.error + ",错误代码" + presence.errorcode, room);
					// XoW.logger.w("未知错误，错误类型" + presence.error + ",错误代码" + presence.errorcode);
					roomPresence.message = "未知错误，错误类型" + presence.error + ",错误代码" + presence.errorcode;
					break;
			}
		} else {
			// 得到房间
			var r =  this.getRoomByJid($stanza.attr('from'));
			// 在新建room的时候，我的内存中是不存在这个room的信息的，所以后面无法继续
			// 那，是要去请求该房间的信息？还是说，这种找不到房间的情况仅有新建room的时候？
			if(!r) {
				// 房间不存在，已知情况
				// 1，我自己新建的房间，收到了一开始的presence，由于还没有从服务器上去该房间的信息，或者干脆说这个
				// 时候还没有这个房间的信息。而且这个包含<status code='210'>的presence节也不在这里处理。
				return;
			}
			XoW.logger.d(this.classInfo + " 正常的消息节，来自房间" + r.jid);
			
			// 因为使用了strophe.muc.js插件，我无法区分当前的出席节是 改变状态还是进入房间。就这二者无法区分
			// 所以在room中定义了一个occupants来记录上次该分组中有多少人，如果改变了，则说明是进来人了
			// 否则就是状态的改变
			var roomOccupants = 0;
			var isInOrOut = false;
			for(var key in room.roster) {
				roomOccupants++;
			}
			XoW.logger.d(this.classInfo + " 房间原人数" + r.occupants + "  现在人数" + roomOccupants);
			if(r.occupants != roomOccupants) {
				isInOrOut = true;
				r.occupants = roomOccupants;
			}
			
			if(presence.states.length) { 
				XoW.logger.d(presence.states);
				// 因为可能存在多个states
				if(-1 != presence.states.indexOf('303')) {
					// 修改昵称
					// roomPresence.type = 'changeNick';
					XoW.logger.d("有人改名了，从 " + presence.nick + " 改成了 " + presence.newnick);
					// this.groupChatSystemMsg('[' + presence.nick +']将昵称改成了[' + presence.newnick + ']', room);
					roomPresence.message = '[' + presence.nick +']将昵称改成了[' + presence.newnick + ']';
					
				} else if(-1 != presence.states.indexOf('301')) {
					room.clearWrongRoom();
					// 有人下线了 1，可能是被T出去。 2，自己主动退出房间
					XoW.logger.d(presence.nick + "被禁止进入此房间");
					// roomPresence.type = 'unavailable';
					if(me == presence.nick) {
						roomPresence.message = '你被禁止进入此聊天室';
					} else {
						roomPresence.message = '[' + presence.nick + ']被禁止进入此聊天室';
					}
				} else if(-1 != presence.states.indexOf('307')) {
					room.clearWrongRoom();
					// 有人下线了 1，可能是被T出去。 2，自己主动退出房间
					XoW.logger.d(presence.nick + "被踢出此房间");
					// roomPresence.type = 'unavailable';
					if(me == presence.nick) {
						roomPresence.message = '你被踢出此聊天室';
					} else {
						roomPresence.message = '[' + presence.nick + ']被踢出此聊天室';
					}
				} else if(-1 != presence.states.indexOf('110')) {
					
					if(-1 != presence.states.indexOf('201')) {
						
					} else {
						// 修改昵称
						// roomPresence.type = 'changeNick';
						XoW.logger.d("自己进入房间");
						// this.groupChatSystemMsg('[' + presence.nick +']将昵称改成了[' + presence.newnick + ']', room);
						roomPresence.message = '你已进入该房间';
					}
					
				} else {
					XoW.logger.d(presence.nick + "未知states" + presence.states);
					
				}
//			else if() {
//				
//			}
			
			/*
			if(null !== presence.newnick) {
				// 修改昵称
//				roomPresence.type = 'changeNick';
//				XoW.logger.d("有人改名了，从 " + presence.nick + " 改成了 " + presence.newnick);
//				// this.groupChatSystemMsg('[' + presence.nick +']将昵称改成了[' + presence.newnick + ']', room);
//				roomPresence.message = '[' + presence.nick +']将昵称改成了[' + presence.newnick + ']';
			} else if('unavailable' === presence.type){
				// 有人下线了
				// 1，可能是被T出去。 2，自己主动退出房间
				roomPresence.type = 'unavailable';
				//XoW.logger.w("有人下线了" + presence.nick);
				// this.groupChatSystemMsg('[' + presence.nick + ']退出了聊天室', room);
				
				var $actor = $stanza.find('actor');
				
				if($actor.length > 0) {
					var aj = $actor.attr('jid');
					// var aj = '房间管理员';
					// 被人T出去的
					for(var i = 0; i < presence.states.length; i++) {
						if(301 == presence.states[i]) {
							room.clearWrongRoom();
							roomPresence.message = '['+ aj +']禁止你进入此聊天室';
							break;
						} else if(307 == presence.states[i]) {
							room.clearWrongRoom();
							roomPresence.message = '['+ aj +']将你踢出此聊天室';
							break;
						} else {
							roomPresence.message = '未知代码：' + presence.states[i];
						}
					}
				} else {
					roomPresence.message = '[' + presence.nick + ']退出了聊天室';
				}
			} else if(null == presence.status && null == presence.priority && null == presence.show) {
				// 有人进入了房间
				// this.groupChatSystemMsg('[' + presence.nick + ']加入了聊天室', room);
				// XoW.logger.w("有人加入了聊天室" + presence.nick);
				roomPresence.message = '[' + presence.nick + ']加入了聊天室';
				
				// 因为一个开始自己加入该房间的时候，也会提示自己进入该房间了，即成功进入房间
				// 所以在这里对  ’加入该房间‘ 按钮进行清除
				// var div = '#' + XoW.utils.escapeJquery(room.name) + '.layim_chatsay div[id="layim_joinRoom"]';
				// $(div).remove();
			}
			*/
			} else {
				// 没有states
				if('unavailable' === presence.type){ 
					XoW.logger.d(presence.nick + "退出了房间");
					roomPresence.message = '[' + presence.nick + ']退出了聊天室';
				} else if(isInOrOut){
					XoW.logger.d(presence.nick + "加入了房间");
					roomPresence.message = '[' + presence.nick + ']加入了聊天室';
				} else {
					XoW.logger.d(presence.nick + "更改了状态");
				}
			}
		} 
		// 上面的一些错误，被ban出房间，kick处房间的时候，需要把自己不在的room从rooms中清除
		// this.triggerHandler('presence', {'presence' : roomPresence, 'stanza' : stanza, 'room' : room});
		var params = {
			presence : roomPresence,
			stanza : stanza,
			room : room,
		};
		this.triggerHandlerInRoomMgr('presence', params);
		return true;
	},
	_rosterCb : function(stanza, room) {
		
		var params = {
			stanza : stanza,
			room : room,
		};
		this.triggerHandlerInRoomMgr('roster', params);
		// this.triggerHandler('roster', {'stanza' : stanza, 'room' : room});
		return true;
	},
	
	createRoom : function(roomJid, nick, from, successCb, errorCb) {
		
//		var pres = $pres({from : from,
//			to : roomJid + "/" + nick
//		}).c('x', {
//			xmlns : Strophe.NS.MUC
//		});
//		
		// var user = this._gblMgr.getCurrentUser();
		// this._gblMgr.getConnMgr().addHandler(this._roomCreateCb.bind(this), Strophe.NS.MUC_USER, "presence");
		this._gblMgr.getConnMgr().addHandler(function(stanza) {
			XoW.logger.ms(this.classInfo + "创建房间回调");
			var pre = XmppRoom._parsePresence(stanza);
			if(pre.states) {
				if(-1 != pre.states.indexOf('201')) {
					XoW.logger.d(this.classInfo + "创建房间成功");
					var roomJid = XoW.utils.getBareJidFromJid($(stanza).attr('from'));
					
//					var iq = $iq({
//						id : XoW.utils.getUniqueId('createRoom'),
//						type : 'get',
//						to : roomJid,
//					}).c('query', {
//						xmlns : Strophe.NS.MUC_OWNER
//					});
//					this._gblMgr.getConnMgr().send(iq);
					
					var iq = $iq({
						id : XoW.utils.getUniqueId('instantRoom'),
						type : 'set',
						from : from,
						to : roomJid,
					}).c('query', {
						xmlns : Strophe.NS.MUC_OWNER
					}).c('x', {
						xmlns : XoW.NS.FORM_DATA,
						type : 'submit',
					});
					this._gblMgr.getConnMgr().sendIQ(iq, function(stanza) {
						XoW.logger.d('创建即使房间提交成功');
						var params = {
							stanza : stanza,
							roomJid : roomJid,
							nick : nick,
						};
						if(successCb) {
							XoW.logger.d('调用回调');
							successCb(params);
						}
					}, errorCb);
				}
			} else {
				
			}
			XoW.logger.me(this.classInfo + "_roomCreateCb");
			
		}.bind(this), Strophe.NS.MUC_USER, "presence", null, null, roomJid + "/" + nick);
		
		// 这里使用 room的joinRoom方法来加入房间
//		this._gblMgr.getConnMgr().send(pres);
		this.joinRoom(roomJid, nick);
		
	},
	
	/**
	 * 创建房间和下面_roomInviteCb的情况很像，因为当时还没有把这个房间放进strophe.muc.js的room里。
	 */
	_roomCreateCb : function(stanza) {
		XoW.logger.ms(this.classInfo + "_roomCreateCb");
		var pre = XmppRoom._parsePresence(stanza);
		if(pre.states) {
			if(-1 != pre.states.indexOf('201')) {
				XoW.logger.d(this.classInfo + "创建房间");
				var user = this._gblMgr.getCurrentUser();
				var roomJid = XoW.utils.getBareJidFromJid($(stanza).attr('from'));
				
				var iq = $iq({
					id : XoW.utils.getUniqueId('createRoom'),
					type : 'get',
					to : roomJid,
				}).c('query', {
					xmlns : Strophe.NS.MUC_OWNER
				});
				this._gblMgr.getConnMgr().send(iq);
				
//				var iq = $iq({
//					id : XoW.utils.getUniqueId('createRoom'),
//					type : 'set',
//					from : user.getFullJid(),
//					to : roomJid,
//				}).c('query', {
//					xmlns : Strophe.NS.MUC_OWNER
//				}).c('x', {
//					xmlns : XoW.NS.FORM_DATA,
//					type : 'submit',
//				});
//				this._gblMgr.getConnMgr().send(iq);
				
				
			} else {
				// 该房间已经存在，，，，这样就直接进入房间？
				
			}
		}
		XoW.logger.me(this.classInfo + "_roomCreateCb");
	},
	
	/**
	 * 因为，在strophe.muc.js中的room，是只有我在进入之后，才会接收到那个room的消息
	 * 因为用了joinRoom(回调)的方式，
	 * 所以，对于邀请的消息，我只能在这里设置这个方法来监听是否有人邀请我进入某个会议。
	 * 而对于msgHandlerCb里面的邀请，能收到说明我已经在那个房间里了。不用处理。
	 */
	_roomInviteCb : function(stanza) {
		XoW.logger.ms(this.classInfo + "_roomInviteCb()");
		
		var $stanza = $(stanza);
		var $invite = $('invite', $stanza);
		
		if($invite.length == 0) {
			XoW.logger.w(this.classInfo + "_roomInviteCb 不是邀请节，返回");
			return;
		} 
		XoW.logger.w(this.classInfo + "_roomInviteCb 邀请我加入一个会议室");
		
//		var roomInviteInfo = new XoW.RoomInviteInfo();
//		// id, jid1, from1,pwd1, reason1, time1
//		roomInviteInfo.setInfo(XoW.utils.getUniqueId('roomInvite'), 
//				$stanza.attr('from'), 
//				$invite.attr('from'),
//				$password.html(), 
//				$reason.html(), 
//				XoW.utils.getCurrentDatetime()
//		);
		
		if(this.isCurrentUserAlreadyInRoom($stanza.attr('from'))) {
			XoW.logger.w(this.classInfo + "_roomInviteCb用户已在该房间中，不做处理");
		} else {
			var $password = $('password', $stanza);
			var $reason = $('reason', $invite);
			XoW.logger.w(this.classInfo + "_roomInviteCb 用户还没有在这个房间里");
			var roomInviteInfo = new XoW.Info();
			roomInviteInfo.type = 'invite';
			roomInviteInfo.id = XoW.utils.getUniqueId('invite');
			roomInviteInfo.time = XoW.utils.getCurrentDatetime();
			roomInviteInfo.status = 'untreated';
			roomInviteInfo.from = $stanza.attr('from');
			roomInviteInfo.to = $stanza.attr('to');
			roomInviteInfo.params = {
				inviteFrom : $invite.attr('from'),
				reason : $reason.text(),
				password : $password.text(),
			};
			var params = {
				stazna : stanza,
				info : roomInviteInfo,
			};
			this.triggerHandlerInRoomMgr('invite', params);
			
			// 否则将消息放入infos中。
			// this.infos.push(roomInviteInfo);
			// this.triggerHandler('invite', {'roomInviteInfo' : roomInviteInfo, 'stanza' : stanza});
			// this.addInfo(roomInviteInfo, stanza);
		}
		
		XoW.logger.me(this.classInfo + "_roomInviteCb()");
		return true;
	},
	
	
	
	/**
	 * @params content 内容
	 * @params toJid发送给谁， 以 room@domain/resouce的方式
	 */
	sendRoomPrivateMessage : function(content, toJid) {		
		// 根据roomJid得到room，然后调用room的发送方法发送消息。
		XoW.logger.ms(this.classInfo + "sendRoomPrivateMessage");

		var roomJid = XoW.utils.getBareJidFromJid(toJid);
		var nick = XoW.utils.getResourceFromJid(toJid);
//		getNodeFromJid: function (jid) {
//	    	return Strophe.getNodeFromJid(jid);
//	    },
//	    getDomainFromJid : function(jid) {
//	    	return Strophe.getDomainFromJid(jid);
//	    },
//	    getResourceFromJid 
		var room = this.getXmppRoom(roomJid);
		if(null == room) {
			XoW.logger.e(this.classInfo + "sendRoomPrivateMessage  房间不存在，不发送");
			// 房间不存在，不发送
			return false;
		}
		// (nick, message, html_message, type) {
		room.message(nick, content, null, 'chat');
		XoW.logger.me(this.classInfo + "sendRoomPrivateMessage");
		return true;
	},
	
	
	/**
	 * 因为将状态改为隐身，导致的离开所有的房间，在这里进行处理.
	 * 。。因为设置隐身，也会导致离开房间。而隐身的发送，以及离开房间节的发送。好像有点问题，故而设置一个timeout
	 */
	leaveAllXmppRoom : function() {
		setTimeout(function() {
			var xmppRooms = this.getAllXmppRoom();
			for (var key in xmppRooms) {
				XoW.logger.d(this.classInfo + "离开房间" + key);
				xmppRooms[key].leave();
			}
		}.bind(this), 500);
	},
	
	leaveOneXmppRoom : function(roomJid) {
		this.getXmppRoom(roomJid).leave();
	},
	
	
	/**
	 * 拒绝邀请，因为strophe.muc.js里面没有拒绝邀请的方法。。
	 */
	denyInvite : function(roomJid, inviteFrom) {
		
		// coven@chat.shakespeare.lit"代表聊天室.
		// Room Nickname 	Full JID 	Affiliation
		// firstwitch 	crone1@shakespeare.lit/desktop 	Owner
		// secondwitch 	wiccarocks@shakespeare.lit/laptop 	Admin
		// thirdwitch 	hag66@shakespeare.lit/pda 	None 
		var denyInvite = $msg({from : this._gblMgr.getCurrentUser().getJid(), 
			to : roomJid
		}).c('x', {xmlns : Strophe.NS.MUC_USER
		}).c('decline', {to : inviteFrom
		}).c('reason').t('抱歉，我不加入会议！');
							
		this._gblMgr.getConnMgr().send(denyInvite);
	},
	

	/**
	 * 得到能干什么的列表
	 * @param roomInMuc muc中保存的room
	 * @param room   我自己定义在RoomManager中的room
	 * @param theOther 对方，我要进行权限操作的人
	 */
	canDoList : function(roomInMuc, room, theOther) {
		// 得到本人
		var me = roomInMuc.roster[roomInMuc.nick];
		
		var privilegeList = [];
		/*
		 * 自己的
		 * changeNick 更改昵称（无条件）
		 * inviteOthers 邀请其他人（无条件）
		 * requestVoice 请求发言权（在一个被主持的房间，自己没有发言权）
		 * 
		 * 别人的
		 * sendPrivateMessage 发送私有信息（无条件）
		 * kick 踢人（自己是一个主持人，对方不是amdin,onwer,moderator）
		 */
		
		if(me.nick === theOther.nick) {
			// 是自己对自己要进行的操作
			privilegeList.push('changeNick');
			privilegeList.push('inviteOthers');
			// 这个还需要进行判断，判断原来是不是没有发言权
			if(!room.isUnmoderated()) {
				// 在一个被主持的房间
				if("moderator" !== me.role || "participant" !== me.role) {
					// 并且自己不是一个参与者或者主持人（则说明自己没有发言权）
					privilegeList.push('requestVoice');
				}
			}
		} else {
			privilegeList.push('sendPrivateMessage');
			
			// 主持人独有的权限
			if('moderator' === me.role) {
				// 自己是一个主持人，对方不是amdin,onwer,moderator。才能踢
				if(theOther.role != 'moderator' && ('admin' !== theOther.affiliation || 'owner' !== theOther.affiliation)) {
					privilegeList.push('kick');
				}
				
				// 这个还需要进行判断，判断原来是不是没有发言权
				if(!room.isUnmoderated()) {
					// 在一个被主持的房间
					if("visitor" === theOther.role || "none" === theOther.role) {
						// 并且对方不是一个参与者或者主持人（则说明对方没有发言权）
						privilegeList.push('voice');
					}
				}
			}
			// 管理员有的权限，所有者也能有。
			
			if('owner' === me.affiliation) {
				// 如果自己是个拥有者
				if('owner' === theOther.affiliation) {
					// 对方也是个拥有者，
					// 注：回收所有者权限，对方会变成管理员，回收管理员权限，对方会变成member
					// 回收member才成为none
					// 1，则可以回收对方的拥有者权限
					// 2，授予管理员（可行吗？）
					// 3，授予成员（可行吗）
					// 4，设置为none（即回收管理员权限）
					
					privilegeList.push('revokeOwner');
					privilegeList.push('admin');
					privilegeList.push('member');
					privilegeList.push('none');
					
				} else if('admin' === theOther.affiliation) {
					// 对方是个管理员
					// 1，则可以授予拥有者
					// 2，回收管理员权限
					// 3，授予成员
					// 4，设置为none
					// 5，对方是主持人则可以撤销，不是则不能撤销
					privilegeList.push('owner');
					privilegeList.push('revokeAdmin');
					privilegeList.push('member');
					privilegeList.push('none');
					if('moderator' === theOther.affiliation) {
						privilegeList.push('revokeModerator');
					} else {
						privilegeList.push('moderator');
					}
				} else if('member' === theOther.affiliation) {
					// 对方是个成员
					// 1，则可以授予拥有者
					// 2，授予管理员
					// 3，回收成员
					// 4，设置为none
					// 5，可以禁止用户
					// 6，对方是主持人则可以撤销，不是则不能撤销
					privilegeList.push('owner');
					privilegeList.push('admin');
					privilegeList.push('revokeMember');
					privilegeList.push('none');
					privilegeList.push('ban');
					if('moderator' === theOther.affiliation) {
						privilegeList.push('revokeModerator');
					} else {
						privilegeList.push('moderator');
					}
				} else if('none' === theOther.affiliation) {
					// 对方是个none
					// 1，则可以授予拥有者
					// 2，授予管理员
					// 3，授予成员
					// 4，对方是主持人则可以撤销，不是则不能撤销
					privilegeList.push('owner');
					privilegeList.push('admin');
					privilegeList.push('member');
					privilegeList.push('ban');
					if('moderator' === theOther.affiliation) {
						privilegeList.push('revokeModerator');
					} else {
						privilegeList.push('moderator');
					}
				} 
			} else if('admin' === me.affiliation) {
				// 如果自己是个管理员
				if('owner' === theOther.affiliation) {
					// 对方是个拥有者，

				} else if('admin' === theOther.affiliation) {
					// 对方是个管理员

				} else if('member' === theOther.affiliation) {
					// 对方是个成员
					// 1，回收成员
					// 2，设置为none
					// 3，可以禁止用户
					// 4，对方是主持人则可以撤销，不是则不能撤销
					privilegeList.push('revokeMember');
					privilegeList.push('none');
					privilegeList.push('ban');
					if('moderator' === theOther.affiliation) {
						privilegeList.push('revokeModerator');
					} else {
						privilegeList.push('moderator');
					}
				} else if('none' === theOther.affiliation) {
					// 对方是个none
					// 1，授予成员
					// 2，ban
					// 3，对方是主持人则可以撤销，不是则不能撤销
					privilegeList.push('member');
					privilegeList.push('ban');
					if('moderator' === theOther.affiliation) {
						privilegeList.push('revokeModerator');
					} else {
						privilegeList.push('moderator');
					}
				} 
			}
			/*
			if('admin' === me.affiliation || 'owner' === me.affiliation) {
				if('admin' !== theOther.affiliation || 'owner' !== theOther.affiliation) {
					privilegeList.push('ban');					
				}
				if('none' === theOther.affiliation) {
					privilegeList.push('member');
				} else if('member' === theOther.affiliation) {
					privilegeList.push('revokeMember');
				}
				if('moderator' === theOther.role) {
					privilegeList.push('member');
				} else if('member' === theOther.affiliation) {
					privilegeList.push('revokeMember');
				}
				privilegeList.push('moderator');
				if('owner' === me.affiliation) {
					// privilegeList.push('configRoom');
					
					privilegeList.push('admin');
					privilegeList.push('owner');
				}
			}*/
		}
		return privilegeList;
	},
	
	/**
	 * 根据房间名或地址找到房间
	 * @param roomameAndAddress
	 */
	searchRoomFromAllRooms : function(roomameAndAddress) {
		XoW.logger.ms(this.classInfo + "searchRoomFromAllRooms");
		var rooms = [];
		for(var i = 0; i < this.allRooms.length; i++) {
			var room = this.allRooms[i];
			var roomJidNode = XoW.utils.getNodeFromJid(room.jid);
			XoW.logger.p({name : room.name, roomJidNode : roomJidNode, username : roomameAndAddress});
			if(-1 != room.name.indexOf(roomameAndAddress) || -1 != roomJidNode.indexOf(roomameAndAddress)) {
				rooms.push(room);
			}
		}
		XoW.logger.me(this.classInfo + "searchRoomFromAllRooms");
		return rooms;
	},
	
	/**
	 * 获得房间的黑名单
	 * @param roomJid
	 */
	getRoomBlackList : function(roomJid, successCb, errorCb) {
		var config, stanza;
	    config = $iq({
	      to: roomJid,
	      type: "get"
	    }).c("query", {
	      xmlns: Strophe.NS.MUC_ADMIN
	    }).c('item', {affiliation : 'outcast'});
	    stanza = config.tree();
	    return this._gblMgr.getConnMgr().sendIQ(stanza, successCb, errorCb);
	},
	
	sendRoomGroupchatMessage : function(content, roomJid) {		
		// 根据roomJid得到room，然后调用room的发送方法发送消息。
		var room = this._gblMgr.getConnMgr().getStropheConnection().muc.rooms[roomJid];
		if(null == room) {
			
			// 房间不存在，不发送
			return false;
		}
		room.groupchat(content);
		return true;
	},
	
	/**
	 * 得到一个房间的具体信息
	 */
	roomInfo: function(roomJid, handle_cb, error_cb) {
	    var iq;
	    iq = $iq({id : XoW.utils.getUniqueId("roomInfo"),
	    	to : roomJid,
	    	from : this._gblMgr.getCurrentUser().getJid(),
	    	type : "get"
	    }).c("query", {xmlns: Strophe.NS.DISCO_INFO});
	    return this._gblMgr.getConnMgr().sendIQ(iq, handle_cb, error_cb);
	    // return this._connection.sendIQ(iq, handle_cb, error_cb);
	 },
	
	line________________________ : function() {},
	
	
	getRoomInviteInfoById : function(id) {
		for(var i = 0; i < this.infos.length; i++) {
			var info = this.infos[i];
			if(id === info.id) {
				return info;
			}
		}
		return null;
	},
	
	

	
//	getMyPriviliges : function(me) {
//		var OccupantsPrivileges = {
//			invite : 'invite',
//			sendPrivateMsg : 'sendPrivateMsg',
//			// 注册到房间
//			// 申请发言权
//		};
//		var moderatorPrivileges = {
//			modifySubject : 'modifySubject', 
//			kickOccupants : 'kickOccupants',
//			voice : 'voice',
//			revokeVoice : 'revokeVoice',
//			
//		};
//	},
//	
//	

	
	updateRoomByJid : function(roomJid, roomInfoResult) {
		// this.jid = ""; jid一般不变，name和config可能变了。
		// this.name = "";
		// this.config = null; 
		// 后面获取name 要用getName()来获取。
		var room = this.getRoomByJid(roomJid);
		if(null != room) {
			room.setConfig(this.roomConfigParser.parse(roomInfoResult));
			return room;
		} else {
			// 如果房间不存在，则将该房间加入。
			var r = new XoW.RoomModel();
			r.setJid(roomJid);
			r.setConfig(this.roomConfigParser.parse(roomInfoResult));
			this.allRooms.push(r);
			return r;
		}
	},
	
	addHandler : function(proName, callback) {
		var _handler = {
			id : XoW.utils.getUniqueId("groupChatHandler"), // 这个handler的id，用于后面dele用的
			listenPropery : proName, // 监听的属性名
			cb : callback // 回调函数
		};
		
		this.handlers.push(_handler); // 加入处理器数组中
		return _handler.id; // 返回该处理器id
	},
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
	
	
	
	
	
	
	
	
	/**
	 * 得到房间的列表
	 * @param callback 因为列表需要去服务器取，又因为js的特性，所以如果返回
	 * 的是数据的话可能为空，所以传进来一个回调，当我判断数据不为空后，调用回调，
	 * （界面）即可知数据已经到了，可以来拿了。
	 */
	getGroupChatRoomData : function(callback, error) {
		// 通过这种主动来get的方式，界面是无法监听的。
		// 因为服务器也不会主动告诉客户端，又多了几个聊天室，你快来把新聊天室的信息拿去。
		// 要通过用户自己点击刷新按钮/或者以其他方式去服务器上获取。
		if(null != this.getGroupChatRoomInterval) {
			// 说明已经有在等待的了。
			clearInterval(this.getGroupChatRoomInterval);
			this.getGroupChatRoomInterval = null;
		}
		this.roomReady = false;
		
		// 每次都要重新获取房间信息
		if(!this.getAllGroupChatRoom()) {
			// 如果返回false，说明没有会议室服务器。
			error();
			return;
		}

		this.getGroupChatRoomInterval = setInterval(function() {
			if(this.roomReady) {
				
				clearInterval(this.getGroupChatRoomInterval);
				this.getGroupChatRoomInterval = null;
				callback();
			}
		}.bind(this), 500);
	},
	
	
	
	/**
	 * 得到所有的房间
	 */
	getAllGroupChatRoom : function() {
		XoW.logger.ms(this.classInfo + "getAllGroupChatRoom");
//		var getGroupChatRoomList = $iq({id : XoW.utils.getUniqueId("getRooms"), type : "get", to : "conference.user-20160421db"})
//								.c("query",{xmlns : Strophe.NS.DISCO_ITEMS});
//		this._gblMgr.getConnMgr().addHandler();
		
		// 参数：服务器，成功回调，失败回调
		// 这里的服务器暂时是定死的，到时候需要修改
		var conferenceServerJid = this.getRoomServerJid();
		if(null == conferenceServerJid) {
			return false;
		}
		this._gblMgr.getConnMgr().getStropheConnection().muc.listRooms(conferenceServerJid, function(itemsResult){
			// 成功，得到房间的列表
			// 根据报文所说，如果房间数量过多，可以发送过来一个set元素（见XEP0045例5）。
			// 但是我在实际中，新建了50多个房间，还是可以全部过来，没有出现set元素，所以我现在假设，不会过来set元素
			// XoW.logger.d("here");
			
			// 清空allRoom
			this.allRooms = [];
			var $itemsResult = $(itemsResult);
			var $items = $("item", $itemsResult);
			$items.each(function(index, item){
				var room = new XoW.RoomModel();
				var roomJid = $(item).attr("jid");
				room.setJid(roomJid);
				room.setName($(item).attr("name"));
				// 对房间进行保存
				this.allRooms.push(room);
				
				// 请求每个房间具体的信息。
				this.roomInfo(roomJid, function(roomInfoResult){
					// 请求成功后
					room.setConfig(this.roomConfigParser.parse(roomInfoResult));
					
				}.bind(this), function(error) {
					// 请求失败后
					XoW.logger.w("请求房间列表失败，房间jid为" + roomJid);
					// 这个错误的后续处理该怎么做？
				});
			}.bind(this));
			// bind this 怎么弄= =，怎么没办法绑定的这个类上？不然等等删掉代码，从简开始。
		}.bind(this), function(error) {
			// 失败
			XoW.logger.w("请求房间列表失败");
			// 这里的错误，特定的错误需要再处理
		});
		this.roomReady = true;
		XoW.logger.me(this.classInfo + "getAllGroupChatRoom");
		return true;
	},
	
	
	 parseRoomInfo : function(stanze) {
		 
	 }
	  
};
return XoW;
}));
