/**
 * Turtle Graphics for Web browser (nadesiko3)
 * plugin_turtle.mts
 */
import { turtleImage, elephantImage, pandaImage } from './plugin_turtle_images.mjs';
class NakoTurtle {
    constructor(sys, id) {
        this.sys = sys;
        this.id = id;
        this.img = null;
        this.canvas = null;
        this.ctx = null;
        this.dir = 270; // 上向き
        this.cx = 32;
        this.cy = 32;
        this.x = 0;
        this.y = 0;
        this.color = 'black';
        this.lineWidth = 4;
        this.flagDown = true;
        this.flagBegeinPath = false;
        this.f_update = true;
        this.flagLoaded = false;
        this.f_visible = true;
        this.mlist = [];
    }
    clear() {
        this.mlist = []; // ジョブをクリア
        document.body.removeChild(this.canvas);
    }
    loadImage(url, callback) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.id = this.id;
        this.img = document.createElement('img');
        this.img.onload = () => {
            this.cx = this.img.width / 2;
            this.cy = this.img.height / 2;
            this.canvas.width = this.img.width;
            this.canvas.height = this.img.height;
            this.flagLoaded = true;
            this.f_update = true;
            this.canvas.style.position = 'absolute';
            document.body.appendChild(this.canvas);
            // console.log('createTurtle::this.turtles=', this)
            callback(this);
        };
        this.img.onerror = () => {
            console.log('カメの読み込みに失敗');
            this.flagLoaded = true;
            this.f_visible = false;
            this.f_update = true;
            callback(this);
        };
        this.img.src = url;
    }
}
class NakoTurtleSystem {
    static getInstance(sys) {
        if (NakoTurtleSystem.instance === undefined) {
            NakoTurtleSystem.instance = new NakoTurtleSystem(sys);
        }
        const i = NakoTurtleSystem.instance;
        i.instanceCount += 1;
        return NakoTurtleSystem.instance;
    }
    constructor(sys) {
        this.sys = sys;
        this.turtles = []; // カメの一覧
        this.target = -1;
        this.ctx = null;
        this.canvas = null;
        this.canvas_r = { left: 0, top: 0, width: 640, height: 400 };
        this.flagSetTimer = false;
        this.instanceCount = 0;
        this.timerId = null;
    }
    clearAll() {
        // console.log('カメ全消去 turtles=', this.turtles)
        for (let i = 0; i < this.turtles.length; i++) {
            const tt = this.turtles[i];
            tt.clear();
        }
        this.turtles = [];
        if (this.canvas !== null) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.target = -1;
        this.flagSetTimer = false;
    }
    drawTurtle(id) {
        const tt = this.turtles[id];
        if (!tt) {
            return;
        }
        const cr = this.canvas_r;
        // カメの位置を移動
        tt.canvas.style.left = (cr.left + tt.x - tt.cx) + 'px';
        tt.canvas.style.top = (cr.top + tt.y - tt.cx) + 'px';
        if (!tt.f_update) {
            return;
        }
        /* istanbul ignore if */
        if (!tt.flagLoaded) {
            return;
        }
        tt.f_update = false;
        tt.ctx.clearRect(0, 0, tt.canvas.width, tt.canvas.height);
        if (!tt.f_visible) {
            return;
        }
        if (tt.dir !== 270) {
            const rad = (tt.dir + 90) * 0.017453292519943295;
            tt.ctx.save();
            tt.ctx.translate(tt.cx, tt.cy);
            tt.ctx.rotate(rad);
            tt.ctx.translate(-tt.cx, -tt.cy);
            tt.ctx.drawImage(tt.img, 0, 0);
            tt.ctx.restore();
        }
        else {
            tt.ctx.drawImage(tt.img, 0, 0);
        }
    }
    getCur() {
        if (this.turtles.length === 0) {
            throw Error('最初に『カメ作成』命令を呼び出してください。');
        }
        return this.turtles[this.target];
    }
    setTimer() {
        // コマンド設定後、1度だけこの関数を呼び出す
        if (this.flagSetTimer) {
            return;
        }
        this.flagSetTimer = true;
        // 記録したマクロを再生する
        if (this.timerId) {
            clearTimeout(this.timerId);
        }
        this.timerId = setTimeout(() => {
            console.log('[TURTLE] Let\'s go!');
            this.play();
        }, 1);
    }
    line(tt, x1, y1, x2, y2) {
        /* istanbul ignore else */
        if (tt) {
            if (!tt.flagDown) {
                return;
            }
        }
        const ctx = this.ctx;
        if (tt.flagBegeinPath) {
            ctx.lineTo(x2, y2);
        }
        else {
            ctx.beginPath();
            ctx.lineWidth = tt.lineWidth;
            ctx.strokeStyle = tt.color;
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }
    addMacro(args) {
        const tt = this.getCur();
        tt.mlist.push(args);
        this.setTimer();
    }
    doMacro(tt, wait) {
        if (!tt.flagLoaded && wait > 0) {
            // console.log('[TURTLE] waiting ...')
            return true;
        }
        const m = tt.mlist.shift();
        const cmd = (m !== undefined) ? m[0] : '';
        // console.log('@@@doMacro', cmd, m, tt.x, tt.y, ': dir=', tt.dir)
        switch (cmd) {
            case 'xy':
                // 起点を移動する
                tt.x = m[1];
                tt.y = m[2];
                break;
            case 'begin':
                // 描画を明示的に開始する
                this.ctx.beginPath();
                this.ctx.moveTo(tt.x, tt.y);
                tt.flagBegeinPath = true;
                break;
            case 'close':
                // パスを閉じる
                this.ctx.closePath();
                tt.flagBegeinPath = false;
                break;
            case 'fill':
                if (tt.flagBegeinPath) {
                    this.ctx.closePath();
                    tt.flagBegeinPath = false;
                }
                this.ctx.fill();
                break;
            case 'stroke':
                if (tt.flagBegeinPath) {
                    this.ctx.closePath();
                    tt.flagBegeinPath = false;
                }
                this.ctx.stroke();
                break;
            case 'text':
                this.ctx.fillText(m[1], tt.x, tt.y);
                break;
            case 'textset':
                this.ctx.font = m[1];
                break;
            case 'fillStyle':
                this.ctx.fillStyle = m[1];
                break;
            case 'mv': {
                // 線を引く
                this.line(tt, tt.x, tt.y, m[1], m[2]);
                // カメの角度を変更
                const mvRad = Math.atan2(m[2] - tt.y, m[1] - tt.x);
                tt.dir = mvRad * 57.29577951308232;
                tt.f_update = true;
                // 実際に位置を移動
                tt.x = m[1];
                tt.y = m[2];
                break;
            }
            case 'fd': {
                const fdv = m[1] * m[2];
                const rad = tt.dir * 0.017453292519943295;
                const x2 = tt.x + Math.cos(rad) * fdv;
                const y2 = tt.y + Math.sin(rad) * fdv;
                this.line(tt, tt.x, tt.y, x2, y2);
                tt.x = x2;
                tt.y = y2;
                // console.log('@@@fd', m, tt.x, tt.y, ': dir=', tt.dir)
                break;
            }
            case 'angle': {
                const angle = m[1];
                tt.dir = ((angle - 90 + 360) % 360);
                tt.f_update = true;
                break;
            }
            case 'rotr': {
                const rv = m[1];
                tt.dir = (tt.dir + rv) % 360;
                tt.f_update = true;
                break;
            }
            case 'rotl': {
                const lv = m[1];
                tt.dir = (tt.dir - lv + 360) % 360;
                tt.f_update = true;
                break;
            }
            case 'color':
                tt.color = m[1];
                this.ctx.strokeStyle = tt.color;
                break;
            case 'size':
                tt.lineWidth = m[1];
                this.ctx.lineWidth = tt.lineWidth;
                break;
            case 'penOn':
                tt.flagDown = m[1];
                break;
            case 'visible':
                tt.f_visible = m[1];
                tt.f_update = true;
                break;
            case 'changeImage':
                tt.flagLoaded = false;
                tt.img.src = m[1];
                break;
        }
        if (tt.flagLoaded) {
            this.drawTurtle(tt.id);
        }
        return (tt.mlist.length > 0);
    }
    doMacroAll(wait) {
        let hasNext = false;
        for (let i = 0; i < this.turtles.length; i++) {
            const tt = this.turtles[i];
            if (this.doMacro(tt, wait)) {
                hasNext = true;
            }
        }
        return hasNext;
    }
    play() {
        const wait = this.sys.__getSysVar('カメ速度');
        let hasNext = this.doMacroAll(wait);
        if (wait <= 0) {
            // 待ち時間なしで全部実行
            while (hasNext) {
                hasNext = this.doMacroAll(wait);
            }
        }
        else if (hasNext) {
            // 一つずつ実行
            if (this.timerId) {
                clearTimeout(this.timerId);
            }
            this.timerId = setTimeout(() => this.play(), wait);
            return;
        }
        console.log('[TURTLE] finished.');
        this.flagSetTimer = false;
    }
    setupCanvas() {
        // 描画先をセットする
        let canvasId = this.sys.__getSysVar('カメ描画先');
        if (typeof canvasId === 'string') {
            canvasId = document.getElementById(canvasId) || document.querySelector(canvasId);
            this.sys.__setSysVar('カメ描画先', canvasId);
        }
        console.log('カメ描画先=', canvasId);
        const cv = this.canvas = canvasId;
        if (!cv) {
            console.log('[ERROR] カメ描画先が見当たりません。' + canvasId);
            throw Error('カメ描画先が見当たりません。');
        }
        const ctx = this.ctx = cv.getContext('2d');
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'black';
        ctx.lineCap = 'round';
        this.resizeCanvas();
    }
    resizeCanvas() {
        const cv = this.canvas;
        const rect = cv.getBoundingClientRect();
        const rx = rect.left + window.scrollX;
        const ry = rect.top + window.scrollY;
        this.canvas_r = {
            'left': rx,
            'top': ry,
            width: rect.width,
            height: rect.height
        };
    }
    createTurtle(imageUrl) {
        // キャンバス情報は毎回参照する (#734)
        this.setupCanvas();
        // カメの情報をリストに追加
        const id = this.turtles.length;
        const tt = new NakoTurtle(this.sys, id);
        this.turtles.push(tt);
        this.target = id;
        // 画像を読み込む
        tt.loadImage(imageUrl, (tt) => {
            this.drawTurtle(tt.id);
            console.log(`tutrle.onload(id=${tt.id})`);
        });
        // デフォルト位置(中央)の設定
        tt.x = this.canvas_r.width / 2;
        tt.y = this.canvas_r.height / 2;
        return id;
    }
}
const PluginTurtle = {
    'meta': {
        type: 'const',
        value: {
            pluginName: 'plugin_turtle', // プラグインの名前
            description: 'タートルグラフィックス用のプラグイン', // 説明
            pluginVersion: '3.6.0', // プラグインのバージョン
            nakoRuntime: ['wnako'], // 対象ランタイム
            nakoVersion: '3.6.3' // 要求なでしこバージョン
        }
    },
    '初期化': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const turtleSystem = NakoTurtleSystem.getInstance(sys);
            sys.tags.turtles = turtleSystem;
        }
    },
    '!クリア': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            // console.log('tutle::!クリア')
            sys.tags.turtles.clearAll();
        }
    },
    // @タートルグラフィックス・カメ描画
    'カメ作成': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const imageUrl = sys.__getSysVar('カメ画像URL');
            return sys.tags.turtles.createTurtle(imageUrl);
        }
    },
    'ゾウ作成': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const imageUrl = elephantImage;
            return sys.tags.turtles.createTurtle(imageUrl);
        }
    },
    'パンダ作成': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const imageUrl = pandaImage;
            return sys.tags.turtles.createTurtle(imageUrl);
        }
    },
    'カメ操作対象設定': {
        type: 'func',
        josi: [['に', 'へ', 'の']],
        pure: true,
        fn: function (id, sys) {
            sys.tags.turtles.target = id;
        },
        return_none: true
    },
    'カメ描画先': { type: 'var', value: '#turtle_cv' }, // @かめびょうがさき
    'カメ画像URL': { type: 'var', value: turtleImage }, // @かめがぞうURL
    'カメ画像変更': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (url, sys) {
            const turtles = sys.tags.turtles;
            turtles.addMacro(['changeImage', url]);
        },
        return_none: true
    },
    'カメ速度': { type: 'const', value: 100 }, // @かめそくど
    'カメ速度設定': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (v, sys) {
            sys.__setSysVar('カメ速度', v);
        }
    },
    'カメ移動': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (xy, sys) {
            const turtles = sys.tags.turtles;
            turtles.addMacro(['mv', xy[0], xy[1]]);
        },
        return_none: true
    },
    'カメ起点移動': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (xy, sys) {
            const turtles = sys.tags.turtles;
            turtles.addMacro(['xy', xy[0], xy[1]]);
        },
        return_none: true
    },
    'カメ進': {
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (v, sys) {
            const turtles = sys.tags.turtles;
            turtles.addMacro(['fd', v, 1]);
        },
        return_none: true
    },
    'カメ戻': {
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (v, sys) {
            const turtles = sys.tags.turtles;
            turtles.addMacro(['fd', v, -1]);
        },
        return_none: true
    },
    'カメ角度設定': {
        type: 'func',
        josi: [['に', 'へ', 'の']],
        pure: true,
        fn: function (v, sys) {
            const turtles = sys.tags.turtles;
            turtles.addMacro(['angle', v]);
        },
        return_none: true
    },
    'カメ右回転': {
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (v, sys) {
            const turtles = sys.tags.turtles;
            turtles.addMacro(['rotr', v]);
        },
        return_none: true
    },
    'カメ左回転': {
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (v, sys) {
            const turtles = sys.tags.turtles;
            turtles.addMacro(['rotl', v]);
        },
        return_none: true
    },
    'カメペン色設定': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (c, sys) {
            const turtles = sys.tags.turtles;
            turtles.addMacro(['color', c]);
        },
        return_none: true
    },
    'カメペンサイズ設定': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (w, sys) {
            const turtles = sys.tags.turtles;
            turtles.addMacro(['size', w]);
        }
    },
    'カメペン設定': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (w, sys) {
            const turtles = sys.tags.turtles;
            turtles.addMacro(['penOn', w]);
        }
    },
    'カメパス開始': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const turtles = sys.tags.turtles;
            turtles.addMacro(['begin']);
        }
    },
    'カメパス閉': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const turtles = sys.tags.turtles;
            turtles.addMacro(['close']);
        }
    },
    'カメパス線引': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const turtles = sys.tags.turtles;
            turtles.addMacro(['stroke']);
        }
    },
    'カメパス塗': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const turtles = sys.tags.turtles;
            turtles.addMacro(['fill']);
        }
    },
    'カメ文字描画': {
        type: 'func',
        josi: [['を', 'と', 'の']],
        pure: true,
        fn: function (s, sys) {
            const turtles = sys.tags.turtles;
            turtles.addMacro(['text', s]);
        }
    },
    'カメ文字設定': {
        type: 'func',
        josi: [['に', 'へ', 'で']],
        pure: true,
        fn: function (s, sys) {
            s = '' + s; // 文字列に
            if (s.match(/^\d+$/)) {
                s = s + 'px serif';
            }
            else if (s.match(/^\d+(px|em)$/)) {
                s = s + ' serif';
            }
            const turtles = sys.tags.turtles;
            turtles.addMacro(['textset', s]);
        }
    },
    'カメ塗色設定': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (c, sys) {
            const turtles = sys.tags.turtles;
            turtles.addMacro(['fillStyle', c]);
        },
        return_none: true
    },
    'カメ全消去': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            sys.tags.turtles.clearAll();
        },
        return_none: true
    },
    'カメコマンド実行': {
        type: 'func',
        josi: [['の', 'を']],
        pure: true,
        fn: function (cmd, sys) {
            const turtles = sys.tags.turtles;
            const a = cmd.split(/(\n|;)/);
            for (let i = 0; i < a.length; i++) {
                let c = a[i];
                c = c.replace(/^([a-zA-Z_]+)\s*(\d+)/, '$1,$2');
                c = c.replace(/^([a-zA-Z_]+)\s*=/, '$1,');
                const ca = c.split(/\s*,\s*/);
                turtles.addMacro(ca);
            }
        },
        return_none: true
    },
    'カメ非表示': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const turtles = sys.tags.turtles;
            turtles.addMacro(['visible', false]);
        },
        return_none: true
    },
    'カメ表示': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const turtles = sys.tags.turtles;
            turtles.addMacro(['visible', true]);
        },
        return_none: true
    },
    'カメクリック時': {
        type: 'func',
        josi: [['を']],
        pure: false,
        fn: function (func, sys) {
            func = sys.__findVar(func, null); // 文字列指定なら関数に変換
            if (typeof func !== 'function') {
                return;
            }
            const tid = sys.tags.turtles.target;
            const tt = sys.tags.turtles.list[tid];
            tt.canvas.onclick = (e) => {
                sys.__setSysVar('対象', e.target);
                return func(e, sys);
            };
        },
        return_none: true
    }
};
// module.exports = PluginTurtle
export default PluginTurtle;
// scriptタグで取り込んだ時、自動で登録する
// @ts-ignore TS2339
if (typeof (navigator) === 'object' && typeof (navigator.nako3)) {
    navigator.nako3.addPluginObject('PluginTurtle', PluginTurtle);
}
