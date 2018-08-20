/**
 * Created by chenyi on 2017-09-22.
 * login.html对应的controller
 */
//$(document).ready(function () {
$(function () {
    XoW.logger.d("on document ready");
    //得到焦点
    $("#password").focus(function () {
        $("#left_hand").animate({
            left: "150",
            top: " -38"
        }, {
            step: function () {
                if (parseInt($("#left_hand").css("left")) > 140) {
                    $("#left_hand").attr("class", "left_hand");
                }
            }
        }, 2000);
        $("#right_hand").animate({
            right: "-64",
            top: "-38px"
        }, {
            step: function () {
                if (parseInt($("#right_hand").css("right")) > -70) {
                    $("#right_hand").attr("class", "right_hand");
                }
            }
        }, 2000);
    });
    //失去焦点
    $("#password").blur(function () {
        $("#left_hand").attr("class", "initial_left_hand");
        $("#left_hand").attr("style", "left:100px;top:-12px;");
        $("#right_hand").attr("class", "initial_right_hand");
        $("#right_hand").attr("style", "right:-112px;top:-12px");
    });

    bindLoginClick();

    var loginType = getPar('logintype');
    if (loginType == '1') // 由于im注销时候刷新本页面，所以如果logintype为自动登录，它注销之后也会紧接着自动登录咯
    {
        $('#loginpage').css({display: "none"}); // 隐藏登录界面div
        autoLogin();
        // 设置自动打开聊天面板的开关
        //>在layim.js中要求改哦
    }
    else {
        $('#loginpage').css({display: ""}); // 显示登录界面div
    }
});

function bindLoginClick() {
    XoW.logger.d("bindLoginClick() " + XoW.utils.getCurrentDatetime());
    gblMgr = new XoW.GlobalManager();

    // 登录按钮点击监听,下面到99代码相同，主要是由于<a>和<button>的区别
    $("#loginIMSvr").bind("click", function () {
        //$('#loginSvr').bind('click', function() {
        var serviceURL = $('#service').val();
        var username = $('#username').val();
        var pass = $('#password').val();
        if (null == serviceURL || "" == serviceURL) {
            alert("请输入服务器名！");
            return false;
        }
        if (null == username || "" == username) {
            alert("请输入用户名！");
            return false;
        }
        if (null == pass || "" == pass) {
            alert("请输入密码！");
            return false;
        }
        gblMgr.connect(serviceURL, username, pass);
    });
    //谷歌下的登录
    $('#login2').bind('click', function () {
        var serviceURL = $('#service').val();
        var username = $('#username').val();
        var pass = $('#password').val();
        if (null == serviceURL || "" == serviceURL) {
            alert("请输入服务器名！");
            return false;
        }
        if (null == username || "" == username) {
            alert("请输入用户名！");
            return false;
        }
        if (null == pass || "" == pass) {
            alert("请输入密码！");
            return false;
        }
        gblMgr.connect(serviceURL, username, pass);
    });
}




/**
 * 获取url get参数
 * @param par
 * @returns {*}
 */
function getPar(par) {
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
    return get_par;
}

/**
 * 自动登录，发布时需要硬编码地址和密码（暂时采用通用密码）
 */
function autoLogin() {
    var serviceURL = 'ws://10.10.122.73:7070/ws/';
    var username = getPar('username');
    var pass = '123456';
    gblMgr.connect(serviceURL, username, pass);
}

