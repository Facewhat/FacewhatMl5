/*

 @Name: layui WebIM 1.0.0
 @Author：贤心
 @Date: 2014-04-25
 @Blog: http://sentsin.com
 
 */
 // ;!function(win, undefined){

// 算是配置文件，一些初始化的设置。
var config = {
    msgurl: '私信地址',
    chatlogurl: '聊天记录url前缀',
    aniTime: 200,
    right: -232,
    api: {
        friend: "friend.json", //好友列表接口
        group: 'group.json', //群组列表接口 
        chatlog: 'chatlog.json', //聊天记录接口
        groups: 'groups.json', //群组成员接口
        sendurl: '' //发送消息接口
    },
    user: { //当前用户信息
        name: '123',//imconn.getCurrentUserName(),
        face: '',//imconn.getCurrentUserFace(),
        jid : "123"//imconn.jid
    },
    
    //自动回复内置文案，也可动态读取数据库配置
    autoReplay: [
       /*'自动回复1',
        '自动回复2',
        '自动回复3',
        // '您好，我现在有事不在，一会再和您联系。', 
        // '你没发错吧？',
        // '洗澡中，请勿打扰，偷窥请购票，个体四十，团体八折，订票电话：一般人我不告诉他！',
        // '你好，我是主人的美女秘书，有什么事就跟我说吧，等他回来我会转告他的。',
        // '我正在拉磨，没法招呼您，因为我们家毛驴去动物保护协会把我告了，说我剥夺它休产假的权利。',
        // '<（@￣︶￣@）>',*/
        '你要和我说话？你真的要和我说话？你确定自己想说吗？你一定非说不可吗？那你说吧，这是自动回复。',
        '主人正在开机自检，键盘鼠标看好机会出去凉快去了，我是他的电冰箱，我打字比较慢，你慢慢说，别急……',
        // '(*^__^*) 嘻嘻，是贤心吗？'
    ],
    
    // 当前的聊天窗口对象。
    chating: {},
    
    hosts: (function(){
        var dk = location.href.match(/\:\d+/);
        dk = dk ? dk[0] : '';
        return 'http://' + document.domain + dk + '/';
    })(),
    json: function(url, data, callback, error){
        return $.ajax({
            type: 'POST',
            url: url,
            data: data,
            dataType: 'json',
            success: callback,
            error: error
        });
    },
    stopMP: function(e){
        e ? e.stopPropagation() : e.cancelBubble = true;
    }
}, 
// 定义了dom数组，dom[0]是window，1是document,2是html，3是body
dom = [$(window), $(document), $('html'), $('body')], 
// 还定义了 xxim对象
xxim = {};


//主界面tab
xxim.tabs = function(index){
    var node = xxim.node;
    node.tabs.eq(index).addClass('xxim_tabnow').siblings().removeClass('xxim_tabnow');
    node.list.eq(index).show().siblings('.xxim_list').hide();
    
    if(1 === index) {
		// 如果是会议室
    	// 好友列表是每次进来就会有数据，所以一般不会有这个问题，群比较特殊，这还不能算群，
    	// 算是会议室，每次点到会议室面板，就有可能有新的会议室产生，所以每次都要重新获取会议室。
		// --gblMgr.getViewMgr()._showGroupPrepareData();
	}
    // 如果发现没有数据，那么就进行获取。
    if(node.list.eq(index).find('li').length === 0){
    	// alert(index);
        // xxim.getDates(index);
    	// --gblMgr.getViewMgr()._showFriends(index);
    	
    }
};

//节点
xxim.renode = function(){
    var node = xxim.node = {
        tabs: $('#xxim_tabs>span'), 
        list: $('.xxim_list'),
        online: $('.xxim_online'),
        setonline: $('.xxim_setonline'),
        onlinetex: $('#xxim_onlinetex'),
        xximon: $('#xxim_on'),
        layimFooter: $('#xxim_bottom'),
        xximHide: $('#xxim_hide'),
        xximSearch: $('#xxim_searchkey'),
        searchMian: $('#xxim_searchmain'),
        closeSearch: $('#xxim_closesearch'),
        layimMin: $('#layim_min')
    }; 
};

//主界面缩放
xxim.expend = function(){
    var node = xxim.node;
    if(xxim.layimNode.attr('state') !== '1'){
        xxim.layimNode.stop().animate({right: config.right}, config.aniTime, function(){
            node.xximon.addClass('xxim_off');
            try{
                localStorage.layimState = 1;
            }catch(e){}
            xxim.layimNode.attr({state: 1});
            node.layimFooter.addClass('xxim_expend').stop().animate({marginLeft: config.right}, config.aniTime/2);
            node.xximHide.addClass('xxim_show');
        });
    } else {
        xxim.layimNode.stop().animate({right: 1}, config.aniTime, function(){
            node.xximon.removeClass('xxim_off');
            try{
                localStorage.layimState = 2;
            }catch(e){}
            xxim.layimNode.removeAttr('state');
            node.layimFooter.removeClass('xxim_expend');
            node.xximHide.removeClass('xxim_show');
        });
        node.layimFooter.stop().animate({marginLeft: 0}, config.aniTime);
    }
};

//初始化窗口格局
xxim.layinit = function(){
    var node = xxim.node;
    
    //主界面
    try{
        if(!localStorage.layimState){       
            config.aniTime = 0;
            localStorage.layimState = 1;
        }
        if(localStorage.layimState === '1'){
            xxim.layimNode.attr({state: 1}).css({right: config.right});
            node.xximon.addClass('xxim_off');
            node.layimFooter.addClass('xxim_expend').css({marginLeft: config.right});
            node.xximHide.addClass('xxim_show');
        }
    }catch(e){
        layer.msg(e.message, 5, -1);
    }
};

