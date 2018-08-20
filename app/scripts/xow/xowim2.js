/**
 * 界面操作下发
 */

(function (factory) {
    // 暂时不用amd那个东西，因为还不知道那个的具体用处
    window.XoW = factory(Strophe);
}(function (Strophe) {
    var XoW;
    XoW = {
        VERSION: "1.0",
        // 命名空间
        NS: {
            PING: "urn:xmpp:ping",
            VCARD: "vcard-temp",
            USER_SERACH: "jabber:iq:search",
            FORM_DATA: "jabber:x:data",
            ARCHIVE: "urn:xmpp:archive",
            FW_ORGNIZATION: 'http://facewhat.com/orgnization',
        },
        // 节类型
        StanzaType: {
            SET: "set",
            GET: "get",
            RESULT: "result",
            ERROR: "error"
        },
    };
    return XoW;
}));

(function (factory) {
    return factory(XoW);
}(function (XoW) {

    /**
     *
     * @param options 参数
     *    loginStateAId
     *        用来显示登录状态的A标签的id。
     */
    XoW.GlobalManager = function () {
        this._connMgr = null;
        this._viewMgr = null;
        this._rosterMgr = null;
        this._userMgr = null;
        this._vcardMgr = null;
        this._presenceMgr = null;
        this._chatMgr = null;
        this._roomMgr = null;
        this._messageArchiveMgr = null;
        this._orgnizationMgr = null;
        this._serverMgr = null; // 服务器管理对象
        this._currentUser = null; // 当前登录用户
        this._currentUserJid = ''; // 当前用户jid
        this._currentUserPwd = ""; // 当前登录用户密码
        // 用于打日志的时候显示是该类内部的方法调用的打日志。
        this.classInfo = "【GlobalManager】";
        this._init();
    };

    XoW.GlobalManager.prototype = {
        /**
         * 初始化方法，做一些初始化
         */
        _init: function () {
            XoW.logger.ms(this.classInfo + "_init()");

            // 新建连接管理对象
            this._connMgr = new XoW.ConnectionManager(this);

            // 将登录结果的回调函数放入其中
            this._connMgr.addHandlerToConnMgr('loginCb', this._connectCb.bind(this));

            // 新建界面管理对象
            this._viewMgr = new XoW.ViewManager(this);

            XoW.logger.me(this.classInfo + "_init()");
        },

        /**
         * 得到各种管理对象。这种方式就和OPenfire提供了很多单例类类似。。
         * 这种方式和老师说的以命令的方式，谁比较好？
         * 感觉使用命令方式，调用者会不会很困惑？
         * 命令模式开放的接口是：
         * get(params) ?
         * 还是比如获取各种Manager的时候就是
         * getManager(params) ?
         *
         */
        /**
         * 现在的控制权在strophe中 。如果我想要控制所有节的走向
         * 那么。就不能使用strophe的扩展插件了。
         */
        getConnMgr: function () {
            XoW.logger.d(this.classInfo + "获取了_connMgr 对象");
            return this._connMgr;
        },
        getUserMgr: function () {
            XoW.logger.d(this.classInfo + "获取了 _userMgr 对象");
            return this._userMgr;
        },
        getRosterMgr: function () {
            XoW.logger.d(this.classInfo + "获取了 _rosterMgr 对象");
            return this._rosterMgr;
        },
        getViewMgr: function () {
            XoW.logger.d(this.classInfo + "获取了 _viewMgr 对象");
            return this._viewMgr;
        },
        getVcardMgr: function () {
            XoW.logger.d(this.classInfo + "获取了 _vcardMgr 对象");
            return this._vcardMgr;
        },
        getPresenceMgr: function () {
            XoW.logger.d(this.classInfo + "获取了 _presenceMgr 对象");
            return this._presenceMgr;
        },
        getChatMgr: function () {
            XoW.logger.d(this.classInfo + "获取了 _chatMgr 对象");
            return this._chatMgr;
        },
        getRoomMgr: function () {
            XoW.logger.d(this.classInfo + "获取了 _roomMgr 对象");
            return this._roomMgr;
        },
        getServerMgr: function () {
            XoW.logger.d(this.classInfo + "获取了 _serverMgr 对象");
            return this._serverMgr;
        },
        getCurrentUser: function () {
            XoW.logger.d(this.classInfo + "获取了 _currentUser 对象");
            return this._currentUser;
        },
        // 返回当前服务器名称，这个方法有点不妥。
//	getCurrentServer : function() {
//		XoW.logger.d(this.classInfo + "getCurrentServer");
//		return XoW.utils.getDomainFromJid(this._currentUser.getJid());
//	},
        getMessageArchiveMgr: function () {
            XoW.logger.d(this.classInfo + "获取了 _messageArchiveMgr 对象");
            return this._messageArchiveMgr;
        },

        getOrgnizationMgr: function () {
            XoW.logger.d(this.classInfo + "获取了 _orgnizationMgr 对象");
            return this._orgnizationMgr;
        },

        /**
         * 新建XoW.Connection对象并开始连接
         * @param serviceURL 服务器URL
         * @param username 用户名，不包含后面的ip等
         * @param pass 密码
         */
        connect: function (serviceURL, username, pass) {
            XoW.logger.ms(this.classInfo + "connect()");
            XoW.logger.p({"serviceURL": serviceURL, "username": username, "pass": pass});

            // 得到jid
            this._currentUserJid = username + "@" + XoW.utils.getIPFromURL(serviceURL);
            console.log("打印出来看看： "+this._currentUserJid);
            // this._currentUser.setJid(jid);
            this._currentUserPwd = pass;

            // 开始连接_currentUserJid
            this._connMgr.connect(serviceURL, this._currentUserJid, this._currentUserPwd);
            this._connMgr.addHandler(function (stanza) {
                XoW.logger.d("open-->" + Strophe.serialize(stanza));
            }, null, 'open');

            XoW.logger.me(this.classInfo + "connect()");
        },
        /**
         * 登录结果回调
         * @param params 包含
         *  success{boolean} 登录成功返回true，其他返回false
         *  msg 登录结果消息
         *  cond 登录结果代码，参考Strophe的登录结果代码
         */
        _connectCb: function (params) {
            var success = params.success;
            var msg = params.msg;
            var cond = params.cond;

            XoW.logger.ms(this.classInfo + "_connectCb()");
            XoW.logger.p({"success": success, "msg": msg, cond: cond});

            if (success) { // 登录成功
                XoW.logger.i(this.classInfo + "登录成功");

                // 初始化一些登录之后才要/才能初始化的管理器
                this._initManager();
                // 做一些动作
                this._actions();


            } else {
                XoW.logger.i(this.classInfo + "登录失败");
            }

            XoW.logger.me(this.classInfo + "_connectCb()");
            return true;
        },

        /**
         * 登录成功后才初始化的一些Manager
         */
        _initManager: function () {
            XoW.logger.ms(this.classInfo + "_initManager()");

            // 新建聊天管理对象
            this._chatMgr = new XoW.ChatManager(this);

            // 新建好友管理对象
            this._userMgr = new XoW.UserManager(this);

            // 新建房间管理对象
            this._roomMgr = new XoW.RoomManager(this);

            // 历史消息管理对象
            this._messageArchiveMgr = new XoW.MessageArchiveManager(this);

            // 组织结构树管理对象
            this._orgnizationMgr = new XoW.OrgnizationManager(this);

            // 在初始化userMgr之后就要调用这个，这个应该是界面来监听的。。
            this._viewMgr._afterInitUserMgr();

            // 当前登录用户
            this._currentUser = new XoW.User(this._userMgr);
            //this._currentUser.setJid();
            // 设置状态为在线。1是在线，因为刚开始登录的时候，有收不到自己出席的节的时候。
            this._currentUser.setState(1);


            // this._currentUser.setUserMgr(this._userMgr);

            // 初始化会议室聊天管理
            // this._roomMgr = new XoW.RoomManager(this);

            // 当前用户的出席节监听
            //this._presenceMgr.addPresenceHandler(this._presence_cb.bind(this));

            // 新建花名册管理对象
            //this._rosterMgr = new XoW.RosterManager(this);


            XoW.logger.me(this.classInfo + "_initManager()");
        },
        /**
         * 各种动作，请求好友列表，发送出席节等
         */
        _actions: function () {
            XoW.logger.ms(this.classInfo + "_actions()");

            // var userJid = this.getCurrentUser().getJid();
            // var ip = XoW.utils.getIPFromURL(userJid);


            // 此时才开始请求好友列表
            this._currentUser.getRosterFromServer(function (params1) {
                XoW.logger.d(this.classInfo + "请求roster完成");
                // 此时开始请求用户的个人vcard
                this._currentUser.getVcardFromServer(function (params2) {
                    XoW.logger.d(this.classInfo + "请求vcard完成");
//				var params = {
//						vcard : vcardTemp , 
//						vcardStanza : stanza,
//				};
                    // 因为刚开始未初始化 currentUser中的数据，所以jid,res
                    // 这些东西都为空。所以无法在presence中做（presence要比对from==jid），
                    // 还有另外一个原因就是感觉有时候没能够收到自己的presence
                    // 而且请求vcard也在发送presence之前。
                    var $vStanza = $(params2.vcardStanza);
                    var jid = $vStanza.attr('to');
                    var pureJid = XoW.utils.getBareJidFromJid(jid);
                    var res = XoW.utils.getResourceFromJid(jid);
                    // 设置用户的纯jid
                    this._currentUser.setJid(pureJid);
                    this._currentUser.setResource(res);

                    // 在内部已经有setVcard和setFace的操作了
                    // this._currentUser.setVcard(params.vcard);
                    // this._currentUser.setFace(params.vcard.PHOTO.BINVAL);


                    // 在这里获得服务器的一些信息。
                    // 先用jid的node来做name，后面可能用到vcard里面的name
                    // this._currentUser.setName(XoW.utils.getNodeFromJid(this._currentUser.getJid()));
                    // 在这里一定可以保证 当前用户已经是   node@domain/resource而不是  node@ip ？

                    // 新建服务管理的对象
                    // 请求服务这个用到了 用户的域（node@domain/res)所以，要在
                    // 上面该用户设置完pureJid后才能初始化。因为这个服务对象一初始化
                    // 就会请求服务器。
                    this._serverMgr = new XoW.ServerMananger(this);
                    // 此处请求所有的会议室，会议室管理对象是依赖服务管理对象
                    // 因为只有存在 会议服务之后，才存在会议室管理服务。


                    // 第一个出席节的发送至关重要，因为它告诉服务器“我”上线了，然后服务器会把：
                    // 所以一定要在这之前把一些该做的事做完，比如加载好友列表，加好一些监听器。
                    // 1,好友的出席情况发给我，
                    // 2,离线消息发给我
                    // 3,还有其他的一些 东西，比如 有人加我为好友。
                    setTimeout(function () {

                        XoW.logger.d(this.classInfo + "发送出席节");
                        // 发送出席
                        this._currentUser.sendOnline();
                        // 请求房间列表
                        // this._roomMgr.getAllRoomsFromServer();

                        /*this._viewMgr._showOrganization();*/
                        this._orgnizationMgr._start(); // 启动。
                        this._roomMgr._start(); // 启动
                    }.bind(this), 1000);

                }.bind(this), function (errorStanza) {
                    alert("获取用户vcard失败！");
                });
            }.bind(this), function (errorStanza) {
                alert("获取好友列表失败！");
            });


        },


    };
    return XoW;
}));


