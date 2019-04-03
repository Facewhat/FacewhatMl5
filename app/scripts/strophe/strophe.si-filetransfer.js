/*
 (c) 2013 - Arlo Breault <arlolra@gmail.com>
 Freely distributed under the MPL v2.0 license.
 File: strophe.si-filetransfer.js
 XEP-0096: SI File Transfer
 http://xmpp.org/extensions/xep-0096.html
 参考：https://github.com/strophe/strophejs-plugin-si-filetransfer
 不允许依赖jquery这样的第三方UI库,已完成清理 by cy [20190402]
 */

;(function () {
  'use strict';

  function noop() {
  }

  function inVals(stanza, ns) {
    var text = stanza.querySelector('si>feature>x>field[var="stream-method"]>value').textContent;
    if(text === ns) {
      return true;
    }
    return false;
  }

  Strophe.addConnectionPlugin('si_filetransfer', {
    _c: null,
    _cb: null,
    init: function (c) {
      this._c = c;
      Strophe.addNamespace('SI', 'http://jabber.org/protocol/si');
      Strophe.addNamespace('SI_FILE_TRANSFER', Strophe.NS.SI + '/profile/file-transfer');
      Strophe.addNamespace('FEATURE_NEG', 'http://jabber.org/protocol/feature-neg');

      // c.addHandler(this._receive.bind(this), Strophe.NS.SI, 'iq', 'set');
      // 改用自己的
      c.addHandler(this._receive_1.bind(this), Strophe.NS.SI, 'iq', 'set');
    },

    /**
     * 这种是不需要点击同意就直接接受文件（它直接返回了iq-result），
     * 和spark不同，要进行修改
     */
    _receive: function (stanza) {
      var from = stanza.getAttribute('from');
      var id = stanza.getAttribute('id');
      var sid = stanza.getElementsByTagName('si')[0].getAttribute('id');
      /* 林兴洋修改2016/12/8
       * 1，这里增加了一个to
       * 2，这里隐掉了file一项，有了这一项，当spark发送文件给自己的web端时
       * spark端会出现错误：发生一个错误，连接被关闭。
       * 具体原因不知，协议里面也没有提及。
       */
      var to = stanza.getAttribute('to');
      var iq = $iq({type: 'result', to: from, from: to, id: id})
        .c('si', {xmlns: Strophe.NS.SI}) // ,id: sid
        //.c('file', {xmlns: Strophe.NS.SI_FILE_TRANSFER}).up()
        .c('feature', {xmlns: Strophe.NS.FEATURE_NEG})
        .c('x', {xmlns: 'jabber:x:data', type: 'submit'})
        .c('field', {'var': 'stream-method'});

      // check for In-Band Bytestream plugin
      // and IBB accepted
      if (Object.hasOwnProperty.call(this._c, 'ibb') &&
        inVals(stanza, Strophe.NS.IBB)
      ) iq.c('value').t(Strophe.NS.IBB);

      this._send(iq, noop, noop);

      var fileEle = stanza.querySelector('si>file');
      var filename = fileEle.getAttribute('name');
      var size = fileEle.getAttribute('size');
      var mime = stanza.getElementsByTagName('si')[0].getAttribute('mime-type');

      // callback message
      if (typeof this._cb === 'function') {
        this._cb(from, sid, filename, size, mime);
      }
      return true;
    },

    /**
     * 上面receive接受文件是不用经过用户同意，直接接受的。
     * 这里自定义了两个方法
     * _receive_1 : 接收到si发送文件请求，将请求通过回调通知界面，
     * 也把_receive_2作为回调的参数传上去
     * _receive_2 : 根据界面选择的结果，做出接受还是不接受的处理。
     */
    _receive_1: function (stanza) {
      XoW.logger.ms('si-filetransfer', '_receive_1 ');
      var from = stanza.getAttribute('from');
      var to = stanza.getAttribute('to');
      var id = stanza.getAttribute('id');
      var sid = stanza.getElementsByTagName('si')[0].getAttribute('id');
      var fileEle = stanza.querySelector('si>file');
      var filename = fileEle.getAttribute('name');
      var size = fileEle.getAttribute('size');
      var mime = stanza.getElementsByTagName('si')[0].getAttribute('mime-type');
      XoW.logger.p({from: from, to: to, id: id, sid: sid, name: filename, size: size, mime: mime});
      var params = {
        from: from,
        to: to,
        id: id,
        sid: sid,
        filename: filename,
        size: size,
        mime: mime
      };
      // callback message
      if (typeof this._cb === 'function') {
        // this._cb(params, this._receive_2.bind(this));
        this._cb(params);
      }
      XoW.logger.me('si-filetransfer', ' _receive_1');
      return true;
    },
    /**
     * @param from 发送者
     * @param to 接收者
     */
    _receive_2: function (isReceive, from, to, sid, id) {
      XoW.logger.ms('si-filetransfer', '_receive_2 ');

      // 默认拒接
      var iq = $iq({type: 'error', to: to, from: from, id: id})
        .c('error', {type: 'MODIFY', code: '406', condition: 'not-acceptable'});
      // 如果isReceive为true 表示接受
      if (isReceive) {
        iq = $iq({type: 'result', to: to, from: from, id: id})
          .c('si', {xmlns: Strophe.NS.SI}) // ,id: sid
          .c('feature', {xmlns: Strophe.NS.FEATURE_NEG})
          .c('x', {xmlns: 'jabber:x:data', type: 'submit'})
          .c('field', {'var': 'stream-method'})
          .c('value').t(Strophe.NS.IBB);
      }
      this._send(iq, noop, noop);

      XoW.logger.me('si-filetransfer', '_receive_2 ');
    },
    /*
      <iq xmlns="jabber:client"
        	id="filetransfer_32a6be5de1779"
      		to="lxy@user-20160421db/a2rhen1cem"
       		from="lxy3@user-20160421db/Spark"
      		type="result">
      	<si xmlns="http://jabber.org/protocol/si">
      		<feature xmlns="http://jabber.org/protocol/feature-neg">
      			<x xmlns="jabber:x:data" type="submit">
      			<field var="stream-method"><value>http://jabber.org/protocol/ibb</value></field></x>
      		</feature>
      	</si>
      </iq>
     */
    _success: function (cb, stanza) {
      XoW.logger.ms('si-filetransfer', '_success()');
      var err;
      // search for ibb
      if (!inVals(stanza, Strophe.NS.IBB)) {
        err = new Error('In-Band Bytestream not supported');
      }
      var id = stanza.getAttribute('id');
//		var to = stanza.getAttribute('to');
      var from = stanza.getAttribute('from');
//		var $si = $('si', $stanza);
//		alert(stanza.getAttribute('id') + stanza.getAttribute('to'));
      cb(err, id, from);
      XoW.logger.me('si-filetransfer', '_success()');
    },

    _fail: function (cb, stanza) {
      XoW.logger.ms('si-filetransfer', '_fail()');
      // mod by cy [20180425]
      // var err = 'timed out';
      // if (stanza) err = stanza;
      // cb(new Error(err));
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
      //var id = stanza.getAttribute('id');
      //var from = stanza.getAttribute('from');
      cb(err);
      XoW.logger.me('si-filetransfer', '_fail()');
    },

    _send: function (iq, success, fail) {
      this._c.sendIQ(iq, success, fail, 60 * 1000);
    },
    send: function (id, to, sid, filename, size, mime, cb) {
      // check for In-Band Bytestream plugin
      if (!Object.hasOwnProperty.call(this._c, 'ibb')) {
        Strophe.warn('The In-Band Bytestream plugin is required.');
        return;
      }
      var iq = $iq({
        type: 'set',
        to: to,
        id: id
      }).c('si', {
        xmlns: Strophe.NS.SI,
        id: sid,
        profile: Strophe.NS.SI_FILE_TRANSFER,
        'mime-type': mime
      }).c('file', {
        xmlns: Strophe.NS.SI_FILE_TRANSFER,
        name: filename,
        size: size
      }).up().c('feature', {
        xmlns: Strophe.NS.FEATURE_NEG
      }).c('x', {
        xmlns: 'jabber:x:data',
        type: 'form'
      }).c('field', {
        'var': 'stream-method',
        type: 'list-single'
      }).c('option')
        .c('value')
        .t(Strophe.NS.IBB);

      this._send(iq,
        this._success.bind(this, cb),
        this._fail.bind(this, cb)
      );
    },

    // cancel by sender begin transfer (self designed protocol)
    //> 需要openfire支持转发才行的，故服务端也需要开发
    cancel: function (id, to, sid, cb) {
      XoW.logger.ms('si-filetransfer', 'cancel() ');
      var iq = $iq({type: 'set', to: to, id: id})
        .c('si', {
          xmlns: Strophe.NS.SI,
          id: sid,
          profile: Strophe.NS.SI_FILE_TRANSFER
        })
        .c('error', {type: 'CANCEL', code: '410'})
        .c('not-proceed', {xmlns: XoW.NS.FW_FILESI});
      this._send(iq,
        this._success.bind(this, cb),
        this._fail.bind(this, cb)
      );
      XoW.logger.me('si-filetransfer', 'cancel()');
    },

    addFileHandler: function (fn) {
      this._cb = fn;
    }
  });

}());