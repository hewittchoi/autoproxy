// ==UserScript==
// @name         Ad Blocker
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Ice_Wolf
// @match        http://*/*
// @grant        none
// ==/UserScript==

var adblocker = document.getElementsByClassName("adblocker");
var adblocker2 = adblocker.length;
var adblocker3;

for(adblocker3 = 0;adblocker3 < adblocker2;adblocker3++)
{
adblocker[0].parentNode.removeChild(adblocker[0]);
}