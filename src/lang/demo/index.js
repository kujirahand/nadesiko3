// なでしこの関数をカスタマイズ
navigator.nako3.getFunc("言").fn = function (msg) {
    alert(msg);
};

navigator.nako3.getFunc("表示").fn = function (s) {
    $("info").innerHTML += to_html(s) + "<br>";
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
    if (id != null) {
        $('src_box').value = $(id).value;
        reset_box();
    }
    var src = $("src_box").value;
    $("err").style.display = "none";
    try {
        navigator.nako3.run(src);
    } catch (e) {
        let msg = e.message;
        msg = msg.replace('Expected', '期待する字句は...');
        msg = msg.replace('but', '。しかし...');
        msg = msg.replace('found', 'がありました');
        $("err").style.display = "block";
        $("err").innerHTML = msg;
        console.log(e);
    }
}

function reset_box() {
    $("info").innerHTML = "";
}
