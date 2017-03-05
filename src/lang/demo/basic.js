var display_id = "info";

// なでしこの関数をカスタマイズ
navigator.nako3.getFunc("言").fn = function (msg) {
    alert(msg);
};

navigator.nako3.getFunc("表示").fn = function (s) {
    $(display_id).innerHTML += to_html(s) + "<br>";
};

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

function run_box(id) {
    if (id == null) {
        alert('idが設定されていません。');
        return;
    }
    var src = $(id).value;
    display_id = id + "_info";
    $(display_id).innerHTML = "";
    try {
        navigator.nako3.run(src);
    } catch (e) {
        console.log(e);
    }
}

function reset_box() {
    $("info").innerHTML = "";
}
