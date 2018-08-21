/** File: strophe.js
 *  A JavaScript library for XMPP BOSH/XMPP over Websocket.
 *  
 *  This is the JavaScript version of the Strophe library.  Since JavaScript
 *  had no facilities for persistent TCP connections, this library uses
 *  Bidirectional-streams Over Synchronous HTTP (BOSH) to emulate
 *  a persistent, stateful, two-way connection to an XMPP server.  More
 *  information on BOSH can be found in XEP 124.
 *
 *  This version of Strophe also works with WebSockets.
 *  For more information on XMPP-over WebSocket see this RFC:
 *  http://tools.ietf.org/html/rfc7395
	
	文件 strophe.js
	一个为XMPP BOSH/XMPP over WebSocket提供服务的JS库
	
	这是JS版本的Strophe库，因为JS不支持TCP的连接，这个库向XMPP提供了一个
	使用了BOSH来仿真的持久的，稳定的，双向的连接。更多有关于BOSH的信息请
	查找XEP124
	
	这个版本的strophe也能够和websocket一起工作，更多有关于XMPP-over WebSocket
	信息请查看FRC文档：http://tools.ietf.org/html/rfc7395

 */

/* All of the Strophe globals are defined in this special function below so
 * that references to the globals become closures.  This will ensure that
 * on page reload, these references will still be available to callbacks
 * that are still executing.
 
	所有的Strophe全局函数是定义在下面这个专门的函数中，以便于对于全局函数的
	参考，引用关闭了，仍然保证当页面重载的时候，这些参考，引用仍然对这些回调
	能够执行。
 */

/* jshint ignore:start */
(function (callback) {
/* jshint ignore:end   */

// This code was written by Tyler Akins and has been placed in the
// public domain.  It would be nice if you left this header intact.
// Base64 code from Tyler Akins -- http://rumkin.com
/*
	本代码由 Tyler Akins所写，并且已经上传到公共域。 希望你能够保留这个
	说明。
	
*/

// 自定义base64的编码解码
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('strophe-base64', function () {
            return factory();
        });
    } else {
        // Browser globals
        root.Base64 = factory();
    }
}(this, function () {
    var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

    var obj = {
        /**
         * Encodes a string in base64
         * @param {String} input The string to encode in base64.
         */
        encode: function (input) {
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i = 0;

            do {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc2 = ((chr1 & 3) << 4);
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) +
                    keyStr.charAt(enc3) + keyStr.charAt(enc4);
            } while (i < input.length);

            return output;
        },

        /**
         * Decodes a base64 string.
         * @param {String} input The string to decode.
         */
        decode: function (input) {
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i = 0;

            // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

            do {
                enc1 = keyStr.indexOf(input.charAt(i++));
                enc2 = keyStr.indexOf(input.charAt(i++));
                enc3 = keyStr.indexOf(input.charAt(i++));
                enc4 = keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }
            } while (i < input.length);

            return output;
        }
    };
    return obj;
}));

/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 
	一个JS实现的安全Hash算法，SHA-1，和定义在FIPS PUB 180-1上的一样
 */

/* jshint undef: true, unused: true:, noarg: true, latedef: true */
/* global define */

/* Some functions and variables have been stripped for use with Strophe */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('strophe-sha1', function () {
            return factory();
        });
    } else {
        // Browser globals
        root.SHA1 = factory();
    }
}(this, function () {

/*
 * Calculate the SHA-1 of an array of big-endian words, and a bit length
 */
function core_sha1(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << (24 - len % 32);
  x[((len + 64 >> 9) << 4) + 15] = len;

  var w = new Array(80);
  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;
  var e = -1009589776;

  var i, j, t, olda, oldb, oldc, oldd, olde;
  for (i = 0; i < x.length; i += 16)
  {
    olda = a;
    oldb = b;
    oldc = c;
    oldd = d;
    olde = e;

    for (j = 0; j < 80; j++)
    {
      if (j < 16) { w[j] = x[i + j]; }
      else { w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1); }
      t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),
                       safe_add(safe_add(e, w[j]), sha1_kt(j)));
      e = d;
      d = c;
      c = rol(b, 30);
      b = a;
      a = t;
    }

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
    e = safe_add(e, olde);
  }
  return [a, b, c, d, e];
}

/*
 * Perform the appropriate triplet combination function for the current
 * iteration
	为当前的迭代执行3次适当的组合
 */
function sha1_ft(t, b, c, d)
{
  if (t < 20) { return (b & c) | ((~b) & d); }
  if (t < 40) { return b ^ c ^ d; }
  if (t < 60) { return (b & c) | (b & d) | (c & d); }
  return b ^ c ^ d;
}

/*
 * Determine the appropriate additive constant for the current iteration
 */
function sha1_kt(t)
{
  return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
         (t < 60) ? -1894007588 : -899497514;
}

/*
 * Calculate the HMAC-SHA1 of a key and some data
 */
function core_hmac_sha1(key, data)
{
  var bkey = str2binb(key);
  if (bkey.length > 16) { bkey = core_sha1(bkey, key.length * 8); }

  var ipad = new Array(16), opad = new Array(16);
  for (var i = 0; i < 16; i++)
  {
    ipad[i] = bkey[i] ^ 0x36363636;
    opad[i] = bkey[i] ^ 0x5C5C5C5C;
  }

  var hash = core_sha1(ipad.concat(str2binb(data)), 512 + data.length * 8);
  return core_sha1(opad.concat(hash), 512 + 160);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
	按位旋转一个32位的数到左边。
 */
function rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

/*
 * Convert an 8-bit or 16-bit string to an array of big-endian words
 * In 8-bit function, characters >255 have their hi-byte silently ignored.
 
 */
function str2binb(str)
{
  var bin = [];
  var mask = 255;
  for (var i = 0; i < str.length * 8; i += 8)
  {
    bin[i>>5] |= (str.charCodeAt(i / 8) & mask) << (24 - i%32);
  }
  return bin;
}

/*
 * Convert an array of big-endian words to a string
 */
function binb2str(bin)
{
  var str = "";
  var mask = 255;
  for (var i = 0; i < bin.length * 32; i += 8)
  {
    str += String.fromCharCode((bin[i>>5] >>> (24 - i%32)) & mask);
  }
  return str;
}

/*
 * Convert an array of big-endian words to a base-64 string
 */
function binb2b64(binarray)
{
  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var str = "";
  var triplet, j;
  for (var i = 0; i < binarray.length * 4; i += 3)
  {
    triplet = (((binarray[i   >> 2] >> 8 * (3 -  i   %4)) & 0xFF) << 16) |
              (((binarray[i+1 >> 2] >> 8 * (3 - (i+1)%4)) & 0xFF) << 8 ) |
               ((binarray[i+2 >> 2] >> 8 * (3 - (i+2)%4)) & 0xFF);
    for (j = 0; j < 4; j++)
    {
      if (i * 8 + j * 6 > binarray.length * 32) { str += "="; }
      else { str += tab.charAt((triplet >> 6*(3-j)) & 0x3F); }
    }
  }
  return str;
}

/*
 * These are the functions you'll usually want to call
 * They take string arguments and return either hex or base-64 encoded strings
 
 这些是你经常想调用的一些函数
 以字符串作为参数，返回一个十六进制或base64编码的字符串
 */
return {
    b64_hmac_sha1:  function (key, data){ return binb2b64(core_hmac_sha1(key, data)); },
    b64_sha1:       function (s) { return binb2b64(core_sha1(str2binb(s),s.length * 8)); },
    binb2str:       binb2str,
    core_hmac_sha1: core_hmac_sha1,
    str_hmac_sha1:  function (key, data){ return binb2str(core_hmac_sha1(key, data)); },
    str_sha1:       function (s) { return binb2str(core_sha1(str2binb(s),s.length * 8)); },
};
}));

/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.1 Copyright (C) Paul Johnston 1999 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 
 JS实现的RSA数据安全。MD5信息摘要算法， 和定义在RFC1321上的一样
 */

/*
 * Everything that isn't used by Strophe has been stripped here!
	在这里，任何Strophe用不到已经被剥去了
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('strophe-md5', function () {
            return factory();
        });
    } else {
        // Browser globals
        root.MD5 = factory();
    }
}(this, function (b) {
    /*
     * Add integers, wrapping at 2^32. This uses 16-bit operations internally
     * to work around bugs in some JS interpreters.
     */
    var safe_add = function (x, y) {
        var lsw = (x & 0xFFFF) + (y & 0xFFFF);
        var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    };

    /*
     * Bitwise rotate a 32-bit number to the left.
     */
    var bit_rol = function (num, cnt) {
        return (num << cnt) | (num >>> (32 - cnt));
    };

    /*
     * Convert a string to an array of little-endian words
     */
    var str2binl = function (str) {
        var bin = [];
        for(var i = 0; i < str.length * 8; i += 8)
        {
            bin[i>>5] |= (str.charCodeAt(i / 8) & 255) << (i%32);
        }
        return bin;
    };

    /*
     * Convert an array of little-endian words to a string
     */
    var binl2str = function (bin) {
        var str = "";
        for(var i = 0; i < bin.length * 32; i += 8)
        {
            str += String.fromCharCode((bin[i>>5] >>> (i % 32)) & 255);
        }
        return str;
    };

    /*
     * Convert an array of little-endian words to a hex string.
     */
    var binl2hex = function (binarray) {
        var hex_tab = "0123456789abcdef";
        var str = "";
        for(var i = 0; i < binarray.length * 4; i++)
        {
            str += hex_tab.charAt((binarray[i>>2] >> ((i%4)*8+4)) & 0xF) +
                hex_tab.charAt((binarray[i>>2] >> ((i%4)*8  )) & 0xF);
        }
        return str;
    };

    /*
     * These functions implement the four basic operations the algorithm uses.
     */
    var md5_cmn = function (q, a, b, x, s, t) {
        return safe_add(bit_rol(safe_add(safe_add(a, q),safe_add(x, t)), s),b);
    };

    var md5_ff = function (a, b, c, d, x, s, t) {
        return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
    };

    var md5_gg = function (a, b, c, d, x, s, t) {
        return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
    };

    var md5_hh = function (a, b, c, d, x, s, t) {
        return md5_cmn(b ^ c ^ d, a, b, x, s, t);
    };

    var md5_ii = function (a, b, c, d, x, s, t) {
        return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
    };

    /*
     * Calculate the MD5 of an array of little-endian words, and a bit length
     */
    var core_md5 = function (x, len) {
        /* append padding */
        x[len >> 5] |= 0x80 << ((len) % 32);
        x[(((len + 64) >>> 9) << 4) + 14] = len;

        var a =  1732584193;
        var b = -271733879;
        var c = -1732584194;
        var d =  271733878;

        var olda, oldb, oldc, oldd;
        for (var i = 0; i < x.length; i += 16)
        {
            olda = a;
            oldb = b;
            oldc = c;
            oldd = d;

            a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
            d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
            c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
            b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
            a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
            d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
            c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
            b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
            a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
            d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
            c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
            b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
            a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
            d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
            c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
            b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

            a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
            d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
            c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
            b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
            a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
            d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
            c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
            b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
            a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
            d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
            c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
            b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
            a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
            d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
            c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
            b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

            a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
            d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
            c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
            b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
            a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
            d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
            c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
            b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
            a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
            d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
            c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
            b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
            a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
            d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
            c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
            b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

            a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
            d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
            c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
            b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
            a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
            d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
            c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
            b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
            a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
            d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
            c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
            b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
            a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
            d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
            c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
            b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

            a = safe_add(a, olda);
            b = safe_add(b, oldb);
            c = safe_add(c, oldc);
            d = safe_add(d, oldd);
        }
        return [a, b, c, d];
    };

    var obj = {
        /*
         * These are the functions you'll usually want to call.
         * They take string arguments and return either hex or base-64 encoded
         * strings.
         */
        hexdigest: function (s) {
            return binl2hex(core_md5(str2binl(s), s.length * 8));
        },

        hash: function (s) {
            return binl2str(core_md5(str2binl(s), s.length * 8));
        }
    };
    return obj;
}));

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('strophe-utils', function () {
            return factory();
        });
    } else {
        // Browser globals
        root.stropheUtils = factory();
    }
}(this, function () {

    var utils = {

        utf16to8: function (str) {
            var i, c;
            var out = "";
            var len = str.length;
            for (i = 0; i < len; i++) {
                c = str.charCodeAt(i);
                if ((c >= 0x0000) && (c <= 0x007F)) {
                    out += str.charAt(i);
                } else if (c > 0x07FF) {
                    out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
                    out += String.fromCharCode(0x80 | ((c >>  6) & 0x3F));
                    out += String.fromCharCode(0x80 | ((c >>  0) & 0x3F));
                } else {
                    out += String.fromCharCode(0xC0 | ((c >>  6) & 0x1F));
                    out += String.fromCharCode(0x80 | ((c >>  0) & 0x3F));
                }
            }
            return out;
        },

        addCookies: function (cookies) {
            /* Parameters:
             *  (Object) cookies - either a map of cookie names
             *    to string values or to maps of cookie values.
             *
             * For example:
             * { "myCookie": "1234" }
             *
             * or:
             * { "myCookie": {
             *      "value": "1234",
             *      "domain": ".example.org",
             *      "path": "/",
             *      "expires": expirationDate
             *      }
             *  }
             *
             *  These values get passed to Strophe.Connection via
             *   options.cookies
			 
			 这些值通过 options.cookies传给Strophe.Connection
             */
            var cookieName, cookieObj, isObj, cookieValue, expires, domain, path;
            for (cookieName in (cookies || {})) {
                expires = '';
                domain = '';
                path = '';
                cookieObj = cookies[cookieName];
                isObj = typeof cookieObj == "object";
                cookieValue = escape(unescape(isObj ? cookieObj.value : cookieObj));
                if (isObj) {
                    expires = cookieObj.expires ? ";expires="+cookieObj.expires : '';
                    domain = cookieObj.domain ? ";domain="+cookieObj.domain : '';
                    path = cookieObj.path ? ";path="+cookieObj.path : '';
                }
                document.cookie =
                    cookieName+'='+cookieValue + expires + domain + path;
            }
        }
    };
    return utils;
}));

/*
    This program is distributed under the terms of the MIT license.
    Please see the LICENSE file for details.

    Copyright 2006-2008, OGG, LLC
*/

/* jshint undef: true, unused: true:, noarg: true, latedef: true */
/* global define */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('strophe-polyfill', [], function () {
            return factory();
        });
    } else {
        // Browser globals
        return factory();
    }
}(this, function () {

/** PrivateFunction: Function.prototype.bind
 *  Bind a function to an instance.
 *
 *  This Function object extension method creates a bound method similar
 *  to those in Python.  This means that the 'this' object will point
 *  to the instance you want.  See
 *  <a href='https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind'>MDC's bind() documentation</a> and
 *  <a href='http://benjamin.smedbergs.us/blog/2007-01-03/bound-functions-and-function-imports-in-javascript/'>Bound Functions and Function Imports in JavaScript</a>
 *  for a complete explanation.
 *
 *  This extension already exists in some browsers (namely, Firefox 3), but
 *  we provide it to support those that don't.
 *
 *  Parameters:
 *    (Object) obj - The object that will become 'this' in the bound function.
 *    (Object) argN - An option argument that will be prepended to the
 *      arguments given for the function call
 *
 *  Returns:
 *    The bound function.
 

 */
if (!Function.prototype.bind) {
    Function.prototype.bind = function (obj /*, arg1, arg2, ... */) {
        var func = this;
        var _slice = Array.prototype.slice;
        var _concat = Array.prototype.concat;
        var _args = _slice.call(arguments, 1);

        return function () {
            return func.apply(obj ? obj : this,
                              _concat.call(_args,
                                           _slice.call(arguments, 0)));
        };
    };
}

/** PrivateFunction: Array.isArray
 *  This is a polyfill for the ES5 Array.isArray method.
 */
if (!Array.isArray) {
    Array.isArray = function(arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
    };
}

/** PrivateFunction: Array.prototype.indexOf
 *  Return the index of an object in an array.
 *
 *  This function is not supplied by some JavaScript implementations, so
 *  we provide it if it is missing.  This code is from:
 *  http://developer.mozilla.org/En/Core_JavaScript_1.5_Reference:Objects:Array:indexOf
 *
 *  Parameters:
 *    (Object) elt - The object to look for.
 *    (Integer) from - The index from which to start looking. (optional).
 *
 *  Returns:
 *    The index of elt in the array or -1 if not found.
 */
if (!Array.prototype.indexOf)
    {
        Array.prototype.indexOf = function(elt /*, from*/)
        {
            var len = this.length;

            var from = Number(arguments[1]) || 0;
            from = (from < 0) ? Math.ceil(from) : Math.floor(from);
            if (from < 0) {
                from += len;
            }

            for (; from < len; from++) {
                if (from in this && this[from] === elt) {
                    return from;
                }
            }

            return -1;
        };
    }
}));

/*
    This program is distributed under the terms of the MIT license.
    Please see the LICENSE file for details.

    Copyright 2006-2008, OGG, LLC
*/