//聊天窗口
xxim.popchat = function(param){
	XoW.logger.ms("popchat()");
    var node = xxim.node, log = {};
    
    log.success = function(layero){
        layer.setMove();
     
        xxim.chatbox = layero.find('#layim_chatbox');
        log.chatlist = xxim.chatbox.find('.layim_chatmore>ul');
        
        // 【修改2016-8-26】用下面一句代替上面一句，先试试 
        // log.chatlist.html('<li data-id="'+ param.id +'" type="'+ param.type +'"  id="layim_user'+ param.type + param.id +'"><span>'+ param.name +'</span><em>×</em></li>')
        //if(gblMgr.getRoomMgr().isRoomDomain(param.jid)) {
       // 	XoW.logger.w("是房间的");
        	// pn =  + "--" + XoW.utils.getNodeFromJid(param.jid);
       // 	log.chatlist.html('<li data-id="'+ param.jid +'" type="'+ param.type +'"  id="layim_user'+ param.type + param.id +'"><span>'+ param.name + "--" + XoW.utils.getNodeFromJid(param.jid) +'</span><em>×</em></li>');
      //  } else {
        
        // 点击出现的第一个窗口的时候
        
//        if(gblMgr.getOrgnizationMgr().isOrgDomain(param.jid)) {
//        	//  && null != XoW.utils.getResourceFromJid(param.jid)
//        	// keys = param.type + "group" + XoW.utils.escapeJquery(param.jid);
//        	// log.chatmore.find('ul').append('<li data-id="'+ param.jid +'" type="'+ param.type +'" id="layim_user'+ param.type +"group"+ param.jid+'" class="layim_chatnow"><span>'+ param.name +'</span><em>×</em></li>');
//        	// log.chatarea.append('<ul class="layim_chatview layim_chatthis" id="layim_area'+ param.type +"group"+ param.jid +'"></ul>');
//        	log.chatlist.html('<li data-id="'+ param.jid +'" type="'+ param.type +'" id="layim_user'+ param.type +"group"+ param.jid+'"><span>'+ param.name +'</span><em>×</em></li>');
//        } else {
//        	log.chatlist.html('<li data-id="'+ param.jid +'" type="'+ param.type +'"  id="layim_user'+ param.type + param.id +'"><span>'+ param.name +'</span><em>×</em></li>');
//        } 
        var type = gblMgr.getViewMgr().judgeTypeByJid(param.jid);
        // alert(type);
        switch(type) {
        	case 'one' : 
        	case 'roomprivate' : 
        	case 'groupprivate' : 
        	case 'room' : 
        	case 'group' : 
        		log.chatlist.html('<li data-id="'+ param.jid +'" type="'+ param.type +'" id="layim_user'+ param.type + param.jid+'" class="layim_chatnow"><span>'+ param.name +'</span><im class="layim_chatlist_newmsg" style="display: none"></im><em>×</em></li>');
        		break;
        }
        
        // return;
        
        //}
        
        xxim.tabchat(param, xxim.chatbox);
        
        //最小化聊天窗
        xxim.chatbox.find('.layer_setmin').on('click', function(){
            var indexs = layero.attr('times');
            layero.hide();
            node.layimMin.text(xxim.nowchat.name).show();
        });
        
        // 关闭所有聊天窗口，即右上角的关闭
        xxim.chatbox.find('.layim_close').on('click', function(){
        	
        	if(0 != gblMgr.getRoomMgr().getXmppRoomLength()) {
        		// 离开所有房间
        		layer.confirm('是否关闭所有聊天窗口？', function(index) {
        			// 确定退出回调
    		      	gblMgr.getRoomMgr().leaveAllXmppRoom();
    		      	// this._send(pres);
    		      	var indexs = layero.attr('times');
	                layer.close(indexs);
	                xxim.chatbox = null;
	                config.chating = {};
	                config.chatings = 0;
    		      	
    		      	// 要手动关闭
    		      	layer.close(index);
    			}.bind(this), '该操作将会导致退出当前所在的会议室', function(index) {
    				// 取消退出回调
    				layer.close(index);
    			});
        	} else {
        		var indexs = layero.attr('times');
                layer.close(indexs);
                xxim.chatbox = null;
                config.chating = {};
                config.chatings = 0;
        	}
        	
            
        });
        
        // 关闭某个聊天的x，鼠标移过显示，移出隐藏
        log.chatlist.on('mouseenter', 'li', function(){
            $(this).find('em').show();
            // $(this).find('em').
            if('group' === $(this).attr('type')) {
            	layer.tips('退出会议室', $(this).find('em').get(0) , {guide: 1, time: 2});
            	// layer.tips('退出会议室', this , {guide: 1, time: 2});
            }
        }).on('mouseleave', 'li', function(){
            $(this).find('em').hide();
            
        });
        // 关闭聊天窗口的处理
        log.chatlist.on('click', 'li em', function(e){
            var parents = $(this).parent(), dataType = parents.attr('type');
            var dataId = parents.attr('data-id'), index = parents.index();
            var chatlist = log.chatlist.find('li'), indexs;
            
            /**【林兴洋2016/12/17】
             * 其中包含特殊字符，进行转义
             */
            var dataId2 = XoW.utils.escapeJquery(dataId);
            
            config.stopMP(e);
            // 此处不能用转义的
            delete config.chating[dataType + dataId];
            config.chatings--;
            
            parents.remove();
            // 此处用到转义的。
            $('#layim_area'+ dataType + dataId2).remove();
            if(dataType === 'group'){
            	// 如果是群组
//                $('#layim_group'+ dataType + dataId2).remove();
                $('#layim_groupuusers'+ dataId2).remove();
                gblMgr.getViewMgr().closeOneRoom(dataId);
            }
            
            if(parents.hasClass('layim_chatnow')){
                if(index === config.chatings){
                    indexs = index - 1;
                } else {
                    indexs = index + 1;
                }
                xxim.tabchat(config.chating[chatlist.eq(indexs).attr('type') + chatlist.eq(indexs).attr('data-id')]);
            }
            
            if(log.chatlist.find('li').length === 1){
                log.chatlist.parent().hide();
            } 
        });
        
        //聊天选项卡
        log.chatlist.on('click', 'li', function(){
        	XoW.logger.w("切换到别的聊天窗口");
            var othis = $(this), dataType = othis.attr('type'), dataId = othis.attr('data-id');
            xxim.tabchat(config.chating[dataType + dataId]);
        });
        
        //发送热键切换
        log.sendType = $('#layim_sendtype'), log.sendTypes = log.sendType.find('span');
        $('#layim_enter').on('click', function(e){
            config.stopMP(e);
            log.sendType.show();
        });
        log.sendTypes.on('click', function(){
            log.sendTypes.find('i').text('')
            $(this).find('i').text('√');
        });
        
        /** 【林兴洋修改2016/8/26】，发送框的事件
         * 将xxim.transmit();替换成自己的xxim.transmitIMbinding();
         * xxim.transmit(); 
         */
        // xxim.transmitIMbinding();
        /**
         * 【林兴洋修改2016/12/18】，再次修改了
         * 将该事件移动到XoW.ViewManager里面的transmit处理
         */
        // gblMgr.getViewMgr().transmit();
        /**
         * 【林兴洋修改2016/12/19】，再次修改
         * 将gblMgr.getViewMgr().transmit();隐去，在viewManager里面定义其他方法替代
         */
        
    };
    
    /**
     * 聊天窗口的模板
     */
    log.html = '<div class="layim_chatbox" id="layim_chatbox">'
	    	+'<div class="layim_messagehistorydiv">'
	    	+'<ul>'
	    	+'</ul>'
	        +'</div>'
            +'<h6>'
            +'<span class="layim_move"></span>'
            +'    <a href="'+ param.url +'" class="layim_face" target="_blank"><img ondragstart="return false;" src="'+ param.face +'" ></a>'
            /** 【林兴洋修改2016-8-30】
            * 原句修改：隐使其url无效
            * +'    <a href="'+ param.url +'" class="layim_names" target="_blank">'+ param.name +'</a>'
            */
            +'    <a class="layim_names" >'+ param.name +'</a>'
           
            /**【林兴洋增加一句2016/12/16】
             * 增加
             * +'    <a class="layim_chatstate" ></a>'
             * layim_chatstate用来放当前输入状态的。
             */
            +'    <a class="layim_chatstate" ></a>'
            
            +'    <span class="layim_rightbtn">'
            +'        <i class="layer_setmin"></i>'
            +'        <i class="layim_close"></i>'
            +'    </span>'
            +'</h6>'
            +'<div class="layim_chatmore" id="layim_chatmore">'
            +'    <ul class="layim_chatlist"></ul>'
            +'</div>'
            +'<div class="layim_groups" id="layim_groups"></div>'
            +'<div class="layim_chat">'
            +'    <div class="layim_chatarea" id="layim_chatarea">'
            +'        <ul class="layim_chatview layim_chatthis"  id="layim_area'+ param.type + param.jid +'"></ul>'
            +'    </div>'
            +'    <div id="layim_facebox" class="layim_faceboxhidden" ></div>' // 表情框 2016/12/28 林兴洋
            +'    <div class="layim_tool">'
            +'        <i tabindex="-1" class="layim_addface" title="发送表情" ></i>'
            +'        <a href="javascript:;"><i class="layim_addimage" title="发送图片"></i></a>'
//            +'        <i class="layim_addimage" title="发送图片"></i>'
            +'        <a href="javascript:;"><i class="layim_addfile" title="发送文件"></i></a>'
            +'        <a href="javascript:;"><i class="layim_config" title="群配置/群信息"></i></a>'
            +'        <a href="javascript:;" class="layim_seechatlog"><i></i>聊天记录</a>'
            +'    </div>'
            /**【林兴洋修改2016/12/18】
             * 
             */
            // +'    <textarea class="layim_write" id="layim_write"></textarea>'
            +'    <div  contenteditable="true"  class="layim_write" id="layim_write"></div>'
            +'    <div class="layim_send">'
            +'        <div class="layim_sendbtn" id="layim_sendbtn">发送<span class="layim_enter" id="layim_enter"><em class="layim_zero"></em></span></div>'
            +'        <div class="layim_sendtype" id="layim_sendtype">'
            +'            <span id="spanEnter"><i>√</i>按Enter键发送</span>'
            +'            <span id="spanCtrlEnter"><i></i>按Ctrl+Enter键发送</span>'
            +'        </div>'
            +'    </div>'
            +'</div>'
            +'</div>';
    
    // 如果聊天的数量小于1，即没有任何聊天界面。
    if(config.chatings < 1){
        $.layer({
            type: 1,
            border: [0],
            title: false,
            shade: [0],
            area: ['620px', '493px'],
            move: ['.layim_chatbox .layim_move', true],
            moveType: 1,
            closeBtn: false,
            offset: [(($(window).height() - 493)/2)+'px', ''],
            page: {
                html: log.html
            }, success: function(layero){
                log.success(layero);
            }
        })
    } else {
        log.chatmore = xxim.chatbox.find('#layim_chatmore');
        log.chatarea = xxim.chatbox.find('#layim_chatarea');
        
        log.chatmore.show();
        
        // 做到这里，要获得 chatarea，但因为id相同，无法获得。要改。
        log.chatmore.find('ul>li').removeClass('layim_chatnow');
        
        log.chatarea.find('.layim_chatview').removeClass('layim_chatthis');
        // 这里是弹出聊天窗口，以及左侧当前聊天窗口
        var type = gblMgr.getViewMgr().judgeTypeByJid(param.jid);
        switch(type) {
	    	case 'one' : 
	    	case 'roomprivate' : 
	    	case 'groupprivate' : 
	    	case 'room' : 
	    	case 'group' : 
	    		log.chatmore.find('ul').append('<li data-id="'+ param.jid +'" type="'+ param.type +'" id="layim_user'+ param.type + param.jid+'" class="layim_chatnow"><span>'+ param.name +'</span><im class="layim_chatlist_newmsg" style="display: none"></im><em>×</em></li>');
	    		log.chatarea.append('<ul class="layim_chatview layim_chatthis" id="layim_area'+ param.type + param.jid +'"></ul>');
	    		break;
	    }
        
//        if(gblMgr.getRoomMgr().isRoomDomain(param.jid) && null != XoW.utils.getResourceFromJid(param.jid)) {
//        	// 是群中私聊。最重要的就是这里，这里指明了弹出的信息
//        	log.chatmore.find('ul').append('<li data-id="'+ param.jid +'" type="'+ param.type +'" id="layim_user'+ param.type +"room"+ param.jid+'" class="layim_chatnow"><span>'+ param.name +'</span><em>×</em></li>');
//        	log.chatarea.append('<ul class="layim_chatview layim_chatthis" id="layim_area'+ param.type +"room"+ param.jid +'"></ul>');
//        	
//        } else if(gblMgr.getOrgnizationMgr().isOrgDomain(param.jid) && null != XoW.utils.getResourceFromJid(param.jid)) {
//        	// keys = param.type + "group" + XoW.utils.escapeJquery(param.jid);
//        	log.chatmore.find('ul').append('<li data-id="'+ param.jid +'" type="'+ param.type +'" id="layim_user'+ param.type +"group"+ param.jid+'" class="layim_chatnow"><span>'+ param.name +'</span><em>×</em></li>');
//        	log.chatarea.append('<ul class="layim_chatview layim_chatthis" id="layim_area'+ param.type +"group"+ param.jid +'"></ul>');
//        	
//        } else {
//        	// 是个人聊天或者群组聊天
//        	log.chatmore.find('ul').append('<li data-id="'+ param.jid +'" type="'+ param.type +'" id="layim_user'+ param.type + param.id +'" class="layim_chatnow"><span>'+ param.name +'</span><em>×</em></li>');
//        	log.chatarea.append('<ul class="layim_chatview layim_chatthis" id="layim_area'+ param.type + param.id +'"></ul>');
//        }
        
        xxim.tabchat(param);
    }
    
    //群组
    log.chatgroup = xxim.chatbox.find('#layim_groups');
    
    if(param.type === 'group'){
        log.chatgroup.find('ul').removeClass('layim_groupthis');
        // if()
        // log.chatgroup.append('<ul class="layim_groupthis" id="layim_group'+ param.type + param.id +'"></ul>');
        // 群组的好友列表
        log.chatgroup.append('<ul class="layim_groupthis" id="layim_groupusers'+ param.jid +'"></ul>');
        // 切换到群组，去查找群组里面的人
        //  xxim.getGroups(param);
    }
    //点击会议室中的某个人，打开/切换到他的聊天窗口
    log.chatgroup.on('click', 'ul>li', function(){
    	// 需要进行判断，如果点击的是自己的，则不能弹出与自己的聊天窗口
    	var $this = $(this);
    	var roomJid = XoW.utils.getBareJidFromJid($this.attr('data-id'));
    	var roomNick = XoW.utils.getResourceFromJid($this.attr('data-id'));
    	if(gblMgr.getRoomMgr().getXmppRoom(roomJid).nick == roomNick) {
    		// 是点击了自己，不弹出聊天窗口
    		return;
    	}
        xxim.popchatbox($(this));
    });
    XoW.logger.me("popchat()");
};

