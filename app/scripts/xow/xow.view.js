/**
 * IM主面板
 */

(function (factory) {
    return factory(XoW);
}(function (XoW) {


    /**
     * 这个类被创建前要求XoW.Connection已经创建前需要
     */
    XoW.ViewManager = function (globalManager) {
        this._gblMgr = globalManager;

        this.h = null;
        this.defaultFace = "images/4.bmp"; // 默认头像

        this.sendingContent = ""; // 真正发送的东西
        this.face; //
        this.classInfo = "【ViewManager】";

        this.infos = [];

        this._messageCenterMgr = null;
        // 好友邀请，邀请进入讨论组，
        // this.infoId = 0;
        // this.infos = []; // {id, type, jid, dealState[undeal,ok,deny],deal}

        //	this.listFriends = []; // 所有监听的好友
        this.listenChats = []; // 所有监听的chat
        this._init();
    };
    XoW.ViewManager.prototype = {

        getMessageCenterMgr: function () {
            return this._messageCenterMgr;
        },

        /**
         * 初始化方法，创建ViewManager的时候会自动调用。
         */
        _init: function () {
            XoW.logger.ms(this.classInfo + "_init()");

            XoW.logger.d(this.classInfo + " 初始化了XoW.ViewManager");
            // 监听登录情况
            this._gblMgr.getConnMgr().addHandlerToConnMgr('loginCb', this._login_cb.bind(this));

            this._messageCenterMgr = new XoW.MessageCenterManager(this._gblMgr);

//		setInterval(function() {
//			alert(layer.zIndex + "  " + layer.index);
//		}, 5000);
            // 禁止拖动。。。反之拖动图片放到输入框中，但是，仍旧可以通过copy的方式将头像放进去。。。
            with (document.body) {
                ondragstart = function () {
                    return false;
                };
            }

            XoW.logger.me(this.classInfo + "_init()");
        },


        /**
         * 界面中的a标签的id，用于显示登录状态
         */
        loginStateAId: "loginstate",
        /**
         * 用于绑定到登录的回调上。
         * 根据提供的a标签，在界面上显示登录状态
         * 登录成功后切换到主界面
         */
        _login_cb: function (params) {
            var success = params.success;
            var msg = params.msg;
            // var cond = params.cond;
            XoW.logger.ms(this.classInfo + "_login_cb()");

            XoW.logger.d(this.classInfo + "记录登录状态：" + msg);

            if (success) { // 登录成功
                // 显示主页面
                // this._loginSuccessShowMainPage();

                $('#loginpage').css({display: "none"}); // 隐藏登录界面div
                $('#mainpage').css({display: ""}); // 显示主页面的div
                // $('#mainpage').load("demo.html");

                // 显示左侧主面板
                this._mainPage();

                // 开始初始化
                xxim.layinit();

                // 绑定一些界面会触发的事。
                this._viewActionsBinding();
            } else {
                if (params.cond == Strophe.Status.DISCONNECTED) {
//				$('#loginpage').css({display:""}); // 隐藏登录界面div
//				$('#mainpage').css({display:"none"}); // 显示主页面的div
//				$('#mainpage').html('');
                    location.reload();
                }
            }
            if (null != this.loginStateAId) { // 显示状态的a标签存在
                // 显示登录状态
                $("#" + this.loginStateAId).text(msg);
            }

            XoW.logger.me(this.classInfo + "_login_cb()");
            return true;
        },

        /**
         * 左侧主面板，从xxim.view而来
         */
        _mainPage: function () {
            XoW.logger.ms(this.classInfo + "_mainPage()");

            var xximNode = xxim.layimNode = $('<div id="xximmm" class="xxim_main">'
                + '<div class="xxim_top" id="xxim_top">'
                + '  <div class="xxim_search"><i></i><input id="xxim_searchkey" /><span id="xxim_closesearch">×</span></div>'
                + '  <div class="xxim_tabs" id="xxim_tabs"><span class="xxim_tabfriend" title="好友"><i></i></span><span class="xxim_tabgroup" title="群组"><i></i></span><span class="xxim_latechat"  title="最近聊天"><i></i></span></div>'
                + '  <ul class="xxim_list" style="display:block"></ul>'
                + '  <ul class="xxim_list">'
                + '		<li class="roomAction" >' // 这里放刷新，创建，房间头信息
                + '		<div class="createRoom layim_sendbtn" id="createRoom">创建房间</div><div id="refreshRoom" class="refreshRoom layim_sendbtn">刷新</div>'
                + ' 			<span class="xxim_onename">房间名 | 地址</span><em class="xxim_time">人数</em></li>'
                + '  	<li id="roomList" class="xxim_liston">' // 这里放群组
                + '			<ul class="xxim_chatlist"></ul>'
                + ' 		</li>'
                + '  </ul>'
                + '  <ul class="xxim_list"></ul>'
                + '  <ul class="xxim_list xxim_searchmain" id="xxim_searchmain"></ul>'
                + '</div>'
                + '<ul class="xxim_bottom" id="xxim_bottom">'
                + '<li class="xxim_online" id="xxim_online">'
                + '<i class="xxim_nowstate"></i><span id="xxim_onlinetex">在线</span>'
                + '<div class="xxim_setonline">'
                + '<span><i></i>在线</span>'
                + '<span class="xxim_setchat"><i></i>空闲</span>'
                + '<span class="xxim_setdnd"><i></i>正忙</span>'
                + '<span class="xxim_setaway"><i></i>离开</span>'
                + '<span class="xxim_setoffline"><i></i>离线</span>'
                + '</div>'
                + '</li>'
                + '<li class="xxim_mymsg" id="xxim_mymsg" title="消息"><i></i>'
                + '<div class="xxim_mymsgbox"><ul></ul><div>显示全部</div></div>'
                //<li>1111</li><li>2222</li><li>3333</li><li>4444</li><li>5555</li>
                + '</li>' // 这一段是在</i>之后的<a href="'+ config.msgurl +'" target="_blank"></a>
                + '<li class="xxim_mymsg" id="xxim_myinfo" title="通知"><img src="images/info.png" style="width: 14px; height: 14px; position: absolute; left: 10px; top: 10px;"></img></li>' // 这一段是在</i>之后的<a href="'+ config.msgurl +'" target="_blank"></a>
                + '<li class="xxim_seter" id="xxim_seter" title="注销">'
                + '<img src="images/logout.png" style="width: 14px; height: 14px; position: absolute; left: 10px; top: 10px;"></img>'
                + '<div class="">'

                + '</div>'
                + '</li>'
                + '<li class="xxim_hide" id="xxim_hide" title="隐藏"><i></i></li>'
                + '<li id="xxim_on" class="xxim_icon xxim_on"></li>'
                + '<div class="layim_min" id="layim_min"></div>'
                + '</ul>'
                + '</div>');

            // 这些数据绑定到主面板里面
            $('#mainpage').append(xximNode);
            // dom[3].append(xximNode);
            // 重新绑定节点，使之能够触发事件。。。 是这个意思吗？
            xxim.renode();
            // xxim.event(); // 界面的一些事件
            this.refleshNode();
            XoW.logger.me(this.classInfo + "_mainPage()");

        },
        // UserMgr被创建后
        _afterInitUserMgr: function () {
            // 往 UserMgr中的FriendGroupList加监听
            XoW.logger.ms(this.classInfo + "_afterInitUserMgr");

            // 监听 好友的添加（给该好友加上一些监听器，如state和face的变化，不是往界面上渲染该好友）
            this._gblMgr.getUserMgr().addHandlerToUserMgr('addFriend', this._addFriendCb.bind(this));

            // 监听好友分组的创建
            this._gblMgr.getUserMgr().addHandlerToUserMgr('addFriendList', this._addFriendListCb.bind(this));

            // 监听 jidChat的添加
            this._gblMgr.getChatMgr().addHandlerToChatMgr('addJidChat', this._addJidChatCb.bind(this));

            // 监听请求加好友
            this._gblMgr.getUserMgr().getPresenceMgr().addHandlerToPresenceMgr('subscribe', this._friendSubscribeCb.bind(this));

            // 监听对方同意加你为好友
            this._gblMgr.getUserMgr().getPresenceMgr().addHandlerToPresenceMgr('subscribed', this._friendSubscribedCb.bind(this));

            // 监听对方不同意加你为好友
            this._gblMgr.getUserMgr().getPresenceMgr().addHandlerToPresenceMgr('unsubscribe', this._friendUnsubscribeCb.bind(this));

            // 监听对方       撤销之前同意加你为好友的操作。
            this._gblMgr.getUserMgr().getPresenceMgr().addHandlerToPresenceMgr('unsubscribed', this._friendUnsubscribedCb.bind(this));

            // 监听 room 的添加
            this._gblMgr.getRoomMgr().addHandlerToRoomMgr('addRoom', this._addRoomCb.bind(this));

            // 监听room 的 全部房间的清除
            this._gblMgr.getRoomMgr().addHandlerToRoomMgr('clearAllRoom', this._clearAllRoomCb.bind(this));

            // 监听room 的清除一个房间
            this._gblMgr.getRoomMgr().addHandlerToRoomMgr('clearOneRoom', this._clearOneRoomCb.bind(this));

            // 监听room 的清除一个房间
            this._gblMgr.getRoomMgr().addHandlerToRoomMgr('updateOneRoom', this._updateOneRoomCb.bind(this));

            // 监听room 群组中好友列表节
            this._gblMgr.getRoomMgr().addHandlerToRoomMgr('roster', this._roomRosterCb.bind(this));

            // 监听room 出席节
            this._gblMgr.getRoomMgr().addHandlerToRoomMgr('presence', this._roomPresCb.bind(this));

            // 监听room 群消息
            this._gblMgr.getRoomMgr().addHandlerToRoomMgr('message', this._roomMsgCb.bind(this));

            // 监听room 邀请信息
            this._gblMgr.getRoomMgr().addHandlerToRoomMgr('invite', this._roomInviteCb.bind(this));

            // 监听组织通讯录的开启
            this._gblMgr.getOrgnizationMgr().addHandlerToOrgnizationManager('orgnizationstart', this._orgnizationStartCb.bind(this));

            // 监听组织通讯录的消息
            this._gblMgr.getOrgnizationMgr().addHandlerToOrgnizationManager('message', this._orgMessageCb.bind(this));


            XoW.logger.me(this.classInfo + "_afterInitUserMgr");
        },

        isJidInChatList: function (jid) {
            if (!jid) {
                return false;
            }
            // alert($('#layim_chatmore').attr('class'));
            // alert($('#layim_chatmore .layim_chatlist').attr('class'));
            var $lis = $('#layim_chatmore .layim_chatlist li');
            // alert($lis.length);
            var isIn = false;
            $lis.each(function (index, item) {
                // alert(index + "  " + $(item).attr('data-id') + "  " + jid);
                if ($(item).attr('data-id') == jid) {
                    // alert("相等");
                    // 直接return true不行。
                    // return true;
                    isIn = true;
                }
            });
            return isIn;
        },

        _groupUserSendMessageCb: function (params) {
            // 自己发送的消息的回调
//		this._messageCenterMgr.addShowMessage({
//			message : params.stanza,
//			type : 'groupprivate'
//		});
//		return true;
        },

        _orgMessageCb: function (params) {
            XoW.logger.ms(this.classInfo + "_orgMessageCb");
            var type = params.type;
            msg = params.msg;
//		var params = {
//	    		stanza : stanza,
//	    		group : group,
//	    		groupuser : null,
//	    		type : null,
//				msg : 解析后的消息
//	        };

            // type:roomprivate 会议室私聊 闪烁
            // 		fromjid:cwb@conference.openfire/lxy type="chat"
            //		会议室私聊的人没有头像，

            // type:group 群组 闪烁
            //		fromjid:cwb@fwgroup.openfire/lxy    type="groupchat"
            //		群组没有头像，但是直接用那一个

            // type:groupprivate 群组私聊 闪烁
            //		fromjid:cwb@fwgroup.openfire/lxy type="chat"
            // 		私聊的人有头像。。

            if ('groupuser' == type) {
                // 私人消息
                XoW.logger.d(this.classInfo + "私人消息");
                // 接下去要把消息丢进去。。
//			var p = {
//				message : params.stanza,
//				type : 'groupprivate',
//				msg : params.msg
//			};
//			params.message = params.stanza;
//			params.type = 'groupprivate';
                this._messageCenterMgr.addShowMessage({
                    message: params.stanza,
                    type: 'groupprivate'
                });
            } else if ('group' == type) {
                // 群组消息
                XoW.logger.d(this.classInfo + "群组消息");
                this._messageCenterMgr.addShowMessage({
                    message: params.stanza,
                    type: 'group'
                });
            }

            return true;
        },
        _orgPresenceCb: function (params) {
            XoW.logger.ms(this.classInfo + "_orgPresenceCb");

            XoW.logger.me(this.classInfo + "_orgPresenceCb");
            return true;
        },
        _orgIQCb: function (params) {
            XoW.logger.ms(this.classInfo + "_orgIQCb");

            XoW.logger.me(this.classInfo + "_orgIQCb");
            return true;
        },

        _groupUserStateChangeCb: function (params) {
            XoW.logger.ms(this.classInfo + "_groupUserStateChangeCb");
            var groupUser = params.groupUser;
            var $nobr = $('nobr[data-id="' + XoW.utils.escapeJquery(groupUser.userjid) + '"]');

            // 企业通讯录中状态改变
            var $mi = $nobr.find('mi');
            // 聊天面板中的
            var li = 'ul[id="layim_groupusers' + XoW.utils.escapeJquery(groupUser.group.groupjid) + '"] li[data-id="' + XoW.utils.escapeJquery(groupUser.getGroupUserJid()) + '"]';
            var $groupUser = $(li);
            // alert($groupUser.attr('type') + ' ' + $groupUser.attr('data-id'));
            // alert($nobr.attr('data-id') + "  "  + $nobr.attr('type'));
            switch (groupUser.state) {
                case 1 :
                    $mi.removeClass().addClass('layim_groupuser_state').addClass('layim_groupuser_online');
                    $groupUser.removeClass().addClass('xxim_mytestonline');
                    break;
                case 2 :
                    $mi.removeClass().addClass('layim_groupuser_state').addClass('layim_groupuser_chat');
                    $groupUser.removeClass().addClass('xxim_mytestchat');
                    break;
                case 3 :
                    $mi.removeClass().addClass('layim_groupuser_state').addClass('layim_groupuser_dnd');
                    $groupUser.removeClass().addClass('xxim_mytestdnd');
                    break;
                case 4 :
                    $mi.removeClass().addClass('layim_groupuser_state').addClass('layim_groupuser_away');
                    $groupUser.removeClass().addClass('xxim_mytestaway');
                    break;
                case 5 :
                    $mi.removeClass().addClass('layim_groupuser_state').addClass('layim_groupuser_offline');
                    $groupUser.removeClass().addClass('xxim_mytestoffline');
                    break;
            }

            XoW.logger.me(this.classInfo + "_groupUserStateChangeCb");
            return true;
        },

        _groupUserFaceChangeCb: function (params) {
            XoW.logger.ms(this.classInfo + "_groupUserFaceChangeCb");

            var groupUser = params.groupUser;

            var divider = window.ogTree.divider;
            var node = window.ogTree.node; // 此处存着类型
            var nodes = window.ogTree.nodes; // 此处存着头像
//		for(var )
//		groupUser.username
//		for(var key in nodes) {
//			alert(key + "  " + nodes[key]);
//			var keys = key.split('_');
//			if(keys[1] == groupUser.username) {
//				// 是这个人。。。
//
//			}
//		}
            // 节点必需展开过。
            $('a.MzTreeview').each(function (index, item) {
                var $a = $(item);
                var href = $a.attr('href');
                var obj = XoW.utils.parseQueryString(href);
                // alert(obj.id + " " + obj.jid + " " + obj.type);
                if (obj.id == groupUser.username) {
                    //
                    // var $img = $(this).prev('img');
                    var $nobr = $(this).parent();
                    var $img = $('> img', $nobr);
                    $img.attr('src', gblMgr.getViewMgr().getUserFaceFromFaceData(groupUser.face));
                }
            });

            // parseQueryString

            /*for(var key in node) {
			var n = node[key];
			// alert(node[i].icon);
			XoW.logger.d(this.classInfo + "  " + n.sourceIndex + "  " + divider + groupUser.username);
			if(-1 != n.sourceIndex.lastIndexOf(divider + groupUser.username)) {
				// 则说明就是这个人。
				XoW.logger.d(this.classInfo + "  find:" + n.sourceIndex );
				n.icon = this.getUserFaceFromVcard(groupUser.vcard);
			}
		}*/

            XoW.logger.me(this.classInfo + "_groupUserFaceChangeCb");
            return true;
        },

        roomPrivatePopchatAction: function (jid) {
            XoW.logger.ms(this.classInfo + "roomPrivatePopchatAction:" + jid);
            var msgInQueue = this._messageCenterMgr.getMessageInQueueByTypeAndJidAndRemove('roomprivate', jid);
            if (msgInQueue) {
                XoW.logger.d(this.classInfo + "存在消息");
                // 进行显示
                // this._messageCenterMgr.showMessage()
                for (var i = 0; i < msgInQueue.messages.length; i++) {
                    this._messageCenterMgr.addShowMessage({
                        message: msgInQueue.messages[i],
                        type: 'roomprivate'
                    });
                }
            }
            XoW.logger.me(this.classInfo + "roomPrivatePopchatAction");
        },
        roomPrivateTabchatAction: function (jid) {
            XoW.logger.ms(this.classInfo + "roomPrivateTabchatAction");
            // alert("orgTabchatAction " + jid);
            // 历史消息窗口
            this.setHistoryWindow(jid);
            // 隐藏chatlist中的红点。
            this._messageCenterMgr.hideNewMessageInChatList('roomprivate', jid);
            XoW.logger.me(this.classInfo + "roomPrivateTabchatAction");
        },
        groupPrivatePopchatAction: function (jid) {
            XoW.logger.ms(this.classInfo + "groupPrivatePopchatAction:" + jid);
            var msgInQueue = this._messageCenterMgr.getMessageInQueueByTypeAndJidAndRemove('groupprivate', jid);
            if (msgInQueue) {
                XoW.logger.d(this.classInfo + "存在消息");
                // 进行显示
                // this._messageCenterMgr.showMessage()
                for (var i = 0; i < msgInQueue.messages.length; i++) {
                    this._messageCenterMgr.addShowMessage({
                        message: msgInQueue.messages[i],
                        type: 'groupprivate'
                    });
                }
            }
            XoW.logger.me(this.classInfo + "groupPrivatePopchatAction");
        },
        groupPrivateTabchatAction: function (jid) {
            XoW.logger.ms(this.classInfo + "groupPrivateTabchatAction");
            // alert("orgTabchatAction " + jid);
            // 历史消息窗口
            this.setHistoryWindow(jid);
            // 隐藏chatlist中的红点。
            this._messageCenterMgr.hideNewMessageInChatList('groupprivate', jid);
            XoW.logger.me(this.classInfo + "groupPrivateTabchatAction");
        },

        // 窗口已打开，切换至该窗口时
        orgTabchatAction: function (jid) {
            XoW.logger.ms(this.classInfo + "orgTabchatAction:" + jid);

            // alert("orgTabchatAction " + jid);
            // 历史消息窗口
            this.setHistoryWindow(jid);
            // 隐藏chatlist中的红点。
            this._messageCenterMgr.hideNewMessageInChatList('group', jid);


            XoW.logger.me(this.classInfo + "orgTabchatAction:" + jid);
        },

        // 窗口未打开，弹出窗口时
        orgPopchatAction: function (jid) {
            XoW.logger.ms(this.classInfo + "orgPopchatAction:" + jid);

            // alert("orgPopchatAction " + jid);
            // 1,加入群组中的人。
            var group = this._gblMgr.getOrgnizationMgr().getGroupByGroupjid(jid);
            if (!group) {
                layer.msg("不存在该部门：" + jid);
                return;
            }

            // 群组中的成员列表
            var $groupss = $('#layim_groupusers' + XoW.utils.escapeJquery(jid));
            $groupss.addClass('loading');
            var str = "";
            for (var i = 0; i < group.groupusers.length; i++) {
                var u = group.groupusers[i];
                var presenceClass = "xxim_mytestoffline";
                switch (u.state) {
                    case 1 :
                        presenceClass = 'xxim_mytestonline';
                        break;
                    case 2 :
                        presenceClass = 'xxim_mytestchat';
                        break;
                    case 3 :
                        presenceClass = 'xxim_mytestdnd';
                        break;
                    case 4 :
                        presenceClass = 'xxim_mytestaway';
                        break;
                }

                str += '<li class="' + presenceClass + '" data-id="' + group.groupjid + "/" + u.username + '" type="one"><img src="images/group/OM.png"><i></i><span class="xxim_onename">' + u.usernickname + '</span></li>';
            }
            // 在线状态判断。图标还是使用的和好友的那个一样
            // 其中，如果某个人将状态设置为隐身，那么就等于退出了这个聊天室。
//			var presenceClass = "xxim_mytestonline";
//			if(null === stanza[key].show) {
//				presenceClass = "xxim_mytestonline";
//			} else if('away' === stanza[key].show) {
//				presenceClass = "xxim_mytestaway";
//			} else if('dnd' === stanza[key].show) {
//				presenceClass = "xxim_mytestdnd";
//			}  else if('chat' === stanza[key].show) {
//				presenceClass = "xxim_mytestchat";
//			}
//			str += '<li class="' + presenceClass + '" data-id="'+ room.name + "/" + key +'" type="one"><img src="images/group/OM.png"><i></i><span class="xxim_onename">'+ key +'</span></li>';
            $groupss.removeClass('loading');
            $groupss.html(str);
            // var occupant = room.roster[room.nick];
            // XoW.logger.w(occupant.jid + "  " + occupant.affiliation + " " + occupant.role);


            // 展示消息
            var msgInQueue = this._messageCenterMgr.getMessageInQueueByTypeAndJidAndRemove('group', jid);
            if (msgInQueue) {
                XoW.logger.d(this.classInfo + "存在消息");
                // 进行显示
                // this._messageCenterMgr.showMessage()
                for (var i = 0; i < msgInQueue.messages.length; i++) {
                    this._messageCenterMgr.addShowMessage({
                        message: msgInQueue.messages[i],
                        type: 'group'
                    });
                }
            }


            XoW.logger.me(this.classInfo + "orgPopchatAction:" + jid);
        },


        _orgnizationStartCb: function (params) {
            XoW.logger.ms(this.classInfo + "_orgnizationStartCb");

            // 因为使用他那个插件是一次性加载完毕，如何能够？边加载，边显示 。
            // 另外一个插件ztree可以实现，但是不用那个了。
            var $xxim_top = $('#xxim_top');
            var myf = $('#xxim_top > ul.xxim_list').eq(2); // 第几个面板。 0是好友，1是群组，2是历史联系人
            myf.addClass('loading'); // 显示加载的gif

            var treeName = "ogTree";
            var tree = new MzTreeView(treeName);
            // 暴露ogTree
            // window.ogTree = tree;
            window.ogTree = tree;
            tree.setIconPath('scripts/mtree/img/'); // 图片可用路径

            var org = params.org;
            for (var i = 0; i < org.length; i++) {
                var g = org[i];
                var icon = "icon: department;"; // 部门
                if (0 == g.groupfathername) {
                    icon = "icon: company;"; // 企业
                }
                tree.nodes[g.groupfathername + "_" + g.groupname] = icon + " text:" + g.displayname + "; data:id=" + g.groupname + "&groupjid=" + g.groupjid + "&type=group&displayname=" + g.displayname;
                for (var j = 0; j < g.groupusers.length; j++) {

                    var u = g.groupusers[j];
                    tree.nodes[g.groupname + "_" + u.username] = "text:" + u.usernickname + "; data:id=" + u.username + "&jid=" + u.userjid + "&type=groupprivate&groupuserjid=" + g.groupjid + "/" + u.username + "&usernickname=" + u.usernickname;
                    // 添加头像改变监听器
                    u.addHandlerToGroupUser('face', this._groupUserFaceChangeCb.bind(this));
                    // 监听状态改变
                    u.addHandlerToGroupUser('state', this._groupUserStateChangeCb.bind(this));
                    // 监听发送消息
                    u.addHandlerToGroupUser('sendMessage', this._groupUserSendMessageCb.bind(this));

                }
            }


            //  tree.expand = function(id, sureExpand) {
            //	alert(id + "  " + sureExpand);
//			var aId = "#" + treeName + "_link_" + id;
//			var $a = $(aId);
//			// alert($a.attr('href') + " " + $a.attr('id'));
//			var obj = XoW.utils.parseQueryString($a.attr('href'));
//			if('group' == obj.type) {
//				// 订阅该部门
//				this._gblMgr.getOrgnizationMgr().subscribeGroup(obj.groupjid);
//			};
            //return false;
            //}.bind(this);

            tree.afterExpend = function (id, isLoad) {
                // 请求头像
                // alert(id + " + " + isLoad);
                // isLoad = true表示是第一此点开,即第一次加载数据
                if (isLoad) {
                    var aId = "#" + treeName + "_link_" + id;
                    var $a = $(aId);
                    // alert($a.attr('href') + " " + $a.attr('id'));
                    var obj = XoW.utils.parseQueryString($a.attr('href'));
                    if ('group' == obj.type) {
                        // 订阅该部门/人
                        this._gblMgr.getOrgnizationMgr().subscribeGroup(obj.groupjid);

                        // 请求该部门的所有人的头像
                        var group = this._gblMgr.getOrgnizationMgr().getGroupByGroupjid(obj.groupjid);
                        group.groupuserGetVcardFromServer();

                        // 如果是部门,只有自己所在部门可以聊天
//					if(!this._gblMgr.getOrgnizationMgr().isMeInGroup(obj.groupjid)) {
//						// 自己不再这个部门内不能聊天
//						layer.msg("你不属于该部门，无法进入其中");
//						return false;
//					};
//					if(this._gblMgr.getOrgnizationMgr().isTheTopGroup(obj.groupjid)) {
//						layer.msg("无法进入企业通讯录中对话");
//						return false;
//					};
                    }

                }

            }.bind(this),

                tree.nodeClick = function (id) {
                    // 订阅部门，
                    // 打开窗口

                    // alert(id); 当前id
                    // alert(tree.currentNode.id);
                    var sourceIndex = tree.currentNode.sourceIndex;
                    var usernameOrGroupname = sourceIndex;
                    // alert(tree.currentNode.data);
                    var node = tree.nodes[sourceIndex];
                    // alert(node.index);
                    // alert(node.data);

                    var aId = "#" + treeName + "_link_" + id;
                    var $a = $(aId);
                    // alert($a.attr('href') + " " + $a.attr('id'));
                    var obj = XoW.utils.parseQueryString($a.attr('href'));
                    if ('group' == obj.type) {
                        // 订阅该部门/人
                        this._gblMgr.getOrgnizationMgr().subscribeGroup(obj.groupjid);

                        // 请求该部门的所有人的头像。
                        // 那这里如何控制只在第一次点击的时候请求一次呢？。。。

                        // 如果是部门,只有自己所在部门可以聊天
                        if (!this._gblMgr.getOrgnizationMgr().isMeInGroup(obj.groupjid)) {
                            // 自己不再这个部门内不能聊天
                            layer.msg("你不属于该部门，无法进入其中");
                            return false;
                        }
                        ;
                        if (this._gblMgr.getOrgnizationMgr().isTheTopGroup(obj.groupjid)) {
                            layer.msg("无法进入企业通讯录中对话");
                            return false;
                        }
                        ;
                    } else {
                        // 订阅该人
                        this._gblMgr.getOrgnizationMgr().subscribeGroupUser(obj.jid);

                        // 人是都可以聊天的，除了自己
                        if (this._gblMgr.getOrgnizationMgr().isMe(obj.jid)) {
                            layer.msg("不可与自己对话");
                            return false;
                        }
                        ;
                    }
                    // obj.id 是username
                    // obj.jid 是jid
                    // obj.type 是 类型 group
                    // obj.usernickname
                    // obj.groupuserjid

                    // obj.id 是部门名称
                    // obj.groupjid = 部门jid
                    // obj.type 是 group
                    // obj.displayname 是 显示的名称

                    // alert(obj.id + " " + obj.jid + "  " + obj.type + " " + obj.groupuserjid);
//			var fatherNode = null;
//			if("groupuser" == obj.type) {
//				// 如果点击的是用户，就去获取他所在的部门。
//				fatherNode = tree.currentNode.parentNode;
//			}
                    this.popChatWindow(obj);

                    return false;
                }.bind(this);


            tree.setTarget("orgnaization");
            //XoW.logger.d('-->' + tree.toString());
            // 显示到界面
            var html = tree.toString();
            myf.html(html);
            myf.removeClass('loading'); // 显示加载的gif

            // 必须要全部展开才能让哪些节点出现
            // tree.expandAll();
            // 加载头像。。头像这个还是有点坑的，因为presence中没有包含头像的那个hash code，所以没有办法判断是否改变了头像。
            // params.cb();

            XoW.logger.me(this.classInfo + "_orgnizationStartCb");


            return true;
        },

        popChatWindow: function (params) {
            // obj.id 是username
            // obj.jid 是jid
            // obj.type 是 类型 group
            // obj.usernickname
            // obj.groupuserjid

            // obj.id 是部门名称
            // obj.groupjid = 部门jid
            // obj.type 是 group
            // obj.displayname 是 显示的名称

            // obj.jid 全jid   room@conference.openfire/nick
            // obj.nick 昵称     nick

            // xxim.popchatbox($(html));
            var $html = null;
            switch (params.type) {
                case 'group' :
                    $html = $('<li data-id="' + params.groupjid + '" class="xxim_childnode" type="group"><span  class="xxim_onename" >' + params.displayname + '</span>'); // <em class="xxim_time">'+ peopleNumber +'</em></li>
                    break;
                case 'groupprivate' :
                    // 需要 groupuserjid, user昵称
                    $html = $('<li data-id="' + params.groupuserjid + '" type="one"><span class="xxim_onename">' + params.usernickname + '</span></li>');
                    break;
                case 'roomprivate' :
                    $html = $('<li data-id="' + params.jid + '" type="one"><span class="xxim_onename">' + params.nickname + '</span></li>');
                    break;
            }
//		if('group' ==  obj.type) {
//			// 群组
//			// this._gblMgr.getViewMgr();
//			// $html = $('<li data-id="' + obj.jid + '" type="one"><span class="xxim_onename">' + XoW.utils.getResourceFromJid(message.from) + '</span></li>');
//		} else if('groupprivate' == obj.type) {
//			// 群组中的私聊
//		}
            if ($html) {
                xxim.popchatbox($html);
            }

        },


        roomHtml: function (room) {
            var id = room.jid;
            var name = room.name;
            var address = XoW.utils.getNodeFromJid(id);
            var peopleNumber = room.getOccupants();
            return '<li data-id="' + id + '" class="xxim_childnode" type="group"><span  class="xxim_onename" >' + name + ' | ' + address + '</span><em class="xxim_time">' + peopleNumber + '</em></li>';
        },

        _addRoomCb: function (params) {
//		var params = {
//				oldValue : this.allRooms,
//				addValue : _room,
//			};
            XoW.logger.ms(this.classInfo + "_addRoomCb");

            var room = params.addValue;
            var str = this.roomHtml(room);
//    	var id = room.jid;
//    	var name = room.name;
//    	var address = XoW.utils.getNodeFromJid(id);
//        var peopleNumber =  room.getOccupants();
//        var str = '<li data-id="'+ id +'" class="xxim_childnode" type="group"><span  class="xxim_onename" >'+ name + ' | ' + address +'</span><em class="xxim_time">'+ peopleNumber +'</em></li>';
            // XoW.logger.d(this.classInfo + "_addRoomCb() 房间jid是" + id + ' 房间名称：' + name + " 房间地址" + address + "  人数" + peopleNumber );
            $('#roomList ul.xxim_chatlist').append(str);

            XoW.logger.me(this.classInfo + "_addRoomCb");
            return true;
        },

        _updateOneRoomCb: function (params) {
            //	var params = {
            //		room : room,
            //	};
            var room = params.room;
            XoW.logger.ms(this.classInfo + "_updateOneRoomCb");
            XoW.logger.d(this.classInfo + "_updateOneRoomCb 更新一个房间，jid是" + room.jid);

            var $room = $('#roomList ul.xxim_chatlist li[data-id="' + room.jid + '"]');
            var name = room.name;
            var address = XoW.utils.getNodeFromJid(room.jid);
            var peopleNumber = room.getOccupants();
            $room.find('span').text(name + ' | ' + address);
            $room.find('em').text(peopleNumber);
            XoW.logger.me(this.classInfo + "_updateOneRoomCb");
            return true;
        },
        _clearOneRoomCb: function (params) {
//		var params = {
//				roomJid : roomJid,
//				room : removeRoom,
//			};
            var roomJid = params.roomJid;
            XoW.logger.ms(this.classInfo + "_clearOneRoomCb");
            XoW.logger.d(this.classInfo + "_clearOneRoomCb 清除一个房间，jid是" + roomJid);

            $('#roomList ul.xxim_chatlist li[data-id="' + roomJid + '"]').remove();

            XoW.logger.me(this.classInfo + "_clearOneRoomCb");
            return true;
        },

        _clearAllRoomCb: function (params) {
//		var params = {
//				oldValue : this.allRooms,
//			};
            XoW.logger.ms(this.classInfo + "_clearAllRoomCb");
            XoW.logger.d(this.classInfo + "_clearAllRoomCb 清除所有房间");

            $('#roomList ul.xxim_chatlist').html('');

            XoW.logger.me(this.classInfo + "_clearAllRoomCb");
            return true;
        },


        _addJidChatCb: function (params) {
//		var params = {
//				oldValue : this.jidChats,
//				addValue : _jidChat,
//			};
            var chat = params.addValue;
            chat.addHandlerToChat('addMessage', this._addMessageCb.bind(this));
            return true;
        },

        _fileReceiveStateChangeCb: function (params) {
            XoW.logger.ms(this.classInfo + "_fileReceiveStateChangeCb");
//		var params = {
//				oldValue : this.receiveState,
//				newValue : _receiveState,
//				file : this,
//			};
            var file = params.file;
            var type = '';
            if (this._gblMgr.getCurrentUser().isMyBareJid(file.from)) {
                type = 'me';
            }

            XoW.logger.d("type是" + type + " sid是" + file.sid + ", state" + file.receiveState +
                "  文件size " + file.size + "   文件数据长度" + Math.ceil(file.data.length / 4) * 3);


            var $file = $('div.layim_file[sid="' + file.sid + '"]');
            var $fileState = $file.find('.layim_fileReceiveState');

            var open = '<a href="javascript:void(0);" style="color:red" id="fileStopReceive">取消</a>';
            var error = this.fileStateWord.fileError;
            var receive, receiving, unreceive, denyreceive, mestop, nomestop;
            if ('me' === type) {
                // 我发送给对方的
                receive = this.fileStateWord.noMeReceiveFile;
                receiving = '<span class="">已发送' + this.fileReceivePercent(file) + "%" + '</span>';
                unreceive = '<a href="javascript:void(0);" style="color:red" id="fileStopReceive">取消</a>&nbsp;&nbsp;等待对方接收文件...';
                denyreceive = this.fileStateWord.noMeDenyReceiveFile;
                mestop = this.fileStateWord.meStopSendFile;
                nomestop = this.fileStateWord.noMeStopReceiveFile;
            } else {
                // 对方发送给我的
                receiving = '<span class="">已接收' + this.fileReceivePercent(file) + "%" + '</span>';
                receive = this.fileStateWord.meReceiveFile;
                unreceive = '<a href="javascript:void(0);" value="receive" style="color:blue">接收该文件</a>'
                    + '&nbsp;&nbsp;'
                    + '<a href="javascript:void(0);" value="denyreceive" style="color:blue">拒绝接收该文件</a>';
                denyreceive = this.fileStateWord.meStopReceiveFile;
                mestop = this.fileStateWord.meStopReceiveFile;
                nomestop = this.fileStateWord.noMeStopSendFile;
            }

            if (XoW.FileReceiveState.NOMESTOP == file.receiveState) {
                $fileState.html(nomestop);
            } else if (XoW.FileReceiveState.ERROR == file.receiveState) {
                $fileState.html(error);
            } else if (XoW.FileReceiveState.MESTOP == file.receiveState) {
                $fileState.html(mestop);
            } else if (XoW.FileReceiveState.OPEN == file.receiveState) {
                $fileState.html(open);
            } else if (XoW.FileReceiveState.UNRECEIVE == file.receiveState) {

            } else if (XoW.FileReceiveState.DENYRECEIVE == file.receiveState) {
                $fileState.html(denyreceive);
            } else if (XoW.FileReceiveState.RECEIVING == file.receiveState) {
                XoW.logger.d(this.classInfo + "接受中");
                //var pid = "progressbar" + $file.attr("sid");
                // var value = this.progressbarChange(file);
                if ($fileState.find('#fileStopReceive').length > 0) {
                    // 如果已经有了 终止 接收了，那么则不用添加open，
                    // 在判断是否
                    $(receiving).insertAfter($fileState.find('#fileStopReceive'));
                    if ($fileState.find('span').length > 1) {
                        // 如果超过一个，就把第二个给移除掉
                        $fileState.find('span').last().remove();
                    }
                } else {
                    // 如果没有中断接受，那么就重新渲染中断和下载百分比
                    $fileState.html(open + receiving);
                }
                // 接受过程中应该要加一个中断接受

            } else if (XoW.FileReceiveState.RECEIVE == file.receiveState) {
                // 后面要变成打开该文件？但是js好像无法获取该下载的文件的路径吧。。
                // $fileState.html('<span class="">已接收该文件</span>');
                // receiveStateHtml = receive;
                $fileState.html(receive);
                if ('me' !== type) {
                    // 如果是对方发送给我的
                    if (XoW.utils.isImageMIME(file.mime)) {
                        // 如果是图片，则直接显示
                        var $img = $file.find('.layim_fileinfo img');
                        // 如果图片有错误，则显示默认图片
                        $img.bind('error', function () {
                            var $this = $(this);
                            $this.attr('src', 'images/imagedamage.png');
                            $this.parent().parent().find('.layim_fileReceiveState').html('<div class="">已接收该图片，但该图片有错误！</div>');
                            return true; // 返回true表示已处理，浏览器就会认为没有异常了
                        });
                        $img.attr('src', "data:image/png;base64," + file.data);

                    } else {
                        download("data:" + file.mime + ";base64," + file.data, file.filename, file.mime);
                    }
                }
            }


            XoW.logger.me(this.classInfo + "_fileReceiveStateChangeCb");
            return true;
        },

        _addMessageCb: function (params) {
            // 明天继续消息的回调完成。
//		var params = {
//				oldValue : this.allMessage,
//				addValue : _message,
//				chat : this,
//			};

            XoW.logger.ms(this.classInfo + "_addMessageCb");
            var msg = params.addValue;
            var chat = params.chat;
            var stateStr = '';

            switch (msg.type) {
                case 'normal' :
                case 'chat' :
                case 'file' :
                    switch (msg.contentType) {
                        case 'file' :
                            // 如果是个文件，也要监听其变化
                            msg.addHandlerToFile('receiveState', this._fileReceiveStateChangeCb.bind(this));

                        case 'msg' :
                        case 'delaymsg' :
                            // 如果好友不在userMgr中，说明可能是个来自非好友的聊天
                            // var friend = this._gblMgr.getUserMgr().getFriendByJid(from);
                            // 暂时这个不做处理。应该是要在这边进行处理，非好友不在好友列表中
                            // 无法进行闪烁，显示消息数这些操作。
                            XoW.logger.d(this.classInfo + "有消息到来" + this._gblMgr.getCurrentUser().isMyBareJid(msg.from));


                            // 声音提示，如果不是我发送的，则有音频提示
                            if (!this._gblMgr.getCurrentUser().isMyBareJid(msg.from)) {
                                XoW.logger.d(this.classInfo + "是别人的消息");
                                this._playAudio(this._audio.MSG);
                            }
                            // 对方发来消息，当前窗口可能处于的状态
                            // 1，未打开 -- 好友列表闪烁
                            // 2，打开，并且是当前聊天窗口 -- 直接将消息放上去
                            // 3, 打开，但不是当前聊天窗口 -- 好友列表不闪烁，当前聊天列表显示消息条数
                            // 4, 打开，是当前聊天窗口，但是被最小化了 -- 最大化窗口，显示消息
                            // 5, 打开，不是当前聊天窗口，但是被最小化了 -- 最大化窗口，当前聊天列表显示消息条数

                            // 1，如何判断和B的聊天窗口已存在？
                            // layim里面有个chating{}，里面存放着当前所有的聊天窗口

                            // 2，如何判断和B的聊天窗口是当前的聊天窗口？
                            // 如果是当前聊天窗口，它会有个class ： layim_chatnow

                            // 3，如何判断是否被最小化了？
                            // 聊天窗口的的父div，拥有class="xubox_layer"的那个div，
                            // 如果它的style里面的display为none就是最小化。

                            // 要得到对方的jid
                            var jid = XoW.utils.getBareJidFromJid(chat.to);
                            XoW.logger.d(this.classInfo + "当前jid为： " + jid);

                            // 在chating中，以如下方式作为key保存聊天窗口
                            var key = "one" + jid;
                            var msgCount = chat.getUnreadCount();
                            // 第一步，判断聊天窗口否已经存在
                            if (!config.chating[key]) {
                                // 不存在，进行闪烁
                                XoW.logger.d(this.classInfo + "不存在与该好友的聊天窗口");
                                // imview.blink(chat.getTo(),chat.getUnReadMessageCount());
                                // 真正的未读消息包括msg,delaymsg,file，不包括那些chatstate
                                // 好友列表闪烁
                                this.blinkComeMsg(jid, msgCount);

                            } else {
                                // 说明存在与该用户的聊天窗口
                                // 第二步，判断与该用户的聊天窗口是否有chatnow
                                var isChatNow = this.isJidChatNow(jid);
//					    	var liStr = "ul.layim_chatlist li[data-id='" + jid + "']";
//							var li = $(liStr);
//							if(li.hasClass('layim_chatnow')) {
//								// 是当前聊天窗口
//								XoW.logger.d(this.classInfo + "与该好友是当前聊天窗口");
//								isChatNow = true;
//								// imview.showMessageWhenOpenAndChatnow(chat);
//					    	} else {
//					    		// 不是当前聊天窗口
//					    		XoW.logger.d(this.classInfo + "与该好友不是当前聊天窗口");
//					    		isChatNow = false;
//					    		// imview.showMessageCountInNotChatnow(chat.getTo(),chat.getUnReadMessageCount());
//					    	}

                                // 第三步，判断聊天窗口是否被最小化了
                                var isMin = this.isJidChatMinimize(jid);

//							var isMin = false;
//							if(li.parents('div.xubox_layer').css('display') == 'none') {
//								// 是最小化了
//								XoW.logger.d(this.classInfo + "当前窗口状态是最小化");
//								isMin = true;
//							} else {
//								// 不是最小化
//								XoW.logger.d(this.classInfo + "当前窗口状态不是最小化");
//								isMin = false;
//							}


                                // 现在该用户的窗口已经存在，有下面四种情况
                                // 1,当前，不是最小化：消息弹出去
                                // 2,不是当前，不是最小化：在左侧显示消息条数
                                // 3,当前，最小化： 暂定，直接弹到最大化，显示消息
                                // 4,不是当前，是最小化：暂定，弹到最大化，左侧显示消息条数。
                                // 得到该好友
                                var friend = this._gblMgr.getUserMgr().getFriendByJid(jid);
                                var me = this._gblMgr.getCurrentUser();
                                if (null == friend) {
                                    XoW.logger.e(this.classInfo + "不存在该好友");
                                    return true;
                                }
                                // var msgCount = chat.getUnreadMsgCount() + chat.getUnreadDelayMsgCount() + chat.getUnreadFileCount();
                                if (isChatNow && !isMin) {
                                    // 1
                                    XoW.logger.d(this.classInfo + "可以显示该好友信息");
                                    this.popMessageToChatNow(friend, me, msg);

                                } else if (!isChatNow && !isMin) {
                                    // 2
                                    XoW.logger.d(this.classInfo + "不能显示该好友信息，显示消息条数");
                                    this.showMessageCountInChatlist(friend.getJid(), msgCount);
                                } else if (isChatNow && isMin) {
                                    // 3
                                    XoW.logger.d(this.classInfo + "窗口最大化后，可以显示该好友信息");
                                    // 聊天窗口正常化
                                    this.chatboxMinToNormal();
                                    this.popMessageToChatNow(friend, me, msg);

                                } else if (!isChatNow && isMin) {
                                    XoW.logger.d(this.classInfo + "窗口最大化后，显示消息条数");
                                    // 4
                                    this.chatboxMinToNormal();
                                    this.showMessageCountInChatlist(friend.getJid(), msgCount);
                                }
                            }
                            break;
                        case 'active' :
                            stateStr = '对方正在关注与你的聊天窗口';
                            this.showChatState(msg.from, stateStr);
                            break;
                        case 'inactive' :
                            stateStr = '对方已不关注与你的聊天窗口';
                            this.showChatState(msg.from, stateStr);
                            break;
                        case 'gone' :
                            stateStr = '对方已关闭与你的聊天窗口';
                            this.showChatState(msg.from, stateStr);
                            break;
                        case 'composing' :
                            stateStr = '对方正在输入...';
                            this.showChatState(msg.from, stateStr);
                            break;
                        case 'paused' :
                            stateStr = '对方暂停输入';
                            this.showChatState(msg.from, stateStr);
                            break;
                        default :
                            XoW.logger.e(this.classInfo + "未知类型的消息" + msg.contentType);
                            break;
                    }
                    break;
                case 'headline' :
                    // 通知
                    break;

            }


            XoW.logger.me(this.classInfo + "_addMessageCb");

            return true;
        },

        /**
         * 对方发给我的消息
         * @param msg 消息
         * @param friend 对方
         */
        getMessageHtml: function (friend, me, msg) {
            XoW.logger.ms(this.classInfo + "getMessageHtml()");

            // 消息是对方发给我的，还是我发给对方的
            var messageSendType = '';
            var user = friend;
            if (!friend.isMyBareJid(msg.from)) {
                messageSendType = 'me';
                user = me;
            }
            var msgInfo = '';
            if ('normal' == msg.type) {
                if ('delaymsg' == msg.contentType) {
                    msgInfo = '(离线广播)';
                    return this.msghtml(msg, user, messageSendType, msgInfo);
                } else if ('msg' == msg.contentType) {
                    msgInfo = '(广播)';
                    return this.msghtml(msg, user, messageSendType, msgInfo);
                }
            }
            if ('chat' == msg.type) {
                if ('delaymsg' == msg.contentType) {
                    msgInfo = '(离线消息)';
                    return this.msghtml(msg, user, messageSendType, msgInfo);
                } else if ('msg' == msg.contentType) {
                    return this.msghtml(msg, user, messageSendType, '');
                }
            }
            if ('file' == msg.type) {
                if (XoW.utils.isImageMIME(msg.mime)) {
                    return this.imghtml(msg, user, messageSendType);
                } else {
                    return this.filehtml(msg, user, messageSendType);
                }
            }
            // if('me' == )

//		switch(msg.CotentType) {
//			case 'msg' :
//			case 'delaymsg' :
//				break;
//
//		}
            /*
		if(msg instanceof XoW.MessageModel) {
			// 普通消息
			XoW.logger.d(this.classInfo + "是XoW.MessageModel");
			if(msg.getContentType() == XoW.MessageContentType.MSG) {
				if(msg.getFrom() != friend.getJid()) { // 说明是自己发送的
					var me = this._gblMgr.getCurrentUser();
					XoW.logger.d(this.classInfo + "是自己发给好友的的XoW.MessageContentType.MSG消息");
					return this.msghtml(msg, me, 'me');
				} else {

					XoW.logger.d(this.classInfo + "是好友发给自己的XoW.MessageContentType.MSG消息");
					return this.msghtml(msg, friend);
				}
			}
			if(msg.getContentType() == XoW.MessageContentType.DELAYMSG) {
				XoW.logger.d(this.classInfo + "是XoW.MessageContentType.DELAYMSG消息");
				return this.msghtml(msg, friend);
			}
		} else if(msg instanceof XoW.FileModel) {
			// 如果是文件FileModel
			if(msg.getFrom() != friend.getJid()) { // 说明是自己发送的
				var me = this._gblMgr.getCurrentUser();
				XoW.logger.d(this.classInfo + "是自己发给好友的的XoW.FileModel消息");
				if(XoW.utils.isImageMIME(msg.getMime())) {
					return this.imghtml(msg, me, 'me');
				} else {
					return this.filehtml(msg, me, 'me');
				}
			} else {
				XoW.logger.d(this.classInfo + "是好友发给自己的XoW.FileModel消息");
				if(XoW.utils.isImageMIME(msg.getMime())) {
					return this.imghtml(msg, friend);
				} else {
					return this.filehtml(msg, friend);
				}
			}
		}*/
            return null;
            XoW.logger.me(this.classInfo + "getMessageHtml()");
        },

        /**
         * 窗口已打开，将消息弹出给当前的聊天对象,
         */
        popMessageToChatNow: function (friend, me, msg) {
            XoW.logger.ms(this.classInfo + "popMessageToChatNow()");

            var html = this.getMessageHtml(friend, me, msg);
            if (null == html) {
                XoW.logger.e(this.classInfo + "无法获得该消息的html");
                return;
            }
//		liStr = "ul.xxim_chatlist li[data-id='" + friend.getJid() + "']";
//		var li = $(liStr);
//		var type = li.attr("type");
//		var keys = type + XoW.utils.getNodeFromJid(friend.getJid());


            var imarea = this.getLayimChatarea('one', friend.getJid());

            //只有窗口弹出时才能获得
//		var imarea = xxim.chatbox.find('#layim_area'+ keys);//定位聊天窗口
            //    var layimli = document.getElementById("layim_user"+keys); //获取聊天窗口句柄

            // 消息放到界面上
            imarea.append(html);
            // 消息框右边的滚动条
            imarea.scrollTop(imarea[0].scrollHeight);

            XoW.logger.d(this.classInfo + "消息是否已读：" + msg.isRead);
            // 将该消息设置成已读
            // msg.setIsRead(true);
            msg.isRead = true;

            XoW.logger.d(this.classInfo + "消息是否已读：" + msg.isRead);

            XoW.logger.me(this.classInfo + "popMessageToChatNow()");
        },


        fileStateWord: {

//		UNRECEIVE 	: "unreceive", 	// 未接受  before open
//		--RECEIVE	 	: "receive", 	// 已接受 after close
//		--DENYRECEIVE : "denyReceive",// 已拒绝接受
//		OPEN 		: "open", 		// 同意接收，但是还未正式开始接收数据
//		RECEIVING 	: "receiving", 	// 接收中 data
//		--MESTOP 		: "meStop", 	// 自己终止接收文件
//		--NOMESTOP    : "noMeStop", 	// 不是自己终止接收文件
            meReceiveFile: '您已接收该文件',
            noMeReceiveFile: '对方已接收该文件',
            meDenyReceiveFile: '您已拒绝接收该文件',
            noMeDenyReceiveFile: '对方已拒绝接收该文件',
            meStopReceiveFile: '您已取消接收该文件',
            meStopSendFile: '你已取消发送该文件',
            noMeStopReceiveFile: '对方已取消接收该文件',
            noMeStopSendFile: '对方已取消发送该文件',
            fileError: '文件的传输被取消了',
        },

        /**
         * 计算发送文件或者接受文件的大小，
         * @param file  发送的文件
         * @returns 百分比
         */
        fileReceivePercent: function (file) {
            /**2016/12/27 林兴洋
             * 第二次做法，第一次的做法对于计算发送文件的大小不可行，因为发送文件时，他的data/size总是100%的
             * 所以用 当前的seq +1  乘以 blocksize ，得到发送的数据的大小
             * 但是因为 一个文件可能大小为  4097 那么。blocksize为4096，发送seq = 1时，
             * resize =  Math.ceil(4096 * 2 / 4 ) * 3 。大于4097了
             * 所以，如果resize > size，那么resize 就让他=size或者就知道已经到达100%了
             *
             */
            var resize = Math.ceil(file.blocksize * (file.seq + 1) / 4) * 3;
            var size = file.size; // 总大小
            if (resize > size) resize = size;
            var percent = Math.round(resize / size * 100);
            XoW.logger.w("resize" + resize + " size" + size + " percent" + percent);
            return percent;

            // 第一次做法，通过已接受data的大小得到百分比
//		size = file.getSize(); // 总大小
//		resize = Math.ceil(file.getData().length / 4) * 3; // 当前接收到的大小，因为经过base64加密，所以要/4*3
//		return Math.round(resize / size * 100);
        },


        filehtml: function (msg, user, type) {
            XoW.logger.ms(this.classInfo + "filehtml()");
            XoW.logger.ms(this.classInfo + "是否是" + XoW.utils.isImageMIME(msg.mime));

            var face = this.getUserFace(user);
            var receive, unreceive, denyreceive, mestop, nomestop;
            // type=me 表示是我发送给对方的消息。
            var error = this.fileStateWord.fileError;
            var open = '<a href="javascript:void(0);" style="color:red" id="fileStopReceive">取消</a>';
            var receiving = '<span class="">' + this.fileReceivePercent(msg) + "%" + '</span>';
            if ('me' === type) {
                // 我发送给对方的
                receive = this.fileStateWord.noMeReceiveFile;
                unreceive = '<a href="javascript:void(0);" style="color:red" id="fileStopReceive">取消</a>&nbsp;&nbsp;等待对方接收文件...';
                denyreceive = this.fileStateWord.noMeDenyReceiveFile;
                mestop = this.fileStateWord.meStopSendFile;
                nomestop = this.fileStateWord.noMeStopReceiveFile;
            } else {
                // 对方发送给我的
                receive = this.fileStateWord.meReceiveFile;
                unreceive = '<a href="javascript:void(0);" value="receive" style="color:blue">接收该文件</a>'
                    + '&nbsp;&nbsp;'
                    + '<a href="javascript:void(0);" value="denyreceive" style="color:blue">拒绝接收该文件</a>';
                denyreceive = this.fileStateWord.meStopReceiveFile;
                mestop = this.fileStateWord.meStopReceiveFile;
                nomestop = this.fileStateWord.noMeStopSendFile;

            }

            // 如果文件的长度大于20，则只取前20个，后面加3个点
            var filename = msg.filename;
            var filetype = '未知';
            filetype = filename.substring(filename.lastIndexOf('.') + 1, filename.length);
            filetype += '文件';

            if (filename.length > 20) {
                filename = filename.substring(0, 20) + "...";
            }
            var mime = msg.mime;
            if (null == mime) {
                mime = "未知";
            }


            /*
		 <div class="layim_file" sid="" >
		 	<div class="layim_filepicture"></div> // 显示图片的
		 	<div class="layim_fileinfo"></div> // 文件信息
		 	<div class="layim_fileReceiveState"></div> // 文件接收状态
		 </div>
		  XoW.FileReceiveState = {
			-UNRECEIVE 	: "unreceive", 	// 未接受  before open
			-RECEIVE	 	: "receive", 	// 已接受 after close
			-DENYRECEIVE : "denyReceive",// 已拒绝接受
			-OPEN 		: "open", 		// 同意接收，但是还未正式开始接收数据
			-RECEIVING 	: "receiving", 	// 接收中 data
			-MESTOP 		: "meStop", 	// 自己终止接收文件
			-NOMESTOP    : "noMeStop", 	// 不是自己终止接收文件
		};
		 */
            var receiveStateHtml = "";
            if (XoW.FileReceiveState.RECEIVE == msg.receiveState) {
                XoW.logger.d(this.classInfo + "已接受" + msg.receiveState);
                // 已接受
                receiveStateHtml = receive;
            } else if (XoW.FileReceiveState.ERROR == msg.receiveState) {
                receiveStateHtml(error);
            } else if (XoW.FileReceiveState.UNRECEIVE == msg.receiveState) {
                XoW.logger.d(this.classInfo + "未接受()" + msg.receiveState);
                // 未接受
                receiveStateHtml = unreceive;
            } else if (XoW.FileReceiveState.DENYRECEIVE == msg.receiveState) {
                XoW.logger.d(this.classInfo + "已拒接接受()" + msg.receiveState);
                // 已拒接接受
                receiveStateHtml = denyreceive;
            } else if (XoW.FileReceiveState.RECEIVING == msg.receiveState) {
                XoW.logger.d(this.classInfo + "接收中()" + msg.receiveState);
                // 接收中
                receiveStateHtml = receiving;
                // receiveStateHtml =  '<span class="">接收中</span>';
            } else if (XoW.FileReceiveState.OPEN == msg.receiveState) {
                receiveStateHtml = open;
            } else if (XoW.FileReceiveState.MESTOP == msg.receiveState) {
                receiveStateHtml = mestop;
            } else if (XoW.FileReceiveState.NOMESTOP == msg.receiveState) {
                receiveStateHtml = nomestop;
            }
            var html =
                '<li class="' + (type === 'me' ? 'layim_chateme' : '') + '">'
                + '<div class="layim_chatuser">'
                + function () {
                    if (type === 'me') {
                        return '<span class="layim_chattime">' + msg.time + '</span>'
                            + '<span class="layim_chatname">' + user.name + '</span>'
                            + '<img src="' + face + '" >';
                    } else {
                        return '<img src="' + face + '" >'
                            + '<span class="layim_chatname">' + user.name + '</span>'
                            + '<span class="layim_chattime">' + msg.time + '</span>';
                    }
                }()
                + '</div>'
                + '<div class="layim_chatsay">'
                + ' 	<div class="layim_file" sid="' + msg.sid + '">'
                + ' 		<div class="layim_filepicture" ondragstart="return false;" ><span >' + filetype + '</span></div>'
                + '		<div class="layim_fileinfo">'
                + ' 			<span class="layim_chatname">名称：' + filename + '</span><br>'
                + ' 			<span class="layim_chatname">类型：' + mime + '</span><br>'
                + ' 			<span class="layim_chatname">大小：' + XoW.utils.bytesToSize(msg.size) + '</span><br>'
                + '		</div>'
                + '		<div class="layim_fileReceiveState">' + receiveStateHtml + '</div>'
                + '		<em class="layim_zero"></em>'
                + '	</div>'
                + '</div>'
                + '</li>';

            XoW.logger.me(this.classInfo + "filehtml()");
            return html;
        },
        /**
         * 图片模板
         * @param msg
         * @param user
         * @param type
         * @returns {String}
         */
        imghtml: function (msg, user, type) {
            XoW.logger.ms(this.classInfo + "imghtml()");

            /*
		 <div class="layim_file" sid="" >
		 	<div class="layim_fileinfo"></div> // 文件信息
		 	<div class="layim_fileReceiveState"></div> // 文件接收状态
		 </div>
		 XoW.FileReceiveState = {
			UNRECEIVE 	: "unreceive", 	// 未接受  before open
			RECEIVE	 	: "receive", 	// 已接受 after close
			DENYRECEIVE : "denyReceive",// 已拒绝接受
			OPEN 		: "open", 		// 同意接收，但是还未正式开始接收数据
			RECEIVING 	: "receiving", 	// 接收中 data
			MESTOP 		: "meStop", 	// 自己终止接收文件
			NOMESTOP    : "noMeStop", 	// 不是自己终止接收文件
		};
		 */

            var face = this.getUserFace(user);
            var receive, unreceive, denyreceive, mestop, nomestop, imgHtml;
            // type=me 表示是我发送给对方的消息。
            var error = this.fileStateWord.fileError;
            var open = '<a href="javascript:void(0);" style="color:red" id="fileStopReceive">取消</a>';
            var receiving = '<span class="">' + this.fileReceivePercent(msg) + "%" + '</span>';
            if ('me' === type) {
                // 我发送给对方的
                receive = this.fileStateWord.noMeReceiveFile;
                unreceive = '<a href="javascript:void(0);" style="color:red" id="fileStopReceive">取消</a>&nbsp;&nbsp;等待对方接收文件...';
                denyreceive = this.fileStateWord.noMeDenyReceiveFile;
                mestop = this.fileStateWord.meStopSendFile;
                nomestop = this.fileStateWord.noMeStopReceiveFile;
                // 如果是自己发送图片给对方，那么图片可以直接显示
                imgHtml = '<img ondragstart="return false;" src="data:image/png;base64,' + msg.data + '" onerror="var $this = $(this);$this.attr(\'src\', \'images/imagedamage.png\');$this.parent().parent().find(\'.layim_fileReceiveState\').html(\'<div >该图片有错误！</div>\');return true;"/>';
            } else {
                // 对方发送给我的
                receive = this.fileStateWord.meReceiveFile;
                unreceive = '';// 图片是自动接收，所以不会有这个
                denyreceive = this.fileStateWord.meDenyReceiveFile;
                mestop = this.fileStateWord.meStopReceiveFile;
                nomestop = this.fileStateWord.noMeStopSendFile;
                // 如果是对方发图片给自己，在图片还没有下载完成之前无法显示，则显示默认图片img.png。
                imgHtml = '<img ondragstart="return false;" src="images/img.png" />';

            }

            var receiveStateHtml = "";
            // 这边只是打开与该用户聊天窗口的该文件的瞬时的状态，变动的状态在 _ibbFile_cb，
            // 当然，除非该文件 已经处于拒接或者已接受等不再变化的状态
            if (XoW.FileReceiveState.RECEIVE == msg.receiveState) {
                // 已接受
                if (type != 'me') {
                    // 对方发送给自己的图片，并且图片已经接受完毕
                    imgHtml = '<img ondragstart="return false;" src="data:image/png;base64,' + msg.data + '" onerror="var $this = $(this);$this.attr(\'src\', \'images/imagedamage.png\');$this.parent().parent().find(\'.layim_fileReceiveState\').html(\'<div >已接收该图片，但该图片有错误！</div>\');return true;"/>';
                }
                receiveStateHtml = receive;

            } else if (XoW.FileReceiveState.ERROR == msg.receiveState) {
                receiveStateHtml(error);
            } else if (XoW.FileReceiveState.UNRECEIVE == msg.receiveState) {
                // 未接受，图片默认自动接收
                receiveStateHtml = unreceive;

            } else if (XoW.FileReceiveState.DENYRECEIVE == msg.receiveState) {
                // 已拒接接收
                receiveStateHtml = denyreceive;

            } else if (XoW.FileReceiveState.RECEIVING == msg.receiveState) {
                // 接收中
                receiveStateHtml = open + receiving;

            } else if (XoW.FileReceiveState.MESTOP == msg.receiveState) {
                // 自己停止了接收
                receiveStateHtml = mestop;

            } else if (XoW.FileReceiveState.NOMESTOP == msg.receiveState) {
                // 对方停止了接收
                receiveStateHtml = nomestop;

            } else if (XoW.FileReceiveState.OPEN == msg.receiveState) {
                // 同意接收文件但还没开始正式发送数据
                receiveStateHtml = open;

            }

            var html =
                '<li class="' + (type === 'me' ? 'layim_chateme' : '') + '">'
                + '<div class="layim_chatuser">'
                + function () {
                    if (type === 'me') {
                        return '<span class="layim_chattime">' + msg.time + '</span>'
                            + '<span class="layim_chatname">' + user.name + '</span>'
                            + '<img src="' + face + '" >';
                    } else {
                        return '<img src="' + face + '" >'
                            + '<span class="layim_chatname">' + user.name + '</span>'
                            + '<span class="layim_chattime">' + msg.time + '</span>';
                    }
                }()
                + '</div>'
                + '<div class="layim_chatsay">'
                + ' 	<div class="layim_file" sid="' + msg.sid + '">'
                + '		<div class="layim_fileinfo">' + imgHtml + '</div>'
                + '		<div class="layim_fileReceiveState">' + receiveStateHtml + '</div>'
                + '		<em class="layim_zero"></em>'
                + '	</div>'
                + '</div>'
                + '</li>';

            XoW.logger.me(this.classInfo + "imghtml()");
            return html;
        },

        /**
         * 普通消息和离线消息模板
         * msg 消息
         * user 发消息的人
         * type 我发的 type=me  对方发的  type=''
         * msgInfo 消息可能是  离线消息，离线通知，通知，以及空值为普通消息
         *
         */
        msghtml: function (msg, user, type, msgInfo) {
            XoW.logger.ms(this.classInfo + "msghtml()");

            var face = this.getUserFace(user);

            // 发送过来的消息可能包含表情符号，换行\n，脚本等信息，要进行处理。
            // 1，先将脚本全部转码XoW.utils.xmlescape
            // 2，\n 转为br
            // 3，将表情解析为图片
            body = msg.body;
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
            body = this.StringToFace(body);
//		XoW.logger.w("解析表情" + body);
////
            var name = user.name;
            if (null == name || '' == name) {
                name = XoW.utils.getNodeFromJid(user.jid);
            }
            var time = msg.time;


            XoW.logger.me(this.classInfo + "msghtml()");
            return '<li class="' + (type === 'me' ? 'layim_chateme' : '') + '">'
                + '<div class="layim_chatuser">'
                + function () {
                    if (type === 'me') {
                        return '<span class="layim_chattime">' + time + '</span>'
                            + '<span class="layim_chatname">' + name + '</span>'
                            + '<img src="' + face + '" >';
                    } else {
                        // if(XoW.MessageContentType.DELAYMSG == msg.getContentType()) {
                        return '<img src="' + face + '" >'
                            + '<span class="layim_chatname">' + name + '</span>'
                            + '<span class="layim_chattime">' + time + '</span><span style="color:red;">' + msgInfo + '</span>';
//	        	  } else {
//	        		  return '<img src="'+ face +'" >'
//	        		  +'<span class="layim_chatname">'+ name +'</span>'
//	        		  +'<span class="layim_chattime">'+ time +'</span>';
//	        	  }
                    }
                }()
                + '</div>'
                // 获取消息，不做遍历了，因为也没用用到多个body
                // 此时的body要求已经转义完成可以显示，不然会被JS攻击
                + '<div class="layim_chatsay">' + body + '<em class="layim_zero"></em></div>'
                + '</li>';
        },

        /**discard
         * 普通消息模板
         */
        /*
	 delaymsghtml : function(msg, user, type){
		 XoW.logger.ms(this.classInfo + "delaymsghtml()");
		 var face = "";
		 if(null != user.getFace() && "" != user.getFace()) {
			 face = "data:image/;base64," + user.getFace();
		 } else {
			 face = this.defaultFace;
		 }
		 XoW.logger.me(this.classInfo + "delaymsghtml()");

		 return '<li class="'+ (type === 'me' ? 'layim_chateme' : '') +'">'
		 +'<div class="layim_chatuser">'
		 + function(){
			 if(type === 'me'){
				 return '<span class="layim_chattime">'+ msg.getTime() +'</span>'
				 +'<span class="layim_chatname">'+ user.getName()+'</span>'
				 +'<img src="'+ face +'" >';
			 } else {
				 return '<img src="'+ face +'" >'
				 +'<span class="layim_chatname">'+ user.getName() +'</span>'
				 +'<span class="layim_chattime">'+ msg.getTime() +'<span style="color:red;">(离线消息)</span></span>';
			 }
		 }()
		 +'</div>'
		 // 获取消息，不做遍历了，因为也没用用到多个body
		 +'<div class="layim_chatsay">'+ msg.body[0] +'<em class="layim_zero"></em></div>'
		 +'</li>';
	 },
*/
        /**
         * @param jid 发送者
         * @param chat
         * @param msg 消息
         * @returns
         */
        /*
	_showMessage : function(jid, chat, msg) {
		XoW.logger.ms(this.classInfo + "_showMessage()");

//		// 声音提示，如果不是我发送的，则有音频提示
    	if(msg.getFrom() != this._gblMgr.getCurrentUser().getJid()) {
    		this._playAudio(this._audio.MSG);
    	}
//    	if(msg.getFrom() != friend.getJid()) { // 说明是自己发送的
//			var me = this._gblMgr.getCurrentUser();
//			XoW.logger.d(this.classInfo + "是自己发给好友的的XoW.MessageContentType.MSG消息");
//			return this.msghtml(msg, me, 'me');
//		} else {
//
//			XoW.logger.d(this.classInfo + "是好友发给自己的XoW.MessageContentType.MSG消息");
//			return this.msghtml(msg, friend);
//		}

		// 对方发来消息，当前窗口可能处于的状态
		// 1，未打开
		// 2，打开，并且是当前聊天窗口
		// 3, 打开，但不是当前聊天窗口
		// 4, 打开，是当前聊天窗口，但是被最小化了
		// 5, 打开，不是当前聊天窗口，但是被最小化了


		// 1，如何判断和B的聊天窗口已存在？
		// layim里面有个chating{}，里面存放着当前所有的聊天窗口

		// 2，如何判断和B的聊天窗口是当前的聊天窗口？
		// 如果是当前聊天窗口，它会有个class ： layim_chatnow

		// 3，如何判断是否被最小化了？
		// 聊天窗口的的父div，拥有class="xubox_layer"的那个div，
		// 如果它的style里面的display为none就是最小化。

		XoW.logger.d(this.classInfo + "当前jid为： " + jid);

		// 在chating中，以如下方式作为key保存聊天窗口
		var key = "one" + jid;
		// 第一步，判断聊天窗口否已经存在
	    if(!config.chating[key]){
	    	// 不存在，进行闪烁
	    	XoW.logger.d(this.classInfo + "不存在与该好友的聊天窗口");
	        // imview.blink(chat.getTo(),chat.getUnReadMessageCount());
	    	// 真正的未读消息包括msg,delaymsg,file，不包括那些chatstate
	    	var msgCount = chat.getUnreadMsgCount() + chat.getUnreadDelayMsgCount() + chat.getUnreadFileCount();
	    	// 好友列表闪烁
	    	this.blinkComeMsg(jid, msgCount);

	    } else {
	    	// 说明存在与该用户的聊天窗口
	    	// 第二步，判断与该用户的聊天窗口是否有chatnow
	    	var isChatNow = false;

	    	var liStr = "ul.layim_chatlist li[data-id='" + jid + "']";
			var li = $(liStr);
			if(li.hasClass('layim_chatnow')) {
				// 是当前聊天窗口
				XoW.logger.d(this.classInfo + "与该好友是当前聊天窗口");
				isChatNow = true;
				// imview.showMessageWhenOpenAndChatnow(chat);
	    	} else {
	    		// 不是当前聊天窗口
	    		XoW.logger.d(this.classInfo + "与该好友不是当前聊天窗口");
	    		isChatNow = false;
	    		// imview.showMessageCountInNotChatnow(chat.getTo(),chat.getUnReadMessageCount());
	    	}
			// 第三步，判断聊天窗口是否被最小化了
			var isMin = false;
			if(li.parents('div.xubox_layer').css('display') == 'none') {
				// 是最小化了
				XoW.logger.d(this.classInfo + "当前窗口状态是最小化");
				isMin = true;
			} else {
				// 不是最小化
				XoW.logger.d(this.classInfo + "当前窗口状态不是最小化");
				isMin = false;
			}


			// 现在该用户的窗口已经存在，有下面四种情况
			// 1,当前，不是最小化：消息弹出去
			// 2,不是当前，不是最小化：在左侧显示消息条数
			// 3,当前，最小化： 暂定，直接弹到最大化，显示消息
			// 4,不是当前，是最小化：暂定，弹到最大化，左侧显示消息条数。
			// 得到该好友
			var friend = this._gblMgr.getUserMgr().getFriendByJid(jid);
			var msgCount = chat.getUnreadMsgCount() + chat.getUnreadDelayMsgCount() + chat.getUnreadFileCount();
			if(isChatNow && !isMin) {
				// 1
				this.popMessageToChatNow(friend, msg);

			} else if(!isChatNow && !isMin) {
				// 2
				this.showMessageCountInChatlist(friend.getJid(), msgCount);
			} else if(isChatNow && isMin) {
				// 3
				// 聊天窗口正常化
				this._chatboxMinToNormal();
				this.popMessageToChatNow(friend, msg);

			} else if(!isChatNow && isMin) {
				// 4
				this._chatboxMinToNormal();
				this.showMessageCountInChatlist(friend.getJid(), msgCount);
			}
	    }

		// 要判断当前自己A，与对方B的聊天窗口的状态
		// 1，如果聊天窗口未打开，调用如下代码：在好友列表中闪烁提示用户有新消息
		// 将会把全部消息放上去

		// 2，如果聊天窗口已打开，则需要判断聊天窗口是不是 当前正在聊天的
		// 窗口，如果是，则直接抛消息上去即可
		// 将会增量放消息，即把未读的消息放上去

		// 3，如果聊天窗口已打开，但不是当前正在聊天的窗口，不能直接自动切换为
		// 当前聊天窗口，应该在聊天面板的左侧聊天列表中显示消息的条数。
		// 将会增量放消息，即把未读的消息放上去

		// 4，如果聊天窗口已打开，但处于最小化状态，这种情况下，又有两种情况
		// 4.1最小化显示的是B的姓名，这个好处理，
		// 4.2最小化显示的是其他好友的姓名，这个呢？怎么办，尤其是当有多个好友
		// 同时发来消息，如果在最小化这个上面显示，就不太好了吧。
		// 现在的考虑是，最小化的也在好友列表中直接进行闪烁，但一个问题是：
		// 当A是点最小化按钮，弹出聊天窗口，而不是点击好友列表弹出聊天窗口
		// 那我还要监听当前是否存在于B的聊天窗口，不仅仅只监听A是否点击了好友
		// 列表中的B
		// 将会增量放消息，即把未读的消息放上去

	    XoW.logger.me(this.classInfo + "_showMessage()");
	},
	*/
        /**
         * chat的allMessage属性改变了
         * @param chat
         */
        /*
	_allMessageChange_cb : function(chat) {
		XoW.logger.ms(this.classInfo + "_allMessageChange_cb()");
		XoW.logger.d("未读消息数：" + chat.getUnReadCount());
		var lastMsg = chat.getLastMessage();
		// 我现在假设，每次都是最后一个消息未读，倒二个消息已读
		XoW.logger.d("该消息是否是XoW.MessageModel ：");
		XoW.logger.d(lastMsg instanceof XoW.MessageModel);
		XoW.logger.d("该消息是否是XoW.FileModel ：");
		XoW.logger.d(lastMsg instanceof XoW.FileModel);

		// 获取未读数消息（包括  chatstate ,msg,delaymsg,文件){ // 存在未读消息
		if(chat.getUnReadCount() != 0 && lastMsg.getContentType() === 'msg'){

			this._showMessage(chat.getTo(), chat, lastMsg);  // 显示消息
		} else { // 未读消息数为0，说明可能是chatstate
			if(lastMsg instanceof XoW.MessageModel) {
				// 如果是状态消息，直接显示
				if(lastMsg.getContentType() == XoW.MessageContentType.ACTIVE) {
					// 关注
					XoW.logger.d(lastMsg.getContentType());
					this._showChatState(chat.getTo(), "对方正在关注与你的聊天窗口");
				} else if(lastMsg.getContentType() == XoW.MessageContentType.GONE) {
					// 关闭
					XoW.logger.d(lastMsg.getContentType());
					this._showChatState(chat.getTo(), "对方已关闭与你的聊天窗口");
				} else if(lastMsg.getContentType() == XoW.MessageContentType.INACTIVE) {
					// 不关注
					XoW.logger.d(lastMsg.getContentType());
					this._showChatState(chat.getTo(), "对方已不关注与你的聊天窗口");
				} else if(lastMsg.getContentType() == XoW.MessageContentType.COMPOSING) {
					// 正在输入
					XoW.logger.d(lastMsg.getContentType());
					this._showChatState(chat.getTo(), "对方正在输入...");
				} else if(lastMsg.getContentType() == XoW.MessageContentType.PAUSED) {
					// 输入停止了
					this._showChatState(chat.getTo(), "对方暂停输入");
				}
			}
		}

		XoW.logger.me(this.classInfo + "_allMessageChange_cb()");
	},

	*/



        /**
         * friends中添加了一个好友
         */
        _addFriendCb: function (params) {
//		 var params = {
//					oldValue : this.friendList,
//					addValue : _friend,
//				 };
            var friend = params.addValue;

            // 监听头像的改变
            friend.addHandlerToUser('face', this._friendFaceChangeCb.bind(this));
            // 监听状态的改变
            friend.addHandlerToUser('state', this._friendStateChangeCb.bind(this));
            // 监听name的改变
            friend.addHandlerToUser('name', this._friendNameChangeCb.bind(this));

            return true;
        },

        /**
         * 新增了一个分组
         * @param params
         */
        _addFriendListCb: function (params) {
//		var params = {
//				oldValue : this._friendGroupList,
//				addValue : _friendGroup,
//		};
            XoW.logger.ms(this.classInfo + "_addFriendListCb");
            var group = params.addValue;
            // 显示该分组
            this.showOneFriendList(params.addValue);

            // 给分组增加监听，监听其addItem，如果该分组增加了好友则触发（这个才是在界面上往好友分组中渲染好友）
            group.addHandlerToUserList('addItem', this._addFriendToFriendListCb.bind(this));

            // 监听移除item，即从界面中移除好友，从该组中移除，而不是所有分组中移除。
            group.addHandlerToUserList('removeItem', this._removeFriendFromFriendListCb.bind(this));

            // 给分组增加监听，如果分组改变了当前在线人数，则触发
            group.addHandlerToUserList('currentNums', this._friendListCurrentNumsChange.bind(this));

            XoW.logger.me(this.classInfo + "_addFriendListCb");

            return true;
        },
        _friendListCurrentNumsChange: function (params) {
//		var params = {
//			friendList : this,
//			oldValue : this.currentNums,
//			newValue : _currentNums,
//		};
            XoW.logger.me(this.classInfo + "_friendListCurrentNumsChange");
            var friendList = params.friendList;
            var cn = params.newValue;
            var tn = friendList.getTotalNums();
            var $em = $('ul.xxim_list li[data-id="' + friendList.listId + '"] h5 em.xxim_nums');
            $em.html('（' + cn + '/' + tn + '）');

            XoW.logger.me(this.classInfo + "_friendListCurrentNumsChange");
            return true;
        },

        /**
         * 将chatbox从最小化到正常窗口状态
         */
        chatboxMinToNormal: function () {
            liStr = "ul.layim_chatlist li.layim_chatnow";
            var li = $(liStr);
            if (li.length > 0) { // 说明存在窗口
                li.parents(".xubox_layer").css("display", "block");
            }
        },

        /**
         * 从分组中移除用户
         */
        _removeFriendFromFriendListCb: function (params) {
//		var params = {
//				removeJid : jid,
//				friendList : this,
//			};
            XoW.logger.ms(this.classInfo + "_removeFriendFromFriendListCb");
            this.removeOneFriend(params);
            XoW.logger.me(this.classInfo + "_removeFriendFromFriendListCb");
            return true;
        },

        /**
         * 往分组中添加好友
         */
        _addFriendToFriendListCb: function (params) {
            XoW.logger.ms(this.classInfo + "_addFriendToFriendListCb");
//		var params = {
//				oldValue : this.item,
//				addValue : _friend,
//		};
            // 列表中显示该好友
            this.showOneFriend(params);


            XoW.logger.me(this.classInfo + "_addFriendToFriendListCb");
            return true;
        },


        friendListHtml: function (friendList) {
            return '<li data-id="' + friendList.getListId() + '" class="xxim_parentnode">' // 组ID
                + '<h5><i></i><span class="xxim_parentname">' + friendList.getName() // 组名
                + '</span><em class="xxim_nums">（'
                + friendList.getCurrentNums() + '/' + friendList.getTotalNums() + '）</em></h5>' // 当前人数和总人数
                + '<ul class="xxim_chatlist"></ul></li>';

        },

        showOneFriendList: function (friendList) {
            XoW.logger.ms(this.classInfo + "showOneFriendList");
            var node = xxim.node;
            var myf = node.list.eq(0); // 第几个面板。 0是好友，1是群组，2是历史联系人
            myf.addClass('loading'); // 显示加载的gif
            //XoW.logger.p({index : index});
            //XoW.logger.d(this.classInfo + "myf是什么" + myf);

            var html = this.friendListHtml(friendList);
//		var html = '<li data-id="'+ friendList.getListId() +'" class="xxim_parentnode">' // 组ID
//	        + '<h5><i></i><span class="xxim_parentname">'+ friendList.getName() // 组名
//	        + '</span><em class="xxim_nums">（'
//	        + friendList.getCurrentNums() + '/' + friendList.getTotalNums() +'）</em></h5>' // 当前人数和总人数
//	        + '<ul class="xxim_chatlist"></ul></li>';
            myf.append(html);
            myf.removeClass('loading');
            this.refleshNode();
            XoW.logger.me(this.classInfo + "showOneFriendList");
            /*
		var i = 0, myflen = datas.length, str = '', item;
		if(myflen > 0) {
			if(index === 0){
				for(; i < myflen; i++){
	                str += '<li data-id="'+ datas[i].getGroupId() +'" class="xxim_parentnode">' // 组ID
	                    + '<h5><i></i><span class="xxim_parentname">'+ datas[i].getName() // 组名
	                    + '</span><em class="xxim_nums">（'
	                    + datas[i].getCurrentNums() + '/' + datas[i].getTotalNums() +'）</em></h5>' // 当前人数和总人数
	                    + '<ul class="xxim_chatlist">';
	                item = datas[i].item;
	                for(var j = 0; j < item.length; j++){
	                	var face = "";
	                	if(null != item[j].getVcard() && "" != item[j].getVcard().PHOTO.BINVAL) {
            				face = "data:image/;base64," + item[j].getVcard().PHOTO.BINVAL;
            			} else {
            				// face = item[j].getFace();
            				face = this.defaultFace;
            			}
	                	var name = item[j].getName();
	                	if(null == name || '' == name) {
	                		name = XoW.utils.getNodeFromJid(item[j].getJid());
	                	}
	                    str += '<li data-id="'+ item[j].getJid() +'" class="xxim_childnode xxim_mytestoffline" type="'+ (index === 0 ? 'one' : 'group')
	                    			+'"><img ondragstart="return false;" name="wtf" src="'+ face +
	                    			'" class="xxim_oneface"></img><i></i>&nbsp;&nbsp;<span class="xxim_onename">'
	                    			+ name +'</span>&nbsp;&nbsp;<span class="xxim_msgnumber" style="color:red; font-size:10px;"></span></li>'; // <span class="xxim_onename">'
	                    			// + item[j].getAsk() + '</span><span class="xxim_onename">'
	                    			// + item[j].getSubscription() + '</span><span class="xxim_onename">'
	                    			// + item[j].getState() + '</span>';
	                    			// $("#img1").attr("src","data:image/;base64,"+myHexData2);
	                }
	                str += '</ul></li>';
	            }
			} else if(1 === index){
				// myf.remove();
				str += '<li class="xxim_liston">'
	                +'<ul class="xxim_chatlist">';


				str += '<li data-id="" class="xxim_childnode" type="group"><span  class="xxim_onename">房间名 | 地址</span><em class="xxim_time">人数</em></li>';
	            for(; i < myflen; i++){
	            	// 房间
	                // str += '<li data-id="'+ datas[i].id +'" class="xxim_childnode" type="group"><img src="'+ datas[i].face +'"  class="xxim_oneface"><span  class="xxim_onename">'+ datas[i].name +'</span><em class="xxim_time">'+ datas[i].time +'</em></li>';
	            	// 房间名 就是name
					// 地址，就是jid前面一段截下来。
					// 人数。
					// id是要用jid
	            	var room = datas[i];
	            	var id = room.jid;
	            	var name = room.getName();
	            	var address = XoW.utils.getNodeFromJid(id);
	                var peopleNumber =  room.getOccupants();
//	            	if(name.length > 9) {
//	            		name = name.substring(0,9) + "...";
//	            	}
//	            	if(id.length > 6) {
//	            		id = id.substring(0,5) + "...";
//	            	}
	                //<i class="' + (room.isUnsecured() === false ? 'xxim_grouplock' : '')+ '"></i>
	                str += '<li data-id="'+ id +'" class="xxim_childnode" type="group"><span  class="xxim_onename" >'+ name + ' | ' + address +'</span><em class="xxim_time">'+ peopleNumber +'</em></li>';
	            }
	            str += '</ul></li>';
			} else {
	            str += '<li class="xxim_liston">'
	                +'<ul class="xxim_chatlist">';
	            for(; i < myflen; i++){
	                str += '<li data-id="'+ datas[i].id +'" class="xxim_childnode" type="one"><img src="'+ datas[i].face +'"  class="xxim_oneface"><span  class="xxim_onename">'+ datas[i].name +'</span><em class="xxim_time">'+ datas[i].time +'</em></li>';
	            }
	            str += '</ul></li>';
	        }
			myf.html(str);
		} else {
			XoW.logger.w(this.classInfo + " 没有任何数据");
	        myf.html('<li class="xxim_errormsg">没有任何数据</li>');
	    }
	    */

        },
        isReflesh: false,
        refleshNode: function () {
            // 这个加载一次即可。
            XoW.logger.ms(this.classInfo + "refleshNode");
            if (!this.isReflesh) {
                XoW.logger.ms(this.classInfo + "refleshNode 进来了");
                this.isReflesh = true;
                xxim.renode();
                xxim.event();
            }
            XoW.logger.me(this.classInfo + "refleshNode");
        },
        /**
         * 显示与你的聊天状态
         * @param jid
         * @param chatstate
         */
        showChatState: function (jid, chatstate) {
            XoW.logger.ms(this.classInfo + "showChatState()");
            XoW.logger.p({jid: jid, chatstate: chatstate});

            if (this.isJidChatNow(jid)) {
                XoW.logger.d("当前是该好友在与你聊天：" + jid);
                $('a.layim_chatstate').text("[" + chatstate + "]");
            }
            XoW.logger.me(this.classInfo + "showChatState()");
        },

        /**
         *  在左侧的当前聊天列表中layim_chatlist显示未读消息条数
         * @param jid
         * @param msgNumber消息数量
         */
        showMessageCountInChatlist: function (from, msgNumber) {
            XoW.logger.ms(this.classInfo + "showMessageCountInChatlist()");

            XoW.logger.d(this.classInfo + "来自 [ " + from + "] 消息条数[ " + msgNumber + " ]");
            liStr = "ul.layim_chatlist li[data-id='" + from + "']";
            var li = $(liStr);
            if (!li.hasClass("layim_chatnow")) {
                if ("" != msgNumber) {
                    if (msgNumber > 99) {
                        msgNumber = "99+";
                    }
                }
                var insertHtml = '<span style="color:red;position: absolute;">' + msgNumber + '</div>';
                li.find('span').eq(1).remove(); // 如果原来有显示未读消息数，将其移除
                li.find('span').eq(0).after(insertHtml); // 插入新的消息未读数
            }

            XoW.logger.ms(this.classInfo + "showMessageCountInChatlist()");

        },
        /**
         * 清除在当前聊天窗口左侧的列表中layim_chatlist的未读消息条数
         *
         */
        clearMessageCountInChatlist: function (from) {
            XoW.logger.ms(this.classInfo + "clearMessageCountInChatlist()");

            liStr = "ul.layim_chatlist li[data-id='" + from + "']";
            var li = $(liStr);
            if (li.hasClass("layim_chatnow")) {
                // var insertHtml='<span style="color:red;position: absolute;">'+ msgNumber +'</div>';
                li.find('span').eq(1).text(""); // 如果原来有显示未读消息数，将其移除
                // li.find('span').eq(0).after(insertHtml); // 插入新的消息未读数
            }

            XoW.logger.ms(this.classInfo + "clearMessageCountInChatlist()");
        },
        /**
         * 闪烁要实现的效果：（参考QQ）
         * 当列表展开时，则好友闪烁
         * 当列表没有展开是，则好友分组闪烁
         * 当一个好友在多个分组都存在时，多个分组都按照上面的做法。
         */
        blinkComeMsg: function (from, msgNumber) {
            XoW.logger.ms(this.classInfo + "blinkComeMsg()");

            // 如果好友不在userMgr中，说明可能是个来自非好友的聊天
            var friend = this._gblMgr.getUserMgr().getFriendByJid(from);
            if (null == friend) {
                XoW.logger.w(this.classInfo + "不存在该好友");
                return;
            }
            // 得到该好友在好友列表中的句柄
            liStr = "ul.xxim_chatlist li[data-id='" + friend.getJid() + "']";
            var li = $(liStr);

            // 修改显示的条数
            if (msgNumber > 99) {
                // 如果条数大于99条，显示99+
                msgNumber = "99+";
            }
            li.find(".xxim_msgnumber").text(msgNumber);

            // 判断是否闪烁，我是在好友属性中有个blinkInterval属性来判断该好友是否闪烁，，
            // 感觉与业务无关的属性。。纯粹是为了闪烁而有的。
            if ("" == friend.getBlinkInterval()) {
                // 没有闪烁，则创建interval
                var intSon = setInterval(function () {
                    // 因为openfire的特点，一个用户可能在多个分组中,所以通过一个id可能找到多个组，要遍历每个组
                    li.parent().parent().each(function (index, element) {
                        // 如果其父元素有xxim_liston表示该分组列表是展开的。
                        if (!$(element).hasClass("xxim_liston")) {
                            // 如果分组没有展开，则闪烁其父（闪烁分组）
                            // $(element).find('h5').stop(true,true).fadeOut(100).fadeIn(100);
                        } else {
                            // 如果分组是展开的，则闪烁它自己（该好友）
                            $(element).find('ul.xxim_chatlist li[data-id="' + from + '"]').stop(true, true).fadeOut(100).fadeIn(100);
                        }
                    });
                }, 600);
                // 设置闪烁属性
                friend.setBlinkInterval(intSon);

                // 判断其父是否在闪烁
                li.parent().parent().each(function (index, element) {
                    var oneFriendGroup = this._gblMgr.getUserMgr().getFriendListByListId($(element).attr("data-id"));
                    if ("" != oneFriendGroup.getBlinkInterval()) {
                        // 已经有闪烁，无需处理
                    } else if ("" == oneFriendGroup.getBlinkInterval()) {
                        // 没有闪烁
                        var intFather = setInterval(function () {
                            // 因为openfire的特点，一个用户可能在多个分组中,所以通过一个id可能找到多个组，要遍历每个组
                            li.parent().parent().each(function (index, element) {
                                // imconn.mylog("找到了父元素 : " + $(element).attr("data-id"));
                                // $(element).stop();
                                if (!$(element).hasClass("xxim_liston")) {
                                    $(element).find('h5').stop(true, true).fadeOut(100).fadeIn(100);
                                } else {
                                    //$(element).find('ul.xxim_chatlist li[data-id="' + from + '"]').stop(true,true).fadeOut(100).fadeIn(100);
                                }
                            });
                        }, 600);
                        oneFriendGroup.setBlinkInterval(intFather);
                    }
                }.bind(this));
            } else if ("" != friend.getBlinkInterval()) {
                // 如果原来就在闪烁。则什么也不做
            }

            XoW.logger.me(this.classInfo + "blinkComeMsg()");
        },
        /**
         * 当前窗口不存在。
         */
        popchatAction: function (jid) {


            var roomServerDomain = XoW.utils.getDomainFromJid(this._gblMgr.getRoomMgr().getRoomServerJid());
            var jidDomain = XoW.utils.getDomainFromJid(jid);

            var orgServerDomain = this._gblMgr.getOrgnizationMgr().getOrgDomain();

            if (null != roomServerDomain && roomServerDomain == jidDomain) {
                // 是会议室的个人消息。不处理
            } else if (null != orgServerDomain && orgServerDomain == jidDomain) {
                // 是群组中个人消息，不处理

            } else {
                // 1,清除好友列表上闪烁
                // 2,清除好友列表上消息数量
                // 3,清空所有消息
                // 因为popchatAction在popchat执行完后调用
                // tabchatAction在tabchat后调用
                // 但从上面的日志可以看出，在popchat中调用了tabchat，并且tabchat先结束
                // 说明tabchatAction会在popchatAction前被调用，到时加载上去的信息重复了。
                // 所以需要先清空所有消息
                // 5,(要放在最后)需要在弹出该好友窗口后，将所有消息（后面可能设置为50条,这样聊天记录才有用。。。）加载上去
                // 刚打开的窗口是没有任何历史消息的。
                // 4,判断

                XoW.logger.ms(this.classInfo + "popchatAction()");
                jid = XoW.utils.getBareJidFromJid(jid);
                // 1,2
                this.clearBlinkComeMsg(jid);
                // 3，
                // 获得清空消息的句柄
//			var ulid = "layim_areaone" + XoW.utils.getNodeFromJid(jid);
//			$('div.layim_chatarea ul[id="' + ulid + '"]').text("");
                var $layimChatarea = this.getLayimChatarea('one', jid);
                $layimChatarea.text('');

                // 4, 判断是否有br，没有就加一个 <br id="br0"/> 如果有，也不判断其是否有id，不归这里判断
                // 先让输入框被关注了。。
                this.setCursorPropertiesWithDelay();
                var $write = $('#layim_write');
                if (0 == $write.find('br').length) {
                    $write.append('<br id="br0" >');
                }

                // 5
                var chat = this._gblMgr.getChatMgr().getChatByJid(jid);
                var friend = this._gblMgr.getUserMgr().getFriendByJid(jid);
                // chat还未创建时，打开与好友的聊天窗口，就会出错
                if (null == chat || null == friend) {
                    XoW.logger.w(this.classInfo + '还未存在chat');
                    return;
                }
                var allMsg = chat.getAllMessage();
                for (var i = 0; i < allMsg.length; i++) {
                    this.popMessageToChatNow(friend, this._gblMgr.getCurrentUser(), allMsg[i]);
                }
            }

            XoW.logger.me(this.classInfo + "popchatAction()");
        },


        setHistoryWindow: function (jid) {
            var $liHistory = $('div.layim_chatbox div.layim_messagehistorydiv ul li[data-id="' + jid + '"]');
            if ($liHistory.length > 0) {
                $liHistory.parents('div.layim_messagehistorydiv').css('display', 'block');
                $liHistory.css('display', 'block');
                $liHistory.siblings().css('display', 'none');
            } else {
                // alert($('div.layim_chatbox div.layim_messagehistorydiv').length);
                $('div.layim_chatbox div.layim_messagehistorydiv').css('display', 'none');
            }
        },

        /**
         * 切换窗口时出现。。
         * @param jid
         */
        tabchatAction: function (jid) {
            // 1，清除左侧tab上的消息数量
            // 2,由于是切换窗口，而没有关闭窗口，所以窗口上的消息还在，所以只需加载未读消息。

            XoW.logger.ms(this.classInfo + "tabchatAction()");

            // 3,如果有打开聊天记录面板
            this.setHistoryWindow(jid);

            // 1,
            this.clearMessageCountInChatlist(jid);
            // 2，
            var chat = this._gblMgr.getChatMgr().getChatByJid(jid);
            var friend = this._gblMgr.getUserMgr().getFriendByJid(jid);
            // chat还未创建时，打开与好友的聊天窗口，就会出错
            if (null == chat || null == friend) {
                return;
            }
            var allMsg = chat.getAllMessage();
            for (var i = 0; i < allMsg.length; i++) {
                // 只显示所有未读的消息
                if (!allMsg[i].isRead) {
                    this.popMessageToChatNow(friend, this._gblMgr.getCurrentUser(), allMsg[i]);
                }
            }


            XoW.logger.me(this.classInfo + "tabchatAction()");
        },


        /**
         * 清除闪烁
         * @param from
         */
        clearBlinkComeMsg: function (from) {
            XoW.logger.ms(this.classInfo + "clearBlinkComeMsg()");

            XoW.logger.d(this.classInfo + "消除该好友的闪烁 " + from);
            liStr = "ul.xxim_chatlist li[data-id='" + from + "']";
            var li = $(liStr);

            // 清除好友的消息条数
            li.find(".xxim_msgnumber").text("");

            // 这些是业务的东西，应不应该放在这里做呢？
            // 清除该子元素的interval
            clearInterval(this._gblMgr.getUserMgr().getFriendByJid(from).getBlinkInterval());
            this._gblMgr.getUserMgr().getFriendByJid(from).setBlinkInterval("");
            // 清除该子元素所在分组的clearInterval
            this._gblMgr.getUserMgr().crearFriendListBlinkInterval(from);
//		li.parent().parent().each(function(index,element) {
//			// 判断这个父元素下还有没有其他子元素在闪烁，如果有，则该父元素的闪烁不能停止，如果没有，则停止
//			var friendGroup= this._gblMgr.getUserMgr().getFriendGroupByGroupId($(element).attr("data-id"));
//			var stopFlag = true;
//			// 如果子元素中还有在闪烁的，则不能停止
//			for(var i = 0; i < friendGroup.item.length; i++) {
//				var friend = friendGroup.item[i];
//				if("" != friend.getBlinkInterval()) {
//					stopFlag = false;
//				}
//			}
//			if(stopFlag) {
//				clearInterval(friendGroup.getBlinkInterval());
//				friendGroup.setBlinkInterval("");
//			}
//		});
            XoW.logger.me(this.classInfo + "clearBlinkComeMsg()");

        },

        removeOneFriend: function (params) {
//		var params = {
//				removeJid : jid,
//				friendList : this,
//			};

            XoW.logger.ms(this.classInfo + "removeOneFriend");

            var node = xxim.node;
            var myf = node.list.eq(0); // 第几个面板。 0是好友，1是群组，2是历史联系人
            myf.addClass('loading'); // 显示加载的gif

            var friendList = params.friendList;
            var removeJid = params.removeJid;
            var $list = $('ul.xxim_list li[data-id="' + friendList.listId + '"]');

            var tn = friendList.getTotalNums();
            var cn = friendList.getCurrentNums();
            // 更新人数
            $('h5 em.xxim_nums', $list).html('（' + cn + '/' + tn + '）');
            // 显示好友
            $('ul.xxim_chatlist li[data-id="' + removeJid + '"]', $list).remove();

            myf.removeClass('loading');

            this.refleshNode();
            XoW.logger.me(this.classInfo + "removeOneFriend");
        },

        strangeHtml: function (name, jid) {
            return '<li disabled data-id="' + jid + '" class="xxim_childnode xxim_mytestoffline" type="stranger">'
                + '<img ondragstart="return false;" name="wtf" src="' + this.defaultFace +
                '" class="xxim_oneface"></img><i></i>&nbsp;&nbsp;<span class="xxim_onename">'
                + name + '</span>&nbsp;&nbsp;<span class="xxim_msgnumber" style="color:red; font-size:10px;"></span></li>'; // <span class="xxim_onename">'
        },


        friendHtml: function (friend) {
            var jid = friend.jid;
            var face = this.getUserFace(friend);

            // 可能没有name，如果没有就用 jid的node来代替
            var name = friend.getName();
            if (null == name || '' == name) {
                name = XoW.utils.getNodeFromJid(jid);
            }
            var stateClass = '';
            switch (friend.state) {
                case 1 :
                    stateClass = 'xxim_mytestonline';
                    break;
                case 2 :
                    stateClass = 'xxim_mytestchat';
                    break;
                case 3 :
                    stateClass = 'xxim_mytestdnd';
                    break;
                case 4 :
                    stateClass = 'xxim_mytestaway';
                    break;
                case 5 :
                default :
                    stateClass = 'xxim_mytestoffline';
                    break;
            }

            var html = '<li data-id="' + jid + '" class="xxim_childnode ' + stateClass + '" type="one">'
                + '<img ondragstart="return false;" name="wtf" src="' + face +
                '" class="xxim_oneface"></img><i></i>&nbsp;&nbsp;<span class="xxim_onename">'
                + name + '</span>&nbsp;&nbsp;<span class="xxim_msgnumber" style="color:red; font-size:10px;"></span></li>'; // <span class="xxim_onename">'
            return html;
        },

        showOneFriend: function (params) {
            XoW.logger.ms(this.classInfo + "showOneFriend");

            var node = xxim.node;
            var myf = node.list.eq(0); // 第几个面板。 0是好友，1是群组，2是历史联系人
            myf.addClass('loading'); // 显示加载的gif

//		var params = {
//				friendList : this,
//				oldValue : this.item,
//				addValue : _friend,
//			};
            var friendList = params.friendList;
            var friend = params.addValue;
            var $list = $('ul.xxim_list li[data-id="' + friendList.listId + '"]');

            var tn = friendList.getTotalNums();
            var cn = friendList.getCurrentNums();

            $('h5 em.xxim_nums', $list).html('（' + cn + '/' + tn + '）');
//		var jid = friend.jid;
//		var face = friend.face;
//    	if(face) {
//    		XoW.logger.d(this.classInfo + "该用户有头像" + jid);
//			face = "data:image/;base64," + face;
//		} else {
//			XoW.logger.d(this.classInfo + "该用户无头像" + jid);
//			face = this.defaultFace;
//		}
//    	// 可能没有name，如果没有就用 jid的node来代替
//    	var name = friend.getName();
//    	if(null == name || '' == name) {
//    		name = XoW.utils.getNodeFromJid(jid);
//    	}
//        var html = '<li data-id="'+ jid +'" class="xxim_childnode xxim_mytestoffline" type="one"'
//			+'"><img ondragstart="return false;" name="wtf" src="'+ face +
//			'" class="xxim_oneface"></img><i></i>&nbsp;&nbsp;<span class="xxim_onename">'
//			+ name +'</span>&nbsp;&nbsp;<span class="xxim_msgnumber" style="color:red; font-size:10px;"></span></li>'; // <span class="xxim_onename">'

            var html = this.friendHtml(friend);
            $('ul.xxim_chatlist', $list).append(html);
            myf.removeClass('loading');

            this.refleshNode();
            XoW.logger.me(this.classInfo + "showOneFriend");
        },


        /**
         * 绑定到每一个friend上，当这个friend的备注名发生改变时界面相应变化
         */
        _friendNameChangeCb: function (params) {
//		var params = {
//		oldValue : this._name,
//		newValue : _name,
//		user : this,
//};
            XoW.logger.ms(this.classInfo + "_friendNameChangeCb()");
            var newName = params.newValue;
            var user = params.user;
            var jid = user.jid;
            XoW.logger.d(this.classInfo + "name改变的好友为" + jid + "，新name是" + newName);

            // 刷新状态
            var $li = $("ul.xxim_chatlist li[data-id='" + jid + "']");
            $li.find('span.xxim_onename').text(newName);

            XoW.logger.me(this.classInfo + "_friendNameChangeCb()");
            return true;

        },

        /**
         * 绑定到每一个friend上，当这个friend的状态发生改变时界面相应变化
         */
        _friendStateChangeCb: function (params) {
//		var params = {
//				friend : this,
//				oldValue : this.state,
//				newValue : _state,
//			};
            XoW.logger.ms(this.classInfo + "_friendStateChangeCb()");

            var friend = params.friend;
            var jid = friend.jid;
            XoW.logger.d(this.classInfo + "state改变的好友为" + jid + "，新状态是" + friend.getState());

            // 刷新状态
            liStr = "ul.xxim_chatlist li[data-id='" + jid + "']";
            var li = $(liStr);

//		li.removeClass('xxim_mytestonline');
//		li.removeClass('xxim_mytestchat');
//		li.removeClass('xxim_mytestdnd');
//		li.removeClass('xxim_mytestaway');
//		li.removeClass('xxim_mytestoffline');
            li.removeClass().addClass('xxim_childnode');

            if (XoW.UserStateEnum.ONLINE == friend.getState()) {
                li.addClass('xxim_mytestonline');
            } else if (XoW.UserStateEnum.OFFLINE == friend.getState()) {
                li.addClass('xxim_mytestoffline');
            } else if (XoW.UserStateEnum.AWAY == friend.getState()) {
                li.addClass('xxim_mytestaway');
            } else if (XoW.UserStateEnum.DND == friend.getState()) {
                li.addClass('xxim_mytestdnd');
            } else if (XoW.UserStateEnum.CHAT == friend.getState()) {
                li.addClass('xxim_mytestchat');
            }

            XoW.logger.me(this.classInfo + "_friendStateChangeCb()");
            return true;
        },

        /**
         * 这个绑定到每一个friend上，当这个friend的face发生改变时
         * 界面需要做相应的变化
         */
        _friendFaceChangeCb: function (params) {
//		var params = {
//		friend : this,
//				oldValue : this.face,
//				newValue : _face,
//		};
            var friend = params.friend;
            var jid = friend.jid;
            XoW.logger.ms(this.classInfo + "_friendFaceChangeCb()");
            XoW.logger.d(this.classInfo + "face改变的好友为" + jid);

            // vcard更新了，两种情况
            // 1，因为该用户的头像更新了，该用户的客户端发来了一个Pres节，然后我主动请求该用户的vcard
            // 像vcard中其它的信息的改变是不会引起发送一个pres节的。
            // 2，我在查看该用户的vcard的时候，主动点击“刷新”按钮
            // 暂时我默认是第一种情况，第二种情况做到再说

            // var fri = this._gblMgr.getUserMgr().getFriendByJid(jid); // 得到该好友
            // 刷新头像

            // 如果vcard中有头像，那么就使用vcard中的头像。如果没有，就使用默认的头像
            var face = friend.face;
            if (face) {
                face = "data:image/;base64," + face;
            } else {
                face = this.defaultFace;
            }

            // 这个是好友列表中的头像
            var liStr = "ul.xxim_chatlist li[data-id='" + jid + "']";
            var li = $(liStr);
            var img = li.find("img");
            // 判断是否存在头像这个标签，因为刚登陆进来，可能界面上还没有显示好友列表
            if (img.length != 0) { // img.length!=0表示是有img的
                XoW.logger.d(this.classInfo + "更新了好友列表中的头像");
                if (img.attr('src') != face) {
                    img.attr("src", face);
                }
            }

            // 这个是聊天面板中的头像,如果包含这个好友的聊天 ，就改变它的头像
            // chating是当前所有在聊天的好友的集合，以 'one' + jid 作为key，这个key对应的就是
            // 那个好友的一些信息
            var key = 'one' + jid;
            if (config.chating[key]) {
                // 更新好友头像，只是更新内存中的，界面上还没变
                XoW.logger.d(this.classInfo + "更新了内存中的头像");
                config.chating[key].face = face;
                // 如果这个好友还是当前聊天的好友，那么还要改当前显示的头像，
                // 通过是否layim_chatnow这个class有判断该好友是否是当前正在聊天好友

                var liStr = "ul.layim_chatlist li[data-id='" + jid + "']";
                var li = $(liStr);
                if (li.hasClass('layim_chatnow')) {
                    XoW.logger.d(this.classInfo + "更新了聊天窗口中的头像");
                    xxim.chatbox.find('.layim_face>img').attr('src', face);
                }
            }
            XoW.logger.me(this.classInfo + "_friendFaceChangeCb()");
            return true;
        },

        /**
         * 给定jid，判断该jid所对应的聊天窗口是不是最小化了
         * 如果是 room/group 就给纯jid
         * 如果是 roomprivate/groupprivate 就给 room@domain/username
         * 如果是 one 就给 纯jid
         */
        isJidChatMinimize: function (jid) {
            jid = XoW.utils.escapeJquery(jid);
            var liStr = "li[data-id='" + jid + "']";
            var $li = $(liStr);
            if ($li.length == 0) {
                return false;
            }
            if ($li.parents('div.xubox_layer').css('display') == 'none') {
                // 是最小化了
                XoW.logger.d(this.classInfo + "当前窗口状态是最小化");
                // isMin = true;
                return true;
            } else {
                // 不是最小化
                XoW.logger.d(this.classInfo + "当前窗口状态不是最小化");
                // isMin = false;
                return false;
            }
        },
        /**
         * 给定jid，判断该jid是否当前正在聊天
         * @param jid
         */
        isJidChatNow: function (jid) {
            XoW.logger.ms(this.classInfo + "_isJidChatNow()");

            var pureJid = jid;//XoW.utils.getBareJidFromJid(jid);
            if (!pureJid) {
                return false;
            }
            if (this.getChatnowJid() == pureJid) {
                XoW.logger.d("传入jid是当前与你聊天的好友 ： " + pureJid);
                return true;
            } else {
                XoW.logger.d("传入jid不是当前与你聊天的好友是： " + jid + ", 当前聊天" + this.getChatnowJid());
                return false;
            }

//		var li = $('ul.layim_chatlist li.layim_chatnow'); // 当前正在聊天的窗口
//		if(li.attr("data-id") == pureJid) {
//			// 如果当前聊天的jid和传进来的Jid一样就是该人在聊天
//			return true;
//		} else {
//			XoW.logger.d("当前与你聊天的好友是 ： " + li.attr("data-id"));
//			return false;
//		}
//
            XoW.logger.me(this.classInfo + "_isJidChatNow()");
        },

        /**
         * 得到当前正在聊天的类型，可能是两人聊天，可能是群聊
         */
        getChatnowType: function () {
            var $li = $("ul.layim_chatlist li.layim_chatnow");
            // li = $(liStr);
            return $li.attr('type');
        },

        /**
         * 得到当前状态
         */
        getNowState: function () {
            var $li = $('#xxim_online');
            if ($li.hasClass('xxim_dnd')) {
                return 'dnd';
            } else if ($li.hasClass('xxim_offline')) {
                return 'offline';
            } else if ($li.hasClass('xxim_chat')) {
                return 'chat';
            } else if ($li.hasClass('xxim_away')) {
                return 'away';
            } else {
                return 'online';
            }
        },
        /**
         * chatnow即使在聊天窗口最小化后也存在
         * 得到当前正在聊天的jid。可能是群组的jid，可能是好友的jid
         */
        getChatnowJid: function () {
            var liStr = "ul.layim_chatlist li.layim_chatnow";
            li = $(liStr);
            if (li.length > 0) {
                return li.attr('data-id');
            }
            return null;
        },

        getLayimChatarea: function (type, jid) {
            // type=one/group
            var id = "#layim_area" + type + XoW.utils.escapeJquery(jid);
            if ($(id).length == 1) {
                return $(id);
            }
            return null;
        },
        getLayimChatmore: function (type, jid) {
            var id = "#layim_user" + type + XoW.utils.escapeJquery(jid);
            if ($(id).length == 1) {
                return $(id);
            }
            return null;
        },

        // 根据jid区分类型
        judgeTypeByJid: function (jid) {
            // one
            // room
            // roomprivate
            // group
            // groupprivate
            var domain = XoW.utils.getDomainFromJid(jid);
            var res = XoW.utils.getResourceFromJid(jid);
            if (!domain) {
                return null;
            }
            if (domain == this._gblMgr.getServerMgr().getServerDomain()) {
                return "one";
            } else if (domain == this._gblMgr.getRoomMgr().getRoomDomain()) {
                if (res) {
                    return "roomprivate";
                } else {
                    return "room";
                }
            } else if (domain == this._gblMgr.getOrgnizationMgr().getOrgDomain()) {
                if (res) {
                    return "groupprivate";
                } else {
                    return "group";
                }
            } else {
                return null;
            }
//		serverDomain
        },

        /**
         * 音频文件
         */
        _audio: {
            MSG: '5733.mp3', // 消息音乐
            BACKGROUND: 'cgb.mp3' // 背景音乐，没有的
        },
        /**
         * 演奏音乐
         * @param audio
         */
        _playAudio: function (audio) {
            $('#mediaPlayerEmbed').attr('src', "audio/" + audio);
        },

        /**
         * 发送图片
         * @param filename 文件名
         * @param filesize 文件大小
         * @param filetype 类型
         * @param data 数据
         */
        sendImg: function (filename, filesize, filetype, data) {
            XoW.logger.ms(this.classInfo + "sendImg()");
            var chatnowJid = this.getChatnowJid();
            if (null == chatnowJid) {
                XoW.logger.w(this.classInfo + "sendImg() 无效jid");
                return;
            }
            if (!XoW.utils.isImageMIME(filetype)) {
                XoW.logger.w(this.classInfo + "sendImg() 非图片类型");
                alert("请选择图片！");
                return;
            }
            this.sendFile(filename, filesize, filetype, data, chatnowJid);
            XoW.logger.me(this.classInfo + "sendImg()");
        },
        /**
         * 发送文件
         * @param filename 文件名
         * @param filesize 文件大小
         * @param filetype 文件类型
         * @param data 数据
         * @param chatnowJid 当前聊天好友的jid
         */
        sendFile: function (filename, filesize, filetype, data, chatnowJid) {
            XoW.logger.ms(this.classInfo + "sendFile()");
            if (null == chatnowJid) {
                chatnowJid = this.getChatnowJid();
                if (null == chatnowJid) {
                    XoW.logger.w(this.classInfo + "sendFile() 无效jid");
                    return;
                }
            }
            this._gblMgr.getChatMgr().sendFileByIBB(filename, filesize, filetype, data, chatnowJid, function (err) {

            });

            XoW.logger.me(this.classInfo + "sendFile()");
        },
        /**
         * 界面对文件的处理，接收文件的处理。
         *
         * @param file 当前触发回调的文件
         * @param type 当文件是自己发送时，type为me
         */
        /*
	_ibbFile_cb : function(file, type) {

		XoW.logger.ms(this.classInfo + "_ibbFile_cb()");
		XoW.logger.w("type是" + type + " sid是" + file.getSid() + ", state" + file.getReceiveState() +
				"  文件size " + file.getSize() + "   文件数据长度" + Math.ceil(file.getData().length / 4) * 3);

		var $file = $('div.layim_file[sid="' + file.getSid() + '"]');
		var $fileState = $file.find('.layim_fileReceiveState');
//		XoW.FileReceiveState = {
//		/UNRECEIVE 	: "unreceive", 	// 未接受  before open
//		/RECEIVE	 	: "receive", 	// 已接受 after close
//		/DENYRECEIVE : "denyReceive",// 已拒绝接受
//		/OPEN 		: "open", 		// 同意接收，但是还未正式开始接收数据
//		/RECEIVING 	: "receiving", 	// 接收中 data
//		MESTOP 		: "meStop", 	// 自己终止接收文件
//		NOMESTOP    : "noMeStop", 	// 不是自己终止接收文件
//	};

		var open = '<a href="javascript:void(0);" style="color:red" id="fileStopReceive">取消</a>';
		var error = this.fileStateWord.fileError;
		var receive, receiving, unreceive, denyreceive, mestop, nomestop;
		if('me' === type) {
			// 我发送给对方的
			receive = this.fileStateWord.noMeReceiveFile;
			receiving = '<span class="">已发送' + this.fileReceivePercent(file) + "%" + '</span>';
			unreceive = '<a href="javascript:void(0);" style="color:red" id="fileStopReceive">取消</a>&nbsp;&nbsp;等待对方接收文件...';
			denyreceive = this.fileStateWord.noMeDenyReceiveFile;
			mestop = this.fileStateWord.meStopSendFile;
			nomestop = this.fileStateWord.noMeStopReceiveFile;
		} else {
			// 对方发送给我的
			receiving = '<span class="">已接收' + this.fileReceivePercent(file) + "%" + '</span>';
			receive = this.fileStateWord.meReceiveFile;
			unreceive = '<a href="javascript:void(0);" value="receive" style="color:blue">接收该文件</a>'
						+ '&nbsp;&nbsp;'
						+ '<a href="javascript:void(0);" value="denyreceive" style="color:blue">拒绝接收该文件</a>';
			denyreceive = this.fileStateWord.meStopReceiveFile;
			mestop = this.fileStateWord.meStopReceiveFile;
			nomestop = this.fileStateWord.noMeStopSendFile;
		}

		if(XoW.FileReceiveState.NOMESTOP == file.getReceiveState()) {
			$fileState.html(nomestop);
		} else if(XoW.FileReceiveState.ERROR == file.getReceiveState()) {
			$fileState.html(error);
		} else if(XoW.FileReceiveState.MESTOP == file.getReceiveState()) {
			$fileState.html(mestop);
		} else if(XoW.FileReceiveState.OPEN == file.getReceiveState()) {
			$fileState.html(open);
		} else if(XoW.FileReceiveState.UNRECEIVE == file.getReceiveState()) {

		} else if(XoW.FileReceiveState.DENYRECEIVE == file.getReceiveState()) {
			$fileState.html(denyreceive);
		} else if(XoW.FileReceiveState.RECEIVING == file.getReceiveState()) {
			XoW.logger.d(this.classInfo + "接受中");
			//var pid = "progressbar" + $file.attr("sid");
			// var value = this.progressbarChange(file);
			if($fileState.find('#fileStopReceive').length > 0) {
				// 如果已经有了 终止 接收了，那么则不用添加open，
				// 在判断是否
				$(receiving).insertAfter($fileState.find('#fileStopReceive'));
				if($fileState.find('span').length > 1) {
					// 如果超过一个，就把第二个给移除掉
					$fileState.find('span').last().remove();
				}
			} else {
				// 如果没有中断接受，那么就重新渲染中断和下载百分比
				$fileState.html(open + receiving);
			}
			// 接受过程中应该要加一个中断接受

		} else if(XoW.FileReceiveState.RECEIVE == file.getReceiveState()) {
			// 后面要变成打开该文件？但是js好像无法获取该下载的文件的路径吧。。
			// $fileState.html('<span class="">已接收该文件</span>');
			// receiveStateHtml = receive;
			$fileState.html(receive);
			if('me' !== type) {
				// 如果是对方发送给我的
				if(XoW.utils.isImageMIME(file.mime)) {
		    		// 如果是图片，则直接显示
		    		var $img = $file.find('.layim_fileinfo img');
		    		// 如果图片有错误，则显示默认图片
		    		$img.bind('error',function() {
		    			var $this = $(this);
		    			$this.attr('src', 'images/imagedamage.png');
		    			$this.parent().parent().find('.layim_fileReceiveState').html('<div class="">已接收该图片，但该图片有错误！</div>');
		    			return true; // 返回true表示已处理，浏览器就会认为没有异常了
		    		});
		    		$img.attr('src', "data:image/png;base64," + file.getData());

		    	} else {
		    		// 否则，弹出下载框
//		    		if(null == file.getMime()) {
//		    			file.
//		    		}
		    		download("data:" + file.getMime() + ";base64,"+file.getData(), file.getFilename(), file.getMime());
		    	}
			}
		}

		XoW.logger.me(this.classInfo + "_ibbFile_cb()");
	},

	*/
        roomTabchatAction: function (jid) {

            // 清空聊天信息数
            this.clearMessageCountInChatlist(jid);

            // 3,如果有打开聊天记录面板
            this.setHistoryWindow(jid);
//		var $liHistory = $('div.layim_chatbox div.layim_messagehistorydiv ul li[data-id="' + jid + '"]');
//		if($liHistory.length > 0) {
//			$liHistory.parents('div.layim_messagehistorydiv').css('display', 'block');
//			$liHistory.css('display', 'block');
//			$liHistory.siblings().css('display', 'none');
//		} else {
//			// alert($('div.layim_chatbox div.layim_messagehistorydiv').length);
//			$('div.layim_chatbox div.layim_messagehistorydiv').css('display', 'none');
//		}


        },

        /**
         * 群聊，只有界面上没有这个窗口，点击后才会弹出。popchat。
         * @param jid 群组的jid
         */
        roomPopchatAction: function (jid) {
            XoW.logger.ms(this.classInfo + "roomPopchatAction()");
            // 会去再请求一下这个群的资料，就是怕这个群有变动，
            // 但如果，用户点了一个会议室后，很久才点击加入，会怎么样？
            // 是弹出群窗口的时候去请求群信息，还是等用户真正点击了，我要进入该群，才请求
            // spark做法：spark没有查看的那一个步骤。点击之后直接进入了聊天室。
            // 那么，暂时不考虑这些。  用户过很久了才点击进入这个房间，
            // 就有2个地方，第一个是弹出窗口的时候，是否需要请求群的资料
            // 第二个是，点击加入的时候，是否需要请求群的资料
            // 因为这两个地方，在做上面两个操作的时候，群可能有变动。
            // 3.24补充，由于弹出会议室窗口，可能是自己新建了这个房间，所以这里一定要从服务器上取一下。。
            // 还是说，，新建一个房间，如果本地有，就从本地拿，本地没有，就去服务器拿。。。感觉妥妥的。
            XoW.logger.w("roomPopchatAction() jid是" + jid);
            // var room = this._gblMgr.getRoomMgr().getRoomByJid(jid);

            this._gblMgr.getRoomMgr().getRoomByJidFromLocalOrServer(jid, function (params) {
                // 存在这个group
                XoW.logger.d("roomPopchatAction() 存在这个room");
                var room = params.room;

                // 当前用户是否已经在该房间中了
                var isCurrentUserAlreadyInRoom = this._gblMgr.getRoomMgr().isCurrentUserAlreadyInRoom(jid);

                // liStr = "ul.xxim_chatlist li[data-id='" + jid + "']";
                // var li = $(liStr);
                // var type = li.attr("type");
                // var keys = type + XoW.utils.getNodeFromJid(jid);

                // 只有窗口弹出时才能获得
                // var imarea = xxim.chatbox.find('#layim_area'+ keys);//定位聊天窗口
                var $imarea = this.getLayimChatarea('group', jid);

                // XoW.logger.w('id是  ' + imarea.attr('id'));
                // 这里不打印一下，那个房间信息出不来。
                // console.log(imarea.attr('id'));

                // var layimli = document.getElementById("layim_user"+keys); //获取聊天窗口句柄
                // 配置
                // var config = room.parseConfig();
                // baseInfo, xInfo, roomInfo

                var html = this.roomInfoHtml(room, isCurrentUserAlreadyInRoom);

                // 消息放到界面上
                $imarea.append(html);
                // imarea.scrollTop(imarea[0].scrollHeight);
            }.bind(this), function (errorStanza) {

                layer.msg("获取room信息失败");
                XoW.logger.e("roomPopchatAction() 不存在这个room，错误" + $('error', $(errorStanza)).attr('code'));

            });

//		if(null != room) {
//
//		} else {
//			XoW.logger.e("roomPopchatAction() 不存在这个room");
//		}
            XoW.logger.me(this.classInfo + "roomPopchatAction()");
        },

        roomInfoHtml: function (room, isInRoom) {
            var inRoomHtml = '';
            if (!isInRoom) {
                inRoomHtml = '<div id="layim_joinRoom" class="layim_sendbtn">加入该房间</div>';
            }

            var html = '<li class=""><br><br>'
                + '<div class="layim_chatsay" id="' + room.jid + '">房间信息如下：' + inRoomHtml
                + '<br>房间地址:' + room.jid
                + '<br>房间名称:' + room.name
                + '<br>房间描述:' + room.getDescription()
                + '<br>房间主题:' + room.getSubject()
                + '<br>房间当前人数:' + room.getOccupants()
                + '<br>房间创建日期:' + XoW.utils.getFromatDatetime(room.getCreationdate())
                + '<br>房间类型信息：'
                + (function () {
                    if (room.isPublic()) {
                        return '公开的，';
                    } else {
                        return '隐藏的，';
                    }
                })()
                + (function () {
                    if (room.isOpen()) {
                        return '开放的，';
                    } else {
                        return '仅会员的，';
                    }
                })()
                + (function () {
                    if (room.isUnmoderated()) {
                        return '非主持的，';
                    } else {
                        return '被主持的，';
                    }
                })()
                + (function () {
                    if (room.isNonanonymous()) {
                        return '非匿名，';
                    } else {
                        return '半匿名，';
                    }
                })()
                + (function () {
                    if (room.isUnsecured()) {
                        return '无需密码，';
                    } else {
                        return '需要密码的，';
                    }
                })()
                + (function () {
                    if (room.isPersistent()) {
                        return '持久的';
                    } else {
                        return '短暂的';
                    }
                })()
                + '<em class="layim_zero"></em>'
                + '</div>'
                + '</li>';
            return html;
        },

        /**
         * 得到头像
         * @param user 需要得到头像的用户
         * @returns
         */
        getUserFace: function (user) {
            if (null == user) {
                return null;
            }
            if (null != user.getFace() && "" != user.getFace()) {
                face = "data:image/;base64," + user.getFace();
            } else {
                face = this.defaultFace; // 默认头像
            }
            return face;
        },
        getUserFaceFromFaceData: function (face) {
            if (null != face && "" != face) {
                face = "data:image/;base64," + face;
            } else {
                face = this.defaultFace; // 默认头像
            }
            return face;
        },
        getUserFaceFromVcard: function (vcard) {
            if (null == vcard) {
                return null;
            }
            if (null != vcard.PHOTO.BINVAL && "" != vcard.PHOTO.BINVAL) {
                face = "data:image/;base64," + vcard.PHOTO.BINVAL;
            } else {
                face = this.defaultFace; // 默认头像
            }
            return face;
        },


        /**
         * 消息回调
         * @param stanza 未解析的消息节，可能是一下其中一种
         *        历史消息，<message><body/><delay/></message>
         *    即时消息，<message><body/></message>
         *    邀请进入会议室消息，<message><
         * @param room XmppRoom实例房间
         * @returns {Boolean}
         */
        _roomMsgCb: function (params) {
//		var params = {
//				msg : msg,
//				stanza :stanza,
//				room : room,
//			};
            // 只可能四种消息：群聊，私人消息，invite,delcine
            var message = params.msg;
            switch (message.type) {
                case 'chat' :
                    /*
				XoW.logger.d(this.classInfo + "chat消息");
				// 如果不存在与该会议室中该用户的聊天，则与其的聊天窗口弹出
				if($('#layim_useroneroom' + XoW.utils.escapeJquery(message.from)).length === 0) {
					// 模拟数据
					var $html = $('<li data-id="' + message.from + '" type="one"><span class="xxim_onename">' + XoW.utils.getResourceFromJid(message.from) + '</span></li>');
					xxim.popchatbox($html);
				}
				// nick, body, isDelayMsg, time, type
				this.popRoomPrivateMessage(message.from, message.body, '');
				*/
                    var p = {
                        message: params.stanza,
                        type: 'roomprivate'
                    };
                    this._messageCenterMgr.addShowMessage(p);
                    break;
                case 'groupchat' :
                    XoW.logger.d(this.classInfo + "groupchat消息");
                    var type = '';
                    if (message.isMeSend) {
                        type = 'me';
                    }
                    this.popMessageToRoom(params.room, message, type);
                    break;
                case 'invite' :
                    XoW.logger.d(this.classInfo + "invite消息，不处理");
                    break;
                case 'decline' :
                    XoW.logger.d(this.classInfo + "decline消息");
                    var info = message.declineFrom + "拒绝了邀请，原因：" + message.reason;
                    this.roomSystemMsg(info, params.room);
                    break;
            }

            /*
		var message = params.message;
		if('decline' === message.messageType) {
		} else if('groupchat'=== message.messageType) {

		} else if('chat'=== message.messageType) {
			XoW.logger.d(this.classInfo + "chat消息");
			//this.popMessageToPrivate();
			// XoW.logger.p({'from' : message.from, 'bodyContent' : message.bodyContent});
			// var html = '来自[' + message.from + ']的私人消息<br>' + '[' + message.bodyContent + ']';
			// this.popInfoWindow(html);

			// 如果这个窗口不存在，进行弹出。

		} else {
			XoW.logger.w("没有合适 的类型" + message.messageType);
		}
		*/
            return true;
        },
        /**
         * 出席回调
         * @param stanza 未解析的出席节
         * @param room 房间
         * @returns {Boolean} 一定要返回true，不然执行完一下就会被delete掉
         */
        _roomPresCb: function (params) {
            var presence = params.presence;
            var room = params.room;

            this.roomSystemMsg(presence.message, room);
            // 如果不是错误，就是加入房间成功了，则将加入房间的按钮去掉。
            if ('error' !== presence.type) {
                var div = '#' + XoW.utils.escapeJquery(room.name) + '.layim_chatsay div[id="layim_joinRoom"]';
                if (div.length > 0) {
                    // 说明存在加入房间按钮
                    $(div).remove();
                }
            } else {

//			if('409' === presence.errorCode) {
//
//			}
            }
            /*
		 XoW.logger.w(this.classInfo + "pres_handler_cb被调用了" + room.name + "   " + room.nick);
		// XoW.logger.w(this.classInfo + XoW.utils.xmlescape(stanza));
		// 这里实现 xxx加入房间;xxx修改nick；xxx离开房间

		var presence = XmppRoom._parsePresence(stanza);
		if('error' === presence.type) {
			// 产生错误了
			switch(presence.errorcode) {
				case '401' :
					XoW.logger.w("未提供密码或者密码错误！");
					this.roomSystemMsg("未提供密码或者密码错误！", room);
					break;
				case '403' :
					XoW.logger.w("您已被禁止进入该房间！");
					this.roomSystemMsg("您已被禁止进入该房间！", room);
					break;
				case '407' :
					XoW.logger.w("该房间仅限会员进入！");
					this.roomSystemMsg("该房间仅限会员进入！", room);
					break;
				case '409' :
					XoW.logger.w("该用户名已被该聊天室中其他人使用！");
					this.roomSystemMsg("用户名[" + room.nick + "]已被该聊天室中其他人使用，请重新输入一个用户名！", room);
					break;
				case '503' :
					XoW.logger.w("该聊天室已达到最大人数，您无法进入！");
					this.roomSystemMsg("该聊天室已达到最大人数，您无法进入！", room);
					break;
				default :
					this.roomSystemMsg("未知错误，错误类型" + presence.error + ",错误代码" + presence.errorcode, room);
					XoW.logger.w("未知错误，错误类型" + presence.error + ",错误代码" + presence.errorcode);
			}

		} else {

			if(null !== presence.newnick) {
				// XoW.logger.w("有人改名了，从 " + presence.nick + " 改成了 " + presence.newnick);
				this.roomSystemMsg('[' + presence.nick +']将昵称改成了[' + presence.newnick + ']', room);
			} else if('unavailable' === presence.type){
				//XoW.logger.w("有人下线了" + presence.nick);
				this.roomSystemMsg('[' + presence.nick + ']退出了聊天室', room);
			} else if(null == presence.status && null == presence.priority && null == presence.show) {
				this.roomSystemMsg('[' + presence.nick + ']加入了聊天室', room);
				// XoW.logger.w("有人加入了聊天室" + presence.nick);

				// 因为一个开始自己加入该房间的时候，也会提示自己进入该房间了，即成功进入房间
				// 所以在这里对  ’加入该房间‘ 按钮进行清除
				var div = '#' + XoW.utils.escapeJquery(room.name) + '.layim_chatsay div[id="layim_joinRoom"]';
				$(div).remove();

			}


		}
		*/
            return true;
        },


        /**
         * 花名册
         * @param stanza 出席节
         * @param room 房间
         * @returns {Boolean}
         */
        _roomRosterCb: function (params) {
            var stanza = params.stanza;
            var room = params.room;
            XoW.logger.w(this.classInfo + "roster_cb被调用了" + room.name + "   " + room.nick);
            // XoW.logger.w(this.classInfo + XoW.utils.xmlescape(stanza));

            // 方案： 暂时用的第一种
            // 1，只要roster有变动，则重新加载所有的人？
            // 优：处理简单，只要把原数据清楚，新数据加上去。
            // 劣：需要所有数据
            // 2，只要roster有变动，因为我可以知道变动的人是谁，所以，只变动这个人？
            // 优：只变动改变动的人
            // 劣：我要定位到那个人，对其进行更新。
            // 后面发现stanza中传过来的是全部的人，

            var $groupss = $('#layim_groupusers' + XoW.utils.escapeJquery(room.name));
            $groupss.addClass('loading');
            var str = "";
            for (var key in stanza) {
                // 只有有一个Key，一个值，key是这个roster所对应的人的nick，value是一个Occupant
                // 对象，这个人的信息保存在这个对象中。

                XoW.logger.w("信息如下：");
                XoW.logger.w("nick " + key + ",  jid" + stanza[key].jid
                    + ", show" + stanza[key].show + ", status" + stanza[key].status
                    + ", role" + stanza[key].role + ", affiliation" + stanza[key].affiliation);
                // 得到房间对应的群组列表。

//			var node = xxim.node, dataId = othis.attr('data-id'),
//		    	param = {
//		        id: stanza[key]. , // 在列表中点中的用户的JID，
//		        jid : stanza[key].jid, // 【增加】
//		        type: 'group',
//		    }
                // 在线状态判断。图标还是使用的和好友的那个一样
                // 其中，如果某个人将状态设置为隐身，那么就等于退出了这个聊天室。
                var presenceClass = "xxim_mytestonline";
                if (null === stanza[key].show) {
                    presenceClass = "xxim_mytestonline";
                } else if ('away' === stanza[key].show) {
                    presenceClass = "xxim_mytestaway";
                } else if ('dnd' === stanza[key].show) {
                    presenceClass = "xxim_mytestdnd";
                } else if ('chat' === stanza[key].show) {
                    presenceClass = "xxim_mytestchat";
                }


                str += '<li class="' + presenceClass + '" data-id="' + room.name + "/" + key + '" type="one"><img src="images/group/OM.png"><i></i><span class="xxim_onename">' + key + '</span></li>';
                // str += '<li class="' + presenceClass + '" data-id="'+ stanza[key].jid +'" type="one"><img src="images/group/OM.png"><i></i><span class="xxim_onename">'+ key +'</span></li>';
                //var keys = param.type + param.id, str = '',
                //groupss = xxim.chatbox.find('#layim_group'+ keys);
                // config.json(config.api.groups, {}, function(datas){
                //      if(datas.status === 1){
                //         var ii = 0, lens = datas.data.length;
                //         if(lens > 0){
                //             for(; ii < lens; ii++){
                //str += '<li data-id="'+ datas.data[ii].id +'" type="one"><img src="'+ datas.data[ii].face +'"><span class="xxim_onename">'+ datas.data[ii].name +'</span></li>';
                //              }
                //         } else {
                //            str = '<li class="layim_errors">没有群员</li>';
                //          }

                //     } else {
                //           str = '<li class="layim_errors">'+ datas.msg +'</li>';
                // }
                // }, function(){
                //        groupss.removeClass('loading');
                //        groupss.html('<li class="layim_errors">请求异常</li>');
                //    });


            }
            $groupss.removeClass('loading');
            $groupss.html(str);
            // var occupant = room.roster[room.nick];
            // XoW.logger.w(occupant.jid + "  " + occupant.affiliation + " " + occupant.role);

            return true;
        },
        /**
         * 来自群聊的邀请
         * @param params{'roomInviteInfo' : roomInviteInfo, 'stanza' : stanza}
         */
        _roomInviteCb: function (params) {
//		var params = {
//				stazna : stanza,
//				info : roomInviteInfo, // info对象
//			};
            XoW.logger.ms(this.classInfo + "_roomInviteCb");

            var roomInviteInfo = params.info;
            var html = '[' + roomInviteInfo.time + ']<br>' + '[' + XoW.utils.getNodeFromJid(roomInviteInfo.params.inviteFrom) + ']  邀请您进入会议室  [' + XoW.utils.getNodeFromJid(roomInviteInfo.from) + ']  <br>备注：' + roomInviteInfo.params.reason;
            this.infos.push(roomInviteInfo);
            this.popInfoWindow(html);

            XoW.logger.me(this.classInfo + "_roomInviteCb");
            return true;
        },


        _friendUnsubscribedCb: function (params) {
//		var params = {
//		preType : '',
//		presenceStanza : stanza,
//		unsubscribed : // info节
//	};
            XoW.logger.ms(this.classInfo + "_friendUnsubscribedCb");
            var info = params.unsubscribed;
            var html = '[' + info.time + ']<br>' + '[' + XoW.utils.getNodeFromJid(info.from) + '] 撤销了你对他/她的订阅';
            this.infos.push(info);
            this.popInfoWindow(html);
            XoW.logger.me(this.classInfo + "_friendUnsubscribedCb");
            return true;
        },

        _friendUnsubscribeCb: function (params) {
//		var params = {
//				preType : '',
//				presenceStanza : stanza,
//				unsubscribe : // info节
//			};

            XoW.logger.ms(this.classInfo + "_friendUnsubscribeCb");
            var info = params.unsubscribe;
            var html = '[' + info.time + ']<br>' + '[' + XoW.utils.getNodeFromJid(info.from) + '] 拒绝你的好友申请或取消订阅你';
            this.infos.push(info);
            this.popInfoWindow(html);

            XoW.logger.me(this.classInfo + "_friendUnsubscribeCb");
            return true;
        },

        /**
         * 别人同意我请求他/她为好友
         */
        _friendSubscribedCb: function (params) {
//		var params = {
//				preType : preType,
//				presenceStanza : stanza,
//		subscribed // info 对象
//			};
            XoW.logger.ms(this.classInfo + "_friendSubscribedCb");
            var info = params.subscribed;
            // friendSubscribedHtml
            var html = '[' + info.time + ']<br>' + '[' + XoW.utils.getNodeFromJid(info.from) + '] 同意你的添加好友申请';
            this.infos.push(info);
            this.popInfoWindow(html);

            XoW.logger.me(this.classInfo + "_friendSubscribedCb");
            return true;
        },

        /**
         * 别人请求我为好友
         * @params params {'info' : info, 'presStanza' : presStanza, 'presTemp' : presTemp}
         */
        _friendSubscribeCb: function (params) {
//		var params = {
//				preType : preType,
//				presenceStanza : stanza,
//				subscribe : encap   Info对象
//			};

            XoW.logger.ms(this.classInfo + "_friendSubscribeCb()");
            var info = params.subscribe;
//			info.setInfo('subscribe',
//					'friendSubscribe' + XoW.utils.getUniqueId(),
//					presTemp.time,
//					{ 'from' : presTemp.from, 'to' : presTemp.to});
            var html = '[' + info.time + ']<br>' + '[' + XoW.utils.getNodeFromJid(info.from) + '] 请求添加你为好友';
            this.infos.push(info);
            this.popInfoWindow(html);

            XoW.logger.me(this.classInfo + "_friendSubscribeCb()");
            return true;
        },

        /**
         * 收到来自会议室中的私有信息
         * @param roomAndNick
         * @param msg
         * @param type
         */
        popRoomPrivateMessage: function (roomAndNick, msg, type) {
            XoW.logger.ms(this.classInfo + "popRoomPrivateMessage()");
            XoW.logger.p({'roomAndNick': roomAndNick, 'msg': msg, 'type': type});
            var nick = XoW.utils.getResourceFromJid(roomAndNick);
            // 如果是空内容，则返回
            if (!msg) {
                XoW.logger.w(this.classInfo + "popRoomPrivateMessage  消息为空，返回");
                return;
            }
            // 如果界面上没有该群组的聊天窗口，则返回
            // var groupChatarea = "div.layim_chatarea ul[id='layim_areagroup" + XoW.utils.getNodeFromJid(room.name) + "']";
//		var groupChatarea = "ul[id='layim_areaoneroom" + roomAndNick + "']";
//		var $groupChatarea = $(groupChatarea);
            var $groupChatarea = this.getLayimChatarea('one', roomAndNick);

            if (!$groupChatarea.length) {
                XoW.logger.w(this.classInfo + "popRoomPrivateMessage  不存在聊天窗口，返回");
                // 那不是应该弹出？不对，如果能够发送消息，说明已经在前面弹出了
                // 而且如果是对方发消息给我，前面也已经弹出了
                return;
            }

            var html = "";
            var roomInMuc = this._gblMgr.getRoomMgr().getXmppRoom(XoW.utils.getBareJidFromJid(roomAndNick));
            if (null == roomInMuc) {
                XoW.logger.w(this.classInfo + "popRoomPrivateMessage  本人已不再聊天室中");
                // 说明当前用户不在该聊天室中
                html = '<li class="">'
                    // 获取消息，不做遍历了，因为也没用用到多个body
                    + '<div class="layim_chatsay"><font color="red">系统消息：您已离开该房间，无法发送消息给对方。</font><em class="layim_zero"></em></div>'
                    + '</li>';
            } else {
                if (type === 'me') {
                    XoW.logger.d(this.classInfo + "popRoomPrivateMessage  这是我发给对方的");
                    // nick, body, isDelayMsg, time, type
                    html = this.roomMsgHtml(roomInMuc.nick, msg, false, XoW.utils.getCurrentDatetime(), type);
                } else {
                    XoW.logger.d(this.classInfo + "popRoomPrivateMessage  这是对方发给我的");
                    html = this.roomMsgHtml(nick, msg, false, XoW.utils.getCurrentDatetime(), type);
                }
            }

            this.showMessageCountInChatlist(roomAndNick, 'new');

            // 消息放到界面上
            $groupChatarea.append(html);
            $groupChatarea.scrollTop($groupChatarea[0].scrollHeight);
            XoW.logger.me(this.classInfo + "popRoomPrivateMessage()");
        },

        /**
         * 消息弹到群聊的窗口，这个群聊一定存在窗口上，但可能不是当前聊天窗口，。
         */
        popMessageToRoom: function (room, message, type) {
            // params.room, message, type
            XoW.logger.ms(this.classInfo + "popMessageToRoom()");
            // 如果是空内容，则返回
            if (!message.body) {
                return;
            }
            // 如果界面上没有该群组的聊天窗口，则返回
            // var groupChatarea = "div.layim_chatarea ul[id='layim_areagroup" + XoW.utils.getNodeFromJid(room.name) + "']";
            // var groupChatarea = "ul[id='layim_areagroup" + XoW.utils.getNodeFromJid(room.name) + "']";


//		var groupChatarea = "ul[id='layim_areagroup" + XoW.utils.escapeJquery(room.name) + "']";
//		var $groupChatarea = $(groupChatarea);
            var $groupChatarea = this.getLayimChatarea('group', room.name);
            if ($groupChatarea.length == 0) {
                return;
            }
            var html = "";
            // nick, body, isDelayMsg, time, type
            var isDelayMsg = false;
            if ('delayMsg' == message.contentType) {
                isDelayMsg = true;
            }
            html = this.roomMsgHtml(XoW.utils.getResourceFromJid(message.from), message.body, isDelayMsg, message.time, type);
            this.showMessageCountInChatlist(room.name, 'new');

            // 消息放到界面上
            $groupChatarea.append(html);
            $groupChatarea.scrollTop($groupChatarea[0].scrollHeight);
            XoW.logger.me(this.classInfo + "popMessageToRoom()");
        },
        /**
         * 普通消息和离线消息模板
         */
        // roomMsgHtml : function(from, bodyContent,delayTime, type){


        roomMsgHtml: function (nick, body, isDelayMsg, time, type) {
            // roomMsgHtml : function(message, type){
            XoW.logger.ms(this.classInfo + "roomMsgHtml()");

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
            body = this.StringToFace(body);
//		XoW.logger.w("解析表情" + body);


            var historyMsg = '';
            if (isDelayMsg) {
                historyMsg = '(历史消息)';
            }
            XoW.logger.me(this.classInfo + "roomMsgHtml()");
            return '<li class="' + (type === 'me' ? 'layim_chateme' : '') + '">'
                + '<div class="layim_chatuser">'
                + function () {
                    if (type === 'me') {
                        return '<span class="layim_chattime">' + time + '</span>'
                            + '<span class="layim_chatname">' + nick + '</span>';
                    } else {
                        return '<span class="layim_chatname">' + nick + '</span>'
                            + '<span class="layim_chattime">' + time + '</span><span style="color:red;">' + historyMsg + '</span>';
                    }
                }()
                + '</div>'
                // 获取消息，不做遍历了，因为也没用用到多个body
                // 此时的body要求已经转义完成可以显示，不然会被JS攻击
                + '<div class="layim_chatsay">' + body + '<em class="layim_zero"></em></div>'
                + '</li>';
        },


        roomSystemMsgByRoomJid: function (roomJid, msg) {
            XoW.logger.ms(this.classInfo + "roomSystemMsgByRoomJid()");

            // 没有内容则返回
            if (!msg) {
                XoW.logger.ms(this.classInfo + "roomSystemMsgByRoomJid() 参数msg为空");
                return;
            }
            // 如果界面上没有该群组的聊天窗口，则返回
            // var groupChatarea = "div.layim_chatarea ul[id='layim_areagroup" + XoW.utils.escapeJquery(roomJid) + "']";
            // var $groupChatarea = $(groupChatarea);
            var $groupChatarea = this.getLayimChatarea('group', roomJid);
            if ($groupChatarea.length == 0) {
                XoW.logger.ms(this.classInfo + "roomSystemMsgByRoomJid() 界面上没有该聊天窗口");
                return;
            }

            var html = '<li class="">'
                + '<div class="layim_chatsay"><font color="red">系统消息：' + msg + '</font><em class="layim_zero"></em></div>'
                + '</li>';

            // 消息放到界面上
            $groupChatarea.append(html);
            $groupChatarea.scrollTop($groupChatarea[0].scrollHeight);
            XoW.logger.me(this.classInfo + "roomSystemMsgByRoomJid()");
        },

        /**
         * 普通消息模板
         */
        roomSystemMsg: function (msg, room) {

            XoW.logger.ms(this.classInfo + "roomSystemMsg()");
            this.roomSystemMsgByRoomJid(room.name, msg);
            /*
		// 没有内容则返回
		if(!msg) {
			XoW.logger.ms(this.classInfo + "roomSystemMsg() 参数msg为空");
			return;
		}
		// 如果界面上没有该群组的聊天窗口，则返回
		var groupChatarea = "div.layim_chatarea ul[id='layim_areagroup" + XoW.utils.getNodeFromJid(room.name) + "']";
		var $groupChatarea = $(groupChatarea);
		if($groupChatarea.length == 0) {
			XoW.logger.ms(this.classInfo + "roomSystemMsg() 界面上没有该聊天窗口");
			return;
		}

		var html = '<li class="">'
		 +'<div class="layim_chatsay"><font color="red">系统消息：'+ msg +'</font><em class="layim_zero"></em></div>'
		 +'</li>';

		// 消息放到界面上
		$groupChatarea.append(html);
		$groupChatarea.scrollTop($groupChatarea[0].scrollHeight);
		*/
            XoW.logger.me(this.classInfo + "roomSystemMsg()");
        },

        /**
         * 左下角弹出消息框提示消息
         * 这里的内容，和消息盒子有联系的，就是因为消息盒子在那边闪烁，提示的不够明显
         * 所以才需要这个弹窗提示，所以，点击这个弹窗，会打开那个消息盒子。
         * @param html 传过来的是html
         * @param info 传过来的仅有内容
         */
        popInfoWindow: function (infoHtml) {
            XoW.logger.ms(this.classInfo + "popInfoWindow");

            var content = '<div class="layim_dealinfo"><a  id="dealInfo" key="' + XoW.utils.getUniqueId("dealInfo") + '">点击前往处理<i></i></a></div>';
            content += '<div class="layim_infocontent" >' + infoHtml + '</div>';

            // 如果消息盒子已经打开。那么也要弹到消息盒子中。
            this.popInfoToInfoBox(this.infos[this.infos.length - 1]);

            $.layer({
                type: 1,
                fadeIn: 300,
                // shift: 'bottom', // 没有效果
                //zIndex : 20000000,
                title: '通知（10秒后关闭）',
                // time: 10,
                shade: [0], //去掉遮罩
                move: false, // 不允许移动
                area: ['200px', '200px'],
                offset: [$(window).height() - 200 - 12 + 'px', '12px'],
                page: {
                    html: content
                },
                success: function (layero) {
                    // change(layer.index, layero);

                    /**
                     * 设置定时器关闭表情框
                     */
                    var $layero = $(layero);
                    var $dealInfo = $('#dealInfo', $layero);

                    var i = 10;
                    var intervalHandler = setInterval(function () {
                        i--;
                        $layero.find('h2.xubox_title em').html("通知（" + i + "秒后关闭）");
                        if (0 === i) {
                            $layero.remove();
                            clearInterval(intervalHandler);
                        }
                    }.bind(this), 1000);
                    /**
                     * 进入到消息盒子中。
                     */
                    $dealInfo.bind('click', function () {
                        //alert('你点击了我');
                        // 打开消息盒子。
                        this.showInfoBox();

                        // 移除消息框，清除定时器
                        $layero.remove();
//	        			clearInterval(intervalHandler);
                        return false;
                    }.bind(this));
                    // alert($(layero).attr('id'));
                }.bind(this)
            });
            XoW.logger.me(this.classInfo + "popInfoWindow");
        },

        /**
         * 在消息盒子已经打开的情况下，将消息弹到消息盒子中。
         */
        popInfoToInfoBox: function (info) {
            var $infoBox = $('#layim_info');
            if ($infoBox.length === 0) {
                // 说明不存在
                return;
            }
            var infoHtml = '';
            if ('one' == info.type) {
                infoHtml += '';
            } else if ('invite' == info.type) {
                infoHtml += this.roomInviteHtml(info); // 邀请入群信息
            } else if ('subscribe' == info.type) {
                // 请求加好友信息
                XoW.logger.w("这是个请求加好友的信息");
                infoHtml += this.friendSubscribeHtml(info);
            } else if ('subscribed' == info.type) {
                // 请求加好友信息
                XoW.logger.w("这是对方同意你的添加好友申请");
                infoHtml += this.friendSubscribedHtml(info);
            } else if ('unsubscribe' == info.type) {
                XoW.logger.w("拒绝加为好友或取消订阅");
                infoHtml += this.friendUnubscribeHtml(info);
            } else if ('unsubscribed' == info.type) {
                // 请求加好友信息
                XoW.logger.w("对方撤销了你对他/她的订阅");
                infoHtml += this.friendUnubscribedHtml(info);
            }
            var $tr1 = $infoBox.find('table tbody tr:first');
            if ($tr1.length === 0) {
                // 如果当前消息盒子没有任何消息，那么直接放到tbody里面
                $infoBox.find('table').append(infoHtml).fadeOut(500).fadeIn(500);
            } else {
                $(infoHtml).insertBefore($tr1).fadeOut(500).fadeIn(500).fadeOut(500).fadeIn(500);
            }
        },

        // 对方撤销我对她/他的订阅html
        friendUnubscribedHtml: function (i) {

            return '<tr id="' + i.id + '"><td>'
                + '<a href="#" class="layim_invitename">' + XoW.utils.getNodeFromJid(i.from) + '</a>'
                + '<a href="#" class="layim_invitetime">' + i.time + '</a><br>'
                + '<span class="layim_inviteinfo">撤销了你对他/她的订阅</span>'
                // + '<div id="" class="layim_agreenbtn">同意</div><div id="" class="layim_denybtn">拒绝</div>'
                + '<br></td></tr>';
        },
        // 对方拒绝加我为好友html
        friendUnubscribeHtml: function (i) {

            return '<tr id="' + i.id + '"><td>'
                + '<a href="#" class="layim_invitename">' + XoW.utils.getNodeFromJid(i.from) + '</a>'
                + '<a href="#" class="layim_invitetime">' + i.time + '</a><br>'
                + '<span class="layim_inviteinfo">拒绝你的好友申请或取消订阅你</span>'
                // + '<div id="" class="layim_agreenbtn">同意</div><div id="" class="layim_denybtn">拒绝</div>'
                + '<br></td></tr>';
        },
        // 对方同意加我为好友html
        friendSubscribedHtml: function (i) {

            return '<tr id="' + i.id + '"><td>'
                + '<a href="#" class="layim_invitename">' + XoW.utils.getNodeFromJid(i.from) + '</a>'
                + '<a href="#" class="layim_invitetime">' + i.time + '</a><br>'
                + '<span class="layim_inviteinfo">已同意你的添加好友申请</span>'
                // + '<div id="" class="layim_agreenbtn">同意</div><div id="" class="layim_denybtn">拒绝</div>'
                + '<br></td></tr>';
        },
        // 对方请求加我为好友html
        friendSubscribeHtml: function (i) {

            var html = '';
            // var friend = this._gblMgr.getUserMgr().getFriendByJid(i.from);
            // 如果消息还未处理，并且该好友不在我的联系人列表中（不在我的联系人列表中则说明
            // 我的界面上没有这个人）则我可以选择分组。
            // if('untreated' === i.status && null == friend) {
            if ('untreated' === i.status) {
                html += '<div class="layim_subscribegroupnames"><span>选择/新建分组</span><select id="groupSelect"><option selected></option>';
                var names = this._gblMgr.getUserMgr().getFriendListsNames();
                for (var j = 0; j < names.length; j++) {
                    html += '<option>' + names[j] + '</option>';
                }
                html += '</select><input id="newFriendList" type="text" maxlength="15"/></div>';
            }
            return '<tr id="' + i.id + '"><td>'
                + '<a href="#" class="layim_invitename">' + XoW.utils.getNodeFromJid(i.from) + '</a>'
                + '<a href="#" class="layim_invitetime">' + i.time + '</a><br>'
                + '<span class="layim_inviteinfo">请求加你为好友</span>'
                + html
                + '<p class="layim_btns">'
                + function () {
                    // 未处理:untreated, 已同意agree，已拒绝deny
                    if ('untreated' === i.status) {
                        return '<button id="layim_roomagree" class="layui-btn layui-btn-small">同意</button>'
                            + '<button id="layim_roomdeny" class="layui-btn layui-btn-small layui-btn-primary">拒绝</button>';

                    } else if ('agree' === i.status) {
                        return '<span>已同意<span>';
                    } else if ('deny' === i.status) {
                        return '<span>已拒绝<span>';
                    } else {
                        return '<span>未知错误<span>';
                    }
                }()
                + '</p>'
                // + '<div id="" class="layim_agreenbtn">同意</div><div id="" class="layim_denybtn">拒绝</div>'
                + '<br></td></tr>';
        },

        roomInviteHtml: function (i) {
            return '<tr id="' + i.id + '"><td>'
                + '<a href="#" class="layim_invitename">' + XoW.utils.getNodeFromJid(i.params.inviteFrom) + '</a>'
                + '<a href="#" class="layim_invitetime">' + i.time + '</a><br>'
                + '邀请您加入会议室<a href="#" class="layim_inviteroom">' + XoW.utils.getNodeFromJid(i.from) + '</a>'
                + '备注：<span class="layim_invitereason">' + i.params.reason + '</span>'
                + '<p class="layim_btns">'
                + function () {
                    // 未处理:untreated, 已同意agree，已拒绝deny
                    if ('untreated' === i.status) {
                        return '<button id="layim_roomagree" class="layui-btn layui-btn-small">同意</button>'
                            + '<button id="layim_roomdeny" class="layui-btn layui-btn-small layui-btn-primary">拒绝</button>';

                    } else if ('agree' === i.status) {
                        return '<span>已同意<span>';
                    } else if ('deny' === i.status) {
                        return '<span>已拒绝<span>';
                    } else {
                        return '<span>未知错误<span>';
                    }
                }()
                + '</p>'
                // + '<div id="" class="layim_agreenbtn">同意</div><div id="" class="layim_denybtn">拒绝</div>'
                + '<br></td></tr>';
        },

        roomConfigHtml: function (fields) {

            var html = '<table class="layui-table">'
                + '<tr><td><span>房间名称</span></td><td><input id="roomConfigRoomName" type="text" value="' + fields['muc#roomconfig_roomname'].value + '" /></td></tr>'
                + '<tr><td><span>房间描述</span></td><td><input id="roomConfigDescribe" type="text" value="' + fields['muc#roomconfig_roomdesc'].value + '" /></td></tr>'
                + '<tr><td><span>允许任何人修改主题</span></td><td><input id="roomConfigChangeSubject" type="checkbox" ' + function () {
                    if (1 == fields['muc#roomconfig_changesubject'].value) {
                        return 'checked';
                    }
                    return '';
                }() + '/></td></tr>'
                + '<tr><td><span>公开的房间（所有人可见）</span></td><td><input id="roomConfigPublicRoom" type="checkbox" ' + function () {
                    if (1 == fields['muc#roomconfig_publicroom'].value) {
                        return 'checked';
                    }
                    return '';
                }() + '/></td></tr>'
                + '<tr><td><span>持久的房间（退出不销毁）</span></td><td><input id="roomConfigPersistentRoom" type="checkbox" ' + function () {
                    if (1 == fields['muc#roomconfig_persistentroom'].value) {
                        return 'checked';
                    }
                    return '';
                }() + '/></td></tr>'
                //				+ '<tr><td><span>是否是持久的房间（退出不销毁）</span></td><td><input type="checkbox" ' + function() {
                //					if(1 == fields['muc#roomconfig_persistentroom'].value) {
                //						return 'checked';
                //					}
                //				}()+ '/></td></tr>'
                + '<tr><td><span>被主持的房间</span></td><td><input id="roomConfigModeratedRoom" type="checkbox" ' + function () {
                    if (1 == fields['muc#roomconfig_moderatedroom'].value) {
                        return 'checked';
                    }
                    return '';
                }() + '/></td></tr>'
                + '<tr><td><span>仅对成员开放的房间</span></td><td><input id="roomConfigMembersOnly" type="checkbox" ' + function () {
                    if (1 == fields['muc#roomconfig_membersonly'].value) {
                        return 'checked';
                    }
                    return '';
                }() + '/></td></tr>'
                + '<tr><td><span>允许任何人邀请其他人</span></td><td><input id="roomConfigAllowInvites" type="checkbox" ' + function () {
                    if (1 == fields['muc#roomconfig_allowinvites'].value) {
                        return 'checked';
                    }
                    return '';
                }() + '/></td></tr>'
                + '<tr><td><span>开启密码</span></td><td><input id="roomConfigPasswordProtectedRoom" type="checkbox" ' + function () {
                    if (1 == fields['muc#roomconfig_passwordprotectedroom'].value) {
                        return 'checked';
                    }
                    return '';
                }() + '/></td></tr>'
                + '<tr><td><span>密码</span></td><td><input id="roomConfigRoomSecret" type="password" value="' + fields['muc#roomconfig_roomsecret'].value + '" /></td></tr>'
                + '<tr><td><span>登录房间对话</span></td><td><input id="roomConfigEnableLogging" type="checkbox" ' + function () {
                    if (1 == fields['muc#roomconfig_enablelogging'].value) {
                        return 'checked';
                    }
                    return '';
                }() + '/></td></tr>'
                + '<tr><td><span>仅允许注册的昵称登录</span></td><td><input id="roomConfigReservedNick" type="checkbox" ' + function () {
                    if (1 == fields['x-muc#roomconfig_reservednick'].value) {
                        return 'checked';
                    }
                    return '';
                }() + '/></td></tr>'
                + '<tr><td><span>允许使用者修改昵称</span></td><td><input id="roomConfigCanChangeNick" type="checkbox" ' + function () {
                    if (1 == fields['x-muc#roomconfig_canchangenick'].value) {
                        return 'checked';
                    }
                    return '';
                }() + '/></td></tr>'
                + '<tr><td><span>允许使用者注册房间</span></td><td><input id="roomConfigRegistration" type="checkbox" ' + function () {
                    if (1 == fields['x-muc#roomconfig_registration'].value) {
                        return 'checked';
                    }
                    return '';
                }() + '/>'
                + '<tr><td><span>最大房间使用者</span></td><td><select id="roomConfigMaxusers">'
                + function () {
                    var html = '';
                    for (var i = 0; i < fields['muc#roomconfig_maxusers'].options.length; i++) {
                        var value = fields['muc#roomconfig_maxusers'].options[i].value;
                        var select = '';
                        if (fields['muc#roomconfig_maxusers'].value == value) {
                            select = 'selected';
                        }
                        html += '<option ' + select + '>' + value + '</option>';
                    }
                    return html;
                }() + '</select>(0代表无限制)</td></tr>'
                + '<tr><td><span>能够发现占有者真实jid的角色</span></td><td><select id="roomConfigWhoIs">'
                + function () {
                    var html = '';
                    for (var i = 0; i < fields['muc#roomconfig_whois'].options.length; i++) {
                        var value = fields['muc#roomconfig_whois'].options[i].value;
                        var select = '';
                        if (fields['muc#roomconfig_whois'].value == value) {
                            select = 'selected';
                        }
                        html += '<option ' + select + ' value="' + value + '">' + fields['muc#roomconfig_whois'].options[i].label + '</option>';
                    }
                    return html;
                }() + '</select></td></tr>'
                + '<tr><td><span>出席节是广播的角色</span></td><td><select id="roomConfigPresenceBroadcast" multiple="multiple">'
                + function () {
                    var html = '';
                    for (var i = 0; i < fields['muc#roomconfig_presencebroadcast'].options.length; i++) {
                        var op = fields['muc#roomconfig_presencebroadcast'].options[i];
                        var select = '';
                        if (-1 != fields['muc#roomconfig_presencebroadcast'].value.indexOf(op.value)) {
                            select = 'selected';
                        }
                        html += '<option value="' + op.value + '" ' + select + ' >' + op.label + '</option>';
                    }
                    return html;
                }() + '</select></td></tr>'
                + '<tr><td><span>房间管理员(以英文逗号隔开)</span></td><td><textarea id="roomConfigRoomAdmins">'
                + function () {
                    var html = '';
                    for (var i = 0; i < fields['muc#roomconfig_roomadmins'].value.length; i++) {
                        if (i != 0) {
                            html += ',';
                        }
                        html += fields['muc#roomconfig_roomadmins'].value[i];
                    }
                    return html;
                }() + '</textarea></td></tr>'
                + '<tr><td><span>房间拥有者(以英文逗号隔开)</span></td><td><textarea id="roomConfigRoomOwners">'
                + function () {
                    var html = '';
                    for (var i = 0; i < fields['muc#roomconfig_roomowners'].value.length; i++) {
                        if (i != 0) {
                            html += ',';
                        }
                        html += fields['muc#roomconfig_roomowners'].value[i];
                    }
                    return html;
                }() + '</textarea></td></tr>';
            html += '<tr><td colspan="2"><div id="roomConfigSubmit" class="layim_sendbtn">保存</div></td></tr></table>';
            return html;

        },


        showInfoBox: function () {
            if ($('#layim_info').length > 0) {
                // 如果已经打开了消息盒子
                return;
            }

            // 暂时只有 会议室的邀请，到时候可能有好友的邀请等。
            // var infos = this._gblMgr.getRoomMgr().infos;
            var infos = this.infos;

            var infoHtml = '<div id="layim_info" class="layim_content"><table class="layui-table">';
            for (var i = infos.length - 1; i >= 0; i--) {
                var info = infos[i];
                if ('one' == info.type) {
                    infoHtml += '';
                } else if ('invite' == info.type) {
                    infoHtml += this.roomInviteHtml(info);
                } else if ('subscribe' == info.type) {
                    XoW.logger.w("这有个请求加好友的信息");
                    infoHtml += this.friendSubscribeHtml(info);
                } else if ('subscribed' == info.type) {
                    // 请求加好友信息
                    XoW.logger.w("这是对方同意你的添加好友申请");
                    infoHtml += this.friendSubscribedHtml(info);
                } else if ('unsubscribe' == info.type) {
                    XoW.logger.w("拒绝加为好友或取消订阅");
                    infoHtml += this.friendUnubscribeHtml(info);
                } else if ('unsubscribed' == info.type) {
                    // 请求加好友信息
                    XoW.logger.w("对方撤销了你对他/她的订阅");
                    infoHtml += this.friendUnubscribedHtml(info);
                }


            }
            infoHtml += "</table></div>";

            //tab,每个选项看有固定的宽度。当选项卡越多，宽度最好越宽。
//			layer.tab({
//		        data:[
//		            {title: '消息盒子 ', content : infoHtml}
//		        ],
//		        zIndex : 21001000, // 这个消息盒子的zindex应该最大。
//		        shade : [0],
//		        offset: ['100px', ''],
//		        area: ['800px', '450px'] //宽度，高度
//		    });
            $.layer({
                type: 1,
                fadeIn: 100,
                // shift: 'bottom', // 没有效果
                // zIndex : 21001000, // 设置了这个，弹出的对话框（请输入昵称）就只能在这个后面了。坑爹
                title: '消息盒子',
                // time: 10,
                shade: [0], //去掉遮罩
                // move: false, // 不允许移动
                area: ['720px', '450px'],
                offset: ['80px', ''],
                page: {
                    html: infoHtml
                },
            });
        },

        inviteToRoom: function (roomJid) {
            var myFriends = this._gblMgr.getUserMgr().getFriends();

            var infoHtml = '<div class="layim_invitebox" >'
                + '<div class="layim_inviteboxinfo">'
                + '<span style="font-size:15px;">房间:</span><input id="layim_inviteroomjid" disabled="" style="width:300px; height:25px; margin-bottom:10px" type="text" value="' + roomJid + '"/><br>'
                + '<span style="font-size:15px;">备注:</span><input  id="layim_invitereason" style="width:300px; height:25px; margin-bottom:10px" type="text" value="邀请您加入会议室"/><br>'
                + '<span>添加用户:</span><input placeholder="用户jid" style="width:200px; height:25px; margin:0px 10px 10px 0px;" type="text" id="layim_invitetxt"/><input class="layui-btn" type="button" id="layim_addInvite" value="添加"/><br>'
                + '<input class="layui-btn" style="float:right; margin-top:10px; position:relative; right:16px;" type="button" id="layim_inviteChoose" value="邀请勾选中的用户"/><br>'
                + '</div>'
                + '<div class="layim_inviteboxtable">'
                + '<span></span>'
                + '<table class="layui-table">';
            var friendHtml = '';
            for (var i = 0; i < myFriends.length; i++) {
                var friend = myFriends[i];
                // infoHtml += this.roomInviteOtherHtml(friend.getJid());
                // 如果不是隐身则可以邀请
                if (XoW.UserStateEnum.OFFLINE !== parseInt(friend.getState())) {
                    friendHtml += this.roomInviteOtherHtml(friend.getJid(), '');
                }
            }
            infoHtml += '</table></div><div class="layim_invitemyfriendlist"><div>我的在线联系人列表：</div><table id="layim_inviteFriendTable" class="layui-table">'
                + friendHtml + '</table></div></div>';

            $.layer({
                type: 1,
                fadeIn: 100,
                // shift: 'bottom', // 没有效果
                // zIndex : 21001000, // 设置了这个，弹出的对话框（请输入昵称）就只能在这个后面了。坑爹
                title: '邀请用户到会议室',
                // time: 10,
                shade: [0], //去掉遮罩
                // move: false, // 不允许移动
                area: ['720px', '450px'],
                offset: ['80px', ''],
                page: {
                    html: infoHtml
                },
            });
        },


        addStrangerHtml: function (username, jid) {
            var html = '<div class="layim_content"><table class="layui-table"><tr id="' + jid + '" style="height:145px;"><td><div class="layim_subscribegroupnames2"><span>添加[' + username + ']为好友。选择/新建分组</span><select id="groupSelect2"><option selected></option>';
            var names = this._gblMgr.getUserMgr().getFriendListsNames();
            for (var j = 0; j < names.length; j++) {
                html += '<option>' + names[j] + '</option>';
            }
            html += '</select><input id="newFriendList2" type="text" maxlength="15"/>'
                + '</div>'
                + '</td><td><input id="sureAddStranger" type="button" value="确定" class="layui-btn layui-btn-small"/><input id="cancelAddStranger" class="layui-btn layui-btn-small layui-btn-primary" type="button" value="取消"/></td></tr></table></div>';
//			class="layui-btn layui-btn-small">同意</button>'
//			+ '<button id="layim_roomdeny" class="layui-btn layui-btn-small layui-btn-primary">
            return html;
        },
        showAddStranger: function (username, jid, agreeCb) {
            XoW.logger.ms(this.classInfo + "showAddStranger");
            XoW.logger.p({username: username, jid: jid});

            var html = this.addStrangerHtml(username, jid);

            $.layer({
                type: 1,
                fadeIn: 100,
                // shift: 'bottom', // 没有效果
                // zIndex : 21001000, // 设置了这个，弹出的对话框（请输入昵称）就只能在这个后面了。坑爹
                title: '添加好友',
                // time: 10,
                shade: [0], //去掉遮罩
                // move: false, // 不允许移动
                area: ['720px', '200px'],
                offset: ['80px', ''],
                page: {
                    html: html
                },
            });
            /*
			var pageii = $.layer({
				  type: 1,
				  title: false,
				  area: ['auto', 'auto'],
				  border: [0], //去掉默认边框
				  shade: [0], //去掉遮罩

				  //closeBtn: [0, false], //去掉默认关闭按钮
				  //shift: 'left', //从左动画弹出
				  page: {
				    html: '<div style="width:420px; height:260px; padding:20px; border:1px solid #ccc; background-color:#eee;">' + html + '<button id="pagebtn" class="btns" onclick="">关闭</button></div>'
				  }
			});*/
            XoW.logger.me(this.classInfo + "showAddStranger");
        },

        /**
         * 离开一个会议室
         */
        closeOneRoom: function (roomJid) {
            this._gblMgr.getRoomMgr().leaveOneXmppRoom(roomJid);
        },

        roomInviteOtherHtml: function (jid, check) {
            return '<tr><td><label><input name="invitePeople" ' + check + ' type="checkbox"/><span>' + jid + '</span></label></td></tr>';
        },
        line____________________________: function () {
        },


        _showOrganization: function () {
            var $xxim_top = $('#xxim_top');
            //alert($xxim_top.attr('class'));

//		$('ul', $xxim_top).each(function(index, item) {
//			var $item = $(item);
//			alert($item.attr('class'));
//		});

            // ----
            var myf = $('#xxim_top > ul.xxim_list').eq(2); // 第几个面板。 0是好友，1是群组，2是历史联系人
            myf.addClass('loading'); // 显示加载的gif

            //alert(myf.html());

            var tree = new MzTreeView('ogTree');
            // 暴露ogTree
            window.ogTree = tree;

            tree.setIconPath('scripts/mtree/img/'); // 图片可用路径
            // tree.icons['organization'] = 'co.png';
            // tree.icons['department'] = '';

            tree.nodes["0_1"] = "text:XXX公司; ";
            tree.nodes["1_kfb"] = "text:开发部; data:id=kfb";
            tree.nodes["kfb_csb"] = "text:测试部;  data:id=csb";
            tree.nodes["csb_cs1b"] = "text:测试1部;  data:id=cs1b";
            tree.nodes["cs1b_cs1b1z"] = "text:测试1组;  data:id=cs1b1z";
            tree.nodes["cs1b_cs1b1z1d"] = "text:测试1组1队;  data:id=cs1b1z1d";
            tree.nodes["cs1b1z1d_cs1b1z1d1fd"] = "text:测试1组1队1分队;  data:id=cs1b1z1d1fd";
            tree.nodes["cs1b1z1d1fd_hwh"] = "text:黄伟华;  data:id=hwh";
            tree.nodes["cs1b1z1d1fd_hww"] = "text:黄伟文;  data:id=hww";
            tree.nodes["cs1b_cs1b2z"] = "text:测试2组;  data:id=cs1b2z";
            tree.nodes["csb_cs2b"] = "text:测试2部;  data:id=cs2b";
            tree.nodes["csb_hwh"] = "text:黄伟华;  data:id=hwh";
            tree.nodes["csb_hww"] = "text:黄伟文;  data:id=hww";
            tree.nodes["1_cwb"] = "text:财务部; icon: department; data:id=cwb";
            tree.nodes["kfb_322"] = "text:林兴洋; hint:bigboss; data:id=322";
            tree.nodes["kfb_323"] = "text:雷田树; data:id=323";

            tree.nodes["kfb_325"] = "text:丁伟鹏; data:id=325";
            tree.nodes["cwb_407"] = "text:吕海菊; data:id=407";
            tree.nodes["cwb_406"] = "text:涂婷婷; data:id=406";
            tree.nodes["cwb_408"] = "text:谢开池; data:id=408";
            tree.nodes["cwb_zxl"] = "text:邹小龙; data:id=zxl";

            tree.setTarget("orgnaization");
            //XoW.logger.d('-->' + tree.toString());
            var html = tree.toString();
            myf.html(html);
            myf.removeClass('loading'); // 显示加载的gif


        },


        /**
         * 改写xxim中的getDatas，使得我的数据能够填进去。
         * 暂时只是好由列表用这个显示了，群组，最近联系人没有
         * @param index
         */
        _showFriends: function (index) {
            XoW.logger.ms(this.classInfo + "_showFriends()");
            var datas;
            if (0 === index) {
                datas = this._gblMgr.getUserMgr().getFriendGroupList(); // 好友数据
            } else if (1 === index) {
                datas = this._gblMgr.getRoomMgr().getAllRooms(); // 会议室数据
            } else {
                // index不在要求范围内。
                return;
            }
            var node = xxim.node;
            var myf = node.list.eq(index); // 第几个面板。 0是好友，1是群组，2是历史联系人
            myf.addClass('loading'); // 显示加载的gif
            XoW.logger.p({index: index});
            XoW.logger.d(this.classInfo + "myf是什么" + myf);
            var i = 0, myflen = datas.length, str = '', item;
            if (myflen > 0) {
                if (index === 0) {
                    for (; i < myflen; i++) {
                        str += '<li data-id="' + datas[i].getGroupId() + '" class="xxim_parentnode">' // 组ID
                            + '<h5><i></i><span class="xxim_parentname">' + datas[i].getName() // 组名
                            + '</span><em class="xxim_nums">（'
                            + datas[i].getCurrentNums() + '/' + datas[i].getTotalNums() + '）</em></h5>' // 当前人数和总人数
                            + '<ul class="xxim_chatlist">';
                        item = datas[i].item;
                        for (var j = 0; j < item.length; j++) {
                            var face = "";
                            if (null != item[j].getVcard() && "" != item[j].getVcard().PHOTO.BINVAL) {
                                face = "data:image/;base64," + item[j].getVcard().PHOTO.BINVAL;
                            } else {
                                // face = item[j].getFace();
                                face = this.defaultFace;
                            }
                            var name = item[j].getName();
                            if (null == name || '' == name) {
                                name = XoW.utils.getNodeFromJid(item[j].getJid());
                            }
                            str += '<li data-id="' + item[j].getJid() + '" class="xxim_childnode xxim_mytestoffline" type="' + (index === 0 ? 'one' : 'group')
                                + '"><img ondragstart="return false;" name="wtf" src="' + face +
                                '" class="xxim_oneface"></img><i></i>&nbsp;&nbsp;<span class="xxim_onename">'
                                + name + '</span>&nbsp;&nbsp;<span class="xxim_msgnumber" style="color:red; font-size:10px;"></span></li>'; // <span class="xxim_onename">'
                            // + item[j].getAsk() + '</span><span class="xxim_onename">'
                            // + item[j].getSubscription() + '</span><span class="xxim_onename">'
                            // + item[j].getState() + '</span>';
                            // $("#img1").attr("src","data:image/;base64,"+myHexData2);
                        }
                        str += '</ul></li>';
                    }
                } else if (1 === index) {
                    // myf.remove();
                    str += '<li class="xxim_liston">'
                        + '<ul class="xxim_chatlist">';


                    str += '<li data-id="" class="xxim_childnode" type="group"><span  class="xxim_onename">房间名 | 地址</span><em class="xxim_time">人数</em></li>';
                    for (; i < myflen; i++) {
                        // 房间
                        // str += '<li data-id="'+ datas[i].id +'" class="xxim_childnode" type="group"><img src="'+ datas[i].face +'"  class="xxim_oneface"><span  class="xxim_onename">'+ datas[i].name +'</span><em class="xxim_time">'+ datas[i].time +'</em></li>';
                        // 房间名 就是name
                        // 地址，就是jid前面一段截下来。
                        // 人数。
                        // id是要用jid
                        var room = datas[i];
                        var id = room.jid;
                        var name = room.getName();
                        var address = XoW.utils.getNodeFromJid(id);
                        var peopleNumber = room.getOccupants();
//	            	if(name.length > 9) {
//	            		name = name.substring(0,9) + "...";
//	            	}
//	            	if(id.length > 6) {
//	            		id = id.substring(0,5) + "...";
//	            	}
                        //<i class="' + (room.isUnsecured() === false ? 'xxim_grouplock' : '')+ '"></i>
                        str += '<li data-id="' + id + '" class="xxim_childnode" type="group"><span  class="xxim_onename" >' + name + ' | ' + address + '</span><em class="xxim_time">' + peopleNumber + '</em></li>';
                    }
                    str += '</ul></li>';
                } else {
                    str += '<li class="xxim_liston">'
                        + '<ul class="xxim_chatlist">';
                    for (; i < myflen; i++) {
                        str += '<li data-id="' + datas[i].id + '" class="xxim_childnode" type="one"><img src="' + datas[i].face + '"  class="xxim_oneface"><span  class="xxim_onename">' + datas[i].name + '</span><em class="xxim_time">' + datas[i].time + '</em></li>';
                    }
                    str += '</ul></li>';
                }
                myf.html(str);
            } else {
                XoW.logger.w(this.classInfo + " 没有任何数据");
                myf.html('<li class="xxim_errormsg">没有任何数据</li>');
            }
            myf.removeClass('loading');

            // xxim.renode();
            // xxim.event(); // 界面的一些事件
            XoW.logger.me(this.classInfo + "_showFriends()");
        },

        /**
         * 登录成功后，隐藏登陆界面，显示主界面
         */
        /*
	_loginSuccessShowMainPage : function() {
		XoW.logger.ms(this.classInfo + "_loginSuccessShowMainPage()");


		// 绑定监听到UserMgr中，等待UserMgr的好友列表加载完，则页面显示好友列表
		this._gblMgr.getUserMgr().addFriendListChangeHandler(this._pageStart_cb.bind(this));

		XoW.logger.me(this.classInfo + "_loginSuccessShowMainPage()");
	},*/




        /**
         * 当UserMgr将用户信息处理完毕，界面将开始显示用户信息
         */
        _pageStart_cb: function () {
            XoW.logger.ms(this.classInfo + "_pageStart_cb()");

            this._showFriends(0); // 加载用户信息
            xxim.event(); // 界面的一些事件
            xxim.layinit(); // 初始化


            // 绑定当好友face改变时调用_faceChange_cb函数
            //OK this._gblMgr.getUserMgr().addHandlerToEveryFriend(XoW.UserModelEnum.FACE, this._faceChange_cb.bind(this));
            // 绑定当好友状态改变时 调用_stateChange_cb函数
            //OK this._gblMgr.getUserMgr().addHandlerToEveryFriend(XoW.UserModelEnum.STATE, this._stateChange_cb.bind(this));
            // 绑定当好友分组currentNums改变时调用的函数
            //OK this._gblMgr.getUserMgr().addHandlerToEveryFriendGroup(XoW.UserGroupModelEnum.CURRENTNUMS, this._currentNums_cb.bind(this));
            // 监听添加好友的
            this._gblMgr.getUserMgr().addHandler('subscribe', this._friendSubscribeCb.bind(this));
            // 绑定消息管理器，当监听chatManager的chat，当有新chat产生时，再去监听chat的AllMessage属性从而获得消息回调
            this._gblMgr.getChatMgr().addHandler(XoW.ChatManagerEnum.JIDCHATS, this._jidChatsChange_cb.bind(this));
            // 绑定消息管理器，监听ibb文件变化。
            this._gblMgr.getChatMgr().addIbbFileHandler(this._ibbFile_cb.bind(this));

            // 绑定groupChatMgr()，当收到某个讨论组的邀请时，进行处理
            // this._gblMgr.getRoomMgr().addHandler('invite', this._groupChatInvite.bind(this));
            this._gblMgr.getRoomMgr().addHandler('message', this._roomMsgCb.bind(this));
            this._gblMgr.getRoomMgr().addHandler('presence', this._roomPresCb.bind(this));
            this._gblMgr.getRoomMgr().addHandler('roster', this._roomRosterCb.bind(this));
            this._gblMgr.getRoomMgr().addHandler('invite', this._roomInviteInfoCb.bind(this));
//		this.layerIndex = 0;
//		this.listenLayerIndexInterval = setInterval(function() {
//			if(this.layerIndex != layer.index) {
//				if(layer.index) {
//					this.layerIndex = layer.index;
//					XoW.logger.w('变了' + layer.index);
//					XoW.logger.w($('#xubox_layer' + layer.index).attr('id'));
//					layer.setTop($('#xubox_layer' + layer.index));
//				}
//			}
//		}.bind(this), 500)
            // this._gblMgr.getInfoMgr().addHandler(this._roomInviteInfo.bind(this));


            // 绑定界面的一些按钮触发的事件
            this._viewActionsBinding();
            XoW.logger.me(this.classInfo + "_pageStart_cb()");
        },


        /**
         * 点击好友列表弹出聊天窗口，
         * 1，如果与该好友的聊天窗口不存在，会调用popchatbox, popchat（弹出聊天窗口）,tabchat（切换聊天窗口）
         *  【log】popchatbox【开始】
         【log】不存在该聊天窗口，新建lxy5@user-20160421db
         【log】popchat()【开始】
         【log】tabchat()【开始】
         【log】tabchat()【结束】
         【log】popchat()【结束】
         【log】popchatbox【结束】
         2，如果与该好友的聊天窗口存在，会调用popchatbox,tabchat
         【log】popchatbox【开始】
         【log】存在该聊天窗口，切换lxy5@user-20160421db
         【log】tabchat()【开始】
         【log】tabchat()【结束】
         【log】popchatbox【结束】

         通过点击左侧的好友列表进行切换好友，会调用tabchat
         【log】tabchat()【开始】
         【log】tabchat()【结束】

         从上面报文可以看出。tabchat都有被调用
         popchat只有点击的好友聊天窗口不存在时，会被调用
         */


//	popMessageToGroupchatnow : function(msg, groupId) {
//		XoW.logger.ms(this.classInfo + "popMessageToGroupchatnow()");
//		var html = this.getMessageHtml(msg, friend);
//		if(null == html) {
//			return;
//		}
//		liStr = "ul.xxim_chatlist li[data-id='" + friend.getJid() + "']";
//		var li = $(liStr);
//		var type = li.attr("type");
//		var keys = type + XoW.utils.getNodeFromJid(friend.getJid());
////		xxim.popchatbox(li);
//	   //只有窗口弹出时才能获得
//		var imarea = xxim.chatbox.find('#layim_area'+ keys);//定位聊天窗口
//	    var layimli = document.getElementById("layim_user"+keys); //获取聊天窗口句柄
//
//	    // 消息放到界面上
//		imarea.append(html);
//		imarea.scrollTop(imarea[0].scrollHeight);
//
//	    XoW.logger.me(this.classInfo + "popMessageToGroupchatnow()");
//	},

        getInfoById: function (id) {
            XoW.logger.d("前来获取info");
            for (var i = 0; i < this.infos.length; i++) {
                if (this.infos[i].id == id) {
                    XoW.logger.d("成功找到info");
                    return this.infos[i];
                }
            }
            XoW.logger.d("不存在对应id的info");
            return null;
        },


        /*
	getFaceFromUser : function(user) {
		var face = "";
		if(null != user.face && "" != user.face) {
			face = "data:image/;base64," + user.face;
		} else {
			face = this.defaultFace;
		}
		return face;
	},
	*/


        /**
         * ChatManager的jidChats属性改变了
         *
         */
        /*
	_jidChatsChange_cb : function() {
		XoW.logger.ms(this.classInfo + "_jidChatsChange_cb()");
		chats = this._gblMgr.getChatMgr().getJidChats();
		for(var i = 0; i < chats.length; i++) {
			if(this._isChatInListenChats(chats[i].getTo())) { // true表示已监听
				XoW.logger.d(this.classInfo + "该好友chat已监听: " + chats[i].getTo());
			} else { // false 表示未监听
				XoW.logger.d(this.classInfo + "该好友chat未监听: " + chats[i].getTo());
				this.listenChats.push(chats[i].getTo()); // 加入已监听列表
				// 监听该chat的allMessage属性
				chats[i].addHandler(XoW.ChatModelEnum.ALLMESSAGE, this._allMessageChange_cb.bind(this));
			}
		}
		XoW.logger.me(this.classInfo + "_jidChatsChange_cb()");
	},
	*/
        /**
         * 判断传进来的jid是不是已经在我的listenChats中了
         * 因为不知道已经监听了那个chat的AllMessage属性了，所以每次
         * 给一个chat增加监听后，都将那个chat的to（from是我，to是与我聊天的好友）属性记录下来
         *
         */
        /*
	_isChatInListenChats : function(to) {
		XoW.logger.ms(this.classInfo + "_isChatInListenChats()");

		for(var i = 0; i < this.listenChats; i++) {
			if(this.listenChats[i] == to) {
				XoW.logger.me(this.classInfo + "_isChatInListenChats()");
				return true;
			}
		}

		XoW.logger.me(this.classInfo + "_isChatInListenChats()");
		return false;
	},
	*/

        /**
         * 获得最大的层级
         * @returns
         */
        /*
	getMaxZIndex : function() {
		var maxZIndex = 0;
		$('.xubox_layer').each(function(i) {
			// $(this).attr('id', 'br'+code++);
			if($(this).css('z-index') > maxZIndex) {
				maxZIndex = $(this).css('z-index');
			}
		});
		XoW.logger.w('layer的index是' + layer.index);
		XoW.logger.w('layer的最大index是' + layer.zIndex);
		XoW.logger.w('最大的index是' + maxZIndex);
		return parseInt(maxZIndex);
	},
	*/


        dealWithdArchiveMessage: function (ownerJid, withJid, params, $showDiv, $pageDiv, $pageInfoDiv) {
//		gblMgr.getViewMgr().dealWithdArchiveMessage(
//				params,
//				$showDiv,
//				$pageDiv,
//				$pageInfoDiv
//			);
            var isRoom = false;
            if (gblMgr.getRoomMgr().roomAbility.jid == XoW.utils.getDomainFromJid(withJid)) {
                isRoom = true;
            }
            if (isRoom && !gblMgr.getRoomMgr().isCurrentUserAlreadyInRoom(withJid)) {
                // 如果当前用户还没有在这个房间里
                layer.msg("请先加入该房间！");
                return;
            }

            var messages = params.archive;
            if (0 == messages.lenth) {
                // 没有任何消息
                $showDiv.html("暂无历史消息！");
            } else {
                if (isRoom) {
                    // 消息
                    var html = '<ul>';
                    for (var i = 0; i < messages.length; i++) {
                        var message = messages[i];
                        html += '<li class="layim_ownerhistory"><span>' + message.nickname + " " + message.logtime + " </span><br><b> " + gblMgr.getViewMgr().StringToFace(message.body) + "</b></li>";
                    }
                    html += '</ul>';
                    $showDiv.html(html);
                } else {
                    // 获得名字，如果没有名字，那么就用jid的node来代替
                    var ownerName = gblMgr.getCurrentUser.name;
                    if ('' == ownerName) {
                        ownerName = XoW.utils.getNodeFromJid(ownerJid);
                    }
                    var withName = gblMgr.getUserMgr().getFriendByJid(withJid).name;
                    if ('' == withName) {
                        withName = XoW.utils.getNodeFromJid(withJid);
                    }

                    // 消息
                    var html = '<ul>';
                    for (var i = 0; i < messages.length; i++) {
                        var message = messages[i];
                        if (message.type == 'to') {
                            // 我发给对方的
                            html += '<li class="layim_ownerhistory"><span>' + ownerName + " " + message.secs + " </span><br><b> " + gblMgr.getViewMgr().StringToFace(message.body) + "</b></li>";
                        } else {
                            // 对方发给我的
                            html += '<li class="layim_withhistory"><span>' + withName + " " + message.secs + " </span><br><b> " + gblMgr.getViewMgr().StringToFace(message.body) + "</b></li>";
                        }
                    }
                    html += '</ul>';
                    $showDiv.html(html);
                }

                // 分页信息
                var set = params.set;
                var condition = params.condition;
                // var pageHtml = '';

                // 点击下一页的时候，需要  last 和 max
                // 点击上一页的时候，需要 before 和max
                // 点击首页的时候， 需要max
                // 点击尾页的时候， 需要空的before
                var $firstPage = $pageDiv.find('a:eq(0)');
                var $prevPage = $pageDiv.find('a:eq(1)');
                var $nextPage = $pageDiv.find('a:eq(2)');
                var $lastPage = $pageDiv.find('a:eq(3)');
                if (set.count > condition.pageSize) {

                    if (set.firstIndex != 0) {
                        // 说明不是第一页
                        $firstPage.css('visibility', 'visible');
                        $prevPage.css('visibility', 'visible');
                    } else {
                        $firstPage.css('visibility', 'hidden');
                        $prevPage.css('visibility', 'hidden');
                    }
                    if (set.lastIndex == (set.count - 1)) {
                        $nextPage.css('visibility', 'hidden');
                        $lastPage.css('visibility', 'hidden');
                    } else {
                        $nextPage.css('visibility', 'visible');
                        $lastPage.css('visibility', 'visible');
                    }

                    // 保存用于分页做条件
                    $pageDiv.attr('pageSize', condition.pageSize);
                    $pageDiv.attr('ownerJid', condition.ownerJid);
                    $pageDiv.attr('withJid', condition.withJid);
                    $pageDiv.attr('keyWord', condition.keyWord);
                    $pageDiv.attr('nickname', condition.nickname);
                    $pageDiv.attr('startDate', condition.startDate);
                    $pageDiv.attr('endDate', condition.endDate);
                    $pageDiv.attr('firstIndex', set.firstIndex);
                    $pageDiv.attr('lastIndex', set.lastIndex);
                    $pageDiv.attr('count', set.count);
                    $pageDiv.attr('firstIndexAttr', set.firstIndexAttr);

                } else {
                    // 不可分页，隐藏上一页下一页。
                    $firstPage.css('visibility', 'hidden');
                    $prevPage.css('visibility', 'hidden');
                    $nextPage.css('visibility', 'hidden');
                    $lastPage.css('visibility', 'hidden');
                }
                // $pageDiv.html(pageHtml);

                // 聊天记录信息
                var pageIndex = (set.firstIndex / condition.pageSize) + 1;
                var totalPage = set.count % condition.pageSize == 0 ? set.count / condition.pageSize : Math.floor(set.count / condition.pageSize) + 1;
                var pageInfoHtml = '页数：' + pageIndex + '/' + totalPage;
                $pageInfoDiv.html(pageInfoHtml);
            }

        },

        /**
         * 使用on来绑定一些事件，这些绑定的事件在这些元素还未出现时就绑定了，
         * 利用on的特性，使之能够在这些元素出现后有作用。
         */
        _viewActionsBinding: function () {

            $(document).on('click', 'div.xxim_mymsgbox > ul > li', function () {

                var $this = $(this);
                var jid = $this.attr('jid');
                var type = $this.attr('type');
                var params = {};
                if ('groupprivate' == type) {
                    var groupuser = gblMgr.getOrgnizationMgr().getGroupuserByGroupuserjid(jid);
                    params = {
                        groupuserjid: jid,
                        usernickname: groupuser.usernickname,
                        type: 'groupprivate',
                    };
                } else if ('group' == type) {
                    var group = gblMgr.getOrgnizationMgr().getGroupByGroupjid(jid);
                    params = {
                        groupjid: jid,
                        displayname: group.displayname,
                        type: 'group',
                    };
                } else if ('roomprivate' == type) {
                    // obj.jid 全jid   room@conference.openfire/nick
                    // obj.nick 昵称     nick
                    params = {
                        jid: jid,
                        nickname: XoW.utils.getResourceFromJid(jid),
                        type: 'roomprivate',
                    };
                }
                gblMgr.getViewMgr().popChatWindow(params);
            });


            $(document).on('click', 'li#xxim_mymsg div.xxim_mymsgbox > ul > li', function () {
                XoW.logger.ms(this.classInfo + "点击了消息列表框");
                XoW.logger.me(this.classInfo + "");
                var $this = $(this);
                // alert($this.attr('type') + "  " + $this.attr('jid'));
                var type = $this.attr('type');
                var jid = $this.attr('jid');
                var miq = gblMgr.getViewMgr().getMessageCenterMgr().getMessageInQueueByTypeAndJidAndRemove(type, jid);
                if (miq) {
                    alert(miq.jid + " " + miq.type);
                    if ('group' == miq.type) {
                        XoW.logger.ms(this.classInfo + "group消息");
                        html = '<li data-id="' + miq.jid + '" class="xxim_childnode" type="group"><span  class="xxim_onename" >' + miq.entity.displayname + '</span><em class="xxim_time"></em></li>';
                        xxim.popchatbox($(html));
                    } else if ('groupprivate' == miq.type) {
                        XoW.logger.ms(this.classInfo + "groupprivate消息");
                        html = '<li data-id="' + miq.jid + '" type="one"><span class="xxim_onename">' + miq.entity.usernickname + '</span></li>';
                        xxim.popchatbox($(html));
                    } else if ('roomprivate' == miq.type) {
                        XoW.logger.ms(this.classInfo + "roomprivate消息");

                    }
                }
                XoW.logger.ms(this.classInfo + "点击了消息列表框");
            });


            $(document).on('click', '#searchMessageHistoryPage a', function () {
                // 获取当前index在同辈元素中的位置
                var index = $(this).index();
                // 获取
                var $pageDiv = $(this).parent();
                var $pageInfoDiv = $pageDiv.siblings('#searchMessageHistoryPageInfo');
                var $showDiv = $pageDiv.parent().siblings(".layim_messagehistoryshow");

                var pageSize = $pageDiv.attr('pagesize');
                var ownerJid = $pageDiv.attr('ownerjid');
                var withJid = $pageDiv.attr('withjid');
                var keyWord = $pageDiv.attr('keyword');
                var nickname = $pageDiv.attr('nickname');
                var startDate = $pageDiv.attr('startdate');
                var endDate = $pageDiv.attr('enddate');

                var firstIndex = $pageDiv.attr('firstIndex');
                var lastIndex = $pageDiv.attr('lastIndex');
                var count = $pageDiv.attr('count');
                var firstIndexAttr = $pageDiv.attr('firstIndexAttr');

                var isRoom = false;
                if (gblMgr.getRoomMgr().roomAbility.jid == XoW.utils.getDomainFromJid(withJid)) {
                    isRoom = true;
                }
                if (isRoom && !gblMgr.getRoomMgr().isCurrentUserAlreadyInRoom(withJid)) {
                    // 如果当前用户还没有在这个房间里
                    layer.msg("请先加入该房间！");
                    return;
                }
                if (isRoom) {
                    switch (index) {
                        case 0 :
                            // alert("首页");
                            gblMgr.getMessageArchiveMgr().mucRoomFirstPage(pageSize, withJid, keyWord, nickname, startDate, endDate, function (params) {
                                gblMgr.getViewMgr().dealWithdArchiveMessage(
                                    ownerJid, withJid,
                                    params,
                                    $showDiv,
                                    $pageDiv,
                                    $pageInfoDiv
                                );
                            }, function (error, msg) {
                                XoW.logger.d(this.classInfo + "请求消息记录失败");
                            });

                            break;
                        case 1 :
                            // alert("上一页");
                            var before = firstIndex;
                            gblMgr.getMessageArchiveMgr().mucRoomPrevPage(pageSize, withJid, keyWord, nickname, startDate, endDate, before, function (params) {
                                gblMgr.getViewMgr().dealWithdArchiveMessage(
                                    ownerJid, withJid,
                                    params,
                                    $showDiv,
                                    $pageDiv,
                                    $pageInfoDiv
                                );
                            }, function (error, msg) {
                                XoW.logger.d(this.classInfo + "请求消息记录失败");
                            });
                            break;
                        case 2 :
                            // alert("下一页");
                            var after = lastIndex;
                            gblMgr.getMessageArchiveMgr().mucRoomNextPage(pageSize, withJid, keyWord, nickname, startDate, endDate, after, function (params) {
                                gblMgr.getViewMgr().dealWithdArchiveMessage(
                                    ownerJid, withJid,
                                    params,
                                    $showDiv,
                                    $pageDiv,
                                    $pageInfoDiv
                                );
                            }, function (error, msg) {
                                XoW.logger.d(this.classInfo + "请求消息记录失败");
                            });
                            break;
                        case 3 :
                            // alert("尾页");
                            gblMgr.getMessageArchiveMgr().mucRoomLastPage(pageSize, count, withJid, keyWord, nickname, startDate, endDate, function (params) {
                                gblMgr.getViewMgr().dealWithdArchiveMessage(
                                    ownerJid, withJid,
                                    params,
                                    $showDiv,
                                    $pageDiv,
                                    $pageInfoDiv
                                );
                            }, function (error, msg) {
                                XoW.logger.d(this.classInfo + "请求消息记录失败");
                            });
                            break;
                    }
                } else {

                    switch (index) {
                        case 0 :
                            // alert("首页");
                            gblMgr.getMessageArchiveMgr().firstPage(pageSize, ownerJid, withJid, keyWord, startDate, endDate, function (params) {
                                gblMgr.getViewMgr().dealWithdArchiveMessage(
                                    ownerJid, withJid,
                                    params,
                                    $showDiv,
                                    $pageDiv,
                                    $pageInfoDiv
                                );
                            }, function (error, msg) {
                                XoW.logger.d(this.classInfo + "请求消息记录失败");
                            });

                            break;
                        case 1 :
                            // alert("上一页");
                            var before = firstIndex;
                            gblMgr.getMessageArchiveMgr().prevPage(pageSize, ownerJid, withJid, keyWord, startDate, endDate, before, function (params) {
                                gblMgr.getViewMgr().dealWithdArchiveMessage(
                                    ownerJid, withJid,
                                    params,
                                    $showDiv,
                                    $pageDiv,
                                    $pageInfoDiv
                                );
                            }, function (error, msg) {
                                XoW.logger.d(this.classInfo + "请求消息记录失败");
                            });
                            break;
                        case 2 :
                            // alert("下一页");
                            var after = lastIndex;
                            gblMgr.getMessageArchiveMgr().nextPage(pageSize, ownerJid, withJid, keyWord, startDate, endDate, after, function (params) {
                                gblMgr.getViewMgr().dealWithdArchiveMessage(
                                    ownerJid, withJid,
                                    params,
                                    $showDiv,
                                    $pageDiv,
                                    $pageInfoDiv
                                );
                            }, function (error, msg) {
                                XoW.logger.d(this.classInfo + "请求消息记录失败");
                            });
                            break;
                        case 3 :
                            // alert("尾页");
                            gblMgr.getMessageArchiveMgr().lastPage(pageSize, count, ownerJid, withJid, keyWord, startDate, endDate, function (params) {
                                gblMgr.getViewMgr().dealWithdArchiveMessage(
                                    ownerJid, withJid,
                                    params,
                                    $showDiv,
                                    $pageDiv,
                                    $pageInfoDiv
                                );
                            }, function (error, msg) {
                                XoW.logger.d(this.classInfo + "请求消息记录失败");
                            });
                            break;
                    }
                }
            });


            $(document).on('click', '.layim_seechatlog', function () {
                var jid = this.getChatnowJid();

                var isRoom = false;
                if (this._gblMgr.getRoomMgr().roomAbility.jid == XoW.utils.getDomainFromJid(jid)) {
                    isRoom = true;
                }
                if (isRoom && !this._gblMgr.getRoomMgr().isCurrentUserAlreadyInRoom(jid)) {
                    // 如果当前用户还没有在这个房间里
                    layer.msg("请先加入该房间！");
                    return;
                }
                var $liHistory = $('div.layim_chatbox div.layim_messagehistorydiv ul > li[data-id="' + jid + '"]');
                if ($liHistory.length > 0) {
                    // 如果已经存在了，就关闭。
                    $liHistory.remove();
                    //  隐藏窗口
                    $('div.layim_chatbox div.layim_messagehistorydiv').css('display', 'none');
                } else {

                    var html = '<li data-id="' + jid + '">'
                        + '<div class="layim_messagehistoryshow">'
                        + '</div>'
                        + '<div class="layim_messagehistorysearch">'
                        + '开始时间：</v><input id="searchMessageStartDate" type="text" onclick="layui.laydate({elem: this, istime: true, format: \'YYYY-MM-DD hh:mm:ss\'})"><br>'
                        + '结束时间：<input id="searchMessageEndDate" type="text" onclick="layui.laydate({elem: this, istime: true, format: \'YYYY-MM-DD hh:mm:ss\'})"><br>'
                        + '内容包含：<input id="searchMessageKeyWord" type="text" ><br>'
                        + function () {
                            if (isRoom) {
                                return '昵称包含：<input id="searchMessagNickname" type="text" >';
                            }
                            return '';
                        }()
                        + '<br>'
                        + '<div id="searchMessageHistoryPage" class="searchmessagehistorypage">'
                        + '<a href="javascript:;" >首页</a>'
                        + '<a href="javascript:;" >上一页</a>'
                        + '<a href="javascript:;" >下一页</a>'
                        + '<a href="javascript:;" >尾页</a>'
                        + '</div>'
                        + '<div id="searchMessageHistoryPageInfo" class="searchmessagehistorypageinfo"></div>'
                        + '<div id="searchMessageHistory" class="searchmessagehistory layim_sendbtn">搜索</div>'
                        + '</div>'
                        + '</li>';
                    $('div.layim_chatbox div.layim_messagehistorydiv > ul').append(html);
                    // $('div.layim_chatbox div.layim_messagehistorydiv').css('display', 'block');
                    var $liHistory = $('div.layim_chatbox div.layim_messagehistorydiv ul li[data-id="' + jid + '"]');
                    $liHistory.parents('div.layim_messagehistorydiv').css('display', 'block');
                    $liHistory.css('display', 'block');
                    $liHistory.siblings().css('display', 'none');
                }
            }.bind(this));


            $(document).on('click', '#searchMessageHistory', function () {
                XoW.logger.ms(this.classInfo + "$(document).on('click', '#searchMessageHistory', function() {");

                var withJid = gblMgr.getViewMgr().getChatnowJid();
                var ownerJid = gblMgr.getCurrentUser().jid;
                var $searchDiv = $(this).parent();
                var $showDiv = $searchDiv.prev('.layim_messagehistoryshow');
                var $pageDiv = $searchDiv.find('#searchMessageHistoryPage');
                var $pageInfoDiv = $searchDiv.find('#searchMessageHistoryPageInfo');
                var startDate = $searchDiv.find('#searchMessageStartDate').val();
                var endDate = $searchDiv.find('#searchMessageEndDate').val();
                var keyWord = $searchDiv.find('#searchMessageKeyWord').val();
                var nickname = $searchDiv.find('#searchMessagNickname').val();
                // alert(withJid + "  " + ownerJid + "  " + startDate + "  " + endDate + "  " + keyWord);

                var isRoom = false;
                if (gblMgr.getRoomMgr().roomAbility.jid == XoW.utils.getDomainFromJid(withJid)) {
                    isRoom = true;
                }
                if (isRoom && !gblMgr.getRoomMgr().isCurrentUserAlreadyInRoom(withJid)) {
                    // 如果当前用户还没有在这个房间里
                    layer.msg("请先加入该房间！");
                    return;
                }
                if (isRoom) {
                    gblMgr.getMessageArchiveMgr().mucRoomFirstPage(
                        10,
                        withJid,
                        keyWord,
                        nickname,
                        startDate,
                        endDate,
                        function (params) {
                            gblMgr.getViewMgr().dealWithdArchiveMessage(
                                ownerJid, withJid,
                                params,
                                $showDiv,
                                $pageDiv,
                                $pageInfoDiv
                            );
                        }, function (error, msg) {
                            XoW.logger.d(this.classInfo + "请求消息记录失败");
                        }
                    );
                } else {
                    gblMgr.getMessageArchiveMgr().firstPage(
                        10,
                        ownerJid,
                        withJid,
                        keyWord,
                        startDate,
                        endDate,
                        function (params) {
                            gblMgr.getViewMgr().dealWithdArchiveMessage(
                                ownerJid, withJid,
                                params,
                                $showDiv,
                                $pageDiv,
                                $pageInfoDiv
                            );
                        }, function (error, msg) {
                            XoW.logger.d(this.classInfo + "请求消息记录失败");
                        }
                    );
                }

                XoW.logger.me(this.classInfo + "$(document).on('click', '#searchMessageHistory', function() {");

            });


            $(document).on('click', '#xxim_seter', function () {
                var index = $.layer({
                    shade: [0],
                    area: ['auto', 'auto'],
                    dialog: {
                        msg: '确定注销当前账号？',
                        btns: 2,
                        type: 4,
                        btn: ['确定', '取消'],
                        yes: function () {
                            // layer.msg('重要', 1, 1);
//				    	alert('登出');
                            gblMgr.getConnMgr().disconnect();
                            layer.close(index);
                        }, no: function () {
                            layer.close(index);
                        }
                    }
                });

                /*
			var iq = $iq({
				to : "search.openfire",
				id : '1',
				type : 'set',
				from : 'lxy@openfire'
			}).c('query', {
				xmlns:'jabber:iq:search'
			}).c('set', {
				xmlns : 'http://jabber.org/protocol/rsm'
			}).c('index').t('1')
			.up().c('max').t('2')
			.up().up().c('x', {
				xmlns : 'jabber:x:data',
				type : 'submit'
			}).c('field', {
				'var' : 'search',
				type : 'text-single'
			}).c('value').t('*').up().up()
			.c('field', {
				'var' : 'Username',
				type : 'boolean'
			}).c('value').t('1').up().up()
			.c('field', {
				'var' : 'Name',
				type : 'boolean'
			}).c('value').t('1').up().up()
			.c('field', {
				'var' : 'email',
				type : 'boolean'
			}).c('value').t('0');
			this._gblMgr.getConnMgr().sendIQ(iq, function() {
 				XoW.logger.d(this.classInfo + "成功");
 			}, function() {
 				XoW.logger.d(this.classInfo + "失败");
 			});
			*/


                /*
			var presence = $pres({
				from : this._gblMgr.getCurrentUser().jid,
				to : "fwgroup.openfire",
				id : 't1',
			}).c('priority').t('1')
			.up().c('status').t('在线');
			this._gblMgr.getConnMgr().send(presence);

			var presence2 = $pres({
				from : this._gblMgr.getCurrentUser().jid,
				to : "fwgroup.openfire",
				id : 't2',
				type : 'unavailable'
			}).c('priority').t('0')
			.up().c('status').t('离线');
			this._gblMgr.getConnMgr().send(presence2);


			var presence3 = $pres({
				from : this._gblMgr.getCurrentUser().jid,
				to : "fwgroup.openfire",
				id : 't1',
			}).c('priority').t('1')
			.up().c('status').t('在线');
			this._gblMgr.getConnMgr().send(presence3);
			*/

                /*
			var msg = $msg({
				from : this._gblMgr.getCurrentUser().jid,
				to : "kfb@fwgroup.openfire", // 这个先写死
				id : 't1',
				type : 'groupchat',
			}).c('body').t('apple');
			this._gblMgr.getConnMgr().send(msg);

			var msg2 = $msg({
				from : this._gblMgr.getCurrentUser().jid,
				to : "kfb@fwgroup.openfire/lp", // 这个先写死
				id : 't1',
				type : 'chat',
			}).c('body').t('pear');
			this._gblMgr.getConnMgr().send(msg2);
			*/
                /*
			var iq = $iq({
				id : 'iq1',
				from : this._gblMgr.getCurrentUser().jid,
				type : 'set',
				to : "fwgroup.openfire", // 这个先写死
			}).c('subscribegroupuser', {
				xmlns : 'http://facewhat.com/orgnization'
			}).t('lhj@openfire');
			this._gblMgr.getConnMgr().sendIQ(iq, function() {
 				XoW.logger.d(this.classInfo + "成功");
 			}, function() {
 				XoW.logger.d(this.classInfo + "失败");
 			});
			var iq2 = $iq({
				id : 'iq2',
				from : this._gblMgr.getCurrentUser().jid,
				type : 'set',
				to : "fwgroup.openfire", // 这个先写死
			}).c('subscribegroupuser', {
				xmlns : 'http://facewhat.com/orgnization'
			}).t('lp@openfire');
			this._gblMgr.getConnMgr().sendIQ(iq2, function() {
 				XoW.logger.d(this.classInfo + "成功");
 			}, function() {
 				XoW.logger.d(this.classInfo + "失败");
 			});
			*/
                /*
			var iq3 = $iq({
				id : 'iq3',
				type : "set",
				from : this._gblMgr.getCurrentUser().jid,
				to : "fwgroup.openfire", // 这个先写死
			}).c('cancelsubscribe', {
				xmlns : 'http://facewhat.com/orgnization'
			});
			this._gblMgr.getConnMgr().sendIQ(iq3, function() {
 				XoW.logger.d(this.classInfo + "成功");
 			}, function() {
 				XoW.logger.d(this.classInfo + "失败");
 			});*/
                /*
			var iq = $iq({
				id : 'iq1',
				from : this._gblMgr.getCurrentUser().jid,
				type : 'get',
				to : "fwgroup.openfire", // 这个先写死
			}).c('query', {
				xmlns : 'http://jabber.org/protocol/disco#info'
			});
			var iq2 = $iq({
				id : XoW.utils.getUniqueId('queryorgnization'),
				// from : this._gblMgr.getCurrentUser().jid,
				type : 'get',
				to : "fwgroup.openfire",
			}).c('queryorgnization', {
				xmlns : XoW.NS.FW_ORGNIZATION,
			});
			// fwgroup.openfire


 			this._gblMgr.getConnMgr().sendIQ(iq, function() {
 				XoW.logger.d(this.classInfo + "成功");
 			}, function() {
 				XoW.logger.d(this.classInfo + "失败");
 			});
 			this._gblMgr.getConnMgr().sendIQ(iq2, function() {
 				XoW.logger.d(this.classInfo + "成功");
 			}, function() {
 				XoW.logger.d(this.classInfo + "失败");
 			});*/
            }.bind(this));


            $(document).on('click', '#layim_inviteChoose', function () {
                var items = document.getElementsByName('invitePeople');
                var invites = [];
                for (var i = 0; i < items.length; i++) {
                    if (items[i].checked) {
                        $this = $(items[i]);
                        var $span = $this.siblings('span');
                        invites.push($span.html());
                    }
                }
//			var $checks = $('input[name="invitePeople"]');
                var roomJid = $('#layim_inviteroomjid').val();
                var reason = $('#layim_invitereason').val();
                var roomInMuc = this._gblMgr.getRoomMgr().getXmppRoom(roomJid);

                roomInMuc.multipleInvites(invites, reason);
                $('.layim_invitebox').parents('.xubox_layer').remove();
            }.bind(this));

            $(document).on('click', '#layim_addInvite', function () {
                // alert("点击了");
                var inviteJid = $('#layim_invitetxt').val();
                $('#layim_invitetxt').val('');
                if ('' === inviteJid) {
                    return;
                } else {
                    XoW.logger.w("增加邀请的好友到table中" + inviteJid);
                    var html = this.roomInviteOtherHtml(inviteJid, 'checked');
                    $('.layim_inviteboxtable table').append(html);
                }

            }.bind(this));

            /**
             * 配置群信息
             */
            $(document).on('click', '.layim_config', function () {
                var roomJid = this.getChatnowJid();

                // var room = this._gblMgr.getRoomMgr().getRoomByJid(roomJid);
                // 从服务器上获取该会议室的信息。
                this._gblMgr.getRoomMgr().getRoomByJidFromServer(roomJid, function (params) {
                    // 自己定义的room
                    var room = params.room;
                    // 当前用户加入的会议室
                    var roomInMuc = this._gblMgr.getRoomMgr().getXmppRoom(roomJid);
                    if (null == room) {
                        layer.msg('房间信息不存在！');
                        return;
                    } else if (null == roomInMuc) {
                        layer.msg('请先加入该房间！');
                        return;
                    }

                    // 第一个tab，展示房间的信息
                    var baseInfo = '<div id="layim_roomconfigbaseinfo" class="layim_roomconfigbaseinfo"></div>';
                    // 第二个tab，展示房间中的所有用户
                    var Occupants = '<div id="layim_roomconfigpeople" class="layim_roomconfigpeople"></div>';
                    // 第三个tab，展示该房间的黑名单
                    var blackList = '<div id="roomBlackList" class="layim_blacklist"></div>';
                    // 第四个tab，房间的配置。
                    var roomConfig = '<div id="roomConfig" class="layim_roomConfig"></div>';

                    // tab,每个选项看有固定的宽度。当选项卡越多，宽度最好越宽。
                    layer.tab({
                        data: [
                            {title: '基本信息', content: baseInfo},
                            {title: '人员', content: Occupants},
                            {title: '黑名单', content: blackList},
                            {title: '配置', content: roomConfig},
                        ],
                        area: ['800px', '400px'] //宽度，高度
                    });

                    var interval = setInterval(function () {
                        if ($('#layim_roomconfigbaseinfo').length != 0) {
                            $('span.xubox_tabnow:contains("基本信息")').click();
                            clearInterval(interval);
                        }
                    }.bind(this), 100);
                }.bind(this), function () {
                    layer.msg('未知错误！');
                });
            }.bind(this));


            /**
             * 在房间配置面板中的黑名单tab，对被ban的用户进行解ban
             */
            $(document).on('click', '#roomBlackList td a[jid]', function () {
                var cancelBanJid = $(this).attr('jid');
                XoW.logger.w("取消黑名单的jid是" + cancelBanJid);
                var roomJid = gblMgr.getViewMgr().getChatnowJid();
                var roomInMuc = gblMgr.getRoomMgr().getXmppRoom(roomJid);
                roomInMuc.revoke(cancelBanJid, "取消黑名单", function () {
                    layer.alert("取消成功", 10);
                    var $blackList = $('#roomBlackList');
                    var roomJid = gblMgr.getViewMgr().getChatnowJid();
                    gblMgr.getRoomMgr().getRoomBlackList(roomJid, function (stanza) {
                        var $stanza = $(stanza);
                        var html = '<div ><table class="layui-table"><tr><td>被禁止的用户</td><td></td></tr>';
                        $('item', $stanza).each(function () {
                            html += '<tr ><td>' + $(this).attr('jid') + '</td><td><a jid="' + $(this).attr('jid') + '" href="javascript:void(0);">取消禁止</a></td></tr>';
                        });
                        html += '</table></div>';
                        $blackList.html(html);
                    }, function (errorStanza) {
                        var $errorStanza = $(errorStanza);
                        var errorCode = $('error', $errorStanza).attr('code');
                        if (errorCode == 403) {
                            $blackList.html("您的权限不足，无法查看黑名单！");
                        } else {
                            $blackList.html("错误代码：" + errorCode);
                        }
                    });
                }.bind(this), function (errorStanza) {
                    var $errorStanza = $(errorStanza);
                    layer.msg("取消失败," + $('error', $errorStanza).attr('code'));
                });
            });


            $(document).on('click', '#roomConfigSubmit', function () {
                var roomJid = this.getChatnowJid();
                this._gblMgr.getRoomMgr().getRoomConfig(roomJid, function (params) {
//				var params = {
//						stanza : stanza,
//						fields : fields,
//					};
                    var fields = params.fields;

                    // 表单验证？
                    if ($.trim($('#roomConfigRoomName').val())) {
                        fields['muc#roomconfig_roomname'].value = $.trim($('#roomConfigRoomName').val());
                    }
                    if ($.trim($('#roomConfigDescribe').val())) {
                        fields['muc#roomconfig_roomdesc'].value = $.trim($('#roomConfigDescribe').val());
                    }
                    if ($('#roomConfigChangeSubject').is(':checked')) {
                        fields['muc#roomconfig_changesubject'].value = 1;
                    } else {
                        fields['muc#roomconfig_changesubject'].value = 0;
                    }
                    if ($('#roomConfigPublicRoom').is(':checked')) {
                        fields['muc#roomconfig_publicroom'].value = 1;
                    } else {
                        fields['muc#roomconfig_publicroom'].value = 0;
                    }
                    if ($('#roomConfigPersistentRoom').is(':checked')) {
                        fields['muc#roomconfig_persistentroom'].value = 1;
                    } else {
                        fields['muc#roomconfig_persistentroom'].value = 0;
                    }
                    if ($('#roomConfigModeratedRoom').is(':checked')) {
                        fields['muc#roomconfig_moderatedroom'].value = 1;
                    } else {
                        fields['muc#roomconfig_moderatedroom'].value = 0;
                    }
                    if ($('#roomConfigMembersOnly').is(':checked')) {
                        fields['muc#roomconfig_membersonly'].value = 1;
                    } else {
                        fields['muc#roomconfig_membersonly'].value = 0;
                    }
                    if ($('#roomConfigAllowInvites').is(':checked')) {
                        fields['muc#roomconfig_allowinvites'].value = 1;
                    } else {
                        fields['muc#roomconfig_allowinvites'].value = 0;
                    }
                    if ($('#roomConfigPasswordProtectedRoom').is(':checked')) {
                        fields['muc#roomconfig_passwordprotectedroom'].value = 1;
                    } else {
                        fields['muc#roomconfig_passwordprotectedroom'].value = 0;
                    }
                    if ($.trim($('#roomConfigRoomSecret').val())) {
                        fields['muc#roomconfig_roomsecret'].value = $.trim($('#roomConfigRoomSecret').val());
                    }
                    if ($('#roomConfigEnableLogging').is(':checked')) {
                        fields['muc#roomconfig_enablelogging'].value = 1;
                    } else {
                        fields['muc#roomconfig_enablelogging'].value = 0;
                    }
                    if ($('#roomConfigReservedNick').is(':checked')) {
                        fields['x-muc#roomconfig_reservednick'].value = 1;
                    } else {
                        fields['x-muc#roomconfig_reservednick'].value = 0;
                    }
                    if ($('#roomConfigCanChangeNick').is(':checked')) {
                        fields['x-muc#roomconfig_canchangenick'].value = 1;
                    } else {
                        fields['x-muc#roomconfig_canchangenick'].value = 0;
                    }
                    if ($('#roomConfigRegistration').is(':checked')) {
                        fields['x-muc#roomconfig_registration'].value = 1;
                    } else {
                        fields['x-muc#roomconfig_registration'].value = 0;
                    }
                    fields['muc#roomconfig_maxusers'].value = $('#roomConfigMaxusers :selected').text();
                    fields['muc#roomconfig_whois'].value = $('#roomConfigWhoIs :selected').val();

                    var presValues = [];
                    $('#roomConfigPresenceBroadcast :selected').each(function (i, selected) {
                        presValues.push($(selected).val());
                    });
                    fields['muc#roomconfig_presencebroadcast'].value = presValues;

                    var admins = $('#roomConfigRoomAdmins').val();
                    fields['muc#roomconfig_roomadmins'].value = admins.split(",");

                    var owners = $('#roomConfigRoomOwners').val();
                    fields['muc#roomconfig_roomowners'].value = owners.split(",");

                    this._gblMgr.getRoomMgr().saveRoomConfig(roomJid, fields, function () {
                        layer.alert('操作成功！', 10);
                    }, function () {
                        layer.msg('失败');
                    });

                }.bind(this));

            }.bind(this));

            $(document).on('click', 'span.xubox_tabnow:contains("人员")', function () {
                var roomJid = this.getChatnowJid();
                this._gblMgr.getRoomMgr().getRoomByJidFromServer(roomJid, function (params) {
                    // 自己定义的room
                    var room = params.room;
                    // 当前用户加入的会议室
                    var roomInMuc = this._gblMgr.getRoomMgr().getXmppRoom(roomJid);
                    if (null == room) {
                        layer.msg('房间信息不存在！');
                        return;
                    } else if (null == roomInMuc) {
                        layer.msg('请先加入该房间！');
                        return;
                    }
                    var currentUserInMucRoom = roomInMuc.roster[roomInMuc.nick];
                    var html = '<table class="layui-table" lay-even="">'
                        + '<colgroup>'
                        + '<col width="100">'
                        + '<col width="80">'
                        + '<col width="80">'
                        + '</colgroup>'
                        + '<thead><tr><th>昵称</th><th>岗位</th><th>角色</th></tr></thead><tbody>'
                        + '<tr style="background-color:yellow"><td>(本人)' + currentUserInMucRoom.nick + '</td><td>'
                        +
                        function () {
                            if ('owner' === currentUserInMucRoom.affiliation) {
                                return "所有者";
                            } else if ('admin' === currentUserInMucRoom.affiliation) {
                                return "管理员";
                            } else if ('member' === currentUserInMucRoom.affiliation) {
                                return "成员";
                            } else {
                                return "无";
                            }
                        }()
                        + '</td><td> ' +
                        function () {
                            if ('moderator' === currentUserInMucRoom.role) {
                                return "主持人";
                            } else if ('participant' === currentUserInMucRoom.role) {
                                return "参与者";
                            } else if ('visitor' === currentUserInMucRoom.role) {
                                return "游客";
                            } else {
                                return "无";
                            }
                        }()
                        + '</td></tr>';

                    // key是nick，value是对应群员的信息
                    for (var key in roomInMuc.roster) {
                        var o = roomInMuc.roster[key];
                        if (roomInMuc.nick !== key) {
                            html +=
                                // (roomInMuc.nick === key ? '<本人>' :'') +
                                '<tr><td title="' + key + '">' + key
                                + '</td><td>' +
                                function () {
                                    if ('owner' === o.affiliation) {
                                        return "所有者";
                                    } else if ('admin' === o.affiliation) {
                                        return "管理员";
                                    } else if ('member' === o.affiliation) {
                                        return "成员";
                                    } else {
                                        return "无";
                                    }
                                }()
                                + '</td><td> ' +
                                function () {
                                    if ('moderator' === o.role) {
                                        return "主持人";
                                    } else if ('participant' === o.role) {
                                        return "参与者";
                                    } else if ('visitor' === o.role) {
                                        return "游客";
                                    } else {
                                        return "无";
                                    }
                                }()
                                + '</td></tr>';
                        }
                    }
                    html += '</tbody></table>';
                    $('#layim_roomconfigpeople').html(html);
                }.bind(this));
            }.bind(this));
            $(document).on('click', 'span.xubox_tabnow:contains("基本信息")', function () {
                var roomJid = this.getChatnowJid();
                this._gblMgr.getRoomMgr().getRoomByJidFromServer(roomJid, function (params) {
                    // 自己定义的room
                    var room = params.room;
                    // 当前用户加入的会议室
                    var roomInMuc = this._gblMgr.getRoomMgr().getXmppRoom(roomJid);
                    if (null == room) {
                        layer.msg('房间信息不存在！');
                        return;
                    } else if (null == roomInMuc) {
                        layer.msg('请先加入该房间！');
                        return;
                    }

                    var html = '<table class="layui-table" lay-even="" lay-skin="row">'
                        + '<colgroup><col width="150"><col></colgroup><tbody>'
                        + '<tr><td>房间地址</td><td>' + room.jid + '</td></tr>'
                        + '<tr><td>房间名称</td><td>' + room.name + '</td></tr>'
                        + '<tr><td>房间描述</td><td>' + room.getDescription() + '</td></tr>'
                        + '<tr><td>房间主题</td><td>' + room.getSubject() + '</td></tr>'
                        + '<tr><td>房间当前人数</td><td>' + room.getOccupants() + '</td></tr>'
                        + '<tr><td>房间创建日期</td><td>' + XoW.utils.getFromatDatetime(room.getCreationdate()) + '</td></tr>'
                        + '<tr><td>房间类型信息</td><td>'
                        + (function () {
                            if (room.isPublic()) {
                                return '公开的，';
                            } else {
                                return '隐藏的，';
                            }
                        })()
                        + (function () {
                            if (room.isOpen()) {
                                return '开放的，';
                            } else {
                                return '仅会员的，';
                            }
                        })()
                        + (function () {
                            if (room.isUnmoderated()) {
                                return '非主持的，';
                            } else {
                                return '被主持的，';
                            }
                        })()
                        + (function () {
                            if (room.isNonanonymous()) {
                                return '非匿名，';
                            } else {
                                return '半匿名，';
                            }
                        })()
                        + (function () {
                            if (room.isUnsecured()) {
                                return '无需密码，';
                            } else {
                                return '需要密码的，';
                            }
                        })()
                        + (function () {
                            if (room.isPersistent()) {
                                return '持久的';
                            } else {
                                return '短暂的';
                            }
                        })()
                        + '</td></tr></tbody></table>';
                    $('#layim_roomconfigbaseinfo').html(html);
                }.bind(this));
            }.bind(this));

            /**
             * 在房间配置面板中，切换到黑名单tab时，去获取黑名单数据
             * 也可以用下标来获取。。
             */
            $(document).on('click', 'span.xubox_tabnow:contains("配置")', function () {
                var $roomConfig = $('#roomConfig');
                var roomJid = this.getChatnowJid();

                if ($roomConfig.length > 0) {

                    this._gblMgr.getRoomMgr().getRoomConfig(roomJid, function (params) {
//					var params = {
//							stanza : stanza,
//							fields : fields,
//						};
                        var fields = params.fields;
                        var html = this.roomConfigHtml(fields);
                        $roomConfig.html(html);

                    }.bind(this), function (errorStanza) {
//					var $errorStanza = $(errorStanza);
//					var errorCode = $('error', $errorStanza).attr('code');
//					if(errorCode == 403) {
//						$blackList.html("您的权限不足，无法查看黑名单！");
//					} else {
//						$blackList.html("错误代码：" + errorCode);
//					}
                    });
                    /*
				this._gblMgr.getRoomMgr().getRoomBlackList(roomJid, function(stanza) {
					var $stanza = $(stanza);
					var html = '<div ><table class="layui-table"><tr><td>被禁止的用户</td><td></td></tr>';
					$('item', $stanza).each(function() {
						html+= '<tr ><td>' + $(this).attr('jid') + '</td><td><a jid="'+$(this).attr('jid')+'" href="javascript:void(0);">取消禁止</a></td></tr>';
					});
					html += '</table></div>';
					$blackList.html(html);
				}.bind(this), function(errorStanza) {
					var $errorStanza = $(errorStanza);
					var errorCode = $('error', $errorStanza).attr('code');
					if(errorCode == 403) {
						$blackList.html("您的权限不足，无法查看黑名单！");
					} else {
						$blackList.html("错误代码：" + errorCode);
					}
				});*/
                }


            }.bind(this));
            /**
             * 在房间配置面板中，切换到黑名单tab时，去获取黑名单数据
             * 也可用下标来获取。。
             */
            $(document).on('click', 'span.xubox_tabnow:contains("黑名单")', function () {
                // 获取房间的黑名单
                var $blackList = $('#roomBlackList');
                var roomJid = this.getChatnowJid();
                //var itv = setInterval(function() {
                if ($blackList.length > 0) {
                    this._gblMgr.getRoomMgr().getRoomBlackList(roomJid, function (stanza) {
                        var $stanza = $(stanza);
                        var html = '<div ><table class="layui-table"><tr><td>被禁止的用户</td><td></td></tr>';
                        $('item', $stanza).each(function () {
                            html += '<tr ><td>' + $(this).attr('jid') + '</td><td><a jid="' + $(this).attr('jid') + '" href="javascript:void(0);">取消禁止</a></td></tr>';
                        });
                        html += '</table></div>';
                        $blackList.html(html);
                    }.bind(this), function (errorStanza) {
                        var $errorStanza = $(errorStanza);
                        var errorCode = $('error', $errorStanza).attr('code');
                        if (errorCode == 403) {
                            $blackList.html("您的权限不足，无法查看黑名单！");
                        } else {
                            $blackList.html("错误代码：" + errorCode);
                        }
                    });
                }
            }.bind(this));


            /**
             * 会议室中，对好友的操作。
             */
            $(document).on('click', '.layim_roomprivilegecando a', function () {
                XoW.logger.ms("$(document).on('click', '.layim_roomprivilegecando button', function() {");
                var $this = $(this);
                XoW.logger.w($this.attr('roomJid') + " " + $this.attr('nick') + " " + $this.attr('privilege'));

                var roomJid = $this.attr('roomJid');
                var privilege = $this.attr('privilege');
                var nick = $this.attr('nick');
                var roomInMuc = gblMgr.getRoomMgr().getXmppRoom(roomJid);
                if (null == roomInMuc) {
                    layer.msg('不存在该room!');
                    XoW.logger.d(this.classInfo + "不存在该room!");
                    return;
                }
                var rosterOne = roomInMuc.roster[nick];
                if (null == rosterOne) {
                    layer.msg('不存在该用户!');
                    XoW.logger.d(this.classInfo + "不存在该用户!");
                    return;
                }
                if (roomInMuc.nick === nick) {
                    // 自己的操作
                    switch (privilege) {
                        case 'changeNick' :
                            XoW.logger.d(this.classInfo + "要修改昵称changeNick");
                            layer.prompt({title: '请输入新昵称', type: 0, val: nick}, function (name) {
                                if (name) {
                                    if (nick === name) {
                                        // 修改后昵称和原昵称相同，则不做处理
                                        return;
                                    }
                                    if (roomInMuc.roster[name]) {
                                        // 新昵称有人使用
                                        gblMgr.getViewMgr().roomSystemMsg('该昵称已被使用，请选择另外的昵称！', roomInMuc);
                                        return;
                                    }
                                    XoW.logger.w("新nick是:" + name);
                                    roomInMuc.changeNick(name);
                                }
                            }.bind(this));
                            break;
                        case 'inviteOthers' :
                            gblMgr.getViewMgr().inviteToRoom(roomJid);
                            break;
                        default :
                            layer.msg('未知操作符:' + privilege);
                            XoW.logger.w('未知操作符' + privilege);
                            break;
                    }

                } else {
                    pureJid = XoW.utils.getBareJidFromJid(rosterOne.jid);
                    switch (privilege) {
                        case 'kick' :
                            roomInMuc.kick(nick, '将你踢出房间', function (stanza) {
                                gblMgr.getViewMgr().roomSystemMsg('[' + roomInMuc.nick + ']已将[' + nick + ']踢出了会议室！', roomInMuc);
                            }, function (error) {
                                gblMgr.getViewMgr().roomSystemMsg('您的权限不足或因其他原因，无法将[' + nick + ']踢出会议室！', roomInMuc);
                            });
                            break;
                        case 'ban' :
                            roomInMuc.ban(pureJid, '禁止你进入房间', function (stanza) {
                                gblMgr.getViewMgr().roomSystemMsg('[' + roomInMuc.nick + ']已将[' + nick + ']拉入黑名单，禁止其进入房间！', roomInMuc);
                            }, function (error) {
                                gblMgr.getViewMgr().roomSystemMsg('您的权限不足或因其他原因，无法将[' + nick + ']拉入黑名单！', roomInMuc);
                            });
                            break;
                        case 'owner' :
                            roomInMuc.owner(pureJid, '将你设置为所有者', function (stanza) {
                                gblMgr.getViewMgr().roomSystemMsg('[' + roomInMuc.nick + ']已将[' + nick + ']设置为所有者！', roomInMuc);
                            }, function (error) {
                                gblMgr.getViewMgr().roomSystemMsg('您的权限不足或因其他原因，无法将[' + nick + ']设置为所有者！', roomInMuc);
                            });
                            break;
                        case 'admin' :
                        case 'removeOwner' :
                            roomInMuc.admin(pureJid, '将你设置为管理者', function (stanza) {
                                gblMgr.getViewMgr().roomSystemMsg('[' + roomInMuc.nick + ']已将[' + nick + ']设置为管理者！', roomInMuc);
                            }, function (error) {
                                gblMgr.getViewMgr().roomSystemMsg('您的权限不足或因其他原因，无法将[' + nick + ']设置为管理者！', roomInMuc);
                            });
                            break;
                        case 'member' :
                        case 'removeAdmin' :
                            roomInMuc.member(pureJid, '将你设置为成员', function (stanza) {
                                gblMgr.getViewMgr().roomSystemMsg('[' + roomInMuc.nick + ']已将[' + nick + ']设置为成员！', roomInMuc);
                            }, function (error) {
                                gblMgr.getViewMgr().roomSystemMsg('您的权限不足或因其他原因，无法将[' + nick + ']设置为成员！', roomInMuc);
                            });
                            break;
                        case 'none' :
                        case 'removeMember' :
                            roomInMuc.revoke(pureJid, '将你的岗位设置为空', function (stanza) {
                                gblMgr.getViewMgr().roomSystemMsg('[' + roomInMuc.nick + ']已将[' + nick + ']的岗位设置为空！', roomInMuc);
                            }, function (error) {
                                gblMgr.getViewMgr().roomSystemMsg('您的权限不足或因其他原因，无法将[' + nick + ']的岗位设置为空！', roomInMuc);
                            });
                            break;
                        case 'moderator' :
                            roomInMuc.op(nick, '将你设置为主持人', function (stanza) {
                                gblMgr.getViewMgr().roomSystemMsg('[' + roomInMuc.nick + ']已将[' + nick + ']设置为主持人！', roomInMuc);
                            }, function (error) {
                                gblMgr.getViewMgr().roomSystemMsg('您的权限不足或因其他原因，无法将[' + nick + ']设置为主持人！', roomInMuc);
                            });
                            break;
                        case 'participant' :
                        case 'removeModerator' :
                            roomInMuc.deop(nick, '将你设置为参与者', function (stanza) {
                                gblMgr.getViewMgr().roomSystemMsg('[' + roomInMuc.nick + ']已将[' + nick + ']设置为参与者！', roomInMuc);
                            }, function (error) {
                                gblMgr.getViewMgr().roomSystemMsg('您的权限不足或因其他原因，无法将[' + nick + ']设置为参与者！', roomInMuc);
                            });
                            break;
                        case 'visitor' :
                        case 'removeParticipant' :
                            roomInMuc.op(nick, '将你设置为游客', function (stanza) {
                                gblMgr.getViewMgr().roomSystemMsg('[' + roomInMuc.nick + ']已将[' + nick + ']设置为游客！', roomInMuc);
                            }, function (error) {
                                gblMgr.getViewMgr().roomSystemMsg('您的权限不足或因其他原因，无法将[' + nick + ']设置为游客！', roomInMuc);
                            });
                            break;
                        default :
                            layer.msg("此操作暂无处理");
                            alert("此操作暂无处理");
                            break;
                    }
//
//				if('kick' === privilege) {
//				} else if('ban' === privilege) {
//				} else if('owner' === privilege) {
//				} else if('admin' === privilege || 'removeOwner' === privilege) {
//				} else if('member' === privilege || 'removeAdmin' === privilege) {
//				} else if('none' === privilege || 'removeMember' === privilege) {
//				} else if('moderator' === privilege) {
//				} else if('participant' === privilege || 'removeModerator' === privilege) {
//				} else if('visitor' === privilege || 'removeParticipant' === privilege) {
//				} else if('sendPrivateMessage' === privilege){
//				} else {
//					alert("此操作暂无处理");
//				}
                }
                XoW.logger.me(this.classInfo + "$(document).on('click', '.layim_roomprivilegecando button', function() {");
            });


            /*
		$(document).on('click', '#copyToGroup', function() {


			alert('aa  ' + $(this).siblings('ul').css('display'));
			if($(this).siblings('ul').css('display') == 'none') {
				$(this).siblings('ul').css({'display' : 'block'});
			} else {
				$(this).siblings('ul').css({'display' : 'none'});
			}
		});
		*/
            $(document).on('click', 'div.layim_operaFriend li ul li', function () {
                XoW.logger.ms(this.classInfo + "$(document).on('click', 'div.layim_operaFriend li ul li', function() {");

                var $this = $(this);
                // 用户想要移动/复制到的分组
                var group = $this.find('a').text();

                var $ulJid = $this.parents('ul[jid]');
                // 得到jid
                var jid = $ulJid.attr('jid');
                // 当前用户在这个分组中
                var thisGroup = $ulJid.attr('thisGroup');

                var $ulGroup = $this.parent();
                XoW.logger.p({jid: jid, group: group, thisGroup: thisGroup});

                var user = gblMgr.getUserMgr().getFriendByJid(jid);
                var groups = user.getGroup();
                if ($ulGroup.hasClass('move')) {
                    // 移动到分组
                    XoW.logger.d(this.classInfo + "移动到分组");
                    for (var i = 0; i < groups.length; i++) {
                        if (groups[i] == thisGroup) {
                            // 删除
                            groups.splice(i, 1);
                        }
                    }
                } else if ($ulGroup.hasClass('copy')) {
                    // 复制到分组
                    XoW.logger.d(this.classInfo + "复制到分组");
                }
                groups.push(group);
                // 不使用 setGroups，不触发回调。
                user.groups = groups;
                // setIQRoster : function(userModel, successCb, errorCb, timeout) {
                gblMgr.getUserMgr().getRosterMgr().setIQRoster(user, null, function () {
                    layer.msg('移动/复制到分组失败');
                });
                XoW.logger.me(this.classInfo + "$(document).on('click', 'div.layim_operaFriend li ul li', function() {");
            });


            $(document).on('click', 'div.layim_operaFriend li', function () {
                var index = $(this).index();
                var $li = $(this);
                var jid = $li.parent().attr('jid');


                switch (index) {
                    case 0 :
                    // 移动到分组
                    case 1 :
                        // 复制到分组
                        if ($li.find('ul').css('display') == 'none') {
                            var friendListsNames = gblMgr.getUserMgr().getFriendListsNamesCanMoveOrCopyTo(jid);
                            var html = '';
                            if (!friendListsNames.length) {
                                html += '<span>没有符合的分组</span>';
                            } else {
                                for (var i = 0; i < friendListsNames.length; i++) {
                                    html += '<li><a>' + friendListsNames[i] + '</a></li>';
                                }
                            }
                            $li.find('ul').html(html);

                            $li.find('ul').css({'display': 'block'});
                        } else {
                            $li.find('ul').css({'display': 'none'});
                        }
                        break;
                    case 2 :
                        XoW.logger.d(this.classInfo + "新建分组");
                        layer.prompt({title: '新分组名', type: 0}, function (newFriendListName) {
                            if ('' == $.trim(newFriendListName)) {
                                layer.msg('空分组名无效');
                                return;
                            }
                            var friendListNames = gblMgr.getUserMgr().getFriendListsNames();
                            for (var i = 0; i < friendListNames.length; i++) {
                                if ($.trim(newFriendListName) == $.trim(friendListNames[i])) {
                                    // 不提示。
                                    return;
                                }
                            }
                            gblMgr.getUserMgr().createFriendListByName(newFriendListName);
                        }.bind(this));
                        break;
                    case 3 :
                        XoW.logger.d(this.classInfo + "修改备注名");

                        var user = gblMgr.getUserMgr().getFriendByJid(jid);
                        layer.prompt({title: '新备注名', type: 0, val: user.name}, function (newName) {
                            if ('' == $.trim(newName)) {
                                // 名字为空不处理
                                layer.msg('空备注名无效');
                            }
                            if ($.trim(user.name) == $.trim(newName)) {
                                // 名字一样不处理
                                return;
                            }
                            // 这里设置了name就无法触发回调了，所以不设置
                            // user.name = newName;
                            gblMgr.getUserMgr().getRosterMgr().setIQRosterWay2(jid, newName, user.group, function () {
                                // 如果当前存在聊天界面，是与该用户相关的，那么更新其姓名
                                var $list = gblMgr.getViewMgr().getLayimChatmore("one", jid);
                                if ($list) {
                                    // 存在
                                    $list.find('span').html(newName); // 更改当前页面的显示值
                                    config.chating['one' + jid].name = newName; // 更改当前聊天窗口中其name值。
                                    if ($list.hasClass('layim_chatnow')) {
                                        // 如果是当前聊天的窗口，也要改变那个值。
                                        $list.parents('.layim_chatbox').find('h6 a.layim_names').html(newName);
                                    }
                                }
                            }, function () {
                                layer.msg('更改备注名失败');
                            });
                        }.bind(this));

                        break;
                    case 4 :
                        XoW.logger.d(this.classInfo + "查看简介");
                        var user = gblMgr.getUserMgr().getFriendByJid(jid);
                        gblMgr.getViewMgr().showVcard(user.vcard);

                        break;
                    case 5 :
                        XoW.logger.d(this.classInfo + "删除好友");
                        var user = gblMgr.getUserMgr().getFriendByJid(jid);
                        $.layer({
                            shade: [0],
                            area: ['auto', 'auto'],
                            dialog: {
                                msg: '确定删除该好友[' + user.name + '(' + jid + ')]？',
                                btns: 2,
                                type: 4,
                                btn: ['确定', '取消'],
                                yes: function (index) {
                                    // layer.msg('重要', 1, 1);
                                    gblMgr.getUserMgr().getRosterMgr().setIQRosterRemoveByFriend(user, null, function () {
                                        layer.msg('删除好友失败');
                                    });
                                    layer.close(index);
                                }, no: function (index) {
                                    // layer.msg('奇葩', 1, 13);
                                    layer.close(index);
                                }
                            }
                        });
                        break;
                    case 6 :
                        XoW.logger.d(this.classInfo + "移出分组");
                        var removeGroup = $li.parent().attr('thisGroup');
                        var user = gblMgr.getUserMgr().getFriendByJid(jid);

                        XoW.logger.d(this.classInfo + "删除分组");
                        for (var i = 0; i < user.group.length; i++) {
                            if (user.group[i] == removeGroup) {
                                // 删除
                                user.group.splice(i, 1);
                            }
                        }
                        // setIQRoster : function(userModel, successCb, errorCb, timeout) {
                        gblMgr.getUserMgr().getRosterMgr().setIQRoster(user, null, function () {
                            layer.msg('移出到分组失败');
                        });
                        break;
                }
            });

            /**
             * 好友列表中的菜单
             */
            $(document).on('mouseenter', 'div#xxim_top ul:first li.xxim_childnode', function () {

                // alert($(this).attr('data-id'));
                XoW.logger.ms(this.classInfo + "$(document).on('mouseenter', 'div#xxim_top ul:first li.xxim_childnode', function() {");

                var $li = $(this);
                var jid = $li.attr('data-id');
                var thisGroup = $li.parent().parent().find('span.xxim_parentname').text();

                var menuHtml = ''
                    + '<li><a>移动到分组</a><ul style="display:none" class="group move"></ul></li>'
                    + '<li><a>复制到分组</a><ul style="display:none" class="group copy"></ul></li>'
                    + '<li><a>新建分组</a></li>'
                    + '<li><a>修改备注名</a></li>'
                    + '<li><a>查看简介</a></li>'
                    + '<li><a>删除该好友</a></li>';

                var friend = gblMgr.getUserMgr().getFriendByJid(jid);
                if (friend.group.length > 1) {
                    // 如果有多个分组才显示移出该分组，
                    XoW.logger.d(this.classInfo + "分组数在1个以上");
                    menuHtml += '<li><a>移出该分组</a></li>';
                }

                var index = layer.tips(
                    '<div class="layim_operaFriend"><ul jid="' + jid + '" thisGroup="' + thisGroup + '">' + menuHtml
                    + '</ul></div>',
                    $(this).find('img').get(0), {
                        more: true,
                        guide: 3,
                        // isGuide: true,
                        // maxWidth: 200,
                        style: ['width: 150px', 'padding:0px 0px 0px 0px', 'margin:0px', 'background-color: gray', 'color: black', '#78BA32']
                    }
                );
                var isEnter = false;
                $('#xubox_layer' + index).bind('mouseenter', function () {
                    // 鼠标移入了菜单中
                    isEnter = true;
                    // XoW.logger.d("enter index是" + index + " isEnter" + isEnter);
                });
                $('#xubox_layer' + index).bind('mouseleave', function () {
                    // 鼠标中菜单中移出了
                    // XoW.logger.d("leave index是" + index + " isEnter" + isEnter);
                    layer.close(index);
                });
                $(this).one('mouseleave', function () {
                    // 鼠标中该成员身上移出了
                    // XoW.logger.w("index是" + index);
                    setTimeout(function () {
                        // 5毫秒后打印
                        XoW.logger.d("mouseleave isEnter" + isEnter);
                        // 此时可能弹出了别的提示框，这个提示框可能已经关闭,不知道layer内部是如何处理的。
                        if (!isEnter) {
                            layer.close(index);
                        }
                    }, 500);
                });
            });


            /**
             * 会议室中列表的菜单。
             */
            $(document).on('mouseenter', '#layim_groups li', function () {
                // alert($(this).attr('data-id'));
                XoW.logger.ms(this.classInfo + "$(document).on('mouseenter', '#layim_groups li', function() {");

                var nick = $(this).find('span').html();

                var roomJid = gblMgr.getViewMgr().getChatnowJid();
                var room = gblMgr.getRoomMgr().getXmppRoom(roomJid); // 在Muc中的room
                if (null == room) {
                    XoW.logger.w("用户已不再该房间中");
                    return;
                }
                var occupant = room.roster[nick];
                if (null == occupant) {
                    XoW.logger.w("房间中不存在该成员");
                    return;
                }
                gblMgr.getRoomMgr().getRoomByJidFromServer(roomJid, function (params) {
                    // roomInMuc,room,对方
//				var params = {
//						stanza : roomInfoResult,
//						room : room,
//					};
                    var room1 = params.room;
                    var privilegeList = gblMgr.getRoomMgr().canDoList(room, room1, occupant);
                    var privilegeHtml = '';
                    for (var i = 0; i < privilegeList.length; i++) {
                        //privilegeHtml += '<li><button class="layui-btn layui-btn-mini layui-btn-normal" roomJid="' + roomJid + '" nick="' + nick + '" privilege="' + privilegeList[i] + '">' + privilegeList[i] + '</button></li>';
                        privilegeHtml += '<li><a roomJid="' + roomJid + '" nick="' + nick + '" privilege="' + privilegeList[i] + '" href="javascript:void(0);">' + privilegeList[i] + '</a></li>';
                    }
                    var index = layer.tips(
                        '<div class="layim_roomprivilegecando"><ul>' + privilegeHtml
                        + '</ul></div>',
                        $(this).find('span').get(0), {
                            guide: 1,
                            // isGuide: true,
                            // maxWidth: 200,
                            style: ['width: 150px', 'padding:0px 0px 0px 0px', 'margin:0px', 'background-color: gray', 'color: black', '#78BA32']
                        }
                    );
                    var isEnter = false;
                    $('#xubox_layer' + index).bind('mouseenter', function () {
                        // 鼠标移入了菜单中
                        isEnter = true;
                        XoW.logger.w("enter index是" + index + " isEnter" + isEnter);
                    });
                    $('#xubox_layer' + index).bind('mouseleave', function () {
                        // 鼠标中菜单中移出了
                        XoW.logger.w("leave index是" + index + " isEnter" + isEnter);
                        layer.close(index);
                    });
                    $(this).one('mouseleave', function () {
                        // 鼠标中该成员身上移出了
                        XoW.logger.w("index是" + index);
                        setTimeout(function () {
                            // 5毫秒后打印
                            XoW.logger.w("mouseleave isEnter" + isEnter);
                            // 此时可能弹出了别的提示框，这个提示框可能已经关闭,不知道layer内部是如何处理的。
                            if (!isEnter) {
                                layer.close(index);
                            }
                        }, 500);
                    });

                }.bind(this), function () {
                    XoW.logger.w("不存在房间");
                    return;
                }.bind(this));
                XoW.logger.me(this.classInfo + "$(document).on('mouseenter', '#layim_groups li', function() {");
            });


            /**
             * 拒绝邀请
             */
            $(document).on('click', '#layim_roomdeny', function () {
                var $tr = $(this).parent().parent().parent();
                $(this).parent().html('<span>已拒绝</span>');
                var id = $tr.attr('id');

                // 加入房间，在agree()中会判断，如果此人已在房间里，则不做任何事。仅修改
                // 当前info的status=agree
                // 先获得该Info，判断其类型，再做对应操作
                var info = gblMgr.getViewMgr().getInfoById(id);

                info.status = 'deny';

                // var roomInviteInfo = gblMgr.getRoomMgr().getRoomInviteInfoById($tr.attr('id'));
                var info = gblMgr.getViewMgr().getInfoById(id);
                switch (info.type) {
                    case 'invite' :
                        gblMgr.getRoomMgr().denyInvite(info.from, info.params.inviteFrom);
                        break;
                    case 'subscribe' :
                        // 移除分组选择框
                        $('.layim_subscribegroupnames', $tr).remove();

                        gblMgr.getUserMgr().denyFirendSubscribe(info.from);
                        break;
                }
            });

            /**
             * 好友分组选择框选择之后
             */
            $(document).on('change', '#groupSelect', function () {
                XoW.logger.ms(this.classInfo + "$(document).on('change', '#groupSelect', function() {', function() {");
                var $this = $(this);
                var $select = $('option:selected', $this);
                // alert($select.text());
                $this.siblings('#newFriendList').val($select.text());
                // $('select option:selected', $tr).text()
                XoW.logger.me(this.classInfo + "$(document).on('change', '.layim_subscribegroupnames select', function() {");
            });
            $(document).on('change', '#groupSelect2', function () {
                XoW.logger.ms(this.classInfo + "$(document).on('change', '#groupSelect', function() {', function() {");
                var $this = $(this);
                var $select = $('option:selected', $this);
                // alert($select.text());
                $this.siblings('#newFriendList2').val($select.text());
                // $('select option:selected', $tr).text()
                XoW.logger.me(this.classInfo + "$(document).on('change', '.layim_subscribegroupnames select', function() {");
            });

            $(document).on('click', '#layim_roomagree', function () {
                XoW.logger.ms(this.classInfo + "在消息盒子中点了同意");

                // 获得所在行
                var $tr = $(this).parent().parent().parent();
                var id = $tr.attr('id');

                // 先获得该Info，判断其类型，再做对应操作
                var info = gblMgr.getViewMgr().getInfoById(id);
                switch (info.type) {
                    case 'invite' :

                        XoW.logger.d(" 是个invite节");
                        // 加入房间，在agree()中会判断，如果此人已在房间里，则不做任何事。仅修改
                        if (gblMgr.getRoomMgr().isCurrentUserAlreadyInRoom(roomJid)) {
                            layer.msg("你已在该会议室中！");
                            $(this).parent().html('<span>已同意</span>');
                            info.status = 'agree';
                            return;
                        } else if ('offline' === gblMgr.getViewMgr().getNowState()) {
                            layer.msg("离线状态无法进入会议室，请先更改状态");
                            return;
                        }

                        // 房间邀请处理
                        $(this).parent().html('<span>已同意</span>');
                        info.status = 'agree';

                        // var roomInviteInfo = gblMgr.getRoomMgr().getRoomInviteInfoById($tr.attr('id'));
                        var roomJid = info.from;
                        var address = XoW.utils.getNodeFromJid(roomJid);
                        gblMgr.getRoomMgr().getRoomByJidFromServer(roomJid, function (params) {
//						var params = {
//								stanza : stanza,
//								room : room,
//							};
                            var room = params.room;
                            html = '<li data-id="' + roomJid + '" class="xxim_childnode" type="group"><span  class="xxim_onename" >' + room.name + ' | ' + address + '</span><em class="xxim_time"></em></li>';
                            xxim.popchatbox($(html));

                            // 弹出输入昵称的对话框
                            var nick = XoW.utils.getNodeFromJid(gblMgr.getCurrentUser().getJid());
                            layer.prompt({title: '您要使用的昵称', type: 0, val: nick,}, function (name) {
                                if (name) {
                                    nick = name;
                                }
                                if (null !== roomJid) {
                                    gblMgr.getRoomMgr().joinRoom(roomJid, nick, info.params.password);
                                }
                            }.bind(this));
                        }, function (errorCb) {
                            layer.msg('未知错误！');
                        });
                        break;
                    case 'subscribe' :
                        // 好友添加处理
                        XoW.logger.d(" 是个subscribe节");

                        // 有两种情况。
                        // 其一。

                        // 获取分组
                        var groupName = $.trim($('#newFriendList', $tr).val());
//					var groupName = $('select option:selected', $tr).text();
                        if (!groupName) {
                            layer.msg("请选择分组或者先新建分组！");
                            info.status = 'untreated';
                            return;
                        }
                        // 移除分组选择框
                        $('.layim_subscribegroupnames', $tr).remove();
                        // 状态改成已同意
                        $(this).parent().html('<span>已同意</span>');
                        info.status = 'agree';

                        // 发送 iq roster set ，要改变 界面，是加一个？还是全部刷新？
                        var user = gblMgr.getUserMgr().getNewUser(XoW.utils.getBareJidFromJid(info.from));
                        user.name = XoW.utils.getNodeFromJid(info.from);
                        user.group = [groupName]; // 暂时只有一个


                        // 向服务器发送iq roster set节
                        gblMgr.getUserMgr().getRosterMgr().setIQRoster(user, function (stanza) {

                            // set成功了。
                            // 如果关系是from，则说明我没有加他。请求加其为好友。。但是 如何获得关系呢？
                            // 还是说我就直接请求，不管他是不是已经是我的好友了。
                            gblMgr.getUserMgr().sendSubscribe(info.from);
                            // 发送同意节
                            gblMgr.getUserMgr().aggreeFriendSubscribe(info.from);
                            XoW.logger.d(this.classInfo + "处理完成");
                        }.bind(this), function (errorStanza) {
                            layer.msg('未知错误');
                            if (null == errorStanza) {
                                //请求超时
                            }
                        }.bind(this), 3000);

                        break;
                }
                /*
			info.status = 'agree';

			if('room' == info.type) {
				// 加入房间，在agree()中会判断，如果此人已在房间里，则不做任何事。仅修改
				// 当前info的status=agree
				$(this).parent().html('<span>已同意</span>');
				// var roomInviteInfo = gblMgr.getRoomMgr().getRoomInviteInfoById($tr.attr('id'));
				var roomJid = info.jid;
				var address = XoW.utils.getNodeFromJid(roomJid);

				gblMgr.getRoomMgr().getGroupChatRoomData(function() {
					var room = gblMgr.getRoomMgr().getRoomByJid(roomJid);

					html = '<li data-id="'+ roomJid +'" class="xxim_childnode" type="group"><span  class="xxim_onename" >'+ room.getName() + ' | ' + address +'</span><em class="xxim_time"></em></li>';
					xxim.popchatbox($(html));
					if(gblMgr.getRoomMgr().isCurrentUserAlreadyInRoom(roomJid)) {
						layer.msg("你已在该会议室中！");
						return;
					} else if('offline' === gblMgr.getViewMgr().getNowState()) {
						layer.msg("离线状态无法进入会议室，请先更改状态");
						return;
					}

					// 弹出输入昵称的对话框
					var nick = XoW.utils.getNodeFromJid(gblMgr.getCurrentUser().getJid());
					layer.prompt({title: '您要使用的昵称', type : 0, val : nick, }, function(name){
						if(name) {
							nick = name;
						}
						if(null !== roomJid) {
							gblMgr.getRoomMgr().joinRoom(roomJid, nick, info.password);
						}

					}.bind(this));
					// 必须要setTop，而且暂时只能用这种方式让其跑到最前面了。
					// XoW.logger.w('l的id是' + $(l).attr('id'));
					// layer.setTop(l);

				});
			} else if('subscribe' == info.type){

				var groupName = $('select option:selected', $tr).text();
				if(null == groupName || '' == groupName) {
					layer.msg("请选择分组或者先创建分组！");

					info.status = 'untreated';
					return;
				}
				$(this).parent().html('<span>已同意</span>');

				// 发送 iq roster set ，要改变 界面，是加一个？还是全部刷新？
				var userModel = new XoW.UserModel({
					jid : info.params.from,
					name : XoW.utils.getNodeFromJid(info.params.from),
					group : [groupName]
				});
//				this.jid = params.jid || "";
//				this.name = params.name || "";
//				this.group = params.group || [];
//				this.ask = params.ask || "";
//				this.subscription = params.subscription || "";

				// 将其设置到列表中
				gblMgr.getRosterMgr().setIQRoster(userModel, function(stanza) {
					// set成功了。
					// 发送同意节
					gblMgr.getUserMgr().aggreeFriendSubscribe(info.params.from);
					// 如果关系是from，则说明我没有加他。请求加其为好友
					// 如何获得关系呢？

					gblMgr.getPresenceMgr().sendSubscribe(info.params.from);
				}.bind(this), function(errorStanza) {
					if(null == errorStanza) {
						//请求超时
					}
				}.bind(this), 3000);

				// alert(groupName);
				// gblMgr.getUserMgr().aggreeFriendSubscribe(info.params.from);
			}
			//XoW.logger.me('layim_roomagree  click');
			*/

                XoW.logger.me(this.classInfo + "在消息盒子中点了同意");
            });


            /**
             * 点击聊天窗口上的用户名，弹出vcard的
             * 要进行改进，如果点击的是一个群的话，需要弹出群的信息。
             */
            $(document).on('click', 'a.layim_names', function () {
                // alert($('a.layim_names').text());
                XoW.logger.ms(this.classInfo + "viewActionsBinding 显示vcard");
                var jid = $('li.layim_chatnow').attr('data-id');
                var oneFriend = this._gblMgr.getUserMgr().getFriendByJid(jid);
                if (null == oneFriend) {
                    XoW.logger.d(this.classInfo + "viewActionsBinding 不是好友，是群组，返回");
                    return;
                }
                XoW.logger.d(this.classInfo + "viewActionsBinding 是好友，显示vcard");
                XoW.logger.me(this.classInfo + "viewActionsBinding");
                this.showVcard(oneFriend.getVcard());
            }.bind(this));


            // 点击聊天窗口上的表情
            $(document).on('click', 'i.layim_addface', function () {
                // this.p = $('#layim_write').caret('offset');
                // alert("添加表情");
//			$("#layim_write").focus();
                // document.getElementById('layim_write').focus();

                var html = this._faceHtml();
//			this.h = layer.tips(
//				html,
//				$('i.layim_addface'),{ // 跟随的对象是  $('i.layim_addface')
//					guide : "0", // 表示要在tip弹出在 $('i.layim_addface')上面
//			});
                var facebox = $('#layim_facebox');
                if (facebox.hasClass('layim_faceboxhidden')) {
                    $('#layim_chatarea').removeClass('layim_chatarea').addClass('layim_chatarea2');
                    $('#layim_chatarea').find('ul').removeClass('layim_chatview').addClass('layim_chatview2');
                    facebox.removeClass('layim_faceboxhidden').addClass('layim_facebox');
                    facebox.html(html);
                } else if (facebox.hasClass('layim_facebox')) {
                    $('#layim_chatarea').removeClass('layim_chatarea2').addClass('layim_chatarea');
                    $('#layim_chatarea').find('ul').removeClass('layim_chatview2').addClass('layim_chatview');
                    facebox.removeClass('layim_facebox').addClass('layim_faceboxhidden');
                    facebox.html("");
                }
                // $('<div class="layim_facebox" >这里来做表情框啦啦<div>').insertAfter('#layim_chatarea');


//			$("#SmohanFaceBox").attr("tabindex", "1"); // 为了能够触发blur，要设置tabindex
//			$("#SmohanFaceBox").focus(); // 必须先有焦点
//			$("#SmohanFaceBox").bind('blur',function() {
//				 // alert("失去焦点");
//				 // 失去焦点就关闭表情弹窗
//				 $("#SmohanFaceBox").parents(".xubox_layer").remove();
//			});

                $("#SmohanFaceBox li").bind('click', function () {

                    // 要添加的表情
                    var $this = $(this);
                    var face = gblMgr.getViewMgr().getFaceById($this.find('img').attr("faceid"));
                    var facehtml = '<img src="images/face/' + face.imgName + '.gif" faceid="' + face.faceid + '" alt="' + face.alt + '"/>';

                    // 设置光标位置
                    gblMgr.getViewMgr().writeFocus();

                    // 往光标位置插入表情
                    gblMgr.getViewMgr().insertFaceHtmlAtCaret(facehtml);

                    // 重新获取光标位置
                    gblMgr.getViewMgr().setCursorPropertiesWithNoDelay();
                    // window.getSelection().getRangeAt(0).insertNode($(facehtml).get(0));
                    /*
				// 在光标处插入表情
				var sel2, range2;
				if (window.getSelection) {
					// IE9 and non-IE
					sel2 = window.getSelection();
					if (sel2.getRangeAt && sel2.rangeCount) {
						range2 = sel2.getRangeAt(0);
						range2.deleteContents();
						// Range.createContextualFragment() would be useful here but is
						// non-standard and not supported in all browsers (IE9, for one)
						var el = document.createElement("div");
						el.innerHTML = facehtml;
						var frag = document.createDocumentFragment(), node, lastNode;
						while ( (node = el.firstChild) ) {
							lastNode = frag.appendChild(node);
						}
						range2.insertNode(frag);
						// Preserve the selection
						if (lastNode) {
							range2 = range2.cloneRange();
							range2.setStartAfter(lastNode);
							range2.collapse(true);
							sel2.removeAllRanges();
							sel2.addRange(range2);
						};
					};
				} else if (document.selection && document.selection.type != "Control") {
					// IE < 9
					document.selection.createRange().pasteHTML(facehtml);
				}
				*/

                });

                /*$("#SmohanFaceBox li").bind('click',function() {
				// alert("点击之前");

				var $this = $(this);
				// alert("点击了" + $this.find('img').attr("imgName"));
//		        $("#layim_write").insertContent('<img src="images/face/'+ $this.find('img').attr("imgName")+'.gif"/>');
		       // $("#layim_write").insertContent('aaa');
				//this.insertHTML($("#layim_write"), '<img src="images/face/1.gif"/>');
//				this.insertHTML($("#layim_write"), '<img src="images/face/'+ $this.find('img').attr("imgName")+'.gif"/>');
				// $("#layim_write").focus();
				var face = gblMgr.getViewMgr().getFaceById($this.find('img').attr("faceid"));
				var facehtml = '<img src="images/face/'+ face.imgName+'.gif" faceid="' + face.faceid + '" alt="'+face.alt+'"/>';
				 $("#layim_write").append(facehtml);


				// var t=$('#layim_write').html();
				//$('#layim_write').html("").focus().html(t+'1123');
				// $('#layim_write').text("123").focus();
				// $('#layim_write').text($('#layim_write').text() + "123");
				// var ele = $('#layim_write');
			//	$('#layim_write').focus();
//				 var testPassword = "181818";
//				    var tp;
//				    var cCode;
//				    var testss = document.getElementById("layim_write");
//				    for(var i=0;i<testPassword.length;i++){
//				        cCode = testPassword.charCodeAt(i);
//				        XoW.logger.w("触发了了");
//				        gblMgr.getViewMgr().fireKeyEvent(testss, "keydown", cCode);
//				        gblMgr.getViewMgr().fireKeyEvent(testss, "keypress", cCode);
//				        gblMgr.getViewMgr().fireKeyEvent(testss, "keyup", cCode);
//				    }

				//gblMgr.getViewMgr().setEndOfContenteditable(ele);
//			    gblMgr.getViewMgr().insertHtmlAtCaret(facehtml);
//			    this.insertHtmlAtCaret


				// $("#layim_write").focus();
				// 关闭表情框
				// $("#SmohanFaceBox").parents(".xubox_layer").remove();
				// alert("点击之后");
			});*/

            }.bind(this));


            // ok ------------------------------------

            /**
             * 点击发送/接受的图片以显示大图
             */
            $(document).on('click', 'div.layim_fileinfo img', function () {
                $this = $(this);
                //自定页
                $.layer({
                    type: 1,
                    title: false,
                    fix: false,
                    closeBtn: 0, //不显示关闭按钮
                    shadeClose: true, //开启遮罩关闭
                    page: {html: '<img style="position:relative;" src="' + $this.attr('src') + '"/>'}
                });
            });

            /**
             * 点停停止，终止接收文件
             */
            $(document).on('click', 'div.layim_fileReceiveState #fileStopReceive', function () {
                // alert('终止接收文件');
                var $this = $(this);
                var $pp = $this.parent().parent();
                var sid = $pp.attr("sid");
                var jid = gblMgr.getViewMgr().getChatnowJid();
                if (null != jid) {
                    gblMgr.getChatMgr().stopReceiveSendFile(jid, sid);
                }
            });

            /**
             * 绑定发送事件,发送文件
             */
            $(document).on('click', '.layim_addfile', function () {
                if (gblMgr.getCurrentUser().getState() == XoW.UserStateEnum.OFFLINE) {
                    layer.msg("您当前的是离线状态，无法发送文件！");
                    return;
                } else {
                    var friend = gblMgr.getUserMgr().getFriendByJid(gblMgr.getViewMgr().getChatnowJid());
                    if (null == friend) {
                        layer.msg("不存在该好友！");
                        return;
                    } else {
                        if (friend.state == XoW.UserStateEnum.OFFLINE) {
                            layer.msg("该好友当前的是离线状态，无法发送文件！");
                            return;
                        }
                    }
                }

                var $file = $('<input type="file" />');
                $file.click();

                $file.bind('change', function () {
                    var $this = $(this);
                    var $file = $this[0].files[0];
                    var reader = new FileReader();

                    var filename = $file.name;
                    var filesize = $file.size;
                    var filetype = $file.type;
                    reader.onload = function (e) {
                        // e.target.result 是base64编码后的流，他前面有  data:xxx;base64,
                        // 发送的时候要去掉
                        XoW.logger.w("发送文件的信息：" + filename + "  " + filesize + " " + e.target.result);
                        // 这样就只能通过gblMgr来获取view了，
                        gblMgr.getViewMgr().sendFile(filename, filesize, filetype, e.target.result);
                    };
                    if ($file) {
                        reader.readAsDataURL($file);
                    }
                });
            }.bind(this));

            /**
             * 绑定发送事件,发送图片
             *
             */
            $(document).on('click', '.layim_addimage', function () {
                if (gblMgr.getCurrentUser().getState() == XoW.UserStateEnum.OFFLINE) {
                    layer.msg("您当前的是离线状态，无法发送图片！");
                    return;
                } else {
                    var friend = gblMgr.getUserMgr().getFriendByJid(gblMgr.getViewMgr().getChatnowJid());
                    if (null == friend) {
                        layer.msg("不存在该好友！");
                        return;
                    } else {
                        if (friend.state == XoW.UserStateEnum.OFFLINE) {
                            layer.msg("该好友当前的是离线状态，无法发送图片！");
                            return;
                        }
                    }
                }

                // 构造一个file标签
                var $file = $('<input type="file" name="aa" accept="image/png,image/jpeg,image/gif,image/jpg"/>');
                // 手动触发点击事件
                $file.click();

                $file.bind('change', function () {
                    var $this = $(this);
                    var $file = $this[0].files[0];
                    var reader = new FileReader();
                    // 得到文件的信息
                    var filename = $file.name;
                    var filesize = $file.size;
                    var filetype = $file.type;
                    reader.onload = function (e) {
                        // e.target.result 是base64编码后的流，他前面有  data:xxx;base64,
                        // 发送的时候要去掉
                        // alert(e.target.result);
                        XoW.logger.w("发送图片，图片的信息是：" + filename + "  " + filesize + " " + e.target.result);
                        // 这样就只能通过gblMgr来获取view了，
                        gblMgr.getViewMgr().sendImg(filename, filesize, filetype, e.target.result);
                    };
                    if ($file) {
                        reader.readAsDataURL($file);
                    }
                });
            }.bind(this));


            /**
             * 对方发送给我文件时，点击接受或者拒绝接收触发事件的绑定。
             */
            $(document).on('click', 'div.layim_fileReceiveState a[value]', function () {
                XoW.logger.ms("'div.layim_fileReceiveState a[value]', function() { ");
                var $this = $(this);
                var $p = $this.parent();
                var $pp = $p.parent();
                // alert($this.attr('href') + "  " +$this.attr('value') + "  " + $this.attr('sid'));
                // 得到sid  this是a表情，parent() 是 div.layim_fileReceiveStat标签，再parent()之后是div.layim_file标签
                var sid = $pp.attr("sid");
                // 得到当前正在聊天的好友
                var jid = gblMgr.getViewMgr().getChatnowJid();
                if (null == jid) {
                    return;
                }
                // 默认false拒接。
                var isReceive = false;
                if ("receive" == $this.attr('value')) {
                    isReceive = true;
                }
                // 处理
                // 内部的处理，调用ChatManager中的处理
                gblMgr.getChatMgr().dealFileReceive(isReceive, sid, jid);
                // 界面中的处理 ：
                // 1,将  接受该文件或拒接字符串隐掉，
                // 2,如果是拒接，显示已拒绝接收该文件
                $p.html("");
                if (!isReceive) {
                    $p.html("您已拒绝接收该文件");
                }
                XoW.logger.me("'div.layim_filestate a', function() { ");
            });


            /**
             * 在输入框中按 ctrl+enter 发送消息
             */
            $(document).on('keyup mouseup', '#layim_write', function (event) {
                var $write = $('#layim_write');
                if ((13 == event.keyCode)  // 回车
                    || (8 == event.keyCode) // 退格
                    || (86 == event.keyCode && event.ctrlKey) // ctrl+v 粘贴
                ) {
                    var code = 0;
                    $write.find('br').each(function (i) {
                        $(this).attr('id', 'br' + code++);
                    });
                }
                if (13 == event.keyCode && event.ctrlKey) {
                    // ctrl+enter 发送消息。
                    // $('#layim_write br:last').remove();
                    $('#layim_write br:last').remove();
                    this.sendMessage();

                    //$write.html(""); // 清空
                    //$write.append('<br id="br0">'); // 添加一个<br>
                    $write.focus(); // 焦点
                    this.setCursorPropertiesWithNoDelay(); // 得到光标信息
                } else {
                    // 得到光标信息
                    this.setCursorPropertiesWithDelay();
                    $write.focus(); // 焦点
                }
            }.bind(this));

            /**
             * 绑定发送事件,发送消息
             */
            $(document).on('click', '#layim_sendbtn', function () {
                $('#layim_write br:last').remove();
                this.sendMessage();

                $write = $('#layim_write');
                $write.html(""); // 清空
                $write.append('<br id="br0">'); // 添加一个<br>
                $write.focus(); // 焦点
                this.setCursorPropertiesWithNoDelay(); // 得到光标信息
            }.bind(this));

            $(document).on('click', '#createRoom', function () {
                XoW.logger.ms(this.classInfo + "创建房间");

                // alert("创建房间");
                // '<li data-id="'+ id +'" class="xxim_childnode" type="group"><span  class="xxim_onename" >'+ name + ' | ' + address +'</span><em class="xxim_time">'+ peopleNumber +'</em></li>';
                // 先去获得房间，如果房间已存在，则弹出房间聊天界面。让用户点击加入。

                // var roomName = 'afterSales'.toLocaleLowerCase();

                var user = this._gblMgr.getCurrentUser();
                layer.prompt({title: '请输入房间的地址', type: 0}, function (roomName) {
                    if (!roomName) {
                        layer.msg("请输入有效的房间地址！");
                        return;
                    }
                    var roomServerAbility = this._gblMgr.getServerMgr().getAbilityByCategroy('conference', 'text');
                    if (!roomServerAbility) {
                        layer.msg("没有房间服务器！");
                        return;
                    }
                    var roomJid = roomName.toLocaleLowerCase() + "@" + roomServerAbility.jid;
                    this._gblMgr.getRoomMgr().getRoomByJidFromServer(roomJid, function (params) {
                        // 房间存在
//					var params = {
//							stanza : roomInfoResult,
//							room : room,
//						};
                        // 此时界面上已经有该房间 了，跳出房间
                        var room = params.room;
                        var $li = $('ul.xxim_chatlist li[data-id="' + XoW.utils.escapeJquery(room.jid) + '"][type="group"]');
                        if ($li.length > 0) {
                            xxim.popchatbox($li);
                            setTimeout(function () {
                                this.roomSystemMsgByRoomJid(params.room.jid, "您要创建的房间地址已被使用，该房间已存在！");
                            }.bind(this), 1000);
                        } else {
                            layer.msg("获取房间信息失败，房间jid :" + room.jid);
                        }
                    }.bind(this), function (errorStanza) {
                        var errorCode = $('error', $(errorStanza)).attr('code');
                        if (404 == errorCode) {
                            XoW.logger.d(this.classInfo + "房间不存在，可以创建该房间");

                            // roomJid, nick, from, successCb, errorCb
                            this._gblMgr.getRoomMgr().createRoom(roomJid,
                                XoW.utils.getNodeFromJid(user.getFullJid()),
                                user.getFullJid(), function (params) {
                                    //创建成功
//							var params = {
//									stanza : stanza,
//									roomJid : roomJid,
//									nick : nick,
//								};
                                    var roomJid = params.roomJid;
                                    var name = XoW.utils.getNodeFromJid(roomJid);
                                    var peopleNumber = 0;
                                    var nick = params.nick;

                                    XoW.logger.d('创建成功！' + roomJid + " " + name);
                                    var html = '<li data-id="' + roomJid + '" class="xxim_childnode" type="group"><span  class="xxim_onename" >' + name + ' | ' + name + '</span><em class="xxim_time">' + peopleNumber + '</em></li>';
                                    // var html
//							roomHtml : function(room) {
//						    	var id = room.jid;
//						    	var name = room.name;
//						    	var address = XoW.utils.getNodeFromJid(id);
//						        var peopleNumber =  room.getOccupants();
//							},
                                    xxim.popchatbox($(html));
                                    setTimeout(function () {
                                        this.roomSystemMsgByRoomJid(roomJid, "创建房间成功！当前房间为默认配置，请及时配置房间信息！");
                                        this._gblMgr.getCurrentUser().sendOnlineToRoom(roomJid);
                                    }.bind(this), 1000);

                                }.bind(this), function () {
                                    // 创建失败
                                    XoW.logger.d('创建失败');
                                });

                        } else {
                            layer.msg('未知错误，错误代码：' + errorCode);
                        }
                    }.bind(this));
                }.bind(this));
                XoW.logger.me(this.classInfo + "创建房间");
            }.bind(this));
            $(document).on('click', '#refreshRoom', function () {
                // alert("刷新房间");
                gblMgr.getRoomMgr().getAllRoomsFromServer(null, function () {
                    layer.msg("刷新失败");
                });

            }.bind(this));


            /**
             * 绑定加入该房间按钮
             */
            $(document).on('click', '#layim_joinRoom', function () {
                XoW.logger.ms(this.classInfo + "点击加入房间按钮");

                var roomJid = this.getChatnowJid();
                if (null == roomJid) {
                    XoW.logger.e("roomJid为空");
                    return;
                }
                XoW.logger.d("你要加入该房间了。" + roomJid);

                if (this._gblMgr.getRoomMgr().isCurrentUserAlreadyInRoom(roomJid)) {
                    layer.msg("你已在该会议室中！");
                    return;
                } else if (5 == this._gblMgr.getCurrentUser().getState()) {
                    // 5是离线
                    layer.msg("离线状态无法进入会议室，请先更改状态");
                    return;
                }
                // 默认昵称用 用户的node
                var nick = XoW.utils.getNodeFromJid(this._gblMgr.getCurrentUser().getJid());
                // 弹出输入昵称的对话框
                layer.prompt({title: '您要使用的昵称', type: 0, val: nick}, function (name) {
                    if (name) {
                        nick = name;
                    }
                    // 因为是点击界面上的加入按钮，所以说明是存在这个room的，因为它已经能够
                    // 被展示了。
                    var room = this._gblMgr.getRoomMgr().getRoomByJid(roomJid);
                    // 如果需要密码，还需要用户填写密码。
                    if (!room.isUnsecured()) {
                        layer.prompt({title: '进入该房间需要密码！', type: 1}, function (pwd) {
                            // password = pwd;
                            if (this._gblMgr.getRoomMgr().joinRoom(roomJid, nick, pwd)) {
                                XoW.logger.d("加入房间成功");
                            } else {
                                XoW.logger.e("加入房间失败");
                                // alert('加入失败');
                                layer.msg("加入失败");
                            }
                        }.bind(this));
                    } else {
                        if (this._gblMgr.getRoomMgr().joinRoom(roomJid, nick)) {
                            XoW.logger.d("加入房间成功");
                        } else {
                            XoW.logger.e("加入房间失败");
                            // alert('加入失败');
                            layer.msg("加入失败");
                        }
                    }
                    // 加入该房间后，将加入房间的按钮清除掉，不能在这里清除，因为不一定成功加入该房间
//	 			var div = '#' + XoW.utils.escapeJquery(roomJid) + '.layim_chatsay div[id="layim_joinRoom"]';
//				$(div).remove();

                }.bind(this));
                XoW.logger.me(this.classInfo + "点击加入房间按钮");
            }.bind(this));

            /**
             * 消息盒子
             */
            $(document).on('click', '#xxim_myinfo', function () {
                XoW.logger.ms('xxim_myinfo  click');
                this.showInfoBox();
            }.bind(this));
            $(document).on('mouseenter', '#xxim_mymsg i', function () {
                XoW.logger.ms('xxim_mymsg  click');
//			var intFather = setInterval(function(){
//				$('#xxim_mymsg i').stop(true,true).fadeOut(100).fadeIn(100);
//				// this.showInfoBox();
//			},600);
                $div = $('#xxim_mymsg div.xxim_mymsgbox');
                $div.show();
                $div.html(this._messageCenterMgr.getShowMessageHtml());
            }.bind(this));
            $(document).on('mouseleave', '#xxim_mymsg', function () {

                $div = $('#xxim_mymsg div.xxim_mymsgbox').hide();
            }.bind(this));

            /**
             * 状态改变
             */
            $(document).on('click', 'div.xxim_setonline', function () {
                alert('aa');
                XoW.logger.ms(this.classInfo + "改变状态");

                var $span = $(this);
                if ($span.hasClass('xxim_setoffline')) {
                    XoW.logger.d(this.classInfo + "离线");

                    // 离线
                } else if ($span.hasClass('xxim_setaway')) {
                    XoW.logger.d(this.classInfo + "离开");
                    // 离开
                } else if ($span.hasClass('xxim_setdnd')) {
                    XoW.logger.d(this.classInfo + "正忙");
                    // 正忙
                } else if ($span.hasClass('xxim_setchat')) {
                    XoW.logger.d(this.classInfo + "空闲");
                    // 空闲
                } else {
                    XoW.logger.d(this.classInfo + "在线");
                    // 在线

                }
                XoW.logger.me(this.classInfo + "改变状态");
            });

            // 取消加好友
            $(document).on('click', '#cancelAddStranger', function () {
                $(this).parents('.xubox_layer').remove();
            });
            // 确认添加好友
            $(document).on('click', '#sureAddStranger', function () {
                XoW.logger.ms(this.classInfo + "$(document).on('click', '#sureAddStranger', function() {");
                var $tr = $(this).parents('tr[id]');
                var jid = $tr.attr('id');
                var group = $.trim($('#newFriendList2', $tr).val());
                if (!group) {
                    layer.msg("请选择分组或者先新建分组！");
                    return;
                }
                // 发送iq roster set
                gblMgr.getUserMgr().getRosterMgr().setIQRosterWay2(jid, XoW.utils.getNodeFromJid(jid), [group], function () {
                    // 发送presence type = subscribe
                    gblMgr.getUserMgr().sendSubscribe(jid);
                }, function (errorStanza) {
                    XoW.logger.e(this.classInfo + " " + Strophe.serialize(errorStanza));
                    layer.msg("未知错误!");
                });

                $(this).parents('.xubox_layer').remove();
                XoW.logger.me(this.classInfo + "$(document).on('click', '#sureAddStranger', function() {");
            });

        },

        writeFocus: function () {
            var startNodeText;
            var endNodeText;
            var $write = $('#layim_write');
            $write.focus();
            var range = document.getSelection().getRangeAt(0);

            if (this.cursorProperties.startNodeIsDiv) {
                console.log('startNode是div');
                range.setStart(this.cursorProperties.startNodeBr, 0);
            } else {
                console.log('startNode不是div');
                startNodeText = this.cursorProperties.startNodeBr.prevObject;
                range.setStart(startNodeText.get(0), this.cursorProperties.startOffset);
            }
            if (this.cursorProperties.endNodeIsDiv) {
                console.log('endNode是div');
                range.setEnd(this.cursorProperties.endNodeBr, 0);
            } else {
                console.log('endNode不是div');
                endNodeText = this.cursorProperties.endNodeBr.prevObject;
                range.setEnd(endNodeText.get(0), this.cursorProperties.endOffset);
            }
        },

        cursorProperties: {
            startOffset: 0, // 光标位置
            startNodeIsDiv: false, // 是否是div
            startNodeBr: null, // 下一个br元素

            endNodeBr: null,
            endOffset: 0,
            endNodeIsDiv: false,
            timeoutHandler: null,
        },
        // 输入表情，发送消息后使用
        setCursorPropertiesWithNoDelay: function () {
            this.setCursorProperties();
        },
        // 输入普通信息时使用
        setCursorPropertiesWithDelay: function () {
            clearTimeout(this.cursorProperties.timeoutHandler);
            this.cursorProperties.timeoutHandler = setTimeout(function () {
                this.setCursorProperties();
            }.bind(this), 100);
        },
        setCursorProperties: function () {
            var sel = window.getSelection();
            var range = sel.getRangeAt(0);

            var startNode = range.startContainer;
            var startOffset = range.startOffset;
            var endNode = range.endContainer;
            var endOffset = range.endOffset;
            // var startNodeBr = startNode.nextElementSibling();
            // var endNodeBr = endNode.nextElementSibling();

            var $startNode = $(startNode);
            var $endNode = $(endNode);
            var startNodeIsDiv = false;
            var endNodeIsDiv = false;
            var startNodeBr;
            var endNodeBr;
            if ($startNode.is('div')) {
                // 不能用jquery的方式去取，因为他不会将文本节点也认为是一个节点
                // startNodeBr = $startNode.find(':eq('+startOffset+')');

                // 要用ff提供的机制去取。ff认为文本节点也是一个节点
                var childs = $startNode.get(0).childNodes;
                startNodeBr = childs[startOffset];
                startNodeIsDiv = true;
            } else {
                startNodeBr = $startNode.next();
            }
            if ($endNode.is('div')) {
                // endNodeBr = $endNode.find(':eq('+endOffset+')');
                var childs = $endNode.get(0).childNodes;
                endNodeBr = childs[endOffset];
                endNodeIsDiv = true;
            } else {
                endNodeBr = $endNode.next();
            }
            this.cursorProperties.startOffset = startOffset;
            this.cursorProperties.startNodeIsDiv = startNodeIsDiv;
            this.cursorProperties.startNodeBr = startNodeBr;
            this.cursorProperties.endNodeBr = endNodeBr;
            this.cursorProperties.endOffset = endOffset;
            this.cursorProperties.endNodeIsDiv = endNodeIsDiv;

            // console.log('startOffset:' + startOffset + "  startNodeIsDiv" + startNodeIsDiv);
            // console.log($(startNodeBr).attr('id'));
            // console.log('endOffset:' + endOffset + "  endNodeIsDiv" + endNodeIsDiv);
            // console.log($(endNodeBr).attr('id'));
            //console.log('位置信息-----------------');
            //console.log('开始位置信息：第' + $(startNodeBr).attr('id').substring(2) + '行,第' + startOffset + "个字符处，开始节点是不是div:" + startNodeIsDiv);
            //console.log('结束位置信息：第' + $(endNodeBr).attr('id').substring(2) + '行,第' + endOffset + "个字符处，结束节点是不是div:" + endNodeIsDiv);
            //console.log('位置信息-----------------');

            //console.log('here');
        },


        /**
         * 分析
         * 点击发送时的操作
         * 1，只输入字符，点击发送/回车
         *        send()函数中，将sendingConteng = div内容
         * 2,输入包含表情，点击发送
         *        send()函数中，将所有表情img 解析成表情对应的字符，
         *        其他的html标签，符号 转码掉（不转码发送一个aler试试）
         * 输入文本的时的操作
         * 1，只输入文本
         *        无需做任何事
         * 2，插入一个表情
         *
         */
        /**
         * 界面的上点击发送或者按下回车触发的发送事件。
         * 获取输入的字符串A（用户输入的是这个字符串）
         * 将表情解析成字符，<br>解析成\n 得到字符串B，（发送给对方的是这个字符串）
         * 将B中所有的字符串进行转码（因为怕用户输入了脚本) ,得到字符串C（我在界面再次显示的是这个字符串）
         *
         */
        sendMessage: function () {
            XoW.logger.ms(this.classInfo + "sendMessage");
            var imwrite = $('#layim_write'); // 输入框
            var toJid = this.getChatnowJid(); // 当前聊天的人的jid
            if (null == toJid) {
                return;
            }

            XoW.logger.d(this.classInfo + "sendMessage toJid是" + toJid);
            var $write = $('#layim_write');
            var temp = $write.html();
            $write.find('img').each(function (index, item) {
                var $item = $(item);
                //alert($item.is('img'));
                if ($item.is('img[faceid]')) { // 要有faceid的img才解析
                    // 如果用户传入了错误的faceid，oneFace为第一个表情。
                    var oneFace = this.getFaceById($item.attr("faceid"));
                    $item.replaceWith(oneFace.face); // 替换成表情
                }
            }.bind(this));
            $write.find('br[id]').each(function (index, item) {
                var $item = $(item);
                $item.replaceWith('\n'); // 替换成表情
            }.bind(this));

            // alert(layim_write.html());
            // return layim_write.html();


            // 将表情解析，<img src="" faceid="" /> 解析成对应的表情符号， 如  :)
            // var content = this.faceToString($('#layim_write'));
            // 将<br> 进行解析，解析成 \n
            // sendingContent = gblMgr.getViewMgr().faceToString(sendingContent);

            // 替换<br> 得到字符串B
//		var contentDiv = '<div>' + content + '</div>';
//		$(contentDiv).find('br').repalceWith('\n');
            //var replaceStr = '/<br id=*>/';
            //content = content.replace(replaceStr, 'g');
//		content = $(contentDiv).html();
//
//		content = content.replace(/<br>/g, "\n");
//		content = content.replace(/<br\/\>/g, "\n");
            var content = $write.html();
            content = content.replace(/\&nbsp;/g, " "); // 将 空格替换掉。
            // replace(/\s/g, '') 匹配任何空白字符，包括空格、制表符、换页符等等
            if (content.replace(/\s/g, '') === '') {
                layer.tips('发送内容不能为空！', '#layim_sendbtn', 2);
                imwrite.focus();
            } else {
                content = XoW.utils.xmlunescape(content);
                if (content.length > 20000) {
                    layer.alert("内容过长，请分段发送！");
                    $write.html(temp);
                    return;
                }
                $write.html('');

                // 敏感字符串替换
                // content = content.replace(/法轮功/g, "***");
                if ('group' === this.getChatnowType()) {
//	    		  群聊发送自己的信息，但是显示这条信息是通过自己接收到这条信息（因为是群聊，所以
//	    		  自己也会收到这条消息）后来显示的。
                    if (this._gblMgr.getRoomMgr().isRoomDomain(toJid)) {
                        this._gblMgr.getRoomMgr().sendRoomGroupchatMessage(content, toJid);
                    } else if (this._gblMgr.getOrgnizationMgr().isOrgDomain(toJid)) {
                        var group = this._gblMgr.getOrgnizationMgr().getGroupByGroupjid(toJid);
                        if (group) {
                            group.sendMessage(content);
                        }
                    }
                } else if ('one' === this.getChatnowType()) {
                    // 如果是单人聊天
                    if (this._gblMgr.getRoomMgr().isRoomDomain(toJid)) {
                        // 如果当前jid的domain是房间的domain，那么就是群内的私聊了。
                        this._gblMgr.getRoomMgr().sendRoomPrivateMessage(content, toJid);
                        this.popRoomPrivateMessage(toJid, content, 'me');
                    } else if (this._gblMgr.getOrgnizationMgr().isOrgDomain(toJid)) {
                        // 是群组内的私聊
                        var groupuser = this._gblMgr.getOrgnizationMgr().getGroupuserByGroupuserjid(toJid);
                        if (groupuser) {
                            groupuser.sendMessage(content);
                            this._messageCenterMgr.showMyMessage('groupprivate', toJid, content);
                        }
                    } else {
                        this._gblMgr.getChatMgr().sendMessage(content, toJid);
                    }
                } else {
                    XoW.logger.w("当前聊天类型不正确，类型为：" + this.getChatnowType());
                }
            }

            XoW.logger.me(this.classInfo + "sendMessage");
        },

        /**
         * 将body中包含的表情符号转成表情<img
         */
        StringToFace: function (body) {
            for (var i = 0; i < this.face.length; i++) {
                var oneFace = this.face[i];
                var replaceStr = oneFace.face;
                // 因为在第一步，body中的所有 <>等符号都已经转码了
                // 但是表情中使用到了这些符号   >:0   所以表情也要相应的转码，才能使之匹配。
                replaceStr = XoW.utils.xmlescape(replaceStr);
                // 上面的xmlescape只转码了这几个   & < > ' "
                // 所以还需要自己将一些  [  ]这些前面加上 反斜杠 \
                replaceStr = XoW.utils.faceParse(replaceStr);
                var rex = new RegExp(replaceStr, 'g');
                body = body.replace(rex, '<img src="images/face/' + oneFace.imgName + '.gif" alt="' + oneFace.alt + '" faceid="' + oneFace.faceid + '" />');
            }
            ;
            return body;
        },

        /**
         * 带表情的转成字符串
         * @param layim_write
         * @returns
         */
        faceToString: function (layim_write) {
            layim_write.find('img').each(function (index, item) {
                var $item = $(item);
                //alert($item.is('img'));
                if ($item.is('img[faceid]')) { // 要有faceid的img才解析
                    // 如果用户传入了错误的faceid，oneFace为第一个表情。
                    var oneFace = this.getFaceById($item.attr("faceid"));
                    $item.replaceWith(oneFace.face); // 替换成表情
                }
            }.bind(this));
            return layim_write.html();
        },


        insertFaceHtmlAtCaret: function (html) {
            var sel, range;

            // IE9 and non-IE
            sel = window.getSelection();
            range = sel.getRangeAt(0);

            range.deleteContents();
            if (this.cursorProperties.startNodeIsDiv || this.cursorProperties.endNodeIsDiv) {
                $(html).insertBefore($(this.cursorProperties.endNodeBr));

            } else {
                var el = document.createElement("div");
                el.innerHTML = html;
                var frag = document.createDocumentFragment(), node, lastNode;
                while ((node = el.firstChild)) {
                    lastNode = frag.appendChild(node);
                }
                range.insertNode(frag);
                // Preserve the selection
                if (lastNode) {
                    range = range.cloneRange();
                    range.setStartAfter(lastNode);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
                ;
            }
        },


        /**
         * 往当前光标处插入表情。
         */
        insertHtmlAtCaret: function (html) {
            var sel, range;
            if (window.getSelection) {
                // IE9 and non-IE
                sel = window.getSelection();
                if (sel.getRangeAt && sel.rangeCount) {
                    range = sel.getRangeAt(0);
                    range.deleteContents();
                    // Range.createContextualFragment() would be useful here but is
                    // non-standard and not supported in all browsers (IE9, for one)
                    var el = document.createElement("div");
                    el.innerHTML = html;
                    var frag = document.createDocumentFragment(), node, lastNode;
                    while ((node = el.firstChild)) {
                        lastNode = frag.appendChild(node);
                    }
                    range.insertNode(frag);
                    // Preserve the selection
                    if (lastNode) {
                        range = range.cloneRange();
                        range.setStartAfter(lastNode);
                        range.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                    ;
                }
                ;
            } else if (document.selection && document.selection.type != "Control") {
                // IE < 9
                document.selection.createRange().pasteHTML(html);
            }
            ;
        },


        /**
         * 表情选择框模板
         * @returns {String}
         */
        _faceHtml: function () {
            var faceimg = '';
            //通过循环创建60个表情，可扩展
            for (var i = 0; i < this.face.length; i++) {
                var face = this.face[i];
                // faceimg += '<li disabled="disabled"><a href="javascript:void(0)"><img src="images/face/' + face.imgName +'.gif" alt="' +face.alt+ '" faceid="'+face.faceid+'"/></a></li>';
                faceimg += '<li><img ondragstart="return false;" src="images/face/' + face.imgName + '.gif" alt="' + face.alt + '" faceid="' + face.faceid + '"/></li>';
            }
            ;
            var html =
                // style="width:400px; height:100px"
                '<div id="SmohanFaceBox" >'
                // +	'<span class="Corner"></span>'
                // +	'<div class="Content">'
                // +		"<h3><span>表情</span><a class='close' title='关闭'></a></h3>"
                + '<ul>' + faceimg + '</ul>'
                // +	'</div>'
                + '</div>';
            return html;
        },

        /**
         * 好友分组在线人数改变，触发的界面变化
         * @param groupId 分组id
         */
        /*
	_currentNums_cb : function(groupId) {
		XoW.logger.ms(this.classInfo + "_currentNums_cb()");


		var friendGroup = this._gblMgr.getUserMgr().getFriendGroupByGroupId(groupId);
		this.refreshCurrentNums(friendGroup);

		XoW.logger.me(this.classInfo + "_currentNums_cb()");
	},
	*/
        /*
	refreshCurrentNums : function(friendGroup) {
		XoW.logger.ms(this.classInfo + "refreshCurrentNums()");
		// 分组在线人数改变了，界面上对应的也要更新其显示

		XoW.logger.d(this.classInfo + "刷新人数的分组是：" + friendGroup.getName());

		liStr = "ul.xxim_list li[data-id='" + friendGroup.getGroupId() + "']";
		var li = $(liStr);
		var em = li.find("em"); // 在线人数作为这个标签的文本显示
		if(em.length.length == 0) {
			// 啥也不做
		} else {
			em.text("（" + friendGroup.getCurrentNums() + "/" + friendGroup.getTotalNums()+ "）");
		}

		XoW.logger.me(this.classInfo + "refreshCurrentNums()");
	},*/

        /**
         * 显示会议室分为两步，
         * 第一步先获取会议室
         * 第二步显示会议室
         * 因为js的原因，所以用回调来完成显示。
         */
        /*
	_showGroupPrepareData : function() {
		XoW.logger.ms(this.classInfo + "_showGroup()");

		var index = 1;
		// 此时是通知GroupChatMgr去获取群组消息。
		this._gblMgr.getRoomMgr().getGroupChatRoomData(this.showGroupCb.bind(this), this.noGroupCb.bind(this));
		var node = xxim.node;
		var myf = node.list.eq(index); // 第几个面板。 0是好友，1是群组，2是历史联系人
		myf.addClass('loading'); // 显示加载的gif

	    XoW.logger.me(this.classInfo + "_showGroup()");
	},
	showGroupCb : function() {
		this._showFriends(1);
	},

	noGroupCb : function() {
		// 没有分组的显示
		// 暂时这么做。。。因为这个还没有测试的到。还没出现没有会议服务器的情况
		alert("没有room信息，当前没有会议服务器");
	},
	*/




        /**
         * 显示vcard
         * @param vcard 需要要显示的vcard
         */
        showVcard: function (vcard) {

            if (null == vcard) {
                return;
            }
            var face = this.getUserFaceFromVcard(vcard);

            layer.tab({
                data: [
                    {
                        title: '个人', content:
                        "<table>"
                        + "	<tr>"
                        + "  	<td>姓名：</td>"
                        + "		<td>" + vcard.N.GIVEN + "</td>"
                        + "	</tr>"
                        + "	<tr>"
                        + "		<td>中间名：</td>"
                        + "		<td>" + vcard.N.MIDDLE + "</td>"
                        + "	</tr>"
                        + "		<td>姓：</td>"
                        + "		<td>" + vcard.N.FAMILY + "</td>"
                        + "	<tr>"
                        + "		<td>昵称：</td>"
                        + "		<td>" + vcard.NICKNAME + "</td>"
                        + "	<tr>"
                        + "		<td>电子邮件：</td>"
                        + "		<td>" + vcard.EMAIL + "</td>"
                        + "	</tr>"
                        + "</table>"
                    },

                    {
                        title: '商务', content:
                        "<table>"
                        + "	<tr>"
                        + "  	<td>公司：</td>"
                        + "		<td>" + vcard.ORG.ORGNAME + "</td>"
                        + "  	<td>职称：</td>"
                        + "		<td>" + vcard.TITLE + "</td>"
                        + "	</tr>"
                        + "	<tr>"
                        + "		<td>街道地址：</td>"
                        + "		<td>" + vcard.WORK.STREET_ADR + "</td>"
                        + "		<td>部门：</td>"
                        + "		<td>" + vcard.ORG.ORGUNIT + "</td>"
                        + "	</tr>"
                        + "		<td>城市：</td>"
                        + "		<td>" + vcard.WORK.LOCALITY_ADR + "</td>"
                        + "		<td>电话：</td>"
                        + "		<td>" + vcard.WORK.VOICE_TEL + "</td>"
                        + "	<tr>"
                        + "		<td>州/省：</td>"
                        + "		<td>" + vcard.WORK.REGION_ADR + "</td>"
                        + "		<td>传真：</td>"
                        + "		<td>" + vcard.WORK.FAX_TEL + "</td>"
                        + "	<tr>"
                        + "		<td>邮政编码：</td>"
                        + "		<td>" + vcard.WORK.PCODE_ADR + "</td>"
                        + "		<td>传呼机：</td>"
                        + "		<td>" + vcard.WORK.PAGER_TEL + "</td>"
                        + "	</tr>"
                        + "	<tr>"
                        + "		<td>国家：</td>"
                        + "		<td>" + vcard.WORK.CTRY_ADR + "</td>"
                        + "		<td>移动电话：</td>"
                        + "		<td>" + vcard.WORK.CELL_TEL + "</td>"
                        + "	</tr>"
                        + "	<tr>"
                        + "		<td></td>"
                        + "		<td></td>"
                        + "		<td>网页：</td>"
                        + "		<td>" + vcard.URL + "</td>"
                        + "	</tr>"
                        + "</table>"
                    },

                    {
                        title: '家庭', content:
                        "<table>"
                        + "	<tr>"
                        + "		<td>街道地址：</td>"
                        + "		<td>" + vcard.HOME.STREET_ADR + "</td>"
                        + "		<td>电话：</td>"
                        + "		<td>" + vcard.HOME.VOICE_TEL + "</td>"
                        + "	</tr>"
                        + "		<td>城市：</td>"
                        + "		<td>" + vcard.HOME.LOCALITY_ADR + "</td>"
                        + "		<td>传真：</td>"
                        + "		<td>" + vcard.HOME.FAX_TEL + "</td>"
                        + "	<tr>"
                        + "		<td>州/省：</td>"
                        + "		<td>" + vcard.HOME.REGION_ADR + "</td>"
                        + "		<td>传呼机：</td>"
                        + "		<td>" + vcard.HOME.PAGER_TEL + "</td>"
                        + "	<tr>"
                        + "		<td>邮政编码：</td>"
                        + "		<td>" + vcard.HOME.PCODE_ADR + "</td>"
                        + "		<td>移动电话：</td>"
                        + "		<td>" + vcard.HOME.CELL_TEL + "</td>"
                        + "	</tr>"
                        + "	<tr>"
                        + "		<td>国家：</td>"
                        + "		<td>" + vcard.HOME.CTRY_ADR + "</td>"
                        + "	</tr>"
                        + "</table>"
                    },

                    {
                        title: '头像', content:
                        // max-height没有用。。。
                        "<img id='img1' style='height:240px;max-width:100%;max-height:100%'><br>" +

                        "<script type='text/javascript'>$('#img1').attr('src','" + face + "')</script>"
                    }
                ],
                area: ['600px', '300px'], //宽度，高度
                //shade: [0],
            });

            // layer.setTop($(l));
        },

        getFaceById: function (faceid) {
            for (var i = 0; i < this.face.length; i++) {
                var oneFace = this.face[i];
                if (faceid == oneFace.faceid) {
                    return oneFace;
                }
            }
            ;
            // 如果没有找到该face，则返回第一个，防止图像不能显示
            return this.face[0];
        },

// 用spark的face ，     其中13和8一样的
        face: [
            {"faceid": "1", "imgName": "1", "face": " \>:o ", "alt": "发怒"},
            {"faceid": "2", "imgName": "2", "face": " :-\[ ", "alt": "不开心"},
            {"faceid": "3", "imgName": "3", "face": " \?:\| ", "alt": "疑问"},
            {"faceid": "4", "imgName": "4", "face": " B-\) ", "alt": "酷"},
            {"faceid": "5", "imgName": "5", "face": " :'\( ", "alt": "哭"},
            {"faceid": "6", "imgName": "6", "face": " \]:\) ", "alt": "笑"},
            {"faceid": "7", "imgName": "7", "face": " :-D ", "alt": "呲牙"},
            {"faceid": "8", "imgName": "8", "face": " :-\) ", "alt": "微笑"},
            {"faceid": "9", "imgName": "9", "face": " :\^0 ", "alt": "大笑"},
            {"faceid": "10", "imgName": "10", "face": " :x ", "alt": "亲吻"},
            {"faceid": "11", "imgName": "11", "face": " ;\\ ", "alt": "奸笑"},
            {"faceid": "12", "imgName": "12", "face": " :-\( ", "alt": "难过"},
            {"faceid": "13", "imgName": "13", "face": " :-\) ", "alt": "微笑"},
            {"faceid": "14", "imgName": "14", "face": " :\| ", "alt": "14"},
            {"faceid": "15", "imgName": "15", "face": " :0 ", "alt": "吃惊"},
            {"faceid": "16", "imgName": "16", "face": " :-p ", "alt": "吐舌"},
            {"faceid": "17", "imgName": "17", "face": " ;-\) ", "alt": "眨眼"},
            {"faceid": "18", "imgName": "18", "face": " \(!\) ", "alt": "未知"},
            {"faceid": "19", "imgName": "19", "face": " \(i\) ", "alt": "未知"},
            {"faceid": "20", "imgName": "20", "face": " \(-\) ", "alt": "未知"},
            {"faceid": "21", "imgName": "21", "face": " \(+\) ", "alt": "未知"},
            {"faceid": "22", "imgName": "22", "face": " \(heart\) ", "alt": "爱心"},
        ],


    };


    return XoW;
}));