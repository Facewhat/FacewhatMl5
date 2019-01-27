/**
 * Created by cy on 2018/3/12.
 * 不要包含任何操作main页面的DOM代码
 */
'use strict';
var moduleNames = {};
if(XoW.config.resource === 'fwh5_desktop'){
  moduleNames = {layim : 'layim',
    layImEx: 'layImEx'
  };
} else {
  moduleNames = {layim : 'mobile',
    layImEx: 'layImExMobile'
  };
}
layui.extend({
  // {/}的意思即代表采用自有路径，即不跟随 base 路径
  // mobile会强制设置base路径，so...
  client: '{/}./scripts/layxow/layim.client',
  layImExMobile: '{/}./scripts/layxow/layim.mobile.extend',
  layImEx: '{/}./scripts/layxow/layim.extend'
}).use(['jquery', 'layer', moduleNames.layim,'client',moduleNames.layImEx], function () {
  var _this = this;
  var _client = layui.client;
  var _layer,_layIM, _layImEx;
  if(XoW.config.resource === 'fwh5_desktop'){
    _layer = layui.layer;
    _layIM = layui.layim;
    _layImEx = layui.layImEx;
  } else {
    _layer = layui.mobile.layer;
    _layIM = /*layui.layim*/ layui.mobile.layim;
    _layImEx = /*layui.layImEx*/ layui.layImExMobile;
  }
  var _classInfo = 'Controller';
  var _clientMode = XoW.ClientMode.NORMAL; // kefu -- 独立客服页面, briefkefu -- 嵌入式客服页面(暂不支持), normal -- 默认

  $(function () {
    XoW.logger.d("index.html on document ready");
    _clientMode = _getPar('mode');
    _client.getCache = _layIM.cache;
    if (_clientMode === XoW.ClientMode.KEFU) {
      // 独立客服页面
      _autoLogin();
    } else {
      // 正常页面
      $('#loginPage').load("login.html"); // 载入登陆页面
    }

    $("#clearLogs").bind("click", function () {
      $('#logContainer').text("");
    });
    $("#clearCache").bind("click", function () {
       //var chat = _layIM.cache().chat; // 这是指消息盒子中的未打开聊天，并非xow中chat概念
      var local;
      var cache =  layui.layim.cache();
      if(cache.mine) { // 已登录
        local = layui.data('layim')[cache.mine.id];
      } else if($('#username').val()) {
        local = layui.data('layim')[$('#username').val()];
      } else {
        _layer.alert('请输入待清空数据的用户id');
        return;
      }
      delete local.chatlog; // 删除本地聊天记录为例
      delete local.history;

      // 以上代码没卵用
      localStorage.clear();
      _layer.alert('清理成功');
    });
  });

  // region 网络消息回调，通知界面
  _client.on(XoW.VIEW_EVENT.V_LOGIN_STATE_CHANGED, function (params) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_LOGIN_STATE_CHANGED);
    if (params.succ) {
      if($("#loginPage").is(":hidden")){
        XoW.logger.d('Reconnected, return.');
        _layImEx.setMineStatus(XoW.UserState.ONLINE);
        _layImEx.closeReConnLoadTip();
        var msg = {
          system: true,
          content: '连接已恢复',
          Timestamp: new Date().getTime()
        };
        _layImEx.notifyToChatBoxes(msg);
        return;
      }
      $('#loginPage').css({display: 'none'}); // 隐藏登录界面div
      $('#mainPage').css({display: ''}); // 显示主页面的div
      _layInit(params.data);
    } else {
      $("#loginState").text(params.data);
    }
  });
  _client.on(XoW.VIEW_EVENT.V_DISCONNECTED, function () {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_DISCONNECTED);
    if(!$("#loginPage").is(":hidden")){
      XoW.logger.d('Disconnected by login page, return.');
      return;
    }
    // WIFI场景下断网 websocket close 延迟厉害
    _layImEx.setMineStatus(XoW.UserState.OFFLINE);
    _layer.msg('连接断开<br>可能您打开了新的屯聊页面或网络故障导致', {
      btn: ['知道了', '尝试重连', '关闭本页面'],
      time: 0,
      btn2: function(){
        _layImEx.openReConnLoadTip();
        _client.reconnect();
      },
      btn3: function(){
        window.opener=null;
        window.open('','_self');
        window.close();
      }
    });

    var msg = {
      system: true,
      content: '连接断开',
      Timestamp: new Date().getTime()
    };
    _layImEx.notifyToChatBoxes(msg);
  });
  _client.on(XoW.VIEW_EVENT.V_FRIEND_AVATAR_CHANGED, function (params) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_FRIEND_AVATAR_CHANGED);
    if (!params.isMine) {
      _layImEx.changeFriendAvatar(params);
    }
    // layer.alert(JSON.stringify(params));
    return true;
  });
  _client.on(XoW.VIEW_EVENT.V_FRIEND_NICKNAME_CHANGED, function (pFriend) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_FRIEND_NICKNAME_CHANGED);
    if (pFriend.vcard && pFriend.vcard.isMine) {
      _layImEx.changeMineUsername(pFriend.username);
    } else {
      _layImEx.changeFriendNick(pFriend);
    }
    // layer.alert(JSON.stringify(params));
    return true;
  });
  _client.on(XoW.VIEW_EVENT.V_FRIEND_SIGN_CHANGED, function(pFriend) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_FRIEND_SIGN_CHANGED);
    if (pFriend.vcard && pFriend.vcard.isMine) {
      _layImEx.changeMineSign(pFriend.sign);
    } else {
      _layImEx.changeFriendSign(pFriend);
    }
  });
  _client.on(XoW.VIEW_EVENT.V_FRIEND_STATUS_CHANGED, function (pFriend) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_FRIEND_STATUS_CHANGED + pFriend.status);
    _layIM.setFriendStatus(pFriend.id, pFriend.status);
    if (pFriend.status == 'offline') {
      _layIM.setChatStatus('<span style="color:#455052;">离线</span>');
    } else if (pFriend.status == 'online') {
      _layIM.setChatStatus('<span style="color:#455052;">在线</span>');
    } else {
      _layIM.setChatStatus('<span style="color:#888f7f;"></span>');
    }
    return true;
  });
  _client.on(XoW.VIEW_EVENT.V_ERROR_PROMPT, function (params) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_ERROR_PROMPT);
    _layer.alert(params);
    return true; // 如果返回的不是true则将该触发器会被移除。
  });
  _client.on(XoW.VIEW_EVENT.V_CHAT_MSG_RCV, function (params) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_CHAT_MSG_RCV);
    params.type = 'friend';
    if (!params.avatar) {
      params.avatar = XoW.DefaultImage.AVATAR_DEFAULT;
    }

    // test
    //var temp = '<div style="color:#00FF00"><h3>This is a header</h3><p>This is a paragraph.</p></div>';
    //params.content = _layIM.content(temp);//_layImEx.remixContent(temp);
    _layIM.searchMessage(params);
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_CHAT_MSG_RCV);
  });

  // region file transform
  _client.on(XoW.VIEW_EVENT.V_CHAT_FILE_TRANS_REQ_RCV, function (pFile) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_CHAT_FILE_TRANS_REQ_RCV);
    pFile.type = 'friend';
    if (!pFile.avatar) {
      pFile.avatar = XoW.DefaultImage.AVATAR_DEFAULT;
    }
    _layImEx.searchMessage(pFile);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_CHAT_FILE_TRANS_REQ_RCV);
  });
  _client.on(XoW.VIEW_EVENT.V_CHAT_IMAGE_RCV, function (pFile) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_CHAT_IMAGE_RCV);
    _layImEx.searchMessage(pFile);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_CHAT_IMAGE_RCV);
  });
  _client.on(XoW.VIEW_EVENT.V_CHAT_IMAGE_TRANS_REQ_SUC, function (params) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_CHAT_IMAGE_TRANS_REQ_SUC);
    _layImEx.pushExtMsg(params);
    // _layImEx.putFileThumbnailOnPanel(params);
  });
  _client.on(XoW.VIEW_EVENT.V_CHAT_FILE_TRANS_REQ_SUC, function (params) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_CHAT_FILE_TRANS_REQ_SUC);
    _layImEx.pushExtMsg(params);
    // _layImEx.putFileThumbnailOnPanel(params);
  });
  _client.on(XoW.VIEW_EVENT.V_FILE_STATE_CHANGED, function (params) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_FILE_STATE_CHANGED);
    _layImEx.changeFileStatus(params);
  });
  _client.on(XoW.VIEW_EVENT.V_FILE_OVERDUE, function (params) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_FILE_OVERDUE);
    _layImEx.changeFileStatus(params);
  });
  // endregion file transform

  // region contact subscription
  _client.on(XoW.VIEW_EVENT.V_USER_SEARCH_RSP_RCV, function (params) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_USER_SEARCH_RSP_RCV);
    _layImEx.setUserSearchResult(params.itemsExcludeFriend);
  });
  _client.on(XoW.VIEW_EVENT.V_FRIEND_ADDED, function (pUser) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_FRIEND_ADDED);
    pUser.groupid = pUser.groupid || _layIM.cache().friend[0].id;
    _layIM.addList(pUser);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_FRIEND_ADDED);
  });
  _client.on(XoW.VIEW_EVENT.V_FRIEND_REMOVED, function (pUser) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_FRIEND_REMOVED);
    _layIM.removeList({
      type: 'friend'
      ,id: pUser.id
    });
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_FRIEND_REMOVED);
  });
  _client.on(XoW.VIEW_EVENT.V_SUB_ME_REQ_RCV, function (pSubMsg) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_SUB_ME_REQ_RCV);
    _layImEx.pushSysInfo(pSubMsg);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_SUB_ME_REQ_RCV);
  });
  _client.on(XoW.VIEW_EVENT.V_SUB_CONTACT_REQ_SUC, function (pSubMsg) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_SUB_CONTACT_REQ_SUC);
    _layer.msg('好友申请已发送，请等待对方确认', {
      icon: 1
      ,shade: 0.5
    }, function(){
      _layer.close(_layer.index - 1);
    });
    pSubMsg.item.groupid =  pSubMsg.item.groupid || _layIM.cache().friend[0].id;
    _layImEx.pushSysInfo(pSubMsg, false);
    pSubMsg.item.username = pSubMsg.item.username + '(Pending)';
    _layIM.addList( pSubMsg.item);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_SUB_CONTACT_REQ_SUC);
  });
  _client.on(XoW.VIEW_EVENT.V_SUB_CONTACT_BE_APPROVED, function (pSubMsg) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_SUB_CONTACT_BE_APPROVED);
    _layImEx.pushSysInfo(pSubMsg);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_SUB_CONTACT_BE_APPROVED);
  });
  _client.on(XoW.VIEW_EVENT.V_SUB_CONTACT_BE_DENIED, function (pSubMsg) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_SUB_CONTACT_BE_DENIED);
    _layImEx.pushSysInfo(pSubMsg);
    _layIM.removeList({
      type:'friend',
      id: pSubMsg.item.id
    });
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_SUB_CONTACT_BE_DENIED);
  });
  // endregion contact subscription

  _client.on(XoW.VIEW_EVENT.V_NEW_INFO_ADDED, function (pSubMsg) {
    XoW.logger.ms(_classInfo, XoW.VIEW_EVENT.V_NEW_INFO_ADDED);
    _layImEx.pushSysInfo(pSubMsg);
    XoW.logger.me(_classInfo, XoW.VIEW_EVENT.V_NEW_INFO_ADDED);
  });
  // endregion 网络消息回调，通知界面

  // region UI CAllBack By LayIM
  //监听在线状态的切换事件
  _layIM.on('online', function (data) {
    var msg = '暂不支持修改状态 {0}'.f(data);
    if(data === XoW.UserState.ONLINE) {
      msg += '<br>如须重新登录请刷新页面';
    }
    _layer.msg(msg);
  });
  //监听签名修改
  _layIM.on('sign', function (value) {
    _layer.msg('暂不支持修改心情');
  });
  /**
   * 监听layim建立就绪,注意：
   * 简约模式（即brief: true时）不会触发该事件
   * init直接赋值mine、friend的情况下（只有设置了url才会执行 ready 事件）
   */
  _layIM.on('ready', function (res) {
    XoW.logger.ms(_classInfo, 'on(ready, {0})'.f(res));
    _layImEx.onReady();
    if (_clientMode === XoW.ClientMode.KEFU) {
      var token = JSON.parse(_getPar('token'));
      var toId = token.to;
      if (!toId) {
        XoW.logger.e('There is no toId, return.');
        return;
      }
      // 在好友列表中找
      var theCusSvr = _client.getContactById(toId);
      if (!theCusSvr) {
        theCusSvr = {
          name: toId, //名称
          username: toId,
          type: 'friend', //聊天类型不能用 kefu
          avatar: XoW.DefaultImage.AVATAR_KEFU,
          id: toId,
          jid: toId + '@' + XoW.config.domain,
          temporary: true
        };
      } else {
        theCusSvr.type = 'friend';
        theCusSvr.temporary = false;
      }
      _layIM.chat(theCusSvr);

      // content template
      //>[linkEx(url)[{"title":"某商品","description":"价格$2.7 质量上乘","image":"../images/prod.jpg"}]
      var getMsg = _getPar('msg');
      if(!getMsg) {
        XoW.logger.e('There is no parameter of micro data for the the page, return.');
        return;
      }
      var msg={
        content: 'linkEx[{0}]'.f(getMsg),
        mine: true,
        avatar: _client.getCurrentUser().avatar,
        username: _client.getCurrentUser().username
      };
      _layImEx.pushExtMsg(msg);
    }
    // _layIM()
  });
  //监听发送消息
  _layIM.on('sendMessage', function (data) {
    XoW.logger.ms(_classInfo, 'sendMessage');
    if (!data.to.jid) {
      // todo 获得presence的时候需要去获得resource
      // 客服模式
      var toJid = data.to.id + '@' + XoW.utils.getIPFromURL(XoW.config.serviceUrl);
      _client.sendMessage(data.mine.content, toJid);
    } else {
      // 主动发起的对话,data.to表示friend
      _client.sendMessage(data.mine.content, data.to.jid);
    }
    //console.log(data);
  });
  //监听查看群员
  _layIM.on('members', function (data) {
    //console.log(data);
  });
  //监听聊天窗口的切换
  _layIM.on('chatChange', function (res) {
    XoW.logger.ms(_classInfo, 'chatChange({0},{1})'.f(res.data.type, res.data.jid));
    var type = res.data.type;
    var jid = res.data.jid;
    if (!jid) {
      _layer.alert('No Jid of that chat.');
      return;
    }
    if (type === 'friend') {
      _layImEx.rebindToolFileButton(_fileSelectedCb.bind(_this));
    } else if (type === 'group') {
      //模拟系统消息
      _layIM.searchMessage({
        system: true
        , id: res.data.id
        , type: "group"
        , content: '模拟群员' + (Math.random() * 100 | 0) + '加入群聊'
      });
    }
    XoW.logger.me(_classInfo, 'chatChange({0})'.f(res.data.jid));
  });
  //监听自定义工具栏点击，添加代码
  _layIM.on('tool(code)', function(pInsert, pSendMessage){
    XoW.logger.ms(_classInfo, 'tool(code)()');
    _layer.prompt({
      title: '插入代码'
      ,formType: 2
      ,shade: 0
    }, function(text, index){
      _layer.close(index);
      pInsert('[pre class=layui-code]' + text + '[/pre]'); //将内容插入到编辑器
      pSendMessage();
    });
    XoW.logger.me(_classInfo, 'tool(code)()');
  });
  _layIM.on('tool(link)', function(pInsert, pSendMessage){
    _layer.prompt({
      title: '请输入网页地址'
      ,shade: false
      ,offset: [
        this.offset().top - $(window).scrollTop() - 158 + 'px'
        ,this.offset().left + 'px'
      ]
    }, function(src, index) {
      var regExp = /(https?):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/
      if(!regExp.test(src)) {
        _layer.msg('网址格式错误,格式范例"http://www.baidu.com"');
        XoW.logger.d('Invalid href format,return.');
        return;
      }
      _layer.close(index);

      // 不支持跨域
      $.ajax({
        async: false,
        url: src,
        type: 'GET',
        dataType: "html",
        timeout: 5000,
        success: function (data) {
          var doc = (new DOMParser()).parseFromString(data, "text/html");
          var content = {
            url:$('meta[property="og:url"]', doc) ? $('meta[property="og:url"]', doc).attr('content') : '',
            type:$('meta[property="og:type"]', doc) ? $('meta[property="og:type"]', doc).attr('content') : '',
            image:$('meta[property="og:image"]', doc) ? $('meta[property="og:image"]', doc).attr('content') : '',
            title:$('meta[property="og:title"]', doc) ? $('meta[property="og:title"]', doc).attr('content') : '',
            description:$('meta[property="og:description"]', doc) ? $('meta[property="og:description"]', doc).attr('content') : ''
          };
          var msg = 'linkEx[{0}]'.f(JSON.stringify(content));
          pInsert(msg);
          pSendMessage();
        },
        error: function(jqXHR, textStatus, errorThrown) {
          _layer.msg('网络不可达或跨域了.'); // 若使用dataType: 'jsonp'来跨域，也不支持返回为html/text的类型
        }
      });
    });
  });
  // endregion UI CAllBack By LayIM

  // region UI Callback By LayIM.extend
  _layImEx.on('getMyInfo', function (pSucCb) {
    XoW.logger.ms(_classInfo, 'getMyInfo()');
    _client.getMyInfo(pSucCb);
    XoW.logger.me(_classInfo, 'setMyInfo()');
  });
  _layImEx.on('setMyInfo', function (param, pSucCb) {
    XoW.logger.ms(_classInfo, 'setMyInfo()');
    var vCardTemp = new XoW.VCard();
    vCardTemp.NICKNAME = param.nickname;
    vCardTemp.BDAY = param.birthday;
    vCardTemp.DESC = param.signature;
    vCardTemp.WORK.CELL_TEL = param.telephone;
    vCardTemp.EMAIL = param.email;
    // gender not implement yet.
    _client.setMyInfo(vCardTemp, pSucCb, 3 * 1000);
    XoW.logger.me(_classInfo, 'setMyInfo()');
  });
  _layImEx.on('pushExtMsg', function (param) {
    XoW.logger.ms(_classInfo, 'pushExtMsg({0},{1})'.f(param.sid, param.to));
    XoW.logger.me(_classInfo, 'pushExtMsg()');
  });
  _layImEx.on('acceptFile', function (param) {
    XoW.logger.ms(_classInfo, 'acceptFile({0},{1})'.f(param.sid, param.jid));
    _client.acceptFile(param.sid, param.jid);
    XoW.logger.me(_classInfo, 'acceptFile()');
  });
  _layImEx.on('rejectFile', function (param) {
    XoW.logger.ms(_classInfo, 'rejectFile({0},{1})'.f(param.sid, param.jid));
    _client.rejectFile(param.sid, param.jid);
    XoW.logger.me(_classInfo, 'rejectFile()');
  });
  _layImEx.on('openFile', function (param) {
    XoW.logger.ms(_classInfo, 'acceptFile({0},{1})'.f(param.sid, param.jid));
    _client.downLoadFile(param.sid, param.jid);
    XoW.logger.me(_classInfo, 'acceptFile()');
  });
  _layImEx.on('stopFile', function (param) {
    XoW.logger.ms(_classInfo, 'stopFile({0},{1})'.f(param.sid, param.jid));
    _client.stopFileTrans(param.sid, param.jid);
    XoW.logger.me(_classInfo, 'stopFile()');
  });
  _layImEx.on('cancelFile', function (param) {
    XoW.logger.ms(_classInfo, 'cancelFile({0},{1})'.f(param.sid, param.jid));
    _client.cancelFile(param.sid, param.jid);
    XoW.logger.me(_classInfo, 'cancelFile()');
  });
  _layImEx.on('searchUser', function (param) {
    XoW.logger.ms(_classInfo, 'searchUser({0})'.f(param.username));
    _client.searchUser(param.username, 3 * 1000);
    XoW.logger.me(_classInfo, 'searchUser()');
  });
  _layImEx.on('rmvContact', function (pUser) {
    XoW.logger.ms(_classInfo, 'removeContact({0})'.f(pUser.id));
    _client.rmvContact(pUser);
    XoW.logger.me(_classInfo, 'removeContact()');
  });
  _layImEx.on('subContact', function (pUser) {
    XoW.logger.ms(_classInfo, 'subContact({0})'.f(pUser.id));
    _client.subContact(pUser);
    XoW.logger.me(_classInfo, 'subContact()');
  });
  _layImEx.on('approveUserSub', function (pUser) {
    XoW.logger.ms(_classInfo, 'approveUserSub({0})'.f(pUser.jid));
    _client.approveUserSub(pUser);
    XoW.logger.me(_classInfo, 'approveUserSub()');
  });
  _layImEx.on('denyUserSub', function (pUser) {
    XoW.logger.ms(_classInfo, 'approveUserSub({0})'.f(pUser.jid));
    _client.denyUserSub(pUser);
    XoW.logger.me(_classInfo, 'denyUserSub()');
  });
  _layImEx.on('searchChatLog', function (pParam, pCallback) {
    XoW.logger.ms(_classInfo, 'searchChatLog({0})'.f(pParam.withJid));
    _client.searchChatLog(pParam, pCallback,  3 * 1000);
    XoW.logger.me(_classInfo, 'searchChatLog()');
  });
  // endregion UI Callback By LayIM.extend

  // region Private Methods
  function _layInit(params) {
    XoW.logger.ms(_classInfo, '_layInit()');
    params.mine = _layIM.cache().temp;
    params.mine.status = XoW.UserState.ONLINE;
    _layIM.cache().temp = null;
    //基础配置
    _layImEx.config({init: params});

    // Simulated room acquisition
    var rooms = {
      url: '../json/getRooms.json'
      ,type: 'get'
      ,data: {}
    };
    // that do not support sync post = =!
    // layim mobile不支持post方法
    // $.post( rooms, function(res) {
    $.get( '../json/getRooms.json', {},  function(res, status, xhr) {
      XoW.logger.d('success to get rooms');
      $.each(res.data.group, function(i, item){
        item.type = 'group';
        _layIM.addList(item);
      });
    }, 'json');

    XoW.logger.me(_classInfo, '_layInit()');
  }

  /**
   * 获取url get参数
   * @param par
   * @returns {*}
   */
  function _getPar(par) {
    XoW.logger.ms(_classInfo, '_getPar()');
    //获取当前URL
    var local_url = document.location.href;
    //获取要取得的get参数位置
    var get = local_url.indexOf(par + "=");
    if (get == -1) {
      return false;
    }
    //截取字符串
    var get_par = local_url.slice(par.length + get + 1);
    //判断截取后的字符串是否还有其他get参数
    var nextPar = get_par.indexOf("&");
    if (nextPar != -1) {
      get_par = get_par.slice(0, nextPar);
    }
    return decodeURIComponent(get_par);
  }

  /**
   * 自动登录，发布时需要硬编码地址和密码（暂时采用通用密码）
   */
  function _autoLogin() {
    XoW.logger.ms(_classInfo, '_autoLogin()');
    var token = JSON.parse(_getPar('token'));
    var username = token.from;
    _client.login(XoW.config.serviceUrl,
      username,
      XoW.config.password,
      XoW.config.resource);
    XoW.logger.me(_classInfo, '_autoLogin()');
  }

  var _fileSelectedCb = function (pThatChat, pFileInfo, pData) {
    var toFullJid = XoW.utils.getFullJid(pThatChat.data.jid, pThatChat.data.resource);
    _client.sendFile(pFileInfo.name, pFileInfo.size, pFileInfo.type, toFullJid, pData);
  };
  // endregion Private Methods
});