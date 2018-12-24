/**
 * 编码规范：回调命名 on+名词（宾语）+动词（带时态） [20180503]
 */
(function (factory) {
  return factory(XoW);
}(function (XoW) {
  XoW.FileManager = function (globalManager) {
    //region Fields
    var _this = this;
    var _gblMgr = null;
    _this.classInfo = 'FileManager';
    //endregion Fields

    //region Public Methods
    this.sendFile = function (pFileName, pFileSize, pFileType, toFullJid, pContent) {
      XoW.logger.ms(_this.classInfo, 'sendFile({0},{1})'.f(pFileName, toFullJid));

      // region create file instance
      var file = new XoW.File(toFullJid);
      file.username = _gblMgr.getCurrentUser().username ? _gblMgr.getCurrentUser().username : '访客';
      // file.avatar = _gblMgr.getCurrentUser().avatar;
      file.id = XoW.utils.getNodeFromJid(toFullJid);
      file.mine = true;

      file.name = pFileName;
      file.size = pFileSize;
      file.base64 = pContent.substring(pContent.indexOf(',') + 1);
      if (null == pFileType || '' == pFileType) {
        // 如果没有类型则默认设置这个类型。
        file.mime = 'application/octet-stream';
      } else {
        file.mime = pFileType;
      }
      file.from = _gblMgr.getCurrentUser().jid;
      file.to = toFullJid;
      file.isRead = false;
      file.type = 'friend';// 临时

      file.sid = XoW.utils.getUniqueId('jsi');
      //file.sid = XoW.utils.getUniqueId('file');
      file.status = XoW.FileReceiveState.UNACCEPTED;
      file.seq = -1;
      var cachedAvatar = file.avatar;
      file.avatar = null;

      var eventName;
      if(file.getIsImage()) {
        file.content = file.base64;
        file.content = 'imgEx[{0}]'.f(JSON.stringify(file)); // exclude base64
        file.content = file.content.replace('"content":', '"base64":');
        eventName = XoW.SERVICE_EVENT.CHAT_FILE_TRANS_REQ_SUC;
      } else {
        file.content = 'fileEx(www.facewhat.com/file33)[{0}]'.f(JSON.stringify(file));
        eventName = XoW.SERVICE_EVENT.CHAT_IMAGE_TRANS_REQ_SUC;
      }
      file.avatar = cachedAvatar;
      // endregion create file instance

      var chat = _gblMgr.getChatMgr().getOrCreateChatByJid(file.to);
      chat.addMessage(file);

      // show the file selected and which is waiting for negotiation
      _gblMgr.getHandlerMgr().triggerHandler(eventName, file);

      // initiate stream and send file content that depends on negotiation result
      _gblMgr.getConnMgr().sendFileSi(null, file.to, file.sid,
        file.name, file.size, file.mime,
        _onSiResultRcv.bind(_this, file));
      XoW.logger.me(_this.classInfo, 'sendFile()');
    };

    /**
     * deal with file transform request
     * @param doReceive
     * @param pSid
     * @param pJid remote peer
     */
    this.dealSiReq = function (doReceive, pSid, pJid) {
      XoW.logger.ms(_this.classInfo, 'dealSiReq({0}, {1})'.f(doReceive, pSid));
      var chat = _gblMgr.getChatMgr().getChatByJid(pJid);
      if (null == chat) {
        XoW.logger.e('There is no chat of jid {0}, return.'.f(pJid));
        _triggerFileErr(pSid, pJid, '该会话已过期.');
        return;
      }
      var file = chat.getFileBySid(pSid);
      if (null == file) {
        XoW.logger.e('There is no file of sid {0}, return.'.f(pSid));
        _triggerFileErr(pSid, pJid, '该文件已不存在.');
        return;
      }

      var status = XoW.FileReceiveState.UNACCEPTED;
      if (doReceive) {
        status = XoW.FileReceiveState.ACCEPTED;
      } else {
        status = XoW.FileReceiveState.REJECTED;
      }

      if (!_changeFileStatus(file, status)) {
        XoW.logger.e('Failed to change file status to {0}, return.'.f(status));
        _changeFileStatus(file, XoW.FileReceiveState.ERROR);
        return;
      }
      _gblMgr.getConnMgr().sendFileSiResult(doReceive, file.to, file.from, file.sid, file.iqid);
      XoW.logger.me(_this.classInfo, 'dealSiReq()');
    };

    //文件下载
    this.downLoadFile = function (pSid, pJid) {
      XoW.logger.ms(this.classInfo, 'downLoadFile({0})'.f(pSid));
      //download("data:" + file.mime + ";base64,"+file.data, file.filename, file.mime);

      var chat = _gblMgr.getChatMgr().getChatByJid(pJid);
      if (null == chat) {
        XoW.logger.e('There is no chat of jid {0}, return.'.f(pJid));
        _triggerFileErr(pSid, pJid, '该会话已过期.');
        return;
      }
      var file = chat.getFileBySid(pSid);
      if (null == file) {
        XoW.logger.e('There is no file of sid {0}, return.'.f(pSid));
        _triggerFileErr(pSid, pJid, '该文件已不存在.');
        return;
      }

      //处理doc文件类型的解码失败
      if (file.mime == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        file.mime = 'text/plain';
      download("data:" + file.mime + ";base64," + file.base64, file.name, file.mime);

      XoW.logger.me(this.classInfo, 'downLoadFile()');
    };

    /**
     * 终止文件传输
     * @param pJid
     * @param pSid
     */
    this.stopFileTrans = function (pSid, pJid) {
      XoW.logger.ms(_this.classInfo, 'stopFileTrans({0}, {1})'.f(pSid, pJid));

      var chat = _gblMgr.getChatMgr().getChatByJid(pJid);
      if (null == chat) {
        XoW.logger.e('There is no chat of jid {0}, return.'.f(pJid));
        _triggerFileErr(pSid, pJid, '该会话已过期.');
        return;
      }
      var file = chat.getFileBySid(pSid);
      if (null == file) {
        XoW.logger.e('There is no file of sid {0}, return.'.f(pSid));
        _triggerFileErr(pSid, pJid, '该文件已不存在.');
        return;
      }
      // pJid should be full jid
      if (file.mine) {
        pJid = file.to;
      } else {
        pJid = file.from;
      }

      _changeFileStatus(file, XoW.FileReceiveState.LOCAL_STOPPED);
      _gblMgr.getConnMgr().closeIBB(pJid, pSid, _onIbbClosed.bind(_this, file));
      XoW.logger.me(_this.classInfo, 'stopFileTrans()');
    };

    this.cancelFile = function (pSid, pJid) {
      XoW.logger.ms(_this.classInfo, 'cancelFile({0}, {1})'.f(pSid, pJid));

      var chat = _gblMgr.getChatMgr().getChatByJid(pJid);
      if (null == chat) {
        XoW.logger.e('There is no chat of jid {0}, return.'.f(pJid));
        _triggerFileErr(pSid, pJid, '该会话已过期.');
        return;
      }
      var file = chat.getFileBySid(pSid);
      if (null == file) {
        XoW.logger.e('There is no file of sid {0}, return.'.f(pSid));
        _triggerFileErr(pSid, pJid, '该文件已不存在.');
        return;
      }

      _gblMgr.getConnMgr().cancelFileSi(null, pJid, pSid, _onSiCanceled.bind(_this, file));
      XoW.logger.me(_this.classInfo, 'cancelFile()');
    };
    //endregion Public Methods

    // region Private Methods
    var _init = function () {
      XoW.logger.ms(_this.classInfo, '_init()');
      _gblMgr = globalManager;
      _gblMgr.getConnMgr().addReceiveFileSiHandler(_onSiReqRcv.bind(_this));
      _gblMgr.getConnMgr().addIBBHandler(_onIBBRcv.bind(_this));
      XoW.logger.me(_this.classInfo, '_init()');
    };
    var _changeFileStatus = function (pFile, pNewState) {
      XoW.logger.ms(_this.classInfo,
        '_changeFileStatus({0}, {1})'.f(pFile.sid, pNewState));
      if (!pFile.setState(pNewState)) {
        XoW.logger.w('Failed to update file state, return.');
        return false;
      }
      _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.CHAT_FILE_STATE_CHANGED, pFile);
      return true;
    };
    var _triggerFileErr = function (pSid, pRemoteJid, pErrMsg, pType) {
      XoW.logger.ms(_this.classInfo, '_triggerFileErr()');
      pType = pType || 'friend';
      var file = new XoW.File();
      file.id = XoW.utils.getNodeFromJid(pRemoteJid);
      file.sid = pSid;
      file.type = pType;
      file.status = XoW.FileReceiveState.ERROR;
      file.errorMsg = pErrMsg;
      _gblMgr.getHandlerMgr().triggerHandler(XoW.VIEW_EVENT.V_FILE_OVERDUE, file);
      XoW.logger.me(_this.classInfo, '_triggerFileErr()');
    }
    // endregion Private Methods

    // region Private Methods -- local start a transform
    /**
     * Negotiation callback for Stream initiation of file transform
     * when local end start a si.
     * todo 确认一下是否IqId我们把它固定住，整个会话过程中不会改变
     * @param err
     * @private
     */
    var _onSiResultRcv = function (pFile, err) {
      XoW.logger.ms(_this.classInfo, '_onSiResultRcv({0})'.f(pFile.sid));
      if (err) {
        XoW.logger.w('协商失败，对方不接受文件{0}, 错误是{1} {2}'.f(pFile.sid, err.name, err.message));
        _changeFileStatus(pFile, XoW.FileReceiveState.REJECTED);
        return;
      }
      XoW.logger.d('the remote accept the file {0}, then start to transfer it.'.f(pFile.sid));
      if(_changeFileStatus(pFile, XoW.FileReceiveState.ACCEPTED)) {
        _gblMgr.getConnMgr().openIBB(pFile.to, pFile.sid,
          pFile.blockSize, _onIbbOpen.bind(_this, pFile));
      }
      XoW.logger.me(_this.classInfo, '_onSiResultRcv({0})'.f(pFile.sid));
    };

    /**
     * open的回调，如果err为空，则说明open成功，可以继续发送数据了。
     * @param err 错误
     */
    var _onIbbOpen = function  (pFile, err) {
      XoW.logger.ms(_this.classInfo, '_ibbOpenCb({0})'.f(pFile.sid));
      if (err) {
        XoW.logger.e('Failed to open IBB, cause' + err.message);
        _changeFileStatus(pFile, XoW.FileReceiveState.ERROR);
        return;
      }
      if (_changeFileStatus(pFile, XoW.FileReceiveState.OPEN)) {
        pFile.seq = 0;
        _sendIBBData(pFile);
      }
      XoW.logger.me(this.classInfo, '_ibbOpenCb({0})'.f(pFile.sid));
    };

    var _onIbbClosed = function  (pFile, err) {
      XoW.logger.ms(_this.classInfo, '_ibbCloseCb({0})'.f(pFile.sid));
      if (err) {
        XoW.logger.e('Failed to close IBB, cause' + err.message);
        _changeFileStatus(pFile, XoW.FileReceiveState.ERROR);
        return;
      }
      _changeFileStatus(pFile, XoW.FileReceiveState.CLOSED); // 如果已被stop则状态不改
      XoW.logger.me(this.classInfo, '_ibbCloseCb({0})'.f(pFile.sid));
    };

    /**
     * todo 有时候传完了但是spark报错，需要抓包进行分析
     * @param pCopyedFile
     * @param err
     * @private
     */
    var _onIbbDataSent = function (pFile, err) {
      XoW.logger.ms(_this.classInfo, '_ibbSendDataCb({0}'.f(pFile.sid));
      if (XoW.FileReceiveState.CLOSED == pFile.status) {
        XoW.logger.w('IBB has been closed, return.');
        return;
      }
      if (err) {
        XoW.logger.e('IBB Failed to trans data, cause ' + err.message);
        _changeFileStatus(pFile, XoW.FileReceiveState.ERROR);
        // todo re-sent or close it
        _gblMgr.getConnMgr().closeIBB(pFile.to, pFile.sid, _onIbbClosed.bind(_this, pFile));
        return;
      }
      // show progress
      if(pFile.getReceivedPercent() % 5 == 0) {
        if(!_changeFileStatus(pFile, XoW.FileReceiveState.RECEIVING)) {
         return;
        }
      }
      // 不能放在while循环中循环发送数据，不然回调没啥意义
      pFile.seq = pFile.seq + 1;
      _sendIBBData(pFile);
      XoW.logger.me(_this.classInfo, '_ibbSendDataCb()');
    }

    var _sendIBBData = function (pFile) {
      XoW.logger.ms(_this.classInfo, '_sendIBBData({0},{1})'.f(pFile.sid, pFile.seq));
      var fileSize = pFile.base64.length; // 1 byte per char
      // original seq is 0
      if(pFile.seq * pFile.blockSize >= fileSize) {
        _gblMgr.getConnMgr().closeIBB(pFile.to, pFile.sid, _onIbbClosed.bind(_this, pFile));
        return;
      }
      // 左闭右开 0<= x < 4096
      var dataSeq = pFile.base64.substring(pFile.blockSize * (pFile.seq), (pFile.seq + 1) * pFile.blockSize);
      _gblMgr.getConnMgr().sendDataByIBB(pFile.to, pFile.sid, pFile.seq,
        dataSeq, _onIbbDataSent.bind(_this, pFile));
      XoW.logger.me(_this.classInfo, '_sendIBBData()');
    };

    var _onSiCanceled = function  (pFile, err) {
      XoW.logger.ms(_this.classInfo, '_onSiCanceled({0})'.f(pFile.sid));
      if (err) {
        if(err.name == '405' || err.name == '410') {
          pFile.errorMsg = '服务端不支持该操作';
        }
        XoW.logger.e('Failed to cancel si, cause ' + err.message);
        _changeFileStatus(pFile, XoW.FileReceiveState.ERROR);
        return;
      }
      _changeFileStatus(pFile, XoW.FileReceiveState.CANCELED);
      XoW.logger.me(this.classInfo, '_onSiCanceled()');
    };
    // endregion Private Methods -- local start a transform

    // region Private Methods -- remote start a transform
    /**
     * Receive a si request.
     * @param params
     * @private
     */
    var _onSiReqRcv = function (params) {
      XoW.logger.ms(_this.classInfo, '_onSiRcv({0})'.f(params.mime));
      var theFile = new XoW.File(params.to);
      // theFile.sid = params.sid;
      theFile.mine = false;
      theFile.from = params.from;
      theFile.sid = params.sid;
      theFile.iqid = params.id;
      theFile.name = params.filename;
      theFile.size = params.size;
      if (null == params.mime || '' == params.mime) {
        theFile.mime = 'application/octet-stream';
      } else {
        theFile.mime = params.mime;
      }
      theFile.isRead = false;
      theFile.status = XoW.FileReceiveState.UNACCEPTED;
      if (theFile.getIsImage()) {
        // theFile.content = 'img[{0}]'.f(XoW.DefaultImage.TransFile_IMAGE);
      } else {
        theFile.content = 'fileEx(www.facewhat.com/file33)[{0}]'.f(JSON.stringify(theFile));
      }
      // accept automatic when it is an image
      if (theFile.getIsImage()) {
        // 完全收到后直接再显示
        _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.CHAT_IMAGE_TRANS_REQ_RCV, theFile);
        _gblMgr.getConnMgr().sendFileSiResult(true, theFile.to, theFile.from, theFile.sid, theFile.iqid);
      } else {
        _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.CHAT_FILE_TRANS_REQ_RCV, theFile);
      }
      XoW.logger.me(_this.classInfo, '_onSiRcv()');
    };

    var _onIBBRcv = function (type, pJid, pSid, data, seq, blocksize) {
      XoW.logger.ms(_this.classInfo, '_onIBBRcv()');
      var chat = _gblMgr.getChatMgr().getChatByJid(pJid); // todo 本来不允许直接依赖ChatMgr的
      if (null == chat) {
        XoW.logger.e('There is no chat of jid {0}, return.'.f(pJid));
        _triggerFileErr(pSid, pJid, '该会话已过期.');
        return;
      }
      var file = chat.getFileBySid(pSid);
      if (null == file) {
        XoW.logger.e('There is no file of sid {0}, return.'.f(pSid));
        _triggerFileErr(pSid, pJid, '该文件已不存在.');
        return;
      }

      switch (type) {
        case 'open':
          XoW.logger.d(_this.classInfo + 'receive ibb open of sid ' + pSid);
          // 插件会回复 同意open。我只要告诉界面已经Open了，
          // 还是界面主动来监听？当然是
          // from, sid, blocksize有值
          // file.setReceiveState(XoW.FileReceiveState.OPEN);
          file.blockSize = blocksize;
          _changeFileStatus(file, XoW.FileReceiveState.OPEN);
          break;
        case 'data':
          XoW.logger.d(_this.classInfo + 'receive ibb data of sid ' + pSid);
          // 都有值
          if (null != file) {
            var fileSeq = file.seq;
            fileSeq += 1;
            if (fileSeq == seq) {
              file.appendData(data);
              file.seq = fileSeq;
              if(file.getReceivedPercent() % 5 === 0) {
                _changeFileStatus(file, XoW.FileReceiveState.RECEIVING);
              }
            } else {
              // _triggerFileErr(pSid, pJid, '文件传输错误.');
              XoW.logger.e(this.classInfo + ' seq错误，期望 :' + fileSeq + ',但是收到 :' + seq);
            }
          }
          break;
        case 'close':
          // type, from, sid有值
          // 第三次的做法：第二次这个思路应该是有bug的。应该按照   对方发送的文件大小(不是getSize而是getData().length，因为data是经过base64加密的，3个字节变成了4个字节)，
          // 对方发送文件每一块大小， 计算出对方发送文件应该有几块
          // 然后与seq相比较，这样比较正确的得到对方是不是终止了发送。
          XoW.logger.d(_this.classInfo + 'receive ibb close of sid ' + pSid);
          // spark ibb时，block Size 4096， 实验室及其实际发送base64长度5664 = ceil(4096 / 4) * 3，而家里及其发送的是4096 ？？
          // var resize = file.blockSize * (file.seq + 1);
          var resize = Math.ceil(file.blockSize * (file.seq + 1) / 4) * 3;
          var size = file.size; // 总大小
          XoW.logger.d('receive ibb close with resize {0} of size {1} ', resize, size);
          if (file.getIsImage() && resize >= size) {
            file.content = file.base64;
            file.content = 'imgEx[{0}]'.f(JSON.stringify(file)); // exclude base64
            file.content = file.content.replace('"content":', '"base64":');
            _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.CHAT_IMAGE_RCV, file);
          } else if (resize >= size) {
            _changeFileStatus(file, XoW.FileReceiveState.CLOSED);
          } else {
            _changeFileStatus(file, XoW.FileReceiveState.REMOTE_STOPPED);
          }
          break;
        default:
          throw new Error('should not be here.');
      }
      XoW.logger.me(_this.classInfo, '_onIBBRcv()');
    };
    // endregion Private Methods -- remote start a transform

    _init();
  };
  return XoW;
}));
