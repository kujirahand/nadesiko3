/**
 * Turtle Graphics for Web browser (nadesiko3)
 * plugin_turtle.js
 */

const PluginTurtle = {
    /// タートルグラフィックス/カメ操作
    "カメ作成": { /// タートルグラフィックスを開始してカメのIDを返す
        type: "func", josi: [],
        fn: function (sys) {
          // 初回処理
          if (!sys.__varslist[0]['カメ管理']) {
            sys._tt = sys.__varslist[0]['カメ管理'] = {};
            sys._tt.turtles = [];
          }
          const tid = sys._tt.turtles.length;
          const img = document.createElement('img');
          img.src = sys.__varslist[0]["カメ画像URL"];
          img.cx = 32; img.cy = 32;
          img.onload = ()=>{ img.cx = img.width / 2; img.cy = img.height / 2; };
          img.style.position = "absolute";
          document.body.appendChild(img);
          const cv_id = sys.__varslist[0]['カメ描画先'];
          let cv = document.getElementById(cv_id);
          if (!cv) {
            console.log("[ERROR] カメ描画先が見当たりません。");
            img.style.left = "1px";
            img.style.top = "1px";
          } {
            const rect = cv.getBoundingClientRect();
            img.style.left = (rect.left + (rect.width / 2)) + "px";
            img.style.top = (rect.top + (rect.height / 2)) + "px";
          }
          const tt = {img:img, "dir":'u', "pen":true};
          sys._tt.turtles[tid] = tt;
          sys._tt.target = tid;
          return tid;
        }
    },
    "カメ変更": { /// IDを指定して操作対象となるカメを変更する
        type: "func", josi: [["に", "へ"]],
        fn: function (id, sys) {
            sys._tt.target = id;
        },
        return_none: true
    },
    "カメ描画先": {type: "const", value: "turtle_cv"},
    "カメ画像URL": {type: "const", value: "turtle.png"},
    "カメ画像変更": { /// カメの画像をURLに変更する
        type: "func", josi: [["に", "へ"]],
        fn: function (url, sys) {
            sys.__varslist[0]["カメ画像URL"] = url;
        },
        return_none: true
    },
    "カメ移動": { /// カメの位置を[x,y]へ移動する
        type: "func", josi: [["に","へ"]],
        fn: function (xy, sys) {
        },
        return_none: true
    },
};

module.exports = PluginTurtle;

// scriptタグで取り込んだ時、自動で登録する
if (typeof(navigator) == "object") {
  navigator.nako3.addPluginObject("PluginTurtle", PluginTurtle);
  navigator.nako3.debug = true;
}





