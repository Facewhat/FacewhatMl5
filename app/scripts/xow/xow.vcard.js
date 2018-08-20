
(function(factory) {
	return factory(XoW);
}(function(XoW) {
	
XoW.VcardManager = function(globalManager) {
	this._gblMgr = globalManager;
	
	// this._vcardCbHandlers = [];
	// 当前类的信息
	this.classInfo = "【VcardManager】";
	
	this.handler = null;
	this._init();
};
XoW.VcardManager.prototype = {
		
	_init : function() {
		XoW.logger.ms(this.classInfo + "_init()");
		
		this.handler = new XoW.Handler();
		//this._connMgr.addHandler(handler, ns, name, type, id, from, options);
		// 监听vcard
		// this._gblMgr.getConnMgr().addHandler(this._vcardHandler_cb.bind(this), XoW.NS.VCARD, "iq", "result");
		
		XoW.logger.me(this.classInfo + "_init()");
	},
	init : function(globalManager) {
		XoW.logger.ms(this.classInfo + "init()");
		XoW.logger.d(this.classInfo + "初始化VcardManager");
		
		this._gblMgr = globalManager;
	
		XoW.logger.me(this.classInfo + "init()");
	},
	start : function() {
		XoW.logger.ms(this.classInfo + "start()");
		XoW.logger.d(this.classInfo + "启动VcardManager");
		
		XoW.logger.me(this.classInfo + "start()");
	},
	stop : function() {
		XoW.logger.ms(this.classInfo + "stop()");
		XoW.logger.d(this.classInfo + "停止VcardManager");
		
		XoW.logger.me(this.classInfo + "stop()");
	},
	destory : function() {
		XoW.logger.ms(this.classInfo + "destory()");
		XoW.logger.d(this.classInfo + "销毁VcardManager");
		
		this._gblMgr = null;
		this.handler = null;
		XoW.logger.me(this.classInfo + "destory()");
	},
	
	/**
     * 回调与触发。
     * @param proName
     * @param callback
     */
    addHandlerToVcardMgr : function(proName, callback) {
    	XoW.logger.ms(this.classInfo + "addHandlerToVcardMgr()");
    	XoW.logger.d(this.classInfo + "添加了一个监听，监听属性： " + proName);
    	this.handler.addHandler(proName, callback);
    	XoW.logger.me(this.classInfo + "addHandlerToVcardMgr()");
    },
    deleteHandlerInVcardMgr : function(id) {
    	XoW.logger.ms(this.classInfo + "deleteHandlerInVcardMgr()");
    	this.handler.deleteHandler(id);
    	XoW.logger.me(this.classInfo + "deleteHandlerInVcardMgr()");
    },
    triggerHandlerInVcardMgr : function(proName, params) {
    	XoW.logger.ms(this.classInfo + "triggerHandlerInVcardMgr()");
    	XoW.logger.d(this.classInfo + "触发的属性是： " + proName);
    	this.handler.triggerHandler(proName, params);
    	XoW.logger.me(this.classInfo + "triggerHandlerInVcardMgr()");
    },
    
    
    /**
     * 将Vcard节转为Vcard对象。
     */
    parseVcardStanzaToVcard : function(stanza) {
    	var $stanza = $(stanza);
    	
    	var vcardTemp = new XoW.Vcard();
    	// 如果有from，则说明不是自己的vcard。
		var jid = $stanza.attr('from');
		vcardTemp.jid = jid; 
		var $vcard = $stanza.find('vCard');
		
//		vcardTemp.N.FAMILY = $('N FAMILY', $vcard).text();
//		vcardTemp.N.GIVEN = $('N GIVEN', $vcard).text();
//		vcardTemp.N.MIDDLE = $('N MIDDLE', $vcard).text();
//		vcardTemp.ORG.ORGNAME = $('ORG ORGNAME', $vcard).text();
//		vcardTemp.ORG.ORGUNIT = $('ORG ORGUNIT', $vcard).text();
//		vcardTemp.FN = $('FN', $vcard).text();
//		vcardTemp.URL = $('URL', $vcard).text();
//		vcardTemp.TITLE = $('TITLE', $vcard).text();
//		vcardTemp.NICKNAME = $('NICKNAME', $vcard).text();
//		vcardTemp.PHOTO.BINVAL = $('PHOTO BINVAL', $vcard).text();
//		vcardTemp.PHOTO.TYPE = $('PHOTO TYPE', $vcard).text();
//		vcardTemp.EMAIL = $('EMAIL USERID', $vcard).text();
//		
//		vcardTemp.EMAIL = $('USERID', $vcard).text();
		
		
		Strophe.forEachChild(stanza, "vCard", function(vcard) {
			Strophe.forEachChild(vcard, "N", function(N) {
				Strophe.forEachChild(N, "FAMILY", function(FAMILY) {
					vcardTemp.N.FAMILY = FAMILY.textContent;
				});
				Strophe.forEachChild(N, "GIVEN", function(GIVEN) {
					vcardTemp.N.GIVEN = GIVEN.textContent;
				});
				Strophe.forEachChild(N, "MIDDLE", function(MIDDLE) {
					vcardTemp.N.MIDDLE = MIDDLE.textContent;
				});
			});
			Strophe.forEachChild(vcard, "ORG", function(ORG) {
				Strophe.forEachChild(ORG, "ORGNAME", function(ORGNAME) {
					vcardTemp.ORG.ORGNAME = ORGNAME.textContent;
				});
				Strophe.forEachChild(ORG, "ORGUNIT", function(ORGUNIT) {
					vcardTemp.ORG.ORGUNIT = ORGUNIT.textContent;
				});
			});
			Strophe.forEachChild(vcard, "FN", function(FN) {
				vcardTemp.FN = FN.textContent;
			});
			Strophe.forEachChild(vcard, "URL", function(URL) {
				vcardTemp.URL = URL.textContent;
			});
			Strophe.forEachChild(vcard, "TITLE", function(TITLE) {
				vcardTemp.TITLE = TITLE.textContent;
			});
			Strophe.forEachChild(vcard, "NICKNAME", function(NICKNAME) {
				vcardTemp.NICKNAME = NICKNAME.textContent;
			});
			Strophe.forEachChild(vcard, "PHOTO", function(PHOTO) {
				Strophe.forEachChild(PHOTO, "BINVAL", function(BINVAL) {
					vcardTemp.PHOTO.BINVAL = BINVAL.textContent;
					// $("#img1").attr("src","data:image/;base64,"+myHexData2);
				});
				Strophe.forEachChild(PHOTO, "TYPE", function(TYPE) {
					vcardTemp.PHOTO.TYPE = TYPE.textContent;
				});
			});
			Strophe.forEachChild(vcard, "EMAIL", function(EMAIL) {
				Strophe.forEachChild(EMAIL, "USERID", function(USERID) {
					vcardTemp.EMAIL = USERID.textContent;
				});
			});
			
			Strophe.forEachChild(vcard, "TEL", function(TEL) {
				var work = false, home = false;
				var pager = false, cell = false, voice = false, fax = false;
				Strophe.forEachChild(TEL, "WORK", function(WORK) { work= true;});
				Strophe.forEachChild(TEL, "HOME", function(HOME) { home = true;});
				Strophe.forEachChild(TEL, "PAGER", function(PAGER) { pager= true;});
				Strophe.forEachChild(TEL, "CELL", function(CELL) { cell= true;});
				Strophe.forEachChild(TEL, "VOICE", function(VOICE) { voice= true;});
				Strophe.forEachChild(TEL, "FAX", function(FAX) { fax = true;});
				if(work) {
					if(pager) {
						Strophe.forEachChild(TEL, "NUMBER", function(NUMBER) { 
							vcardTemp.WORK.PAGER_TEL = NUMBER.textContent; 
						});
					} else if(cell) {
						Strophe.forEachChild(TEL, "NUMBER", function(NUMBER) { 
							vcardTemp.WORK.CELL_TEL = NUMBER.textContent; 
						});
					} else if(voice) {
						Strophe.forEachChild(TEL, "NUMBER", function(NUMBER) { 
							vcardTemp.WORK.VOICE_TEL = NUMBER.textContent; 
						});
					} else if(fax) {
						Strophe.forEachChild(TEL, "NUMBER", function(NUMBER) { 
							vcardTemp.WORK.FAX_TEL = NUMBER.textContent; 
						});
					}
				} else if(home) {
					if(pager) {
						Strophe.forEachChild(TEL, "NUMBER", function(NUMBER) { 
							vcardTemp.HOME.PAGER_TEL = NUMBER.textContent; 
						});
					} else if(cell) {
						Strophe.forEachChild(TEL, "NUMBER", function(NUMBER) { 
							vcardTemp.HOME.CELL_TEL = NUMBER.textContent; 
						});
					} else if(voice) {
						Strophe.forEachChild(TEL, "NUMBER", function(NUMBER) { 
							vcardTemp.HOME.VOICE_TEL = NUMBER.textContent; 
						});
					} else if(fax) {
						Strophe.forEachChild(TEL, "NUMBER", function(NUMBER) { 
							vcardTemp.HOME.FAX_TEL = NUMBER.textContent; 
						});
					}
				}
			});
			Strophe.forEachChild(vcard, "ADR", function(ADR) {
				var work = false, home = false;
				Strophe.forEachChild(ADR, "WORK", function(WORK) { work= true;});
				Strophe.forEachChild(ADR, "HOME", function(HOME) { home = true;});
				if(work) { 
					Strophe.forEachChild(ADR, "PCODE", function(PCODE) { 
						vcardTemp.WORK.PCODE_ADR = PCODE.textContent; 
					});
					Strophe.forEachChild(ADR, "REGION", function(REGION) { 
						vcardTemp.WORK.REGION_ADR = REGION.textContent; 
					});
					Strophe.forEachChild(ADR, "STREET", function(STREET) { 
						vcardTemp.WORK.STREET_ADR = STREET.textContent; 
					});
					Strophe.forEachChild(ADR, "CTRY", function(CTRY) { 
						vcardTemp.WORK.CTRY_ADR = CTRY.textContent; 
					});
					Strophe.forEachChild(ADR, "LOCALITY", function(LOCALITY) { 
						vcardTemp.WORK.LOCALITY_ADR = LOCALITY.textContent; 
					});
				} else if(home) {
					Strophe.forEachChild(ADR, "PCODE", function(PCODE) { 
						vcardTemp.HOME.PCODE_ADR = PCODE.textContent; 
					});
					Strophe.forEachChild(ADR, "REGION", function(REGION) { 
						vcardTemp.HOME.REGION_ADR = REGION.textContent; 
					});
					Strophe.forEachChild(ADR, "STREET", function(STREET) { 
						vcardTemp.HOME.STREET_ADR = STREET.textContent; 
					});
					Strophe.forEachChild(ADR, "CTRY", function(CTRY) { 
						vcardTemp.HOME.CTRY_ADR = CTRY.textContent; 
					});
					Strophe.forEachChild(ADR, "LOCALITY", function(LOCALITY) { 
						vcardTemp.HOME.LOCALITY_ADR = LOCALITY.textContent; 
					});
				}
			});
		});

    	return vcardTemp;
    },
	
	/**
	 * 获得vcard。
	 * @param jid 
	 * @param successCb
	 * @param errorCb
	 * @param timeout
	 */
	getVcard : function(jid, successCb, errorCb, timeout) {
		XoW.logger.ms(this.classInfo + "getVcard()");
		
		// 通过测试发现，这里的jid不能为 '' ，这样会拼装到节中。
		if(!jid) {
			jid = null;
		}
		// 没有带from属性，服务器也能知道是“我”发送的，服务器中有做处理。
		vcard = $iq({
			id : XoW.utils.getUniqueId("getVcard"), 
			type : "get", 
			to : jid
		}).c("vCard", {
			xmlns : XoW.NS.VCARD
		});

		this._gblMgr.getConnMgr().sendIQ(vcard, function(stanza) {
			XoW.logger.d(this.classInfo + "获取vcard成功");
			// 解析vcard
			var vcardTemp = this.parseVcardStanzaToVcard(stanza);
			if(successCb) {
				var params = {
					vcard : vcardTemp , 
					vcardStanza : stanza,
				};
				successCb(params);
			} 
		}.bind(this), function(errorStanza) {
			XoW.logger.e('vvvvvvvvvvvvvvvvvvvvvvvvvv');
			XoW.logger.e('错误信息：');
			if(!errorStanza) {
				// 如果错误节为空，那么说明是超时了。
				XoW.logger.e('请求vcard超时！');
			} else {
				// $(errorStanza).
				XoW.logger.e('具体错误！');
			}
			
			XoW.logger.e('vvvvvvvvvvvvvvvvvvvvvvvvvv');
			if(errorCb) {
				var params = {
					errorStanza : errorStanza	
				};
				errorCb(params);
			}
		}, timeout);
		
		XoW.logger.me(this.classInfo + "getVcard()");
	},
};

XoW.Vcard = function() {
	this.jid = ''; // 纯jid 
	this.N = {
		FAMILY : "",
		GIVEN : "",
		MIDDLE : "",
	};
	
	this.ORG = {
		ORGNAME : "", // 公司
		ORGUNIT : "", // 部门
	};
	
	this.FN = "", // fullname 全名
	this.URL = "", // 网页，公司的
	this.TITLE = "", // 职称
	this.NICKNAME = "", // 昵称
	
	this.PHOTO = {
		BINVAL : "", // 图片的二进制
		TYPE : "", // 图片的类型
	};
	
	// 以下做了修改简化
	this.EMAIL = ""; // 邮箱
	
	// 商务的
	this.WORK = {
		PAGER_TEL : "", // 传呼机
		CELL_TEL : "", // 移动电话
		VOICE_TEL : "", // 电话
		FAX_TEL : "", // 传真
		
		PCODE_ADR : "", // 邮政编码
		REGION_ADR : "", // 省
		STREET_ADR : "", // 街道地址
		CTRY_ADR : "", // 国家
		LOCALITY_ADR : "", // 城市
	};
	// 家庭的
	this.HOME = {
		PAGER_TEL : "", // 传呼机
		CELL_TEL : "", // 移动电话
		VOICE_TEL : "", // 电话
		FAX_TEL : "", // 传真
		
		PCODE_ADR : "", // 邮政编码
		REGION_ADR : "", // 省
		STREET_ADR : "", // 街道地址
		CTRY_ADR : "", // 国家
		LOCALITY_ADR : "", // 城市
	};
};
return XoW;
}));
