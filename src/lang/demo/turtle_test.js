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
    let src = $(id).value;
    display_id = id + "_info";
    $(display_id).innerHTML = "";
    try {
        src = "カメ全消去\n" + src;
        navigator.nako3.run(src);
        $('backlink').href = "#" + id + "_head";
        location.href = "#run";
        $("err").style.display = "none";
    } catch (e) {
        console.log(e);
        $("err").innerHTML = e.message;
        $("err").style.display = "block";
    }
}

function reset_box_turtle(id) {
    if (id == null) {
        id = "src_box";
    }
    $(id + '_info').innerHTML = '';
    const cv = $('turtle_cv');
    cv.getContext('2d').clearRect(0, 0, cv.width, cv.height);
    navigator.nako3.run('カメ全消去');
}
