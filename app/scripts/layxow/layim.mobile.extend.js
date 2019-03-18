/**
 * Created by cy
 * 1.It's an extension of layim, which should not depends on logic layer of xow,
 * but may be depends on the tools, constants or entities that from xow.
 * 2.初始化界面时候添加layim之外的元素函数名 bindXXX()，修改layim则rebindXXX()
 * 3.接口名mobile和pc版保持一致
 * 4.do not depends on jquery but zepto，have not implemented yet
 */
//layui.define(['layer', 'laytpl', 'layim'], function (exports) {
layui.define(['layer-mobile', 'laytpl', 'form', 'laypage',
  'laydate', 'util', 'element', 'flow', 'client'], function (exports) {
  // region Fields
  this.classInfo = 'layImEx';
  var $ = layui.zepto;
  var _layer = layui.mobile.layer;
  var _layUpload = layui.mobile.upload;
  var _layTpl = layui.laytpl;
  var _layIM = layui.mobile.layim;

  var _layFlow = layui.flow;
  var _layPage = layui.laypage;
  var _layForm = layui.form;
  var _layDate = layui.laydate;
  var _layUtil = layui.util;

  var THIS = 'layim-this', MAX_ITEM = 20;
  var _this = this;

  // layui.data('layim')[_cache.mine.id] 保存当前数据
  //>history:最近联系人
  //>cache.message:未读消息，读取之后会被清空
  //>cache.chat:未读联系人，读取之后会被清空
  //>cache.local.chatLog:上一次（登录前）聊天记录，不会实时刷新
  var _$sysInfoBox, _device, _cache, _reConnLoadTipIndex;
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

  // mark mobile
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
    '<div class="layim_file" sid="{{ d.sid }}">'
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
    ,'          <div class="layui-col-xs3">'
    ,'            <button class="layui-btn" layImEx-event="search_user_remote" id="btn_search_user_remote">搜索</button>'
    ,'          </div>'
    ,'        </div>'
    //,'      </div>'
    ,'        <div id="search_user_remote_res"></div>'
    ,'     </div>'
    ,'     <div class="layui-tab-item {{# if(\'room\' === d.tab){ }}layui-show{{# } }}">'
    ,'      搜索聊天室，聊天室功能模块添加了嘛'
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

  var _eleVCard = [
         '<div class="layui-form-item pt15">',
          '<div class="layim-msgbox"><li>',
            '<a href="javascript:void(0);" target="_blank"><img src="{{ d.avatar }}" class="layui-circle layim-msgbox-avatar" ></a>',
            '<p class="layim-msgbox-user"><span>昵&nbsp;&nbsp;称 </span> {{ d.name || d.username }}</p>',
            '<p class="layim-msgbox-user"><span>账&nbsp;&nbsp;号 </span> {{ d.id }}</p>',
            '<button class="layui-btn layui-btn layui-btn-primary layim-vcard-chat" layImEx-event="open_chat" data-id="{{d.id}}">发送消息</button>',
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

  // region mark mobile
  var _eleMineVCard = [
    '<div class="layui-bg-gray" style="margin-top: -10px;width: 100%;height:600px;">',
    '  <table class="layui-table" lay-skin="nob">',
    '    <colgroup>',
    '      <col width="30%">',
    '      <col width="70%">',
    '      <col>',
    '    </colgroup>',
    '    <tbody>',
    '      <tr>',
    '        <td colspan="2" id="setMineAvatar">',
    '          <div class="layim-vcard">',
    '            <li layimEx-event="set_mine_avatar">',
    '              <img src="{{ d.avatar }}">',
    '              <span>账号：{{ d.id }}</span>',
    '              <p>点击更换头像</p>',
    '         <input type="file" name="file" accpet = "image/*" capture = "camera" >',
    '           </li>',
    '         </div>',
    '         <i class="layim-vcard-edit layim-vcard-edit-mine layui-icon layui-icon-right"></i>',

    '        </td>',
    '      </tr>',
    '      <tr class="layui-elem-field layui-field-title">',
    '        <td class="selfInfoFont">账号</td>',
    '        <td><span class="selfInfoRight">{{ d.id }}</span></td>',
    '      </tr>',
    '      <tr class="layui-elem-field layui-field-title">',
    '        <td class="selfInfoFont">昵称</td>',
    '        <td>',
    '          <input type="text" class="layui-input layim-vcard-input" name="nickname" value="{{ d.name }}" placeholder="点击输入" lay-verify="required">',
    '          <i class="layim-vcard-edit layui-icon layui-icon-right">',
    '        </td>',
    '      </tr>',
    '      <tr class="layui-elem-field layui-field-title">',
    '        <td class="selfInfoFont">性别</td>',
    '        <td ><span class="selfInfoRight">保密</span></td>',
    '      </tr>',
    '      <tr class="layui-elem-field layui-field-title">',
    '        <td class="selfInfoFont">生日</td>',
    '        <td ><span class="selfInfoRight">{{d.vcard.BDAY}}</span><i class="layim-vcard-edit layui-icon layui-icon-right"></td>',
    '      </tr>',
    '      <tr class="layui-elem-field layui-field-title">',
    '        <td class="selfInfoFont">手机</td>',
    '        <td>',
    '          <input type="text" class="layui-input layim-vcard-input" name="telephone" value="{{ d.vcard.WORK.CELL_TEL || [] }}" placeholder="请输入" lay-verify="phone">',
    '          <i class="layim-vcard-edit layui-icon layui-icon-right">',
    '        </td>',
    '      </tr>',
    '      <tr class="layui-elem-field layui-field-title">',
    '        <td class="selfInfoFont">邮箱</td>',
    '        <td>',
    '          <input type="text" class="layui-input layim-vcard-input" name="email" value="{{ d.vcard.WORK.EMAIL || [] }}" placeholder="请输入" lay-verify="email">',
    '          <i class="layim-vcard-edit layui-icon layui-icon-right">',
    '        </td>',
    '      </tr>',
    '      <tr class="layui-elem-field layui-field-title" layimEx-event="open_vcard_field">',
    '        <td class="selfInfoFont">签名</td>',
    '        <td ><span class="selfInfoRight">{{d.sign || []}}</span><i class="layim-vcard-edit layui-icon layui-icon-right"></td>',
    '      </tr>',
    '      <tr class="layui-elem-field layui-field-title">',
    '        <td class="selfInfoFont">我的二维码</td>',
    '        <td><img class="selfInfoIcon"  src="../../skin/images/mine_barcode.png"></td>',
    '      </tr>',
    '      <tr class="layui-elem-field layui-field-title">',
    '        <td style="text-align:center" colspan="2"><button class="layui-btn layui-btn-normal" id="saveSelfInfo">保存编辑</button></td>',
    '      </tr>',
    '    </tbody>',
    '  </table>',
    '</div>'
  ].join('');

  var _elemMineVcardField = [
    '<div>',
    //'  <input type="text" class="layui-input">',
    '  <textarea name="signature" placeholder="请输入内容" class="layui-textarea noresize"></textarea>',
    '  <button class="layui-btn layui-btn-normal" layim-event="back" style="margin-top:5px;margin-left:155px">完成</button>',
    '</div>'].join('');

  var _elemMineInfoBriefLi = [
    '<li layImEx-event="open_mine_info">',
    '  <div><img src="{{ d.avatar }}"></div>',
    '  <span>{{ d.name || d.username }}</span>',
    '  <p>{{ d.sign }}</p>',
    '</li>'].join('');
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
      tool: [{
        alias: 'code', //工具别名
        title: '发送代码', //工具名称
        icon: '&#xe64e;' //工具图标，参考图标文档
      }, {
        alias: 'link',
        title: '发送商品链接',
        icon: '&#xe698;'
      }]
    }, pOptions);
    _layIM.config(pOptions);
  };
  // endregion mobile

  // region 初始化时构造界面

  LAYIMEX.prototype.bindFriendListMenu = function() {
    XoW.logger.ms(_this.classInfo, 'bindFriendListMenu()');

    var longPressFriendList = function(pId, pElem) {
      XoW.logger.ms(_this.classInfo, 'bindFriendListMenu.longPressFriendList()');
      var data = _getDataFromFriendListItem(pId);
      $(pElem).addClass('layui-m-layer-menu-gray');
      let index = _layer.open({
        content: _layTpl(_eleFriendMenu).render(data),
        skin: 'menu',
        shade: 'background-color:rgba(0,0,0, .3);',
        opacity: 0.2,
        time: 500,
        end: function() {
          XoW.logger.ms(_this.classInfo, 'longPressFriendList.end()');
          $(pElem).removeClass('layui-m-layer-menu-gray');
        }
      });
    };
    var timers = new Map();
    // 屏蔽layim-mobile.js中的touch
    $('.layim-list-friend .layui-layim-list li').each(function(idx ,element) {
      var oThis = $(element);
      var id = oThis.data('id');
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
            longPressFriendList(id, element);
          }, 1*3000));
        }

        e.preventDefault();
      }, false);
    });
    /*
    var timeOutEvent=0;
    $('.layim-list-friend .layui-layim-list li').each(function(index ,element) {
      var oThis = $(element);



      element.addEventListener('touchmove', function (e) {
        if (e.targetTouches.length == 1) {
          clearTimeout(timeOutEvent);
          timeOutEvent = 0;
        }
      });
      element.addEventListener('touchend', function (e) {
        if (e.changedTouches.length == 1) {
          clearTimeout(timeOutEvent);
          if(timeOutEvent !==0 ){
            element.style.background = "transparent"; // 恢复
          }
          return false;
        }
      }, false);

    });*/

    //$('.layim-list-friend').on('contextmenu', '.layui-layim-list li', function (e) {
    //  var oThis = $(e.currentTarget);
    //  var type = oThis.data('type'), index = oThis.data('index');
    //  var list = oThis.attr('data-list') || oThis.index(), data = {};
    //  if(type === 'friend'){
    //    data = _cache[type][index].list[list];
    //  } else {
    //    XoW.e('The item type is error with {0}, return.'.type);
    //    return;
    //  }
    //  if (oThis.hasClass('layim-null')) return;
    //  _layer.tips(_layTpl(_eleFriendMenu).render(data), this, {
    //    tips: 1
    //    , time: 0
    //    , anim: 5
    //    , fixed: true
    //    , skin: 'layui-box layui-layim-contextmenu'
    //    , success: function (layerO) {
    //      var stopBubble = function (e) {
    //        layui.stope(e);
    //      };
    //      layerO.off('mousedown', stopBubble).on('mousedown', stopBubble);
    //      //var layerObj = $('#contextmenu_' + id).parents('.layui-layim-contextmenu');
    //      //_resetPosition(layerObj, -100, 0);
    //    }
    //  });
    //  $(document).off('mousedown', hide).on('mousedown', hide);
    //  $(window).off('resize', hide).on('resize', hide);
    //});
    XoW.logger.me(_this.classInfo, 'bindFriendListMenu()');
  };
  // endregion 初始化时构造界面

  LAYIMEX.prototype.setMineStatus = function(pStatus){
    XoW.logger.ms(_this.classInfo, 'setMineStatus({0})'.f(pStatus));
    _changeMineStatus(pStatus);
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
  LAYIMEX.prototype.changeMineUsername = function(params) {
    XoW.logger.ms(_this.classInfo, 'changeMineUsername({0})'.f(params));
    return _changeMineUsername(params), this;
  };
  LAYIMEX.prototype.changeMineSign = function(pSign) {
    XoW.logger.ms(_this.classInfo, 'changeMineSign({0})'.f(pSign));
    $('.layui-layim .layui-layim-remark').val(pSign);
    XoW.logger.me(_this.classInfo, 'changeMineSign({0})'.f(pSign));
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
  LAYIMEX.prototype.changeFileStatus = function(pFileThumbnail) {
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
    thatFile = null; // to test mod by cy [20190110]
    layui.data('layim', {
      key: _cache.mine.id
      ,value: local
    });
    XoW.logger.me(_this.classInfo, 'changeFileStatus()');
  };


  LAYIMEX.prototype.rebindToolButtons = function() {
    XoW.logger.ms(_this.classInfo, 'rebindToolButtons()');
    var $toolSearch = $('li.layui-icon.layim-tool-search');
    if($toolSearch){
      $.each($toolSearch, function() {
        var $btn = $(this);
        this.removeAttribute('layim-event');
        $btn.attr('layImEx-event', 'open_local_user_search');
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
    XoW.logger.me(_this.classInfo, 'rebindToolFileButton()');
  };

  // region only for mobile
  LAYIMEX.prototype.bindAddFriendIconInChatView = function(jid){
    var name = jid;
    var chatPanel = $('.layim-chat-other').eq(1);
    var title = $('.layim-title',chatPanel);
    var html = '<div data-jid="'+jid+'"><img id="addSranger" src="../../images/AddFriend.png"></img><span style="display: none">'+name+'</span><div>';
    title.html(html);
  };

  // endregion only for mobile

  LAYIMEX.prototype.searchMessage = function(data) {
    XoW.logger.ms(_this.classInfo, 'searchMessage()');
    _layIM.searchMessage(data);
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
  LAYIMEX.prototype.onReady = function() {
    XoW.logger.ms(_this.classInfo, 'onReady()');
    this.bindFriendListMenu();
    this.rebindToolButtons();
    _bindLogoutLi();
    _bindMineInfoLi();
    var local = layui.data('layim')[_cache.mine.id] || {};
    local['hasUnreadSysInfo'] = local['hasUnreadSysInfo'] || false;
    if(local['hasUnreadSysInfo']) {
      _blinkSysInfoIcon();
    }
    XoW.logger.me(_this.classInfo, 'onReady()');
  };

  // region more list tools
  LAYIMEX.prototype.clearCache = function() {
    XoW.logger.ms(_this.classInfo, 'clearCache()');
    // todo 把chrome调试器打开后再加载页面就不能正常显示，不得其解
    //>从controller.index.js调用就会有这个问题
    let index = _layer.open({
      content: '确认删除所有本地数据?',
      btn: ['确定', '取消'],
      skin: 'footer',
      time: 10 * 1000,
      yes: function(index){
        XoW.logger.ms(_this.classInfo, 'moreList.clearCache.yes()');
        localStorage.clear(); // 内置对象
        _layer.close(index); // 从controller.index.js调用不主动关闭时关不掉，不得解
      }
    });
  };
  // endregion  more list tools
  // endregion APIs

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
    menu_profile: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'menu_profile()');
      _layer.closeAll('tips');
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
      events.menu_profile.index = _layer.open({
        type: 1 // 1表示页面内，2表示frame
        ,title: '联系人资料'
        ,shade: false
        ,maxmin: true
        ,area: ['600px', '520px']
        ,skin: 'layui-box layui-layer-border'
        ,resize: true
        ,content: content
        ,success: function(layero, index) {
        }
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
      if(data.temporary) {
        var has;
        $.each(_cache.friend, function(index, group) {
          if(group.groupid === '临时会话'){
            group.push(data);
            has = true;
            return false;
          }
        });
        if(!has) {
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
      if(!data){
        XoW.e('There is no such user with id {0}, return.'.f(id));
        return;
      }
      _layer.msg('确定删除好友 {0} 吗？'.f(data.username), {
        time: 0 //不自动关闭
        ,btn: ['确定', '取消']
        ,yes: function (index) {
          layui.each(call.rmvContact, function(i, item){
            item && item(data);});
          _layer.close(index);
        } });
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
            //,btn: ['保存', '关闭']
            //,success: function(layero, index) {
            //  _layDate.render({
            //    elem: '#set_mine_vcard_bday'
            //    ,format: 'yyyy-MM-dd'
            //  });
            //}
            //,btn1: function(index, layero) {
            //  XoW.logger.ms(_this.classInfo, 'open_mine_info.btn1()');
            //  var elem = layero.find('.layui-form');
            //  if(!_verifyForm(elem)) {
            //    return;
            //  }
            //  var field = _getFormFields(elem);
            //  // _layer.alert(JSON.stringify(field));
            //  var imgAvatar = layero.find('#img_set_mine_avatar')[0];
            //  if(imgAvatar.tag === 'changed') {
            //    layui.each(call.setMineInfoWithAvatar, function(index, item){
            //      // data:image/jpeg;base64,xxx
            //      var ay = imgAvatar.src.split(';base64,', 2);
            //      var type = ay[0].split(':', 2)[1];
            //      field = $.extend({base64: ay[1], type: type}, field);
            //      item && item(field, function(){
            //        _layer.close(events.open_mine_info.index);
            //      });
            //    });
            //  } else {
            //    layui.each(call.setMineInfo, function(index, item){
            //      item && item(field, function(){
            //        _layer.close(events.open_mine_info.index);
            //      });
            //    });
            //  }
            //}
            //,btn2: function() {
            //  _layer.close(events.open_mine_info.index);
            //}
          });
          XoW.logger.me(_this.classInfo, 'getMineInfo.cb()');
        });
        XoW.logger.me(_this.classInfo, 'open_mine_info.cb()');
      });
    },
    set_mine_avatar: function(oThis, e) {
      XoW.logger.ms(_this.classInfo, 'set_mine_avatar()');
      _layUpload({
        url: ''
        ,elem: oThis.find('input')[0]
        ,unwrap: true
        ,type: 'images'
        ,success: function(res){
          if(res.code == 0){
            //res.data = res.data || {};
            //if(type === 'images'){
            //  focusInsert(thatChat.textarea[0], 'img['+ (res.data.src||'') +']');
            //} else if(type === 'file'){
            //  focusInsert(thatChat.textarea[0], 'file('+ (res.data.src||'') +')['+ (res.data.name||'下载文件') +']');
            //}
            //sendMessage();
            _layer.msg('上传成功');
          } else {
            _layer.msg(res.msg||'上传失败');
          }
        }
      });
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
    find: function () {
      XoW.logger.ms(_this.classInfo, 'find()');
      var param = {
        tab: 'user',
        friend: _cache.friend
      }
      _openRemoteSearchBox(param);
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
        ,isAuto: false
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

          html += '<hr><li class="layim-null-redirect" layImEx-event="open_remote_user_search" tag="'+ val + '">到查找面板查找"' + val +'"</li>';
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
        ,content: '<ul class="layim-msgbox" id="flow_msgbox_cont"></ul>'
        ,success: function(layero, index) {
          _$sysInfoBox = layero;
          _layFlow.load({
            elem: '#flow_msgbox_cont' //流加载容器
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
    },
    open_url_page: function (oThis, e) {
      XoW.logger.ms(_this.classInfo, 'open_url_page()');
      var pageUrl = oThis.data('src');
      if(!pageUrl) return;
      window.open(pageUrl);
      XoW.logger.me(_this.classInfo, 'open_url_page()');
    },
    logout: function(oThis, e) {
      XoW.logger.ms(_this.classInfo, 'logout()');
      _layer.open({
        content:  '确认退出当前账号?'
        ,btn: ['确认', '取消']
        ,skin: 'footer'
        ,yes: function(index){
          XoW.logger.ms(_this.classInfo, 'moreList.logout.yes()');
          layui.each(call.logout, function(index, item){
            item && item();});
        }
      });
      XoW.logger.me(_this.classInfo, 'logout()');
    },
    open_vcard_field: function(oThis, e) {
      XoW.logger.ms(_this.classInfo, 'open_vcard_field()');
      _layer.close(events.open_vcard_field.index);

      events.open_vcard_field.index = _layIM.panel({
        title: '编辑条目',
        tpl: _layTpl(_elemMineVcardField).render({
          name: '贤心'
        })
      });
      XoW.logger.me(_this.classInfo, 'open_vcard_field()');
    }
  };
  // endregion LayImEx-event handlers

  // region Private Methods
  var _init = function() {
    XoW.logger.ms(_this.classInfo, '_init()');
    _device = layui.device();
    _cache = _layIM.cache();

    $('body').on('click', '*[layImEx-event]', function (e) {
      var oThis = $(this), method = oThis.attr('layImEx-event');
      events[method] ? events[method].call(this, oThis, e) : '';
    });
    XoW.logger.me(_this.classInfo, '_init()');
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
  }

  var _changeMineStatus = function(pStatus) {
    XoW.logger.ms(_this.classInfo, '_changeMineStatus()');
    // $('.layui-layim-status').find('ul li:last-child')等价于 $('.layui-layim-status').find('li').eq(-1)
    $('.layui-layim-status').html(_layTpl(_eleMineStatus).render({
      mine: { status:pStatus }
    }));// 暂时用隐身代替离线
    XoW.logger.me(_this.classInfo, '_changeMineStatus()');
  };
  var _changeMineUsername = function(params) {
    XoW.logger.ms(_this.classInfo, '_changeMineAvatar()');
    $('.layui-layim-user').text(params);
    _cache.mine.username = params;
    XoW.logger.ms(_this.classInfo, '_changeMineAvatar()');
  };
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
  }
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
  var _getLayImMain = function() {
    var $layimMain = $('#layui-layim');
    return $layimMain;
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
    XoW.logger.ms(_this.classInfo,  '_getDataFromFriendListItem()');
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
  var _blinkSysInfoIcon = function() {
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
  
  var _$searchBox, _openRemoteSearchBox = function(pParam) {
    XoW.logger.ms(_this.classInfo, '_openRemoteSearchBox()');
    pParam = pParam || {tab: 'user'};
    var content = _layTpl(_eleRemoteSearchBox).render(pParam);
    _layer.close(_openRemoteSearchBox.index);
    _openRemoteSearchBox.index = _layer.open({
      type: 1 // 1表示页面内，2表示frame
      ,title: '查找'
      ,shade: false
      ,maxmin: true
      ,area: ['600px', '520px']
      ,skin: 'layui-box layui-layer-border'
      ,resize: true
      ,content: content
      ,success: function(layero, index) {
        XoW.logger.ms(_this.classInfo, 'open_remote_search.cb()');
        _$searchBox = layero;
        _renderSearchChatLogFrm();
        if('user' === pParam.tab) {
          layero.find('#qry_user_keyword').val(pParam.keyword);
          var $layimSearchBtn = layero.find('#btn_search_user_remote');
          if($layimSearchBtn) {
            $layimSearchBtn.click();
          }
          var $search = $('.layui-layim').find('.layui-layim-search');
          $search.find('input').val('');
          $search.hide();
          _layIM.events().tab(_layIM.events().tab.index|0);
        } else if('chatLog' === pParam.tab) {
          var $layimSearchBtn = layero.find('#btn_search_chat_log_remote');
          if($layimSearchBtn) {
            $layimSearchBtn.click();
          }
        }
        XoW.logger.me(_this.classInfo, 'open_remote_search.cb()');
      }
    });
    XoW.logger.me(_this.classInfo, '_openRemoteSearchBox()');
  };

  var _verifyForm = function(pFrm) {
    XoW.logger.ms(_this.classInfo, '_verifyForm()');
    var verify = _layForm.config.verify, stop = null
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
    //XoW.logger.e('self content @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
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
        thatFile = null;
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
}).addcss(
  '../../skin/css/layimex.mobile.css?v=2.0.2'
  ,'skinlayimex-mobilecss'
);