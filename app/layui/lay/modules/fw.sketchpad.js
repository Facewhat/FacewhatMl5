"use strict";
layui.use([ 'jquery']).define(['layer', 'form'], function (exports) {
    let $ = layui.$,
        _layer = layui.layer,
        layer = layui['layer-mobile'];
    let _classInfo = 'Sketchpad';
    let THIS = 'layim-this';
    let Sketchpad = function () {
        XoW.logger.i("画板");
        return _init();
    };
    let _init = function () {
        XoW.logger.i('绘画');
    };
    let eleSketchpad = [

        '<div id ="drawer" style="width: 100%;height: 50%">'
        , '<div id = "canvasBegin">'
        , '<canvas  id="sketch">'
        , '</canvas>'
        , '</div>'
        , '<div id="Drawcolor">'
        , '<div id="showC"></div>'
        , '<div id="linewT">粗细:</div>'
        , '<div id="LineW"><input type="range" name="range_speed" min="1" max="30"  step="1" id="range"/> </div>'
        , '<div id="showN"><p id="conT">2</p></span></div>'
        , '<div id="recLine" class="box_shadow selec" style="border:1px red solid;" ><img src="../../../images/Sketline.png" " /></div>'
        , '<div id="recTangle" class="selec" title="矩形"><img src="../../../images/SketJX.png" /></div>'
        , '<div id="roundX" class="selec" title="圆"><img src="../../../images/SketY.png"  /></div>'
        , '<div id="reas" title="橡皮擦"><img src="../../../images/橡皮擦.png"></div>'
        , '<div id="clear" title="清空" style="width: 26px; height: 26px; float: left;  margin-top: 8px; margin-left: 5px;border: 1px darkgray dashed"><img src="../../../../images/164清空.png" width="26px" height="26px"> </div>'
        , '</div>'

        , '<div id="SelectC" style="display: none;">'
        , '<table id="tab" border="1">'
        , '<tr style="height: 20%">'
        , '<td style="width: 20%; background-color: black" ></td>'
        , '<td style="background-color: #FFFFCC" ></td>'
        , '<td style="background-color: #CCFFFF"></td>'
        , '<td style="background-color: #FFCCCC"></td>'
        , '<td style="background-color: #CCCC33"></td>'
        , '</tr>'
        , '<tr >'
        , '<td style="background-color:#FF9900;width: 20%"></td>'
        , '<td style="background-color:#0099CC"></td>'
        , '<td style="background-color:#999999"></td>'
        , '<td style="background-color:#996600"></td>'
        , '<td style="background-color:#FF33CC"></td>'
        , '</tr>'
        , '<tr>'
        , '<td style="background-color:#FF6666;width: 20%"></td>'
        , '<td style="background-color:#FFCCCC"></td>'
        , '<td style="background-color:#CC9999"></td>'
        , '<td style="background-color:#CC99CC"></td>'
        , '<td style="background-color:#CCCC33"></td>'
        , '</tr>'
        , '<tr>'
        , '<td style="background-color:#660000;width: 20%"></td>'
        , '<td style="background-color:#666600"></td>'
        , '<td style="background-color:#996633"></td>'
        , '<td style="background-color:#99CC66"></td>'
        , '<td style="background-color:#006600"></td>'
        , '</tr>'
        , '<tr>'
        , '<td style="background-color:#0000CC;width: 20%"></td>'
        , '<td style="background-color:#CC99CC"></td>'
        , '<td style="background-color:#CC9966"></td>'
        , '<td style="background-color:#0099FF"></td>'
        , '<td style="background-color:#CCCC33"></td>'
        , '</tr>',
        '<tr>'
        , '<td style="background-color:#CCCCCC;width: 20%"></td>'
        , '<td style="background-color:#FF0033"></td>'
        , '<td style="background-color:#003399"></td>'
        , '<td style="background-color:#CCCC33"></td>'
        , '<td style="background-color:#009966"></td>'
        , '</tr>'
        , '</table>'
        , '</div>'
        // ,'<div class="layim-chat-send">  <button class="layim-send" layim-event=""> 发送</button></div> '
        , '</div>'

    ].join('');
    function clearSketchpad() {
        XoW.logger.ms(_classInfo, 'clearSketchpad()');
        let c = document.getElementById("sketch");
        let cxt = c.getContext('2d');
        cxt.fillStyle = '#FFFFFF';
        cxt.beginPath();
        cxt.fillRect(0, 0, c.width, c.height);
        cxt.closePath();
        XoW.logger.me(_classInfo, 'clearSketchpad()');
    }
    function beginDrawing() {
        XoW.logger.ms(_classInfo, 'beginDrawing()');
        $('#sketch').css('border', '1px solid red');
        let c = document.getElementById("sketch");
        let drawer = $('#drawer');
        console.log(drawer);
        let pagewidth = drawer[0].clientWidth;
        let pageheight = drawer[0].clientHeight;
        c.width = pagewidth;
        c.height = pageheight * 0.9;
        let cast = {
            open_down: false,
            old_pos: null,
            DrawColor: '#000000',
            Lineheight: 2,
            isRectangle: false,
            isRound: false,
            flag: true,
            baseXY: null,
            isBlock: false,
            isErase: false,
            WidthL: 2,   //记录
            WidthC: '#000000',
            isR: false,
            isRo: false
        };
        $('#drawer').ready(function () {
            $('#reas').click(function () {
                if (cast.isErase === false) {
                    cast.WidthC = cast.DrawColor;
                    cast.DrawColor = "#ffffff";
                    $('#reas').css('border', '1px red solid');
                    cast.isErase = true;
                    cast.WidthL = cast.Lineheight;
                    cast.Lineheight = 20;
                    document.getElementById('sketch').style.cursor = "url(../../../images/Era.cur),auto";
                    cast.isRectangle = false;
                    cast.isRound = false;
                }
                else if (cast.isErase === true) {
                    cast.DrawColor = cast.WidthC;
                    document.getElementById("range").value = cast.WidthL;
                    document.getElementById("conT").innerHTML = cast.WidthL;
                    cast.Lineheight = cast.WidthL;
                    $('#reas').css('border', '1px darkgray dashed');
                    document.getElementById('sketch').style.cursor = "url(../../../images/pen.cur),auto";
                    cast.isErase = false;

                    if (cast.isR === true) {
                        cast.isR = false;
                        cast.isRectangle = true;
                    }
                    else if (cast.isRo === true) {
                        cast.isRo = false;
                        cast.isRound = true;
                    }
                }
            });
            $('#clear').click(function () {
                clearSketchpad();
                $('#clear').css('border', '1px solid red');
                setTimeout("document.getElementById('clear').style.border='1px darkgray dashed'",100);
            });
            let className = document.getElementsByClassName('selec');
            for (let j = 0; j < className.length; j++) {
                className[j].index = j;
                className[j].onclick = function () {
                    if (this.index === 0) {
                        $('#recLine').css('border', '1px red solid');
                        $('#recTangle').css('border', '1px darkgray dashed');
                        $('#roundX').css('border', '1px darkgray dashed');
                        cast.isRectangle = false;
                        cast.isRound = false;
                        document.getElementById('sketch').style.cursor = "url(../../../images/pen.cur),auto";
                        if (cast.isErase === true) {
                            cast.DrawColor = cast.WidthC;
                            document.getElementById("range").value = cast.WidthL;
                            document.getElementById("conT").innerHTML = cast.WidthL;
                        }
                        cast.Lineheight = cast.WidthL;
                        $('#reas').css('border', '1px darkgray dashed');
                        cast.isErase = false;
                        cast.isRo = false;
                        cast.isR = false;
                    }
                    else if (this.index ===1) {
                        $('#recLine').css('border', '1px darkgray dashed');
                        $('#recTangle').css('border', '1px red solid');
                        $('#roundX').css('border', '1px darkgray dashed');
                        cast.isRectangle = true;
                        cast.isR = true;
                        cast.isRound = false;
                        document.getElementById('sketch').style.cursor = 'crosshair';
                        if (cast.isErase === true) {
                            cast.DrawColor = cast.WidthC;
                            document.getElementById("range").value = cast.WidthL;
                            document.getElementById("conT").innerHTML = cast.WidthL;
                        }
                        cast.Lineheight = cast.WidthL;
                        $('#reas').css('border', '1px darkgray dashed');
                        cast.isErase = false;
                        cast.isRo = false;
                    }
                    else if (this.index === 2) {
                        $('#recLine').css('border', '1px darkgray dashed');
                        $('#recTangle').css('border', '1px darkgray dashed');
                        $('#roundX').css('border', '1px red solid');
                        cast.isRound = true;
                        cast.isRo = true;
                        cast.isRectangle = false;
                        document.getElementById('sketch').style.cursor = 'crosshair';
                        if (cast.isErase === true) {
                            cast.DrawColor = cast.WidthC;
                            document.getElementById("range").value = cast.WidthL;
                            document.getElementById("conT").innerHTML = cast.WidthL;
                        }
                        cast.Lineheight = cast.WidthL;
                        $('#reas').css('border', '1px darkgray dashed');
                        cast.isErase = false;
                        cast.isR = false;
                    }
                }
            }
            let showC = document.getElementById('showC');
            let myDiv = document.getElementById('SelectC');
            showC.onclick = function () {
                let val = myDiv.style.display;
                if (val === 'none') {
                    myDiv.style.display = 'block'; //显示
                    cast.isBlock = true;
                } else {
                    myDiv.style.display = 'none'; //隐藏
                }
            };
            document.getElementById("canvasBegin").addEventListener("click", function () {
                if (cast.isBlock === true) {
                    myDiv.style.display = 'none'; //隐藏
                    cast.isBlock = false;
                }
            });
            document.getElementById("tab").addEventListener("click", function () {
                if (cast.isBlock === true) {
                    myDiv.style.display = 'none'; //隐藏
                    cast.isBlock = false;
                }
            });
            let td = document.getElementsByTagName("td");
            for (let i = 0; i < td.length; i++) {
                td[i].index = i;
                td[i].onclick = function () {
                    if (this.index === 0) {
                        if (cast.isErase === false) {
                            cast.DrawColor = 'black';
                            $('#showC').css('background-color', 'black');
                        }
                        else {
                            cast.WidthC = "black";
                            $('#showC').css('background-color', 'black');
                        }
                    }
                    else if (this.index === 1) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#FFFFCC";
                            $('#showC').css('background-color', '#FFFFCC');
                        }
                        else {
                            cast.WidthC = "#FFFFCC";
                            $('#showC').css('background-color', '#FFFFCC');
                        }
                    }
                    else if (this.index === 2) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#CCFFFF";
                            $('#showC').css('background-color', '#CCFFFF');
                        }
                        else {
                            cast.WidthC = "#CCFFFF";
                            $('#showC').css('background-color', '#CCFFFF');
                        }
                    }
                    else if (this.index === 3) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#FFCCCC";
                            $('#showC').css('background-color', '#FFCCCC');
                        }
                        else {
                            cast.WidthC = "#FFCCCC";
                            $('#showC').css('background-color', '#FFCCCC');
                        }
                    }
                    else if (this.index === 4) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#FF9900";
                            $('#showC').css('background-color', '#FF9900');
                        }
                        else {
                            cast.WidthC = "#FF9900";
                            $('#showC').css('background-color', '#FF9900');
                        }
                    }
                    else if (this.index === 5) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#CCCC33";
                            $('#showC').css('background-color', '#CCCC33');
                        }
                        else {
                            cast.WidthC = "#CCCC33";
                            $('#showC').css('background-color', '#CCCC33');
                        }
                    }

                    else if (this.index === 6) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#0099CC";
                            $('#showC').css('background-color', '#0099CC');
                        }
                        else {
                            cast.WidthC = "#0099CC";
                            $('#showC').css('background-color', '#0099CC');
                        }
                    }
                    else if (this.index === 7) {
                        if (cast.isErase ===false) {
                            cast.DrawColor = "#999999";
                            $('#showC').css('background-color', '#999999');
                        }
                        else {
                            cast.WidthC = "#999999";
                            $('#showC').css('background-color', '#999999');
                        }
                    }
                    else if (this.index === 8) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#996600";
                            $('#showC').css('background-color', '#996600');
                        }
                        else {
                            cast.WidthC = "#996600";
                            $('#showC').css('background-color', '#996600');
                        }
                    }
                    else if (this.index === 9) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#FF33CC";
                            $('#showC').css('background-color', '#FF33CC');
                        }
                        else {
                            cast.WidthC = "#FF33CC";
                            $('#showC').css('background-color', '#FF33CC');
                        }
                    }
                    else if (this.index === 10) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#FF6666";
                            $('#showC').css('background-color', '#FF6666');
                        }
                        else {
                            cast.WidthC = "#FF6666";
                            $('#showC').css('background-color', '#FF6666');
                        }
                    }
                    else if (this.index === 11) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#FFCCCC";
                            $('#showC').css('background-color', '#FFCCCC');
                        }
                        else {
                            cast.WidthC = "#FFCCCC";
                            $('#showC').css('background-color', '#FFCCCC');
                        }
                    }
                    else if (this.index === 12) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#CC9999";
                            $('#showC').css('background-color', '#CC9999');
                        }
                        else {
                            cast.WidthC = "#CC9999";
                            $('#showC').css('background-color', '#CC9999');
                        }
                    }
                    else if (this.index === 13) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#CC99CC";
                            $('#showC').css('background-color', '#CC99CC');
                        }
                        else {
                            cast.WidthC = "#CC99CC";
                            $('#showC').css('background-color', '#CC99CC');
                        }
                    }
                    else if (this.index === 14) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#CCCC33";
                            $('#showC').css('background-color', '#CCCC33');
                        }
                        else {
                            cast.WidthC = "#CCCC33";
                            $('#showC').css('background-color', '#CCCC33');
                        }
                    }
                    else if (this.index === 15) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#660000";
                            $('#showC').css('background-color', '#660000');
                        }
                        else {
                            cast.WidthC = "#660000";
                            $('#showC').css('background-color', '#660000');
                        }
                    }
                    else if (this.index === 16) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#666600";
                            $('#showC').css('background-color', '#666600');
                        }
                        else {
                            cast.WidthC = "#666600";
                            $('#showC').css('background-color', '#666600');
                        }
                    }
                    else if (this.index === 17) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#996633";
                            $('#showC').css('background-color', '#996633');
                        }
                        else {
                            cast.WidthC = "#996633";
                            $('#showC').css('background-color', '#996633');
                        }
                    }
                    else if (this.index === 18) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#99CC66";
                            $('#showC').css('background-color', '#99CC66');
                        }
                        else {
                            cast.WidthC = "#99CC66";
                            $('#showC').css('background-color', '#99CC66');
                        }
                    }
                    else if (this.index === 19) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#006600";
                            $('#showC').css('background-color', '#006600');
                        }
                        else {
                            cast.WidthC = "#006600";
                            $('#showC').css('background-color', '#006600');
                        }
                    }
                    else if (this.index === 20) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#0000CC";
                            $('#showC').css('background-color', '#0000CC');
                        }
                        else {
                            cast.WidthC = "#0000CC";
                            $('#showC').css('background-color', '#0000CC');
                        }
                    }
                    else if (this.index === 21) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#CC99CC";
                            $('#showC').css('background-color', '#CC99CC');
                        }
                        else {
                            cast.WidthC = "#CC99CC";
                            $('#showC').css('background-color', '#CC99CC');
                        }
                    }
                    else if (this.index === 22) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#CC9966";
                            $('#showC').css('background-color', '#CC9966');
                        }
                        else {
                            cast.WidthC = "#CC9966";
                            $('#showC').css('background-color', '#CC9966');
                        }
                    }
                    else if (this.index === 23) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#0099FF";
                            $('#showC').css('background-color', '#0099FF');
                        }
                        else {
                            cast.WidthC = "#0099FF";
                            $('#showC').css('background-color', '#0099FF');
                        }
                    }
                    else if (this.index === 24) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#CCCC33";
                            $('#showC').css('background-color', '#CCCC33');
                        }
                        else {
                            cast.WidthC = "#CCCC33";
                            $('#showC').css('background-color', '#CCCC33');
                        }
                    }
                    else if (this.index === 25) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#CCCCCC";
                            $('#showC').css('background-color', '#CCCCCC');
                        }
                        else {
                            cast.WidthC = "#CCCCCC";
                            $('#showC').css('background-color', '#CCCCCC');
                        }
                    }
                    else if (this.index === 26) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#FF0033";
                            $('#showC').css('background-color', '#FF0033');
                        }
                        else {
                            cast.WidthC = "#FF0033";
                            $('#showC').css('background-color', '#FF0033');
                        }
                    }
                    else if (this.index === 27) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#003399";
                            $('#showC').css('background-color', '#003399');
                        }
                        else {
                            cast.WidthC = "#003399";
                            $('#showC').css('background-color', '#003399');
                        }
                    }
                    else if (this.index === 28) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#CCCC33";
                            $('#showC').css('background-color', '#CCCC33');
                        }
                        else {
                            cast.WidthC = "#CCCC33";
                            $('#showC').css('background-color', '#CCCC33');
                        }
                    }
                    else if (this.index ===29) {
                        if (cast.isErase === false) {
                            cast.DrawColor = "#009966";
                            $('#showC').css('background-color' ,'#009966');
                        }
                        else {
                            cast.WidthC = "#009966";
                            $('#showC').css('background-color', '#009966');
                        }
                    }
                };
            }
            $('#range').change(function () {
                let num = document.getElementById("range").value;
                document.getElementById("conT").innerHTML = num;
                //alert(num);
                cast.Lineheight = num;
                cast.WidthL = num;
            })
            document.getElementById("range").value = "2";
            $('#sketch').mousedown(function (ev) {
                cast.open_down = true;
                let offset;
                // cast.flag=true;
                if (cast.isRectangle === true) {
                     offset = $('#sketch').offset();   //offset() 方法设置或返回被选元素相对于文档的偏移坐标。
                    cast.baseXY = {
                        x: ev.pageX - offset.left,
                        y: ev.pageY - offset.top
                    };
                }
                if (cast.isRound === true) {
                     offset = $('#sketch').offset();
                    cast.baseXY = {
                        x: ev.pageX - offset.left,
                        y: ev.pageY - offset.top
                    };
                }
            });
            $('#sketch').mouseup(function (ev) {
                cast.open_down = false;
                if (cast.isRectangle === true) {
                     let offset = $('#sketch').offset();
                    let pos = {
                        x: ev.pageX - offset.left,
                        y: ev.pageY - offset.top
                    };
                    let width = pos.x - cast.baseXY.x;
                    let height = pos.y - cast.baseXY.y;

                    // alert(cast.baseXY.x + " " + cast.baseXY.y + " " + width + ' ' + height);
                    let ctx = $('#sketch').get(0).getContext('2d');
                    ctx.strokeStyle = cast.DrawColor;
                    ctx.lineWidth = cast.Lineheight;
                    ctx.beginPath();
                    ctx.rect(cast.baseXY.x, cast.baseXY.y, width, height);
                    ctx.stroke();
                    cast.baseXY = null;
                }
                if (cast.isRound === true) {
                    let offset = $('#sketch').offset();
                    let pos = {
                        x: ev.pageX - offset.left,
                        y: ev.pageY - offset.top
                    };
                    let width = Math.abs(pos.x - cast.baseXY.x);
                    let height = Math.abs(pos.y - cast.baseXY.y);
                    //alert(width + " " + height)
                    let R = Math.sqrt(width * width + height * height);
                    let ctx = $('#sketch').get(0).getContext('2d');
                    ctx.strokeStyle = cast.DrawColor;
                    ctx.lineWidth = cast.Lineheight;
                    ctx.beginPath();
                    ctx.arc(cast.baseXY.x, cast.baseXY.y, R, 0, 2 * Math.PI);
                    ctx.stroke();
                    cast.baseXY = null;
                }
            });
            $('#sketch').mousemove(function (ev) {
                if (cast.isRectangle === false && cast.isRound === false) {
                    let offset = $('#sketch').offset();
                    let pos = {
                        x: ev.pageX - offset.left,
                        y: ev.pageY - offset.top
                    };
                    if (cast.open_down) {
                        if (!cast.old_pos) {
                            cast.old_pos = pos;
                            return;
                        }
                        let ctx = $('#sketch').get(0).getContext('2d');
                        ctx.strokeStyle = cast.DrawColor;
                        ctx.lineWidth = cast.Lineheight;
                        ctx.beginPath();
                        ctx.moveTo(cast.old_pos.x, cast.old_pos.y);
                        ctx.lineTo(pos.x, pos.y);
                        ctx.stroke();
                        cast.old_pos = pos;
                    }
                    else {
                        cast.old_pos = null;
                    }
                }
            });

        });
        XoW.logger.me(_classInfo, 'beginDrawing()');
    }
    function getThisChat() {
        // layimChat
        var $layimChat = $('.layui-layer-page.layui-layim-chat');
        if (!$layimChat || $layimChat.length == 0) {
            return null;
        }
        var index = $('.layim-chat-list .' + THIS).index();
        var cont = $layimChat.find('.layim-chat').eq(index);
        var to = JSON.parse(decodeURIComponent(cont.find('.layim-chat-tool').data('json')));
        return {
            elem: cont
            , data: to
            , textarea: cont.find('textarea')
        };
    };
    function downloadImage(type) {
        XoW.logger.ms(_classInfo, 'downloadImage()');
        let c = document.getElementById("sketch");
        let imgdata = c.toDataURL(type);
        //将mime-type改为image/octet-stream,强制让浏览器下载
        let fixtype = function (type) {
            type = type.toLocaleLowerCase().replace(/jpg/i, 'jpeg');
            let r = type.match(/png|jpeg|bmp|gif/)[0];
            return 'image/' + r;
        };
        let imagedata = imgdata;
        imgdata = imgdata.replace(fixtype(type), 'image/octet-stream');
        //将图片保存到本地
        let saveFile = function (data, filename) {
            let link = document.createElement('a');
            link.href = data;
            link.download = filename;
            let event = document.createEvent('MouseEvents');
            event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            link.dispatchEvent(event);
        };
        let filename = getyyyyMMdd() + '.' + "jpg";
        saveFile(imgdata, filename);  //保存图片在本地
        XoW.logger.me(_classInfo, 'downloadImage()');
    }
    function sendLoadImage(type) {
        XoW.logger.ms(_classInfo, 'sendLoadImage()');
        let c = document.getElementById("sketch");
        let imagedata = c.toDataURL(type);
        let filename = getyyyyMMdd() + '.' + "jpg";
        // if (_res == "desktop")
        //     var pThatChat = _getThisChat();
        // else
        //     //var pThatChat = _chat;
        let pThatChat = getThisChat();
            // console.log(pThatChat.data.status);
            // alert("");
        if (pThatChat.data.status === XoW.UserState.OFFLINE) {//如果对方已离线，停止发送图片，否则会导致websocket连接关闭
            _layer.msg('对方已离线，无法发送图像');
            return;
        }
        let toFullJid = XoW.utils.getFullJid(pThatChat.data.jid, pThatChat.data.resource);
        let str = imagedata;
        str = str.substring(22);
        let equalIndex = str.indexOf('=');
        if (str.indexOf('=') > 0) {
            str = str.substring(0, equalIndex);
        }
        let strLength = str.length;
        let fileLength = parseInt(strLength - (strLength / 8) * 2);
        let pFileInfo={
            name:filename,
            size:fileLength,
            type:'image/png',
        }
        let pSendInfo={
            pThatChat:pThatChat,
            pFileInfo:pFileInfo,
            pData:imagedata
        }
        return pSendInfo;
        XoW.logger.me(_classInfo, 'sendLoadImage()');
    }
    function getyyyyMMdd() {
        XoW.logger.ms(_classInfo, 'getyyyyMMdd()');
        //进行日期的格式的转换
        let d = new Date();
        let curr_date = d.getDate();
        let curr_month = d.getMonth() + 1;
        let curr_year = d.getFullYear();
        String(curr_month).length < 2 ? (curr_month = "0" + curr_month) : curr_month;
        String(curr_date).length < 2 ? (curr_date = "0" + curr_date) : curr_date;
        return curr_year + "" + curr_month + "" + curr_date;
        XoW.logger.me(_classInfo, 'getyyyyMMdd()');
    }
    Sketchpad.prototype.drawing = function (pSuccCb) {
        XoW.logger.ms(_classInfo, 'drawing()');
            _layer.open({
                anim: 1,
                title: '画板',
                area: '800px',
                // content:'<div id ="drawer"  style="height:450px; width: 360px"><canvas  id="sketch"  width="320" height="400"></canvas><div id="Drawcolor" style="height: 50px; width: 100%;"><div id="Drawred" style="height: 25px; width: 25px; background-color: red; float: left;" title="红色"></div><div id="DrawBlack" style=" height: 25px;width:25px; background-color: black; float: left; margin-left: 4px" title="黑色"></div><div id="DrawLine" style=" height: 25px;width:25px; background-color: black; float: left; margin-left: 4px; background-color: darkgrey" title="线段大小"></div><div id="DrawJX" style=" height: 25px;width:25px; background-color: #00F7DE; float: left; margin-left: 4px;" title="矩形"></div><div id="DrawY" style=" height: 25px;width:25px;  background-color: #01AAED; float: left; margin-left: 4px;" title="圆"></div></div>',
                content: eleSketchpad,
                btn: ['保存', '发送'],
                btn1: function () {
                    downloadImage('jpg');
                },
                btn2: function () {
                    let pSendInfo=sendLoadImage('jpg');
                    if(pSendInfo!=null)
                        pSuccCb(pSendInfo.pThatChat,pSendInfo.pFileInfo,pSendInfo.pData);
                }
            });
        beginDrawing();
        XoW.logger.me(_classInfo, 'drawing()');
    };
    exports('Sketchpad', new Sketchpad())
})