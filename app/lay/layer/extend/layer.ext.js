/**
 
 @Name: layer拓展库，依赖于layer
 @Date: 2013.12.14
 @Author: 贤心
 @Versions：1.0.0
 @Api：http://sentsin.com/jquery/layer
 @Desc: 本拓展会持续更新

 **/
 
layer.use('skin/layer.ext.css', function(){
    
    //仿系统prompt
    layer.prompt = function(parme, yes, no){
        var log = {}, parme = parme || {}, conf = {
            area: ['auto', 'auto'],
            offset: [parme.top || '200px', ''],
            title: parme.title || '信息',
            dialog: {
                btns: 2,
                type: -1,
                msg: '<input type="'+ function(){
                    if(parme.type === 1){ //密码
                        return 'password';
                    } else if(parme.type === 2) {
                        return 'file';
                    } else {
                        return 'text';
                    }
                }() +'" class="xubox_prompt xubox_form" id="xubox_prompt" value="'+
                	function() {
                	if(null != parme.val) {
                		return parme.val;
                	} else {
                		return "";
                	}
                }()
                +'" />',
                yes: function(index){
                    var val = log.prompt.val();
                    yes && yes(val);
                    if(val === ''){
                        log.prompt.focus();
                    } else {
                        layer.close(index);
                    }
                }, no: no
            }, success: function(){
                log.prompt = $('#xubox_prompt');
            }
        };
        if(parme.type === 3){
            conf.dialog.msg = '<textarea class="xubox_prompt xubox_form xubox_formArea" id="xubox_prompt"></textarea>'
        }
        return $.layer(conf);
    };
    
    //tab层
    layer.tab = function(parme){
        var log = {}, parme = parme || {}, data = parme.data || [], conf = {
            type: 1,
            border: [0],
            area: ['auto', 'auto'],
            title: false,
            shade : parme.shade,
            move: ['.xubox_tabmove', true],
            closeBtn: false,
            page: {html: '<div class="xubox_tab" style="'+ function(){
                    parme.area = parme.area || [];
                    return 'width:'+ (parme.area[0] || '500px') +'; height:'+ (parme.area[1] || '300px') +'">';
                }()
                +'<span class="xubox_tabmove"></span>'
                +'<div class="xubox_tabtit">'
                +function(){
                    var len = data.length, ii = 1, str = '';
                    if(len > 0){
                        str = '<span class="xubox_tabnow">'+ data[0].title +'</span>';
                        for(; ii < len; ii++){
                            str += '<span>'+ data[ii].title +'</span>';
                        }
                    }
                    
                    return str;
                }() +'</div>'
                +'<ul class="xubox_tab_main">'+ function(){
                    var len = data.length, ii = 1, str = '';
                    if(len > 0){
                        str = '<li class="xubox_tabli xubox_tab_layer">'+ (data[0].content || '请配置content') +'</li>';
                        for(; ii < len; ii++){
                            str += '<li class="xubox_tabli">'+ (data[ii].content || '请配置content') +'</li>';
                        }
                    }
                    return str;
                }() +'</ul>'
                +'<span class="xubox_tabclose" title="关闭">X</span>'
                +'</div>'
            }, success: function(layerE){
                //切换事件
                var btn = $('.xubox_tabtit').children(), main = $('.xubox_tab_main').children(), close = $('.xubox_tabclose');
                btn.on('click', function(){
                    var othis = $(this), index = othis.index();
                    othis.addClass('xubox_tabnow').siblings().removeClass('xubox_tabnow');
                    main.eq(index).show().siblings().hide();
                });
                //关闭层
                close.on('click', function(){
                    layer.close(layerE.attr('times'));
                });
            }
        };
        return $.layer(conf);
    };
    
    //相册层
    layer.photo = function(selector, options){
       
    };
    layer.photos = function(a) {
    	var b, c, d, e, f, g, h, i;
    	if (a = a || {}, b = {
    		imgIndex: 1,
    		end: null,
    		html: $("html")
    	}, c = $(window), d = a.json, e = a.page, d) {
    		if (f = d.data, 1 !== d.status) return layer.msg("未请求到数据", 2, 8), void 0;
    		if (b.imgLen = f.length, !(f.length > 0)) return layer.msg("没有任何图片", 2, 8), void 0;
    		b.thissrc = f[d.start].src, b.pid = f[d.start].pid, b.imgsname = d.title || "", b.name = f[d.start].name, b.imgIndex = d.start + 1
    	} else g = $(e.parent).find("img"), h = g.eq(e.start), b.thissrc = h.attr("layer-img") || h.attr("src"), b.pid = h.attr("pid"), b.imgLen = g.length, b.imgsname = e.title || "", b.name = h.attr("alt"), b.imgIndex = e.start + 1;
    	return i = {
    		type: 1,
    		border: [0],
    		area: [(a.html ? 915 : 600) + "px", "auto"],
    		title: !1,
    		shade: [.9, "#000", !0],
    		shadeClose: !0,
    		offset: ["25px", ""],
    		bgcolor: "",
    		page: {
    			html: '<div class="xubox_bigimg"><img src="' + b.thissrc + '" alt="' + (b.name || "") + '" layer-pid="' + (b.pid || "") + '"><div class="xubox_imgsee">' +
    			function() {
    				return b.imgLen > 1 ? '<a href="" class="xubox_iconext xubox_prev"></a><a href="" class="xubox_iconext xubox_next"></a>' : ""
    			}() + '<div class="xubox_imgbar"><span class="xubox_imgtit"><a href="javascript:;">' + b.imgsname + " </a><em>" + b.imgIndex + "/" + b.imgLen + "</em></span></div></div></div>" +
    			function() {
    				return a.html ? '<div class="xubox_intro">' + a.html + "</div>" : ""
    			}()
    		},
    		success: function(a) {
    			b.bigimg = a.find(".xubox_bigimg"), b.imgsee = b.bigimg.find(".xubox_imgsee"), b.imgbar = b.imgsee.find(".xubox_imgbar"), b.imgtit = b.imgbar.find(".xubox_imgtit"), b.layero = a;
    			var c = b.imgs = b.bigimg.find("img");
    			clearTimeout(b.timerr), b.timerr = setTimeout(function() {
    				$("html").css("overflow", "hidden").attr("layer-full", b.index)
    			}, 10), c.load(function() {
    				b.imgarea = [c.outerWidth(), c.outerHeight()], b.resize(a)
    			}), b.event()
    		},
    		end: function() {
    			layer.closeAll(), b.end = !0
    		}
    	}, b.event = function() {
    		b.bigimg.hover(function() {
    			b.imgsee.show()
    		}, function() {
    			b.imgsee.hide()
    		}), i.imgprev = function() {
    			b.imgIndex--, b.imgIndex < 1 && (b.imgIndex = b.imgLen), b.tabimg()
    		}, b.bigimg.find(".xubox_prev").on("click", function(a) {
    			a.preventDefault(), i.imgprev()
    		}), i.imgnext = function() {
    			b.imgIndex++, b.imgIndex > b.imgLen && (b.imgIndex = 1), b.tabimg()
    		}, b.bigimg.find(".xubox_next").on("click", function(a) {
    			a.preventDefault(), i.imgnext()
    		}), $(document).keyup(function(a) {
    			if (!b.end) {
    				var c = a.keyCode;
    				a.preventDefault(), 37 === c ? i.imgprev() : 39 === c ? i.imgnext() : 27 === c && layer.close(b.index)
    			}
    		}), b.tabimg = function() {
    			var e, h, i, j, k;
    			b.imgs.removeAttr("style"), d ? (j = f[b.imgIndex - 1], e = j.src, h = j.pid, i = j.name) : (k = g.eq(b.imgIndex - 1), e = k.attr("layer-img") || k.attr("src"), h = k.attr("layer-pid") || "", i = k.attr("alt") || ""), b.imgs.attr({
    				src: e,
    				"layer-pid": h,
    				alt: i
    			}), b.imgtit.find("em").text(b.imgIndex + "/" + b.imgLen), b.imgsee.show(), a.tab && a.tab({
    				pid: h,
    				name: i
    			})
    		}
    	}, b.resize = function(d) {
    		var g, e = {},
    			f = [c.width(), c.height()];
    		e.limit = f[0] - f[0] / f[1] * (60 * f[0] / f[1]), e.limit < 600 && (e.limit = 600), g = [e.limit, f[1] > 400 ? f[1] - 50 : 400], g[0] = a.html ? g[0] : g[0] - 300, layer.area(b.index, {
    			width: g[0] + (a.html ? 15 : 0),
    			height: g[1]
    		}), e.flwidth = g[0] - (a.html ? 300 : 0), b.imgarea[0] > e.flwidth ? b.imgs.css({
    			width: e.flwidth
    		}) : b.imgs.css({
    			width: b.imgarea[0]
    		}), b.imgs.outerHeight() < g[1] && b.imgs.css({
    			top: (g[1] - b.imgs.outerHeight()) / 2
    		}), b.imgs.css({
    			visibility: "visible"
    		}), b.bigimg.css({
    			width: e.flwidth,
    			height: g[1],
    			"background-color": a.bgcolor
    		}), a.html && d.find(".xubox_intro").css({
    			height: g[1]
    		}), e = null, f = null, g = null
    	}, c.on("resize", function() {
    		b.end || (b.timer && clearTimeout(b.timer), b.timer = setTimeout(function() {
    			b.resize(b.layero)
    		}, 200))
    	}), b.index = $.layer(i), b.index
    }, layer.photosPage = function(a) {
    	var b = {};
    	b.run = function(b) {
    		layer.photos({
    			html: a.html,
    			success: a.success,
    			page: {
    				title: a.title,
    				id: a.id,
    				start: b,
    				parent: a.parent
    			}
    		})
    	}, a = a || {}, $(a.parent).find("img").each(function(a) {
    		$(this).on("click", function() {
    			b.run(a)
    		})
    	})
    };

    // imconn.showPersonInfo();

});