//定位到某个聊天队列
xxim.tabchat = function(param){

	XoW.logger.ms("tabchat()");
	
	//alert("好友是: " + param.jid);
    var node = xxim.node, log = {}, 
    	keys = XoW.utils.escapeJquery(param.type + param.jid);
//    var type = gblMgr.getViewMgr().judgeTypeByJid(param.jid);
//    switch(type) {
//    	case 'one' : 
//    	case 'roomprivate' : 
//    	case 'groupprivate' : 
//    	case 'room' : 
//    	case 'group' : 
//    		log.chatmore.find('ul').append('<li data-id="'+ param.jid +'" type="'+ param.type +'" id="layim_user'+ param.type + param.jid+'" class="layim_chatnow"><span>'+ param.name +'</span><em>×</em></li>');
//    		log.chatarea.append('<ul class="layim_chatview layim_chatthis" id="layim_area'+ param.type + param.jid +'"></ul>');
//    		break;
//    }
//    
//    if(gblMgr.getRoomMgr().isRoomDomain(param.jid) && null != XoW.utils.getResourceFromJid(param.jid)) {
//    	keys = param.type + "room" + XoW.utils.escapeJquery(param.jid);
//    } else if(gblMgr.getOrgnizationMgr().isOrgDomain(param.jid) && null != XoW.utils.getResourceFromJid(param.jid)) {
//    	// log.chatmore.find('ul').append('<li data-id="'+ param.jid +'" type="'+ param.type +'" id="layim_user'+ param.type +"group"+ param.jid+'" class="layim_chatnow"><span>'+ param.name +'</span><em>×</em></li>');
//    	// log.chatarea.append('<ul class="layim_chatview layim_chatthis" id="layim_area'+ param.type +"group"+ param.jid +'"></ul>');
//    	keys = param.type + "group" + XoW.utils.escapeJquery(param.jid);
//    }
    xxim.nowchat = param;
    
    xxim.chatbox.find('#layim_user'+ keys).addClass('layim_chatnow').siblings().removeClass('layim_chatnow');
    xxim.chatbox.find('#layim_area'+ keys).addClass('layim_chatthis').siblings().removeClass('layim_chatthis');
//    xxim.chatbox.find('#layim_group'+ keys).addClass('layim_groupthis').siblings().removeClass('layim_groupthis');
    xxim.chatbox.find('#layim_groupusers'+ XoW.utils.escapeJquery(param.jid)).addClass('layim_groupthis').siblings().removeClass('layim_groupthis');
    //alert(xxim.chatbox.find('#layim_groupusers'+ XoW.utils.escapeJquery(param.jid)).attr('id'));
//    alert(xxim.chatbox.find('#layim_area'+ keys).attr('id'));
//    alert(xxim.chatbox.find('#layim_groupusers'+ keys).attr('id'));
    
    // 将头像变成当前正在聊天的好友的头像
    xxim.chatbox.find('.layim_face>img').attr('src', param.face);
    // 【林兴洋修改2016-8-31】将下面一句隐藏，因为我要点击用户的姓名的时候进入它的个人信息，不是新的网页。
    // 新增2句，一句使href无效，一句用来调用我自己定义的函数，使之显示该好友vcard()
    // xxim.chatbox.find('.layim_face, .layim_names').attr('href', param.href);
    xxim.chatbox.find('.layim_face, .layim_names').attr('href', "javascript:void(0);");
    xxim.chatbox.find('.layim_chatstate').text(""); // 这样做还是有点不友好= =
    // xxim.chatbox.find('.layim_names').attr('onclick', "return imconn.showVcard('" + param.jid + "')");
    // xxim.chatbox.find('.layim_names').attr('onclick', "return gblMgr.getViewMgr().showVcard('" + param.jid + "')");
    
    // 将当前正在聊天的好友的头像的姓名填上去
    xxim.chatbox.find('.layim_names').text(param.name);
    
    // xxim.chatbox.find('.layim_seechatlog').attr('href', config.chatlogurl + param.id);
   
    log.groups = xxim.chatbox.find('.layim_groups');
    
    
    
    
    var type = gblMgr.getViewMgr().judgeTypeByJid(param.jid);
    switch(type) {
 		case 'one' : 
 			XoW.logger.d(this.classInfo + "是好友消息");
 	    	// 将分组列表隐藏
 	        log.groups.hide();
 	        // 将头像显示出来
 	        xxim.chatbox.find('.layim_face').show();
 	        // xxim.chatbox.find('.layim_face').css({"visibility":"visible"});
 	        
 	        // 隐藏管理按钮
 	        $('div.layim_tool .layim_config').hide();
 	        
 	        // 显示 发送图片按钮，发送文件按钮，聊天记录按钮
 	        $('div.layim_tool .layim_addimage').show();
 	        $('div.layim_tool .layim_addfile').show();
 	        // $('div.layim_tool .layim_seechatlog').show();
 			break;
 		case 'roomprivate' : 
 			XoW.logger.d(this.classInfo + "是群组中的个人消息");

 			xxim.chatbox.find('.layim_face').hide(); // 隐藏，但是不占着位置
 	    	// xxim.chatbox.find('.layim_face').css({"visibility":"hidden"}); // 隐藏，但是占着位置
 	    	// 隐藏 发送图片按钮，隐藏发送文件按钮，
 	    	$('div.layim_tool .layim_addimage').hide();
 	    	$('div.layim_tool .layim_addfile').hide();
    		// 私人消息
    		xxim.chatbox.find('.layim_names').text(param.name + '-来自房间：' + XoW.utils.getNodeFromJid(param.jid));
    		// 隐藏聊天记录
    		//$('div.layim_tool .layim_seechatlog').hide();
    		// 隐藏群组中好友
    		log.groups.hide();
    		// 隐藏配置按钮
    		$('div.layim_tool .layim_config').hide();
    		
			break;
		case 'room' : 
			XoW.logger.d(this.classInfo + "是群组");
			// 隐藏头像，群组没有头像/与来自群组的人聊天也没有头像
	    	// 由于头像的布局已经被设置好 了，所以用下面二者没有区别了，图片的位置都是在的
	    	xxim.chatbox.find('.layim_face').hide(); // 隐藏，但是不占着位置
	    	// xxim.chatbox.find('.layim_face').css({"visibility":"hidden"}); // 隐藏，但是占着位置
	    	// 隐藏 发送图片按钮，隐藏发送文件按钮，
	    	$('div.layim_tool .layim_addimage').hide();
	    	$('div.layim_tool .layim_addfile').hide();
    		// 群组消息
    		log.groups.show();
    		// 显示管理按钮
    		$('div.layim_tool .layim_config').show();
    		break;
		case 'groupprivate' : 
			XoW.logger.d(this.classInfo + "是群组中的个人消息");
			xxim.chatbox.find('.layim_face').hide(); // 隐藏，但是不占着位置
	    	// xxim.chatbox.find('.layim_face').css({"visibility":"hidden"}); // 隐藏，但是占着位置
	    	// 隐藏 发送图片按钮，隐藏发送文件按钮，
	    	$('div.layim_tool .layim_addimage').hide();
	    	$('div.layim_tool .layim_addfile').hide();
	    	
	    	$('div.layim_tool .layim_config').hide();
	    	
	    		
	    	var group = gblMgr.getOrgnizationMgr().getGroupByGroupname(XoW.utils.getNodeFromJid(param.jid));
	    		// 私人消息
	    	xxim.chatbox.find('.layim_names').text(param.name + '-来自部门：' + group.displayname);
	    	// 隐藏聊天记录
	    	//$('div.layim_tool .layim_seechatlog').hide();
	    	// 隐藏群组好友
	    	log.groups.hide();
	    	// $('div.layim_tool .layim_config').hide();
	    	break;
		case 'group' : 
			XoW.logger.d(this.classInfo + "是群组");
			xxim.chatbox.find('.layim_face').hide(); // 隐藏，但是不占着位置
	    	// xxim.chatbox.find('.layim_face').css({"visibility":"hidden"}); // 隐藏，但是占着位置
	    	// 隐藏 发送图片按钮，隐藏发送文件按钮，
	    	$('div.layim_tool .layim_addimage').hide();
	    	$('div.layim_tool .layim_addfile').hide();
	    	
	    	$('div.layim_tool .layim_config').hide();
    		// 群组消息
    		log.groups.show();
    		
    		// 显示管理按钮
    		
    		// 显示聊天记录
    		//$('div.layim_tool .layim_seechatlog').show();
			break;
    }
    /*
    if(gblMgr.getRoomMgr().isRoomDomain(param.jid)) {
    	//  || param.type === 'group'
    	// 隐藏头像，群组没有头像/与来自群组的人聊天也没有头像
    	// 由于头像的布局已经被设置好 了，所以用下面二者没有区别了，图片的位置都是在的
    	xxim.chatbox.find('.layim_face').hide(); // 隐藏，但是不占着位置
    	// xxim.chatbox.find('.layim_face').css({"visibility":"hidden"}); // 隐藏，但是占着位置
    	// 隐藏 发送图片按钮，隐藏发送文件按钮，
    	$('div.layim_tool .layim_addimage').hide();
    	$('div.layim_tool .layim_addfile').hide();
    	
    	// 有关room的消息
    	if(null != XoW.utils.getResourceFromJid(param.jid)) {
    		XoW.logger.d(this.classInfo + "是群组中的个人消息");
    		// 私人消息
    		xxim.chatbox.find('.layim_names').text(param.name + '-来自房间：' + XoW.utils.getNodeFromJid(param.jid));
    		// 隐藏聊天记录
    		//$('div.layim_tool .layim_seechatlog').hide();
    		
    		log.groups.hide();
    		$('div.layim_tool .layim_config').hide();
    	} else {
    		XoW.logger.d(this.classInfo + "是群组");
    		// 群组消息
    		log.groups.show();
    		// 显示管理按钮
    		$('div.layim_tool .layim_config').show();
    		// 显示聊天记录
    		//$('div.layim_tool .layim_seechatlog').show();
    	}
    	
    } else if(gblMgr.getOrgnizationMgr().isOrgDomain(param.jid)) {
    	// && null != XoW.utils.getResourceFromJid(param.jid)
    	
    	// log.chatmore.find('ul').append('<li data-id="'+ param.jid +'" type="'+ param.type +'" id="layim_user'+ param.type +"group"+ param.jid+'" class="layim_chatnow"><span>'+ param.name +'</span><em>×</em></li>');
    	// log.chatarea.append('<ul class="layim_chatview layim_chatthis" id="layim_area'+ param.type +"group"+ param.jid +'"></ul>');
    	// keys = param.type + "group" + XoW.utils.escapeJquery(param.jid);
    	// 个人聊天时有头像的。。
    	
    	// 隐藏头像，群组没有头像/与来自群组的人聊天也没有头像
    	// 由于头像的布局已经被设置好 了，所以用下面二者没有区别了，图片的位置都是在的
    	xxim.chatbox.find('.layim_face').hide(); // 隐藏，但是不占着位置
    	// xxim.chatbox.find('.layim_face').css({"visibility":"hidden"}); // 隐藏，但是占着位置
    	// 隐藏 发送图片按钮，隐藏发送文件按钮，
    	$('div.layim_tool .layim_addimage').hide();
    	$('div.layim_tool .layim_addfile').hide();
    	
    	$('div.layim_tool .layim_config').hide();
    	
    	// 有关room的消息
    	if(null != XoW.utils.getResourceFromJid(param.jid)) {
    		XoW.logger.d(this.classInfo + "是群组中的个人消息");
    		
    		var group = gblMgr.getOrgnizationMgr().getGroupByGroupname(XoW.utils.getNodeFromJid(param.jid));
    		// 私人消息
    		xxim.chatbox.find('.layim_names').text(param.name + '-来自部门：' + group.displayname);
    		// 隐藏聊天记录
    		//$('div.layim_tool .layim_seechatlog').hide();
    		
    		log.groups.hide();
    		// $('div.layim_tool .layim_config').hide();
    	} else {
    		XoW.logger.d(this.classInfo + "是群组");
    		// 群组消息
    		log.groups.show();
    		
    		// 显示管理按钮
    		
    		// 显示聊天记录
    		//$('div.layim_tool .layim_seechatlog').show();
    	}
    } else {
    	XoW.logger.d(this.classInfo + "是好友消息");
    	// 将分组列表隐藏
        log.groups.hide();
        // 将头像显示出来
        xxim.chatbox.find('.layim_face').show();
        // xxim.chatbox.find('.layim_face').css({"visibility":"visible"});
        
        // 隐藏管理按钮
        $('div.layim_tool .layim_config').hide();
        
        // 显示 发送图片按钮，发送文件按钮，聊天记录按钮
        $('div.layim_tool .layim_addimage').show();
        $('div.layim_tool .layim_addfile').show();
      //  $('div.layim_tool .layim_seechatlog').show();
    }*/
    
    $('#layim_write').focus();
    
    // 通知imconn切换到某个界面了
    // imconn.mylog("imconn.tabchatSomeone(param.id = " + param.id + "); 调用");
    // 此处进行了隐藏 12.16日  imconn.tabchatSomeone(param.jid);
    // 调用view上的tabchatAction进行处理一些东西
    var type = gblMgr.getViewMgr().judgeTypeByJid(param.jid);
    switch(type) {
    	case 'one' : 
    		gblMgr.getViewMgr().tabchatAction(param.jid);
    		break;
    	case 'roomprivate' : 
    		gblMgr.getViewMgr().roomPrivateTabchatAction(param.jid)
    		break;
    	case 'groupprivate' : 
    		gblMgr.getViewMgr().groupPrivateTabchatAction(param.jid);
    		break;
    	case 'room' : 
    		gblMgr.getViewMgr().roomTabchatAction(param.jid); 
    		break;
    	case 'group' :
    		gblMgr.getViewMgr().orgTabchatAction(param.jid);
    		break;
    }
    
//    if(param.type === 'one') {
//    	// 单人聊天
//    	gblMgr.getViewMgr().tabchatAction(param.jid); 
//    } else if(param.type === 'group') {
//    	if(gblMgr.getRoomMgr().isRoomDomain(param.jid)) {
//    		gblMgr.getViewMgr().roomTabchatAction(param.jid); 
////     		gblMgr.getViewMgr().roomPopchatAction(param.jid);
//    	} else if(gblMgr.getOrgnizationMgr().isOrgDomain(param.jid)) {
//    		gblMgr.getViewMgr().orgTabchatAction(param.jid);
//    	}
//    }
    XoW.logger.me("tabchat()");
    
    
};

