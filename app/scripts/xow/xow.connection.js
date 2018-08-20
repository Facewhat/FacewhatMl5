
(function(factory) {
		return factory(XoW);
	}(function(XoW) {
		"use strict";
/**
 * @param globalManager XoW.GlobalManager对象
 * 用于管理连接的。
 */
XoW.ConnectionManager = function(globalManager) {
	this._gblMgr = globalManager;
	this._stropheConn = null;
	// 可监听  
	// 1， loginCb 登录回调
	this.handler = null;
	this.classInfo = "【ConnectionManager】";
	this._init();
};

XoW.ConnectionManager.prototype = {
	_init : function() {
		XoW.logger.ms(this.classInfo + "_init()");
		
		// 初始化handler对象
		this.handler = new XoW.Handler();
		
		XoW.logger.me(this.classInfo + "_init()");
	},

	/**
	 * 重写Strophe.Connection的rowInput和rowOutput方法
	 * 用来打印报文到指定 divId的div中。
	 * 如果divId不存在则说明不需要打日志
	 * 该方法该不该放在这？
	 */
	_rawInputOutput : function() {
		XoW.logger.ms(this.classInfo + "_rawInputOutput()");
		
		this._stropheConn.rawInput = function(data) {
			XoW.logger.receivePackage(data);
		}.bind(this);
		this._stropheConn.rawOutput = function(data) {
			XoW.logger.sendPackage(data);
		}.bind(this);
		XoW.logger.me(this.classInfo + "_rawInputOutput()");
	},
	
	/**
	 * 获得_StropheConn
	 * @returns {___anonymous__stropheConn}
	 */
	getStropheConnection : function() {
		return this._stropheConn;
	},
	
   /**public  
    * 
    * 连接服务器
    * @param serviceURL
    * @param jid
    * @param pass
    * @param cb 传过来的回调函数，用于返回连接的结果
    */
	connect : function(serviceURL, jid, pass) {
		XoW.logger.ms(this.classInfo + "connect()");
		
		// 新建一个Strophe.Connection对象，此时并未开始连接服务器
		this._stropheConn = new Strophe.Connection(serviceURL);
		// 重写Stroope的rowInput/Ouput方法用于打印报文。
		this._rawInputOutput();
		// 连接服务器
		this._stropheConn.connect(jid, pass, this._connectCb.bind(this));
		
		XoW.logger.me(this.classInfo + "connect()");
	},
	/**
	 * Strophe.Connection.connect方法的回调函数
	 * @param cond 登录结果代码
	 */
	_connectCb : function(cond) {
		XoW.logger.ms(this.classInfo + "_connectCb()");
		XoW.logger.p({"cond" : cond});
		var msg = "";
		var success = false;
		if(cond == Strophe.Status.Error){
			msg = " 发生错误！";
		} else if(cond == Strophe.Status.CONNECTING){
			msg = " 连接中...";
		} else if(cond == Strophe.Status.CONNFAIL){
			msg = " 连接失败！";
		} else if(cond == Strophe.Status.AUTHENTICATING){
			msg = " 身份认证中...";
		} else if(cond == Strophe.Status.AUTHFAIL){
			msg = " 身份认证失败！";
		} else if(cond == Strophe.Status.CONNECTED){
			msg = " 登录成功！";
			success = true;
		} else if(cond == Strophe.Status.DISCONNECTED){
			msg = " 连接已断开！";
		} else if(cond == Strophe.Status.DISCONNECTING){
			msg = " 断开连接中...";
		} else if(cond == Strophe.Status.ATTACHED){
			msg = " 附加！";
		} else if(cond == Strophe.Status.REDIRECT){
			msg = " 重定向！";
		} else if(cond == Strophe.Status.CONNTIMEOUT){
			msg = " 连接超时！";
		} 
		
		var params = {
				success: success, // 成功true，失败false
				msg : msg, // 具体链接信息
				cond : cond // Strophe中定义的状态码
		};
		this.triggerHandlerInConnMgr('loginCb', params);
		
		XoW.logger.me(this.classInfo + "_connectCb()");
		return true;
	},

	/**public
	 * 发送节
	 * @param target 节
	 */
	send : function(target) {
		XoW.logger.ms(this.classInfo + "send()");
		
    	this._stropheConn.send(target);
    	
    	XoW.logger.me(this.classInfo + "send()");
    },
    disconnect : function(reason) {
    	this._stropheConn.disconnect(reason);
    }, 
    /**
     * 发送节，对Strophe本身的sendIQ的一层封装
     * @param elem 发送的元素
     * @param callback(result节) 成功的回调，会返回节
     * @param errback(error节)
     * @param timeout 设置超时
     * @returns 返回的发送的iq节的id。
     */
    sendIQ : function(elem, callback, errback, timeout) {
    	XoW.logger.ms(this.classInfo + "sendIQ()");
    	
    	XoW.logger.me(this.classInfo + "sendIQ()");
        return this._stropheConn.sendIQ(elem, callback, errback, timeout);
    },
    /**public
     * 添加节监听器到Strophe.Connection对象上。这里只是做了一步封装。
     * @param handler
     * @param ns
     * @param name
     * @param type
     * @param id
     * @param from
     * @param options
     */
    addHandler : function(handler, ns, name, type, id, from, options) {
    	XoW.logger.ms(this.classInfo + "addHandler()");
    	
    	this._stropheConn.addHandler(handler, ns, name, type, id, from, options);
    	
    	XoW.logger.me(this.classInfo + "addHandler()");
    },

    /**
     * 回调与触发。
     * @param proName
     * @param callback
     */
    addHandlerToConnMgr : function(proName, callback) {
    	XoW.logger.ms(this.classInfo + "addHandlerToConnMgr()");
    	XoW.logger.d(this.classInfo + "添加了一个监听，监听属性： " + proName);
    	this.handler.addHandler(proName, callback);
    	XoW.logger.me(this.classInfo + "addHandlerToConnMgr()");
    },
    deleteHandlerInConnMgr : function(id) {
    	XoW.logger.ms(this.classInfo + "deleteHandlerInConnMgr()");
    	this.handler.deleteHandler(id);
    	XoW.logger.me(this.classInfo + "deleteHandlerInConnMgr()");
    },
    triggerHandlerInConnMgr : function(proName, params) {
    	XoW.logger.ms(this.classInfo + "triggerHandlerInConnMgr()");
    	XoW.logger.d(this.classInfo + "触发的属性是： " + proName);
    	this.handler.triggerHandler(proName, params);
    	XoW.logger.me(this.classInfo + "triggerHandlerInConnMgr()");
    },
        
};
return XoW;
}));