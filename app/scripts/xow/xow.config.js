/**
 * 配置文件咯
 */
(function (factory) {
  XoW.config = factory(XoW);
}(function (XoW) {
  "use strict";
  var config = {
    version: '2.0',
    serviceUrl: 'ws://120.24.53.76:7070/ws/',
    domain: '120.24.53.76',
    password: '123456',
    userId: 'ican',
    resource: 'fwh5_desktop'
  };

  // XoW.logger.init({logLevel:1});
  return config;
}));