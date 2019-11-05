(function (factory) {
    return factory(XoW);
}(function (XoW) {
    XoW.HttpFileManager = function (globalManager) {
        var _this = this;
        var _client = null;
        var _httpFIleDomain = null;
        var _httpFileMaxSize = null;
        var _httpFileURL = null;
        var _httpIqNamspace = null;
        var _roomServerDomain =null;
        var  _fileMsg = [];
        var _fileContinue = [];
        var _roomServiceDomain = null;
        _this.classInfo = 'HttpFileManager';
        var _init = function () {
            XoW.logger.ms(_this.classInfo, '_init()');
            _roomServiceDomain = 'conference.'+ XoW.config.domain;
            _client = globalManager;
            _httpFIleDomain = 'filetransfer.'+XoW.config.domain;
            _client.getConnMgr().addHandler(_cbFileSendMessage.bind(_this), "http:file:transfer", 'message');
            XoW.logger.me(_this.classInfo, '_init()');
        };
        var _getHttpFileMsgFromSevice = function(){
            XoW.logger.ms(_this.classInfo, '_getHttpFileMsgFromSevice()');
            _getHttpFileInFo(function (stanza) {
                let field =  stanza.getElementsByTagName('field')
                _httpIqNamspace = field[0].textContent;
                _httpFileMaxSize = field[1].textContent;
            },function (errors){

            })
            XoW.logger.me(_this.classInfo, '_getHttpFileMsgFromSevice()');
        }
        var _isExitsFileSevice = function (data) {
            XoW.logger.ms(_this.classInfo, '_isExitsFileSevice()');
            let {file,formData} = data;
            if(_httpFIleDomain == null|| _httpFileMaxSize == null || _httpFileURL){
                 return false;
            }else{
                 return true;
            }
            XoW.logger.me(_this.classInfo, '_isExitsFileSevice()');
        }
        var _cbFileSendMessage = function (stanza) {
            XoW.logger.ms(_this.classInfo, '_cbFileSendMessage()');
                let from = stanza.getAttribute("from");
                let to = stanza.getAttribute("to");
                let file = stanza.getElementsByTagName("file")[0];
                let fileurl = file.getAttribute("fileurl");
                let filename = file.getAttribute("filename");
                let filemime = file.getAttribute("filemime");
                let filesize =  file.getAttribute("filesize");
                if(file.getAttribute("from")==null){
                    let data = {
                        fileurl:fileurl
                    }
                    if (isRecived(data)) {
                        return true;
                    }
                    _fileMsg.push(data)
                    let getTo  =file.getAttribute("to");
                    let fileid = file.getAttribute("fileid");
                    let httpfile =new XoW.httpFile();
                    httpfile.cid = fileid;
                    httpfile.username = _client.getCurrentUser().username ? _client.getCurrentUser().username : '访客';
                    httpfile.id = XoW.utils.getNodeFromJid(getTo);
                    httpfile.mine = true;
                    httpfile.from = _client.getCurrentUser().jid;
                    httpfile.to = getTo;
                    httpfile.isRead = false;
                    httpfile.mime = filemime
                    httpfile.filename = filename;
                    httpfile.percent = '100%';
                    httpfile.size = _changeFileSizeUnit(filesize);;
                    httpfile.url = fileurl
                    httpfile.status = XoW.FileHttpFileState.CLOSE;
                    if(XoW.utils.getDomainFromJid(getTo) == _roomServiceDomain || XoW.utils.getDomainFromJid(to) == _roomServiceDomain){
                        httpfile.type = "group"
                    }else{
                        httpfile.type = XoW.MessageType.CONTACT_CHAT;
                    }
                    httpfile.avatar = XoW.DefaultImage.AVATAR_DEFAULT;
                    httpfile.content = 'hpFile[{0}]'.f(JSON.stringify(httpfile))
                    sessionStorage.removeItem(fileid);
                   _client.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.HTTP_FILETRANSFER_CLOSE, httpfile);
                    return true;
                }else{
                    if(stanza.getAttribute("type") == 'chat') {
                        let data = {
                            fileurl: fileurl
                        }
                        if (isRecived(data)) {
                            return true;
                        }
                        _fileMsg.push(data)
                        let getFrom = file.getAttribute("from");
                        // let theMsg = new XoW.Message();
                        let httpfile =new XoW.httpFile();
                        httpfile.cid = XoW.utils.getUniqueId('msg');
                        httpfile.classInfo = 'Message'
                        httpfile.contentType = 'msg'
                        httpfile.fromid = XoW.utils.getNodeFromJid(getFrom);
                        httpfile.from =getFrom ;
                        httpfile.isRead = false;
                        httpfile.mine = false;
                        httpfile.filename = filename;
                        httpfile.to = to
                        httpfile.percent = '100%';
                        httpfile.size = _changeFileSizeUnit(filesize);
                        httpfile.url = fileurl
                        httpfile.mime = filemime
                        httpfile.type = 'friend'
                        httpfile.status = XoW.FileHttpFileState.CLOSE;
                        if (filemime == 'jpg' || filemime == 'bmp' || filemime == 'gif' || filemime == 'jpeg' || filemime == 'png') {
                            httpfile.content = 'hpFile[{0}]'.f(JSON.stringify(httpfile))
                        } else if (filemime == 'mp4') {
                            httpfile.content = 'video[' + fileurl + ']'
                        } else if (filemime == 'mp3') {
                            httpfile.content = 'audio[' + fileurl + ']'
                        } else {
                            httpfile.content = 'hpFile[{0}]'.f(JSON.stringify(httpfile))
                        }
                        _client.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.HTTP_FILETRANSFER_CLOSE, httpfile)
                        return true;
                    }else{
                        let data = {
                            fileurl: fileurl
                        }
                        if (isRecived(data)) {
                            return true;
                        }
                        _fileMsg.push(data)
                            let getFrom =file.getAttribute("from");
                            let getTo =file.getAttribute("to");
                            // let theMsg = new XoW.Message();
                            let httpfile =new XoW.httpFile();
                            httpfile.cid = XoW.utils.getUniqueId('msg');
                            httpfile.classInfo = 'Message'
                            httpfile.contentType = 'msg'
                            httpfile.fromid = XoW.utils.getNodeFromJid(getFrom);
                            httpfile.from = getTo;
                            httpfile.id = httpfile.groupname = XoW.utils.getNodeFromJid(getTo);
                            httpfile.username = XoW.utils.getNodeFromJid(getFrom);
                            httpfile.isRead = false;
                            httpfile.size = _changeFileSizeUnit(filesize);;
                            httpfile.mine = false;
                            httpfile.percent = '100%';
                            httpfile.filename = filename;
                            httpfile.mime = filemime
                            httpfile.to = getTo
                            httpfile.url = fileurl
                            httpfile.type = 'group'
                            httpfile.status = XoW.FileHttpFileState.CLOSE;
                            if (filemime == 'jpg' || filemime == 'bmp' || filemime == 'gif' || filemime == 'jpeg' || filemime == 'png') {
                                httpfile.content = 'hpFile[{0}]'.f(JSON.stringify(httpfile))
                            } else if(filemime == 'mp4'){
                                httpfile.content = 'video[' + fileurl + ']'
                            }
                            else if(filemime == 'mp3'){
                                httpfile.content = 'audio[' + fileurl + ']'
                            }else {
                                httpfile.content = 'hpFile[{0}]'.f(JSON.stringify(httpfile))
                            }
                        _client.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.HTTP_FILETRANSFER_CLOSE, httpfile)
                        return true;
                    }
            }
            return true;
            XoW.logger.me(_this.classInfo, '_cbFileSendMessage()');
        }
        var isRecived = function (data) {
            XoW.logger.ms(_this.classInfo, 'isRecived()');
            for(let i = 0;i<_fileMsg.length;i++){
                  let t = _fileMsg[i];
                  if(t.fileurl == data.fileurl) {
                      return true;
                  }
            }
            return false;
            XoW.logger.me(_this.classInfo, 'isRecived()');
        }
        var  _sendRequestToS = function (fileDomain,fileIqNamspace,tojid,filename,filesize,successCb,errorCb) {
            let iq = $iq({
                from:_client.getCurrentUser().jid,
                id:XoW.utils.getUniqueId("endRequestToS"),
                to:fileDomain,
                type:'get'
            }).c('request',{xmlns:fileIqNamspace,filename:filename,filesize:filesize,to:tojid})
            _client.getConnMgr().sendIQ(iq,successCb,errorCb)
        }
        var _getHttpFileInFo = function (successCb,errorCb) {
            XoW.logger.ms(_this.classInfo, '_getHttpFileInFo()');
            let iq = $iq({
                id: XoW.utils.getUniqueId("fileTransInfo"),
                from:_client.getCurrentUser1().jid,
                    to:"filetransfer." + XoW.config.domain,
                type:"get"
            }).c("query",{xmlns:"http://jabber.org/protocol/disco#info"})
            _client.getConnMgr().sendIQ(iq,successCb,errorCb)
            XoW.logger.me(_this.classInfo, '_getHttpFileInFo()');
        }

        var _saveHttpFiletransferMsgFromMine = function (PMsg) {
            XoW.logger.ms(_this.classInfo, '_saveHttpFiletransferMsgFromMine()');
            let chat = _client.getChatMgr().getOrCreateChatByJid(PMsg.to);
            let msg = new XoW.Message();
            msg.cid = PMsg.cid
            msg.to = PMsg.to;
            msg.fromid = PMsg.from;
            msg.type = XoW.MessageType.CONTACT_CHAT;
            msg.contentType = 'msg';
            msg.isRead = false;
            msg.content = PMsg.content;
            chat.addMessage(msg);
            XoW.logger.me(_this.classInfo, '_saveHttpFiletransferMsgFromMine()');
        }
        var _saveHttpFiletransferMsgFromFriend = function (PMsg) {
            XoW.logger.ms(_this.classInfo, '_saveHttpFiletransferMsgFromFriend()');
            let chat = _client.getChatMgr().getOrCreateChatByJid(PMsg.to);
            let msg = new XoW.Message();
            msg.cid = PMsg.cid
            msg.to = PMsg.to;
            msg.fromid = PMsg.from;
            msg.type = XoW.MessageType.CONTACT_CHAT;
            msg.contentType = 'msg';
            msg.isRead = false;
            msg.content = PMsg.content;
            chat.addMessage(msg);
            XoW.logger.me(_this.classInfo, '_saveHttpFiletransferMsgFromFriend()');
        }
        var _getFileMimeFromFile = function (filename) {
            XoW.logger.ms(_this.classInfo, '_getFileMimeFromFile()');
             for(let i = 0; i < filename.length; i++){
                  if(filename[i] == '.'){
                       return filename.slice(i+1,filename.length);
                  }
             }
            XoW.logger.me(_this.classInfo, '_getFileMimeFromFile()');
        }
        var _sendFileToUserFromMine = function (tojid,filename,fileId,filesize) {
            XoW.logger.ms(_this.classInfo, '_sendFileToUserFromMine()');
            let httpfile = new XoW.httpFile();
            httpfile.cid = fileId;
            httpfile.username = _client.getCurrentUser().username ? _client.getCurrentUser().username : '访客';
            httpfile.id = XoW.utils.getNodeFromJid(tojid);
            httpfile.mine = true;
            httpfile.from = _client.getCurrentUser().jid;
            httpfile.to = tojid;
            httpfile.size = _changeFileSizeUnit(filesize);;
            httpfile.isRead = false;
            httpfile.mime = _getFileMimeFromFile(filename);
            httpfile.seq = 0;
            httpfile.percent = '0%';
            httpfile.url = '#';
            httpfile.status = XoW.FileHttpFileState.OPEN;
            if(XoW.utils.getDomainFromJid(tojid) == _roomServiceDomain){
                httpfile.type = XoW.MessageType.GROUP_CHAT;
            }else{
                httpfile.type = XoW.MessageType.CONTACT_CHAT;
            }
            httpfile.avatar = XoW.DefaultImage.AVATAR_DEFAULT;
            if (httpfile.mime == 'jpg' || httpfile.mime == 'bmp' || httpfile.mime == 'gif' || httpfile.mime == 'jpeg' || httpfile.mime == 'png') {
                httpfile.content = 'hpFile[{0}]'.f(JSON.stringify(httpfile))
            }else if(httpfile.mime == 'mp4'){
                httpfile.content ='hpFile[{0}]'.f(JSON.stringify(httpfile))
            } else if(httpfile.mime == 'mp3'){
                httpfile.filename = "音频"
                httpfile.content = 'hpFile[{0}]'.f(JSON.stringify(httpfile))
            } else {
                httpfile.filename = "文件"
                httpfile.content = 'hpFile[{0}]'.f(JSON.stringify(httpfile))
            }
            _client.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.HTTP_SEND_FILE_TO_USER_FROM_MINE, httpfile);
            XoW.logger.me(_this.classInfo, '_sendFileToUserFromMine()');
        }
        
        var _sendOffFile = function ($file,thatchat) {
            XoW.logger.ms(_this.classInfo, '_sendOffFile()');
            let chatdata  = thatchat.data;
            let chatjid = chatdata.jid;
            let chattype = chatdata.type;
            let chatid = chatdata.id
            if(_httpFIleDomain == null || _httpFileMaxSize ==null ||_httpIqNamspace == null){
                _client.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.HTTP_FILE_STRANSFER_ERROR, "找不到服务器");
                return;
            }
            let  file = $file;
            let upload = null;
            let fileUrl = null;
            let uploadId = null;
            let fileId = null;
            _sendRequestToS(_httpFIleDomain,_httpIqNamspace,chatjid,file.name,file.size,function (staza) {
                upload = staza.getElementsByTagName('upload')[0];
                fileUrl = upload.getAttribute('url');
                uploadId = staza.getElementsByTagName('uploadid')[0];
                fileId = uploadId.getAttribute('id');
                let i = 0;
                _sendFileToUserFromMine(chatjid,file.name,fileId,file.size);
                sessionStorage.setItem(fileId, true);
                _client.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.HTTP_FILE_STRANSFER_BEGIN,fileId);
                _uploadHttpFile($file,fileUrl,fileId,file.name, i,chattype,chatid);
            })
            XoW.logger.me(_this.classInfo, '_sendOffFile()');
        }

        function _uploadHttpFile($file,fileUrl,fileId,filename,i,chattype,chatid){
            let  keyCode = sessionStorage.getItem(fileId);
            let formData = new FormData();
            let file = $file;
            let filesize = file.size;
            let chunk = 1*1024*1024;
            let chunkTotal = Math.ceil(filesize / chunk);
            if(keyCode == false ||keyCode == 'false' ){
                _setFileblob($file,fileUrl,fileId,filename,i,chattype,chatid);
                let thatfile = new XoW.httpFile();
                thatfile.cid = fileId;
                thatfile.seq = i;
                thatfile.type = chattype;
                thatfile.percent =(Math.round(i/chunkTotal*10000)/100.0+'%');
                thatfile.id = chatid;
                thatfile.status = XoW.FileHttpFileState.CANCEL;
                //_client.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.HTTP_FILE_STRANSFER_CANCEL,thatfile);
                _client.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.HTTP_CHANGE_FILE_STATUS, thatfile);
                return
            }
            if(i >= chunkTotal){
                return i;
            }
            let startseq = i*chunk;
            let endseq = startseq + chunk;
            let packet = file.slice(startseq,endseq);
            formData.append("filename",filename)
            formData.append("fileid",fileId);
            formData.append("seqtotal",chunkTotal);
            formData.append("seqstart",i);
            formData.append("filesize",filesize);
            formData.append("file",packet);
            let xhr = new XMLHttpRequest();
            xhr.timeout = 100000;
            xhr.ontimeout = function(event){
                _client.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.HTTP_FILE_STRANSFER_ERROR, "上传超时");
                return;
            }
            xhr.open('POST', fileUrl,true);
            xhr.send(formData);
            xhr.onreadystatechange = function(){
                if ( xhr.readyState === 4 && xhr.status === 200 ) {
                    console.log( "xhr.responseText" + xhr.responseText );
                    if( xhr.responseText === 'succ'){
                        let thatfile = new XoW.httpFile();
                        thatfile.cid = fileId;
                        thatfile.seq = i;
                        thatfile.percent =(Math.round(i/chunkTotal*10000)/100.0+'%');
                        thatfile.type = chattype;
                        thatfile.id = chatid;
                        thatfile.status = XoW.FileHttpFileState.SENDING;
                        _client.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.HTTP_CHANGE_FILE_STATUS, thatfile);
                        return  _uploadHttpFile($file,fileUrl,fileId,filename,++i,chattype,chatid);
                    }else if( xhr.responseText === 'ok'){
                        _client.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.HTTP_FILE_STRANSFER_SUCCESS, "上传成功");
                    }
                }else if(xhr.readyState === 4 && xhr.status === 400){
                    _fileContinue.splice(_fileContinue.findIndex(item => item.fileId === fileId), 1);
                    console.log( "xhr.responseText" + xhr.responseText );
                    _setFileblob($file,fileUrl,fileId,filename,i,chattype,chatid);
                    sessionStorage.setItem(fileId, false);
                    let thatfile = new XoW.httpFile();
                    thatfile.cid = fileId;
                    thatfile.seq = i;
                    thatfile.percent =(Math.round(i/chunkTotal*10000)/100.0+'%');
                    thatfile.type = chattype;
                    thatfile.id = chatid;
                    thatfile.status = XoW.FileHttpFileState.CANCEL;
                    _client.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.HTTP_CHANGE_FILE_STATUS, thatfile);
                }
            };
            xhr.onerror =  function () {
                let thatfile = new XoW.httpFile();
                thatfile.cid = fileId;
                thatfile.seq = i;
                thatfile.type = chattype;
                thatfile.id = chatid;
                thatfile.status = XoW.FileHttpFileState.ERROR;
                _client.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.HTTP_CHANGE_FILE_STATUS, thatfile);
            };
        }

        var _changeFileSizeUnit = function (filesize) {
            if (!filesize){
                return "";
            }
            let size = Number(filesize);
            let num = 1024.00;
            if (size < num)
                return size + "B";
            if (size < Math.pow(num, 2))
                return (size / num).toFixed(2) + "K";
            if (size < Math.pow(num, 3))
                return (size / Math.pow(num, 2)).toFixed(2) + "M";
            if (size < Math.pow(num, 4))
                return (size / Math.pow(num, 3)).toFixed(2) + "G";
            return (size / Math.pow(num, 4)).toFixed(2) + "T";
        }

        var _setFileblob = function ($file,fileUrl,fileId,filename,i,chattype,chatid) {
            let fileblob = {
                file:$file,
                fileUrl:fileUrl,
                fileId:fileId,
                filename:filename,
                i:i,
                chattype:chattype,
                chatid:chatid,
            }
            _fileContinue.push(fileblob);
        }

        var _continueHttpFileStransfer = function (fileid,pSucCb) {
            XoW.logger.ms(_this.classInfo, '_continueHttpFileStransfer()');
            let theFile = _fileContinue.find(function(x) {
                return x.fileId == fileid;
            });
            if(!theFile){
                let thatfile = new XoW.httpFile();
                thatfile.cid = fileid;
                thatfile.status = XoW.FileHttpFileState.OVERDUE;
                _client.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.HTTP_FILE_STRANSFER_OVERDUE, thatfile);
                pSucCb(false)
                return;
            }
            _fileContinue.splice(_fileContinue.findIndex(item => item.fileId === fileid), 1);
            let file = theFile.file;
            let fileUrl = theFile.fileUrl;
            let fileId = theFile.fileId;
            let filename = theFile.filename;
            let i = theFile.i;
            let chattype = theFile.chattype;
            let chatid = theFile.chatid;
            XoW.logger.me(_this.classInfo, '_continueHttpFileStransfer()');
            pSucCb(true)
            _uploadHttpFile(file,fileUrl,fileId,filename,i,chattype,chatid);
        }

        this.getHttpFileMsgFromSevice = function(){
            XoW.logger.ms(_this.classInfo, 'getHttpFileInfo()');
            _getHttpFileMsgFromSevice();
            XoW.logger.me(_this.classInfo, 'getHttpFileInfo()');
        }
        this.getHttpFIleDomain = function(){
            XoW.logger.ms(_this.classInfo, 'getHttpFIleDomain()');
            return _httpFIleDomain;
            XoW.logger.me(_this.classInfo, 'getHttpFIleDomain()');
        }
        this.getHttpFileMaxSize = function(){
            XoW.logger.ms(_this.classInfo, 'getHttpFileMaxSize()');
            return _httpFileMaxSize;
            XoW.logger.me(_this.classInfo, 'getHttpFileMaxSize()');
        }
        this.getHttpIqNamspace = function () {
            XoW.logger.ms(_this.classInfo, 'getHttpIqNamspace()');
            return _httpIqNamspace;
            XoW.logger.me(_this.classInfo, 'getHttpIqNamspace()');
        }
        this.getHttpFileURL = function(){
            XoW.logger.ms(_this.classInfo, 'getHttpFileMaxSize()');
            return _httpFileURL;
            XoW.logger.me(_this.classInfo, 'getHttpFileMaxSize()');
        }
        this.isExitsFileSevice = function(){
            XoW.logger.ms(_this.classInfo, 'isExitsFileSevice()');
            let data = {
                fileDomain:_httpFIleDomain,
                fileSize:_httpFileMaxSize,
                fileIqNamspace:_httpIqNamspace
            }
            return data;
            XoW.logger.me(_this.classInfo, 'isExitsFileSevice()');
        }
        this.sendfileToUserForMine = function (tojid,filename,fileId) {
            XoW.logger.ms(_this.classInfo, 'sendfileToUserForMine()');
            _sendFileToUserFromMine(tojid,filename,fileId)
            XoW.logger.me(_this.classInfo, 'sendfileToUserForMine()');
        }
        this.getFileMimeFromFile = function(filename){
            return _getFileMimeFromFile(filename);
        }
        this.sendOffFile = function($file,thatchat){
            XoW.logger.ms(_this.classInfo, 'sendOffFile()');
            _sendOffFile($file,thatchat);
            XoW.logger.me(_this.classInfo, 'sendOffFile()'); 
        }
        this.continueHttpFileStransfer = function(fileid,pSucCb){
            XoW.logger.ms(_this.classInfo, 'continueHttpFileStransfer()');
            _continueHttpFileStransfer(fileid,pSucCb);
            XoW.logger.me(_this.classInfo, 'continueHttpFileStransfer()');
        }
        _init();
    }
    return XoW;
}));