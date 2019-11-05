(function(factory) {
    return factory(XoW);
}(function(XoW) {
    XoW.RoomManager = function (globalManager) {
        var _gblMgr = globalManager;
        var _infos = [];
        var _allRooms = [];
        var _roomReady = false; // 房间是否已经读取完毕
        var _getGroupChatRoomInterval = null;
        this._handlers = [];
        var _roomConfigParser = new RoomConfig();
        this._handler = null;
        var _this = this;
        var _isroomMe = [];
        var _roomAbility = null;
        var _outAllRoom = [];
        var _roomMembers = {};
        var _classInfo = "RoomManager";

        var _init = function () {
            XoW.logger.ms(_classInfo + "Room_intt");
           _gblMgr.getConnMgr().addHandler(_roomInviteCb.bind(_this), Strophe.NS.MUC_USER, "message");
            XoW.logger.me(_classInfo + "Room_intt");
        }
        var _getAllRoomFromSer = function() {
            XoW.logger.ms(_classInfo + "_getAllRoomFromSer");
            var i = 0;
            var interval = setInterval(function() {
                if(null != _gblMgr.getServerMgr()) {
                    _roomAbility = _gblMgr.getServerMgr().getRoomAbility();
                    if(null != _roomAbility) {
                        XoW.logger.d(_classInfo + "_init() 得到了roomAbility");
                        clearInterval(interval);
                        _getAllRoomsFromServer();
                    }
                }
                XoW.logger.d(_classInfo + "_init() 还没得到了roomAbility");
                i++;
                if(i == 10) {
                    clearInterval(interval);
                    XoW.logger.e('获取服务失败！');
                }
            }.bind(this), 500);
            XoW.logger.me(this.classInfo + "_getAllRoomFromSer()");
        };
        var _getAllRoomsFromServer = function(successCb, errorCb, timeout) {
            XoW.logger.ms(_classInfo + "getAllRoomsFromServer");
            var roomServerJid = _roomAbility.jid;
            _gblMgr.getConnMgr().getStropheConnection().muc.listRooms(roomServerJid, function(stanza){
                XoW.logger.d(_classInfo + "getAllRoomsFromServer() 获取房间列表成功");
                _clearAllRoom();
                for(let item of stanza.getElementsByTagName('item')) {
                    let room = new XoW.Room();
                    let roomJid = item.getAttribute("jid");
                    room.jid = roomJid;
                    room.name = item.getAttribute("name");
                    room.id = room.name;
                    _roomListInfo(roomJid, function (roomInfoResult) {
                        room.setConfig(_roomConfigParser.parse(roomInfoResult));
                        _addRoomList(room);
                    }.bind(this), function (error) {
                        XoW.logger.e("请求房间信息失败，房间jid为" + roomJid);
                    });
                }
                if(successCb) {
                    var params = {
                        stanza : stanza,
                        rooms : _allRooms,
                    };
                    successCb(params);
                }
            }.bind(this), function(error) {
                XoW.logger.e("请求房间列表失败");
                if(errorCb) {
                    errorCb(stanza);
                }
            });
            this.roomReady = true;
            XoW.logger.me(_classInfo + "getAllRoomsFromServer");
            return true;
        };

        var _clearAllRoom = function() {
            XoW.logger.ms(_classInfo + "_clearAllRoom");
            var params = {
                oldValue : _allRooms,
            };
            _allRooms = [];
            _gblMgr.getHandlerMgr().triggerHandler('clearAllRoom', params);
            XoW.logger.me(_classInfo + "_clearAllRoom");
        };
        var _roomListInfo = function(roomJid, handle_cb, error_cb) {
            XoW.logger.ms(_classInfo + "_roomListInfo");
            var iq;
            var t = XoW.utils.getNodeFromJid(_gblMgr.getCurrentUser().jid);
            iq = $iq({id : XoW.utils.getUniqueId("roomInfo"),
                to : roomJid,
                from :t+"@"+XoW.config.domain,
                type : "get"
            }).c("query", {xmlns: Strophe.NS.DISCO_INFO});
            return _gblMgr.getConnMgr().sendIQ(iq, handle_cb, error_cb);
            XoW.logger.me(_classInfo + "_roomListInfo");
        };
        var _addRoomList = function(_room) {
            XoW.logger.ms(_classInfo + "_addRoomList");
            var params = {
                oldValue : _allRooms,
                addValue : _room,
            };
            var roomInMuc = getXmppRoom(_room.jid);
            if(roomInMuc) {
                _room.occupants = roomInMuc.getOccupantCount();
            }
            _allRooms.push(_room);
            _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_ROOMLIST_ADDED, params);
            XoW.logger.me(_classInfo + "_addRoomList");
        };
        var _me_into_a_room  = function (type,jid) {
            XoW.logger.ms(_classInfo + "_me_into_a_room");
            var isRoom=_isExisThisRoomByjid(jid);
            if(isRoom){
                if (5 == _gblMgr.getCurrentUser().status) {
                    layer.msg("离线状态无法进入会议室，请先更改状态");
                    return;
                }
                if (!_isCurrentUserAlreadyInRoom(jid)) {
                    var nick = XoW.utils.getNodeFromJid(_gblMgr.getCurrentUser().jid);
                    var room = _getRoomByJid(jid);
                    if (!room.isUnsecured()){
                        return;
                    }
                    else{
                        if (_joinRoom(jid, nick)) {
                            XoW.logger.d("加入房间成功");
                        } else {
                            XoW.logger.e("加入房间失败");
                            layer.msg("加入失败");
                        }
                    }
                }
            } else{
                layer.msg("该房间不存在");
            }
            XoW.logger.me(_classInfo + "_me_into_a_room");
        }

        var getXmppRoom = function(roomJid) {
            XoW.logger.ms(_classInfo + "getXmppRoom");
            return _getAllXmppRoom()[roomJid];
            XoW.logger.me(_classInfo + "getXmppRoom");
        };
        var _getAllXmppRoom = function() {
            XoW.logger.ms(_classInfo + "_getAllXmppRoom()");
            return _gblMgr.getConnMgr().getStropheConnection().muc.rooms;
            XoW.logger.me(_classInfo + "_getAllXmppRoom()");
        };
        var _getXmppRoom = function(roomJid) {
            XoW.logger.ms(_classInfo + "_getXmppRoom()");
            return _getAllXmppRoom()[roomJid];
            XoW.logger.me(_classInfo + "_getXmppRoom()");
        };
        var _cbRoomMsgHandler = function(stanza, room) {
            XoW.logger.ms(_classInfo + "_cbRoomMsgHandler");
            return true;
            XoW.logger.me(this.classInfo + "_cbRoomMsgHandler");
        };

        var _cbRoomPresHandler = function(stanza, room) {
            XoW.logger.w(this.classInfo + "_cbRoomPresHandler" + room.name + "   " + room.nick);
            var roomPresence = new XoW.RoomPresence();
            var presence = XmppRoom._parsePresence(stanza);
            var me = room.nick;
            if('error' === presence.type) {
                XoW.logger.w(_classInfo + " 错误" + presence.errorcode);
                roomPresence.type = 'error';
                roomPresence.errorCode = presence.errorcode;
                _gblMgr.getRoomMgr().leaveAllXmppRoom();
                _gblMgr.getHandlerMgr().triggerHandler('removeErrorRoom');
                switch(presence.errorcode) {
                    case '401' :
                        roomPresence.message = "未提供密码或者密码错误！";
                        _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_WRONG_PASSWORD,roomPresence.message);
                        _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.WRONG_PASSWORD,roomPresence.message);
                        break;
                    case '403' :
                        roomPresence.message = "您已被禁止进入该房间！";
                        break;
                    case '407' :
                        roomPresence.message = "该房间仅限会员进入！";
                        _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_MEMBER_ONLY,roomPresence.message);
                        _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.NON_MEMBERS,roomPresence.message);
                        break;
                    case '409' :
                        XoW.logger.w("该用户名已被该聊天室中其他人使用！");
                        roomPresence.message = "用户名[" + room.nick + "]已被该聊天室中其他人使用，请重新输入一个用户名！";
                        break;
                    case '503' :
                        roomPresence.message = "该聊天室已达到最大人数，您无法进入！";
                        _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_MAXNUM_PEOPLE,roomPresence.message);
                        _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.MAXIMUM_PEOPLE,roomPresence.message);
                        break;
                    default :
                        roomPresence.message = "未知错误，错误类型" + presence.error + ",错误代码" + presence.errorcode;
                        break;
                }
                return false;
            } else {
                _gblMgr.getHandlerMgr().triggerHandler('DressRoom');
                var r =  _getRoomByJid(stanza.getAttribute('from'));
                if(!r) {
                    return true;
                }
                XoW.logger.d(_classInfo + " 正常的消息节，来自房间" + r.jid);
                var roomOccupants = 0;
                var isInOrOut = false;
                for(var key in room.roster) {
                    roomOccupants++;
                }
                XoW.logger.d(_classInfo + " 房间原人数" + r.occupants + "  现在人数" + roomOccupants);
                if(r.occupants != roomOccupants) {
                    isInOrOut = true;
                    r.occupants = roomOccupants;
                }
                if(presence.states.length) {
                    XoW.logger.d(presence.states);
                    if(-1 != presence.states.indexOf('303')) {
                        XoW.logger.d("有人改名了，从 " + presence.nick + " 改成了 " + presence.newnick);
                        roomPresence.message = '[' + presence.nick +']将昵称改成了[' + presence.newnick + ']';
                    } else if(-1 != presence.states.indexOf('301')) {
                        room.clearWrongRoom();
                        XoW.logger.d(presence.nick + "被禁止进入此房间");
                        if(me == presence.nick) {
                            roomPresence.message = '你被禁止进入此聊天室';
                            _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_FORBIT_IN,roomPresence.message);
                            _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_BANIN_RCV,roomPresence.message);
                        } else {
                            roomPresence.message = '[' + presence.nick + ']被禁止进入此聊天室';
                        }
                    } else if(-1 != presence.states.indexOf('307')) {
                        room.clearWrongRoom();
                        XoW.logger.d(presence.nick + "被踢出此房间");
                        if(me == presence.nick) {
                            let roomname = XoW.utils.getNodeFromJid(stanza.getAttribute('from'));
                            roomPresence.message = '你被移出' + roomname + '房间';
                            _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_SELF_MOVEOUT,roomPresence.message);
                            _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_KICKED_OUR_RCV,roomPresence.message);
                        } else {
                            roomPresence.message = '[' + presence.nick + ']被踢出此聊天室';
                        }
                    } else if(-1 != presence.states.indexOf('110')) {
                        if(-1 != presence.states.indexOf('201')) {
                        } else {
                            XoW.logger.d("自己进入房间");
                            roomPresence.message = '你已进入该房间';
                        }
                    } else {
                        XoW.logger.d(presence.nick + "未知states" + presence.states);

                    }
                } else {
                    if('unavailable' === presence.type){
                        XoW.logger.d(presence.nick + "退出了房间");
                        roomPresence.message = '[' + presence.nick + ']退出了聊天室';
                        let onePerson = {
                            roomjid : stanza.getAttribute('from'),
                            nick:presence.nick
                        }
                        if (stanza.getElementsByTagName('destroy').length) {
                            let roomname = XoW.utils.getNodeFromJid(stanza.getAttribute('from'));
                            let Mssg = {
                                Msg:"所有者销毁了"+roomname+"房间",
                                id: XoW.utils.getNodeFromJid(stanza.getAttribute('from')),
                            }
                            _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_DESTROY_ROOM,Mssg);
                        }else{
                            _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_ONE_EXITROOM,onePerson);
                            _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_DESTROY_RCV,Mssg);
                        }else{
                            _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ONEPERSON_EXIT_ROOM,onePerson);
                        }
                    } else if(isInOrOut){
                        XoW.logger.d(presence.nick + "加入了房间");
                        roomPresence.message = '[' + presence.nick + ']加入了聊天室';
                        let onePerson = {
                            roomjid : stanza.getAttribute('from'),
                            nick:presence.nick
                        }
                        _gblMgr.getHandlerMgr().triggerHandler(XoW.VIEW_EVENT.V_ROOM_ONE_INTO,onePerson);
                        _gblMgr.getHandlerMgr().triggerHandler(XoW.VIEW_EVENT.V_ONEINTOROOM_VOICE,onePerson);
                    } else {
                        XoW.logger.d(presence.nick + "更改了状态");
                    }
                }
            }
            var params = {
                presence : roomPresence,
                stanza : stanza,
                room : room,
            };
            return true;
        };
        var _cbRoomRoster = function(stanza, room) {
            XoW.logger.ms(_classInfo + "_cbRoomRoster");
            var params = {
                stanza : stanza,
                room : room
            };
            var stanza1 = params.stanza;
            var room1 = params.room;
            _removePoweerroomemmer(XoW.utils.getNodeFromJid(room1.name));
            for(var key in stanza1){
                if(key.length>0) {
                    let iem = new XoW.RoomMember();
                    iem.id=key
                    iem.avatar='../../../images/Member.png'
                    iem.username=key
                    iem.roomjid=room1.name||' '
                    iem.jid=stanza1[key].jid||' '//这个人的jid
                    iem.roomaffi=stanza1[key].affiliation||' '
                    iem.roomrole=stanza1[key].role||' '
                    iem.roomindex=XoW.utils.getNodeFromJid(room1.name)
                    if(iem.roomaffi == 'owner'){
                        iem.avatar = '../../../images/Owner.png'
                    }
                    else if(iem.roomaffi == 'admin'){
                        iem.avatar = '../../../images/Admin.png'
                    }
                    else if(iem.roomrole == 'moderator'){
                        iem.avatar = '../../../images/Member.png'
                    }
                    else if(iem.roomrole == 'visitor'){
                        iem.avatar = '../../../images/Visitor1.png'
                    }
                    _pushRoomMembers(iem);
                }
            }
            XoW.logger.me(this.classInfo + "_cbRoomRoster");
            return true;
        };

        var _isExisThisRoomByjid = function (jid) {
            XoW.logger.ms(_classInfo + "getRoomdByJid");
            jid = XoW.utils.getBareJidFromJid(jid);
            for (var i = 0; i < _allRooms.length; i++) {
                var room = _allRooms[i].jid;
                if(XoW.utils.getBareJidFromJid(room)===jid){
                    return true;
                }
            }
            XoW.logger.d(_classInfo, 'room{0}'.f(jid));
            return null;
        };
        var _getRoomByid = function (id) {
            XoW.logger.ms(_classInfo + "getRoomdByJid");
            for (var i = 0; i < _allRooms.length; i++) {
                var roomid = _allRooms[i].id;
                // alert(roomid + " ************" + id)
                if(roomid===id){
                    return _allRooms[i].jid;
                }
            }
            return null;
        };

       var _isCurrentUserAlreadyInRoom =function(roomJid) {
            XoW.logger.ms(_classInfo + "isCurrentUserAlreadyInRoom");
            if(null != _getXmppRoom(roomJid)) {
                return true;
            } else {
                return false;
            }
            XoW.logger.me(this.classInfo + "isCurrentUserAlreadyInRoom");
        };

        var _getRoomByJid = function(jid) {
            XoW.logger.ms(_classInfo + "getRoomByJid");
            let roomjid = XoW.utils.getBareJidFromJid(jid);
            for(var i = 0; i < _allRooms.length; i++) {
                var room = _allRooms[i];
                if(room.jid === roomjid) {
                    XoW.logger.me(_classInfo + "getRoomByJid有符合条件的room");
                    return room;
                }
            }
            XoW.logger.me(_classInfo + "getRoomByJid没有符合条件的room");
            return null;
        };

        var _joinRoom = function(roomJid, nick, password) {
            XoW.logger.ms(_classInfo + "joinRoom");
            if(_isCurrentUserAlreadyInRoom(roomJid)) {
                XoW.logger.e("joinRoom 当前用户已在该房间中，加入失败！");
                return false;
            }
            var history = {'maxstanzas' : 10};
            _gblMgr.getConnMgr().getStropheConnection().muc
                .join(roomJid,
                    nick,
                    _cbRoomMsgHandler.bind(this),
                    _cbRoomPresHandler.bind(this),
                    _cbRoomRoster.bind(this),
                    password,
                    history);
            XoW.logger.me(this.classInfo + "joinRoom");
            return true;
        };

         var _removePoweerroomemmer = function (item) {
            XoW.logger.ms(_classInfo + "removePoweerroomemmer");
            _roomMembers[item] = {};
            XoW.logger.me(_classInfo + "removePoweerroomemmer");
        };
        var  _updateOneRoom = function(_room) {
            XoW.logger.ms(_classInfo + "updateOneRoom");
            var roomjid = _room.jid;
            var room = _this.getRoomByJid(roomjid);
            if(null != room) {
                room.name = _room.name;
                room.config = _room.config;
            } else {
                _addRoomList(_room);
                return;
            }
            var params = {
                room : room
            };
            //_gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_UPDATEROOM_RCV, params);
            XoW.logger.d(_classInfo + "更新的房间是" + room.jid);
            XoW.logger.me(_classInfo + "updateOneRoom");
        };

        var _pushRoomMembers = function(item) {
            XoW.logger.ms(_classInfo + "pushRoomMembers");
            var roomjid = XoW.utils.getNodeFromJid(item.roomjid);
            _roomMembers[roomjid][item.username] = item;
            XoW.logger.me(_classInfo + "pushRoomMembers");
        };

        var  _roomInviteCb =function(stanza) {
            XoW.logger.ms(_classInfo + "_roomInviteCb()");
            var invite = stanza.getElementsByTagName('invite')[0]
            if(!stanza.getElementsByTagName('invite').length) {
                XoW.logger.w(_classInfo + "_roomInviteCb 不是邀请节，返回");
                return true;
            }
            XoW.logger.w(_classInfo + "_roomInviteCb 邀请我加入一个会议室");
            if( _isCurrentUserAlreadyInRoom(stanza.getAttribute('from'))) {
                XoW.logger.w(_classInfo + "_roomInviteCb用户已在该房间中，不做处理");
            } else {
                if (stanza.getElementsByTagName('password').length > 0) {
                    var password = stanza.getElementsByTagName('password')[0].textContent;
                }
                if (invite.length>0&&invite.getElementsByTagName('reason').length > 0) {
                    var reason = invite.getElementsByTagName('reason')[0].textContent;
                }
                XoW.logger.w(_classInfo + "_roomInviteCb 用户还没有在这个房间里");
                let roomInviteInfo = new XoW.RoomInviteInfo();
                roomInviteInfo.type = 'invite';
                roomInviteInfo.id = XoW.utils.getUniqueId('invite');
                roomInviteInfo.time = XoW.utils.getCurrentDatetime();
                roomInviteInfo.status = 'untreated';
                roomInviteInfo.from = stanza.getAttribute('from');
                roomInviteInfo.to = stanza.getAttribute('to');
                roomInviteInfo.ini = invite.getAttribute('from');
                roomInviteInfo.pwd = password;
                roomInviteInfo.params = {
                    inviteFrom : invite.getAttribute('from'),
                    reason : reason,
                    password : password,
                };
                var params = {
                    stazna : stanza,
                    info : roomInviteInfo,
                };
                _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_INVITE_RCV,params);
            }
            XoW.logger.me(_classInfo + "_roomInviteCb()");
            return true;
        };

          var _SendagreejoinInviteRoom = function (room,password) {
            XoW.logger.ms(_classInfo + "SendagreejoinInviteRoom");
            var user = _gblMgr.getCurrentUser().jid;
            var t = XoW.utils.getNodeFromJid(user);
            var presence = $pres({
                from: user,
                to: room.jid +"/"+ t
            });
            if(password.length>0){
                presence.c('x',{
                    xmlns: Strophe.NS.MUC
                }).c('password',password)
            }
             _gblMgr.getConnMgr().send(presence);
            XoW.logger.me(this.classInfo + "SendagreejoinInviteRoom");
        };
        var _leaveOneXmppRoom = function(roomjid) {
            XoW.logger.ms(_classInfo + "leaveAllXmppRoom");
           // setTimeout(function() {
                var xmppRooms = _getAllXmppRoom();
                for (var key in xmppRooms) {
                    // if(XoW.utils.getNodeFromJid(key) == XoW.utils.getNodeFromJid(roomjid)) {
                        XoW.logger.d(_classInfo + "离开房间" + key);
                        xmppRooms[key].leave();
                    }
                // }
           // }.bind(this), 500);
            XoW.logger.me(this.classInfo + "leaveAllXmppRoom");
        };
        var _leaveXmppRoom = function(roomjid) {
            XoW.logger.ms(_classInfo + "_leaveXmppRoom");
            var xmppRooms = _getAllXmppRoom();
            for (var key in xmppRooms) {
                 if(XoW.utils.getNodeFromJid(key) == XoW.utils.getNodeFromJid(roomjid)) {
                    XoW.logger.d(_classInfo + "离开房间" + key);
                    xmppRooms[key].leave();
                 }
             }
            XoW.logger.me(this.classInfo + "_leaveXmppRoom");
        };

       var _getXmppRoomLength = function() {
            XoW.logger.ms(_classInfo + "getXmppRoomLength");
            var rooms = _getAllXmppRoom();
            var length = 0;
            for(var key in rooms) {
                length++;
            }
            XoW.logger.me(this.classInfo + "getXmppRoomLength");
            return length;
        };

        //_getRoomByid
        this.getRoomByID = function (id) {
            return _getRoomByid(id);
        }

        this.SaveoutAllRoom = function (roomlisrt) {
            XoW.logger.ms(_classInfo + "SaveoutAllRoom");
            _outAllRoom.push(roomlisrt);
            XoW.logger.me(_classInfo + "SaveoutAllRoom");
        }

        this.getAllRoomFromSer = function () {
            XoW.logger.ms(_classInfo + "getAllRoomFromSer");
            return _getAllRoomFromSer();
            XoW.logger.me(_classInfo + "getAllRoomFromSer");
        }
        this.me_into_a_room = function(type,roomjid){
            XoW.logger.ms(_classInfo + "me_into_a_room");
            return _me_into_a_room(type,roomjid);
            XoW.logger.me(_classInfo + "me_into_a_room");
        }
        this.isRoomByjid = function (jid) {
            XoW.logger.ms(_classInfo + "getRoomdByJid");
             return _isExisThisRoomByjid(jid)
            XoW.logger.d(_classInfo, 'room{0}'.f(jid));

        };
        this.isCurrentUserAlreadyInRoom =function(roomJid) {
            XoW.logger.ms(_classInfo + "isCurrentUserAlreadyInRoom");
           return  _isCurrentUserAlreadyInRoom(roomJid)
            XoW.logger.me(this.classInfo + "isCurrentUserAlreadyInRoom");
        };
        this.getRoomByJid = function(jid) {
            XoW.logger.ms(_classInfo + "getRoomByJid");
             return _getRoomByJid(jid)
            XoW.logger.me(_classInfo + "getRoomByJid没有符合条件的room");
        };
        this.joinRoom = function(roomJid, nick, password) {
            XoW.logger.ms(_classInfo + "joinRoom");
            return _joinRoom(roomJid, nick, password)
            XoW.logger.me(this.classInfo + "joinRoom");
            return true;
        };
        this.removePoweerroomemmer = function (item) {
            XoW.logger.ms(_classInfo + "removePoweerroomemmer");
            _roomMembers[item] = {};
            XoW.logger.me(_classInfo + "removePoweerroomemmer");
        };

        this.leaveAllXmppRoom = function() {
            XoW.logger.ms(_classInfo + "leaveAllXmppRoom");
            setTimeout(function() {
                var xmppRooms = _getAllXmppRoom();
                for (var key in xmppRooms) {
                    XoW.logger.d(_classInfo + "离开房间" + key);
                    xmppRooms[key].leave();
                }
            }.bind(this), 500);
            XoW.logger.me(this.classInfo + "leaveAllXmppRoom");
        };
        this.isNew_room_title = function (stanza) {
            XoW.logger.ms(_classInfo + "saveRoomConfig");
            var type = stanza.getAttribute('type');
            var roomjid =  stanza.getAttribute('from');
            if('groupchat' != type || type == null ||  typeof(type) == "undefined"){
                return false;
            }
            if (stanza.getElementsByTagName('delay').length <= 0){
                var subject
                if(stanza.getElementsByTagName('subject').length>0) {
                    subject = stanza.getElementsByTagName('subject')[0].textContent;
                }
                if(typeof(subject) ==  'undefined') {
                    return false;
                }
                if(subject.length<=0){
                    return false;
                }
                _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_TITLE_RCV, {subject:subject,roomjid:roomjid});
                return true;
            }
            else{
                return false;
            }
            XoW.logger.me(_classInfo + "isNew_room_title");
        };
        this.getRoomMembers = function() {
            XoW.logger.ms(_classInfo + "getRoomMembers");
            return _roomMembers;
            XoW.logger.me(_classInfo + "getRoomMembers");
        };
        this.getSaveoutAllRoom = function () {
            XoW.logger.ms(_classInfo + "getSaveoutAllRoom");
            return _outAllRoom;
            XoW.logger.me(_classInfo + "getSaveoutAllRoom");
        };
        this.getRoomByJidFromServer =  function(roomJid, handleCb, errorCb) {
            XoW.logger.ms(_classInfo + "getRoomByJidFromServer");
            _roomListInfo(roomJid, function(roomInfoResult) {
                var room = new XoW.Room();
                room.jid = roomInfoResult.getAttribute('from');
                room.setConfig(_roomConfigParser.parse(roomInfoResult));
                room.name = room.getName();
                _updateOneRoom(room);
                var params = {
                    stanza : roomInfoResult,
                    room : room
                };
                if(handleCb) {
                    handleCb(params);
                }
            }.bind(this), errorCb);
            XoW.logger.me(_classInfo + "getRoomByJidFromServer");
        };
        this.getXmppRoom = function(roomJid) {
            XoW.logger.ms(_classInfo + "getXmppRoom");
            return _getAllXmppRoom()[roomJid];
            XoW.logger.me(this.classInfo + "getXmppRoom");
        };
        this.saveRoomConfig =  function(roomJid, fields, successCb, errorCb) {
            XoW.logger.ms(_classInfo + "saveRoomConfig");
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
            _gblMgr.getConnMgr().sendIQ(iq, successCb, errorCb);


            XoW.logger.me(_classInfo + "saveRoomConfig");
        };
        this.denyinvitRoom = function (room,invitfrom) {
            XoW.logger.ms(_classInfo + "denyinvitRoom");
            var user = _gblMgr.getCurrentUser().jid;
            var t = XoW.utils.getNodeFromJid(user);
            var msg = $msg({
                from:user,
                to:room.jid
            }).c('x',{ xmlns: Strophe.NS.MUC_USER}).c('decline',{
                to:invitfrom
            }).c('reason',
                "Sorry,I'm too busy right now."
            )
            _gblMgr.getConnMgr().send(msg);
            XoW.logger.me(this.classInfo + "denyinvitRoom");
        };
        this.joinInviteRoom = function (room,password) {
            XoW.logger.ms(_classInfo + "joinInviteRoom");
            if(_isCurrentUserAlreadyInRoom(room.jid)) {
                XoW.logger.e("joinRoom 当前用户已在该房间中，加入失败！");
                layer.msg("你已在这个房间，加入失败");
                return false;
            }
            let nick = XoW.utils.getNodeFromJid(_gblMgr.getCurrentUser().jid);
            _joinRoom(room.jid, nick, password);
            _roomListInfo(room.jid, function(roomInfoResult){
                if(_getRoomByJid(room.jid)!=null){
                    layer.msg("加入房间成功");
                    let oldroom = _getRoomByJid(room.jid);
                    oldroom.setConfig(_roomConfigParser.parse(roomInfoResult));
                    _gblMgr.getHandlerMgr().triggerHandler(XoW.VIEW_EVENT.V_ROOM_AGREE_INTO,oldroom);
                    _gblMgr.getHandlerMgr().triggerHandler(XoW.VIEW_EVENT.V_AGREE_INTO_ROOM_RCV,oldroom);
                    return true;
                }
                room.setConfig(_roomConfigParser.parse(roomInfoResult));
                _addRoomList(room);
                _gblMgr.getHandlerMgr().triggerHandler(XoW.VIEW_EVENT.V_ROOM_AGREE_INTO,room);
                _gblMgr.getHandlerMgr().triggerHandler(XoW.VIEW_EVENT.V_AGREE_INTO_ROOM_RCV,room);
                layer.msg("加入房间成功");
            }.bind(this), function(error) {
                layer.msg("加入房间失败");
                XoW.logger.e("请求房间信息失败，房间jid为" + room.jid);
            });
            XoW.logger.me(this.classInfo + "joinInviteRoom");
            return true;
        };
        this.createRoom = function(roomJid, nick, from, successCb, errorCb) {
            _gblMgr.getConnMgr().addHandler(function(stanza) {
                XoW.logger.ms(_classInfo + "创建房间回调");
                var pre = XmppRoom._parsePresence(stanza);
                if(pre.states) {
                    if(-1 != pre.states.indexOf('201')) {
                        XoW.logger.d(_classInfo + "创建房间成功");
                        var roomJid = XoW.utils.getBareJidFromJid(stanza.getAttribute('from'));
                        var iq = $iq({
                            id : XoW.utils.getUniqueId('instantRoom'),
                            type : 'set',
                            from : from,
                            to : roomJid
                        }).c('query', {
                            xmlns : Strophe.NS.MUC_OWNER
                        }).c('x', {
                            xmlns : XoW.NS.FORM_DATA,
                            type : 'submit'
                        });
                        _gblMgr.getConnMgr().sendIQ(iq, function(stanza) {
                            XoW.logger.d('创建即使房间提交成功');
                            var params = {
                                stanza : stanza,
                                roomJid : roomJid,
                                nick : nick
                            };
                            if(successCb) {
                                XoW.logger.d('调用回调');
                                successCb(params);
                            }
                        }, errorCb);

                    }
                } else {
                }
                XoW.logger.me(_classInfo + "_roomCreateCb");

            }.bind(this), Strophe.NS.MUC_USER, "presence", null, null, roomJid + "/" + nick);
            this.joinRoom(roomJid, nick);
        };
        this.PushRoom = function (data) {
            XoW.logger.ms(_classInfo + "PushRoom");
            _allRooms.push(data);
            XoW.logger.me(_classInfo + "PushRoom");
        };
        this.getAllRFServer = function () {
            XoW.logger.ms(_classInfo + "getAllRFServer");
            _getAllRoomsFromServer(null,function () {
                layui.layer.msg("刷新失败");
            })
            XoW.logger.me(this.classInfo + "getAllRFServer()");
        };
        this.getXmppRoomLength = function() {
             return _getXmppRoomLength();
        };
        this.closeThisRoom = function(roomjid){
            if(0 != _getXmppRoomLength()) {
              _leaveOneXmppRoom(roomjid);
              layer.msg("已退出房间");
            }
        }
        this.closeOneThisRoom = function(roomjid){
            if(0 != _getXmppRoomLength()) {
                _leaveXmppRoom(roomjid);
                layer.msg("已退出房间");
            }
        }
        this.getAllroomINFPO = function(handle_cb,error_cb){
            var user = _gblMgr.getCurrentUser().jid;
            var iq = $iq({
                id:XoW.utils.getUniqueId("rInfo"),
                type:"get",
                to:"conference."+ XoW.config.domain
            }).c("query",{xmlns :'http://jabber.org/protocol/disco#items'});
            _gblMgr.getConnMgr().sendIQ(iq,handle_cb,error_cb);
        }
        this.getKefuRoomchat = function(item){
            let room = new XoW.Room();
            let roomJid = item.getAttribute("jid");
            room.jid = roomJid;
            room.name = item.getAttribute("name");
            room.id = room.name;
            _roomListInfo(roomJid, function (roomInfoResult) {
                room.setConfig(_roomConfigParser.parse(roomInfoResult));
                _addRoomList(room);
                _me_into_a_room('group',roomJid);
                _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_OJROOMCHAT,roomJid);
            }.bind(this), function (error) {
                XoW.logger.e("请求房间信息失败，房间jid为" + roomJid);
                _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ROOM_ERROR_SHOW,"房间不存在，请联系管理员");
            });

        }
        // this.removeOneFromAllRooms= function (jid) {
        //     XoW.logger.ms(_classInfo + "getRoomdByJid");
        //     jid = XoW.utils.getBareJidFromJid(jid);
        //     console.log(_allRooms)
        //     console.log("*************************************")
        //     for (var i = 0; i < _allRooms.length; i++) {
        //         var room = _allRooms[i].jid;
        //         if(XoW.utils.getBareJidFromJid(room)===jid){
        //              //_allRooms.splice(i,1);
        //             delete _allRooms[i];
        //             _allRooms.splice(i,1);
        //              console.log(_allRooms)
        //              return;
        //         }
        //     }
        // };
        _init();
    }
    return XoW;
}));
