/**
 * Created by cy
 * It's an extension of layim, which should not depends on logic layer of xow,
 * but may be depends on the tools, constants or entities that from xow.
 */
//layui.define(['layer', 'laytpl', 'layim'], function (exports) {
layui.define(['layer', 'laytpl', 'layim', 'client'], function (exports) {
  // region Fields
  this.classInfo = 'layImEx';
  var $ = layui.$;
  var _layer = layui.layer;
  var _layTpl = layui.laytpl;
  var _layIM = layui.layim;
  var _stope = layui.stope; //组件事件冒泡 todo
  //var _layim = layui.mobile.layim;

  //var SHOW = 'layui-show'
  var THIS = 'layim-this', MAX_ITEM = 20;

  var _this = this;


  // layui.data('layim')[_cache.mine.id] 保存当前数据
  //>history:最近联系人
  //>cache.message:未读消息，读取之后会被清空
  //>cache.chat:未读联系人，读取之后会被清空
  //>cache.local.chatLog:上一次（登录前）聊天记录，不会实时刷新
  var _layMain, _device, _cache;
  // endregion Fields

  // region UI templates
  //聊天内容列表模版
  var _elemChatMain = ['<li {{ d.mine ? "class=layim-chat-mine" : "" }} {{# if(d.cid){ }}data-cid="{{d.cid}}"{{# } }}>'
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
  // endregion UI templates

  // region APIs
  // 对外API
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
  LAYIMEX.prototype.bindFriendListRightMenu = function () {
    XoW.logger.ms(_this.classInfo, 'bindFriendListRightMenu()');
    return _bindRightMenu(), this;
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
  LAYIMEX.prototype.bindToolFileButton = function (callback) {
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
        var $file =  e.target.files[0]; // $file.size is base64 size?
        var reader = new FileReader();
        // 得到文件的信息
        reader.onload = function (e) {
          XoW.logger.ms('FileReader.onload() '+ $file.name);
          if (callback) {
            callback(thatChat, $file, e.target.result);
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
  // copy from layim.sendMessage
  LAYIMEX.prototype.sendMessageEx = function(pMsg){
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

      _pushChatLog(pMsg);
      layui.each(call.sendMessageEx, function(index, item){
        item && item(pMsg);
      });
    }
    _chatListMore();
    XoW.logger.me(_this.classInfo, 'sendMessageEx()');
  };
  // endregion APIs

  // region LayImEx-event handlers
  var events = {
    menu_history: function (othis, e) {
      _layer.alert('这是右键菜单');
      _layer.closeAll('tips');
    },
    accept_file: function (othis, e) {
      XoW.logger.ms(_this.classInfo, 'accept_file()');
      var $p = othis.parent().parent();
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
    reject_file: function (othis, e) {
      XoW.logger.ms(_this.classInfo, 'reject_file()');
      var $p = othis.parent().parent();
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
    open_file: function (othis, e) {
      XoW.logger.ms(_this.classInfo, 'open_file()');
      var $p = othis.parent().parent();
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
    cancel_file: function (othis, e) {
      XoW.logger.ms(_this.classInfo, 'cancel_file()');
      var $p = othis.parent().parent();
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
    /**
     * stop when tranfering
     * @param othis
     * @param e
     */
    stop_file: function (othis, e) {
      XoW.logger.ms(_this.classInfo, 'stop_file()');
      var $p = othis.parent().parent();
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
    }
  };
  // endregion LayImEx-event handlers



  // region Private Methods
  var _init = function () {
    XoW.logger.ms(_this.classInfo, '_init()');
    _device = layui.device();
    _cache = _layIM.cache();
    _layMain = $('.layui-layim') || null;

    $('body').on('click', '*[layImEx-event]', function (e) {
      var othis = $(this), method = othis.attr('layImEx-event');
      events[method] ? events[method].call(this, othis, e) : '';
    });
    XoW.logger.me(_this.classInfo, '_init()');
  }
  var _changeMineUsername = function (params) {
    XoW.logger.ms(_this.classInfo, '_changeMineAvatar()');
    $('.layui-layim-user').text(params);
    XoW.logger.ms(_this.classInfo, '_changeMineAvatar()');
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
  }
  var _resetPosition = function (pObj, pTop, pLeft) {
    if (pObj.length && pTop && pLeft) {
      var top = pObj.css('top').toLowerCase().replace('px', '');
      var left = pObj.css('left').toLowerCase().replace('px', '');
      top = parseInt(top) + pTop;
      left = parseInt(left) + pLeft;
      pObj.css({'left': left + 'px', 'top': top + 'px'});
    }
  }
  /**
   * 主面板右键菜单
   * @private
   */
  var _bindRightMenu = function () {
    var hide = function () {
      _layer.closeAll('tips');
    };
    // 点击第一排好友，菜单位置有bug（如果菜单增高，聊天记录也有此问题）
    var space_icon = '  ', space_no_icon = '';
    $('.layim-list-friend').on('contextmenu', '.layui-layim-list li', function (e) {
      var othis = $(this);
      var id = othis[0].id;
      var html = '<ul id="contextmenu_' + othis[0].id + '" data-id="' + othis[0].id + '" data-index="' + othis.data('index') + '">';
      html += '<li layImEx-event="menu_chat"><i class="layui-icon" >&#xe611;</i>' + space_icon + '发送即时消息</li>';
      html += '<li layImEx-event="menu_profile"><i class="layui-icon">&#xe60a;</i>' + space_icon + '查看资料</li>';
      html += '<li layImEx-event="menu_history"><i class="layui-icon" >&#xe60e;</i>' + space_icon + '消息记录</li>';
      html += '<li layImEx-event="menu_nomsg">' + space_no_icon + '屏蔽消息</li>';
      html += '<li layImEx-event="menu_delete">' + space_no_icon + '删除好友</li>';
      html += '<li layImEx-event="menu_moveto">' + space_no_icon + '移动至</li></ul>';

      if (othis.hasClass('layim-null')) return;
      _layer.tips(html, this, {
        tips: 1
        , time: 0
        , anim: 5
        , fixed: true
        , skin: 'layui-box layui-layim-contextmenu'
        , success: function (layero) {
          var stopmp = function (e) {
            _stope(e);
          };
          layero.off('mousedown', stopmp).on('mousedown', stopmp);

          //var layerObj = $('#contextmenu_' + id).parents('.layui-layim-contextmenu');
          //_resetPosition(layerObj, -100, 0);
        }
      });
      $(document).off('mousedown', hide).on('mousedown', hide);
      $(window).off('resize', hide).on('resize', hide);
    });
  }
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
    return $layimChat;
  };
  /**
   * copy from layim.js
   * @param message
   * @private
   */
  var _pushChatLog = function(message){
    var local = layui.data('layim')[_cache.mine.id] || {};
    local.chatlog = local.chatlog || {};
    var thisChatLog = local.chatlog[message.type + message.id];
    if(thisChatLog){
      //避免浏览器多窗口时聊天记录重复保存
      var nosame;
      layui.each(thisChatLog, function(index, item){
        if(item.timestamp === message.timestamp
          && item.id === message.id){
          nosame = true;
        }
      });
      if(!(nosame || message.fromid == _cache.mine.id)){
        thisChatLog.push(message);
      }
      if(thisChatLog.length > MAX_ITEM){
        thisChatLog.shift();
      }
    } else {
      local.chatlog[message.type + message.id] = [message];
    }
    layui.data('layim', {
      key: _cache.mine.id
      ,value: local
    });
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
  // endregion Private Methods

  // region Overload functions of layim
  var faces = function(){
    var alt = ["[微笑]", "[嘻嘻]", "[哈哈]", "[可爱]", "[可怜]", "[挖鼻]", "[吃惊]", "[害羞]", "[挤眼]", "[闭嘴]", "[鄙视]", "[爱你]", "[泪]", "[偷笑]", "[亲亲]", "[生病]", "[太开心]", "[白眼]", "[右哼哼]", "[左哼哼]", "[嘘]", "[衰]", "[委屈]", "[吐]", "[哈欠]", "[抱抱]", "[怒]", "[疑问]", "[馋嘴]", "[拜拜]", "[思考]", "[汗]", "[困]", "[睡]", "[钱]", "[失望]", "[酷]", "[色]", "[哼]", "[鼓掌]", "[晕]", "[悲伤]", "[抓狂]", "[黑线]", "[阴险]", "[怒骂]", "[互粉]", "[心]", "[伤心]", "[猪头]", "[熊猫]", "[兔子]", "[ok]", "[耶]", "[good]", "[NO]", "[赞]", "[来]", "[弱]", "[草泥马]", "[神马]", "[囧]", "[浮云]", "[给力]", "[围观]", "[威武]", "[奥特曼]", "[礼物]", "[钟]", "[话筒]", "[蜡烛]", "[蛋糕]"], arr = {};
    layui.each(alt, function(index, item){
      arr[item] = layui.cache.dir + 'images/face/'+ index + '.gif';
    });
    return arr;
  }();

  /**
   *
   * @param content
   * @returns {string|*}
   */
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