/**
 * Created by cy
 * It's an extension of layim, which should not depends on logic layer of xow,
 * but may be depends on the tools, constants or entities that from xow.
 */
//layui.define(['layer', 'laytpl', 'layim'], function (exports) {
layui.define(['layer', 'laytpl', 'element', 'flow', 'layim', 'client'], function (exports) {
  // region Fields
  this.classInfo = 'layImEx';
  var $ = layui.$;
  var _layer = layui.layer;
  var _layTpl = layui.laytpl;
  var _layIM = layui.layim;
  var _layFlow = layui.flow;
  //var _layim = layui.mobile.layim;

  var THIS = 'layim-this', MAX_ITEM = 20;
  var _this = this;

  // layui.data('layim')[_cache.mine.id] 保存当前数据
  //>history:最近联系人
  //>cache.message:未读消息，读取之后会被清空
  //>cache.chat:未读联系人，读取之后会被清空
  //>cache.local.chatLog:上一次（登录前）聊天记录，不会实时刷新
  var _$layMain,_$sysInfoBox, _device, _cache;
  // endregion Fields

  // region UI templates
  var _eleFriendMenu = [
    '<ul id="{{# "contextMenu_" + d.id }}" data-type="{{ d.type }}"  data-id="{{ d.id }}">'
    ,'<li layImEx-event="menu_chat"><i class="layui-icon" >&#xe611;</i>  发送即时消息</li>'
    ,'<li layImEx-event="menu_profile"><i class="layui-icon">&#xe60a;</i>  查看资料</li>'
    ,'<li layImEx-event="menu_history"><i class="layui-icon">&#xe60e;</i>  消息记录</li>'
    ,'<li layImEx-event="menu_rm_friend"><i class="layui-icon">&#xe640;</i>  删除好友</li>'
    ,'<li layImEx-event="menu_move_to">移动至</li>'
    ,'<li layImEx-event="menu_create_group">新建分组</li>'
    ,'</ul>'
  ].join('');

  //聊天内容列表模版
  var _elemChatMain = [
    '<li {{ d.mine ? "class=layim-chat-mine" : "" }} {{# if(d.cid){ }}data-cid="{{d.cid}}"{{# } }}>'
    ,'<div class="layim-chat-user"><img src="{{ d.avatar }}"><cite>'
    ,'{{# if(d.mine){ }}'
    ,'<i>{{ layui.data.date(d.timestamp) }}</i>{{ d.username||"佚名" }}'
    ,'{{# } else { }}'
    ,'{{ d.username||"佚名" }}<i>{{ layui.data.date(d.timestamp) }}</i>'
    ,'{{# } }}'
    ,'</cite></div>'
    ,'<div class="layim-chat-text">{{ layui.data.content(d.content||"&nbsp") }}</div>'
    ,'</li>'].join('');

  var _eleImage = [
    ,'<div class="layim_file" sid="{{ d.sid }}">'
    ,'  <div class="layim_fileinfo">'
    ,'    <img class="layui-layim-photos" ondragstart="return false;" src="data:image/;base64,{{ d.base64 }}" alt="缩略图模式">'
    ,'  </div>'
    ,'  {{# if(d.mine){ }}'
    ,'    <div class="layim_filestate">'
    ,'      <span id="fileProcess"> {{ d.getStatusDesc() }} </span>'
    ,'    </div>'
    ,'    <em class="layim_zero"></em>'
    ,'  {{# } }}'
    ,'</div>'
  ].join('');

  var _eleFileThumbnail = [
    ,'<div class="layim_file" sid="{{ d.sid }}">'
    ,'  <div class="layim_filepicture" ><span> {{ d.getTypeDesc() }} </span></div>'
    ,'  <div class="layim_fileinfo">'
    ,' 			<span class="layim_chatname">名称：{{ d.getTrimmedName() }} </span><br/>'
    ,' 			<span class="layim_chatname">大小：{{ d.getSizeDesc() }} </span><br/>'
    ,'  </div>'
    ,'  <div class="layim_filestate">'
    ,'  {{# if(d.mine){ }}'
    //,'    <span id="fileReceiveProcess">'
    ,'    {{# if (d.status == XoW.FileReceiveState.UNACCEPTED) { }} '
    ,'       <a href="javascript:void(0);" layImEx-event="cancel_file" style="color:red" id="fileStopReceive">取消</a>&nbsp;&nbsp;'
    ,'       <span id="fileProcess"> {{ d.getStatusDesc() }} </span>'
    ,'    {{# } else if (d.status == XoW.FileReceiveState.RECEIVING) { }}'
    ,'       <a href="javascript:void(0);" layImEx-event="stop_file" style="color:red" id="fileStopReceive">取消</a>&nbsp;'
    ,'       <span id="fileProcess"> {{ d.getStatusDesc() }} </span>'
    ,'    {{# } else if (d.status == XoW.FileReceiveState.CLOSED) { }}'
    ,'       <span id="fileProcess"> {{ d.getStatusDesc() }} </span>'
    ,'    {{# } else { }}'
    ,'       <span id="fileProcess"> {{ d.getStatusDesc() }} </span>'
    ,'    {{# } }}'
    ,'  {{# } else { }}'
    //,'    <span id="fileReceiveProcess">'
    ,'    {{# if (d.status == XoW.FileReceiveState.UNACCEPTED) { }} '
    ,'       <a href="javascript:void(0);" layImEx-event="accept_file" style="c olor:blue">接收</a>&nbsp;'
    ,'       <a href="javascript:void(0);" layImEx-event="reject_file" style="color:blue">拒绝</a>'
    ,'    {{# } else if (d.status == XoW.FileReceiveState.RECEIVING) { }}'
    ,'       <a href="javascript:void(0);" layImEx-event="stop_file" style="color:red" id="fileStopReceive">取消</a>&nbsp;'
    ,'       <span id="fileProcess"> {{ d.getStatusDesc() }} </span>'
    ,'    {{# } else if (d.status == XoW.FileReceiveState.CLOSED) { }}'
    ,'       <span id="fileProcess"> {{ d.getStatusDesc() }} </span>'
    ,'       <a href="javascript:void(0);" layImEx-event="open_file" style="color:blue">打开文件</a>'
    ,'    {{# } else { }}'
    ,'       <span id="fileProcess"> {{ d.getStatusDesc() }} </span>'
    ,'    {{# } }}'
    //,'    </span>'
    ,'  {{#  } }}  ' // not mine
    ,'  </div>'
    ,'  <em class="layim_zero"></em>'
    ,'</div>'
  ].join('');

  // todo data-type 暂时先设置为friend
  var _eleLocalSearchRes = ['' +
    '{{# layui.each(d, function(index, item){ var spread = true; }}'
    //,'<li>'
    ,'  <h5 layim-event="spread" lay-type="{{ spread }}"><i class="layui-icon">{{# if(spread === "true"){ }}&#xe61a;{{# } else {  }}&#xe602;{{# } }}</i><span>{{ item.title||"未命名分组"+index }}</span><em>(<cite class="layim-count"> {{ item.length }}</cite>)</em></h5>'
    ,'  <ul class="layui-layim-list {{# if(spread){ }} layui-show {{# } }}">'
    ,'    {{# if(item.length < 1) { }}'
    ,'       <li class="layim-null-item"> {{ "没找到" + item.title}} </li>'
    ,'    {{# } else { }}'
    ,'      {{# layui.each(item, function(subIndex, subItem){ }}'
    ,'          <li layim-event="chat" data-type="{{ subItem.type }}" data-index="{{ subItem.index }}" data-list="{{ subItem.list||""  }}"'
    ,'            class="layim-{{ subItem.type + subItem.id }} {{ subItem.status === "offline" ? "layim-list-gray" : "" }}">'
    ,'              <img src="{{ subItem.avatar }}">'
    ,'              <span>{{ subItem.name }}</span>'
    ,'              <p>{{ subItem.tag||subItem.sign||subItem.remark||"" }}</p><span class="layim-msg-status">new</span>'
    ,'            </li>'
    ,'      {{# }) }}'
    ,'    {{# } }}'
    ,'  </ul>'
   // ,'</li>'
    ,'{{# }) }}'].join('');

  var _eleRemoteSearch = [
    '<div class="layui-tab layui-tab-brief">'
    ,'  <ul class="layui-tab-title">'
    ,'    <li class="layui-this">找人</li>'
    ,'    <li class="">找聊天室</li>'
    ,'    <li class="">找聊天记录</li>'
    ,'  </ul>'
    ,'  <div class="layui-tab-content" style="height: 100px;">'
    ,'     <div class="layui-tab-item layui-show">'
    //,'      <div class="layui-container">'
    ,'        <div class="layui-row layui-col-space15">'
    ,'          <div class="layui-col-xs8">'
    ,'            <input class="layui-input" name="ipt_keyWord" id="ipt_keyWord" placeholder="请输入FaceWhat帐号/昵称/手机号" autocomplete="off" value="{{= d.username }}"/>'
    ,'          </div>'
    ,'          <div class="layui-col-xs3">'
    ,'            <button class="layui-btn" layImEx-event="search_user_remote" id="btn_search_user_remote">搜索</button>'
    ,'          </div>'
    ,'        </div>'
    //,'      </div>'
    ,'        <div id="search_user_remote_res"></div>'
    ,'     </div>'
    ,'     <div class="layui-tab-item">搜索聊天室，聊天室功能加了嘛</div>'
    ,'     <div class="layui-tab-item">搜索聊天记录，需要服务器端装载FaceWhat插件</div>'
    ,'  </div>'
    ,'</div>'].join('');

  var _eleRemoteSearchUserRes = [
    '{{# if(d.length > 0){ }}'
    ,'  <div style="padding: 20px; background-color: #F2F2F2;" class="layui-container">'
    ,'    <div class="layui-row layui-col-space15">'
    ,'      {{# layui.each(d, function(index, item){ }}'
    ,'            <div class="layui-col-xs4">'
    ,'              <div class="layui-card" data-type="friend" data-index="0" ">'
    ,'                <div class="layui-card-header">账号：{{ item.id }}</div>'
    ,'                <div class="layui-card-body">'
    ,'                  昵称：{{ item.username }}'
    ,'                  <button class="layui-btn layui-btn-xs" layImEx-event="add_friend" data-jid="{{ item.jid }}">'
    ,'                    <i class="layui-icon">&#xe608;</i>添加好友</button>'
    ,'                </div>'
    ,'              </div>'
    ,'            </div>'
    ,'      {{# }) }}' // for-each
    ,'    </div>' // row
    ,'  </div>' // container
    ,'{{# } else { }}'
    ,'  <div class="layui-row layui-col-space15">'
    ,'    <span class="layim-null">搜索结果为空</span>'
    ,'  </div>'
    ,'{{# } }}'
  ].join('');

  var _eleSysInfoBox = [
    '{{# layui.each(d.data, function(index, item){'
    ,'  if(item.item && "SUB_ME_REQ_RCV" === item.type){ }}'
    ,'    <li id={{ "sysInfo" + item.cid }} data-fromGroup="{{ item.from_group }}">'
    ,'      <a href="/u/{{ item.from }}/" target="_blank">'
    ,'        <img src="{{ item.item.avatar }}" class="layui-circle layim-msgbox-avatar">'
    ,'      </a>'
    ,'      <p class="layim-msgbox-user">'
    ,'        <a href="/u/{{ item.from }}/" target="_blank">{{ item.item.username||"" }}</a>'
    ,'        <span>{{ item.timestamp }}</span>'
    ,'      </p>'
    ,'      <p class="layim-msgbox-content">'
    ,'       {{ item.content }}'
    ,'        <span>{{ item.remark ? "附言: " + item.remark : "" }}</span>'
    ,'      </p>'
    ,'      <p class="layim-msgbox-btn">'
    ,'       {{# if(item.status === "untreated"){ }}'
    ,'        <button class="layui-btn layui-btn-small layui-btn-primary" data-jid="{{ item.from }}" layImEx-event="approve_user_sub">同意</button>'
    ,'        <button class="layui-btn layui-btn-small" data-jid="{{ item.from }}" layImEx-event="deny_user_sub">拒绝</button>'
    ,'       {{# }else{ }}'
    ,'          {{ item.status }}'
    ,'       {{# } }}'
    ,'      </p>'
    ,'    </li>'
    ,'  {{# } else { }}'
    ,'    <li class="layim-msgbox-system">'
    ,'      <p><em>系统：</em>{{ item.content }}<span>{{ item.timestamp }}</span></p>'
    ,'    </li>'
    ,'  {{# } }); }}'].join('');
  // endregion UI templates

  // region APIs
  var LAYIMEX = function () {
    XoW.logger.ms(_this.classInfo, 'constructor()');
    return _init(), this;
  };
  // 回调
  var call = {};
  /**
   * 监听事件
   */
  LAYIMEX.prototype.on = function (events, callback) {
    if (typeof callback === 'function') {
      call[events] ? call[events].push(callback) : call[events] = [callback];
    }
    return this;
  };
  LAYIMEX.prototype.changeMineUsername = function (params) {
    XoW.logger.ms(_this.classInfo, 'changeMineUsername({0})'.f(params));
    return _changeMineUsername(params), this;
  };
  LAYIMEX.prototype.changeFriendAvatar = function (params) {
    XoW.logger.ms(_this.classInfo, 'changeFriendAvatar({0})'.f(params.id));
    return _changeFriendAvatar(params), this;
  };
  LAYIMEX.prototype.changeFriendNick = function (params) {
    XoW.logger.ms(_this.classInfo, 'changeFriendNick({0})'.f(params.id));
    return _changeFriendNick(params), this;
  };
  LAYIMEX.prototype.changeFileStatus = function (pFileThumbnail) {
    XoW.logger.ms(_this.classInfo, 'changeFileStatus()');
    var thatChat = _getThisChat();
    if(!thatChat){
      XoW.logger.w('There is no such chat panel, return.');
      return;
    }
    var local = layui.data('layim')[_cache.mine.id];
    var chatLog = local.chatlog || {};
    var thisChatLog = chatLog[pFileThumbnail.type + pFileThumbnail.id];
    if (!thisChatLog) {
      XoW.logger.e('There is no chat log, return.');
      return;
    }
    var theFile = thisChatLog.find(function(x) {
      return x.sid == pFileThumbnail.sid;
    });
    if(!theFile) {
      XoW.logger.e('There is no such file, return.');
      return;
    }
    theFile = $.extend(theFile, {status: pFileThumbnail.status
      , errorMsg: pFileThumbnail.errorMsg
      , seq: pFileThumbnail.seq
      , blockSize: pFileThumbnail.blockSize
      , content: null});

    var $layimFile = $('.layim_file[sid=' + theFile.sid + ']');
    var thatFile = new XoW.File();
    thatFile.copyFrom(theFile);
    if(thatFile.getIsImage()) {
      thatFile.base64 = thatFile.content = pFileThumbnail.base64 || theFile.base64;
      thatFile.content = 'imgEx[{0}]'.f(JSON.stringify(thatFile)); // exclude base64
      thatFile.content = thatFile.content.replace('"content":', '"base64":');
      _layTpl(_eleImage).render(thatFile, function(html){
        //$layimFile.innerHTML = html;
        $layimFile.replaceWith(html);
      });
    } else {
      thatFile.content = 'fileEx(www.facewhat.com/file33)[{0}]'.f(JSON.stringify(thatFile));
      _layTpl(_eleFileThumbnail).render(thatFile, function(html){
        $layimFile.replaceWith(html);
      });
    }
    theFile.content = thatFile.content;
    delete thatFile;
    layui.data('layim', {
      key: _cache.mine.id
      ,value: local
    });
    XoW.logger.me(_this.classInfo, 'changeFileStatus()');
  };
  LAYIMEX.prototype.bindFriendListRightMenu = function () {
    XoW.logger.ms(_this.classInfo, 'bindFriendListRightMenu()');
    var hide = function () {
      _layer.closeAll('tips');
    };
    // 点击第一排好友，菜单位置有bug（如果菜单增高，聊天记录也有此问题）
    $('.layim-list-friend').on('contextmenu', '.layui-layim-list li', function (e) {
      var oThis = $(e.currentTarget);
      var type = oThis.data('type'), index = oThis.data('index');
      var list = oThis.attr('data-list') || oThis.index(), data = {};
      if(type === 'friend'){
        data = _cache[type][index].list[list];
      } else {
        XoW.e('The item type is error with {0}, return.'.type);
        return;
      }
      if (oThis.hasClass('layim-null')) return;
      _layer.tips(_layTpl(_eleFriendMenu).render(data), this, {
        tips: 1
        , time: 0
        , anim: 5
        , fixed: true
        , skin: 'layui-box layui-layim-contextmenu'
        , success: function (layerO) {
          var stopBubble = function (e) {
            layui.stope(e);
          };
          layerO.off('mousedown', stopBubble).on('mousedown', stopBubble);
          //var layerObj = $('#contextmenu_' + id).parents('.layui-layim-contextmenu');
          //_resetPosition(layerObj, -100, 0);
        }
      });
      $(document).off('mousedown', hide).on('mousedown', hide);
      $(window).off('resize', hide).on('resize', hide);
    });
    XoW.logger.me(_this.classInfo, 'bindFriendListRightMenu()');
  };
  LAYIMEX.prototype.rebindToolButtons = function () {
    XoW.logger.ms(_this.classInfo, 'rebindToolButtons()');
    var $toolSearch = $('li.layui-icon.layim-tool-search');
    if($toolSearch){
      $.each($toolSearch, function() {
        var $btn = $(this);
        this.removeAttribute('layim-event');
        $btn.attr('layImEx-event', 'open_local_search');
      });
    }

    var $msgBox = $('li.layui-icon.layim-tool-msgbox');
    if($msgBox){
      $.each($msgBox, function() {
        var $btn = $(this);
        this.removeAttribute('layim-event');
        $btn.attr('layImEx-event', 'open_sys_info_box');
      });
    }

    XoW.logger.me(_this.classInfo, 'rebindToolButtons()');
  };
  LAYIMEX.prototype.bindToolFileButton = function (pCallback) {
    XoW.logger.ms(_this.classInfo, 'bindToolFileButton()');
    var thatChat = _getThisChat();
    if(!thatChat){
      return;
    }
    // the tool box class name is 'layim-tool-image'
    var $fileToolboxs = thatChat.elem.find('.layim-chat-footer').find('.layim-chat-tool .layim-tool-image');
    $.each($fileToolboxs, function() {
      // 屏蔽掉layim.js中的操作，阻止上传文件
      var $fileInput = $(this);
      this.removeAttribute('layim-event');
      var type = this.getAttribute('data-type') || 'images';
      if(type === 'images'){
        $fileInput.find('input')[0].setAttribute('accept', '.png,.jpeg,.gif,.jpg')
      }
      // 离线状态屏蔽click操作
      $fileInput.click(function (e) {
        XoW.logger.ms(_this.classInfo, 'fileInput.click()');
        // 小小依赖了下XoW.UserState by cy
        if(thatChat.data.status === XoW.UserState.OFFLINE) {
          // 如果对方离线，则阻止打开文件窗口事件
          e.preventDefault();
          _layer.msg('对方已离线，无法发送文件');
        }
      });
      // 文件选定
      $fileInput.change(function (e) {
        XoW.logger.ms(_this.classInfo, 'fileInput.change({0})'.f($fileInput[0].children[0].value));
        var $file = e.target.files[0]; // $file.size is base64 size?
        var reader = new FileReader();
        // 得到文件的信息
        reader.onload = function (e) {
          XoW.logger.ms('FileReader.onload() '+ $file.name);
          if (pCallback) {
            pCallback(thatChat, $file, e.target.result);
          }
        };
        if ($file) {
          reader.readAsDataURL($file);
          $fileInput[0].children[0].value = ''; // reset input value
        }
        delete reader;
      });
    });
    XoW.logger.me(_this.classInfo, 'bindToolFileButton()');
  };
  LAYIMEX.prototype.getMessage = function(data) {
    XoW.logger.ms(_this.classInfo, 'getMessage()');
    _layIM.getMessage(data);
  };
  LAYIMEX.prototype.remixContent = function(data) {
    XoW.logger.ms(_this.classInfo, 'remixContent()');
  };
  LAYIMEX.prototype.setUserSearchResult = function(data) {
    XoW.logger.ms(_this.classInfo, 'setUserSearchResult()');
    _cache.searchResOfStranger = data;
    var $layimRes = $('#search_user_remote_res');
    _layTpl(_eleRemoteSearchUserRes).render(data, function (html) {
      $layimRes[0].innerHTML = html;
    });

    XoW.logger.me(_this.classInfo, 'setUserSearchResult()');
  }
  // copy from layim.sendMessage
  LAYIMEX.prototype.sendMessageEx = function(pMsg) {
    XoW.logger.ms(_this.classInfo, 'sendMessageEx()');
    pMsg.avatar = _cache.mine ? _cache.mine.avatar :  XoW.DefaultImage.AVATAR_DEFAULT;
    var thatChat = _getThisChat(), ul = thatChat.elem.find('.layim-chat-main ul');
    var maxLength = _cache.base.maxLength || 3000;
    if(pMsg.content.replace(/\s/g, '') !== ''){
      var noLimited = pMsg.getIsImage() || false
      if(pMsg.content.length > maxLength && !noLimited){
        return _layer.msg('内容最长不能超过'+ maxLength +'个字符')
      }
      ul.append(_layTpl(_elemChatMain).render(pMsg));

      _layIM.pushChatLog(pMsg);
      layui.each(call.sendMessageEx, function(index, item){
        item && item(pMsg);
      });
    }
    _chatListMore();
    XoW.logger.me(_this.classInfo, 'sendMessageEx()');
  };
  LAYIMEX.prototype.pushSysInfo = function(pMsg, pIsBlink) {
    XoW.logger.ms(_this.classInfo, 'pushSysInfo({0})'.f(pMsg.cid));
    pIsBlink = (typeof pIsBlink !== 'undefined') ?  pIsBlink : true;
    var has;
    var local = layui.data('layim')[_cache.mine.id] || {};
    local.sysInfo = local.sysInfo || [];
    local['hasUnreadSysInfo'] = true;
    //layui.each(local.sysInfo, function (idx, itm) {
    //  if (itm.cid === pMsg.cid ||
    //    (itm.from === pMsg.from &&
    //    itm.status === pMsg.status && itm.type === pMsg.type)) {
    //    XoW.logger.w('Duplicate data {0} received, break.'.f(itm.cid));
    //    has = true;
    //    itm.timestamp = pMsg.timestamp;
    //    return false;
    //  }
    //});
    //if (!has) {
      local.sysInfo.push(pMsg);
    //} else {
    //
    //}
    layui.data('layim', {
      key: _cache.mine.id
      ,value: local
    });

    if(pIsBlink) {
      _blinkSysInfoIcon();
    }
    XoW.logger.me(_this.classInfo, 'pushSysInfo()');
  };
  LAYIMEX.prototype.ready = function() {
    var local = layui.data('layim')[_cache.mine.id] || {};
    local['hasUnreadSysInfo'] = local['hasUnreadSysInfo'] || false;
    if(local['hasUnreadSysInfo']) {
      _blinkSysInfoIcon();
    }
  }
  // endregion APIs

  // region LayImEx-event handlers
  var events = {
    menu_history: function (oThis, e) {
      _layer.alert('这是右键菜单');
      _layer.closeAll('tips');
    },
    menu_rm_friend: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'menu_rm_friend()');
      var $par = oThis.parent();
      var id = $par.data('id');
      var data = _getFriendById(id);
      if(!data){
        XoW.e('There is no such user with id {0}, return.'.f(id));
        return;
      }
      layer.msg('确定删除好友 {0} 吗？'.f(data.username), {
        time: 0 //不自动关闭
        ,btn: ['确定', '取消']
        ,yes: function (index) {
          layui.each(call.rmvContact, function(i, item){
            item && item(data);});
          layer.close(index);
        } });
      XoW.logger.me(_this.classInfo, 'menu_rm_friend()');
    },
    accept_file: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'accept_file()');
      var $p = oThis.parent().parent();
      var sid = $p.attr('sid');
      if(!sid) {
        XoW.logger.e('There is no element with attribute sid, return.');
        return;
      }
      var thatChat = _getThisChat();
      if(!thatChat){
        return;
      }
      var param = {
        sid: sid,
        jid: thatChat.data.jid // bare jid
      }
      layui.each(call.acceptFile, function(index, item){
        item && item(param);});
      XoW.logger.me(_this.classInfo, 'accept_file()');
    },
    reject_file: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'reject_file()');
      var $p = oThis.parent().parent();
      var sid = $p.attr('sid');
      if(!sid) {
        XoW.logger.e('There is no element with attribute sid, return.');
        return;
      }
      var thatChat = _getThisChat();
      if(!thatChat){
        return;
      }
      var param = {
        sid: sid,
        jid: thatChat.data.jid // bare jid
      }
      layui.each(call.rejectFile, function(index, item){
        item && item(param);});
      XoW.logger.me(_this.classInfo, 'reject_file()');
    },
    open_file: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'open_file()');
      var $p = oThis.parent().parent();
      var sid = $p.attr('sid');
      if(!sid) {
        XoW.logger.e('There is no element with attribute sid, return.');
        return;
      }
      var thatChat = _getThisChat();
      if(!thatChat){
        return;
      }
      var param = {
        sid: sid,
        jid: thatChat.data.jid // bare jid
      }
      layui.each(call.openFile, function(index, item){
        item && item(param);});
      XoW.logger.me(_this.classInfo, 'open_file()');
    },
    cancel_file: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'cancel_file()');
      var $p = oThis.parent().parent();
      var sid = $p.attr('sid');
      if(!sid) {
        XoW.logger.e('There is no element with attribute sid, return.');
        return;
      }
      var thatChat = _getThisChat();
      if(!thatChat){
        return;
      }
      var param = {
        sid: sid,
        jid: thatChat.data.jid // bare jid
      }
      layui.each(call.cancelFile, function(index, item){
        item && item(param);});

      XoW.logger.me(_this.classInfo, 'cancel_file()');
    },
    // stop when transforming
    stop_file: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'stop_file()');
      var $p = oThis.parent().parent();
      var sid = $p.attr('sid');
      if(!sid) {
        XoW.logger.e('There is no element with attribute sid, return.');
        return;
      }
      var thatChat = _getThisChat();
      if(!thatChat){
        return;
      }
      var param = {
        sid: sid,
        jid: thatChat.data.jid // bare jid
      }
      layui.each(call.stopFile, function(index, item){
        item && item(param);});
      XoW.logger.me(_this.classInfo, 'stop_file()');
    },
    open_remote_search: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'open_remote_search()');
      var tag = oThis.attr('tag');
      var content = _eleRemoteSearch;
      if(tag) {
        content = _layTpl(_eleRemoteSearch).render({username: tag});
      }
      layer.close(events.open_remote_search.index);
      events.open_remote_search.index = _layer.open({
        type: 1 // 1表示页面内，2表示frame
        ,title: '查找'
        ,shade: false
        ,maxmin: true
        ,area: ['760px', '480px']
        //,skin: 'layui-box layui-layer-border'
        ,resize: true
        ,content: content
        ,success: function(layero, index) {
          XoW.logger.ms(_this.classInfo, 'open_remote_search.cb()');
          var $layimSearchBtn = $('#btn_search_user_remote');
          if(!$layimSearchBtn) {
            XoW.logger.e('There is no element of button, return.');
            return;
          }
          $layimSearchBtn.click();
          XoW.logger.me(_this.classInfo, 'open_remote_search.cb()');
        }
      });
      var $search = $('.layui-layim').find('.layui-layim-search');
      $search.find('input').val('');
      $search.hide();
      _layIM.events().tab(_layIM.events().tab.index|0);
      XoW.logger.me(_this.classInfo, 'open_remote_search()');
    },
    open_local_search: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'open_local_search()');
      var search = _getLayImMain().find('.layui-layim-search');
      var main = _getLayImMain().find('#layui-layim-search');
      var input = search.find('input'), find = function(){
        XoW.logger.ms(_this.classInfo, 'find()');
        var val = input.val().replace(/\s/);
        if(val === ''){
          // events.tab(events.tab.index|0);
        } else {
          var dataFriends = [], dataGroups = [], dataHistories = [];
          var friend = _cache.friend || [];
          var group = _cache.group || [];
          var html = '';
          for(var i = 0; i < friend.length; i++){
            for(var k = 0; k < (friend[i].list||[]).length; k++){
              if(friend[i].list[k].id.indexOfIgnoreCase(val) !== -1
                || friend[i].list[k].username.indexOfIgnoreCase(val) !== -1){
                var item = friend[i].list[k];
                item.type = 'friend';
                item.name = friend[i].list[k].username || '佚名';
                item.index = i;
                item.list = k;
                dataFriends.push(friend[i].list[k]);
              }
            }
          }
          for(var j = 0; j < group.length; j++){
            if(group[j].id.indexOfIgnoreCase(val) !== -1
              || group[j].groupname.indexOfIgnoreCase(val) !== -1){
              group[j].type = 'group';
              group[j].name = group[j].groupname || '未知聊天室';
              group[j].list = j;
              dataGroups.push(group[j]);
            }
          }
          var local = layui.data('layim')[_cache.mine.id] || {};
          var allChatLog = local.chatlog || {};
          var history = local.history || {};
          for (var key in allChatLog) {
            if (allChatLog.hasOwnProperty(key)) {
              for ( var i = allChatLog[key].length - 1; i >= 0; --i ){ // 倒序
                var msg = allChatLog[key][i];
              // layui.each(allChatLog[key], function (i, msg) {
                if (msg.content && msg.content.indexOf(val) !== -1) {
                  var item = history[key] || {};
                  item.type = 'history';
                  item.index = key;
                  item.tag = msg.content;
                  dataHistories.push(item);
                  break;
                }
              }
            }
          }

          if(dataFriends.length > 0 || dataGroups.length > 0 || dataHistories.length > 0) {
            dataFriends.title = "好友";
            dataGroups.title = "聊天室";
            dataHistories.title = "聊天记录";
            html = _layTpl(_eleLocalSearchRes).render({
              friends: dataFriends
              ,groups: dataGroups
              ,histories: dataHistories
            });
          } else {
            html = '<li class="layim-null">无本地查找结果</li>';
          }

          html += '<hr><li class="layim-null-redirect" layImEx-event="open_remote_search"  tag="'+ val + '">到查找面板查找"' + val +'"</li>';
          main.html(html);
          _layIM.events().tab(3);
        }
        XoW.logger.me(_this.classInfo, 'find()');
      };
      // if(!_cache.base.isfriend && _cache.base.isgroup){
      //   _layIM.events().tab.index = 1;
      // } else if(!_cache.base.isfriend && !_cache.base.isgroup){
      //   _layIM.events().tab.index = 2;
      // }
      search.show();
      input.focus();
      input.off('keyup', find).on('keyup', find);
      XoW.logger.me(_this.classInfo, 'open_local_search()');
    },
    search_user_remote: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'search_user_remote()');
      var $p = oThis.parent().parent();
      var $input = $p.find('input');
      if(!$input) {
        XoW.logger.e('There is no element of input, return.');
        return;
      }
      var val = $input.val().replace(/\s/);
      if(val === ''){
        XoW.logger.i('There is empty input, return.');
        return;
      }
      var param = {
        username: val
      }
      layui.each(call.searchUser, function(index, item){
        item && item(param);});
      XoW.logger.me(_this.classInfo, 'search_user_remote()');
    },
    add_friend: function(oThis, e) {
      XoW.logger.ms(_this.classInfo, 'add_friend()');
      var jid = e.currentTarget.dataset.jid;
      var stranger =  _cache.searchResOfStranger.find(function (x) {
        return x.jid === jid
      });
      stranger.type = 'friend';
      stranger.submit = function (pGroupName, pRemark, pIndex) {
        XoW.logger.ms(_this.classInfo, 'add_friend_submit()');
        var cont = $(window.event.currentTarget).parent().parent();
        this.groupid = pGroupName;
        this.remark = pRemark;
        this.username = '人工NICK_' + this.username;
        layui.each(call.subContact, function(index, item){
          item && item(stranger);});
        _layer.close(pIndex);
        XoW.logger.me(_this.classInfo, 'add_friend_submit()');
      }
      _layIM.add(stranger, 2);
      XoW.logger.me(_this.classInfo, 'add_friend()');
    },
    open_sys_info_box: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'open_sys_info_box()');
      var local = layui.data('layim')[_cache.mine.id] || {};
      local['hasUnreadSysInfo'] = false;
      var $noticeBoxElem = _getLayImMain().find('.layim-tool-msgbox');
      $noticeBoxElem.find('span').removeClass('layui-anim-loop layer-anim-05').html('');
      var content = _eleSysInfoBox;
      var unitNum = 6;
      local.sysInfo = local.sysInfo || [];
      var pageCount = local.sysInfo.length > unitNum ? local.sysInfo.length / unitNum : 1;
      var renderMsg = function (pPage, pCallback){
        pPage = pageCount - pPage; // reverse sort
        var curAy = local.sysInfo.slice(pPage * unitNum, (pPage + 1) * unitNum);
        if(!curAy) {
          return _layer.msg('没有更多数据了.');
        }
        pCallback && pCallback(curAy.reverse(), local.sysInfo.length / unitNum);
      };
      _layer.close(events.open_sys_info_box.index);
      events.open_sys_info_box.index = _layer.open({
        type: 1
        ,title: '消息盒子'
        ,shade: false
        ,maxmin: true
        ,area: ['600px', '520px']
        ,skin: 'layui-box layui-layer-border'
        ,resize: false
        ,content: '<ul class="layim-msgbox" id="LAY_view"></ul>'
        ,success: function(layero, index) {
          _$sysInfoBox = layero;
          _layFlow.load({
            elem: '#LAY_view' //流加载容器
            ,isAuto: false
            ,end: '<li class="layim-msgbox-tips">暂无更多新消息</li>'
            ,done: function(page, next){ //加载下一页
              renderMsg(page, function(data, pages){
                var html = _layTpl(_eleSysInfoBox).render({
                  data: data
                  ,page: page
                });
                next(html, page < pages);
              });
            }
          });
        }
      });

      layui.data('layim', {
        key: _cache.mine.id
        ,value: local
      });
      XoW.logger.me(_this.classInfo, 'open_sys_info_box()');
    },
    approve_user_sub: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'approve_user_sub()');
      var userJid = e.currentTarget.dataset.jid;
      var $grPar = oThis.parent().parent();
      _layIM.setFriendGroup({
        type: 'friend'
        ,username: $grPar.find('p.layim-msgbox-user>a').html()
        ,avatar:  $grPar.find('img.layim-msgbox-avatar')[0].src
        ,group: _cache.friend //获取好友列表数据
        ,submit: function(pGroupName, pIndex){
          XoW.logger.ms(_this.classInfo, 'agree_sub_submit()');
          var local = layui.data('layim')[_cache.mine.id] || {};
          layui.each(call.approveUserSub, function(index, item){
            item && item({
              jid: userJid,
              groupid: pGroupName,
              username: '人工NICK_'+ $grPar.find('p.layim-msgbox-user>a').html()
            });});
          _layer.close(pIndex);
          // todo if disconnected
          $grPar.find('.layim-msgbox-btn').html('已接受');

          var has, cid = $grPar.data.cid;
          local.sysInfo = local.sysInfo || [];
          layui.each(local.sysInfo, function (idx, itm) {
            if (itm.cid === cid ||
              (itm.from === userJid &&
              itm.status === 'untreated' &&
              itm.type === XoW.SERVICE_EVENT.SUB_ME_REQ_RCV)) {
              has = true;
              itm.status = '已接受';
              return false;
            }
          });
          if (!has) {
            XoW.logger.e('Cannot find the info from local, return.');
            return;
          }
          layui.data('layim', {
            key: _cache.mine.id
            ,value: local
          });
          XoW.logger.me(_this.classInfo, 'agree_sub_submit()');
        }
      });
      XoW.logger.me(_this.classInfo, 'approve_user_sub()');
    },
    deny_user_sub: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'deny_user_sub()');
      var userJid = e.currentTarget.dataset.jid;
      layui.each(call.denyUserSub, function(index, item){
        item && item({
          jid: userJid
        });});
      var $grPar = oThis.parent().parent();
      $grPar.find('.layim-msgbox-btn').html('已拒绝');

      var has, cid = $grPar.data.cid;
      var local = layui.data('layim')[_cache.mine.id] || {};
      local.sysInfo = local.sysInfo || [];
      layui.each(local.sysInfo, function (idx, itm) {
        if (itm.cid === cid ||
          (itm.from === userJid &&
          itm.status === 'untreated' &&
          itm.type === XoW.SERVICE_EVENT.SUB_ME_REQ_RCV)) {
          has = true;
          itm.status = '已拒绝';
          return false;
        }
      });
      if (!has) {
        XoW.logger.e('Cannot find the info from local, return.');
        return;
      }
      layui.data('layim', {
        key: _cache.mine.id
        ,value: local
      });
      XoW.logger.me(_this.classInfo, 'deny_user_sub()');
    }
  };
  // endregion LayImEx-event handlers

  // region Private Methods
  var _init = function () {
    XoW.logger.ms(_this.classInfo, '_init()');
    _device = layui.device();
    _cache = _layIM.cache();
    _$layMain = $('.layui-layim') || null;

    $('body').on('click', '*[layImEx-event]', function (e) {
      var oThis = $(this), method = oThis.attr('layImEx-event');
      events[method] ? events[method].call(this, oThis, e) : '';
    });
    XoW.logger.me(_this.classInfo, '_init()');
  };
  var _changeMineUsername = function (params) {
    XoW.logger.ms(_this.classInfo, '_changeMineAvatar()');
    $('.layui-layim-user').text(params);
    XoW.logger.ms(_this.classInfo, '_changeMineAvatar()');
  };
  var _changeFriendNick = function (params) {
    XoW.logger.ms(_this.classInfo, '_changeFriendNick({0})'.f(params.id));
    var id = params.id;
    var $list = $('.layim-friend' + id);
    var $span = $list.find('span');
    if ($span.length != 0) {
      XoW.logger.d(this.classInfo, '更新了好友列表中的昵称');
      $span.html(params.username);
    }
    // todo 如果正在聊天要改聊天面板头像
    XoW.logger.ms(_this.classInfo, '_changeFriendNick()');
  }
  var _changeFriendAvatar = function (params) {
    XoW.logger.ms(_this.classInfo, '_changeFriendAvatar({0})'.f(params.id));
    var id = params.id;
    var list = $('.layim-friend' + id);
    var img = list.find('img');
    // 判断是否存在头像这个标签，因为刚登陆进来，可能界面上还没有显示好友列表
    if (img.length != 0) { // img.length!=0表示是有img的
      XoW.logger.d(this.classInfo, '更新了好友列表中的头像');
      if (img.attr('src') != params.avatar) {
        img.attr('src', params.avatar);
      }
    }
    // todo 如果正在聊天要改聊天面板头像
    XoW.logger.me(_this.classInfo, "_changeFriendAvatar()");
  };
  var _resetPosition = function (pObj, pTop, pLeft) {
    if (pObj.length && pTop && pLeft) {
      var top = pObj.css('top').toLowerCase().replace('px', '');
      var left = pObj.css('left').toLowerCase().replace('px', '');
      top = parseInt(top) + pTop;
      left = parseInt(left) + pLeft;
      pObj.css({'left': left + 'px', 'top': top + 'px'});
    }
  };
  /**
   * 获取当前聊天面板,copy from layim.js
   * @returns {{elem: *, data, textarea: (*|{})}}
   * @private
   */
  var _getThisChat = function(){
    XoW.logger.ms(_this.classInfo, '_getThisChat()');
    // layimChat
    var $layimChat = _getChatEle();
    if(!$layimChat || $layimChat.length == 0){
      return null;
    }
    var index = $('.layim-chat-list .' + THIS).index();
    var cont = $layimChat.find('.layim-chat').eq(index);
    var to = JSON.parse(decodeURIComponent(cont.find('.layim-chat-tool').data('json')));
    return {
      elem: cont
      ,data: to
      ,textarea: cont.find('textarea')
    };
  };
  var _getChatEle = function() {
    var $layimChat = $('.layui-layer-page.layui-layim-chat');
    return $layimChat; // jquery对象
  };
  var _getLayImMain = function() {
    var $layimMain = $('#layui-layim');
    return $layimMain; // jquery对象
    // return $layimMain[0]; // dom对象
  };
  /**
   * copy from layim.js
   */
  var _chatListMore = function(){
    var thatChat = _getThisChat(), chatMain = thatChat.elem.find('.layim-chat-main');
    var ul = chatMain.find('ul');
    var length = ul.find('li').length;

    if(length >= MAX_ITEM){
      var first = ul.find('li').eq(0);
      if(!ul.prev().hasClass('layim-chat-system')){
        ul.before('<div class="layim-chat-system"><span layim-event="chatLog">查看更多记录</span></div>');
      }
      if(length > MAX_ITEM){
        first.remove();
      }
    }
    chatMain.scrollTop(chatMain[0].scrollHeight + 1000);
    chatMain.find('ul li:last').find('img').load(function(){
      chatMain.scrollTop(chatMain[0].scrollHeight+1000);
    });
  };
  var _getFriendById = function (pId) {
    XoW.logger.ms(_this.classInfo,  'getContactById({0})'.f(pId));
    var type = 'friend';
    for(var i = 0; i < _cache[type].length; i++) {
      var item =  _cache[type][i].list.find(function (x) {
        return x.id === pId
      });
      if(item) {
        return item;
      }
    }
    return null;
  };
  var _blinkSysInfoIcon = function () {
    XoW.logger.ms(_this.classInfo,  '_blinkSysInfoIcon()');
    if(!_getLayImMain()) return;
    var $msgBox = _getLayImMain().find('.layim-tool-msgbox');
    if($msgBox & $msgBox.hasClass('layui-anim-loop layer-anim-05')){
      $msgBox.find('span').html($msgBox.find('span').val() + 1);
    } else {
      $msgBox.find('span').addClass('layui-anim-loop layer-anim-05').html(1);
    }
    if(_cache.base.voice){
      _layIM.voice();
    }
    XoW.logger.me(_this.classInfo,  '_blinkSysInfoIcon()');
  };
  // endregion Private Methods

  // region Overload functions of layim
  var faces = function(){
    var alt = ["[微笑]", "[嘻嘻]", "[哈哈]", "[可爱]", "[可怜]", "[挖鼻]", "[吃惊]", "[害羞]", "[挤眼]", "[闭嘴]", "[鄙视]", "[爱你]", "[泪]", "[偷笑]", "[亲亲]", "[生病]", "[太开心]", "[白眼]", "[右哼哼]", "[左哼哼]", "[嘘]", "[衰]", "[委屈]", "[吐]", "[哈欠]", "[抱抱]", "[怒]", "[疑问]", "[馋嘴]", "[拜拜]", "[思考]", "[汗]", "[困]", "[睡]", "[钱]", "[失望]", "[酷]", "[色]", "[哼]", "[鼓掌]", "[晕]", "[悲伤]", "[抓狂]", "[黑线]", "[阴险]", "[怒骂]", "[互粉]", "[心]", "[伤心]", "[猪头]", "[熊猫]", "[兔子]", "[ok]", "[耶]", "[good]", "[NO]", "[赞]", "[来]", "[弱]", "[草泥马]", "[神马]", "[囧]", "[浮云]", "[给力]", "[围观]", "[威武]", "[奥特曼]", "[礼物]", "[钟]", "[话筒]", "[蜡烛]", "[蛋糕]"], arr = {};
    layui.each(alt, function(index, item){
      arr[item] = layui.cache.dir + 'images/face/'+ index + '.gif';
    });
    return arr;
  }();

  layui.data.content = function(content){
    // XoW.logger.e('self content @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
    //支持的html标签
    var html = function(end){
      return new RegExp('\\n*\\['+ (end||'') +'(code|pre|div|span|p|table|thead|th|tbody|tr|td|ul|li|ol|li|dl|dt|dd|h2|h3|h4|h5)([\\s\\S]*?)\\]\\n*', 'g');
    };
    content = (content||'')

      .replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;') //XSS
      .replace(/@(\S+)(\s+?|$)/g, '@<a href="javascript:;">$1</a>$2') //转义@
      .replace(/'/g, '&#39;').replace(/"/g, '&quot;')
      .replace(/fileEx\([\s\S]+?\)\[[\s\S]*?\]/g, function(str){ //转义文件
        //var href = (str.match(/file\(([\s\S]+?)\)\[/)||[])[1];
        var text = (str.match(/\)\[([\s\S]*?)\]/)||[])[1];
        if(!text) return str;
        text = text.replace(/&quot;/g, '"');
        // 把: { } 转换过来先
        var theThumbnail = $.parseJSON(text); // 存在
        if(!theThumbnail) return str;

        var overdue = false;
        if(_cache.local && _cache.local.chatlog ) {
          var thisChatLog = _cache.local.chatlog[theThumbnail.type + theThumbnail.id];
          if (thisChatLog && thisChatLog.findIndex(function(x) {return x.sid == theThumbnail.sid;}) > -1) {
            overdue = true;
          }
        }

        var thatFile = new XoW.File(theThumbnail.to);
        thatFile.name = theThumbnail.name;
        thatFile.size = theThumbnail.size;
        thatFile.mime = theThumbnail.mime;
        thatFile.mine = theThumbnail.mine;
        thatFile.sid = theThumbnail.sid;
        thatFile.status = theThumbnail.status;
        thatFile.errorMsg = theThumbnail.errorMsg;
        if(overdue) {
          thatFile.setState(XoW.FileReceiveState.OVERDUE);
        }

        var html = _layTpl(_eleFileThumbnail).render(thatFile);
        delete thatFile;
        return html;
        // return '<a class="layui-layim-file" href="'+ href +'" download target="_blank"><i class="layui-icon">&#xe61e;</i><cite>'+ (text||href) +'</cite></a>';
      })
      .replace(/imgEx\[[\s\S]*?\]/g, function(img){  //转义图片
        var text = img.replace(/(^imgEx\[)|(\]$)/g, '').replace(/&quot;/g, '"');
        var theThumbnail = $.parseJSON(text); // 存在
        if(!theThumbnail) return img;
        var thatFile = new XoW.File(theThumbnail.to);
        thatFile.name = theThumbnail.name;
        thatFile.size = theThumbnail.size;
        thatFile.mime = theThumbnail.mime;
        thatFile.mine = theThumbnail.mine;
        thatFile.sid = theThumbnail.sid;
        thatFile.status = theThumbnail.status;
        thatFile.errorMsg = theThumbnail.errorMsg;
        thatFile.base64 = theThumbnail.base64;
        var html = _layTpl(_eleImage).render(thatFile);
        delete thatFile;
        return html;
      })
      .replace(/face\[([^\s\[\]]+?)\]/g, function(face){  //转义表情
        var alt = face.replace(/^face/g, '');
        return '<img alt="'+ alt +'" title="'+ alt +'" src="' + faces[alt] + '">';
      })
      .replace(/img\[([^\s]+?)\]/g, function(img){  //转义图片
        return '<img class="layui-layim-photos" src="' + img.replace(/(^img\[)|(\]$)/g, '') + '">';
      })
      .replace(/file\([\s\S]+?\)\[[\s\S]*?\]/g, function(str){ //转义文件
        var href = (str.match(/file\(([\s\S]+?)\)\[/)||[])[1];
        var text = (str.match(/\)\[([\s\S]*?)\]/)||[])[1];
        if(!href) return str;
        return '<a class="layui-layim-file" href="'+ href +'" download target="_blank"><i class="layui-icon">&#xe61e;</i><cite>'+ (text||href) +'</cite></a>';
      })


      .replace(/audio\[([^\s]+?)\]/g, function(audio){  //转义音频
        return '<div class="layui-unselect layui-layim-audio" layim-event="playAudio" data-src="' + audio.replace(/(^audio\[)|(\]$)/g, '') + '"><i class="layui-icon">&#xe652;</i><p>音频消息</p></div>';
      })
      .replace(/video\[([^\s]+?)\]/g, function(video){  //转义音频
        return '<div class="layui-unselect layui-layim-video" layim-event="playVideo" data-src="' + video.replace(/(^video\[)|(\]$)/g, '') + '"><i class="layui-icon">&#xe652;</i></div>';
      })

      .replace(/a\([\s\S]+?\)\[[\s\S]*?\]/g, function(str){ //转义链接
        var href = (str.match(/a\(([\s\S]+?)\)\[/)||[])[1];
        var text = (str.match(/\)\[([\s\S]*?)\]/)||[])[1];
        if(!href) return str;
        return '<a href="'+ href +'" target="_blank">'+ (text||href) +'</a>';
      }).replace(html(), '\<$1 $2\>').replace(html('/'), '\</$1\>') //转移HTML代码
      .replace(/\n/g, '<br>'); //转义换行
    return content;
  };
  // endregion Overload functions of layim
  exports('layImEx', new LAYIMEX()); //注意，这里是模块输出的核心，模块名必须和use时的模块名一致
});