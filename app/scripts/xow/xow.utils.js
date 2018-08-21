(function (root, factory) {
  XoW.utils = factory(Strophe, XoW);
}(this, function (Strophe, XoW) {
  var utils = {

    /****************************/
    /* 使用Strophe的工具*/
    /**
     * 转义xml标签
     */
    xmlescape: function (text) {
      return Strophe.xmlescape(text);
    },
    /**
     * 转义xml标签逆过程
     */
    xmlunescape: function (text) {
      return Strophe.xmlunescape(text);
    },

    /**
     * node@domain/resource
     * 从jid中获取节点/域/资源
     */
    getNodeFromJid: function (jid) {
      return Strophe.getNodeFromJid(jid);
    },
    getDomainFromJid: function (jid) {
      return Strophe.getDomainFromJid(jid);
    },
    getResourceFromJid: function (jid) {
      return Strophe.getResourceFromJid(jid);
    },
    /**
     * 得到纯jid  node@domain
     */
    getBareJidFromJid: function (jid) {
      return Strophe.getBareJidFromJid(jid);
    },
    getFullJid: function (jid, resource) {
      return this.getBareJidFromJid(jid) + '/' + resource;
    },

    /****************************/

    /* 自定义的工具或用别人的工具*/
    //private boolean isImage(String fileName) {
//	    fileName = fileName.toLowerCase();
    //
//	    String[] imageTypes = {"jpeg", "gif", "jpg", "png"};
//	    for (String imageType : imageTypes) {
//	        if (fileName.endsWith(imageType)) {
//	            return true;
//	        }
//	    }
    //
//	    return false;
    //}


    isImageMIME: function (mime) {
      if ("image/png" == mime
        || "image/jpeg" == mime
        || "image/gif" == mime
        || "image/jpg" == mime) {
        return true;
      } else {
        return false;
      }
    },

    /**
     * Yovae.com
     */
    //utf-8转utf16
    utf16to8: function (str) {
      var out, i, len, c;
      out = "";
      len = str.length;
      for (i = 0; i < len; i++) {
        c = str.charCodeAt(i);
        if ((c >= 0x0001) && (c <= 0x007F)) {
          out += str.charAt(i);
        } else if (c > 0x07FF) {
          out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
          out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F));
          out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
        } else {
          out += String.fromCharCode(0xC0 | ((c >> 6) & 0x1F));
          out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
        }
      }
      return out;
    },
    //utf-16转utf-8
    utf8to16: function (str) {
      var out, i, len, c;
      var char2, char3;
      out = "";
      len = str.length;
      i = 0;
      while (i < len) {
        c = str.charCodeAt(i++);
        switch (c >> 4) {
          case 0:
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
          case 6:
          case 7:
            // 0xxxxxxx
            out += str.charAt(i - 1);
            break;
          case 12:
          case 13:
            // 110x xxxx 10xx xxxx
            char2 = str.charCodeAt(i++);
            out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
            break;
          case 14:
            // 1110 xxxx 10xx xxxx 10xx xxxx
            char2 = str.charCodeAt(i++);
            char3 = str.charCodeAt(i++);
            out += String.fromCharCode(((c & 0x0F) << 12) |
              ((char2 & 0x3F) << 6) |
              ((char3 & 0x3F) << 0));
            break;
        }
        ;
      }
      return out;
    },

    /**
     * 字节转换为b,kb等
     */
    bytesToSize: function (bytes) {
      //alert(bytes);
      if (bytes === 0) return '0 B';
      var k = 1024;
      sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      i = Math.floor(Math.log(bytes) / Math.log(k));
      //toPrecision(3) 后面保留一位小数，如1.0GB                                                                                                                  //return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
      return Math.floor((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    },


    /**
     * 正则转义
     */
    faceParse: function (face) {
      var returnFace = "";
      for (var i = 0; i < face.length; i++) {
        if ('$' == face[i]
          || '(' == face[i]
          || ')' == face[i]
          || '*' == face[i]
          || '+' == face[i]
          || '.' == face[i]
          || '[' == face[i]
          || ']' == face[i]
          || '?' == face[i]
          || '\\' == face[i]
          || '^' == face[i]
          || '{' == face[i]
          || '}' == face[i]
          || '|' == face[i]) {
          returnFace += "\\" + face[i];
        } else {
          returnFace += face[i];
        }
      }
      return returnFace;
    },

    /**
     * 使用jquery的选择器时，给出的条件不能包含特殊字符
     * 但是我在界面上用到了jid  : node@domain\resourc
     * 使用jquery选择器时报错，所以需要用以下函数来转义一下。
     */
    escapeJquery: function (srcString) {
      // 转义之后的结果
      var escapseResult = srcString;

      // javascript正则表达式中的特殊字符
      var jsSpecialChars = ["\\", "^", "$", "*", "?", ".", "+", "(", ")", "[",
        "]", "|", "{", "}"];

      // jquery中的特殊字符,不是正则表达式中的特殊字符
      var jquerySpecialChars = ["~", "`", "@", "#", "%", "&", "=", "'", "\"",
        ":", ";", "<", ">", ",", "/"];

      for (var i = 0; i < jsSpecialChars.length; i++) {
        escapseResult = escapseResult.replace(new RegExp("\\"
          + jsSpecialChars[i], "g"), "\\"
          + jsSpecialChars[i]);
      }

      for (var i = 0; i < jquerySpecialChars.length; i++) {
        escapseResult = escapseResult.replace(new RegExp(jquerySpecialChars[i],
          "g"), "\\" + jquerySpecialChars[i]);
      }

      return escapseResult;
    },

    /**
     * node@domian/resource
     * 从URL中得到服务器的ip，用来加入JID作为 domain
     * 如：ws://10.10.123.75:7070/ws/，得到 10.10.123.75
     * @param url 服务器URL
     * @returns IP
     */
    getIPFromURL: function (url) {
      var ipReg = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
      var ip = ipReg.exec(url);
      return ip;
    },

    /**
     * 产生唯一的id，用于节中
     * @param prefix 如果提供了，则以prefix为首，如果没有提供，则自定义以：xow 为首
     * @returns {String}
     */
    getUniqueId: function (prefix) {
      var cdate = new Date();
      var offdate = new Date(2010, 1, 1);
      var offset = cdate.getTime() - offdate.getTime();
      // 后面多生产3位数的随机数，因为当几乎同时调用getUniqueId时，可能产生一样的ID
      var hexd = parseInt(offset).toString(16) + Math.floor(Math.random() * 1000).toString();

      if (typeof prefix === 'string' || typeof prefix === 'number') {
        return prefix + '_' + hexd;
      } else {
        return 'xow_' + hexd;
      }
    },

    parseQueryString: function (url) {
      var obj = {};
      var start = url.indexOf("?") + 1;
      var str = url.substr(start);
      var arr = str.split("&");
      for (var i = 0; i < arr.length; i++) {
        var arr2 = arr[i].split("=");
        obj[arr2[0]] = arr2[1];
      }
      return obj;
    },

    getFromatDatetimeFromNS: function (nS) {
      return this.getFromatDatetime(new Date(parseInt(nS))); // .toLocaleString().replace(/年|月/g, "-").replace(/日/g, " ");
//	    	var newDate = new Date();
//	    	newDate.setTime(timestamp3 * 1000);
    },

    // yyyy-MM-dd HH:mm:ss
    getFromatDatetime: function (datetime) {
      var now = new Date(datetime);
      var year = now.getFullYear();       //年
      var month = now.getMonth() + 1;     //月
      var day = now.getDate();            //日
      var hh = now.getHours();            //时
      var mm = now.getMinutes();          //分
      var ss = now.getSeconds();			//秒

      var clock = year + "-";
      if (month < 10) {
        clock += "0";
      }
      clock += month + "-";
      if (day < 10) {
        clock += "0";
      }
      clock += day + " ";
      if (hh < 10) {
        clock += "0";
      }
      clock += hh + ":";
      if (mm < 10) {
        clock += '0';
      }
      clock += mm + ":";
      if (ss < 10) {
        clock += '0';
      }
      clock += ss;
      return (clock);
    },

    // yyyy-MM-dd'T'HH:mm:ss'Z'
    getFromatDatetime2: function (datetime) {
      if ('' == datetime) {
        return null;
      }
      var d = new Date(datetime);
      return d.toISOString();
    },
    getUTCDate: function (d) {
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
    },
    /**
     * 得到当前时间字符串，格式为：YYYY-MM-DD HH:MM:SS
     */
    getCurrentDatetime: function () {
      var now = new Date();
      var year = now.getFullYear();       //年
      var month = now.getMonth() + 1;     //月
      var day = now.getDate();            //日
      var hh = now.getHours();            //时
      var mm = now.getMinutes();          //分
      var ss = now.getSeconds();			//秒

      var clock = year + "-";
      if (month < 10) {
        clock += "0";
      }
      clock += month + "-";
      if (day < 10) {
        clock += "0";
      }
      clock += day + " ";
      if (hh < 10) {
        clock += "0";
      }
      clock += hh + ":";
      if (mm < 10) {
        clock += '0';
      }
      clock += mm + ":";
      if (ss < 10) {
        clock += '0';
      }
      clock += ss;
      return (clock);
    },
  };
  return utils;
}));