//弹出聊天窗
xxim.popchatbox = function(othis){
	// alert("看看id" + othis.attr('data-id'));
	// 【修改2016-8-26】下面两个 othis.attr('type'),改成Strophe.getNodeFromJid(othis.attr('data-id'))
	// 【原因】 因为JID里面有个@，好像放在里面后面无法识别，现在只是快速的。。
	// 增加了一个JID
	XoW.logger.ms("popchatbox");
    var node = xxim.node, dataId = othis.attr('data-id');
    var	param = {
        id: dataId, // 在列表中点中的用户的JID，
        jid : dataId, // 【增加】
        type: othis.attr('type'),
        // 【林兴洋修改2016-8-30】 因为用text的话用户名会重复，比如zxl会变成zxlzxl
        // name: othis.find('.xxim_onename').text(),  //用户名
        name: othis.find('.xxim_onename').html(),  //用户名
        face: othis.find('.xxim_oneface').attr('src'),  //用户头像
        // href: config.hosts + 'user/' + dataId //用户主页
    }; 
   // var key = XoW.utils.escapeJquery(params.jid); 
    var key = param.type + dataId;
    
    
    // 如果不存在这个聊天，则弹出，存在则定位到那个聊天
    if(!config.chating[key]){ 
    	// 弹出聊天窗口
    	XoW.logger.d("不存在该聊天窗口，新建" + param.jid);
        xxim.popchat(param); 
        config.chatings++; 
        
        
        var type = gblMgr.getViewMgr().judgeTypeByJid(param.jid);
        switch(type) {
        	case 'one' : 
        		gblMgr.getViewMgr().popchatAction(param.jid);
        		break;
        	case 'roomprivate' : 
        		gblMgr.getViewMgr().roomPrivatePopchatAction(param.jid);
        		break;
        	case 'groupprivate' :
        		gblMgr.getViewMgr().groupPrivatePopchatAction(param.jid);
        		break;
        	case 'room' : 
        		gblMgr.getViewMgr().roomPopchatAction(param.jid);
        		break;
        	case 'group' :
        		gblMgr.getViewMgr().orgPopchatAction(param.jid);
        		break;
        }
        
//        if(param.type === 'one') {
//        	XoW.logger.d(this.classInfo + "是单人聊天");
//        	// 单人聊天
//        	gblMgr.getViewMgr().popchatAction(param.jid);
//        } else if(param.type === 'group') {
//        	XoW.logger.d(this.classInfo + "是群组聊天");
//        	// 现在有两种群组聊天了，一种 是 room 一种是组织架构。。。。
//        	if(gblMgr.getRoomMgr().isRoomDomain(param.jid)) {
//        		gblMgr.getViewMgr().roomPopchatAction(param.jid);
//        	} else if(gblMgr.getOrgnizationMgr().isOrgDomain(param.jid)) {
//        		gblMgr.getViewMgr().orgPopchatAction(param.jid);
//        	}
//        }
    } else {
    	// 存在那个聊天窗口，定位到那里
    	//alert("切换到与该好友的聊天界面" + param.jid);
    	XoW.logger.d("存在该聊天窗口，切换" + param.jid);
    	xxim.tabchat(param);
    }
    
    config.chating[key] = param; // 保存该聊天
    
    var chatbox = $('#layim_chatbox');
    if(chatbox[0]){
        node.layimMin.hide();
        chatbox.parents('.xubox_layer').show();
    }
	XoW.logger.me("popchatbox");

};

