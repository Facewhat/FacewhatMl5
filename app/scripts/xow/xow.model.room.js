(function (factory) {
    return factory(XoW);
}(function (XoW) {
    XoW.RoomList = function () {
        this.type = "";
        this.groupname="";
        this.username="";
        this.jid="";
        this.id="";
        this.sign="";
        this.avatar="";
        this.isPersistent = false;
    };

    XoW.RoomMember = function () {
        this.id ="";
        this.avatar="";
        this.username="";
        this.thisroonanme="";
        this.roomjid="";
        this.roomaffi="";
        this.roomrole="";
        this.roomindex="";
    }

    XoW.RoomInviteInfo =function () {
        this.type=null,
            this.id=null,
            this.time=null,
            this.status=null,
            this.from=null,
            this.to=null,
            this.ini=null,
            this.pwd=null,
            this.params={
                inviteFrom:null,
                reason:null,
                password:null
            }

    };


    return XoW;
}));