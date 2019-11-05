/*global Strophe $iq $ */
/*
  (c) 2013 - Arlo Breault <arlolra@gmail.com>
  Freely distributed under the MPL v2.0 license.

  File: strophe.ibb.js
  XEP-0047: In-Band Bytestreams
  http://xmpp.org/extensions/xep-0047.html
  参考：https://github.com/strophe/strophejs-plugin-ibb
 不允许依赖jquery这样的第三方UI库,已完成清理 by cy [20190402]
*/
;(function () {
  "use strict";
  function noop() {}

  Strophe.addConnectionPlugin('ibb', {
    _c: null,
    _cb: null,
    init: function (c) {
      XoW.logger.ms('ibb', 'init() ');
      this._c = c;
      Strophe.addNamespace('IBB', 'http://jabber.org/protocol/ibb');
      c.addHandler(this._receive.bind(this), Strophe.NS.IBB, 'iq', 'set');
      XoW.logger.me('ibb', 'init() ');
    },
    _createErr: function (to, id, type, name) {
      XoW.logger.ms('ibb', '_createErr() ');
      var iq = $iq({
        type: 'error',
        to: to,
        id: id
      }).c('error', {
        type: type
      }).c(name, {
        xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'
      })
      return iq;
    },
    _receive: function (stanza) {
      XoW.logger.ms('ibb', '_receive() ');
      var from = stanza.getAttribute('from');
      var id = stanza.getAttribute('id');
      // support ibb?
      // proceed?
      // prefer smaller chunks?
      var iq = $iq({
        type: 'result',
        to: from,
        id: id
      });
      this._send(iq, noop, noop);

      var child = stanza.childNodes[0];
      var type = child.tagName.toLowerCase();
      var sid = child.getAttribute('sid');
      // 2016/12/27 林兴洋 新增，我需要block-size的值
      var blockSize = child.getAttribute('block-size');
      var data, seq;
      if (type === 'data') {
        data = child.textContent;
        seq = child.getAttribute('seq');
      }
      // callback message
      if (typeof this._cb === 'function') {
        this._cb(type, from, sid, data, seq, blockSize);
      }
      XoW.logger.me('ibb', '_receive() ');
      return true;  // keep handler active
    },
    _success: function (cb) {
      XoW.logger.ms('ibb', '_success() ');
      cb(null);
    },
    _fail: function (cb, stanza) {
      XoW.logger.ms('ibb', '_fail() ');
      var err = new Error('time out');
      if (!stanza) {
        cb(err);
        return;
      }
      if(stanza.getElementsByTagName('error').length > 0) {
        var errorEle = stanza.getElementsByTagName('error')[0];
        err.name = errorEle.getAttribute('code');
        err.message = errorEle.getAttribute('type');
      }
      cb(err);
    },
    _send: function (iq, success, fail) {
      XoW.logger.ms('ibb', '_send() ');
      this._c.sendIQ(iq, success, fail, 60 * 1000);
    },
    open: function (to, sid, bs, cb) {
      XoW.logger.ms('ibb', 'open() ');
      if (parseInt(bs ? bs : 0, 10) > 65535) {
        return cb(new Error('Block-size too large.'))
      }
      // construct iq
      var iq = $iq({
        type: 'set',
        to: to,
        id: this._c.getUniqueId('ibb')
      }).c('open', {
        xmlns: Strophe.NS.IBB,
        stanza: 'iq',
        sid: sid,
        'block-size': bs || '4096'
      });
      // 自动帮我回复open的同意
      this._send(iq,
        this._success.bind(this, cb),
        this._fail.bind(this, cb)
      );
    },
    data: function (to, sid, seq, data, cb) {
      XoW.logger.ms('ibb', 'data({0}, {1})'.f(sid, seq));
      var iq = $iq({
        type: 'set',
        to: to,
        id: this._c.getUniqueId('ibb')
      }).c('data', {
        xmlns: Strophe.NS.IBB,
        seq: seq.toString(),
        sid: sid
      }).t(data);
      // 自动帮我回复data的确定
      this._send(iq,
        this._success.bind(this, cb),
        this._fail.bind(this, cb)
      );
    },
    close: function (to, sid, cb) {
      XoW.logger.ms('ibb', 'close({0})'.f(sid));
      // construct iq
      var iq = $iq({
        type: 'set',
        to: to,
        id: this._c.getUniqueId('ibb')
      }).c('close', {
        xmlns: Strophe.NS.IBB,
        sid: sid
      });
      // 自动帮我回复close的确定
      this._send(iq,
        this._success.bind(this, cb),
        this._fail.bind(this, cb)
      );
    },
    addIBBHandler: function (fn) {
      XoW.logger.ms('ibb', 'addIBBHandler()');
      this._cb = fn;
    }
  });
}());