/* jshint undef: true, unused: true:, noarg: true, latedef: true */
/*global define, document, window, setTimeout, clearTimeout, console, ActiveXObject, DOMParser */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('strophe-core', [
            'strophe-sha1',
            'strophe-base64',
            'strophe-md5',
            'strophe-utils',
            "strophe-polyfill"
        ], function () {
            return factory.apply(this, arguments);
        });
    } else {
        // Browser globals
        var o = factory(root.SHA1, root.Base64, root.MD5, root.stropheUtils);
        window.Strophe =        o.Strophe;
        window.$build =         o.$build;
        window.$iq =            o.$iq;
        window.$msg =           o.$msg;
        window.$pres =          o.$pres;
        window.SHA1 =           o.SHA1;
        window.Base64 =         o.Base64;
        window.MD5 =            o.MD5;
        window.b64_hmac_sha1 =  o.SHA1.b64_hmac_sha1;
        window.b64_sha1 =       o.SHA1.b64_sha1;
        window.str_hmac_sha1 =  o.SHA1.str_hmac_sha1;
        window.str_sha1 =       o.SHA1.str_sha1;
    }
}(this, function (SHA1, Base64, MD5, utils) {

var Strophe;

/** Function: $build
 *  Create a Strophe.Builder.
 *  This is an alias for 'new Strophe.Builder(name, attrs)'.
 *
 *  Parameters:
 *    (String) name - The root element name.
 *    (Object) attrs - The attributes for the root element in object notation.
 *
 *  Returns:
 *    A new Strophe.Builder object.
 
 函数 ：  $build
 新建一个Strophe.Builder，相当于： new Strophe.Builder(name,attrs)，自定义节点，方便扩展
 
 参数：
	字符串name 根元素名称
	对象attrs  根元素的属性
	
返回值：
	一个新的Strophe.Builder对象
 */
function $build(name, attrs) { return new Strophe.Builder(name, attrs); }

/** Function: $msg
 *  Create a Strophe.Builder with a <message/> element as the root.
 *
 *  Parameters:
 *    (Object) attrs - The <message/> element attributes in object notation.
 *
 *  Returns:
 *    A new Strophe.Builder object.
 
 函数 ：  $msg
 新建一个带有 <message/> 元素作为根的Strophe.Builder  ，Message节点
 
 参数：
	对象attrs <message/>元素的属性
	
返回值：
	一个新的Strophe.Builder对象
 */
function $msg(attrs) { return new Strophe.Builder("message", attrs); }

/** Function: $iq
 *  Create a Strophe.Builder with an <iq/> element as the root.
 *
 *  Parameters:
 *    (Object) attrs - The <iq/> element attributes in object notation.
 *
 *  Returns:
 *    A new Strophe.Builder object.
 
 函数：$iq
	新建一个带有 <iq/> 元素作为根的Strophe.Builder ，  IQ节点
	
参数：
	对象attrs <iq/>节点包含的属性

返回值：
	一个新的Strophe.Builder对象
 */
function $iq(attrs) { return new Strophe.Builder("iq", attrs); }

/** Function: $pres
 *  Create a Strophe.Builder with a <presence/> element as the root.
 *
 *  Parameters:
 *    (Object) attrs - The <presence/> element attributes in object notation.
 *
 *  Returns:
 *    A new Strophe.Builder object.

 函数：$pres
	新建一个带有 <presence/> 元素作为根的Strophe.Builder ，  presence节点
	
参数：
	对象attrs <presence/>节点包含的属性

返回值：
	一个新的Strophe.Builder对象
 */
function $pres(attrs) { return new Strophe.Builder("presence", attrs); }

/** Class: Strophe
 *  An object container for all Strophe library functions.
 *
 *  This class is just a container for all the objects and constants
 *  used in the library.  It is not meant to be instantiated, but to
 *  provide a namespace for library objects, constants, and functions.
 
 类：Strophe
 这个对象包含所有strophe库的函数
 
 这个类仅仅是一个为所有这些被使用的对象和常量所提供的容器，
 它并不意味着要实例化，但是它为库中的对象，常量和函数提供了一个命名空间
 */
Strophe = {
    /** Constant: VERSION
     *  The version of the Strophe library. Unreleased builds will have
     *  a version of head-HASH where HASH is a partial revision.
     */
    VERSION: "1.2.7",

    /** Constants: XMPP Namespace Constants
     *  Common namespace constants from the XMPP RFCs and XEPs.
     *
     *  NS.HTTPBIND - HTTP BIND namespace from XEP 124.
     *  NS.BOSH - BOSH namespace from XEP 206.
     *  NS.CLIENT - Main XMPP client namespace.
     *  NS.AUTH - Legacy authentication namespace.
     *  NS.ROSTER - Roster operations namespace.
     *  NS.PROFILE - Profile namespace.
     *  NS.DISCO_INFO - Service discovery info namespace from XEP 30.
     *  NS.DISCO_ITEMS - Service discovery items namespace from XEP 30.
     *  NS.MUC - Multi-User Chat namespace from XEP 45.
     *  NS.SASL - XMPP SASL namespace from RFC 3920.
     *  NS.STREAM - XMPP Streams namespace from RFC 3920.
     *  NS.BIND - XMPP Binding namespace from RFC 3920.
     *  NS.SESSION - XMPP Session namespace from RFC 3920.
     *  NS.XHTML_IM - XHTML-IM namespace from XEP 71.
     *  NS.XHTML - XHTML body namespace from XEP 71.
     */
    NS: {
        HTTPBIND: "http://jabber.org/protocol/httpbind",
        BOSH: "urn:xmpp:xbosh",
        CLIENT: "jabber:client",
        AUTH: "jabber:iq:auth",
        ROSTER: "jabber:iq:roster",
        PROFILE: "jabber:iq:profile",
        DISCO_INFO: "http://jabber.org/protocol/disco#info",
        DISCO_ITEMS: "http://jabber.org/protocol/disco#items",
        MUC: "http://jabber.org/protocol/muc",
        SASL: "urn:ietf:params:xml:ns:xmpp-sasl",
        STREAM: "http://etherx.jabber.org/streams",
        FRAMING: "urn:ietf:params:xml:ns:xmpp-framing",
        BIND: "urn:ietf:params:xml:ns:xmpp-bind",
        SESSION: "urn:ietf:params:xml:ns:xmpp-session",
        VERSION: "jabber:iq:version",
        STANZAS: "urn:ietf:params:xml:ns:xmpp-stanzas",
        XHTML_IM: "http://jabber.org/protocol/xhtml-im",
        XHTML: "http://www.w3.org/1999/xhtml"
    },


    /** Constants: XHTML_IM Namespace
     *  contains allowed tags, tag attributes, and css properties.
     *  Used in the createHtml function to filter incoming html into the allowed XHTML-IM subset.
     *  See http://xmpp.org/extensions/xep-0071.html#profile-summary for the list of recommended
     *  allowed tags and their attributes.
     */
    XHTML: {
                tags: ['a','blockquote','br','cite','em','img','li','ol','p','span','strong','ul','body'],
                attributes: {
                        'a':          ['href'],
                        'blockquote': ['style'],
                        'br':         [],
                        'cite':       ['style'],
                        'em':         [],
                        'img':        ['src', 'alt', 'style', 'height', 'width'],
                        'li':         ['style'],
                        'ol':         ['style'],
                        'p':          ['style'],
                        'span':       ['style'],
                        'strong':     [],
                        'ul':         ['style'],
                        'body':       []
                },
                css: ['background-color','color','font-family','font-size','font-style','font-weight','margin-left','margin-right','text-align','text-decoration'],
                /** Function: XHTML.validTag
                 *
                 * Utility method to determine whether a tag is allowed
                 * in the XHTML_IM namespace.
                 *
                 * XHTML tag names are case sensitive and must be lower case.
				 
				 函数：XHTML.validTag
				 
				 工具方法去判断是否一个标签在XHTML_IM命名空间是否被允许使用
				 
				 XHTML的标签名字是大小写敏感的，并且必须是小写的
                 */
                validTag: function(tag) {
                        for (var i = 0; i < Strophe.XHTML.tags.length; i++) {
                                if (tag == Strophe.XHTML.tags[i]) {
                                        return true;
                                }
                        }
                        return false;
                },
                /** Function: XHTML.validAttribute
                 *
                 * Utility method to determine whether an attribute is allowed
                 * as recommended per XEP-0071
                 *
                 * XHTML attribute names are case sensitive and must be lower case.
				 
				 同上
                 */
                validAttribute: function(tag, attribute) {
                        if(typeof Strophe.XHTML.attributes[tag] !== 'undefined' && Strophe.XHTML.attributes[tag].length > 0) {
                                for(var i = 0; i < Strophe.XHTML.attributes[tag].length; i++) {
                                        if(attribute == Strophe.XHTML.attributes[tag][i]) {
                                                return true;
                                        }
                                }
                        }
                        return false;
                },
                validCSS: function(style)
                {
                        for(var i = 0; i < Strophe.XHTML.css.length; i++) {
                                if(style == Strophe.XHTML.css[i]) {
                                        return true;
                                }
                        }
                        return false;
                }
    },

    /** Constants: Connection Status Constants
     *  Connection status constants for use by the connection handler
     *  callback.
     *
     *0  Status.ERROR - An error has occurred
     *1  Status.CONNECTING - The connection is currently being made
     *2  Status.CONNFAIL - The connection attempt failed
     *3  Status.AUTHENTICATING - The connection is authenticating
     *4  Status.AUTHFAIL - The authentication attempt failed
     *5  Status.CONNECTED - The connection has succeeded
     *6  Status.DISCONNECTED - The connection has been terminated
     *7  Status.DISCONNECTING - The connection is currently being terminated
     *8  Status.ATTACHED - The connection has been attached
     *9  Status.CONNTIMEOUT - The connection has timed out
	 
	 常量：连接状态常量
	 被连接处理程序回调
	 
     */
    Status: {
        ERROR: 0,
        CONNECTING: 1,
        CONNFAIL: 2,
        AUTHENTICATING: 3,
        AUTHFAIL: 4,
        CONNECTED: 5,
        DISCONNECTED: 6,
        DISCONNECTING: 7,
        ATTACHED: 8,
        REDIRECT: 9,
        CONNTIMEOUT: 10
    },

    /** Constants: Log Level Constants
     *  Logging level indicators.
     *
     *  LogLevel.DEBUG - Debug output
     *  LogLevel.INFO - Informational output
     *  LogLevel.WARN - Warnings
     *  LogLevel.ERROR - Errors
     *  LogLevel.FATAL - Fatal errors
	 常量：日志等级
		日志等级指示器
		
     */
    LogLevel: {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        FATAL: 4
    },

    /** PrivateConstants: DOM Element Type Constants
     *  DOM element types.
     *
     *  ElementType.NORMAL - Normal element.
     *  ElementType.TEXT - Text data element.
     *  ElementType.FRAGMENT - XHTML fragment element.
	 私有常量：DOM元素类型常量
		DOM元素类型
     */
    ElementType: {
        NORMAL: 1,
        TEXT: 3,
        CDATA: 4,
        FRAGMENT: 11
    },

    /** PrivateConstants: Timeout Values
     *  Timeout values for error states.  These values are in seconds.
     *  These should not be changed unless you know exactly what you are
     *  doing.
     *
     *  TIMEOUT - Timeout multiplier. A waiting request will be considered
     *      failed after Math.floor(TIMEOUT * wait) seconds have elapsed.
     *      This defaults to 1.1, and with default wait, 66 seconds.
     *  SECONDARY_TIMEOUT - Secondary timeout multiplier. In cases where
     *      Strophe can detect early failure, it will consider the request
     *      failed if it doesn't return after
     *      Math.floor(SECONDARY_TIMEOUT * wait) seconds have elapsed.
     *      This defaults to 0.1, and with default wait, 6 seconds.
	 
	 私有常量：超时值
		错误状态的超时值，这些值是在短时间内
		这些值不应该被改变除非你清楚的知道你要干什么
		
		TIMEOUT - 等待请求在66秒后将会被考虑是失败的
		SECONDARY_TIMEOUT - 如果能够检测到之前有请求失败，那么这次的请求会在6秒后被考虑是失败的。
     */
    TIMEOUT: 1.1,
    SECONDARY_TIMEOUT: 0.1,

    /** Function: addNamespace
     *  This function is used to extend the current namespaces in
     *  Strophe.NS.  It takes a key and a value with the key being the
     *  name of the new namespace, with its actual value.
     *  For example:
     *  Strophe.addNamespace('PUBSUB', "http://jabber.org/protocol/pubsub");
     *
     *  Parameters:
     *    (String) name - The name under which the namespace will be
     *      referenced under Strophe.NS
     *    (String) value - The actual namespace.
	 函数：添加命名空间
		这个函数是用来扩展Strophe.NS中的命名空间，它需要一个键值对做为参数，
		如 Strophe.addNamespace('PUBSUB', "http://jabber.org/protocol/pubsub");
		
	参数：
		字符串name - 在Strophe.NS空间中被使用的名字
		字符串value - 其对应的真正命名空间
     */
    addNamespace: function (name, value) {
      Strophe.NS[name] = value;
    },

    /** Function: forEachChild
     *  Map a function over some or all child elements of a given element.
     *
     *  This is a small convenience function for mapping a function over
     *  some or all of the children of an element.  If elemName is null, all
     *  children will be passed to the function, otherwise only children
     *  whose tag names match elemName will be passed.
     *
     *  Parameters:
     *    (XMLElement) elem - The element to operate on.
     *    (String) elemName - The child element tag name filter.
     *    (Function) func - The function to apply to each child.  This
     *      function should take a single argument, a DOM element.
	 函数：forEachChild
	 让一个函数去执行给定元素的部分或所有子元素，只遍历直接子元素。
	 
	 这是一个很小的便利的函数，为一个元素的子元素执行一个函数的，
	 如果elemName是空的，所有子元素都会被通过这个函数的执行，否则
	 只有那些标签名称能够匹配eleName的才会被执行
	 
	 参数：
		XML元素， elem - 父元素
		字符串eleName - 子元素标签名过滤器，注意这个是区分大小写的。
		函数，func - 一个应用于每个子元素的函数，这个函数应该有一个参数，一个DOM类型的元素
	 
     */
    forEachChild: function (elem, elemName, func) {
        var i, childNode;

        for (i = 0; i < elem.childNodes.length; i++) {
            childNode = elem.childNodes[i];
            if (childNode.nodeType == Strophe.ElementType.NORMAL &&
                (!elemName || this.isTagEqual(childNode, elemName))) {
                func(childNode);
            }
        }
    },

    /** Function: isTagEqual
     *  Compare an element's tag name with a string.
     *
     *  This function is case sensitive.
     *
     *  Parameters:
     *    (XMLElement) el - A DOM element.
     *    (String) name - The element name.
     *
     *  Returns:
     *    true if the element's tag name matches _el_, and false
     *    otherwise.
	 
	 函数：isTagEqual
		和一个字符串比较元素的标签名
			
		这个函数大小写敏感
		
	参数：
		XML元素 el  - 一个dom元素
		字符串 name - 元素的名称
     */
    isTagEqual: function (el, name) {
        return el.tagName == name;
    },

    /** PrivateVariable: _xmlGenerator
     *  _Private_ variable that caches a DOM document to
     *  generate elements.
	 
	 私有变量：
		根据缓存的DOM文档去生成元素
	 
     */
    _xmlGenerator: null,

    /** PrivateFunction: _makeGenerator
     *  _Private_ function that creates a dummy XML DOM document to serve as
     *  an element and text node generator.
	 私有函数：
		创建一个虚拟的XML DOM文档充当一个元素和文本节点的生成器
     */
    _makeGenerator: function () {
        var doc;

        // IE9 does implement createDocument(); however, using it will cause the browser to leak memory on page unload.
        // Here, we test for presence of createDocument() plus IE's proprietary documentMode attribute, which would be
                // less than 10 in the case of IE9 and below.
        if (document.implementation.createDocument === undefined ||
                        document.implementation.createDocument && document.documentMode && document.documentMode < 10) {
            doc = this._getIEXmlDom();
            doc.appendChild(doc.createElement('strophe'));
        } else {
            doc = document.implementation
                .createDocument('jabber:client', 'strophe', null);
        }

        return doc;
    },

    /** Function: xmlGenerator
     *  Get the DOM document to generate elements.
     *
     *  Returns:
     *    The currently used DOM document.
	 函数：
		得到DOM文档去生成元素
	 
	 返回
		当前使用的DOM文档
		
     */
    xmlGenerator: function () {
        if (!Strophe._xmlGenerator) {
            Strophe._xmlGenerator = Strophe._makeGenerator();
        }
        return Strophe._xmlGenerator;
    },

    /** PrivateFunction: _getIEXmlDom
     *  Gets IE xml doc object
     *
     *  Returns:
     *    A Microsoft XML DOM Object
     *  See Also:
     *    http://msdn.microsoft.com/en-us/library/ms757837%28VS.85%29.aspx
     
	私有函数：
		得到IE XML 文档对象
		
	返回值：	
		一个微软的XML DOM对象
	 */
    _getIEXmlDom : function() {
        var doc = null;
        var docStrings = [
            "Msxml2.DOMDocument.6.0",
            "Msxml2.DOMDocument.5.0",
            "Msxml2.DOMDocument.4.0",
            "MSXML2.DOMDocument.3.0",
            "MSXML2.DOMDocument",
            "MSXML.DOMDocument",
            "Microsoft.XMLDOM"
        ];

        for (var d = 0; d < docStrings.length; d++) {
            if (doc === null) {
                try {
                    doc = new ActiveXObject(docStrings[d]);
                } catch (e) {
                    doc = null;
                }
            } else {
                break;
            }
        }

        return doc;
    },

    /** Function: xmlElement
     *  Create an XML DOM element.
     *
     *  This function creates an XML DOM element correctly across all
     *  implementations. Note that these are not HTML DOM elements, which
     *  aren't appropriate for XMPP stanzas.
     *
     *  Parameters:
     *    (String) name - The name for the element.
     *    (Array|Object) attrs - An optional array or object containing
     *      key/value pairs to use as element attributes. The object should
     *      be in the format {'key': 'value'} or {key: 'value'}. The array
     *      should have the format [['key1', 'value1'], ['key2', 'value2']].
     *    (String) text - The text child data for the element.
     *
     *  Returns:
     *    A new XML DOM element.
	 
	 函数
		创建一个XML DOM元素
			
		这个函数通过所有的已实现 正确的创建一个XML DOM元素，注意不是HTML DOM 元素，
		它们不适合XMPP节
		
	参数：	
		字符串name - 元素的名称
		数字|对象 attrs - 可选包含键值对的数组或者对象，作为元素的属性。
			对象的格式 {'key': 'value'} or {key: 'value'}
			数组的格式 [['key1', 'value1'], ['key2', 'value2']].
		字符串 text - 元素的文本子元素
		
	返回值：
		一个新的XML DOM元素
     */
    xmlElement: function (name) {
        if (!name) { return null; }

        var node = Strophe.xmlGenerator().createElement(name);

        // FIXME: this should throw errors if args are the wrong type or
        // there are more than two optional args
        var a, i, k;
        for (a = 1; a < arguments.length; a++) {
            var arg = arguments[a];
            if (!arg) { continue; }
            if (typeof(arg) == "string" ||
                typeof(arg) == "number") {
                node.appendChild(Strophe.xmlTextNode(arg));
            } else if (typeof(arg) == "object" &&
                       typeof(arg.sort) == "function") {
                for (i = 0; i < arg.length; i++) {
                    var attr = arg[i];
                    if (typeof(attr) == "object" &&
                        typeof(attr.sort) == "function" &&
                        attr[1] !== undefined &&
                        attr[1] !== null) {
                        node.setAttribute(attr[0], attr[1]);
                    }
                }
            } else if (typeof(arg) == "object") {
                for (k in arg) {
                    if (arg.hasOwnProperty(k)) {
                        if (arg[k] !== undefined &&
                            arg[k] !== null) {
                            node.setAttribute(k, arg[k]);
                        }
                    }
                }
            }
        }

        return node;
    },

    /*  Function: xmlescape
     *  Excapes invalid xml characters.
     *
     *  Parameters:
     *     (String) text - text to escape.
     *
     *  Returns:
     *      Escaped text.
	 
	 函数： & < > ' " 
		编译无效的XML字符，
	
	参数：
		字符串 text - 需要编译的文本
		
	返回值 
		编译完成的文本
     */
    xmlescape: function(text)
    {
        text = text.replace(/\&/g, "&amp;");
        text = text.replace(/</g,  "&lt;");
        text = text.replace(/>/g,  "&gt;");
        text = text.replace(/'/g,  "&apos;");
        text = text.replace(/"/g,  "&quot;");
        return text;
    },

    /*  Function: xmlunescape
    *  Unexcapes invalid xml characters.
    *
    *  Parameters:
    *     (String) text - text to unescape.
    *
    *  Returns:
    *      Unescaped text.
	上面一个的逆过程
    */
    xmlunescape: function(text)
    {
        text = text.replace(/\&amp;/g, "&");
        text = text.replace(/&lt;/g,  "<");
        text = text.replace(/&gt;/g,  ">");
        text = text.replace(/&apos;/g,  "'");
        text = text.replace(/&quot;/g,  "\"");
        return text;
    },

    /** Function: xmlTextNode
     *  Creates an XML DOM text node.
     *
     *  Provides a cross implementation version of document.createTextNode.
     *
     *  Parameters:
     *    (String) text - The content of the text node.
     *
     *  Returns:
     *    A new XML DOM text node.
	 
	 函数：
		创建一个XML DOM 文本节点
		
		提供一个（类似）document.createTextNode的实现方法
		
	参数：
		字符串 text - 文本节点的内容
		
	返回值：
		一个新的XML DOM 文本节点
     */
    xmlTextNode: function (text) {
        return Strophe.xmlGenerator().createTextNode(text);
    },

    /** Function: xmlHtmlNode
     *  Creates an XML DOM html node.
     *
     *  Parameters:
     *    (String) html - The content of the html node.
     *
     *  Returns:
     *    A new XML DOM text node.
	 
	 函数：
		创建一个XML DOM html节点
		
	参数：	
		字符串 html - html节点的内容
	
	返回值：	
		一个新的XML DOM 文本节点
     */
    xmlHtmlNode: function (html) {
        var node;
        //ensure text is escaped
        if (window.DOMParser) {
            var parser = new DOMParser();
            node = parser.parseFromString(html, "text/xml");
        } else {
            node = new ActiveXObject("Microsoft.XMLDOM");
            node.async="false";
            node.loadXML(html);
        }
        return node;
    },

    /** Function: getText
     *  Get the concatenation of all text children of an element.
     *
     *  Parameters:
     *    (XMLElement) elem - A DOM element.
     *
     *  Returns:
     *    A String with the concatenated text of all text element children.
	 
	 函数：
		得到所有文本节点的值的连接字符串
		
	参数：
		XML元素 elem - 一个DOM元素
		
	返回值：
		所有文本节点的值连接在一起的字符串
     */
    getText: function (elem) {
        if (!elem) { return null; }

        var str = "";
        if (elem.childNodes.length === 0 && elem.nodeType ==
            Strophe.ElementType.TEXT) {
            str += elem.nodeValue;
        }

        for (var i = 0; i < elem.childNodes.length; i++) {
            if (elem.childNodes[i].nodeType == Strophe.ElementType.TEXT) {
                str += elem.childNodes[i].nodeValue;
            }
        }

        return Strophe.xmlescape(str);
    },

    /** Function: copyElement
     *  Copy an XML DOM element.
     *
     *  This function copies a DOM element and all its descendants and returns
     *  the new copy.
     *
     *  Parameters:
     *    (XMLElement) elem - A DOM element.
     *
     *  Returns:
     *    A new, copied DOM element tree.
	 
	 函数
		复制一个XML DOM元素
		
		这个函数复制一个DOM 元素以及它的所有子节点并返回复制的副本
		
	参数：
		XML元素 elem - 一个DOM元素
	
	返回值： 
		一个新的，复制的DOM元素树
     */
    copyElement: function (elem) {
        var i, el;
        if (elem.nodeType == Strophe.ElementType.NORMAL) {
            el = Strophe.xmlElement(elem.tagName);

            for (i = 0; i < elem.attributes.length; i++) {
                el.setAttribute(elem.attributes[i].nodeName,
                                elem.attributes[i].value);
            }

            for (i = 0; i < elem.childNodes.length; i++) {
                el.appendChild(Strophe.copyElement(elem.childNodes[i]));
            }
        } else if (elem.nodeType == Strophe.ElementType.TEXT) {
            el = Strophe.xmlGenerator().createTextNode(elem.nodeValue);
        }

        return el;
    },


    /** Function: createHtml
     *  Copy an HTML DOM element into an XML DOM.
     *
     *  This function copies a DOM element and all its descendants and returns
     *  the new copy.
     *
     *  Parameters:
     *    (HTMLElement) elem - A DOM element.
     *
     *  Returns:
     *    A new, copied DOM element tree.
	 
	 函数：
		复制一个HTML DOM元素到一个XML DOM
		
		这个函数复制一个DOM元素和所有它的子元素并返回这个新的副本
		
	参数：
		HTML元素 elem - 一个DOM元素
		
	返回值：
		一个新的，复制的DOM 元素树
     */
    createHtml: function (elem) {
        var i, el, j, tag, attribute, value, css, cssAttrs, attr, cssName, cssValue;
        if (elem.nodeType == Strophe.ElementType.NORMAL) {
            tag = elem.nodeName.toLowerCase(); // XHTML tags must be lower case.
            if(Strophe.XHTML.validTag(tag)) {
                try {
                    el = Strophe.xmlElement(tag);
                    for(i = 0; i < Strophe.XHTML.attributes[tag].length; i++) {
                        attribute = Strophe.XHTML.attributes[tag][i];
                        value = elem.getAttribute(attribute);
                        if(typeof value == 'undefined' || value === null || value === '' || value === false || value === 0) {
                            continue;
                        }
                        if(attribute == 'style' && typeof value == 'object') {
                            if(typeof value.cssText != 'undefined') {
                                value = value.cssText; // we're dealing with IE, need to get CSS out
                            }
                        }
                        // filter out invalid css styles
                        if(attribute == 'style') {
                            css = [];
                            cssAttrs = value.split(';');
                            for(j = 0; j < cssAttrs.length; j++) {
                                attr = cssAttrs[j].split(':');
                                cssName = attr[0].replace(/^\s*/, "").replace(/\s*$/, "").toLowerCase();
                                if(Strophe.XHTML.validCSS(cssName)) {
                                    cssValue = attr[1].replace(/^\s*/, "").replace(/\s*$/, "");
                                    css.push(cssName + ': ' + cssValue);
                                }
                            }
                            if(css.length > 0) {
                                value = css.join('; ');
                                el.setAttribute(attribute, value);
                            }
                        } else {
                            el.setAttribute(attribute, value);
                        }
                    }

                    for (i = 0; i < elem.childNodes.length; i++) {
                        el.appendChild(Strophe.createHtml(elem.childNodes[i]));
                    }
                } catch(e) { // invalid elements
                  el = Strophe.xmlTextNode('');
                }
            } else {
                el = Strophe.xmlGenerator().createDocumentFragment();
                for (i = 0; i < elem.childNodes.length; i++) {
                    el.appendChild(Strophe.createHtml(elem.childNodes[i]));
                }
            }
        } else if (elem.nodeType == Strophe.ElementType.FRAGMENT) {
            el = Strophe.xmlGenerator().createDocumentFragment();
            for (i = 0; i < elem.childNodes.length; i++) {
                el.appendChild(Strophe.createHtml(elem.childNodes[i]));
            }
        } else if (elem.nodeType == Strophe.ElementType.TEXT) {
            el = Strophe.xmlTextNode(elem.nodeValue);
        }

        return el;
    },

    /** Function: escapeNode
     *  Escape the node part (also called local part) of a JID.
     *
     *  Parameters:
     *    (String) node - A node (or local part).
     *
     *  Returns:
     *    An escaped node (or local part).
	 
	 函数：
		对jid的node部分进行换码，node@domain/resource,  用户名，
		
	参数：
		字符串 node - 一个node
	
	返回值：
		换码后的node
     */
    escapeNode: function (node) {
        if (typeof node !== "string") { return node; }
        return node.replace(/^\s+|\s+$/g, '')
            .replace(/\\/g,  "\\5c")
            .replace(/ /g,   "\\20")
            .replace(/\"/g,  "\\22")
            .replace(/\&/g,  "\\26")
            .replace(/\'/g,  "\\27")
            .replace(/\//g,  "\\2f")
            .replace(/:/g,   "\\3a")
            .replace(/</g,   "\\3c")
            .replace(/>/g,   "\\3e")
            .replace(/@/g,   "\\40");
    },

    /** Function: unescapeNode
     *  Unescape a node part (also called local part) of a JID.
     *
     *  Parameters:
     *    (String) node - A node (or local part).
     *
     *  Returns:
     *    An unescaped node (or local part).
	 
	上面一个的逆过程
     */
    unescapeNode: function (node) {
        if (typeof node !== "string") { return node; }
        return node.replace(/\\20/g, " ")
            .replace(/\\22/g, '"')
            .replace(/\\26/g, "&")
            .replace(/\\27/g, "'")
            .replace(/\\2f/g, "/")
            .replace(/\\3a/g, ":")
            .replace(/\\3c/g, "<")
            .replace(/\\3e/g, ">")
            .replace(/\\40/g, "@")
            .replace(/\\5c/g, "\\");
    },

    /** Function: getNodeFromJid
     *  Get the node portion of a JID String.
     *
     *  Parameters:
     *    (String) jid - A JID.
     *
     *  Returns:
     *    A String containing the node.
	 
	 函数：
		从JID中得到node
	
	参数：
		字符串 jid - jid
		
	返回值 ：
		node字符串
     */
    getNodeFromJid: function (jid) {
        if (jid.indexOf("@") < 0) { return null; }
        return jid.split("@")[0];
    },

    /** Function: getDomainFromJid
     *  Get the domain portion of a JID String.
     *
     *  Parameters:
     *    (String) jid - A JID.
     *
     *  Returns:
     *    A String containing the domain.
	 
	 函数：
		从JID中得到domain
     */
    getDomainFromJid: function (jid) {
        var bare = Strophe.getBareJidFromJid(jid);
        if (bare.indexOf("@") < 0) {
            return bare;
        } else {
            var parts = bare.split("@");
            parts.splice(0, 1);
            return parts.join('@');
        }
    },

    /** Function: getResourceFromJid
     *  Get the resource portion of a JID String.
     *
     *  Parameters:
     *    (String) jid - A JID.
     *
     *  Returns:
     *    A String containing the resource.
	 
	 函数：
		从JID中得到resource
     */
    getResourceFromJid: function (jid) {
        var s = jid.split("/");
        if (s.length < 2) { return null; }
        s.splice(0, 1);
        return s.join('/');
    },

    /** Function: getBareJidFromJid
     *  Get the bare JID from a JID String.
     *
     *  Parameters:
     *    (String) jid - A JID.
     *
     *  Returns:
     *    A String containing the bare JID.
	 
	 函数：
		得到纯JID
     */
    getBareJidFromJid: function (jid) {
        return jid ? jid.split("/")[0] : null;
    },

    /** Function: log
     *  User overrideable logging function.
     *
     *  This function is called whenever the Strophe library calls any
     *  of the logging functions.  The default implementation of this
     *  function does nothing.  If client code wishes to handle the logging
     *  messages, it should override this with
     *  > Strophe.log = function (level, msg) {
     *  >   (user code here)
     *  > };
     *
     *  Please note that data sent and received over the wire is logged
     *  via Strophe.Connection.rawInput() and Strophe.Connection.rawOutput().
     *
     *  The different levels and their meanings are
     *
     *    DEBUG - Messages useful for debugging purposes.
     *    INFO - Informational messages.  This is mostly information like
     *      'disconnect was called' or 'SASL auth succeeded'.
     *    WARN - Warnings about potential problems.  This is mostly used
     *      to report transient connection errors like request timeouts.
     *    ERROR - Some error occurred.
     *    FATAL - A non-recoverable fatal error occurred.
     *
     *  Parameters:
     *    (Integer) level - The log level of the log message.  This will
     *      be one of the values in Strophe.LogLevel.
     *    (String) msg - The log message.
	 
	 函数：log
		用户重写打日志函数
		
		这个函数会被调用无论何时strophe库调用任何打日志函数，这个函数的默认的实现
		没有做任何事情，如果客户端代码想要去处理日志消息，应该重写哥哥函数：
		Strophe.log = function(level, msg) {
				// user code here
		};
		
		请注意数据的发送和接收会通过Strophe.Connection.rawInput()和Strophe.Connection.rawOutput()被记录的
		
		以下是不同的等级和它们所代表的意义
	
	参数：
		数值型 level - 日志等级，
		字符串 msg - 日志内容
     */
    /* jshint ignore:start */
    log: function (level, msg) {
        return;
    },
    /* jshint ignore:end */

    /** Function: debug
     *  Log a message at the Strophe.LogLevel.DEBUG level.
     *
     *  Parameters:
     *    (String) msg - The log message.
	 
	 函数：
		以等级为DEBUG来记录日志
		
	参数：	
		字符串 msg - 需要记录的信息
     */
    debug: function(msg)
    {
        this.log(this.LogLevel.DEBUG, msg);
    },

    /** Function: info
     *  Log a message at the Strophe.LogLevel.INFO level.
     *
     *  Parameters:
     *    (String) msg - The log message.
	 
	 同上
     */
    info: function (msg) {
        this.log(this.LogLevel.INFO, msg);
    },

    /** Function: warn
     *  Log a message at the Strophe.LogLevel.WARN level.
     *
     *  Parameters:
     *    (String) msg - The log message.
	 
	 同上
     */
    warn: function (msg) {
        this.log(this.LogLevel.WARN, msg);
    },

    /** Function: error
     *  Log a message at the Strophe.LogLevel.ERROR level.
     *
     *  Parameters:
     *    (String) msg - The log message.
	 
	 同上
     */
    error: function (msg) {
        this.log(this.LogLevel.ERROR, msg);
    },

    /** Function: fatal
     *  Log a message at the Strophe.LogLevel.FATAL level.
     *
     *  Parameters:
     *    (String) msg - The log message.
	 
	 同上
     */
    fatal: function (msg) {
        this.log(this.LogLevel.FATAL, msg);
    },

    /** Function: serialize
     *  Render a DOM element and all descendants to a String.
     *
     *  Parameters:
     *    (XMLElement) elem - A DOM element.
     *
     *  Returns:
     *    The serialized element tree as a String.
	 函数：
		将一个DOM元素和它的子元素序列化为一个字符串，并且有换码 > < 有被转换。
		
	参数：
		XML元素 elem - 一个DOM元素
     */
    serialize: function (elem) {
        var result;

        if (!elem) { return null; }

        if (typeof(elem.tree) === "function") {
            elem = elem.tree();
        }

        var nodeName = elem.nodeName;
        var i, child;

        if (elem.getAttribute("_realname")) {
            nodeName = elem.getAttribute("_realname");
        }

        result = "<" + nodeName;
        for (i = 0; i < elem.attributes.length; i++) {
               if(elem.attributes[i].nodeName != "_realname") {
                 result += " " + elem.attributes[i].nodeName +
                "='" + elem.attributes[i].value
                    .replace(/&/g, "&amp;")
                       .replace(/\'/g, "&apos;")
                       .replace(/>/g, "&gt;")
                       .replace(/</g, "&lt;") + "'";
               }
        }

        if (elem.childNodes.length > 0) {
            result += ">";
            for (i = 0; i < elem.childNodes.length; i++) {
                child = elem.childNodes[i];
                switch( child.nodeType ){
                  case Strophe.ElementType.NORMAL:
                    // normal element, so recurse
                    result += Strophe.serialize(child);
                    break;
                  case Strophe.ElementType.TEXT:
                    // text element to escape values
                    result += Strophe.xmlescape(child.nodeValue);
                    break;
                  case Strophe.ElementType.CDATA:
                    // cdata section so don't escape values
                    result += "<![CDATA["+child.nodeValue+"]]>";
                }
            }
            result += "</" + nodeName + ">";
        } else {
            result += "/>";
        }

        return result;
    },

    /** PrivateVariable: _requestId
     *  _Private_ variable that keeps track of the request ids for
     *  connections.
	 
	 私有变量：
		保存连接的请求IDS的踪迹的私有变量
     */
    _requestId: 0,

    /** PrivateVariable: Strophe.connectionPlugins
     *  _Private_ variable Used to store plugin names that need
     *  initialization on Strophe.Connection construction.
	 
	 用来保存那些需要在Strophe.Connection 构造器中初始化的插件名称
     */
    _connectionPlugins: {},

    /** Function: addConnectionPlugin
     *  Extends the Strophe.Connection object with the given plugin.
     *
     *  Parameters:
     *    (String) name - The name of the extension.
     *    (Object) ptype - The plugin's prototype.
		
	函数：
		扩展Strophe.Connection使之能够接受给定的插件
		
	参数：
		字符串 name - 插件的名称
		对象 ptype  - 插件的标准|原型
     */
    addConnectionPlugin: function (name, ptype) {
        Strophe._connectionPlugins[name] = ptype;
    }
};

/** Class: Strophe.Builder
 *  XML DOM builder.
 *
 *  This object provides an interface similar to JQuery but for building
 *  DOM elements easily and rapidly.  All the functions except for toString()
 *  and tree() return the object, so calls can be chained.  Here's an
 *  example using the $iq() builder helper.
 *  > $iq({to: 'you', from: 'me', type: 'get', id: '1'})
 *  >     .c('query', {xmlns: 'strophe:example'})
 *  >     .c('example')
 *  >     .toString()
 *  The above generates this XML fragment
 *  > <iq to='you' from='me' type='get' id='1'>
 *  >   <query xmlns='strophe:example'>
 *  >     <example/>
 *  >   </query>
 *  > </iq>
 *  The corresponding DOM manipulations to get a similar fragment would be
 *  a lot more tedious and probably involve several helper variables.
 *
 *  Since adding children makes new operations operate on the child, up()
 *  is provided to traverse up the tree.  To add two children, do
 *  > builder.c('child1', ...).up().c('child2', ...)
 *  The next operation on the Builder will be relative to the second child.
 
 类：Strophe.Builder
 XML DOM 构建者
 
 这个对象提供了一个和JQuery很像的接口，但是构建DOM元素更容易和快速，
 所有的函数返回值都是对象类型的，除了 toString()和tree()，
 所以可以链式调用，这里是一个使用$iq()构建者的例子
  *  > $iq({to: 'you', from: 'me', type: 'get', id: '1'})
 *  >     .c('query', {xmlns: 'strophe:example'})
 *  >     .c('example')
 *  >     .toString()
 以上的代码会生成如下的XML片段
  *  > <iq to='you' from='me' type='get' id='1'>
 *  >   <query xmlns='strophe:example'>
 *  >     <example/>
 *  >   </query>
 *  > </iq>
// 这相似的DOM操作得到一个相似的XML片段是沉闷的并且可能包含几个帮助的变量
 
 因为添加孩子使得新的操作符会作用在孩子上，所以提供函数up()来返回，想要添加两个
 子元素，像这样：
  > builder.c('child1', ...).up().c('child2', ...)
 下一个操作符会作用在第二个孩子身上
 
 */

/** Constructor: Strophe.Builder
 *  Create a Strophe.Builder object.
 *
 *  The attributes should be passed in object notation.  For example
 *  > var b = new Builder('message', {to: 'you', from: 'me'});
 *  or
 *  > var b = new Builder('messsage', {'xml:lang': 'en'});
 *
 *  Parameters:
 *    (String) name - The name of the root element.
 *    (Object) attrs - The attributes for the root element in object notation.
 *
 *  Returns:
 *    A new Strophe.Builder.
 
 构造器：Strophe.Builder
	创建一个Strophe.Builder对象
	
属性必须进入对象中，例如
 *  > var b = new Builder('message', {to: 'you', from: 'me'});
或者
 *  > var b = new Builder('messsage', {'xml:lang': 'en'});
 
 参数：
	字符串 name - 根元素的名字
	对象 attrs - 根元素的属性

 */
Strophe.Builder = function (name, attrs) {
    // Set correct namespace for jabber:client elements
    if (name == "presence" || name == "message" || name == "iq") {
        if (attrs && !attrs.xmlns) {
            attrs.xmlns = Strophe.NS.CLIENT;
        } else if (!attrs) {
            attrs = {xmlns: Strophe.NS.CLIENT};
        }
    }

    // Holds the tree being built.
    this.nodeTree = Strophe.xmlElement(name, attrs);

    // Points to the current operation node.
    this.node = this.nodeTree;
};

Strophe.Builder.prototype = {
    /** Function: tree
     *  Return the DOM tree.
     *
     *  This function returns the current DOM tree as an element object.  This
     *  is suitable for passing to functions like Strophe.Connection.send().
     *
     *  Returns:
     *    The DOM tree as a element object.
	 
	 函数：
		返回DOM树
			
	这个函数一一个元素对象的方式返回当前DOM树，这对很合用的对一些函数来说，就行Strophe.Connection.send().
	
	返回值：
		一个元素对象的DOM树
     */
    tree: function () {
        return this.nodeTree;
    },

    /** Function: toString
     *  Serialize the DOM tree to a String.
     *
     *  This function returns a string serialization of the current DOM
     *  tree.  It is often used internally to pass data to a
     *  Strophe.Request object.
     *
     *  Returns:
     *    The serialized DOM tree in a String.
	 
	 函数：
		序列化这个DOM树
		
		这个函数返回一个当前DOM树的字符串，它通常用在内部去转换数据到一个Strophe.Request对象

	返回值：
		DOM树字符串
     */
    toString: function () {
        return Strophe.serialize(this.nodeTree);
    },

    /** Function: up
     *  Make the current parent element the new current element.
     *
     *  This function is often used after c() to traverse back up the tree.
     *  For example, to add two children to the same element
     *  > builder.c('child1', {}).up().c('child2', {});
     *
     *  Returns:
     *    The Stophe.Builder object.
	 
	 函数：
		使当前元素的父元素成为当前元素，焦点往上移动
		
		这个函数通常用在c()函数之后去返回DOM树的上一级，例如想要在同一个元素上添加两个相同的子元素
		> builder.c('child1', {}).up().c('child2', {});
			Stophe.Builder对象
	返回值：
		
     */
    up: function () {
        this.node = this.node.parentNode;
        return this;
    },

    /** Function: attrs
     *  Add or modify attributes of the current element.
     *
     *  The attributes should be passed in object notation.  This function
     *  does not move the current element pointer.
     *
     *  Parameters:
     *    (Object) moreattrs - The attributes to add/modify in object notation.
     *
     *  Returns:
     *    The Strophe.Builder object.
	 
	 函数：
		添加或者修改当前元素的属性
		
		属性应该进入该对象中。这个函数不会移动指向当前元素的指针
		
	参数：
		对象 moreattrs - 需要添加或修改的元素
	
	返回值：
		Strophe.Builder对象
     */
    attrs: function (moreattrs) {
        for (var k in moreattrs) {
            if (moreattrs.hasOwnProperty(k)) {
                if (moreattrs[k] === undefined) {
                    this.node.removeAttribute(k);
                } else {
                    this.node.setAttribute(k, moreattrs[k]);
                }
            }
        }
        return this;
    },

    /** Function: c
     *  Add a child to the current element and make it the new current
     *  element.
     *
     *  This function moves the current element pointer to the child,
     *  unless text is provided.  If you need to add another child, it
     *  is necessary to use up() to go back to the parent in the tree.
     *
     *  Parameters:
     *    (String) name - The name of the child.
     *    (Object) attrs - The attributes of the child in object notation.
     *    (String) text - The text to add to the child.
     *
     *  Returns:
     *    The Strophe.Builder object.
	 
	 函数
		给当前元素添加一个子元素，并且这个子元素会成为当前元素
		
		这个函数会移动当前的元素指针到子元素上，除非提供的是文本，如果你需要添加另一个
		子元素，就要用up()函数回到父元素
		
	参数：	
		字符串 name - 子元素的名称
		对象 attrs 子元素的属性
		字符串 text 子元素包含的文本
	
	返回值 
		Strophe.Builder对象
     */
    c: function (name, attrs, text) {
        var child = Strophe.xmlElement(name, attrs, text);
        this.node.appendChild(child);
        if (typeof text !== "string" && typeof text !=="number") {
            this.node = child;
        }
        return this;
    },

    /** Function: cnode
     *  Add a child to the current element and make it the new current
     *  element.
     *
     *  This function is the same as c() except that instead of using a
     *  name and an attributes object to create the child it uses an
     *  existing DOM element object.
     *
     *  Parameters:
     *    (XMLElement) elem - A DOM element.
     *
     *  Returns:
     *    The Strophe.Builder object.
	 
	 函数：
		给当前元素添加一个子元素，并且这个子元素会成为当前元素
		
		这个函数和c()函数以一样，除了它不是使用 name 和 attrs 去创建
		一个子元素，而是通过已存在的DOM元素对象
		
	参数：
		XML元素 elem - 一个DOM元素
		
	返回值：
		Strophe.Builder 对象
     */
    cnode: function (elem) {
        var impNode;
        var xmlGen = Strophe.xmlGenerator();
        try {
            impNode = (xmlGen.importNode !== undefined);
        }
        catch (e) {
            impNode = false;
        }
        var newElem = impNode ?
                      xmlGen.importNode(elem, true) :
                      Strophe.copyElement(elem);
        this.node.appendChild(newElem);
        this.node = newElem;
        return this;
    },

    /** Function: t
     *  Add a child text element.
     *
     *  This *does not* make the child the new current element since there
     *  are no children of text elements.
     *
     *  Parameters:
     *    (String) text - The text data to append to the current element.
     *
     *  Returns:
     *    The Strophe.Builder object.
	 
	 函数：
		添加一个文本子元素
		
		这个不会使子元素变成当前元素因为文本元素不会有子元素
		
	参数：
		字符串 text - 需要添加到当前元素的文本数据
		
	返回值：	
		Strophe.Builder对象
     */
    t: function (text) {
        var child = Strophe.xmlTextNode(text);
        this.node.appendChild(child);
        return this;
    },

    /** Function: h
     *  Replace current element contents with the HTML passed in.
     *
     *  This *does not* make the child the new current element
     *
     *  Parameters:
     *    (String) html - The html to insert as contents of current element.
     *
     *  Returns:
     *    The Strophe.Builder object.
	 
	 函数：
		用HTML替换当前的元素内容
		
		这个不会使子元素成为当前元素
		
	参数：
		字符串 html - 需要作为内容插入到当前元素的HTML
		
	返回值：
		Strophe.Builder对象
     */
    h: function (html) {
        var fragment = document.createElement('body');

        // force the browser to try and fix any invalid HTML tags
        fragment.innerHTML = html;

        // copy cleaned html into an xml dom
        var xhtml = Strophe.createHtml(fragment);

        while(xhtml.childNodes.length > 0) {
            this.node.appendChild(xhtml.childNodes[0]);
        }
        return this;
    }
};

/** PrivateClass: Strophe.Handler
 *  _Private_ helper class for managing stanza handlers.
 *
 *  A Strophe.Handler encapsulates a user provided callback function to be
 *  executed when matching stanzas are received by the connection.
 *  Handlers can be either one-off or persistant depending on their
 *  return value. Returning true will cause a Handler to remain active, and
 *  returning false will remove the Handler.
 *
 *  Users will not use Strophe.Handler objects directly, but instead they
 *  will use Strophe.Connection.addHandler() and
 *  Strophe.Connection.deleteHandler().
 
 私有类：
	帮助管理节
	
	Strophe.Handler封装了一个用户提供回调函数，当匹配的节从连接中被接收到，这个回调函数
	就会执行。处理器可以是一次性的也可以是持久性的依赖于它们的返回值。返回true将会使一个
	处理器保持执行，返回false将会移除这个处理器
	
	用户不能直接使用 Strophe.Handler 对象，但是可以使用Strophe.Connection.addHandler() 和
    Strophe.Connection.deleteHandler() 间接使用
 */

/** PrivateConstructor: Strophe.Handler
 *  Create and initialize a new Strophe.Handler.
 *
 *  Parameters:
 *    (Function) handler - A function to be executed when the handler is run.
 *    (String) ns - The namespace to match.
 *    (String) name - The element name to match.
 *    (String) type - The element type to match.
 *    (String) id - The element id attribute to match.
 *    (String) from - The element from attribute to match.
 *    (Object) options - Handler options
 *
 *  Returns:
 *    A new Strophe.Handler object.
 
	私有构造器：
		创建并且实例化一个新的Strophe.Handler
		
	参数：
		函数 handler - 触发式执行的函数
		字符串 ns - 需要匹配的命名空间
		字符串 name - 需要匹配的name
		字符串 type - 同上
		字符串 id - 同上
		字符串 from - 同上
		字符串 options - 处理器选项
 */
Strophe.Handler = function (handler, ns, name, type, id, from, options) {
    this.handler = handler;
    this.ns = ns;
    this.name = name;
    this.type = type;
    this.id = id;
    this.options = options || {matchBare: false};

    // default matchBare to false if undefined
    if (!this.options.matchBare) {
        this.options.matchBare = false;
    }

    if (this.options.matchBare) {
        this.from = from ? Strophe.getBareJidFromJid(from) : null;
    } else {
        this.from = from;
    }

    // whether the handler is a user handler or a system handler
    this.user = true;
};

Strophe.Handler.prototype = {
    /** PrivateFunction: isMatch
     *  Tests if a stanza matches the Strophe.Handler.
     *
     *  Parameters:
     *    (XMLElement) elem - The XML element to test.
     *
     *  Returns:
     *    true if the stanza matches and false otherwise.
	 
	 私有函数：
		测试是否一个节匹配Strophe.Handler
		
	参数：
		XML元素 - 需要测试的XML元素
		
	返回值：
		如果匹配返回true，否则false
     */
    isMatch: function (elem) {
        var nsMatch;
        var from = null;

        if (this.options.matchBare) {
            from = Strophe.getBareJidFromJid(elem.getAttribute('from'));
        } else {
            from = elem.getAttribute('from');
        }

        nsMatch = false;
        if (!this.ns) {
            nsMatch = true;
        } else {
            var that = this;
            Strophe.forEachChild(elem, null, function (elem) {
                if (elem.getAttribute("xmlns") == that.ns) {
                    nsMatch = true;
                }
            });

            nsMatch = nsMatch || elem.getAttribute("xmlns") == this.ns;
        }

        var elem_type = elem.getAttribute("type");
        if (nsMatch &&
            (!this.name || Strophe.isTagEqual(elem, this.name)) &&
            (!this.type || (Array.isArray(this.type) ? this.type.indexOf(elem_type) != -1 : elem_type == this.type)) &&
            (!this.id || elem.getAttribute("id") == this.id) &&
            (!this.from || from == this.from)) {
                return true;
        }

        return false;
    },

    /** PrivateFunction: run
     *  Run the callback on a matching stanza.
     *
     *  Parameters:
     *    (XMLElement) elem - The DOM element that triggered the
     *      Strophe.Handler.
     *
     *  Returns:
     *    A boolean indicating if the handler should remain active.
	 
	 私有函数：
		在一个匹配的节上运行回调函数
		
	参数：
		XML元素 elem - DOM元素触发这个处理器的
		
	返回值：
		一个布尔值指示这个处理器能否继续作用
     */
    run: function (elem) {
        var result = null;
        try {
            result = this.handler(elem);
        } catch (e) {
            if (e.sourceURL) {
                Strophe.fatal("error: " + this.handler +
                              " " + e.sourceURL + ":" +
                              e.line + " - " + e.name + ": " + e.message);
            } else if (e.fileName) {
                if (typeof(console) != "undefined") {
                    console.trace();
                    console.error(this.handler, " - error - ", e, e.message);
                }
                Strophe.fatal("error: " + this.handler + " " +
                              e.fileName + ":" + e.lineNumber + " - " +
                              e.name + ": " + e.message);
            } else {
                Strophe.fatal("error: " + e.message + "\n" + e.stack);
            }

            throw e;
        }

        return result;
    },

    /** PrivateFunction: toString
     *  Get a String representation of the Strophe.Handler object.
     *
     *  Returns:
     *    A String.
	 
	 私有函数：	
		以字符串表示的Strophe.Handler对象
		
	返回值：
		一个字符串
     */
    toString: function () {
        return "{Handler: " + this.handler + "(" + this.name + "," +
            this.id + "," + this.ns + ")}";
    }
};

/** PrivateClass: Strophe.TimedHandler
 *  _Private_ helper class for managing timed handlers.
 *
 *  A Strophe.TimedHandler encapsulates a user provided callback that
 *  should be called after a certain period of time or at regular
 *  intervals.  The return value of the callback determines whether the
 *  Strophe.TimedHandler will continue to fire.
 *
 *  Users will not use Strophe.TimedHandler objects directly, but instead
 *  they will use Strophe.Connection.addTimedHandler() and
 *  Strophe.Connection.deleteTimedHandler().
 
 私有类：
	帮助管理定时的处理器
	
	Strophe.TimedHandler封装了用户提供的回调函数，在经过一段确定的时间或者一个固定重复的
	间隔之后被调用， 回调函数的返回值决定了Strophe.TimedHandler是否能够继续作用
	
	用户不能够直接使用 Strophe.TimedHandler，但是可以使用Strophe.Connection.addTimedHandler() 和
    Strophe.Connection.deleteTimedHandler().
 */

/** PrivateConstructor: Strophe.TimedHandler
 *  Create and initialize a new Strophe.TimedHandler object.
 *
 *  Parameters:
 *    (Integer) period - The number of milliseconds to wait before the
 *      handler is called.
 *    (Function) handler - The callback to run when the handler fires.  This
 *      function should take no arguments.
 *
 *  Returns:
 *    A new Strophe.TimedHandler object.
 
 私有构造器：
	创建并且实例化一个新的Strophe.TimedHandler
	
参数：
	数值型 period - 等待多久去执行这个函数
	函数 handler - 需要执行的函数，这个函数不应该有参数
	
返回值：
	一个新的 Strophe.TimedHandler 对象
 */
Strophe.TimedHandler = function (period, handler) {
    this.period = period;
    this.handler = handler;

    this.lastCalled = new Date().getTime();
    this.user = true;
};

Strophe.TimedHandler.prototype = {
    /** PrivateFunction: run
     *  Run the callback for the Strophe.TimedHandler.
     *
     *  Returns:
     *    true if the Strophe.TimedHandler should be called again, and false
     *      otherwise.
	 
	 私有函数：
		运行回调函数
	
	返回值
		如果返回值为true这个Strophe.TimedHandler应该会被再次调用，否则不会
     */
    run: function () {
        this.lastCalled = new Date().getTime();
        return this.handler();
    },

    /** PrivateFunction: reset
     *  Reset the last called time for the Strophe.TimedHandler.
	 
	 私有函数：
		重置Strophe.TimedHandler最后一次调用的时间
     */
    reset: function () {
        this.lastCalled = new Date().getTime();
    },

    /** PrivateFunction: toString
     *  Get a string representation of the Strophe.TimedHandler object.
     *
     *  Returns:
     *    The string representation.
	 
	  私有函数：	
		以字符串表示的Strophe.TimedHandler对象
		
	返回值：
		一个字符串
		
     */
    toString: function () {
        return "{TimedHandler: " + this.handler + "(" + this.period +")}";
    }
};

/** Class: Strophe.Connection
 *  XMPP Connection manager.
 *
 *  This class is the main part of Strophe.  It manages a BOSH or websocket
 *  connection to an XMPP server and dispatches events to the user callbacks
 *  as data arrives. It supports SASL PLAIN, SASL DIGEST-MD5, SASL SCRAM-SHA1
 *  and legacy authentication.
 *
 *  After creating a Strophe.Connection object, the user will typically
 *  call connect() with a user supplied callback to handle connection level
 *  events like authentication failure, disconnection, or connection
 *  complete.
 *
 *  The user will also have several event handlers defined by using
 *  addHandler() and addTimedHandler().  These will allow the user code to
 *  respond to interesting stanzas or do something periodically with the
 *  connection. These handlers will be active once authentication is
 *  finished.
 *
 *  To send data to the connection, use send().

类：
	XMPP连接管理者
	
	这个类是Strophe的主要部分，它管理着一个通过BOSH或websocket与XMP服务器的连接，并且
	管理着用户的回调函数当有数据到达时，它支持SASL PLAIN 普通文本, SASL DIGEST-MD5 MD5摘要, SASL SCRAM-SHA1 SHA1加密
    and legacy authentication 遗留的验证.
	
	在创建一个Strophe.Connection对象后，用户通常会调用 connect()函数，伴随着一个用户提供的回调函数
	去处理连接等级事件比如 权限验证错误，连接不上，或连接完成
	
	用户也会通过  addHandler() 和 addTimedHandler()定义一些事件，这将允许在连接后，用户代码对用户感兴趣的节
	或者做一些有周期性的事情做出响应， 这些处理器将会被激活一旦身份/权限验证结束后
	
	发送数据，使用 send()函数
 */

/** Constructor: Strophe.Connection
 *  Create and initialize a Strophe.Connection object.
 *
 *  The transport-protocol for this connection will be chosen automatically
 *  based on the given service parameter. URLs starting with "ws://" or
 *  "wss://" will use WebSockets, URLs starting with "http://", "https://"
 *  or without a protocol will use BOSH.
 *
 *  To make Strophe connect to the current host you can leave out the protocol
 *  and host part and just pass the path, e.g.
 *
 *  > var conn = new Strophe.Connection("/http-bind/");
 *
 
 构造器：
	创建并且实例化一个新的Strophe.Connection
		
	连接将会基于给定的服务器参数自动的选择传输层的协议，URLs以 "ws://" 或者
	"wss://" 将会使用websocket，URLs以 "http://" , "https://"或者没有协议的将会使用 BOSH
	
	要让Strophe连接当前的主机，你可以不写协议和主机部分，仅仅提供路径，如
	 *  > var conn = new Strophe.Connection("/http-bind/");
 
 *  Options common to both Websocket and BOSH:
 *  ------------------------------------------
 *
 *  The "cookies" option allows you to pass in cookies to be added to the
 *  document. These cookies will then be included in the BOSH XMLHttpRequest
 *  or in the websocket connection.
 *
 *  The passed in value must be a map of cookie names and string values:
 *
 * { "myCookie": {
 *      "value": "1234",
 *      "domain": ".example.org",
 *      "path": "/",
 *      "expires": expirationDate
 *      }
 *  }
 *
 *  Note that cookies can't be set in this way for other domains (i.e. cross-domain).
 *  Those cookies need to be set under those domains, for example they can be
 *  set server-side by making a XHR call to that domain to ask it to set any
 *  necessary cookies.
 
 
不会翻译。。
 
 *
 *  WebSocket options: ！！！
 *  ------------------
 *
 *  If you want to connect to the current host with a WebSocket connection you
 *  can tell Strophe to use WebSockets through a "protocol" attribute in the
 *  optional options parameter. Valid values are "ws" for WebSocket and "wss"
 *  for Secure WebSocket.
 *  So to connect to "wss://CURRENT_HOSTNAME/xmpp-websocket" you would call
 *
 *  > var conn = new Strophe.Connection("/xmpp-websocket/", {protocol: "wss"});
 *
 *  Note that relative URLs _NOT_ starting with a "/" will also include the path
 *  of the current site.
 *
 *  Also because downgrading security is not permitted by browsers, when using
 *  relative URLs both BOSH and WebSocket connections will use their secure
 *  variants if the current connection to the site is also secure (https).
 
 如果你想要通过websockket连接来当前的主机，你可以同庚协议的属性来告诉Strophe，
 有效的值是 "ws" 对应websocket 和 "wss" 对应着安全的websocket
 
所以连接 到 "wss://CURRENT_HOSTNAME/xmpp-websocket" ，你将会调用
 *  > var conn = new Strophe.Connection("/xmpp-websocket/", {protocol: "wss"});
 
 记住相关的 URLs 不是以一个 "/" 开头的也会包含当前站点的路径
 
 也因为websocket 降低安全性是不被浏览器用户所允许的，所以使用相对的URLS是，无论BOSH还是
 ws连接都会使用它们的安全变体，如果当前的连接到的站点也是安全的的（https）
 
 *
 *  BOSH options:
 *  -------------
 *
 *  By adding "sync" to the options, you can control if requests will
 *  be made synchronously or not. The default behaviour is asynchronous.
 *  If you want to make requests synchronous, make "sync" evaluate to true:
 *  > var conn = new Strophe.Connection("/http-bind/", {sync: true});
 *
 *  You can also toggle this on an already established connection:
 *  > conn.options.sync = true;
 *
 *  The "customHeaders" option can be used to provide custom HTTP headers to be
 *  included in the XMLHttpRequests made.
 *
 *  The "keepalive" option can be used to instruct Strophe to maintain the
 *  current BOSH session across interruptions such as webpage reloads.
 *
 *  It will do this by caching the sessions tokens in sessionStorage, and when
 *  "restore" is called it will check whether there are cached tokens with
 *  which it can resume an existing session.
 *
 *  The "withCredentials" option should receive a Boolean value and is used to
 *  indicate wether cookies should be included in ajax requests (by default
 *  they're not).
 *  Set this value to true if you are connecting to a BOSH service
 *  and for some reason need to send cookies to it.
 *  In order for this to work cross-domain, the server must also enable
 *  credentials by setting the Access-Control-Allow-Credentials response header
 *  to "true". For most usecases however this setting should be false (which
 *  is the default).
 *  Additionally, when using Access-Control-Allow-Credentials, the
 *  Access-Control-Allow-Origin header can't be set to the wildcard "*", but
 *  instead must be restricted to actual domains.
 *
 *  Parameters:
 *    (String) service - The BOSH or WebSocket service URL.
 *    (Object) options - A hash of configuration options
 *
 *  Returns:
 *    A new Strophe.Connection object.
 
 参数：
	字符串 service - BOSH或ws服务器的URL
	对象 options - 一系列的配置选项
 */
Strophe.Connection = function (service, options) {
    // The service URL  // 定义一个server，值为连接服务器的URL
    this.service = service; 
    // Configuration options  // 如果没有传入options，那么它的值为空对象
    this.options = options || {}; 
	// 如果option没有protocol，那么它的值为空字符串
    var proto = this.options.protocol || "";   

    // Select protocal based on service or options // 根据服务或选项选择服务器，然后创建对应的对象。
    if (service.indexOf("ws:") === 0 || service.indexOf("wss:") === 0 ||
            proto.indexOf("ws") === 0) {
        this._proto = new Strophe.Websocket(this); // proto - WS对象
    } else {
        this._proto = new Strophe.Bosh(this);
    }

    /* The connected JID. */
    this.jid = "";
    /* the JIDs domain */
    this.domain = null;
    /* stream:features */
    this.features = null;

    // SASL
    this._sasl_data = {};
    this.do_session = false;
    this.do_bind = false;

    // handler lists
    this.timedHandlers = [];
    this.handlers = [];
    this.removeTimeds = [];
    this.removeHandlers = [];
    this.addTimeds = [];
    this.addHandlers = [];

    this._authentication = {};
    this._idleTimeout = null;
    this._disconnectTimeout = null;

    this.authenticated = false;
    this.connected = false;
    this.disconnecting = false;
    this.do_authentication = true;
    this.paused = false;
    this.restored = false;

    this._data = [];
    this._uniqueId = 0;

    this._sasl_success_handler = null;
    this._sasl_failure_handler = null;
    this._sasl_challenge_handler = null;

    // Max retries before disconnecting // 断开连接前最大尝试次数
    this.maxRetries = 5;

    // Call onIdle callback every 1/10th of a second  // 调用onIdle()函数 每100毫秒
    // XXX: setTimeout should be called only with function expressions (23974bc1)
    this._idleTimeout = setTimeout(function() {
        this._onIdle();
    }.bind(this), 100);

    utils.addCookies(this.options.cookies);

    // initialize plugins  // 初始化插件，好像有些插件要监听一些事件，比如状态改变什么的。
    for (var k in Strophe._connectionPlugins) {
        if (Strophe._connectionPlugins.hasOwnProperty(k)) {
            var ptype = Strophe._connectionPlugins[k];
            // jslint complaints about the below line, but this is fine
            var F = function () {}; // jshint ignore:line
            F.prototype = ptype;
            this[k] = new F();
            this[k].init(this);
        }
    }
};

Strophe.Connection.prototype = {
    /** Function: reset
     *  Reset the connection.
     *
     *  This function should be called after a connection is disconnected
     *  before that connection is reused.
	 
	 函数： 
		重置连接
		
		这个函数应该在一个连接断开后，这个连接重新连接上前被调用
     */
    reset: function () {
        this._proto._reset();

        // SASL
        this.do_session = false;
        this.do_bind = false;

        // handler lists
        this.timedHandlers = [];
        this.handlers = [];
        this.removeTimeds = [];
        this.removeHandlers = [];
        this.addTimeds = [];
        this.addHandlers = [];
        this._authentication = {};

        this.authenticated = false;
        this.connected = false;
        this.disconnecting = false;
        this.restored = false;

        this._data = [];
        this._requests = [];
        this._uniqueId = 0;
    },

    /** Function: pause
     *  Pause the request manager.
     *
     *  This will prevent Strophe from sending any more requests to the
     *  server.  This is very useful for temporarily pausing
     *  BOSH-Connections while a lot of send() calls are happening quickly.
     *  This causes Strophe to send the data in a single request, saving
     *  many request trips.
	 
	 函数：
		暂停请求的管理
		
		这个将会阻止Strophe发送更多的请求给服务器，当有许多send()函数在一个
		非常短的时间内被调用时就非常有用，这个使Strophe发送数据在单个请求中，
		避免了许多请求的错误
		
     */
    pause: function () {
        this.paused = true;
    },

    /** Function: resume
     *  Resume the request manager.
     *
     *  This resumes after pause() has been called.
	 
	 函数：
		重新启动请求管理
		
		在pause()被调用之后调用
     */
    resume: function () {
        this.paused = false;
    },

    /** Function: getUniqueId
     *  Generate a unique ID for use in <iq/> elements.
     *
     *  All <iq/> stanzas are required to have unique id attributes.  This
     *  function makes creating these easy.  Each connection instance has
     *  a counter which starts from zero, and the value of this counter
     *  plus a colon followed by the suffix becomes the unique id. If no
     *  suffix is supplied, the counter is used as the unique id.
     *
     *  Suffixes are used to make debugging easier when reading the stream
     *  data, and their use is recommended.  The counter resets to 0 for
     *  every new connection for the same reason.  For connections to the
     *  same server that authenticate the same way, all the ids should be
     *  the same, which makes it easy to see changes.  This is useful for
     *  automated testing as well.
     *
     *  Parameters:
     *    (String) suffix - A optional suffix to append to the id.
     *
     *  Returns:
     *    A unique string to be used for the id attribute.
	 
	 函数：
		生成一个唯一的ID，给<iq/>元素使用
		
		所有的<iq/>节都需要一个唯一的id属性，这个函数使得创建id很容易，每个链接实例
		都有一个从0开始的计数器，并且这个值加上一个冒号后面的后缀成为惟一的id，
		如果没有提供后置（附加成分），这个计数器就作为唯一的id
		
		当读取流数据是，后缀使得调试 变得简单，并且它们的使用是被推荐的。这个计数器
		为每个新连接因为同样的理由重置为0，
		
	参数：
		字符串 suffix - 一个可选的后缀，加入ID当中
		
	返回值：
		一个唯一的id值
     */
    getUniqueId: function(suffix) {
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : r & 0x3 | 0x8;
            return v.toString(16);
        });
        if (typeof(suffix) == "string" || typeof(suffix) == "number") {
            return uuid + ":" + suffix;
        } else {
            return uuid + "";
        }
    },

    /** Function: connect
     *  Starts the connection process.
     *
     *  As the connection process proceeds, the user supplied callback will
     *  be triggered multiple times with status updates.  The callback
     *  should take two arguments - the status code and the error condition.
     *
     *  The status code will be one of the values in the Strophe.Status
     *  constants.  The error condition will be one of the conditions
     *  defined in RFC 3920 or the condition 'strophe-parsererror'.
     *
     *  The Parameters _wait_, _hold_ and _route_ are optional and only relevant
     *  for BOSH connections. Please see XEP 124 for a more detailed explanation
     *  of the optional parameters.
     *
     *  Parameters:
     *    (String) jid - The user's JID.  This may be a bare JID,
     *      or a full JID.  If a node is not supplied, SASL ANONYMOUS
     *      authentication will be attempted.
     *    (String) pass - The user's password.
     *    (Function) callback - The connect callback function.
     *    (Integer) wait - The optional HTTPBIND wait value.  This is the
     *      time the server will wait before returning an empty result for
     *      a request.  The default setting of 60 seconds is recommended.
     *    (Integer) hold - The optional HTTPBIND hold value.  This is the
     *      number of connections the server will hold at one time.  This
     *      should almost always be set to 1 (the default).
     *    (String) route - The optional route value.
     *    (String) authcid - The optional alternative authentication identity
     *      (username) if intending to impersonate another user.
	 
	 函数
		开始连接处理
		
		随着连接处理的进行，用户提供的回调函数会因为状态的改变而被触发执行多次，
		回调函数应该提供2个参数 - 状态码和错误条件
		
		状态码必须是 Strophe.Status中定义的一个，错误的条件必须要是定义在
		RFC3920中或 strophe-parsererror 中
		
		参数 wait,hold和route 是可选项，并且只与BOSH连接有关，
		关于可选参数的更多详细信息请查看XEP124
		
	参数：
		字符串 jid - 用户的JID， 可能是一个纯JID，或者是全JID，如果node没有提供（用户名），
					 将会尝试SASL匿名权限验证
		字符串 pass - 用户的密码
		函数 callback - 连接回调函数
		数值型 wait - 可选的HTTPBIND wait 值，这个是服务器在返回空值前将会等待的时间，默认值
						是60秒
		数值型 hold - 可选的 HTTPBIND hold 值，服务器同时保存的连接的数量 ，几乎都是设置成1,（默认值）
		字符串 route - 可选的route 值
		username  - 如果想要扮演另一个用户
		
		
     */
    connect: function (jid, pass, callback, wait, hold, route, authcid) {
        // JID格式：  node@domain/resource   节点@域名/资源
		this.jid = jid;
        /** Variable: authzid
         *  Authorization identity.
         */ 
		// 得到纯JID
        this.authzid = Strophe.getBareJidFromJid(this.jid);
        /** Variable: authcid
         *  Authentication identity (User name).
         */
		 // 得到用户名
        this.authcid = authcid || Strophe.getNodeFromJid(this.jid);
        /** Variable: pass
         *  Authentication identity (User password).
         */
		 // 密码
        this.pass = pass;
        /** Variable: servtype
         *  Digest MD5 compatibility.
         */
        this.servtype = "xmpp";
        this.connect_callback = callback; // 登录回调
        this.disconnecting = false;
        this.connected = false;
        this.authenticated = false;
        this.restored = false;

        // parse jid for domain
        this.domain = Strophe.getDomainFromJid(this.jid); // 得到域名

        this._changeConnectStatus(Strophe.Status.CONNECTING, null);

        this._proto._connect(wait, hold, route);
    },

    /** Function: attach
     *  Attach to an already created and authenticated BOSH session.
     *
     *  This function is provided to allow Strophe to attach to BOSH
     *  sessions which have been created externally, perhaps by a Web
     *  application.  This is often used to support auto-login type features
     *  without putting user credentials into the page.
     *
     *  Parameters:
     *    (String) jid - The full JID that is bound by the session.
     *    (String) sid - The SID of the BOSH session.
     *    (String) rid - The current RID of the BOSH session.  This RID
     *      will be used by the next request.
     *    (Function) callback The connect callback function.
     *    (Integer) wait - The optional HTTPBIND wait value.  This is the
     *      time the server will wait before returning an empty result for
     *      a request.  The default setting of 60 seconds is recommended.
     *      Other settings will require tweaks to the Strophe.TIMEOUT value.
     *    (Integer) hold - The optional HTTPBIND hold value.  This is the
     *      number of connections the server will hold at one time.  This
     *      should almost always be set to 1 (the default).
     *    (Integer) wind - The optional HTTBIND window value.  This is the
     *      allowed range of request ids that are valid.  The default is 5.
	 
	 函数 ：
		附件到一个已创建和授权认证的BOSHsession上
     */
    attach: function (jid, sid, rid, callback, wait, hold, wind) {
        if (this._proto instanceof Strophe.Bosh) {
            this._proto._attach(jid, sid, rid, callback, wait, hold, wind);
        } else {
            throw {
                name: 'StropheSessionError',
                message: 'The "attach" method can only be used with a BOSH connection.'
            };
        }
    },

    /** Function: restore
     *  Attempt to restore a cached BOSH session.
     *
     *  This function is only useful in conjunction with providing the
     *  "keepalive":true option when instantiating a new Strophe.Connection.
     *
     *  When "keepalive" is set to true, Strophe will cache the BOSH tokens
     *  RID (Request ID) and SID (Session ID) and then when this function is
     *  called, it will attempt to restore the session from those cached
     *  tokens.
     *
     *  This function must therefore be called instead of connect or attach.
     *
     *  For an example on how to use it, please see examples/restore.js
     *
     *  Parameters:
     *    (String) jid - The user's JID.  This may be a bare JID or a full JID.
     *    (Function) callback - The connect callback function.
     *    (Integer) wait - The optional HTTPBIND wait value.  This is the
     *      time the server will wait before returning an empty result for
     *      a request.  The default setting of 60 seconds is recommended.
     *    (Integer) hold - The optional HTTPBIND hold value.  This is the
     *      number of connections the server will hold at one time.  This
     *      should almost always be set to 1 (the default).
     *    (Integer) wind - The optional HTTBIND window value.  This is the
     *      allowed range of request ids that are valid.  The default is 5.
     */
    restore: function (jid, callback, wait, hold, wind) {
        if (this._sessionCachingSupported()) {
            this._proto._restore(jid, callback, wait, hold, wind);
        } else {
            throw {
                name: 'StropheSessionError',
                message: 'The "restore" method can only be used with a BOSH connection.'
            };
        }
    },

    /** PrivateFunction: _sessionCachingSupported
     * Checks whether sessionStorage and JSON are supported and whether we're
     * using BOSH.
	 
	 私有函数：
		检查是否支持会话存储和JSON，检查我们是否是使用BOSH
		
     */
    _sessionCachingSupported: function () {
        if (this._proto instanceof Strophe.Bosh) {
            if (!JSON) { return false; }
            try {
                window.sessionStorage.setItem('_strophe_', '_strophe_');
                window.sessionStorage.removeItem('_strophe_');
            } catch (e) {
                return false;
            }
            return true;
        }
        return false;
    },

    /** Function: xmlInput
     *  User overrideable function that receives XML data coming into the
     *  connection.
     *
     *  The default function does nothing.  User code can override this with
     *  > Strophe.Connection.xmlInput = function (elem) {
     *  >   (user code)
     *  > };
     *
     *  Due to limitations of current Browsers' XML-Parsers the opening and closing
     *  <stream> tag for WebSocket-Connoctions will be passed as selfclosing here.
     *
     *  BOSH-Connections will have all stanzas wrapped in a <body> tag. See
     *  <Strophe.Bosh.strip> if you want to strip this tag.
     *
     *  Parameters:
     *    (XMLElement) elem - The XML data received by the connection.
	 
	 函数：
		用户可重写的函数，功能是从连接中接收XML数据
		
		本函数默认是空实现，用户代码可以重写本函数，就像：
	*  > Strophe.Connection.xmlInput = function (elem) {
     *  >   (user code)
     *  > };
		
		因为浏览器的XML分析程序的限制，在这里，websocket连接打开和关闭<stream>的标签将会
		被认为自动关闭
		
		BOSH连接所有的节将会被<body>包装起来，如果你想要剥去这个标签，查阅<Strophe.Bosh.strip>，
		
	参数：
		XML元素 - 从连接中接受到的XML数据
		
     */
    /* jshint unused:false */
    xmlInput: function (elem) {
        return;
    },
    /* jshint unused:true */

    /** Function: xmlOutput
     *  User overrideable function that receives XML data sent to the
     *  connection.
     *
     *  The default function does nothing.  User code can override this with
     *  > Strophe.Connection.xmlOutput = function (elem) {
     *  >   (user code)
     *  > };
     *
     *  Due to limitations of current Browsers' XML-Parsers the opening and closing
     *  <stream> tag for WebSocket-Connoctions will be passed as selfclosing here.
     *
     *  BOSH-Connections will have all stanzas wrapped in a <body> tag. See
     *  <Strophe.Bosh.strip> if you want to strip this tag.
     *
     *  Parameters:
     *    (XMLElement) elem - The XMLdata sent by the connection.
	 
	 和xmlInput 意思相反差不多
     */
    /* jshint unused:false */
    xmlOutput: function (elem) {
        return;
    },
    /* jshint unused:true */

    /** Function: rawInput
     *  User overrideable function that receives raw data coming into the
     *  connection.
     *
     *  The default function does nothing.  User code can override this with
     *  > Strophe.Connection.rawInput = function (data) {
     *  >   (user code)
     *  > };
     *
     *  Parameters:
     *    (String) data - The data received by the connection.
	 
	 函数：
		用户可重写的函数，功能是从连接中接收未加工的数据
		
	本函数默认是空实现，用户可以重写：
	*  > Strophe.Connection.rawInput = function (data) {
     *  >   (user code)
     *  > };
	 
	 参数：	
		字符串 data - 从连接出收到的数据
     */
    /* jshint unused:false */
    rawInput: function (data) {
        return;
    },
    /* jshint unused:true */

    /** Function: rawOutput
     *  User overrideable function that receives raw data sent to the
     *  connection.
     *
     *  The default function does nothing.  User code can override this with
     *  > Strophe.Connection.rawOutput = function (data) {
     *  >   (user code)
     *  > };
     *
     *  Parameters:
     *    (String) data - The data sent by the connection.
	 和 rawInput 相反
     */
    /* jshint unused:false */
    rawOutput: function (data) {
		
        return;
    },
    /* jshint unused:true */

    /** Function: nextValidRid
     *  User overrideable function that receives the new valid rid.
     *
     *  The default function does nothing. User code can override this with
     *  > Strophe.Connection.nextValidRid = function (rid) {
     *  >    (user code)
     *  > };
     *
     *  Parameters:
     *    (Number) rid - The next valid rid
	 函数：
		用户可重写的函数，功能是接收一个新的有效的Rid
		
		默认空实现，用户可以重写
		     *  The default function does nothing. User code can override this with
			 *  > Strophe.Connection.nextValidRid = function (rid) {
			 *  >    (user code)
			 *  > };
	参数：
		数值型 rid - 下一个有效的rid
	 
     */
    /* jshint unused:false */
    nextValidRid: function (rid) {
        return;
    },
    /* jshint unused:true */

    /** Function: send
     *  Send a stanza.
     *
     *  This function is called to push data onto the send queue to
     *  go out over the wire.  Whenever a request is sent to the BOSH
     *  server, all pending data is sent and the queue is flushed.
     *
     *  Parameters:
     *    (XMLElement |
     *     [XMLElement] |
     *     Strophe.Builder) elem - The stanza to send.
	 函数：
		发送一个节
			
		这个函数用来 将数据放入发送队列中，无论何时一个请求时送往BOSH服务器，
		所有的未发送的数据将会发送，并且这个队列会被清空
		
	参数：
		XML元素， Strophe.Builder  elem - 要发送的节
     */
    send: function (elem) {
        if (elem === null) { return ; }
        if (typeof(elem.sort) === "function") {
            for (var i = 0; i < elem.length; i++) {
                this._queueData(elem[i]);
            }
        } else if (typeof(elem.tree) === "function") {
            this._queueData(elem.tree());
        } else {
            this._queueData(elem);
        }

        this._proto._send();
    },

    /** Function: flush
     *  Immediately send any pending outgoing data.
     *
     *  Normally send() queues outgoing data until the next idle period
     *  (100ms), which optimizes network use in the common cases when
     *  several send()s are called in succession. flush() can be used to
     *  immediately send all pending data.
	 
	 函数
		马上发送所有未发送的数据
		
		正常的send()函数将会在下一个空闲片段后进行发送数据（100MS），当有连续多个
		send()被调用，为了优化，flush()函数能够使所有的未发送数据马上发送
     */
    flush: function () {
        // cancel the pending idle period and run the idle function
        // immediately
        clearTimeout(this._idleTimeout);
        this._onIdle();
    },

    /** Function: sendIQ
     *  Helper function to send IQ stanzas.
     *
     *  Parameters:
     *    (XMLElement) elem - The stanza to send.
     *    (Function) callback - The callback function for a successful request.
     *    (Function) errback - The callback function for a failed or timed
     *      out request.  On timeout, the stanza will be null.
     *    (Integer) timeout - The time specified in milliseconds for a
     *      timeout to occur.
     *
     *  Returns:
     *    The id used to send the IQ.
	 
	 函数：
		发送IQ节
		
	参数：
		XML元素 elem - 需要发送的节
		函数 callback - 成功状态下的回调函数
		函数 errback - 失败/请求超时状态下的回调函数，超时情况下，节将会是空的
		数值型 timeout - 超时时间
		
	返回值
		发送IQ节用的ID
		
    */
    sendIQ: function(elem, callback, errback, timeout) {
        var timeoutHandler = null;
        var that = this;

        if (typeof(elem.tree) === "function") {
            elem = elem.tree();
        }
        var id = elem.getAttribute('id');

        // inject id if not found
        if (!id) {
            id = this.getUniqueId("sendIQ");
            elem.setAttribute("id", id);
        }

        var expectedFrom = elem.getAttribute("to");
        var fulljid = this.jid;

        var handler = this.addHandler(function (stanza) {
            // remove timeout handler if there is one
            if (timeoutHandler) {
                that.deleteTimedHandler(timeoutHandler);
            }

            var acceptable = false;
            var from = stanza.getAttribute("from");
            // 这里，如果创建群组时的群组名包含大写，则会导致错误。因为openfire中
            // 会将群组名变成消息。 如： 我要创建  afterSale@conference.server 
            // 则服务器返回的是 aftersale@conference.server，把其中的S变成了小写s
            // 所以建议要在前面进行处理，将输入的房间名变成小写。。
            // XoW.logger.d(this.classInfo + "from" + from);
            // XoW.logger.d(this.classInfo + "expectedFrom" + expectedFrom);
            // XoW.logger.d(this.classInfo + "是否相等：" + (expectedFrom == from));
            // XoW.logger.d(this.classInfo + "是否相等：" + (expectedFrom === from));
            
            if (from === expectedFrom ||
               (!expectedFrom &&
                   (from === Strophe.getBareJidFromJid(fulljid) ||
                    from === Strophe.getDomainFromJid(fulljid) ||
                    from === fulljid))) {
                acceptable = true;
            }

            if (!acceptable) {
                throw {
                    name: "StropheError",
                    message: "Got answer to IQ from wrong jid:" + from +
                             "\nExpected jid: " + expectedFrom
                };
            }

            var iqtype = stanza.getAttribute('type');
            if (iqtype == 'result') {
                if (callback) {
                    callback(stanza);
                }
            } else if (iqtype == 'error') {
            	// XoW.logger.d(this.classInfo + "在strophe中有error");
                if (errback) {
                    errback(stanza);
                }
            } else {
                throw {
                    name: "StropheError",
                    message: "Got bad IQ type of " + iqtype
                };
            }
        }, null, 'iq', ['error', 'result'], id);

        // if timeout specified, setup timeout handler.
        if (timeout) {
            timeoutHandler = this.addTimedHandler(timeout, function () {
                // get rid of normal handler
                that.deleteHandler(handler);
                // call errback on timeout with null stanza
                if (errback) {
                    errback(null);
                }
                return false;
            });
        }
        this.send(elem);
        return id;
    },

	
	
	
    /** PrivateFunction: _queueData
     *  Queue outgoing data for later sending.  Also ensures that the data
     *  is a DOMElement.
	 
	 私有函数：
		等待发送的数据队列，同时也确保要发送的数据是一个DOM元素
     */
    _queueData: function (element) {
        if (element === null ||
            !element.tagName ||
            !element.childNodes) {
            throw {
                name: "StropheError",
                message: "Cannot queue non-DOMElement."
            };
        }
			
        this._data.push(element);
    },

    /** PrivateFunction: _sendRestart
     *  Send an xmpp:restart stanza.
	 
	 私有函数：
		发送一个xmpp ： 重新启动节
     */
    _sendRestart: function () {
        this._data.push("restart");

        this._proto._sendRestart();

        // XXX: setTimeout should be called only with function expressions (23974bc1)
        this._idleTimeout = setTimeout(function() {
            this._onIdle();
        }.bind(this), 100);
    },
 
    /** Function: addTimedHandler
     *  Add a timed handler to the connection.
     *
     *  This function adds a timed handler.  The provided handler will
     *  be called every period milliseconds until it returns false,
     *  the connection is terminated, or the handler is removed.  Handlers
     *  that wish to continue being invoked should return true.
     *
     *  Because of method binding it is necessary to save the result of
     *  this function if you wish to remove a handler with
     *  deleteTimedHandler().
     *
     *  Note that user handlers are not active until authentication is
     *  successful.
     *
     *  Parameters:
     *    (Integer) period - The period of the handler.
     *    (Function) handler - The callback function.
     *
     *  Returns:
     *    A reference to the handler that can be used to remove it.
	 
	 函数：
		给连接添加一个定时的处理器
		
		这个函数添加一个定时的处理器，这个处理器将会在每个时期后被调用，除非它的
		返回值为false，连接终止，或者这个处理器被移除了，如果想要这个处理器一直
		有效被调用，返回值应该为true
		
		因为方法绑定对保存结果是必须的，如果你想要移除这个处理器，使用deleteTimedHandler().
		
		注意用户的处理器直到该用户身份验证成功了才会被激活
		
	参数：
		数值型 period = 处理器的时期
		函数 handler - 回调函数
		
	返回值：
		true 或 false ，指示这个处理器是继续使用还是移除。
     */
    addTimedHandler: function (period, handler) {
        var thand = new Strophe.TimedHandler(period, handler);
        this.addTimeds.push(thand);
        return thand;
    },

    /** Function: deleteTimedHandler
     *  Delete a timed handler for a connection.
     *
     *  This function removes a timed handler from the connection.  The
     *  handRef parameter is *not* the function passed to addTimedHandler(),
     *  but is the reference returned from addTimedHandler().
     *
     *  Parameters:
     *    (Strophe.TimedHandler) handRef - The handler reference.
	 
	 函数：
		从连接中删除一个定时的处理器
		
		？这个函数用来从连接中删除一个定时的处理器，参数 handRef 不是转到addTimedHandler(),
		而是 引用 从 addTimedHandler() 回来。
	
	参数：
		Strophe.TimedHandler handRef - 处理器引用
     */
    deleteTimedHandler: function (handRef) {
        // this must be done in the Idle loop so that we don't change
        // the handlers during iteration
        this.removeTimeds.push(handRef);
    },

    /** Function: addHandler
     *  Add a stanza handler for the connection.
     *
     *  This function adds a stanza handler to the connection.  The
     *  handler callback will be called for any stanza that matches
     *  the parameters.  Note that if multiple parameters are supplied,
     *  they must all match for the handler to be invoked.
     *
     *  The handler will receive the stanza that triggered it as its argument.
     *  *The handler should return true if it is to be invoked again;
     *  returning false will remove the handler after it returns.*
     *
     *  As a convenience, the ns parameters applies to the top level element
     *  and also any of its immediate children.  This is primarily to make
     *  matching /iq/query elements easy.
     *
     *  The options argument contains handler matching flags that affect how
     *  matches are determined. Currently the only flag is matchBare (a
     *  boolean). When matchBare is true, the from parameter and the from
     *  attribute on the stanza will be matched as bare JIDs instead of
     *  full JIDs. To use this, pass {matchBare: true} as the value of
     *  options. The default value for matchBare is false.
     *
     *  The return value should be saved if you wish to remove the handler
     *  with deleteHandler().
     *
     *  Parameters:
     *    (Function) handler - The user callback.
     *    (String) ns - The namespace to match.
     *    (String) name - The stanza name to match.
     *    (String) type - The stanza type attribute to match.
     *    (String) id - The stanza id attribute to match.
     *    (String) from - The stanza from attribute to match.
     *    (String) options - The handler options
     *
     *  Returns:
     *    A reference to the handler that can be used to remove it.
	 
	 函数：
		连接中，添加一个节处理器
		
		连接中，添加一个节处理器，这个处理器回调将会因为任何匹配参数的节被调用，
		注意如果提供了多个参数，它们必须匹配能够使这个处理器被调用的所有参数
		
		这个处理器将会接收节并将它作为参数，处理器返回值true，这个回调函数会再次被调用，
		返回false，这个回调函数会被移除
		
		为了方便，命名空间参数将会被应用到顶层元素以及所有它的直系子元素，这个是首要的
		使匹配 /iq/query 元素变得简单
		
		？参数options包含处理器匹配表示，决定多少个匹配，
		
		返回值应该被保存下来，如果想要移除这个处理器，用deleteHandler()
		
	参数：
		函数 handler - 用户的回调
		字符串 ns - 要匹配的命名空间
		字符串 name - 同上
		字符串 type 
		字符串 id 
		字符串 from 
		字符串 options - 处理器的可选项
		
	返回值：用于移除这个Handler的句柄
     */
    addHandler: function (handler, ns, name, type, id, from, options) {
        var hand = new Strophe.Handler(handler, ns, name, type, id, from, options);
        this.addHandlers.push(hand);
        return hand;
    },

    /** Function: deleteHandler
     *  Delete a stanza handler for a connection.
     *
     *  This function removes a stanza handler from the connection.  The
     *  handRef parameter is *not* the function passed to addHandler(),
     *  but is the reference returned from addHandler().
     *
     *  Parameters:
     *    (Strophe.Handler) handRef - The handler reference.
     */
    deleteHandler: function (handRef) {
        // this must be done in the Idle loop so that we don't change
        // the handlers during iteration
        this.removeHandlers.push(handRef);
        // If a handler is being deleted while it is being added,
        // prevent it from getting added
        var i = this.addHandlers.indexOf(handRef);
        if (i >= 0) {
            this.addHandlers.splice(i, 1);
        }
    },

    /** Function: disconnect
     *  Start the graceful disconnection process.
     *
     *  This function starts the disconnection process.  This process starts
     *  by sending unavailable presence and sending BOSH body of type
     *  terminate.  A timeout handler makes sure that disconnection happens
     *  even if the BOSH server does not respond.
     *  If the Connection object isn't connected, at least tries to abort all pending requests
     *  so the connection object won't generate successful requests (which were already opened).
     *
     *  The user supplied connection callback will be notified of the
     *  progress as this process happens.
     *
     *  Parameters:
     *    (String) reason - The reason the disconnect is occuring.
	 
	 函数：
		开始优雅的断开连接（PS，所谓优雅，就是正常断开连接，其他因为产生问题而断开的连接是不优雅的，比如网络问题）
		
		这个函数用来开始断开连接，通过发送一个 unavailable 的 presence节和发送BOSH body 。
		超时处理器被触发意味着连接已经断开，即使BOSH服务器没有做出响应。
		如果连接对象没有处于已连接状态，至少要终止所有待发送的请求
		让连接对象不会再生成成功的请求
		
		在这个处理过程中，用户提供连接回调函数也将会被调用
		
	参数：
		字符串 reason - 断开连接的原因
     */
    disconnect: function (reason) {
        this._changeConnectStatus(Strophe.Status.DISCONNECTING, reason);

        Strophe.info("Disconnect was called because: " + reason);
        if (this.connected) {
            var pres = false;
            this.disconnecting = true;
            if (this.authenticated) {
                pres = $pres({
                    xmlns: Strophe.NS.CLIENT,
                    type: 'unavailable'
                });
            }
            // setup timeout handler
            this._disconnectTimeout = this._addSysTimedHandler(
                3000, this._onDisconnectTimeout.bind(this));
            this._proto._disconnect(pres);
        } else {
            Strophe.info("Disconnect was called before Strophe connected to the server");
            this._proto._abortAllRequests();
        }
    },

    /** PrivateFunction: _changeConnectStatus
     *  _Private_ helper function that makes sure plugins and the user's
     *  callback are notified of connection status changes.
     *
     *  Parameters:
     *    (Integer) status - the new connection status, one of the values
     *      in Strophe.Status
     *    (String) condition - the error condition or null
	 
	 私有函数：
		在连接状态改变的时候确保插件和用户的回调函数会被通知到
		
	参数:
		数值型 status - 新的连接状态，是Strophe.Status中的一个
		字符串 condition - 错误的条件 或者 空
     */
    _changeConnectStatus: function (status, condition) {
        // notify all plugins listening for status changes
		// 通知所有在监听的插件
        for (var k in Strophe._connectionPlugins) {
            if (Strophe._connectionPlugins.hasOwnProperty(k)) {
                var plugin = this[k];
                if (plugin.statusChanged) {
                    try {
                        plugin.statusChanged(status, condition);
                    } catch (err) {
                        Strophe.error("" + k + " plugin caused an exception " +
                                      "changing status: " + err);
                    }
                }
            }
        }

        // notify the user's callback
		// 通知用户的回调函数，就是connection.connect(username, password, connectHandler);这里的connectHandler
        if (this.connect_callback) {
            try {
                this.connect_callback(status, condition);
            } catch (e) {
                Strophe.error("User connection callback caused an " +
                              "exception: " + e);
            }
        }
    },

    /** PrivateFunction: _doDisconnect
     *  _Private_ function to disconnect.
     *
     *  This is the last piece of the disconnection logic.  This resets the
     *  connection and alerts the user's connection callback.
	 
	 私有函数：
		断开连接
		
		这是断开连接逻辑上的最后一步，重置连接并且调用用户的连接回调函数
     */
    _doDisconnect: function (condition) {
        if (typeof this._idleTimeout == "number") {
            clearTimeout(this._idleTimeout);
        }

        // Cancel Disconnect Timeout
        if (this._disconnectTimeout !== null) {
            this.deleteTimedHandler(this._disconnectTimeout);
            this._disconnectTimeout = null;
        }

        Strophe.info("_doDisconnect was called");
        this._proto._doDisconnect();

        this.authenticated = false;
        this.disconnecting = false;
        this.restored = false;

        // delete handlers
        this.handlers = [];
        this.timedHandlers = [];
        this.removeTimeds = [];
        this.removeHandlers = [];
        this.addTimeds = [];
        this.addHandlers = [];

        // tell the parent we disconnected
        this._changeConnectStatus(Strophe.Status.DISCONNECTED, condition);
        this.connected = false;
    },

    /** PrivateFunction: _dataRecv
     *  _Private_ handler to processes incoming data from the the connection.
     *
     *  Except for _connect_cb handling the initial connection request,
     *  this function handles the incoming data for all requests.  This
     *  function also fires stanza handlers that match each incoming
     *  stanza.
     *
     *  Parameters:
     *    (Strophe.Request) req - The request that has data ready.
     *    (string) req - The stanza a raw string (optiona).
	 
	 私有函数：
		处理从连接中接收到的数据
		
		除了 _connect_cb 处理初始化连接请求，这个函数处理接下来的所有请求，
		这个函数使那些匹配每一个到来的节也触发节处理器
		
	参数：
		Strophe.Request req - 有数据的请求
		string req - 未加工的节字符串（可选）
     */
    _dataRecv: function (req, raw) {
        Strophe.info("_dataRecv called");
        var elem = this._proto._reqToData(req);
        if (elem === null) { return; }

        if (this.xmlInput !== Strophe.Connection.prototype.xmlInput) {
            if (elem.nodeName === this._proto.strip && elem.childNodes.length) {
                this.xmlInput(elem.childNodes[0]);
            } else {
                this.xmlInput(elem);
            }
        }
        if (this.rawInput !== Strophe.Connection.prototype.rawInput) {
            if (raw) {
                this.rawInput(raw);
            } else {
                this.rawInput(Strophe.serialize(elem));
            }
        }

        // remove handlers scheduled for deletion
        var i, hand;
        while (this.removeHandlers.length > 0) {
            hand = this.removeHandlers.pop();
            i = this.handlers.indexOf(hand);
            if (i >= 0) {
                this.handlers.splice(i, 1);
            }
        }

        // add handlers scheduled for addition
        while (this.addHandlers.length > 0) {
            this.handlers.push(this.addHandlers.pop());
        }

        // handle graceful disconnect
        if (this.disconnecting && this._proto._emptyQueue()) {
            this._doDisconnect();
            return;
        }

        var type = elem.getAttribute("type");
        var cond, conflict;
        if (type !== null && type == "terminate") {
            // Don't process stanzas that come in after disconnect
            if (this.disconnecting) {
                return;
            }

            // an error occurred
            cond = elem.getAttribute("condition");
            conflict = elem.getElementsByTagName("conflict");
            if (cond !== null) {
                if (cond == "remote-stream-error" && conflict.length > 0) {
                    cond = "conflict";
                }
                this._changeConnectStatus(Strophe.Status.CONNFAIL, cond);
            } else {
                this._changeConnectStatus(Strophe.Status.CONNFAIL, "unknown");
            }
            this._doDisconnect(cond);
            return;
        }

        // send each incoming stanza through the handler chain
        var that = this;
        Strophe.forEachChild(elem, null, function (child) {
            var i, newList;
            // process handlers
            newList = that.handlers;
            that.handlers = [];
            for (i = 0; i < newList.length; i++) {
                var hand = newList[i];
                // encapsulate 'handler.run' not to lose the whole handler list if
                // one of the handlers throws an exception
                try {
                    if (hand.isMatch(child) &&
                        (that.authenticated || !hand.user)) {
                        if (hand.run(child)) {
                            that.handlers.push(hand);
                        }
                    } else {
                        that.handlers.push(hand);
                    }
                } catch(e) {
                    // if the handler throws an exception, we consider it as false
                    Strophe.warn('Removing Strophe handlers due to uncaught exception: ' + e.message);
                }
            }
        });
    },


    /** Attribute: mechanisms
     *  SASL Mechanisms available for Conncection.
	 
	 属性：
		连接时SASL机制的有效值
     */
    mechanisms: {},

    /** PrivateFunction: _connect_cb
     *  _Private_ handler for initial connection request.
     *
     *  This handler is used to process the initial connection request
     *  response from the BOSH server. It is used to set up authentication
     *  handlers and start the authentication process.
     *
     *  SASL authentication will be attempted if available, otherwise
     *  the code will fall back to legacy authentication.
     *
     *  Parameters:
     *    (Strophe.Request) req - The current request.
     *    (Function) _callback - low level (xmpp) connect callback function.
     *      Useful for plugins with their own xmpp connect callback (when their)
     *      want to do something special).
	 
	 私有函数
		处理连接初始化的请求
		
		这个处理器是用来处理初始化的来自BOSH服务器的连接请求响应，它用来建立认证
		处理器并且开始认证过程
		
		SASL认证将会尝试是否可用，否则代码将会返回到之前的认证方式
		
	参数
		Strophe.Request req - 当前的请求
		函数 _callback - 最低等级（XMPP） 连接回调函数，
		有用的插件所拥有的XMPP连接回调（如果它们想做一些特别的事）
     */
    _connect_cb: function (req, _callback, raw) {
        Strophe.info("_connect_cb was called");

        this.connected = true;

        var bodyWrap;
        try {
            bodyWrap = this._proto._reqToData(req);
        } catch (e) {
            if (e != "badformat") { throw e; }
            this._changeConnectStatus(Strophe.Status.CONNFAIL, 'bad-format');
            this._doDisconnect('bad-format');
        }
        if (!bodyWrap) { return; }

        if (this.xmlInput !== Strophe.Connection.prototype.xmlInput) {
            if (bodyWrap.nodeName === this._proto.strip && bodyWrap.childNodes.length) {
                this.xmlInput(bodyWrap.childNodes[0]);
            } else {
                this.xmlInput(bodyWrap);
            }
        }
        if (this.rawInput !== Strophe.Connection.prototype.rawInput) {
            if (raw) {
                this.rawInput(raw);
            } else {
                this.rawInput(Strophe.serialize(bodyWrap));
            }
        }

        var conncheck = this._proto._connect_cb(bodyWrap);
        if (conncheck === Strophe.Status.CONNFAIL) {
            return;
        }

        this._authentication.sasl_scram_sha1 = false;
        this._authentication.sasl_plain = false;
        this._authentication.sasl_digest_md5 = false;
        this._authentication.sasl_anonymous = false;

        this._authentication.legacy_auth = false;

        // Check for the stream:features tag
        var hasFeatures;
        if (bodyWrap.getElementsByTagNameNS) {
            hasFeatures = bodyWrap.getElementsByTagNameNS(Strophe.NS.STREAM, "features").length > 0;
        } else {
            hasFeatures = bodyWrap.getElementsByTagName("stream:features").length > 0 || bodyWrap.getElementsByTagName("features").length > 0;
        }
        var mechanisms = bodyWrap.getElementsByTagName("mechanism");
        var matched = [];
        var i, mech, found_authentication = false;
        if (!hasFeatures) {
            this._proto._no_auth_received(_callback);
            return;
        }
        if (mechanisms.length > 0) {
            for (i = 0; i < mechanisms.length; i++) {
                mech = Strophe.getText(mechanisms[i]);
                if (this.mechanisms[mech]) matched.push(this.mechanisms[mech]);
            }
        }
        this._authentication.legacy_auth =
            bodyWrap.getElementsByTagName("auth").length > 0;
        found_authentication = this._authentication.legacy_auth ||
            matched.length > 0;
        if (!found_authentication) {
            this._proto._no_auth_received(_callback);
            return;
        }
        if (this.do_authentication !== false)
            this.authenticate(matched);
    },

    /** Function: authenticate
     * Set up authentication
     *
     *  Contiunues the initial connection request by setting up authentication
     *  handlers and start the authentication process.
     *
     *  SASL authentication will be attempted if available, otherwise
     *  the code will fall back to legacy authentication.
     *
	 
	 函数：
		建立认证机制
		
		继续初始化连接请求之后，建立认证处理器并且开始认证过程
		
		SASL认证将会尝试是否可用，否则代码将会返回到之前的认证方式
		
     */
    authenticate: function (matched) {
      var i;
      // 对认证机制进行排序
      // Sorting matched mechanisms according to priority.
      for (i = 0; i < matched.length - 1; ++i) {
        var higher = i;
        for (var j = i + 1; j < matched.length; ++j) {
          if (matched[j].prototype.priority > matched[higher].prototype.priority) {
            higher = j;
          }
        }
        if (higher != i) {
          var swap = matched[i];
          matched[i] = matched[higher];
          matched[higher] = swap;
        }
      }

      // run each mechanism
      var mechanism_found = false;
      for (i = 0; i < matched.length; ++i) {
        if (!matched[i].test(this)) continue;

        this._sasl_success_handler = this._addSysHandler(
          this._sasl_success_cb.bind(this), null,
          "success", null, null);
        this._sasl_failure_handler = this._addSysHandler(
          this._sasl_failure_cb.bind(this), null,
          "failure", null, null);
        this._sasl_challenge_handler = this._addSysHandler(
          this._sasl_challenge_cb.bind(this), null,
          "challenge", null, null);

        this._sasl_mechanism = new matched[i]();
        this._sasl_mechanism.onStart(this);

        var request_auth_exchange = $build("auth", {
          xmlns: Strophe.NS.SASL,
          mechanism: this._sasl_mechanism.name
        });

        if (this._sasl_mechanism.isClientFirst) {
          var response = this._sasl_mechanism.onChallenge(this, null);
          request_auth_exchange.t(Base64.encode(response));
        }

        this.send(request_auth_exchange.tree());

        mechanism_found = true;
        break;
      }

      if (!mechanism_found) {
        // if none of the mechanism worked
        if (Strophe.getNodeFromJid(this.jid) === null) {
            // we don't have a node, which is required for non-anonymous
            // client connections
            this._changeConnectStatus(Strophe.Status.CONNFAIL,
                                      'x-strophe-bad-non-anon-jid');
            this.disconnect('x-strophe-bad-non-anon-jid');
        } else {
          // fall back to legacy authentication
          this._changeConnectStatus(Strophe.Status.AUTHENTICATING, null);
          this._addSysHandler(this._auth1_cb.bind(this), null, null,
                              null, "_auth_1");

          this.send($iq({
            type: "get",
            to: this.domain,
            id: "_auth_1"
          }).c("query", {
            xmlns: Strophe.NS.AUTH
          }).c("username", {}).t(Strophe.getNodeFromJid(this.jid)).tree());
        }
      }

    },

    // 当接收到服务器发送了来的 challenge流，就会调用这个生成一个
    // response流用于应答
    _sasl_challenge_cb: function(elem) {
      var challenge = Base64.decode(Strophe.getText(elem)); // 服务器发送来的challenge
      var response = this._sasl_mechanism.onChallenge(this, challenge); // 应答的那个字符串

      var stanza = $build('response', { // 生成一个response节
          xmlns: Strophe.NS.SASL
      });
      if (response !== "") { // 将应答的字符串放到response节中
        stanza.t(Base64.encode(response));
      }
      this.send(stanza.tree()); // 发送节
      return true;
    },

    /** PrivateFunction: _auth1_cb
     *  _Private_ handler for legacy authentication.
     *
     *  This handler is called in response to the initial <iq type='get'/>
     *  for legacy authentication.  It builds an authentication <iq/> and
     *  sends it, creating a handler (calling back to _auth2_cb()) to
     *  handle the result
     *
     *  Parameters:
     *    (XMLElement) elem - The stanza that triggered the callback.
     *
     *  Returns:
     *    false to remove the handler.
	 
	 私有函数：
		传统的认证机制触发的处理器
		
		这个处理器被遗留的认证机制用来作为回复初始化<iq type='get'/>节·，它建立一个
		认证的<iq/>节并发送这个节，创建一个处理器（调用 _auth2_cb()函数 ） 去处理结果
     */
    /* jshint unused:false */
    _auth1_cb: function (elem) {
        // build plaintext auth iq
        var iq = $iq({type: "set", id: "_auth_2"})
            .c('query', {xmlns: Strophe.NS.AUTH})
            .c('username', {}).t(Strophe.getNodeFromJid(this.jid))
            .up()
            .c('password').t(this.pass);

        if (!Strophe.getResourceFromJid(this.jid)) {
            // since the user has not supplied a resource, we pick
            // a default one here.  unlike other auth methods, the server
            // cannot do this for us.
            this.jid = Strophe.getBareJidFromJid(this.jid) + '/strophe';
        }
        iq.up().c('resource', {}).t(Strophe.getResourceFromJid(this.jid));

        this._addSysHandler(this._auth2_cb.bind(this), null,
                            null, null, "_auth_2");

        this.send(iq.tree());

        return false;
    },
    /* jshint unused:true */

    /** PrivateFunction: _sasl_success_cb
     *  _Private_ handler for succesful SASL authentication.
     *
     *  Parameters:
     *    (XMLElement) elem - The matching stanza.
     *
     *  Returns:
     *    false to remove the handler.
	 *
	 *	私有函数：
	 *		成功的SASL认证会触发的处理器，
	 *		即challenge,response成功之后返回的success节
	 *			
	 *	参数：
	 *		XML元素 elem - 匹配的节
	 *			
	 *	返回值：
	 *		false指示移除处理器
     */
    _sasl_success_cb: function (elem) {
        if (this._sasl_data["server-signature"]) {
            var serverSignature;
            var success = Base64.decode(Strophe.getText(elem));
            var attribMatch = /([a-z]+)=([^,]+)(,|$)/;
            var matches = success.match(attribMatch);
            if (matches[1] == "v") {
                serverSignature = matches[2];
            }

            if (serverSignature != this._sasl_data["server-signature"]) {
              // remove old handlers
              this.deleteHandler(this._sasl_failure_handler);
              this._sasl_failure_handler = null;
              if (this._sasl_challenge_handler) {
                this.deleteHandler(this._sasl_challenge_handler);
                this._sasl_challenge_handler = null;
              }

              this._sasl_data = {};
              return this._sasl_failure_cb(null);
            }
        }

        Strophe.info("SASL authentication succeeded.");

        if(this._sasl_mechanism)
          this._sasl_mechanism.onSuccess();

        // remove old handlers
        this.deleteHandler(this._sasl_failure_handler);
        this._sasl_failure_handler = null;
        if (this._sasl_challenge_handler) {
            this.deleteHandler(this._sasl_challenge_handler);
            this._sasl_challenge_handler = null;
        }

        var streamfeature_handlers = [];
        var wrapper = function(handlers, elem) {
            while (handlers.length) {
                this.deleteHandler(handlers.pop());
            }
            this._sasl_auth1_cb.bind(this)(elem);
            return false;
        };
        streamfeature_handlers.push(this._addSysHandler(function(elem) {
            wrapper.bind(this)(streamfeature_handlers, elem);
        }.bind(this), null, "stream:features", null, null));
        streamfeature_handlers.push(this._addSysHandler(function(elem) {
            wrapper.bind(this)(streamfeature_handlers, elem);
        }.bind(this), Strophe.NS.STREAM, "features", null, null));

        // we must send an xmpp:restart now
        // 重启流，再次发送<open/>节
        this._sendRestart();

        return false;
    },

    /** PrivateFunction: _sasl_auth1_cb
     *  _Private_ handler to start stream binding.
     *
     *  Parameters:
     *    (XMLElement) elem - The matching stanza.
     *
     *  Returns:
     *    false to remove the handler.
	 
	 私有函数：
		开始流绑定会触发的处理器
		
	参数：
		XML元素 elem -  匹配的节
		
	返回值：
		false指示移除处理器
     */
    _sasl_auth1_cb: function (elem) {
        // save stream:features for future usage
        this.features = elem;

        var i, child;

        for (i = 0; i < elem.childNodes.length; i++) {
            child = elem.childNodes[i];
            if (child.nodeName == 'bind') {
                this.do_bind = true;
            }

            if (child.nodeName == 'session') {
                this.do_session = true;
            }
        }

        if (!this.do_bind) {
            this._changeConnectStatus(Strophe.Status.AUTHFAIL, null);
            return false;
        } else {
            this._addSysHandler(this._sasl_bind_cb.bind(this), null, null,
                                null, "_bind_auth_2");

            var resource = Strophe.getResourceFromJid(this.jid);
            if (resource) {
                this.send($iq({type: "set", id: "_bind_auth_2"})
                          .c('bind', {xmlns: Strophe.NS.BIND})
                          .c('resource', {}).t(resource).tree());
            } else {
                this.send($iq({type: "set", id: "_bind_auth_2"})
                          .c('bind', {xmlns: Strophe.NS.BIND})
                          .tree());
            }
        }
        return false;
    },

    /** PrivateFunction: _sasl_bind_cb
     *  _Private_ handler for binding result and session start.
     *
     *  Parameters:
     *    (XMLElement) elem - The matching stanza.
     *
     *  Returns:
     *    false to remove the handler.
	 
	 私有函数：
		绑定结果和会话开始的处理器
		
	参数：
		XML元素 elem -  匹配的节
		
	返回值：
		false指示移除处理器
	
     */
    _sasl_bind_cb: function (elem) {
        if (elem.getAttribute("type") == "error") {
            Strophe.info("SASL binding failed.");
            var conflict = elem.getElementsByTagName("conflict"), condition;
            if (conflict.length > 0) {
                condition = 'conflict';
            }
            this._changeConnectStatus(Strophe.Status.AUTHFAIL, condition);
            return false;
        }

        // TODO - need to grab errors
        var bind = elem.getElementsByTagName("bind");
        var jidNode;
        if (bind.length > 0) {
            // Grab jid
            jidNode = bind[0].getElementsByTagName("jid");
            if (jidNode.length > 0) {
                this.jid = Strophe.getText(jidNode[0]);

                if (this.do_session) {
                    this._addSysHandler(this._sasl_session_cb.bind(this),
                                        null, null, null, "_session_auth_2");

                    this.send($iq({type: "set", id: "_session_auth_2"})
                                  .c('session', {xmlns: Strophe.NS.SESSION})
                                  .tree());
                } else {
                    this.authenticated = true;
                    this._changeConnectStatus(Strophe.Status.CONNECTED, null);
                }
            }
        } else {
            Strophe.info("SASL binding failed.");
            this._changeConnectStatus(Strophe.Status.AUTHFAIL, null);
            return false;
        }
    },

    /** PrivateFunction: _sasl_session_cb
     *  _Private_ handler to finish successful SASL connection.
     *
     *  This sets Connection.authenticated to true on success, which
     *  starts the processing of user handlers.
     *
     *  Parameters:
     *    (XMLElement) elem - The matching stanza.
     *
     *  Returns:
     *    false to remove the handler.
	 
	 函数：
		结束成功的SASL连接的处理器
		
		这个将Connection.authenticated 设置成true表示成功了，用户的处理器也将开始执行
	参数：
		XML元素 elem -  匹配的节
		
	返回值：
		false指示移除处理器	
     */
    _sasl_session_cb: function (elem) {
        if (elem.getAttribute("type") == "result") {
            this.authenticated = true;
            this._changeConnectStatus(Strophe.Status.CONNECTED, null);
        } else if (elem.getAttribute("type") == "error") {
            Strophe.info("Session creation failed.");
            this._changeConnectStatus(Strophe.Status.AUTHFAIL, null);
            return false;
        }
        return false;
    },

    /** PrivateFunction: _sasl_failure_cb
     *  _Private_ handler for SASL authentication failure.
     *
     *  Parameters:
     *    (XMLElement) elem - The matching stanza.
     *
     *  Returns:
     *    false to remove the handler.
	 
	 函数：
		SASL认证失败触发的处理器
		
	参数：
		XML元素 elem -  匹配的节
		
	返回值：
		false指示移除处理器	
     */
    /* jshint unused:false */
    _sasl_failure_cb: function (elem) {
        // delete unneeded handlers
        if (this._sasl_success_handler) {
            this.deleteHandler(this._sasl_success_handler);
            this._sasl_success_handler = null;
        }
        if (this._sasl_challenge_handler) {
            this.deleteHandler(this._sasl_challenge_handler);
            this._sasl_challenge_handler = null;
        }

        if(this._sasl_mechanism)
          this._sasl_mechanism.onFailure();
        this._changeConnectStatus(Strophe.Status.AUTHFAIL, null);
        return false;
    },
    /* jshint unused:true */

    /** PrivateFunction: _auth2_cb
     *  _Private_ handler to finish legacy authentication.
     *
     *  This handler is called when the result from the jabber:iq:auth
     *  <iq/> stanza is returned.
     *
     *  Parameters:
     *    (XMLElement) elem - The stanza that triggered the callback.
     *
     *  Returns:
     *    false to remove the handler.
	 
	 函数：
		结束传统认证的处理器
		
		这个处理器会在 返回jabber:iq:auth <iq/> 节的结果时被调用
		
	参数：
		XML元素 elem - 将会触发回调函数的节
		
	返回值：
		false指示移除处理器	
     */
    _auth2_cb: function (elem) {
        if (elem.getAttribute("type") == "result") {
            this.authenticated = true;
            this._changeConnectStatus(Strophe.Status.CONNECTED, null);
        } else if (elem.getAttribute("type") == "error") {
            this._changeConnectStatus(Strophe.Status.AUTHFAIL, null);
            this.disconnect('authentication failed');
        }
        return false;
    },

    /** PrivateFunction: _addSysTimedHandler
     *  _Private_ function to add a system level timed handler.
     *
     *  This function is used to add a Strophe.TimedHandler for the
     *  library code.  System timed handlers are allowed to run before
     *  authentication is complete.
     *
     *  Parameters:
     *    (Integer) period - The period of the handler.
     *    (Function) handler - The callback function.
	 
	 私有函数：
		添加一个系统级的定时处理器
		
		这个函数会为库代码添加一个Strophe.TimedHandler ，系统定时处理器允许在
		认证结束之前允许
		
	参数：
		数值型 period - 时间间隔
		函数 handler - 回调函数
     */
    _addSysTimedHandler: function (period, handler) {
        var thand = new Strophe.TimedHandler(period, handler);
        thand.user = false;
        this.addTimeds.push(thand);
        return thand;
    },

    /** PrivateFunction: _addSysHandler
     *  _Private_ function to add a system level stanza handler.
     *
     *  This function is used to add a Strophe.Handler for the
     *  library code.  System stanza handlers are allowed to run before
     *  authentication is complete.
     *
     *  Parameters:
     *    (Function) handler - The callback function.
     *    (String) ns - The namespace to match.
     *    (String) name - The stanza name to match.
     *    (String) type - The stanza type attribute to match.
     *    (String) id - The stanza id attribute to match.
	 *
	 *	私有函数：
	 *		添加一个系统级的节处理器，
	 *		包括处理challenge,response,success节
	 *	
	 *	这个函数会为库代码添加一个Strophe.Handler ，
	 *	系统节定时处理器允许在认证结束之前运行
	 *	
	 *	参数：
	 *		函数 handler - 回调函数
	 *		字符串 ns - 需要匹配的命名空间
	 *		字符串 name - 同上
	 *		字符串 type - 同上
	 *		字符串 id - 同上
     */
    _addSysHandler: function (handler, ns, name, type, id)
    {
        var hand = new Strophe.Handler(handler, ns, name, type, id);
        hand.user = false;
        this.addHandlers.push(hand);
        return hand;
    },

    /** PrivateFunction: _onDisconnectTimeout
     *  _Private_ timeout handler for handling non-graceful disconnection.
     *
     *  If the graceful disconnect process does not complete within the
     *  time allotted, this handler finishes the disconnect anyway.
     *
     *  Returns:
     *    false to remove the handler.
	 
	 私有函数：
		用来处理不优雅的断开连接的处理器
		
		如果不优雅的断开连接处理在指定时间内没有处理完成，无论如何这个处理器将会断开连接
     */
    _onDisconnectTimeout: function ()
    {
        Strophe.info("_onDisconnectTimeout was called");

        this._changeConnectStatus(Strophe.Status.CONNTIMEOUT, null);

        this._proto._onDisconnectTimeout();

        // actually disconnect
        this._doDisconnect();

        return false;
    },

    /** PrivateFunction: _onIdle
     *  _Private_ handler to process events during idle cycle.
     *
     *  This handler is called every 100ms to fire timed handlers that
     *  are ready and keep poll requests going.
	 
	 私有函数：
		在空闲时处理时间的处理器
			
		这个处理器每100毫秒被调用一次，去激活那些已经准备好的和正在轮询的请求
		的定时的处理器
     */
    _onIdle: function ()
    {
        var i, thand, since, newList;

        // add timed handlers scheduled for addition
        // NOTE: we add before remove in the case a timed handler is
        // added and then deleted before the next _onIdle() call.
		// 我们在添加之前先清空，是为了防止，一个定时的处理器先被添加，然后在下一个_onIdle()调用的时候被删除
        while (this.addTimeds.length > 0) {
            this.timedHandlers.push(this.addTimeds.pop());
        }

        // remove timed handlers that have been scheduled for deletion
		// 移除那些计划删除的定时处理器
        while (this.removeTimeds.length > 0) {
            thand = this.removeTimeds.pop();
            i = this.timedHandlers.indexOf(thand);
            if (i >= 0) {
                this.timedHandlers.splice(i, 1);
            }
        }

        // call ready timed handlers  // 添加准备好的处理器
        var now = new Date().getTime();
        newList = [];
        for (i = 0; i < this.timedHandlers.length; i++) {
            thand = this.timedHandlers[i];
            if (this.authenticated || !thand.user) {
                since = thand.lastCalled + thand.period;
                if (since - now <= 0) {
                    if (thand.run()) {
                        newList.push(thand);
                    }
                } else {
                    newList.push(thand);
                }
            }
        }
        this.timedHandlers = newList;

        clearTimeout(this._idleTimeout); 

        this._proto._onIdle();

        // reactivate the timer only if connected 
		// 只有连接成功后才重新激活定时器【疑问：什么意思？】
        if (this.connected) {
            // XXX: setTimeout should be called only with function expressions (23974bc1)
            this._idleTimeout = setTimeout(function() {
                this._onIdle();
            }.bind(this), 100);
        }
    }
};

/** Class: Strophe.SASLMechanism
 *
 *  encapsulates SASL authentication mechanisms.
 *
 *  User code may override the priority for each mechanism or disable it completely.
 *  See <priority> for information about changing priority and <test> for informatian on
 *  how to disable a mechanism.
 *
 *  By default, all mechanisms are enabled and the priorities are
 *
 *  SCRAM-SHA1 - 40
 *  DIGEST-MD5 - 30
 *  Plain - 20
 
 类：
	封装SASL验证机制
	
	用户代码可以重写每个机制的优先级或者干脆使之无效
	改变优先级看<priority> 
	使之无效看<test>
	
	默认的，所有的机制是可用的，所有的优先级如下：
	
	 *  SCRAM-SHA1 - 40
	 *  DIGEST-MD5 - 30
	 *  Plain - 20
 */

/**
 * PrivateConstructor: Strophe.SASLMechanism
 * SASL auth mechanism abstraction.
 *
 *  Parameters:
 *    (String) name - SASL Mechanism name.
 *    (Boolean) isClientFirst - If client should send response first without challenge.
 *    (Number) priority - Priority.
 *
 *  Returns:
 *    A new Strophe.SASLMechanism object.
 
 私有构造器
	SASL认证机制抽象概念
	
参数：
	字符串 name - SASL机制名称
	布尔 isClinetFirst - 是否客户端可以在没有challenge的情况下发送response
	数值型 priority - 优先级
	
返回值：
	一个新的  Strophe.SASLMechanism 对象
 */
Strophe.SASLMechanism = function(name, isClientFirst, priority) {
  /** PrivateVariable: name
   *  Mechanism name.
   */
  this.name = name;
  /** PrivateVariable: isClientFirst
   *  If client sends response without initial server challenge.
   */
  this.isClientFirst = isClientFirst;
  /** Variable: priority
   *  Determines which <SASLMechanism> is chosen for authentication (Higher is better).
   *  Users may override this to prioritize mechanisms differently.
   *
   *  In the default configuration the priorities are
   *
   *  SCRAM-SHA1 - 40
   *  DIGEST-MD5 - 30
   *  Plain - 20
   *
   *  Example: (This will cause Strophe to choose the mechanism that the server sent first)
   *
   *  > Strophe.SASLMD5.priority = Strophe.SASLSHA1.priority;
   *
   *  See <SASL mechanisms> for a list of available mechanisms.
   *
   */
  this.priority = priority;
};

Strophe.SASLMechanism.prototype = {
  /**
   *  Function: test
   *  Checks if mechanism able to run.
   *  To disable a mechanism, make this return false;
   *
   *  To disable plain authentication run
   *  > Strophe.SASLPlain.test = function() {
   *  >   return false;
   *  > }
   *
   *  See <SASL mechanisms> for a list of available mechanisms.
   *
   *  Parameters:
   *    (Strophe.Connection) connection - Target Connection.
   *
   *  Returns:
   *    (Boolean) If mechanism was able to run.
   
   函数：
		检查机制能否运行
		想要关闭机制，返回值设置为false
		
		关闭普通文本认证 
   *  > Strophe.SASLPlain.test = function() {
   *  >   return false;
   *  > }
   
		更多可用的机制参照  <SASL mechanisms> 
		
	参数：
		Strophe.Connection connection - 目标连接
	
	返回值：
		布尔值，这个机制能否运行

   */
  /* jshint unused:false */
  test: function(connection) {
    return true;
  },
  /* jshint unused:true */

  /** PrivateFunction: onStart
   *  Called before starting mechanism on some connection.
   *
   *  Parameters:
   *    (Strophe.Connection) connection - Target Connection.
   
   私有函数：
	在一些连接中在机制开始前调用
		
	参数：
		Strophe.Connection connection - 目标连接
   */
  onStart: function(connection) {
    this._connection = connection;
  },

  /** PrivateFunction: onChallenge
   *  Called by protocol implementation on incoming challenge. If client is
   *  first (isClientFirst == true) challenge will be null on the first call.
   *
   *  Parameters:
   *    (Strophe.Connection) connection - Target Connection.
   *    (String) challenge - current challenge to handle.
   *
   *  Returns:
   *    (String) Mechanism response.
   
   私有函数：
		在challenge来了之后调用，如果客户端直接发送response（即isClientFires==true）
		，那么challenge 将会是null
		
	参数：
		Strophe.Connection connection - 目标连接
		字符串 challenge - 当前的要处理的challenge
   */
  /* jshint unused:false */
  onChallenge: function(connection, challenge) {
    throw new Error("You should implement challenge handling!");
  },
  /* jshint unused:true */

  /** PrivateFunction: onFailure
   *  Protocol informs mechanism implementation about SASL failure.
   
   私有函数
		协议通知机制实现 SASL失败
   */
  onFailure: function() {
    this._connection = null;
  },

  /** PrivateFunction: onSuccess
   *  Protocol informs mechanism implementation about SASL success.
     私有函数
		协议通知机制实现 SASL成功
   */
  onSuccess: function() {
    this._connection = null;
  }
};

  /** Constants: SASL mechanisms
   *  Available authentication mechanisms
   * 														优先级，如果服务器支持，则选择优先级高的
   *  Strophe.SASLAnonymous - SASL Anonymous authentication. 10
   *  Strophe.SASLPlain - SASL Plain authentication. 20
   *  Strophe.SASLMD5 - SASL Digest-MD5 authentication 30
   *  Strophe.SASLSHA1 - SASL SCRAM-SHA1 authentication 40
   *  Strophe.SASLOAuthBearer - SASL OAuth Bearer authentication  80
   
   常量 ： SASL机制
		可用的认证机制
   
   */

// Building SASL callbacks

/** PrivateConstructor: SASLAnonymous
 *  SASL Anonymous authentication.
 
 私有构造器 
	SASL匿名认证
 */
Strophe.SASLAnonymous = function() {};

Strophe.SASLAnonymous.prototype = new Strophe.SASLMechanism("ANONYMOUS", false, 10);

Strophe.SASLAnonymous.test = function(connection) {
  return connection.authcid === null;
};

Strophe.Connection.prototype.mechanisms[Strophe.SASLAnonymous.prototype.name] = Strophe.SASLAnonymous;

/** PrivateConstructor: SASLPlain
 *  SASL Plain authentication.
 */
Strophe.SASLPlain = function() {};

Strophe.SASLPlain.prototype = new Strophe.SASLMechanism("PLAIN", true, 20);

Strophe.SASLPlain.test = function(connection) {
  return connection.authcid !== null;
};

Strophe.SASLPlain.prototype.onChallenge = function(connection) {
  var auth_str = connection.authzid;
  auth_str = auth_str + "\u0000";
  auth_str = auth_str + connection.authcid;
  auth_str = auth_str + "\u0000";
  auth_str = auth_str + connection.pass;
  return utils.utf16to8(auth_str);
};

Strophe.Connection.prototype.mechanisms[Strophe.SASLPlain.prototype.name] = Strophe.SASLPlain;

/** PrivateConstructor: SASLSHA1
 *  SASL SCRAM SHA 1 authentication.
 */

Strophe.SASLSHA1 = function() {};

Strophe.SASLSHA1.prototype = new Strophe.SASLMechanism("SCRAM-SHA-1", true, 40);

Strophe.SASLSHA1.test = function(connection) {
    return connection.authcid !== null;
};

Strophe.SASLSHA1.prototype.onChallenge = function(connection, challenge, test_cnonce) {
  var cnonce = test_cnonce || MD5.hexdigest(Math.random() * 1234567890);
  var auth_str = "n=" + utils.utf16to8(connection.authcid);
  auth_str += ",r=";
  auth_str += cnonce;

  connection._sasl_data.cnonce = cnonce;
  connection._sasl_data["client-first-message-bare"] = auth_str;

  auth_str = "n,," + auth_str;

  this.onChallenge = function (connection, challenge) {
    var nonce, salt, iter, Hi, U, U_old, i, k, pass;
    var clientKey, serverKey, clientSignature;
    var responseText = "c=biws,";
    var authMessage = connection._sasl_data["client-first-message-bare"] + "," +
      challenge + ",";
    var cnonce = connection._sasl_data.cnonce;
    var attribMatch = /([a-z]+)=([^,]+)(,|$)/;

    while (challenge.match(attribMatch)) {
      var matches = challenge.match(attribMatch);
      challenge = challenge.replace(matches[0], "");
      switch (matches[1]) {
      case "r":
        nonce = matches[2];
        break;
      case "s":
        salt = matches[2];
        break;
      case "i":
        iter = matches[2];
        break;
      }
    }

    if (nonce.substr(0, cnonce.length) !== cnonce) {
      connection._sasl_data = {};
      return connection._sasl_failure_cb();
    }

    responseText += "r=" + nonce;
    authMessage += responseText;

    salt = Base64.decode(salt);
    salt += "\x00\x00\x00\x01";

    pass = utils.utf16to8(connection.pass);
    Hi = U_old = SHA1.core_hmac_sha1(pass, salt);
    for (i = 1; i < iter; i++) {
      U = SHA1.core_hmac_sha1(pass, SHA1.binb2str(U_old));
      for (k = 0; k < 5; k++) {
        Hi[k] ^= U[k];
      }
      U_old = U;
    }
    Hi = SHA1.binb2str(Hi);

    clientKey = SHA1.core_hmac_sha1(Hi, "Client Key");
    serverKey = SHA1.str_hmac_sha1(Hi, "Server Key");
    clientSignature = SHA1.core_hmac_sha1(SHA1.str_sha1(SHA1.binb2str(clientKey)), authMessage);
    connection._sasl_data["server-signature"] = SHA1.b64_hmac_sha1(serverKey, authMessage);

    for (k = 0; k < 5; k++) {
      clientKey[k] ^= clientSignature[k];
    }

    responseText += ",p=" + Base64.encode(SHA1.binb2str(clientKey));
    return responseText;
  }.bind(this);

  return auth_str;
};

Strophe.Connection.prototype.mechanisms[Strophe.SASLSHA1.prototype.name] = Strophe.SASLSHA1;

/** PrivateConstructor: SASLMD5
 *  SASL DIGEST MD5 authentication.
 */

Strophe.SASLMD5 = function() {};

Strophe.SASLMD5.prototype = new Strophe.SASLMechanism("DIGEST-MD5", false, 30);

Strophe.SASLMD5.test = function(connection) {
  return connection.authcid !== null;
};

/** PrivateFunction: _quote
 *  _Private_ utility function to backslash escape and quote strings.
 *
 *  Parameters:
 *    (String) str - The string to be quoted.
 *
 *  Returns:
 *    quoted string
 
 私有函数：
	对反斜杠进行换码并进行引用 的有用的函数 
	
参数：
	字符串 str - 需要引用的字符串
	
返回值：
	引用后的字符串
 */

Strophe.SASLMD5.prototype._quote = function (str)
  {
    return '"' + str.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
    //" end string workaround for emacs
  };


Strophe.SASLMD5.prototype.onChallenge = function(connection, challenge, test_cnonce) {
  var attribMatch = /([a-z]+)=("[^"]+"|[^,"]+)(?:,|$)/;
  var cnonce = test_cnonce || MD5.hexdigest("" + (Math.random() * 1234567890));
  var realm = "";
  var host = null;
  var nonce = "";
  var qop = "";
  var matches;

  while (challenge.match(attribMatch)) {
    matches = challenge.match(attribMatch);
    challenge = challenge.replace(matches[0], "");
    matches[2] = matches[2].replace(/^"(.+)"$/, "$1");
    switch (matches[1]) {
    case "realm":
      realm = matches[2];
      break;
    case "nonce":
      nonce = matches[2];
      break;
    case "qop":
      qop = matches[2];
      break;
    case "host":
      host = matches[2];
      break;
    }
  }

  var digest_uri = connection.servtype + "/" + connection.domain;
  if (host !== null) {
    digest_uri = digest_uri + "/" + host;
  }

  var cred = utils.utf16to8(connection.authcid + ":" + realm + ":" + this._connection.pass);
  var A1 = MD5.hash(cred) + ":" + nonce + ":" + cnonce;
  var A2 = 'AUTHENTICATE:' + digest_uri;

  var responseText = "";
  responseText += 'charset=utf-8,';
  responseText += 'username=' + this._quote(utils.utf16to8(connection.authcid)) + ',';
  responseText += 'realm=' + this._quote(realm) + ',';
  responseText += 'nonce=' + this._quote(nonce) + ',';
  responseText += 'nc=00000001,';
  responseText += 'cnonce=' + this._quote(cnonce) + ',';
  responseText += 'digest-uri=' + this._quote(digest_uri) + ',';
  responseText += 'response=' + MD5.hexdigest(MD5.hexdigest(A1) + ":" +
                                              nonce + ":00000001:" +
                                              cnonce + ":auth:" +
                                              MD5.hexdigest(A2)) + ",";
  responseText += 'qop=auth';

  this.onChallenge = function () {
      return "";
  }.bind(this);

  return responseText;
};

Strophe.Connection.prototype.mechanisms[Strophe.SASLMD5.prototype.name] = Strophe.SASLMD5;

/** PrivateConstructor: SASLOAuthBearer
 *  SASL OAuth Bearer authentication.
 */
Strophe.SASLOAuthBearer = function() {};

Strophe.SASLOAuthBearer.prototype = new Strophe.SASLMechanism("OAUTHBEARER", true, 80);

Strophe.SASLOAuthBearer.test = function(connection) {
  return connection.authcid !== null;
};

Strophe.SASLOAuthBearer.prototype.onChallenge = function(connection) {
  var auth_str = 'n,a=';
  auth_str = auth_str + connection.authzid;
  auth_str = auth_str + ',';
  auth_str = auth_str + "\u0001";
  auth_str = auth_str + 'auth=Bearer ';
  auth_str = auth_str + connection.pass;
  auth_str = auth_str + "\u0001";
  auth_str = auth_str + "\u0001";

  return utils.utf16to8(auth_str);
};

Strophe.Connection.prototype.mechanisms[Strophe.SASLOAuthBearer.prototype.name] = Strophe.SASLOAuthBearer;

return {
    Strophe:        Strophe,
    $build:         $build,
    $msg:           $msg,
    $iq:            $iq,
    $pres:          $pres,
    SHA1:           SHA1,
    Base64:         Base64,
    MD5:            MD5,
};
}));

/*
    This program is distributed under the terms of the MIT license.
    Please see the LICENSE file for details.

    Copyright 2006-2008, OGG, LLC
*/

/* jshint undef: true, unused: true:, noarg: true, latedef: true */
/* global define, window, setTimeout, clearTimeout, XMLHttpRequest, ActiveXObject, Strophe, $build */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('strophe-bosh', ['strophe-core'], function (core) {
            return factory(
                core.Strophe,
                core.$build
            );
        });
    } else {
        // Browser globals
        return factory(Strophe, $build);
    }
}(this, function (Strophe, $build) {

/** PrivateClass: Strophe.Request
 *  _Private_ helper class that provides a cross implementation abstraction
 *  for a BOSH related XMLHttpRequest.
 *
 *  The Strophe.Request class is used internally to encapsulate BOSH request
 *  information.  It is not meant to be used from user's code.
 
  私有类：
	为BOSH与XMLHttpRequest关联提供一个交叉的抽象实现
	
	Strophe.Request在内部被使用，用来封装BOSH的请求信息，这不意味着使用用户的代码
 */

/** PrivateConstructor: Strophe.Request
 *  Create and initialize a new Strophe.Request object.
 *
 *  Parameters:
 *    (XMLElement) elem - The XML data to be sent in the request.
 *    (Function) func - The function that will be called when the
 *      XMLHttpRequest readyState changes.
 *    (Integer) rid - The BOSH rid attribute associated with this request.
 *    (Integer) sends - The number of times this same request has been
 *      sent.
 
私有构造器
	创新并初始化一个Strophe.Request对象
		
参数：
	XML元素 elem - 请求中需要发送的XML数据
	函数 func - 当XHR状态改变时调用的函数
	数值型 rid - BOSH  的rid属性与请求有关
	数值型 sends - 相同的请求会被发送几次
	
 */
Strophe.Request = function (elem, func, rid, sends) {
    this.id = ++Strophe._requestId;
    this.xmlData = elem;
    this.data = Strophe.serialize(elem);
    // save original function in case we need to make a new request
    // from this one.
    this.origFunc = func;
    this.func = func;
    this.rid = rid;
    this.date = NaN;
    this.sends = sends || 0;
    this.abort = false;
    this.dead = null;

    this.age = function () {
        if (!this.date) { return 0; }
        var now = new Date();
        return (now - this.date) / 1000;
    };
    this.timeDead = function () {
        if (!this.dead) { return 0; }
        var now = new Date();
        return (now - this.dead) / 1000;
    };
    this.xhr = this._newXHR();
};

Strophe.Request.prototype = {
    /** PrivateFunction: getResponse
     *  Get a response from the underlying XMLHttpRequest.
     *
     *  This function attempts to get a response from the request and checks
     *  for errors.
     *
     *  Throws:
     *    "parsererror" - A parser error occured.
     *    "badformat" - The entity has sent XML that cannot be processed.
     *
     *  Returns:
     *    The DOM element tree of the response.
	 
	 私有函数：
		从潜在的XHR获得一个响应
		
		这个函数试图请求中得到一个响应并且检查错误
		
	抛出的异常：
		parsererror - 转换问题
		badformat - 实体发送的XML不能够被解析
	
	返回值：
		响应的DOM元素树
     */
    getResponse: function () {
        var node = null;
        if (this.xhr.responseXML && this.xhr.responseXML.documentElement) {
            node = this.xhr.responseXML.documentElement;
            if (node.tagName == "parsererror") {
                Strophe.error("invalid response received");
                Strophe.error("responseText: " + this.xhr.responseText);
                Strophe.error("responseXML: " +
                              Strophe.serialize(this.xhr.responseXML));
                throw "parsererror";
            }
        } else if (this.xhr.responseText) {
            Strophe.error("invalid response received");
            Strophe.error("responseText: " + this.xhr.responseText);
            throw "badformat";
        }

        return node;
    },

    /** PrivateFunction: _newXHR
     *  _Private_ helper function to create XMLHttpRequests.
     *
     *  This function creates XMLHttpRequests across all implementations.
     *
     *  Returns:
     *    A new XMLHttpRequest.
	 
	 私有函数：
		创建一个XHR
	
		这个函数通过所有的实现新建一个XHR
		
	返回值：	
		XHR
     */
    _newXHR: function () {
        var xhr = null;
        if (window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
            if (xhr.overrideMimeType) {
                xhr.overrideMimeType("text/xml; charset=utf-8");
            }
        } else if (window.ActiveXObject) {
            xhr = new ActiveXObject("Microsoft.XMLHTTP");
        }
        // use Function.bind() to prepend ourselves as an argument
        xhr.onreadystatechange = this.func.bind(null, this);
        return xhr;
    }
};

/** Class: Strophe.Bosh
 *  _Private_ helper class that handles BOSH Connections
 *
 *  The Strophe.Bosh class is used internally by Strophe.Connection
 *  to encapsulate BOSH sessions. It is not meant to be used from user's code.
 */

/** File: bosh.js
 *  A JavaScript library to enable BOSH in Strophejs.
 *
 *  this library uses Bidirectional-streams Over Synchronous HTTP (BOSH)
 *  to emulate a persistent, stateful, two-way connection to an XMPP server.
 *  More information on BOSH can be found in XEP 124.
 */

/** PrivateConstructor: Strophe.Bosh
 *  Create and initialize a Strophe.Bosh object.
 *
 *  Parameters:
 *    (Strophe.Connection) connection - The Strophe.Connection that will use BOSH.
 *
 *  Returns:
 *    A new Strophe.Bosh object.
 */
Strophe.Bosh = function(connection) {
    this._conn = connection;
    /* request id for body tags */
    this.rid = Math.floor(Math.random() * 4294967295);
    /* The current session ID. */
    this.sid = null;

    // default BOSH values
    this.hold = 1;
    this.wait = 60;
    this.window = 5;
    this.errors = 0;

    this._requests = [];
};

Strophe.Bosh.prototype = {
    /** Variable: strip
     *
     *  BOSH-Connections will have all stanzas wrapped in a <body> tag when
     *  passed to <Strophe.Connection.xmlInput> or <Strophe.Connection.xmlOutput>.
     *  To strip this tag, User code can set <Strophe.Bosh.strip> to "body":
     *
     *  > Strophe.Bosh.prototype.strip = "body";
     *
     *  This will enable stripping of the body tag in both
     *  <Strophe.Connection.xmlInput> and <Strophe.Connection.xmlOutput>.
     */
    strip: null,

    /** PrivateFunction: _buildBody
     *  _Private_ helper function to generate the <body/> wrapper for BOSH.
     *
     *  Returns:
     *    A Strophe.Builder with a <body/> element.
     */
    _buildBody: function () {
        var bodyWrap = $build('body', {
            rid: this.rid++,
            xmlns: Strophe.NS.HTTPBIND
        });
        if (this.sid !== null) {
            bodyWrap.attrs({sid: this.sid});
        }
        if (this._conn.options.keepalive && this._conn._sessionCachingSupported()) {
            this._cacheSession();
        }
        return bodyWrap;
    },

    /** PrivateFunction: _reset
     *  Reset the connection.
     *
     *  This function is called by the reset function of the Strophe Connection
     */
    _reset: function () {
        this.rid = Math.floor(Math.random() * 4294967295);
        this.sid = null;
        this.errors = 0;
        if (this._conn._sessionCachingSupported()) {
            window.sessionStorage.removeItem('strophe-bosh-session');
        }

        this._conn.nextValidRid(this.rid);
    },

    /** PrivateFunction: _connect
     *  _Private_ function that initializes the BOSH connection.
     *
     *  Creates and sends the Request that initializes the BOSH connection.
     */
    _connect: function (wait, hold, route) {
        this.wait = wait || this.wait;
        this.hold = hold || this.hold;
        this.errors = 0;

        // build the body tag
        var body = this._buildBody().attrs({
            to: this._conn.domain,
            "xml:lang": "en",
            wait: this.wait,
            hold: this.hold,
            content: "text/xml; charset=utf-8",
            ver: "1.6",
            "xmpp:version": "1.0",
            "xmlns:xmpp": Strophe.NS.BOSH
        });

        if(route){
            body.attrs({
                route: route
            });
        }

        var _connect_cb = this._conn._connect_cb;

        this._requests.push(
            new Strophe.Request(body.tree(),
                                this._onRequestStateChange.bind(
                                    this, _connect_cb.bind(this._conn)),
                                body.tree().getAttribute("rid")));
        this._throttledRequestHandler();
    },

    /** PrivateFunction: _attach
     *  Attach to an already created and authenticated BOSH session.
     *
     *  This function is provided to allow Strophe to attach to BOSH
     *  sessions which have been created externally, perhaps by a Web
     *  application.  This is often used to support auto-login type features
     *  without putting user credentials into the page.
     *
     *  Parameters:
     *    (String) jid - The full JID that is bound by the session.
     *    (String) sid - The SID of the BOSH session.
     *    (String) rid - The current RID of the BOSH session.  This RID
     *      will be used by the next request.
     *    (Function) callback The connect callback function.
     *    (Integer) wait - The optional HTTPBIND wait value.  This is the
     *      time the server will wait before returning an empty result for
     *      a request.  The default setting of 60 seconds is recommended.
     *      Other settings will require tweaks to the Strophe.TIMEOUT value.
     *    (Integer) hold - The optional HTTPBIND hold value.  This is the
     *      number of connections the server will hold at one time.  This
     *      should almost always be set to 1 (the default).
     *    (Integer) wind - The optional HTTBIND window value.  This is the
     *      allowed range of request ids that are valid.  The default is 5.
     */
    _attach: function (jid, sid, rid, callback, wait, hold, wind) {
        this._conn.jid = jid;
        this.sid = sid;
        this.rid = rid;

        this._conn.connect_callback = callback;

        this._conn.domain = Strophe.getDomainFromJid(this._conn.jid);

        this._conn.authenticated = true;
        this._conn.connected = true;

        this.wait = wait || this.wait;
        this.hold = hold || this.hold;
        this.window = wind || this.window;

        this._conn._changeConnectStatus(Strophe.Status.ATTACHED, null);
    },

    /** PrivateFunction: _restore
     *  Attempt to restore a cached BOSH session
     *
     *  Parameters:
     *    (String) jid - The full JID that is bound by the session.
     *      This parameter is optional but recommended, specifically in cases
     *      where prebinded BOSH sessions are used where it's important to know
     *      that the right session is being restored.
     *    (Function) callback The connect callback function.
     *    (Integer) wait - The optional HTTPBIND wait value.  This is the
     *      time the server will wait before returning an empty result for
     *      a request.  The default setting of 60 seconds is recommended.
     *      Other settings will require tweaks to the Strophe.TIMEOUT value.
     *    (Integer) hold - The optional HTTPBIND hold value.  This is the
     *      number of connections the server will hold at one time.  This
     *      should almost always be set to 1 (the default).
     *    (Integer) wind - The optional HTTBIND window value.  This is the
     *      allowed range of request ids that are valid.  The default is 5.
     */
    _restore: function (jid, callback, wait, hold, wind) {
        var session = JSON.parse(window.sessionStorage.getItem('strophe-bosh-session'));
        if (typeof session !== "undefined" &&
                   session !== null &&
                   session.rid &&
                   session.sid &&
                   session.jid &&
                   (typeof jid === "undefined" || jid === null || Strophe.getBareJidFromJid(session.jid) == Strophe.getBareJidFromJid(jid)))
        {
            this._conn.restored = true;
            this._attach(session.jid, session.sid, session.rid, callback, wait, hold, wind);
        } else {
            throw { name: "StropheSessionError", message: "_restore: no restoreable session." };
        }
    },

    /** PrivateFunction: _cacheSession
     *  _Private_ handler for the beforeunload event.
     *
     *  This handler is used to process the Bosh-part of the initial request.
     *  Parameters:
     *    (Strophe.Request) bodyWrap - The received stanza.
     */
    _cacheSession: function () {
        if (this._conn.authenticated) {
            if (this._conn.jid && this.rid && this.sid) {
                window.sessionStorage.setItem('strophe-bosh-session', JSON.stringify({
                    'jid': this._conn.jid,
                    'rid': this.rid,
                    'sid': this.sid
                }));
            }
        } else {
            window.sessionStorage.removeItem('strophe-bosh-session');
        }
    },

    /** PrivateFunction: _connect_cb
     *  _Private_ handler for initial connection request.
     *
     *  This handler is used to process the Bosh-part of the initial request.
     *  Parameters:
     *    (Strophe.Request) bodyWrap - The received stanza.
     */
    _connect_cb: function (bodyWrap) {
        var typ = bodyWrap.getAttribute("type");
        var cond, conflict;
        if (typ !== null && typ == "terminate") {
            // an error occurred
            cond = bodyWrap.getAttribute("condition");
            Strophe.error("BOSH-Connection failed: " + cond);
            conflict = bodyWrap.getElementsByTagName("conflict");
            if (cond !== null) {
                if (cond == "remote-stream-error" && conflict.length > 0) {
                    cond = "conflict";
                }
                this._conn._changeConnectStatus(Strophe.Status.CONNFAIL, cond);
            } else {
                this._conn._changeConnectStatus(Strophe.Status.CONNFAIL, "unknown");
            }
            this._conn._doDisconnect(cond);
            return Strophe.Status.CONNFAIL;
        }

        // check to make sure we don't overwrite these if _connect_cb is
        // called multiple times in the case of missing stream:features
        if (!this.sid) {
            this.sid = bodyWrap.getAttribute("sid");
        }
        var wind = bodyWrap.getAttribute('requests');
        if (wind) { this.window = parseInt(wind, 10); }
        var hold = bodyWrap.getAttribute('hold');
        if (hold) { this.hold = parseInt(hold, 10); }
        var wait = bodyWrap.getAttribute('wait');
        if (wait) { this.wait = parseInt(wait, 10); }
    },

    /** PrivateFunction: _disconnect
     *  _Private_ part of Connection.disconnect for Bosh
     *
     *  Parameters:
     *    (Request) pres - This stanza will be sent before disconnecting.
     */
    _disconnect: function (pres) {
        this._sendTerminate(pres);
    },

    /** PrivateFunction: _doDisconnect
     *  _Private_ function to disconnect.
     *
     *  Resets the SID and RID.
     */
    _doDisconnect: function () {
        this.sid = null;
        this.rid = Math.floor(Math.random() * 4294967295);
        if (this._conn._sessionCachingSupported()) {
            window.sessionStorage.removeItem('strophe-bosh-session');
        }

        this._conn.nextValidRid(this.rid);
    },

    /** PrivateFunction: _emptyQueue
     * _Private_ function to check if the Request queue is empty.
     *
     *  Returns:
     *    True, if there are no Requests queued, False otherwise.
     */
    _emptyQueue: function () {
        return this._requests.length === 0;
    },

    /** PrivateFunction: _hitError
     *  _Private_ function to handle the error count.
     *
     *  Requests are resent automatically until their error count reaches
     *  5.  Each time an error is encountered, this function is called to
     *  increment the count and disconnect if the count is too high.
     *
     *  Parameters:
     *    (Integer) reqStatus - The request status.
     */
    _hitError: function (reqStatus) {
        this.errors++;
        Strophe.warn("request errored, status: " + reqStatus +
                     ", number of errors: " + this.errors);
        if (this.errors > 4) {
            this._conn._onDisconnectTimeout();
        }
    },

    /** PrivateFunction: _no_auth_received
     *
     * Called on stream start/restart when no stream:features
     * has been received and sends a blank poll request.
     */
    _no_auth_received: function (_callback) {
        if (_callback) {
            _callback = _callback.bind(this._conn);
        } else {
            _callback = this._conn._connect_cb.bind(this._conn);
        }
        var body = this._buildBody();
        this._requests.push(
                new Strophe.Request(body.tree(),
                    this._onRequestStateChange.bind(
                        this, _callback.bind(this._conn)),
                    body.tree().getAttribute("rid")));
        this._throttledRequestHandler();
    },

    /** PrivateFunction: _onDisconnectTimeout
     *  _Private_ timeout handler for handling non-graceful disconnection.
     *
     *  Cancels all remaining Requests and clears the queue.
     */
    _onDisconnectTimeout: function () {
        this._abortAllRequests();
    },

    /** PrivateFunction: _abortAllRequests
     *  _Private_ helper function that makes sure all pending requests are aborted.
     */
    _abortAllRequests: function _abortAllRequests() {
        var req;
        while (this._requests.length > 0) {
            req = this._requests.pop();
            req.abort = true;
            req.xhr.abort();
            // jslint complains, but this is fine. setting to empty func
            // is necessary for IE6
            req.xhr.onreadystatechange = function () {}; // jshint ignore:line
        }
    },

    /** PrivateFunction: _onIdle
     *  _Private_ handler called by Strophe.Connection._onIdle
     *
     *  Sends all queued Requests or polls with empty Request if there are none.
     */
    _onIdle: function () {
        var data = this._conn._data;

        // if no requests are in progress, poll
        if (this._conn.authenticated && this._requests.length === 0 &&
            data.length === 0 && !this._conn.disconnecting) {
            Strophe.info("no requests during idle cycle, sending " +
                         "blank request");
            data.push(null);
        }

        if (this._conn.paused) {
            return;
        }

        if (this._requests.length < 2 && data.length > 0) {
            var body = this._buildBody();
            for (var i = 0; i < data.length; i++) {
                if (data[i] !== null) {
                    if (data[i] === "restart") {
                        body.attrs({
                            to: this._conn.domain,
                            "xml:lang": "en",
                            "xmpp:restart": "true",
                            "xmlns:xmpp": Strophe.NS.BOSH
                        });
                    } else {
                        body.cnode(data[i]).up();
                    }
                }
            }
            delete this._conn._data;
            this._conn._data = [];
            this._requests.push(
                new Strophe.Request(body.tree(),
                                    this._onRequestStateChange.bind(
                                        this, this._conn._dataRecv.bind(this._conn)),
                                    body.tree().getAttribute("rid")));
            this._throttledRequestHandler();
        }

        if (this._requests.length > 0) {
            var time_elapsed = this._requests[0].age();
            if (this._requests[0].dead !== null) {
                if (this._requests[0].timeDead() >
                    Math.floor(Strophe.SECONDARY_TIMEOUT * this.wait)) {
                    this._throttledRequestHandler();
                }
            }

            if (time_elapsed > Math.floor(Strophe.TIMEOUT * this.wait)) {
                Strophe.warn("Request " +
                             this._requests[0].id +
                             " timed out, over " + Math.floor(Strophe.TIMEOUT * this.wait) +
                             " seconds since last activity");
                this._throttledRequestHandler();
            }
        }
    },

    /** PrivateFunction: _onRequestStateChange
     *  _Private_ handler for Strophe.Request state changes.
     *
     *  This function is called when the XMLHttpRequest readyState changes.
     *  It contains a lot of error handling logic for the many ways that
     *  requests can fail, and calls the request callback when requests
     *  succeed.
     *
     *  Parameters:
     *    (Function) func - The handler for the request.
     *    (Strophe.Request) req - The request that is changing readyState.
     */
    _onRequestStateChange: function (func, req) {
        Strophe.debug("request id " + req.id +
                      "." + req.sends + " state changed to " +
                      req.xhr.readyState);

        if (req.abort) {
            req.abort = false;
            return;
        }

        // request complete
        var reqStatus;
        if (req.xhr.readyState == 4) {
            reqStatus = 0;
            try {
                reqStatus = req.xhr.status;
            } catch (e) {
                // ignore errors from undefined status attribute.  works
                // around a browser bug
            }

            if (typeof(reqStatus) == "undefined") {
                reqStatus = 0;
            }

            if (this.disconnecting) {
                if (reqStatus >= 400) {
                    this._hitError(reqStatus);
                    return;
                }
            }

            var reqIs0 = (this._requests[0] == req);
            var reqIs1 = (this._requests[1] == req);

            if ((reqStatus > 0 && reqStatus < 500) || req.sends > 5) {
                // remove from internal queue
                this._removeRequest(req);
                Strophe.debug("request id " +
                              req.id +
                              " should now be removed");
            }

            // request succeeded
            if (reqStatus == 200) {
                // if request 1 finished, or request 0 finished and request
                // 1 is over Strophe.SECONDARY_TIMEOUT seconds old, we need to
                // restart the other - both will be in the first spot, as the
                // completed request has been removed from the queue already
                if (reqIs1 ||
                    (reqIs0 && this._requests.length > 0 &&
                     this._requests[0].age() > Math.floor(Strophe.SECONDARY_TIMEOUT * this.wait))) {
                    this._restartRequest(0);
                }

                this._conn.nextValidRid(Number(req.rid) + 1);

                // call handler
                Strophe.debug("request id " +
                              req.id + "." +
                              req.sends + " got 200");
                func(req);
                this.errors = 0;
            } else {
                Strophe.error("request id " +
                              req.id + "." +
                              req.sends + " error " + reqStatus +
                              " happened");
                if (reqStatus === 0 ||
                    (reqStatus >= 400 && reqStatus < 600) ||
                    reqStatus >= 12000) {
                    this._hitError(reqStatus);
                    if (reqStatus >= 400 && reqStatus < 500) {
                        this._conn._changeConnectStatus(Strophe.Status.DISCONNECTING, null);
                        this._conn._doDisconnect();
                    }
                }
            }

            if (!((reqStatus > 0 && reqStatus < 500) ||
                  req.sends > 5)) {
                this._throttledRequestHandler();
            }
        }
    },

    /** PrivateFunction: _processRequest
     *  _Private_ function to process a request in the queue.
     *
     *  This function takes requests off the queue and sends them and
     *  restarts dead requests.
     *
     *  Parameters:
     *    (Integer) i - The index of the request in the queue.
     */
    _processRequest: function (i) {
        var self = this;
        var req = this._requests[i];
        var reqStatus = -1;

        try {
            if (req.xhr.readyState == 4) {
                reqStatus = req.xhr.status;
            }
        } catch (e) {
            Strophe.error("caught an error in _requests[" + i +
                          "], reqStatus: " + reqStatus);
        }

        if (typeof(reqStatus) == "undefined") {
            reqStatus = -1;
        }

        // make sure we limit the number of retries
        if (req.sends > this._conn.maxRetries) {
            this._conn._onDisconnectTimeout();
            return;
        }

        var time_elapsed = req.age();
        var primaryTimeout = (!isNaN(time_elapsed) &&
                              time_elapsed > Math.floor(Strophe.TIMEOUT * this.wait));
        var secondaryTimeout = (req.dead !== null &&
                                req.timeDead() > Math.floor(Strophe.SECONDARY_TIMEOUT * this.wait));
        var requestCompletedWithServerError = (req.xhr.readyState == 4 &&
                                               (reqStatus < 1 ||
                                                reqStatus >= 500));
        if (primaryTimeout || secondaryTimeout ||
            requestCompletedWithServerError) {
            if (secondaryTimeout) {
                Strophe.error("Request " +
                              this._requests[i].id +
                              " timed out (secondary), restarting");
            }
            req.abort = true;
            req.xhr.abort();
            // setting to null fails on IE6, so set to empty function
            req.xhr.onreadystatechange = function () {};
            this._requests[i] = new Strophe.Request(req.xmlData,
                                                    req.origFunc,
                                                    req.rid,
                                                    req.sends);
            req = this._requests[i];
        }

        if (req.xhr.readyState === 0) {
            Strophe.debug("request id " + req.id +
                          "." + req.sends + " posting");

            try {
                req.xhr.open("POST", this._conn.service, this._conn.options.sync ? false : true);
                req.xhr.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
                if (this._conn.options.withCredentials) {
                    req.xhr.withCredentials = true;
                }
            } catch (e2) {
                Strophe.error("XHR open failed.");
                if (!this._conn.connected) {
                    this._conn._changeConnectStatus(Strophe.Status.CONNFAIL,
                                              "bad-service");
                }
                this._conn.disconnect();
                return;
            }

            // Fires the XHR request -- may be invoked immediately
            // or on a gradually expanding retry window for reconnects
            var sendFunc = function () {
                req.date = new Date();
                if (self._conn.options.customHeaders){
                    var headers = self._conn.options.customHeaders;
                    for (var header in headers) {
                        if (headers.hasOwnProperty(header)) {
                            req.xhr.setRequestHeader(header, headers[header]);
                        }
                    }
                }
                req.xhr.send(req.data);
            };

            // Implement progressive backoff for reconnects --
            // First retry (send == 1) should also be instantaneous
            if (req.sends > 1) {
                // Using a cube of the retry number creates a nicely
                // expanding retry window
                var backoff = Math.min(Math.floor(Strophe.TIMEOUT * this.wait),
                                       Math.pow(req.sends, 3)) * 1000;

                // XXX: setTimeout should be called only with function expressions (23974bc1)
                setTimeout(function() {
                    sendFunc();
                }, backoff);
            } else {
                sendFunc();
            }

            req.sends++;

            if (this._conn.xmlOutput !== Strophe.Connection.prototype.xmlOutput) {
                if (req.xmlData.nodeName === this.strip && req.xmlData.childNodes.length) {
                    this._conn.xmlOutput(req.xmlData.childNodes[0]);
                } else {
                    this._conn.xmlOutput(req.xmlData);
                }
            }
            if (this._conn.rawOutput !== Strophe.Connection.prototype.rawOutput) {
                this._conn.rawOutput(req.data);
            }
        } else {
            Strophe.debug("_processRequest: " +
                          (i === 0 ? "first" : "second") +
                          " request has readyState of " +
                          req.xhr.readyState);
        }
    },

    /** PrivateFunction: _removeRequest
     *  _Private_ function to remove a request from the queue.
     *
     *  Parameters:
     *    (Strophe.Request) req - The request to remove.
     */
    _removeRequest: function (req) {
        Strophe.debug("removing request");

        var i;
        for (i = this._requests.length - 1; i >= 0; i--) {
            if (req == this._requests[i]) {
                this._requests.splice(i, 1);
            }
        }

        // IE6 fails on setting to null, so set to empty function
        req.xhr.onreadystatechange = function () {};

        this._throttledRequestHandler();
    },

    /** PrivateFunction: _restartRequest
     *  _Private_ function to restart a request that is presumed dead.
     *
     *  Parameters:
     *    (Integer) i - The index of the request in the queue.
     */
    _restartRequest: function (i) {
        var req = this._requests[i];
        if (req.dead === null) {
            req.dead = new Date();
        }

        this._processRequest(i);
    },

    /** PrivateFunction: _reqToData
     * _Private_ function to get a stanza out of a request.
     *
     * Tries to extract a stanza out of a Request Object.
     * When this fails the current connection will be disconnected.
     *
     *  Parameters:
     *    (Object) req - The Request.
     *
     *  Returns:
     *    The stanza that was passed.
	私有函数：
		从请求中获取一个节
		 
		 试着从一个请求中提取出一个节
		 失败的时候当前的连接就会中断
	 
	 参数：
		对象 req - 请求
			
	返回值
		取出的节
	 
     */
    _reqToData: function (req) {
        try {
            return req.getResponse();
        } catch (e) {
            if (e != "parsererror") { throw e; }
            this._conn.disconnect("strophe-parsererror");
        }
    },

    /** PrivateFunction: _sendTerminate
     *  _Private_ function to send initial disconnect sequence.
     *
     *  This is the first step in a graceful disconnect.  It sends
     *  the BOSH server a terminate body and includes an unavailable
     *  presence if authentication has completed.
     */
    _sendTerminate: function (pres) {
        Strophe.info("_sendTerminate was called");
        var body = this._buildBody().attrs({type: "terminate"});

        if (pres) {
            body.cnode(pres.tree());
        }

        var req = new Strophe.Request(body.tree(),
                                      this._onRequestStateChange.bind(
                                          this, this._conn._dataRecv.bind(this._conn)),
                                      body.tree().getAttribute("rid"));

        this._requests.push(req);
        this._throttledRequestHandler();
    },

    /** PrivateFunction: _send
     *  _Private_ part of the Connection.send function for BOSH
     *
     * Just triggers the RequestHandler to send the messages that are in the queue
     */
    _send: function () {
        clearTimeout(this._conn._idleTimeout);
        this._throttledRequestHandler();

        // XXX: setTimeout should be called only with function expressions (23974bc1)
        this._conn._idleTimeout = setTimeout(function() {
            this._onIdle();
        }.bind(this._conn), 100);
    },

    /** PrivateFunction: _sendRestart
     *
     *  Send an xmpp:restart stanza.
     */
    _sendRestart: function () {
        this._throttledRequestHandler();
        clearTimeout(this._conn._idleTimeout);
    },

    /** PrivateFunction: _throttledRequestHandler
     *  _Private_ function to throttle requests to the connection window.
     *
     *  This function makes sure we don't send requests so fast that the
     *  request ids overflow the connection window in the case that one
     *  request died.
     */
    _throttledRequestHandler: function () {
        if (!this._requests) {
            Strophe.debug("_throttledRequestHandler called with " +
                          "undefined requests");
        } else {
            Strophe.debug("_throttledRequestHandler called with " +
                          this._requests.length + " requests");
        }

        if (!this._requests || this._requests.length === 0) {
            return;
        }

        if (this._requests.length > 0) {
            this._processRequest(0);
        }

        if (this._requests.length > 1 &&
            Math.abs(this._requests[0].rid -
                     this._requests[1].rid) < this.window) {
            this._processRequest(1);
        }
    }
};
return Strophe;
}));

