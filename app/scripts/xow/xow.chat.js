
(function(factory) {
	return factory(XoW);
}(function(XoW) {



XoW.ChatManager = function(globalManager) {
	this._gblMgr = globalManager;
	
	// this.fromUser = this._gblMgr.getCurrentUser();
	
	this.jidChats = [];
	//this.threadChats = [];
	// 如果view在jidChats上添加监听，每次调用setJidChats的时候，给新增的chat加上回调
	// 但是如何知道新增的chat是哪个？
	// 按道理来说用jidChats.push(chat)这样的话，就是最后一个chat
	// 但是如果同时来了多个chat怎么办？即chat1来了，view应该给他加上
	// 监听，但是正在view要去取这个chat的时候，chat2来了，这样view不就
	// 取到了chat2了么。chat2又触发了监听，那么chat2不就加了2次view的监听
	// 所以最后决定在view那边，有个listenChat记录view已经添加了监听的chat。
	
//	this._vcardCbHandlers = [];
	
	this.handlers = [];
	this._ibbFileHandlers = []; // 所有文件的open/close/data都会触发这个。
	
	
	this.handlers = null;
	// 当前类的信息
	this.classInfo = "【ChatManager】";
	this._init();
};
XoW.ChatManager.prototype = {
	_init : function() {
		XoW.logger.ms(this.classInfo + "_init()");
		
		this.handler = new XoW.Handler();
		
		
		// 有个问题就是错误节怎么解决，在哪里进行处理？
		// 监听消息节
		this._gblMgr.getConnMgr().addHandler(this._messageCb.bind(this), null, "message");
		// 监听发送文件
		this._gblMgr.getConnMgr().getStropheConnection().si_filetransfer.addFileHandler(this._siFiletransferCb.bind(this));
		// ibb带内文件
		this._gblMgr.getConnMgr().getStropheConnection().ibb.addIBBHandler(this._ibbReceiveFileCb.bind(this));
		
		// 监听类型为chat的message节
		//this._gblMgr.getConnMgr().addHandler(this._messageHandler_cb.bind(this), null, "message", "chat");
		// si_file 监听文件
		//this._gblMgr.getConnMgr().getStropheConnection().si_filetransfer.addFileHandler(this._ibbSIFileHandler_cb.bind(this));
		// ibb带内文件
		//this._gblMgr.getConnMgr().getStropheConnection().ibb.addIBBHandler(this._ibbReceiveFileHandler_cb.bind(this));
		// 监听 ibb close 节
		
		// 此处应更设置一个inteval ，每过多少秒对 file经行处理，将其中的  MESTOP/NOMESTOP的文件的data清空
		// 至于已receive的文件，如果是自己发送的，则清空
		// 1,图片不能清空。
		// 如果是对方发送给我的，3分钟之内不能清空= =，这个三分钟从接收完文件算起，可能不能写在这了。
		
		
		XoW.logger.me(this.classInfo + "_init()");
	},
	getJidChats : function(){ return this.jidChats; },
	setJidChats : function(_jidChats){
		var params = {
			oldValue : this.jidChats,
			newValue : _jidChats,
		};
		this.jidChats = _jidChats;
		this.triggerHandlerInChatMgr("jidChats", params);
	},
	addJidChat : function(_jidChat) {
		var params = {
			oldValue : this.jidChats,
			addValue : _jidChat,
		};
		this.jidChats.push(_jidChat);
		this.triggerHandlerInChatMgr("addJidChat", params);
	},
	
	
	
	/**
     * 回调与触发。
     * @param proName
     * @param callback
     */
    addHandlerToChatMgr : function(proName, callback) {
    	XoW.logger.ms(this.classInfo + "addHandlerToChatMgr()");
    	XoW.logger.d(this.classInfo + "添加了一个监听，监听属性： " + proName);
    	this.handler.addHandler(proName, callback);
    	XoW.logger.me(this.classInfo + "addHandlerToChatMgr()");
    },
    deleteHandlerInChatMgr : function(id) {
    	XoW.logger.ms(this.classInfo + "deleteHandlerInChatMgr()");
    	this.handler.deleteHandler(id);
    	XoW.logger.me(this.classInfo + "deleteHandlerInChatMgr()");
    },
    triggerHandlerInChatMgr : function(proName, params) {
    	XoW.logger.ms(this.classInfo + "triggerHandlerInChatMgr()");
    	XoW.logger.d(this.classInfo + "触发的属性是： " + proName);
    	this.handler.triggerHandler(proName, params);
    	XoW.logger.me(this.classInfo + "triggerHandlerInChatMgr()");
    },
	//getThreadChats : function(){ return this.threadChats; },
	//setThreadChats : function(_threadChats){ this.threadChats = _threadChats; this.propertyChanged(XoW.ChatManagerEnum.THREADCHATS); },

    _messageCb : function(stanza) {
    	XoW.logger.ms(this.classInfo + "_messageCb");
    	
    	var $message = $(stanza);
    	var fromDomain = XoW.utils.getDomainFromJid($message.attr('from'));
    	var myDomain = XoW.utils.getDomainFromJid(this._gblMgr.getCurrentUser().jid);
    	// 以这种方式来区分是会议室的消息/会议室的私聊 还是个人消息
    	// 如果两个doamin相同，则说明是个人消息
    	XoW.logger.d(this.classInfo + "两个域是：");
    	XoW.logger.p({fromDomain : fromDomain, myDomain : myDomain});
    	if(fromDomain == myDomain) {
    		var pureJid = XoW.utils.getBareJidFromJid($message.attr('from')); 
    		
    		// 到时候这边看看要不要把type=errror的消息拦截下来。在外面进行统一的处理。
    		var msg = {
    			id : '',
    			to : '',
    			from : '',
    			type : 'normal', // normal广播, chat, groupchat, headline通知, error
    			contentType : '', // msg, delaymsg, active, inactive, gone, composing, paused
    			threadId : '',
    			time : '',
    			isRead : false,
    			body : '',
    		};
    		
			msg.id = $message.attr('id');
			msg.to = $message.attr('to'); // 非纯jid，是全jid
			msg.from = $message.attr('from'); 
			msg.threadId = $('thread', $message).html();
			msg.time = XoW.utils.getCurrentDatetime();

			var type = $message.attr('type');
			if(!type) {
	    		// 如果没有type，则认为是normal
	    		XoW.logger.i(this.classInfo + "刚到的消息没有类型！");
	    		// 如果刚到的消息里面有body，则认为是 noraml msg
	    		if($('body', $message).length) {
	    			msg.type = 'normal';
	    			msg.contentType = 'msg';
	    			msg.body = $('body', $message).text();
	    			if($('delay', $message).length) {
	    				msg.time = XoW.utils.getFromatDatetime($('delay', $message).attr('stamp'));
	    				msg.contentType = 'delaymsg';
	    			} 
	    		} else {
	    			// 可能是invite信息。。。
	    		}
	    	} else {
		    	switch(type) {
			    	case 'chat' : 
			    		// 一对一聊天，或者是在聊天室中的私聊
			    		XoW.logger.i(this.classInfo + "刚到的消息是一个chat！");
			    		msg.type = 'chat';
			    		if($('active', $message).length) {
			    			msg.contentType = "active";
			    			msg.isRead = true;
			    		} else if($('inactive', $message).length) {
			    			msg.contentType = "inactive";
			    			msg.isRead = true;
			    		} else if($('composing', $message).length) {
			    			msg.contentType = "composing";
			    			msg.isRead = true;
			    		} else if($('paused', $message).length) {
			    			msg.contentType = "paused";
			    			msg.isRead = true;
			    		} else if($('gone', $message).length) {
			    			msg.contentType = "gone";
			    			msg.isRead = true;
			    		} 
			    		if($('body', $message).length) {
			    			msg.body = $('body', $message).text();
			    			msg.isRead = false;
			    			msg.contentType = 'msg';
			    		}
			    		if($('delay', $message).length) {
							msg.time = XoW.utils.getFromatDatetime($('delay', $message).attr('stamp'));
							msg.contentType = 'delaymsg';
						} 
			    		XoW.logger.d(this.classInfo + "消息内容");
			    		XoW.logger.p({type : msg.type, contentType : msg.contentType });
		    			break;
			    	case 'error' : 
			    		XoW.logger.i(this.classInfo + "刚到的消息是一个error！");
			    		// 错误
			    		msg.type = 'error';
			    		XoW.logger.d(this.classInfo + "有个错误的消息节");
			    		break;
			    	case 'groupchat' : 
			    		// groupchat由room那边接管来做，这里不处理。
			    		XoW.logger.i(this.classInfo + "刚到的消息是一个groupchat！");
			    		
			    		break;
			    	case 'headline' : 
			    		// 警告，通知，不期望应答的临时消息（新闻，运动更新）
			    		XoW.logger.i(this.classInfo + "刚到的消息是一个headline！");
			    		msg.Type = 'headline';
			    		// msg.contentType = 'msg';
			    		msg.body = $('body', $message).text();
			    		
			    		break;
			    	case 'normal' : 
			    		XoW.logger.i(this.classInfo + "刚到的消息是一个normal！");
			    		msg.type = 'normal';
			    		msg.contentType = 'msg';
			    		msg.body = $('body', $message).text();
			    		if($('delay', $message).length) {
							msg.time = XoW.utils.getFromatDatetime($('delay', $message).attr('stamp'));
							msg.contentType = 'delaymsg';
						} 
			    		// 在一对一会话和群聊之外被发送的独立消息，并且它期望收到接收者应答
			    		// 暂时还没看到这种消息类型的消息。
			    		// 所以暂不处理。
			    		break;
			    	default : 
			    		// msgType = 'normal';
			    		XoW.logger.e(this.classInfo + "未知类型的节" + type);
			    		
			    		break;
		    	}
				
	    	}
			if('chat' == msg.type || 'headline' == msg.type || 'normal' == msg.type) {
				// 放行
				var chat = this.getChatByJidCanCreate(pureJid);
				chat.addMessage(msg);
			} else if(type == 'error') {
				// 错误节
			} else if(type == 'groupchat') {
					// 群聊节
			} else {
				XoW.logger.w("这个节没有类型");
			}
    	}else {
    		XoW.logger.d(this.classInfo + "是群聊消息，不做处理");
    	}
    	XoW.logger.me(this.classInfo + "_messageCb");
    	return true;
    },
    
    
    /**
	 * 根据好友的jid去获得chat，如果chat不存在，则创建
	 * @param jid 要求纯的jid或全jid
	 */ 
	getChatByJidCanCreate : function(jid) {
		XoW.logger.ms(this.classInfo + "getChatByJidCanCreate()");
		jid = XoW.utils.getBareJidFromJid(jid);
		var chat = this.getChatByJid(jid);
		if(null == chat) {
			chat = this.createChatByJid(jid);
		}
		XoW.logger.me(this.classInfo + "getChatByJidCanCreate()");
		return chat;
	},
	/**
	 * 根据好友的jid得到chat
	 * @param jid 要求纯的jid
	 */
	getChatByJid : function(jid) {
		XoW.logger.ms(this.classInfo + "getChatByJid()");
		
		XoW.logger.d(this.classInfo + "要查找chat的好友是 ：" + jid);
		jid = XoW.utils.getBareJidFromJid(jid);
		for(var i = 0; i < this.jidChats.length; i++) {
			if(jid == this.jidChats[i].to) {
				XoW.logger.d(this.classInfo + "找到了chat的好友是 ：" + jid);
				XoW.logger.me(this.classInfo + "getChatByJid()");
				return this.jidChats[i];
			}
		}
		XoW.logger.d(this.classInfo + "没找到chat的好友是 ：" + jid);
		XoW.logger.me(this.classInfo + "getChatByJid()");
		return null;
	},

	/**
	 * 创建chat
	 * @param to to表示是好友，from表示是我
	 */
	createChatByJid : function(to) {
		XoW.logger.ms(this.classInfo + "createChatByJid()");
		XoW.logger.d(this.classInfo + "要创建chat的好友是 ：" + to);
		
		var chat = new XoW.Chat(this, to);
//		this.chatAddPreHandler(chat);
		// set之后会触发view的_jidChatsChange_cb回调
		
//		var chats = this.getJidChats();
//		chats.push(chat);
//		this.setJidChats(chats); 
		this.addJidChat(chat);
		
		XoW.logger.me(this.classInfo + "createChatByJid()");
		return chat;
	},
	/**
	 * 发送message的处理 ： 界面显示 + 发送处理
	 * @param content 要发送的内容
	 * @param toJid 要发送给的好友
 	 */
	sendMessage : function(content, toJid) {
		XoW.logger.ms(this.classInfo + "sendMessage()");
		// this._gblMgr.getChatMgr.sendMessage(content, toJid);
		// 获得chat，因为可能是我发送的第一条消息，所以可能要创建chat
		var chat = this.getChatByJidCanCreate(toJid);
		
		var msg = {
			id : '',
			to : '',
			from : '',
			type : 'normal', // normal广播, chat, groupchat, headline通知, error
			contentType : '', // msg, delaymsg, active, inactive, gone, composing, paused
			threadId : '',
			time : '',
			isRead : false,
			body : '',
		};
		msg.id = XoW.utils.getUniqueId('msg');
		msg.to = toJid;
		msg.from = this._gblMgr.getCurrentUser().jid;
		msg.type = 'chat';
		msg.contentType = "msg";
		msg.time = XoW.utils.getCurrentDatetime();
		msg.isRead = false;
		msg.body = content;
		
		/*var message = new XoW.MessageModel();
    	message.setId(XoW.utils.getUniqueId('msg'));
    	message.setTo(toJid); // 发送给对方
    	message.setFrom(this._gblMgr.getCurrentUser().getJid()); // 是自己发送的
    	message.setType(XoW.MessageType.CHAT); 
    	message.setIsRead(false); // 未读
    	message.setTime(XoW.utils.getCurrentDatetime()); // 时间
    	message.setContentType(XoW.MessageContentType.MSG);
    	message.body[0] = content;
//    	this.threadId = ""; // 聊天ID		*/
		
    	chat.addMessage(msg); // 触发回调，使页面显示
    	chat.sendMessage(msg); // 真正发送出去
    	/*
    	// 保存消息，比较复杂就是了。。
    	var chatMsg = chat.getAllMessage();
    	chatMsg.push(message);
    	chat.setAllMessage(chatMsg); // set之后会触发view的在chat上的回调，界面的显示
    	chat.sendMessage(message); // 真正发送出去
    	*/
    	
    	XoW.logger.d("【消息内容】" + msg.body);
    	XoW.logger.me(this.classInfo + "sendMessage()");
	},
	
	
	/**
	 * 发送普通文本消息
	 * @param msg 消息节
	 */
	send : function(msg) {
		XoW.logger.ms(this.classInfo + "send()");
		this._gblMgr.getConnMgr().send(msg);
		
		XoW.logger.me(this.classInfo + "send()");
	},
	
	/**
	 * 监听来到的文件
	 * 
	 * @param from
	 * @param sid
	 * @param filename
	 * @param size
	 * @param mime
	 * @param to
	 * @param id
	 * @param _receive_cb 选择接受或者拒绝的回调
	 */
	_siFiletransferCb : function(params, _receiveCb) {
		
		XoW.logger.ms(this.classInfo + "_siFiletransferCb()");
		 // var params = {
//		        	from : from, 
//		        	to : to, 
//		        	id : id, 
//		        	sid : sid, 
//		        	filename : filename, 
//		        	size : size, 
//		        	mime : mime
//		         };
		var file = new XoW.File();
		file.id = params.id;
		file.from = params.from;
		file.sid = params.sid;
		file.to = params.to;
		file.filename = params.filename;
		file.size = params.size;
		if(null == params.mime || '' == params.mime) {
			// 如果没有类型则默认设置这个类型。
			// oneFile.setMime('application/octet-stream');
			file.mime = 'application/octet-stream';
		} else {
			//oneFile.setMime(params.mime);
			file.mime = params.mime;
		}
		
		file.isRead = false;
		file.receiveState = XoW.FileReceiveState.UNRECEIVE;
		file.time = XoW.utils.getCurrentDatetime();
		file.receiveCb = _receiveCb;
		

		XoW.logger.d(this.classInfo + "【文件信息】" + file.toStringAll());
		var chat = this.getChatByJidCanCreate(file.from);  
    	// 保存文件对象到allMessage中
		chat.addMessage(file);
    	
    	// 如果是图片，直接接收，不用确认
    	if(XoW.utils.isImageMIME(file.mime)) {
    		var currentUser = this._gblMgr.getCurrentUser();
    		var friend = this._gblMgr.getUserMgr().getFriendByJid(file.from);
    		var fullToJid = friend.getJid() + "/" + friend.getResource();
    		var fullFromJid = currentUser.getJid() + "/" + currentUser.getResource();
    		file.receiveCb(true, fullFromJid, file.sid, fullToJid, file.id); 
    	}
		
    	XoW.logger.me(this.classInfo + "_ibbSIFileHandler_cb()");
	},
	
	/**
	 * 正式接受来到的文件数据
	 */
	_ibbReceiveFileCb : function(type, from, sid, data, seq, blocksize) {
		XoW.logger.ms(this.classInfo + "_ibbReceiveFileCb()");
		
		var chat = this.getChatByJid(from);
		// chat为空判断
		if(null == chat) {
			XoW.logger.e(this.classInfo + "不存在该chat");
			return;
		}
		var file = chat.getFileBySid(sid);
		if(null == file) {
			XoW.logger.e(this.classInfo + "不存在该file");
			return;
		}
		switch(type) {
		    case "open":
		    	// 插件会回复 同意open。我只要告诉界面已经Open了，
		    	// 还是界面主动来监听？当然是
		    	// from, sid, blocksize有值
		    	// file.setReceiveState(XoW.FileReceiveState.OPEN);
		    	file.blocksize = blocksize;
		    	XoW.logger.i(this.classInfo +  "块大小为：" + blocksize);
		    	
//		    	if(this._gblMgr.getCurrentUser().isMyBareJid(file.from)) {
//		    		// 如果文件是该用户发出的
//		    		this._callIbbFileCb(file, 'me');
//		    	} else {
//		    		this._callIbbFileCb(file, '');
//		    	}
		    	if(!file.changeReceiveState(XoW.FileReceiveState.OPEN)) {
					XoW.logger.e(this.classInfo + "状态错误：切换至OPEN失败," + sid);
					return;
				}
		    	
		      break;
		    case "data":
		    	// 都有值
		    	if(null != file) {
		    		// 1,解码了没？如果需要解码，放在close统一解码
		    		// 2,我需要进行 seq判断吗？大多数情况下是正常的。已进行判断
		    		var fileSeq = file.seq;
		    		fileSeq += 1;
		    		if(fileSeq == seq) {
		    			file.addData(data);
		    			// var fd = file.data;
		    			// fd += data;
		    			// file.setData(fd); 
		    			file.seq = fileSeq;
		    			// file.setReceiveState(XoW.FileReceiveState.RECEIVING);
		    			
		    			// 这里应该需要回调到界面的progressbar
		    			size = XoW.utils.bytesToSize(file.size); // 总大小
		    			resize = XoW.utils.bytesToSize(Math.ceil(file.data.length / 4) * 3); // 当前接收到的大小 
		    			// XoW.logger.w(this.classInfo + " 数据大小" +  size + "  比例 " + resize + "  接受数据大小" + data.length);
		    			// XoW.logger.w(file.getBlocksize() *  file.getSeq());
		    			// XoW.logger.w(this.classInfo + "接受的数据是" + data);
		    			
//		    			if(file.getFrom() == this._gblMgr.getCurrentUser().getJid()) {
//		    				// 如果文件是该用户发出的
//		    				this._callIbbFileCb(file, 'me');
//		    			} else {
//		    				this._callIbbFileCb(file, '');
//		    			}
		    			
		    			if(!file.changeReceiveState(XoW.FileReceiveState.RECEIVING)) {
							XoW.logger.w("切换至RECEIVING失败," + sid);
							return;
						}
		    			
		    		} else {
		    			XoW.logger.w(this.classInfo + " seq错误，期望 :" + fileSeq + ",但是收到 :" + seq );
		    		}
		    	}
		      break;
		    case "close":
		    	// type, from, sid有值
		    	
		    	// 第三次的做法：第二次这个思路应该是有bug的。应该按照   对方发送的文件大小(不是getSize而是getData().length，因为data是经过base64加密的，3个字节变成了4个字节)，
		    	// 对方发送文件每一块大小， 计算出对方发送文件应该有几块
		    	// 然后与seq相比较，这样比较正确的得到对方是不是终止了发送。
		    	XoW.logger.ms(this.classInfo + "对方发送来close sid为" + sid);
		    	var resize = Math.ceil(file.blocksize * (file.seq + 1) / 4) * 3;
				var size = file.size; // 总大小
				if(resize >= size) {
					
					XoW.logger.w(this.classInfo + " 正常关闭");
					// file.setReceiveState(XoW.FileReceiveState.RECEIVE);
					if(!file.changeReceiveState(XoW.FileReceiveState.RECEIVE)) {
						XoW.logger.w("切换至RECEIVE失败," + sid);
						return;
					}
				} else {
					XoW.logger.w(this.classInfo + "_ibbReceiveFileCb() 非正常关闭，对方终止了发送");
					// file.setReceiveState(XoW.FileReceiveState.NOMESTOP);
					if(!file.changeReceiveState(XoW.FileReceiveState.NOMESTOP)) {
						XoW.logger.w("切换至NOMESTOP失败," + sid);
						return;
					}
				}
				
				/*
				if(file.getFrom() == this._gblMgr.getCurrentUser().getJid()) {
		    		// 如果文件是该用户发出的，但是该用户却接受到了一个close，理论上
		    		// 文件是谁发送的，那么就有谁来发送close关闭，这里对方发送了一个close，就说明了对方取消
		    		// 了接收该文件，那么此时，file的state应该就是 nomestop。
		    		// 那么，1,界面上应该显示对方取消接收该文件，2，不应该继续发送剩下的数据。
		    		// this.noMeStopReceivingFile();
					XoW.logger.d(this.classInfo + " 调用this._callIbbFileCb(file, 'me');");
		    		this._callIbbFileCb(file, 'me');
		    	} else {
		    		XoW.logger.d(this.classInfo + " 调用this._callIbbFileCb(file, '');");
		    		this._callIbbFileCb(file, '');
		    	}*/
		    	

		    	break;
		    default:
		      throw new Error("shouldn't be here.");
		  }
		XoW.logger.me(this.classInfo + "_ibbReceiveFileCb()");
	},
	/**
	 * 界面的回调，界面点击接收或者取消接收的回调
	 * @param isReceive 是否接收该文件
	 * @param sid 该文件的sid
	 * @param jid 好友的jid
	 */
	
	dealFileReceive : function(isReceive, sid, jid) {
		XoW.logger.ms(this.classInfo + "dealFileReceive()");
		
		var chat = this.getChatByJid(jid);
		if(null == chat) {
			XoW.logger.w(this.classInfo + "没有找到该chat");
			// 此时界面该作何处理？
			return;
		}
		var msg = chat.getFileBySid(sid);
		if(null == msg) {
			XoW.logger.w(this.classInfo + "没有找到该msg");
			// 此时界面该作何处理？
			return;
		}
		//  _receive_2 : function(isReceive, from, sid, to, id) 
		var cb = msg.receiveCb;
		XoW.logger.d(this.classInfo + "是否接受文件" + isReceive);
		// 发现需要全jid 
		var currentUser = this._gblMgr.getCurrentUser();
		var friend = this._gblMgr.getUserMgr().getFriendByJid(jid);
		var toJid = friend.getJid() + "/" + friend.getResource();
		var fromJid = currentUser.getJid() + "/" + currentUser.getResource();
		if(!isReceive) {
			// 设置拒接 
			// msg.setReceiveState(XoW.FileReceiveState.DENYRECEIVE);
			if(!msg.changeReceiveState(XoW.FileReceiveState.DENYRECEIVE)) {
				XoW.logger.w("切换至DENYRECEIVE失败,");
				return;
			}
		}
		cb(isReceive, fromJid, sid, toJid, msg.id);
		
		XoW.logger.me(this.classInfo + "dealFileReceive()");
	},
	/**
	 * 发送文件，进行si协商。该方法由界面调用。当界面选定一个文件时
	 * 会将要发送的文件的一些内容传到这里，然后在这里构建一个File，进行发送
	 * @param filename 文件名
	 * @param filesize 文件大小
	 * @param filetype 类型
	 * @param data 数据
	 * @param chatnowJid 发给谁
	 */
	sendFileByIBB : function(filename, filesize, filetype, data, chatnowJid, errorCb) {
		XoW.logger.ms(this.classInfo + "sendFileByIBB()");

		// 因为可能是该用户发送的第一条消息，内存中不存在与该好友的chat,所以可能要创建chat
		var chat = this.getChatByJidCanCreate(chatnowJid);
		var friend = this._gblMgr.getUserMgr().getFriendByJid(chatnowJid);
		if(null == friend) {
			XoW.logger.e(this.classInfo + "sendFileByIBB()不存在该好友!");
			return;
		}
		
		// 构建 FileModel，
		var file = new XoW.File();
		file.id = XoW.utils.getUniqueId('file');
		file.from = this._gblMgr.getCurrentUser().getJid(); // 纯jid
		file.to = friend.getJid(); // 纯jid
		file.sid = XoW.utils.getUniqueId('jsi');
		file.filename = filename;
		file.size = filesize;
		if(null == filetype || '' == filetype) {
			// 如果没有类型则默认设置这个类型。
			file.mime = 'application/octet-stream';
			// oneFile.setMime('application/octet-stream');
		} else {
			file.mime = filetype;
		}
		
		/*
		file.setId(XoW.utils.getUniqueId('file'));
		file.setFrom(this._gblMgr.getCurrentUser().getJid()); // 纯jid
		file.setTo(friend.getJid()); // 纯jid
		file.setSid(XoW.utils.getUniqueId('jsi'));
		file.setFilename(filename);
		file.setSize(filesize);
		if(null == filetype || '' == filetype) {
			// 如果没有类型则默认设置这个类型。
			file.setMime('application/octet-stream');
			// oneFile.setMime('application/octet-stream');
		} else {
			file.setMime(filetype);
		}*/
		
		// 注意 data是： “ data:xxx;base64,数据” 的格式，所以要先进行截取。
		var splitPosition= data.indexOf(','); 
		file.data = data.substring(splitPosition + 1);
		file.isRead = false;
		file.receiveState = XoW.FileReceiveState.UNRECEIVE;
		// file.setSavePath("");
		file.receiveCb = null; 
		file.time = XoW.utils.getCurrentDatetime();
		file.type = 'file';
		file.contentType = 'file';
		file.seq = -1;

		// 将该文件保存到allmessage中
		chat.addMessage(file);
    	
		// 调用的 si-filetransfer 去和chatnowJid说我要发送文件了
		// si-filetransfer需要如下参数  
		// send: function (id,to, sid, filename, size, mime, cb) {
		// id
		// to 对方的全jid
		// sid 自己生成的sid
		// filename 文件名
		// size 文件大小
		// mime mime类型
		// cb filetransfer中，发送完 iq si节的回调，如果对方不接受，则cb返回一个error错误。
		
		var fullJid = friend.getFullJid(); 
		var sid = file.sid;
    	this._gblMgr.getConnMgr().getStropheConnection().si_filetransfer.send(file.id, 
    		fullJid, sid, file.filename, file.size, filetype, function(err) {
    		/**
    		 * si协商后的回调函数
    		 * @param err 如果协商成功，err就是空，如果不为空，就是协商失败了。
    		 */
			XoW.logger.ms(this.classInfo + "开始请求对方说我要发送文件了");
			if(err) {
				XoW.logger.w(this.classInfo + " 协商失败，对方不接受文件" + sid + " 错误是： " +  err);
				if(!file.changeReceiveState(XoW.FileReceiveState.DENYRECEIVE)) {
					XoW.logger.e(this.classInfo + " 切换至状态denyReceive失败");
					return;
				} 
				// this._callIbbFileCb(file, 'me');
				return;
			} 
    			
			XoW.logger.w(this.classInfo + "对方同意接收该文件" + sid);

			// 发送思路，按照 4096的大小来发送
			// open: function (to, sid, bs, cb) {
			// data: function (to, sid, seq, data, cb) {
			// close: function (to, sid, cb) {
			this._gblMgr.getConnMgr().getStropheConnection().ibb.open(fullJid, sid, '4096', function(err) {
				/**
				 * open的回调，如果err为空，则说明open成功，可以继续发送数据了。
				 * @param err 错误
				 */
				if(err) {
					XoW.logger.w(this.classInfo + " open失败，切换至ERROR状态" + err);
					// 未处理，是否需要一个  未知错误，文件发送被取消了。
					if(!file.changeReceiveState(XoW.FileReceiveState.ERROR)) {
						XoW.logger.w("切换至ERROR失败," + sid);
						return;
					}
					// this._callIbbFileCb(file, 'me');
					return;
				}
					
				file.seq = 0;
				var d0 = file.data.substring(0, 4096);
				if(!file.changeReceiveState(XoW.FileReceiveState.OPEN)) {
					XoW.logger.w("切换至open失败," + sid);
					return;
				}
				// this._callIbbFileCb(file, 'me');
				
				// 发送第0个seq的数据
				this._gblMgr.getConnMgr().getStropheConnection().ibb.data(fullJid, sid, file.seq, d0, function(err) {
					/**
					 * data的回调，发送成功err为空
					 * @param err
					 */
					if(err) {
						if(!file.changeReceiveState(XoW.FileReceiveState.ERROR)) {
	    					XoW.logger.w(this.classInfo + " 切换至状态ERROR失败");
	    					return;
	    				} 
						// this._callIbbFileCb(file, 'me');
						XoW.logger.w(this.classInfo + " data0失败" + err);
						return;
					}
					
					this._sendFileData(fullJid, sid, file);
					if(!file.changeReceiveState(XoW.FileReceiveState.RECEIVING)) {
						XoW.logger.w("切换至RECEIVING失败," + sid);
						return;
					}
					
					// this._callIbbFileCb(file, 'me');
					// 重复发送数据
				}.bind(this));
			}.bind(this));
			XoW.logger.me(this.classInfo + "sendSIFile_cb()");
		}.bind(this));
    	
    	
    	
    	XoW.logger.me(this.classInfo + "sendFileByIBB()");
	},
	
	/**
	 * 由于错误的情况较少遇到，并且不太清除会报出哪些错误，暂时  err中未做处理
	 * 已知的错误：item-not-found。发送给对方数据，但是该sid对应的文件已经close了。
	 * @param fullJid
	 * @param sid
	 * @param file
	 */
	_sendFileData : function(fullJid, sid, file) {
		XoW.logger.ms(this.classInfo + "_sendFileData");
		
 		var dataLength = file.data.length;
 	// 因为seq从0开始。而seq=0在外面已经发送，这里发送的一定是seq>0
 		var seq = file.seq; 
		if(dataLength > (seq + 1) * 4096) { 
			// 还有需要发送的数据
			if(!file.changeReceiveState(XoW.FileReceiveState.RECEIVING)) {
				// 如果文件已经被停止发送了，则不再继续发送数据
				XoW.logger.w("切换至RECEIVING失败," + sid);
				return;
			}
			var dSeq = file.data.substring(4096 * (seq + 1), (seq + 2) * 4096); // 左闭右开。0<= x < 4096
			file.seq = seq + 1;
			// this._callIbbFileCb(file, 'me');
			this._gblMgr.getConnMgr().getStropheConnection().ibb.data(fullJid, sid, file.seq, dSeq, function(err) {
				if(err) {
					if(!file.changeReceiveState(XoW.FileReceiveState.ERROR)) {
    					XoW.logger.w(this.classInfo + " 切换至状态ERROR失败");
    					return;
    				} 
					// this._callIbbFileCb(file, 'me');
					XoW.logger.w(this.classInfo + " data失败" + err);
					return;
				}
				this._sendFileData(fullJid, sid, file); // 回调
			}.bind(this));
		} else {
			// 数据发送完成，调用close
			this._gblMgr.getConnMgr().getStropheConnection().ibb.close(fullJid, sid, function(err) {
				if(err) {
					if(!file.changeReceiveState(XoW.FileReceiveState.ERROR)) {
    					XoW.logger.w(this.classInfo + " 切换至状态ERROR失败");
    					return;
    				} 
					//this._callIbbFileCb(file, 'me');
					XoW.logger.w(this.classInfo + " close失败" + err);
					return;
				}
				if(!file.changeReceiveState(XoW.FileReceiveState.RECEIVE)) {
					XoW.logger.w("切换至RECEIVE失败," + sid);
					return;
				}
				// this._callIbbFileCb(file, 'me');
			}.bind(this));
		}
		XoW.logger.me(this.classInfo + "");
	},
	
	/**
	 * 自己点击界面上的停止接收或者停止发发送文件。
	 * @param jid 对方的jid
	 * @param sid 该文件的sid
	 */
	stopReceiveSendFile : function(jid, sid) {
		XoW.logger.ms(this.classInfo + "stopReceiveSendFile()");
		var chat = this.getChatByJid(jid);
		var file = chat.getFileBySid(sid);
		var friend = this._gblMgr.getUserMgr().getFriendByJid(jid);
		this._gblMgr.getConnMgr().getStropheConnection().ibb.close(friend.getFullJid(), sid, function(err) {
			XoW.logger.d(this.classInfo + " 设置状态并回调");
			
			// file.setReceiveState(XoW.FileReceiveState.MESTOP);
			if(!file.changeReceiveState(XoW.FileReceiveState.MESTOP)) {
				XoW.logger.w("切换至MESTOP失败," + sid);
				return;
			}
			//if(file.getFrom() == this._gblMgr.getCurrentUser().getJid()) {
	    		// 如果文件是该用户发出的
	    	//	this._callIbbFileCb(file, 'me');
	    //	} else {
	    		this._callIbbFileCb(file, '');
	    	//}
		}.bind(this));
		XoW.logger.me(this.classInfo + "stopReceiveSendFile()");
	},
	
	line__________________________ : function() {},
	
	
	// 添加
	addIbbFileHandler : function(callback) {
		XoW.logger.ms(this.classInfo + "addIbbFileHandler()");
		
		var _handler = {
				id : XoW.utils.getUniqueId("ibbFileHandler"), // 这个handler的id，用于后面dele用的
				cb : callback // 回调函数
		};
		
		this._ibbFileHandlers.push(_handler); // 加入处理器数组中
		
		XoW.logger.me(this.classInfo + "addIbbFileHandler()");
		return _handler.id; // 返回该处理器id
	},
	// 删除
	deleteIbbFileHandler : function(id) {
		for (var i = 0; i < this._ibbFileHandlers.length; i++) {
            var _handler = this._ibbFileHandlers[i];
            if(_handler.id == id) {
            	var index = this._ibbFileHandlers.indexOf(_handler);
                if (index >= 0) {
                    this._ibbFileHandlers.splice(index, 1);
                }
            	break;
            };
		};
	},
	// 触发
	_callIbbFileCb : function(file, changeType) {
		XoW.logger.ms(this.classInfo + "_ibbFileCb()");
		
		 for (var i = 0; i < this._ibbFileHandlers.length; i++) {
			 this._ibbFileHandlers[i].cb(file, changeType);
//            var _handler = this.handlers[i];
//            if(_handler.listenPropery ==  proName) {
//            	_handler.cb(); // 该消息的ID
//            };
		 };
		 
		 XoW.logger.me(this.classInfo + "_ibbFileCb()");
	},
	
	// 添加
	addHandler : function(proName, callback) {
		XoW.logger.ms(this.classInfo + "addHandler()");
		
		var _handler = {
			id : XoW.utils.getUniqueId("chatMgrHandler"), // 这个handler的id，用于后面dele用的
			listenPropery : proName, // 监听的属性名
			cb : callback // 回调函数
		};
		
		this.handlers.push(_handler); // 加入处理器数组中
		
		XoW.logger.me(this.classInfo + "addHandler()");
		return _handler.id; // 返回该处理器id
	},
	// 删除
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
	// 触发
	propertyChanged : function(proName) {
		XoW.logger.ms(this.classInfo + "propertyChanged()");
		
		 for (var i = 0; i < this.handlers.length; i++) {
            var _handler = this.handlers[i];
            if(_handler.listenPropery ==  proName) {
            	_handler.cb(); // 该消息的ID
            };
		 };
		 
		 XoW.logger.me(this.classInfo + "propertyChanged()");
	},
	
	
	/**
	 * 监听message节
	 */

	_messageHandler_cb : function(msg) {
		
		XoW.logger.ms(this.classInfo + "_messageHandler_cb()");
		// 被view监听的是chat的allmessage属性
		// 消息三种，前两种处理方式一样，只是第二种的模板上要显示（离线）
		// 第三种的处理方式是只有当前聊天窗口的用户的才要做
		// 1msg 
		// 2delaymsg
		// 3chat state
		var $msg = $(msg);
    	var message = new XoW.MessageModel();
    	message.setId($msg.attr("id"));
    	message.setTo(XoW.utils.getBareJidFromJid($msg.attr("to")));
    	message.setFrom(XoW.utils.getBareJidFromJid($msg.attr("from")));
    	message.resource = XoW.utils.getResourceFromJid($msg.attr("from"));
    	message.setType($msg.attr("type")); 
    	message.setIsRead(false); // 未读
    	message.setTime(XoW.utils.getCurrentDatetime()); //时间
    	
    	
    	// 判断是不是群组的私人消息。
    	var roomJid = this._gblMgr.getRoomMgr().getRoomServerJid();
    	XoW.logger.w("roomJid" + roomJid + " from" + message.getFrom());
    	if(null != roomJid && roomJid == XoW.utils.getDomainFromJid(message.getFrom())) {
    		// 如果这里改了就要进行扩展。。。
    		// message.isRoomPrivateMessage = true;
    		// 群组消息这里不处理
    		XoW.logger.d(this.classInfo + "，是个群组消息，不处理");
    		return; 
    	}
    	
    	Strophe.forEachChild(msg, "thread", function(elem) {
    		message.setThreadId(elem.textContent);
    	});
    	// 【2016/12/17】这些chatstate消息默认已读
    	// 因为这些消息如果设置成未读，那么获取未读消息数就会包括这些chatstate
    	// 【2016/12/19】在该chat状态属于当前聊天好友的时候，
    	// chatstate消息默认直接显示，如果不是，则就没有用
    	Strophe.forEachChild(msg, "paused", function(elem) {
    		message.setContentType(XoW.MessageContentType.PAUSED);
    		message.setIsRead(true);
    	});
    	Strophe.forEachChild(msg, "active", function(elem) {
    		message.setContentType(XoW.MessageContentType.ACTIVE);
    		message.setIsRead(true);
    	});
    	Strophe.forEachChild(msg, "gone", function(elem) {
    		message.setContentType(XoW.MessageContentType.GONE);
    		message.setIsRead(true);
    	});
    	Strophe.forEachChild(msg, "inactive", function(elem) {
    		message.setContentType(XoW.MessageContentType.INACTIVE);
    		message.setIsRead(true);
    	});
    	Strophe.forEachChild(msg, "composing", function(elem) {
    		message.setContentType(XoW.MessageContentType.COMPOSING);
    		message.setIsRead(true);
    	});
    	
    	/**
    	 * 在后续的抓包中发现 一个message中可能包含了 body同时又包含了聊天状态
    	 * 这种情况的做法是，只要有body，那么这个消息就作为消息来处理。
    	 * 所以将对body的解析放在对 chatstate的解析之下。 并且body解析中的 message.setIsRead(false); 不能少
    	 * <message><body>333</body><active xmlns="http://jabber.org/protocol/chatstates"/></message>
    	 */
    	Strophe.forEachChild(msg, "body", function(elem) {
    		var body = elem.textContent;
    		// 保存消息
    		var bodys = message.getBody();
    		bodys.push(body);
    		message.setBody(bodys);
    		message.setContentType(XoW.MessageContentType.MSG);
    		message.setIsRead(false);
    	});
    	Strophe.forEachChild(msg, "delay", function(elem) {
    		// 对其的格式进行转换，传过来的是如下格式
    		// <delay stamp="2016-12-16T11:42:51.447Z"/>
    		message.setTime(XoW.utils.getFromatDatetime(elem.getAttribute("stamp")));
    		message.setContentType(XoW.MessageContentType.DELAYMSG);
    	});
    	
    	XoW.logger.d("【消息显示前】" + message.toStringAll());
    	
    	var chat = this.getChatByJidCanCreate(message.getFrom());  
    	// 保存消息，比较复杂就是了。。
    	var chatMsg = chat.getAllMessage();
    	chatMsg.push(message);
    	chat.setAllMessage(chatMsg); //set之后会触发view的在chat上的回调
    	XoW.logger.d("【消息显示后】" + message.toStringAll());

    	XoW.logger.me(this.classInfo + "_messageHandler_cb()");
    	return true;
	},
	
	
};
	
// chat 可监听的属性
XoW.ChatModelEnum = {
	TO : "to", //
	THREADID : "threadId", //
//	CHATMANAGER : "chatManager", //
	ALLMESSAGE : "allMessage", //
//	HANDLERS : "handlers", //
}

return XoW;
}));

