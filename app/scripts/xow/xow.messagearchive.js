
(function(factory) {
	return factory(XoW);
}(function(XoW) {
	
XoW.MessageArchiveManager = function(globalManager) {
	this._gblMgr = globalManager;
	
	this.pageSize = 10; // 默认一页大小
	this.classInfo = "【MessageArchiveManager】";
	this._init();
};

XoW.MessageArchiveManager.prototype = {
	// 如何能够启动的时候，如果失败，那么就
	_init : function() {
		XoW.logger.ms(this.classInfo + "_init()");

		// 暂时不做，服务器是否支持该类的判断
		// 判断过程：把自己需要feature，去serverManager那边根据feature去获得服务器，看看有没有支持的。
		
		// 获得服务器的domain
		// this.serverDomain = XoW.utils.getDomainFromJid(this._gblMgr.getCurrentUser().jid);
		
		// ping IQ节监听
		// this._gblMgr.getConnMgr().addHandler(this._pingHandler.bind(this),XoW.NS.PING, "iq", "get");
		
		// 获取服务器能力
		// this.getServerAbility();
		XoW.logger.me(this.classInfo + "_init()");
	},

	
	firstPage : function(pageSize, ownerJid, withJid, keyWord, startDate, endDate, successCb, errorCb) {
		XoW.logger.me(this.classInfo + "firstPage");
		this.prevPage(pageSize, ownerJid, withJid, keyWord, startDate, endDate, null, successCb, errorCb);
		XoW.logger.me(this.classInfo + "firstPage");
	},
	/**
	 * 请求与好友的历史消息，当前页的上一页。
	 * @param pageSize 	一页历史消息数量
	 * @param ownerJid 	自己的JID
	 * @param withJid 	好友的JID
	 * @param keyWord	搜索用，内容包含
	 * @param startDate	搜索用，开始日期
	 * @param endDate	搜索用，结束日期
	 * @param before	在那条历史消息之前
	 * @param successCb	获取历史消息成功时的回调函数
	 * @param errorCb	获取历史消息失败时的回调函数
	 */
	prevPage : function(pageSize, ownerJid, withJid, keyWord, startDate, endDate, before, successCb, errorCb) {
		XoW.logger.ms(this.classInfo + "prevPage");
		if(!pageSize) {
			// 如果没有指定一页大小，就设为默认大小
			pageSize = this.pageSize; 
		}
		if(!ownerJid || !withJid) {
			// 如果没有传入自己的JID和好友的JID，则直接调用失败回调。
			if(errorCb) {
				errorCb(null, "jid不能为空");
			}
			return;
		}
		// 对开始日期和结束日期的格式化处理	
		var d1 = null;
		if('' != startDate) {
			d1 = XoW.utils.getFromatDatetime2(startDate); // 4.4
		} 
		var d2 = null;
		if('' != endDate) {
			d2 = XoW.utils.getFromatDatetime2(endDate); // 4.5
		}
		// 利用Strophe.Builder提供的方法，拼装要发送的报文。
		var iq = $iq({
			type : 'get',
			id : XoW.utils.getUniqueId("facewhatretrieve"),
			from : ownerJid,
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
		// 保留搜索条件，以便下次点击首页/上一页/下一页/尾页时作为搜索条件。 
		var condition = {
			pageSize : pageSize,
			ownerJid : ownerJid, 
			withJid : withJid, 
			keyWord : keyWord, 
			startDate : startDate, 
			endDate : endDate
		};
		this.getMessage(iq, condition, successCb, errorCb);
		XoW.logger.me(this.classInfo + "prevPage");
	},
	nextPage : function(pageSize, ownerJid, withJid, keyWord, startDate, endDate, after, successCb, errorCb) {
		XoW.logger.ms(this.classInfo + "nextPage");
		if(!pageSize) {
			pageSize = 50;
		}
		if(!ownerJid || !withJid) {
			if(errorCb) {
				errorCb(null, "jid不能为空");
			}
			return;
		}
			
		var d1 = null;
		if('' != startDate) {
			d1 = XoW.utils.getFromatDatetime2(startDate); // 4.4
		} 
		var d2 = null;
		if('' != endDate) {
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
		
		var condition = {
			pageSize : pageSize,
			ownerJid : ownerJid, 
			withJid : withJid, 
			keyWord : keyWord, 
			startDate : startDate, 
			endDate : endDate
		};
		this.getMessage(iq, condition, successCb, errorCb);
		XoW.logger.me(this.classInfo + "nextPage");
		
	},
	/**
	 * pageSize一页大小，即max,  
	 * ownerJid当前用户jid, 
	 * withJid 用户要获取的人的jid, 
	 * keyWord 关键字, 
	 * startDate 开始日期,  字符串也可，只要能作为new Date()的参数即可
	 * endDate 结束日期, 
	 * successCb 成功回调, 
	 * errorCb 失败回调
	 */
	lastPage : function(pageSize, count, ownerJid, withJid, keyWord, startDate, endDate, successCb, errorCb) {
		XoW.logger.ms(this.classInfo + "firstPage");
		var pageCount = count % pageSize == 0 ? count / pageSize : Math.floor(count / pageSize) + 1;
		var after =  (pageCount - 1) * pageSize - 1;
		this.nextPage(pageSize, ownerJid, withJid, keyWord, startDate, endDate, after, successCb, errorCb);
		XoW.logger.me(this.classInfo + "firstPage");
	},
	
	
	/**
	 * 获取与好友的历史消息
	 * @param iq 		拼装完成的节
	 * @param condition 下次点击首页/上一页/下一页/尾页时作为搜索条件
	 * @param successCb 获取历史消息成功时的回调函数
	 * @param errorCb	获取历史消息失败时的回调函数
	 */
	getMessage : function(iq, condition, successCb, errorCb) {
		// 调用ConnectionManager提供的sendIQ方法，发送拼装完成的iq节。
		this._gblMgr.getConnMgr().sendIQ(iq, function(stanza) {
			// 获取历史消息成功
			XoW.logger.d(this.classInfo + "请求消息记录成功 ");
			var $stanza = $(stanza);
			// 将要作为回调的参数。
			var params = {
				stanza : stanza,// 原始的节（报文）
				set : {}, 		// 结果中的set
				archive : [], 	// 所有消息
				condition : {}, // 为了下次再查使用
			};
			params.condition = condition;
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
		}, function(errorStanza) {
			// 获取历史消息失败
			if(errorCb) {
				// 如果存在失败回调，则进行调用，并直接返回报错的节（报文）。
				errorCb(errorStanza, "出现错误");
			}
		});
		XoW.logger.me(this.classInfo + "getMessage");
	},
	
	// firstPage : function(pageSize, ownerJid, withJid, keyWord, startDate, endDate, successCb, errorCb) {
	mucRoomFirstPage : function(pageSize, withJid, keyWord, nickname, startDate, endDate, successCb, errorCb) {
		this.mucRoomPrevPage(pageSize, withJid, keyWord, nickname, startDate, endDate, null, successCb, errorCb);
	},
	mucRoomPrevPage : function(pageSize, withJid, keyWord, nickname, startDate, endDate, before, successCb, errorCb) {
		if(!pageSize) {
			pageSize = 50;
		}
		if(!withJid) {
			if(errorCb) {
				errorCb(null, "jid不能为空");
			}
			return;
		}
//		if(!before) {
//			before = pageSize;
//		}
			
		var d1 = null;
		if('' != startDate) {
			d1 = XoW.utils.getFromatDatetime2(startDate); // 4.4
		} 
		var d2 = null;
		if('' != endDate) {
			d2 = XoW.utils.getFromatDatetime2(endDate); // 4.5
		}
		
		var iq = $iq({
			type : 'get',
			id : XoW.utils.getUniqueId("facewhatmucroomretrieve"),
		}).c('facewhatmucroomretrieve', {
			xmlns : XoW.NS.ARCHIVE,
			'with' : withJid,
			'start' : d1,
			'end' : d2,
			'keyword' : keyWord,
			'nickname' : nickname
		}).c('set', {
			xmlns : 'http://jabber.org/protocol/rsm'
		}).c('max').t(pageSize)
		.up().c('before').t(before);
		var condition = {
			pageSize : pageSize,
			withJid : withJid, 
			keyWord : keyWord,
			nickname : nickname,
			startDate : startDate, 
			endDate : endDate
		};
		this.getMUCRoomMessage(iq, condition, successCb, errorCb);
	},
	mucRoomNextPage : function(pageSize, withJid, keyWord, nickname, startDate, endDate, after, successCb, errorCb) {
		if(!pageSize) {
			pageSize = 50;
		}
		if(!withJid) {
			if(errorCb) {
				errorCb(null, "jid不能为空");
			}
			return;
		}
		if(!after) {
			// 如果没有值就请求第一页
			after = pageSize;
		}
			
		var d1 = null;
		if('' != startDate) {
			d1 = XoW.utils.getFromatDatetime2(startDate); // 4.4
		} 
		var d2 = null;
		if('' != endDate) {
			d2 = XoW.utils.getFromatDatetime2(endDate); // 4.5
		}
		
		var iq = $iq({
			type : 'get',
			id : XoW.utils.getUniqueId("facewhatmucroomretrieve"),
		}).c('facewhatmucroomretrieve', {
			xmlns : XoW.NS.ARCHIVE,
			'with' : withJid,
			'start' : d1,
			'end' : d2,
			'keyword' : keyWord,
			'nickname' : nickname
		}).c('set', {
			xmlns : 'http://jabber.org/protocol/rsm'
		}).c('max').t(pageSize)
		.up().c('after').t(after);
		var condition = {
			pageSize : pageSize,
			withJid : withJid, 
			keyWord : keyWord,
			nickname : nickname,
			startDate : startDate, 
			endDate : endDate
		};
		this.getMUCRoomMessage(iq, condition, successCb, errorCb);
	},
					
	mucRoomLastPage : function(pageSize, count, withJid, keyWord, nickname, startDate, endDate, successCb, errorCb) {
		XoW.logger.ms(this.classInfo + "mucRoomLastPage");
		var pageCount = count % pageSize == 0 ? count / pageSize : Math.floor(count / pageSize) + 1;
		var after =  (pageCount - 1) * pageSize - 1;
		this.mucRoomNextPage(pageSize, withJid, keyWord, nickname, startDate, endDate, after, successCb, errorCb);
		XoW.logger.me(this.classInfo + "mucRoomLastPage");
	},
	
	getMUCRoomMessage : function(iq, condition, successCb, errorCb) {
		XoW.logger.ms(this.classInfo + "getMUCRoomMessage");
		this._gblMgr.getConnMgr().sendIQ(iq, function(stanza) {
			XoW.logger.d(this.classInfo + "请求消息记录成功 ");
			var $stanza = $(stanza);
			var params = {
				stanza : stanza,
				set : {}, // 结果中的set
				archive : [], // 所有消息
				condition : {}, // 为了下次再查使用
			};
			params.condition = condition;
			$('facewhatmucroomchat', $stanza).children().each(function(index, item) {
				var $item = $(item);
				if($item.is('message')) {
					XoW.logger.d(this.classInfo + " 历史消息 ：发送者：" + $item.attr('sender') + " , 昵称：" + $item.attr('nickname') + "  , 时间：" + XoW.utils.getFromatDatetimeFromNS($item.attr('logtime')) + "  内容：" + $item.text());
					params.archive.push({
						sender : $item.attr('sender'),
						nickname : $item.attr('nickname'),
						logtime : XoW.utils.getFromatDatetimeFromNS($item.attr('logtime')),
						body : $item.text(),
					});
				} else if($item.is('set')) {
					params.set = {
						firstIndex : $item.find('first').text(),
						firstIndexAttr : $item.find('first').attr('index'),
						lastIndex : $item.find('last').text(),
						count : $item.find('count').text()
					};
				}
			});
			if(successCb) {
				successCb(params);
			} 
		}, function(errorStanza) {
			if(errorCb) {
				errorCb(errorStanza, "出现错误");
			}
		});
		XoW.logger.me(this.classInfo + "getMUCRoomMessage");
	},
	
	
	
	getMessage22 : function(pageSize, withJid, keyWord, nickname, startDate, endDate, successCb, errorCb) {
		XoW.logger.ms(this.classInfo + "getMessage");
		
		if(!pageSize) {
			pageSize = 50;
		}
		if(!withJid) {
			if(errorCb) {
				errorCb(null, "jid不能为空");
			}
			return;
		}
			
		var d1 = null;
		if(!startDate) {
			d1 = XoW.utils.getFromatDatetime2(startDate); // 4.4
		} 
		var d2 = null;
		if(!endDate) {
			d2 = XoW.utils.getFromatDatetime2(endDate); // 4.5
		}
		
		var iq = $iq({
			type : 'get',
			id : XoW.utils.getUniqueId("facewhatmucroomretrieve"),
		}).c('facewhatmucroomretrieve', {
			xmlns : XoW.NS.ARCHIVE,
			'with' : withJid,
			'start' : d1,
			'end' : d2,
			'keyword' : keyWord,
			'nickname' : nickname
		}).c('set', {
			xmlns : 'http://jabber.org/protocol/rsm'
		}).c('max').t(pageSize);
		gblMgr.getConnMgr().sendIQ(iq, function(stanza) {
			XoW.logger.d(this.classInfo + "请求消息记录成功 ");
			
			
			/*
			var $stanza = $(stanza);
			var params = {
				stanza : stanza,
				set : {}, // 结果中的set
				archive : [], // 所有消息
				condition : {}, // 为了下次再查使用
			};
			params.condition = {
				pageSize : pageSize,
				ownerJid : ownerJid, 
				withJid : withJid, 
				keyWord : keyWord, 
				startDate : startDate, 
				endDate : endDate
			},
			$('facewhatchat', $stanza).children().each(function(index, item) {
				var $item = $(item);
				if($item.is('from')) {
					XoW.logger.d(this.classInfo + " 对方发给我的，时间 " + XoW.utils.getFromatDatetimeFromNS($item.attr('secs')) + "  内容：" + $item.text());
					params.archive.push({
						type : 'from',
						secs : XoW.utils.getFromatDatetimeFromNS($item.attr('secs')),
						body : $item.text(),
					});
				} else if($item.is('to')) {
					XoW.logger.d(this.classInfo + " 我发给你对方的，时间 " + XoW.utils.getFromatDatetimeFromNS($item.attr('secs')) + "  内容：" + $item.text());
					params.archive.push({
						type : 'to',
						secs : XoW.utils.getFromatDatetimeFromNS($item.attr('secs')),
						body : $item.text(),
					});
				} else if($item.is('set')) {
					params.set = {
						firstIndex : $item.find('first').text(),
						firstIndexAttr : $item.find('first').attr('index'),
						lastIndex : $item.find('last').text(),
						count : $item.find('count').text()
					};
				}
			});
			if(successCb) {
				successCb(params);
			} */
		}, function(errorStanza) {
			
			if(errorCb) {
				errorCb(errorStanza, "出现错误");
			}
		});
		XoW.logger.me(this.classInfo + "getMessage");
	}
	
};


	
return XoW;
}));
