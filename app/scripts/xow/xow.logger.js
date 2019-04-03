/**
 * 打日志的，直接用
 * XoW.logger.log("aaa"); // 输出 [log]aaa
 * XoW.logger.logStart("aaa") // 输出 [log]aaa 开始
 * XoW.logger.logEnd("aaa") // 输出 [log]aaa 结束
 * XoW.logger.logParams({k1 : "v1", k2 : "v2"}); 输出 [log][参数][k1 : v1][k2 : v2]
 * @param factory
 */
(function (factory) {
  XoW.logger = factory();
}(function () {
  "use strict";
  var logger = {
    LOG_LEVEL: {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
      FATAL: 4
    },
    levels: ['debug', 'info', 'warn', 'error', 'fatal'],
    colors:['black', 'blue', 'orange', 'red', 'yellow'],
    version: 2.0,
    options: {
      logLevel: 0, // represents debug level to output
      isTimestamp: true,
      isLevel: true,
      isColor: true
    },
    init: function (param) {
      // 不允许依赖jquery
      // $.extend(this.options, param);
    },
    _logTemplate: function (pContent, pLevel) {
      var format = this.options.isColor ? '%c' : '';
      if(this.options.isTimestamp) {
        var timestamp = new Date().getTime();
        format += '[' + timestamp + ']';
      }
      if(this.options.isLevel) {
        format += '[' + this.levels[pLevel].toUpperCase() + ']';
      }
      console.log(format + pContent, 'color:{0};'.f(this.colors[pLevel]));
    },
    l: function (pLevel, pContent) {
      if( 0 > pLevel || this.LOG_LEVEL.length - 1 < pLevel ) {
        console.log('Invalid log level.');
        return;
      }
      if (pLevel >= this.options.logLevel) {
        this._logTemplate(pContent, pLevel);
      }
    },
    d: function (pContent) {
      this.l(this.LOG_LEVEL.DEBUG, pContent);
    },
    i: function (pContent) {
      this.l(this.LOG_LEVEL.INFO, pContent);
    },
    w: function (pContent) {
      this.l(this.LOG_LEVEL.WARN, pContent);
    },
    e: function (pContent) {
      this.l(this.LOG_LEVEL.ERROR, pContent);
    },
    f: function (pContent) {
      this.l(this.LOG_LEVEL.FATAL, pContent);
    },
    // method begin
    ms: function (className, content) {
      // 依赖于String.prototype.format
      var strTemplate = '[{0}][Enter]{1}';
      this.d(strTemplate.f(className, content));
    },
    // method end
    me: function (className, content) {
      var strTemplate = '[{0}][Exit]{1}';
      this.d(strTemplate.f(className, content));
    },
    /**
     * 用于要显示参数
     * 以logParams({key1 : "value1", key2 : "value2"})调用，
     * 会输出  [key1 : value1][ key2 value2]。
     * @param params 需要打印出来的参数
     */
    p: function (params) {
      var content = "[参数]";
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
      // this.d("<a href='javascript:void(0);' style='color: red;'>[send]</a>" + XoW.utils.xmlescape(data));
      data = this._filterEncodedBinary(data);
      this.i("[send]" + data);
    },
    receivePackage: function (data) {
      data = this._filterEncodedBinary(data);
      this.i('[receive]' + data);
    },
    _filterEncodedBinary: function (data) {
      var parser = new DOMParser();
      var xmlDoc = parser.parseFromString(data, 'text/xml');
      if(!xmlDoc) {
        return;
      }
      var found = false;
      for(var item of xmlDoc.getElementsByTagName('BINVAL')) {
        if (item.textContent) {
          item.textContent = 'Encoded Text';
          found = true;
        }
      }
      for(var item of xmlDoc.getElementsByTagName('binval')) {
        if (item.textContent) {
          item.textContent = 'Encoded Text';
          found = true;
        }
      }

      for(var item of xmlDoc.getElementsByTagName('data')) {
        if (item.textContent) {
          item.textContent = 'Encoded Text';
          found = true;
        }
      }

      if (found) {
        data = xmlDoc.documentElement.outerHTML;
      }
      //var $stanza = $(data);
      //// check and hide binary value
      //if (!$stanza) {
      //  return;
      //}
      //var found = false;
      //$($stanza).find('binval').each(function () {
      //      var field = $(this);
      //      if (field.text()) {
      //        field.text('Encoded Text');
      //        found = true;
      //  }
      //});
      //$($stanza).find('data').each(function () {
      //  var field = $(this);
      //  if (field.text()) {
      //    field.text('Encoded Text');
      //    found = true;
      //  }
      //});
      //if (found) {
      //  data = $stanza[0].outerHTML;
      //}
      return data;
    }
  };
  return logger;
}));