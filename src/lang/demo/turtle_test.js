// なでしこの関数をカスタマイズ
navigator.nako3.setFunc("表示", function (s) {
    $("info").innerHTML += to_html(s) + "<br>";
});

