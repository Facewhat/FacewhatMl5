/*global Strophe $iq $ */
/*

  (c) 2013 - Arlo Breault <arlolra@gmail.com>
  Freely distributed under the MPL v2.0 license.

  File: strophe.si-filetransfer.js
  XEP-0096: SI File Transfer
  http://xmpp.org/extensions/xep-0096.html

*/

;(function () {
  "use strict";

  function noop() {}
  
  function inVals(stanza, ns) {
    var ok = false;
    var $mthds = $('si feature x field[var="stream-method"] value', stanza);
    $mthds.each(function (i, m) {
      if ($(m).text() === ns) ok = true;
    });
    return ok;
  }

  Strophe.addConnectionPlugin('si_filetransfer', {
    
    _c: null,
    _cb: null,

    init: function (c) {  

      this._c = c;

      Strophe.addNamespace('SI', 'http://jabber.org/protocol/si');
      Strophe.addNamespace('SI_FILE_TRANSFER',
        Strophe.NS.SI + '/profile/file-transfer');
      Strophe.addNamespace('FEATURE_NEG',
        'http://jabber.org/protocol/feature-neg');

      // c.addHandler(this._receive.bind(this), Strophe.NS.SI, 'iq', 'set');
      // 改用自己的
      c.addHandler(this._receive_1.bind(this), Strophe.NS.SI, 'iq', 'set');

    },

    /**
     * 这种是不需要点击同意就直接接受文件（它直接返回了iq-result），
     * 和spark不同，要进行修改
     */
    _receive: function (m) {

      var $m = $(m);
      var from = $m.attr('from');
      var id = $m.attr('id');
      var sid = $('si', $m).attr('id');

      
//      var iq = $iq({
//        type: 'result',
//        to: from,
//        id: id
//      }).c('si', {
//        xmlns: Strophe.NS.SI,
//        id: sid
//      }).c('file', {
//        xmlns: Strophe.NS.SI_FILE_TRANSFER
//      }).up().c('feature', {
//        xmlns: Strophe.NS.FEATURE_NEG  
//      }).c('x', {
//        xmlns: 'jabber:x:data',
//        type: 'submit'
//      }).c('field', {
//        'var': 'stream-method'
//      });
      	/* 林兴洋修改2016/12/8
      	 * 1，这里增加了一个to
      	 * 2，这里隐掉了file一项，有了这一项，当spark发送文件给自己的web端时
      	 * spark端会出现错误：发生一个错误，连接被关闭。
      	 * 具体原因不知，协议里面也没有提及。
      	 */
      	var to = $m.attr('to');
  	    var iq = $iq({type: 'result', to: from, from : to, id: id})
			.c('si', {xmlns: Strophe.NS.SI}) // ,id: sid
			//.c('file', {xmlns: Strophe.NS.SI_FILE_TRANSFER}).up()
			.c('feature', {xmlns: Strophe.NS.FEATURE_NEG  })
			.c('x', {xmlns: 'jabber:x:data',type: 'submit'})
			.c('field', {'var': 'stream-method'});

      // check for In-Band Bytestream plugin
      // and IBB accepted
      if ( Object.hasOwnProperty.call(this._c, 'ibb') &&
           inVals(m, Strophe.NS.IBB)
      ) iq.c('value').t(Strophe.NS.IBB);
      
      
      
      this._send(iq, noop, noop); 

      var $file = $('file', $m);
      var filename = $file.attr('name');
      var size = $file.attr('size'); 
      var mime = $('si', $m).attr('mime-type');

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
    _receive_1 : function(m) {
    	XoW.logger.ms("【si-filetransfer】_receive_1 ");
    	 var $m = $(m);
         var from = $m.attr('from');
         var to = $m.attr('to');
         var id = $m.attr('id');
         var sid = $('si', $m).attr('id');
         var $file = $('file', $m);
         var filename = $file.attr('name');
         var size = $file.attr('size'); 
         var mime = $('si', $m).attr('mime-type');

         XoW.logger.p({from : from, to : to, id : id, sid : sid, filename : filename, size : size, mime : mime});
         var params = {
        	from : from, 
        	to : to, 
        	id : id, 
        	sid : sid, 
        	filename : filename, 
        	size : size, 
        	mime : mime
         };
         // 需要判断是否支持IBB
      // check for In-Band Bytestream plugin
         // and IBB accepted这个东西可能要移到上面 _receive_1里面去判断
 		//if ( Object.hasOwnProperty.call(this._c, 'ibb') &&
 	     //         inVals(m, Strophe.NS.IBB)
 	      //   ) 
         
         // callback message
         if (typeof this._cb === 'function') {
           this._cb(params, this._receive_2.bind(this));
         }

         XoW.logger.me("【si-filetransfer】 _receive_1");
         return true;
    },
    /**
     * 
     * @param from 发送者
     * @param to 接收者
     */
    _receive_2 : function(isReceive, from, sid, to, id) {
    	XoW.logger.ms("【si-filetransfer】_receive_2 ");
    	
    	// 默认拒接
    	var iq =  $iq({type: 'error', to : to , from : from, id: id})
					.c('error', {type : "MODIFY", code : "406", condition : "not-acceptable"});
    	// 如果isReceive为true 表示接受
    	if(isReceive) { 
    		iq = $iq({type: 'result', to : to , from : from, id: id})
		    		.c('si', {xmlns: Strophe.NS.SI}) // ,id: sid
		    		.c('feature', {xmlns: Strophe.NS.FEATURE_NEG  })
		    		.c('x', {xmlns: 'jabber:x:data',type: 'submit'})
		    		.c('field', {'var': 'stream-method'})
		    		.c('value').t(Strophe.NS.IBB);
    	}
    	this._send(iq, noop, noop);
    	
    	XoW.logger.me("【si-filetransfer】_receive_2 ");
    },
    
    

    _success: function (cb, stanza) {
    	XoW.logger.ms("【si-filetransfer】_success ");
    	var err;

		// search for ibb
		if (!inVals(stanza, Strophe.NS.IBB))
		    err = new Error('In-Band Bytestream not supported');
		// <iq xmlns="jabber:client" 
		//  	id="filetransfer_32a6be5de1779" 
		//		to="lxy@user-20160421db/a2rhen1cem" 
		// 		from="lxy3@user-20160421db/Spark" 
		//		type="result">
		//	<si xmlns="http://jabber.org/protocol/si">
		//		<feature xmlns="http://jabber.org/protocol/feature-neg">
		//			<x xmlns="jabber:x:data" type="submit">
		//			<field var="stream-method"><value>http://jabber.org/protocol/ibb</value></field></x>
		//		</feature>
		//	</si>
		// </iq>
		var $stanza = $(stanza);
		var id = $stanza.attr('id');
//		var to = $stanza.attr('to');
		var from = $stanza.attr('from');
//		var $si = $('si', $stanza);
//		alert($stanza.attr('id') + $stanza.attr('to'));
		cb(err, id, from);
		XoW.logger.me("【si-filetransfer】_success ");
    },

    _fail: function (cb, stanza) {
    	XoW.logger.ms("【si-filetransfer】_fail ");
      var err = 'timed out';
      if (stanza) err = stanza;
      cb(new Error(err));
      XoW.logger.me("【si-filetransfer】_fail ");
    },

    _send: function (iq, success, fail) {
      this._c.sendIQ(iq, success, fail, 60 * 1000);
    },

    // 此处多了一个ID，因为我要用我传进来的ID
//    send: function (to, sid, filename, size, mime, cb) {
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

    addFileHandler: function (fn) {
      this._cb = fn;
    }

  });

}());