// ==UserScript==
// @name http↪https
// @description Enforces browsing websites through https, including referenced resources such as images, links, stylesheets, scripts, audio and video. Change exclude list to sites you know don't have https or point it elsewhere. || Força a navegação em websites via https, incluindo recursos referidos como imagens, links, estilos, scripts, áudio and vídeo. Altere a lista a excluir para sites que você sabe que não possuem https ou apontam-no para outro lugar.
// @namespace http://juniorjanz.net
// @include http://*
// @version 1
// ==/UserScript==
if ((location.protocol=='http:') && !localStorage.getItem('http↪https')) {
    localStorage.setItem('http↪https', location.href);
    location.replace(location.href.replace(/^http:/,'https:'));
  // if we redirect a page to https, let's also replace its referenced resources.
  // we don't want to do it for pages we didn't redirect as they've probably taken care of it.
  // which is supposed to be the case after the first time we change all the links.
  // we're only doing this again when we make new redirection.
} else if ((location.protocol=='https:') && localStorage.getItem('http↪https')){
    localStorage.removeItem('http↪https');
    for each (var a in document.links) if (a.href) a.href.replace(/^http:/,'https:');
    for each (var embed in document.plugins) embed.src.replace(/^http:/,'https:');
    for each (var form in document.forms) if (form.action) form.action.replace(/^http:/,'https:');
    for each (var img in document.images) img.src.replace(/^http:/,'https:');
    for each (var script in document.scripts) if (script.src) script.src.replace(/^http:/,'https:');
    for each (var style in document.styleSheets) if (style.href) style.href.replace(/^http:/,'https:');
    for each (var object in document.getElementsByTagName('object')) object.data.replace(/^http:/,'https:');
    for each (var source in document.getElementsByTagName('source')) source.src.replace(/^http:/,'https:');
    for each (var param in document.getElementsByTagName('param')) param.value.replace(/^http:/,'https:');
} else if (localStorage.getItem('http↪https') == location.href) {
    alert('Apparently https redirects to http. Aborting infinite loop.');
}
