/**
 * Created by cy on 2019/1/7.
 */

(function (factory) {
  factory(XoW, Strophe);
}(function (XoW, Strophe) {
  'use strict';
  /**
   * 档案组件，用户搜索漫游消息
   * todo:协议封装、协议验证、状态机功能需要下沉至strophe，作为strophe的插件
   * 群聊记录请参考V1.0版本实现
   * @param pBus
   * @constructor
   */
  XoW.ArchiveManager = function(pBus) {
    // region Fields
    var _this = this;
    var _gblMgr = null;
    var _PAGE_SIZE = 10; // 默认一页大小
    this.classInfo = 'ArchiveManager'; // 公有变量
    // endregion Fields

    // region Private Methods
    var _init = function (pGlobalMgr) {
      XoW.logger.ms(_this.classInfo, '_init()');
      _gblMgr = pGlobalMgr;
      XoW.logger.me(_this.classInfo, '_init()');
    };

    var _cbError = function (stanza) {
      XoW.logger.ms(_this.classInfo, '_cbError()');
      _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ERROR, stanza);
    };

    var _cbSearchMessage = function (stanza, successCb) {
      XoW.logger.ms(_this.classInfo, '_cbGetMsgArchive()');
      var $stanza = $(stanza);
      // 将要作为回调的参数。
      var params = {
        stanza : stanza,// 原始的节（报文）
        set : {}, 		// 结果中的set
        archive : [], 	// 所有消息
        condition : {}, // 为了下次再查使用
      };
      // params.condition = condition;
      // 对节（报文）进行解析
      $('facewhatchat', $stanza).children().each(function(index, item) {
        var $item = $(item);
        if($item.is('from')) {
          // 对方发送给我的消息
          XoW.logger.d(this.classInfo + " 对方发给我的，时间 " + XoW.utils.getFromatDatetimeFromNS($item.attr('secs')) + "  内容：" + $item.text());
          params.archive.push({
            type : 'from',
            secs : XoW.utils.getFromatDatetimeFromNS($item.attr('secs')),
            body : $item.text(),
          });
        } else if($item.is('to')) {
          // 我发送给对方的消息
          XoW.logger.d(this.classInfo + " 我发给对方的，时间 " + XoW.utils.getFromatDatetimeFromNS($item.attr('secs')) + "  内容：" + $item.text());
          params.archive.push({
            type : 'to',
            secs : XoW.utils.getFromatDatetimeFromNS($item.attr('secs')),
            body : $item.text(),
          });
        } else if($item.is('set')) {
          // 本次搜索完成后，分页的一些信息
          params.set = {
            firstIndex : $item.find('first').text(),
            firstIndexAttr : $item.find('first').attr('index'),
            lastIndex : $item.find('last').text(),
            count : $item.find('count').text()
          };
        }
      });
      if(successCb) {
        // 如果存在成功回调，则调用该回调，并将参数传给回调。
        successCb(params);
      }
      XoW.logger.me(_this.classInfo, '_cbGetMsgArchive()');
    };
    // endregion Private Methods

    // region Public Methods
    /**
     * 获取与好友的历史消息
     * @param pIQ 		拼装完成的节
     * @param pCond 下次点击首页/上一页/下一页/尾页时作为搜索条件
     * @param pCbSuc 获取历史消息成功时的回调函数
     * @param errorCb	获取历史消息失败时的回调函数
     */
    this.searchMessage = function(pIQ, pCbSuc, pTimeout) {
      XoW.logger.ms(_this.classInfo, 'searchMessage()');
      _gblMgr.getConnMgr().sendIQ(pIQ, function(pStanza) {
          _cbSearchMessage(pStanza, pCbSuc);
      },
        _cbError.bind(_this), pTimeout);
      XoW.logger.me(_this.classInfo, 'searchMessage()');
    }

    /**
     * 请求与好友的历史消息，当前页的上一页。
     * @param pageSize 	每页历史消息数量
     * @param ownerJid 	自己的JID
     * @param withJid 	好友的JID
     * @param keyWord	搜索用，内容包含
     * @param startDate	搜索用，开始日期
     * @param endDate	搜索用，结束日期
     * @param before	在那条历史消息之前
     * @param successCb	获取历史消息成功时的回调函数
     * @param errorCb	获取历史消息失败时的回调函数
     */
    this.prevPage = function(pageSize, ownerJid, withJid, keyWord, startDate, endDate, before, successCb, pTimeout) {
      XoW.logger.ms(_this.classInfo, 'prevPage()');
      if(!pageSize) {
        pageSize = _PAGE_SIZE;
      }
      if(!ownerJid || !withJid) {
        XoW.logger.e('Null jid, return.');
        return;
      }
      // 对开始日期和结束日期的格式化处理
      var d1 = null;
      if('' !== startDate) {
        d1 = XoW.utils.getFromatDatetime2(startDate); // 4.4
      }
      var d2 = null;
      if('' !== endDate) {
        d2 = XoW.utils.getFromatDatetime2(endDate); // 4.5
      }
      // 利用Strophe.Builder提供的方法，拼装要发送的报文。
      var iq = $iq({
        type : 'get',
        id : XoW.utils.getUniqueId("facewhatretrieve"),
        from : ownerJid
      }).c('facewhatretrieve', {
        xmlns : XoW.NS.ARCHIVE,	// 历史消息的命名空间
        'with' : withJid,
        'start' : d1,
        'end' : d2,
        'keyword' : keyWord
      }).c('set', {
        xmlns : 'http://jabber.org/protocol/rsm' // 结果集的命名空间
      }).c('max').t(pageSize)
        .up().c('before').t(before);

      this.searchMessage(iq, successCb, pTimeout);
      XoW.logger.me(_this.classInfo, 'prevPage()');
    }

    this.nextPage = function(pageSize, ownerJid, withJid, keyWord, startDate, endDate, after, successCb, pTimeout) {
      XoW.logger.ms(_this.classInfo, 'nextPage()');
      if(!pageSize) {
        pageSize = _PAGE_SIZE;
      }
      if(!ownerJid || !withJid) {
        XoW.logger.e('Null jid, return.');
        return;
      }

      var d1 = null;
      if('' !== startDate) {
        d1 = XoW.utils.getFromatDatetime2(startDate); // 4.4
      }
      var d2 = null;
      if('' !== endDate) {
        d2 = XoW.utils.getFromatDatetime2(endDate); // 4.5
      }

      var iq = $iq({
        type : 'get',
        id : XoW.utils.getUniqueId("facewhatretrieve"),
        from : ownerJid,
      }).c('facewhatretrieve', {
        xmlns : XoW.NS.ARCHIVE,
        'with' : withJid,
        'start' : d1,
        'end' : d2,
        'keyword' : keyWord
      }).c('set', {
        xmlns : 'http://jabber.org/protocol/rsm'
      }).c('max').t(pageSize)
        .up().c('after').t(after);

      this.searchMessage(iq, successCb, pTimeout);
      XoW.logger.me(_this.classInfo, 'nextPage');
    }

    this.firstPage = function(pageSize, ownerJid, withJid, keyWord, startDate, endDate, successCb, pTimeout) {
      XoW.logger.ms(_this.classInfo, 'firstPage');
      this.prevPage(pageSize, ownerJid, withJid, keyWord, startDate, endDate, null, successCb, pTimeout);
      XoW.logger.me(_this.classInfo, 'firstPage');
    }

    this.lastPage = function(pageSize, count, ownerJid, withJid, keyWord, startDate, endDate, successCb, pTimeout) {
      XoW.logger.ms(_this.classInfo, 'lastPage');
      var pageCount = count % pageSize === 0 ? count / pageSize : Math.floor(count / pageSize) + 1;
      var after =  (pageCount - 1) * pageSize - 1;
      this.nextPage(pageSize, ownerJid, withJid, keyWord, startDate, endDate, after, successCb, pTimeout);
      XoW.logger.me(_this.classInfo, 'lastPage');
    }
    // endregion Public Methods

    // constructor
    _init(pBus);
  };
  return XoW;
}));