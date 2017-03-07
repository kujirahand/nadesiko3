/* vim:set expandtab ts=4 sw=4 sts=4 :*/
/**
 * Turtle Graphics for Web browser (nadesiko3)
 * plugin_turtle.js
 */

const PluginTurtle = {
    "初期化": {
        type: "func", josi: [],
        fn: function (sys) {
            sys._turtle = {
                list: [],
                target: -1,
                ctx: null,
                canvas: null,
                canvas_r: {left:0, top:0, width:640, height: 400},
                drawTurtle: function (id) {
                    const tt = this.list[id];
                    const cr = this.canvas_r;
                    tt.canvas.style.left = (cr.left + tt.x - tt.cx) + "px";
                    tt.canvas.style.top = (cr.top + tt.y - tt.cx) + "px";
                    if (tt.f_update) {
                        if (tt.f_loaded) {
                            tt.f_update = false;
                            tt.ctx.drawImage(tt.img, 0, 0);
                        }
                    }
                    tt.ctx.drawImage(tt.img, 0, 0);
                },
                getCur: function () {
                    return this.list[this.target];
                },
                b_set_timer: false,
                set_timer: function () {
                    if (this.b_set_timer) return;
                    this.b_set_timer = true;
                    const wait = sys.__getSysValue("カメ速度", 300);
                    setTimeout(()=>{ sys._turtle.play();  }, wait);
                },
                play: function () {
                    const wait = sys.__getSysValue("カメ速度", 500);
                    console.log("play", wait);
                    let has_next = false;
                    for (let i = 0; i < sys._turtle.list.length; i++) {
                        const tt = sys._turtle.list[i];
                        if (!tt.f_loaded) has_next = true;
                        if (tt.mlist.length > 0) {
                            const m = tt.mlist.shift();
                            console.log(m);
                            const cmd = m[0];
                            switch (cmd) {
                                case "mv":
                                    tt.x = m[1];
                                    tt.y = m[2];
                                    break;
                            }
                            sys._turtle.drawTurtle(i);
                            if (tt.mlist.length > 0) has_next = true;
                        }
                    }
                    if (has_next) {
                        setTimeout( function() {
                            sys._turtle.play();
                        }, wait);
                    }
                },
            };
        }
    },
    /// タートルグラフィックス/カメ操作
    "カメ作成": { /// タートルグラフィックスを開始してカメのIDを返す
        type: "func", josi: [],
        fn: function (sys) {
            // カメの情報を sys._turtle リストに追加
            const id = sys._turtle.list.length;
            const tt = {
                id: id,
                img: null,
                canvas: null,
                ctx: null,
                dir: 0,
                cx: 32,
                cy: 32,
                x: 0,
                y: 0,
                f_update: true,
                f_loaded: false,
                mlist: [],
            };
            sys._turtle.list.push(tt);
            sys._turtle.target = id;
            // 画像を読み込む
            tt.img = document.createElement('img');
            tt.canvas = document.createElement('canvas');
            tt.ctx = tt.canvas.getContext('2d');
            tt.canvas.id = id;
            tt.img.src = sys.__getSysValue("カメ画像URL", "turtle.png");
            tt.img.onload = () => { 
                tt.cx = tt.img.width / 2;
                tt.cy = tt.img.height / 2;
                tt.canvas.width = tt.img.width;
                tt.canvas.height = tt.img.height;
                tt.f_loaded = true;
                sys._turtle.drawTurtle(tt.id);
                console.log("turtle.onload");
            };
            tt.canvas.style.position = "absolute";
            document.body.appendChild(tt.canvas);
            // 描画先をセットする
            const canvas_id = sys.__getSysValue("カメ描画先", "turtle_cv");
            const cv = sys._turtle.canvas = document.getElementById(canvas_id); 
            if (!sys._turtle.canvas) {
                console.log("[ERROR] カメ描画先が見当たりません。");
                return;
            }
            const rect = cv.getBoundingClientRect();
            const rx = rect.left + window.pageXOffset;
            const ry = rect.top + window.pageYOffset;
            sys._turtle.canvas_r = { 
                "left":rx, "top":ry,
                width:rect.width, height: rect.height
            };
            tt.x = rect.left + rect.width / 2;
            tt.y = rect.top + rect.height / 2;
            return id;
        }
    },
    "カメ変更": { /// IDを指定して操作対象となるカメを変更する
        type: "func", josi: [["に", "へ"]],
        fn: function (id, sys) {
            sys._turtle.target = id;
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
    "カメ速度": {type: "const", value: 100},
    "カメ速度設定": { /// カメの動作速度vに設定(大きいほど遅い)
        type: "func", josi: [["に","へ"]],
        fn: function (v, sys) {
            sys.__varslist[0]["カメ速度"] = v;
        }
    },
    "カメ移動": { /// カメの位置を[x,y]へ移動する
        type: "func", josi: [["に","へ"]],
        fn: function (xy, sys) {
            const tt = sys._turtle.getCur();
            tt.mlist.push(["mv",xy[0], xy[1]]);
            sys._turtle.set_timer();
        },
        return_none: true
    },
};

module.exports = PluginTurtle;

// scriptタグで取り込んだ時、自動で登録する
if (typeof(navigator) == "object") {
  navigator.nako3.addPluginObject("PluginTurtle", PluginTurtle);
}


