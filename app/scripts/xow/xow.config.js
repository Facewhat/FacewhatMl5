/**
 * 配置文件咯
 */
(function (factory) {
  XoW.config = factory(XoW);
}(function (XoW) {
  "use strict";
  var config = {
    version: '2.0',
    serviceUrl: 'ws://10.10.123.225:7070/ws/',
    // domain: '',
    password: '123456',
    userId: 'ican',
    resource: 'facewhatml5'
  };
  return config;
}));