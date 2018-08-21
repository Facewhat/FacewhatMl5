/**
 * Created by chenyi on 2017-09-22.
 * login.html对应的controller
 *
 */
layui.use(['jquery', 'form', 'client'], function () {
  var form = layui.form;
  var _client = layui.client;

  $(function () {
    XoW.logger.d("login.html on document ready");
    // region 设置默认值
    $('#service').val(XoW.config.serviceUrl);
    $('#username').val(XoW.config.userId);
    $('#password').val(XoW.config.password);
    // endregion 设置默认值

    // region 密码输入时卡通动画
    $("#password").focus(function () {
      $("#left_hand").animate({
        left: "12",
        top: "58"
      }, {
        step: function () {
          var lefttop = parseInt($("#left_hand").css("top"));
          if (lefttop < 60) {
            $("#left_hand").attr("class", "left_hand");
          } else if (lefttop < 76) {
            $("#left_hand").attr("class", "left_handing");
          }
        }
      }, 2000);
      $("#right_hand").animate({
        right: "12",
        top: "58"
      }, {
        step: function () {
          var righttop = parseInt($("#right_hand").css("top"));
          if (righttop < 60) {
            $("#right_hand").attr("class", "right_hand");
          } else if (righttop < 76) {
            $("#right_hand").attr("class", "right_handing");
          }
        }
      }, 2000);
    });
    //失去焦点
    $("#password").blur(function () {
      $("#left_hand").attr("class", "initial_left_hand");
      $("#left_hand").attr("style", "top:86px;left:-52px;");
      $("#right_hand").attr("class", "initial_right_hand");
      $("#right_hand").attr("style", "top:86px;right:-52px");
    });
    // endregion 密码输入时卡通动画

    // region 表单验证
    form.verify({
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
    });
    // endregion 表单验证

    // region 监听登录提交
    form.on('submit(loginIM)', function () {
      var serviceURL = $('#service').val();
      var username = $('#username').val();
      var pass = $('#password').val();
      _client.login(serviceURL, username, pass, XoW.config.resource);
    });
    // endregion 监听登录提交
  })
})




