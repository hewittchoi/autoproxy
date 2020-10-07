// ==UserScript==
// @name           My jQuery Plugin
// ==/UserScript==

(function ($) {
  $.getUrlParam = function(name, url, option) {//筛选参数，url 参数为数字时
    url=url ? url.replace(/^.+\?/,'') : location.search;
    //网址传递的参数提取，如果传入了url参数则使用传入的参数，否则使用当前页面的网址参数
    var reg = new RegExp("(?:^|&)(" + name + ")=([^&]*)(?:&|$)", "i");		//正则筛选参数
    var str = url.replace(/^\?/,'').match(reg);

    if (str !== null) {
      switch(option) {
        case 0:
          return unescape(str[0]);		//所筛选的完整参数串
        case 1:
          return unescape(str[1]);		//所筛选的参数名
        case 2:
          return unescape(str[2]);		//所筛选的参数值
        default:
          return unescape(str[2]);        //默认返回参数值
      } 
    } else {
      return null;
    }
  }
})(jQuery);
