// ==UserScript==
// @name        CNKI 中国知网自动导出 EndNote 格式题录
// @namespace   http://yuelong.info
// @author      YUE Long
// @description 参见博客 http://blog.yuelong.info/post/cnki-endnote-js.html
// @include     http://*.cnki.net/kns/ViewPage/viewsave.aspx?*
// @version     1.1.2
// @grant       none
// @supportURL  http://blog.yuelong.info/post/cnki-endnote-js.html
// ==/UserScript==

var myurl = window.location.href;
if (myurl.indexOf("EndNote") == -1) {
    submitFun('EndNote');
} else {
    if (myurl.indexOf("epub.cnki.net") !== -1) {
        $(".save.txt").trigger("click");
    }
    if (myurl.indexOf("search.cnki.net") !== -1) {
        $("#exportTxt").trigger("click");
    }
    //window.close();
}