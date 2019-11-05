/**
 * Created by cy
 * 1.It's an extension of layim, which should not depends on logic layer of xow,
 * but may be depends on the tools, constants or entities that from xow.
 * 2.初始化界面时候添加layim之外的元素函数名 bindXXX()，修改layim则rebindXXX()
 * 3.接口名mobile和pc版保持一致
 * 4.do not depends on jquery but zepto，have not implemented yet
 */
layui.define(['laytpl','upload-mobile','mobile','laydate','flow-mobile','client','form','element'], function (exports) {  //element added by wshengt res;如果不添加element tabs 不滑动
  // region Fields
  this.classInfo = 'layImEx';
  var _layTpl = layui.laytpl;
  var _layUpload = layui['upload-mobile'];
  var _layIM = layui.mobile.layim;
  var _layer = layui.mobile.layer;
  var _client = layui.client;
  var _layForm = layui.form;
  var $ = layui.zepto;
  var _element = layui.element;
  // var _layPage = layui.laypage;
  var _layDate = layui.laydate;
  var _layFlow = layui['flow-mobile'];

  var THIS = 'layim-this', MAX_ITEM = 20;
  var _this = this;

  // layui.data('layim-mobile')[_cache.mine.id] 保存当前数据
  //>history:最近联系人
  //>cache.message:未读消息，读取之后会被清空
  //>cache.chat:未读联系人，读取之后会被清空
  //>cache.local.chatLog:上一次（登录前）聊天记录，不会实时刷新
  var _$sysInfoBox, _device, _cache, _reConnLoadTipIndex, _layerIndex = {};
  const LAYER_MENU_FRIEND = 'LAYER_MENU_FRIEND',
      LAYER_MENU_MORE_TOOL = 'LAYER_MENU_MORE_TOOL';
  const DEMO_AUTO_REPLAY = [
    '感谢您给提了这么惊天动地的好建议 face[阴险]',
    '您没发错吧？face[微笑] ',
    '我是谁？ 小冰？小度？斯瑞？ 一般人我不告诉他！face[哈哈] ',
    '您好，我是主人的美女秘书，有什么事就跟我说吧，等他回来我会转告他的。face[心] face[心] face[心] ',
    'face[威武] face[威武] face[威武] face[威武] ',
    '<（@￣︶￣@）>我骄傲',
    '你要和我说话？你真的要和我说话？你确定自己想说吗？你一定非说不可吗？那你说吧，这是自动回复。',
    'face[黑线]  您慢慢说，别急……',
    '(*^__^*) face[嘻嘻] ，您也是机器人吗？'
  ];
  // endregion Fields

  // region UI templates
  var _eleMineStatus = [
    //'<div class="layui-layim-status">',
    '{{# if(d.mine.status === "online"){ }}',
    '<span class="layui-icon layim-status-online" layim-event="status" lay-type="show">&#xe617;</span>',
    '{{# } else if(d.mine.status === "hide") { }}',
    '<span class="layui-icon layim-status-hide" layim-event="status" lay-type="show">&#xe60f;</span>',
    '{{# } else if(d.mine.status === "offline") { }}',
    '<span class="layui-icon layim-status-offline" layim-event="status" lay-type="show">&#xe60f;</span>',
    '{{# } }}',
    '<ul class="layui-anim layim-menu-box">',
    ' <li {{d.mine.status === "online" ? "class=layim-this" : ""}} layim-event="status" lay-type="online"><i class="layui-icon">&#xe605;</i><cite class="layui-icon layim-status-online">&#xe617;</cite>在线</li>',
    ' <li {{d.mine.status === "hide" ? "class=layim-this" : ""}} layim-event="status" lay-type="hide"><i class="layui-icon">&#xe605;</i><cite class="layui-icon layim-status-hide">&#xe60f;</cite>隐身</li>',
    ' <li {{d.mine.status === "offline" ? "class=layim-this" : ""}} layim-event="status" lay-type="offline"><i class="layui-icon">&#xe605;</i><cite class="layui-icon layim-status-offline">&#xe60f;</cite>离线</li>',
    '</ul>'
    //,'</div>'
  ].join('');

  // region mark mobile
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

  var _eleMainToolMoreMenu = [
    '<ul id="main_tool_more">'
    ,'<li layImEx-event="menu_add_friend"><i class="layui-icon" >&#xe66f;</i>  添加朋友</li>'
    ,'<li layImEx-event="menu_remote_search"><i class="layui-icon">&#xe665;</i>  发现</li>'
    ,'<li layImEx-event="menu_sweep_qrcode"><i class="layui-icon">&#xe660;</i>  扫一扫</li>'
    ,'<li layImEx-event="menu_speak"><i class="layui-icon">&#xe606;</i>  你说我懂</li>'
    ,'<li layImEx-event="menu_help"><i class="layui-icon">&#xe607;</i>  帮助与反馈</li>'
    ,'</ul>'
  ].join('');
  var _eleRoomToolMoreMenu =  [
    '<ul >'
    ,'<li layImEx-event="createChatRoom"><i class="layui-icon" >&#xe611;</i>创建聊天室</li>'
    ,'<li layImEx-event="createMeetingRoom"><i class="layui-icon">&#xe613;</i> 创建会议室</li>'
    ,'<li layImEx-event="roomRefresh"><i class="layui-icon">&#xe666;</i> 刷新</li>'
    ,'</ul>'
  ].join('');
  // endregion mark mobile

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

  var _elePageThumbnail = [
    '<div class="layui-layim-goodinfo" title="点击进入页面查看详情" layImEx-event="open_url_page" data-src="{{ d.url }}">',
    ' <div>',
    '   <img src="{{ d.image }}">',
    ' </div>',
    ' <div>',
    '   <div>{{ d.title }}</div>',
    '   <div style="margin-top:10px">{{ d.description }}</div>',
    ' </div></div>'
  ].join('');

  var _eleImage = [
    '<div class="layim_file" sid="{{ d.sid }}">'
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


  var _eleHttpImage = [
    ,'<div class="layui-container" style="margin: 0;padding: 0;width: 213px;height: 144px;background-color: white">'
    ,'<div class="layim_file" sid="{{ d.cid }}">'
    ,'<div class="layui-row">'
    ,'<div class="layui-col-xs12">'
    ,'<img class="layui-layim-photos" ondragstart="return false;" src="{{ d.url }}" alt="缩略图模式"  style="height: 144px;width: 213px">'
    ,'</div>'
    ,'</div>'
    ,'</div>'
    ,'</div>'
  ].join('');

  var _eleHttpFile = [
    ,'<div class="layui-container" style="margin: 0;padding: 0;width: 204px;height: 76px;">'
    ,'<div class="layim_file" sid="{{ d.cid }}">'
    ,'<div class="layui-row" style="width: 100%;height: 70px">'
    ,'<div class="layui-col-xs3" style="height: 70px">'
    ,'<div class="layim_filepicture" style="font-size: xx-small" >{{ d.mime }}</div>'
    ,'  </div>'
    ,'<div class="layui-col-xs9">'
    ,'<span class="layim_chatname" style="width:102px;display: inline-block;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">名称：{{ d.filename }} </span><br/>'
    ,'<span class="layim_chatname" style="width:102px;display: inline-block;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">大小：{{ d.size }} </span><br/>'
    ,'{{# if(d.mine){ }}'
    ,'{{# if(d.status == XoW.FileHttpFileState.CLOSE){  }}'
    ,'<span class="layim_chatname" style="width:102px;display: inline-block;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;color: #9EFF3E">传输成功</span><br/>'
    ,'{{# }else if(d.status == XoW.FileHttpFileState.ERROR){  }}'
    ,'<span class="layim_chatname" style="width:102px;display: inline-block;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;color: red">传输失败</span><br/>'
    ,'{{# }else if(d.status == XoW.FileHttpFileState.OPEN){ }}'
    ,'<span class="layim_chatname" style="width:102px;display: inline-block;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">开始传输文件</span><br/>'
    ,'{{# }else if(d.status == XoW.FileHttpFileState.CANCEL){  }}'
    ,'<span class="layim_chatname" id="chttp{{d.cid}}"><a href="javascript:void(0);" layImEx-event="continue_http_file"  style="color:red"  data-cid = "{{d.cid}}">继续</a></span>'
    ,'{{# }else if(d.status == XoW.FileHttpFileState.OVERDUE){ }}'
    ,'<span class="layim_chatname" style="width:102px;display: inline-block;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; color: red">会话已过期</span><br/>'
    ,'{{# } }}'
    ,'{{# }else if(d.status == XoW.FileHttpFileState.CLOSE){ }}'
    ,'<a class="layui-layim-file" href="{{d.url}}" download target="_blank" style="color: blue">打开文件</a>'
    ,'{{# } }}'
    ,'</div>'
    ,'</div>'
    ,'{{# if(d.mine){ }}'
    ,'{{# if(d.status == XoW.FileHttpFileState.SENDING){  }}'
    ,'<div class="layui-row" style="width: 100%;height: 6px">'
    ,'<div class="layui-progress " lay-showPercent="true" lay-filter="http{{d.cid}}">'
    ,'<div class="layui-progress-bar layui-bg-orange" lay-percent="{{d.seq}}"></div>'
    ,'</div>'
    ,'</div>'
    ,'{{# } }}'
    ,'{{# } }}'
    ,'</div>'
    ,'</div>'
  ].join('');
  var _eleHttpVideo = [
    ,'<div class="layui-container" style="margin: 0;padding: 0;width: 120px;height: 96px;">'
    ,'<div class="layim_file" sid="{{ d.cid }}">'
    ,'<div class="layui-row" style="width: 100%;">'
    ,'<div class="layui-col-md12">'
    ,'<div class="layui-unselect layui-layim-video" layim-event="playVideo" data-src="{{d.url}}"><i class="layui-icon">&#xe652;</i></div>'
    ,'{{# if(d.mine){ }}'
    ,'{{# if(d.status == XoW.FileHttpFileState.CLOSE){  }}'
    ,'<span style="width:102px;display: inline-block;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;color: #9EFF3E">传输成功</span><br/>'
    ,'{{# }else if(d.status == XoW.FileHttpFileState.ERROR){  }}'
    ,'<span style="width:102px;display: inline-block;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;color: red">传输失败</span><br/>'
    ,'{{# }else if(d.status == XoW.FileHttpFileState.OPEN){ }}'
    ,'<span style="width:102px;display: inline-block;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">开始传输文件</span><br/>'
    ,'{{# }else if(d.status == XoW.FileHttpFileState.CANCEL){  }}'
    ,'<span id="chttp{{d.cid}}"><a href="javascript:void(0);" layImEx-event="continue_http_file"  style="color:red"  data-cid = "{{d.cid}}">继续</a></span>'
    ,'{{# }else if(d.status == XoW.FileHttpFileState.OVERDUE){ }}'
    ,'<span class="layim_chatname" style="width:102px;display: inline-block;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;color: red">会话已过期</span><br/>'
    ,'{{# } }}'
    ,'{{# } }}'
    ,'</div>'
    ,'</div>'
    ,'{{# if(d.mine){ }}'
    ,'{{# if(d.status == XoW.FileHttpFileState.SENDING){  }}'
    ,'<div class="layui-row" style="width: 100%;height: 6px">'
    ,'<div class="layui-progress " lay-showPercent="true" lay-filter="http{{d.cid}}">'
    ,'<div class="layui-progress-bar layui-bg-orange" lay-percent="{{d.seq}}"></div>'
    ,'</div>'
    ,'</div>'
    ,'{{# } }}'
    ,'{{# } }}'
    ,'</div>'
    ,'</div>'
  ].join('');

  var _eleHttpAudio = [
    ,'<div class="layui-container" style="margin: 0;padding: 0;width: 66px;height: 62px;">'
    ,'<div class="layim_file" sid="{{ d.cid }}">'
    ,'<div class="layui-row" style="width: 100%;height: 56px">'
    ,'<div class="layui-col-md12" style="height: 56px">'
    ,'<div class="layui-unselect layui-layim-audio" layim-event="playAudio" data-src="{{d.url}}"><i class="layui-icon">&#xe652;</i><p>音频消息</p></div>'
    ,'{{# if(d.mine){ }}'
    ,'{{# if(d.status == XoW.FileHttpFileState.CLOSE){  }}'
    ,'<span style="width:100%;text-align:center;display: inline-block;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;color: #9EFF3E">传输成功</span><br/>'
    ,'{{# }else if(d.status == XoW.FileHttpFileState.ERROR){  }}'
    ,'<span style="width:100%;text-align:center;display: inline-block;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;color: red">传输失败</span><br/>'
    ,'{{# }else if(d.status == XoW.FileHttpFileState.OPEN){ }}'
    ,'<span style="width:100%;text-align:center;display: inline-block;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">开始传输文件</span><br/>'
    ,'{{# }else if(d.status == XoW.FileHttpFileState.CANCEL){  }}'
    ,'<span id="chttp{{d.cid}}"><a href="javascript:void(0);" layImEx-event="continue_http_file"  style="color:red"  data-cid = "{{d.cid}}">继续</a></span>'
    ,'{{# }else if(d.status == XoW.FileHttpFileState.OVERDUE){ }}'
    ,'<span class="layim_chatname" style="width:102px;display: inline-block;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;color: red">会话已过期</span><br/>'
    ,'{{# } }}'
    ,'{{# } }}'
    ,'</div>'
    ,'</div>'
    ,'{{# if(d.mine){ }}'
    ,'{{# if(d.status == XoW.FileHttpFileState.SENDING){  }}'
    ,'<div class="layui-row" style="width: 100%;height: 6px">'
    ,'<div class="layui-progress " lay-showPercent="true" lay-filter="http{{d.cid}}">'
    ,'<div class="layui-progress-bar layui-bg-orange" lay-percent="{{d.seq}}"></div>'
    ,'</div>'
    ,'</div>'
    ,'{{# } }}'
    ,'{{# } }}'
    ,'</div>'
    ,'</div>'
  ].join('');



  var _eleFileThumbnail = [
    '<div class="layim_file" sid="{{ d.sid }}">'
    ,'  <div class="layim_filepicture" ></div>'
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

  // region mark mobile
  var _eleRemoteSearchBox = [
    '<div class="layui-tab layui-tab-brief">'
    ,'  <ul class="layui-tab-title">'
    ,'    <li class="{{# if(\'user\' === d.tab){ }}layui-this{{# } }}">找人</li>'
    ,'    <li class="{{# if(\'room\' === d.tab){ }}layui-this{{# } }}">找聊天室</li>'
    ,'    <li class="{{# if(\'chatLog\' === d.tab){ }}layui-this{{# } }}">找聊天记录</li>'
    ,'  </ul>'
    ,'  <div class="layui-tab-content" style="height: 100px;">'
    ,'     <div class="layui-tab-item {{# if(\'user\' === d.tab){ }}layui-show{{# } }}">'
    //,'      <div class="layui-container">'
    ,'        <div class="layui-row layui-col-space15">'
    ,'          <div class="layui-col-xs8">'
    ,'            <input class="layui-input" name="qry_user_keyword" id="qry_user_keyword" placeholder="请输入FaceWhat帐号/昵称/手机号" autocomplete="off"/>'
    ,'          </div>'
    ,'          <div class="layui-col-xs2">'
    ,'            <button class="layui-btn" layImEx-event="search_user_remote" id="btn_search_user_remote">搜索</button>'
    ,'          </div>'
    ,'        </div>'
    //,'      </div>'
    ,'        <div id="search_user_remote_res"></div>'
    ,'     </div>'
    ,'     <div class="layui-tab-item {{# if(\'room\' === d.tab){ }}layui-show{{# } }}">'
    ,'        <div class="layui-row layui-col-space15">'
    ,'          <div class="layui-col-xs8">'
    ,'            <input class="layui-input" name="qry_room_keyword" id="qry_room_keyword" placeholder="请输入房间昵称/JID" autocomplete="off"/>'
    ,'          </div>'
    ,'          <div class="layui-col-xs3">'
    ,'            <button class="layui-btn" layImEx-event="search_room_remote" id="btn_search_room_remote">搜索</button>'
    ,'          </div>'
    ,'        </div>'
    ,'        <div id="search_room_remote_res"></div>'
    ,'     </div>'
    ,'     <div class="layui-tab-item {{# if(\'chatLog\' === d.tab){ }}layui-show{{# } }}">'
    ,'        <div><form class="layui-form" id="frmQryChatLog" action="">'
    ,'          <div class="layui-form-item layui-input-inline layui-search-field">'
    ,'            <select class="layui-select" name="qry_log_jid" id="qry_log_jid" lay-verify="required">'
    ,'              <option value="">请选择好友</option>'
    ,'            {{# layui.each(d.friend, function(index, group){ }}'
    ,'                <optgroup label="{{ group.groupname || group.groupid }}">'
    ,'                {{# layui.each(group.list, function(i, item){ }}'
    ,'                    <option value="{{ item.jid }}" {{# if(d.withJid === item.jid) { }} selected {{# } }}>{{ item.username || item.name }}</option>'
    ,'                {{# }); }}'
    ,'                </optgroup>'
    ,'            {{# }); }}'
    ,'            </select>'
    ,'          </div>'
    ,'          <div class="layui-form-item layui-input-inline layui-search-field">'
    ,'            <input class="layui-input" name="qry_log_keyword" id="qry_log_keyword" placeholder="请输入关键字" autocomplete="off"/>'
    ,'          </div>'
    ,'          <div class="layui-form-item layui-input-inline layui-search-field">'
    ,'            <button class="layui-btn" type="button" layImEx-event="search_chat_log_remote" id="btn_search_chat_log_remote">搜索</button>'
    ,'          </div>'
    ,'          <a href="javascript:void(0);" layImEx-event="more_filter" data-chevron="down">更多筛选条件<span class="layui-icon">&#xe61a</span></a>'
    ,'          <div class="layui-form-item layui-bg-gray layui-hide"  style="padding: 10px" id="qry_log_date">'
    ,'            <div class="layui-inline">'
    ,'              <label class="layui-form-label">开始日期</label>'
    ,'              <div class="layui-input-inline layui-search-field">'
    ,'                <input type="text" id="qry_log_start_date" name="qry_log_start_date"  class="layui-input" placeholder="请输入" lay-verify="date">'
    ,'              </div>'
    ,'            </div>'
    ,'            <div class="layui-inline">'
    ,'              <label class="layui-form-label">结束日期</label>'
    ,'              <div class="layui-input-inline layui-search-field">'
    ,'                <input type="text" id="qry_log_end_date" name="qry_log_end_date"  class="layui-input" placeholder="请输入" lay-verify="date">'
    ,'              </div>'
    ,'            </div>'
    ,'          </div>'
    ,'        </form></div>' // eof form
    //,'      </div>'
    ,'        <div class="layim-chat-main"><ul id="flow_chat_log_cont"></ul></div>'
    ,'     </div>'
    ,'  </div>'
    ,'</div>'].join('');
  var _getEleRemoteSearchRoomRes = function (data) {
    let  _eleRemoteSearchRoomRes = '<div style="padding: 10px 0px 0px 0px; background-color: #F2F2F2;" class="layui-container">';
    _eleRemoteSearchRoomRes +=  '<div class="layui-row layui-col-space15">'
    $.each(data,function(index,value){
      _eleRemoteSearchRoomRes += '<div>'
      _eleRemoteSearchRoomRes += '<div class="layui-card">'
      _eleRemoteSearchRoomRes +='<div class="layui-card-header set-name-to-short">JID：'+value.jid+'</div>'
      _eleRemoteSearchRoomRes += '<div class="layui-card-body">'
      _eleRemoteSearchRoomRes += '昵称：'+value.name+''
      _eleRemoteSearchRoomRes +=' <button class="layui-btn layui-btn-xs set-name-to-short" layImEx-event="add_Room" roomname = "'+value.name+'" data-jid="'+value.jid+'">'
      _eleRemoteSearchRoomRes +='<i class="layui-icon">&#xe608;</i>加为群组</button>'
      _eleRemoteSearchRoomRes += '</div>'
      _eleRemoteSearchRoomRes += '</div>'
      _eleRemoteSearchRoomRes +='</div>'
    });
    _eleRemoteSearchRoomRes +='</div>'
    _eleRemoteSearchRoomRes +='</div>'
    return _eleRemoteSearchRoomRes;
  }

  var _eleRemoteSearchUserRes = [
    '{{# if(d.length > 0){ }}'
    ,'  <div style="padding: 10px 0px 0px 0px; background-color: #F2F2F2;" class="layui-container">'
    ,'    <div class="layui-row layui-col-space15">'
    ,'      {{# layui.each(d, function(index, item){ }}'
    ,'            <div>'
    ,'              <div class="layui-card" data-type="friend" data-index="0" ">'
    ,'                <div class="layui-card-header">账号：{{ item.id }}</div>'
    ,'                <div class="layui-card-body">'
    ,'                  昵称：{{ item.username }}'
    ,'                  <button class="layui-btn layui-btn-xs" layImEx-event="add_friend" data-jid="{{ item.jid }}">'
    ,'                    <i class="layui-icon">&#xe608;</i>加为好友</button>'
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
  // endregion mark mobile

  var _elemRemoteSearchChatLogRes = [
    '<li {{ d.mine ? "class=layim-chat-mine" : "" }}>'
    ,'<div class="layim-chat-user"><img src="{{ d.avatar }}"><cite>'
    ,'{{# if(d.mine){ }}'
    ,'<i>{{ layui.data.date(parseInt(d.timestamp)) }}</i>{{ d.username||"佚名" }}'
    ,'{{# } else { }}'
    ,'{{ d.username||"佚名" }}<i>{{ layui.data.date(parseInt(d.timestamp)) }}</i>'
    ,'{{# } }}'
    ,'</cite></div>'
    ,'<div class="layim-chat-text">{{ layui.data.content(d.content||"&nbsp") }}</div>'
    ,'</li>'].join('');

  // region mark mobile
  var _eleSysInfoBox = [
    '<ul class="layui-layim-search" style="display:inline">'
    ,'  <li>'
    ,'    <i class="layui-icon layui-icon-search"></i>'
    ,'    <input placeholder="请输入用户名...">'
    ,'    <label class="layui-icon" layImEx-event="close_search_input">&#x1007;</label>'
    ,'  </li>'
    ,'</ul>'
    ,'<ul class="layui-layim-list" id="flow_msgbox_cont"></ul>'
  ].join('');

  var _eleSysInfoContent = [
    ,'{{# layui.each(d.data, function(index, item){'
    ,'  if(item.item && "SUB_ME_REQ_RCV" === item.type){ }}'
    ,'    <li id={{ "sysInfo" + item.cid }} data-fromGroup="{{ item.from_group }}">'
    ,'      <div>'
    ,'        <img src="{{ item.item.avatar }}" class="layui-circle layim-msgbox-avatar">'
    ,'      </div>'
    ,'      <span>{{ item.item.username||"" }}</span>'
    ,'      <p>'
    ,'       {{ item.content }}'
    ,'        <span>{{ item.remark ? "附言: " + item.remark : "" }}</span>'
    ,'      </p>'
    ,'      <div class="layim-msgbox-btn">'
    ,'       {{# if(item.status === "untreated"){ }}'
    ,'          {{# if(item.item.type == "friend"){       }}'    //好友邀请
    ,'               <button class="layui-btn layui-btn-small layui-btn-primary" data-jid="{{ item.from }}" layImEx-event="approve_user_sub">同意</button>'
    ,'               <button class="layui-btn layui-btn-small" data-jid="{{ item.from }}" layImEx-event="deny_user_sub">拒绝</button>'
    ,'          {{#   }else{   }}'    //群聊邀请
    ,'               <button class="layui-btn layui-btn-small layui-btn-primary" data-jid="{{ item.from }}" roompassword = "{{item.item.password}}" layImEx-event="approve_roommember_sub">同意</button>  '
    ,'               <button class="layui-btn layui-btn-small" data-jid="{{ item.from }}" invifro = "{{item.item.jid}}" layImEx-event="deny_roommember_sub">拒绝</button>'
    ,'          {{# } }} '
    ,'       {{# }else{ }}'
    ,'          {{ item.status }}'
    ,'       {{# } }}'
    ,'      </div>'
    ,'    </li>'
    ,'  {{# } else { }}'
    ,'    <li class="layim-msgbox-system">'
    ,'      <div>'
    ,'        <img src="{{ XoW.DefaultImage.SYSINFO_NOTIFY }}" class="layui-circle layim-msgbox-avatar">'
    ,'        <div class="layim-msgbox-notify">{{ item.content }}</div>'
    ,'      </div>'
    // ,'      <div class="layim-msgbox-btn"><em>系统：</em>{{ item.content }}</div>'
    ,'    </li>'
    ,'  {{# } }); }}'
  ].join('');

  var _eleVCard = [
    '<div class="layui-bg-gray" style="margin-top: -10px;width: 100%;height:600px;">',
    '  <table class="layui-table" lay-skin="nob">',
    '    <colgroup>',
    '      <col width="30%">',
    '      <col width="70%">',
    '      <col>',
    '    </colgroup>',
    '    <tbody>',
    '      <tr>',
    '        <td colspan="2" class="layim-vcard">',
    '          <div>',
    '            <li name ="friend_brief_info">',
    '              <img src="{{ d.avatar }}" class="layui-circle">',
    '              <span>账号：{{ d.id }}</span>',
    '              <p>{{ d.vcard.DESC || d.sign || [] }}</p>',
    '           </li>',
    '         </div>',
    '        </td>',
    '      </tr>',
    '      <tr class="layui-elem-field layui-field-title">',
    '        <td class="layim-vcard-title">昵称</td>',
    // '        <td><span class="layim-vcard-value">{{ d.name || d.username }}</span></td>',
    '        <td>',
    '          <input type="text" class="layui-input layim-vcard-input" name="nickname" value="{{ d.name || []}}" placeholder="点击输入" lay-verify="required">',
    '          <i class="layim-vcard-edit layui-icon layui-icon-right">',
    '        </td>',
    '      </tr>',
    '      <tr class="layui-elem-field layui-field-title">',
    '        <td class="layim-vcard-title">性别</td>',
    '        <td ><span class="layim-vcard-value">保密</span></td>',
    '      </tr>',
    '      <tr class="layui-elem-field layui-field-title">',
    '        <td class="layim-vcard-title">生日</td>',
    '        <td><span class="layim-vcard-value">{{ d.vcard.BDAY }}</span></td>',
    '      </tr>',
    '      <tr class="layui-elem-field layui-field-title">',
    '        <td class="layim-vcard-title">手机</td>',
    '        <td><span class="layim-vcard-value">{{ d.vcard.WORK.CELL_TEL || [] }}</span></td>',
    '      </tr>',
    '      <tr class="layui-elem-field layui-field-title">',
    '        <td class="layim-vcard-title">邮箱</td>',
    '        <td><span class="layim-vcard-value">{{ d.vcard.EMAIL || [] }}</span></td>',
    '      </tr>',
    '      <tr class="layui-elem-field layui-field-title">',
    '        <td style="text-align:center" colspan="2">',
    '          <button class="layui-btn layui-btn-normal" layImEx-event="set_friend_info">保存编辑</button>',
    '          <button class="layui-btn layui-btn-normal" layImEx-event="open_chat" data-id="{{d.id}}">发送消息</button>',
    '        </td>',
    '      </tr>',
    '    </tbody>',
    '  </table>',
    '</div>'
  ].join('');

  var _eleMineVCard = [
    '<div class="layui-bg-gray" style="margin-top: -10px;width: 100%;height:600px;">',
    '  <table class="layui-table" lay-skin="nob">',
    '    <colgroup>',
    '      <col width="30%">',
    '      <col width="70%">',
    '      <col>',
    '    </colgroup>',
    '    <tbody id="setMineInfo">',
    '      <tr>',
    '        <td colspan="2" class="layim-vcard">',
    '          <div>',
    '            <li layimEx-event="set_mine_avatar">',
    '              <img id="img_set_mine_avatar" src="{{ d.avatar }}" class="layui-circle">',
    '              <span>账号：{{ d.id }}</span>',
    '              <p>点击更换头像</p>',
    '           </li>',
    '         </div>',
    '         <i class="layim-vcard-edit layim-vcard-edit-mine layui-icon layui-icon-right"></i>',
    '         <input type="file" accept="image/png, image/jpeg, image/gif, image/jpg">',
    '        </td>',
    '      </tr>',
    '      <tr class="layui-elem-field layui-field-title">',
    '        <td class="layim-vcard-title">昵称</td>',
    '        <td>',
    '          <input type="text" class="layui-input layim-vcard-input" name="nickname" value="{{ d.name }}" placeholder="点击输入" lay-verify="required">',
    '          <i class="layim-vcard-edit layui-icon layui-icon-right">',
    '        </td>',
    '      </tr>',
    '      <tr class="layui-elem-field layui-field-title">',
    '        <td class="layim-vcard-title">性别</td>',
    '        <td ><span class="layim-vcard-value">保密</span></td>',
    '      </tr>',
    '      <tr class="layui-elem-field layui-field-title">',
    '        <td class="layim-vcard-title">生日</td>',
    '        <td>',
    '          <input type="text" class="layui-input layim-vcard-input" name="birthday" id="set_mine_vcard_bday" placeholder="请输入" lay-verify="date" value="{{ d.vcard.BDAY }}">',
    '          <i class="layim-vcard-edit layui-icon layui-icon-right">',
    '        </td>',
    '      </tr>',
    '      <tr class="layui-elem-field layui-field-title">',
    '        <td class="layim-vcard-title">手机</td>',
    '        <td>',
    '          <input type="text" class="layui-input layim-vcard-input" name="telephone" value="{{ d.vcard.WORK.CELL_TEL || [] }}" placeholder="请输入" lay-verify="phone">',
    '          <i class="layim-vcard-edit layui-icon layui-icon-right">',
    '        </td>',
    '      </tr>',
    '      <tr class="layui-elem-field layui-field-title">',
    '        <td class="layim-vcard-title">邮箱</td>',
    '        <td>',
    '          <input type="text" class="layui-input layim-vcard-input" name="email" value="{{ d.vcard.EMAIL || [] }}" placeholder="请输入" lay-verify="email">',
    '          <i class="layim-vcard-edit layui-icon layui-icon-right">',
    '        </td>',
    '      </tr>',
    '      <tr class="layui-elem-field layui-field-title" layimEx-event="open_mine_info_field">',
    '        <td class="layim-vcard-title">签名</td>',
    '        <td>',
    '          <input type="text" disabled="disabled" class="layui-input layim-vcard-input" name="signature" value="{{ d.vcard.DESC || [] }}" placeholder="请输入" lay-verify="required">',
    '          <i class="layim-vcard-edit layui-icon layui-icon-right">',
    //'        <td ><span class="selfInfoRight">{{d.sign || []}}</span><i class="layim-vcard-edit layui-icon layui-icon-right"></td>',
    '        </td>',
    '      </tr>',
    '      <tr class="layui-elem-field layui-field-title">',
    '        <td class="layim-vcard-title">我的二维码</td>',
    '        <td><img class="selfInfoIcon"  src="../../skin/images/mine_barcode.png"></td>',
    '      </tr>',
    '      <tr class="layui-elem-field layui-field-title">',
    '        <td style="text-align:center" colspan="2">',
    '          <button class="layui-btn layui-btn-normal" layImEx-event="set_mine_info">保存编辑</button>',
    '        </td>',
    '      </tr>',
    '    </tbody>',
    '  </table>',
    '</div>'
  ].join('');

  var _eleRoomSetingHtml = [
    '<div class="layui-bg-gray layui-container room-seting-container" >',
    '<div class="layui-row"">',
    '<div class="layui-col-md12 room-seting-col12">',
    '<ul class = "room-seting-ul" id="roomMembers">',
    '{{#  if(d.data.meaffiliation == "owner"){   }}',
    '<li class = "room-seting-ul-li1" data-jid = "{{d.data.me}}"><div class = "room-seting-adminicon">{{d.data.menick}}</div></li>',
    ,'{{# } else if(d.data.role == "visitor"){   }}',
    '<li class = "room-seting-ul-li1" data-jid = "{{d.data.me}}"><div class = "room-seting-vistoricon">{{d.data.menick}}</div></li>',
    ,'{{# }else{ }}',
    '<li class = "room-seting-ul-li1" data-jid = "{{d.data.me}}"><div class = "room-seting-membericon">{{d.data.menick}}</div></li>',
    ,'{{# }}}',

    '{{# layui.each(d.data.memList, function(index, item){ }}',
    '{{#  if(item.affiliation == "owner"){   }}',
    '<li class = "room-seting-ul-li1" data-jid = "{{item.jid}}" data-nick = "{{item.nick}}" layimex-event="temparatureFriend"><div class = "room-seting-adminicon">{{item.nick}}</div></li>',
    ,'{{# } else if(item.role == "visitor"){   }}',
    '<li class = "room-seting-ul-li1" data-jid = "{{item.jid}}" data-nick = "{{item.nick}}" layimex-event="temparatureFriend"><div class = "room-seting-vistoricon">{{item.nick}}</div></li>',
    ,'{{# }else{ }}',
    '<li class = "room-seting-ul-li1" data-jid = "{{item.jid}}" data-nick = "{{item.nick}}" layimex-event="temparatureFriend"><div class = "room-seting-membericon">{{item.nick}}</div></li>',
    ,'{{# }}}',
    // '<li  class = "room-seting-ul-li1" data-jid = "{{item.jid}}"><img src="..//images/Admin.png" class="room-seting-img"></li>',
    '{{# }) }}', // for-each
    '<li roomjid="{{d.data.room.jid}}"  class = "room-seting-ul-li1" layimex-event="invitMember" id="toInvite" ><div class="room-seting-invtionicon">邀请</div></li>',
    '</ul>',
    '</div>',
    '<div class="layui-row room-seting-row1">',
    '<div class="layui-col-md12 room-seting-col121">',
    '<ul class="room-seting-ul">',
    '<li class = "room-seting-roomhead1" layImEx-event="modify_room_name" roomjid="{{d.data.room.jid}}" id="modifyRoomRoomName"><span class = "room-seting-roomspan">&nbsp;群聊名称</span><span class = "room-seting-roomspan1" id="layerRoomName">{{d.data.room.name}}</span></li>',
    '<li class = "room-seting-roomhead1" layImEx-event="modify_room_desc" roomjid="{{d.data.room.jid}}" id="modifyRoomRoomDes"><span class = "room-seting-roomspan">&nbsp;群聊描述</span><span class = "room-seting-roomspan1" id="layerRoomDesc">{{d.data.room.getDescription()}}</span></li>',
    // '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;"><span style="align: left;width: 45%;display: inline-block">&nbsp;群聊主题</span><span style="text-align: right;width: 53%;display: inline-block">{{d.data.room.getSubject()}}</span></li>',
    '<li class = "room-seting-roomhead" layimex-event="sendRoomSubjet" roomjid="{{d.data.room.jid}}" id="roomSubjectSt"><span class = "room-seting-roomspan">&nbsp;群聊主题</span><span class = "room-seting-roomspan1" id="layerSubject">{{d.data.room.getSubject()}}</span></li>',
    // '<li style="height: 50px;line-height: 50px;width: 100%;"><span style="align: left;width: 45%;display: inline-block">&nbsp;群聊人数</span><span style="text-align: right;width: 53%;display: inline-block">{{d.data.room.getOccupants()}}</span></li>',
    '</ul>',
    '</div>',
    '</div>',
    '<div class="layui-row room-seting-row5">',
    '<div class="layui-col-md12 room-seting-col121">',
    //  '<form class="layui-form" action="" style="margin:0;padding: 0" id="getRoomConfigSeting">{{d.data.getRoomHtml}}</form>',
    '<form class="layui-form" action="" style="margin:0;padding: 0" id="getRoomConfigSeting"></form>',
    '</div>',
    '</div>',
    '<div class="layui-row room-seting-row5">',
    // '<div class="layui-col-md12"  style="background-color: white;text-align: center" id="getDestroyR">{{d.data.getDestroyRoomHtml}}</div>',
    '<div class="layui-col-md12 room-seting-col122" id="getDestroyR"></div>',
    '</div>',
    '<div class="layui-row room-seting-row5">',
    '<div class="layui-col-md12 room-seting-col122"id="todoExitRoom">',

    '</div>',
    '</div>',
    '</div>',
    '</div>'
  ].join('');
  var _eleRoomCreate = [
    '<div class="layui-container" style="width: 100%;margin: 0px;padding: 0px">',
    '<form class="layui-form" action="">',
    '<div class="layui-row">',
    '<div class="layui-col-xs12">',
    '<input type="text" name="roomName" id="getRoomName"   lay-verify="required" placeholder="房间名称" autocomplete="off" class="layui-input">',
    '</div>',
    '<div class="layui-col-xs12" style="margin-top: 10px">',
    '<input type="text" name="roomDesc" id="getRoomDesc"  lay-verify="required" placeholder="房间描述" autocomplete="off" class="layui-input">',
    '</div>',
    '<div class="layui-col-xs12" style="margin-top: 10px">',
    '<select name="roomMaxNum" lay-verify="" id="roomMaxNum">',
    '<option value="no">请选择房间上限人数</option>',
    '<option value="30">30</option>',
    '<option value="50">50</option>',
    '</select> ',
    '</div>',
    '<div class="layui-col-xs12" style="margin-top: 10px;background-color: white">',
    '<div class="layui-form-item" style="margin: 0;padding: 0">',
    '<label class="layui-form-label" style="margin: 0;padding: 0;height: 39px;line-height: 39px;text-align: center">&nbsp;房间验证：</label>',
    '<div class="layui-input-block" style="margin: 0;padding: 0">',
    '<input type="checkbox" name="onlyMember" value="onlyM" title="仅会员">',
    '<input type="checkbox" name="noPublic" value="onPp" title="不公开">',
    '<input type="checkbox" name="needPassword" value="ndPwd" title="密码" lay-filter="layimwritePaasword">',
    '</div>',
    '</div>',
    '</div>',
    '<div class="layui-col-xs12" id="writeRoomPaaswod" style="margin-top:10px">',
    //'<input type="text" name="roomPassword"   lay-verify="required" placeholder="房间密码" autocomplete="off" class="layui-input">',
    '</div>',
    '</div>',
    '</form>',
    '</div>',
  ].join('')

  var _eleRoomMeetCreate = [
    '<div class="layui-container" style="width: 100%;margin: 0px;padding: 0px">',
    '<form class="layui-form" action="">',
    '<div class="layui-row">',
    '<div class="layui-col-xs12">',
    '<input type="text" name="roomName" id="getMeetRoomName"   lay-verify="required" placeholder="房间名称" autocomplete="off" class="layui-input">',
    '</div>',
    '<div class="layui-col-xs12" style="margin-top: 10px">',
    '<input type="text" name="roomDesc" id="getMeetRoomDesc"  lay-verify="required" placeholder="房间描述" autocomplete="off" class="layui-input">',
    '</div>',
    '<div class="layui-col-xs12" style="margin-top: 10px">',
    '<select name="roomMeetMaxNum" lay-verify="" id="roomMeetMaxNum">',
    '<option value="no">请选择房间上限人数</option>',
    '<option value="30">30</option>',
    '<option value="50">50</option>',
    '</select> ',
    '</div>',
    '</div>',
    '</form>',
    '</div>',
  ].join('')

  var _eleRoomMeetSetingHtml = [
    '<div class="layui-bg-gray layui-container room-seting-container" >',
    '<div class="layui-row"">',
    '<div class="layui-col-md12 room-seting-col12">',
    '<ul class = "room-seting-ul">',
    '{{#  if(d.data.meaffiliation == "owner"){   }}',
    '<li class = "room-seting-ul-li1" data-jid = "{{d.data.me}}"><div class = "room-seting-adminicon">{{d.data.menick}}</div></li>',
    ,'{{# } else if(d.data.role == "visitor"){   }}',
    '<li class = "room-seting-ul-li1" data-jid = "{{d.data.me}}"><div class = "room-seting-vistoricon">{{d.data.menick}}</div></li>',
    ,'{{# }else{ }}',
    '<li class = "room-seting-ul-li1" data-jid = "{{d.data.me}}"><div class = "room-seting-membericon">{{d.data.menick}}</div></li>',
    ,'{{# }}}',

    '{{# layui.each(d.data.memList, function(index, item){ }}',
    '{{#  if(item.affiliation == "owner"){   }}',
    '<li class = "room-seting-ul-li1" data-jid = "{{item.jid}}" data-nick = "{{item.nick}}" layimex-event="temparatureFriend"><div class = "room-seting-adminicon">{{item.nick}}</div></li>',
    ,'{{# } else if(item.role == "visitor"){   }}',
    '<li class = "room-seting-ul-li1" data-jid = "{{item.jid}}" data-nick = "{{item.nick}}" layimex-event="temparatureFriend"><div class = "room-seting-vistoricon">{{item.nick}}</div></li>',
    ,'{{# }else{ }}',
    '<li class = "room-seting-ul-li1" data-jid = "{{item.jid}}" data-nick = "{{item.nick}}" layimex-event="temparatureFriend"><div class = "room-seting-membericon">{{item.nick}}</div></li>',
    ,'{{# }}}',
    // '<li  class = "room-seting-ul-li1" data-jid = "{{item.jid}}"><img src="..//images/Admin.png" class="room-seting-img"></li>',
    '{{# }) }}', // for-each
    '<li roomjid="{{d.data.room.jid}}"  class = "room-seting-ul-li1" layimex-event="invitMember" id="toInvite" ><div class="room-seting-invtionicon">邀请</div></li>',
    '</ul>',
    '</div>',
    '<div class="layui-row room-seting-row1">',
    '<div class="layui-col-md12 room-seting-col121">',
    '<ul class="room-seting-ul">',
    '<li class = "room-seting-roomhead1" layImEx-event="modify_room_name" roomjid="{{d.data.room.jid}}" id="modifyRoomRoomName"><span class = "room-seting-roomspan">&nbsp;群聊名称</span><span class = "room-seting-roomspan1" id="layerRoomName">{{d.data.room.name}}</span></li>',
    '<li class = "room-seting-roomhead1" layImEx-event="modify_room_desc" roomjid="{{d.data.room.jid}}" id="modifyRoomRoomDes"><span class = "room-seting-roomspan">&nbsp;群聊描述</span><span class = "room-seting-roomspan1" id="layerRoomDesc">{{d.data.room.getDescription()}}</span></li>',
    // '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;"><span style="align: left;width: 45%;display: inline-block">&nbsp;群聊主题</span><span style="text-align: right;width: 53%;display: inline-block">{{d.data.room.getSubject()}}</span></li>',
    '<li class = "room-seting-roomhead" layimex-event="sendRoomSubjet" roomjid="{{d.data.room.jid}}" id="roomSubjectSt"><span class = "room-seting-roomspan">&nbsp;群聊主题</span><span class = "room-seting-roomspan1" id="layerSubject">{{d.data.room.getSubject()}}</span></li>',
    // '<li style="height: 50px;line-height: 50px;width: 100%;"><span style="align: left;width: 45%;display: inline-block">&nbsp;群聊人数</span><span style="text-align: right;width: 53%;display: inline-block">{{d.data.room.getOccupants()}}</span></li>',
    '</ul>',
    '</div>',
    '</div>',
    '<div class="layui-row room-seting-row5">',
    '<div class="layui-col-md12 room-seting-col121">',
    //  '<form class="layui-form" action="" style="margin:0;padding: 0" id="getRoomConfigSeting">{{d.data.getRoomHtml}}</form>',
    '<form class="layui-form" action="" style="margin:0;padding: 0" id="getRoomConfigSeting"></form>',
    '</div>',
    '</div>',
    '<div class="layui-row room-seting-row5">',
    // '<div class="layui-col-md12"  style="background-color: white;text-align: center" id="getDestroyR">{{d.data.getDestroyRoomHtml}}</div>',
    '<div class="layui-col-md12 room-seting-col122" id="getDestroyR"></div>',
    '</div>',
    '<div class="layui-row room-seting-row5">',
    '<div class="layui-col-md12 room-seting-col122"id="todoExitRoom">',

    '</div>',
    '</div>',
    '</div>',
    '</div>'
  ].join('');

  var _eleTemparatureFriend = [
    '<div class="layui-container set-room-temparature-container">',
    '<div class="layui-row set-room-temparature-row">',
    '<div class="layui-col-xs12">',
    '<div class = "set-room-temparature-headicon">',
    '</div>',
    '</div>',
    '<div class="layui-col-xs12 set-room-temparature-membernick" >',
    '<h1>{{d.data.onenick}}</h1>',
    '</div>',
    '<div class="layui-col-xs12 set-name-to-short" style="text-align: center;">',
    '<h3>{{d.data.onejid}}</h3>',
    '</div>',
    '<div class="layui-col-xs12 set-room-temparature-btn">',
    '<div class="layui-row set-room-temparature-row">',
    '{{#  if(d.data.btnType == false) {     }}',
    '<div class="layui-col-xs6 set-room-temparature-btnmp">',
    //  '<div style="width: 94px;margin: 0 auto">',
    '<button type="button" class="layui-btn layui-btn-primary layui-btn-fluid set-room-temparature-btnmp" data-jid = "{{d.data.onejid}}" data-nick = "{{d.data.onenick}}" layimEx-event="addFreindInRoom"  >加为好友</button>',
    //       '</div>',
    '</div>',
    '<div class="layui-col-xs6 set-room-temparature-btnmp">',
    //  '<div style="width: 94px;margin: 0 auto">',
    '<button type="button"  class="layui-btn  layui-btn-normal layui-btn-fluid set-room-temparature-btnmp" data-jid = "{{d.data.onejid}}" data-nick = "{{d.data.onenick}}" layimEx-event="sendMessageToRoomOneMember">发送消息</button>',
    //  '</div>',
    '</div>',
    '{{# }else{   }}',
    '<div class="layui-col-xs12 set-room-temparature-btnmp">',
    '<button type="button"  class="layui-btn  layui-btn-normal layui-btn-fluid set-room-temparature-btnmp" data-jid = "{{d.data.onejid}}" data-nick = "{{d.data.onenick}}" layimEx-event="sendMessageToRoomOneMember">发送消息</button>',
    '</div>',
    '{{#  } }}',
    '</div>',
    '</div>',
    '</div>',
    '</div>'
  ].join('')
  var _eleRoomAdmin = [    //_eleRoomAdmin <label class="layui-icon" layimex-event="close_search">ဇ</label>
    '<ul class="layui-layim-search" style="display:inline">',
    '  <li>',
    '    <i class="layui-icon layui-icon-search" ></i>',
    '    <input placeholder="请输入用户名..." id="roomAdminSeachKeyDown">',
    '    <label class="layui-icon" layImEx-event="backRoomSearh">&#x1007;</label>',
    '  </li>',
    '</ul>',
    '<div class="layui-container room-seting-container1">',
    '<div class="layui-row room-seting-row3">',
    '<div class="layui-col-xs12 room-seting-col123"  id="searchRoomAdmin">',
    '{{# layui.each(d.data.roomdata, function(index, item){ }}',
    '<div class="room-seting-div" layimEx-event="changeAdminToOther" data-nick = "{{item.nick}}" data-jid = "{{d.data.roomjid}}">{{item.jid}}</div>',
    '{{# }) }}', // for-each
    '</div>',
    '</div>',
    '</div>'
  ].join('')
  var _eleDenyRoomMember = [ //2222222222222222222222
    '<ul class="layui-layim-search" style="display:inline">',
    '  <li>',
    '    <i class="layui-icon layui-icon-search" ></i>',
    '    <input placeholder="请输入用户名..." id="roomSeachKeyDown">',
    '    <label class="layui-icon" layImEx-event="removeRoomSeachKeyDownText">&#x1007;</label>',
    '  </li>',
    '</ul>',
    '<div class="layui-container room-seting-container1">',
    '<div class="layui-row room-seting-row3" >',
    '<div class="layui-col-xs12 room-seting-col123"  id="searchSomeMember">',
    '{{# layui.each(d.data.roomdata, function(index, item){ }}',
    '<div class = "room-seting-div" layimEx-event="todoDenyRoomMemer" data-jid = "{{d.data.roomjid}}">{{item.nick}}</div>',
    '{{# }) }}', // for-each
    '</div>',
    '</div>',
    '</div>'
  ].join('')

  var _eledealWRoomSpeak = [
    '<ul class="layui-layim-search" style="display:inline">',
    '  <li>',
    '    <i class="layui-icon layui-icon-search" ></i>',
    '    <input placeholder="请输入用户名..." id="roomdealWRoomSpeakDown">',
    '    <label class="layui-icon" layImEx-event="backdealWRoomSpeak">&#x1007;</label>',
    '  </li>',
    '</ul>',
    '<div class="layui-container room-seting-container1">',
    '<div class="layui-row room-seting-row3">',
    '<div class="layui-col-xs12 room-seting-col123" id="showMemeberSpeakePower">',
    '{{# layui.each(d.data.roomdata, function(index, item){ }}',
    '{{# if(item.role === "visitor"){ }}',
    '<div class="room-seting-div" style="color: red" layimEx-event="choiceSpeakMember" roomjid = "{{d.data.roomjid}}" data-jid = "{{item.jid}}" roomState = "{{item.role}}">{{item.nick}}</div>',
    ,'{{# } else { }}',
    '<div class="room-seting-div" layimEx-event="choiceSpeakMember" roomjid = "{{d.data.roomjid}}" data-jid = "{{item.jid}}" roomState = "{{item.role}}">{{item.nick}}</div>',
    ,'{{# } }}',
    '{{# }) }}', // for-each
    '</div>',
    '</div>',
    '</div>'
  ].join('')

  var _eleRoomInviting = [
    '<ul class="layui-layim-search" style="display:inline">',
    '  <li>',
    '    <i class="layui-icon layui-icon-search" ></i>',
    '    <input placeholder="请输入用户名..." id="todoRoomInvition">',
    '    <label class="layui-icon" layImEx-event="backRoomInvition">&#x1007;</label>',
    '  </li>',
    '</ul>',
    '<div class="layui-container room-seting-container1">',
    '<div class="layui-row room-seting-row3">',
    '<div class="layui-col-xs12 room-seting-col123" id="getRoomInvtionPe">',
    '{{# layui.each(d.data.roomdata, function(index, item){ }}',
    '<div class="room-seting-div" layimEx-event="todoInviting" data-jid = "{{d.data.roomjid}}">{{item.jid}}</div>',
    '{{# }) }}', // for-each
    '</div>',
    '</div>',
    '</div>'
  ].join('')

  var _eleSubject = [
    '<div class="layui-container room-seting-container">',
    '<div class="layui-row room-seting-row3">',
    '<div class="layui-col-md12">',
    '<textarea name="writeSubject" placeholder="填写主题，1-200字" class="layui-textarea" rows="5" maxlength="200" id="isReadySendSubject" data-jid = "{{d.data.roomjid}}">{{d.data.valuesubject}}</textarea>',
    '</div>',
    '</div>',
    '</div>'
  ].join('');

  var _eleWriteRoomName = [
    '<div class="layui-container room-seting-container">',
    '<div class="layui-row" >',
    '<div class="layui-col-md12">',
    '<textarea name="writeRoomName" placeholder="填写群聊名称" class="layui-textarea" rows="5" maxlength="200" id="toWriteRoomName" data-jid = "{{d.data.roomjid}}" readonly>{{d.data.roomName}}</textarea>',
    '</div>',
    '</div>',
    '</div>'
  ].join('')

  var _eleWriteRoomDesc = [
    '<div class="layui-container room-seting-container">',
    '<div class="layui-row" >',
    '<div class="layui-col-md12">',
    '<textarea name="writeRoomSesc" placeholder="请对群聊进行描述" class="layui-textarea" rows="5" maxlength="200" id="toWriteRoomDesc" data-jid = "{{d.data.roomjid}}" >{{d.data.roomDesc}}</textarea>',
    '</div>',
    '</div>',
    '</div>'
  ].join('')


  var _elemMineVcardField = [
    '<div class="layim-vcard-field-panel">',
    //'  <input type="text" class="layui-input">',
    '  <textarea name="{{ d.name }}" placeholder="请输入内容" class="layui-textarea noresize">{{ d.value }}</textarea>',
    '  <button class="layui-btn layui-btn-normal layim-vcard-field-submit" layimEx-event="set_mine_info_field">完成</button>',
    '</div>'].join('');

  var _elemMineInfoBriefLi = [
    '<li layImEx-event="open_mine_info">',
    '  <div><img src="{{ d.avatar }}" class="layui-circle"></div>',
    '  <span>{{ d.name || d.username }}</span>',
    '  <p>{{ d.sign }}</p>',
    '</li>'].join('');

  var _eleMainToolList = [
    '<ul class="layui-unselect layui-layim-tool">'
    ,'{{# layui.each(d, function(index, item){ }}'
    ,'  <li layImEx-event="select_main_tool" lay-filter="{{ item.alias }}">'
    ,'    <i class="layui-icon {{item.iconClass||\"\"}}">{{item.iconUnicode||""}}</i>'
    ,'  </li>'
    ,'{{# }); }}'
    ,'</ul>'].join('');

  var _eleSearchLi = [
    '<ul class="layui-layim-search">'
    ,'<li>'
    ,'  <i class="layui-icon layui-icon-search"></i>'
    ,'  <input placeholder="请输入用户名/聊天室名/消息文本...">'
    ,'  <label class="layui-icon" layImEx-event="close_search">&#x1007;</label>'
    ,'</li>'
    ,'</ul>'
  ].join('');

  var _eleSearchTab = [
    '<div class="layim-tab-content">'
    ,'  <ul class="layim-list-friend">'
    ,'    <li><ul class="layui-layim-list layui-show" id="layui-layim-search"></ul></li>'
    ,'  </ul>'
    ,'</div>'
  ].join('');

  // todo data-type 暂时先设置为friend
  var _eleLocalSearchRes = ['' +
  '{{# layui.each(d, function(index, item){ var spread = true; }}'
    ,'  <h5 layim-event="spread" lay-type="{{ spread }}">'
    ,'    <i class="layui-icon">{{# if(spread === "true"){ }}&#xe61a;{{# } else {  }}&#xe602;{{# } }}</i>'
    ,'    <span>{{ item.title||"未命名分组"+index }}</span>'
    ,'    <em>(<cite class="layim-count"> {{ item.length }}</cite>)</em>'
    ,'  </h5>'
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
    ,'</li>'
    ,'{{# }) }}'].join('');

  //添加好友群组模版， copy from layim.js
  var _elemAddTpl = ['<div class="layim-add-box">'
    ,'<div class="layim-add-img">'
    ,'  <img class="layui-circle" src="{{ d.data.avatar }}">'
    ,'  <span>{{ d.data.name||"" }}</span>'
    ,'</div>'
    ,'<div class="layim-add-remark">'
    ,'{{# if(d.data.type === "friend" && d.type === "setGroup"){ }}'
    ,'<p>选择分组</p>'
    ,'{{# } if(d.data.type === "friend"){ }}'
    ,'<select class="layui-select" id="LAY_layimGroup">'
    ,'{{# layui.each(d.data.group, function(index, item){ }}'
    ,'<option value="{{ item.id }}">{{ item.groupname }}</option>'
    ,'{{# }); }}'
    ,'</select>'
    ,'{{# } }}'
    ,'{{# if(d.data.type === "group"){ }}'
    ,'<p>请输入验证信息</p>'
    ,'{{# } if(d.type !== "setGroup"){ }}'
    ,'<textarea id="LAY_layimRemark" placeholder="验证信息" class="layui-textarea"></textarea>'
    ,'{{# } }}'
    ,'</div>'
    ,'</div>'].join('');


  // var roomSubjectComTpl = function(tpl, anim, back){
  //     return ['<div class="layim-panel'+ (anim ? ' layui-m-anim-left' : '') +'">'
  //         ,'<div class="layim-title" style="background-color: {{d.base.chatTitleColor}};">'
  //         ,'<p>'
  //         ,(back ? '<i class="layui-icon layim-chat-back" layim-event="back">&#xe603;</i>' : '')
  //         ,'{{ d.title || d.base.title }}<span class="layim-chat-status"></span>'
  //         ,'<i class="layui-icon layim-chat-detail" layImEx-event="detail">&#xe613;</i>'  //layImEx
  //         ,'</p>'
  //         ,'</div>'
  //         ,'<div class="layui-unselect layim-content">'
  //
  //         ,'</div>'
  //         ,'</div>'].join('');
  // };

  // endregion mark mobile
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
  // region mobile
  LAYIMEX.prototype.on = function(events, callback) {
    if (typeof callback === 'function') {
      call[events] ? call[events].push(callback) : call[events] = [callback];
    }
    return this;
  };
  LAYIMEX.prototype.config = function(pOptions){
    XoW.logger.ms(_this.classInfo, 'config()');
    pOptions = $.extend({
      title: '屯聊',
      isfriend: true,
      isgroup: true,
      uploadImage: {},
      uploadFile: {},
      chatLog : true,
      mainToolList:[
        {
          alias: 'find'
          ,title: '发现'
          ,iconUnicode: ''
          ,iconClass: 'layui-icon-search'
        },
        {
          alias: 'more'
          ,title: '更多'
          ,iconUnicode: ''
          ,iconClass: 'layui-icon-add-circle'
        }
      ],
      moreList: [{
        alias: 'find'
        ,title: '发现'
        ,iconUnicode: '&#xe665' //图标字体的unicode，可不填
        ,iconClass: ''
      },{
        alias: 'cart'
        ,title: '购物车'
        ,iconClass: 'layui-icon-cart'
      },{
        alias: 'clear'
        ,title: '清空缓存'
        ,iconClass: 'layui-icon-delete'
      }],
      //tool: [{
      //  alias: 'code', //工具别名
      //  title: '发送代码', //工具名称
      //  iconUnicode: '&#xe64e;' //工具图标，参考图标文档
      //}, {
      //  alias: 'link',
      //  title: '发送商品链接',
      //  iconUnicode: '&#xe698;'
      //}]
    }, pOptions);
    _layIM.config(pOptions);
  };
  LAYIMEX.prototype.bindFriendListMenu = function() {
    XoW.logger.ms(_this.classInfo, 'bindFriendListMenu()');
    _bindFriendListMenu();
    XoW.logger.me(_this.classInfo, 'bindFriendListMenu()');
  };
  LAYIMEX.prototype.layimExIndex = function(indexname,index) {
    _layerIndex[indexname] = index;
  };
  LAYIMEX.prototype.setFriendStatus = function(pFriend){
    XoW.logger.ms(_this.classInfo, 'setFriendStatus({0})'.f(pFriend.status));
    _layIM.setFriendStatus(pFriend.id, pFriend.status);
    if (pFriend && pFriend.status === XoW.UserState.OFFLINE) {
      _layIM.setChatStatus('离线');
    } else if (pFriend && pFriend.status === XoW.UserState.ONLINE) {
      _layIM.setChatStatus('在线');
    } else {
      _layIM.setChatStatus('');
    }
    XoW.logger.me(_this.classInfo, 'setFriendStatus()');
  };
  // endregion mobile

  LAYIMEX.prototype.setMineStatus = function(pStatus){
    XoW.logger.ms(_this.classInfo, 'setMineStatus({0})'.f(pStatus));
    _changeMineStatus(pStatus);
  };
  LAYIMEX.prototype.roomRefesh = function(){
    _roomRefresh();
  }
  LAYIMEX.prototype.roomBack = function(Othis){
    _roomBack(Othis)
  }

  // LAYIMEX.prototype.getMesseage = function(params){
  //   _layIM.getMessage(params);
  // };

  LAYIMEX.prototype.changeHttpFileStatus = function(data){
    if(data.status === XoW.FileHttpFileState.CANCEL || data.status === XoW.FileHttpFileState.ERROR || data.status === XoW.FileHttpFileState.CLOSE ) {
      $('#http' + data.cid).remove();
    }
    XoW.logger.ms(_this.classInfo, 'changeHttpFileStatus()');
    let $layimFile = $('.layim_file[sid="' + data.cid + '"]');
    let thatChat = _getThisChat();
    if(!thatChat){
      XoW.logger.w('There is no such chat panel, return.');
    }
    let local = layui.data('layim-mobile')[_cache.mine.id];
    let chatLog = local.chatlog || {};
    let thisChatLog = chatLog[data.type + data.id];
    if (!thisChatLog) {
      XoW.logger.e('There is no chat log, return.');
      return;
    }
    let theFile = thisChatLog.find(function(x) {
      return x.cid == data.cid;
    });
    if(!theFile) {
      XoW.logger.e(_this.classInfo + ' There is no such file(may be is image), return.');
      return;
    }
    theFile = $.extend(theFile, {status: data.status,seq: data.seq,percent:data.percent,content: null});
    let thatFile = new XoW.httpFile();
    thatFile.copyFrom(theFile);
    switch ( thatFile.mime) {
      case 'jpg':
      case 'bmp':
      case 'gif':
      case 'jpeg':
      case 'png':
        thatFile.url == '../images/httpdefault.jpeg'
        _layTpl(_eleHttpImage).render(thatFile, function(html){
          $layimFile.replaceWith(html);
          //_element.progress('http'+ data.cid,data.seq)
        });
        break;
      case 'mp4':
        _layTpl(_eleHttpVideo).render(thatFile, function(html){
          $layimFile.replaceWith(html);
          _element.progress('http'+ thatFile.cid,thatFile.percent)
        });
        break;
      case 'mp3':
        _layTpl(_eleHttpAudio).render(thatFile, function(html){
          $layimFile.replaceWith(html);
          _element.progress('http'+ thatFile.cid,thatFile.percent)
        });
        break;
      default:
        _layTpl(_eleHttpFile).render(thatFile, function(html){
          $layimFile.replaceWith(html);
          _element.progress('http'+ thatFile.cid,thatFile.percent)
        });
        break;
    }
    thatFile.content = 'hpFile[{0}]'.f(JSON.stringify(thatFile))
    layui.each(thisChatLog, function(index, item){
      if(item.cid == data.cid){
        thisChatLog.splice(index,1,thatFile)
      }
    });
    layui.data('layim-mobile', {
      key: _cache.mine.id
      ,value: local
    });
    XoW.logger.me(_this.classInfo, 'changeHttpFileStatus()');
  }
  LAYIMEX.prototype. addCancelButn = function(cid){
    XoW.logger.ms(_this.classInfo, 'addCancelButn()');
    let $layimFile = $('.layim-chat-mine[data-cid="' + cid+ '"] .layim-chat-text');
    $layimFile.append('<div id="http'+cid+'"><a href="javascript:void(0);" layImEx-event="stop_http_file"  style="color:red"  data-cid = "'+cid+'">取消</a></div>');
    XoW.logger.me(_this.classInfo, 'addCancelButn()');
  }
  LAYIMEX.prototype.httpFileOverdue = function(data){
    XoW.logger.ms(_this.classInfo, 'httpFileOverdue()');
    let $layimFile = $('.layim_file[sid="' + data.cid + '"]');
    let thatChat = _getThisChat();
    if(!thatChat){
      XoW.logger.w('There is no such chat panel, return.');
      _layer.msg("文件已丢失");
      return;
    }
    let chatElem = thatChat.data;
    let local = layui.data('layim-mobile')[_cache.mine.id];
    let chatLog = local.chatlog || {};
    let thisChatLog = chatLog[chatElem.type + chatElem.id];
    if (!thisChatLog) {
      XoW.logger.e('There is no chat log, return.');
      return;
    }
    console.log(thisChatLog)
    let theFile = thisChatLog.find(function(x) {
      return x.cid == data.cid;
    });
    if(!theFile) {
      XoW.logger.e('There is no theFile, return.');
      _layer.msg("文件已丢失");
      return;
    }
    theFile = $.extend(theFile, {status: data.status,percent:data.percent,content: null});
    let thatFile = new XoW.httpFile();
    thatFile.copyFrom(theFile);
    switch ( thatFile.mime) {
      case 'jpg':
      case 'bmp':
      case 'gif':
      case 'jpeg':
      case 'png':
        thatFile.url == '../images/httpdefault.jpeg'
        _layTpl(_eleHttpImage).render(thatFile, function(html){
          $layimFile.replaceWith(html);
          //_element.progress('http'+ data.cid,data.seq)
        });
        break;
      case 'mp4':
        _layTpl(_eleHttpVideo).render(thatFile, function(html){
          $layimFile.replaceWith(html);
        });
        break;
      case 'mp3':
        _layTpl(_eleHttpAudio).render(thatFile, function(html){
          $layimFile.replaceWith(html);
        });
        break;
      default:
        _layTpl(_eleHttpFile).render(thatFile, function(html){
          $layimFile.replaceWith(html);
        });
        break;
    }
    thatFile.content = 'hpFile[{0}]'.f(JSON.stringify(thatFile))
    layui.each(thisChatLog, function(index, item){
      if(item.cid == data.cid){
        thisChatLog.splice(index,1,thatFile)
      }
    });
    layui.data('layim-mobile', {
      key: _cache.mine.id
      ,value: local
    });
    XoW.logger.me(_this.classInfo, 'httpFileOverdue()');
  }
  LAYIMEX.prototype.completeHttpFile = function(data){
    XoW.logger.ms(_this.classInfo, 'completeHttpFile()');
    $('#http'+data.cid).remove();
    let $layimFile = $('.layim_file[sid="' + data.cid + '"]');
    let thatFile = new XoW.httpFile();
    thatFile.url = data.url;
    thatFile.mine = data.mine;
    thatFile.filename = data.filename;
    thatFile.percent = '100%'
    thatFile.size = data.size;
    thatFile.status =data.status
    thatFile.mime =data. mime
    thatFile.cid = data.cid;
    thatFile.status = data.status
    switch ( thatFile.mime) {
      case 'jpg':
      case 'bmp':
      case 'gif':
      case 'jpeg':
      case 'png':
        _layTpl(_eleHttpImage).render(thatFile, function(html){
          $layimFile.replaceWith(html);
          //_element.progress('http'+ data.cid,thatFile.seq)
        });
        break;
      case 'mp4':
        _layTpl(_eleHttpVideo).render(thatFile, function(html){
          $layimFile.replaceWith(html);
          _element.progress('http'+ data.cid,thatFile.percent)
        });

        break;
      case 'mp3':
        _layTpl(_eleHttpAudio).render(thatFile, function(html){
          $layimFile.replaceWith(html);
          _element.progress('http'+ data.cid,thatFile.percent)
        });
        break;
      default:
        _layTpl(_eleHttpFile).render(thatFile, function(html){
          $layimFile.replaceWith(html);
          _element.progress('http'+ data.cid,thatFile.percent)
        });
        break;
    }
    data.content = 'hpFile[{0}]'.f(JSON.stringify(thatFile))
    let local = layui.data('layim-mobile')[_cache.mine.id];
    let chatLog = local.chatlog || {};
    let thisChatLog = chatLog[data.type + data.id];
    layui.each(thisChatLog, function(index, item){
      if(item.cid == data.cid){
        thisChatLog.splice(index,1,data)
      }
    });
    layui.data('layim-mobile', {
      key: _cache.mine.id
      ,value: local
    });
    XoW.logger.me(_this.classInfo, 'completeHttpFile()');
  }


  LAYIMEX.prototype.roomOutSide = function(params){
    XoW.logger.ms(_this.classInfo, "roomOutSide()");
    // layer.open({
    //   content: params
    //   ,skin: 'msg'
    //   ,time: 3 //2秒后自动关闭
    // });
    let  thisChat = _getThisChat();
    let elem = thisChat.elem;
    _roomBack(elem)
    if( _layerIndex["ROOMSETING"]!=-1){
      _layer.close(_layerIndex["ROOMSETING"]);
      _layerIndex["ROOMSETING"] = -1;
    }
    _layer.open({
      content: params
      ,skin: 'msg'
      ,time: 2 //2秒后自动关闭
    });
    let Msg = {
      content:params,
      timestamp : XoW.utils.getCurrentDatetime()
    }
    this.pushSysInfo(Msg);
    XoW.logger.me(_this.classInfo, "roomOutSide(roomOutSide)");
  }

  LAYIMEX.prototype.OnlyMemberIntoRoom= function(Msg){
    XoW.logger.ms(_this.classInfo, "OnlyMemberIntoRoom()");
    let thischat = _getThisChat();
    _roomBack(thischat.elem);
    _layer.open({
      content: Msg
      ,skin: 'msg'
      ,time: 3 //2秒后自动关闭
    });
    XoW.logger.me(_this.classInfo, "OnlyMemberIntoRoom()");
  }
  LAYIMEX.prototype.someBodyIntoMeIntoRoom= function(params){
    XoW.logger.ms(_this.classInfo, "someBodyIntoMeIntoRoom()");
    let  info = params.info;
    let pSubMsg = {
      cid:info.id,
      classInfo:"SubMsg",
      content:XoW.utils.getNodeFromJid(info.params.inviteFrom) + "邀请你加入" + info.from + "房间",
      from:info.from,
      type:XoW.SERVICE_EVENT.SUB_ME_REQ_RCV,
      status:info.status,
      to:info.to,
      item:{
        avatar:"http://tp2.sinaimg.cn/2211874245/180/40050524279/0",
        classInfo: "group",
        id:XoW.utils.getNodeFromJid(info.params.inviteFrom),
        jid:info.params.inviteFrom,
        type:'group',
        username:XoW.utils.getNodeFromJid(info.params.inviteFrom),
        password:info.params.password||''
      }
    }
    this.pushSysInfo(pSubMsg);
    XoW.logger.me(_this.classInfo, "someBodyIntoMeIntoRoom()");
  }
  LAYIMEX.prototype.outRoomMaxPeples = function(Msg){
    XoW.logger.ms(_this.classInfo,"outRoomMaxPeples()");
    let thischat = _getThisChat();
    _roomBack(thischat.elem);
    _layer.open({
      content: Msg
      ,skin: 'msg'
      ,time: 3 //2秒后自动关闭
    });
    XoW.logger.me(_this.classInfo,"outRoomMaxPeples()");
  }
  LAYIMEX.prototype.banIntoThisRoom = function(Msg){
    XoW.logger.ms(_this.classInfo,"banIntoThisRoom()");
    let thischat = _getThisChat();
    _roomBack(thischat.elem);
    _layer.open({
      content: Msg
      ,skin: 'msg'
      ,time: 3 //2秒后自动关闭
    });
    XoW.logger.me(_this.classInfo,"banIntoThisRoom()");
  }
  LAYIMEX.prototype.roomMastarDestroyThisRoom = function(params){
    XoW.logger.ms(_this.classInfo,"RoomMastarDestroyThisRoom()");
    let thischat = _getThisChat();
    if(thischat) {
      _roomBack(thischat.elem);
    }
    if(_layerIndex["ROOMSETING"]!=-1){
      _layer.close(_layerIndex["ROOMSETING"]);
      _layerIndex["ROOMSETING"] = -1;
    }
    _layer.open({
      content: params.Msg
      ,skin: 'msg'
      ,time: 3 //2秒后自动关闭
    });
    let roomList = $('.layim-list-group li');
    for(let i = 0;i < roomList.length;i++){
      if(roomList.eq(i).attr("data-id")==params.id){
        roomList.eq(i).remove();
        break;
      }
    }
    XoW.logger.me(_this.classInfo,"RoomMastarDestroyThisRoom()");
  }
  LAYIMEX.prototype.roomMasterDenyYouSpeak = function(Msg){
    XoW.logger.ms(_this.classInfo,"roomMasterDenyYouSpeak()");
    var minMsg =  document.getElementsByClassName('layim-chat-mine');
    if(minMsg.length>=1) {
      minMsg[minMsg.length - 1].parentNode.removeChild(minMsg[minMsg.length - 1]);
    }
    _layer.open({
      content: Msg
      ,skin: 'msg'
      ,time: 3 //2秒后自动关闭
    });
    XoW.logger.me(_this.classInfo,"roomMasterDenyYouSpeak()");
  }
  LAYIMEX.prototype.wrongPaaswordIntoThisRoom = function(Msg){
    XoW.logger.ms(_this.classInfo, "wrongPaaswordIntoThisRoom()");
    let thischat = _getThisChat();
    _roomBack(thischat.elem)
    _layer.open({
      content: Msg
      ,skin: 'msg'
      ,time: 3 //2秒后自动关闭
    });
    XoW.logger.me(_this.classInfo, "wrongPaaswordIntoThisRoom()");
  }
  LAYIMEX.prototype.notifyToChatBoxes = function(pMsg) {
    XoW.logger.ms(_this.classInfo, 'notifyToChatBoxes()');
    var layimChat = $('.layui-layim-chat'); // 详见layim.js
    var layimMin = $('.layui-layim-min');
    if(!layimChat) return;

    //如果是最小化，则还原窗口
    if (layimChat.css('display') === 'none') {
      layimChat.show();
    }
    if(layimMin){
      _layer.close(layimMin.attr('times'));
    }
    var conts = layimChat.find('.layim-chat');
    layui.each(conts, function(index, item){
      var ul = $(item).find('.layim-chat-main ul');
      ul.append('<li class="layim-chat-system"><span>{0} &nbsp&nbsp {1}</span></li>'.f(layui.data.date(pMsg.timestamp), pMsg.content));
    });
  };
  LAYIMEX.prototype.openReConnLoadTip = function() {
    XoW.logger.ms(_this.classInfo, 'openReConnLoadTip()');
    _reConnLoadTipIndex = _layer.load(0, {
      shade: [0.5, 'gray'], //0.5透明度的灰色背景
      content: '正在重连服务器...',
      success: function (layero) {
        layero.find('.layui-layer-content').css({
          'padding-top': '38px',
          'width': 'auto'
        });
        layero.on('click', function() {
          _layer.close(_reConnLoadTipIndex);
          // _changeMineStatus(XoW.UserState.OFFLINE);
          // 发送终止连接命令 todo
        });
      }
    });
    XoW.logger.me(_this.classInfo, 'openReConnLoadTip()');
  };
  LAYIMEX.prototype.openFindPanel = function() {
    XoW.logger.ms(_this.classInfo, 'openFindPanel()');
    _layIM.panel({
      title: 'find' //分享
      ,tpl: '<div style="padding: 10px;">自定义模版，{{d.data.test}}</div>' //模版
      ,data: { //数据
        test: '123'
      }
    });
    XoW.logger.me(_this.classInfo, 'openFindPanel()');
  };
  LAYIMEX.prototype.closeReConnLoadTip = function() {
    XoW.logger.ms(_this.classInfo, 'closeReConnLoadTip()');
    _layer.close(_reConnLoadTipIndex);
    XoW.logger.me(_this.classInfo, 'closeReConnLoadTip()');
  };

  // region mobile remark
  LAYIMEX.prototype.changeMineUsername = function(params) {
    XoW.logger.ms(_this.classInfo, 'changeMineUsername({0})'.f(params));
    return _changeMineUsername(params), this;
  };
  LAYIMEX.prototype.changeMineSign = function(pSign) {
    XoW.logger.ms(_this.classInfo, 'changeMineSign({0})'.f(pSign));
    return _changeMineSign(pSign), this;
  };
  LAYIMEX.prototype.changeMineAvatar = function(params) {
    XoW.logger.ms(_this.classInfo, 'changeMineAvatar({0})'.f(params.id));
    return _changeMineAvatar(params), this;
  };

  LAYIMEX.prototype.changeFriendAvatar = function(params) {
    XoW.logger.ms(_this.classInfo, 'changeFriendAvatar({0})'.f(params.id));
    return _changeFriendAvatar(params), this;
  };
  LAYIMEX.prototype.changeFriendNick = function(params) {
    XoW.logger.ms(_this.classInfo, 'changeFriendNick({0})'.f(params.id));
    return _changeFriendNick(params), this;
  };
  LAYIMEX.prototype.changeFriendSign = function(pFriend) {
    XoW.logger.ms(_this.classInfo, 'changeFriendSign({0})'.f(pFriend.id));
    var $list = $('.layui-layim') .find('.layim-friend' + pFriend.id);
    var $p = $list.find('p');
    if ($p.length != 0) {
      XoW.logger.d(this.classInfo, '更新了好友列表中的心情');
      $p.html(pFriend.sign);
    }
    XoW.logger.me(_this.classInfo, 'changeFriendSign({0})'.f(pFriend.id));
  };
  // endregion mobile remark
  LAYIMEX.prototype.changeFileStatus = function(pFileThumbnail) {
    XoW.logger.ms(_this.classInfo, 'changeFileStatus()');
    var thatChat = _getThisChat();
    if(!thatChat){
      XoW.logger.w('There is no such chat panel, return.');
      return;
    }
    var local = layui.data('layim-mobile')[_cache.mine.id];
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
    thatFile = null; // to test mod by cy [20190110]
    layui.data('layim-mobile', {
      key: _cache.mine.id
      ,value: local
    });
    XoW.logger.me(_this.classInfo, 'changeFileStatus()');
  };

  // region only for mobile
  LAYIMEX.prototype.bindAddFriendIconInChatView = function(jid){
    var name = jid;
    var chatPanel = $('.layim-chat-other').eq(1);
    var title = $('.layim-title',chatPanel);
    var html = '<div data-jid="'+jid+'">< id="addSranger" src="../../images/AddFriend.png"><span style="display: none">'+name+'</span><div>';
    title.html(html);
  };

  LAYIMEX.prototype.getMessage = function(data) {
    XoW.logger.ms(_this.classInfo, 'getMessage()');
    _layIM.getMessage(data);
    XoW.logger.me(_this.classInfo, 'getMessage()');
  };
  LAYIMEX.prototype.setUserSearchResult = function(data) {
    XoW.logger.ms(_this.classInfo, 'setUserSearchResult()');
    _cache.searchResOfStranger = data;
    var $layimRes = $('#search_user_remote_res');
    _layTpl(_eleRemoteSearchUserRes).render(data, function (html) {
      $layimRes[0].innerHTML = html;
    });

    XoW.logger.me(_this.classInfo, 'setUserSearchResult()');
  };
  LAYIMEX.prototype.pushExtMsg = function(pMsg) {
    XoW.logger.ms(_this.classInfo, 'pushExtMsg()');
    pMsg.avatar = _cache.mine ? _cache.mine.avatar :  XoW.DefaultImage.AVATAR_DEFAULT;
    var thatChat = _getThisChat(), ul = thatChat.elem.find('.layim-chat-main ul');
    var maxLength = _cache.base.maxLength || 3000;
    if(pMsg.content.replace(/\s/g, '') !== ''){
      var noLimited = $.isFunction(pMsg.getIsImage) ? pMsg.getIsImage() : false;
      if(pMsg.content.length > maxLength && !noLimited){
        return _layer.msg('内容最长不能超过'+ maxLength +'个字符');
      }
      ul.append(_layTpl(_elemChatMain).render(pMsg));

      _layIM.pushChatLog(pMsg);
      layui.each(call.pushExtMsg, function(index, item){
        item && item(pMsg);
      });
    }
    _chatListMore();
    XoW.logger.me(_this.classInfo, 'pushExtMsg()');
  };
  LAYIMEX.prototype.pushSysInfo = function(pMsg, pIsBlink) {
    XoW.logger.ms(_this.classInfo, 'pushSysInfo({0})'.f(pMsg.cid));
    pIsBlink = (typeof pIsBlink !== 'undefined') ?  pIsBlink : true;
    var has;
    var local = layui.data('layim-mobile')[_cache.mine.id] || {};
    local.sysInfo = local.sysInfo || [];
    local['hasUnreadSysInfo'] = true;
    layui.each(local.sysInfo, function (idx, itm) {
      if (itm.cid === pMsg.cid ||
          (itm.from === pMsg.from &&
              itm.status === pMsg.status && itm.type === pMsg.type)) {
        XoW.logger.w('Duplicate data {0} received, break.'.f(itm.cid));
        has = true;
        itm.timestamp = pMsg.timestamp;
        return false;
      }
    });
    if (!has) {
      local.sysInfo.push(pMsg);
    }
    layui.data('layim-mobile', {
      key: _cache.mine.id
      ,value: local
    });

    if(pIsBlink) {
      // _blinkSysInfoIcon();
      _layIM.showNew('Friend', true); // 新的朋友
      _layIM.showNew('List', true);
    }
    XoW.logger.me(_this.classInfo, 'pushSysInfo()');
  };
  // 最前端面板插入并发送消息
  LAYIMEX.prototype.sendMsgForTop = function(pMsgCont) {
    XoW.logger.ms(_this.classInfo, 'sendMsgForTop()');
    var thatChat = _getThisChat()
    _layIM.focusInsert(thatChat.elem.find('input[type="text"]')[0], pMsgCont);
    _layIM.sendMessage();
    XoW.logger.ms(_this.classInfo, 'sendMsgForTop()');
  }
  LAYIMEX.prototype.onReady = function() {
    XoW.logger.ms(_this.classInfo, 'onReady()');
    this.bindFriendListMenu();
    _bindMainToolList();
    _bindSearchPanel();
    _bindLogoutLi();
    _bindMineInfoLi();
    var local = layui.data('layim-mobile')[_cache.mine.id] || {};
    local['hasUnreadSysInfo'] = local['hasUnreadSysInfo'] || false;
    if(local['hasUnreadSysInfo']) {
      _blinkSysInfoIcon();
    }
    XoW.logger.me(_this.classInfo, 'onReady()');
  };
  // endregion mark mobile
  // endregion APIs

  // region  UI CAllBack By LayIM(除非只涉及UI处理，否则要丢给controller去处理)
  _layIM.on('tab', function (pIndex) {
    XoW.logger.ms(_this.classInfo, 'tab()');
    if(pIndex === 3) {
      // search panel
      return;
    }

    var $search = _getLayImMain().find('.layui-layim-search');
    $search.hide();
    XoW.logger.ms(_this.classInfo, 'tab()');
  });
  _layIM.on('moreList', function(obj){
    XoW.logger.ms(_this.classInfo, 'moreList()');
    switch(obj.alias) {
      case 'find':
        XoW.logger.ms(_this.classInfo, 'find()');
        var param = {
          tab: 'user',
          friend: _cache.friend
        }
        _openRemoteSearchBox(param);
        break;
      case 'cart': //发现
        _layer.msg('购物车暂未集成，敬请期待');
        break;
      case 'clear':
        _clearCache();
        break;
    }});
  _layIM.on('sendMessage', function(data) {
    XoW.logger.ms(_this.classInfo, 'sendMessage()');
    // 模擬客服自动回复
    // if(data.to.id === '#demohelp') {
    //   // var To = data.to;
    //   // setTimeout(function() {
    // 	//   var obj = {
    // 	// 	  username: To.name
    // 	// 	  , avatar: To.avatar
    // 	// 	  , id: To.id
    // 	// 	  , type: To.type
    // 	// 	  , content: DEMO_AUTO_REPLAY[Math.random() * 9 | 0]
    // 	//   }
    // 	//   _layIM.getMessage(obj);
    //   // }, 3000);
    //    let msg = $msg({
    //       type:'chat',
    //       from:_client.getCurrentUser().jid,
    //       to:'#demohelp@intelligentcusservice.127.0.0.1'
    //    }).c('body').t("11111");
    //   _client.getConnMgr().send(msg);
    // }
  });
  _layIM.on('newFriend', function(){
    XoW.logger.ms(_this.classInfo, 'newFriend()');
    _openSysInfoPanel();
    XoW.logger.me(_this.classInfo, 'newFriend()');
  });
  _layIM.on('tool(code)', function(pInsert, pSendMessage){
    XoW.logger.ms(_this.classInfo, 'tool(code)()');
    // 移动版暂不支持prompt函数
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
    XoW.logger.ms(_this.classInfo, 'tool(link)()');
    var scrollTop = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
    // 移动版暂不支持prompt函数
    _layer.prompt({
      title: '请输入网页地址'
      ,shade: false
      ,offset: [
        this.offset().top - scrollTop - 158 + 'px'
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

      // 暂时先注释掉掉jquery/zepto [20190401]
      // 不支持跨域
      //$.ajax({
      //  async: false,
      //  url: src,
      //  type: 'GET',
      //  dataType: "html",
      //  timeout: 5000,
      //  success: function (data) {
      //    var doc = (new DOMParser()).parseFromString(data, "text/html");
      //    var content = {
      //      url:$('meta[property="og:url"]', doc) ? $('meta[property="og:url"]', doc).attr('content') : '',
      //      type:$('meta[property="og:type"]', doc) ? $('meta[property="og:type"]', doc).attr('content') : '',
      //      image:$('meta[property="og:image"]', doc) ? $('meta[property="og:image"]', doc).attr('content') : '',
      //      title:$('meta[property="og:title"]', doc) ? $('meta[property="og:title"]', doc).attr('content') : '',
      //      description:$('meta[property="og:description"]', doc) ? $('meta[property="og:description"]', doc).attr('content') : ''
      //    };
      //    var msg = 'linkEx[{0}]'.f(JSON.stringify(content));
      //    pInsert(msg);
      //    pSendMessage();
      //  },
      //  error: function(jqXHR, textStatus, errorThrown) {
      //    _layer.msg('网络不可达或跨域了.'); // 若使用dataType: 'jsonp'来跨域，也不支持返回为html/text的类型
      //  }
      //});
    });
    XoW.logger.me(_this.classInfo, 'tool(link)()');
  });
  _layIM.on('chatChange', function (res) {
    XoW.logger.ms(_this.classInfo, 'chatChange({0},{1})'.f(res.data.type, res.data.id));
    var type = res.data.type;
    let jid = res.data.jid;
    if (!res.data.jid) {
      //_layer.msg('No Jid of that chat，请联系管理员')
      _layer.open({
        content: 'JID不存在，无法与该用户聊天.'
        ,btn: '我知道了'
      });
      return;
    }

    if (type === XoW.MessageType.CONTACT_CHAT) {
      var friend = _getFriendById(res.data.id);
      if (friend && friend.status === XoW.UserState.OFFLINE) {
        _layIM.setChatStatus('离线');
      } else if (friend && friend.status === XoW.UserState.ONLINE) {
        _layIM.setChatStatus('在线');
      } else {
        _layIM.setChatStatus('');
      }
      _rebindToolFileButton();
    } else if (type === XoW.MessageType.GROUP_CHAT) {
      //模拟系统消息
      _rebindToolFileButton();
      if(!_client.getRoomMgr().isCurrentUserAlreadyInRoom(jid)) {
        _client.getRoomMgr().me_into_a_room(type, jid);
        _layIM.getMessage({
          system: true
          , id: res.data.id
          , type: "group"
          , content: '自己加入房间'
        });
      }
    }
    XoW.logger.me(_this.classInfo, 'chatChange({0})'.f(res.data.id));
  });

  // endregion  UI CAllBack By LayIM

  // region LayImEx-event handlers
  var events = {
    // region mark mobile
    menu_chat: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'menu_chat()');
      _layer.close(_layerIndex[LAYER_MENU_FRIEND]);
      var $par = oThis.parent();
      var id = $par.data('id');
      var data = _getDataFromFriendListItem(id);
      _layIM.chat(data);
    },
    todoCreateChatRoom:function(oThis, e){
      // _roomBack(oThis);
      _makeChatingRoom(oThis);
    },
    todoCreateMeetRoom:function(oThis, e){
      _makeMeetingRoom(oThis);
    },
    sendMessageToRoomOneMember:function(oThis, e){
      let onejid = $(oThis).attr('data-jid');
      let oneNick = $(oThis).attr('data-nick');
      let barejid = XoW.utils.getBareJidFromJid(onejid);
      _layIM.chat({
        name:oneNick,
        username: oneNick,
        type: 'friend',
        avatar: XoW.DefaultImage.AVATAR_KEFU,
        id: oneNick,
        jid: barejid,
        temporary: true
      });
    },
    addFreindInRoom:function(oThis, e){
      let onejid = $(oThis).attr('data-jid');
      let oneNick = $(oThis).attr('data-nick');
      let jid = XoW.utils.getBareJidFromJid(onejid);
      let stranger = {
        id:oneNick,
        jid:jid,
        type:'friend',
        username: oneNick,
        sign: '想看对方签名，先订阅',
        avatar:'../skin/images/avatar_stranger.png'
      }
      stranger.submit = function (pGroupName, pRemark, pIndex) {
        var cont = $(window.event.currentTarget).parent().parent();
        this.groupid = pGroupName;
        this.remark = pRemark;
        this.username = this.username;
        layui.each(call.subContact, function(index, item){
          item && item(stranger);});
        _layer.close(pIndex);
      };
      _setFriendGroup(stranger);
    },
    addFriendToOneRoomMember:function(oThis, e){
      let onejid = $(oThis).attr('data-jid');
      let oneNick = $(oThis).attr('data-nick');
      let barejid = XoW.utils.getBareJidFromJid(onejid);

    },
    add_Room:function(oThis,e){
      let roomjjdi = $(this).attr("data-jid");
      let roomname = $(this).attr('roomname');
      var allroom = _client.getRoomMgr().getSaveoutAllRoom();
      for(var i= 0 ;i<allroom.length;i++){
        if(allroom[i].jid ==roomjjdi){
          allroom[i].name = roomname;
          _layIM.chat(allroom[i]);
          break;
        }
      }
      e.stopImmediatePropagation();
    },
    temparatureFriend:function(oThis, e){
      let onejid = $(oThis).attr('data-jid');
      let oneNick = $(oThis).attr('data-nick');
      _temparatureFriend(onejid,oneNick);
      e.stopImmediatePropagation()
    },
    roomCreateIcon:function(oThis, e){
      _layer.open({
        content: _eleRoomToolMoreMenu,
        skin: 'menu_ex',
        shade: 'background-color:rgba(0,0,0, .3);',
        opacity: 0.2,
        success: function(layero) {
          _layerIndex['ROOMCREATEICONLIST'] = layero.attributes['index'].value;
        }
      })
    },
    search_room_remote:function(oThis,e){
      _getAllroomINFPO(function (stanza) {
        var $itemsResult = $(stanza);
        var $items = $("item", $itemsResult);
        var text = $.trim($("#qry_room_keyword").val());
        if(text == ''){
          var getNullheml  = _getEleRemoteSearchRoomResnofind(text);
          document.getElementById("search_room_remote_res").innerHTML = getNullheml;
        }
        else {
          let roomitem = [];
          $items.each(function (index, item) {
            var room = new XoW.Room();
            var roomJid = $(item).attr("jid");
            room.jid = roomJid;
            room.name = $(item).attr("name");
            if (room.name.indexOf(text) >= 0|| text === roomJid) {
              roomitem.push(room);
            }

          });
          if(roomitem.length>0){
            let getRoomheml  = _getEleRemoteSearchRoomRes(roomitem);
            document.getElementById("search_room_remote_res").innerHTML = getRoomheml;
          }
          else{
            var getNotfineheml  = _getEleRemoteSearchRoomResnofind(text);
            document.getElementById("search_room_remote_res").innerHTML = getNotfineheml;
          }
        }
      });
      e.stopImmediatePropagation();
    },
    removeRoomSeachKeyDownText:function(oThis, e){
      _roomBack(oThis)
    },
    backRoomSearh:function(oThis, e){
      _roomBack(oThis)
    },
    backdealWRoomSpeak:function(oThis, e){
      _roomBack(oThis)
    },
    createChatRoom:function(oThis, e){
      _layer.close(_layerIndex['ROOMCREATEICONLIST']);
      let content = _layTpl(_eleRoomCreate).render(" ")
      let index = _layIM.panelExs({
        title: '创建聊天室'
        ,tpl: content
      },'todoCreateChatRoom','完成')
      _layForm.render();
      _layerIndex['CREATEROOM'] = index;
    }
    ,createMeetingRoom:function (othis,e) {
      _layer.close(_layerIndex['ROOMCREATEICONLIST']);
      let content = _layTpl(_eleRoomMeetCreate).render(" ")
      let index = _layIM.panelExs({
        title: '创建会议室'
        ,tpl: content
      },'todoCreateMeetRoom','完成')
      _layerIndex['MEETINGEROOM'] = index;
      _layForm.render();
    }
    ,roomRefresh:function (othis,e) {
      _layer.close(_layerIndex['ROOMCREATEICONLIST']);
      let getallroom = _client.getRoomMgr().getSaveoutAllRoom();
      for(let i = 0;i<getallroom.length;i++){
        let r = getallroom[i];
        _layIM.removeList(r);
      }
      _client.getRoomMgr().getAllRFServer();
    },
    exitThisRoom:function(oThis, e){
      let roomjid = $(e.target).attr('roomjid');
      let roomuindex =  $(e.target).attr('roomuindex');
      _layer.open({
        content: '你要退出该房间吗'
        ,btn: ['没错', '不要']
        ,yes: function(index){
          _exitRoom(roomjid);
          _layer.close(index);
          let thischat = _getThisChat();
          _roomBack(thischat.elem);
          _client.getRoomMgr().closeOneThisRoom(roomjid);
          _layer.close(roomuindex);
          let getallroom = _client.getRoomMgr().getSaveoutAllRoom(); // todo wshengt modify
          for(var i = 0;i<getallroom.length;i++){
            var r = getallroom[i];
            _layIM.removeList(r);
          }
          // _client.getRoomMgr().getRoomByJidFromServer(roomjid);
          _client.getRoomMgr().getAllRFServer();
        },
        btn1:function (index) {
          _layer.close(index);
        }
      });
      e.stopImmediatePropagation();
    },
    approve_roommember_sub:function(oThis, e){
      let jid = $(e.target).attr("data-jid");
      let roomPassword = $(e.target).attr("roompassword");
      // alert(jid + "*********************" + roomPassword)
      let room = new XoW.Room();
      room.jid = jid;
      room.name = XoW.utils.getNodeFromJid(jid);
      room.id= room.name;
      _client.getRoomMgr().joinInviteRoom(room,roomPassword);
      let $grPar = oThis.parent().parent(); // li
      $grPar.find('.layim-msgbox-btn').html('已接受');
    },
    deny_roommember_sub:function(oThis, e){
      let jid = $(e.target).attr("data-jid");
      let invifro = $(e.target).attr("invifro");
      let room = new XoW.Room();
      room.jid = jid;
      room.name = XoW.utils.getNodeFromJid(jid);
      room.id= room.name;
      if(_client.getRoomMgr().isCurrentUserAlreadyInRoom(jid)){
        XoW.logger.e("joinRoom 当前用户已在该房间中，加入失败！");
        layer.msg("你已在这个房间，加入失败");
        return false;
      }
      _client.getRoomMgr().denyinvitRoom(room,invifro);
      let $grPar = oThis.parent().parent(); // li
      $grPar.find('.layim-msgbox-btn').html('已拒绝');
    },
    choiceSpeakMember:function(oThis, e){
      let onejid = $(e.target).attr("data-jid");
      let roomjid = $(e.target).attr("roomjid");
      let roomState = $(e.target).attr("roomState");
      let text = $(e.target).text();
      if(roomState == 'visitor') {
        _layer.open({
          content: '你将授予该用户发言权'
          ,btn: ['没错', '不要']
          ,yes: function(index){
            _giveMemberToP(roomjid, onejid,function () {
              _giveSpeak(roomjid, text,function () {
                _layer.open({
                  content: '操作成功'
                  , skin: 'msg'
                  , time: 2
                });
                $(e.target).css('color','black');
                $(e.target).attr("roomState", "participant");
              }, function () {
                _layer.open({
                  content: '操作失败'
                  , skin: 'msg'
                  , time: 2
                });
              });
            }, function () {
              _layer.open({
                content: '操作失败'
                , skin: 'msg'
                , time: 2
              });
            });

          },
          btn1:function (index) {
            _layer.close(index);
          }
        });
      }else{
        _layer.open({
          content: '你将取消该用户发言权'
          ,btn: ['没错', '不要']
          ,yes: function(index){
            _banSpeak(roomjid, text,function () {
              _layer.open({
                content: '操作成功'
                , skin: 'msg'
                , time: 2
              });
            }, function () {
              _layer.open({
                content: '操作失败'
                , skin: 'msg'
                , time: 2
              });
            });
            $(e.target).css('color','red');
            $(e.target).attr("roomState", "visitor");
          },
          btn1:function (index) {
            _layer.close(index);
          }
        });
      }
    },
    destroyThisRoom:function(oThis, e){
      let roomjid = $(e.target).attr("roomjid");
      _destroying(roomjid, function () {
        _layer.open({
          content: '操作成功'
          ,skin: 'msg'
          ,time: 2
        });
        let roomList = $('.layim-list-group li');
        for(let i = 0;i < roomList.length;i++){
          if(roomList.eq(i).attr("data-id")==XoW.utils.getNodeFromJid(roomjid)){
            roomList.eq(i).remove();
            break;
          }
        }
      }, function () {
        _layer.open({
          content: '操作失败'
          ,skin: 'msg'
          ,time: 2
        });
      });
      _roomBack(oThis);
      _layer.close(_layerIndex["ROOMSETING"]);
      _layerIndex["ROOMSETING"] = -1;
      let thisRoom = _client.getRoomMgr().getRoomByJid(roomjid);
      thisRoom.type = 'group';
      _layIM.removeList(thisRoom)
    },

    invitMember:function(oThis, e){
      let roomjid = $('#toInvite').attr("roomjid");
      var _friend =  _client.getRosterMgr().getFriendGroups();
      let roomdata = [];
      for (var i = 0; i < _friend.length; i++) {
        _friend[i].list.find(function (x) {
          if(XoW.UserState.OFFLINE !== x.status){
            let rommFrened = {
              name:XoW.utils.getNodeFromJid(x.jid),
              jid:x.jid
            }
            roomdata.push(rommFrened)
          }
        });
      }

      let content = _layTpl(_eleRoomInviting).render({
        data:{
          roomdata: roomdata,
          roomjid:roomjid,

        }
      });
      _layIM.panel({
        title: '邀请好友'
        ,tpl: content
      });
      _layForm.render();
      $('#todoRoomInvition').keyup(function(event){
        let html = ''
        let choice = $('#todoRoomInvition').val();
        let reg = new RegExp(choice)
        layui.each(roomdata,function (index,item) {
          if(item.jid.match(reg)){
            html+=  '<div class="room-seting-div" layimEx-event="todoInviting" data-jid = "'+roomjid+'">'+item.jid+'</div>'
          }
        })
        $('#getRoomInvtionPe').html(html);
      });

    },
    sendingSubject:function(oThis, e){
      let context = $('#isReadySendSubject').val();
      let roomjid = $('#isReadySendSubject').attr('data-jid')
      var user = _client.getCurrentUser().jid;
      var msg = $msg({
        from:user,
        to:roomjid,
        type:'groupchat'
      }).c('subject',context)
      _client.getConnMgr().send(msg);
      _roomBack(oThis)
      _layer.close(_layerIndex['ROOMSUBJECT']);
      _layerIndex['ROOMSUBJECT'] = -1;
      $("#layerSubject").text(context)
    },
    modify_room_name:function(oThis, e){
      let roomjid = $("#modifyRoomRoomName").attr('roomjid');
      //layerRoomName
      let roomName = $('#layerRoomName').text();
      let content = _layTpl(_eleWriteRoomName).render({
        data:{
          roomjid:roomjid,
          roomName:roomName
        }
      });

      _layIM.panel({
        title: '群聊名称'
        ,tpl: content
      });
    },//modifyRoomRoomDes
    modify_room_desc:function(oThis, e){
      let roomjid = $("#modifyRoomRoomDes").attr('roomjid');
      //layerRoomName
      let roomDesc= $('#layerRoomDesc').text();
      let content = _layTpl(_eleWriteRoomDesc).render({
        data:{
          roomjid:roomjid,
          roomDesc:roomDesc
        }
      });

      let roomDescindex = _layIM.panelExs({
        title: '群聊描述'
        ,tpl: content
      },"saveRoomDesc",'完成');
      _layerIndex['ROOMDESC'] = roomDescindex;
    },

    saveRoomDesc:function(oThis, e){
      let context = $('#toWriteRoomDesc').val();
      let roomjid = $('#toWriteRoomDesc').attr('data-jid')
      var user = _client.getCurrentUser().jid;
      _todoSaveRoomDesc(context,roomjid,user)
      _roomBack(oThis);
      _layer.close(_layerIndex['ROOMDESC']);
      _layerIndex['ROOMDESC'] = -1;
    },
    sendRoomSubjet:function(oThis, e){
      let roomjid = $("#roomSubjectSt").attr('roomjid');
      let subject = $('#layerSubject').text();
      let content = _layTpl(_eleSubject).render({
        data:{
          roomjid:roomjid,
          valuesubject:subject
        }
      });

      let roomSubjectindex = _layIM.panelExs({
        title: '房间主题'
        ,tpl: content
      },'sendingSubject','完成');
      _layerIndex['ROOMSUBJECT'] = roomSubjectindex;
      _layForm.render();
    },
    todoInviting:function(oThis, e){
      let roomjid = $(e.target).attr("data-jid");
      let oneJid = XoW.utils.getBareJidFromJid($(e.target).text());
      _todoInvitingToOtherSr(roomjid,oneJid);
    },
    changeAdminToOther:function(oThis, e){
      let roomjid = $(e.target).attr('data-jid');
      let oneJid = XoW.utils.getBareJidFromJid($(e.target).text());
      let oneNick = $(e.target).attr('data-nick');
      _changeAdminToOtherSr(roomjid,oneJid,oneNick,oThis);
    },
    changeMeetAdminToOther:function(oThis, e){
      let roomjid = $(e.target).attr('data-jid');
      let oenNick = $(e.target).attr('data-nick');
      let oneJid = XoW.utils.getBareJidFromJid($(e.target).text());
      // alert(roomjid + "   " + oneJid)
      _changemeetAdminToOtherSr(roomjid,oneJid,oThis);
    },
    todoDenyRoomMemer:function(oThis, e){
      let roomjid = $(e.target).attr('data-jid');
      let oneNick = $(e.target).text();
      _rodoDenyMember(roomjid,oneNick,e)

    },
    roomAdimSetingSr:function(oThis, e){
      let roomjid  = $(e.target).attr('data-jid');
      _client.getRoomMgr().getRoomByJidFromServer(roomjid, function (params) {
        var room = params.room;
        let data = [];
        var roomInMuc = _client.getRoomMgr().getXmppRoom(roomjid);
        if (null == room) {
          _layer.msg('房间信息不存在！');
          return;
        } else if (null == roomInMuc) {
          _layer.msg('请先加入该房间！');
          return;
        }
        for (var key in roomInMuc.roster) {
          var o = roomInMuc.roster[key];
          if (roomInMuc.nick !== key) {
            data.push(o);
          }
        }
        let content = _layTpl(_eleRoomAdmin).render({   //_eleSearchLi  _eleRoomAdmin
          data:{
            roomdata: data,
            roomjid:roomjid,

          }
        });
        _layIM.panel({
          title: '房间转让'
          ,tpl: content
        });
        _layForm.render();

        $('#roomAdminSeachKeyDown').keyup(function(event){
          let html = ''
          let choice = $('#roomAdminSeachKeyDown').val();
          let reg = new RegExp(choice)
          layui.each(data,function (index,item) {
            if(item.nick.match(reg)){
              html+=   '<div style="width: 100%;height: 50px;background-color: white;line-height: 50px;text-align: left" layimEx-event="changeAdminToOther" data-nick = "'+item.nick+'" data-jid = "'+roomjid+'">'+item.jid+'</div>'
            }
          })
          $('#searchRoomAdmin').html(html);

        });


      });
    },//denyMemberSetingSr
    roomMeetAdimSetingSr:function(oThis, e){
      let roomjid  = $(e.target).attr('data-jid');
      _client.getRoomMgr().getRoomByJidFromServer(roomjid, function (params) {
        var room = params.room;
        let data = [];
        var roomInMuc = _client.getRoomMgr().getXmppRoom(roomjid);
        if (null == room) {
          _layer.msg('房间信息不存在！');
          return;
        } else if (null == roomInMuc) {
          _layer.msg('请先加入该房间！');
          return;
        }
        for (var key in roomInMuc.roster) {
          var o = roomInMuc.roster[key];
          if (roomInMuc.nick !== key) {
            data.push(o);
          }
        }
        let content = _layTpl(_eleRoomAdmin).render({   //_eleSearchLi  _eleRoomAdmin
          data:{
            roomdata: data,
            roomjid:roomjid,

          }
        });
        _layIM.panel({
          title: '房间转让'
          ,tpl: content
        });
        _layForm.render();

        $('#roomAdminSeachKeyDown').keyup(function(event){
          let html = ''
          let choice = $('#roomAdminSeachKeyDown').val();
          let reg = new RegExp(choice)
          layui.each(data,function (index,item) {
            if(item.nick.match(reg)){
              html+=   '<div style="width: 100%;height: 50px;background-color: white;line-height: 50px;text-align: left" layimEx-event="changeMeetAdminToOther" data-nick = "'+item.nick+'" data-jid = "'+roomjid+'">'+item.jid+'</div>'
            }
          })
          $('#searchRoomAdmin').html(html);
        });
      });
    },
    denyMemberSetingSr:function(oThis, e){
      let roomjid  = $(e.target).attr('data-jid');
      _client.getRoomMgr().getRoomByJidFromServer(roomjid, function (params) {
        var room = params.room;
        let data = [];
        var roomInMuc = _client.getRoomMgr().getXmppRoom(roomjid);
        if (null == room) {
          _layer.msg('房间信息不存在！');
          return;
        } else if (null == roomInMuc) {
          _layer.msg('请先加入该房间！');
          return;
        }
        for (var key in roomInMuc.roster) {
          var o = roomInMuc.roster[key];
          if (roomInMuc.nick !== key) {
            data.push(o);
          }
        }
        let content = _layTpl(_eleDenyRoomMember).render({
          data:{
            roomdata: data,
            roomjid:roomjid,

          }
        });
        _layIM.panel({
          title: '成员管理'
          ,tpl: content
        });
        _layForm.render();

        //roomSeachKeyDown

        $('#roomSeachKeyDown').keyup(function(event){
          let html = ''
          let choice = $('#roomSeachKeyDown').val();
          let reg = new RegExp(choice)
          layui.each(data,function (index,item) {
            if(item.nick.match(reg)){
              html+= '<div style="width: 100%;height: 50px;background-color: white;line-height: 50px;text-align: left" layimEx-event="todoDenyRoomMemer" data-jid = "'+roomjid+'">'+item.nick+'</div>'
            }
          })
          $('#searchSomeMember').html(html);
        });

      });
    },
    dealWithRoomSpeak:function(oThis, e){
      let roomjid  = $(e.target).attr('data-jid');
      _client.getRoomMgr().getRoomByJidFromServer(roomjid, function (params) {
        var room = params.room;
        let data = [];
        var roomInMuc = _client.getRoomMgr().getXmppRoom(roomjid);
        if (null == room) {
          _layer.msg('房间信息不存在！');
          return;
        } else if (null == roomInMuc) {
          _layer.msg('请先加入该房间！');
          return;
        }
        for (var key in roomInMuc.roster) {
          var o = roomInMuc.roster[key];
          if (roomInMuc.nick !== key) {
            data.push(o);
          }
        }
        let content = _layTpl(_eledealWRoomSpeak).render({
          data:{
            roomdata: data,
            roomjid:roomjid,

          }
        });
        _layIM.panel({
          title: '发言管理'
          ,tpl: content
        });
        _layForm.render();

        $('#roomdealWRoomSpeakDown').keyup(function(event){
          let html = ''
          let choice = $('#roomdealWRoomSpeakDown').val();
          let reg = new RegExp(choice)
          layui.each(data,function (index,item) {
            if(item.nick.match(reg)){
              if(item.role === "visitor"){
                html+= '<div style="width: 100%;height: 50px;background-color: white;color: red;line-height: 50px;text-align: left" layimEx-event="choiceSpeakMember" roomjid = "'+roomjid+'" data-jid = "'+item.jid+'" roomState = "'+item.role+'">'+item.nick+'</div>'
              } else {
                html+=   '<div style="width: 100%;height: 50px;background-color: white;line-height: 50px;text-align: left" layimEx-event="choiceSpeakMember" roomjid = "'+roomjid+'" data-jid = "'+item.jid+'" roomState = "'+item.role+'">'+item.nick+'</div>'
              }
            }
          })
          $('#showMemeberSpeakePower').html(html);
        });

      });
    },
    stop_http_file:function(oThis, e){
      let fileid = $(e.target).attr('data-cid');
      sessionStorage.setItem(fileid, false);
      // let  keyCode = sessionStorage.getItem(fileid);
      // console.log("stop_http_file"+keyCode)
    },
    continue_http_file:function(oThis, e){
      let fileid = $(e.target).attr('data-cid');
      sessionStorage.setItem(fileid, true);
      $('#chttp'+fileid).remove();
      let $layimFile = $('.layim-chat-mine[data-cid=' + fileid+ '] .layim-chat-text');
      $layimFile.append('<div id="http'+fileid+'"><a href="javascript:void(0);" layImEx-event="stop_http_file"  style="color:red"  data-cid = "'+fileid+'">取消</a></div>');
      layui.each(call.continuehttpfilestransfer, function (index, item) {
        item && item(fileid);
      });

    },
    detail:function(oThis, e){
      let roomId = $.trim(oThis.parent().text());
      if($('.layim-chat-status').text().length>0){
        let getRoomId = roomId.substring(1,roomId.length-3);
        let roomjid = _client.getRoomMgr().getRoomByID(getRoomId);
        let allroom = _client.getRoomMgr().getSaveoutAllRoom();
        let choiceroomlist;
        for(let i=0;i<=allroom.length;i++){
          let t = allroom[i];
          if(t.jid == roomjid){
            choiceroomlist = t;
            break;
          }
        }
        if(choiceroomlist.isPersistent){
          _roomSeting(roomjid)
        }else{
          _roomMeetSeting(roomjid)
        }
      }else{
        let getRoomId = roomId.substring(1,roomId.length-1);
        let roomjid = _client.getRoomMgr().getRoomByID(getRoomId);
        let allroom = _client.getRoomMgr().getSaveoutAllRoom();
        let choiceroomlist;
        for(let i=0;i<=allroom.length;i++){
          let t = allroom[i];
          if(t.jid == roomjid){
            choiceroomlist = t;
            break;
          }
        }
        if(choiceroomlist.isPersistent){
          _roomSeting(roomjid)
        }else{
          _roomMeetSeting(roomjid)
        }
      }
    },
    menu_profile: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'menu_profile()');
      _layer.close(_layerIndex[LAYER_MENU_FRIEND]);
      var $par = oThis.parent();
      var id = $par.data('id');
      var data = _getFriendById(id);
      if(!data || !data.vcard) {
        XoW.logger.e('There is no vCard, return.');
        return;
        // todo 去服务端取
      }
      var content = _layTpl(_eleVCard).render(data);
      _layer.close(events.menu_profile.index);
      events.menu_profile.index = _layIM.panel({
        type: 1 // 1表示页面内，2表示frame
        ,title: '联系人资料'
        ,tpl: content
        ,success: function(layero) {
        }
      });
    },
    menu_history: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'menu_history()');
      _layer.msg('本端暂不支持该操作，请使用PC端吧:)');
      XoW.logger.me(_this.classInfo, 'menu_history()');
    },
    menu_rm_friend: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'menu_rm_friend()');
      _layer.close(_layerIndex[LAYER_MENU_FRIEND]);
      var $par = oThis.parent();
      var id = $par.data('id');
      var data = _getFriendById(id);
      if(!data){
        XoW.e('There is no such user with id {0}, return.'.f(id));
        return;
      }
      _layer.open({
        content: '确定删除好友 {0} 吗？'.f(data.username),
        btn: ['确定', '取消'],
        skin: 'footer',
        shadeClose: true,
        yes: function(index){
          XoW.logger.ms(_this.classInfo, 'menu_rm_friend.yes()');
          layui.each(call.rmvContact, function(i, item){
            item && item(data);});
          _layer.close(index);
        }
      });
      XoW.logger.me(_this.classInfo, 'menu_rm_friend()');
    },
    menu_move_to: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'menu_move_to()');
      _layer.close(_layerIndex[LAYER_MENU_FRIEND]);
      _layer.msg('本端暂不支持该操作，请联系管理员完成操作');
    },
    menu_create_group: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'menu_create_group()');
      _layer.close(_layerIndex[LAYER_MENU_FRIEND]);
      _layer.msg('本端暂不支持该操作，请联系管理员完成操作');
    },
    menu_add_friend: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'menu_sweep_qrcode()');
      _layer.close(_layerIndex[LAYER_MENU_MORE_TOOL]);
      _layer.msg('等几天这个代码就合过来啦 : )');
    },
    menu_remote_search: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'menu_remote_search()');
      _layer.close(_layerIndex[LAYER_MENU_MORE_TOOL]);
      _openRemoteSearchBox();
      XoW.logger.me(_this.classInfo, 'menu_remote_search()');
    },
    menu_sweep_qrcode: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'menu_sweep_qrcode()');
      _layer.close(_layerIndex[LAYER_MENU_MORE_TOOL]);
      _layer.msg('扫码是神马？程序猿回家洗衣服、扫地鸟 :（');
    },
    menu_speak: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'menu_speak()');
      _layer.close(_layerIndex[LAYER_MENU_MORE_TOOL]);
      _layer.open({
        content: '攻城狮玩命开发智能语音互动功能ing，敬请期待:)'
        ,skin: 'footer'
      });
    },
    menu_help: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'menu_help()');
      // todo 打开聊天客服界面
      _layer.close(_layerIndex[LAYER_MENU_MORE_TOOL]);
      var toId = '#demohelp';
      _layIM.chat({
        name: '智能客服',
        username: toId,
        type: 'friend', //聊天类型不能用 kefu
        avatar: XoW.DefaultImage.AVATAR_KEFU,
        id: toId,
        jid: "#demohelp@intelligentcusservice.127.0.0.1",
        temporary: true
      });
    },

    login: function(oThis, e) {
      XoW.logger.ms(_this.classInfo, 'login()');
      var elem = oThis.parents('.layui-form');
      var settings = {
        verify_username: function (value, item) { //value：表单的值、item：表单的DOM对象
          if (!new RegExp("^[a-zA-Z0-9_\u4e00-\u9fa5\\s·]+$").test(value)) {
            return '用户名不能有特殊字符';
          }
          if (/(^\_)|(\__)|(\_+$)/.test(value)) {
            return '用户名首尾不能出现下划线\'_\'';
          }
          if (/^\d+\d+\d$/.test(value)) {
            return '用户名不能全为数字';
          }
        },
        verify_password: [
          /^[\S]{6,12}$/
          , '密码必须6到12位，且不能出现空格'
        ]
      };
      if(!_verifyForm(elem, settings)) {
        return;
      }
      var field = _getFormFields(elem);

      layui.each(call.login, function(i, item){
        item && item(field);});
      XoW.logger.me(_this.classInfo, 'login()');
    },
    logout: function(oThis, e) {
      XoW.logger.ms(_this.classInfo, 'logout()');
      _layer.open({
        content:  '确认退出当前账号?'
        ,btn: ['确认', '取消']
        //,time: 5
        ,skin: 'footer'
        ,shadeClose: true
        ,yes: function(index){
          XoW.logger.ms(_this.classInfo, 'moreList.logout.yes()');
          layui.each(call.logout, function(index, item){
            item && item();});
          _layer.close(index);
          // todo 主动登出要跳转至登录界面
        }
      });
      XoW.logger.me(_this.classInfo, 'logout()');
    },
    select_main_tool: function(oThis, e) {
      XoW.logger.ms(_this.classInfo, 'select_main_tool()');
      var filter = oThis.attr('lay-filter');
      switch(filter){
        case 'find':
          _openLocalUserSearch();
          break;
        case 'more':
          _openMainToolMore();
          break;
      }
      XoW.logger.me(_this.classInfo, 'select_main_tool()');
    },
    open_mine_info: function(oThis, e) {
      XoW.logger.ms(_this.classInfo, 'open_mine_info()');
      layui.each(call.getMineInfo, function(index, item){
        item && item(function(pVCard){
          XoW.logger.ms(_this.classInfo, 'getMineInfo.cb()');
          _cache.mine.vcard = pVCard;
          _cache.mine.gender = "secret";
          if(!_cache.mine.vcard.BDAY) {
            _cache.mine.vcard.BDAY = "1900-01-01";
          }
          _cache.mine.name = pVCard.NICKNAME || _cache.mine.name || _cache.mine.username;
          _cache.mine.avatar = pVCard.PHOTO.BINVAL ? 'data:image/;base64,' + pVCard.PHOTO.BINVAL : _cache.mine.avatar;
          var content = _layTpl(_eleMineVCard).render(_cache.mine);
          _layer.close(events.open_mine_info.index);
          events.open_mine_info.index = _layIM.panel({
            type: 1 // 1表示页面内，2表示frame
            ,title: '我的资料'
            ,tpl: content
            ,success: function(layero) {
              _layDate.render({
                elem: '#set_mine_vcard_bday'
                ,format: 'yyyy-MM-dd'
              });

              // 使用upload也是为了有早一日干掉使用base64的方式，我们也整个图片服务器存图片呗
              var $inputEle = $(layero).find('input[type="file"]')[0];
              _layUpload({
                url: ''
                ,elem: $inputEle
                ,unwrap: true
                ,type: 'images'
                ,before: function(pInputItem) {
                  XoW.logger.ms(_this.classInfo, 'set_mine_avatar.upload.before()');
                  // prevent form to submit
                  $(pInputItem).parent().submit(function(evt) {
                    evt.preventDefault();
                    return false;
                  });
                  typeof this.success === 'function' && this.success(pInputItem);
                  pInputItem.value = '';
                }
                ,success: function(pItem){
                  XoW.logger.ms(_this.classInfo, 'set_mine_avatar.upload.success()');
                  var $file = pItem.files[0]; // $file.size is base64 size?
                  var reader = new FileReader();
                  reader.onload = function (e) {
                    XoW.logger.ms('FileReader.onload({0},{1}) '.f($file.filename, $file.size));
                    if($file.size > 10*1024){
                      _layer.msg('上传的图片的不能超过10K,请重新选择');
                      return;
                    }
                    $('#img_set_mine_avatar')[0].src = e.target.result;
                    $('#img_set_mine_avatar')[0].tag = 'changed';
                  };
                  if ($file) {
                    reader.readAsDataURL($file);
                  }
                }
              });
            }// eof layer open success
          });
          XoW.logger.me(_this.classInfo, 'getMineInfo.cb()');
        });
        XoW.logger.me(_this.classInfo, 'open_mine_info.cb()');
      });
    },
    set_mine_avatar: function(oThis, e) {
      XoW.logger.ms(_this.classInfo, 'set_mine_avatar()');
      XoW.logger.me(_this.classInfo, 'set_mine_avatar()');
    },
    set_mine_info: function(oThis, e) {
      XoW.logger.ms(_this.classInfo, 'set_mine_info()');
      var elem = $('#setMineInfo');
      if(!_verifyForm(elem)) {
        return;
      }
      var field = _getFormFields(elem);

      // _layer.alert(JSON.stringify(field));
      var imgAvatar = $('#img_set_mine_avatar')[0];
      if(imgAvatar.tag === 'changed') {
        layui.each(call.setMineInfoWithAvatar, function(index, item){
          // data:image/jpeg;base64,xxx
          var ay = imgAvatar.src.split(';base64,', 2);
          var type = ay[0].split(':', 2)[1];
          field = $.extend({base64: ay[1], type: type}, field);
          item && item(field, function(){
            _layer.msg('保存成功');
          });
        });
      } else {
        layui.each(call.setMineInfo, function(index, item){
          item && item(field, function(){
            _layer.msg('保存成功');
          });
        });
      }
      XoW.logger.me(_this.classInfo, 'set_mine_info()');
    },
    open_mine_info_field: function(oThis, e) {
      XoW.logger.ms(_this.classInfo, 'open_mine_info_field()');
      _layer.close(events.open_mine_info_field.index);
      events.open_mine_info_field.index = _layIM.panel({
        title: '编辑{0}'.f(oThis.find('.layim-vcard-title')[0].innerText),
        tpl: _layTpl(_elemMineVcardField).render({
          name: oThis.find('input').attr('name'),
          value: oThis.find('input').val()
        })
      });
      XoW.logger.me(_this.classInfo, 'open_mine_info_field()');
    },
    set_mine_info_field: function(oThis, e) {
      XoW.logger.ms(_this.classInfo, 'set_mine_info_field()');
      var $layero = oThis.parents('.layui-m-layer').eq(0)
          ,PANEL = '.layim-panel';
      var $elm = oThis.parent().find('textarea');
      // maybe prev is upload frame
      var $prevPnl = $layero.prev().find(PANEL).length === 0 ?
          $layero.prev().prev().find(PANEL).eq(0) : $layero.prev().find(PANEL).eq(0);
      $prevPnl.find('input[name={0}]'.f($elm.attr('name'))).val($elm.val());
      _back(oThis);
      XoW.logger.me(_this.classInfo, 'set_mine_info_field()');
    },
    set_friend_info: function(oThis, e) {
      XoW.logger.ms(_this.classInfo, 'set_friend_info()');
      _layer.msg('暂未实现set roster 功能 (:');
      XoW.logger.me(_this.classInfo, 'set_friend_info()');
    },

    open_chat: function(oThis, e) {
      XoW.logger.ms(_this.classInfo, 'open_chat()');
      var id = oThis.data('id');
      var data = _getFriendById(id);
      if(!data) {
        XoW.e('There is no such user with id {0}, return.'.f(id));
        return;
      }
      _layIM.chat(data);
    },
    // endregion mark mobile

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
    open_remote_chat_log: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'open_remote_chat_log()');
      var thatChat = _getThisChat();
      if (!_cache.base.chatLog) {
        return _layer.msg('未开启聊天记录漫游功能');
      }
      // 陌生人加入群组,不知道会不会影响到好友订阅模块 todo [20190107]
      var friends = _cache.friend;
      if(thatChat.data.temporary) {
        var has;
        $.each(_cache.friend, function(index, group) {
          if(group.groupid === '临时会话'){
            group.push(thatChat.data);
            has = true;
            return false;
          }
        });
        if(!has) {
          var gp = new XoW.FriendGroup('临时会话');
          friends.push(gp);
          gp.list.push(thatChat.data);
        }
      }
      var param = {
        tab: 'chatLog',
        withJid: thatChat.data.jid,
        friend: friends
      }
      _openRemoteSearchBox(param);
      XoW.logger.me(_this.classInfo, 'open_remote_chat_log()');
    },
    // 统一不用form监听的形式
    search_chat_log_remote: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'search_chat_log_remote()');
      $('#flow_chat_log_cont').html('');
      var elem = oThis.parents('.layui-form');
      if(!_verifyForm(elem)) {
        return;
      }
      var field = _getFormFields(elem);

      // 3.搜索
      var param = {
        withJid: field['qry_log_jid'],
        ownerJid: _cache.mine.jid,
        keyword: field['qry_log_keyword'],
        startDate: [field['qry_log_start_date'], 'T00:00:00.000Z'].join(''),
        endDate: [field['qry_log_end_date'],'T23:59:59.999Z'].join(''),
        pageSize: 5
      };
      var getMsg = function (pPageNum, pCallback) {
        param.after = (pPageNum - 1) * param.pageSize - 1;
        layui.each(call.searchChatLog, function(index, item){
          item && item(param, function(res) {
            XoW.logger.ms(_this.classInfo, 'search_chat_log_remote_cb()');
            var pageCount = res.set.count / param.pageSize;
            pCallback && pCallback(res, pageCount);
            XoW.logger.me(_this.classInfo, 'search_chat_log_remote_cb()');
          });
        });
      }
      _layFlow.load({
        elem: '#flow_chat_log_cont' //流加载容器
        ,isAuto: true
        ,mb: 100
        ,end: '<li class="layim-msgbox-tips">暂无更多消息记录</li>'
        ,done: function(pPageNum, next){
          var lis = [];
          getMsg(pPageNum, function(pResult, pPageCount) {
            layui.each(pResult.archive, function(index, pMsg){
              lis.push(_layTpl(_elemRemoteSearchChatLogRes).render(pMsg));
            });
            next(lis.join(''), pPageNum < pPageCount);
          });
        } // eof done
      });
      XoW.logger.me(_this.classInfo, 'search_chat_log_remote()');
    },
    more_filter: function(oThis, e) {
      XoW.logger.ms(_this.classInfo, 'more_filter()');
      var $moreFilter = oThis.find('.layui-icon');
      if(e.currentTarget.dataset.chevron === 'down') {
        $moreFilter.html('&#xe619');
        oThis[0].dataset.chevron = 'up';
        oThis.parent().find('#qry_log_date').removeClass('layui-hide');
      }else {
        $moreFilter.html('&#xe61a');
        oThis[0].dataset.chevron = 'down';
        oThis.parent().find('#qry_log_date').addClass('layui-hide');
      }
    },

    // region mark mobile search user
    close_search_input: function(oThis){
      XoW.logger.ms(_this.classInfo, 'close_search_input()');
      oThis.parent().find('input').val('');
      XoW.logger.ms(_this.classInfo, 'close_search_input()');
    },
    close_search: function(oThis){
      XoW.logger.ms(_this.classInfo, 'close_search()');
      oThis.parent().parent().hide();
      _layIM.events().tab(0);
      XoW.logger.ms(_this.classInfo, 'close_search()');
    },
    open_remote_user_search: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'open_remote_user_search()');
      var tag = oThis.attr('tag');
      var param = {
        tab: 'user',
        keyword: tag,
        friend: _cache.friend // 聊天记录搜索框
      }
      _openRemoteSearchBox(param);
      XoW.logger.me(_this.classInfo, 'open_remote_user_search()');
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
    // endregion mark mobile

    add_friend: function(oThis, e) {
      XoW.logger.ms(_this.classInfo, 'add_friend()');
      var jid = e.currentTarget.dataset.jid;
      var stranger;
      if(_cache.searchResOfStranger) {
        stranger = _cache.searchResOfStranger.find(function (x) {
          return x.jid === jid
        });
      }
      if(!stranger) {
        var thatChat = _getThisChat();
        stranger = thatChat.data;
      }
      stranger.type = 'friend';
      stranger.submit = function (pGroupName, pRemark, pIndex) {
        XoW.logger.ms(_this.classInfo, 'add_friend_submit()');
        var cont = $(window.event.currentTarget).parent().parent();
        this.groupid = pGroupName||'Friend';
        this.remark = pRemark;
        this.username = /*'人工NICK_' + */this.username;
        layui.each(call.subContact, function(index, item){
          item && item(stranger);});
        _layer.close(pIndex);
        XoW.logger.me(_this.classInfo, 'add_friend_submit()');
      };
      _setFriendGroup(stranger);
      XoW.logger.me(_this.classInfo, 'add_friend()');
    },
    approve_user_sub: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'approve_user_sub()');
      var userJid = e.currentTarget.dataset.jid;
      var $grPar = oThis.parent().parent(); // li
      _setFriendGroup({
        type: 'friend'
        ,username: $grPar.find('span').html()
        ,avatar:  $grPar.find('img.layim-msgbox-avatar')[0].src
        ,group: _cache.friend //获取好友列表数据
        ,submit: function(pGroupName, pIndex){
          XoW.logger.ms(_this.classInfo, 'agree_sub_submit()');
          var local = layui.data('layim-mobile')[_cache.mine.id] || {};
          layui.each(call.approveUserSub, function(index, item){
            item && item({
              jid: userJid,
              groupid: pGroupName,
              username: /*'人工NICK_'+ */$grPar.find('p.layim-msgbox-user>a').html()
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
          layui.data('layim-mobile', {
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
      var local = layui.data('layim-mobile')[_cache.mine.id] || {};
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
      layui.data('layim-mobile', {
        key: _cache.mine.id
        ,value: local
      });
      XoW.logger.me(_this.classInfo, 'deny_user_sub()');
    },
    open_url_page: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'open_url_page()');
      var pageUrl = oThis.data('src');
      if(!pageUrl) return;
      window.open(pageUrl);
      XoW.logger.me(_this.classInfo, 'open_url_page()');
    },
  };
  // endregion LayImEx-event handlers

  // region Private Methods
  var _init = function() {
    XoW.logger.ms(_this.classInfo, '_init()');
    _device = layui.device();
    _cache = _layIM.cache();

    _layIM.touch($('body'), '*[layImEx-event]', function (e) {
      var oThis = $(this), method = oThis.attr('layImEx-event');
      events[method] ? events[method].call(this, oThis, e) : '';
    });
    XoW.logger.me(_this.classInfo, '_init()');
  };

  // region mark mobile
  var _bindLoginAnim
  var _bindMainToolList = function() {
    XoW.logger.ms(_this.classInfo, '_bindMainToolList()');
    var $layTitle =  $('.layim-title');
    $layTitle.append(_layTpl(_eleMainToolList).render(_layIM.cache().base.mainToolList));
    XoW.logger.me(_this.classInfo, '_bindMainToolList()');
  };
  var _bindSearchPanel = function() {
    XoW.logger.ms(_this.classInfo, '_bindSearchPanel()');
    var $layContent = $('.layim-content');
    var $layMain = $layContent.find('.layui-layim');
    $layMain.prepend(_eleSearchLi);
    $layMain.append(_eleSearchTab);
    XoW.logger.me(_this.classInfo, '_bindSearchPanel()');
  };
  var _bindLogoutLi = function() {
    XoW.logger.ms(_this.classInfo, '_bindLogoutLi()');
    var layMain =  $('.layui-layim');
    var tabThree = layMain.find('.layim-tab-content').eq(2);
    var listTop = tabThree.find('.layim-list-top');
    var html = '<li layImEx-event="logout"><i class="layui-icon layui-icon-engine"></i><span>退出当前账号</span></li>';
    listTop.append(html);
    XoW.logger.me(_this.classInfo, '_bindLogoutLi()');
  };
  var _bindMineInfoLi = function() {
    XoW.logger.ms(_this.classInfo, '_bindMineInfoLi()');
    var layMain = $(".layui-layim");
    // not supported by zepto other than jquery
    //>var tabThree = layMain.find('.layim-tab-content:eq(2)');
    var tabThree = layMain.find('.layim-tab-content').eq(2);
    var listTop = tabThree.find('.layim-list-top');
    listTop.prepend(_layTpl(_elemMineInfoBriefLi).render(_cache.mine));
    XoW.logger.me(_this.classInfo, '_bindMineInfoLi()');
  };
  var _bindFriendListMenu = function() {
    XoW.logger.ms(_this.classInfo, '_bindFriendListMenu()');
    var longPressFriendList = function(pId, pElem) {
      XoW.logger.ms(_this.classInfo, 'bindFriendListMenu.longPressFriendList()');
      var data = _getDataFromFriendListItem(pId);
      $(pElem).addClass('layui-m-layer-menu-gray');
      _layer.open({
        content: _layTpl(_eleFriendMenu).render(data),
        skin: 'menu',
        shade: 'background-color:rgba(0,0,0, .3);',
        opacity: 0.2,
        time: 5,
        success: function(layero) {
          _layerIndex[LAYER_MENU_FRIEND] = layero.attributes['index'].value;
        },
        end: function() {
          XoW.logger.ms(_this.classInfo, 'longPressFriendList.end()');
          $(pElem).removeClass('layui-m-layer-menu-gray');
          _layerIndex[LAYER_MENU_FRIEND] = -1;
        }
      });
      XoW.logger.me(_this.classInfo, 'bindFriendListMenu.longPressFriendList()');
    };
    var timers = new Map();
    // 屏蔽layim-mobile.js中的touch
    $('.layim-list-friend .layui-layim-list li').each(function(idx ,element) {
      var oThis = $(element);
      var id = oThis.data('id');
      let type = $(oThis).attr('data-type');
      if(oThis.hasClass('layim-null')) {
        return;
      }

      element.addEventListener('touchend', function(e) {
        XoW.logger.ms(_this.classInfo, 'bindFriendListMenu.touchend()');
        if(timers.has(id)) {
          XoW.logger.d('It is not timeout yet, so clear it {0}'.f(id));
          clearTimeout(timers.get(id));
          timers.delete(id);
        } else {
          XoW.logger.d('Prevent default event handler by {0}'.f(id));
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);

      element.addEventListener('touchstart', function(e) {
        XoW.logger.ms(_this.classInfo, 'bindFriendListMenu.touchstart()');
        if (e.targetTouches.length !== 1) {
          return;
        }
        XoW.logger.d('The target is {0}'.f(e.target.tagName));
        if(!timers.has(id)) {
          XoW.logger.d( 'There is no timer of {0}'.f(id));
          timers.set(id, setTimeout(function() {
            XoW.logger.ms(_this.classInfo, 'bindFriendListMenu.touchstart.timeout()');
            if(!timers.has(id)) {
              XoW.logger.w('The timer {0} was killed'.f(id));
              return;
            }
            clearTimeout(timers.get(id));
            timers.delete(id);
            e.preventDefault();
            // console.log("type:" + type);
            if(type == 'history'){
              return;
            }
            longPressFriendList(id, element);
          }, 1*3000));
        }

        e.preventDefault();
      }, false);
    });
    XoW.logger.me(_this.classInfo, '_bindFriendListMenu()');
  };
  var _rebindToolFileButton = function() {
    XoW.logger.ms(_this.classInfo, 'rebindToolFileButton()');
    var thatChat = _getThisChat();
    if(!thatChat) {
      return;
    }
    // the tool box class name is 'layim-tool-image'
    var $fileToolboxs = thatChat.elem.find('.layim-chat-footer').find('.layim-chat-tool .layim-tool-image');
    $.each($fileToolboxs, function() {
      // 屏蔽掉layim.js中的操作，阻止上传文件
      var $fileInput = $(this);
      this.removeAttribute('layim-event');
      var type = this.getAttribute('data-type') || 'images';
      if(type === 'images') {
        //	$fileInput.find('input')[0].setAttribute('accept', '.png,.jpeg,.gif,.jpg')
      }
      // 离线状态屏蔽click操作
      $fileInput.click(function(e) {
        XoW.logger.ms(_this.classInfo, 'fileInput.click()');
        // 小小依赖了下XoW.UserState by cy
        if(thatChat.data.status === XoW.UserState.OFFLINE) {
          var $file = e.target.files[0];
          if($file != null&&typeof($file)!="undefined") {
            let thatchat = _getThisChat();
            layui.each(call.sendOffFile, function (index, item) {
              item && item($file,thatchat);
            });
          }
          e.stopImmediatePropagation();
        }
      });
      // 文件选定
      $fileInput.change(function(e) {
        XoW.logger.ms(_this.classInfo, 'fileInput.change({0})'.f($fileInput[0].children[0].value));
        var $file = e.target.files[0]; // $file.size is base64 size?
        if($file != null&&typeof($file)!="undefined") {
          if ($file.size <= 10240 && XoW.utils.getDomainFromJid(thatChat.data.jid) != ('conference.' + XoW.config.domain)) {
            var reader = new FileReader();
            reader.onload = function (e) {
              XoW.logger.ms('FileReader.onload() ' + $file.filename)
              layui.each(call.sendFile, function (index, item) {
                item && item(thatChat, $file, e.target.result);
              });
            };
            if ($file) {
              reader.readAsDataURL($file);
              $fileInput[0].children[0].value = ''; // reset input value
            }
            delete reader;
          } else {
            let thatchat = _getThisChat();
            layui.each(call.sendOffFile, function (index, item) {
              item && item($file,thatchat);
            });
            e.stopImmediatePropagation();
          }
        }
      });
    });
    XoW.logger.me(_this.classInfo, 'rebindToolFileButton()');
  };

  var _clearCache = function() {
    XoW.logger.ms(_this.classInfo, '_clearCache()');
    _layer.open({
      content: '确认删除所有本地数据?',
      btn: ['确定', '取消'],
      skin: 'footer',
      shadeClose: true,
      yes: function(index){
        XoW.logger.ms(_this.classInfo, '_clearCache.yes()');
        localStorage.clear(); // 内置对象
        _layer.close(index);
      }
    });
    XoW.logger.me(_this.classInfo, '_clearCache()');
  };
  var _openSysInfoPanel = function() {
    XoW.logger.ms(_this.classInfo, '_openSysInfoPanel()');
    var local = layui.data('layim-mobile')[_cache.mine.id] || {};
    local['hasUnreadSysInfo'] = false;
    _layIM.showNew('Friend', false);
    _layIM.showNew('List', false);

    var unitNum = 6;
    local.sysInfo = local.sysInfo || [];
    var pageCount = local.sysInfo.length > unitNum ? local.sysInfo.length / unitNum : 1;
    var renderMsg = function(pPage, pCallback) {
      pPage = pageCount - pPage; // reverse sort
      var curAy = local.sysInfo.slice(pPage * unitNum, (pPage + 1) * unitNum);
      if(!curAy) {
        return _layer.msg('没有更多数据了.');
      }
      pCallback && pCallback(curAy.reverse(), local.sysInfo.length / unitNum);
    };

    _openSysInfoPanel.index = _layIM.panel({
      type: 1 // 1表示页面内，2表示frame
      ,title: '新的朋友'
      ,tpl: _eleSysInfoBox
      ,success: function(layero) {
        XoW.logger.ms(_this.classInfo, '_openSysInfoPanel.success()');
        var input = $(layero).find('input'), find = function(){
          XoW.logger.ms(_this.classInfo, '_openSysInfoPanel.find()');
          setTimeout(function() {
            input.blur(); // 解决焦点移不开问题
          }, 100);

          _openRemoteSearchBox();
          XoW.logger.me(_this.classInfo, '_openSysInfoPanel.find()');
        };

        input.off('touchend', find).on('touchend', find);
        _layFlow.load({
          elem: '#flow_msgbox_cont' //流加载容器
          , isAuto: false
          , end: '<li class="layim-msgbox-tips">暂无更多新消息</li>'
          , done: function(page, next) { //加载下一页
            renderMsg(page, function(data, pages) {
              // console.log("****************************************")
              // console.log(data)
              var html = _layTpl(_eleSysInfoContent).render({
                data: data
                , page: page
              });
              next(html, page < pages);
            });
          }
        });
        XoW.logger.me(_this.classInfo, '_openSysInfoPanel.success()');
      }// eof layer open success
    });



    layui.data('layim-mobile', {
      key: _cache.mine.id
      , value: local
    });
    XoW.logger.me(_this.classInfo, '_openSysInfoPanel()');
  };
  // endregion mark mobile

  var _changeMineStatus = function(pStatus) {
    XoW.logger.ms(_this.classInfo, '_changeMineStatus()');
    // $('.layui-layim-status').find('ul li:last-child')等价于 $('.layui-layim-status').find('li').eq(-1)
    $('.layui-layim-status').html(_layTpl(_eleMineStatus).render({
      mine: { status:pStatus }
    }));// 暂时用隐身代替离线
    XoW.logger.me(_this.classInfo, '_changeMineStatus()');
  };

  var _roomRefresh = function () {
    let getallroom = _client.getRoomMgr().getSaveoutAllRoom();
    for(var i = 0;i<getallroom.length;i++){
      var r = getallroom[i];
      _layIM.removeList(r);
    }
    _client.getRoomMgr().getAllRFServer();
  }

  // region mark mobile
  var _changeMineUsername = function(params) {
    XoW.logger.ms(_this.classInfo, '_changeMineUsername()');
    var layMain = $('.layui-layim');
    var tabThree = layMain.find('.layim-tab-content').eq(2);
    var listTop = tabThree.find('.layim-list-top');
    var $span = listTop.find('li[layimex-event="open_mine_info"] span');
    if ($span.length != 0) {
      $span.html(params);
    }
    XoW.logger.me(_this.classInfo, '_changeMineUsername()');
  };
  var _changeMineSign = function(params) {
    XoW.logger.ms(_this.classInfo, '_changeMineSign()');
    var layMain = $('.layui-layim');
    var tabThree = layMain.find('.layim-tab-content').eq(2);
    var listTop = tabThree.find('.layim-list-top');
    var $span = listTop.find('li[layimex-event="open_mine_info"] p');
    if ($span.length != 0) {
      $span.html(params);
    }
    XoW.logger.me(_this.classInfo, '_changeMineSign()');
  };
  var _changeMineAvatar = function(params) {
    XoW.logger.ms(_this.classInfo, '_changeMineAvatar({0})'.f(params.id));
    var layMain = $('.layui-layim');
    var tabThree = layMain.find('.layim-tab-content').eq(2);
    var listTop = tabThree.find('.layim-list-top');
    var img = listTop.find(".layui-circle,img");
    // 判断是否存在头像这个标签，因为刚登陆进来，可能界面上还没有显示好友列表
    if (img.length != 0) {
      img.attr('src', params);
    }
    // todo 如果正在聊天要改聊天面板头像
    XoW.logger.me(_this.classInfo, "_changeMineAvatar()");
  };
  // endregion mark mobile

  var _changeFriendNick = function(params) {
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
  };
  var _changeFriendAvatar = function(params) {
    XoW.logger.ms(_this.classInfo, '_changeFriendAvatar({0})'.f(params.id));
    var id = params.id;
    var list = $('.layim-friend' + id);
    var img = list.find('img');
    // 判断是否存在头像这个标签，因为刚登陆进来，可能界面上还没有显示好友列表
    if (img.length != 0) { // img.length!=0表示是有img的
      XoW.logger.d(this.classInfo, '更新了好友列表中的头像{0}'.f(id));
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
  var _getThisChat = function(){
    XoW.logger.ms(_this.classInfo, '_getThisChat()');
    return _layIM.thisChat();
  };
  var _getLayImMain = function() {
    var $layimMain = $('.layui-layim');
    return $layimMain;
    // return $layimMain[0]; // dom对象
  };
  //todo wshengt added  用来退出当前panel界面   layim.event = 'back' 触发事件 独立出来
  var _roomBack = function(othis){
    var layero = othis.parents('.layui-m-layer').eq(0)
        ,index = layero.attr('index')
        ,PANEL = '.layim-panel';
    setTimeout(function(){
      layer.close(index);
    }, 300);
    othis.parents(PANEL).eq(0).removeClass('layui-m-anim-left').addClass('layui-m-anim-rout');
    layero.prev().find(PANEL).eq(0).removeClass('layui-m-anim-lout').addClass('layui-m-anim-right');
    layui.each(call.back, function(index, item){
      setTimeout(function(){
        item && item();
      }, 200);
    });
  }

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
  };
  var _getFriendById = function (pId) {
    XoW.logger.ms(_this.classInfo,  '_getFriendById({0})'.f(pId));
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
  var _getDataFromFriendListItem = function(pId) {
    XoW.logger.ms(_this.classInfo,  '_getDataFromFriendListItem({0})'.f(pId));
    var li = _getLayImMain().find('.layim-list-friend .layim-friend{0}'.f(pId));
    // copy from layim.chat()
    var local = layui.data('layim-mobile')[_cache.mine.id] || {};
    var type = li.data('type'), index = li.data('index');
    var list = li.attr('data-list') || li.index(), data = {};
    if (type === 'friend') {
      data = _cache[type][index].list[list];
    } else if (type === 'group') {
      data = _cache[type][list];
    } else if (type === 'history') {
      data = (local.history || {})[index] || {};
    }
    data.name = data.name || data.username || data.groupname;
    if (type !== 'history') {
      data.type = type;
    }
    return data;
  }
  var _blinkSysInfoIcon = function() {
    XoW.logger.ms(_this.classInfo,  '_blinkSysInfoIcon()');
    if(!_getLayImMain()) return;
    _layIM.showNew('Friend', true); // 新的朋友
    _layIM.showNew('List', true);
    if(_cache.base.voice){
      _layIM.voice();
    }
    XoW.logger.me(_this.classInfo,  '_blinkSysInfoIcon()');
  };

  // region mobile mark
  var _renderSearchChatLogFrm = function() {
    XoW.logger.ms(_this.classInfo, '_renderSearchChatLogFrm()');
    // _layForm.render();// 渲染下拉列表等
    //设置开始-结束时间，默认7天
    var curDate = new Date();
    var lastWeek = new Date(curDate.getTime() - 7 * 24 * 60 * 60 * 1000); //一周前
    var startDate = _layDate.render({
      elem: '#qry_log_start_date',
      value: XoW.utils.getFormatDatetime(lastWeek),
      done: function (value, date) {
        if (value !== '') {
          endDate.config.min.year = date.year;
          endDate.config.min.month = date.month - 1;
          endDate.config.min.date = date.date;
        } else {
          endDate.config.min.year = '';
          endDate.config.min.month = '';
          endDate.config.min.date = '';
        }
      }
    });
    var endDate = _layDate.render({
      elem: '#qry_log_end_date',
      value: XoW.utils.getFormatDatetime(curDate),
      done: function (value, date) {
        if (value !== '') {
          startDate.config.max.year = date.year;
          startDate.config.max.month = date.month - 1;
          startDate.config.max.date = date.date;
        } else {
          startDate.config.max.year = '';
          startDate.config.max.month = '';
          startDate.config.max.date = '';
        }
      }
    });
  };
  var _openLocalUserSearch = function() {
    XoW.logger.ms(_this.classInfo, '_openLocalUserSearch()');
    var search = _getLayImMain().find('.layui-layim-search');
    var main = _getLayImMain().find('#layui-layim-search');
    var input = search.find('input'), find = function(){
      XoW.logger.ms(_this.classInfo, 'open_local_user_search.find()');
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
        var local = layui.data('layim-mobile')[_cache.mine.id] || {};
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

        html += '<hr><li class="layim-null-redirect" layImEx-event="open_remote_user_search" tag="'+ val + '">到查找面板查找"' + val +'"</li>';
        main.html(html);
        _layIM.events().tab(3);
      }
      XoW.logger.me(_this.classInfo, 'open_local_user_search.find()');
    };
    input.off('input propertychange', find);
    input[0].value = '';
    search.show();
    input[0].focus();
    input.on('input propertychange', find);
    XoW.logger.me(_this.classInfo, '_openLocalUserSearch()');
  };
  var _openRemoteSearchBox = function(pParam) {
    XoW.logger.ms(_this.classInfo, '_openRemoteSearchBox()');
    pParam = pParam || {tab: 'user'};
    var content = _layTpl(_eleRemoteSearchBox).render(pParam);
    _layer.close(_openRemoteSearchBox.index);
    _openRemoteSearchBox.index = _layIM.panel({
      title: '查找'
      ,tpl: content
      ,success: function(layero, index) {
        XoW.logger.ms(_this.classInfo, 'open_remote_search.cb()');
        layero = $(layero); // zepto v.s jquery, layim.mobile.extend.js v.s layim.extend.js
        _renderSearchChatLogFrm();
        if('user' === pParam.tab) {
          layero.find('#qry_user_keyword').val(pParam.keyword);
          // set timeout 解决无法及时获得焦点问题
          setTimeout(function() {
            layero.find('#qry_user_keyword').focus();
          }, 150);
          let $layimSearchBtn = layero.find('#btn_search_user_remote');
          if($layimSearchBtn) {
            var event = document.createEvent('Events');
            event.initEvent('touchend', true, true);
            $layimSearchBtn[0].dispatchEvent(event);
          }
          var $search = $('.layui-layim').find('.layui-layim-search');
          $search.find('input').val('');
          $search.hide();
          _layIM.events().tab(_layIM.events().tab.index|0);
        } else if('chatLog' === pParam.tab) {
          pParam = pParam || {tab: 'chatLog'};
          let $layimSearchBtn = layero.find('#btn_search_chat_log_remote');
          if($layimSearchBtn) {
            $layimSearchBtn.click();
          }
        }
        XoW.logger.me(_this.classInfo, 'open_remote_search.cb()');
      }
    });
    XoW.logger.me(_this.classInfo, '_openRemoteSearchBox()');
  };
  var _openMainToolMore = function() {
    XoW.logger.ms(_this.classInfo, '_openMainToolMore()');
    _layer.close(_layerIndex[LAYER_MENU_MORE_TOOL]);
    _openMainToolMore.index = _layer.open({
      content: _eleMainToolMoreMenu,
      skin: 'menu_ex',
      shade: 'background-color:rgba(0,0,0, .3);',
      opacity: 0.2,
      //time: 10,
      success: function(layero) {
        _layerIndex[LAYER_MENU_MORE_TOOL] = layero.attributes['index'].value;
      }
    })
    XoW.logger.me(_this.classInfo, '_openMainToolMore()');
  };
  var _setFriendGroup = function(data) {
    XoW.logger.ms(_this.classInfo, '_setFriendGroup()');
    _popAdd(data, 'setGroup')
    XoW.logger.me(_this.classInfo, '_setFriendGroup()');
  };

  //打开添加好友、群组面板、好友分组面板
  var _popAdd = function(data, type){
    XoW.logger.ms(_this.classInfo, '_popAdd()');
    data = data || {};
    _layer.close(_popAdd.index);
    return _popAdd.index = _layer.open({
      type: 1
      ,title: [{
        friend: '添加好友'
        ,group: '加入群组'
      }[data.type] || '',
        'background-color: #FF4351; color:#fff;']
      ,shade: true
      ,shadeClose: true
      ,btn: type ? ['确认', '取消'] : ['发送申请', '关闭']
      ,content: _layTpl(_elemAddTpl).render({
        data: {
          name: data.username || data.groupname
          ,avatar: data.avatar
          ,group: data.group || parent.layui['layim-mobile'].cache().friend || []
          ,type: data.type
        }
        ,type: type
      })
      ,yes: function(index){
        XoW.logger.ms(_this.classInfo, '_popAdd.yes()');
        var layero = _layer.getLayer(index);
        var groupElem = $(layero).find('#LAY_layimGroup')
            ,remarkElem = $(layero).find('#LAY_layimRemark');
        if(type){
          data.submit && data.submit(groupElem.val(), index);
        } else {
          data.submit && data.submit(groupElem.val(), remarkElem.val(), index);
        }
        _layer.close(index);
        XoW.logger.me(_this.classInfo, '_popAdd.yes()');
      }
    });
    XoW.logger.me(_this.classInfo, '_popAdd()');
  };


  var _getRoomConfigHtml = function (roomjid) {
    _getRoomConfig(roomjid, function (params) {
      var fields = params.fields;
      // var html = _roomConfigHtml(fields,roomjid);
      let html = '<ul style="width: 100%;list-style-type: none">';
      if (1 == fields['muc#roomconfig_changesubject'].value) {
        html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 45%;display: inline-block">&nbsp;允许任何人修改</span><span style="text-align: right;width: 53%;display: inline-block"><input type="checkbox" name="changeSubject" lay-skin="switch" checked lay-filter="roomSetingSwitch" data-jid = "'+roomjid+'"></span></li>'
      }else{
        html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 45%;display: inline-block">&nbsp;允许任何人修改</span><span style="text-align: right;width: 53%;display: inline-block"><input type="checkbox" name="changeSubject" lay-skin="switch" lay-filter="roomSetingSwitch" data-jid = "'+roomjid+'"></span></li>'
      }

      if (1 == fields['muc#roomconfig_publicroom'].value) {
        html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 45%;display: inline-block">&nbsp;公共房间</span><span style="text-align: right;width: 53%;display: inline-block"><input type="checkbox" name="changePublic" lay-skin="switch" checked lay-filter="roomSetingSwitch" data-jid = "'+roomjid+'"></span></li>'
      }else{
        html +=   '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 45%;display: inline-block">&nbsp;公共房间</span><span style="text-align: right;width: 53%;display: inline-block"><input type="checkbox" name="changePublic" lay-skin="switch" lay-filter="roomSetingSwitch" data-jid = "'+roomjid+'"></span></li>'
      }

      if (1 == fields['muc#roomconfig_membersonly'].value) {
        html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 45%;display: inline-block">&nbsp;仅对成员开放</span><span style="text-align: right;width: 53%;display: inline-block"><input type="checkbox" name="changeMember" lay-skin="switch" checked lay-filter="roomSetingSwitch" data-jid = "'+roomjid+'"></span></li>'
      }else{
        html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 45%;display: inline-block">&nbsp;仅对成员开放</span><span style="text-align: right;width: 53%;display: inline-block"><input type="checkbox" name="changeMember" lay-skin="switch" lay-filter="roomSetingSwitch" data-jid = "'+roomjid+'"></span></li>'
      }

      if (1 == fields['muc#roomconfig_allowinvites'].value) {
        html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 45%;display: inline-block">&nbsp;允许邀请</span><span style="text-align: right;width: 53%;display: inline-block"><input type="checkbox" name="chengeAllowInvite" lay-skin="switch" checked lay-filter="roomSetingSwitch" data-jid = "'+roomjid+'"></span></li>'
      }else{
        html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 45%;display: inline-block">&nbsp;允许邀请</span><span style="text-align: right;width: 53%;display: inline-block"><input type="checkbox" name="chengeAllowInvite" lay-skin="switch" lay-filter="roomSetingSwitch" data-jid = "'+roomjid+'"></span></li>'
      }

      if (1 == fields['muc#roomconfig_passwordprotectedroom'].value) {
        html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 45%;display: inline-block">&nbsp;开启密码</span><span style="text-align: right;width: 53%;display: inline-block"><input type="checkbox" name="switchUppassword" lay-skin="switch" checked lay-filter="roomSetingSwitch" data-jid = "'+roomjid+'"></span></li>'
      }else{
        html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 45%;display: inline-block">&nbsp;开启密码</span><span style="text-align: right;width: 53%;display: inline-block"><input type="checkbox" name="switchUppassword" lay-skin="switch" lay-filter="roomSetingSwitch" data-jid = "'+roomjid+'"></span></li>'
      }
      html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 45%;display: inline-block">&nbsp;最大人数</span><span style="text-align: right;width: 53%;display: inline-block" >'+fields['muc#roomconfig_maxusers'].value+'</span></li>'
      html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 96%;display: inline-block" layImEx-event = "denyMemberSetingSr" data-jid = "'+roomjid+'" id="denyRoomMem">&nbsp;成员管理</span></li>'
      html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 96%;display: inline-block" layImEx-event = "dealWithRoomSpeak" data-jid = "'+roomjid+'" id="ealWithRoomSpeak">&nbsp;发言权限管理</span></li>'
      html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 96%;display: inline-block" layImEx-event = "roomAdimSetingSr" data-jid = "'+roomjid+'" id="changeRoomPower">&nbsp;转让房间</span></li>'
      html+='</ul>';
      //  $('#getRoomConfigSeting').html(html);
      document.getElementById('getRoomConfigSeting').innerHTML = html;
      _layForm.render();
      // return true;
    }.bind(this), function (errorStanza){
      //$('#getRoomConfigSeting').html(" ");
      document.getElementById('getRoomConfigSeting').innerHTML = " ";
      // return true;
    }.bind(this));
  }
  var _getMeetRoomConfigHtml = function (roomjid) {
    _getRoomConfig(roomjid, function (params) {
      var fields = params.fields;
      // var html = _roomConfigHtml(fields,roomjid);
      let html = '<ul style="width: 100%;list-style-type: none">';
      if (1 == fields['muc#roomconfig_changesubject'].value) {
        html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 45%;display: inline-block">&nbsp;允许任何人修改</span><span style="text-align: right;width: 53%;display: inline-block"><input type="checkbox" name="changeSubject" lay-skin="switch" checked lay-filter="roomSetingSwitch" data-jid = "'+roomjid+'"></span></li>'
      }else{
        html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 45%;display: inline-block">&nbsp;允许任何人修改</span><span style="text-align: right;width: 53%;display: inline-block"><input type="checkbox" name="changeSubject" lay-skin="switch" lay-filter="roomSetingSwitch" data-jid = "'+roomjid+'"></span></li>'
      }

      // if (1 == fields['muc#roomconfig_publicroom'].value) {
      //   html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 45%;display: inline-block">&nbsp;公共房间</span><span style="text-align: right;width: 53%;display: inline-block"><input type="checkbox" name="changePublic" lay-skin="switch" checked lay-filter="roomSetingSwitch" data-jid = "'+roomjid+'"></span></li>'
      // }else{
      //   html +=   '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 45%;display: inline-block">&nbsp;公共房间</span><span style="text-align: right;width: 53%;display: inline-block"><input type="checkbox" name="changePublic" lay-skin="switch" lay-filter="roomSetingSwitch" data-jid = "'+roomjid+'"></span></li>'
      // }

      // if (1 == fields['muc#roomconfig_membersonly'].value) {
      //   html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 45%;display: inline-block">&nbsp;仅对成员开放</span><span style="text-align: right;width: 53%;display: inline-block"><input type="checkbox" name="changeMember" lay-skin="switch" checked lay-filter="roomSetingSwitch" data-jid = "'+roomjid+'"></span></li>'
      // }else{
      //   html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 45%;display: inline-block">&nbsp;仅对成员开放</span><span style="text-align: right;width: 53%;display: inline-block"><input type="checkbox" name="changeMember" lay-skin="switch" lay-filter="roomSetingSwitch" data-jid = "'+roomjid+'"></span></li>'
      // }

      // if (1 == fields['muc#roomconfig_allowinvites'].value) {
      //   html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 45%;display: inline-block">&nbsp;允许邀请</span><span style="text-align: right;width: 53%;display: inline-block"><input type="checkbox" name="chengeAllowInvite" lay-skin="switch" checked lay-filter="roomSetingSwitch" data-jid = "'+roomjid+'"></span></li>'
      // }else{
      //   html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 45%;display: inline-block">&nbsp;允许邀请</span><span style="text-align: right;width: 53%;display: inline-block"><input type="checkbox" name="chengeAllowInvite" lay-skin="switch" lay-filter="roomSetingSwitch" data-jid = "'+roomjid+'"></span></li>'
      // }

      // if (1 == fields['muc#roomconfig_passwordprotectedroom'].value) {
      //   html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 45%;display: inline-block">&nbsp;开启密码</span><span style="text-align: right;width: 53%;display: inline-block"><input type="checkbox" name="switchUppassword" lay-skin="switch" checked lay-filter="roomSetingSwitch" data-jid = "'+roomjid+'"></span></li>'
      // }else{
      //   html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 45%;display: inline-block">&nbsp;开启密码</span><span style="text-align: right;width: 53%;display: inline-block"><input type="checkbox" name="switchUppassword" lay-skin="switch" lay-filter="roomSetingSwitch" data-jid = "'+roomjid+'"></span></li>'
      // }
      html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 45%;display: inline-block">&nbsp;最大人数</span><span style="text-align: right;width: 53%;display: inline-block" >'+fields['muc#roomconfig_maxusers'].value+'</span></li>'
      html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 96%;display: inline-block" layImEx-event = "denyMemberSetingSr" data-jid = "'+roomjid+'" id="denyRoomMem">&nbsp;成员管理</span></li>'
      // html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 96%;display: inline-block" layImEx-event = "dealWithRoomSpeak" data-jid = "'+roomjid+'" id="ealWithRoomSpeak">&nbsp;发言权限管理</span></li>'
      html +=  '<li style="height: 50px;line-height: 50px;width: 96%;margin-left:2%;border-bottom: 0.5px #d4d4d4 solid"><span style="align: left;width: 96%;display: inline-block" layImEx-event = "roomMeetAdimSetingSr" data-jid = "'+roomjid+'" id="changeMeetRoomPower">&nbsp;转让房间</span></li>'
      html+='</ul>';
      //  $('#getRoomConfigSeting').html(html);
      document.getElementById('getRoomConfigSeting').innerHTML = html;
      _layForm.render();
      // return true;
    }.bind(this), function (errorStanza){
      //$('#getRoomConfigSeting').html(" ");
      document.getElementById('getRoomConfigSeting').innerHTML = " ";
      // return true;
    }.bind(this));
  }
  var _getDestroyHtml  = function (roomjid) {
    _getRoomConfig(roomjid, function (params) {
      let html = '<button type="button" class="layui-btn layui-btn-fluid layui-btn-danger" style="text-align: center;padding: 0;margin: 0" layimex-event="destroyThisRoom" roomjid="'+roomjid+'" >解散房间</button>'
      //$('#getDestroyR').html(html);
      document.getElementById('getDestroyR').innerHTML = html;
    }.bind(this), function (errorStanza){
      // $('#getDestroyR').html(" ");
      document.getElementById('getDestroyR').innerHTML = ' ';
    }.bind(this));
  }
  var  _getRoomExit = function (roomjid,index) {
    let html =    '<button type="button" class="layui-btn layui-btn-fluid layui-btn-danger" style="text-align: center;padding: 0;margin: 0" layimex-event="exitThisRoom" roomjid="'+roomjid+'" roomuindex = "'+index+'" >退出房间</button>'
    document.getElementById('todoExitRoom').innerHTML = html;
  }


  var _getRoomConfig = function (roomJid, successCb, errorCb) {
    XoW.logger.ms(_this.classInfo + "getRoomConfig");
    var iq = $iq({
      id : XoW.utils.getUniqueId('roomConfig'),
      to : roomJid,
      type : 'get',
    }).c('query', {
      xmlns : Strophe.NS.MUC_OWNER,
    });
    XoW.logger.me(_this.classInfo + "getRoomConfig");
    return _client.getConnMgr().sendIQ(iq, function(stanza) {
      var $stanza = $(stanza);
      var fields = [];
      $('field', $stanza).each(function(index, item) {
        var $item = $(item);
        if($item.attr('var')) {
          switch($item.attr('var')) {
            case 'muc#roomconfig_roomname' :
            case 'muc#roomconfig_roomdesc' :
            case 'muc#roomconfig_changesubject' :
            case 'muc#roomconfig_publicroom' :
            case 'muc#roomconfig_persistentroom' :
            case 'muc#roomconfig_moderatedroom' :
            case 'muc#roomconfig_membersonly' :
            case 'muc#roomconfig_allowinvites' :
            case 'muc#roomconfig_passwordprotectedroom' :
            case 'muc#roomconfig_roomsecret' :
            case 'muc#roomconfig_enablelogging' :
            case 'x-muc#roomconfig_reservednick' :
            case 'x-muc#roomconfig_canchangenick' :
            case 'x-muc#roomconfig_registration' :
              fields[$item.attr('var')] = {
                'var' : $item.attr('var'),
                type : $item.attr('type'),
                label : $item.attr('label'),
                value : $('value', $item).text(),
              };
              break;
            case 'muc#roomconfig_maxusers' :
            case 'muc#roomconfig_whois' :
              options = [];
              $item.find('option').each(function(index2, option) {
                var $option = $(option);
                options.push({
                  label :  $option.attr('label'),
                  value : $('value', $option).text(),
                });
              });
              fields[$item.attr('var')] = {
                'var' : $item.attr('var'),
                type : $item.attr('type'),
                label : $item.attr('label'),
                value : $item.children('value').text(),
                options : options,
              };
              break;
            case 'muc#roomconfig_presencebroadcast' :
              options = [];
              $item.find('option').each(function(index2, option) {
                var $option = $(option);
                options.push({
                  label :  $option.attr('label'),
                  value : $('value', $option).text(),
                });
              });
              values = [];
              $item.children('value').each(function(index2, value) {
                values.push($(value).text());
              });
              fields[$item.attr('var')] = {
                'var' : $item.attr('var'),
                type : $item.attr('type'),
                label : $item.attr('label'),
                value : values,
                options : options,
              };
              break;
            case 'muc#roomconfig_roomadmins' :
            case 'muc#roomconfig_roomowners' :
              values = [];
              $item.children('value').each(function(index2, value) {
                values.push($(value).text());
              });
              fields[$item.attr('var')] = {
                'var' : $item.attr('var'),
                type : $item.attr('type'),
                label : $item.attr('label'),
                value : values,
              };
              break;
          }
        }
      });
      if(successCb) {
        var params = {
          stanza : stanza,
          fields : fields
        };
        successCb(params);
      }
    }, errorCb);
    XoW.logger.me(_this.classInfo + "getRoomConfig");
  }

  _layForm.on('switch(roomSetingSwitch)', function(obj){
    let rswitch = $(obj.elem).attr('name');
    let roomjid = $(obj.elem).attr('data-jid');
    if(obj.elem.checked == true){//是主键
      if('changeSubject' == rswitch){
        _saveChangeSubject(roomjid);
      }else if('changePublic' == rswitch){
        _saveChangePublic(roomjid)
      }else if('changeMember' == rswitch){
        _saveChangeMember(roomjid)
      }else if('chengeAllowInvite' == rswitch){
        _saveChengeAllowInvite(roomjid)
      }else if('switchUppassword' == rswitch){
        _upPasswordSr(roomjid)
      }
    }else{
      if('changeSubject' == rswitch){
        _delChangeSubject(roomjid)
      }else if('changePublic' == rswitch){
        _delChangePublic(roomjid)
      }else if('changeMember' == rswitch){
        _delChangeMember(roomjid)
      }else if('chengeAllowInvite' == rswitch){
        _delChengeAllowInvite(roomjid)
      }else if('switchUppassword' == rswitch){
        _downPasswordSr(roomjid)
      }
    }

  });


  var _saveChangeSubject = function (roomJid) {
    _getRoomConfig(roomJid, function (params) {
      var fields = params.fields;
      fields['muc#roomconfig_changesubject'].value = 1;
      _client.getRoomMgr().saveRoomConfig(roomJid, fields, function () {
        _layer.open({
          content: '操作成功'
          ,skin: 'msg'
          ,time: 3
        });
      }, function () {
        _layer.open({
          content: '操作失败'
          ,skin: 'msg'
          ,time: 3
        });
      });
    }.bind(this));
  }
  var _delChangeSubject = function (roomJid) {
    _getRoomConfig(roomJid, function (params) {
      var fields = params.fields;
      fields['muc#roomconfig_changesubject'].value = 0;
      _client.getRoomMgr().saveRoomConfig(roomJid, fields, function () {
        _layer.open({
          content: '操作成功'
          ,skin: 'msg'
          ,time: 2
        });
      }, function () {
        _layer.open({
          content: '操作失败'
          ,skin: 'msg'
          ,time: 2
        });
      });
    }.bind(this));
  }

  var _saveChangePublic = function (roomJid) {
    _getRoomConfig(roomJid, function (params) {
      var fields = params.fields;
      fields['muc#roomconfig_publicroom'].value = 1;
      _client.getRoomMgr().saveRoomConfig(roomJid, fields, function () {
        _layer.open({
          content: '操作成功'
          ,skin: 'msg'
          ,time: 2
        });
      }, function () {
        _layer.open({
          content: '操作失败'
          ,skin: 'msg'
          ,time: 2
        });
      });
    }.bind(this));
  }
  var _delChangePublic = function (roomJid) {
    _getRoomConfig(roomJid, function (params) {
      var fields = params.fields;
      fields['muc#roomconfig_publicroom'].value = 0;
      _client.getRoomMgr().saveRoomConfig(roomJid, fields, function () {
        _layer.open({
          content: '操作成功'
          ,skin: 'msg'
          ,time: 2
        });
      }, function () {
        _layer.open({
          content: '操作失败'
          ,skin: 'msg'
          ,time: 2
        });
      });
    }.bind(this));
  }


  var _saveChangeMember = function (roomJid) {
    _getRoomConfig(roomJid, function (params) {
      var fields = params.fields;
      fields['muc#roomconfig_membersonly'].value = 1;
      _client.getRoomMgr().saveRoomConfig(roomJid, fields, function () {
        _layer.open({
          content: '操作成功'
          ,skin: 'msg'
          ,time: 2
        });
      }, function () {
        _layer.open({
          content: '操作失败'
          ,skin: 'msg'
          ,time: 2
        });
      });
    }.bind(this));
  }
  var _delChangeMember = function (roomJid) {
    _getRoomConfig(roomJid, function (params) {
      var fields = params.fields;
      fields['muc#roomconfig_membersonly'].value = 0;
      _client.getRoomMgr().saveRoomConfig(roomJid, fields, function () {
        _layer.open({
          content: '操作成功'
          ,skin: 'msg'
          ,time: 2
        });
      }, function () {
        _layer.open({
          content: '操作失败'
          ,skin: 'msg'
          ,time: 2
        });
      });
    }.bind(this));
  }

  var _saveChengeAllowInvite = function (roomJid) {
    _getRoomConfig(roomJid, function (params) {
      var fields = params.fields;
      fields['muc#roomconfig_allowinvites'].value = 1;
      _client.getRoomMgr().saveRoomConfig(roomJid, fields, function () {
        _layer.open({
          content: '操作成功'
          ,skin: 'msg'
          ,time: 2
        });
      }, function () {
        _layer.open({
          content: '操作失败'
          ,skin: 'msg'
          ,time: 2
        });
      });
    }.bind(this));
  }
  var _delChengeAllowInvite = function (roomJid) {
    _getRoomConfig(roomJid, function (params) {
      var fields = params.fields;
      fields['muc#roomconfig_allowinvites'].value = 0;
      _client.getRoomMgr().saveRoomConfig(roomJid, fields, function () {
        _layer.open({
          content: '操作成功'
          ,skin: 'msg'
          ,time: 2
        });
      }, function () {
        _layer.open({
          content: '操作失败'
          ,skin: 'msg'
          ,time: 2
        });
      });
    }.bind(this));
  }

  var _upPasswordSr = function (roomJid) {
    _getRoomConfig(roomJid, function (params) {
      let index = _layer.open({
        title: [
          '密码设置',
          'background-color:#8DCE16; color:#fff;'
        ]
        ,anim: 'up'
        ,content: '<input type="text" name="roomTitle"   lay-verify="required" placeholder="请输入密码" autocomplete="off" class="layui-input" id="getRoomPassword">'
        ,btn: ['确认', '取消']
        ,yes:function (index, layero) {
          var fields = params.fields;
          fields['muc#roomconfig_passwordprotectedroom'].value = 1;
          fields['muc#roomconfig_roomsecret'].value = $.trim($('#getRoomPassword').val());
          _client.getRoomMgr().saveRoomConfig(roomJid, fields, function () {
            _layer.open({
              content: '操作成功'
              ,skin: 'msg'
              ,time: 2
            });
          }, function () {
            _layer.open({
              content: '操作失败'
              ,skin: 'msg'
              ,time: 2
            });
          });
          _layer.close(index)
        },
        btn2:function (index, layero) {
          _layer.close(index)
        }
      });
    }.bind(this));
  }

  var  _changeAdminToOtherSr = function (roomjid,oneJId,oneNick,oThis) {
    _getRoomConfig(roomjid, function (params) {
      var fields = params.fields;
      _layer.open({
        content: '确定将房间权限转给该用户，你将失去权限？'
        ,btn: ['给了', '不要']
        ,yes: function(index){
          fields['muc#roomconfig_roomowners'].value = oneJId.split(",");
          _client.getRoomMgr().saveRoomConfig(roomjid, fields, function () {
            _layer.open({
              content: '操作成功'
              ,skin: 'msg'
              ,time: 2
            });
            _roomBack(oThis)
            _getRoomConfigHtml(roomjid);
            _getDestroyHtml(roomjid)
          }, function () {
            _layer.open({
              content: '操作失败'
              ,skin: 'msg'
              ,time: 2
            });
          });
        },
        btn1:function (index) {
          _layer.close(index);
        }
      });
    }.bind(this));
  }
  var _changemeetAdminToOtherSr= function (roomjid,oneJId,oThis) {
    _getRoomConfig(roomjid, function (params) {
      var fields = params.fields;
      _layer.open({
        content: '确定将房间权限转给该用户，你将失去权限？'
        ,btn: ['给了', '不要']
        ,yes: function(index){
          fields['muc#roomconfig_roomowners'].value = oneJId.split(",");
          _client.getRoomMgr().saveRoomConfig(roomjid, fields, function () {
            _layer.open({
              content: '操作成功'
              ,skin: 'msg'
              ,time: 2
            });
            _roomBack(oThis)
            _getMeetRoomConfigHtml(roomjid);
            _getDestroyHtml(roomjid)
          }, function () {
            _layer.open({
              content: '操作失败'
              ,skin: 'msg'
              ,time: 2
            });
          });
        },
        btn1:function (index) {
          _layer.close(index);
        }
      });
    }.bind(this));
  }

  var _rodoDenyMember = function (roomjid,oneNIck,e) {
    _layer.open({
      content: '你确定将此人移除该房间吗'
      ,btn: ['没错', '不要']
      ,yes: function(index){
        _removePerson(roomjid, oneNIck, function () {
          _layer.open({
            content: '操作成功'
            ,skin: 'msg'
            ,time: 2
          });
          $(e.target).remove();
        }, function () {
          _layer.open({
            content: '操作失败'
            ,skin: 'msg'
            ,time: 2
          });
        });
      },
      btn1:function (index) {
        _layer.close(index);
      }
    });
  }

  var _removePerson = function (roomjid,nick,successCb,errorCb) {
    let iq = $iq({
      from:_client.getCurrentUser().jid,
      id:XoW.utils.getUniqueId("remove"),
      to:roomjid,
      type:'set'
    }).c('query',{xmlns:'http://jabber.org/protocol/muc#admin'}).c('item',{nick:nick,role:'none'})
        .c('reason',"you go");
    _client.getConnMgr().sendIQ(iq,successCb,errorCb)
  }

  //_todoInvitingToOtherSr
  var  _todoInvitingToOtherSr = function (roomjid,oneJId) {
    _layer.open({
      content: '你要邀请该用户加入房间吗'
      ,btn: ['是的', '不要']
      ,yes: function(index){
        _todoInvition(roomjid, oneJId)
        _layer.close(index);
      },
      btn1:function (index) {
        _layer.close(index);
      }
    });
  }

  var   _downPasswordSr = function(roomjid){
    _getRoomConfig(roomjid, function (params) {
      var fields = params.fields;
      fields['muc#roomconfig_passwordprotectedroom'].value = 0;
      fields['muc#roomconfig_roomsecret'].value = "";
      _client.getRoomMgr().saveRoomConfig(roomjid, fields, function () {
        _layer.open({
          content: '操作成功'
          ,skin: 'msg'
          ,time: 2
        });
      }, function () {
        _layer.open({
          content: '操作失败'
          ,skin: 'msg'
          ,time: 2
        });
      });
    }.bind(this));
  }

  var  _todoSaveRoomDesc =  function (text,roomjid,userjid) {
    _getRoomConfig(roomjid, function (params) {
      var fields = params.fields;
      fields['muc#roomconfig_roomdesc'].value = text;
      _client.getRoomMgr().saveRoomConfig(roomjid, fields, function () {
        _layer.open({
          content: '操作成功'
          ,skin: 'msg'
          ,time: 2
        });
        $('#layerRoomDesc').text(text)
      }, function () {
        _layer.open({
          content: '操作失败'
          ,skin: 'msg'
          ,time: 2
        });
      });
    },function (error) {
      _layer.open({
        content: '没有此权限'
        ,skin: 'msg'
        ,time: 2
      });
    });
  }

  var _getEleRemoteSearchRoomResnofind = function (text) {
    var _eleRemoteSearchRoomResnofind = "";
    if(text == "") {
      _eleRemoteSearchRoomResnofind = [    //wshengt
        , '  <div class="layui-row layui-col-space15">'
        , '    <span class="layim-null">搜索信息不能为空</span>'
        , '  </div>'
      ].join('');
    }
    else{
      _eleRemoteSearchRoomResnofind = [    //wshengt
        , '  <div class="layui-row layui-col-space15">'
        , '    <span class="layim-null">搜索结果为空</span>'
        , '  </div>'
      ].join('');
    }
    return _eleRemoteSearchRoomResnofind;
  }
  var _destroying = function (roomjid,handle_cb,error_cb) {
    var user = _client.getCurrentUser().jid;
    var iq = $iq({
      id:XoW.utils.getUniqueId("destroy"),
      from:user,
      to:roomjid,
      type:'set'
    }).c('query',{xmlns:'http://jabber.org/protocol/muc#owner'}).c('destroy',{jid:roomjid});
    _client.getConnMgr().sendIQ(iq,handle_cb,error_cb);
  }
  var _giveSpeak = function (roomjid,nick,handle_cb,error_cb) {
    var user = _client.getCurrentUser().jid;
    var iq = $iq({
      id:XoW.utils.getUniqueId("_giveSpeak"),
      from:user,
      to:roomjid,
      type:'set'
    }).c('query',{xmlns:'http://jabber.org/protocol/muc#admin'}).c('item',{nick:nick,role:'participant'});
    _client.getConnMgr().sendIQ(iq,handle_cb,error_cb);
  }

  var _exitRoom = function (roomjid) {
    let user = _client.getCurrentUser().jid;
    let pe = $pres({
      from:user,
      to:roomjid,
      type:'unavailable'
    })
    _client.getConnMgr().send(pe);
  }
  var _banSpeak = function (roomjid,nick,handle_cb,error_cb) {
    var user = _client.getCurrentUser().jid;
    var iq = $iq({
      id:XoW.utils.getUniqueId("_giveSpeak"),
      from:user,
      to:roomjid,
      type:'set'
    }).c('query',{xmlns:'http://jabber.org/protocol/muc#admin'}).c('item',{nick:nick,role:'visitor'});
    _client.getConnMgr().sendIQ(iq,handle_cb,error_cb);
  }
  var _getAllroomINFPO = function(handle_cb,error_cb){
    var user = _client.getCurrentUser().jid;
    var iq = $iq({
      id:XoW.utils.getUniqueId("rInfo"),
      type:"get",
      to:"conference."+ XoW.config.domain
    }).c("query",{xmlns :'http://jabber.org/protocol/disco#items'});
    _client.getConnMgr().sendIQ(iq,handle_cb,error_cb);
  }
  var _giveMemberToP = function (roomjid,onejid,handle_cb,error_cb) {
    var user = _client.getCurrentUser().jid;
    var iq = $iq({
      id:XoW.utils.getUniqueId("giveMember"),
      from:user,
      to:roomjid,
      type:'set'
    }).c('query',{xmlns:'http://jabber.org/protocol/muc#admin'}).c('item',{affiliation:'member',jid:onejid});
    _client.getConnMgr().sendIQ(iq,handle_cb,error_cb);
  }

  var _todoInvition = function (roomjid,onejid) {
    var user = _client.getCurrentUser().jid;
    var msg = $msg({
      id:XoW.utils.getUniqueId("Invition"),
      from:user,
      to:roomjid,
    }).c('x',{xmlns:'http://jabber.org/protocol/muc#user'}).c('invite',{to:onejid}).c('reason',"I want to invit you into my room");
    _client.getConnMgr().send(msg);
  }


  // region form utils
  var _verifyForm = function(pFrm, pSettings) {
    XoW.logger.ms(_this.classInfo, '_verifyForm()');
    if(pSettings) {
      $.extend(true, VERIFY_REGEX, pSettings);
    }
    var verify = VERIFY_REGEX, stop = null
        ,DANGER = 'layui-form-danger'
        ,verifyElem = pFrm.find('*[lay-verify]'); //获取需要校验的元素

    //1. 开始校验, reference to form.js
    layui.each(verifyElem, function(_, item){
      var othis = $(this)
          ,vers = othis.attr('lay-verify').split('|')
          ,verType = othis.attr('lay-verType') //提示方式
          ,value = othis.val();

      othis.removeClass(DANGER);
      layui.each(vers, function(_, thisVer){
        var isTrue //是否命中校验
            ,errorText = '' //错误提示文本
            ,isFn = typeof verify[thisVer] === 'function';

        //匹配验证规则
        if(verify[thisVer]){
          var isTrue = isFn ? errorText = verify[thisVer](value, item) : !verify[thisVer][0].test(value);
          errorText = errorText || verify[thisVer][1];

          //如果是必填项或者非空命中校验，则阻止提交，弹出提示
          if(isTrue){
            //提示层风格
            if(verType === 'tips'){
              _layer.tips(errorText, function(){
                if(typeof othis.attr('lay-ignore') !== 'string'){
                  if(item.tagName.toLowerCase() === 'select' || /^checkbox|radio$/.test(item.type)){
                    return othis.next();
                  }
                }
                return othis;
              }(), {tips: 1});
            } else if(verType === 'alert') {
              _layer.alert(errorText, {title: '提示', shadeClose: true});
            } else {
              _layer.msg(errorText, {icon: 5, shift: 6});
            }
            if(!_device.android && !_device.ios) item.focus(); //非移动设备自动定位焦点
            othis.addClass(DANGER);
            return stop = true;
          }
        }
      });
      if(stop) return stop;
    });
    if(stop) {
      return false
    } else{
      return true;
    }
  };
  var _getFormFields = function(pFrm) {
    XoW.logger.ms(_this.classInfo, '_getFormFields()');
    // 2. 获取表单内容 reference to form.js
    var field = {}, fieldElem = pFrm.find('input,select,textarea'); //获取所有表单域
    var nameIndex = {}; //数组 name 索引
    layui.each(fieldElem, function(_, item){
      item.name = (item.name || '').replace(/^\s*|\s*&/, '');
      if(!item.name) return;
      //用于支持数组 name
      if(/^.*\[\]$/.test(item.name)){
        var key = item.name.match(/^(.*)\[\]$/g)[0];
        nameIndex[key] = nameIndex[key] | 0;
        item.name = item.name.replace(/^(.*)\[\]$/, '$1['+ (nameIndex[key]++) +']');
      }
      if(/^checkbox|radio$/.test(item.type) && !item.checked) return;
      field[item.name] = item.value;
    });
    return field;
    // _layer.msg(JSON.stringify(field));
  };
  var VERIFY_REGEX = {
    required: [
      /[\S]+/
      ,'必填项不能为空'
    ]
    ,phone: [
      /^1\d{10}$/
      ,'请输入正确的手机号'
    ]
    ,email: [
      /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/
      ,'邮箱格式不正确'
    ]
    ,url: [
      /(^#)|(^http(s*):\/\/[^\s]+\.[^\s]+)/
      ,'链接格式不正确'
    ]
    ,number: function(value){
      if(!value || isNaN(value)) return '只能填写数字'
    }
    ,date: [
      /^(\d{4})[-\/](\d{1}|0\d{1}|1[0-2])([-\/](\d{1}|0\d{1}|[1-2][0-9]|3[0-1]))*$/
      ,'日期格式不正确'
    ]
    ,identity: [
      /(^\d{15}$)|(^\d{17}(x|X|\d)$)/
      ,'请输入正确的身份证号'
    ]
  };

  var _roomSeting = function (roomjid) {
    let data = [];
    _client.getRoomMgr().getRoomByJidFromServer(roomjid, function (params) {
      let room = params.room;
      let roomInMuc = _client.getRoomMgr().getXmppRoom(roomjid);
      let currentUserInMucRoom = roomInMuc.roster[roomInMuc.nick];
      if (null == room) {
        _layer.msg('房间信息不存在！');
        return;
      } else if (null == roomInMuc) {
        _layer.msg('请先加入该房间！');
        return;
      }
      for (let key in roomInMuc.roster) {
        let o = roomInMuc.roster[key];
        if (roomInMuc.nick !== key) {
          data.push(o);
        }
      }
      let content = _layTpl(_eleRoomSetingHtml).render({
        data:{
          roomjid:roomjid,
          me:_client.getCurrentUser().jid,
          meaffiliation:currentUserInMucRoom.affiliation,
          menick:currentUserInMucRoom.nick,
          memList:data,
          room:room,
        }
      });
      $('#getRoomConfigSeting').html(" ");
      $('#getDestroyR').html(" ");
      let rindex = _layIM.panel({
        title: '房间设置'
        ,tpl: content
        ,data: { //数据
          getRoomConfigHtml:_getRoomConfigHtml(roomjid),
          getDestroyHtml: _getDestroyHtml(roomjid),

        }
      });
      _getRoomExit(roomjid,rindex)
      _layerIndex["ROOMSETING"] = rindex;
      _layForm.render();
    });
  }

  var _roomMeetSeting = function (roomjid) {
    let data = [];
    _client.getRoomMgr().getRoomByJidFromServer(roomjid, function (params) {
      let room = params.room;
      let roomInMuc = _client.getRoomMgr().getXmppRoom(roomjid);
      let currentUserInMucRoom = roomInMuc.roster[roomInMuc.nick];
      if (null == room) {
        _layer.msg('房间信息不存在！');
        return;
      } else if (null == roomInMuc) {
        _layer.msg('请先加入该房间！');
        return;
      }
      for (let key in roomInMuc.roster) {
        let o = roomInMuc.roster[key];
        if (roomInMuc.nick !== key) {
          data.push(o);
        }
      }
      let content = _layTpl(_eleRoomMeetSetingHtml).render({
        data:{
          roomjid:roomjid,
          me:_client.getCurrentUser().jid,
          meaffiliation:currentUserInMucRoom.affiliation,
          menick:currentUserInMucRoom.nick,
          memList:data,
          room:room,
        }
      });
      $('#getRoomConfigSeting').html(" ");
      $('#getDestroyR').html(" ");
      let rindex = _layIM.panel({
        title: '房间设置'
        ,tpl: content
        ,data: { //数据
          getRoomConfigHtml:_getMeetRoomConfigHtml(roomjid),
          getDestroyHtml: _getDestroyHtml(roomjid),

        }
      });
      _getRoomExit(roomjid,rindex)
      _layerIndex["ROOMSETING"] = rindex;
      _layForm.render();
    });
  }

  var _temparatureFriend = function(onejid,onenick){
    let _friend =  _client.getRosterMgr().getFriendGroups();
    let btnType = false;
    for (var i = 0; i < _friend.length; i++) {
      _friend[i].list.find(function (x) {
        if(XoW.utils.getNodeFromJid(x.jid) == XoW.utils.getNodeFromJid(onejid) ){
          btnType = true;
          return;
        }
      });
    }

    let content = _layTpl(_eleTemparatureFriend).render({
      data:{
        btnType:btnType,
        onejid:onejid,
        onenick:onenick,
      }
    });
    let tempIndex  = _layIM.panel({
      title: '好友消息'
      ,tpl: content
    });
    _layerIndex['TEMPFREINED'] = tempIndex

  }

  _layForm.on('checkbox(layimwritePaasword)', function(obj){
    if(obj.elem.checked == true){
      let html ='<input type="text" name="roomPassword"  id="toGetRoomPassword"  lay-verify="required" placeholder="房间密码" autocomplete="off" class="layui-input">'
      $("#writeRoomPaaswod").html(html)
    }else{
      $("#writeRoomPaaswod").html(" ")
    }
    _layForm.render();
  });

  // endregion form utils

  // endregion mobile mark
  // endregion Private Methods

  // region Overload functions of layim
  var faces = function(){
    var alt = ["[微笑]", "[嘻嘻]", "[哈哈]", "[可爱]", "[可怜]", "[挖鼻]", "[吃惊]", "[害羞]", "[挤眼]", "[闭嘴]", "[鄙视]", "[爱你]", "[泪]", "[偷笑]", "[亲亲]", "[生病]", "[太开心]", "[白眼]", "[右哼哼]", "[左哼哼]", "[嘘]", "[衰]", "[委屈]", "[吐]", "[哈欠]", "[抱抱]", "[怒]", "[疑问]", "[馋嘴]", "[拜拜]", "[思考]", "[汗]", "[困]", "[睡]", "[钱]", "[失望]", "[酷]", "[色]", "[哼]", "[鼓掌]", "[晕]", "[悲伤]", "[抓狂]", "[黑线]", "[阴险]", "[怒骂]", "[互粉]", "[心]", "[伤心]", "[猪头]", "[熊猫]", "[兔子]", "[ok]", "[耶]", "[good]", "[NO]", "[赞]", "[来]", "[弱]", "[草泥马]", "[神马]", "[囧]", "[浮云]", "[给力]", "[围观]", "[威武]", "[奥特曼]", "[礼物]", "[钟]", "[话筒]", "[蜡烛]", "[蛋糕]"], arr = {};
    layui.each(alt, function(index, item){
      arr[item] = layui.cache.dir + 'images/face/'+ index + '.gif';
    });
    return arr;
  }();

  var  _makeChatingRoom = function (oThis) {
    let roomName = $('#getRoomName').val();
    let  regex = /^(?!_)(?!.*?_$)[a-zA-Z0-9_\u4e00-\u9fa5]+$/
    if(regex.test(roomName)==false){
      _layer.msg("房间名称只能包含字母、数字、_、不能以下划线开头和结尾");
      return;
    }
    let roomDesc = $('#getRoomDesc').val();

    let roomPeopleNums = $('#roomMaxNum').val();
    if(roomPeopleNums == 'no'){
      _layer.msg("请选中房间上限人数");
      return;
    }
    let isPasswordRoom = $('input[name="needPassword"]:checked ').val();
    let isMemberRoom = $('input[name="onlyMember"]:checked ').val();
    let isSecretRoom = $('input[name="noPublic"]:checked ').val();
    let MemberRoomSwitch = 0;
    let isSecretRoomSwitch = 1;
    if(isMemberRoom){
      MemberRoomSwitch = 1;
    }
    if(isSecretRoom){
      isSecretRoomSwitch = 0;
    }
    let roomPassword = " ";
    let passwordSwitch = 0;
    if(isPasswordRoom){
      if($('#toGetRoomPassword').val().length>0){
        passwordSwitch = 1;
        roomPassword = $.trim($('#toGetRoomPassword').val());
      }
      else{
        _layer.msg("密码不能为空！");
        return;
      }
    }
    var user = _client.getCurrentUser();
    if (!roomName) {
      _layer.msg("请输入有效的房间名称！");
      return;
    }
    var roomServerAbility = _client.getServerMgr().getAbilityByCategroy('conference', 'text');
    if (!roomServerAbility) {
      _layer.msg("没有房间服务器！");
      _roomBack(oThis)
      if(_layerIndex['CREATEROOM']!=-1){
        _layer.close(_layerIndex['CREATEROOM'])
        _layerIndex['CREATEROOM'] = -1;
      }
      return;
    }
    var roomJid = roomName.toLocaleLowerCase() + "@" + roomServerAbility.jid;
    _client.getRoomMgr().getRoomByJidFromServer(roomJid, function (params) {
      var isRoom = _client.getRoomMgr().getRoomByJid(roomJid);
      if(isRoom!=null){
        _layer.msg("你创建的房间地址已被使用，该房间存在");
      }
    }.bind(this), function (errorStanza) {
      var errorCode = $('error', $(errorStanza)).attr('code');
      if (404 == errorCode) {
        XoW.logger.d(this.classInfo + "房间不存在，可以创建该房间");
        _client.getRoomMgr().createRoom(roomJid,
            XoW.utils.getNodeFromJid(user.getFullJid()),
            XoW.utils.getNodeFromJid(user.getFullJid()), function (params) {
              //创建成功
              var roomJid = params.roomJid;
              var name = XoW.utils.getNodeFromJid(roomJid);
              var peopleNumber = 0;
              var nick = params.nick;
              var room = new XoW.Room();
              room.jid = roomJid;
              room.name = name;
              room.id = room.name
              _client.getRoomMgr().PushRoom(room);
              XoW.logger.d('创建成功！' + roomJid + " " + name);
              var roomlist = {
                type : 'group',
                name:name,
                groupname:name,
                username:name,
                jid:roomJid,  //这个需要添加
                id: name,
                isPersistent:true,
                avatar:"http://tp2.sinaimg.cn/2211874245/180/40050524279/0",
                isUnsecured:true
              };
              _getRoomConfig(roomJid, function (params) {
                var fields = params.fields;
                fields['muc#roomconfig_roomdesc'].value = roomDesc;
                fields['muc#roomconfig_changesubject'].value = 1;
                fields['muc#roomconfig_publicroom'].value = isSecretRoomSwitch;
                fields['muc#roomconfig_membersonly'].value = MemberRoomSwitch;
                fields['muc#roomconfig_allowinvites'].value = 1;
                fields['muc#roomconfig_passwordprotectedroom'].value = passwordSwitch;
                fields['muc#roomconfig_roomsecret'].value=roomPassword;
                fields['muc#roomconfig_enablelogging'].value = 0;
                fields['x-muc#roomconfig_reservednick'].value = 0;
                fields['x-muc#roomconfig_canchangenick'].value = 1;
                fields['x-muc#roomconfig_registration'].value = 1;
                fields['muc#roomconfig_persistentroom'].value = 1;
                fields['muc#roomconfig_moderatedroom'].value = 1;
                fields['muc#roomconfig_maxusers'].value = roomPeopleNums;
                fields['muc#roomconfig_whois'].value = 'anyone';
                var presValues = [];
                presValues.push('moderator');
                presValues.push('participant');
                presValues.push('visitor');
                fields['muc#roomconfig_presencebroadcast'].value = presValues;
                fields['muc#roomconfig_roomadmins'].value ='';
                var ismiii = _client.getCurrentUser1().jid;
                var rrd = XoW.utils.getNodeFromJid(ismiii);
                var sendme = rrd+"@"+XoW.config.domain;
                var ownValues = [];
                ownValues.push(sendme);
                fields['muc#roomconfig_roomowners'].value = ownValues;
                _client.getRoomMgr().saveRoomConfig(roomJid, fields, function () {
                  _layer.msg('初始化成功！');
                }, function () {
                  _layer.msg('初始化失败');
                });
              }.bind(this));
              _layIM.addList(roomlist);
              _client.getRoomMgr().SaveoutAllRoom(roomlist);
              _roomRefresh()
              _roomBack(oThis)
              if(_layerIndex['CREATEROOM']!=-1){
                _layer.close(_layerIndex['CREATEROOM'])
                _layerIndex['CREATEROOM'] = -1;
              }
              _layIM.chat(roomlist);
            }.bind(this), function () {
              // 创建失败
              _layer.msg('创建失败');
              _roomBack(oThis)
              if(_layerIndex['CREATEROOM']!=-1){
                _layer.close(_layerIndex['CREATEROOM'])
                _layerIndex['CREATEROOM'] = -1;
              }
              XoW.logger.d('创建失败');
            });

      } else {
        _roomBack(oThis)
        if(_layerIndex['CREATEROOM']!=-1){
          _layer.close(_layerIndex['CREATEROOM'])
          _layerIndex['CREATEROOM'] = -1;
        }
        _layer.msg('未知错误，错误代码：' + errorCode);
      }
    }.bind(this));
  }
  var _makeMeetingRoom = function(oThis){
    let roomName = $('#getMeetRoomName').val();
    let  regex = /^(?!_)(?!.*?_$)[a-zA-Z0-9_\u4e00-\u9fa5]+$/
    if(regex.test(roomName)==false){
      _layer.msg("房间名称只能包含字母、数字、_、不能以下划线开头和结尾");
      return;
    }
    let roomDesc = $('#getMeetRoomDesc').val();
    let roomPeopleNums = $('#roomMeetMaxNum').val();
    if(roomPeopleNums == 'no'){
      _layer.msg("请选中房间上限人数");
      return;
    }
    var user = _client.getCurrentUser();
    if (!roomName) {
      _layer.msg("请输入有效的房间地址！");
      return;
    }
    var roomServerAbility = _client.getServerMgr().getAbilityByCategroy('conference', 'text');
    if (!roomServerAbility) {
      _roomBack(oThis);
      if( _layerIndex['MEETINGEROOM']!=-1){
        _layer.close( _layerIndex['MEETINGEROOM']);
        _layerIndex['MEETINGEROOM'] = -1;
      }
      _layer.msg("没有房间服务器！");
      return;
    }
    var roomJid = roomName.toLocaleLowerCase() + "@" + roomServerAbility.jid; //房间jid
    _client.getRoomMgr().getRoomByJidFromServer(roomJid, function (params) {
      var isRoom = _client.getRoomMgr().getRoomByJid(roomJid);
      if(isRoom!=null){
        _layer.msg("你创建的房间地址已被使用，该房间存在");
      }
    }.bind(this), function (errorStanza) {
      var errorCode = $('error', $(errorStanza)).attr('code');
      if (404 == errorCode) {
        _client.getRoomMgr().createRoom(roomJid,
            XoW.utils.getNodeFromJid(user.getFullJid()),
            XoW.utils.getNodeFromJid(user.getFullJid()), function (params) {
              var roomJid = params.roomJid;
              var name = XoW.utils.getNodeFromJid(roomJid);
              var peopleNumber = 0;
              var nick = params.nick;
              var room = new XoW.Room();
              room.jid = roomJid;
              room.name = name;
              room.id = room.name
              _client.getRoomMgr().PushRoom(room);
              var roomlist = {
                type : 'group',
                groupname:name,
                name:name,
                username:name,
                jid:roomJid,
                id: name,
                avatar:"../skin/images/avatar_room.png",
                isPersistent:false,
                isUnsecured:true
              };
              _getRoomConfig(roomJid, function (params) {
                var fields = params.fields;
                fields['muc#roomconfig_roomdesc'].value = roomDesc;
                fields['muc#roomconfig_maxusers'].value = roomPeopleNums;
                _client.getRoomMgr().saveRoomConfig(roomJid, fields, function () {
                  _layer.msg('初始化成功！');
                }, function () {
                  _layer.msg('初始化失败');
                });
              }.bind(this));
              _layIM.addList(roomlist);
              _client.getRoomMgr().SaveoutAllRoom(roomlist);
              _roomRefresh()
              _roomBack(oThis);
              if( _layerIndex['MEETINGEROOM']!=-1){
                _layer.close( _layerIndex['MEETINGEROOM']);
                _layerIndex['MEETINGEROOM'] = -1;
              }
              _layIM.chat(roomlist);
            }.bind(this), function () {
              _roomBack(oThis);
              if( _layerIndex['MEETINGEROOM']!=-1){
                _layer.close( _layerIndex['MEETINGEROOM']);
                _layerIndex['MEETINGEROOM'] = -1;
              }
              _layer.msg('创建失败');
            });
      } else {
        _roomBack(oThis);
        if( _layerIndex['MEETINGEROOM']!=-1){
          _layer.close( _layerIndex['MEETINGEROOM']);
          _layerIndex['MEETINGEROOM'] = -1;
        }
        _layer.msg('未知错误，错误代码：' + errorCode);
      }
    }.bind(this));
  }
  layui.data.content = function(content){
    //XoW.logger.e('self content @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
    //支持的html标签
    var html = function(end){
      return new RegExp('\\n*\\['+ (end||'') +'(code|pre|div|span|p|table|thead|th|tbody|tr|td|ul|li|ol|li|dl|dt|dd|h2|h3|h4|h5)([\\s\\S]*?)\\]\\n*', 'g');
    };
    content = (content||'')

        .replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
        .replace(/</g, '&lt;').replace(/>/g, '&gt;') //XSS
        // .replace(/@(\S+)(\s+?|$)/g, '@<a href="javascript:;">$1</a>$2') //转义@ // 与jid的@符号冲突 del by cy [20190417]
        .replace(/'/g, '&#39;').replace(/"/g, '&quot;')
        .replace(/fileEx\([\s\S]+?\)\[[\s\S]*?\]/g, function(str){ //转义文件
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
          thatFile.filename = theThumbnail.filename;
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
          thatFile = null;
          return html;
          // return '<a class="layui-layim-file" href="'+ href +'" download target="_blank"><i class="layui-icon">&#xe61e;</i><cite>'+ (text||href) +'</cite></a>';
        })
        .replace(/imgEx\[[\s\S]*?\]/g, function(img){  //转义图片
          var text = img.replace(/(^imgEx\[)|(\]$)/g, '').replace(/&quot;/g, '"');
          var theThumbnail = $.parseJSON(text); // 存在
          if(!theThumbnail) return img;
          var thatFile = new XoW.File(theThumbnail.to);
          thatFile.filename = theThumbnail.filename;
          thatFile.size = theThumbnail.size;
          thatFile.mime = theThumbnail.mime;
          thatFile.mine = theThumbnail.mine;
          thatFile.sid = theThumbnail.sid;
          thatFile.status = theThumbnail.status;
          thatFile.errorMsg = theThumbnail.errorMsg;
          thatFile.base64 = theThumbnail.base64;
          var html = _layTpl(_eleImage).render(thatFile);
          thatFile = null;
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
        .replace(/hpFile\[[\s\S]*?\]/g, function(img){
          let text = img.replace(/(^hpFile\[)|(\]$)/g, '').replace(/&quot;/g, '"');
          let theThumbnail = $.parseJSON(text);
          if(!theThumbnail) return img;
          let thatFile = new XoW.httpFile();
          thatFile.cid = theThumbnail.cid;
          thatFile.mime = theThumbnail.mime;
          thatFile.mine = theThumbnail.mine;
          thatFile.seq = theThumbnail.seq;
          thatFile.percent = theThumbnail.percent
          thatFile.url = theThumbnail.url;
          thatFile.size = theThumbnail.size;
          thatFile.status =theThumbnail.status;
          thatFile.filename = theThumbnail.filename;
          thatFile.errorMsg = theThumbnail.errorMsg;
          if(thatFile.status === XoW.FileHttpFileState.SENDING){
            let  keyCode = sessionStorage.getItem(thatFile.cid);
            if(keyCode == null){
              thatFile.status = XoW.FileHttpFileState.OVERDUE;
            }
          }
          let html = '';
          switch ( thatFile.mime) {
            case 'jpg':
            case 'bmp':
            case 'gif':
            case 'jpeg':
            case 'png':
              if( thatFile.url === '#'){
                thatFile.url == '../images/httpdefault.jpeg'
              }
              html = _layTpl(_eleHttpImage).render(thatFile);
              break;
            case 'mp4':
              html = _layTpl(_eleHttpVideo).render(thatFile);
              break;
            case 'mp3':
              html = _layTpl(_eleHttpAudio).render(thatFile);
              break;
            default:
              html = _layTpl(_eleHttpFile).render(thatFile);
          }
          thatFile = null;
          return html;
        })
        //.replace(/linkEx\([\s\S]+?\)\[[\s\S]*?\]/g, function(str){
        .replace(/linkEx\[[\s\S]*?\]/g, function(str){
          var text = (str.match(/\[([\s\S]*?)\]/)||[])[1];
          //var href = (content.match(/linkEx\(([\s\S]+?)\)\[/)||[])[1];
          if(!text) return str;
          var theThumbnail = $.parseJSON(text.replace(/&quot;/g, '"'));
          if(!theThumbnail) return str;
          var html = _layTpl(_elePageThumbnail).render(theThumbnail);
          theThumbnail = null;
          return html;
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

  exports('layImExMobile', new LAYIMEX()); //注意，这里是模块输出的核心，模块名必须和use时的模块名一致
})
    .addcss(
        '../../skin/css/layimex.mobile.css?v=2.0.2'
        ,'skinlayimex-mobilecss'
    );
