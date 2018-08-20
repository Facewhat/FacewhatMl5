(function(factory) {
	return factory(XoW);
}(function(XoW) {

XoW.OrgnizationManager = function(globalManager) {
	this._gblMgr = globalManager;
	
	// this.orgnization = [];
	this.org = [];
	this.subscribe = [];
	//  因为一个用户可能在多个部门中，
	// 那有没有必要多次获取他的vcard呢？
	// 包括后面的消息推送，以及状态改变这些。
	// 这里面存的是唯一的user，即使这个user处于不同的组中。
	// 不行，一个user它的 groupname不能不同，不同只存一个。
	// this.groupUser = []; 
	
	// 可监听 
	// 1,orgnizationstart
	// 2,message 所有来自组的，组中成员的消息
	// 3,presence	出席节
	// 4,iq	iq节
	this.handler = null;

	// 当前类的信息
	this.classInfo = "【OrgnizationManager】";
	this._init();
};
//该插件当前以组织架构不变动为前提。。如果会变动，有些地方要更改。
XoW.OrgnizationManager.prototype = {
	_init : function() {
		XoW.logger.ms(this.classInfo + "_init()");
		
		XoW.logger.d(this.classInfo + "初始化了XoW.OrgnizationManager");
		
		this.handler = new XoW.Handler();
		// 在message上添加监
		
		
		this._gblMgr.getConnMgr().addHandler(this._needDealCb.bind(this));
		
		
		XoW.logger.me(this.classInfo + "_init()");
	},
//	_start : function() {
//	},
	
	
	_needDealCb : function(stanza) {
		XoW.logger.ms(this.classInfo + "_needDealCb");
		
		from = stanza.getAttribute('from');
		type = stanza.getAttribute('type');
        // 如果没有from或者type节属性的节，不处理。
        if (!from) {
          return true;
        }
        
        var groupJid = XoW.utils.getBareJidFromJid(from);
        var group = this.getGroupByGroupjid(groupJid);
        // 不存在该组，不处理。
        // 以from="fwgroup.openfire/lxy"发送出席节给所有用户。
        XoW.logger.d(this.classInfo + " -- " + from.indexOf(this.getOrgDomain() + "/")  + '  ' + this.getOrgDomain() + "/");
        if(!group && !(from.indexOf(this.getOrgDomain() + "/") == 0)) {
        	return true;
        }
        
        var params = {
    		stanza : stanza,
    		// group : group,
    		// groupuser : null,
    		// type : null,
        }; 
        var res = XoW.utils.getResourceFromJid(from);
        
        if (stanza.nodeName === "message") { 
        	if (!type) {
        		// 没有type不处理
                return true;
            }
        	
            if('chat' == type) {
            	groupuser = group.getGroupuserByUsername(res);
            	params.type = "groupuser";
            	params.groupuser = groupuser;
            } else if('groupchat' == type){
            	params.type = "group";
            } else {
            	// 其他类型的type不处理
            	return true;
            }
      	  	// 如果是消息节，则没有对节进行处理
        	var $stanza = $(stanza);
        	var msg = {
        		from : $stanza.attr('from'),
        		to : $stanza.attr('to'),
        		type : $stanza.attr('type'),
        		body : $('body', $stanza).text(),
        	};
        	params.msg = msg;
        	this.triggerHandlerInOrgnizationManager("message", params);
        } else if(stanza.nodeName === "presence") {
        	params.username = XoW.utils.getResourceFromJid(from);
        	XoW.logger.d(this.classInfo + "收到了出席节");
        	
        	var state = 5; // 1在线,2空闲,3正忙,4离开,5隐身
        	var $pre = $(stanza);
        	if(type == 'unavailable') {
        		// state = 5;
        	} else if($('show', $pre).length > 0) {
        		var show = $('show', $pre).text();
        		if('chat' == show) {
        			state = 2;
        		} else if('dnd' == show) {
        			state = 3;
        		} else if('away' == show) {
        			state = 4;
        		}  
        	} else {
        		// if($('show', $pre).length > 0) {
        			state = 1;
        		// }
        	}
        	
        	for(var i = 0; i < this.org.length; i++) {
				for(var j = 0; j < this.org[i].groupusers.length; j++) {
					if(this.org[i].groupusers[j].username == params.username) {
						this.org[i].groupusers[j].setState(state);
					}
				}
			}
        	
        	
        	this.triggerHandlerInOrgnizationManager("presence", params);
        } else if(stanza.nodeName === 'iq') {
        	
        	this.triggerHandlerInOrgnizationManager("iq", params);
        }
        
        XoW.logger.me(this.classInfo + "_needDealCb");
        return true;
	},
	
	// 搜索符合条件的部门的员工
	searchGroupUser : function(condition) {
		var users = [];
		for(var i = 0; i < this.org.length; i++) {
			var department = this.org[i];
			for(var j = 0; j < department.groupusers.length; j++) { 
				var user = department.groupusers[j];
				if(-1 != user.username.indexOf(condition) 
						|| -1 != user.fullpinyin.indexOf(condition)
						|| -1 != user.shortpinyin.indexOf(condition)) {
					users.push(user);
				}
			}
		}
		return users;
	},
	// 搜索符合条件的部门
	serachGroup : function(condition) {
		var departments = [];
		for(var i = 0; i < this.org.length; i++) {
			var department = this.org[i];
			if(-1 != department.groupname.indexOf(condition) || -1 != department.displayname.indexOf(roomameAndAddress)) {
				departments.push(departments);
			}
		}
		return departments;
	},
	
	
	// 根据groujid获取group
	getGroupByGroupjid : function(groupjid) {
		if(!groupjid) {
			return null;
		}
		return this.getGroupByGroupname(XoW.utils.getNodeFromJid(groupjid));
	},
	
	// 是否是顶级的组，即是否是企业通讯录
	isTheTopGroup : function(groupjid) {
		var group = this.getGroupByGroupjid(groupjid);
		if(!group) {
			return false;
		} 
		if('0' == group.groupfathername) {
			return true;
		}
		return false;
	},
	
	isMeInGroup : function(groupjid) {
		var group = this.getGroupByGroupjid(groupjid);
		if(!group) {
			// 应该报错。。
			return false;
		} else {
			var jid = this._gblMgr.getCurrentUser().jid;
			if(group.getGroupuserByUserjid(jid)) {
				// 存在该用户
				return true;
			} else {
				return false;
			}
		}
	},
	isMe : function(jid) {
		if(jid == this._gblMgr.getCurrentUser().jid) {
			return true;
		}
		return false;
	},
	
	
	// 根据groupname获得group
	getGroupByGroupname : function(groupname) {
		if(!groupname) {
			return null;
		}
		for(var i = 0; i < this.org.length; i++) {
			var g = this.org[i];
			if(g.groupname == groupname) {
				return g;
			}
		}
		return null;
	},
	
	getMeInGroup : function(groupjid, mejid) {
		var group = XoW.utils.getBareJidFromJid(groupjid);
		var me = XoW.utils.getNodeFromJid(mejid);
		if(!group || !me) {
			return null;
		}
		return this.getGroupuserByGroupuserjid(group + '/' + me);
	},
	
	// 根据  cwb@fwgroup.openfire/lxy 这种来获取lxy这个人
	getGroupuserByGroupuserjid : function(groupuserjid) {
		if(!groupuserjid) {
			return null;
		}
		var groupJid = XoW.utils.getBareJidFromJid(groupuserjid);
		var groupusername = XoW.utils.getResourceFromJid(groupuserjid);
		var group = this.getGroupByGroupjid(groupJid);
		if(!group) {
			return null;
		}
		var groupuser = group.getGroupuserByUsername(groupusername);
		return groupuser;
	},
	
	getOrgDomain : function() {
		return "fwgroup.openfire"; // 暂时定死了
	},
	isOrgDomain : function(jid) {
		if(!jid) {
			return false;
		}
		var jidDomain = XoW.utils.getDomainFromJid(jid);
		if(!jidDomain) {
			return false;
		}
		if(this.getOrgDomain() == jidDomain) {
			return true;
		}
		return false;
	},
	isAllreadSubscribe : function(jid) {
		if(this.subscribe[jid]) {
			return true;
		} else {
			return false;
		}
	},
	
	subscribeGroupUser : function(userJid) {
		if(this.isAllreadSubscribe(userJid)) {
			return;
		};
		
		if(!userJid) {
			return;
		}
		var iq = $iq({
			id : XoW.utils.getUniqueId('subscribeGroupUser'),
			from : this._gblMgr.getCurrentUser().jid,
			type : 'set',
			to : this.getOrgDomain(), 
		}).c('subscribegroupuser', {
			xmlns : 'http://facewhat.com/orgnization'
		}).t(userJid);
		this._gblMgr.getConnMgr().sendIQ(iq, function() {
			XoW.logger.d(this.classInfo + "成功");
			//return true;
			this.subscribe[userJid] = 1;
			
		}.bind(this), function() {
			XoW.logger.d(this.classInfo + "失败");
			//return false;
		});
	},
	subscribeGroup : function(groupJid) {
		var group = this.getGroupByGroupjid(groupJid);
		if(!group) {
			// 如果该组不存在
//			return false;
			return;
		}
		if(this.isAllreadSubscribe(groupJid)) {
			return;
		};
//		if(!isTheTopGroup(groupJid)) {
//			// 如果该组是顶级组，顶级组中应该有人吗？
//			return false;
//		}
		var iq = $iq({
			id : XoW.utils.getUniqueId('subscribeGroup'),
			from : this._gblMgr.getCurrentUser().jid,
			type : 'set',
			to : this.getOrgDomain(), 
		}).c('subscribegroup', {
			xmlns : 'http://facewhat.com/orgnization'
		}).t(groupJid);
		this._gblMgr.getConnMgr().sendIQ(iq, function() {
			XoW.logger.d(this.classInfo + "成功");
			//return true;
			this.subscribe[groupJid] = 1;
			for(var i = 0; i < group.groupusers.length; i++) {
				this.subscribe[group.groupusers[i].userjid] = 1;
			}
			
		}.bind(this), function() {
			XoW.logger.d(this.classInfo + "失败");
			//return false;
		});
	},
	
	cancelSubscribe : function(successCb, errorCb) {
		var iq = $iq({
			id : XoW.utils.getUniqueId('cancelSubscribe'),
			type : "set",
			from : this._gblMgr.getCurrentUser().jid,
			to : this.getOrgDomain(), // 这个先写死
		}).c('cancelsubscribe', {
			xmlns : 'http://facewhat.com/orgnization'
		});
		this._gblMgr.getConnMgr().sendIQ(iq, function(stanza) {
			XoW.logger.d(this.classInfo + "成功");
			if(successCb) {
				var params = {
					stanza : stanza,	
				};
				successCb(params);
			}
		}, function(error) {
			XoW.logger.d(this.classInfo + "失败");
			if(errorCb) {
				var params = {
					stanza : stanza,	
				};
				errorCb(params);
			}
		});
	},
	
	_start : function() {
		// 去服务器取父节点为0的组，即企业通讯录的最顶级-公司。
		var iq = $iq({
			id : XoW.utils.getUniqueId('queryorgnization'),
			// from : this._gblMgr.getCurrentUser().jid,
			type : 'get',
			to : this.getOrgDomain(),	
		}).c('queryorgnization', {
			xmlns : XoW.NS.FW_ORGNIZATION,
		}).t(0);
		
		var params = {
			stanza : null,
			type : 'fail',
		};
		this.org = [];
		
		this._gblMgr.getConnMgr().sendIQ(iq, function(stanza) {
			XoW.logger.d(this.classInfo + "成功");
			params.stanza = stanza;
			var $stanza = $(stanza);
			var $group = $('group', $stanza);
			// <group groupjid="facewhat@fwgroup.openfire" groupname="facewhat" displayname="facewhat企业通讯录" 
			// groupfathername="0" isorgnization="true"/>
//			enterprise.groupjid = $group.attr('groupfathername');
//			enterprise.groupname = $group.attr('groupname');
//			enterprise.displayname = $group.attr('displayname');
//			enterprise.groupfathername = $group.attr('groupfathername');
//			enterprise.isorgnization = $group.attr('isorgnization');
			
//			params.stanza = stazna;
//			params.enterprise = enterprise;
			
			
			// 所有用户存在一个地方。
			// 然后该用户的presence和
			
			$group.each(function(index, item) {
				$item = $(item);
				
				var g = new XoW.Group(this._gblMgr);
				g.groupjid = $(item).attr('groupjid');
				g.groupname = $(item).attr('groupname');
				g.displayname = $(item).attr('displayname');
				g.groupfathername = $(item).attr('groupfathername');
				g.isorgnization = $(item).attr('isorgnization');
				
//				var g = {
//					groupjid : $(item).attr('groupjid'),
//					groupname : $(item).attr('groupname'),
//					displayname : $(item).attr('displayname'),
//					groupfathername : $(item).attr('groupfathername'),
//					isorgnization : $(item).attr('isorgnization'),
//					groupusers : [],
//				};
				$('groupuser', $item).each(function(index2, item2){ 
					$item2 = $(item2);
					var u = new XoW.GroupUser(this._gblMgr);
					u.userjid = $item2.attr('userjid');
					u.username = $item2.attr('username');
					u.usernickname = $item2.attr('usernickname');
					u.fullpinyin = $item2.attr('fullpinyin');
					u.shortpinyin = $item2.attr('shortpinyin');
					u.group = g;
//					var u = {
//						userjid : $item2.attr('userjid'),
//						username : $item2.attr('username'),
//						usernickname : $item2.attr('usernickname'),
//						fullpinyin : $item2.attr('fullpinyin'),
//						shortpinyin : $item2.attr('shortpinyin'),
//					};
					g.groupusers.push(u);
				}.bind(this));
				this.org.push(g);
				
				
			}.bind(this));
			params.type = "success";
			params.org = this.org;
			params.cb = function() {
				for(var i = 0; i < this.org.length; i++) {
					for(var j = 0; j < this.org[i].groupusers.length; j++) {
						this.org[i].groupusers[j].getVcardFromServer();
					}
				}
			}.bind(this);
			
			this.triggerHandlerInOrgnizationManager("orgnizationstart", params);
			
			
		}.bind(this), function(error) {
			params.stanza = error;
			XoW.logger.d(this.classInfo + "企业通讯录，获取企业失败");
			this.triggerHandlerInOrgnizationManager("orgnizationstart", params);
		});
		
		// 1秒后开始请求所有groupuser的vcard。
		// 为什么要延迟获取？
		// 一方面是减少同时对服务器的访问量，怕客户端卡。
		// 一个是这个企业通讯录，并不是马上就看到的那个界面，可以稍晚加载
		// 还有是因为，晚一点加载，等待界面先把企业通讯录加载完了，这样才会保证获取后setFace会触发被界面监听到
		// （就是怕界面还没开始监听，头像就已经加载完了。。）
		// setTimeout(, 3000);
		
	},
	
	
	/**
     * 回调与触发。
     * @param proName
     * @param callback
     */
    addHandlerToOrgnizationManager: function(proName, callback) {
    	XoW.logger.ms(this.classInfo + "addHandlerToOrgnizationManager()");
    	XoW.logger.d(this.classInfo + "添加了一个监听，监听属性： " + proName);
    	this.handler.addHandler(proName, callback);
    	XoW.logger.me(this.classInfo + "addHandlerToOrgnizationManager()");
    },
    deleteHandlerInOrgnizationManager: function(id) {
    	XoW.logger.ms(this.classInfo + "deleteHandlerInOrgnizationManager()");
    	this.handler.deleteHandler(id);
    	XoW.logger.me(this.classInfo + "deleteHandlerInOrgnizationManager()");
    },
    triggerHandlerInOrgnizationManager: function(proName, params) {
    	XoW.logger.ms(this.classInfo + "triggerHandlerInOrgnizationManager()");
    	XoW.logger.d(this.classInfo + "触发的属性是： " + proName);
    	this.handler.triggerHandler(proName, params);
    	XoW.logger.me(this.classInfo + "triggerHandlerInOrgnizationManager()");
    },
};

XoW.Group = function(globalManager) {
	this._gblMgr = globalManager;
	this.groupjid = null;
	this.groupname = null;
	this.displayname = null;
	this.groupfathername = null;
	this.isorgnization = null;
	
	// this.isSubscribe = 0;
	
	this.groupusers = [];
	this.songroup = [];
	
	this.handler = null;
	this.classInfo = "【User" + this.groupjid + "】";
	this._init();
};
XoW.Group.prototype = {
	_init : function() {
		XoW.logger.ms(this.classInfo + "_init()");
		
		this.handler = new XoW.Handler();
		
		XoW.logger.me(this.classInfo + "_init()");
	},
	
	getGroupuserByUserjid : function(jid) {
		for(var i = 0; i < this.groupusers.length; i++) {
			 if(this.groupusers[i].userjid == jid) {
				 return this.groupusers[i];
			 }
		}
	},
	// 该分组的所有成员去服务器获取自己的vcard。
	groupuserGetVcardFromServer : function() {
		for(var i = 0; i < this.groupusers.length; i++) {
			this.groupusers[i].getVcardFromServer();
		}
	},
	getGroupuserByUsername : function(username) {
		for(var i = 0; i < this.groupusers.length; i++) {
			 if(this.groupusers[i].username == username) {
				 return this.groupusers[i];
			 }
		}
		return null;
	},
	
	sendMessage : function(content) {
		XoW.logger.ms(this.classInfo + "sendMessage");
		
		var fromJid = this._gblMgr.getCurrentUser().getFullJid();
		var msg = $msg({
			from : fromJid,
			to : this.groupjid,
			type : 'groupchat',
			id : XoW.utils.getUniqueId('groupMsg'),
		}).c('body').t(content);
		
		// this._gblMgr.getChatMgr().send();
		this._gblMgr.getConnMgr().send(msg);
		
		XoW.logger.me(this.classInfo + "sendMessage");
	}
	
};

XoW.GroupUser = function(globalManager) {
	this._gblMgr = globalManager;
	this.userjid = null;
	
	this.username = null;
	this.usernickname  = null;
	this.fullpinyin = null;
	this.shortpinyin = null;
	this.vcard = null;
	
	this.face = "";
	// this.isSubscribe = 0;
	
	this.state = 5;
	
	this.group = null;
	this.handler = null;
	this.classInfo = "【User" + this.jid + "】";
	this._init();
}; 
XoW.GroupUser.prototype = {
	_init : function() {
		XoW.logger.ms(this.classInfo + "_init()");
		
		this.handler = new XoW.Handler();
		
		XoW.logger.me(this.classInfo + "_init()");
	},
	
	getGroupUserJid : function() {
		// this.usergroupjid = null; // 用户及其所在组的jid如。  cwb@fw.openfire/lxy
		if(!this.group.groupjid) {
			return null;
		}
		return this.group.groupjid + "/" + this.username;
	},
	
	
	sendMessage : function(content) {
		XoW.logger.ms(this.classInfo + "sendMessage");
		
		var fromJid = this._gblMgr.getCurrentUser().getFullJid();
		
		var toJid = this.getGroupUserJid();
		if(!toJid) {
			return false;
		}
		var msg = $msg({
			from : fromJid,
			to : toJid,
			type : 'chat',
			id : XoW.utils.getUniqueId('groupuserMsg'),
		}).c('body').t(content);
		
		// this._gblMgr.getChatMgr().send();
		this._gblMgr.getConnMgr().send(msg);
		var params = {
			stanza : msg,
			groupuser : this
		};
		this.triggerHandlerInGroupUser("sendMessage", params);
		
		XoW.logger.me(this.classInfo + "sendMessage");
		return true;
	},
	setState: function(_state){ 
		var params = {
			groupUser : this,
			oldValue : this.state,
			newValue : _state,
		};
		this.state = _state; 
		this.triggerHandlerInGroupUser('state', params); 
	},
	
	setFace : function(_face){ 
		var params = {
			groupUser : this,
			oldValue : this.face,
			newValue : _face,
		};
		this.face = _face; 
		this.triggerHandlerInGroupUser('face', params); 
	},
	setVcard : function(_vcard){ 
		var params = {
			groupUser : this, 
			oldValue : this.vcard,
			newValue : _vcard,
		};
		this.vcard = _vcard; 
		this.triggerHandlerInGroupUser('vcard', params); 
	},
	
	getVcardFromServer : function(successCb, errorCb, timeout) {
		// 接下去触发。
		
		XoW.logger.ms(this.classInfo + "getVcardFromServer()");
		this._gblMgr.getUserMgr().getVcard(this.userjid, function(params) {
			XoW.logger.ms(this.classInfo + "获取vcard成功");
//				var params = {
//						vcard : vcardTemp , // 解析后
//						vcardStanza : stanza, // 解析前
//					};
			// 那个设置头像
			var vcard = params.vcard;
			XoW.logger.d(this.classInfo + "来了一个vcard");
			if(this.face != vcard.PHOTO.BINVAL) {
				this.setFace(vcard.PHOTO.BINVAL);
			}
			// 保存vcard
			this.setVcard(vcard);
			if(successCb) {
				successCb(params);
			}
		}.bind(this), errorCb, timeout);
		XoW.logger.me(this.classInfo + "getVcardFromServer()");
	},
	
	/**
     * 回调与触发。
     * @param proName
     * @param callback
     */
    addHandlerToGroupUser: function(proName, callback) {
    	XoW.logger.ms(this.classInfo + "addHandlerToGroupUser()");
    	XoW.logger.d(this.classInfo + "添加了一个监听，监听属性： " + proName);
    	this.handler.addHandler(proName, callback);
    	XoW.logger.me(this.classInfo + "addHandlerToGroupUser()");
    },
    deleteHandlerInGroupUser: function(id) {
    	XoW.logger.ms(this.classInfo + "deleteHandlerInGroupUser()");
    	this.handler.deleteHandler(id);
    	XoW.logger.me(this.classInfo + "deleteHandlerInGroupUser()");
    },
    triggerHandlerInGroupUser: function(proName, params) {
    	XoW.logger.ms(this.classInfo + "triggerHandlerInGroupUser()");
    	XoW.logger.d(this.classInfo + "触发的属性是： " + proName);
    	this.handler.triggerHandler(proName, params);
    	XoW.logger.me(this.classInfo + "triggerHandlerInGroupUser()");
    },
};


return XoW;
}));
