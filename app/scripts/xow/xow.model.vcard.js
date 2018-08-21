/**
 * Created by cy on 2018/3/8.
 */
(function (factory) {
  return factory(XoW);
}(function (XoW) {
  XoW.VCard = function () {
    var _this = this;
    this.jid = ''; // 纯jid
    this.isMine = false; // 是否登录者的vCard
    this.N = {
      FAMILY: '',
      GIVEN: '',
      MIDDLE: '',
    };
    this.ORG = {
      ORGNAME: '', // 公司
      ORGUNIT: '', // 部门
    };
    this.FN = ''; // full name 全名
    this.URL = ''; // 网页，公司的
    this.TITLE = ''; // 职称
    this.NICKNAME = ''; // 昵称
    this.PHOTO = {
      BINVAL: '', // 图片的二进制
      TYPE: '' // 图片的类型
    };
    // 以下做了修改简化
    this.EMAIL = ''; // 邮箱
    // 商务的
    this.WORK = {
      PAGER_TEL: '', // 传呼机
      CELL_TEL: '', // 移动电话
      VOICE_TEL: '', // 电话
      FAX_TEL: '', // 传真

      PCODE_ADR: '', // 邮政编码
      REGION_ADR: '', // 省
      STREET_ADR: '', // 街道地址
      CTRY_ADR: '', // 国家
      LOCALITY_ADR: '', // 城市
    };
    // 家庭的
    this.HOME = {
      PAGER_TEL: '', // 传呼机
      CELL_TEL: '', // 移动电话
      VOICE_TEL: '', // 电话
      FAX_TEL: '', // 传真

      PCODE_ADR: '', // 邮政编码
      REGION_ADR: '', // 省
      STREET_ADR: '', // 街道地址
      CTRY_ADR: '', // 国家
      LOCALITY_ADR: '', // 城市
    };

    this.classInfo = 'VCard' + this.jid;

    var _init = function () {
      XoW.logger.ms(_this.classInfo, '_init()');
      XoW.logger.me(_this.classInfo, '_init()');
    };
    _init();
  };
}));
