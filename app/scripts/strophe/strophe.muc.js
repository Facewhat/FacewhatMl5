/*
 *Plugin to implement the MUC extension.
 http://xmpp.org/extensions/xep-0045.html
 *Previous Author:
 Nathan Zorn <nathan.zorn@gmail.com>
 *Complete CoffeeScript rewrite:
 Andreas Guth <guth@dbis.rwth-aachen.de>
*/
/**
 * 这个插件呢，也是看了一段时间再加上实践才比较懂了一点，做下记录
 * 
 * 首先，还是一样，在页面中通过<script src=''></script>将本插件载入
 * Ajoin方法 join: function(room, nick, msg_handler_cb, pres_handler_cb, roster_cb, password, history_attrs, extended_presence) 
 * 1，使用join方法，可以加入一个房间。
 * 2,并将一些回调（即该房间的roster,presence,message的回调）传给join方法。
 * 在join方法中已经定义了对回调方法的处理，当然，XmppRoom有自定义的2个方法
 * _roomRosterHandler和_parsePresence
 * 3,
 * 
 * 
 * B
 * _roomRosterHandler 会对发送来的presence进行解析，解析出其中的人，然后更新roster{}。
 * 
 * C
 * _parsePresence 解析出的出席数据提供给_roomRosterHandler用于更新其roster
 * 
 * 
 * D
 * XmppRoom房间对象，其中有个roster{}对象，保存该房间的占有者对象Occupant。
 * 
 * 
 * E
 * Occupant占有者对象，
 * 
 */


// 定义占有者，房间配置，xmpp房间
var Occupant, RoomConfig, XmppRoom,
    hasProp = {}.hasOwnProperty,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

    
// 提供的方法
// join 加入一个多用户聊天房间
// leave 离开一个房间
// message 发送消息给某个人/或者整个房间的所有人
// groupchat 给这个房间的人发信息
// invite 邀请某人加入该房间
// multipleInvites 邀请多人加入该房间
// ?directInvite 发送一个直接的请求
// queryOccupants 请求该房间中的所有人
// configure 配置一个房间
// cancelConfigure 取消一个房间的配置
// saveConfiguration 保存一个房间的配置
// ？createInstantRoom 直接创建一个房间，创建一个简单的房间，是这样吗？
// createConfiguredRoom 创建一个有配置的房间
// setTopic 设置话题
// _modifyPrivilege 内部函数，修改权限
// modifyRole 修改某人的角色
// kick 踢人
// voice 发言，参与者
// mute 游客
// op 主持人
// deop 参与者

 // modifyAffiliation 改变岗位
 // ban 禁止进入
 // member 成员
 // revoke 回收，即设置为none
 // owner 所有者
 // admin 管理者

 // changeNick 修改别名
 // setStatus 改变用户当前状态
 // 当想要加入一个要会员才能进入的房间时，需要进行注册行为。
 // registrationRequest 用户提出注册申请
 // 房间必须返回一个数据表单Data Form给用户，用户填写注册需要的信息
 // submitRegistrationForm 用户再次提交注册表单到房间
 // 返回result就说明注册请求已经被处理了。
  
 // listRooms 得到服务器中可用的房间
 // test_append_nick 测试类
