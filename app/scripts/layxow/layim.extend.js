/**
 * Created by cy
 * It's an extension of layim, which should not depends on logic layer of xow,
 * but may be depends on the tools, constants or entities that from xow.
 */
//layui.define(['layer', 'laytpl', 'layim'], function (exports) {
layui.define(['layer', 'laytpl', 'form', 'laypage',
    'laydate', 'util', 'element', 'flow', 'layim','Sketchpad'], function (exports) {
    // region Fields
    this.classInfo = 'layImEx';
    var $ = layui.$;
    var _layer = layui.layer;
    var _layTpl = layui.laytpl;
    var _layIM = layui.layim;
    var _layFlow = layui.flow;
    var _layPage = layui.laypage;
    var _layForm = layui.form;
    var _layDate = layui.laydate;
    var _layUtil = layui.util;
    var _client = layui.client;
    var _element = layui.element;
    var _Sketchpad = layui.Sketchpad;
    var stope = layui.stope;

    var THIS = 'layim-this', MAX_ITEM = 20;
    var _layerMainIndex = [];
    var _this = this;
    var _Sketchpad = layui.Sketchpad;
    var THIS = 'layim-this', MAX_ITEM = 20;
    var _this = this;

    // layui.data('layim')[_cache.mine.id] 保存当前数据
    //>history:最近联系人
    //>cache.message:未读消息，读取之后会被清空
    //>cache.chat:未读联系人，读取之后会被清空
    //>cache.local.chatLog:上一次（登录前）聊天记录，不会实时刷新
    var _$sysInfoBox, _device, _cache, _reConnLoadTipIndex, _layerIndex = {};//_layerIndex add by zjy for 群主关闭页面时使用[20190731]
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

    var _eleFriendMenu = [
        '<ul id="{{# "contextMenu_" + d.id }}" data-type="{{ d.type }}"  data-id="{{ d.id }}">'
        , '<li layImEx-event="menu_chat"><i class="layui-icon" >&#xe611;</i>  发送即时消息</li>'
        , '<li layImEx-event="menu_profile"><i class="layui-icon">&#xe60a;</i>  查看资料</li>'
        , '<li layImEx-event="menu_history"><i class="layui-icon">&#xe60e;</i>  消息记录</li>'
        , '<li layImEx-event="menu_rm_friend"><i class="layui-icon">&#xe640;</i>  删除好友</li>'
        , '<li layImEx-event="menu_move_to">移动至</li>'
        , '<li layImEx-event="menu_create_group">新建分组</li>'
        , '</ul>'
    ].join('');

    var _eleMainMoreTool = [
        '<div style="padding: 20px; background-color: #F2F2F2;">'
        , '  <div class="layui-row layui-col-space15">'
        , '{{# layui.each(d, function(index, item){ }}'
        , '    <div class="layui-col-xs4 layim-tool-card">'
        , '       <div class="layui-card" layImEx-event="select_main_tool" lay-filter="{{ item.alias }}">'
        , '          <div class="layui-card-header">{{ item.title }}</div>'
        , '          <div class="layui-card-body">'
        , '             <i style="font-size: 24px" class="layui-icon {{item.iconClass||\"\"}}">{{item.iconUnicode||""}}</i>'
        , '          </div>'
        , '       </div>'
        , '    </div>'
        , '{{# }); }}'
        , '  </div>'
        , '  <div class="layui-row layui-col-space15">'
        , '    <div class="layui-col-xs12 layim-tool-card">'
        , '       <div class="layui-card" layImEx-event="logout">'
        , '          <div class="layui-card-header"><span>退出当前账号</span></div>'
        , '          <div class="layui-card-body">'
        , '             <i class="layui-icon layui-icon-engine"></i>'
        , '          </div>'
        , '       </div>'
        , '    </div>'
        , '  </div>'
        , '</div>'
    ].join('');

    //聊天内容列表模版
    var _elemChatMain = [
        '<li {{ d.mine ? "class=layim-chat-mine" : "" }} {{# if(d.cid){ }}data-cid="{{d.cid}}"{{# } }}>'
        , '<div class="layim-chat-user"><img src="{{ d.avatar }}"><cite>'
        , '{{# if(d.mine){ }}'
        , '<i>{{ layui.data.date(d.timestamp) }}</i>{{ d.username||"佚名" }}'
        , '{{# } else { }}'
        , '{{ d.username||"佚名" }}<i>{{ layui.data.date(d.timestamp) }}</i>'
        , '{{# } }}'
        , '</cite></div>'
        , '<div class="layim-chat-text">{{ layui.data.content(d.content||"&nbsp") }}</div>'
        , '</li>'].join('');

    var _elePageThumbnail = [
        '<div class="layui-layim-goodinfo" title="点击进入页面查看详情" layImEx-event="open_url_page" data-src="{{ d.url }}">',
        ' <div style="height: 90px;float: left;">',
        '   <img src="{{ d.image }}" style="height: 80px;width:80px;">',
        ' </div>',
        ' <div style="float:left;width:150px;margin-left:10px;margin-top:10px;">',
        '   <div style="font-size:14px;width: 150px">{{ d.title }}</div>',
        '   <div style="font-size:16px;margin-left: 7px;margin-top:15px">{{ d.description }}</div>',
        ' </div></div>'
    ].join('');

  var _eleImage = [
    '<div class="layim_file" sid="{{ d.sid }}">'
    ,'  <div class="layim_fileinfo">'
    , '{{#  if(d.url!="*" ){ }}'
    ,'    <img class="layui-layim-photos" ondragstart="return false;" src="{{d.url}}" alt="缩略图模式">'
    ,'{{# }else{   }}'
    ,'    <img class="layui-layim-photos" ondragstart="return false;" src="data:{{ d.mime }};base64,{{ d.base64 }}" alt="缩略图模式">'
    ,'{{#  } }}'
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
    ,'<div class="layui-container" style="margin: 0;padding: 0;width: 400px;height: 250px;background-color: white">'
       ,'<div class="layim_file" sid="{{ d.cid }}">'
             ,'<div class="layui-row" style="width: 100%;height: 250px">'
                       ,'<div class="layui-col-md12" style="width: 100%;height: 250px">'
                                 ,'<img class="layui-layim-photos" ondragstart="return false;" src="{{ d.url }}" alt="缩略图模式"  style="height: 250px;width: 400px">'
                       ,'</div>'
             ,'</div>'
      ,'</div>'
    ,'</div>'
  ].join('');
  var _eleHttpFile = [
    ,'<div class="layui-container" style="margin: 0;padding: 0;width: 204px;height: 76px;">'
         ,'<div class="layim_file" sid="{{ d.cid }}">'
                ,'<div class="layui-row" style="width: 100%;height: 70px">'
                        ,'<div class="layui-col-md6" style="height: 70px">'
                             ,'<div class="layim_filepicture"><span> {{ d.mime }}文件</span></div>'
                        ,'  </div>'
                        ,'<div class="layui-col-md6" style="height: 70px">'
                             ,'<div class="layim_fileinfo">'
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
                ,'</div>'
                ,'{{# if(d.mine){ }}'
                      ,'{{# if(d.status == XoW.FileHttpFileState.SENDING){  }}'
                          ,'<div class="layui-row" style="width: 100%;height: 6px">'
                                ,'<div class="layui-progress " lay-showPercent="true" lay-filter="http{{d.cid}}">'
                                      ,'<div class="layui-progress-bar layui-bg-orange" lay-percent="{{d.percent}}"></div>'
                                ,'</div>'
                          ,'</div>'
                    ,'{{# } }}'
                ,'{{# } }}'
         ,'</div>'
    ,'</div>'
  ].join('');
  var _eleHttpVideo = [
    ,'<div class="layui-container" style="margin: 0;padding: 0;width: 120px;height: 86px;">'
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
                                     ,'<div class="layui-progress-bar layui-bg-orange" lay-percent="{{d.percent}}"></div>'
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
                                       ,'<div class="layui-progress-bar layui-bg-orange" lay-percent="{{d.percent}}"></div>'
                                 ,'</div>'
                              ,'</div>'
                      ,'{{# } }}'
                  ,'{{# } }}'
       ,'</div>'
    ,'</div>'
  ].join('');
    var _eleImage = [
        '<div class="layim_file" sid="{{ d.sid }}">'
        , '  <div class="layim_fileinfo">'
        , '    <img class="layui-layim-photos" ondragstart="return false;" src="data:{{ d.mime }};base64,{{ d.base64 }}" alt="缩略图模式">'
        , '  </div>'
        , '  {{# if(d.mine){ }}'
        , '    <div class="layim_filestate">'
        , '      <span id="fileProcess"> {{ d.getStatusDesc() }} </span>'
        , '    </div>'
        , '    <em class="layim_zero"></em>'
        , '  {{# } }}'
        , '</div>'
    ].join('');

    var _eleFileThumbnail = [
        '<div class="layim_file" sid="{{ d.sid }}">'
        , '  <div class="layim_filepicture" ><span> {{ d.getTypeDesc() }} </span></div>'
        , '  <div class="layim_fileinfo">'
        , ' 			<span class="layim_chatname">名称：{{ d.getTrimmedName() }} </span><br/>'
        , ' 			<span class="layim_chatname">大小：{{ d.getSizeDesc() }} </span><br/>'
        , '  </div>'
        , '  <div class="layim_filestate">'
        , '  {{# if(d.mine){ }}'
        //,'    <span id="fileReceiveProcess">'
        , '    {{# if (d.status == XoW.FileReceiveState.UNACCEPTED) { }} '
        , '       <a href="javascript:void(0);" layImEx-event="cancel_file" style="color:red" id="fileStopReceive">取消</a>&nbsp;&nbsp;'
        , '       <span id="fileProcess"> {{ d.getStatusDesc() }} </span>'
        , '    {{# } else if (d.status == XoW.FileReceiveState.RECEIVING) { }}'
        , '       <a href="javascript:void(0);" layImEx-event="stop_file" style="color:red" id="fileStopReceive">取消</a>&nbsp;'
        , '       <span id="fileProcess"> {{ d.getStatusDesc() }} </span>'
        , '    {{# } else if (d.status == XoW.FileReceiveState.CLOSED) { }}'
        , '       <span id="fileProcess"> {{ d.getStatusDesc() }} </span>'
        , '    {{# } else { }}'
        , '       <span id="fileProcess"> {{ d.getStatusDesc() }} </span>'
        , '    {{# } }}'
        , '  {{# } else { }}'
        //,'    <span id="fileReceiveProcess">'
        , '    {{# if (d.status == XoW.FileReceiveState.UNACCEPTED) { }} '
        , '       <a href="javascript:void(0);" layImEx-event="accept_file" style="c olor:blue">接收</a>&nbsp;'
        , '       <a href="javascript:void(0);" layImEx-event="reject_file" style="color:blue">拒绝</a>'
        , '    {{# } else if (d.status == XoW.FileReceiveState.RECEIVING) { }}'
        , '       <a href="javascript:void(0);" layImEx-event="stop_file" style="color:red" id="fileStopReceive">取消</a>&nbsp;'
        , '       <span id="fileProcess"> {{ d.getStatusDesc() }} </span>'
        , '    {{# } else if (d.status == XoW.FileReceiveState.CLOSED) { }}'
        , '       <span id="fileProcess"> {{ d.getStatusDesc() }} </span>'
        , '       <a href="javascript:void(0);" layImEx-event="open_file" style="color:blue">打开文件</a>'
        , '    {{# } else { }}'
        , '       <span id="fileProcess"> {{ d.getStatusDesc() }} </span>'
        , '    {{# } }}'
        //,'    </span>'
        , '  {{#  } }}  ' // not mine
        , '  </div>'
        , '  <em class="layim_zero"></em>'
        , '</div>'
    ].join('');

    // todo data-type 暂时先设置为friend
    var _eleLocalSearchRes = ['' +
    '{{# layui.each(d, function(index, item){ var spread = true; }}'
        //,'<li>'
        , '  <h5 layim-event="spread" lay-type="{{ spread }}"><i class="layui-icon">{{# if(spread === "true"){ }}&#xe61a;{{# } else {  }}&#xe602;{{# } }}</i><span>{{ item.title||"未命名分组"+index }}</span><em>(<cite class="layim-count"> {{ item.length }}</cite>)</em></h5>'
        , '  <ul class="layui-layim-list {{# if(spread){ }} layui-show {{# } }}">'
        , '    {{# if(item.length < 1) { }}'
        , '       <li class="layim-null-item"> {{ "没找到" + item.title}} </li>'
        , '    {{# } else { }}'
        , '      {{# layui.each(item, function(subIndex, subItem){ }}'
        , '          <li layim-event="chat" data-type="{{ subItem.type }}" data-index="{{ subItem.index }}" data-list="{{ subItem.list||""  }}"'
        , '            class="layim-{{ subItem.type + subItem.id }} {{ subItem.status === "offline" ? "layim-list-gray" : "" }}">'
        , '              <img src="{{ subItem.avatar }}">'
        , '              <span>{{ subItem.name }}</span>'
        , '              <p>{{ subItem.tag||subItem.sign||subItem.remark||"" }}</p><span class="layim-msg-status">new</span>'
        , '            </li>'
        , '      {{# }) }}'
        , '    {{# } }}'
        , '  </ul>'
        // ,'</li>'
        , '{{# }) }}'].join('');

    var _eleRemoteSearchBox = [
        '<div class="layui-tab layui-tab-brief">'
        , '  <ul class="layui-tab-title">'
        , '    <li class="{{# if(\'user\' === d.tab){ }}layui-this{{# } }}">找人</li>'
        , '    <li class="{{# if(\'room\' === d.tab){ }}layui-this{{# } }}">找聊天室</li>'
        , '    <li class="{{# if(\'chatLog\' === d.tab){ }}layui-this{{# } }}">找聊天记录</li>'
        , '  </ul>'
        , '  <div class="layui-tab-content" style="height: 100px;">'
        , '     <div class="layui-tab-item {{# if(\'user\' === d.tab){ }}layui-show{{# } }}">'
        //,'      <div class="layui-container">'
        , '        <div class="layui-row layui-col-space15">'
        , '          <div class="layui-col-xs8">'
        , '            <input class="layui-input" name="qry_user_keyword" id="qry_user_keyword" placeholder="请输入FaceWhat帐号/昵称/手机号" autocomplete="off"/>'
        , '          </div>'
        , '          <div class="layui-col-xs3">'
        , '            <button class="layui-btn" layImEx-event="search_user_remote" id="btn_search_user_remote">搜索</button>'
        , '          </div>'
        , '        </div>'
        //,'      </div>'
        , '        <div id="search_user_remote_res"></div>'
        , '     </div>'
        , '     <div class="layui-tab-item {{# if(\'room\' === d.tab){ }}layui-show{{# } }}">'
    ,'        <div class="layui-row layui-col-space15">'
    ,'          <div class="layui-col-xs8">'
    ,'            <input class="layui-input" name="qry_room_keyword" id="qry_room_keyword" placeholder="请输入房间昵称/JID" autocomplete="off"/>'
    ,'          </div>'
    ,'          <div class="layui-col-xs3">'
    ,'            <button class="layui-btn" layImEx-event="search_room_remote" id="btn_search_room_remote">搜索</button>'
    ,'          </div>'
    ,'        </div>'
    ,'        <div id="search_room_remote_res"></div>'
        , '      搜索聊天室，聊天室功能模块添加了嘛'
        , '     </div>'
        , '     <div class="layui-tab-item {{# if(\'chatLog\' === d.tab){ }}layui-show{{# } }}">'
        , '        <div><form class="layui-form" id="frmQryChatLog" action="">'
        , '          <div class="layui-form-item layui-input-inline layui-search-field">'
        , '            <select class="layui-select" name="qry_log_jid" id="qry_log_jid" lay-verify="required">'
        , '              <option value="">请选择好友</option>'
        , '            {{# layui.each(d.friend, function(index, group){ }}'
        , '                <optgroup label="{{ group.groupname || group.groupid }}">'
        , '                {{# layui.each(group.list, function(i, item){ }}'
        , '                    <option value="{{ item.jid }}" {{# if(d.withJid === item.jid) { }} selected {{# } }}>{{ item.username || item.name }}</option>'
        , '                {{# }); }}'
        , '                </optgroup>'
        , '            {{# }); }}'
        , '            </select>'
        , '          </div>'
        , '          <div class="layui-form-item layui-input-inline layui-search-field">'
        , '            <input class="layui-input" name="qry_log_keyword" id="qry_log_keyword" placeholder="请输入关键字" autocomplete="off"/>'
        , '          </div>'
        , '          <div class="layui-form-item layui-input-inline layui-search-field">'
        , '            <button class="layui-btn" type="button" layImEx-event="search_chat_log_remote" id="btn_search_chat_log_remote">搜索</button>'
        , '          </div>'
        , '          <a href="javascript:void(0);" layImEx-event="more_filter" data-chevron="down">更多筛选条件<span class="layui-icon">&#xe61a</span></a>'
        , '          <div class="layui-form-item layui-bg-gray layui-hide"  style="padding: 10px" id="qry_log_date">'
        , '            <div class="layui-inline">'
        , '              <label class="layui-form-label">开始日期</label>'
        , '              <div class="layui-input-inline layui-search-field">'
        , '                <input type="text" id="qry_log_start_date" name="qry_log_start_date"  class="layui-input" placeholder="请输入" lay-verify="date">'
        , '              </div>'
        , '            </div>'
        , '            <div class="layui-inline">'
        , '              <label class="layui-form-label">结束日期</label>'
        , '              <div class="layui-input-inline layui-search-field">'
        , '                <input type="text" id="qry_log_end_date" name="qry_log_end_date"  class="layui-input" placeholder="请输入" lay-verify="date">'
        , '              </div>'
        , '            </div>'
        , '          </div>'
        , '        </form></div>' // eof form
        //,'      </div>'
        , '        <div class="layim-chat-main"><ul id="flow_chat_log_cont"></ul></div>'
        , '     </div>'
        , '  </div>'
        , '</div>'].join('');

    var _eleRemoteSearchUserRes = [
        '{{# if(d.length > 0){ }}'
        , '  <div style="padding: 20px; background-color: #F2F2F2;" class="layui-container">'
        , '    <div class="layui-row layui-col-space15">'
        , '      {{# layui.each(d, function(index, item){ }}'
        , '            <div class="layui-col-xs4">'
        , '              <div class="layui-card" data-type="friend" data-index="0" ">'
        , '                <div class="layui-card-header">账号：{{ item.id }}</div>'
        , '                <div class="layui-card-body">'
        , '                  昵称：{{ item.username }}'
        , '                  <button class="layui-btn layui-btn-xs" layImEx-event="add_friend" data-jid="{{ item.jid }}">'
        , '                    <i class="layui-icon">&#xe608;</i>加为好友</button>'
        , '                </div>'
        , '              </div>'
        , '            </div>'
        , '      {{# }) }}' // for-each
        , '    </div>' // row
        , '  </div>' // container
        , '{{# } else { }}'
        , '  <div class="layui-row layui-col-space15">'
        , '    <span class="layim-null">搜索结果为空</span>'
        , '  </div>'
        , '{{# } }}'
    ].join('');

    var _getmeetingRoomSetingHTMl = function (roomjid, roomname) {
        var _meetingRoomSeting = [
            '<div class="layui-layer-content" style="height: 477px;">'
            , '<div class="layui-tab layui-tab-brief">'
            , '<ul class="layui-tab-title">'
            , '<li class="layui-this">首页</li>'
            , '<li>成员</li>'
            , '<li>设置</li>'
            , '</ul>'
            , '<div class="layui-tab-content">'
            , '<div class="layui-tab-item layui-show">'
            , '<form class="layui-form" action="" id="roomdetails">'
            + _getRoomDetail(roomjid, roomname)
            , '</form>'
            , '</div>'
            , '<div class="layui-tab-item"  id="roomPeoles">'
            , '<div class="layui-container" style="width:580px; text-align: center">'
            , ' <div class="layui-row">'
            , '<div class="layui-col-xs4">'
            , '<ul id="roomUserName">'
            , '<li class="layim-vcard-item">昵称</li>'
            , '</ul>'
            , ' </div>'
            , '<div class="layui-col-xs4">'
            , '<ul id = "roomUserPower">'
            , '<li class="layim-vcard-item">权限</li>'
            , '</ul>'
            , ' </div>'
            , '<div class="layui-col-xs4">'
            , '<ul id="roomUserSetomg">'
            , '<li class="layim-vcard-item">操作</li>'
            , '</ul>'
            , '</div>'
            , '  </div>'
            , '</div>'
            , '</div>'
            , '<div class="layui-tab-item" id="roomSrting" >'
            , '<div class="layui-container" style="width:580px; text-align: left">'
            , '<form class="layui-form" action="">'
            , ' <div class="layui-row" id="showRoomSteing">'
            , '</div>'
            , '</form>'
            , '</div>'
            , '</div>'
            , '</div>'
            , '</div>'
            , '</div>'
        ].join('')
        return _meetingRoomSeting
    }

    var _eleCreateChatRoomhtml = `
      <form class="layui-form" action="">
       <div class="layui-container" style="width: 602px; text-align: center"> 
              <div class="layui-row">
                 <div class="layui-col-md12" style="font-size: 26px">
                      {{d.roomname}}
                 </div>
              </div> 
              <div class="layui-row" style="margin-top: 30px;font-size: 15px"">
                 <div class="layui-col-md12">
                      <label class="layui-form-label">房间名称：</label>
                      <div class="layui-input-block">
                              <input type="text" name="roomname" required  lay-verify="required" placeholder="请输入聊天室的房间名称" autocomplete="off" class="layui-input" id="createRoomnname">
                      </div>
                 </div>
              </div> 
              <div class="layui-row" style="margin-top: 30px;font-size: 15px">
                 <div class="layui-col-md12">
                      <label class="layui-form-label">房间描述：</label>
                      <div class="layui-input-block">
                            <input type="text" name="roomname"   lay-verify="required" placeholder="请对这个房间进行描述" autocomplete="off" class="layui-input" id="roomDesc">
                      </div>
                 </div>
              </div> 
              <div class="layui-row" style="margin-top: 30px;font-size: 15px;text-align: left">
                 <div class="layui-col-md12">
                      <label class="layui-form-label">单选框：</label>
                      <div class="layui-input-block">
                        <input type="radio" name="roomPeoleNum" value="30" title="30" checked id="roomPeoleNumChoice30">
                        <input type="radio" name="roomPeoleNum" value="50" title="50" id="roomPeoleNumChoice50"> 
                      </div>
                 </div>
              </div> 
             <div class="layui-row" style="margin-top: 30px;font-size: 15px;text-align: left">
                 <div class="layui-col-md12">
                      <label class="layui-form-label">房间验证：</label>
                      <div class="layui-input-block">
                        <input type="checkbox" name="isMemberRoom" value="MemberRoom" title="仅会员">
                        <input type="checkbox" name="isSecretRoom" value="SecretRoom" title="不公开">
                        <input type="checkbox" name="isRoomPassword" value="password" title="密码"  lay-filter="writePaasword" >
                      </div>
                 </div>
             </div> 
            <div class="layui-row" style="margin-top: 30px;font-size: 15px;text-align: left" id="givePasswordToRoom">
                 
              </div> 
              <div class="layui-row">
                 <div class="layui-col-md12" style="margin-top: 30px">
                       <button   type="button" class="layui-btn layui-btn-primary" layImEx-event="creatingChatRoom">
                          <i class="layui-icon">&#xe63a;</i>
                       </button>
                 </div>
              </div> 
       </div>  
      </form>
   `
    var _eleCreateMeetingRoomhtml = `
      <form class="layui-form" action="">
       <div class="layui-container" style="width: 602px; text-align: center"> 
              <div class="layui-row">
                 <div class="layui-col-md12" style="font-size: 26px">
                      {{d.roomname}}
                 </div>
              </div> 
              <div class="layui-row" style="margin-top: 30px;font-size: 15px"">
                 <div class="layui-col-md12">
                      <label class="layui-form-label">房间名称：</label>
                      <div class="layui-input-block">
                              <input type="text" name="roomname" required  lay-verify="required" placeholder="请输入聊天室的房间名称" autocomplete="off" class="layui-input" id="createMeetingRoomnname">
                      </div>
                 </div>
              </div> 
              <div class="layui-row" style="margin-top: 30px;font-size: 15px">
                 <div class="layui-col-md12">
                      <label class="layui-form-label">房间描述：</label>
                      <div class="layui-input-block">
                            <input type="text" name="roomname"   lay-verify="required" placeholder="请对这个房间进行描述" autocomplete="off" class="layui-input" id="roomMeetingDesc">
                      </div>
                 </div>
              </div> 
              <div class="layui-row" style="margin-top: 30px;font-size: 15px;text-align: left">
                 <div class="layui-col-md12">
                      <label class="layui-form-label">单选框：</label>
                      <div class="layui-input-block">
                        <input type="radio" name="roomPeoleNum" value="30" title="30" checked id="roomPeoleNumChoice30">
                        <input type="radio" name="roomPeoleNum" value="50" title="50" id="roomPeoleNumChoice50"> 
                      </div>
                 </div>
              </div> 
              <div class="layui-row">
                 <div class="layui-col-md12" style="margin-top: 30px">
                       <button   type="button" class="layui-btn layui-btn-primary" layImEx-event="creatingMeetinfRoom">
                          <i class="layui-icon">&#xe63a;</i>
                       </button>
                 </div>
              </div> 
       </div>  
      </form>
   `
    var _eleRoominvifriendhtml = `<div class="layui-container" style="width: 602px">  
            <div class="layui-row">
              <div class="layui-col-xs6">
                   <div class="layui-col-xs8" id = "inputSerchmsg">
                          <div class="layui-form-item">
                            <div class="layui-inline">
                              <div class="layui-input-inline" style="margin-top:10px">
                                <input type="text" name="roomInviting"  autocomplete="off" class="layui-input" id="searchText">
                              </div>
                            </div>
                          </div>
                   </div>
                   <div class="layui-col-xs4" style="margin-top:10px">
                       &nbsp;&nbsp;<button class="layui-btn" layImEx-event="serchFirendmsg">搜索</button>
                   </div> 
                    {{# if(d.length==0){ }}
                           <div class="layui-form-item">
                            <div class="layui-inline">
                              <div class="layui-input-inline">
                                 <span>暂无在线联系人</span>
                              </div>
                            </div>
                          </div>
                     {{# } }}
                    {{# if(d.length>0){ }}
                   <fieldset class="layui-elem-field">
                    <legend >在线联系人</legend>
                    <div class="layui-field-box">
                       <form class="layui-form">
                               <div class="layui-form-item" id="ChoiceFiends">
                                    {{# layui.each(d, function(index, item){ }}
                                    <input type="checkbox"  lay-filter = "checkInnvetion" name="{{item.name}}" data-jid="{{item.jid}}" class = 'Not{{item.name}}' lay-skin="primary" title="{{item.jid}}">
                                    {{# }); }}
                              </div>  
                          </form>       
                    </div>
                  </fieldset> 
                   {{# } }}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         -
              </div>
              <div class="layui-col-xs6">
                   <fieldset class="layui-elem-field">
                    <legend >已选联系人</legend>
                    <div class="layui-field-box">
                               <div class="layui-form-item"  id="arradyChoice">                       
                              </div>  
                    </div>
                  </fieldset>  
              </div>
            </div>
       </div>`

    var _elemRoomtileHtml = `
        <div class="layui-container" style="width:602px;text-align: center;margin: 0;padding: 0" >  
           <div class="layui-row" style="text-align: center;"> 
                  <div class="layui-col-md12">
                        <h1>房间主题</h1>
                  </div>
           </div>
           <br>
           <div class="layui-row"> 
                   <div class="layui-col-md10">
                       <div class="layui-form-item layui-form-text">
                           <div class="layui-input-block">
                             <textarea name="desc" placeholder="请输入房间主题" class="layui-textarea" id="getRoomTiTle"></textarea>
                           </div>
                       </div>
                  </div>
           </div>
           <div class="layui-row" style="text-align: center"> 
                   <div class="layui-col-md12">
                       <button class="layui-btn" data-jid = "{{d.jid}}" layImEx-event="sendRoomTitles">提交</button>
                  </div>
           </div>
        </div>
  `
    var _inviteMegrouphtml = function (room) {
        var html = ['<div id="invitesap">'
            , '<table class="layui-table" >'
            , '<tr id=" ' + room.id + '"  jid="' + room.from + '" invifrom = "' + room.ini + '" password = "' + room.pwd + '">'
            , '<td>'
            , '<a href="#" id="invited_id">' + XoW.utils.getNodeFromJid(room.from) + '</a>'
            , '<a href="#" id="invited_time">' + '&nbsp;&nbsp;&nbsp;&nbsp;' + room.time + '</a><br><br>'
            , ' <span>邀请加入加入会议室</span>'
            , '<p class="layim_btns" style="float: right">'
            , '<button id="layim_invitIntoroomagree"  layImEx-event= "layim_invitIntoroomagree" class="layui-btn layui-btn-small">同意</button>'
            , '<button id="layim_invitIntoroomdisagree" layImEx-event= "layim_invitIntoroomdisagree" class="layui-btn layui-btn-small">拒绝</button>'
            , '</p>'
            , '<br>'
            , '</td>'
            , '</tr>'
            , '</table>'
            , '</div>'
        ].join('');
        return html;
    }
    var _elemRemoteSearchChatLogRes = [
        '<li {{ d.mine ? "class=layim-chat-mine" : "" }}>'
        , '<div class="layim-chat-user"><img src="{{ d.avatar }}"><cite>'
        , '{{# if(d.mine){ }}'
        , '<i>{{ layui.data.date(parseInt(d.timestamp)) }}</i>{{ d.username||"佚名" }}'
        , '{{# } else { }}'
        , '{{ d.username||"佚名" }}<i>{{ layui.data.date(parseInt(d.timestamp)) }}</i>'
        , '{{# } }}'
        , '</cite></div>'
        , '<div class="layim-chat-text">{{ layui.data.content(d.content||"&nbsp") }}</div>'
        , '</li>'].join('');

    var _eleSysInfoBox = [
        '{{# layui.each(d.data, function(index, item){'
        , '  if(item.item && "SUB_ME_REQ_RCV" === item.type){ }}'
        , '    <li id={{ "sysInfo" + item.cid }} data-fromGroup="{{ item.from_group }}">'
        , '      <a href="/u/{{ item.from }}/" target="_blank">'
        , '        <img src="{{ item.item.avatar }}" class="layui-circle layim-msgbox-avatar">'
        , '      </a>'
        , '      <p class="layim-msgbox-user">'
        , '        <a href="/u/{{ item.from }}/" target="_blank">{{ item.item.username||"" }}</a>'
        , '        <span>{{ item.timestamp }}</span>'
        , '      </p>'
        , '      <p class="layim-msgbox-content">'
        , '       {{ item.content }}'
        , '        <span>{{ item.remark ? "附言: " + item.remark : "" }}</span>'
        , '      </p>'
        , '      <p class="layim-msgbox-btn">'
        , '       {{# if(item.status === "untreated"){ }}'
        , '        <button class="layui-btn layui-btn-small layui-btn-primary" data-jid="{{ item.from }}" layImEx-event="approve_user_sub">同意</button>'
        , '        <button class="layui-btn layui-btn-small" data-jid="{{ item.from }}" layImEx-event="deny_user_sub">拒绝</button>'
        , '       {{# }else{ }}'
        , '          {{ item.status }}'
        , '       {{# } }}'
        , '      </p>'
        , '    </li>'
        , '  {{# } else { }}'
        , '    <li class="layim-msgbox-system">'
        , '      <p><em>系统：</em>{{ item.content }}<span>{{ item.timestamp }}</span></p>'
        , '    </li>'
        , '  {{# } }); }}'].join('');

    var _eleVCard = [
        '<div class="layui-form-item pt15">',
        '<div class="layim-msgbox"><li>',
        '<a href="javascript:void(0);" target="_blank"><img src="{{ d.avatar }}" class="layui-circle layim-msgbox-avatar" ></a>',
        '<p class="layim-msgbox-user"><span>昵&nbsp;&nbsp;称 </span> {{ d.name || d.username }}</p>',
        '<p class="layim-msgbox-user"><span>账&nbsp;&nbsp;号 </span> {{ d.id }}</p>',
        '<button class="layui-btn layui-btn-primary layim-vcard-chat" layImEx-event="open_chat" data-id="{{d.id}}">发送消息</button>',
        '</li></div>',
        '</div>',
        '<div class="layui-col-xs12 pt10 layim-vcard-item">',
        '<label class="label">性&nbsp;&nbsp;别</label>',
        '<div class="block"><label class="label_key">保密</label></div>',
        '</div>',
        '<div class="layui-col-xs12 pt10 layim-vcard-item">',
        '<label class="label">生&nbsp;&nbsp;日</label>',
        '<div class="block"><div class="label_key">{{d.vcard.BDAY}}</div></div>',
        '</div>',
        '<div class="layui-col-xs12 pt10 layim-vcard-item">',
        '<label class="label">手&nbsp;&nbsp;机</label>',
        '<div class="block">',
        '<div class="label_key">{{d.vcard.WORK.CELL_TEL || []}}</div>',
        '</div>',
        '</div>',
        '<div class="layui-col-xs12 pt10 layim-vcard-item">',
        '<label class="label">邮&nbsp;&nbsp;箱</label>',
        '<div class="block">',
        '<div class="label_key">{{d.vcard.EMAIL || []}}</div>',
        '</div>',
        '</div>',
        '<div class="layui-col-xs12 pt10 layim-vcard-item">',
        '<label class="label">签&nbsp;&nbsp;名</label>',
        '<div class="block">',
        '<div class="label_key">{{d.sign|| []}}</div>',
        '</div>',
        '</div>'
    ].join('');

    var _eleMineVCard = [
        '<form class="layui-form" action="">',
        '  <div class="layim-vcard">',
        '    <li>',
        '      <div class="layui-form-item layim-vcard-item"><label class="label">账&nbsp;&nbsp;号 </label><span>{{ d.id }}</span></div>',
        '      <div class="layui-form-item layim-vcard-item"><label class="label">昵&nbsp;&nbsp;称 </label> ',
        '        <div class="block">',
        '          <input type="text" class="layui-input" name="nickname" value="{{ d.name }}" lay-verify="required">',
        '        </div>',
        '      </div>',
        '      <a href="javascript:void(0);" target="_blank"  layImEx-event="set_mine_avatar" title="点击上传图片" >',
        '        <img id="img_set_mine_avatar" src="{{ d.avatar }}" class="layui-circle layim-vcard-avatar">',
        '      </a>',
        '      <input type="file" id="ipt_set_mine_avatar" style="display:none" accept="image/png, image/jpeg, image/gif, image/jpg">',
        '    </li>',
        '  </div>',
        '  <div class="layui-col-xs12 layim-vcard-item">',
        '    <div class="layui-col-xs6">',
        '      <label class="label">生&nbsp;&nbsp;日</label>',
        '      <div class="block">',
        '        <input type="text" class="layui-input" name="birthday" id="set_mine_vcard_bday" placeholder="请输入" lay-verify="date" value="{{ d.vcard.BDAY}}">',
        '      </div>',
        '    </div>',
        '    <div class="layui-col-xs6 ">',
        '      <label class="label">性&nbsp;&nbsp;别</label>',
        '      <div class="block">',
        '        <select name="gender" class="layui-select" value="{{ d.gender }}">',
        '          <option value="">请选择性别</option>',
        '          <option value="1" {{# if(d.gender == "male"){ }} selected="selected" {{# } }}>男</option>',
        '          <option value="2" {{# if(d.gender == "female"){ }} selected="selected" {{# } }}>女</option>',
        '          <option value="3" {{# if(d.gender == "secret"){ }} selected="selected" {{# } }}>保密</option>',
        '        </select>',
        '      </div>',
        '    </div>',
        '  </div>',
        '  <div class="layui-form-item layim-vcard-item pt10">',
        '    <label class="label">手&nbsp;&nbsp;机</label>',
        '    <div class="block">',
        '      <input type="text" class="layui-input" name="telephone" lay-verify="phone" value="{{ d.vcard.WORK.CELL_TEL || [] }}">',
        '    </div>',
        '  </div>',
        '  <div class="layui-form-item layim-vcard-item">',
        '    <label class="label">邮&nbsp;&nbsp;箱</label>',
        '    <div class="block">',
        '      <input type="text" class="layui-input" name="email" lay-verify="email" value="{{ d.vcard.EMAIL || [] }}">',
        '    </div>',
        '  </div>',
        '  <div class="layui-form-item layim-vcard-item">',
        '    <label class="label">签&nbsp;&nbsp;名</label>',
        '    <div class="block">',
        '      <textarea name="signature" placeholder="请输入内容" class="layui-textarea noresize">{{d.vcard.DESC}}</textarea>',
        '    </div>',
        '  </div>',
        //'  <div class="layui-form-item">',
        //'    <div class="layui-input-block">',
        //'      <button class="layui-btn" lay-submit lay-filter="*">保存</button>',
        //'      <button type="button" id="close" class="layui-btn layui-btn-primary">关闭</button>',
        //'    </div>',
        //'  </div>',
        '</form>'
    ].join('');

    var _eleRoomMenu = [
        '<ul>'
        , '<li layImEx-event="CreateChatRoom"><i class="layui-icon" >&#xe611;</i>创建聊天室</li>'
        , '<li layImEx-event="createMeetingRoom"><i class="layui-icon">&#xe613;</i> 创建会议室</li>'
        , '<li layImEx-event="roomRefresh"><i class="layui-icon">&#xe666;</i> 刷新</li>'
        , '</ul>'
    ].join('');
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
  var _getEleRemoteSearchRoomRes = function (data) {
    let  _eleRemoteSearchRoomRes = '<div style="padding: 20px; background-color: #F2F2F2;" class="layui-container">';
    $.each(data,function(index,value){
      _eleRemoteSearchRoomRes += '<div class="layui-row layui-col-space15">'
      _eleRemoteSearchRoomRes += ' <div class="layui-col-xs4">'
          + '<div class="layui-card" data-type="friend" data-index="0" ">'
          + '<div class="layui-card-header">JID：'+value.jid+'</div>'
          + '<div class="layui-card-body">'
          + '昵称：'+value.name+''
          + ' <button class="layui-btn layui-btn-xs endIntoroom" layImEx-event="add_Room" data-jid="'+value.jid+'">'
          + '<i class="layui-icon">&#xe608;</i>加为群组</button>'
          + '</div>'
          + '</div>'
          + '</div>'
          + '</div>'
    });
    _eleRemoteSearchRoomRes +='</div>'
    return _eleRemoteSearchRoomRes;
  }

    var _groupSet = function (roomjid, roomname, ev) {
        var html = [
            '<div style="width: 720px; height: 490px;margin-top: 5px">'
            , '<div style="width: 260px;height: 100%; float: left;background:-webkit-gradient(linear, 0% 0%, 0% 100%,from(#1A47FF), to(#FFFFFF));">'
            + _roupSettile(roomjid, roomname)
            , '</div>'

            , '<div style="width: 460px;height: 100%; float: left">'
            , '<div style="width: 458px">'
            , '<div class="layui-tab layui-tab-card" >'
            , '<ul class="layui-tab-title">'
            , '<li class="layui-this">首页</li>'
            , '<li>成员</li>'
            //  ,'<li>黑名单</li>'
            , '<li>设置</li>'
            , '</ul>'
            , '<div class="layui-tab-content">'
            , '<div class="layui-tab-item layui-show" id = "groupSettile">'
            + _groupHead(roomjid, roomname)
            , '</div>'
            , ' <div class="layui-tab-item" id = "groupPeople">'
            + _groupPeple(roomjid, roomname)
            , '</div>'
            // ,'<div class="layui-tab-item" id = "roomBandedPeoples">'
            // //  , '<table class="layui-table" lay-even="" lay-skin="nob">'
            // //  , '<colgroup>'
            // //  , '<col width="250">'
            // //  ,  '<col width="250">'
            // //  ,  '</colgroup>'
            // //  , '<thead>'
            // //  ,'<tr style="background-color: #FFFFFF"><th><b>黑名单操作</b></th><th><b>解除黑名单</b></th></tr></thead>'
            // //   , '<tbody>'
            // //  ,  '<tr  style="background-color: #FFFFFF">'
            // //  ,  '<td id="dealWithMemPow">'
            // //  +_getRoomMemsInRoom(roomjid,roomname)
            // //  , '</td>'
            // //  , '<td id="cancelOutcast">'
            // // + _cancelOutcastMem(roomjid,roomname)
            // //   ,'</td>'
            // //   ,'</tr>'
            // //   ,'</tbody></table>'
            // + _roomOutcastRoleS(roomjid,roomname)
            // ,'</div>'
            , '<div class="layui-tab-item" id="groupConfig">' + _groupConfig(roomjid, roomname) + '</div>'
            , '</div>'
            , ' </div> '
            , '</div>'
            , '</div>'
            , '</div>'
        ].join('');
        var index = _layer.open({
            anim: 1,
            type: 1,
            title: "",
            shade: 0,
            fixed: false,
            scrollbar: false,
            area: ['750px', '500px'],
            content: html

        });
        _layerIndex["ROOMSETPANEL"] = index;
        $(document).on('click', '#sendGroupMessage', function () {
            _layer.close(index);
        });
        $(document).on('click', '#addAdmin', function (ev) {
            var tjid = $('#addAdmin').attr('roomttjid');
            _roomAdminSeting(tjid);
            ev.stopImmediatePropagation();
        });

        $(document).on('click', '.groupSpeak', function () {
            var oDiv = document.getElementsByClassName("groupSpeak");
            for (var i = 0; i < oDiv.length; i++) {
                (function (i) {
                    oDiv[i].onclick = function () {
                        if ($(oDiv[i]).attr('powert') == "OP") {
                            var nick = $(oDiv[i]).attr('nicknick');
                            var gjid = $(oDiv[i]).attr('kjid');
                            var intdext = _layer.confirm('取消禁言？', {
                                btn: ['是的', '在想一下'] //按钮
                            }, function () {
                                _giveSpeaking(gjid, nick, function () {
                                    _layer.msg("取消禁言成功");
                                }.bind(this), function (error) {
                                    _layer.msg("取消失败，权限不够");
                                });
                                _layer.close(intdext);
                            }, function () {
                                _layer.close(intdext);
                            });
                        }
                        else {
                            var intdextt = _layer.confirm('禁言？', {
                                btn: ['是的', '在想一下'] //按钮
                            }, function () {
                                var nickss = $(oDiv[i]).attr('nicknick');
                                var gjid = $(oDiv[i]).attr('kjid');
                                _avoidSpeak(gjid, nickss, function () {
                                    _layer.msg("禁言成功");
                                }.bind(this), function (error) {
                                    _layer.msg("禁言失败，权限不够");
                                });
                                _layer.close(intdextt);
                            }, function () {
                                _layer.close(intdextt);
                            });
                        }
                    }
                })(i)
            }
        });

        $(document).on('click', '.groupMMM', function (ev) {
            var oDiv = document.getElementsByClassName("groupMMM");
            for (var i = 0; i < oDiv.length; i++) {
                (function (i) {
                    oDiv[i].onclick = function () {
                        if ($(oDiv[i]).attr('powert') == "OW") {
                            var intdext = _layer.confirm('解散群吗？', {
                                btn: ['是的', '在想一下'] //按钮
                            }, function () {
                                var sjid = $(oDiv[i]).attr('romji');
                                _destroying(sjid, function () {
                                    _layer.close(intdext);
                                    _layer.close(index)
                                    _layIM.closeThisChatLayer();
                                    _layer.msg("注销成功");
                                    // _roomRefresh();
                                    $("#reset").trigger("click");
                                }.bind(this), function (error) {
                                    _layer.msg("注销失败，权限不够");
                                });
                            }, function () {
                                _layer.close(intdext);
                            });
                        }
                        else if ($(oDiv[i]).attr('powert') == "EX") {
                            var sjid = $(oDiv[i]).attr('romji');
                            var user ;
                            //add by zjy for 消除Client依赖 [20190801]
                            layui.each(call.getCurrentUser, function (index, item) {
                                item && item( function (params) {
                                    user=params.jid;
                                });
                            });
                            var pres = $pres({
                                id: XoW.utils.getUniqueId("remove"),
                                from: user,
                                to: sjid,
                                type: 'unavailable'
                            });
                            //add by zjy for 消除Client依赖 [20190801]
                            layui.each(call.sendMsg,function(index,item){
                                item&&item(pres);
                            });
                            _layer.msg("退群成功");
                            _layer.close(index);
                            $(".layim-send-close").trigger("click");
                        }
                        else if ($(oDiv[i]).attr('powert') == "RM") {
                            let intdex = _layer.confirm('你要将这个用户移除出吗？', {
                                btn: ['是的', '在想一下'] //按钮
                            }, function () {
                                var sjid = $(oDiv[i]).attr('romji');
                                var nivk = $(oDiv[i]).attr('nicknick');
                                _outcast_someonet(sjid, nivk, function () {
                                    _layer.msg("移除成功");
                                }.bind(this), function (error) {
                                    _layer.msg("移除出失败");
                                });
                                _layer.close(intdex);
                            }, function () {
                                _layer.close(intdex);
                            });
                        }
                        else if ($(oDiv[i]).attr('powert') == "ORM") {
                            let intdex = _layer.confirm('你要将这个用户移除出吗？', {
                                btn: ['是的', '在想一下'] //按钮
                            }, function () {
                                var nivkjid = $(oDiv[i]).attr('userjidd');
                                var nivk = $(oDiv[i]).attr('nicknick');
                                var sjid = $(oDiv[i]).attr('romji');
                                _firstreMove(sjid, nivkjid, function () {
                                    _outcast_someonet(sjid, nivk, function () {
                                        _layer.msg("移除成功");
                                    }.bind(this), function (error) {
                                        _layer.msg("移除出失败");
                                    });
                                    _layer.close(intdex);
                                }.bind(this), function (error) {
                                    _layer.msg("移除出失败");
                                });
                                _layer.close(intdex);
                            }, function () {
                                _layer.close(intdex);
                            });
                        }
                    }
                })(i)
            }
        });
        $(document).on('click', '#newroomConfigSubmit', function (ev) {
            var jid = $('#newroomConfigSubmit').attr('userroomjid');
            _newroomConfigSubmit(jid);
            ev.stopImmediatePropagation();
        });
        $(document).on('click', '#removeMe', function () {  //新群组设置按
            //退出群
            var hjid = $('#removeMe').attr('userjiddd');
            var user;
            //add by zjy for 消除Client依赖 [20190801]
            layui.each(call.getCurrentUser, function (index, item) {
                item && item( function (params) {
                   user=params.jid;
                });
            });
            var pres = $pres({
                id: XoW.utils.getUniqueId("remove"),
                from: user,
                to: hjid,
                type: 'unavailable'
            });
            //add by zjy for 消除Client依赖 [20190801]
            layui.each(call.sendMsg,function(index,item){
                item&&item(pres);
            });
            _layer.msg("退群成功");
            _layer.close(index);
            $(".layim-send-close").trigger("click");
        });
        $(document).on('click', '#removeGroup', function (ev) {
            var removejid = $('#removeGroup').attr('userrrr');
            var intdexx = _layer.confirm('解散群吗？', {
                btn: ['是的', '再想一下']
            }, function () {
                _destroying(removejid, function () {
                    _layer.close(intdexx);
                    _layer.close(index)
                    _layIM.closeThisChatLayer();
                    _layer.msg("注销成功");
                    // _roomRefresh();
                }.bind(this), function (error) {
                    _layer.msg("注销失败，权限不够");
                });
            }, function () {
                _layer.close(intdexx);
            });
            ev.stopImmediatePropagation();
        });
    };

    var _roupSettile = function (roomjid, roomname) {
        let roomOwer = null;
        var html = '<div style="width:120px;height:120px;border-radius:100px;margin:50px auto;overflow:hidden;"><img src="http://tp2.sinaimg.cn/2211874245/180/40050524279/0" width="100%" height="100%"  ></div>';
        html += '<div  style="width:120px;height:30px;margin:3px auto;overflow: hidden;white-space:nowrap;text-overflow:ellipsis; text-align: center" ><h1>' + roomname + '</h1></div>';
        html += '<div  style="width:180px;height:40px;margin:20px auto;margin-bottom: 0px;overflow: hidden;white-space:nowrap;text-overflow:ellipsis;text-align: center" ><h4>' + roomjid + '</h4></div>';
        html += '<div  style="width:200px;height:40px;margin-top: 60px; margin-left:98px" ><button class="layui-btn layui-btn-radius layui-bg-blue layui-btn-sm" id = "sendGroupMessage">返回房间</button></div>';
        return html;
    };
    var _groupHead = function (roomjid, roomname) {
        var html = "暂无信息";
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getRoomByJidFromServer,function(index,item){
            item&&item(roomjid,function (params) {
                var room = params.room;
                var roomInMuc ;
                //add by zjy for 消除Client依赖 [20190801]
                layui.each(call.getXmppRoom, function (index, item) {
                    item && item(roomjid, function (param) {
                        roomInMuc=param;
                    });
                });
                if (null == room) {
                    _layer.msg('房间信息不存在！');
                    return;
                } else if (null == roomInMuc) {
                    _layer.msg('请先加入该房间！');
                    return;
                }
                html = '<table class="layui-table" lay-even="" lay-skin="nob">'
                    + '<colgroup><col width="200"><col></colgroup><tbody>'
                    + '<tr style="height: 60px"><td style="background-color: #FFFFFF"><b>房间名称</b></td><td style="background-color: #FFFFFF">' + room.name + '</td></tr>'
                    + '<tr style="height: 60px"><td style="background-color: #FFFFFF"><b>房间介绍</b></td><td style="background-color: #FFFFFF">' + room.getDescription() + '</td></tr>'
                    + '<tr style="height: 60px"><td style="background-color: #FFFFFF"><b>房间主题</b></td><td style="background-color: #FFFFFF">' + room.getSubject() + '</td></tr>'
                    + '<tr style="height: 60px"><td style="background-color: #FFFFFF"><b>当前人数</b></td><td style="background-color: #FFFFFF">' + room.getOccupants() + '</td></tr>'
                    + '<tr style="height: 60px"><td style="background-color: #FFFFFF"><b>创建日期</b></td><td style="background-color: #FFFFFF">' + XoW.utils.getFromatDatetime(room.getCreationdate()) + '</td></tr>'
                    + '<tr style="height: 60px"><td style="background-color: #FFFFFF"><b>房间性质</b></td><td style="background-color: #FFFFFF">'
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
                $('#groupSettile').html(html);
            }.bind(this));
            });
    }

    var _groupPeple = function (roomjid, roomname) {
        var groupFlag = 1;
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getRoomByJidFromServer,function(index,item){
            item&&item(roomjid,function (params) {
                var room = params.room;
                var roomInMuc ;
                //add by zjy for 消除Client依赖 [20190801]
                layui.each(call.getXmppRoom, function (index, item) {
                    item && item(roomjid, function (param) {
                        roomInMuc=param;
                    });
                });
                //console.log(roomInMuc);
                console.log(roomInMuc);
                if (null == room) {
                    _layer.msg('房间信息不存在！');
                    return;
                } else if (null == roomInMuc) {
                    _layer.msg('请先加入该房间！');
                    return;
                }
                var currentUserInMucRoom = roomInMuc.roster[roomInMuc.nick];
                var html = " ";
                if ('owner' === currentUserInMucRoom.affiliation || 'admin' === currentUserInMucRoom.affiliation) {
                    html += '<table class="layui-table" lay-even="" lay-skin="nob">'
                        + '<colgroup>'
                        + '<col width="100">'
                        + '<col width="80">'
                        + '<col width="80">'
                        + '</colgroup>'
                        + '<tbody>'
                        + '<tr  style="background-color: #FFFFFF">'
                        + '<td>全员会话权限：</td>'
                        + '<td><button class="layui-btn layui-btn-sm" layImEx-event = "banAllRoomMemberVoice" roomjid= "' + roomjid + '">全员禁言</button><button class="layui-btn layui-btn-sm" layImEx-event = "giveAllRoomMemberVoice"  roomjid= "' + roomjid + '">全员解除禁言</button></td>'
                        + '</tr>'
                        + '</tbody></table>';
                }
                html += '<table class="layui-table" lay-even="" lay-skin="nob">'
                    + '<colgroup>'
                    + '<col width="100">'
                    + '<col width="80">'
                    + '<col width="80">'
                    + '</colgroup>'
                    + '<thead><tr style="background-color: #FFFFFF"><th><b>昵称</b></th><th><b>权限</b></th><th><b>操作</b></th></tr></thead><tbody>'
                    + '<tr  style="background-color: #FFFFFF"><td>(本人)' + currentUserInMucRoom.nick + '</td><td>'
                    +
                    function () {
                        if ('owner' === currentUserInMucRoom.affiliation) {
                            return "所以者";
                        } else if ('admin' === currentUserInMucRoom.affiliation) {
                            return "管理员";
                        } else if ('member' === currentUserInMucRoom.affiliation) {
                            return "成员";
                        } else if ('visitor' === currentUserInMucRoom.role) {
                            return "禁言";
                        } else {
                            return "无";
                        }
                    }()

                //add by zjy for 转让群主按钮 [20190731]
                if ('owner' === currentUserInMucRoom.affiliation) {
                    html += '</td><td><div class="layui-btn layui-btn-danger layui-btn-sm groupMMM"    userjidd = "' + currentUserInMucRoom.jid + '"  powert = "OW"  romji = "' + roomjid + '"  style="width: 100px; height: 25px;text-align: center;line-height: 25px;font-size: 10px">解散房间</div>'
                        + '</td>' + '<td><div layImEx-event="transferOwner" id="transferOwner"  userroomjid = "' + roomjid + '" class="layim_sendbtn layui-btn layui-btn-sm "  style="width: 100px; height: 25px;text-align: center;line-height: 25px;font-size: 10px">转让群主</div></td></tr>';
                    groupFlag = 1;
                }
                else if ('admin' === currentUserInMucRoom.affiliation) {

                    html += '</td><td><div class="layui-btn  groupMMM"    userjidd = "' + currentUserInMucRoom.jid + '"  powert = "EX" romji = "' + roomjid + '" style="width: 100px; height: 25px;text-align: center;line-height: 25px;font-size: 10px">退出</div>'
                        + '</td></tr>';
                    groupFlag = 2;
                }
                else {
                    html += '</td><td><div class="layui-btn  groupMMM"    userjidd = "' + currentUserInMucRoom.jid + '"  powert = "EX"  romji = "' + roomjid + '"   style="width: 100px; height: 25px;text-align: center;line-height: 25px;font-size: 10px">退出</div>'
                        + '</td></tr>';
                    groupFlag = 3;
                }
                for (var key in roomInMuc.roster) {
                    var o = roomInMuc.roster[key];
                    if (roomInMuc.nick !== key) {
                        html +=
                            '<tr style="background-color: #FFFFFF"><td title="' + key + '">' + key
                            + '</td><td>' +
                            function () {
                                if ('owner' === o.affiliation) {
                                    return "所有者";
                                } else if ('admin' === o.affiliation) {
                                    return "管理员";
                                } else if ('member' === o.affiliation) {
                                    return "成员";
                                } else if ('visitor' === o.role) {
                                    return "禁言";
                                } else {
                                    return "无";
                                }
                            }()
                        if (groupFlag == 1) {
                            if ('admin' === o.affiliation) {
                                html += '</td><td style="background-color: #FFFFFF"><div class="layui-btn  groupMMM"   romji = "' + roomjid + '" userjidd = "' + o.jid + '"  powert = "ORM"  nicknick = "' + o.nick + '" style="width: 100px; height: 25px;text-align: center;line-height: 25px;font-size: 10px">移除</div>'
                                    + '</td></tr>';
                            }
                            else {
                                if (o.role === "visitor") {
                                    html += '</td><td style="background-color: #FFFFFF"><div class="layui-btn  groupSpeak"  kjid = "' + roomjid + '"  userjidd = "' + o.jid + '"  powert = "OP"  nicknick = "' + o.nick + '" style="width: 100px; height: 25px;text-align: center;line-height: 25px;font-size: 10px">解除禁言</div></td><td style="background-color: #FFFFFF"><div class="layui-btn  groupMMM"  romji = "' + roomjid + '"  userjidd = "' + o.jid + '"  powert = "RM"  nicknick = "' + o.nick + '" style="width: 100px; height: 25px;text-align: center;line-height: 25px;font-size: 10px">移除</div>'
                                        + '</td></tr>';
                                }
                                else {
                                    html += '</td><td style="background-color: #FFFFFF"><div class="layui-btn  groupSpeak"  kjid = "' + roomjid + '"  userjidd = "' + o.jid + '"  powert = "BP"  nicknick = "' + o.nick + '" style="width: 100px; height: 25px;text-align: center;line-height: 25px;font-size: 10px">禁言</div></td><td style="background-color: #FFFFFF"><div class="layui-btn  groupMMM"  romji = "' + roomjid + '"  userjidd = "' + o.jid + '"  powert = "RM"  nicknick = "' + o.nick + '" style="width: 100px; height: 25px;text-align: center;line-height: 25px;font-size: 10px">移除</div>'
                                        + '</td></tr>';
                                }
                            }
                        }
                        else if (groupFlag == 2) {
                            if ('owner' === o.affiliation) {
                                html += '</td><td style="background-color: #FFFFFF">无法操作'
                                    + '</td></tr>';
                            }
                            else if ('admin' === o.affiliation) {
                                html += '</td><td style="background-color: #FFFFFF">无法操作'
                                    + '</td></tr>';
                            }
                            else {
                                if (o.role === "visitor") {
                                    html += '</td><td style="background-color: #FFFFFF"><div class="layui-btn  groupSpeak"  kjid = "' + roomjid + '"  userjidd = "' + o.jid + '"  powert = "OP"  nicknick = "' + o.nick + '" style="width: 100px; height: 25px;background-color: #CCFFFF; color: #DD0000;text-align: center;line-height: 25px;font-size: 10px">解除禁言</div></td><td style="background-color: #FFFFFF"><div class="layui-btn  groupMMM"  romji = "' + roomjid + '" userjidd = "' + o.jid + '"  powert = "RM"  nicknick = "' + o.nick + '"  style="width: 100px; height: 25px;background-color: #CCFFFF; color: #DD0000;text-align: center;line-height: 25px;font-size: 10px">移除</div>'
                                        + '</td></tr>';
                                }
                                else {
                                    html += '</td><td style="background-color: #FFFFFF"><div class="layui-btn  groupSpeak" kjid = "' + roomjid + '"  userjidd = "' + o.jid + '"  powert = "BP"  nicknick = "' + o.nick + '" style="width: 100px; height: 25px;background-color: #CCFFFF; color: #DD0000;text-align: center;line-height: 25px;font-size: 10px">禁言</div></td><td style="background-color: #FFFFFF"><div class="layui-btn  groupMMM"  romji = "' + roomjid + '"  userjidd = "' + o.jid + '"  powert = "RM"  nicknick = "' + o.nick + '"  style="width: 100px; height: 25px;background-color: #CCFFFF; color: #DD0000;text-align: center;line-height: 25px;font-size: 10px">移除</div>'
                                        + '</td></tr>';
                                }
                            }
                        }
                        else if (groupFlag == 3) {
                            html += '</td><td style="background-color: #FFFFFF">无法操作'
                                + '</td></tr>';
                        }
                    }
                }
                html += '</tbody></table>';
                $('#groupPeople').html(html);
            }.bind(this));
        });

    }

    //add by zjy for 获取群成员 [20190731]
    var _groupPepleToowner = function (roomjid, roomname) {
        var groupFlag = 1;
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getRoomByJidFromServer,function(index,item){
            item&&item(roomjid, function (params) {
                var room = params.room;
                var roomInMuc ;
                //add by zjy for 消除Client依赖 [20190801]
                layui.each(call.getXmppRoom, function (index, item) {
                    item && item(roomjid, function (param) {
                        roomInMuc=param;
                    });
                });
                if (null == room) {
                    _layer.msg('房间信息不存在！');
                    return;
                } else if (null == roomInMuc) {
                    _layer.msg('请先加入该房间！');
                    return;
                }
                var currentUserInMucRoom = roomInMuc.roster[roomInMuc.nick];
                var html = "";
                html += '<table class="layui-table "  lay-skin="nob" style="width:600px ;">'
                    + '<thead><tr style="background-color: #FFFFFF;width: 600px"><th style="width: 300px"><b>昵称</b></th><th style="width:300px"><b>操作</b></th></tr></thead><tbody>';
                for (var key in roomInMuc.roster) {
                    var o = roomInMuc.roster[key];
                    if (roomInMuc.nick !== key) {
                        html +=
                            '<tr style="background-color: #FFFFFF"><td title="' + key + '">' + key
                            + '</td>'
                        html += '<td style="background-color: #FFFFFF"><div class="layui-btn  groupMMM" layimex-event="changeRoomOwner"  romji = "' + roomjid + '" userjidd = "' + o.jid + '"  powert = "ORM"  nicknick = "' + o.nick + '" style="width: 100px; height: 25px;text-align: center;line-height: 25px;font-size: 10px">转让给他</div>'
                            + '</td></tr>';
                    }
                }
                html += '</tbody></table>';
                $('#roomMemberToOwnerlist').html(html);
            }.bind(this));
        });
    }



    //add by zjy for 转让群主面板html [20190731]
    var transerOwnerr = [
        '<div class="layui-container" style="margin:0px;padding:0px;width:100%">',
        '<div class="layui-row"  style="margin:0px;padding:0px;margin-top: 10px;">',
        '<div class="layui-col-xs8">',
        '<input type="text" name="cxxcx"  lay-verify="required" placeholder="请输入搜索内容" autocomplete="off" class="layui-input" style="width: 100%;margin-left: 10px">',
        '</div>',
        '<div class="layui-col-xs3" >',
        '<button class="layui-btn" layimex-event="search_user_inroom" id="btn_search_user_inroom" style="margin-left: 20px" >搜索</button>',
        '</div>',
        '</div>',
        '</div>',
        // '<div class="layui-container" width="100%" style="width="100%">',
        // '<div class="layui-row ">',
        '<div style="width="100%" id="roomMemberToOwnerlist">',
        // '</div>',
        //  '</div>',
        '</div>'

    ].join('')
    var _groupConfig = function (roomjid, roomname) {
        _getRoomConfig(roomjid, function (params) {
            var fields = params.fields;
            var html = _roomConfigHtml(fields, roomjid);
            $('#groupConfig').html(html);

        }.bind(this), function (errorStanza) {
            var html = "你的权限不够";
            html += '<br><table class="layui-table" lay-even="" lay-skin="nob" style="background-color: white">  <tr style="background-color: white"><td><div id="removeMe" userjiddd = "' + roomjid + '" class="layim_sendbtn layui-btn layui-btn-warm  layui-btn-sm  layui-btn-radius">退出群组</div></td></tr></table>';
            $('#groupConfig').html(html);
        }.bind(this));
    }
    // var  _cancelOutcastMem = function(roomjid,roomname){
    //   let html = "";
    //   _getOutCastMember(roomjid,function (params) {
    //     $('item',params).each(function (index,item) {
    //       let jid = $(item).attr("jid");
    //       html +='<tr  style="background-color: #FFFFFF"><td>'+XoW.utils.getNodeFromJid(jid)+'</td><td><button class="layui-btn layui-btn-sm" layImEx-event = "removeOutcast" jid = "'+jid+'" roomjid = "'+roomjid+'" >解除黑名单</button></td></tr>'
    //     })
    //     $('#cancelOutcast').html(html);
    //   }.bind(this),function (error) {
    //     _layer.msg('解除黑名单失败！');
    //   })
    // }
    var _getOutCastMember = function (roomjid, successCb, errorCb) {
        var user ;
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getCurrentUser, function (index, item) {
            item && item( function (params) {
                user=params.jid;
            });
        });
        let iq = $iq({
            from:user,
            id: XoW.utils.getUniqueId("Outcast"),
            to: roomjid,
            type: "get"
        }).c('query', {xmlns: 'http://jabber.org/protocol/muc#admin'}).c('item', {affiliation: 'outcast'})
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.sendIq,function(index,item){
            item&&item(iq, successCb, errorCb);
        });
    }

    var _dealWithInviting = function (roomJid, index) {
        let items = document.getElementsByClassName('AreadyC');
        let invites = [];
        for (let i = 0; i < items.length; i++) {
            let t = $(items[i]);
            let invitText = $.trim(t.text());
            invites.push(invitText)
        }
        let reason = 'i want to invet to you';
        _inviteingRoom(roomJid, invites, reason);
        $('#arradyChoice').empty();
        _layer.close(index)
    }
    var _inviteingRoom = function (roomJid, invites, reason) {
        var sid = XoW.utils.getUniqueId("invitRoom");
        var receiver;
        var user ;
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getCurrentUser, function (index, item) {
            item && item( function (params) {
                user=params.jid;
            });
        });
        var invitation = $msg({
            from: user,
            to: roomJid,
            id: sid
        }).c('x', {
            xmlns: Strophe.NS.MUC_USER
        });
        for (var i = 0, len = invites.length; i < len; i++) {
            receiver = invites[i];
            invitation.c('invite', {
                to: receiver
            });
            if (reason != null) {
                invitation.c('reason', reason);
                invitation.up();
            }
            invitation.up();
        }
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.sendMsg,function(index,item){
            item&&item(invitation);
        });
    };
    var _roomAdminSeting = function (roomjid) {
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getRoomByJidFromServer,function(index,item){
            item&&item(roomjid, function (params) {
                var html = "这是群组对管理者进行管理";
                var room = params.room;
                var roomInMuc ;
                //add by zjy for 消除Client依赖 [20190801]
                layui.each(call.getXmppRoom, function (index, item) {
                    item && item(roomjid, function (param) {
                        roomInMuc=param;
                    });
                });
                if (null == room) {
                    _layer.msg('房间信息不存在！');
                    return;
                } else if (null == roomInMuc) {
                    _layer.msg('请先加入该房间！');
                    return;
                }
                var currentUserInMucRoom = roomInMuc.roster[roomInMuc.nick];
                html = '<table class="layui-table" lay-skin="nob" lay-size="lg">'
                    + '<colgroup>'
                    + '<col width="100">'
                    + '<col width="80">'
                    + '</colgroup>'
                    + '<thead><tr style="background-color: #FFFFFF;"><th><b>成员</b></th><th><b>操作</b></th></tr></thead><tbody>'
                var admins = $('#roomConfigRoomAdmins').text();
                var owert ;
                //add by zjy for 消除Client依赖 [20190801]
                layui.each(call.getCurrentUser, function (index, item) {
                    item && item( function (params) {
                        owert=params.jid;
                    });
                });
                var tt = admins.split(",");
                for (var i = 0; i < tt.length; i++) {
                    if (tt[i] != '') {
                        html += '<tr><td><span>' + tt[i] + '</span></td><td><input class="selectAdmins" type="checkbox" ' + function () {
                            return 'checked';
                        }() + '/></td></tr>'
                    }
                }
                for (var key in roomInMuc.roster) {
                    var o = roomInMuc.roster[key];
                    if (roomInMuc.nick !== key) {
                        if (o.jid != owert) {
                            if (o.jid != ' ') {
                                var groupFlagrt = false;
                                for (var j = 0; j < tt.length; j++) {
                                    if (tt[j] == XoW.utils.getBareJidFromJid(o.jid)) {
                                        groupFlagrt = true;
                                        break;
                                    }
                                }
                                if (groupFlagrt == false) {
                                    html += '<tr><td><span class="selectAdminsjid">' + XoW.utils.getBareJidFromJid(o.jid) + '</span></td><td><input class="selectAdmins" type="checkbox" ' + function () {
                                        return '';
                                    }() + '/></td></tr>'
                                }
                            }
                        }
                    }
                }
                html += '</tbody></table>';
                _layer.open({
                    anim: 1,
                    type: 1,
                    title: '添加管理员',
                    scrollbar: false,
                    area: ['600px', '500px'],
                    content: html,
                    btn: ['保存'],
                    yes: function (index, layero) {
                        var oDiv = document.getElementsByClassName("selectAdmins");
                        var preValue = [];
                        for (var i = 0; i < oDiv.length; i++) {
                            (function (i) {
                                if (oDiv[i].checked == true) {
                                    var tr1 = oDiv[i].parentNode.parentNode;
                                    preValue.push(tr1.cells[0].innerText);
                                }
                            })(i)
                        }
                        var S = preValue.join(",");
                        $('#roomConfigRoomAdmins').text(S);
                        layer.close(index);
                    }
                });

            }.bind(this));
        });
    }
    var _giveSpeaking = function (roomjid, nick, handle_cb, error_cb) {
        var user ;
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getCurrentUser, function (index, item) {
            item && item( function (params) {
                user=params.jid;
            });
        });
        var iq = $iq({
            id: XoW.utils.getUniqueId("giveS"),
            from: user,
            to: roomjid,
            type: "set"
        }).c("query", {xmlns: 'http://jabber.org/protocol/muc#admin'}).c('item', {
            nick: nick,
            role: 'participant'
        }).c('reason', "you need it");
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.sendIq,function(index,item){
            item&&item(iq, handle_cb, error_cb);
        });
    }
    var _avoidSpeak = function (roomjid, nick, handle_cb, error_cb) {
        var user ;
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getCurrentUser, function (index, item) {
            item && item( function (params) {
                user=params.jid;
            });
        });
        var iq = $iq({
            id: XoW.utils.getUniqueId("roomInfo"),
            from: user,
            to: roomjid,
            type: "set"
        }).c("query", {xmlns: 'http://jabber.org/protocol/muc#admin'}).c('item', {
            nick: nick,
            role: 'visitor'
        }).c('reason', "Not so worthy after all!");
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.sendIq,function(index,item){
            item&&item(iq, handle_cb, error_cb);
        });
    }
    var _destroying = function (roomjid, handle_cb, error_cb) {
        var user ;
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getCurrentUser, function (index, item) {
            item && item( function (params) {
                user=params.jid;
            });
        });
        var iq = $iq({
            id: XoW.utils.getUniqueId("destroy"),
            from: user,
            to: roomjid,
            type: 'set'
        }).c('query', {xmlns: 'http://jabber.org/protocol/muc#owner'}).c('destroy', {jid: roomjid});
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.sendIq,function(index,item){
            item&&item(iq, handle_cb, error_cb);
        });
    }
    var _outcast_someonet = function (roomjid, nick, handle_cb, error_cb) {
        var user ;
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getCurrentUser, function (index, item) {
            item && item( function (params) {
                user=params.jid;
            });
        });
        var iq = $iq({
            id: XoW.utils.getUniqueId("roomInfo"),
            from: user,
            to: roomjid,
            type: "set"
        }).c("query", {xmlns: 'http://jabber.org/protocol/muc#admin'}).c('item', {
            nick: nick,
            role: 'none'
        }).c('reason', "goodbye");
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.sendIq,function(index,item){
            item&&item(iq, handle_cb, error_cb);
        });
    };
    var _firstreMove = function (roomjid, nivkjid, handle_cb, error_cb) {
        var user ;
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getCurrentUser, function (index, item) {
            item && item( function (params) {
                user=params.jid;
            });
        });
        var iq = $iq({
            id: XoW.utils.getUniqueId("roomInfo"),
            from: user,
            to: roomjid,
            type: "set"
        }).c("query", {xmlns: 'http://jabber.org/protocol/muc#admin'}).c('item', {affiliation: 'member', jid: nivkjid});
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.sendIq,function(index,item){
            item&&item(iq, handle_cb, error_cb);
        });
    }

    var _newroomConfigSubmit = function (roomJid) {
        _getRoomConfig(roomJid, function (params) {
            var fields = params.fields;
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
            // if ($('#roomConfigEnableLogging').is(':checked')) {
            //   fields['muc#roomconfig_enablelogging'].value = 1;
            // } else {
            fields['muc#roomconfig_enablelogging'].value = 0;
            // }
            // if ($('#roomConfigReservedNick').is(':checked')) {
            //   fields['x-muc#roomconfig_reservednick'].value = 1;
            // } else {
            fields['x-muc#roomconfig_reservednick'].value = 0;
            // }
            // if ($('#roomConfigCanChangeNick').is(':checked')) {
            fields['x-muc#roomconfig_canchangenick'].value = 1;
            // } else {
            //   fields['x-muc#roomconfig_canchangenick'].value = 0;
            // }
            // if ($('#roomConfigRegistration').is(':checked')) {
            fields['x-muc#roomconfig_registration'].value = 1;
            // } else {
            //   fields['x-muc#roomconfig_registration'].value = 0;
            // }
            fields['muc#roomconfig_persistentroom'].value = 1;
            fields['muc#roomconfig_moderatedroom'].value = 1;
            fields['muc#roomconfig_maxusers'].value = $('#roomConfigMaxusers :selected').text();
            fields['muc#roomconfig_whois'].value = 'anyone'
            var presValues = [];
            presValues.push('moderator');
            presValues.push('participant');
            presValues.push('visitor');
            fields['muc#roomconfig_presencebroadcast'].value = presValues;
            var admins = $('#roomConfigRoomAdmins').text();
            fields['muc#roomconfig_roomadmins'].value = admins.split(",");
            let OwnerRoom;
            //add by zjy for 消除Client依赖 [20190801]
            layui.each(call.getCurrentUser, function (index, item) {
                item && item( function (params) {
                    OwnerRoom=params.jid;
                });
            });
            fields['muc#roomconfig_roomowners'].value = OwnerRoom.split(",");
            //add by zjy for 消除Client依赖 [20190801]
            layui.each(call.saveRoomConfig,function(index,item){
                item&&item(roomJid, fields, function () {
                    _layer.alert('操作成功！', 10);
                }, function () {
                    _layer.msg('失败');
                });
            });

        }.bind(this));
    }.bind(this);

    var _getRoomConfig = function (roomJid, successCb, errorCb) {
        XoW.logger.ms(_this.classInfo + "getRoomConfig");
        var iq = $iq({
            id: XoW.utils.getUniqueId('roomConfig'),
            to: roomJid,
            type: 'get',
        }).c('query', {
            xmlns: Strophe.NS.MUC_OWNER,
        });
        XoW.logger.me(_this.classInfo + "getRoomConfig");
        //add by zjy for 消除Client依赖 [20190801]
        return layui.each(call.sendIq,function(index,item){
            item&&item(iq, function (stanza) {
                var $stanza = $(stanza);
                var fields = [];
                $('field', $stanza).each(function (index, item) {
                    var $item = $(item);
                    if ($item.attr('var')) {
                        switch ($item.attr('var')) {
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
                                    'var': $item.attr('var'),
                                    type: $item.attr('type'),
                                    label: $item.attr('label'),
                                    value: $('value', $item).text(),
                                };
                                break;
                            case 'muc#roomconfig_maxusers' :
                            case 'muc#roomconfig_whois' :
                                options = [];
                                $item.find('option').each(function (index2, option) {
                                    var $option = $(option);
                                    options.push({
                                        label: $option.attr('label'),
                                        value: $('value', $option).text(),
                                    });
                                });
                                fields[$item.attr('var')] = {
                                    'var': $item.attr('var'),
                                    type: $item.attr('type'),
                                    label: $item.attr('label'),
                                    value: $item.children('value').text(),
                                    options: options,
                                };
                                break;
                            case 'muc#roomconfig_presencebroadcast' :
                                options = [];
                                $item.find('option').each(function (index2, option) {
                                    var $option = $(option);
                                    options.push({
                                        label: $option.attr('label'),
                                        value: $('value', $option).text(),
                                    });
                                });
                                values = [];
                                $item.children('value').each(function (index2, value) {
                                    values.push($(value).text());
                                });
                                fields[$item.attr('var')] = {
                                    'var': $item.attr('var'),
                                    type: $item.attr('type'),
                                    label: $item.attr('label'),
                                    value: values,
                                    options: options,
                                };
                                break;
                            case 'muc#roomconfig_roomadmins' :
                            case 'muc#roomconfig_roomowners' :
                                values = [];
                                $item.children('value').each(function (index2, value) {
                                    values.push($(value).text());
                                });
                                fields[$item.attr('var')] = {
                                    'var': $item.attr('var'),
                                    type: $item.attr('type'),
                                    label: $item.attr('label'),
                                    value: values,
                                };
                                break;
                        }
                    }
                });
                if (successCb) {
                    var params = {
                        stanza: stanza,
                        fields: fields
                    };
                    successCb(params);
                }
            }, errorCb);
        });
        XoW.logger.me(_this.classInfo + "getRoomConfig");
    }

    var _roomConfigHtml = function (fields, roomjid) {
        var html = '<table class="layui-table" lay-skin="nob">'
            + '<tr><td><span><b>允许任何人修改主题</b></span></td><td><input id="roomConfigChangeSubject" type="checkbox" ' + function () {
                if (1 == fields['muc#roomconfig_changesubject'].value) {
                    return 'checked';
                }
                return '';
            }() + '/></td></tr>'
            + '<tr><td><span><b>公开的房间</b></span></td><td><input id="roomConfigPublicRoom" type="checkbox" ' + function () {
                if (1 == fields['muc#roomconfig_publicroom'].value) {
                    return 'checked';
                }
                return '';
            }() + '/></td></tr>'
            + '<tr><td><span><b>仅对成员开放的房间</b></span></td><td><input id="roomConfigMembersOnly" type="checkbox" ' + function () {
                if (1 == fields['muc#roomconfig_membersonly'].value) {
                    return 'checked';
                }
                return '';
            }() + '/></td></tr>'
            + '<tr><td><span><b>允许任何人邀请其他人</b></span></td><td><input id="roomConfigAllowInvites" type="checkbox" ' + function () {
                if (1 == fields['muc#roomconfig_allowinvites'].value) {
                    return 'checked';
                }
                return '';
            }() + '/></td></tr>'
            + '<tr><td><span><b>开启密码</b></span></td><td><input id="roomConfigPasswordProtectedRoom" type="checkbox" ' + function () {
                if (1 == fields['muc#roomconfig_passwordprotectedroom'].value) {
                    return 'checked';
                }
                return '';
            }() + '/></td></tr>'
            + '<tr><td><span><b>密码</b></span></td><td><input id="roomConfigRoomSecret" type="password" value="' + fields['muc#roomconfig_roomsecret'].value + '" /></td></tr>'
            // + '<tr><td><span><b>登录房间对话</b></span></td><td><input id="roomConfigEnableLogging" type="checkbox" ' + function () {
            //   if (1 == fields['muc#roomconfig_enablelogging'].value) {
            //     return 'checked';
            //   }
            //   return '';
            // }() + '/></td></tr>'
            // + '<tr><td><span><b>仅允许注册的昵称登录</b></span></td><td><input id="roomConfigReservedNick" type="checkbox" ' + function () {
            //   if (1 == fields['x-muc#roomconfig_reservednick'].value) {
            //     return 'checked';
            //   }
            //   return '';
            // }() + '/></td></tr>'
            // + '<tr><td><span><b>允许使用者修改昵称</b></span></td><td><input id="roomConfigCanChangeNick" type="checkbox" ' + function () {
            //   if (1 == fields['x-muc#roomconfig_canchangenick'].value) {
            //     return 'checked';
            //   }
            //   return '';
            // }() + '/></td></tr>'
            // + '<tr><td><span><b>允许使用者注册房间<b></span></td><td><input id="roomConfigRegistration" type="checkbox" ' + function () {
            //   if (1 == fields['x-muc#roomconfig_registration'].value) {
            //     return 'checked';
            //   }
            //   return '';
            // }() + '/>'
            + '<tr><td><span><B>最大房间使用者</B></span></td><td><select id="roomConfigMaxusers">'
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
            }() + '</select></td></tr>'
            // + '<tr><td><span><B>能够发现占有者真实jid的角色</B></span></td><td><select id="roomConfigWhoIs">'
            // + function () {
            //   var html = '';
            //   for (var i = 0; i < fields['muc#roomconfig_whois'].options.length; i++) {
            //     var value = fields['muc#roomconfig_whois'].options[i].value;
            //     var select = '';
            //     if (fields['muc#roomconfig_whois'].value == value) {
            //       select = 'selected';
            //     }
            //     html += '<option ' + select + ' value="' + value + '">' + fields['muc#roomconfig_whois'].options[i].label + '</option>';
            //   }
            //   return html;
            // }() + '</select></td></tr>'
            + '<tr><td><span><b>房间管理员</b></span></td>'
            + '<td><div id="roomConfigRoomAdmins" style="width:150px;overflow: hidden;white-space:nowrap;text-overflow:ellipsis;">'     //(以英文逗号隔开)
            + function () {
                var html = '';
                for (var i = 0; i < fields['muc#roomconfig_roomadmins'].value.length; i++) {
                    if (i != 0) {
                        html += ',';
                    }
                    html += fields['muc#roomconfig_roomadmins'].value[i];
                }
                return html;
            }() + '</div></td>'
            + '<td><div class="layui-btn layui-btn-xs"  roomttjid = "' + roomjid + '" id="addAdmin" style="width: 30px; font-size: x-small" >添加 </div></td></tr>'
        var flagT = false;
        var jid;
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getCurrentUser, function (index, item) {
            item && item( function (params) {
                jid=params.jid;
            });
        });
        var meCurr = XoW.utils.getNodeFromJid(jid);
        for (var i = 0; i < fields['muc#roomconfig_roomowners'].value.length; i++) {
            if (i != 0) {
                html += ',';
            }
            if (meCurr == XoW.utils.getNodeFromJid(fields['muc#roomconfig_roomowners'].value[i])) {
                html += '<tr><td><div id="removeGroup" class="layim_sendbtn layui-btn layui-btn-danger layui-btn-sm"  layui-btn-sm  " userrrr = "' + roomjid + '">解散房间</div></td><td><div id="newroomConfigSubmit"  userroomjid = "' + roomjid + '" class="layim_sendbtn layui-btn layui-btn-sm " style="margin-left: 110px">保存设置</div></td></tr>';
                flagT = true;
                break;
            }
        }
        if (flagT == false) {
            html += '<tr><td><div id="removeMe" userjiddd = "' + roomjid + '" class="layim_sendbtn layui-btn layui-btn-sm layui-btn-danger  layui-btn-sm ">退出房间</div></td><td><div id="newroomConfigSubmit" userroomjid = "' + roomjid + '" class="layim_sendbtn layui-btn layui-btn-sm ">保存设置</div></td></tr>';
        }
        return html;
    };

    var _createChatingRoom = function () {
        XoW.logger.ms(_this.classInfo + "创建房间");
        let data = {
            roomname: "创建聊天室"
        };
        let html = _layTpl(_eleCreateChatRoomhtml).render(data);
        var user;
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getCurrentUser, function (index, item) {
            item && item( function (params) {
                user=params.jid;
            });
        });
        let index = _layer.open({
            type: 1,
            title: '创建聊天室',
            area: ['602px', '522px'],
            content: html,
            close: function () {
                _layer.close(index);
            }
        });
        _layForm.render();

    }

    _layForm.on('checkbox(checkInnvetion)', function (obj) {
        let data = $(obj.elem);
        let jid = data.attr('data-jid')
        let check = obj.elem.checked;
        if (check == true) {
            $('#arradyChoice').append('<div class = "All' + XoW.utils.getNodeFromJid(jid) + '" style="margin-bottom: 5px"><span  data-jid = "' + jid + '" class = "A' + XoW.utils.getNodeFromJid(jid) + ' AreadyC" name="A' + XoW.utils.getNodeFromJid(jid) + '">' + jid + '</span>&nbsp;<button data-jid = "' + jid + '" layImEx-event = "removeInvitedFriend" class="layui-btn  layui-btn-xs">移除</button></div>');
            if (data.attr('isSvert') == "true") {
                $('.Not' + XoW.utils.getNodeFromJid(data.attr("data-jid")) + ' ').prop('checked', true)
            }
        }
        else {
            $('#arradyChoice .All' + XoW.utils.getNodeFromJid(jid) + '').remove();
            if (data.attr('isSvert') == "true") {
                $('.Not' + XoW.utils.getNodeFromJid(data.attr("data-jid")) + ' ').prop('checked', false)
            }
        }
        _layForm.render();
    });

    //writePaasword  givePasswordToRoom
    _layForm.on('checkbox(writePaasword)', function (obj) {
        if (obj.elem.checked == true) {
            let html = `<div class="layui-col-md12">
                     <label class="layui-form-label">房间密码：</label>
                     <div class="layui-input-block">
                     <input type="text" name="roomPassword"   placeholder="请输入房间密码" autocomplete="off" class="layui-input" id="roomPassword">
                     </div>
                     </div>`;
            $("#givePasswordToRoom").html(html)
        } else {
            $("#givePasswordToRoom").html(" ")
        }
        _layForm.render();
    });