//请求群员
/*
xxim.getGroups = function(param){
    var keys = param.type + param.id, str = '',
    groupss = xxim.chatbox.find('#layim_group'+ keys);
    groupss.addClass('loading');
    config.json(config.api.groups, {}, function(datas){
        if(datas.status === 1){
            var ii = 0, lens = datas.data.length;
            if(lens > 0){
                for(; ii < lens; ii++){
                    str += '<li data-id="'+ datas.data[ii].id +'" type="one"><img src="'+ datas.data[ii].face +'"><span class="xxim_onename">'+ datas.data[ii].name +'</span></li>';
                }
            } else {
                str = '<li class="layim_errors">没有群员</li>';
            }
            
        } else {
            str = '<li class="layim_errors">'+ datas.msg +'</li>';
        }
        groupss.removeClass('loading');
        groupss.html(str);
    }, function(){
        groupss.removeClass('loading');
        groupss.html('<li class="layim_errors">请求异常</li>');
    });
};
*/

// discard
// 发送消息处理
// 已被自定义的替代了
/*
xxim.transmit = function(){
	// alert("执行了xxim.transmit");
    var node = xxim.node, log = {};
    node.sendbtn = $('#layim_sendbtn'); // 发送按钮
    node.imwrite = $('#layim_write'); // 输入框
    
    // 发送事件
    log.send = function(){
        var data = {
            content: node.imwrite.val(),
            id: xxim.nowchat.id,
            sign_key: '', //密匙
            _: +new Date
        };

        if(data.content.replace(/\s/g, '') === ''){
            layer.tips('说点啥呗！', '#layim_write', 2);
            node.imwrite.focus();
        } else {
            //此处皆为模拟
            var keys = xxim.nowchat.type + xxim.nowchat.id;
            
            //聊天模版
            log.html = function(param, type){
                return '<li class="'+ (type === 'me' ? 'layim_chateme' : '') +'">'
                    +'<div class="layim_chatuser">'
                        + function(){
                            if(type === 'me'){
                                return '<span class="layim_chattime">'+ param.time +'</span>'
                                       +'<span class="layim_chatname">'+ param.name +'</span>'
                                       +'<img src="'+ param.face +'" >';
                            } else {
                                return '<img src="'+ param.face +'" >'
                                       +'<span class="layim_chatname">'+ param.name +'</span>'
                                       +'<span class="layim_chattime">'+ param.time +'</span>';      
                            }
                        }()
                    +'</div>'
                    +'<div class="layim_chatsay">'+ param.content +'<em class="layim_zero"></em></div>'
                +'</li>';
            };
            
            log.imarea = xxim.chatbox.find('#layim_area'+ keys); // 聊天内容区域
            
            log.imarea.append(log.html({
                time: '2014-04-26 0:37',
                name: config.user.name,
                face: config.user.face,
                content: data.content
            }, 'me'));
            node.imwrite.val('').focus();
            log.imarea.scrollTop(log.imarea[0].scrollHeight);
            
            // 自动回复
            setTimeout(function(){
                log.imarea.append(log.html({
                    time: '2014-04-26 0:38',
                    name: xxim.nowchat.name,
                    face: xxim.nowchat.face,
                    content: config.autoReplay[(Math.random()*config.autoReplay.length) | 0]
                }));
                log.imarea.scrollTop(log.imarea[0].scrollHeight);
            }, 500);
            
            /*
            that.json(config.api.sendurl, data, function(datas){
            
            });
            */