// region 自定义类
/**
 * 模仿ES6中的Map
 */
XoW.Map = function () {
    var _items = {};

    var _init = function () {
    }

    this.has = function (key) {
      return key in _items;
    };
    this.set = function (key, value) {
      _items[key] = value;
    };
    this.remove = function (key) {
      if (this.has(key)) {
        delete _items[key];
        return true;
      }
      return false;
    };
    this.get = function (key) {
      return this.has(key) ? _items[key] : undefined;
    };
    this.values = function () {
      var values = [];
      for (var k in _items) {
        if (this.hasOwnProperty(k)) {
          values.push(_items[k]);
        }
      }
      return values;
    };
    this.clear = function () {
      _items = {};
    };
    this.size = function () {
      return Object.Keys(_items).length;
    };
    this.getItems = function () {
      return _items;
    };

    _init();
  };

/**
 * 创建惰性单例
 * @param func
 * @returns {*}
 * @constructor
 */
XoW.CreateSingle = function(func) {
  var flag;
  return flag || (flag = func.apply(this, arguments));
};
// endregion 自定义类

// region 其他扩展方法
String.prototype.format = String.prototype.f = function () {
  var s = this,
    i = arguments.length;

  while (i--) {
    s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
  }
  return s;
};
// endregion 其他扩展方法
