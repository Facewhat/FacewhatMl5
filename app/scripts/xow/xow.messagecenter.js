(function(factory) {
	return factory(XoW);
}(function(XoW) {

// 这个类强依赖于view。是专门为界面服务的 
XoW.MessageCenterManager = function(globalManager) {
	this._gblMgr = globalManager;
	this.msgMaxFlash = 5;
	
	this.messageQueue = [];
	
	this.mymsgInterval = null;
	
	this.handler = null;
	
	this.classInfo = "【MessageCenterManager】";
	this._init();
};
XoW.MessageCenterManager.prototype = {
	_init : function() {
		this.handler = new XoW.Handler();
		
		this.addHandlerToMessageCenterMgr('newmessage', this._newMessageCb.bind(this));
	},
	
	addHandlerToMessageCenterMgr : function(proName, callback) {
    	XoW.logger.ms(this.classInfo + "addHandlerToMessageCenterMgr()");
    	XoW.logger.d(this.classInfo + "添加了一个监听，监听属性： " + proName);
    	this.handler.addHandler(proName, callback);
    	XoW.logger.me(this.classInfo + "addHandlerToMessageCenterMgr()");
    },
    deleteHandlerInMessageCenterMgr : function(id) {
    	XoW.logger.ms(this.classInfo + "deleteHandlerInMessageCenterMgr()");
    	this.handler.deleteHandler(id);
    	XoW.logger.me(this.classInfo + "deleteHandlerInMessageCenterMgr()");
    },
    triggerHandlerInMessageCenterMgr : function(proName, params) {
    	XoW.logger.ms(this.classInfo + "triggerHandlerInMessageCenterMgr()");
    	XoW.logger.d(this.classInfo + "触发的属性是： " + proName);
    	this.handler.triggerHandler(proName, params);
    	XoW.logger.me(this.classInfo + "triggerHandlerInMessageCenterMgr()");
    },
	
	isJidInChatList : function(jid) {
		return this._gblMgr.getViewMgr().isJidInChatList(jid);
	},
	
	getMessageInQueueByTypeAndJidAndRemove : function(type, fromJid) {
		var msgInQueue = this.getMessageInQueueByTypeAndJid(type, fromJid);
		
		if(msgInQueue) {
			// 已存在 与该 jid及其类型的对话窗口
			// 先进行移除
			var index = this.messageQueue.indexOf(msgInQueue);
            this.messageQueue.splice(index, 1);
            if(0 == this.messageQueue.length) {
            	this.clearInterval();
            }
		} else {
			return null;
		}
		return msgInQueue;
	},
	
	getMessageInQueueByTypeAndJid : function(type, jid) {
		for(var i = 0; i < this.messageQueue.length; i++) {
			if(this.messageQueue[i].type == type && jid == this.messageQueue[i].jid) {
				return this.messageQueue[i];
			}
		}
		return null;
	},
	
	// 阅读了所有人的消息。
	readAll : function() {
		var v = this.messageQueue;
		this.messageQueue = [];
		return v;
	},
	
	
	removeOne : function(type, jid) {
		
	},
	
	// 阅读了一个人的消息
	readOne : function(type, jid) {
		var msgInQueue = this.getMessageInQueue(type, jid);
		if(msgInQueue) {
			var index = this.messageQueue.indexOf(msgInQueue);
			this.messageQueue.splice(index, 1);
		} else {
			return null;
		}
		return msgInQueue;
	},
	
	showMyMessage : function(type, jid, content) {
		XoW.logger.ms(this.classInfo + "showMyMessage");
		
//		var groupuser = this._gblMgr.getOrgnizationMgr().getGroupuserByGroupuserjid(msg.from);
//		var face = this.getUserFaceFromFaceData(groupuser.face);
//		var type = '';
//		if(this._gblMgr.getCurrentUser().jid == groupuser.userjid) {
//			type = 'me';
//		}
//		var historyMsg = '';
//		if(msg.isDelay) { 
//			historyMsg = '(历史消息)';
//		}
//		var name = groupuser.usernickname;
//		var time = msg.time;
//		var body = msg.showBody;
		
		var from = this._gblMgr.getCurrentUser().jid;
		switch(type) {
			case 'one' :
			case 'roomprivate' :
				var msg = {
					messageBody : content,
					showBody : this.messageBodyToShowBody(content),
					from : from,
					to : jid,
					type : 'chat',
					time : XoW.utils.getCurrentDatetime(),
					isDelay : false,
				};
				// 获取房间
				var roomJid = XoW.utils.getBareJidFromJid(jid);
				var room = this._gblMgr.getRoomMgr().getXmppRoom(roomJid);
				if(!room) {
					return;
				}
				html = this.roomPrivateMessageHtml(msg, 'me', room.nick);
				// 这里的jid是 对方的jid。如果是  room就是 xx@conference.openfire 
				// 如果是房间里的人，就是 xx@conference.openfire/xx
				this.popMessageToChatnow(type, jid, html);
			case 'groupprivate' :
				// msg = this.extractMessage(message);
				var meGroupuser = this._gblMgr.getOrgnizationMgr().getMeInGroup(jid, from);
				var msg = {
					messageBody : content,
					showBody : this.messageBodyToShowBody(content),
					from : from,
					to : jid,
					type : 'chat',
					time : XoW.utils.getCurrentDatetime(),
					isDelay : false,
					groupuser : meGroupuser,
				};
				html = this.groupprivateMessageHtml(type, msg);
				// 这里的jid是 对方的jid。如果是  room就是 xx@conference.openfire 
				// 如果是房间里的人，就是 xx@conference.openfire/xx
				this.popMessageToChatnow(type, jid, html);
				break;
			case 'room' : 
			case 'group' :
				return 'group';
				break;
		}
		XoW.logger.me(this.classInfo + "showMyMessage");
		
//		var $message = $(message);
//		var body = $('body', $message).text();
//		var from = $message.attr('from');
//		var to = $message.attr('to');
//		var type = $message.attr('type');
//		var time = XoW.utils.getCurrentDatetime();
//		var isDelay = false;
//		if($('delay', $message).length > 0) {
//			time = XoW.utils.getFromatDatetime($('delay', $message).attr('stamp'));
//			isDelay = true;
//		}
//		return {
//			messageBody : body,
//			showBody : this.messageBodyToShowBody(body),
//			from : from,
//			to : to,
//			type : type,
//			time : time,
//			isDelay : isDelay
//		};
	},
	
	getShowMessageInQueue : function(type, jid) {
		// 有new肯定要取
		// 有add的时候，判断一下，如果是在显示的列表中，就不取
		// 不在的话，就取。
		if(this.messageQueue.length < this.msgMaxFlash + 1) {
			// 如果消息队列中小于6个人/组消息，则全部返回
			return this.messageQueue;
		} else {
			// 否则取最新的5个。
			var msgQueue = [];
			for(var i = this.messageQueue.length - 1; i > this.messageQueue.length - this.msgMaxFlash; i++) {
				msgQueue.push(this.messageQueue[i]);
			}
			return msgQueue;
		}
	},
	
	addShowMessage : function(params) {
		// type, 
		// message 消息节
//		params {
//			msg : 未解析的消息节
//			type  ： one, room, roomprivate, group, groupprivate
//			
//		}
		XoW.logger.ms(this.classInfo + "addShowMessage");
		
		var $message = $(params.message);
		var type = params.type;
		var fromJid = $message.attr('from');
		
		var jid = fromJid;
		if('group' == type) {
			// 因为fromJid不管是群组还是个人，都是 xx@fwgroup.openfire/xx 
			// 如果是群组，那么判断是否是当前聊天就要用 xx@fwgroup.openfire
			jid = XoW.utils.getBareJidFromJid(jid);
		}
		// 如果是自己发给的消息，那么< from='自己' to='对方'/>
		// 此时
		XoW.logger.d(this.classInfo + "是否在当前的聊天列表中" + jid);
		if(this.isJidInChatList(jid)) {
			XoW.logger.d(this.classInfo + "在当前的聊天列表中" + jid);
			// 已在聊天面板，不处理
			// 或者继续判断，是不是chatnow,是chatnow就把消息放上去
			// 不是chatnow就在左侧显示new
			this.popMessage(type, params.message);
			return;
		} else {
			XoW.logger.d(this.classInfo + "不在当前的聊天列表中" + jid);
			var $body = $('body', $message);
			if($body.length < 1) {
				return;
			}
			var body = $body.text();
			
			// 如果刚好截取的那一段是表情呢= = 那不是坑了。。
			// 先要用表情转义了？
			lastBodyDigest = XoW.utils.xmlescape(body.substring(0, 10));
			var msgInQueue = this.getMessageInQueueByTypeAndJid(type, jid);
			
			if(msgInQueue) {
				// 已存在 与该 jid及其类型的对话窗口
				
				// 先进行移除
				var index = this.messageQueue.indexOf(msgInQueue);
	            this.messageQueue.splice(index, 1);
				
				msgInQueue.messages.push(params.message);
				msgInQueue.lastBodyDigest = lastBodyDigest;
//				msgInQueue = {
//						type : type,
//						jid : from,
//						messages : [params.message ],
//						lastBodyDigest : lastBodyDigest,
//				};
				
				// 再进行加入，使之处于最后的位置，表示是最新的消息
				this.messageQueue.push(msgInQueue);
				var params = {
					msgInQueue : msgInQueue,
				};
				this.triggerHandlerInMessageCenterMgr('addmessage', params);
			} else {
				// 不存在 与该 jid及其类型的对话窗口
				msgInQueue = {
					type : type,
					jid : jid,
					messages : [params.message ],
					lastBodyDigest : lastBodyDigest,
				};
				if(type == "roomprivate") {
					msgInQueue.face = "images/4.bmp";
					// 稍后获取，这个，实体。。
					var roomJid = XoW.utils.getBareJidFromJid(fromJid);
					msgInQueue.entity = this._gblMgr.getRoomMgr().getXmppRoom(roomJid);
//					msgInQueue.entity = {
//						jid : fromJid,
//						nickname : XoW.utils.getResourceFromJid(fromJid)
//						room : this._gblMgr.getRoomMgr().get
//					};
					
				} else if(type == "group") {
					msgInQueue.face = "scripts/mtree/img/department.png";
					// 这里放的是在这个组中发消息的人的jid。。        
					// 应该改成组。。
					// msgInQueue.entity = this._gblMgr.getOrgnizationMgr().getGroupuserByGroupuserjid(from);
					msgInQueue.entity = this._gblMgr.getOrgnizationMgr().getGroupByGroupname(XoW.utils.getNodeFromJid(jid));
					// 如果是组，则存放的是组的jid
				} else if(type == "groupprivate") {
					var groupuser = this._gblMgr.getOrgnizationMgr().getGroupuserByGroupuserjid(jid);
					msgInQueue.entity = groupuser;
					msgInQueue.face = groupuser.face;
				}
				
				this.messageQueue.push(msgInQueue);
				var params = {
					msgInQueue : msgInQueue,
				};
				this.triggerHandlerInMessageCenterMgr('newmessage', params);
//				[
//				 {type, jid, message[], face, lastBodyDigest, entity}
//				 ]
			}
		}
		XoW.logger.me(this.classInfo + "addShowMessage");
		
		// 
		// 先不做 type:chat 两个人单独聊天  到时候要考虑一下是否应该加入闪烁
		// 不考虑  type:room 会议室  因为要加入才会闪烁。  
		// 			fromjid:cwb@conference.openfire/lxy  type="groupchat"
		
		// type:roomprivate 会议室私聊 闪烁		 
		// 		fromjid:cwb@conference.openfire/lxy type="chat"
		//		会议室私聊的人没有头像，
		
		// type:group 群组 闪烁					 
		//		fromjid:cwb@fwgroup.openfire/lxy    type="groupchat"
		//		群组没有头像，但是直接用那一个
		
		// type:groupprivate 群组私聊 闪烁		 
		//		fromjid:cwb@fwgroup.openfire/lxy type="chat"
		// 		私聊的人有头像。。
	},
	

	
	
	// 来了新消息
	_newMessageCb : function() {
		// 可能是第一个人来消息，也可能不是。
		XoW.logger.ms(this.classInfo + "_newMessageCb");

		if(!this.mymsgInterval) {
			// 如果没有在闪，则让他开始闪。
			this.mymsgInterval = setInterval(function(){ 
				$('#xxim_mymsg i').stop(true,true).fadeOut(100).fadeIn(100);
				// this.showInfoBox();
			},600);
		}
		XoW.logger.me(this.classInfo + "_newMessageCb");
		// var show = getShowMessageInQueue();
		return true;
	},
	clearInterval : function() {
		if(this.mymsgInterval) {
			clearInterval(this.mymsgInterval);
			this.mymsgInterval = null;
		}
	},
	
	
	
	
	// 获取需要在界面显示的消息
	getShowMessageHtml : function() {
		var showMsgQueue = this.getShowMessageInQueue();
		var canShow = false;
		var html = '<ul>';
		for(var i = 0; i < showMsgQueue.length; i++) {
			canShow = true;
			var miq = showMsgQueue[i];
			if('group' == miq.type) {
				html += this.liGroupHtml(miq);
			} else if('groupprivate' == miq.type) {
				html += this.liGroupuserHtml(miq);
			} else if('roomprivate' == miq.type) {
				html += this.liRoomPrivteHtml(miq);
			}
		}
		html += '</ul>';
		html += '<div></div>'; //显示全部
		if(canShow) {
			return html;
		} else {
			return '';
		}
	},
	getFaceFromFaceData : function(faceData) {
		// msgInQueue.face
		return this._gblMgr.getViewMgr().getUserFaceFromFaceData(faceData);
	},
	
	liGroupuserHtml : function(msgInQueue) {
	//	[
	//{type, jid, message[], face, lastBodyDigest,}
	//]
		var face = this.getFaceFromFaceData(msgInQueue.face);
		var html = '<li type="' + msgInQueue.type + '" jid="' + msgInQueue.jid + '"  >'
				+'<img src="' + face + '">'
				+'<span class="mymsgboxname">'+msgInQueue.entity.group.displayname+ "-"+msgInQueue.entity.usernickname+'</span>'
				+'<span class="mymsgboxmsgdigest">'+msgInQueue.lastBodyDigest+'</span>'
				+'<span class="mymsgboxmsgmsgcount">'+msgInQueue.messages.length+'</span>'
			+'</li>';
		return html;
	},
	liGroupHtml : function(msgInQueue) {
		//	[
		//{type, jid, message[], face, lastBodyDigest,}
		//]
		var html = '<li type="' + msgInQueue.type + '" jid="' + msgInQueue.jid + '"  >'
				+'<img src="' + msgInQueue.face + '">'
				+'<span class="mymsgboxname">'+msgInQueue.entity.displayname +'</span>'
				+'<span class="mymsgboxmsgdigest">'+msgInQueue.lastBodyDigest+'</span>'
				+'<span class="mymsgboxmsgmsgcount">'+msgInQueue.messages.length+'</span>'
			+'</li>';
		return html;
	},
	liRoomPrivteHtml : function(msgInQueue) {
		//	[
		//{type, jid, message[], face, lastBodyDigest,}
		//]
		var html = '<li type="' + msgInQueue.type + '" jid="' + msgInQueue.jid + '"  >'
			+'<img src="' + msgInQueue.face + '">'
			+'<span class="mymsgboxname">会议室:'+ XoW.utils.getNodeFromJid(msgInQueue.jid) + '-' + XoW.utils.getResourceFromJid(msgInQueue.jid) + '</span>'
			+'<span class="mymsgboxmsgdigest">'+msgInQueue.lastBodyDigest+'</span>'
			+'<span class="mymsgboxmsgmsgcount">'+msgInQueue.messages.length+'</span>'
			+'</li>';
		return html;
	},
	
	
	popMessage : function(type, message) {
		XoW.logger.ms(this.classInfo + "popMessage");
		
		var realJid = $(message).attr('from');
		if(!realJid) {
			// 没有from不处理
			return;
		}
		realJid = this.getRealJid(type, realJid);
//		if('group' == type || 'room' == type) {
//			
//			realJid = XoW.utils.getBareJidFromJid(realJid);
//		}
		
		var html = this.getMessageHtml(type, message);
		// var $msg = $(message);
		// var realJid = this.getRealJid(type, $msg.attr('from'));
		if(this._gblMgr.getViewMgr().isJidChatNow(realJid)) {
			// 如果是当前聊天
			XoW.logger.d(this.classInfo + "当前聊天");
			this.popMessageToChatnow(type, realJid, html);
		} else {
			XoW.logger.d(this.classInfo + "非当前聊天");
			this.popMessageToNotChatnow(type, realJid, html);
		}
		XoW.logger.me(this.classInfo + "popMessage");
	},

	
	popMessageToChatnow : function(type, realJid, html) {
		// 直接弹到聊天窗口中
		// 并且把scorll拉下来
		// 暂时不考虑该窗口是不是最小化了，，可是最小化了如何通知来了新消息。
		XoW.logger.ms(this.classInfo + "popMessageToChatnow");
		
		// var $msg = $(message);
//		var realJid = this.getRealJid(type, jid);
		
		if(!realJid) {
			return;
		}
		var $imarea = this._gblMgr.getViewMgr().getLayimChatarea(this.getOneOrGroup(type), realJid);
		//var html = this.messageHtml(type, message);
		
		$imarea.append(html);
		$imarea.scrollTop($imarea[0].scrollHeight);
		XoW.logger.me(this.classInfo + "popMessageToChatnow");
	},
	popMessageToNotChatnow : function(type, realJid, html) {
		// 弹到聊天窗口中
		// 左侧显示红点，有新消息
		XoW.logger.ms(this.classInfo + "popMessageToChatnow");
		
//		var $msg = $(message);
//		var realJid = this.getRealJid(type, $msg.attr('from'));
		if(!realJid) {
			return;
		}
		var $imarea = this._gblMgr.getViewMgr().getLayimChatarea(this.getOneOrGroup(type), realJid);
		//var html = this.messageHtml(type, message);
		
		$imarea.append(html);
		// $imarea.scrollTop($imarea[0].scrollHeight);
		this.showNewMessageInChatList(type, realJid);
		
		XoW.logger.me(this.classInfo + "popMessageToChatnow");
	},
	
	getOneOrGroup : function(type) {
		switch(type) {
			case 'one' :
			case 'roomprivate' :
			case 'groupprivate' :
				return 'one';
				break;
			case 'room' : 
			case 'group' :
				return 'group';
				break;
		}
	},
	
	showNewMessageInChatList : function(type, jid) {
		var $chatList = null;
		switch(type) {
			case 'one' :
			case 'roomprivate' :
			case 'groupprivate' :
				$chatList = this._gblMgr.getViewMgr().getLayimChatmore('one', jid);
				break;
			case 'room' : 
			case 'group' :
				$chatList = this._gblMgr.getViewMgr().getLayimChatmore('group', XoW.utils.getBareJidFromJid(jid));
				break;
		}
		if($chatList) {
			$chatList.find('im').show();
		}
	},
	hideNewMessageInChatList : function(type, jid) {
		var $chatList = null;
		switch(type) {
			case 'one' :
			case 'roomprivate' :
			case 'groupprivate' :
				$chatList = this._gblMgr.getViewMgr().getLayimChatmore('one', jid);
				break;
			case 'room' : 
			case 'group' :
				$chatList = this._gblMgr.getViewMgr().getLayimChatmore('group', XoW.utils.getBareJidFromJid(jid));
				break;
		}
		if($chatList) {
			$chatList.find('im').hide();
		}
	},
	
	
	
	getMessageHtml : function(type, message) {
		
		var html = '';
		switch (type) {
			case 'one' : 
				break;
			case 'room' : 
				break;
			case 'roomprivate' : 
				msg = this.extractMessage(message);
				
				var nick = XoW.utils.getResourceFromJid(msg.from);
				html = this.roomPrivateMessageHtml(msg, '', nick);
				break;
			case 'group' :
				// message未解析
				html = this.groupMessageHtml(type, message);
				break;
			case 'groupprivate' : 
				msg = this.extractMessage(message);
				var groupuser = this._gblMgr.getOrgnizationMgr().getGroupuserByGroupuserjid(msg.from);
				msg.groupuser = groupuser;
				// msg 是解析后的
				html = this.groupprivateMessageHtml(type, msg);
				break;
		}
		return html;
	},
	
	// 注意，这里的type是 '' 或者 'me'
	// 下面 groupPrivateMessageHtml 的不是= =。。
	roomPrivateMessageHtml : function(msg, type, nick) {
		// 房间私聊不可能有延迟消息，故而不判断isDelay
		var time = msg.time;
		var body = msg.showBody;
		 return '<li class="'+ (type === 'me' ? 'layim_chateme' : '') +'">'
		  +'<div class="layim_chatuser">'
		      + function(){
		          if(type === 'me'){
		              return '<span class="layim_chattime">'+ time +'</span>'
		                     +'<span class="layim_chatname">'+ nick +'</span>';
		          } else {
	        		  return  '<span class="layim_chatname">'+ nick +'</span>'
	        		  +'<span class="layim_chattime">'+ time +'</span><span style="color:red;"></span>';  
		          }
		      }()
		  +'</div>'
		  // 获取消息，不做遍历了，因为也没用用到多个body
		  // 此时的body要求已经转义完成可以显示，不然会被JS攻击
		  +'<div class="layim_chatsay">'+ body +'<em class="layim_zero"></em></div>'
		  +'</li>';
	},
	
	groupprivateMessageHtml : function(type, msg) {
		XoW.logger.ms(this.classInfo + "roomMsgHtml()");
		
		var groupuser = msg.groupuser;
		if(!groupuser) {
			XoW.logger.d(this.classInfo + "该部门中不存在该好友");
			return;
		}
		// var groupuser = this._gblMgr.getOrgnizationMgr().getGroupuserByGroupuserjid(msg.from);
		var face = this.getUserFaceFromFaceData(groupuser.face);
		var type = '';
		if(this._gblMgr.getCurrentUser().jid == groupuser.userjid) {
			type = 'me';
		}
		var historyMsg = '';
		if(msg.isDelay) { 
			historyMsg = '(历史消息)';
		}
		var name = groupuser.usernickname;
		var time = msg.time;
		var body = msg.showBody;
		
		return '<li class="'+ (type === 'me' ? 'layim_chateme' : '') +'">'
		  +'<div class="layim_chatuser">'
		      + function(){
		          if(type === 'me'){
		              return '<span class="layim_chattime">'+ time +'</span>'
		                     +'<span class="layim_chatname">'+ name + '</span>'
		                     +'<img src="'+ face +'" >';
		          } else {
		        	 // if(XoW.MessageContentType.DELAYMSG == msg.getContentType()) {
		        		  return '<img src="'+ face +'" >'
		        		  +'<span class="layim_chatname">'+ name +'</span>'
		        		  +'<span class="layim_chattime">'+ time +'</span><span style="color:red;">' + historyMsg + '</span>';  
//		        	  } else {
//		        		  return '<img src="'+ face +'" >'
//		        		  +'<span class="layim_chatname">'+ name +'</span>'
//		        		  +'<span class="layim_chattime">'+ time +'</span>';  
//		        	  }
		          }
		      }()
		  +'</div>'
		  // 获取消息，不做遍历了，因为也没用用到多个body
		  // 此时的body要求已经转义完成可以显示，不然会被JS攻击
		  +'<div class="layim_chatsay">'+ body +'<em class="layim_zero"></em></div>'
		  +'</li>';
		/*
	    return '<li class="'+ (type === 'me' ? 'layim_chateme' : '') +'">'
			  +'<div class="layim_chatuser">'
			      + function(){
			          if(type === 'me'){
			              return '<span class="layim_chattime">'+ time +'</span>'
			                     +'<span class="layim_chatname">'+ nick +'</span>';
			          } else {
		        		  return  '<span class="layim_chatname">'+ nick +'</span>'
		        		  +'<span class="layim_chattime">'+ time +'</span><span style="color:red;">' + historyMsg+ '</span>';  
			          }
			      }()
			  +'</div>'
			  // 获取消息，不做遍历了，因为也没用用到多个body
			  // 此时的body要求已经转义完成可以显示，不然会被JS攻击
			  +'<div class="layim_chatsay">'+ body +'<em class="layim_zero"></em></div>'
			  +'</li>';*/
	},
	
	groupMessageHtml : function(type, message) {
		XoW.logger.ms(this.classInfo + "roomMsgHtml()");
		
		msg = this.extractMessage(message);
		var groupuser = this._gblMgr.getOrgnizationMgr().getGroupuserByGroupuserjid(msg.from);
		var face = this.getUserFaceFromFaceData(groupuser.face);
		var type = '';
		if(this._gblMgr.getCurrentUser().jid == groupuser.userjid) {
			type = 'me';
		}
		var historyMsg = '';
		if(msg.isDelay) { 
			historyMsg = '(历史消息)';
		}
		var name = groupuser.usernickname;
		var time = msg.time;
		var body = msg.showBody;
		
		return '<li class="'+ (type === 'me' ? 'layim_chateme' : '') +'">'
		  +'<div class="layim_chatuser">'
		      + function(){
		          if(type === 'me'){
		              return '<span class="layim_chattime">'+ time +'</span>'
		                     +'<span class="layim_chatname">'+ name + '</span>'
		                     +'<img src="'+ face +'" >';
		          } else {
		        	 // if(XoW.MessageContentType.DELAYMSG == msg.getContentType()) {
		        		  return '<img src="'+ face +'" >'
		        		  +'<span class="layim_chatname">'+ name +'</span>'
		        		  +'<span class="layim_chattime">'+ time +'</span><span style="color:red;">' + historyMsg + '</span>';  
//		        	  } else {
//		        		  return '<img src="'+ face +'" >'
//		        		  +'<span class="layim_chatname">'+ name +'</span>'
//		        		  +'<span class="layim_chattime">'+ time +'</span>';  
//		        	  }
		          }
		      }()
		  +'</div>'
		  // 获取消息，不做遍历了，因为也没用用到多个body
		  // 此时的body要求已经转义完成可以显示，不然会被JS攻击
		  +'<div class="layim_chatsay">'+ body +'<em class="layim_zero"></em></div>'
		  +'</li>';
		/*
	    return '<li class="'+ (type === 'me' ? 'layim_chateme' : '') +'">'
			  +'<div class="layim_chatuser">'
			      + function(){
			          if(type === 'me'){
			              return '<span class="layim_chattime">'+ time +'</span>'
			                     +'<span class="layim_chatname">'+ nick +'</span>';
			          } else {
		        		  return  '<span class="layim_chatname">'+ nick +'</span>'
		        		  +'<span class="layim_chattime">'+ time +'</span><span style="color:red;">' + historyMsg+ '</span>';  
			          }
			      }()
			  +'</div>'
			  // 获取消息，不做遍历了，因为也没用用到多个body
			  // 此时的body要求已经转义完成可以显示，不然会被JS攻击
			  +'<div class="layim_chatsay">'+ body +'<em class="layim_zero"></em></div>'
			  +'</li>';*/
	},
	
	
	
	getRealJid : function(type, jid) {
		if(!jid) {
			return null;
		}
		if('group' == type || 'room' == type) { 
			// 如果是群组或者聊天室，那么消息的from是  xx@fwgroup.openfire/lxy
			// 或者   xx@conference.openfire/lxy。
			// 所以需要变成   xx@conference.openfire
			return XoW.utils.getBareJidFromJid(jid);
		}
		return jid;
	},
	
	messageBodyToShowBody : function(body) {
		// 发送过来的消息可能包含表情符号，换行\n，脚本等信息，要进行处理。
		// 1，先将脚本全部转码XoW.utils.xmlescape
		// 2，\n 转为br 
		// 3，将表情解析为图片
		// body = message.body;
		// 1，
		// XoW.logger.w("文本表情前" + body); 这里最好不要打日志，因为是还未转码的脚本
		body = XoW.utils.xmlescape(body); // 对方可能发送脚本过来，先转换了
		// XoW.logger.w("文本表情后" + body);
		// 2，
		XoW.logger.w("特殊字符" + body);
		body = body.replace(/\n/g, "<br/>"); // 替换\n为br， 这样就能换行
		// body = body.replace(/\&nbsp;/g, " ");
//		XoW.logger.w("特殊字符" + body);
//		// 3，解析表情
		XoW.logger.w("解析表情" + body);
		body = this._gblMgr.getViewMgr().StringToFace(body);
		
		return body;
	},
	extractMessage : function(message) {
		var $message = $(message);
		var body = $('body', $message).text();
		var from = $message.attr('from');
		var to = $message.attr('to');
		var type = $message.attr('type');
		var time = XoW.utils.getCurrentDatetime();
		var isDelay = false;
		if($('delay', $message).length > 0) {
			time = XoW.utils.getFromatDatetime($('delay', $message).attr('stamp'));
			isDelay = true;
		}
		
		
		return {
			messageBody : body,
			showBody : this.messageBodyToShowBody(body),
			from : from,
			to : to,
			type : type,
			time : time,
			isDelay : isDelay,
		};
	},
	getUserFaceFromFaceData : function(data) {
		return this._gblMgr.getViewMgr().getUserFaceFromFaceData(data);
	},

	
	
};


return XoW;
}));