var  _makeChatingRoom = function () {
    let roomName = $('#createRoomnname').val();
    let  regex = /^(?!_)(?!.*?_$)[a-zA-Z0-9_\u4e00-\u9fa5]+$/
    if(regex.test(roomName)==false){
      _layer.msg("房间名称只能包含字母、数字、-、_");
      return;
    }
    let roomDesc = $('#roomDesc').val();
    let roomPeopleNums = $('input[name="roomPeoleNum"]:checked ').val();
    let isPasswordRoom = $('input[name="isRoomPassword"]:checked ').val();
    let isMemberRoom = $('input[name="isMemberRoom"]:checked ').val();
    let isSecretRoom = $('input[name="isSecretRoom"]:checked ').val();
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
      if($('#roomPassword').val().length>0){
        passwordSwitch = 1;
        roomPassword = $.trim($('#roomPassword').val());
      }
      else{
        _layer.msg("密码不能为空！");
        return;
      }
    }
    var user = _client.getCurrentUser();
    if (!roomName) {
      _layer.msg("请输入有效的房间地址！");
      return;
    }
    var roomServerAbility = _client.getServerMgr().getAbilityByCategroy('conference', 'text');
    if (!roomServerAbility) {
      _layer.msg("没有房间服务器！");
      return;
    }
    var roomJid = roomName.toLocaleLowerCase() + "@" + roomServerAbility.jid;
    _client.getRoomMgr().getRoomByJidFromServer(roomJid, function (params) {
      var isRoom = _client.getRoomMgr().getRoomByJid(roomJid);
      if(isRoom!=null){
        _layer.msg("你创建的房间地址已被使用，该房间存在");
      }
      _layer.close(layer.index)
    }.bind(this), function (errorStanza) {
      var errorCode = $('error', $(errorStanza)).attr('code');
      if (404 == errorCode) {
        XoW.logger.d(this.classInfo + "房间不存在，可以创建该房间");
        _layer.close(layer.index)
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
              _layIM.chat(roomlist);
              // _client.getPresMgrr().sendOnlineToRoom(roomJid);
            }.bind(this), function () {
              // 创建失败
              _layer.close(layer.index)
              _layer.msg('创建失败');
              XoW.logger.d('创建失败');
            });

      } else {
        _layer.msg('未知错误，错误代码：' + errorCode);
      }
    }.bind(this));
  }
    var _createMeetingRoom = function () {
        XoW.logger.ms(_this.classInfo + "创建房间");
        let data = {
            roomname: "创建会议室"
        };
        let html = _layTpl(_eleCreateMeetingRoomhtml).render(data);
        var user;
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getCurrentUser, function (index, item) {
            item && item( function (params) {
                user=params;
            });
        });
        let index = _layer.open({
            type: 1,
            title: '创建会议室',
            area: ['602px', '522px'],
            content: html,
            close: function () {
                _layer.close(index);
            }
        });
        _layForm.render();
    }
    var _makeMeetingRoom = function () {
        let roomName = $('#createMeetingRoomnname').val();
	    let  regex = /^(?!_)(?!.*?_$)[a-zA-Z0-9_\u4e00-\u9fa5]+$/
	    if(regex.test(roomName)==false){
	       _layer.msg("房间名称只能包含字母、数字、-、_");
	       return;
	    }
        let roomDesc = $('#roomMeetingDesc').val();
        let roomPeopleNums = $('input[name="roomPeoleNum"]:checked ').val();
        var user ;
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getCurrentUser, function (index, item) {
            item && item( function (params) {
                user=params;
            });
        });
        if (!roomName) {
            _layer.msg("请输入有效的房间地址！");
            return;
        }
        var roomServerAbility ;
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getAbilityByCategroy,function(index,item){
            item&&item('conference', 'text', function(param){
                roomServerAbility=param;
            });
        });
        if (!roomServerAbility) {
            _layer.msg("没有房间服务器！");
            return;
        }
        var roomJid = roomName.toLocaleLowerCase() + "@" + roomServerAbility.jid; //房间jid
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getRoomByJidFromServer,function(index,item){
            item&&item(roomJid,function (params) {
                // 房间存在
                var isRoom ;
                //add by zjy for 消除Client依赖 [20190801]
                layui.each(call.getRoomByJid,function(index,item){
                    item&&item(roomJid,function(param){
                        isRoom=param;
                    });
                });
                if (isRoom != null) {
                    _layer.msg("你创建的房间地址已被使用，该房间存在");
                }
                _layer.close(layer.index)
            }.bind(this), function (errorStanza) {
                var errorCode = $('error', $(errorStanza)).attr('code');
                if (404 == errorCode) {
                    XoW.logger.d(_this.classInfo + "房间不存在，可以创建该房间");
                    _layer.close(layer.index);
                    //add by zjy for 消除Client依赖 [20190801]
                    layui.each(call.createRoom,function(index,item){
                        item&&item(roomJid,
                            XoW.utils.getNodeFromJid(user.getFullJid()),
                            XoW.utils.getNodeFromJid(user.getFullJid()), function (params) {
                                var roomJid = params.roomJid;
                                var name = XoW.utils.getNodeFromJid(roomJid);
                                var peopleNumber = 0;
                                var nick = params.nick;
                                var room = new XoW.Room();
                                room.jid = roomJid;
                                room.name = name;
                                room.id = room.name;
                                //add by zjy for 消除Client依赖 [20190801]
                                layui.each(call.pushRoom,function(index,item){
                                    item&&item(room);
                                });
                                XoW.logger.d('创建成功！' + roomJid + " " + name);
                                var roomlist = {
                                    type: 'group',
                                    groupname: name,
                                    username: name,
                                    jid: roomJid,
                                    id: name,
                                    avatar: "../skin/images/avatar_room.png",
                                    isPersistent: false,
                                    isUnsecured: true
                                };
                                _getRoomConfig(roomJid, function (params) {
                                    var fields = params.fields;
                                    fields['muc#roomconfig_roomdesc'].value = roomDesc;
                                    fields['muc#roomconfig_maxusers'].value = roomPeopleNums;
                                    //add by zjy for 消除Client依赖 [20190801]
                                    layui.each(call.saveRoomConfig,function(index,item){
                                        item&&item(roomJid, fields, function () {
                                            _layer.msg('初始化成功！');
                                        }, function () {
                                            _layer.msg('初始化失败');
                                        });
                                    });
                                }.bind(this));
                                _layIM.addList(roomlist);
                                //add by zjy for 消除Client依赖 [20190801]
                                layui.each(call.saveOutAllRoom,function(index,item){
                                    item&&item(roomlist);
                                });
                                _roomRefresh()
                                _layIM.chat(roomlist);
                                //add by zjy for 消除Client依赖 [20190801]
                                layui.each(call.sendOnlineToRoom,function(index,item){
                                    item&&item(roomJid);
                                });
                            }.bind(this), function () {
                                // 创建失败
                                _layer.msg('创建失败');
                                XoW.logger.d('创建失败');
                            });
                    });
                } else {
                    _layer.msg('未知错误，错误代码：' + errorCode);
                    _layer.close(layer.index)
                }
            }.bind(this));
        });
    }
    var _meetingRoomSeting = function (roomjid, roomname, ev) {
        var index = _layer.open({
            type: 1,
            title: '会议室设置',
            shade: [0],
            scrollbar: false,
            area: ['602px', '522px'],
            offset: ['80px', ''],
            content: _getmeetingRoomSetingHTMl(roomjid, roomname),
            close: function () {
                _layer.close(index);
            }
        });
        _layerIndex["ROOMSETPANEL"] = index;

        _getRoomPeople(roomjid, roomname)
        _getRoomSeting(roomjid, roomname)
        _layForm.render();
    }
    var _getRoomSeting = function (roomjid, roomname, ev) {
        let html = [
            '<div class="layui-col-xs3">'
            , '<ul id="roomSetingDetails">'
            , '<li style="height: 32px; line-height: 32px;">修改房间主题</li>'
            // ,'<li style="height: 32px; line-height: 32px;margin-top: 10px">允许邀请</li>'
            , '<li style="height: 32px; line-height: 32px;margin-top: 10px">房间最大人数</li>'
            , '<li style="height: 32px; line-height: 32px;margin-top: 10px"><button type="button" class="layui-btn layui-btn-xs" layImEx-event="roomDisband" data-roomjid = "' + roomjid + '">解散会议室</button></li>'
            , '</ul>'
            , '</div>'
            , '<div class="layui-col-xs6">'
            , '<ul id="roomSetingDswitch">'
            , '</ul>'
            , '</div>'
        ].join('')
        _getRoomConfig(roomjid, function (params) {
            $('#showRoomSteing').html(html);
            _layForm.render()
            var fields = params.fields;
            if (1 == fields['muc#roomconfig_changesubject'].value) {
                $('#roomSetingDswitch').append('<li><input type="checkbox" name="switch" lay-skin="switch" id="roomTitleSwitch" value="1" lay-text="ON|OFF" checked></li>')
            }
            else {
                $('#roomSetingDswitch').append('<li><input type="checkbox" name="switch" lay-skin="switch" id="roomTitleSwitch" value="1" lay-text="ON|OFF"></li>')
            }
            // if (1 == fields['muc#roomconfig_allowinvites'].value) {
            //     $('#roomSetingDswitch').append('<li style="margin-top: 10px"><input type="checkbox" name="switch" lay-skin="switch" id="roomInviteSwitch" lay-text="ON|OFF" checked></li>')
            // }
            // else{
            //     $('#roomSetingDswitch').append('<li style="margin-top: 10px"><input type="checkbox" name="switch" lay-skin="switch" id="roomInviteSwitch" lay-text="ON|OFF"></li>')
            // }
            $('#roomSetingDswitch').append('<li style="margin-top: 10px;height: 32px;line-height: 32px" id="roomsetingNumbers">' + fields['muc#roomconfig_maxusers'].value + '</li>')
            $('#roomSetingDswitch').append('<li style="height: 32px; line-height: 32px;margin-top: 10px"><button type="button"  class="layui-btn layui-btn-xs" layImEx-event="saveRoomCOfig" data-roomjid = "' + roomjid + '">保存设置</button></li>')
            _layForm.render()
        }.bind(this), function (errorStanza) {
            let htmll = "你的权限不够";
            htmll += '<button type="button" class="layui-btn layui-btn-xs" layImEx-event="quitRoom" data-roomjid = "' + roomjid + '">退出会议室</button></li>'
            $('#showRoomSteing').html(htmll);
            _layForm.render()
        }.bind(this));
    }

    var _getRoomDetail = function (roomjid, roomname) {
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getRoomByJidFromServer,function(index,item){
            item&&item(roomjid, function (params) {
                var room = params.room;
                var roomInMuc ;
                //add by zjy for 消除Client依赖 [20190801]
                layui.each(call.getXmppRoom, function (index, item) {
                    item && item(roomjid, function (param) {
                        roomInMuc=param;
                    });
                });
                if (null == room) {
                    _layer.msg('房间信息不存在！');
                    return;
                } else if (null == roomInMuc) {
                    _layer.msg('请先加入该房间！');
                    return;
                }
                var html = [
                    '<div class="layim-vcard">'
                    , '<li>'
                    , '<div class="layui-form-item" style="margin-left: 10px"><label class="label"><b>房间名称：</b></label><div style="height:39.6px;line-height: 39.6px; margin-left: 30px">' + room.name + '</div></div>'
                    , '<div class="layui-form-item"  style="margin-left: 10px"><label class="label"><b>房间介绍：</b></label><div style="height:39.6px;line-height: 39.6px; margin-left: 30px">' + room.getDescription() + '</div><img  src="../skin/images/avatar_room.png" class="layui-circle layim-vcard-avatar"></div>'
                    , '<div class="layui-form-item"  style="margin-left: 10px"><label class="label"><b>房间主题： </b></label><div style="height:39.6px;line-height: 39.6px; margin-left: 30px">' + room.getSubject() + '</div></div>'
                    , '<div class="layui-form-item"  style="margin-left: 10px"><label class="label"><b>当前人数： </b></label><div style="height:39.6px;line-height: 39.6px; margin-left: 30px">' + room.getOccupants() + '</div></div>'
                    , '<div class="layui-form-item"  style="margin-left: 10px"><label class="label"><b>创建时间：</b></label><div style="height:39.6px;line-height: 39.6px; margin-left: 30px">' + XoW.utils.getFromatDatetime(room.getCreationdate()) + '</div></div>'
                    , '</li>'
                    , '</div>'
                ].join('')
                $('#roomdetails').html(html)
            }.bind(this));
        });
    }

    var _getRoomPeople = (roomjid, roomname) => {
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getRoomByJidFromServer,function(index,item){
            item&&item(roomjid, function (params) {
                var room = params.room;
                var roomInMuc ;
                //add by zjy for 消除Client依赖 [20190801]
                layui.each(call.getXmppRoom, function (index, item) {
                    item && item(roomjid, function (param) {
                        roomInMuc=param;
                    });
                });
                if (null == room) {
                    _layer.msg('房间信息不存在！');
                    return;
                } else if (null == roomInMuc) {
                    _layer.msg('请先加入该房间！');
                    return;
                }
                var currentUserInMucRoom = roomInMuc.roster[roomInMuc.nick];
                var groupFlag = 0;
                $('#roomUserName').append('<li class="layim-vcard-item" style="margin-top: 10px;color: red">' + currentUserInMucRoom.nick + '</li>');
                if ('owner' === currentUserInMucRoom.affiliation) {
                    $('#roomUserPower').append('<li class="layim-vcard-item" style="margin-top: 10px;color: red">所有者</li>');
                    $('#roomUserSetomg').append('<li class="layim-vcard-item" style="margin-top: 10px;color: red"><button type="button" class="layui-btn   layui-btn-xs" layImEx-event="roomDisband" data-roomjid = "' + roomjid + '">解散会议室</button></li>');
                    groupFlag = 1;
                } else if ('moderator' === currentUserInMucRoom.role) {
                    $('#roomUserPower').append('<li class="layim-vcard-item" style="margin-top: 10px;color: red">主持人</li>');
                    $('#roomUserSetomg').append('<li class="layim-vcard-item" style="margin-top: 10px;color: red"><button type="button" class="layui-btn   layui-btn-xs" layImEx-event="quitRoom" data-roomjid = "' + roomjid + '">退出</button></li>');
                    groupFlag = 2;
                } else {
                    $('#roomUserPower').append('<li class="layim-vcard-item" style="margin-top: 10px;color: red">成员</li>');
                    $('#roomUserSetomg').append('<li class="layim-vcard-item" style="margin-top: 10px;color: red"><button type="button" class="layui-btn  layui-btn-xs" layImEx-event="quitRoom" data-roomjid = "' + roomjid + '">退出</button></li>');
                    groupFlag = 3;
                }
                for (var key in roomInMuc.roster) {
                    var o = roomInMuc.roster[key];
                    if (roomInMuc.nick !== key) {
                        $('#roomUserName').append('<li class="layim-vcard-item" style="margin-top: 10px">' + key + '</li>');
                        if ('owner' === o.affiliation) {
                            $('#roomUserPower').append('<li class="layim-vcard-item" style="margin-top: 10px">所有者</li>');
                            $('#roomUserSetomg').append('<li class="layim-vcard-item" style="margin-top: 10px">无法操作</li>');
                        } else if ('moderator' === o.role) {
                            $('#roomUserPower').append('<li class="layim-vcard-item" style="margin-top: 10px">主持人</li>');
                            if (groupFlag == 1) {
                                $('#roomUserSetomg').append('<li class="layim-vcard-item" style="margin-top: 10px"><button class="layui-btn layui-btn-xs" layImEx-event="roomRemove" data-roomjid = "' + roomjid + '" data-roomname="' + key + '">移除</button><button class="layui-btn layui-btn-xs" layImEx-event="roomRemoveModerator" data-roomjid = "' + roomjid + '" data-roomname="' + key + '">撤销主持人</button></li>');
                            }
                            else {
                                $('#roomUserSetomg').append('<li class="layim-vcard-item" style="margin-top: 10px">无法操作</li>');
                            }
                        } else {
                            $('#roomUserPower').append('<li class="layim-vcard-item" style="margin-top: 10px">成员</li>');
                            if (groupFlag == 1) {
                                $('#roomUserSetomg').append('<li class="layim-vcard-item" style="margin-top: 10px"><button class="layui-btn   layui-btn-xs" layImEx-event="roomRemove" data-roomjid = "' + roomjid + '" data-roomname="' + key + '">移除</button><button class="layui-btn layui-btn-xs" layImEx-event="giveRoomModerator" data-roomjid = "' + roomjid + '" data-roomname="' + key + '">授予主持人</button></li>');
                            }
                            else if (groupFlag == 2) {
                                $('#roomUserSetomg').append('<li class="layim-vcard-item" style="margin-top: 10px"><button class="layui-btn   layui-btn-xs" layImEx-event="roomRemove" data-roomjid = "' + roomjid + '" data-roomname="' + key + '">移除</button></li>');
                            }
                            else {
                                $('#roomUserSetomg').append('<li class="layim-vcard-item" style="margin-top: 10px">无法操作</li>');
                            }
                        }
                    }
                }
            });
        });
    }

    var _sendDestroyRoomIq = function (roomjid, successCb, errorCb) {
        var user ;
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getCurrentUser, function (index, item) {
            item && item( function (params) {
                user=params.jid;
            });
        });
        let iq = $iq({
            from: user,
            id: 'Disband',
            to: roomjid,
            type: 'set'
        }).c('query', {xmlns: 'http://jabber.org/protocol/muc#owner'})
            .c('destroy', {jid: roomjid}).c('reason', "meeting over");
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.sendIq,function(index,item){
            item&&item(iq, successCb, errorCb);
        });
    }
    var _removePerson = function (roomjid, nick, successCb, errorCb) {
        var user ;
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getCurrentUser, function (index, item) {
            item && item( function (params) {
                user=params.jid;
            });
        });
        let iq = $iq({
            from: user,
            id: XoW.utils.getUniqueId("remove"),
            to: roomjid,
            type: 'set'
        }).c('query', {xmlns: 'http://jabber.org/protocol/muc#admin'}).c('item', {nick: nick, role: 'none'})
            .c('reason', "you go");
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.sendIq,function(index,item){
            item&&item(iq, successCb, errorCb);
        });
    }
     var _getAllroomINFPO = function(handle_cb,error_cb){
    var user ;
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getCurrentUser, function (index, item) {
            item && item( function (params) {
                user=params.jid;
            });
        });
    var iq = $iq({
      id:XoW.utils.getUniqueId("rInfo"),
      type:"get",
      from: user,
      to:"conference."+ XoW.config.domain
    }).c("query",{xmlns :'http://jabber.org/protocol/disco#items'});
    layui.each(call.sendIq,function(index,item){
            item&&item(iq, successCb, errorCb);
    });
  }
    var _removeRoomModerator = function (roomjid, nick, successCb, errorCb) {
        var user ;
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getCurrentUser, function (index, item) {
            item && item( function (params) {
                user=params.jid;
            });
        });
        let iq = $iq({
            from:user,
            id: XoW.utils.getUniqueId('giveModerator'),
            to: roomjid,
            type: 'set'
        }).c('query', {xmlns: 'http://jabber.org/protocol/muc#admin'})
            .c('item', {nick: nick, role: 'participant'})
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.sendIq,function(index,item){
            item&&item(iq, successCb, errorCb);
        });
    }
    var _giveRoomModerator = function (roomjid, nick, successCb, errorCb) {
        var user ;
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getCurrentUser, function (index, item) {
            item && item( function (params) {
                user=params.jid;
            });
        });
        let iq = $iq({
            from: user,
            id: XoW.utils.getUniqueId('giveModerator'),
            to: roomjid,
            type: 'set'
        }).c('query', {xmlns: 'http://jabber.org/protocol/muc#admin'})
            .c('item', {nick: nick, role: 'moderator'})
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.sendIq,function(index,item){
            item&&item(iq, successCb, errorCb);
        });
    }

    var _saveRoomCOfig = function (roomJid) {
        _getRoomConfig(roomJid, function (params) {
            var fields = params.fields;
            if ($('#roomTitleSwitch').is(':checked')) {
                fields['muc#roomconfig_changesubject'].value = 1;
            } else {
                fields['muc#roomconfig_changesubject'].value = 0;
            }
            fields['muc#roomconfig_publicroom'].value = 1;
            fields['muc#roomconfig_membersonly'].value = 0;
            fields['muc#roomconfig_allowinvites'].value = 1;
            // if ($('#roomInviteSwitch').is(':checked')) {
            //     fields['muc#roomconfig_allowinvites'].value = 1;
            // } else {
            //     fields['muc#roomconfig_allowinvites'].value = 0;
            // }
            fields['muc#roomconfig_passwordprotectedroom'].value = 0;
            fields['muc#roomconfig_roomsecret'].value = ''
            fields['muc#roomconfig_enablelogging'].value = 0;
            fields['x-muc#roomconfig_reservednick'].value = 0;
            fields['x-muc#roomconfig_canchangenick'].value = 1;
            fields['x-muc#roomconfig_registration'].value = 1;
            fields['muc#roomconfig_persistentroom'].value = 0;
            fields['muc#roomconfig_moderatedroom'].value = 0;
            fields['muc#roomconfig_maxusers'].value = 50
            fields['muc#roomconfig_whois'].value = 'anyone'
            var presValues = [];
            presValues.push('moderator');
            presValues.push('participant');
            presValues.push('visitor');
            fields['muc#roomconfig_presencebroadcast'].value = presValues;
            fields['muc#roomconfig_roomadmins'].value = ''
            let OwnerRoom ;
            //add by zjy for 消除Client依赖 [20190801]
            layui.each(call.getCurrentUser, function (index, item) {
                item && item( function (params) {
                    OwnerRoom=params.jid;
                });
            });
            fields['muc#roomconfig_roomowners'].value = OwnerRoom.split(",");
            //add by zjy for 消除Client依赖 [20190801]
            layui.each(call.saveRoomConfig,function(index,item){
                item&&item(roomJid, fields, function () {
                    _layer.alert('操作成功！');
                }, function () {
                    _layer.msg('失败');
                });
            });
        }.bind(this));
    }
    var _inviteToRoom = function (roomJid) {
        var _friend ;
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getFriendGroups, function (index, item) {
            item && item(function (param) {
                _friend=param;
            });
        });
        let data = [];
        for (var i = 0; i < _friend.length; i++) {
            _friend[i].list.find(function (x) {
                if (XoW.UserState.OFFLINE !== x.status) {
                    let rommFrened = {
                        name: XoW.utils.getNodeFromJid(x.jid),
                        jid: x.jid
                    }
                    data.push(rommFrened)
                }
            });
        }
        _layTpl(_eleRoominvifriendhtml).render(data, function (html) {
            _layForm.render();
            var index = _layer.open({
                type: 1,
                title: '邀请用户到会议室',
                shade: [0],
                scrollbar: false,
                area: ['602px', '522px'],
                offset: ['80px', ''],
                content: html,
                btn: ['邀请', '退出']
                , btn1: function () {
                    _dealWithInviting(roomJid, index);
                },
                close: function () {
                    _layer.close(index);
                }
            });
            _layForm.render();
        });
    };

    //add by zjy for 弹出转让群主面板 [20190731]

    var _transOwner = function (roomjid, roomname, ev) {
        let data = [];
        var roomInMuc ;
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getXmppRoom, function (index, item) {
            item && item(roomjid, function (param) {
                roomInMuc=param;
            });
        });
        for (var key in roomInMuc.roster) {
            var o = roomInMuc.roster[key];
            if (roomInMuc.nick !== key) {
                data.push(o);
            }
        }

        let content = _layTpl(transerOwnerr).render(" ");

        var transOwnerPanel = _layer.open({
            type: 1,
            title: '转让群主',
            shade: [0],
            area: ['602px', '522px'],
            //offset: ['80px', ''],
            content: content,
            close: function () {
                _layer.close(index);
            }
        });
        _layerIndex["TRANSOWNERPANEL"] = transOwnerPanel;
        _groupPepleToowner(roomjid, roomname);
        $('#btn_search_user_inroom').attr("roomjid", roomjid);

        _layForm.render();
    }
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
    LAYIMEX.prototype.config = function (pOptions) {
        XoW.logger.ms(_this.classInfo, 'config()');
        pOptions = $.extend({
            title: '屯聊',
            copyright: false, // true代表不要显示copyright = =!
            isfriend: true,
            isgroup: true,
            isChatSpread: true,
            isMeetingSprad: true,
            uploadImage: {},
            uploadFile: {},
            isPageThumbnail: true,
            isVideo: true,
            chatLog: true,
            search: layui.cache.dir + '../search.html',
            find: layui.cache.dir + '../search.html',
            msgbox: layui.cache.dir + '../../layui/css/modules/layim/html/msgbox.html',
            moreList: [{
                alias: 'find'
                , title: '发现'
                , iconUnicode: '&#xe665' //图标字体的unicode，可不填
                , iconClass: ''
            }, {
                alias: 'cart'
                , title: '购物车'
                , iconClass: 'layui-icon-cart'
            }, {
                alias: 'clear'
                , title: '清空缓存'
                , iconClass: 'layui-icon-delete'
            }, {
                alias: 'qrcode'
                , title: '扫码加我'
                , iconUnicode: '&#xe660'
            }, {
                alias: 'speak'
                , title: '你说我懂'
                , iconUnicode: '&#xe606'
            }, {
                alias: 'help'
                , title: '帮助与反馈'
                , iconUnicode: '&#xe607'
            }],
            tool: [{
                alias: 'code', //工具别名
                title: '发送代码', //工具名称
                icon: '&#xe64e;' //工具图标，参考图标文档
            }, {
                alias: 'link',
                title: '发送商品链接',
                icon: '&#xe698;'
            }],
            rommSeting: [{
                alias: 'roomSeting',
                title: '聊天室设置',
                icon: '&#xe716'
            }, {
                alias: 'roomInviting',
                title: '邀请加入聊天室',
                icon: '&#xe608;'
            }, {
                alias: 'roomTitleW',
                title: '房间主题',
                icon: '&#xe609;'
            }]
        }, pOptions);
        _layIM.config(pOptions);

        // Simulated room acquisition
        // that do not support sync post = =!
        // layim mobile不支持post方法
        // 暂时先注释掉掉jquery/zepto [20190401]
        // $.get( '../json/getRooms.json', {},  function(res, status, xhr) {
        //   XoW.logger.d('success to get rooms');
        //   $.each(res.data.group, function(i, item){
        //     item.type = 'group';
        //     _layIM.addList(item);
        //   });
        // }, 'json');
    };
    LAYIMEX.prototype.setMineStatus = function (pStatus) {
        XoW.logger.ms(_this.classInfo, 'setMineStatus({0})'.f(pStatus));
        _changeMineStatus(pStatus);
    };

  // LAYIMEX.prototype.getMessage = function(params){
  //   XoW.logger.ms(_this.classInfo,'searchMessage()');
  //   console.log(params);
  //   _layIM.searchMessage(params);
  //   XoW.logger.me(_this.classInfo,'searchMessage()');
  // };
  LAYIMEX.prototype.roomRefreshing = function(pStatus){
    XoW.logger.ms(_this.classInfo, 'setMineStatus({0})'.f(pStatus));
    _roomRefresh();
  };
	LAYIMEX.prototype.setFriendStatus = function(pFriend){
		XoW.logger.ms(_this.classInfo, 'setFriendStatus({0})'.f(pFriend.status));
		_layIM.setFriendStatus(pFriend.id, pFriend.status);
		if (pFriend.status === XoW.UserState.OFFLINE) {
			_layIM.setChatStatus('<span style="color:#455052;">离线</span>');
		} else if (pFriend.status === XoW.UserState.ONLINE) {
			_layIM.setChatStatus('<span style="color:#455052;">在线</span>');
		} else {
			_layIM.setChatStatus('<span style="color:#888f7f;"></span>');
		}
		XoW.logger.me(_this.classInfo, 'setFriendStatus()');
	};
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
    LAYIMEX.prototype.getMessage = function (params) {
        _layIM.searchMessage(params);
    };


    LAYIMEX.prototype.roomRefreshing = function (pStatus) {
        XoW.logger.ms(_this.classInfo, 'setMineStatus({0})'.f(pStatus));
        _roomRefresh();
    };
    LAYIMEX.prototype.setFriendStatus = function (pFriend) {
        XoW.logger.ms(_this.classInfo, 'setFriendStatus({0})'.f(pFriend.status));
        _layIM.setFriendStatus(pFriend.id, pFriend.status);
        if (pFriend.status === XoW.UserState.OFFLINE) {
            _layIM.setChatStatus('<span style="color:#455052;">离线</span>');
        } else if (pFriend.status === XoW.UserState.ONLINE) {
            _layIM.setChatStatus('<span style="color:#455052;">在线</span>');
        } else {
            _layIM.setChatStatus('<span style="color:#888f7f;"></span>');
        }
        XoW.logger.me(_this.classInfo, 'setFriendStatus()');
    };
    LAYIMEX.prototype.notifyToChatBoxes = function (pMsg) {
        XoW.logger.ms(_this.classInfo, 'notifyToChatBoxes()');
        var layimChat = $('.layui-layim-chat'); // 详见layim.js
        var layimMin = $('.layui-layim-min');
        if (!layimChat) return;
        //如果是最小化，则还原窗口
        if (layimChat.css('display') === 'none') {
            layimChat.show();
        }
        if (layimMin) {
            _layer.close(layimMin.attr('times'));
        }
        var conts = layimChat.find('.layim-chat');
        layui.each(conts, function (index, item) {
            var ul = $(item).find('.layim-chat-main ul');
            ul.append('<li class="layim-chat-system"><span>{0} &nbsp&nbsp {1}</span></li>'.f(layui.data.date(pMsg.timestamp), pMsg.content));
        });
    };
    LAYIMEX.prototype.openReConnLoadTip = function () {
        XoW.logger.ms(_this.classInfo, 'openReConnLoadTip()');
        _reConnLoadTipIndex = _layer.load(0, {
            shade: [0.5, 'gray'], //0.5透明度的灰色背景
            content: '正在重连服务器...',
            success: function (layero) {
                layero.find('.layui-layer-content').css({
                    'padding-top': '38px',
                    'width': 'auto'
                });
                layero.on('click', function () {
                    _layer.close(_reConnLoadTipIndex);
                    // _changeMineStatus(XoW.UserState.OFFLINE);
                    // 发送终止连接命令 todo
                });
            }
        });
        XoW.logger.me(_this.classInfo, 'openReConnLoadTip()');
    };
    LAYIMEX.prototype.closeReConnLoadTip = function () {
        XoW.logger.ms(_this.classInfo, 'closeReConnLoadTip()');
        _layer.close(_reConnLoadTipIndex);
        XoW.logger.me(_this.classInfo, 'closeReConnLoadTip()');
    };
    LAYIMEX.prototype.changeMineUsername = function (params) {
        XoW.logger.ms(_this.classInfo, 'changeMineUsername({0})'.f(params));
        return _changeMineUsername(params), this;
    };
    LAYIMEX.prototype.changeMineSign = function (pSign) {
        XoW.logger.ms(_this.classInfo, 'changeMineSign({0})'.f(pSign));
        $('.layui-layim .layui-layim-remark').val(pSign);
        XoW.logger.me(_this.classInfo, 'changeMineSign({0})'.f(pSign));
    };
    LAYIMEX.prototype.changeFriendAvatar = function (params) {
        XoW.logger.ms(_this.classInfo, 'changeFriendAvatar({0})'.f(params.id));
        return _changeFriendAvatar(params), this;
    };
    LAYIMEX.prototype.changeFriendNick = function (params) {
        XoW.logger.ms(_this.classInfo, 'changeFriendNick({0})'.f(params.id));
        return _changeFriendNick(params), this;
    };
    LAYIMEX.prototype.changeFriendSign = function (pFriend) {
        XoW.logger.ms(_this.classInfo, 'changeFriendSign({0})'.f(pFriend.id));
        var $list = $('.layui-layim').find('.layim-friend' + pFriend.id);
        var $p = $list.find('p');
        if ($p.length != 0) {
            XoW.logger.d(this.classInfo, '更新了好友列表中的心情');
            $p.html(pFriend.sign);
        }
        XoW.logger.me(_this.classInfo, 'changeFriendSign({0})'.f(pFriend.id));
    };
    LAYIMEX.prototype.changeFileStatus = function (pFileThumbnail) {
        XoW.logger.ms(_this.classInfo, 'changeFileStatus()');
        var thatChat = _getThisChat();
        if (!thatChat) {
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
        var theFile = thisChatLog.find(function (x) {
            return x.sid == pFileThumbnail.sid;
        });
        if (!theFile) {
            XoW.logger.e(_this.classInfo + ' There is no such file(may be is image), return.');
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
        if (thatFile.getIsImage()) {
            thatFile.base64 = thatFile.content = pFileThumbnail.base64 || theFile.base64;
            thatFile.content = 'imgEx[{0}]'.f(JSON.stringify(thatFile)); // exclude base64
            thatFile.content = thatFile.content.replace('"content":', '"base64":');
            _layTpl(_eleImage).render(thatFile, function (html) {
                //$layimFile.innerHTML = html;
                $layimFile.replaceWith(html);
            });
        } else {
            thatFile.content = 'fileEx(www.facewhat.com/file33)[{0}]'.f(JSON.stringify(thatFile));
            _layTpl(_eleFileThumbnail).render(thatFile, function (html) {
                $layimFile.replaceWith(html);
            });
        }
        theFile.content = thatFile.content;
        thatFile = null; // to test mod by cy [20190110]
        layui.data('layim', {
            key: _cache.mine.id
            , value: local
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
            if (type === 'friend') {
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

    LAYIMEX.prototype.bindRoomListRightMenu = function () {
        XoW.logger.ms(_this.classInfo, 'bindRoomListRightMenu()');
        var hide = function () {
            _layer.closeAll('tips');
        };
        $('.layim-room-tab').on('contextmenu', function (e) {
            var oThis = $(e.currentTarget);
            _layer.tips(_layTpl(_eleRoomMenu).render(" "), this, {
                tips: 3
                , time: 0
                , anim: 5
                , fixed: true
                , skin: 'layui-box layui-layim-contextmenu'
                , success: function (layerO) {
                    var stopBubble = function (e) {
                        layui.stope(e);
                    };
                    layerO.off('mousedown', stopBubble).on('mousedown', stopBubble);
                }
            });
            $(document).off('mousedown', hide).on('mousedown', hide);
            $(window).off('resize', hide).on('resize', hide);
        });
        XoW.logger.me(_this.classInfo, 'bindRoomListRightMenu()');
    };

    LAYIMEX.prototype.rebindToolButtons = function () {
        XoW.logger.ms(_this.classInfo, 'rebindToolButtons()');
        var $toolSearch = $('li.layui-icon.layim-tool-search');
        if ($toolSearch) {
            $.each($toolSearch, function () {
                var $btn = $(this);
                this.removeAttribute('layim-event');
                $btn.attr('layImEx-event', 'open_local_user_search');
            });
        }
        var $msgBox = $('li.layui-icon.layim-tool-msgbox');
        if ($msgBox) {
            $.each($msgBox, function () {
                var $btn = $(this);
                this.removeAttribute('layim-event');
                $btn.attr('layImEx-event', 'open_sys_info_box');
            });
        }
    XoW.logger.me(_this.classInfo, 'rebindToolButtons()');
  };
  LAYIMEX.prototype.rebindToolFileButton = function(pCallback) {
    XoW.logger.ms(_this.classInfo, 'rebindToolFileButton()');
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
          XoW.logger.ms('FileReader.onload() '+ $file.filename);
          if (pCallback) {
            pCallback(thatChat, $file, e.target.result);
          }
        };
        if ($file) {
          reader.readAsDataURL($file);
          $fileInput[0].children[0].value = ''; // reset input value
        }
      });
    });
    XoW.logger.me(_this.classInfo, 'rebindToolFileButton()');
  };
  LAYIMEX.prototype.bindAddFriendIconInChatView = function(jid){
    var name = jid;
    var chatPanel = $('.layim-chat-other').eq(1);
    var title = $('.layim-title',chatPanel);
    var html = '<div data-jid="'+jid+'">< id="addSranger" src="../../images/AddFriend.png"><span style="display: none">'+name+'</span><div>';
    title.html(html);
  };
	// 如果是非好友&聊天窗口未打开，message中需要带jid用以创建chat窗口
  LAYIMEX.prototype.getMessage = function(data) {
    XoW.logger.ms(_this.classInfo, 'getMessage()');
    _layIM.searchMessage(data);
    XoW.logger.me(_this.classInfo, 'getMessage()');
  };

  LAYIMEX.prototype.setRoomChatFull = function(){
    XoW.logger.ms(_this.classInfo, 'setRoomChatFull()');
    let thatchat = _getThisChat();
     _layIM.setChatFull(layer.index);
    XoW.logger.me(_this.classInfo, 'setRoomChatFull()');
  }

  LAYIMEX.prototype. addCancelButn = function(cid){
      XoW.logger.ms(_this.classInfo, 'addCancelButn()');
      let $layimFile = $('.layim-chat-mine[data-cid=' + cid+ '] .layim-chat-text');
      $layimFile.append('<div id="http'+cid+'"><a href="javascript:void(0);" layImEx-event="stop_http_file"  style="color:red"  data-cid = "'+cid+'">取消</a></div>');
      XoW.logger.me(_this.classInfo, 'addCancelButn()');
  }
    LAYIMEX.prototype.httpFileOverdue = function(data){
        XoW.logger.ms(_this.classInfo, 'httpFileOverdue()');
        let $layimFile = $('.layim_file[sid=' + data.cid + ']');
        let thatChat = _getThisChat();
        if(!thatChat){
            XoW.logger.w('There is no such chat panel, return.');
            _layer.msg("文件已丢失");
            return;
        }
        let chatElem = thatChat.data;
        let local = layui.data('layim')[_cache.mine.id];
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
        theFile = $.extend(theFile, {status: data.status,content: null});
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
        layui.data('layim', {
            key: _cache.mine.id
            ,value: local
        });
        XoW.logger.me(_this.classInfo, 'httpFileOverdue()');
    }
  LAYIMEX.prototype.changeHttpFileStatus = function(data){
      if(data.status === XoW.FileHttpFileState.CANCEL || data.status === XoW.FileHttpFileState.ERROR || data.status === XoW.FileHttpFileState.CLOSE ) {
        $('#http' + data.cid).remove();
      }
      XoW.logger.ms(_this.classInfo, 'changeHttpFileStatus()');
      let $layimFile = $('.layim_file[sid=' + data.cid + ']');
      let thatChat = _getThisChat();
      if(!thatChat){
        XoW.logger.w('There is no such chat panel, return.');
      }
      let local = layui.data('layim')[_cache.mine.id];
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
      theFile = $.extend(theFile, {status: data.status,percent: data.percent,seq:data.seq,content: null});
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
      console.log(thatFile.percent)
      thatFile.content = 'hpFile[{0}]'.f(JSON.stringify(thatFile))
      layui.each(thisChatLog, function(index, item){
        if(item.cid == data.cid){
          thisChatLog.splice(index,1,thatFile)
        }
      });
      layui.data('layim', {
        key: _cache.mine.id
        ,value: local
      });
    XoW.logger.me(_this.classInfo, 'changeHttpFileStatus()');
  }
  LAYIMEX.prototype.completeHttpFile = function(data){
    XoW.logger.ms(_this.classInfo, 'completeHttpFile()');
    $('#http'+data.cid).remove();
    let $layimFile = $('.layim_file[sid=' + data.cid + ']');
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
    let local = layui.data('layim')[_cache.mine.id];
    let chatLog = local.chatlog || {};
    let thisChatLog = chatLog[data.type + data.id];
    layui.each(thisChatLog, function(index, item){
      if(item.cid == data.cid){
         thisChatLog.splice(index,1,data)
      }
    });
    layui.data('layim', {
      key: _cache.mine.id
      ,value: local
    });
    XoW.logger.me(_this.classInfo, 'completeHttpFile()');
  }

  LAYIMEX.prototype.setUserSearchResult = function(data) {
    XoW.logger.ms(_this.classInfo, 'setUserSearchResult()');
    _cache.searchResOfStranger = data;
    var $layimRes = $('#search_user_remote_res');
    _layTpl(_eleRemoteSearchUserRes).render(data, function (html) {
      $layimRes[0].innerHTML = html;
    });
        XoW.logger.me(_this.classInfo, 'rebindToolButtons()');
    };
    LAYIMEX.prototype.rebindToolFileButton = function (pCallback) {
        XoW.logger.ms(_this.classInfo, 'rebindToolFileButton()');
        var thatChat = _getThisChat();
        if (!thatChat) {
            return;
        }
        // the tool box class name is 'layim-tool-image'
        var $fileToolboxs = thatChat.elem.find('.layim-chat-footer').find('.layim-chat-tool .layim-tool-image');
        $.each($fileToolboxs, function () {
            // 屏蔽掉layim.js中的操作，阻止上传文件
            var $fileInput = $(this);
            this.removeAttribute('layim-event');
            var type = this.getAttribute('data-type') || 'images';
            if (type === 'images') {
                $fileInput.find('input')[0].setAttribute('accept', '.png,.jpeg,.gif,.jpg')
            }
            // 离线状态屏蔽click操作
            $fileInput.click(function (e) {
                XoW.logger.ms(_this.classInfo, 'fileInput.click()');
                // 小小依赖了下XoW.UserState by cy
                if (thatChat.data.status === XoW.UserState.OFFLINE) {
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
                    XoW.logger.ms('FileReader.onload() ' + $file.filename);
                    if (pCallback) {
                        pCallback(thatChat, $file, e.target.result);
                    }
                };
                if ($file) {
                    reader.readAsDataURL($file);
                    $fileInput[0].children[0].value = ''; // reset input value
                }
            });
        });
        XoW.logger.me(_this.classInfo, 'rebindToolFileButton()');
    };
    LAYIMEX.prototype.bindAddFriendIconInChatView = function (jid) {
        var name = jid;
        var chatPanel = $('.layim-chat-other').eq(1);
        var title = $('.layim-title', chatPanel);
        var html = '<div data-jid="' + jid + '">< id="addSranger" src="../../images/AddFriend.png"><span style="display: none">' + name + '</span><div>';
        title.html(html);
    };
    // 如果是非好友&聊天窗口未打开，message中需要带jid用以创建chat窗口
    LAYIMEX.prototype.getMessage = function (data) {
        XoW.logger.ms(_this.classInfo, 'getMessage()');
        _layIM.searchMessage(data);
    };
    LAYIMEX.prototype.setUserSearchResult = function (data) {
        XoW.logger.ms(_this.classInfo, 'setUserSearchResult()');
        _cache.searchResOfStranger = data;
        var $layimRes = $('#search_user_remote_res');
        _layTpl(_eleRemoteSearchUserRes).render(data, function (html) {
            $layimRes[0].innerHTML = html;
        });
        XoW.logger.me(_this.classInfo, 'setUserSearchResult()');
    };
    LAYIMEX.prototype.pushExtMsg = function (pMsg) {
        XoW.logger.ms(_this.classInfo, 'pushExtMsg()');
        pMsg.avatar = _cache.mine ? _cache.mine.avatar : XoW.DefaultImage.AVATAR_DEFAULT;
        var thatChat = _getThisChat(), ul = thatChat.elem.find('.layim-chat-main ul');
        // 貌似没有找具体哪一个ul，默认最外层的? ask by cy [20190408]
        var maxLength = _cache.base.maxLength || 3000;
        if (pMsg.content.replace(/\s/g, '') !== '') {
            var noLimited = $.isFunction(pMsg.getIsImage) ? pMsg.getIsImage() : false;
            if (pMsg.content.length > maxLength && !noLimited) {
                return _layer.msg('内容最长不能超过' + maxLength + '个字符');
            }
            ul.append(_layTpl(_elemChatMain).render(pMsg));

            _layIM.pushChatLog(pMsg);
            layui.each(call.pushExtMsg, function (index, item) {
                item && item(pMsg);
            });
        }
        _chatListMore();
        XoW.logger.me(_this.classInfo, 'pushExtMsg()');
    };

    LAYIMEX.prototype.OnlyMemberIntoRoom = function (Msg) {
        XoW.logger.ms(_this.classInfo, "OnlyMemberIntoRoom()");
        _layIM.closeThisChatLayer();
        setTimeout(function () {
            _layer.msg(Msg)
        }.bind(this), 500);
        XoW.logger.me(_this.classInfo, "OnlyMemberIntoRoom()");
    }

    LAYIMEX.prototype.someBodyIntoMeIntoRoom = function (params) {
        XoW.logger.ms(_this.classInfo, "someBodyIntoMeIntoRoom()");
        var room = params.info;
        var html = this.inviteMegrouphtml(room);
        _layer.open({
            type: 1,
            fadeIn: 100,
            anim: 6,
            title: '会议申请',
            shade: [0], //去掉遮罩
            area: ['437px', '319px'],
            content: html
        });
        XoW.logger.me(_this.classInfo, "someBodyIntoMeIntoRoom()");
    }

    LAYIMEX.prototype.outRoomMaxPeples = function (Msg) {
        XoW.logger.ms(_this.classInfo, "outRoomMaxPeples()");
        _layIM.closeThisChatLayer();
        setTimeout(function () {
            _layer.msg(Msg)
        }.bind(this), 500);
        XoW.logger.me(_this.classInfo, "outRoomMaxPeples()");
    }

    LAYIMEX.prototype.banIntoThisRoom = function (Msg) {
        XoW.logger.ms(_this.classInfo, "banIntoThisRoom()");
        _layer.close(layer.index)
        _layIM.closeThisChatLayer();
        setTimeout(function () {
            _layer.msg(Msg)
        }.bind(this), 500);
        XoW.logger.me(_this.classInfo, "banIntoThisRoom()");
    }
    LAYIMEX.prototype.roomMastarDestroyThisRoom = function (params) {
        XoW.logger.ms(_this.classInfo, "RoomMastarDestroyThisRoom()");
        _layer.close(layer.index)
        _layIM.closeThisChatLayer();
        this.roomRefreshing();
        setTimeout(function () {
            _layer.msg(params.Msg)
        }.bind(this), 500);
        XoW.logger.me(_this.classInfo, "RoomMastarDestroyThisRoom()");
    }
    LAYIMEX.prototype.roomMasterDenyYouSpeak = function (Msg) {
        XoW.logger.ms(_this.classInfo, "roomMasterDenyYouSpeak()");
        _layer.msg(Msg);
        var minMsg = document.getElementsByClassName('layim-chat-mine');
        if (minMsg.length >= 1) {
            minMsg[minMsg.length - 1].parentNode.removeChild(minMsg[minMsg.length - 1]);
        }
        XoW.logger.me(_this.classInfo, "roomMasterDenyYouSpeak()");
    }
    LAYIMEX.prototype.roomOutSide = function (params) {
        XoW.logger.ms(_this.classInfo, "roomOutSide()");
        _layer.close(layer.index)
        _layIM.closeThisChatLayer();
        let Msg = {
            content: params,
            timestamp: XoW.utils.getCurrentDatetime()
        }
        this.pushSysInfo(Msg);
        XoW.logger.me(_this.classInfo, "roomOutSide(roomOutSide)");
    }
    LAYIMEX.prototype.wrongPaaswordIntoThisRoom = function (Msg) {
        XoW.logger.ms(_this.classInfo, "wrongPaaswordIntoThisRoom()");
        _layIM.closeThisChatLayer();
        setTimeout(function () {
            _layer.msg(Msg)
        }.bind(this), 500);
        XoW.logger.me(_this.classInfo, "wrongPaaswordIntoThisRoom()");
    }
    LAYIMEX.prototype.pushSysInfo = function (pMsg, pIsBlink) {
        XoW.logger.ms(_this.classInfo, 'pushSysInfo({0})'.f(pMsg.cid));
        pIsBlink = (typeof pIsBlink !== 'undefined') ? pIsBlink : true;
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
            , value: local
        });

        if (pIsBlink) {
            _blinkSysInfoIcon();
        }
        XoW.logger.me(_this.classInfo, 'pushSysInfo()');
    };
    // 最前端面板插入并发送消息
    LAYIMEX.prototype.sendMsgForTop = function (pMsgCont) {
        XoW.logger.ms(_this.classInfo, 'sendMsgForTop()');
        var thatChat = _getThisChat()
        _layIM.focusInsert(thatChat.textarea[0], pMsgCont);
        _layIM.sendMessage();
        XoW.logger.ms(_this.classInfo, 'sendMsgForTop()');
    }
  LAYIMEX.prototype.KeFuMsgRev = function(pMsgCont) {
    XoW.logger.ms(_this.classInfo, 'KeFuMsgRev()');
    let thatChat = _getThisChat(), ul = thatChat.elem.find('.layim-chat-main ul');
    pMsgCont.avatar =  XoW.DefaultImage.AVATAR_KEFU;
    ul.append(_layTpl(_elemChatMain).render(pMsgCont));
    _layIM.pushChatLog(pMsgCont);
    _chatListMore();
    XoW.logger.ms(_this.classInfo, 'KeFuMsgRev()');
  }
    LAYIMEX.prototype.inviteMegrouphtml = function (room) {
        return _inviteMegrouphtml(room);
    };
    LAYIMEX.prototype.onReady = function () {
        XoW.logger.ms(_this.classInfo, 'onReady()');
        this.bindFriendListRightMenu();
        this.bindRoomListRightMenu();
        this.rebindToolButtons();
        var local = layui.data('layim')[_cache.mine.id] || {};
        local['hasUnreadSysInfo'] = local['hasUnreadSysInfo'] || false;
        if (local['hasUnreadSysInfo']) {
            _blinkSysInfoIcon();
        }
        XoW.logger.me(_this.classInfo, 'onReady()');
    }
    // endregion APIs

    // region  UI CAllBack By LayIM(除非只涉及UI处理，否则要丢给controller去处理)
    //监听自定义工具栏点击，添加代码
    _layIM.on('tool(code)', function (pInsert, pSendMessage) {
        XoW.logger.ms(_this.classInfo, 'tool(code)()');
        _layer.prompt({
            title: '插入代码'
            , formType: 2
            , shade: 0
        }, function (text, index) {
            _layer.close(index);
            pInsert('[pre class=layui-code]' + text + '[/pre]'); //将内容插入到编辑器
            pSendMessage();
        });
        XoW.logger.me(_this.classInfo, 'tool(code)()');
    });
    _layIM.on('tool(link)', function (pInsert, pSendMessage) {
        XoW.logger.ms(_this.classInfo, 'tool(link)()');
        var scrollTop = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
        _layer.prompt({
            title: '请输入网页地址'
            , shade: false
            , offset: [
                this.offset().top - scrollTop - 158 + 'px'
                , this.offset().left + 'px'
            ]
        }, function (src, index) {
            var regExp = /(https?):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/
            if (!regExp.test(src)) {
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
                        url: $('meta[property="og:url"]', doc) ? $('meta[property="og:url"]', doc).attr('content') : '',
                        type: $('meta[property="og:type"]', doc) ? $('meta[property="og:type"]', doc).attr('content') : '',
                        image: $('meta[property="og:image"]', doc) ? $('meta[property="og:image"]', doc).attr('content') : '',
                        title: $('meta[property="og:title"]', doc) ? $('meta[property="og:title"]', doc).attr('content') : '',
                        description: $('meta[property="og:description"]', doc) ? $('meta[property="og:description"]', doc).attr('content') : ''
                    };
                    var msg = 'linkEx[{0}]'.f(JSON.stringify(content));
                    pInsert(msg);
                    pSendMessage();
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    _layer.msg('网络不可达或跨域了.'); // 若使用dataType: 'jsonp'来跨域，也不支持返回为html/text的类型
                }
            });
        });
        XoW.logger.me(_this.classInfo, 'tool(link)()');
    });

    _layIM.on('chatChange', function (res) {
        XoW.logger.ms(_this.classInfo, 'chatChange({0},{1})'.f(res.data.type, res.data.id));
        var type = res.data.type;
        var jid = res.data.jid;
        if (!res.data.jid) {
            _layer.alert('JID不存在，无法与该用户聊天.')
            return;
        }

        if (type === XoW.MessageType.CONTACT_CHAT) {
            var friend = _getFriendById(res.data.id);
            if (friend && friend.status === XoW.UserState.OFFLINE) {
                _layIM.setChatStatus('<span style="color:#455052;">离线</span>');
            } else if (friend && friend.status === XoW.UserState.ONLINE) {
                _layIM.setChatStatus('<span style="color:#455052;">在线</span>');
            } else {
                _layIM.setChatStatus('<span style="color:#888f7f;"></span>');
            }
            $(".layim-tool-drawing").click(function () {
                _Sketchpad.drawing(sendFileForSkechpadCb);
            })
            _rebindToolFileButton();
        } else if (type === XoW.MessageType.GROUP_CHAT) {
             _rebindToolFileButton();
            //add by zjy for 消除Client依赖 [20190802]
            layui.each(call.intoRoom,function(index,item){
                item&&item(type, jid);
            });
            _layIM.searchMessage({
                system: true
                , id: res.data.id
                , type: "group"
                , content: '自己加入房间'
            });
        }
        XoW.logger.me(_this.classInfo, 'chatChange({0})'.f(res.data.id));
    });

    // add by zjy for 删除绘画板client依赖设置的回调
    function sendFileForSkechpadCb(pThatChat,pFileInfo,pData) {
        XoW.logger.ms(_this.classInfo, 'sendFileForSkechpadCb');
        layui.each(call.sendFile, function(index, item){
            item && item(pThatChat, pFileInfo, pData);})
        XoW.logger.me(_this.classInfo, 'sendFileForSkechpadCb');
    }
    // endregion  UI CAllBack By LayIM

    // region LayImEx-event handlers
    var events = {
        menu_chat: function (oThis, e) {
            XoW.logger.ms(_this.classInfo, 'menu_chat()');
            _layer.closeAll('tips');
            var $par = oThis.parent();
            var id = $par.data('id');
            var data = _getDataFromFriendListItem(id);
            _layIM.chat(data);
        },
        roomRefresh: function (oThis, e) {
            _roomRefresh();
        },
    thisTest:function(){
      // let token = {
      //       //   to: '第一次周赛',
      //       //   from: 'carol',
      //       //   type:'group'
      //       // };
      //       // let msg = '';
      //       // let getPara = "../index.html?token="
      //       //     + encodeURIComponent(JSON.stringify(token))
      //       //     + "&msg="
      //       //     + encodeURIComponent(JSON.stringify(msg))
      //       //     + "&mode=kefu"
      //       //     + "&res=fwh5_desktop";
      //       // window.location.href = getPara;
      let token = {
        to: '无敌测试赛',
        from: 'game',
        type:'group',
        password:'123456',
        // to: "第一次周赛",
        // from: 'game',
        // type:'group',
        // password:'123456',
     };
      let msg = '首页';
      let getPara = "../index.html?token="
          + encodeURIComponent(JSON.stringify(token))
          + "&msg="
          + encodeURIComponent(JSON.stringify(msg))
          + "&mode=kefu"
          + "&res=fwh5_desktop";
      window.location.href = getPara;
    },
        layim_invitIntoroomagree: function (oThis, e) {
            var _this = $(this);
            var $tr = _this.parent().parent();
            var id = $tr.parent().attr('id');
            var roomJid = $tr.parent().attr('jid');
            var user ;
            //add by zjy for 消除Client依赖 [20190801]
            layui.each(call.getCurrentUser, function (index, item) {
                item && item( function (params) {
                    user=params.jid;
                });
            });
            //password
            var password = $tr.parent().attr('password');
            var room = new XoW.Room();
            room.jid = roomJid;
            room.name = XoW.utils.getNodeFromJid(roomJid);
            room.id = room.name;
            _this.parent().html('<span>已同意</span>');
            //add by zjy for 消除Client依赖 [20190802]
            layui.each(call.joinInviteRoom,function(index,item){
                item&&item(room, password);
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
      layui.each(call.continuehttpfilestransfer, function (index, item) {
          item && item(fileid,function(res){
                if(res == true){
                    let $layimFile = $('.layim-chat-mine[data-cid=' + fileid+ '] .layim-chat-text');
                    $layimFile.append('<div id="http'+fileid+'"><a href="javascript:void(0);" layImEx-event="stop_http_file"  style="color:red"  data-cid = "'+fileid+'">取消</a></div>');
                }else{
                    sessionStorage.setItem(fileid, false);
                }
          });
      });

    },
     layim_invitIntoroomdisagree: function (oThis, e) {
            var _this = $(this);
            var $tr = _this.parent().parent();
            var id = $tr.parent().attr('id');
            var roomJid = $tr.parent().attr('jid');
            var user ;
            //add by zjy for 消除Client依赖 [20190801]
            layui.each(call.getCurrentUser, function (index, item) {
                item && item( function (params) {
                    user=params.jid;
                });
            });
            var invifrom = $tr.parent().attr('invifrom');
            var room = new XoW.Room();
            room.jid = roomJid;
            room.name = XoW.utils.getNodeFromJid(roomJid);
            room.id = room.name;
            //add by zjy for 消除Client依赖 [20190802]
            var isCurrentUserAlreadyInRoom= layui.each(call.isCurrentUserAlreadyInRoom, function (index, item) {
                item && item( roomJid,function (param) {
                    isCurrentUserAlreadyInRoom=param;
                });
            });
            if (isCurrentUserAlreadyInRoom) {
                XoW.logger.e("joinRoom 当前用户已在该房间中，加入失败！");
                layer.msg("你已在这个房间，加入失败");
                return false;
            }
            _this.parent().html('<span>已拒绝</span>');
            //add by zjy for 消除Client依赖 [20190802]
            layui.each(call.denyinvitRoom, function (index, item) {
                item && item( room, invifrom);
            });
        },
        sendRoomTitles: function (oThis, e) {
            let jid = $(e.target).attr("data-jid");
            let title = $('#getRoomTiTle').val();
            var user ;
            //add by zjy for 消除Client依赖 [20190801]
            layui.each(call.getCurrentUser, function (index, item) {
                item && item( function (params) {
                    user=params.jid;
                });
            });
            var msg = $msg({
                from: user,
                to: jid,
                type: 'groupchat'
            }).c('subject', title)
            //add by zjy for 消除Client依赖 [20190801]
            layui.each(call.sendMsg,function(index,item){
                item&&item(msg);
            });
            _layer.close(layer.index)
        },
        roomInviting: function (oThis, e) {
            let jid = e.currentTarget.dataset.jid;
            _inviteToRoom(jid);
        },
        removeInvitedFriend: function (oThis, e) {
            $(oThis).parent().remove();
            $('.Not' + XoW.utils.getNodeFromJid($(oThis).attr("data-jid")) + ' ').prop('checked', false)
            _layForm.render();
        },
        saveRoomCOfig: function (oThis, e) {
            let roomjid = $(e.target).attr('data-roomjid');
            _saveRoomCOfig(roomjid);
            e.stopImmediatePropagation();
        },
        roomDisband: function (oThis, e) {
            let roomjid = $(e.target).attr('data-roomjid');
            let index = _layer.confirm('是否解散会议？', {
                btn: ['是的', '在想一下']
            }, function () {
                _sendDestroyRoomIq(roomjid, function () {
                    _layer.close(layer.index)
                    _layIM.closeThisChatLayer();
                    _layer.msg("解散会议成功");
                    _layer.close(index);
                }.bind(this), function (error) {
                    _layer.msg("解散会议室失败");
                })
            }, function () {
                _layer.close(index);
            });
            e.stopImmediatePropagation();
        },
        quitRoom: function (oThis, e) {
            let roomjid = $(e.target).attr('data-roomjid');
            var user ;
            //add by zjy for 消除Client依赖 [20190801]
            layui.each(call.getCurrentUser, function (index, item) {
                item && item( function (params) {
                    user=params.jid;
                });
            });
            let pres = $pres({
                from:user,
                to: roomjid,
                type: 'unavailable'
            })
            //add by zjy for 消除Client依赖 [20190801]
            layui.each(call.sendMsg,function(index,item){
                item&&item(pres);
            });
            _layer.close(layer.index)
            _layIM.closeThisChatLayer();
        },
        roomRemove: function (oThis, e) {
            let roomjid = $(e.target).attr('data-roomjid');
            let nick = $(e.target).attr('data-roomname');
            let index = _layer.confirm('你要将这个用户移除出吗？', {
                btn: ['是的', '在想一下'] //按钮
            }, function () {
                _removePerson(roomjid, nick, function () {
                    _layer.msg("移除成功");
                }.bind(this), function (error) {
                    _layer.msg("移除失败");
                })
                _layer.close(index);
            }, function () {
                _layer.close(index);
            });
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
        roomRemoveModerator: function (oThis, e) {
            let roomjid = $(e.target).attr('data-roomjid');
            let nick = $(e.target).attr('data-roomname');
            let index = _layer.confirm('是否撤销该用户主持人角色？', {
                btn: ['是的', '在想一下']
            }, function () {
                _removeRoomModerator(roomjid, nick, function () {
                    _layer.msg("撤销主持人成功");
                }, bind(this), function (error) {
                    _layer.msg("撤销主持人失败");
                })
                _layer.close(index);
            }, function () {
                _layer.close(index);
            });
        },
        giveRoomModerator: function (oThis, e) {
            let roomjid = $(e.target).attr('data-roomjid');
            let nick = $(e.target).attr('data-roomname');
            let index = _layer.confirm('是否授予该用户主持人角色？', {
                btn: ['是的', '在想一下']
            }, function () {
                _giveRoomModerator(roomjid, nick, function () {
                    _layer.msg("授予主持人成功");
                }, bind(this), function (error) {
                    _layer.msg("授予主持人失败");
                })
                _layer.close(index);
            }, function () {
                _layer.close(index);
            });

        },
        creatingMeetinfRoom: function (oThis, e) {
            _makeMeetingRoom();
            e.stopImmediatePropagation();
        },
        createMeetingRoom: function (oThis, e) {
            _createMeetingRoom();
            e.stopImmediatePropagation();
        },
        creatingChatRoom: function (oThis, e) {
            _makeChatingRoom();
            e.stopImmediatePropagation();
        },
        CreateChatRoom: function (oThis, e) {
            _createChatingRoom();
            _layer.closeAll('tips');
            e.stopImmediatePropagation();
        },
        banAllRoomMemberVoice: function (oThis, e) {
            let index = _layer.confirm('是否全员禁言？', {
                btn: ['确定', '在想一想'] //按钮
            }, function () {
                let roomjid = $(e.target).attr("roomjid");
                let flag = true;
                var roomInMuc ;
                //add by zjy for 消除Client依赖 [20190801]
                layui.each(call.getXmppRoom, function (index, item) {
                    item && item(roomjid, function (param) {
                        roomInMuc=param;
                    });
                });
                for (var key in roomInMuc.roster) {
                    var o = roomInMuc.roster[key];
                    if (roomInMuc.nick !== key) {
                        if ('owner' != o.affiliation && 'admin' != o.affiliation) {
                            _avoidSpeak(roomjid, key, function () {
                            }.bind(this), function (error) {
                                _layer.msg("禁言" + key + "失败");
                                flag = false;
                            });
                        }
                    }
                }
                if (flag == true) {
                    _layer.msg("禁言成功");
                }
                else {
                    _layer.msg("禁言成功,部分禁言失败");
                }
            }, function () {
                _layer.close(index);
            });
            e.stopImmediatePropagation();
        },
        giveAllRoomMemberVoice: function (oThis, e) {
            let index = _layer.confirm('是否全员解除禁言？', {
                btn: ['确定', '在想一想'] //按钮
            }, function () {
                let roomjid = $(e.target).attr("roomjid");
                var roomInMuc ;
                //add by zjy for 消除Client依赖 [20190801]
                layui.each(call.getXmppRoom, function (index, item) {
                    item && item(roomjid, function (param) {
                        roomInMuc=param;
                    });
                });
                let flag = true;
                for (var key in roomInMuc.roster) {
                    var o = roomInMuc.roster[key];
                    if (roomInMuc.nick !== key) {
                        if ('visitor' === o.role) {
                            _giveSpeaking(roomjid, key, function () {
                            }.bind(this), function (error) {
                                _layer.msg("解除" + key + "失败");
                                flag = false;
                            });
                        }
                    }
                }
                if (flag == true) {
                    _layer.msg("解除禁言成功");
                }
                else {
                    _layer.msg("解除禁言成功,部分解除失败");
                }
            }, function () {
                _layer.close(index);
            });
            e.stopImmediatePropagation();
        },
        roomSeting: function (oThis, e) {
            let jid = e.currentTarget.dataset.jid;
            //alert("WWW+jid:"+jid);
            let roomname = XoW.utils.getNodeFromJid(jid);
            let allroom ;
            //add by zjy for 消除Client依赖 [20190801]
            layui.each(call.getSaveoutAllRoom,function(index,item){
                item&&item(function(param){
                    allroom=param;
                });
            });
            let choiceroomlist;
            for (let i = 0; i <= allroom.length; i++) {
                let t = allroom[i];
                if (t.jid == jid) {
                    choiceroomlist = t;
                    break;
                }
            }
            if (choiceroomlist.isPersistent) {
                _groupSet(jid, roomname);
            }
            else {
                _meetingRoomSeting(jid, roomname);
            }
        },
        menu_profile: function (oThis, e) {
            XoW.logger.ms(_this.classInfo, 'menu_profile()');
            _layer.closeAll('tips');
            var $par = oThis.parent();
            var id = $par.data('id');
            var data = _getFriendById(id);
            if (!data || !data.vcard) {
                XoW.logger.e('There is no vCard, return.');
                return;
                // todo 去服务端取
            }
            var content = _layTpl(_eleVCard).render(data);
            _layer.close(events.menu_profile.index);
            events.menu_profile.index = _layer.open({
                type: 1 // 1表示页面内，2表示frame
                , title: '联系人资料'
                , shade: false
                , maxmin: true
                , area: ['600px', '520px']
                , skin: 'layui-box layui-layer-border'
                , resize: true
                , content: content
                , success: function (layero, index) {
                }
            });
        },
        // add by zjy  for 弹出转让群主面板 [20190731]
        transferOwner: function (oThis, e) {
            let jid = $(e.target).attr('userroomjid');
            // console.log("trans+"+jid);
            let roomname = XoW.utils.getNodeFromJid(jid);
            _transOwner(jid, roomname);
        },
        //add by zjy for 转让群主操作 [20190731]
        changeRoomOwner: function (othis, e) {
            let jid = $(e.target).attr("userjidd");
            jid = XoW.utils.getBareJidFromJid(jid);
            let roomjid = $(e.target).attr("romji");
            _getRoomConfig(roomjid, function (params) {
                var fields = params.fields;
                let index = _layer.open({
                    content: '确定将房间转让给该用户，你将失去权限？'
                    , btn: ['确定转让', '点错了']
                    , yes: function () {
                        fields['muc#roomconfig_roomowners'].value = jid.split(",");
                        //add by zjy for 消除Client依赖 [20190801]
                        layui.each(call.saveRoomConfig,function(index,item){
                            item&&item(roomjid, fields, function () {
                                _layer.open({
                                    content: '操作成功'
                                    , skin: 'msg'
                                    , time: 2
                                });
                                _layer.close(index);
                                if (_layerIndex["TRANSOWNERPANEL"] != -1)
                                    _layer.close(_layerIndex["TRANSOWNERPANEL"]);
                                _layerIndex["TRANSOWNERPANEL"] = -1;
                                if (_layerIndex["ROOMSETPANEL"] != -1)
                                    _layer.close(_layerIndex["ROOMSETPANEL"]);
                                _layerIndex["ROOMSETPANEL"] = -1;

                                // _layer.close(index);
                                // _layer.close(index);
                                _layer.msg("转让成功");

                            }, function () {
                                _layer.open({
                                    content: '操作失败'
                                    , skin: 'msg'
                                    , time: 2
                                });
                            });
                        });
                    },
                    btn1: function () {
                        _layer.close(index);
                    }
                });
            }.bind(this));

        },
        //add by zjy for 搜索群员操作 [20190731]
        search_user_inroom: function (oThis, e) {
            let roomjid = $(e.target).attr('roomjid');
            //add by zjy for 消除Client依赖 [20190801]
            layui.each(call.getRoomByJidFromServer,function(index,item){
                item&&item(roomjid, function (params) {
                    XoW.logger.ms(_this.classInfo, 'search_user_inroom()');
                    let $p = oThis.parent().parent();
                    let $input = $p.find('input');
                    if (!$input) {
                        XoW.logger.e('There is no element of input, return.');
                        return;
                    }


                    console.log("roomjid:" + roomjid);
                    let val = $input.val().replace(/\s/);
                    let reg = new RegExp(val);
                    var roomInMuc ;
                    //add by zjy for 消除Client依赖 [20190801]
                    layui.each(call.getXmppRoom, function (index, item) {
                        item && item(roomjid, function (param) {
                            roomInMuc=param;
                        });
                    });
                    let html = "";
                    html += '<table class="layui-table "  lay-skin="nob" style="width:600px ;">'
                        + '<thead><tr style="background-color: #FFFFFF;width: 600px"><th style="width: 300px"><b>昵称</b></th><th style="width:300px"><b>操作</b></th></tr></thead><tbody>';
                    for (var key in roomInMuc.roster) {
                        var o = roomInMuc.roster[key];
                        if (roomInMuc.nick !== key && key.match(reg)) {
                            html +=
                                '<tr style="background-color: #FFFFFF"><td title="' + key + '">' + key
                                + '</td>'
                            html += '<td style="background-color: #FFFFFF"><div class="layui-btn  groupMMM" layimex-event="changeRoomOwner"   romji = "' + roomjid + '" userjidd = "' + o.jid + '"  powert = "ORM"  nicknick = "' + o.nick + '" style="width: 100px; height: 25px;text-align: center;line-height: 25px;font-size: 10px">转让给他</div>'
                                + '</td></tr>';
                        }
                    }
                    html += '</tbody></table>';
                    $('#roomMemberToOwnerlist').html(html);
                    XoW.logger.me(_this.classInfo, 'search_user_inroom()');
                });
            });
        },
        menu_history: function (oThis, e) {
            XoW.logger.ms(_this.classInfo, 'menu_history()');
            _layer.closeAll('tips');
            if (!_cache.base.chatLog) {
                return _layer.msg('未开启聊天记录漫游功能');
            }
            var $par = oThis.parent();
            var id = $par.data('id');
            var data = _getDataFromFriendListItem(id);
            var friends = _cache.friend;
            if (data.temporary) {
                var has;
                $.each(_cache.friend, function (index, group) {
                    if (group.groupid === '临时会话') {
                        group.push(data);
                        has = true;
                        return false;
                    }
                });
                if (!has) {
                    var gp = new XoW.FriendGroup('临时会话');
                    friends.push(gp);
                    gp.list.push(data);
                }
            }
            var param = {
                tab: 'chatLog',
                withJid: data.jid,
                friend: friends
            }
            _openRemoteSearchBox(param);
            XoW.logger.me(_this.classInfo, 'menu_history()');
        },
        menu_rm_friend: function (oThis, e) {
            XoW.logger.ms(_this.classInfo, 'menu_rm_friend()');
            var $par = oThis.parent();
            var id = $par.data('id');
            var data = _getFriendById(id);
            if (!data) {
                XoW.e('There is no such user with id {0}, return.'.f(id));
                return;
            }
            _layer.msg('确定删除好友 {0} 吗？'.f(data.username), {
                time: 0 //不自动关闭
                , btn: ['确定', '取消']
                , yes: function (index) {
                    layui.each(call.rmvContact, function (i, item) {
                        item && item(data);
                    });
                    _layer.close(index);
                }
            });
            XoW.logger.me(_this.classInfo, 'menu_rm_friend()');
        },
        menu_move_to: function (oThis, e) {
            XoW.logger.ms(_this.classInfo, 'menu_move_to()');
            _layer.closeAll('tips');
            _layer.msg('本端暂不支持该操作，请联系管理员完成操作');
        },
        menu_create_group: function (oThis, e) {
            XoW.logger.ms(_this.classInfo, 'menu_create_group()');
            _layer.closeAll('tips');
            _layer.msg('本端暂不支持该操作，请联系管理员完成操作');
        },

        menu_remote_search: function (oThis, e) {
            XoW.logger.ms(_this.classInfo, 'menu_remote_search()');
            var param = {
                tab: 'user',
                friend: _cache.friend
            }
            _openRemoteSearchBox(param);
            XoW.logger.me(_this.classInfo, 'menu_remote_search()');
        },
        menu_speak: function (oThis, e) {
            XoW.logger.ms(_this.classInfo, 'menu_speak()');
            _layer.msg('攻城狮玩命开发智能语音互动功能ing，敬请期待:)');
        },
        menu_help: function (oThis, e) {
            XoW.logger.ms(_this.classInfo, 'menu_help()');
            // todo 打开聊天客服界面
            _layer.close(events.find.index);
            var toId = '#demohelp';
            _layIM.chat({
                name: '智能客服',
                username: toId,
                type: 'friend', //聊天类型不能用 kefu
                avatar: XoW.DefaultImage.AVATAR_KEFU,
                id: toId,
                jid: "#demohelp@intelligentcusservice." + XoW.config.domain,
                temporary: true
            });
        },
        login: function (oThis, e) {
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
            if (!_verifyForm(elem, settings)) {
                return;
            }
            var field = _getFormFields(elem);

      layui.each(call.login, function(i, item){
        item && item(field);
	});
      XoW.logger.me(_this.classInfo, 'login()');
    },
    logout: function(oThis, e) {
      XoW.logger.ms(_this.classInfo, 'logout()');
      _layer.msg('确认退出当前账号吗？', {
        time: 5 * 1000
        ,btn: ['确定', '取消']
        ,yes: function(index){
          XoW.logger.ms(_this.classInfo, 'logout.yes()');
          _layer.close(index);
          layui.each(call.logout, function(index, item){
            item && item();
	    });
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
          events.menu_remote_search(oThis, e);
          break;
        case 'qrcode':
          _layer.msg('扫码是神马？程序猿回家洗衣服、扫地鸟 :（');
          break;
        case 'speak':
          events.menu_speak(oThis, e);
          break;
        case 'help':
          events.menu_help(oThis, e);
          break;
        case 'cart':
          _layer.msg('购物车暂未集成，敬请期待');
          break;
        case 'clear':
          _clearCache();
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
          events.open_mine_info.index = _layer.open({
            type: 1 // 1表示页面内，2表示frame
            ,title: '我的资料'
            ,shade: false
            ,maxmin: true
            ,area: ['600px', '520px']
            ,skin: 'layui-box layui-layer-border'
            ,resize: true
            ,content: content
            ,btn: ['保存', '关闭']
            ,success: function(layero, index) {
              _layDate.render({
                elem: '#set_mine_vcard_bday'
                ,format: 'yyyy-MM-dd'
              });
            }
            ,btn1: function(index, layero) {
              XoW.logger.ms(_this.classInfo, 'open_mine_info.btn1()');
              var elem = layero.find('.layui-form');
              if(!_verifyForm(elem)) {
                return;
              }
              var field = _getFormFields(elem);
              // _layer.alert(JSON.stringify(field));
              var imgAvatar = layero.find('#img_set_mine_avatar')[0];
              if(imgAvatar.tag === 'changed') {
                layui.each(call.setMineInfoWithAvatar, function(index, item){
                  // data:image/jpeg;base64,xxx
                  var ay = imgAvatar.src.split(';base64,', 2);
                  var type = ay[0].split(':', 2)[1];
                  field = $.extend({base64: ay[1], type: type}, field);
                  item && item(field, function(){
                    _layer.close(events.open_mine_info.index);
                  });
                });
              } else {
                layui.each(call.setMineInfo, function(index, item){
                  item && item(field, function(){
                    _layer.close(events.open_mine_info.index);
                  });
                });
              }
            }
            ,btn2: function() {
              _layer.close(events.open_mine_info.index);
            }
          });
          XoW.logger.me(_this.classInfo, 'getMineInfo.cb()');
        });
        XoW.logger.me(_this.classInfo, 'open_mine_info.cb()');
      });
    },
    set_mine_avatar: function(oThis, e) {
      XoW.logger.ms(_this.classInfo, 'set_mine_avatar()');
      var $fileInput = $('#ipt_set_mine_avatar')[0];
      $fileInput.onchange = function(e) {
        XoW.logger.ms(_this.classInfo, '$fileInput.change()');
        var $file = e.target.files[0]; // $file.size is base64 size?
        var reader = new FileReader();
        reader.onload = function (e) {
          XoW.logger.ms('FileReader.onload({0},{1}) '.f($file.filename, $file.size));
          if($file.size > 10*1024){
            _layer.msg('上传的图片的不能超过10K,请重新选择');
            return;
          }
          $('#img_set_mine_avatar')[0].src = e.target.result;
          $('#img_set_mine_avatar')[0].tag = 'changed';
          // xmpp temp-vcard不允许单独设置头像 :<
          //layui.each(call.setMineInfoWithAvatar, function(index, item){
          //  var photo = e.target.result.split('base64,')[1];
          //  item && item({base64: photo, type: $file.type},function(){
          //    _layer.msg('头像设置成功');
          //  });
          //});
        };
        if ($file) {
          reader.readAsDataURL($file);
          $fileInput.value = ''; // reset input value
        }
        //delete reader;
        XoW.logger.me(_this.classInfo, '$fileInput.change()');
      };
      $fileInput.click();
      XoW.logger.me(_this.classInfo, 'set_mine_avatar()');
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
            if (!sid) {
                XoW.logger.e('There is no element with attribute sid, return.');
                return;
            }
            var thatChat = _getThisChat();
            if (!thatChat) {
                return;
            }
            var param = {
                sid: sid,
                jid: thatChat.data.jid // bare jid
            }
            layui.each(call.stopFile, function (index, item) {
                item && item(param);
            });
            XoW.logger.me(_this.classInfo, 'stop_file()');
        },
        find: function () {
            XoW.logger.ms(_this.classInfo, 'find()');
            var content = _layTpl(_eleMainMoreTool).render(_layIM.cache().base.moreList);
            _layer.close(events.find.index);
            events.find.index = _layer.open({
                type: 1 // 1表示页面内，2表示frame
                , title: '更多'
                , shade: false
                , maxmin: true
                , area: ['600px', '520px']
                , skin: 'layui-box layui-layer-border'
                , resize: true
                , content: content
            });
            XoW.logger.me(_this.classInfo, 'find()');
        },
        open_remote_chat_log: function (oThis, e) {
            XoW.logger.ms(_this.classInfo, 'open_remote_chat_log()');
            var thatChat = _getThisChat();
            if (!_cache.base.chatLog) {
                return _layer.msg('未开启聊天记录漫游功能');
            }
            // 陌生人加入群组,不知道会不会影响到好友订阅模块 todo [20190107]
            var friends = _cache.friend;
            if (thatChat.data.temporary) {
                var has;
                $.each(_cache.friend, function (index, group) {
                    if (group.groupid === '临时会话') {
                        group.push(thatChat.data);
                        has = true;
                        return false;
                    }
                });
                if (!has) {
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
            if (!_verifyForm(elem)) {
                return;
            }
            var field = _getFormFields(elem);

            // 3.搜索
            var param = {
                withJid: field['qry_log_jid'],
                ownerJid: _cache.mine.jid,
                keyword: field['qry_log_keyword'],
                startDate: [field['qry_log_start_date'], 'T00:00:00.000Z'].join(''),
                endDate: [field['qry_log_end_date'], 'T23:59:59.999Z'].join(''),
                pageSize: 5
            };
            var getMsg = function (pPageNum, pCallback) {
                param.after = (pPageNum - 1) * param.pageSize - 1;
                layui.each(call.searchChatLog, function (index, item) {
                    item && item(param, function (res) {
                        XoW.logger.ms(_this.classInfo, 'search_chat_log_remote_cb()');
                        var pageCount = res.set.count / param.pageSize;
                        pCallback && pCallback(res, pageCount);
                        XoW.logger.me(_this.classInfo, 'search_chat_log_remote_cb()');
                    });
                });
            }
            _layFlow.load({
                elem: '#flow_chat_log_cont' //流加载容器
                , isAuto: false
                , end: '<li class="layim-msgbox-tips">暂无更多消息记录</li>'
                , done: function (pPageNum, next) {
                    var lis = [];
                    getMsg(pPageNum, function (pResult, pPageCount) {
                        layui.each(pResult.archive, function (index, pMsg) {
                            lis.push(_layTpl(_elemRemoteSearchChatLogRes).render(pMsg));
                        });
                        next(lis.join(''), pPageNum < pPageCount);
                    });
                } // eof done
            });
            XoW.logger.me(_this.classInfo, 'search_chat_log_remote()');
        },
        more_filter: function (oThis, e) {
            XoW.logger.ms(_this.classInfo, 'more_filter()');
            var $moreFilter = oThis.find('.layui-icon');
            if (e.currentTarget.dataset.chevron === 'down') {
                $moreFilter.html('&#xe619');
                oThis[0].dataset.chevron = 'up';
                oThis.parent().find('#qry_log_date').removeClass('layui-hide');
            } else {
                $moreFilter.html('&#xe61a');
                oThis[0].dataset.chevron = 'down';
                oThis.parent().find('#qry_log_date').addClass('layui-hide');
            }
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
        open_local_user_search: function (oThis, e) {
            XoW.logger.ms(_this.classInfo, 'open_local_user_search()');
            var search = _getLayImMain().find('.layui-layim-search');
            var main = _getLayImMain().find('#layui-layim-search');
            var input = search.find('input'), find = function () {
                XoW.logger.ms(_this.classInfo, 'open_local_user_search.find()');
                var val = input.val().replace(/\s/);
                if (val === '') {
                    // events.tab(events.tab.index|0);
                } else {
                    var dataFriends = [], dataGroups = [], dataHistories = [];
                    var friend = _cache.friend || [];
                    var group = _cache.group || [];
                    var html = '';
                    for (var i = 0; i < friend.length; i++) {
                        for (var k = 0; k < (friend[i].list || []).length; k++) {
                            if (friend[i].list[k].id.indexOfIgnoreCase(val) !== -1
                                || friend[i].list[k].username.indexOfIgnoreCase(val) !== -1) {
                                var item = friend[i].list[k];
                                item.type = 'friend';
                                item.name = friend[i].list[k].username || '佚名';
                                item.index = i;
                                item.list = k;
                                dataFriends.push(friend[i].list[k]);
                            }
                        }
                    }
                    for (var j = 0; j < group.length; j++) {
                        if (group[j].id.indexOfIgnoreCase(val) !== -1
                            || group[j].groupname.indexOfIgnoreCase(val) !== -1) {
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
                            for (var i = allChatLog[key].length - 1; i >= 0; --i) { // 倒序
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

                    if (dataFriends.length > 0 || dataGroups.length > 0 || dataHistories.length > 0) {
                        dataFriends.title = "好友";
                        dataGroups.title = "聊天室";
                        dataHistories.title = "聊天记录";
                        html = _layTpl(_eleLocalSearchRes).render({
                            friends: dataFriends
                            , groups: dataGroups
                            , histories: dataHistories
                        });
                    } else {
                        html = '<li class="layim-null">无本地查找结果</li>';
                    }

                    html += '<hr><li class="layim-null-redirect" layImEx-event="open_remote_user_search" tag="' + val + '">到查找面板查找"' + val + '"</li>';
                    main.html(html);
                    _layIM.events().tab(3);
                }
                XoW.logger.me(_this.classInfo, 'open_local_user_search.find()');
            };
            // if(!_cache.base.isfriend && _cache.base.isgroup){
            //   _layIM.events().tab.index = 1;
            // } else if(!_cache.base.isfriend && !_cache.base.isgroup){
            //   _layIM.events().tab.index = 2;
            // }
            search.show();
            input.focus();
            input.off('keyup', find).on('keyup', find);
            XoW.logger.me(_this.classInfo, 'open_local_user_search()');
        },
        search_user_remote: function (oThis, e) {
            XoW.logger.ms(_this.classInfo, 'search_user_remote()');
            var $p = oThis.parent().parent();
            var $input = $p.find('input');
            if (!$input) {
                XoW.logger.e('There is no element of input, return.');
                return;
            }
            var val = $input.val().replace(/\s/);
            if (val === '') {
                XoW.logger.i('There is empty input, return.');
                return;
            }
            var param = {
                username: val
            }
            layui.each(call.searchUser, function (index, item) {
                item && item(param);
            });
            XoW.logger.me(_this.classInfo, 'search_user_remote()');
        },
        add_friend: function (oThis, e) {
            XoW.logger.ms(_this.classInfo, 'add_friend()');
            var jid = e.currentTarget.dataset.jid;
            var stranger;
            if (_cache.searchResOfStranger) {
                stranger = _cache.searchResOfStranger.find(function (x) {
                    return x.jid === jid
                });
            }
            if (!stranger) {
                var thatChat = _getThisChat();
                stranger = thatChat.data;
            }
            stranger.type = 'friend';
            stranger.submit = function (pGroupName, pRemark, pIndex) {
                XoW.logger.ms(_this.classInfo, 'add_friend_submit()');
                var cont = $(window.event.currentTarget).parent().parent();
                this.groupid = pGroupName;
                this.remark = pRemark;
                // this.username = '人工NICK_' + this.username;
                layui.each(call.subContact, function (index, item) {
                    item && item(stranger);
                });
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
            var renderMsg = function (pPage, pCallback) {
                pPage = pageCount - pPage; // reverse sort
                var curAy = local.sysInfo.slice(pPage * unitNum, (pPage + 1) * unitNum);
                if (!curAy) {
                    return _layer.msg('没有更多数据了.');
                }
                pCallback && pCallback(curAy.reverse(), local.sysInfo.length / unitNum);
            };
            _layer.close(events.open_sys_info_box.index);
            events.open_sys_info_box.index = _layer.open({
                type: 1
                , title: '消息盒子'
                , shade: false
                , maxmin: true
                , area: ['600px', '520px']
                , skin: 'layui-box layui-layer-border'
                , resize: false
                , content: '<ul class="layim-msgbox" id="flow_msgbox_cont"></ul>'
                , success: function (layero, index) {
                    _$sysInfoBox = layero;
                    _layFlow.load({
                        elem: '#flow_msgbox_cont' //流加载容器
                        , isAuto: false
                        , end: '<li class="layim-msgbox-tips">暂无更多新消息</li>'
                        , done: function (page, next) { //加载下一页
                            renderMsg(page, function (data, pages) {
                                var html = _layTpl(_eleSysInfoBox).render({
                                    data: data
                                    , page: page
                                });
                                next(html, page < pages);
                            });
                        }
                    });
                }
            });

            layui.data('layim', {
                key: _cache.mine.id
                , value: local
            });
            XoW.logger.me(_this.classInfo, 'open_sys_info_box()');
        },
        approve_user_sub: function (oThis, e) {
            XoW.logger.ms(_this.classInfo, 'approve_user_sub()');
            var userJid = e.currentTarget.dataset.jid;
            var $grPar = oThis.parent().parent();
            _layIM.setFriendGroup({
                type: 'friend'
                , username: $grPar.find('p.layim-msgbox-user>a').html()
                , avatar: $grPar.find('img.layim-msgbox-avatar')[0].src
                , group: _cache.friend //获取好友列表数据
                , submit: function (pGroupName, pIndex) {
                    XoW.logger.ms(_this.classInfo, 'agree_sub_submit()');
                    var local = layui.data('layim')[_cache.mine.id] || {};
                    layui.each(call.approveUserSub, function (index, item) {
                        item && item({
                            jid: userJid,
                            groupid: pGroupName,
                            username: /*'人工NICK_'+*/ $grPar.find('p.layim-msgbox-user>a').html()
                        });
                    });
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
                        , value: local
                    });
                    XoW.logger.me(_this.classInfo, 'agree_sub_submit()');
                }
            });
            XoW.logger.me(_this.classInfo, 'approve_user_sub()');
        },
        deny_user_sub: function (oThis, e) {
            XoW.logger.ms(_this.classInfo, 'deny_user_sub()');
            var userJid = e.currentTarget.dataset.jid;
            layui.each(call.denyUserSub, function (index, item) {
                item && item({
                    jid: userJid
                });
            });
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
                , value: local
            });
            XoW.logger.me(_this.classInfo, 'deny_user_sub()');
        },
        open_url_page: function (oThis, e) {
            XoW.logger.ms(_this.classInfo, 'open_url_page()');
            var pageUrl = oThis.data('src');
            if (!pageUrl) return;
            window.open(pageUrl);
            XoW.logger.me(_this.classInfo, 'open_url_page()');
        },
        serchFirendmsg: function (oThis, e) {
            var stope = layui.stope;
            let items = document.getElementsByClassName('AreadyC');
            let invites = [];
            for (let i = 0; i < items.length; i++) {
                let t = $(items[i]);
                let invitText = $.trim(t.text());
                invites[invitText] = true;
            }
            let serchtext = $.trim($('#searchText').val());
            var _friend;
            //add by zjy for 消除Client依赖 [20190801]
            layui.each(call.getFriendGroups, function (index, item) {
                item && item(function (param) {
                    _friend=param;
                });
            });
            let index = layer.tips('<ul class="seachMemberLists"></ul>', oThis, {
                tips: 3
                , time: 0
                , anim: 5
                , fixed: true
                , tipsMore: false
                , skin: 'layui-box layui-layim-face'
                , success: function (layero) {
                    let li = ' <form class="layui-form">' +
                        '<div class="layui-input-block">'
                    for (var i = 0; i < _friend.length; i++) {
                        _friend[i].list.find(function (x) {
                            if (XoW.UserState.OFFLINE !== x.status && (XoW.utils.getNodeFromJid(x.jid).indexOf(serchtext) >= 0 || x.jid.indexOf(serchtext) >= 0)) {
                                let rommFrened = {
                                    name: XoW.utils.getNodeFromJid(x.jid),
                                    jid: x.jid
                                }
                                if (invites[x.jid] != true) {
                                    li += '<input type="checkbox" name="' + rommFrened.name + '" lay-filter = "checkInnvetion" isSvert = "true" data-jid="' + rommFrened.jid + '"  class = "SerC' + rommFrened.name + '" lay-skin="primary" title="' + rommFrened.jid + '">'
                                }
                                else {
                                    li += '<input type="checkbox" name="' + rommFrened.name + '" lay-filter = "checkInnvetion" isSvert = "true" data-jid="' + rommFrened.jid + '"  class = "SerC' + rommFrened.name + '" lay-skin="primary" title="' + rommFrened.jid + '" checked>'
                                }
                            }
                        });
                    }
                    li += '</div>'
                    li += '</form>'
                    $('.seachMemberLists').html(li);
                    layero.on('mousedown', function (e) {
                        stope(e);
                    });
                }
            });
            let Hidi = function () {
                layer.close(index);
            }
            let stopmp = function (e) {
                stope(e)
            };
            $(document).off('mousedown', Hidi).on('mousedown', Hidi);
            $(window).off('resize', Hidi).on('resize', Hidi);
            oThis.off('mousedown', stopmp).on('mousedown', stopmp);
            stope(e)
            _layForm.render();
        },
        roomTitleW: function (oThis, e) {
            let jid = e.currentTarget.dataset.jid;
            let data = {
                jid: jid
            }
            let content = _layTpl(_elemRoomtileHtml).render(data);
            _layer.open({
                title: '房间主题',
                content: content,
                area: ['602px', '522px'],
                btn: false
            })
        }
    };
    // endregion LayImEx-event handlers

    // region Private Methods
    var _init = function () {
        XoW.logger.ms(_this.classInfo, '_init()');
        _device = layui.device();
        _cache = _layIM.cache();

        $('body').on('click', '*[layImEx-event]', function (e) {
            var oThis = $(this), method = oThis.attr('layImEx-event');
            events[method] ? events[method].call(this, oThis, e) : '';
        });
        XoW.logger.me(_this.classInfo, '_init()');
    };
	var _rebindToolFileButton = function() {
		XoW.logger.ms(_this.classInfo, 'rebindToolFileButton()');
		var thatChat = _getThisChat();
		if(!thatChat) {
			return;
		}
		var $fileToolboxs = thatChat.elem.find('.layim-chat-footer').find('.layim-chat-tool .layim-tool-image');
		$.each($fileToolboxs, function() {
			var $fileInput = $(this);
			this.removeAttribute('layim-event');
			var type = this.getAttribute('data-type') || 'images';
			if(type === 'images') {
				//$fileInput.find('input')[0].setAttribute('accept', '.png,.jpeg,.gif,.jpg')
			}
			$fileInput.click(function(e) {
				XoW.logger.ms(_this.classInfo, 'fileInput.click()');
				if(thatChat.data.status === XoW.UserState.OFFLINE) {
                  var $file = e.target.files[0];
                    if($file != null&&typeof($file)!="undefined") {
                      let thatchat = _getThisChat();
                      layui.each(call.sendOffFile, function (index, item) {
                        item && item($file,thatchat);
                      });
                     // _httpfiletransfer($file);   //离线就进行离线传输

                    }
                    e.stopImmediatePropagation();
				}
			});
			$fileInput.change(function(e) {
				XoW.logger.ms(_this.classInfo, 'fileInput.change({0})'.f($fileInput[0].children[0].value));
				var $file = e.target.files[0];
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
                      //  _httpfiletransfer($file);

                        e.stopImmediatePropagation();
                    }
                }
			});
		});
		XoW.logger.me(_this.classInfo, 'rebindToolFileButton()');
	};
    var _rebindToolFileButton = function () {
        XoW.logger.ms(_this.classInfo, 'rebindToolFileButton()');
        var thatChat = _getThisChat();
        if (!thatChat) {
            return;
        }
        // the tool box class name is 'layim-tool-image'
        var $fileToolboxs = thatChat.elem.find('.layim-chat-footer').find('.layim-chat-tool .layim-tool-image');
        $.each($fileToolboxs, function () {
            // 屏蔽掉layim.js中的操作，阻止上传文件
            var $fileInput = $(this);
            this.removeAttribute('layim-event');
            var type = this.getAttribute('data-type') || 'images';
            if (type === 'images') {
                $fileInput.find('input')[0].setAttribute('accept', '.png,.jpeg,.gif,.jpg')
            }
            // 离线状态屏蔽click操作
            $fileInput.click(function (e) {
                XoW.logger.ms(_this.classInfo, 'fileInput.click()');
                // 小小依赖了下XoW.UserState by cy
                if (thatChat.data.status === XoW.UserState.OFFLINE) {
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
            });
        });
        XoW.logger.me(_this.classInfo, 'rebindToolFileButton()');
    };
    var _changeMineStatus = function (pStatus) {
        XoW.logger.ms(_this.classInfo, '_changeMineStatus()');
        // $('.layui-layim-status').find('ul li:last-child')等价于 $('.layui-layim-status').find('li').eq(-1)
        $('.layui-layim-status').html(_layTpl(_eleMineStatus).render({
            mine: {status: pStatus}
        }));// 暂时用隐身代替离线
        XoW.logger.me(_this.classInfo, '_changeMineStatus()');
    };
    var _roomRefresh = function () {
        let getallroom ;
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getSaveoutAllRoom,function(index,item){
            item&&item(function(param){
                getallroom=param;
            });
        });
        for (var i = 0; i < getallroom.length; i++) {
            var r = getallroom[i];
            _layIM.removeList(r);
        }
        //add by zjy for 消除Client依赖 [20190801]
        layui.each(call.getAllRFServer,function(index,item){
            item&&item();
        });
        _layer.closeAll('tips');
    }
    var _changeMineUsername = function (params) {
        XoW.logger.ms(_this.classInfo, '_changeMineAvatar()');
        $('.layui-layim-user').text(params);
        _cache.mine.username = params;
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
    /**
     * 获取当前聊天面板,copy from layim.js
     * @returns {{elem: *, data, textarea: (*|{})}}
     * @private
     */
    var _getThisChat = function () {
        XoW.logger.ms(_this.classInfo, '_getThisChat()');
        // layimChat
        var $layimChat = _getChatEle();
        if (!$layimChat || $layimChat.length == 0) {
            return null;
        }
        var index = $('.layim-chat-list .' + THIS).index();
        var cont = $layimChat.find('.layim-chat').eq(index);
        var to = JSON.parse(decodeURIComponent(cont.find('.layim-chat-tool').data('json')));
        return {
            elem: cont
            , data: to
            , textarea: cont.find('textarea')
        };
    };
    var _getChatEle = function () {
        var $layimChat = $('.layui-layer-page.layui-layim-chat');
        return $layimChat; // jquery对象
    };
    var _getLayImMain = function () {
        var $layimMain = $('#layui-layim');
        return $layimMain; // jquery对象
        // return $layimMain[0]; // dom对象
    };
    /**
     * copy from layim.js
     */
    var _chatListMore = function () {
        var thatChat = _getThisChat(), chatMain = thatChat.elem.find('.layim-chat-main');
        var ul = chatMain.find('ul');
        var length = ul.find('li').length;

        if (length >= MAX_ITEM) {
            var first = ul.find('li').eq(0);
            if (!ul.prev().hasClass('layim-chat-system')) {
                ul.before('<div class="layim-chat-system"><span layim-event="chatLog">查看更多记录</span></div>');
            }
            if (length > MAX_ITEM) {
                first.remove();
            }
        }
        chatMain.scrollTop(chatMain[0].scrollHeight + 1000);
        chatMain.find('ul li:last').find('img').load(function () {
            chatMain.scrollTop(chatMain[0].scrollHeight + 1000);
        });
    };
    var _getFriendById = function (pId) {
        XoW.logger.ms(_this.classInfo, '_getFriendById({0})'.f(pId));
        var type = 'friend';
        for (var i = 0; i < _cache[type].length; i++) {
            var item = _cache[type][i].list.find(function (x) {
                return x.id === pId
            });
            if (item) {
                return item;
            }
        }
        return null;
    };
    var _getDataFromFriendListItem = function (pId) {
        XoW.logger.ms(_this.classInfo, '_getDataFromFriendListItem()');
        var li = _getLayImMain().find('.layim-list-friend .layim-friend{0}'.f(pId));
        // copy from layim.chat()
        var local = layui.data('layim')[_cache.mine.id] || {};
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
    var _blinkSysInfoIcon = function () {
        XoW.logger.ms(_this.classInfo, '_blinkSysInfoIcon()');
        if (!_getLayImMain()) return;
        var $msgBox = _getLayImMain().find('.layim-tool-msgbox');
        if ($msgBox & $msgBox.hasClass('layui-anim-loop layer-anim-05')) {
            $msgBox.find('span').html($msgBox.find('span').val() + 1);
        } else {
            $msgBox.find('span').addClass('layui-anim-loop layer-anim-05').html(1);
        }
        if (_cache.base.voice) {
            _layIM.voice();
        }
        XoW.logger.me(_this.classInfo, '_blinkSysInfoIcon()');
    };
    var _renderSearchChatLogFrm = function () {
        XoW.logger.ms(_this.classInfo, '_renderSearchChatLogFrm()');
        _layForm.render();// 渲染下拉列表等
        //设置开始-结束时间，默认7天
        var curDate = new Date();
        var lastWeek = new Date(curDate.getTime() - 7 * 24 * 60 * 60 * 1000); //一周前
        var startDate = _layDate.render({
            elem: '#qry_log_start_date',
            value: _layUtil.toDateString(lastWeek, 'yyyy-MM-dd'),
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
            value: _layUtil.toDateString(curDate, 'yyyy-MM-dd'),
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

    var _$searchBox, _openRemoteSearchBox = function (pParam) {
        XoW.logger.ms(_this.classInfo, '_openRemoteSearchBox()');
        pParam = pParam || {tab: 'user'};
        var content = _layTpl(_eleRemoteSearchBox).render(pParam);
        _layer.close(_openRemoteSearchBox.index);
        _openRemoteSearchBox.index = _layer.open({
            type: 1 // 1表示页面内，2表示frame
            , title: '查找'
            , shade: false
            , maxmin: true
            , area: ['600px', '520px']
            , skin: 'layui-box layui-layer-border'
            , resize: true
            , content: content
            , success: function (layero, index) {
                XoW.logger.ms(_this.classInfo, 'open_remote_search.cb()');
                _$searchBox = layero;
                _renderSearchChatLogFrm();
                if ('user' === pParam.tab) {
                    layero.find('#qry_user_keyword').val(pParam.keyword);
                    var $layimSearchBtn = layero.find('#btn_search_user_remote');
                    if ($layimSearchBtn) {
                        $layimSearchBtn.click();
                    }
                    var $search = $('.layui-layim').find('.layui-layim-search');
                    $search.find('input').val('');
                    $search.hide();
                    _layIM.events().tab(_layIM.events().tab.index | 0);
                } else if ('chatLog' === pParam.tab) {
                    var $layimSearchBtn = layero.find('#btn_search_chat_log_remote');
                    if ($layimSearchBtn) {
                        $layimSearchBtn.click();
                    }
                }
                XoW.logger.me(_this.classInfo, 'open_remote_search.cb()');
            }
        });
        XoW.logger.me(_this.classInfo, '_openRemoteSearchBox()');
    };

    var _verifyForm = function (pFrm) {
        XoW.logger.ms(_this.classInfo, '_verifyForm()');
        var verify = _layForm.config.verify, stop = null
            , DANGER = 'layui-form-danger'
            , verifyElem = pFrm.find('*[lay-verify]'); //获取需要校验的元素

        //1. 开始校验, reference to form.js
        layui.each(verifyElem, function (_, item) {
            var othis = $(this)
                , vers = othis.attr('lay-verify').split('|')
                , verType = othis.attr('lay-verType') //提示方式
                , value = othis.val();

            othis.removeClass(DANGER);
            layui.each(vers, function (_, thisVer) {
                var isTrue //是否命中校验
                    , errorText = '' //错误提示文本
                    , isFn = typeof verify[thisVer] === 'function';

                //匹配验证规则
                if (verify[thisVer]) {
                    var isTrue = isFn ? errorText = verify[thisVer](value, item) : !verify[thisVer][0].test(value);
                    errorText = errorText || verify[thisVer][1];

                    //如果是必填项或者非空命中校验，则阻止提交，弹出提示
                    if (isTrue) {
                        //提示层风格
                        if (verType === 'tips') {
                            _layer.tips(errorText, function () {
                                if (typeof othis.attr('lay-ignore') !== 'string') {
                                    if (item.tagName.toLowerCase() === 'select' || /^checkbox|radio$/.test(item.type)) {
                                        return othis.next();
                                    }
                                }
                                return othis;
                            }(), {tips: 1});
                        } else if (verType === 'alert') {
                            _layer.alert(errorText, {title: '提示', shadeClose: true});
                        } else {
                            _layer.msg(errorText, {icon: 5, shift: 6});
                        }
                        if (!_device.android && !_device.ios) item.focus(); //非移动设备自动定位焦点
                        othis.addClass(DANGER);
                        return stop = true;
                    }
                }
            });
            if (stop) return stop;
        });
        if (stop) {
            return false
        } else {
            return true;
        }
    };
    var _getFormFields = function (pFrm) {
        XoW.logger.ms(_this.classInfo, '_getFormFields()');
        // 2. 获取表单内容 reference to form.js
        var field = {}, fieldElem = pFrm.find('input,select,textarea'); //获取所有表单域
        var nameIndex = {}; //数组 name 索引
        layui.each(fieldElem, function (_, item) {
            item.name = (item.name || '').replace(/^\s*|\s*&/, '');
            if (!item.name) return;
            //用于支持数组 name
            if (/^.*\[\]$/.test(item.name)) {
                var key = item.name.match(/^(.*)\[\]$/g)[0];
                nameIndex[key] = nameIndex[key] | 0;
                item.name = item.name.replace(/^(.*)\[\]$/, '$1[' + (nameIndex[key]++) + ']');
            }
            if (/^checkbox|radio$/.test(item.type) && !item.checked) return;
            field[item.name] = item.value;
        });
        return field;
        // _layer.msg(JSON.stringify(field));
    };

    var _tempUploadAvatar = function (e) {
        XoW.logger.ms(_this.classInfo, '$fileInput.change()');
        var $file = e.target.files[0]; // $file.size is base64 size?
        var reader = new FileReader();
        reader.onload = function (e) {
            XoW.logger.ms('FileReader.onload() ' + $file.filename);
            $('#img_set_mine_avatar').src = e.target.result;
        };
        delete reader;
        XoW.logger.me(_this.classInfo, '$fileInput.change()');
    };
    var _clearCache = function () {
        XoW.logger.ms(_this.classInfo, '_clearCache()');
        _layer.msg('确认删除所有本地数据吗？', {
            time: 5 * 1000
            , btn: ['确定', '取消']
            , yes: function (index) {
                XoW.logger.ms(_this.classInfo, '_clearCache.yes()');
                localStorage.clear();
                _layer.close(index);
            }
        });
        XoW.logger.me(_this.classInfo, '_clearCache()');
    };
    // endregion Private Methods

    // region Overload functions of layim
    var faces = function () {
        var alt = ["[微笑]", "[嘻嘻]", "[哈哈]", "[可爱]", "[可怜]", "[挖鼻]", "[吃惊]", "[害羞]", "[挤眼]", "[闭嘴]", "[鄙视]", "[爱你]", "[泪]", "[偷笑]", "[亲亲]", "[生病]", "[太开心]", "[白眼]", "[右哼哼]", "[左哼哼]", "[嘘]", "[衰]", "[委屈]", "[吐]", "[哈欠]", "[抱抱]", "[怒]", "[疑问]", "[馋嘴]", "[拜拜]", "[思考]", "[汗]", "[困]", "[睡]", "[钱]", "[失望]", "[酷]", "[色]", "[哼]", "[鼓掌]", "[晕]", "[悲伤]", "[抓狂]", "[黑线]", "[阴险]", "[怒骂]", "[互粉]", "[心]", "[伤心]", "[猪头]", "[熊猫]", "[兔子]", "[ok]", "[耶]", "[good]", "[NO]", "[赞]", "[来]", "[弱]", "[草泥马]", "[神马]", "[囧]", "[浮云]", "[给力]", "[围观]", "[威武]", "[奥特曼]", "[礼物]", "[钟]", "[话筒]", "[蜡烛]", "[蛋糕]"],
            arr = {};
        layui.each(alt, function (index, item) {
            arr[item] = layui.cache.dir + 'images/face/' + index + '.gif';
        });
        return arr;
    }();

    layui.data.content = function (content) {
        //XoW.logger.e('self content @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
        //支持的html标签
        var html = function (end) {
            return new RegExp('\\n*\\[' + (end || '') + '(code|pre|div|span|p|table|thead|th|tbody|tr|td|ul|li|ol|li|dl|dt|dd|h2|h3|h4|h5)([\\s\\S]*?)\\]\\n*', 'g');
        };
        content = (content || '')

            .replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
            .replace(/</g, '&lt;').replace(/>/g, '&gt;') //XSS
            // .replace(/@(\S+)(\s+?|$)/g, '@<a href="javascript:;">$1</a>$2') //转义@ // 与jid的@符号冲突 del by cy [20190417]
            .replace(/'/g, '&#39;').replace(/"/g, '&quot;')
            .replace(/fileEx\([\s\S]+?\)\[[\s\S]*?\]/g, function (str) { //转义文件
                var text = (str.match(/\)\[([\s\S]*?)\]/) || [])[1];
                if (!text) return str;
                text = text.replace(/&quot;/g, '"');
                // 把: { } 转换过来先
                var theThumbnail = $.parseJSON(text); // 存在
                if (!theThumbnail) return str;

                var overdue = false;
                if (_cache.local && _cache.local.chatlog) {
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
                if (overdue) {
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
                if(theThumbnail.url!='*'){
                    thatFile.url = theThumbnail.url;
                }
                thatFile.base64 = theThumbnail.base64;
                var html = _layTpl(_eleImage).render(thatFile);
                thatFile = null;
                return html;
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
                thatFile.percent = theThumbnail.percent;
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
            .replace(/face\[([^\s\[\]]+?)\]/g, function (face) {  //转义表情
                var alt = face.replace(/^face/g, '');
                return '<img alt="' + alt + '" title="' + alt + '" src="' + faces[alt] + '">';
            })
            .replace(/img\[([^\s]+?)\]/g, function (img) {  //转义图片
                return '<img class="layui-layim-photos" src="' + img.replace(/(^img\[)|(\]$)/g, '') + '">';
            })
            .replace(/file\([\s\S]+?\)\[[\s\S]*?\]/g, function (str) { //转义文件
                var href = (str.match(/file\(([\s\S]+?)\)\[/) || [])[1];
                var text = (str.match(/\)\[([\s\S]*?)\]/) || [])[1];
                if (!href) return str;
                return '<a class="layui-layim-file" href="' + href + '" download target="_blank"><i class="layui-icon">&#xe61e;</i><cite>' + (text || href) + '</cite></a>';
            })

            //.replace(/linkEx\([\s\S]+?\)\[[\s\S]*?\]/g, function(str){
            .replace(/linkEx\[[\s\S]*?\]/g, function (str) {
                var text = (str.match(/\[([\s\S]*?)\]/) || [])[1];
                //var href = (content.match(/linkEx\(([\s\S]+?)\)\[/)||[])[1];
                if (!text) return str;
                var theThumbnail = $.parseJSON(text.replace(/&quot;/g, '"'));
                if (!theThumbnail) return str;
                var html = _layTpl(_elePageThumbnail).render(theThumbnail);
                theThumbnail = null;
                return html;
            })
      .replace(/audio\[([^\s]+?)\]/g, function(audio){  //转义音频
        return '<div class="layui-unselect layui-layim-audio" layim-event="playAudio" data-src="' + audio.replace(/(^audio\[)|(\]$)/g, '') + '"><i class="layui-icon">&#xe652;</i><p>音频消息</p></div>';
      })
      .replace(/video\[([^\s]+?)\]/g, function(video){  //转义视频
        return '<div class="layui-unselect layui-layim-video" layim-event="playVideo" data-src="' + video.replace(/(^video\[)|(\]$)/g, '') + '"><i class="layui-icon">&#xe652;</i></div>';
      })
            .replace(/audio\[([^\s]+?)\]/g, function (audio) {  //转义音频
                return '<div class="layui-unselect layui-layim-audio" layim-event="playAudio" data-src="' + audio.replace(/(^audio\[)|(\]$)/g, '') + '"><i class="layui-icon">&#xe652;</i><p>音频消息</p></div>';
            })
            .replace(/video\[([^\s]+?)\]/g, function (video) {  //转义音频
                return '<div class="layui-unselect layui-layim-video" layim-event="playVideo" data-src="' + video.replace(/(^video\[)|(\]$)/g, '') + '"><i class="layui-icon">&#xe652;</i></div>';
            })
            .replace(/a\([\s\S]+?\)\[[\s\S]*?\]/g, function (str) { //转义链接
                var href = (str.match(/a\(([\s\S]+?)\)\[/) || [])[1];
                var text = (str.match(/\)\[([\s\S]*?)\]/) || [])[1];
                if (!href) return str;
                return '<a href="' + href + '" target="_blank">' + (text || href) + '</a>';
            }).replace(html(), '\<$1 $2\>').replace(html('/'), '\</$1\>') //转移HTML代码
            .replace(/\n/g, '<br>'); //转义换行
        return content;
    };
    // endregion Overload functions of layim
    exports('layImEx', new LAYIMEX()); //注意，这里是模块输出的核心，模块名必须和use时的模块名一致
}).addcss(
    '../../skin/css/layimex.css?v=2.0.2'
    , 'skinlayimexcss'
);
