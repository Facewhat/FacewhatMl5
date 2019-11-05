/**
 * IBB带内文件传输的model
 */
XoW.File = function (toJid) {
  // region Fields
  var _this = this;
  // region adapt for message
  this.username = ''; // 发送者用户名
  this.avatar = XoW.DefaultImage.AVATAR_DEFAULT; // 发送者头像,每一条消息都记录一个base64串太耗存储了（layim原本记录的是地址而非值，fw存储值） todo
  this.type = XoW.MessageType.CONTACT_CHAT; // friend, group, system
  this.content = 'space holder'; // 文件概要信息，用于界面显示，fileEx(url)[thumbnail json]
  this.id = ''; // 对端ID（如果是私聊，则是用户id;如果是群聊，则是群组id）
  this.fromid = ''; // 消息的发送者id（比如群组中的某个消息发送者），可用于自动解决浏览器多窗口时的一些问题
  this.mine = false; // 是否我发送的消息，如果为true，则会显示在右方
  this.from = ''; // must be full Jid，在会话中应该是要知道其full jid的
  this.to = ''; // must be full Jid
  this.isRead = false;
  this.timestamp = ''; // 时间
  // endregion adapt for message
  this.url = '*'
  // 文件信息
  this.filename = ''; // 文件名
  this.size = ''; // actual size of the file(byte)
  this.mime = ''; // file type, get by FileReader
  // this.contentType = 'file'; // 内容类型,不使用
  this.base64 = ''; // file data，base64 coded
  // 文件传输相关
  this.sid = ''; // 协商的会话id,jsi_xxx
  this.iqid = '';  // Iq请求的Id
  this.status = XoW.FileReceiveState.UNACCEPTED; // 默认未接受
  this.seq = -1; // 默认-1，每次收到一个data时，只要seq + 1 == data 那么就说明seq是对的。
  this.blockSize = 4096; // 块大小默认4096 byte
  this.errorMsg = null;
  // 要加入已读等等信息，改的时候记住啊 16.12.16
  this.classInfo = 'File_' + _this.filename;
  // endregion Fields

	var _vatTemp;
  // region Private Methods
  var _init = function () {
    XoW.logger.ms(_this.classInfo, '_init()');
    _this.to = toJid;
    _this.timestamp =  Date.parse(new Date());
    XoW.logger.me(_this.classInfo,  '_init');
  };
  // endregion Private Methods

  // region Public Methods
  /**
   * 文件已接收的百分比
   * @returns {number}
   * @private
   */
  this.getReceivedPercent = function () {
    /**
     * 第一次做法，通过已接受data的大小得到百分比
     * size = file.getSize(); // 总大小
     * resize = Math.ceil(file.getData().length / 4) * 3; // 当前接收到的大小，因为经过base64加密，所以要/4*3
     * return Math.round(resize / size * 100)
     * 第二次做法，第一次的做法对于计算发送文件的大小不可行，因为发送文件时，他的data/size总是100%的
     * 所以用 当前的seq +1  乘以 blocksize ，得到发送的数据的大小
     * 但是因为 一个文件可能大小为  4097 那么。blocksize为4096，发送seq = 1时，
     * resize =  Math.ceil(4096 * 2 / 4 ) * 3 。大于4097了
     * 所以，如果resize > size，那么resize 就让他=size或者就知道已经到达100%了*/
    var resize = Math.ceil(_this.blockSize * (_this.seq + 1) / 4) * 3;
    var size = _this.size; // size大小不等于base64大小,故上面要有 3 / 4的概念。
    if (resize > size) resize = size;
    var percent = Math.round(resize / size * 100);
    // XoW.logger.d('resize ' + resize + ' size ' + size + ' percent ' + percent);
    return percent;
  };

  this.getIsImage = function () {
    return XoW.utils.isImageMIME(_this.mime);
  };

  this.getTypeDesc = function () {
    XoW.logger.ms(_this.classInfo, 'getTypeDesc()');
    var desc = _this.filename.substring(_this.filename.lastIndexOf('.') + 1, _this.filename.length) || '未知';
    desc += '文件';
    return desc;
  };

  this.getTrimmedName = function () {
    if (_this.filename.length > 20) {
      return _this.filename.substring(0, 20) + '...';
    }
    return _this.filename;
  };

  _this.getStatusDesc = function () {
    var map = XoW.getFileStatusDescMap();
    var descText = map.get(_this.status);
    if (_this.status === XoW.FileReceiveState.RECEIVING) {
      descText = descText.f(_this.getReceivedPercent());
    } else if (_this.status === XoW.FileReceiveState.ACCEPTED ||
      _this.status === XoW.FileReceiveState.REJECTED) {
      var who = _this.mine ?  '对方' : '您';
      descText = descText.f(who);
    } else if (_this.status === XoW.FileReceiveState.LOCAL_STOPPED) {
      var par = _this.mine ? '发送' : '接收';
      descText = descText.f(par);
    }else if (_this.status === XoW.FileReceiveState.REMOTE_STOPPED) {
      var par2 = _this.mine ? '接收' : '发送';
      descText = descText.f(par2);
    } else if (_this.status == XoW.FileReceiveState.ERROR) {
      if(_this.errorMsg) {
        return _this.errorMsg;
      }
    }
    return descText;
  };

  this.getSizeDesc = function () {
    return XoW.utils.bytesToSize(_this.size);
  }

  this.appendData = function (pData) {
    XoW.logger.ms(_this.classInfo,  'appendData()');
    _this.base64 += pData;
    XoW.logger.me(_this.classInfo,  'appendData()');
  };

  /**
   * 因为文件接收/发送状态，是不可逆的，比如当文件的状态为 receive(已接收)，那么它就不能
   * 返回 receiving（接收中）状态。
   * unreceive -> open,denyreceive（finanl）,ERROR（final）
   * open -> nomestop（final）, receiving, mestop（final）,ERROR（final）
   * receiving -> nomestop(final), receive(final), mestop(final),ERROR（final）
   * @param pNewState
   * return boolean 如果可以切换状态，return true ，否则false
   */
  this.setState = function (pNewState) {
    XoW.logger.ms(_this.classInfo, 'setState({0}, {1})'.f(_this.status, pNewState));
    var flag = false;
    if (pNewState == _this.status) {
      return true;
    } else if (XoW.FileReceiveState.UNACCEPTED == _this.status
      && ( XoW.FileReceiveState.ERROR == pNewState
      || XoW.FileReceiveState.ACCEPTED == pNewState
      || XoW.FileReceiveState.REJECTED == pNewState
      || XoW.FileReceiveState.OPEN == pNewState)
      || XoW.FileReceiveState.OVERDUE == pNewState
      || XoW.FileReceiveState.CANCELED == pNewState) {
      flag = true;
    } else if (XoW.FileReceiveState.CANCELED == _this.status
      && (XoW.FileReceiveState.ERROR == pNewState
      || XoW.FileReceiveState.OVERDUE == pNewState)) {
      flag = true;
    } else if (XoW.FileReceiveState.ACCEPTED == _this.status
      && (XoW.FileReceiveState.ERROR == pNewState
      || XoW.FileReceiveState.OPEN == pNewState
      || XoW.FileReceiveState.OVERDUE == pNewState)) {
      flag = true;
    } else if (XoW.FileReceiveState.OPEN == _this.status
      && (XoW.FileReceiveState.ERROR == pNewState
      || XoW.FileReceiveState.REMOTE_STOPPED == pNewState
      || XoW.FileReceiveState.LOCAL_STOPPED == pNewState
      || XoW.FileReceiveState.RECEIVING == pNewState
      || XoW.FileReceiveState.CLOSED == pNewState
      || XoW.FileReceiveState.OVERDUE == pNewState)) {
      // receiving由File副本设置，故传输的file本尊可以从Open跳到Closed
      flag = true;
    } else if (XoW.FileReceiveState.RECEIVING == _this.status
      && (XoW.FileReceiveState.ERROR == pNewState
      || XoW.FileReceiveState.REMOTE_STOPPED == pNewState
      || XoW.FileReceiveState.LOCAL_STOPPED == pNewState
      || XoW.FileReceiveState.CLOSED == pNewState
      || XoW.FileReceiveState.OVERDUE == pNewState)) {
      flag = true;
    } else if (XoW.FileReceiveState.LOCAL_STOPPED == _this.status
      &&(XoW.FileReceiveState.OVERDUE == pNewState)) {
      flag = true;
    } else if (XoW.FileReceiveState.REMOTE_STOPPED == _this.status
      &&(XoW.FileReceiveState.OVERDUE == pNewState)) {
      flag = true;
    } else if (XoW.FileReceiveState.ERROR == _this.status
        &&(XoW.FileReceiveState.OVERDUE == pNewState
        || XoW.FileReceiveState.LOCAL_STOPPED == pNewState
        || XoW.FileReceiveState.REMOTE_STOPPED == pNewState)) {
        flag = true;
    }
    if (flag) {
      _this.status = pNewState;
    } else {
      XoW.logger.w('cannot update to latest state from {0} to {1}'.f(_this.status, pNewState));
    }
    return flag;
  };

  this.copyFrom = function (pThumbnail) {
    XoW.logger.ms(_this.classInfo, 'copyFrom()');
    _this.filename = pThumbnail.filename;
    _this.size = pThumbnail.size;
    _this.blockSize = pThumbnail.blockSize;
    _this.mime = pThumbnail.mime;
    _this.mine = pThumbnail.mine;
    _this.sid = pThumbnail.sid;
    _this.seq = pThumbnail.seq;
    _this.status = pThumbnail.status;
    _this.errorMsg = pThumbnail.errorMsg;
    XoW.logger.me(_this.classInfo, 'copyFrom()');
  };

  this.clone = function () {
    XoW.logger.ms(_this.classInfo, 'clone()');
    var copyFile = new XoW.File();
    copyFile.filename = _this.filename;
    copyFile.size = _this.size;
    copyFile.content = _this.content;
    copyFile.mime = _this.mime;
    copyFile.mine = _this.mine;
    copyFile.id = _this.id;
    copyFile.fromid = _this.fromid;
    copyFile.from = _this.from;
    copyFile.to =  _this.to;
    copyFile.isRead = _this.isRead;
    copyFile.timestamp = _this.timestamp;
    copyFile.sid = _this.sid;
    copyFile.sid = _this.sid;
    copyFile.status = _this.status;
    copyFile.seq = _this.seq;
    copyFile.blockSize = _this.blockSize;
    return copyFile;
  };

  /**
   * hide content field
   * LayIM使用json存储数据，故不能将content屏蔽
   * @returns {{public: string, public: string, public: string, public: string, public: string, public: string, public: string}}
   */
  this.toJSON = function() {
    return {
      'username' : _this.username,
      'avatar' : _this.avatar || XoW.DefaultImage.AVATAR_DEFAULT, // im窗口未打开，layIM需要该必须要此字段（极耗存储）
      'type' : _this.type,
      'filename' : _this.filename,
      'size' : _this.size,
      'content': _this.content,
      'mime' : _this.mime,
      'mine' : _this.mine,
      'id' : _this.id,
	    'jid': _this.jid,
      //'fromid' : _this.fromid,
      //'from' : _this.from,
      //'to' :  _this.to,
      //'isRead' : _this.isRead,
      'timestamp' : _this.timestamp,
      //'sid' : _this.sid,
      'sid' : _this.sid,
      'status' : _this.status,
      'errorMsg': _this.errorMsg,
      'seq' : _this.seq,
      'blockSize' : _this.blockSize,
      'url':_this.url,
      'blockSize' : _this.blockSize
    };
  };
  // endregion Public methods
  _init();
};
