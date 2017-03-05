// なでしこの関数をカスタマイズ
navigator.nako3.setFunc("言", function (msg) {
    alert(msg);
});

// なでしこにオリジナル関数をJSで追加
navigator.nako3.addFunc("色変更",
    [["に", "へ"]],
    function (s) {
        $("info").style.color = s;
    });

// 簡易DOMアクセス関数など
function $(id) {
    return document.getElementById(id);
}

function to_html(s) {
    s = "" + s;
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;');
}

function reset_box() {
    let info = $("info");
    info.innerHTML = "";
    info.style.color = "";
}
