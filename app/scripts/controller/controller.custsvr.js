/**
 * Created by Administrator on 2018/3/23.
 * 适配客服页面
 */
'use strict'
layui.config({
  base: './scripts/layxow/' //假设这是你存放拓展模块的根目录
}).extend({ //设定模块别名
  client: 'layim.client',
  layImEx: 'layim.extend'
}).use(['jquery', 'layim', 'client', 'layImEx'], function(){
  var _client = layui.client;
  var _layIM = layui.layim;
  var _layImEx = layui.layImEx;
  var _classInfo = 'View';

  _layIM.config({
//            init: {
//                //配置客户信息
//                mine: {
//                    "username": "访客" //我的昵称
//                    ,"id": "100000123" //我的ID
//                    ,"status": "online" //在线状态 online：在线、hide：隐身
//                    ,"remark": "在深邃的编码世界，做一枚轻盈的纸飞机" //我的签名
//                    ,"avatar": "//res.layui.com/images/fly/avatar/00.jpg" //我的头像
//                }
//            }
    //开启客服模式
    brief: true
  });
  //打开一个客服面板
  _layIM.chat({
    name: '在线客服一' //名称
    ,type: 'kefu' //聊天类型
    ,avatar: '//tp1.sinaimg.cn/5619439268/180/40030060651/1' //头像
    ,id: 1111111 //定义唯一的id方便你处理信息
  }).chat({
    name: '在线客服二' //名称
    ,type: 'kefu' //聊天类型
    ,avatar: '//tp1.sinaimg.cn/5619439268/180/40030060651/1' //头像
    ,id: 2222222 //定义唯一的id方便你处理信息
  });
  _layIM.setChatMin(); //收缩聊天面板
});