Strophe.addConnectionPlugin('muc', {
	_connection: null,
	// 在join中加入房间。在leave中离开房间。即rooms中保存着当前所在的房间
	rooms: {},
	roomNames: [],
	
	/*Function
		Initialize the MUC plugin. Sets the correct connection object and
		extends the namesace.
	 	初始化muc插件，设置正确的连接和命名空间
	*/
	init: function(conn) {
		console.log("mucinit");
		this._connection = conn;
		this._muc_handler = null;
		Strophe.addNamespace('MUC_OWNER', Strophe.NS.MUC + "#owner");
		Strophe.addNamespace('MUC_ADMIN', Strophe.NS.MUC + "#admin");
		Strophe.addNamespace('MUC_USER', Strophe.NS.MUC + "#user");
		Strophe.addNamespace('MUC_ROOMCONF', Strophe.NS.MUC + "#roomconfig");
		return Strophe.addNamespace('MUC_REGISTER', "jabber:iq:register");
	},
		
	/*Function
		Join a multi-user chat room 加入一个多用户聊天房间
		加入一个房间时，会将该房间的信息存到rooms和roomNames中
		此处还定义了，对于msg,roster,presence等回调的处理。
		Parameters:
		(String) room - The multi-user chat room to join. 要加入的房间
		(String) nick - The nickname to use in the chat room. Optional 在房间中使用的别名（可选）
		(Function) msg_handler_cb - The function call to handle messages from the
		specified chat room. 从这个特定的房间来的消息的处理函数
		(Function) pres_handler_cb - The function call back to handle presence
		in the chat room. 从这个特定的房间来的出席消息的处理函数
		(Function) roster_cb - The function call to handle roster info in the chat room 从这个房间来的roster信息
		(String) password - The optional password to use. (password protected
		rooms only)  加入房间的密码（可选）
		(Object) history_attrs - Optional attributes for retrieving history 得到历史消息
		(XML DOM Element) extended_presence - Optional XML for extending presence 扩展的出席的xml
	*/
	  join: function(room, nick, msg_handler_cb, pres_handler_cb, roster_cb, password, history_attrs, extended_presence) {
		  console.log("join");
	    var msg, room_nick;
	    room_nick = this.test_append_nick(room, nick);
	    msg = $pres({
	      from: this._connection.jid,
	      to: room_nick
	    }).c("x", {
	      xmlns: Strophe.NS.MUC
	    });
	    
	    // <x xml='muc'>
	    // 	<history  {'since' : 'xxx', 'maxstanzas' : '20', 'seconds' : '180' }/>
	    //  <password />
	    // 	extended_presence暂不知道是什么，是不是code那些。
	    // </x>
	    if (history_attrs != null) {
	      msg = msg.c("history", history_attrs).up();
	    }
	    if (password != null) {
	      msg.cnode(Strophe.xmlElement("password", [], password));
	    }
	    if (extended_presence != null) {
	      msg.up().cnode(extended_presence);
	    }
	    if (this._muc_handler == null) {
	      this._muc_handler = this._connection.addHandler((function(_this) {
	    	  // 加上处理器，没有筛选，会接收所有节
	    	  // 这里的stanza指的是什么呢？
	        return function(stanza) { 
	          var from, handler, handlers, i, id, len, roomname, x, xmlns, xquery;
	          from = stanza.getAttribute('from');
	          // 如果没有from属性的节，不处理。
	          if (!from) {
	            return true;
	          }
	          //  node@domain/resource。得到node，如果node不在自己保存的rooms中，就说明
	          // 不是自己需要处理的，直接return true不处理
	          roomname = from.split("/")[0];
	          if (!_this.rooms[roomname]) {
	            return true;
	          }
	          // 根据房间名得到该房间
	          room = _this.rooms[roomname];
	          handlers = {};
	          if (stanza.nodeName === "message") { 
	        	  // 如果是消息节，则没有对节进行处理
	            handlers = room._message_handlers;
	          } else if (stanza.nodeName === "presence") {
	        	  // 这里有个bug，当我登录发出的，会返回
	        	  // 报文一：<presence xmlns="jabber:client" from="lxy2的小房间@conference.user-20160421db/lxy2" to="lxy@user-20160421db/6d0jqjpl28" type="error"><x xmlns="http://jabber.org/protocol/muc"><history maxstanzas="10"/><password/></x><error code="409" type="cancel"><conflict xmlns="urn:ietf:params:xml:ns:xmpp-stanzas"/></error></presence>
	        	  // 报文二：<presence xmlns="jabber:client" from="lxy2的小房间@conference.user-20160421db/lxy2" to="lxy@user-20160421db/6d0jqjpl28" id="69a60693-19e4-40a0-9d15-0737a1b87b3b" type="error"><error code="409" type="cancel"><conflict xmlns="urn:ietf:params:xml:ns:xmpp-stanzas"/></error></presence>
	            xquery = stanza.getElementsByTagName("x");
	            if (xquery.length > 0) {
	              for (i = 0, len = xquery.length; i < len; i++) {
	                x = xquery[i];
	                xmlns = x.getAttribute("xmlns");
	                if (xmlns && xmlns.match(Strophe.NS.MUC)) {
	                  handlers = room._presence_handlers;
	                  break;
	                }
	              }
	            }
	          }
	          
	          for (id in handlers) {
	            handler = handlers[id];
	            // 执行回调，如果返回的不是true，则会销毁该回调，所以记得要return true;
	            if (!handler(stanza, room)) {
	              delete handlers[id];
	            }
	          }
	          return true;
	        };
	      })(this));
	    }
	    if (!this.rooms.hasOwnProperty(room)) {
	    	// 在此处将房间加入rooms中。
	      this.rooms[room] = new XmppRoom(this, room, nick, password);
	      if (pres_handler_cb) {
	        this.rooms[room].addHandler('presence', pres_handler_cb);
	      }
	      if (msg_handler_cb) {
	        this.rooms[room].addHandler('message', msg_handler_cb);
	      }
	      if (roster_cb) {
	        this.rooms[room].addHandler('roster', roster_cb);
	      }
	      this.roomNames.push(room);
	    }
	    return this._connection.send(msg);
	  },
	
	  /**
	   * 这个方法是为了：
	   * 比如加入房间的时候，在join方法还未成功的时候（即后面服务器可能因为
	   * 该room不允许你进入/密码输入错误等情况），该插件就已经将那个room放到rooms中了
	   * 导致错误的判断该用户已在这个room中
	   * 还有情况是，用户被ban了，可这个房间还在rooms中
	   * 用户被kcik了，该房间还在rooms中
	   * 
	   */
	  clearWrongRoom : function() {
		  for(var key in this.rooms) {
			  var room = this.rooms[key];
			  var isOccupantsExists = false;
			  for(var key2 in room.roster) {
				  // 如果本人是在这个房间中的，这个房间不需要清理的
				  if(this.rooms[key].nick === key2) {
					  isOccupantsExists = true;
					  break;
				  }
			  }
			  if(!isOccupantsExists) {
				  XoW.logger.w("需清除房间" + room);
				  id = this.roomNames.indexOf(room.name);
				  delete this.rooms[room.name];
				  if (id >= 0) {
				      this.roomNames.splice(id, 1);
				      if (this.roomNames.length === 0) {
				        this._connection.deleteHandler(this._muc_handler);
				        this._muc_handler = null;
				      }
				    }
			  }
		  }
	  },
	  
	  /*Function
	   Leave a multi-user chat room 离开这个多用户聊天房间
	   Parameters: 
	   (String) room - The multi-user chat room to leave. 离开的房间
	   (String) nick - The nick name used in the room. 离开的人的别名
	   (Function) handler_cb - Optional function to handle the successful leave. 处理离开成功的函数
	   (String) exit_msg - optional exit message. 退出消息
	   Returns:
	   iqid - The unique id for the room leave. 离开的这个节的id
	   */
	  leave: function(room, nick, handler_cb, exit_msg) {
	    var id, presence, presenceid, room_nick;
	    id = this.roomNames.indexOf(room);
	    delete this.rooms[room];
	    if (id >= 0) {
	      this.roomNames.splice(id, 1);
	      if (this.roomNames.length === 0) {
	        this._connection.deleteHandler(this._muc_handler);
	        this._muc_handler = null;
	      }
	    }
	    room_nick = this.test_append_nick(room, nick);
	    presenceid = this._connection.getUniqueId();
	    presence = $pres({
	      type: "unavailable",
	      id: presenceid,
	      from: this._connection.jid,
	      to: room_nick
	    });
	    if (exit_msg != null) {
	      presence.c("status", exit_msg);
	    }
	    if (handler_cb != null) {
	      this._connection.addHandler(handler_cb, null, "presence", null, presenceid);
	    }
	    this._connection.send(presence);
	    return presenceid;
	  },
	
	  /*Function
	   Parameters:
	   (String) room - The multi-user chat room name. 房间名称
	   (String) nick - The nick name used in the chat room. 别名
	   (String) message - The plaintext message to send to the room. 在房间中发送的文本消息
	   (String) html_message - The message to send to the room with html markup.带html标签的消息
	   (String) type - "groupchat" for group chat messages o 		groupchat是群聊消息
	   "chat" for private chat messages     	chat是私人消息
	   Returns:
	   msgiq - the unique id used to send the message  该消息的Id
	   */
	  message: function(room, nick, message, html_message, type, msgid) {
	    var msg, parent, room_nick;
	    room_nick = this.test_append_nick(room, nick);
	    type = type || (nick != null ? "chat" : "groupchat");
	    msgid = msgid || this._connection.getUniqueId();
	    msg = $msg({
	      to: room_nick,
	      from: this._connection.jid,
	      type: type,
	      id: msgid
	    }).c("body").t(message);
	    msg.up();
	    if (html_message != null) {
	      msg.c("html", {
	        xmlns: Strophe.NS.XHTML_IM
	      }).c("body", {
	        xmlns: Strophe.NS.XHTML
	      }).h(html_message);
	      if (msg.node.childNodes.length === 0) {
	        parent = msg.node.parentNode;
	        msg.up().up();
	        msg.node.removeChild(parent);
	      } else {
	        msg.up().up();
	      }
	    }
	    msg.c("x", {
	      xmlns: "jabber:x:event"
	    }).c("composing");
	    this._connection.send(msg);
	    return msgid;
	  },
	
	  /*Function
	   Convenience Function to send a Message to all Occupants 发送消息给所有人
	   Parameters:
	   (String) room - The multi-user chat room name.  房间
	   (String) message - The plaintext message to send to the room. 消息
	   (String) html_message - The message to send to the room with html markup. 带html标签的消息
	   (String) msgid - Optional unique ID which will be set as the 'id' attribute of the stanza 该消息的id
	   Returns: 
	   msgiq - the unique id used to send the message 发送消息的id
	   */
	  groupchat: function(room, message, html_message, msgid) {
	    return this.message(room, null, message, html_message, void 0, msgid);
	  },
	
	  /*Function
	   Send a mediated invitation.  请求某人加入该房间
	   Parameters:
	   (String) room - The multi-user chat room name. 房间名
	   (String) receiver - The invitation's receiver. 请求的接收者
	   (String) reason - Optional reason for joining the room. 加入的原因（可选）
	   Returns:
	   msgiq - the unique id used to send the invitation   用来发送该请求的id
	   */
	  invite: function(room, receiver, reason) {
	    var invitation, msgid;
	    msgid = this._connection.getUniqueId();
	    invitation = $msg({
	      from: this._connection.jid,
	      to: room,
	      id: msgid
	    }).c('x', {
	      xmlns: Strophe.NS.MUC_USER
	    }).c('invite', {
	      to: receiver
	    });
	    if (reason != null) {
	      invitation.c('reason', reason);
	    }
	    this._connection.send(invitation);
	    return msgid;
	  },
	
	  /*Function 
	   Send a mediated multiple invitation. 请求多人加入该房间
	   Parameters:
	   (String) room - The multi-user chat room name. 房间名
	   (Array) receivers - The invitation's receivers. 多人
	   (String) reason - Optional reason for joining the room.加入该房间的原因
	   Returns:
	   msgiq - the unique id used to send the invitation  请求加入的Id
	   */
	  multipleInvites: function(room, receivers, reason) {
	    var i, invitation, len, msgid, receiver;
	    msgid = this._connection.getUniqueId();
	    invitation = $msg({
	      from: this._connection.jid,
	      to: room,
	      id: msgid
	    }).c('x', {
	      xmlns: Strophe.NS.MUC_USER
	    });
	    for (i = 0, len = receivers.length; i < len; i++) {
	      receiver = receivers[i];
	      invitation.c('invite', {
	        to: receiver
	      });
	      if (reason != null) {
	        invitation.c('reason', reason);
	        invitation.up();
	      }
	      invitation.up();
	    }
	    this._connection.send(invitation);
	    return msgid;
	  },
	
	  /*Function
	   Send a direct invitation.  发送一个直接的邀请
	   Parameters:
	   (String) room - The multi-user chat room name.  房间名称
	   (String) receiver - The invitation's receiver.  接收者
	   (String) reason - Optional reason for joining the room.  原因（可选）
	   (String) password - Optional password for the room.  密码（可选）
	   Returns:
	   msgiq - the unique id used to send the invitation
	   */
	  directInvite: function(room, receiver, reason, password) {
	    var attrs, invitation, msgid;
	    msgid = this._connection.getUniqueId();
	    attrs = {
	      xmlns: 'jabber:x:conference',
	      jid: room
	    };
	    if (reason != null) {
	      attrs.reason = reason;
	    }
	    if (password != null) {
	      attrs.password = password;
	    }
	    invitation = $msg({
	      from: this._connection.jid,
	      to: receiver,
	      id: msgid
	    }).c('x', attrs);
	    this._connection.send(invitation);
	    return msgid;
	  },
	
	  /*Function
	   Queries a room for a list of occupants  请求该房间中的所有人
	   (String) room - The multi-user chat room name.   房间名称
	   (Function) success_cb - Optional function to handle the info.  请求成功的回调
	   (Function) error_cb - Optional function to handle an error. 请求失败的回调
	   Returns:
	   id - the unique id used to send the info request
	   */
	  queryOccupants: function(room, success_cb, error_cb) {
	    var attrs, info;
	    attrs = {
	      xmlns: Strophe.NS.DISCO_ITEMS
	    };
	    info = $iq({
	      from: this._connection.jid,
	      to: room,
	      type: 'get'
	    }).c('query', attrs);
	    return this._connection.sendIQ(info, success_cb, error_cb);
	  },
	
	  /*Function
	   Start a room configuration.  开始一个房间的配置
	   Parameters:
	   (String) room - The multi-user chat room name.   房间名称
	   (Function) handler_cb - Optional function to handle the config form. 处理配置的回调
	   Returns:
	   id - the unique id used to send the configuration request
	   */
	  configure: function(room, handler_cb, error_cb) {
	    var config, stanza;
	    config = $iq({
	      to: room,
	      type: "get"
	    }).c("query", {
	      xmlns: Strophe.NS.MUC_OWNER
	    });
	    stanza = config.tree();
	    return this._connection.sendIQ(stanza, handler_cb, error_cb);
	  },
	
	  /*Function
	   Cancel the room configuration 取消一个房间的配置
	   Parameters:
	   (String) room - The multi-user chat room name.  房间名称
	   Returns:
	   id - the unique id used to cancel the configuration.
	   */
	  cancelConfigure: function(room) {
	    var config, stanza;
	    config = $iq({
	      to: room,
	      type: "set"
	    }).c("query", {
	      xmlns: Strophe.NS.MUC_OWNER
	    }).c("x", {
	      xmlns: "jabber:x:data",
	      type: "cancel"
	    });
	    stanza = config.tree();
	    return this._connection.sendIQ(stanza);
	  },
	
	  /*Function
	   Save a room configuration.  保存房间的配置
	   Parameters:
	   (String) room - The multi-user chat room name.
	   (Array) config- Form Object or an array of form elements used to configure the room.
	   Returns:
	   id - the unique id used to save the configuration.
	   */
	  saveConfiguration: function(room, config, success_cb, error_cb) {
	    var conf, i, iq, len, stanza;
	    iq = $iq({
	      to: room,
	      type: "set"
	    }).c("query", {
	      xmlns: Strophe.NS.MUC_OWNER
	    });
	    if (typeof Strophe.x !== "undefined" && typeof Strophe.x.Form !== "undefined" && config instanceof Strophe.x.Form) {
	      config.type = "submit";
	      iq.cnode(config.toXML());
	    } else {
	      iq.c("x", {
	        xmlns: "jabber:x:data",
	        type: "submit"
	      });
	      for (i = 0, len = config.length; i < len; i++) {
	        conf = config[i];
	        iq.cnode(conf).up();
	      }
	    }
	    stanza = iq.tree();
	    return this._connection.sendIQ(stanza, success_cb, error_cb);
	  },
	
	  /*Function 创建一个直接的房间
	   Parameters:
	   (String) room - The multi-user chat room name. 房间名称
	   Returns:
	   id - the unique id used to create the chat room.
	   */
	  createInstantRoom: function(room, success_cb, error_cb) {
	    var roomiq;
	    roomiq = $iq({
	      to: room,
	      type: "set"
	    }).c("query", {
	      xmlns: Strophe.NS.MUC_OWNER
	    }).c("x", {
	      xmlns: "jabber:x:data",
	      type: "submit"
	    });
	    return this._connection.sendIQ(roomiq.tree(), success_cb, error_cb);
	  },
	
	  /*Function创建有配置的房间
	   Parameters:
	   (String) room - The multi-user chat room name. 房间名称
	   (Object) config - the configuration. ex: {"muc#roomconfig_publicroom": "0", "muc#roomconfig_persistentroom": "1"}    配置
	   Returns:
	   id - the unique id used to create the chat room. 
	   */
	  createConfiguredRoom: function(room, config, success_cb, error_cb) {
	    var k, roomiq, v;
	    roomiq = $iq({
	      to: room,
	      type: "set"
	    }).c("query", {
	      xmlns: Strophe.NS.MUC_OWNER
	    }).c("x", {
	      xmlns: "jabber:x:data",
	      type: "submit"
	    });
	    roomiq.c('field', {
	      'var': 'FORM_TYPE'
	    }).c('value').t('http://jabber.org/protocol/muc#roomconfig').up().up();
	    for (k in config) {
	      if (!hasProp.call(config, k)) continue;
	      v = config[k];
	      roomiq.c('field', {
	        'var': k
	      }).c('value').t(v).up().up();
	    }
	    return this._connection.sendIQ(roomiq.tree(), success_cb, error_cb);
	  },
	
	  /*Function 设置话题
	   Set the topic of the chat room.
	   Parameters:
	   (String) room - The multi-user chat room name.  房间名称
	   (String) topic - Topic message. 话题
	   */
	  setTopic: function(room, topic) {
	    var msg;
	    msg = $msg({
	      to: room,
	      from: this._connection.jid,
	      type: "groupchat"
	    }).c("subject", {
	      xmlns: "jabber:client"
	    }).t(topic);
	    return this._connection.send(msg.tree());
	  },
	
	  /*Function  内部函数
	   Internal Function that Changes the role or affiliation of a member
	   of a MUC room. This function is used by modifyRole and modifyAffiliation.
	   The modification can only be done by a room moderator. An error will be
	   returned if the user doesn't have permission.
	   修改房间中的一个用户的角色，只有该房间的主持人才有权限这么做，否则会返回一个错误
	   Parameters:
	   (String) room - The multi-user chat room name.  房间名称
	   (Object) item - Object with nick and role or jid and affiliation attribute 新角色信息
	   (String) reason - Optional reason for the change. 改变的原因
	   (Function) handler_cb - Optional callback for success 成功的回调
	   (Function) error_cb - Optional callback for error 失败的回调
	   Returns:
	   iq - the id of the mode change request.
	   */
	  _modifyPrivilege: function(room, item, reason, handler_cb, error_cb) {
	    var iq;
	    iq = $iq({
	      to: room,
	      type: "set"
	    }).c("query", {
	      xmlns: Strophe.NS.MUC_ADMIN
	    }).cnode(item.node);
	    if (reason != null) {
	      iq.c("reason", reason);
	    }
	    return this._connection.sendIQ(iq.tree(), handler_cb, error_cb);
	  },
	
	  /*Function 
	   Changes the role of a member of a MUC room.
	   The modification can only be done by a room moderator. An error will be
	   returned if the user doesn't have permission.
	   改变成员的角色，只有主持人才能这么做，否则返回一个错误。
	   Parameters:
	   (String) room - The multi-user chat room name.
	   (String) nick - The nick name of the user to modify.
	   (String) role - The new role of the user.
	   (String) affiliation - The new affiliation of the user.
	   (String) reason - Optional reason for the change.
	   (Function) handler_cb - Optional callback for success
	   (Function) error_cb - Optional callback for error
	   Returns:
	   iq - the id of the mode change request.
	   */
	  modifyRole: function(room, nick, role, reason, handler_cb, error_cb) {
	    var item;
	    item = $build("item", {
	      nick: nick,
	      role: role
	    });
	    return this._modifyPrivilege(room, item, reason, handler_cb, error_cb);
	  },
	  kick: function(room, nick, reason, handler_cb, error_cb) {
	    return this.modifyRole(room, nick, 'none', reason, handler_cb, error_cb);
	  },
	  voice: function(room, nick, reason, handler_cb, error_cb) {
	    return this.modifyRole(room, nick, 'participant', reason, handler_cb, error_cb);
	  },
	  mute: function(room, nick, reason, handler_cb, error_cb) {
	    return this.modifyRole(room, nick, 'visitor', reason, handler_cb, error_cb);
	  },
	  op: function(room, nick, reason, handler_cb, error_cb) {
	    return this.modifyRole(room, nick, 'moderator', reason, handler_cb, error_cb);
	  },
	  deop: function(room, nick, reason, handler_cb, error_cb) {
	    return this.modifyRole(room, nick, 'participant', reason, handler_cb, error_cb);
	  },
	
	  /*Function
	   Changes the affiliation of a member of a MUC room.
	   The modification can only be done by a room moderator. An error will be
	   returned if the user doesn't have permission.
	   
	   Parameters:
	   (String) room - The multi-user chat room name.
	   (String) jid  - The jid of the user to modify.
	   (String) affiliation - The new affiliation of the user.
	   (String) reason - Optional reason for the change.
	   (Function) handler_cb - Optional callback for success
	   (Function) error_cb - Optional callback for error
	   Returns:
	   iq - the id of the mode change request.
	   */
	  modifyAffiliation: function(room, jid, affiliation, reason, handler_cb, error_cb) {
	    var item;
	    item = $build("item", {
	      jid: jid,
	      affiliation: affiliation
	    });
	    return this._modifyPrivilege(room, item, reason, handler_cb, error_cb);
	  },
	  ban: function(room, jid, reason, handler_cb, error_cb) {
	    return this.modifyAffiliation(room, jid, 'outcast', reason, handler_cb, error_cb);
	  },
	  member: function(room, jid, reason, handler_cb, error_cb) {
	    return this.modifyAffiliation(room, jid, 'member', reason, handler_cb, error_cb);
	  },
	  revoke: function(room, jid, reason, handler_cb, error_cb) {
	    return this.modifyAffiliation(room, jid, 'none', reason, handler_cb, error_cb);
	  },
	  owner: function(room, jid, reason, handler_cb, error_cb) {
	    return this.modifyAffiliation(room, jid, 'owner', reason, handler_cb, error_cb);
	  },
	  admin: function(room, jid, reason, handler_cb, error_cb) {
	    return this.modifyAffiliation(room, jid, 'admin', reason, handler_cb, error_cb);
	  },
	
	  /*Function
	   Change the current users nick name. 改变当前用户的别名
	   Parameters:
	   (String) room - The multi-user chat room name. 房间名称
	   (String) user - The new nick name.  新的别名
	   */
	  changeNick: function(room, user) {
	    var presence, room_nick;
	    room_nick = this.test_append_nick(room, user);
	    
	    presence = $pres({
	      from: this._connection.jid,
	      to: room_nick,
	      id: this._connection.getUniqueId()
	    });
	    return this._connection.send(presence.tree());
	  },
	
	  /*Function
	   Change the current users status.  改变当前用户的状态
	   Parameters:
	   (String) room - The multi-user chat room name.
	   (String) user - The current nick.
	   (String) show - The new show-text.
	   (String) status - The new status-text.
	   */
	  setStatus: function(room, user, show, status) {
	    var presence, room_nick;
	    room_nick = this.test_append_nick(room, user);
	    presence = $pres({
	      from: this._connection.jid,
	      to: room_nick
	    });
	    if (show != null) {
	      presence.c('show', show).up();
	    }
	    if (status != null) {
	      presence.c('status', status);
	    }
	    return this._connection.send(presence.tree());
	  },
	
	  /*Function
	   Registering with a room. 注册一个房间
	   @see http://xmpp.org/extensions/xep-0045.html#register
	   Parameters:
	   (String) room - The multi-user chat room name. 房间名称
	   (Function) handle_cb - Function to call for room list return. 
	   (Function) error_cb - Function to call on error.
	   */
	  registrationRequest: function(room, handle_cb, error_cb) {
	    var iq;
	    iq = $iq({
	      to: room,
	      from: this._connection.jid,
	      type: "get"
	    }).c("query", {
	      xmlns: Strophe.NS.MUC_REGISTER
	    });
	    return this._connection.sendIQ(iq, function(stanza) {
	      var $field, $fields, field, fields, i, len, length;
	      $fields = stanza.getElementsByTagName('field');
	      length = $fields.length;
	      fields = {
	        required: [],
	        optional: []
	      };
	      for (i = 0, len = $fields.length; i < len; i++) {
	        $field = $fields[i];
	        field = {
	          "var": $field.getAttribute('var'),
	          label: $field.getAttribute('label'),
	          type: $field.getAttribute('type')
	        };
	        if ($field.getElementsByTagName('required').length > 0) {
	          fields.required.push(field);
	        } else {
	          fields.optional.push(field);
	        }
	      }
	      return handle_cb(fields);
	    }, error_cb);
	  },
	
	  /*Function
	   Submits registration form. 提交注册表单
	   Parameters:
	   (String) room - The multi-user chat room name. 房间名称
	   (Function) handle_cb - Function to call for room list return. 回调
	   (Function) error_cb - Function to call on error. 失败
	   */
	  submitRegistrationForm: function(room, fields, handle_cb, error_cb) {
	    var iq, key, val;
	    iq = $iq({
	      to: room,
	      type: "set"
	    }).c("query", {
	      xmlns: Strophe.NS.MUC_REGISTER
	    });
	    iq.c("x", {
	      xmlns: "jabber:x:data",
	      type: "submit"
	    });
	    iq.c('field', {
	      'var': 'FORM_TYPE'
	    }).c('value').t('http://jabber.org/protocol/muc#register').up().up();
	    for (key in fields) {
	      val = fields[key];
	      iq.c('field', {
	        'var': key
	      }).c('value').t(val).up().up();
	    }
	    return this._connection.sendIQ(iq, handle_cb, error_cb);
	  },
	
	  /*Function
	   List all chat room available on a server. 得到服务器中可用的房间
	   Parameters:
	   (String) server - name of chat server. 聊天服务器的名称
	   (String) handle_cb - Function to call for room list return. 成功回调
	   (String) error_cb - Function to call on error. 失败回调
	   */
	  listRooms: function(server, handle_cb, error_cb) {
	    var iq;
	    iq = $iq({
	      to: server,
	      from: this._connection.jid,
	      type: "get"
	    }).c("query", {
	      xmlns: Strophe.NS.DISCO_ITEMS
	    });
	    return this._connection.sendIQ(iq, handle_cb, error_cb);
	  },
	  /**
	   * 将nick合成到room中。
	   */
	  test_append_nick: function(room, nick) {
	    var domain, node;
	    node = Strophe.escapeNode(Strophe.getNodeFromJid(room));
	    domain = Strophe.getDomainFromJid(room);
	    return node + "@" + domain + (nick != null ? "/" + nick : "");
	  }
	});
	
	// XmppRoom是对Connection中的muc的再一次包装。
	XmppRoom = (function() {
		// params client 就是Strophe的Connection 
		// params name1 房间名
		// params nick1 用户的昵称
		// params password1 密码
	  function XmppRoom(client, name1, nick1, password1) {
	    this.client = client;
	    this.name = name1; // 就是room的jid
	    this.nick = nick1;
	    this.password = password1;
	    this._roomRosterHandler = bind(this._roomRosterHandler, this);
	    this._addOccupant = bind(this._addOccupant, this);
	    this.roster = {};
	    this._message_handlers = {};
	    this._presence_handlers = {};
	    this._roster_handlers = {};
	    this._handler_ids = 0;
	    if (this.client.muc) {
	      this.client = this.client.muc;
	    }
	    this.name = Strophe.getBareJidFromJid(this.name);
	    this.addHandler('presence', this._roomRosterHandler);
	  }
	
	  XmppRoom.prototype.join = function(msg_handler_cb, pres_handler_cb, roster_cb) {
	    return this.client.join(this.name, this.nick, msg_handler_cb, pres_handler_cb, roster_cb, this.password);
	  };
	
	  XmppRoom.prototype.leave = function(handler_cb, message) {
	    this.client.leave(this.name, this.nick, handler_cb, message);
	    return delete this.client.rooms[this.name];
	  };
	
	  XmppRoom.prototype.clearWrongRoom = function() {
		  this.client.clearWrongRoom();
	  },
	  
	  XmppRoom.prototype.message = function(nick, message, html_message, type) {
	    return this.client.message(this.name, nick, message, html_message, type);
	  };
	
	  XmppRoom.prototype.groupchat = function(message, html_message) {
	    return this.client.groupchat(this.name, message, html_message);
	  };
	
	  XmppRoom.prototype.invite = function(receiver, reason) {
	    return this.client.invite(this.name, receiver, reason);
	  };
	
	  XmppRoom.prototype.multipleInvites = function(receivers, reason) {
		// 【201703032132林兴洋修改2】
		// return this.client.invite(this.name, receivers, reason);
	    return this.client.multipleInvites(this.name, receivers, reason);
	  };
	
	  XmppRoom.prototype.directInvite = function(receiver, reason) {
	    return this.client.directInvite(this.name, receiver, reason, this.password);
	  };
	
	  XmppRoom.prototype.configure = function(handler_cb) {
	    return this.client.configure(this.name, handler_cb);
	  };
	
	  XmppRoom.prototype.cancelConfigure = function() {
	    return this.client.cancelConfigure(this.name);
	  };
	
	  XmppRoom.prototype.saveConfiguration = function(config) {
	    return this.client.saveConfiguration(this.name, config);
	  };
	
	  XmppRoom.prototype.queryOccupants = function(success_cb, error_cb) {
	    return this.client.queryOccupants(this.name, success_cb, error_cb);
	  };
	
	  XmppRoom.prototype.setTopic = function(topic) {
	    return this.client.setTopic(this.name, topic);
	  };
	
	  XmppRoom.prototype.modifyRole = function(nick, role, reason, success_cb, error_cb) {
	    return this.client.modifyRole(this.name, nick, role, reason, success_cb, error_cb);
	  };
	
	  XmppRoom.prototype.kick = function(nick, reason, handler_cb, error_cb) {
	    return this.client.kick(this.name, nick, reason, handler_cb, error_cb);
	  };
	
	  XmppRoom.prototype.voice = function(nick, reason, handler_cb, error_cb) {
	    return this.client.voice(this.name, nick, reason, handler_cb, error_cb);
	  };
	
	  XmppRoom.prototype.mute = function(nick, reason, handler_cb, error_cb) {
	    return this.client.mute(this.name, nick, reason, handler_cb, error_cb);
	  };
	
	  XmppRoom.prototype.op = function(nick, reason, handler_cb, error_cb) {
	    return this.client.op(this.name, nick, reason, handler_cb, error_cb);
	  };
	
	  XmppRoom.prototype.deop = function(nick, reason, handler_cb, error_cb) {
	    return this.client.deop(this.name, nick, reason, handler_cb, error_cb);
	  };
	
	  XmppRoom.prototype.modifyAffiliation = function(jid, affiliation, reason, success_cb, error_cb) {
	    return this.client.modifyAffiliation(this.name, jid, affiliation, reason, success_cb, error_cb);
	  };
	
	  XmppRoom.prototype.ban = function(jid, reason, handler_cb, error_cb) {
	    return this.client.ban(this.name, jid, reason, handler_cb, error_cb);
	  };
	
	  XmppRoom.prototype.member = function(jid, reason, handler_cb, error_cb) {
	    return this.client.member(this.name, jid, reason, handler_cb, error_cb);
	  };
	
	  XmppRoom.prototype.revoke = function(jid, reason, handler_cb, error_cb) {
	    return this.client.revoke(this.name, jid, reason, handler_cb, error_cb);
	  };
	
	  XmppRoom.prototype.owner = function(jid, reason, handler_cb, error_cb) {
	    return this.client.owner(this.name, jid, reason, handler_cb, error_cb);
	  };
	
	  XmppRoom.prototype.admin = function(jid, reason, handler_cb, error_cb) {
	    return this.client.admin(this.name, jid, reason, handler_cb, error_cb);
	  };
	
	  XmppRoom.prototype.changeNick = function(nick1) {
	    this.nick = nick1;
	    // 【林兴洋修改1】
	    // return this.client.changeNick(this.name, nick);
	    return this.client.changeNick(this.name, this.nick);
	  };
	
	  XmppRoom.prototype.setStatus = function(show, status) {
	    return this.client.setStatus(this.name, this.nick, show, status);
	  };
	
	
	  /*Function
	   Adds a handler to the MUC room.
	   Parameters:
	   (String) handler_type - 'message', 'presence' or 'roster'.
	   (Function) handler - The handler function.
	   Returns:
	   id - the id of handler.
	   */
	
	  XmppRoom.prototype.addHandler = function(handler_type, handler) {
	    var id;
	    id = this._handler_ids++;
	    switch (handler_type) {
	      case 'presence':
	        this._presence_handlers[id] = handler;
	        break;
	      case 'message':
	        this._message_handlers[id] = handler;
	        break;
	      case 'roster':
	        this._roster_handlers[id] = handler;
	        break;
	      default:
	        this._handler_ids--;
	        return null;
	    }
	    return id;
	  };
	
	
	  /*Function
	   Removes a handler from the MUC room.
	   This function takes ONLY ids returned by the addHandler function
	   of this room. passing handler ids returned by connection.addHandler
	   may brake things!
	   移除一个handler
	   根据id移除handler
	   Parameters:
	   (number) id - the id of the handler
	   */
	
	  XmppRoom.prototype.removeHandler = function(id) {
	    delete this._presence_handlers[id];
	    delete this._message_handlers[id];
	    return delete this._roster_handlers[id];
	  };
	
	
	  /*Function
	   Creates and adds an Occupant to the Room Roster. 创建和添加一个用户到这个房间的roster列表
	   Parameters:
	   (Object) data - the data the Occupant is filled with
	   Returns:
	   occ - the created Occupant.
	   */
	  
	  XmppRoom.prototype.getOccupantCount = function() {
		  var count = 0;
		  for(var key in this.roster) {
			  count++;
		  }
		  return count;
	  };
	  XmppRoom.prototype._addOccupant = function(data) {
	    var occ;
	    occ = new Occupant(data, this);
	    this.roster[occ.nick] = occ;
	    return occ;
	  };
	
	
	  /*Function
	   The standard handler that managed the Room Roster. 管理房间的handler
	   Parameters:
	   (Object) pres - the presence stanza containing user information
	   */
	
	  XmppRoom.prototype._roomRosterHandler = function(pres) {
	    var data, handler, id, newnick, nick, ref;
	    data = XmppRoom._parsePresence(pres);
	    nick = data.nick;
	    newnick = data.newnick || null;
	    switch (data.type) {
	      case 'error':
	        return true;
	      case 'unavailable':
	        if (newnick) {
	          data.nick = newnick;
	          if (this.roster[nick] && this.roster[newnick]) {
	            this.roster[nick].update(this.roster[newnick]);
	            this.roster[newnick] = this.roster[nick];
	          }
	          if (this.roster[nick] && !this.roster[newnick]) {
	            this.roster[newnick] = this.roster[nick].update(data);
	          }
	        }
	        delete this.roster[nick];
	        break;
	      default:
	        if (this.roster[nick]) {
	          this.roster[nick].update(data);
	        } else {
	          this._addOccupant(data);
	        }
	    }
	    ref = this._roster_handlers;
	    for (id in ref) {
	      handler = ref[id];
	      if (!handler(this.roster, this)) {
	        delete this._roster_handlers[id];
	      }
	    }
	    return true;
	  };
	
	
	  /*Function
	   Parses a presence stanza 解析一个出席节
	   Parameters:
	   (Object) data - the data extracted from the presence stanza
	   */
	
	XmppRoom._parsePresence = function(pres) {
		var c, c2, data, i, j, len, len1, ref, ref1;
		data = {};
		data.nick = Strophe.getResourceFromJid(pres.getAttribute("from"));
		data.type = pres.getAttribute("type");
		data.states = [];
		ref = pres.childNodes;
		for (i = 0, len = ref.length; i < len; i++) {
		    c = ref[i];
		    switch (c.nodeName) {
		    	case "error":
		    		data.errorcode = c.getAttribute("code");
		    		data.error = (ref1 = c.childNodes[0]) != null ? ref1.nodeName : undefined;
		    		break;
		    	case "status":
		    		data.status = c.textContent || null;
		    		break;
		    	case "show":
		    		data.show = c.textContent || null;
		    		break;
		    	case "x":
		    		if (c.getAttribute("xmlns") === Strophe.NS.MUC_USER) {
		    			ref1 = c.childNodes;
		    			for (j = 0, len1 = ref1.length; j < len1; j++) {
		    				c2 = ref1[j];
		    				switch (c2.nodeName) {
				            	case "item":
				            		data.affiliation = c2.getAttribute("affiliation");
				            		data.role = c2.getAttribute("role");
				            		data.jid = c2.getAttribute("jid");
				            		data.newnick = c2.getAttribute("nick");
				            		break;
				            	case "status":
				            		if (c2.getAttribute("code")) {
				            			data.states.push(c2.getAttribute("code"));
				            		}
		    		        }
                        }
		    	}
		    }
		}
		return data;
	};
	
	  return XmppRoom;
	
	})();
	
	/**
	 * 房间配置
	 */
	RoomConfig = (function() {
	  function RoomConfig(info) {
	    this.parse = bind(this.parse, this);
	    if (info != null) {
	    // 林兴洋，20170217，这里为什么要执行这个parse？，而且这个parse操作也没有将数据返回啊。
	      this.parse(info);
	    }
	  }
	
	  // 可以用来获取房间的配置。
	  RoomConfig.prototype.parse = function(result) {
	    var attr, attrs, child, field, i, identity, j, l, len, len1, len2, query, ref;
	    query = result.getElementsByTagName("query")[0].childNodes;
	    this.identities = [];
	    this.features = [];
	    this.x = [];
	    for (i = 0, len = query.length; i < len; i++) {
	      child = query[i];
	      attrs = child.attributes;
	      switch (child.nodeName) {
	        case "identity":
	          identity = {};
	          for (j = 0, len1 = attrs.length; j < len1; j++) {
	            attr = attrs[j];
	            identity[attr.name] = attr.textContent;
	          }
	          this.identities.push(identity);
	          break;
	        case "feature":
	          this.features.push(child.getAttribute("var"));
	          break;
	        case "x":
	          if ((!child.childNodes[0].getAttribute("var") === 'FORM_TYPE') || (!child.childNodes[0].getAttribute("type") === 'hidden')) {
	            break;
	          }
	          ref = child.childNodes;
	          for (l = 0, len2 = ref.length; l < len2; l++) {
	            field = ref[l];
	            if (!field.attributes.type) {
	              this.x.push({
	                "var": field.getAttribute("var"),
	                label: field.getAttribute("label") || "",
	                value: field.firstChild.textContent || ""
	              });
	            }
	          }
	      }
	    }
	    return {
	      "identities": this.identities,
	      "features": this.features,
	      "x": this.x
	    };
	  };
	
	  return RoomConfig;
	
	})();
	
	/**
	 * 这是一个占有者
	 */
	Occupant = (function() {
	  function Occupant(data, room1) {
	    this.room = room1;
	    this.update = bind(this.update, this);
	    this.admin = bind(this.admin, this);
	    this.owner = bind(this.owner, this);
	    this.revoke = bind(this.revoke, this);
	    this.member = bind(this.member, this);
	    this.ban = bind(this.ban, this);
	    this.modifyAffiliation = bind(this.modifyAffiliation, this);
	    this.deop = bind(this.deop, this);
	    this.op = bind(this.op, this);
	    this.mute = bind(this.mute, this);
	    this.voice = bind(this.voice, this);
	    this.kick = bind(this.kick, this);
	    this.modifyRole = bind(this.modifyRole, this);
	    this.update(data);
	  }
	
	  Occupant.prototype.modifyRole = function(role, reason, success_cb, error_cb) {
	    return this.room.modifyRole(this.nick, role, reason, success_cb, error_cb);
	  };
	
	  Occupant.prototype.kick = function(reason, handler_cb, error_cb) {
	    return this.room.kick(this.nick, reason, handler_cb, error_cb);
	  };
	
	  Occupant.prototype.voice = function(reason, handler_cb, error_cb) {
	    return this.room.voice(this.nick, reason, handler_cb, error_cb);
	  };
	
	  Occupant.prototype.mute = function(reason, handler_cb, error_cb) {
	    return this.room.mute(this.nick, reason, handler_cb, error_cb);
	  };
	
	  Occupant.prototype.op = function(reason, handler_cb, error_cb) {
	    return this.room.op(this.nick, reason, handler_cb, error_cb);
	  };
	
	  Occupant.prototype.deop = function(reason, handler_cb, error_cb) {
	    return this.room.deop(this.nick, reason, handler_cb, error_cb);
	  };
	
	  Occupant.prototype.modifyAffiliation = function(affiliation, reason, success_cb, error_cb) {
	    return this.room.modifyAffiliation(this.jid, affiliation, reason, success_cb, error_cb);
	  };
	
	  Occupant.prototype.ban = function(reason, handler_cb, error_cb) {
	    return this.room.ban(this.jid, reason, handler_cb, error_cb);
	  };
	
	  Occupant.prototype.member = function(reason, handler_cb, error_cb) {
	    return this.room.member(this.jid, reason, handler_cb, error_cb);
	  };
	
	  Occupant.prototype.revoke = function(reason, handler_cb, error_cb) {
	    return this.room.revoke(this.jid, reason, handler_cb, error_cb);
	  };
	
	  Occupant.prototype.owner = function(reason, handler_cb, error_cb) {
	    return this.room.owner(this.jid, reason, handler_cb, error_cb);
	  };
	
	  Occupant.prototype.admin = function(reason, handler_cb, error_cb) {
	    return this.room.admin(this.jid, reason, handler_cb, error_cb);
	  };
	
	  Occupant.prototype.update = function(data) {
	    this.nick = data.nick || null;
	    this.affiliation = data.affiliation || null;
	    this.role = data.role || null;
	    this.jid = data.jid || null;
	    this.status = data.status || null;
	    this.show = data.show || null;
	    return this;
	  };
	
	  return Occupant;
	
	})();
	
	// ---
	// generated by coffee-script 1.9.2