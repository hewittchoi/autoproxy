// ==UserScript==
// @name         RSS+ : Show Site All RSS
// @name:zh      RSS+ : 显示当前网站所有的 RSS
// @name:zh-CN   RSS+ : 显示当前网站所有的 RSS
// @name:zh-TW   RSS+ : 顯示當前網站所有的 RSS
// @description         Show Site All RSS.
// @description:zh      显示当前网站所有的 RSS
// @description:zh-CN   显示当前网站所有的 RSS
// @description:zh-TW   顯示當前網站所有的 RSS
// @date          2018.09.16
// @modified	  2019.04.28
// @version       0.4.3

// @icon         http://www.inoreader.com/favicon.ico
// @author       Wizos
// @namespace    https://blog.wizos.me
// @supportURL   wizos@qq.com
// @contributionURL   https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=wizos@qq.com&item_name=Greasy+Fork+donation
// @contributionAmount 2
// @include *
// @match        http://*/*
// @match        https://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant        GM_notification
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @noframes
// @run-at     document-end
// ==/UserScript==

// 2019.04.26_0.4.2 1.修复默认圆圈状态下宽度太宽，导致遮挡下层页面事件触发的问题。2.将icon由字体改为svg形式，修复部分站点无法显示icon的问题。3.优化RSS没有title时的默认名称。
// 2018.11.10_0.4.1 关闭发现RSS后的h5通知
// 2018.10.29_0.4 1.在无法链接服务器时也能展示本地的RSS；2.针对开启 Content-Security-Policy 的网站直接展示本地的RSS；3.发现RSS后，进行h5通知
// 2018.10.23_0.4 1.增加识别为 wordpress 站点时，尝试使用/feed后缀；2.增加多语言支持
// 2018-10-16_0.3 1.改为iframe方式显示，兼容性更好；2.改为post方式传递页面地址；
// 2018-10-14_0.2 第一版 RSS+ 成型；
// 2018.09.16_0.1 在 RSS+Atom Feed Subscribe Button Generator 脚本基础上增加连接后端获取feed的方式；
if(location.href.match(/api\.wizos\.me/i)){
    return;
}

var feeds = [];
var feedsMap = {};

var zhcn = {
    "no_title":"无名称",
    "copied":"已复制",
    "copy" : "复制",
    "copy_succeeded" : "复制成功",
    "follow" : "订阅",
    "found":"发现 ",
    "feed": " 个订阅源",
    "click_the_number_to_view":"点击右下角的数字查看",
    "close": "关闭"
};
var zh = zhcn;
var zhtw = {
    "no_title":"無名稱",
    "copied":"已複製",
    "copy" : "複製",
    "copy_succeeded" : "複製成功",
    "follow" : "訂閱",
    "found":"發現 ",
    "feed": " 個訂閱源",
    "click_the_number_to_view":"點擊右下角的數位查看",
    "close": "關閉"
};
var en = {
    "no_title":"NO TITILE",
    "copied":"copied",
    "copy" : "copy",
    "copy_succeeded" : "copy succeeded",
    "follow" : "follow",
    "found":"found ",
    "feed": " feed",
    "click_the_number_to_view":"click on the number in the lower right corner to view it",
    "close": "close"
};

var languages = {};
languages.zhcn = zhcn;
languages.zhtw = zhtw;
languages.zh = zh;
languages.en = en;
var language = navigator.language.replace('-',"").toLowerCase();
var lang = languages[language];
if( !lang ){
  lang = languages.en;
}

setTimeout(function(){
    if(location.href.match(/github\.com/i)){
        show();
    }else{
        showWithCloudFeeds( location.href );
    }
},0);


function showWithCloudFeeds(url) {
    var ajax = new XMLHttpRequest();
    ajax.onreadystatechange = function() {
        //console.log("当前状态A：" + ajax.readyState + "，" + ajax.status );
        if ( ajax.readyState != 4 ) {
            return;
        }
        if( ajax.status == 200 ){
            var obj = JSON.parse(ajax.responseText);
            show(obj.feeds);
        }else{
            show();
        }
    };
    ajax.open("POST", "https://api.wizos.me/find.php", true);
    var data = new FormData();
    data.append("url",url);
    ajax.send( data );
}

function show(cloudFeeds) {
    getKnowFeeds();
    getUnknownFeeds();
    if (cloudFeeds != null) {
      console.log("云端有feeds");
      console.log(cloudFeeds);
      cloudFeeds.forEach(element => {
          addRSS(element.title, element.link, element.type);
      });
    }
    render(feeds);
}

function addRSS(title, link, type) {
  // console.log("添加新的RSS：" + title + "，" + link);
  var feed = {};
  feed.title = title;
  feed.link = link.toLowerCase().replace(/(\/$)/g,"");
    // 放重复
    if (!feedsMap[feed.link]) {
      //如果能查找到，证明数组元素重复了
      feedsMap[feed.link] = 1;
      feeds.push(feed);
    }
}

// 获取在<head>的<link>元素中，已经声明为RSS的链接
function getKnowFeeds() {
  var linkElems = document.getElementsByTagName("link");
  var link;
  for (var i = 0, l = linkElems.length; i < l; i++) {
    link = linkElems[i];
    if (!link) continue;
    var linkhref = link.href;
    var linktype = link.type;
    var linktitle = document.title;
    if (link.title) {
      linktitle = link.title;
    }
    if (linktype && linktype.match(/.*\/(rss|atom)\+xml?$/i)) {
      addRSS(linktitle, linkhref);
    } else if (linktype && linktype.match(/^text\/xml$/i)) {
      addRSS(linktitle, linkhref);
    }
  }
}

