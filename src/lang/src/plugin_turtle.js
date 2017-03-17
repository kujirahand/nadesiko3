/**
 * Turtle Graphics for Web browser (nadesiko3)
 * plugin_turtle.js
 */

const PluginTurtle = {
    "初期化": {
        type: "func", josi: [],
        fn: function (sys) {
            if (sys._turtle) return;
            sys._turtle = {
                list: [],
                target: -1,
                ctx: null,
                canvas: null,
                canvas_r: {left: 0, top: 0, width: 640, height: 400},
                clearAll: function () {
                    const me = this;
                    console.log('[TURTLE] clearAll');
                    for (let i = 0; i < me.list.length; i++) {
                        const tt = me.list[i];
                        tt.mlist = []; // ジョブをクリア
                        document.body.removeChild(tt.canvas);
                    }
                    me.list = [];
                    if (me.canvas != null) {
                        me.ctx.clearRect(0, 0,
                            me.canvas.width,
                            me.canvas.height);
                    }
                    me.target = -1;
                    me.b_set_timer = false;
                },
                drawTurtle: function (id) {
                    const tt = this.list[id];
                    const cr = this.canvas_r;
                    // カメの位置を移動
                    tt.canvas.style.left = (cr.left + tt.x - tt.cx) + "px";
                    tt.canvas.style.top = (cr.top + tt.y - tt.cx) + "px";
                    if (!tt.f_update) return;
                    if (!tt.f_loaded) return;
                    tt.f_update = false;
                    tt.ctx.clearRect(0, 0,
                        tt.canvas.width,
                        tt.canvas.height);
                    if (!tt.f_visible) return;
                    if (tt.dir != 270) {
                        const rad = (tt.dir + 90) * 0.017453292519943295;
                        tt.ctx.save();
                        tt.ctx.translate(tt.cx, tt.cy);
                        tt.ctx.rotate(rad);
                        tt.ctx.translate(-tt.cx, -tt.cy);
                        tt.ctx.drawImage(tt.img, 0, 0);
                        tt.ctx.restore();
                    } else {
                        tt.ctx.drawImage(tt.img, 0, 0);
                    }
                },
                getCur: function () {
                    if (this.list.length == 0) {
                        throw Error("最初に『カメ作成』命令を呼び出してください。");
                    }
                    return this.list[this.target];
                },
                b_set_timer: false,
                set_timer: function () {
                    if (this.b_set_timer) return;
                    this.b_set_timer = true;
                    setTimeout(() => {
                        const tt = this.getCur();
                        console.log("[TURTLE] Let's go! job=", tt.mlist.length);
                        sys._turtle.play();
                    }, 1);
                },
                line: function (tt, x1, y1, x2, y2) {
                    if (tt) {
                        if (tt.f_down == false) return;
                    }
                    const ctx = this.ctx;
                    ctx.beginPath();
                    ctx.lineWidth = tt.lineWidth;
                    ctx.strokeStyle = tt.color;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                },
                do_macro: function (tt, wait) {
                    const me = this;
                    if (!tt.f_loaded && wait > 0) {
                        console.log('[TURTLE] waiting ...');
                        return true;
                    }
                    const m = tt.mlist.shift();
                    const cmd = m[0];
                    switch (cmd) {
                        case "mv":
                            // 線を引く
                            me.line(tt, tt.x, tt.y, m[1], m[2]);
                            // カメの角度を変更
                            const mv_rad = Math.atan2(m[1] - tt.x, m[2] - tt.y);
                            tt.dir = mv_rad * 57.29577951308232;
                            tt.f_update = true;
                            // 実際に位置を移動
                            tt.x = m[1];
                            tt.y = m[2];
                            break;
                        case "fd":
                            const fdv = m[1] * m[2];
                            const rad = tt.dir * 0.017453292519943295;
                            const x2 = tt.x + Math.cos(rad) * fdv;
                            const y2 = tt.y + Math.sin(rad) * fdv;
                            me.line(tt, tt.x, tt.y, x2, y2);
                            tt.x = x2;
                            tt.y = y2;
                            break;
                        case "angle":
                            const angle = m[1];
                            tt.dir = ((angle - 90 + 360) % 360);
                            tt.f_update = true;
                            break;
                        case "rotr":
                            const rv = m[1];
                            tt.dir = (tt.dir + rv) % 360;
                            tt.f_update = true;
                            break;
                        case "rotl":
                            const lv = m[1];
                            tt.dir = (tt.dir - lv + 360) % 360;
                            tt.f_update = true;
                            break;
                        case "color":
                            // ctx.strokeStyle = m[1];
                            tt.color = m[1];
                            break;
                        case "size":
                            // ctx.lineWidth = m[1];
                            tt.lineWidth = m[1];
                            break;
                        case "pen_on":
                            tt.f_down = m[1];
                            break;
                        case "visible":
                            tt.f_visible = m[1];
                            tt.f_update = true;
                            break;
                        case "change_image":
                            tt.f_loaded = false;
                            tt.img.src = m[1];
                            break;
                    }
                    if (tt.f_loaded) sys._turtle.drawTurtle(tt.id);
                    return (tt.mlist.length > 0);
                },
                do_macro_all: function (wait) {
                    let has_next = false;
                    for (let i = 0; i < sys._turtle.list.length; i++) {
                        const tt = sys._turtle.list[i];
                        if (this.do_macro(tt, wait)) has_next = true;
                    }
                    return has_next;
                },
                play: function () {
                    const me = this;
                    const wait = sys.__getSysValue("カメ速度", 100);
                    let has_next = true;
                    while (has_next) {
                        has_next = this.do_macro_all(wait);
                        if (wait > 0) break;
                    }
                    if (wait > 0 && has_next) {
                        setTimeout(() => {
                            me.play();
                        }, wait);
                        return;
                    }
                    console.log("[TURTLE] finished.");
                },
            };
        }
    },
    /// タートルグラフィックス/カメ操作
    "カメ作成": { /// タートルグラフィックスを開始してカメのIDを返す /// かめさくせい
        type: "func", josi: [],
        fn: function (sys) {
            // カメの情報を sys._turtle リストに追加
            const id = sys._turtle.list.length;
            const tt = {
                id: id,
                img: null,
                canvas: null,
                ctx: null,
                dir: 270, // 上向き
                cx: 32,
                cy: 32,
                x: 0,
                y: 0,
                color: 'black',
                lineWidth: 4,
                f_down: true,
                f_update: true,
                f_loaded: false,
                f_visible: true,
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
            tt.img.onerror = () => {
                console.log("カメの読み込みに失敗");
                tt.f_loaded = true;
                tt.f_visible = false;
                sys._turtle.drawTurtle(tt.id);
            };
            tt.canvas.style.position = "absolute";
            document.body.appendChild(tt.canvas);
            // 描画先をセットする
            const canvas_id = sys.__getSysValue("カメ描画先", "turtle_cv");
            console.log("カメ描画先=", canvas_id, sys.__varslist[0]["カメ描画先"]);
            const cv = sys._turtle.canvas = document.getElementById(canvas_id);
            if (!sys._turtle.canvas) {
                console.log("[ERROR] カメ描画先が見当たりません。" + canvas_id);
                return;
            }
            const ctx = sys._turtle.ctx = sys._turtle.canvas.getContext('2d');
            ctx.lineWidth = 4;
            ctx.strokeStyle = "black";
            ctx.lineCap = "round";
            const rect = cv.getBoundingClientRect();
            const rx = rect.left + window.pageXOffset;
            const ry = rect.top + window.pageYOffset;
            const cr = sys._turtle.canvas_r = {
                "left": rx, "top": ry,
                width: rect.width, height: rect.height
            };
            // デフォルト位置の設定
            tt.x = rect.width / 2;
            tt.y = rect.height / 2;
            return id;
        }
    },
    "カメ操作対象設定": { /// IDを指定して操作対象となるカメを変更する /// かめそうさたいしょうせってい
        type: "func", josi: [["に", "へ", "の"]],
        fn: function (id, sys) {
            sys._turtle.target = id;
        },
        return_none: true
    },
    "カメ描画先": {type: "var", value: "turtle_cv"}, /// かめびょうがさき
    "カメ画像URL": {type: "var", value: "turtle.png"}, /// かめがぞうURL
    "カメ画像変更": { /// カメの画像をURLに変更する /// かめがぞうへんこう
        type: "func", josi: [["に", "へ"]],
        fn: function (url, sys) {
            const tt = sys._turtle.getCur();
            tt.mlist.push(["change_image", url]);
            sys._turtle.set_timer();
        },
        return_none: true
    },
    "カメ速度": {type: "const", value: 100}, /// かめそくど
    "カメ速度設定": { /// カメの動作速度vに設定(大きいほど遅い) /// かめそくどせってい
        type: "func", josi: [["に", "へ"]],
        fn: function (v, sys) {
            sys.__varslist[0]["カメ速度"] = v;
        }
    },
    "カメ移動": { /// カメの位置を[x,y]へ移動する /// かめいどう
        type: "func", josi: [["に", "へ"]],
        fn: function (xy, sys) {
            const tt = sys._turtle.getCur();
            tt.mlist.push(["mv", xy[0], xy[1]]);
            sys._turtle.set_timer();
        },
        return_none: true
    },
    "カメ進": { /// カメの位置をVだけ進める /// かめすすむ
        type: "func", josi: [["だけ"]],
        fn: function (v, sys) {
            const tt = sys._turtle.getCur();
            tt.mlist.push(["fd", v, 1]);
            sys._turtle.set_timer();
        },
        return_none: true
    },
    "カメ戻": { /// カメの位置をVだけ戻す /// かめもどる
        type: "func", josi: [["だけ"]],
        fn: function (v, sys) {
            const tt = sys._turtle.getCur();
            tt.mlist.push(["fd", v, -1]);
            sys._turtle.set_timer();
        },
        return_none: true
    },
    "カメ角度設定": { /// カメの向きをDEGに設定する /// かめかくどせってい
        type: "func", josi: [["に", "へ", "の"]],
        fn: function (v, sys) {
            const tt = sys._turtle.getCur();
            tt.mlist.push(["angle", parseFloat(v)]);
            sys._turtle.set_timer();
        },
        return_none: true
    },
    "カメ右回転": { /// カメの向きをDEGだけ右に向ける /// かめみぎかいてん
        type: "func", josi: [["だけ"]],
        fn: function (v, sys) {
            const tt = sys._turtle.getCur();
            tt.mlist.push(["rotr", v]);
            sys._turtle.set_timer();
        },
        return_none: true
    },
    "カメ左回転": { /// カメの向きをDEGだけ左に向ける /// かめひだりかいてん
        type: "func", josi: [["だけ"]],
        fn: function (v, sys) {
            const tt = sys._turtle.getCur();
            tt.mlist.push(["rotl", v]);
            sys._turtle.set_timer();
        },
        return_none: true
    },
    "カメペン色設定": { /// カメのペン描画色をCに設定する /// かめぺんいろせってい
        type: "func", josi: [["に", "へ"]],
        fn: function (c, sys) {
            const tt = sys._turtle.getCur();
            tt.mlist.push(["color", c]);
            sys._turtle.set_timer();
        },
        return_none: true
    },
    "カメペンサイズ設定": { /// カメペンのサイズをWに設定する /// かめぺんさいずせってい
        type: "func", josi: [["に", "へ"]],
        fn: function (w, sys) {
            const tt = sys._turtle.getCur();
            tt.mlist.push(["size", w]);
            sys._turtle.set_timer();
        },
    },
    "カメペン設定": { /// カメペンを使うかどうかをV(オン/オフ)に設定する /// かめぺんせってい
        type: "func", josi: [["に", "へ"]],
        fn: function (w, sys) {
            const tt = sys._turtle.getCur();
            tt.mlist.push(["pen_on", w]);
            sys._turtle.set_timer();
        },
    },
    "カメ全消去": { /// 表示しているカメと描画内容を全部消去する /// かめぜんしょうきょ
        type: "func", josi: [],
        fn: function (sys) {
            sys._turtle.clearAll();
        },
        return_none: true
    },
    "カメ非表示": { /// カメの画像を非表示にする。描画に影響しない。 /// かめひひょうじ
        type: "func", josi: [],
        fn: function (sys) {
            const tt = sys._turtle.getCur();
            tt.mlist.push(["visible", false]);
            sys._turtle.set_timer();
        },
        return_none: true
    },
    "カメ表示": { /// 非表示にしたカメを表示する。 /// かめひょうじ
        type: "func", josi: [],
        fn: function (sys) {
            const tt = sys._turtle.getCur();
            tt.mlist.push(["visible", true]);
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
