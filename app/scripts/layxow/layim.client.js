/**
 * Created by cy on 2018/3/12.
 */
layui.define(['jquery'], function(exports){
  window.$ = layui.$;
  var client = new XoW.GlobalManager();
  //输出test接口
  exports('client', client);
});