/*
        }
       
    };
    node.sendbtn.on('click', log.send); // 绑定发送事件
    
    node.imwrite.keyup(function(e){
        if(e.keyCode === 13){
            log.send();
        }
    });
};
*/
//事件
xxim.event = function(){
    var node = xxim.node;
    
    //主界面tab
    // 切换主界面的tab的时候
    node.tabs.eq(0).addClass('xxim_tabnow');
    node.tabs.on('click', function(){
        var othis = $(this), index = othis.index();
        xxim.tabs(index);
    });   
    
    //列表展收
    node.list.on('click', 'h5', function(){
        var othis = $(this), chat = othis.siblings('.xxim_chatlist'), parentss = othis.parent();
        if(parentss.hasClass('xxim_liston')){
        	//alert("隐藏");
            chat.hide();
            parentss.removeClass('xxim_liston');
        } else {
        	//alert("显示");
            chat.show();
            parentss.addClass('xxim_liston');
        }
    });
    
    //设置在线隐身
    node.online.on('click', function(e){
    	// alert();
        config.stopMP(e);
        node.setonline.show();
    });
    
    // 设置状态
    node.setonline.find('span').on('click', function(e){
    	XoW.logger.ms(this.classInfo + "设置状态");
    	
    	var index = $(this).index();
        config.stopMP(e);
        
        /**
         * 【林兴洋2016/12/15修改】
         * 增加了判断，以及对后面发送的部分修改。
         */
        
//        var sender = gblMgr.getPresenceMgr();
//        if(null == sender) {
//        	XoW.logger.w("node.setonline.find('span').on('click', function(e){  sender不存在");
//        	return;
//        }
//        
        var currUser = gblMgr.getCurrentUser();
        if(index === 4) {
        	XoW.logger.d(this.classInfo + "切换到离线");
        	// 离线比较特殊，它会退出所有房间，而unavailable的节在room.leave()方法中来实现。
        	if(0 != gblMgr.getRoomMgr().getXmppRoomLength()) {
        		// 离开所有房间
        		layer.confirm('是否设置为离线状态？', function(index) {
        			// 确定退出回调
    				// 离开房间要先发送leaveAllXmppRoom，然后才能发送 pres
    				
    		      	currUser.sendOffline1();
    		      	gblMgr.getRoomMgr().leaveAllXmppRoom();
    		      	// this._send(pres);
    		      	node.online.removeClass(); // 移除所有类
            		node.online.addClass('xxim_online'); // 添加 xxim_online
    	        	node.onlinetex.html('离线');
    	        	node.online.addClass('xxim_offline');
    		      	
    		      	// 要手动关闭
    		      	layer.close(index);
    			}.bind(this), '离线状态将会退出当前所在的会议室', function(index) {
    				// 取消退出回调
    				layer.close(index);
    			});
        	} else {
        		node.online.removeClass(); // 移除所有类
        		node.online.addClass('xxim_online'); // 添加 xxim_online
	        	node.onlinetex.html('离线');
	        	node.online.addClass('xxim_offline');
        		currUser.sendOffline1();
        	}
        	/*
        	sender.sendOffline(function(changeToOffline) {
        		// XoW.logger.w('结果是' + changeToOffline);
        		if(changeToOffline) {
            		// 如果返回true，那么就设置成隐身，如果是false，就不要隐身了。
            		node.online.removeClass(); // 移除所有类
            		node.online.addClass('xxim_online'); // 添加 xxim_online
    	        	node.onlinetex.html('隐身');
    	        	node.online.addClass('xxim_offline');
            	}
        	}.bind(this));
        	*/
        	// var changeToOffline = sender.sendOffline();
        	
        } else {
	        // 【林兴洋2016/8/30】扩展了几种状态
	        // 添加了空闲，正忙，离开，已经对代码进行修改。
	        // 修改过程中发现， xxim_online必须有，所以removeClass()后再加上xxim_online
	        node.online.removeClass(); // 移除所有类
	        node.online.addClass('xxim_online'); // 添加 xxim_online
	        if(0 === index){ // 在线
	        	XoW.logger.d(this.classInfo + "切换到在线");
	            node.onlinetex.html("在线"); // 更改页面显示的状态为在线
	            
	            currUser.sendOnline();
	        } else if(index === 1) {
	        	XoW.logger.d(this.classInfo + "切换到空闲");
	        	node.onlinetex.html("空闲");
	        	node.online.addClass('xxim_chat');
	        	
	        	currUser.sendChat();
	        } else if(index === 2) {
	        	XoW.logger.d(this.classInfo + "切换到正忙");
	        	node.onlinetex.html("正忙");
	        	node.online.addClass('xxim_dnd');
	        	
	        	currUser.sendDnd();
	        } else if(index === 3) {
	        	XoW.logger.d(this.classInfo + "切换到离开");
	        	node.onlinetex.html("离开");
	            node.online.addClass('xxim_away');
	            
	            currUser.sendAway();
	        } 
        }
        node.setonline.hide();
        XoW.logger.ms(this.classInfo + "设置状态");
    });
    
    node.xximon.on('click', xxim.expend);
    node.xximHide.on('click', xxim.expend);
    
    
    
    // keyup事件由于中文卡顿，所以改成了 focus + setInterval配合。
    // node.xximSearch.keyup(function(){
//	}
    
    //搜索
    node.xximSearch.focus(function(){
    	 //此处的搜索ajax参考xxim.getDates
    	
    	XoW.logger.ms(this.classInfo + "node.xximSearch.keyup(function(){");
    	
    	var oldOne = '';
    	var interval = setInterval(function() {
    		var val = $(this).val().replace(/\s/g, '');
            if(val !== ''){
                node.searchMian.show();
                node.closeSearch.show();
                
                if(oldOne == val) {
                	XoW.logger.d(this.classInfo + "没变");
                	return; 
                }
                oldOne = val;
                
                XoW.logger.d(this.classInfo + "开始搜索");
                var hasItem = false;
                var html = '';
                // 得到符合的好友  name和jid的node
                var myFriend = gblMgr.getUserMgr().searchUserFromFriends(val);
                XoW.logger.d(this.classInfo + "符合条件的数量" + myFriend.length);
                if(myFriend.length) {
                	hasItem = true;
                	html += '<li class="xxim_parentnode xxim_liston" >'
                			+'<h5><i></i><span>我的好友</span><em class="xxim_nums">--符合条件[' + myFriend.length + ']人</em></h5>'
                			+'<ul class="xxim_chatlist" style="display: block;">';
                }
            	for(var i = 0; i < myFriend.length; i++) {
            		XoW.logger.p({name : myFriend[i].name, jid : myFriend[i].jid, });
            		html += gblMgr.getViewMgr().friendHtml(myFriend[i]);
            	};
            	if(myFriend.length) {
            		html += '</ul></li>';
            	}

                // 得到符合的room  房间的address和名称
                var rooms = gblMgr.getRoomMgr().searchRoomFromAllRooms(val);
                XoW.logger.d(this.classInfo + "符合条件的数量" + rooms.length);
                if(rooms.length) {
                	hasItem = true;
                	html += '<li class="xxim_parentnode xxim_liston" >'
                			+'<h5><i></i><span>会议室</span><em class="xxim_nums">--符合条件[' + rooms.length + ']间</em></h5>'
                			+'<ul class="xxim_chatlist" style="display: block;">';
                }
            	for(var i = 0; i < rooms.length; i++) {
            		XoW.logger.p({name : rooms[i].name, jid : rooms[i].jid, });
            		html += gblMgr.getViewMgr().roomHtml(rooms[i]);
            	};
            	if(rooms.length) {
            		html += '</ul></li>';
            	}
            	
            	// 得到符合的部门和人员。
            	
            	
                
                // 从服务器上得到符合的用户   只能jid的node
                // gblMgr.getViewMgr()
                gblMgr.getUserMgr().searchUserFromServer(val, function(params) {
                	XoW.logger.d(this.classInfo + "获取成功，条件是" + val);
//                	var params = {
//    				stanza : stanza,
//    				items : [],
//    				itemsExcludeMyFriend : [],
//    				itemsIsMyFriend : [],
//    			};
                	var strangers = params.itemsExcludeMyFriend;
                	XoW.logger.d(this.classInfo + "符合条件的数量" + strangers.length);
                	if(strangers.length) {
                    	hasItem = true;
                    	html += '<li class="xxim_parentnode xxim_liston" >'
                    			+'<h5><i></i><span>陌生人</span><em class="xxim_nums">--符合条件[' + strangers.length + ']人</em></h5>'
                    			+'<ul class="xxim_chatlist" style="display: block;">';
                    }
                	for(var i = 0; i < strangers.length; i++) {
                		XoW.logger.p({username : strangers[i].username, jid : strangers[i].jid, });
                		html +=  gblMgr.getViewMgr().strangeHtml(strangers[i].username, strangers[i].jid);
                	};
                	if(strangers.length) {
                		html += '</ul></li>';
                	}
                	
                	 if(!hasItem) {
                     	node.list.eq(3).html('<li class="xxim_errormsg">没有符合条件的结果</li>');
                     } else {
                     	node.list.eq(3).html(html);
                     }
                }, function(errorStanza) {
                	node.list.eq(3).html('<li class="xxim_errormsg">发生错误，从服务器获取数据失败</li>');
                	XoW.logger.d(this.classInfo + "发生错误");
                });
                // imconn.showSearch(val, node);
             //--   gblMgr.getViewMgr().friendSearch(val, node);
               
            } else {
            	XoW.logger.d(this.classInfo + "执行了hide");
                node.searchMian.hide();
                node.closeSearch.hide();
            }
    	}.bind(this), 100);
    	
    	node.xximSearch.one('blur',function() {
    		XoW.logger.d(this.classInfo + "执行了blur");
    		clearInterval(interval);
    	});
    		
        
        XoW.logger.me(this.classInfo + "node.xximSearch.keyup(function(){");
    });
    node.closeSearch.on('click', function(){
        $(this).hide();
        node.searchMian.hide();
        node.xximSearch.val('').focus();
    });
    
    //弹出聊天窗
    config.chatings = 0;
    node.list.on('click', '.xxim_childnode', function(){
        var othis = $(this);
        
        if('stranger' == othis.attr('type')) {
        	XoW.logger.d("弹出加好友窗口");
        	// gblMgr.getViewMgr().addFriend();
        	
        	gblMgr.getViewMgr().showAddStranger($('.xxim_onename', othis).text(), othis.attr('data-id'));
        } else {
        	XoW.logger.d("弹出窗口");
        	xxim.popchatbox(othis);
        }
        
        
    });
    
    //点击最小化栏
    node.layimMin.on('click', function(){
        $(this).hide();
        $('#layim_chatbox').parents('.xubox_layer').show();
    });
    
    
    //document事件
    dom[1].on('click', function(){
        node.setonline.hide();
        $('#layim_sendtype').hide();
    });
};

