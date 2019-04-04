/**
 * Created by chenyi on 2017-09-22.
 * 只负责login面板的绘制，不涉及业务逻辑
 * 不依赖jquery或zepto
 *
 */
layui.define(['laytpl'], function (exports) {
  'use strict';

  var _layTpl = layui.laytpl;
  var query = 'querySelectorAll',S = function(s){
    var length = document[query](s).length;
    if(length === 0) {
      return null;
    }else if(length === 1) {
      return document[query](s)[0]
    } else {
      return document[query](s);
    }
  };

  var _eleFLoginPanel = function() {
    /*
      <DIV class="login">
        <DIV class="cartoon">
            <DIV class="cartoon_head"></DIV>
            <DIV class="initial_left_hand" id="left_hand"></DIV>
            <DIV class="initial_right_hand" id="right_hand"></DIV>
        </DIV>
        <div class="layui-form">
            <div class="layui-form-item">
                <input class="layui-input" name="id" id="id" placeholder="用户名" value="{{ d.id }}" lay-verify="verify_username" type="text"
                       autocomplete="off"/>
            </div>
            <div class="layui-form-item">
                <input class="layui-input" name="password" id="password" placeholder="密码" value="{{ d.password }}" lay-verify="verify_password"
                       type="password" autocomplete="off"/>
            </div>
            <div class="layui-form-item">
                <input class="layui-input" name="serviceUrl" id="serviceUrl" placeholder="请输入服务器地址" value="{{ d.serviceUrl }}" lay-verify="required"
                       autocomplete="off"/>
            </div>
            <input style="display:none" name="resource" id="resource" value={{d.resource}} />
            <div class="layui-input-block">
                <button class="layui-btn login_btn" layImEx-event="login">登录</button>
                <div class="layui-form-mid layui-word-aux" id="loginState">未登录</div>
            </div>
        </div>
    </DIV>
     */
  };

  var LoginLayer = function(options) {
    var that = this;
    that.view(options);
    that.action();
  };

  LoginLayer.prototype.view = function(options) {
    var layerbox = document.createElement('div');
    //layerbox.setAttribute('class', classs[0] + ' ' + classs[0]+(config.type || 0));
    layerbox.setAttribute('id', 'loginPage');
    var content = _eleFLoginPanel.getMultiLineComm();
    content = _layTpl(content).render(options);
    layerbox.innerHTML = content;
    document.body.appendChild(layerbox);
  };
  LoginLayer.prototype.action = function() {
    // region 密码输入时卡通动画
    S('#password').focus(function () {
     alert('helloworld');
    });
    //失去焦点
    S('#password').blur(function () {

      alert('worldhello');
    });
    // endregion 密码输入时卡通动画
  };
  var loginLayer = {
    isOpen: function() {
      if(S('#loginPage')) {
        return true;
      }
      return false;
    },
    open: function(options) {
      if(this.isOpen()) {
        this.close();
      }
      return new LoginLayer(options || {});
    },
    close: function() {
      var ibox = S('#loginPage');
      if(!ibox) return;
      ibox.innerHTML = '';
      document.body.removeChild(ibox);
      //typeof ready.end[index] === 'function' && ready.end[index]();
      //delete ready.end[index];
    },
    setStatusDesc: function(pDesc) {
      var div = S('#loginState');
      if(div) {
        div.textContent = pDesc;
        if(S('loginState_kefu')) {
          document.body.removeChild(S('loginState_kefu'));
        }
      } else {
        var layerDiv = document.createElement('div');
        layerDiv.id = 'loginState_kefu';
        layerDiv.innerHTML =  '<p>{0}</p><span>{1}</span>'.f('登录失败',pDesc);
        document.body.appendChild(layerDiv);
      }
    }
  };
  exports('loginLayer', loginLayer);
});
