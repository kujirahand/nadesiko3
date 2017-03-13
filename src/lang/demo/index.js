// なでしこの関数をカスタマイズ
navigator.nako3.setFunc("表示", function (s) {
    $("info").innerHTML += to_html(s) + "<br>";
});

// 簡易DOMアクセス関数など
function run_box(id) {
    if (id != null) {
        $('src_box').value = $(id).value;
        reset_box();
    }
    const src = $('src_box').value;
    $("err").style.display = "none";
    try {
        navigator.nako3.run(src);
    } catch (e) {
        let msg = e.message;
        msg = msg.replace(/Expected/g, '期待する字句は...');
        msg = msg.replace(/but/g, '。しかし...');
        msg = msg.replace(/found/g, 'がありました');
        $("err").style.display = "block";
        $("err").innerHTML = msg;
        console.log(e);
    }
}