// 请求列表数据
// 已被自定义的替代了
/*
xxim.getDates = function(index){
	alert("执行了xxim.getDates");
	// 定义参数， api是当前要加载的，是好友，群组，或 最近联系人
	// xxim.node 应该是一些节点的集合
	// myf 得到当前所在的 是第几个列表。如果index=0，那么就是list列表的第一个，就是好友列表。
	// 可以参考最后一个xxim.view，就是主界面的html，上面有对应的class，可以找到。
    var api = [config.api.friend, config.api.group, config.api.chatlog],
        node = xxim.node, myf = node.list.eq(index);
    myf.addClass('loading'); // 给当前的界面显示载入进度
    // 使用json动态载入数据。
    config.json(api[index], {}, function(datas){ // 回调函数
    	// 遍历，载入数据
    	// 1代表成功，如果不是1，则显示 msg里面的信息
        if(datas.status === 1){ 
            var i = 0, myflen = datas.data.length, str = '', item;
            if(myflen > 1){
                if(index !== 2){
                    for(; i < myflen; i++){
                        str += '<li data-id="'+ datas.data[i].id +'" class="xxim_parentnode">'
                            +'<h5><i></i><span class="xxim_parentname">'+ datas.data[i].name +'</span><em class="xxim_nums">（'+ datas.data[i].nums +'）</em></h5>'
                            +'<ul class="xxim_chatlist">';
                        item = datas.data[i].item;
                        for(var j = 0; j < item.length; j++){
                            str += '<li data-id="'+ item[j].id +'" class="xxim_childnode" type="'+ (index === 0 ? 'one' : 'group') +'"><img src="'+ item[j].face +'" class="xxim_oneface"><span class="xxim_onename">'+ item[j].name +'</span></li>';
                        }
                        str += '</ul></li>';
                    }
                } else {
                    str += '<li class="xxim_liston">'
                        +'<ul class="xxim_chatlist">';
                    for(; i < myflen; i++){
                        str += '<li data-id="'+ datas.data[i].id +'" class="xxim_childnode" type="one"><img src="'+ datas.data[i].face +'"  class="xxim_oneface"><span  class="xxim_onename">'+ datas.data[i].name +'</span><em class="xxim_time">'+ datas.data[i].time +'</em></li>'; 
                    }
                    str += '</ul></li>';
                }
                myf.html(str);
            } else {
                myf.html('<li class="xxim_errormsg">没有任何数据</li>');
            }
            myf.removeClass('loading');
        } else {
            myf.html('<li class="xxim_errormsg">'+ datas.msg +'</li>');
        }
    }, function(){
        myf.html('<li class="xxim_errormsg">请求失败</li>');
        myf.removeClass('loading');
    });
};

*/

