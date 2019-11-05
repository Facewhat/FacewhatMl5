XoW.httpFile = function () {
    let _this = this;
    this.cid = '';
    this.username = '';
    this.id;
    this.mine = false;
    this.filename = '';
    this.from = '';
    this.to = '';
    this.isRead = false;
    this.size = '';
    this.type = '';
    this.seq = 0;
    this.percent = "0%"
    this.avatar = XoW.DefaultImage.AVATAR_DEFAULT;
    this.content = '';
    this.jid = '';
    this.fromid = '';
    this.timestamp = '';
    this.mime = '';
    this.url = '*';
    this.status = '';
    this.isCancel = false;
    this.classInfo = "httpFile";
    var _init = function () {
        XoW.logger.ms(_this.classInfo, '_init()');
        _this.timestamp =  Date.parse(new Date());
        _this.isCancel = false;
        XoW.logger.me(_this.classInfo,  '_init');
    };
    this.toJSON = function() {
        return {
            'username': _this.username,
            'avatar': _this.avatar || XoW.DefaultImage.AVATAR_DEFAULT,
            'type': _this.type,
            'filename': _this.filename,
            'size': _this.size,
            'content': _this.content,
            'mime': _this.mime,
            'mine': _this.mine,
            'id': _this.id,
            'jid': _this.jid,
            'timestamp': _this.timestamp,
            'cid': _this.cid,
            'errorMsg': _this.errorMsg,
            'seq': _this.seq,
            'url': _this.url,
            'isCancel':_this.isCancel,
            'status':_this.status,
            'percent':_this.percent
        };
    }
    this.copyFrom = function (pThumbnail) {
        XoW.logger.ms(_this.classInfo, 'copyFrom()');
        _this.username = pThumbnail.username;
        _this.avatar = pThumbnail.avatar;
        _this.type = pThumbnail.type;
        _this.filename = pThumbnail.filename;
        _this.size = pThumbnail.size;
        _this.content = pThumbnail.content;
        _this.mime = pThumbnail.mime;
        _this.mine = pThumbnail.mine;
        _this.id = pThumbnail.id;
        _this.jid = pThumbnail.jid;
        _this.timestamp = pThumbnail.timestamp;
        _this.cid = pThumbnail.cid;
        _this.seq = pThumbnail.seq;
        _this.url = pThumbnail.url;
        _this.status = pThumbnail.status;
        _this.isCancel = pThumbnail.isCancel;
        _this.percent = pThumbnail.percent
        XoW.logger.me(_this.classInfo, 'copyFrom()');
    };
    _init();
}