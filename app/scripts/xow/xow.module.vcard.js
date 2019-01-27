'use strict';
(function (factory) {
  return factory(XoW, Strophe);
}(function (XoW, Strophe) {
  /**
   * 拆包解包，管理联系人、群组人员等vCard数据
   * @param globalManager
   * @constructor
   */
  XoW.VCardManager = function (globalManager) {
    // region Fields
    var _this = this;
    var _gblMgr = null;
    var _vCards = []; // 所有人的vCard列表
    this.classInfo = 'VCardManager';
    // endregion Fields

    // region Private Methods
    var _init = function () {
      XoW.logger.ms(_this.classInfo, '_init()');
      _gblMgr = globalManager;
      //_gblMgr.getConnMgr().addHandler(this._vcardHandler_cb.bind(this), XoW.NS.VCARD, 'iq', 'result');

      XoW.logger.me(_this.classInfo, '_init()');
    }
    var _addVCard = function(item) {
      XoW.logger.ms(_this.classInfo, '_addVCard({0})'.f(item.jid));
      item.jid = XoW.utils.getBareJidFromJid(item.jid);
      var vcIndex = _vCards.findIndex(function (x) {
        return x.jid === item.jid;
      });
      if( vcIndex < 0 ) {
        _vCards.push(item);
      } else {
        _vCards.splice(vcIndex, 1);
        _vCards.push(item);
      }
      XoW.logger.me(_this.classInfo, '_addVCard()');
    };
    var _cbError = function (stanza) {
      XoW.logger.ms(_this.classInfo, '_cbError()');
      if (!stanza) {
        // 如果错误节为空，那么说明超时
        stanza = 'vCard请求超时';
      }
      _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.ERROR, stanza);
    };
    var _cbGetVCard = function (stanza) {
      XoW.logger.ms(_this.classInfo, '_cbGetVCard()');
      var vCardTemp = _parseStanzaToVCard(stanza);
      XoW.logger.d(' 获得vCard: ' + vCardTemp.jid/* JSON.stringify(vCardTemp)*/);
      _addVCard(vCardTemp);
      _gblMgr.getHandlerMgr().triggerHandler(XoW.SERVICE_EVENT.CARD_RCV, vCardTemp);
      XoW.logger.me(_this.classInfo, '_cbGetVCard()');
    };
    /**
     * 将VCard节转为VCard对象。
     */
    var _parseStanzaToVCard = function (stanza) {
      XoW.logger.ms(_this.classInfo, '_parseStanzaToVCard()');
      var $stanza = $(stanza);
      var vCardTemp = new XoW.VCard();
      // 如果没有from（spark），或者from等于to（因为facewhatml5请求自己的vcard也带了to）则说明是自己的vCard。
      var jid = $stanza.attr('from');
      if(!jid) {
        jid = $stanza.attr('to');
        vCardTemp.isMine = true;
      }
      vCardTemp.jid = jid;
      var $vCard = $stanza.find('vCard');
      Strophe.forEachChild(stanza, 'vCard', function (vcard) {
        Strophe.forEachChild(vcard, 'N', function (N) {
          Strophe.forEachChild(N, 'FAMILY', function (FAMILY) {
            vCardTemp.N.FAMILY = FAMILY.textContent;
          });
          Strophe.forEachChild(N, 'GIVEN', function (GIVEN) {
            vCardTemp.N.GIVEN = GIVEN.textContent;
          });
          Strophe.forEachChild(N, 'MIDDLE', function (MIDDLE) {
            vCardTemp.N.MIDDLE = MIDDLE.textContent;
          });
        });
        Strophe.forEachChild(vcard, 'ORG', function (ORG) {
          Strophe.forEachChild(ORG, 'ORGNAME', function (ORGNAME) {
            vCardTemp.ORG.ORGNAME = ORGNAME.textContent;
          });
          Strophe.forEachChild(ORG, 'ORGUNIT', function (ORGUNIT) {
            vCardTemp.ORG.ORGUNIT = ORGUNIT.textContent;
          });
        });
        Strophe.forEachChild(vcard, 'FN', function (FN) {
          vCardTemp.FN = FN.textContent;
        });
        Strophe.forEachChild(vcard, 'URL', function (URL) {
          vCardTemp.URL = URL.textContent;
        });
        Strophe.forEachChild(vcard, 'TITLE', function (TITLE) {
          vCardTemp.TITLE = TITLE.textContent;
        });
        Strophe.forEachChild(vcard, 'NICKNAME', function (NICKNAME) {
          vCardTemp.NICKNAME = NICKNAME.textContent;
        });
        Strophe.forEachChild(vcard, 'BDAY', function (BDAY) {
          vCardTemp.BDAY = BDAY.textContent;
        });
        Strophe.forEachChild(vcard, 'DESC', function (DESC) {
          vCardTemp.DESC = DESC.textContent;
        });
        Strophe.forEachChild(vcard, 'PHOTO', function (PHOTO) {
          Strophe.forEachChild(PHOTO, 'BINVAL', function (BINVAL) {
            vCardTemp.PHOTO.BINVAL = BINVAL.textContent;
            // $('#img1').attr('src','data:image/;base64,'+myHexData2);
          });
          Strophe.forEachChild(PHOTO, 'TYPE', function (TYPE) {
            vCardTemp.PHOTO.TYPE = TYPE.textContent;
          });
        });
        Strophe.forEachChild(vcard, 'EMAIL', function (EMAIL) {
          Strophe.forEachChild(EMAIL, 'USERID', function (USERID) {
            vCardTemp.EMAIL = USERID.textContent;
          });
        });
        Strophe.forEachChild(vcard, 'TEL', function (TEL) {
          var work = false, home = false;
          var pager = false, cell = false, voice = false, fax = false;
          Strophe.forEachChild(TEL, 'WORK', function (WORK) {
            work = true;
          });
          Strophe.forEachChild(TEL, 'HOME', function (HOME) {
            home = true;
          });
          Strophe.forEachChild(TEL, 'PAGER', function (PAGER) {
            pager = true;
          });
          Strophe.forEachChild(TEL, 'CELL', function (CELL) {
            cell = true;
          });
          Strophe.forEachChild(TEL, 'VOICE', function (VOICE) {
            voice = true;
          });
          Strophe.forEachChild(TEL, 'FAX', function (FAX) {
            fax = true;
          });
          if (work) {
            if (pager) {
              Strophe.forEachChild(TEL, 'NUMBER', function (NUMBER) {
                vCardTemp.WORK.PAGER_TEL = NUMBER.textContent;
              });
            } else if (cell) {
              Strophe.forEachChild(TEL, 'NUMBER', function (NUMBER) {
                vCardTemp.WORK.CELL_TEL = NUMBER.textContent;
              });
            } else if (voice) {
              Strophe.forEachChild(TEL, 'NUMBER', function (NUMBER) {
                vCardTemp.WORK.VOICE_TEL = NUMBER.textContent;
              });
            } else if (fax) {
              Strophe.forEachChild(TEL, 'NUMBER', function (NUMBER) {
                vCardTemp.WORK.FAX_TEL = NUMBER.textContent;
              });
            }
          } else if (home) {
            if (pager) {
              Strophe.forEachChild(TEL, 'NUMBER', function (NUMBER) {
                vCardTemp.HOME.PAGER_TEL = NUMBER.textContent;
              });
            } else if (cell) {
              Strophe.forEachChild(TEL, 'NUMBER', function (NUMBER) {
                vCardTemp.HOME.CELL_TEL = NUMBER.textContent;
              });
            } else if (voice) {
              Strophe.forEachChild(TEL, 'NUMBER', function (NUMBER) {
                vCardTemp.HOME.VOICE_TEL = NUMBER.textContent;
              });
            } else if (fax) {
              Strophe.forEachChild(TEL, 'NUMBER', function (NUMBER) {
                vCardTemp.HOME.FAX_TEL = NUMBER.textContent;
              });
            }
          }
        });
        Strophe.forEachChild(vcard, 'ADR', function (ADR) {
          var work = false, home = false;
          Strophe.forEachChild(ADR, 'WORK', function (WORK) {
            work = true;
          });
          Strophe.forEachChild(ADR, 'HOME', function (HOME) {
            home = true;
          });
          if (work) {
            Strophe.forEachChild(ADR, 'PCODE', function (PCODE) {
              vCardTemp.WORK.PCODE_ADR = PCODE.textContent;
            });
            Strophe.forEachChild(ADR, 'REGION', function (REGION) {
              vCardTemp.WORK.REGION_ADR = REGION.textContent;
            });
            Strophe.forEachChild(ADR, 'STREET', function (STREET) {
              vCardTemp.WORK.STREET_ADR = STREET.textContent;
            });
            Strophe.forEachChild(ADR, 'CTRY', function (CTRY) {
              vCardTemp.WORK.CTRY_ADR = CTRY.textContent;
            });
            Strophe.forEachChild(ADR, 'LOCALITY', function (LOCALITY) {
              vCardTemp.WORK.LOCALITY_ADR = LOCALITY.textContent;
            });
          } else if (home) {
            Strophe.forEachChild(ADR, 'PCODE', function (PCODE) {
              vCardTemp.HOME.PCODE_ADR = PCODE.textContent;
            });
            Strophe.forEachChild(ADR, 'REGION', function (REGION) {
              vCardTemp.HOME.REGION_ADR = REGION.textContent;
            });
            Strophe.forEachChild(ADR, 'STREET', function (STREET) {
              vCardTemp.HOME.STREET_ADR = STREET.textContent;
            });
            Strophe.forEachChild(ADR, 'CTRY', function (CTRY) {
              vCardTemp.HOME.CTRY_ADR = CTRY.textContent;
            });
            Strophe.forEachChild(ADR, 'LOCALITY', function (LOCALITY) {
              vCardTemp.HOME.LOCALITY_ADR = LOCALITY.textContent;
            });
          }
        });
      });
      return vCardTemp;
    };
    // endregion Private Methods

    // region Public Methods
    /**
     * 本地查找
     * @param jid
     */
    this.getVCardByJid = function (jid) {
      XoW.logger.ms(_this.classInfo, 'getVCardByJid({0})'.f(jid));
      jid = XoW.utils.getBareJidFromJid(jid);
      var theVCard = _vCards.find(function (x) {
        return x.jid === jid;
      });
      return theVCard;
    };
    this.getVCard = function (jid, timeout) {
      XoW.logger.ms(_this.classInfo, 'getVCard({0})'.f(jid));
      // 通过测试发现，这里的jid不能为 '' ，这样会拼装到节中。
      if (!jid) {
        jid = null;
      }
      // 没有带from属性，服务器也能知道是“我”发送的，服务器中有做处理。
      // 在这里依赖了strophe todo 需要剥离么？
      var vCard = $iq({
        id: XoW.utils.getUniqueId('getVCard'),
        type: 'get',
        to: jid
      }).c('vCard', {
        xmlns: XoW.NS.VCARD
      });
      _gblMgr.getConnMgr().sendIQ(vCard, _cbGetVCard.bind(this), _cbError.bind(_this), timeout);
      XoW.logger.me(_this.classInfo, 'getVCard({0})'.f(jid));
    };
    this.getVCardWithCb = function (jid, pSucCb, timeout) {
      XoW.logger.ms(_this.classInfo, 'getVCardWithCb({0})'.f(jid));
      // 通过测试发现，这里的jid不能为 '' ，这样会拼装到节中。
      if (!jid) {
        jid = null;
      }
      var vCard = $iq({
        id: XoW.utils.getUniqueId('getVCard'),
        type: 'get',
        to: jid
      }).c('vCard', {
        xmlns: XoW.NS.VCARD
      });
      _gblMgr.getConnMgr().sendIQ(vCard, function (stanza) {
        XoW.logger.ms(_this.classInfo, '_cbGetVCardSync({0})'.f($(stanza).attr('id')));
        var vCardTemp = _parseStanzaToVCard(stanza);
        _addVCard(vCardTemp);
        pSucCb(vCardTemp);
        XoW.logger.me(_this.classInfo,  '_cbGetVCardSync()');
      }, _cbError.bind(_this), timeout);
      XoW.logger.me(_this.classInfo, 'getVCardWithCb({0})'.f(jid));
    };
    this.setVCard = function (pJid, pVCard, pSucCb, pTimeout) {
      XoW.logger.ms(_this.classInfo, 'setVCard({0})'.f(pJid));
      var iq = $iq({
        id: XoW.utils.getUniqueId('setVCard'),
        type: 'set'
      }).c('vCard', {
        xmlns: XoW.NS.VCARD
      }).c('NICKNAME', null, pVCard.NICKNAME)
        .c('DESC', null, pVCard.DESC)
        .c('BDAY', null, pVCard.BDAY)
        .c('EMAIL', null).c('INTERNET').up().c('PREF').up().c('USERID', null, pVCard.EMAIL)
        .up().c('TEL', null).c('WORK').up().c('CELL').up().c('NUMBER', null, pVCard.WORK.CELL_TEL);
      _gblMgr.getConnMgr().sendIQ(iq, function (stanza) {
        XoW.logger.ms(_this.classInfo, '_cbSetVCard({0})'.f($(stanza).attr('id')));
        pSucCb();
        XoW.logger.me(_this.classInfo,  '_cbSetVCard()');
      }, _cbError.bind(_this), pTimeout);
      XoW.logger.me(_this.classInfo, 'setVCard({0})'.f(pJid));
    };
    this.setMineInfoWithAvatar = function (pJid, pVCard, pSucCb, pTimeout) {
      XoW.logger.ms(_this.classInfo, 'setMineInfoWithAvatar({0})'.f(pJid));
      var iq = $iq({
        id: XoW.utils.getUniqueId('setVCard'),
        type: 'set'
      }).c('vCard', {
        xmlns: XoW.NS.VCARD
      }).c('NICKNAME', null, pVCard.NICKNAME)
        .c('DESC', null, pVCard.DESC)
        .c('BDAY', null, pVCard.BDAY)
        .c('EMAIL', null).c('INTERNET').up().c('PREF').up().c('USERID', null, pVCard.EMAIL)
        .up().c('TEL', null).c('WORK').up().c('CELL').up().c('NUMBER', null, pVCard.WORK.CELL_TEL)
        .up().c('PHOTO', null)
        .c('TYPE', null, pVCard.PHOTO.TYPE)
        .c('BINVAL', null, pVCard.PHOTO.BINVAL);
      _gblMgr.getConnMgr().sendIQ(iq, function (stanza) {
        XoW.logger.ms(_this.classInfo, '_cbSetAvatar({0})'.f($(stanza).attr('id')));
        pSucCb();
        XoW.logger.me(_this.classInfo,  '_cbSetAvatar()');
      }, _cbError.bind(_this), pTimeout);
      XoW.logger.me(_this.classInfo, 'setVCard({0})'.f(pJid));
    }
    // endregion Public Methods

    _init();
  };
  return XoW;
}));