function getUnknownFeeds() {
  var link;

  if (!document.links) {
    document.links = document.getElementsByTagName("a");
  }
  var links = document.links;
  for (var a = 0, len = links.length; a < len; a++) {
    link = links[a];
    var linkhref = link.href;
    var linktitle = document.title;
    if (link.title) {
      linktitle = link.title;
    } else if (link.innerText) {
      linktitle = link.innerText;
    }
    // console.log("检查RSS：" + linkhref + "  , " + link.title);
    if (
      linkhref.match(/^rss:/) ||linkhref.match( /^(https|http|ftp|feed).*([\.\/]rss([\.\/]xml|\.aspx|\.jsp|\/)?$|\/node\/feed$|\/feed(\.xml|\/$|$)|\/rss\/[a-z0-9]+$|[?&;](rss|xml)=|[?&;]feed=rss[0-9.]*$|[?&;]action=rss_rc$|feeds\.feedburner\.com\/[\w\W]+$)/i)) {
      addRSS(linktitle, linkhref);
    } else if ( linkhref.match(/^(https|http|ftp|feed).*\/atom(\.xml|\.aspx|\.jsp|\/)?$|[?&;]feed=atom[0-9.]*$/i ) ) { // atom
      addRSS(linktitle, linkhref);
    } else if (
      linkhref.match(
        /^(https|http|ftp|feed).*(\/feeds?\/[^.\/]*\.xml$|.*\/index\.xml$|feed\/msgs\.xml(\?num=\d+)?$)/i
      )
    ) {
      addRSS(linktitle, linkhref);
    } else if (linkhref.match(/^(https|http|ftp|feed).*\.rdf$/i)) {
      addRSS(linktitle, linkhref);
    } else if (linkhref.match(/^feed:\/\//i)) {
      addRSS(linktitle, linkhref);
    } else if (linkhref.match(/^(https|http):\/\/feed\./i)) {
      addRSS(linktitle, linkhref);
    } else if (linkhref.match(/(bitcron\.com|typecho\.org)/i)) {
      checkFeed( document.location.protocol + '//' + document.domain );
      break;
    }
  }

  if ( feeds.length != 0 ){
    return;
  }

  var headlinks = document.querySelectorAll("head > link");
  for (var i = 0, len = headlinks.length; i < len; i++) {
    link = headlinks[i];
    if(link.href.match(/(wp-content)/i)){
      checkFeed( document.location.protocol + '//' + document.domain );
      break;
    }
  }
}

var wp_feed_suffix = ['/?feed=rss2','/?feed=rss','/feed'];
function checkFeed(href) {
  checkFeed2("HEAD",href,wp_feed_suffix.pop() );
}
function checkFeed2(method,href,flag) {
  method = arguments[0] ? arguments[0] : "HEAD";
  flag = arguments[2] ? arguments[2] : wp_feed_suffix.pop();
  console.log("函数：" + flag + "，网址：" + href + "，后缀：" + flag );
  if( !flag){
      return;
  }
  // console.log("函数：" + flag + "，网址：" + href + "，后缀：" + flag );
  var ajax = new XMLHttpRequest();
  ajax.onreadystatechange = function() {
      console.log("返回结果：" + ajax.readyState + "，状态：" + ajax.status );
    if( ajax.readyState == 4 ) {
      if( ajax.status == 200 ){
        addRSS(document.title, href + flag);
      } else if( ajax.status == 405 ){
        checkFeed2("GET",href,flag);
      } else{
        checkFeed(href);
      }
    }
  };
  ajax.open(method, href + flag, false);
  ajax.send();
}


function render(feeds) {
  if (!feeds || feeds.length <= 0) {
    console.log("该页没有发现feed");
    return;
  }
  var rss_plus_html = "";
  var element, tips, desc;
  for (var i = 0; i < feeds.length; i++) {
    element = feeds[i];
    tips = "";
    desc = "";
    // console.log("feed信息：" + element.title + element.link);

    if (!element.title) {
      element.title = lang.no_title;
    }
    if (element.follows) {
      tips = " - " + element.follows + "人订阅";
    }
    if (element.update) {
      tips += " - " + element.update + "更新";
    }
    if (element.desc) {
      desc = ' title="' + element.desc + '"';
    }
    rss_plus_html +=
      '<tr><td class=""><div class="rp-table-cell"><div class="feed-title"' +
      desc +
      ">" +
      element.title +
      '</div><div class="feed-tips"><a href="' + element.link + '" target="_blank">' +
      element.link + '</a>' +
      tips +
      '</div></div></td><td class="rp-table-column-center"><div class="rp-table-cell" sytle="display:inline">';
    rss_plus_html +=
      '<button type="button" index="' +
      i +
      '" class="rp-btn rp-btn-primary rp-btn-small rp-copy-feed-link" data-clipboard-action="copy" data-clipboard-target=".feed-title"><span>' + lang.copy +'</span></button>';
    rss_plus_html +=
      '<button type="button" index="' +
      i +
      '" class="rp-btn rp-btn-primary rp-btn-small rp-follow-feed-link"><span>' + lang.follow +'</span></button></div></td></tr>';
  }

  var rss_count_badge_html =
    '<div id="rp-feed-badge" class="rp-card rp-card-bordered"><span class="rp-badge-count" place="count">' +
    feeds.length +
    "</span></div>";

  var rss_feed_list_html =
    '<div id="rp-feed-list" class="rp-card rp-card-bordered"><div id="rp-card-head" class="rp-card-head"><div class="card-title">' + icon_logo + lang.found +'<span class="rp-mark-count" place="count">' +
    feeds.length +
    '</span>' + lang.feed +' -【RSS+】</div></div><div class="rp-card-extra"><button type="button" id="rp-close-btn" class="rp-btn rp-btn-dashed" title="' + lang.close +'"><span>'+ icon_close +'</span></button></div>';

  rss_feed_list_html +=
    '<div id="rp-card-body"><div class="rp-table"><table cellspacing="0" cellpadding="0" border="0"><colgroup><col width="70%"><col width="30%"></colgroup><tbody class="rp-table-tbody">' +
    rss_plus_html +
    "</tbody></table></div></div></div></div>";

  var styleEl = document.createElement("style");
  styleEl.innerHTML = styleHtml;

  // 安装 RSS Plus Box 和 RSS Plus Frame
  var rssPlusDiv = document.createElement("div");
  rssPlusDiv.setAttribute("id", "rss-plus");

  var rssPlusWrapDiv = document.createElement("div");
  rssPlusWrapDiv.setAttribute("id", "rss-plus-wrap");
  rssPlusWrapDiv.innerHTML = '<iframe name="rpJSFrame" src="about:blank" style="width:100%;height:100%;border:0px;display: block!important;" allowTransparency="true"></iframe>';

  var rssPlusWrapStyle = document.createElement("style");
  rssPlusWrapStyle.innerHTML = '#rss-plus-wrap{position:fixed;bottom:5px;right:5px;z-index:9999;width:30px;height:30px;}iframe{max-width: 100%!important;margin:0px !important;}';

  rssPlusDiv.insertBefore(rssPlusWrapDiv,rssPlusDiv.firstChild);
  rssPlusDiv.insertBefore(rssPlusWrapStyle, rssPlusWrapDiv);

  //var head = document.getElementsByTagName("head");
  //if (head && head[0]) head = head[0];
  var body = document.getElementsByTagName("body");
  if (body && body[0]) body = body[0];
  insertAfter(rssPlusDiv, body.lastChild);
  // body.insertBefore(rssPlusBoxDiv, body.firstChild);

  var rssPlusBoxDiv = document.createElement("div");
  rssPlusBoxDiv.setAttribute("id", "RSSPlusBox");
  rssPlusBoxDiv.innerHTML = rss_count_badge_html + rss_feed_list_html;

  var frameBody = rpJSFrame.window.document.getElementsByTagName("body");
  if (frameBody && frameBody[0]) frameBody = frameBody[0];
  frameBody.insertBefore(rssPlusBoxDiv, frameBody.firstChild);
  frameBody.insertBefore(styleEl, frameBody.firstChild);

  var rpFeedBadgeDiv = rpJSFrame.window.document.getElementById("rp-feed-badge");
  var rpCloseDiv = rpJSFrame.window.document.getElementById("rp-close-btn");
  addEventHandler(rpCloseDiv, "click", function() {
    rpJSFrame.window.document.getElementById("rp-feed-list").style.display = "none";
    rpJSFrame.window.document.getElementById("rp-feed-badge").style.display = "block";
    rssPlusWrapDiv.style.width = rpJSFrame.window.document.getElementById("rp-feed-badge").offsetWidth  + "px";
    rssPlusWrapDiv.style.height = rpJSFrame.window.document.getElementById("rp-feed-badge").offsetHeight  + "px";

  });
  addEventHandler(rpFeedBadgeDiv, "click", function() {
    rpJSFrame.window.document.getElementById("rp-feed-list").style.display = "block";
    rpJSFrame.window.document.getElementById("rp-feed-badge").style.display = "none";
    rssPlusWrapDiv.style.width = rpJSFrame.window.document.getElementById("RSSPlusBox").offsetWidth + "px";
    rssPlusWrapDiv.style.height = rpJSFrame.window.document.getElementById("RSSPlusBox").offsetHeight + "px";
  });

  var copyFeedLinkButtons = rpJSFrame.window.document.getElementsByClassName("rp-copy-feed-link");
  var followFeedLinkButtons = rpJSFrame.window.document.getElementsByClassName("rp-follow-feed-link");
  for (i = 0; i < copyFeedLinkButtons.length; i++) {
    addEventHandler(copyFeedLinkButtons[i], "click", function() {
      copyFeedLink(this.getAttribute("index"));
    });
  }
  for (i = 0; i < followFeedLinkButtons.length; i++) {
    addEventHandler(followFeedLinkButtons[i], "click", function() {
      followFeedLink(this.getAttribute("index"));
    });
  }

}

function notification(size) {
  GM_notification({
    title: lang.found + " " + size + " " + lang.feed,
    text: lang.click_the_number_to_view,
    timeout: 3000
  });
}

function copyFeedLink(index) {
  GM_setClipboard(feeds[index].link);
  GM_notification({
    text:  lang.copied + ": " + feeds[index].link,
    title: lang.copy_succeeded,
    timeout: 2000
  });
}

function followFeedLink(index) {
  // [feedly]https://feedly.com/i/subscription/feed%2Fhttp%3A%2F%2Ffeeds.howtogeek.com%2FHowToGeek
  // [inoreader]http://www.inoreader.com/?add_feed=https%3A%2F%2Fwww.howtogeek.com%2Ffeed%2F
  // [NewsBlur]http://www.newsblur.com/?url=https%3A%2F%2Ffeeds.howtogeek.com%2FHowToGeek
  // [theoldreader]https://theoldreader.com/feeds/subscribe?url=https://api.izgq.net/weibo/rss/1197161814
  window.open("https://www.inoreader.com/?add_feed=" + feeds[index].link, "_blank");
}

function addEventHandler(target, eventName, eventHandler, scope) {
  var f = scope? function() {
        eventHandler.apply(scope, arguments);
      }
    : eventHandler;
  if (target.addEventListener) {
    target.addEventListener(eventName, f, true);
  } else if (target.attachEvent) {
    target.attachEvent("on" + eventName, f);
  }
  return f;
}

function setupJsIframe(){
  var jsIframeDiv = document.createElement("div");
  jsIframeDiv.setAttribute("id", "RSSPlusFrame");
  jsIframeDiv.innerHTML = '<iframe name="rpJSFrame" src="about:blank" style="width:100%;height:100%;border:0px;display: block!important;" allowTransparency="true"></iframe>';
  var body = document.getElementsByTagName("body");
  if (body && body[0]) body = body[0];
  insertAfter(jsIframeDiv, body.lastChild);
}

// source: https://blog.csdn.net/liuyingshuai_blog/article/details/54580633?utm_source=copy
function insertAfter(newElement,targetElement){
  var parent=targetElement.parentNode;
  if(parent.lastChild==targetElement){
    parent.appendChild(newElement);
  }else{
    parent.insertBefore(newElement,targetElement.nextSibling);
  }
}


var icon_logo = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 1024 1024"><<defs><style type="text/css"></style></defs><path d="M129.832 884.872a381.336 81.488 0 1 0 762.672 0 381.336 81.488 0 1 0-762.672 0Z" fill="#B8CBCD" p-id="1377"></path><path d="M208.52 243.224c-22.608-66.672 13.44-102.72 80.112-80.112l38.12 12.92L459.2 220.944c6.176 2.096 15.192 0.856 20.024-2.744l111.376-83.112 33.68-25.136c56.424-42.104 101.848-18.96 100.952 51.432l-0.512 40.024-1.784 139.96c-0.088 6.584 2.824 14.072 6.456 16.648 3.64 2.568 52.992 38.84 109.672 80.592l41.896 30.864c56.68 41.76 47.664 91.728-20.032 111.056l-41.832 11.936c-67.696 19.32-127.032 36.36-131.848 37.856-4.832 1.504-10.48 8.2-12.56 14.896-2.08 6.696-20.872 67.176-41.776 134.4l-11.424 36.736c-20.896 67.224-71.248 75.2-111.896 17.72l-28.4-40.144-78.176-110.544c-2.344-3.32-9.384-5.976-15.632-5.896l-139.36 1.784-41.216 0.528c-70.4 0.896-93.536-44.528-51.44-100.944l26.032-34.888L264.064 433.2c3.368-4.504 4.312-13.512 2.112-20.016l-45.12-133.04-12.536-36.92z" fill="#F6E89A" p-id="1378"></path><path d="M566.6 896.488c-27.272 0-54.488-17.24-76.616-48.544l-28.4-40.144-75.072-106.16-181.768 2.176c-57.552 0-79.488-26.6-87.44-42.456-8.024-16.008-16.256-49.872 18.808-96.856l107.224-143.688a1.632 1.632 0 0 0-0.032-0.312l-57.528-169.584c-15.696-46.272-5.656-74.584 5.528-90.184 19.992-27.872 59.288-35.856 105.024-20.36l169.752 57.56 0.168-0.016 143.664-107.2c22.928-17.112 45.304-25.792 66.488-25.792 18.512 0 34.968 6.768 47.608 19.576 16.912 17.128 25.624 43.816 25.2 77.192l-0.832 64.472c-0.752 58.376-1.368 107.024-1.464 114.936 13.904 10.144 62.248 45.696 106.352 78.184l41.896 30.864c47.464 34.968 49.192 69.84 46.008 87.52-3.184 17.68-17 49.752-73.688 65.936l-41.832 11.936a35027.144 35027.144 0 0 0-128.04 36.728 0.856 0.856 0 0 0-0.072 0.152l-53.168 171.064c-14.392 46.384-42.744 72.992-77.768 73zM387.088 653.504c11.472 0 27.16 4.208 35.52 16.056l78.168 110.528 28.4 40.144c12.512 17.696 26.504 28.264 37.432 28.256 12.184 0 24.432-15.04 31.952-39.248l53.2-171.128c3.768-12.08 13.984-26.24 28.368-30.704 5.528-1.72 71.656-20.688 132.384-38.024l41.832-11.936c22.792-6.504 37.6-17.08 39.624-28.296 2.024-11.216-8.168-26.304-27.24-40.352l-41.896-30.864c-61.624-45.4-106.256-78.176-109.28-80.312-11.704-8.296-16.768-24.336-16.608-36.568l1.472-115.496 0.832-64.472c0.248-19.664-3.888-35.288-11.36-42.856-3.56-3.616-7.84-5.296-13.456-5.296-10.312 0-23.736 5.776-37.792 16.264L493.552 237.44c-10.912 8.136-28.664 10.784-42.08 6.232L280.92 185.84c-24.128-8.184-43.456-7.104-50.592 2.864-6.36 8.872-6.016 26.368 0.912 46.808l57.648 169.984c4.744 14 2.432 31.304-5.616 42.08L174.584 593.216c-14.136 18.944-19.504 36.376-14.368 46.632 5.016 10 21.664 15.976 44.528 15.976l42.952-0.536 139.368-1.784h0.024z" fill="#8D4520" p-id="1379"></path><path d="M407.296 713.44a23.976 23.976 0 0 1-19.928-10.592l-20.152-29.944H149.624c-10.704 0-20.208-5.672-24.832-14.8-4.864-9.632-3.544-21.144 3.536-30.776l73.568-100.024c34.4-46.768 65.376-88.84 72.896-99.016a1.816 1.816 0 0 0-0.032-0.328c-1.736-5.064-21.912-58.88-49.016-130.296l-4.776-12.592c-22.096-58.224-4.672-87.296 7.688-99.448 11.44-11.248 38.048-27.168 87.744-7.344 57.136 22.792 103.344 40.96 116.336 45.872 1.712-0.664 4.232-1.984 6.384-3.872l15.472-13.584a24 24 0 1 1 31.656 36.08l-15.456 13.56c-12.872 11.304-33.4 20.168-50.24 14.456-7.664-2.6-68.536-26.64-121.928-47.936-19.36-7.728-32.184-7.072-36.312-3.016-5.168 5.088-6.272 22.336 3.536 48.192l4.776 12.592c22.424 59.08 47.152 124.728 49.72 132.304 4.744 14 2.432 31.312-5.624 42.08-3.328 4.472-36.712 49.8-74.152 100.704l-50.872 69.168h181.808c12.728 0 25.84 6.784 32.632 16.88l23.048 34.24a24 24 0 0 1-6.504 33.32 23.744 23.744 0 0 1-13.384 4.12z" fill="#FFFFFF" p-id="1380"></path><path d="M599.296 895.168l-46.592-11.544 33.2-133.96c15.208-61.36 32.44-129.664 34.952-137.752 3.768-12.08 13.984-26.24 28.368-30.704 7.048-2.192 84.76-20.24 135.272-31.832l29.376-6.744c28.376-6.512 37.296-16.584 38.056-20.992 0.76-4.408-4.312-16.872-28.912-32.448l-23.728-15.032c-41.984-26.584-110.544-70.144-115.776-73.84-11.688-8.272-16.752-24.312-16.592-36.552 0.088-7.08 1.384-73.52 2.616-135.488l2.472-123.352 47.984 0.96-2.472 123.344c-1.384 69.672-2.456 125.056-2.592 134.32 12.888 8.352 56.024 35.848 110.048 70.056l23.728 15.032c50.568 32.024 53.368 64.552 50.536 81.096-2.824 16.544-16.288 46.296-74.632 59.68l-29.376 6.744c-64.416 14.784-114.64 26.584-128.552 30.056l-0.008 0.008c-1.712 5.552-16.184 62.416-34.168 134.984l-33.208 133.96z" fill="#8D4520" p-id="1381"></path><path d="M566.6 896.488c-27.272 0-54.488-17.24-76.616-48.544l-28.4-40.144-75.072-106.16-181.768 2.176c-57.552 0-79.488-26.6-87.44-42.456-8.024-16.008-16.256-49.872 18.808-96.856l107.224-143.688a1.632 1.632 0 0 0-0.032-0.312l-57.528-169.584c-15.696-46.272-5.656-74.584 5.528-90.184 19.992-27.872 59.288-35.856 105.024-20.36l169.752 57.56 0.168-0.016 143.664-107.2c22.928-17.112 45.304-25.792 66.488-25.792 18.512 0 34.968 6.768 47.608 19.576 16.912 17.128 25.624 43.816 25.2 77.192l-0.832 64.472c-0.752 58.376-1.368 107.024-1.464 114.936 13.904 10.144 62.248 45.696 106.352 78.184l41.896 30.864c47.464 34.968 49.192 69.84 46.008 87.52-3.184 17.68-17 49.752-73.688 65.936l-41.832 11.936a35027.144 35027.144 0 0 0-128.04 36.728 0.856 0.856 0 0 0-0.072 0.152l-53.168 171.064c-14.392 46.384-42.744 72.992-77.768 73zM387.088 653.504c11.472 0 27.16 4.208 35.52 16.056l78.168 110.528 28.4 40.144c12.512 17.696 26.504 28.264 37.432 28.256 12.184 0 24.432-15.04 31.952-39.248l53.2-171.128c3.768-12.08 13.984-26.24 28.368-30.704 5.528-1.72 71.656-20.688 132.384-38.024l41.832-11.936c22.792-6.504 37.6-17.08 39.624-28.296 2.024-11.216-8.168-26.304-27.24-40.352l-41.896-30.864c-61.624-45.4-106.256-78.176-109.28-80.312-11.704-8.296-16.768-24.336-16.608-36.568l1.472-115.496 0.832-64.472c0.248-19.664-3.888-35.288-11.36-42.856-3.56-3.616-7.84-5.296-13.456-5.296-10.312 0-23.736 5.776-37.792 16.264L493.552 237.44c-10.912 8.136-28.664 10.784-42.08 6.232L280.92 185.84c-24.128-8.184-43.456-7.104-50.592 2.864-6.36 8.872-6.016 26.368 0.912 46.808l57.648 169.984c4.744 14 2.432 31.304-5.616 42.08L174.584 593.216c-14.136 18.944-19.504 36.376-14.368 46.632 5.016 10 21.664 15.976 44.528 15.976l42.952-0.536 139.368-1.784h0.024z" fill="#8D4520" p-id="1382"></path></svg>';
var icon_close = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 1024 1024"><defs><style type="text/css"></style></defs><path d="M583.168 523.776L958.464 148.48c18.944-18.944 18.944-50.176 0-69.12l-2.048-2.048c-18.944-18.944-50.176-18.944-69.12 0L512 453.12 136.704 77.312c-18.944-18.944-50.176-18.944-69.12 0l-2.048 2.048c-19.456 18.944-19.456 50.176 0 69.12l375.296 375.296L65.536 899.072c-18.944 18.944-18.944 50.176 0 69.12l2.048 2.048c18.944 18.944 50.176 18.944 69.12 0L512 594.944 887.296 970.24c18.944 18.944 50.176 18.944 69.12 0l2.048-2.048c18.944-18.944 18.944-50.176 0-69.12L583.168 523.776z" p-id="3440"></path></svg>';

var styleHtml =
  'body {margin: 0px;}#RSSPlusBox { position:fixed;z-index:99999;bottom:0px; right:0px; }div.feed-title { font-weight: bold;font-size:0.8rem; cursor: pointer;}div.feed-tips,div.feed-tips a { font-size: 0.75rem; color: rgb(158, 158, 158);}.card-title {}.rp-card-extra { position:absolute;right:16px;top:1px;}.rp-table-body { max-height: 400px; height: auto; overflow-x: hidden;}.table-footer { position: fixed; bottom: 0 ; padding-left: 10px; width: 100%; background-color: #fff;}.table-footer a { color: #ed3f14;}.support-box { height: 28px; line-height: 28px;}#rp-feed-list{display:none;z-index:23333;box-shadow: 1px 1px 2px 2px #4242426b; width:600px;max-height:460px;} #rp-feed-badge{width: 28px; height: 28px; line-height: 28px; border-radius: 14px; float: right;cursor: pointer;z-index:23333;}#rp-feed-badge:hover{border-color:#e9eaec}.badge{ top:-17px; left: -6%; width: 26px; height: 26px; line-height: 26px; border-radius: 13px;}.rp-card:hover{-webkit-box-shadow:0 1px 6px rgba(0,0,0,.2);box-shadow:0 1px 6px rgba(0,0,0,.2);border-color:#eee}.rp-card{background:#fff;border-radius:4px;font-size:14px;position:relative;-webkit-transition:all .2s ease-in-out;transition:all .2s ease-in-out}.rp-card-bordered:hover{border-color:#e9eaec}.rp-card-bordered{border:1px solid #dddee1;border-color:#e9eaec}.rp-mark-count{font-weight:bold;color: #ed3f14;}.rp-badge-count{position:relative;display:inline-block;width: 26px;height: 26px;line-height: 26px;border-radius: 15px;min-width: 20px;background:#4b5979;border: 1px solid transparent;color: #fff;text-align: center;font-size: 12px;white-space: nowrap;-webkit-transform-origin: -10% center;-ms-transform-origin: -10% center;transform-origin: -10% center;z-index: 10;-webkit-box-shadow: 0 0 0 1px #fff;box-shadow: 0 0 0 1px #fff;}.rp-badge-count a,.rp-badge-count a:hover{color:#fff}.rp-card-head{border-bottom:1px solid #e9eaec;padding:10px 16px;line-height:1}.rp-tooltip{display:inline-block}.rp-tooltip-rel{display:inline-block;position:relative}.rp-btn{display:inline-block;margin-bottom:0;font-weight:400;text-align:center;vertical-align:middle;-ms-touch-action:manipulation;touch-action:manipulation;cursor:pointer;background-image:none;border:1px solid transparent;white-space:nowrap;line-height:1.5;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;padding:6px 15px;font-size:12px;border-radius:4px;-webkit-transition:color .2s linear,background-color .2s linear,border .2s linear,-webkit-box-shadow .2s linear;transition:color .2s linear,background-color .2s linear,border .2s linear,-webkit-box-shadow .2s linear;transition:color .2s linear,background-color .2s linear,border .2s linear,box-shadow .2s linear;transition:color .2s linear,background-color .2s linear,border .2s linear,box-shadow .2s linear,-webkit-box-shadow .2s linear;color:#495060;background-color:#f7f7f7;border-color:#dddee1}.rp-btn>.rp-icon{line-height:1}.rp-btn,.rp-btn:active,.rp-btn:focus{outline:0}.rp-btn:not([disabled]):hover{text-decoration:none}.rp-btn:not([disabled]):active{outline:0}.rp-btn.disabled,.rp-btn[disabled]{cursor:not-allowed}.rp-btn.disabled>*,.rp-btn[disabled]>*{pointer-events:none}.rp-btn>a:only-child{color:currentColor}.rp-btn>a:only-child:after{content:"";position:absolute;top:0;left:0;bottom:0;right:0;background:0 0}.rp-btn:hover{color:#6d7380;background-color:#f9f9f9;border-color:#e4e5e7}.rp-btn:hover>a:only-child{color:currentColor}.rp-btn:hover>a:only-child:after{content:"";position:absolute;top:0;left:0;bottom:0;right:0;background:0 0}.rp-btn.active,.rp-btn:active{color:#454c5b;background-color:#ebebeb;border-color:#ebebeb}.rp-btn.active>a:only-child,.rp-btn:active>a:only-child{color:currentColor}.rp-btn.active>a:only-child:after,.rp-btn:active>a:only-child:after{content:"";position:absolute;top:0;left:0;bottom:0;right:0;background:0 0}.rp-btn.disabled,.rp-btn.disabled.active,.rp-btn.disabled:active,.rp-btn.disabled:focus,.rp-btn.disabled:hover,.rp-btn[disabled],.rp-btn[disabled].active,.rp-btn[disabled]:active,.rp-btn[disabled]:focus,.rp-btn[disabled]:hover,fieldset[disabled] .rp-btn,fieldset[disabled] .rp-btn.active,fieldset[disabled] .rp-btn:active,fieldset[disabled] .rp-btn:focus,fieldset[disabled] .rp-btn:hover{color:#bbbec4;background-color:#f7f7f7;border-color:#dddee1}.rp-btn.disabled.active>a:only-child,.rp-btn.disabled:active>a:only-child,.rp-btn.disabled:focus>a:only-child,.rp-btn.disabled:hover>a:only-child,.rp-btn.disabled>a:only-child,.rp-btn[disabled].active>a:only-child,.rp-btn[disabled]:active>a:only-child,.rp-btn[disabled]:focus>a:only-child,.rp-btn[disabled]:hover>a:only-child,.rp-btn[disabled]>a:only-child,fieldset[disabled] .rp-btn.active>a:only-child,fieldset[disabled] .rp-btn:active>a:only-child,fieldset[disabled] .rp-btn:focus>a:only-child,fieldset[disabled] .rp-btn:hover>a:only-child,fieldset[disabled] .rp-btn>a:only-child{color:currentColor}.rp-btn.disabled.active>a:only-child:after,.rp-btn.disabled:active>a:only-child:after,.rp-btn.disabled:focus>a:only-child:after,.rp-btn.disabled:hover>a:only-child:after,.rp-btn.disabled>a:only-child:after,.rp-btn[disabled].active>a:only-child:after,.rp-btn[disabled]:active>a:only-child:after,.rp-btn[disabled]:focus>a:only-child:after,.rp-btn[disabled]:hover>a:only-child:after,.rp-btn[disabled]>a:only-child:after,fieldset[disabled] .rp-btn.active>a:only-child:after,fieldset[disabled] .rp-btn:active>a:only-child:after,fieldset[disabled] .rp-btn:focus>a:only-child:after,fieldset[disabled] .rp-btn:hover>a:only-child:after,fieldset[disabled] .rp-btn>a:only-child:after{content:"";position:absolute;top:0;left:0;bottom:0;right:0;background:0 0}.rp-btn:hover{color:#57a3f3;background-color:#fff;border-color:#57a3f3}.rp-btn:hover>a:only-child{color:currentColor}.rp-btn:hover>a:only-child:after{content:"";position:absolute;top:0;left:0;bottom:0;right:0;background:0 0}.rp-btn.active,.rp-btn:active{color:#2b85e4;background-color:#fff;border-color:#2b85e4}.rp-btn.active>a:only-child,.rp-btn:active>a:only-child{color:currentColor}.rp-btn.active>a:only-child:after,.rp-btn:active>a:only-child:after{content:"";position:absolute;top:0;left:0;bottom:0;right:0;background:0 0}.rp-btn:focus{-webkit-box-shadow:0 0 0 2px rgba(45,140,240,.2);box-shadow:0 0 0 2px rgba(45,140,240,.2)}.rp-btn-long{width:100%}.rp-btn>.rp-icon+span,.rp-btn>span+.rp-icon{margin-left:4px}.rp-table{width:inherit;max-height:280px;max-width:100%;overflow:auto;color:#495060;font-size:12px;background-color:#fff;-webkit-box-sizing:border-box;box-sizing:border-box}.rp-table:before{content:"";width:100%;height:1px;position:absolute;left:0;bottom:0;background-color:#dddee1;z-index:1}.rp-table:after{content:"";width:1px;height:100%;position:absolute;top:0;right:0;background-color:#dddee1;z-index:3}.rp-table-body{overflow:auto}.rp-table td,.rp-table th{min-width:0;height:48px;-webkit-box-sizing:border-box;box-sizing:border-box;text-align:left;text-overflow:ellipsis;vertical-align:middle;border-bottom:1px solid #e9eaec}.rp-table th{height:40px;white-space:nowrap;overflow:hidden;background-color:#f8f8f9}.rp-table td{background-color:#fff;-webkit-transition:background-color .2s ease-in-out;transition:background-color .2s ease-in-out}//.rp-table-cell span{display:none}.rp-table-cell{display:inline-block;word-wrap:normal;vertical-align:middle}.rp-table-cell{padding-top:5px; padding-bottom:5px; padding-left:18px;padding-right:18px;overflow:hidden;text-overflow:ellipsis;white-space:normal;word-break:break-all;-webkit-box-sizing:border-box;box-sizing:border-box}td.rp-table-column-center,th.rp-table-column-center{text-align:center}td.rp-table-column-right,th.rp-table-column-right{text-align:right}.rp-table table{table-layout:fixed;width: 100%;}.rp-btn-primary{color:#fff;background-color:#2d8cf0;border-color:#2d8cf0;margin:5px;}.rp-btn-primary>a:only-child{color:currentColor}.rp-btn-primary>a:only-child:after{content:"";position:absolute;top:0;left:0;bottom:0;right:0;background:0 0}.rp-btn-primary:hover{color:#fff;background-color:#57a3f3;border-color:#57a3f3}.rp-btn-primary:hover>a:only-child{color:currentColor}.rp-btn-primary:hover>a:only-child:after{content:"";position:absolute;top:0;left:0;bottom:0;right:0;background:0 0}.rp-btn-primary.active,.rp-btn-primary:active{color:#f2f2f2;background-color:#2b85e4;border-color:#2b85e4}.rp-btn-primary.active>a:only-child,.rp-btn-primary:active>a:only-child{color:currentColor}.rp-btn-primary.active>a:only-child:after,.rp-btn-primary:active>a:only-child:after{content:"";position:absolute;top:0;left:0;bottom:0;right:0;background:0 0}.rp-btn-primary.disabled,.rp-btn-primary.disabled.active,.rp-btn-primary.disabled:active,.rp-btn-primary.disabled:focus,.rp-btn-primary.disabled:hover,.rp-btn-primary[disabled],.rp-btn-primary[disabled].active,.rp-btn-primary[disabled]:active,.rp-btn-primary[disabled]:focus,.rp-btn-primary[disabled]:hover,fieldset[disabled] .rp-btn-primary,fieldset[disabled] .rp-btn-primary.active,fieldset[disabled] .rp-btn-primary:active,fieldset[disabled] .rp-btn-primary:focus,fieldset[disabled] .rp-btn-primary:hover{color:#bbbec4;background-color:#f7f7f7;border-color:#dddee1}.rp-btn-primary.disabled.active>a:only-child,.rp-btn-primary.disabled:active>a:only-child,.rp-btn-primary.disabled:focus>a:only-child,.rp-btn-primary.disabled:hover>a:only-child,.rp-btn-primary.disabled>a:only-child,.rp-btn-primary[disabled].active>a:only-child,.rp-btn-primary[disabled]:active>a:only-child,.rp-btn-primary[disabled]:focus>a:only-child,.rp-btn-primary[disabled]:hover>a:only-child,.rp-btn-primary[disabled]>a:only-child,fieldset[disabled] .rp-btn-primary.active>a:only-child,fieldset[disabled] .rp-btn-primary:active>a:only-child,fieldset[disabled] .rp-btn-primary:focus>a:only-child,fieldset[disabled] .rp-btn-primary:hover>a:only-child,fieldset[disabled] .rp-btn-primary>a:only-child{color:currentColor}.rp-btn-primary.disabled.active>a:only-child:after,.rp-btn-primary.disabled:active>a:only-child:after,.rp-btn-primary.disabled:focus>a:only-child:after,.rp-btn-primary.disabled:hover>a:only-child:after,.rp-btn-primary.disabled>a:only-child:after,.rp-btn-primary[disabled].active>a:only-child:after,.rp-btn-primary[disabled]:active>a:only-child:after,.rp-btn-primary[disabled]:focus>a:only-child:after,.rp-btn-primary[disabled]:hover>a:only-child:after,.rp-btn-primary[disabled]>a:only-child:after,fieldset[disabled] .rp-btn-primary.active>a:only-child:after,fieldset[disabled] .rp-btn-primary:active>a:only-child:after,fieldset[disabled] .rp-btn-primary:focus>a:only-child:after,fieldset[disabled] .rp-btn-primary:hover>a:only-child:after,fieldset[disabled] .rp-btn-primary>a:only-child:after{content:"";position:absolute;top:0;left:0;bottom:0;right:0;background:0 0}.rp-btn-primary.active,.rp-btn-primary:active,.rp-btn-primary:hover{color:#fff}.rp-btn-primary:focus{-webkit-box-shadow:0 0 0 2px rgba(45,140,240,.2);box-shadow:0 0 0 2px rgba(45,140,240,.2)}.rp-btn-group:not(.rp-btn-group-vertical) .rp-btn-primary:not(:first-child):not(:last-child){border-right-color:#2b85e4;border-left-color:#2b85e4}.rp-btn-group:not(.rp-btn-group-vertical) .rp-btn-primary:first-child:not(:last-child){border-right-color:#2b85e4}.rp-btn-group:not(.rp-btn-group-vertical) .rp-btn-primary:first-child:not(:last-child)[disabled]{border-right-color:#dddee1}.rp-btn-group:not(.rp-btn-group-vertical) .rp-btn-primary+.rp-btn,.rp-btn-group:not(.rp-btn-group-vertical) .rp-btn-primary:last-child:not(:first-child){border-left-color:#2b85e4}.rp-btn-group:not(.rp-btn-group-vertical) .rp-btn-primary+.rp-btn[disabled],.rp-btn-group:not(.rp-btn-group-vertical) .rp-btn-primary:last-child:not(:first-child)[disabled]{border-left-color:#dddee1}.rp-btn-group-vertical .rp-btn-primary:not(:first-child):not(:last-child){border-top-color:#2b85e4;border-bottom-color:#2b85e4}.rp-btn-group-vertical .rp-btn-primary:first-child:not(:last-child){border-bottom-color:#2b85e4}.rp-btn-group-vertical .rp-btn-primary:first-child:not(:last-child)[disabled]{border-top-color:#dddee1}.rp-btn-group-vertical .rp-btn-primary+.rp-btn,.rp-btn-group-vertical .rp-btn-primary:last-child:not(:first-child){border-top-color:#2b85e4}.rp-btn-group-vertical .rp-btn-primary+.rp-btn[disabled],.rp-btn-group-vertical .rp-btn-primary:last-child:not(:first-child)[disabled]{border-bottom-color:#dddee1}#card-tips{margin-top: 5px;}.rp-btn-small {padding: 2px 7px;font-size: 12px;border-radius: 3px;';