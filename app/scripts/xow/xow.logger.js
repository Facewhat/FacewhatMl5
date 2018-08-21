/**
 * 打日志的，直接用
 * XoW.logger.log("aaa"); // 输出 【log】aaa
 * XoW.logger.logStart("aaa") // 输出 【log】aaa 开始
 * XoW.logger.logEnd("aaa") // 输出 【log】aaa 结束
 * XoW.logger.logParams({k1 : "v1", k2 : "v2"}); 输出 【log】【参数】[k1 : v1][k2 : v2]
 * log的等级:
 * debug black 0
 * info  blue 1
 * warn  orange 2
 * error red 3
 * fatal  yellow 4
 * log输出的地方
 *
 * @param factory
 */
(function (factory) {
    XoW.logger = factory(XoW);
}(function (XoW) {
    "use strict";

    var logger = {
        version: 2.0,
        logLevel: 0, // 代表debug要输出

        /**
         * 显示日志的div的id。
         * 改成其他标签，后面_logTemplate方法需要相应的变化。
         * 如果不提供或者提供不正确的id，就不会打印日志了。
         */
        logContainerDivId: "logContainer",

        /**
         * 将日志内容打印到指定的div中
         * @param log 日志内容
         */
        _logTemplate: function (log) {
            //var $logContainer = $('#' + this.logContainerDivId);
            //if ($logContainer.length > 0) {
            //    $logContainer.append(log + '<br>');
            //}
            console.log(log);
        },

        setLogLevel: function (level) {
            if (level > -1 && level < 5) {
                this.logLevel = level;
            }
        },

        /**
         * debug, info, warn, error, fatal
         */
        d: function (content) {
            if (1 > this.logLevel) {
                this._logTemplate("【DEBUG】" + content);
            }
        },
        i: function (content) {
            if (2 > this.logLevel) {
                this._logTemplate("【INFO】" + content);
            }
        },
        w: function (content) {
            if (3 > this.logLevel) {
                this._logTemplate("【WARN】" + content);
            }
        },
        e: function (content) {
            if (4 > this.logLevel) {
                this._logTemplate("【ERROR】" + content);
            }
        },
        f: function (content) {
            if (5 > this.logLevel) {
                this._logTemplate("【FATAL】" + content);
            }
        },

        /**
         * 用于方法开始/结束的日志
         * ms = method start
         * md = method end
         */
        ms: function (className, content) {
            // 依赖于String.prototype.format
            var strTemplate = '【{0}】【Enter】{1}';
            this.d(strTemplate.f(className, content));
        },
        me: function (className, content) {
            var strTemplate = '【{0}】【Exit】{1}';
            this.d(strTemplate.f(className, content));
        },
        /**
         * 用于要显示参数
         * 以logParams({key1 : "value1", key2 : "value2"})调用，
         * 会输出  [key1 : value1][ key2 value2]。
         * @param params 需要打印出来的参数
         */
        p: function (params) {
            var content = "【参数】";
            for (var key in params) {
                content = content + " [ " + key + " : " + params[key] + " ]";
            }
            this.d(content);
        },
        /**
         * 打印发送/接收的报文。重写Strophe.Connection.rawOutput/rawInput用到
         *
         */
        sendPackage: function (data) {
            // this.d("<a href='javascript:void(0);' style='color: red;'>【send】</a>" + XoW.utils.xmlescape(data));
            data = this._filterEncodedBinary(data);
            this.i("【send】" + data);
        },
        receivePackage: function (data) {
            data = this._filterEncodedBinary(data);
            this.i('【receive】' + data);
        },
        _filterEncodedBinary: function (data) {
            var $stanza = $(data);
            // check and hide binary value
            if (!$stanza) {
                return;
            }
            var found = false;
            $($stanza).find('binval').each(function () {
                var field = $(this);
                if (field.text()) {
                    field.text('Encoded Text');
                    found = true;
                }
            });
            $($stanza).find('data').each(function () {
                var field = $(this);
                if (field.text()) {
                    field.text('Encoded Text');
                    found = true;
                }
            });
            if (found) {
                data = $stanza[0].outerHTML;
            }
            return data;
        }
    };
    return logger;
}));