// discard
// 消息传输。
// 每次点开联系人，弹出聊天窗口后被调用，前提是点击联系人时当前没有任何已经存在
// 的聊天窗口。
/*
xxim.transmitIMbinding = function(){
//	alert("transmitIMbinding");
	var node = xxim.node, log = {};
	node.sendbtn = $('#layim_sendbtn'); // 发送按钮
	node.imwrite = $('#layim_write'); // 输入框
 
	// 发送事件
	log.send = function(){
		var data = {
			content: node.imwrite.val().replace(/^\n+|\n+$/g,""), // 消息这里有错
			id: xxim.nowchat.id,
			jid: xxim.nowchat.jid, // 【林兴洋增加2016-8-26】用的是JID
			sign_key: '', //密匙
			_: +new Date
     };

     if(data.content.replace(/\s/g, '') === ''){
         layer.tips('说点啥呗！', '#layim_write', 2);
         node.imwrite.focus();
     } else {
         //此处皆为模拟
         var keys = xxim.nowchat.type + xxim.nowchat.id;
         
         //聊天模版
         log.html = function(param, type){
             return '<li class="'+ (type === 'me' ? 'layim_chateme' : '') +'">'
                 +'<div class="layim_chatuser">'
                     + function(){
                         if(type === 'me'){
                             return '<span class="layim_chattime">'+ param.time +'</span>'
                                    +'<span class="layim_chatname">'+ param.name +'</span>'
                                    +'<img src="'+ param.face +'" >';
                         } else {
                             return '<img src="'+ param.face +'" >'
                                    +'<span class="layim_chatname">'+ param.name +'</span>'
                                    +'<span class="layim_chattime">'+ param.time +'</span>';      
                         }
                     }()
                 +'</div>'
                 +'<div class="layim_chatsay">'+ param.content +'<em class="layim_zero"></em></div>'
             +'</li>';
         };
         
         log.imarea = xxim.chatbox.find('#layim_area'+ keys); // 聊天内容区域
         // 将发送的消息显示在聊天页面上
         imconn.mylog("发送消息");
         imconn.mylog("config.user.name" + config.user.name);
         imconn.mylog("发送消息");
         var t = imutility.getCurrentDatetime();
         log.imarea.append(log.html({
             time: t,
             name: imconn.getCurrentUserName(),//config.user.name, // 直接到imconn里面去拿名字，有点麻烦啊
             face: imconn.getCurrentUserFace(),//config.user.face, // 直接到imconn里面去拿头像，麻烦
             content: imconn.filterFace(data.content)
         }, 'me'));
         // '<a href="http://www.baidu.com" target="_blank"/>' +
         node.imwrite.val('').focus();
         log.imarea.scrollTop(log.imarea[0].scrollHeight);
         // 调用imconn发送信息
         // 发送人的JID  jid : config.user.jid,
         // 消息内容 data.content
         // 接收人的JID  ： data.jid 
         // alert(data.jid + "  " + data.content);
        // alert("{" + data.content + "}");
         // imconn.sendPlainMessage(data.content, data.jid);
         imconn.sendRawMessage(data.content, data.jid, t);
         
     }
    
 };

 node.sendbtn.on('click', log.send); // 绑定发送事件
 
 node.imwrite.keyup(function(e){
     if(e.keyCode === 13){
         log.send();
     }
 });
};
 */

/**discard
 * 聊天时发出消息的模板
 */
/*
xxim.html = function(param, type){
    return '<li class="'+ (type === 'me' ? 'layim_chateme' : '') +'">'
    +'<div class="layim_chatuser">'
        + function(){
            if(type === 'me'){
                return '<span class="layim_chattime">'+ param.time +'</span>'
                       +'<span class="layim_chatname">'+ param.name +'</span>'
                       +'<img src="'+ param.face +'" >';
            } else {
                return '<img src="'+ param.face +'" >'
                       +'<span class="layim_chatname">'+ param.name +'</span>'
                       +'<span class="layim_chattime">'+ param.time +'</span>';      
            }
        }()
    +'</div>'
    +'<div class="layim_chatsay">'+ param.content +'<em class="layim_zero"></em></div>'
+'</li>';
};
*/

//xxim.delayMessage = function(msg, from, time) {
//	alert("得到离线消息了" + msg + " " + from + " " + time);
//};

//xxim.message = function(msg, from) {
//	//alert("得到消息了" + msg + " " + from);
//	imconn.mylog("xxim.message = function(msg, from) {  开始");
//	imconn.showMyThis(from, msg);
//	
//	imconn.mylog("xxim.message = function(msg, from) {  结束");
//	//imconn.showThis(liStr);
//	//alert("bbc");
//	// imconn.showMyThis(li);
//	//var li = $("ul.layim_chatlist li[data-id="+from+"]:first");
//		
//	
//};
//





// 渲染骨架，自调用函数，会直接执行的
/* 【林兴洋修改2016-8-27】将自执行函数分解成两块。由xxim.view分解成xxim.view和xxim.start
 * 	xxim.view还是马上执行，xxim.start()在imbinding.js中调用
 * 【原因】当我前面没有解析完，得到好友列表之前，不载入getDatasIMbinding.
 */
/*
xxim.view = (function(){
	// alert("执行了xxim.view");	
    var xximNode = xxim.layimNode = $('<div id="xximmm" class="xxim_main">'
            +'<div class="xxim_top" id="xxim_top">'
            +'  <div class="xxim_search"><i></i><input id="xxim_searchkey" /><span id="xxim_closesearch">×</span></div>'
            +'  <div class="xxim_tabs" id="xxim_tabs"><span class="xxim_tabfriend" title="好友"><i></i></span><span class="xxim_tabgroup" title="群组"><i></i></span><span class="xxim_latechat"  title="最近聊天"><i></i></span></div>'
            +'  <ul class="xxim_list" style="display:block"></ul>'
            +'  <ul class="xxim_list"></ul>'
            +'  <ul class="xxim_list"></ul>'
            +'  <ul class="xxim_list xxim_searchmain" id="xxim_searchmain"></ul>'
            +'</div>'
            +'<ul class="xxim_bottom" id="xxim_bottom">'
            +'<li class="xxim_online" id="xxim_online">'
                +'<i class="xxim_nowstate"></i><span id="xxim_onlinetex">在线</span>'
                +'<div class="xxim_setonline">'
                    +'<span><i></i>在线</span>'
                    +'<span class="xxim_setchat"><i></i>空闲</span>'
                    +'<span class="xxim_setdnd"><i></i>正忙</span>'
                    +'<span class="xxim_setaway"><i></i>离开</span>'
                    +'<span class="xxim_setoffline"><i></i>隐身</span>'
                +'</div>'
            +'</li>'
            +'<li class="xxim_mymsg" id="xxim_mymsg" title="通知"><i></i><a href="'+ config.msgurl +'" target="_blank"></a></li>'
            +'<li class="xxim_seter" id="xxim_seter" title="设置">'
                +'<i></i>'
                +'<div class="">'
                
                +'</div>'
            +'</li>'
            +'<li class="xxim_hide" id="xxim_hide"><i></i></li>'
            +'<li id="xxim_on" class="xxim_icon xxim_on"></li>'
            +'<div class="layim_min" id="layim_min"></div>'
        +'</ul>'
    +'</div>');
    
    dom[3].append(xximNode);
    xxim.renode();
    
//    xxim.event();
//    xxim.layinit();
}());
*/

/* 自己的  end */

//}(window);





