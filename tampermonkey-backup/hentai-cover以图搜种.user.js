// ==UserScript==
// @name         hentai-cover以图搜种
// @namespace    psrx-htcover
// @version      1.0
// @description  解放搜索过程,图片自带磁力链接
// @author       psrx
// @match        https://hentai-covers.site/*
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==
function f (a, span, urltitle) {
    a.httping = GM_xmlhttpRequest({
        method: "GET",
        url: `https://sukebei.nyaa.si/?f=0&c=0_0&q="${urltitle}"`,
        onload: (res) => {
            let cili = new DOMParser().parseFromString(res.responseText, 'text/html').querySelector('.container>.table-responsive>table>tbody>tr>td:nth-child(3)>a:nth-child(2)')
            if (!cili) {
                a.href = `https://e-hentai.org/?f_doujinshi=1&f_manga=1&f_artistcg=1&f_gamecg=1&f_western=1&f_non-h=1&f_imageset=1&f_cosplay=1&f_asianporn=1&f_misc=1&f_search="${urltitle}"&f_apply=Apply+Filter`
                a.target = '_blank'
                span.style.color = 'rgb(230, 247, 0)'
                a.style.color = 'rgb(230, 247, 0)'
                span.textContent = '没找到,点标题去隔壁站瞅瞅'
                return
            }
            let okla = cili.href
            a.href = okla
            span.style.color = 'rgb(57, 241, 0)'
            a.style.color = 'rgb(57, 241, 0)'
            span.textContent = '搜索完毕,请点击标题下载'
        }
    })
    setTimeout(() => {
        if (span.textContent === '正在搜索...') {
            a.httping.abort()
            f(a, span, urltitle)
        }
    }, 5000)
}
document.querySelector('.content-width>#content-listing-tabs>#tabbed-content-group>.visible>.pad-content-listing').onmouseover = (e) => {
    if (e.target.localName !== 'a') return
    if (e.target.ok) return
    let a = e.target
    let span = a.nextElementSibling
    a.ok = true
    span.textContent = '正在搜索...'
    let urltitle = encodeURIComponent(a.textContent)
    f(a, span, urltitle)
}
