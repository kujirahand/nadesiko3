let display_id = "info";

// なでしこの関数をカスタマイズ
navigator.nako3.setFunc("表示", function (s) {
    $(display_id).innerHTML += to_html(s) + "<br>";
});

// 簡易DOMアクセス関数など
function run_box(id) {
    if (id == null) {
        alert('idが設定されていません。');
        return;
    }
    const src = $(id).value;
    display_id = id + "_info";
    $(display_id).innerHTML = "";
    try {
        navigator.nako3.run(src);
    } catch (e) {
        console.log(e);
    }
}