/*
    This program is distributed under the terms of the MIT license.
    Please see the LICENSE file for details.

    Copyright 2006-2008, OGG, LLC
*/

/* jshint undef: true, unused: true:, noarg: true, latedef: true */
/* global define, window, clearTimeout, WebSocket, DOMParser, Strophe, $build */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('strophe-websocket', ['strophe-core'], function (core) {
            return factory(
                core.Strophe,
                core.$build
            );
        });
    } else {
        // Browser globals
        return factory(Strophe, $build);
    }
}(this, function (Strophe, $build) {

/** Class: Strophe.WebSocket
 *  _Private_ helper class that handles WebSocket Connections
 *
 *  The Strophe.WebSocket class is used internally by Strophe.Connection
 *  to encapsulate WebSocket sessions. It is not meant to be used from user's code.
 
 类： 	
	处理websocket的连接
		
	Strophe.WebSocket是被Strophe.Connection在内部用来封装websocket sessions的，
	它不意味着不能被用户的代码使用
 */

/** File: websocket.js
 *  A JavaScript library to enable XMPP over Websocket in Strophejs.
 *
 *  This file implements XMPP over WebSockets for Strophejs.
 *  If a Connection is established with a Websocket url (ws://...)
 *  Strophe will use WebSockets.
 *  For more information on XMPP-over-WebSocket see RFC 7395:
 *  http://tools.ietf.org/html/rfc7395
 *
 *  WebSocket support implemented by Andreas Guth (andreas.guth@rwth-aachen.de)
 
 文件 ：
	在Strophe.js中的一个JS库，能够使XMPP OVER WebSocket的， 
	
	这个文件继承了 XMPP over WebSockets ，如果一个连接是以 websocket url (ws://) 来建立的，
	那么Strophe就会使用WebSocekts
	更多信息关于 XMPP-over-WebSocket 请参考 RFC-7395
	
	websocket支持是 Andreas Guth 实现的
 */

/** PrivateConstructor: Strophe.Websocket
 *  Create and initialize a Strophe.WebSocket object.
 *  Currently only sets the connection Object.
 *
 *  Parameters:
 *    (Strophe.Connection) connection - The Strophe.Connection that will use WebSockets.
 *
 *  Returns:
 *    A new Strophe.WebSocket object.
 
 私有构造器 
	创建并实例化一个 Strophe.WebSocket 对象
	当前只设置连接对象
	
参数：
	Strophe.Connection - Strophe.Connection 将会用到 websocket
	
返回值：
	Strophe.WebSocket 对象
 */
Strophe.Websocket = function(connection) {
	// 连接的对象，即 Strophe.Connection
    this._conn = connection;  
    this.strip = "wrapper"; 

	// 从Strophe.Connection中得到URL，
    var service = connection.service;
    if (service.indexOf("ws:") !== 0 && service.indexOf("wss:") !== 0) {
		// 如果server中没有保存完整的URL，那么将从Strophe.Connection对象的options中将协议取出
		// 组合成完整的URL。这里的目的是使Strophe.Connection对象的sevice成为连接服务器的完整路径。
        // If the service is not an absolute URL, assume it is a path and put the absolute
        // URL together from options, current URL and the path.
        var new_service = "";

        if (connection.options.protocol === "ws" && window.location.protocol !== "https:") {
            new_service += "ws";
        } else {
            new_service += "wss";
        }

        new_service += "://" + window.location.host;

        if (service.indexOf("/") !== 0) {
            new_service += window.location.pathname + service;
        } else {
            new_service += service;
        }

        connection.service = new_service;
    }
};

Strophe.Websocket.prototype = {
    /** PrivateFunction: _buildStream
     *  _Private_ helper function to generate the <stream> start tag for WebSockets
     *
     *  Returns:
     *    A Strophe.Builder with a <stream> element.
	 
	 私有函数：
		为ws生成一个<stream>开始标签,建立连接的时候使用
		
	返回值：
		一个Strophe.Builder对象，包含<stream>元素
     */
    _buildStream: function () {
        return $build("open", {
            "xmlns": Strophe.NS.FRAMING,
            "to": this._conn.domain,
            "version": '1.0'
        });
    },

    /** PrivateFunction: _check_streamerror
     * _Private_ checks a message for stream:error
     *
     *  Parameters:
     *    (Strophe.Request) bodyWrap - The received stanza.
     *    connectstatus - The ConnectStatus that will be set on error.
     *  Returns:
     *     true if there was a streamerror, false otherwise.
	 
	 私有函数：
		检查stream:errorr的信息
		
	参数：
		trophe.Request bodyWarp - 接收到的节
		connectstatus - 连接状态将会被设置成 error
		
	返回值：
		true表示发生了错误，false表示没错
     */
    _check_streamerror: function (bodyWrap, connectstatus) {
        var errors;
        if (bodyWrap.getElementsByTagNameNS) {
            errors = bodyWrap.getElementsByTagNameNS(Strophe.NS.STREAM, "error");
        } else {
            errors = bodyWrap.getElementsByTagName("stream:error");
        }
        if (errors.length === 0) {
            return false;
        }
        var error = errors[0];

        var condition = "";
        var text = "";

        var ns = "urn:ietf:params:xml:ns:xmpp-streams";
        for (var i = 0; i < error.childNodes.length; i++) {
            var e = error.childNodes[i];
            if (e.getAttribute("xmlns") !== ns) {
                break;
            } if (e.nodeName === "text") {
                text = e.textContent;
            } else {
                condition = e.nodeName;
            }
        }

        var errorString = "WebSocket stream error: ";

        if (condition) {
            errorString += condition;
        } else {
            errorString += "unknown";
        }

        if (text) {
            errorString += " - " + condition;
        }

        Strophe.error(errorString);

        // close the connection on stream_error
        this._conn._changeConnectStatus(connectstatus, condition);
        this._conn._doDisconnect();
        return true;
    },

    /** PrivateFunction: _reset
     *  Reset the connection.
     *
     *  This function is called by the reset function of the Strophe Connection.
     *  Is not needed by WebSockets.
	 
	 私有函数：
		重置连接
		
		这个函数会被 Strophe Connection 的 reset()函数调用，
		目前是空实现。
     */
    _reset: function () {
        return;
    },

    /** PrivateFunction: _connect
     *  _Private_ function called by Strophe.Connection.connect
     *
     *  Creates a WebSocket for a connection and assigns Callbacks to it.
     *  Does nothing if there already is a WebSocket.
	 
	 私有函数：
		被 Strophe.Connection.connect函数调用，
		
		为连接创建一个websocket并指派回调函数，
		如果已经有一个ws了，则不做任何事
     */
    _connect: function () {
        // Ensure that there is no open WebSocket from a previous Connection.
		// 确保websocket处于关闭状态
        this._closeSocket();

        // Create the new WobSocket 
		// 创建一个新的websocket并绑定websocket事件。
		// 注意，websocket在new的时候就是去连接服务器的时候，
        this.socket = new WebSocket(this._conn.service, "xmpp");
        this.socket.onopen = this._onOpen.bind(this);
        this.socket.onerror = this._onError.bind(this);
        this.socket.onclose = this._onClose.bind(this);
        this.socket.onmessage = this._connect_cb_wrapper.bind(this);
    },

    /** PrivateFunction: _connect_cb
     *  _Private_ function called by Strophe.Connection._connect_cb
     *
     * checks for stream:error
     *
     *  Parameters:
     *    (Strophe.Request) bodyWrap - The received stanza.
	 
	 私有函数：
		被Strophe.Connection._connect_cb()函数调用
		
		检查 tream:error 流错误
		
	参数：
		Strophe.Request	bodyWrap - 接收到的节
     */
    _connect_cb: function(bodyWrap) {
        var error = this._check_streamerror(bodyWrap, Strophe.Status.CONNFAIL);
        if (error) {
            return Strophe.Status.CONNFAIL;
        }
    },

    /** PrivateFunction: _handleStreamStart
     * _Private_ function that checks the opening <open /> tag for errors.
     *
     * Disconnects if there is an error and returns false, true otherwise.
     *
     *  Parameters:
     *    (Node) message - Stanza containing the <open /> tag.
	 
	 私有函数：
		检查 <open/> 标签是否有错
		
		如有错误断开连接返回false，否则正确返回true，连接成功
		
	参数：
		节点 message - 节包括<open /> 标签
		
     */
    _handleStreamStart: function(message) {
        var error = false;

        // Check for errors in the <open /> tag
		// 命名空间是否有错
        var ns = message.getAttribute("xmlns");
        if (typeof ns !== "string") {
            error = "Missing xmlns in <open />";
        } else if (ns !== Strophe.NS.FRAMING) {
            error = "Wrong xmlns in <open />: " + ns;
        }

		// 版本是否有错
        var ver = message.getAttribute("version");
        if (typeof ver !== "string") {
            error = "Missing version in <open />";
        } else if (ver !== "1.0") {
            error = "Wrong version in <open />: " + ver;
        }

        if (error) {
            this._conn._changeConnectStatus(Strophe.Status.CONNFAIL, error);
            this._conn._doDisconnect();
            return false;
        }

        return true;
    },

    /** PrivateFunction: _connect_cb_wrapper
     * _Private_ function that handles the first connection messages.
     *
     * On receiving an opening stream tag this callback replaces itself with the real
     * message handler. On receiving a stream error the connection is terminated.
	 
	 私有函数：
		 WebSocket的onmessage的回调函数
		
		接收到 打开流连接的标签，会调用真正的消息处理器，
		接收到流错误会关闭流
		
     */
    _connect_cb_wrapper: function(message) {
		//  如果是<open 和 <xml 的流，
        if (message.data.indexOf("<open ") === 0 || message.data.indexOf("<?xml") === 0) {
            // Strip the XML Declaration, if there is one
            var data = message.data.replace(/^(<\?.*?\?>\s*)*/, "");
            if (data === '') return;

			// 将文本信息转换成XML信息，返回一个XML Document对象
            var streamStart = new DOMParser().parseFromString(data, "text/xml").documentElement;  
            this._conn.xmlInput(streamStart);
            this._conn.rawInput(message.data);

            //_handleStreamSteart will check for XML errors and disconnect on error
			// _handleStreamSteart也会检查 XML错误和连接断开错误
            if (this._handleStreamStart(streamStart)) {
                //_connect_cb will check for stream:error and disconnect on error
				// _connect_cb也是检查流是否有错，有错就断开
                this._connect_cb(streamStart);
            }
        } else if (message.data.indexOf("<close ") === 0) { //'<close xmlns="urn:ietf:params:xml:ns:xmpp-framing />') { 
		// 关闭流的处理
            this._conn.rawInput(message.data);
            this._conn.xmlInput(message);
            var see_uri = message.getAttribute("see-other-uri");
            if (see_uri) {
                this._conn._changeConnectStatus(Strophe.Status.REDIRECT, "Received see-other-uri, resetting connection");
                this._conn.reset();
                this._conn.service = see_uri;
                this._connect();
            } else {
                this._conn._changeConnectStatus(Strophe.Status.CONNFAIL, "Received closing stream");
                this._conn._doDisconnect();
            }
        } else { // 处理其他流
            var string = this._streamWrap(message.data);
            var elem = new DOMParser().parseFromString(string, "text/xml").documentElement;
            this.socket.onmessage = this._onMessage.bind(this);
            this._conn._connect_cb(elem, null, message.data);
        }
    },

    /** PrivateFunction: _disconnect
     *  _Private_ function called by Strophe.Connection.disconnect
     *
     *  Disconnects and sends a last stanza if one is given
     *
     *  Parameters:
     *    (Request) pres - This stanza will be sent before disconnecting.
	 
	 私有函数：
		被 Strophe.Connection.disconnect 调用
		
		断开连接并且发送最后一个节（如果有的话）
		
	参数：
		请求 pres -  关闭前最后一个节
     */
    _disconnect: function (pres) {
        if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
            if (pres) {
                this._conn.send(pres);
            }
            var close = $build("close", { "xmlns": Strophe.NS.FRAMING });
            this._conn.xmlOutput(close);
            var closeString = Strophe.serialize(close);
            this._conn.rawOutput(closeString);
            try {
                this.socket.send(closeString);
            } catch (e) {
                Strophe.info("Couldn't send <close /> tag.");
            }
        }
        this._conn._doDisconnect();
    },

    /** PrivateFunction: _doDisconnect
     *  _Private_ function to disconnect.
     *
     *  Just closes the Socket for WebSockets
	 
	 私有函数：
		断开连接
		
		为ws关闭socket
     */
    _doDisconnect: function () {
        Strophe.info("WebSockets _doDisconnect was called");
        this._closeSocket();
    },

    /** PrivateFunction _streamWrap
     *  _Private_ helper function to wrap a stanza in a <stream> tag.
     *  This is used so Strophe can process stanzas from WebSockets like BOSH
	 
	 私有函数：
		包装一个<stream>标签
		这个使Strophe能够像BOSH一样在ws中处理节
		
     */
    _streamWrap: function (stanza) {
        return "<wrapper>" + stanza + '</wrapper>';
    },


    /** PrivateFunction: _closeSocket
     *  _Private_ function to close the WebSocket.
     *
     *  Closes the socket if it is still open and deletes it
	 
	 私有函数：
		关闭ws连接
		
		关闭socket如果它还在打开并且删除它，
     */
    _closeSocket: function () {
        if (this.socket) { try {
            this.socket.close();
        } catch (e) {} }
        this.socket = null;
    },

    /** PrivateFunction: _emptyQueue
     * _Private_ function to check if the message queue is empty.
     *
     *  Returns:
     *    True, because WebSocket messages are send immediately after queueing.
	 
	 私有函数：
		检查消息队列是否为空
		
	返回值	
		一值为true，因为进入队列后ws消息会马上发出去
     */
    _emptyQueue: function () {
        return true;
    },

    /** PrivateFunction: _onClose
     * _Private_ function to handle websockets closing.
     *
     * Nothing to do here for WebSockets
	 
	 私有函数：
		处理ws关闭
		
		这里没有任何事情要为ws而做，
     */
    _onClose: function() {
        if(this._conn.connected && !this._conn.disconnecting) { // 如果不是正常断开的话
            Strophe.error("Websocket closed unexpectedly");
            this._conn._doDisconnect();
        } else { // 正常断开
            Strophe.info("Websocket closed");
        }
    },

    /** PrivateFunction: _no_auth_received
     *
     * Called on stream start/restart when no stream:features
     * has been received.
	 
	 私有函数：
		
		调用 流 开启/重启 当没有接收到  stream:features
     */
    _no_auth_received: function (_callback) {
        Strophe.error("Server did not send any auth methods");
        this._conn._changeConnectStatus(Strophe.Status.CONNFAIL, "Server did not send any auth methods");
        if (_callback) {
            _callback = _callback.bind(this._conn);
            _callback();
        }
        this._conn._doDisconnect();
    },

    /** PrivateFunction: _onDisconnectTimeout
     *  _Private_ timeout handler for handling non-graceful disconnection.
     *
     *  This does nothing for WebSockets
	 
	 私有函数：
		处理不优雅的关闭
		
		空实现
     */
    _onDisconnectTimeout: function () {},

    /** PrivateFunction: _abortAllRequests
     *  _Private_ helper function that makes sure all pending requests are aborted.
	 
	 私有函数：
		所有待发送的请求会被终止
		
		空实现。。
     */
    _abortAllRequests: function () {},

    /** PrivateFunction: _onError
     * _Private_ function to handle websockets errors.
     *
     * Parameters:
     * (Object) error - The websocket error.
	 
	 私有函数：
		处理 ws错误
	‘
	参数：
		对象 error - ws错误
     */
    _onError: function(error) {
        Strophe.error("Websocket error " + error);  // 记录错误
		// 改变连接状态
        this._conn._changeConnectStatus(Strophe.Status.CONNFAIL, "The WebSocket connection could not be established or was disconnected.");
		// 断开连接
        this._disconnect();
    },

    /** PrivateFunction: _onIdle
     *  _Private_ function called by Strophe.Connection._onIdle
     *
     *  sends all queued stanzas
	 
	 私有函数：
		被Strophe.Connection._onIdle调用
		
		发送所有在队列中的节
     */
    _onIdle: function () {
        var data = this._conn._data;
        if (data.length > 0 && !this._conn.paused) {
            for (var i = 0; i < data.length; i++) {
                if (data[i] !== null) {
                    var stanza, rawStanza;
                    if (data[i] === "restart") {
                        stanza = this._buildStream().tree();
                    } else {
                        stanza = data[i];
                    }
                    rawStanza = Strophe.serialize(stanza);
                    this._conn.xmlOutput(stanza);
                    this._conn.rawOutput(rawStanza);
                    this.socket.send(rawStanza);
                }
            }
            this._conn._data = [];
        }
    },

    /** PrivateFunction: _onMessage
     * _Private_ function to handle websockets messages.
     *
     * This function parses each of the messages as if they are full documents.
     * [TODO : We may actually want to use a SAX Push parser].
     *
     * Since all XMPP traffic starts with
     *  <stream:stream version='1.0'
     *                 xml:lang='en'
     *                 xmlns='jabber:client'
     *                 xmlns:stream='http://etherx.jabber.org/streams'
     *                 id='3697395463'
     *                 from='SERVER'>
     *
     * The first stanza will always fail to be parsed.
     *
     * Additionally, the seconds stanza will always be <stream:features> with
     * the stream NS defined in the previous stanza, so we need to 'force'
     * the inclusion of the NS in this stanza.
     *
     * Parameters:
     * (string) message - The websocket message.
	 
	 私有函数：
		处理ws消息
		
		这个函数解析每个消息就行它们是完整的文档
		【备忘：我们实际上是想用 SAX Push 解析器】
		
		因为 所有XMPP 交互开始于 
	 *  <stream:stream version='1.0'
     *                 xml:lang='en'
     *                 xmlns='jabber:client'
     *                 xmlns:stream='http://etherx.jabber.org/streams'
     *                 id='3697395463'
     *                 from='SERVER'>
	 第一个节总会使解析失败
	 
	 另外，第二个节 通常是 <stream:features>  带有 定义在前一个节 的流命名空间
	所以我们需要“强制”让这个节包含命名空间
	
	参数：
		字符串 message - ws消息
	 
     */
    _onMessage: function(message) {
        var elem, data;
        // check for closing stream
        var close = '<close xmlns="urn:ietf:params:xml:ns:xmpp-framing" />';
        if (message.data === close) {
            this._conn.rawInput(close);
            this._conn.xmlInput(message);
            if (!this._conn.disconnecting) {
                this._conn._doDisconnect();
            }
            return;
        } else if (message.data.search("<open ") === 0) {
            // This handles stream restarts
            elem = new DOMParser().parseFromString(message.data, "text/xml").documentElement;
            if (!this._handleStreamStart(elem)) {
                return;
            }
        } else {
            data = this._streamWrap(message.data);
            elem = new DOMParser().parseFromString(data, "text/xml").documentElement;
        }

        if (this._check_streamerror(elem, Strophe.Status.ERROR)) {
            return;
        }

        //handle unavailable presence stanza before disconnecting
        if (this._conn.disconnecting &&
                elem.firstChild.nodeName === "presence" &&
                elem.firstChild.getAttribute("type") === "unavailable") {
            this._conn.xmlInput(elem);
            this._conn.rawInput(Strophe.serialize(elem));
            // if we are already disconnecting we will ignore the unavailable stanza and
            // wait for the </stream:stream> tag before we close the connection
            return;
        }
        this._conn._dataRecv(elem, message.data);
    },

    /** PrivateFunction: _onOpen
     * _Private_ function to handle websockets connection setup.
     *
     * The opening stream tag is sent here.
	 
	 私有函数：
		处理ws连接建立
		
		websocket的onopen的回调函数。
     */
    _onOpen: function() {
        Strophe.info("Websocket open");
        var start = this._buildStream(); // 生成<open/>流
        this._conn.xmlOutput(start.tree()); // 调用 Strophe.Connection的xmlOutput()方法，空实现

        var startString = Strophe.serialize(start); // 将<open /> XML 序列化变成一个字符串
        this._conn.rawOutput(startString);	// Strophe.Connection的rawOutput()方法，空实现
        this.socket.send(startString); // 使用WebSocket的send()方法发送<open />流，注意是WebSocket不是Strophe.WebSocket。
    },

    /** PrivateFunction: _reqToData
     * _Private_ function to get a stanza out of a request.
     *
     * WebSockets don't use requests, so the passed argument is just returned.
     *
     *  Parameters:
     *    (Object) stanza - The stanza.
     *
     *  Returns:
     *    The stanza that was passed.
	 
	 私有函数：
		
     */
    _reqToData: function (stanza) {
        return stanza;
    },

    /** PrivateFunction: _send
     *  _Private_ part of the Connection.send function for WebSocket
     *
     * Just flushes the messages that are in the queue
	 私有函数：
		Connection.send()函数中 ws的一部分
     */
    _send: function () {
        this._conn.flush();
    },

    /** PrivateFunction: _sendRestart
     *
     *  Send an xmpp:restart stanza.
	 
	 私有函数：
		
		发送一个XMPP ： 重启节？
     */
    _sendRestart: function () {
        clearTimeout(this._conn._idleTimeout);
        this._conn._onIdle.bind(this._conn)();
    }
};
return Strophe;
}));

(function(root){
    if(typeof define === 'function' && define.amd){
        define("strophe", [
            "strophe-core",
            "strophe-bosh",
            "strophe-websocket"
        ], function (wrapper) {
            return wrapper;
        });
    }
})(this);

/* jshint ignore:start */
if (callback) {
    if(typeof define === 'function' && define.amd){
        //For backwards compatability
        var n_callback = callback;
        requirejs(["strophe"],function(o){
            n_callback(o.Strophe,o.$build,o.$msg,o.$iq,o.$pres);
        });
    }else{
        return callback(Strophe, $build, $msg, $iq, $pres);
    }
}


})(function (Strophe, build, msg, iq, pres) {
    window.Strophe = Strophe;
    window.$build = build;
    window.$msg = msg;
    window.$iq = iq;
    window.$pres = pres;
});
/* jshint ignore:end */
