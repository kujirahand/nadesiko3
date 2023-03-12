/* eslint-disable quote-props */
const errMsgCanvasInit = '描画を行うためには、HTML内にcanvasを配置し、idを振って『描画開始』命令に指定します。';
export default {
    // @描画
    '描画開始': {
        type: 'func',
        josi: [['の', 'へ', 'で']],
        pure: true,
        fn: function (cv, sys) {
            if (typeof cv === 'string') {
                cv = document.querySelector(cv) || document.getElementById(cv);
            }
            if (!cv) {
                throw new Error('『描画開始』でCanvasを取得できませんでした。');
            }
            sys.__canvas = cv;
            sys.__ctx = cv.getContext('2d');
            sys.__fillStyle = 'black';
            sys.__strokeStyle = 'black';
            sys.__v0['描画中キャンバス'] = cv;
            sys.__v0['描画中コンテキスト'] = sys.__ctx;
        },
        return_none: true
    },
    '描画中キャンバス': { type: 'const', value: null },
    '描画中コンテキスト': { type: 'const', value: null },
    'キャンバス状態保存': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            if (!sys.__ctx) {
                throw new Error(errMsgCanvasInit);
            }
            sys.__ctx.save();
        },
        return_none: true
    },
    'キャンバス状態復元': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            if (!sys.__ctx) {
                throw new Error(errMsgCanvasInit);
            }
            sys.__ctx.restore();
        },
        return_none: true
    },
    '線色設定': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (v, sys) {
            if (!sys.__ctx) {
                throw new Error(errMsgCanvasInit);
            }
            sys.__strokeStyle = v;
            if (v !== '') {
                sys.__ctx.strokeStyle = v;
            }
        },
        return_none: true
    },
    '塗色設定': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (v, sys) {
            if (!sys.__ctx) {
                throw new Error(errMsgCanvasInit);
            }
            sys.__fillStyle = v;
            if (v !== '') {
                sys.__ctx.fillStyle = v;
            }
        },
        return_none: true
    },
    '線描画': {
        type: 'func',
        josi: [['から'], ['へ', 'まで']],
        pure: true,
        fn: function (a, b, sys) {
            if (!sys.__ctx) {
                throw new Error(errMsgCanvasInit);
            }
            sys.__ctx.beginPath();
            sys.__ctx.moveTo(a[0], a[1]);
            sys.__ctx.lineTo(b[0], b[1]);
            sys.__ctx.stroke();
        },
        return_none: true
    },
    '線太設定': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (v, sys) {
            if (!sys.__ctx) {
                throw new Error(errMsgCanvasInit);
            }
            sys.__ctx.lineWidth = v;
        },
        return_none: true
    },
    '四角描画': {
        type: 'func',
        josi: [['の', 'へ', 'に']],
        pure: true,
        fn: function (b, sys) {
            if (!sys.__ctx) {
                throw new Error(errMsgCanvasInit);
            }
            if (sys.__fillStyle === '' && sys.__strokeStyle === '') {
                return;
            }
            sys.__ctx.beginPath();
            sys.__ctx.rect(b[0], b[1], b[2], b[3]);
            if (sys.__fillStyle !== '') {
                sys.__ctx.fill();
            }
            if (sys.__strokeStyle !== '') {
                sys.__ctx.stroke();
            }
        },
        return_none: true
    },
    '全描画クリア': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            if (!sys.__ctx) {
                throw new Error(errMsgCanvasInit);
            }
            sys.__ctx.clearRect(0, 0, sys.__canvas.width, sys.__canvas.height);
        },
        return_none: true
    },
    '描画クリア': {
        type: 'func',
        josi: [['の', 'へ', 'に']],
        pure: true,
        fn: function (b, sys) {
            if (!sys.__ctx) {
                throw new Error(errMsgCanvasInit);
            }
            if (!(b instanceof Array)) {
                b = [];
            }
            if (b.length === 0) {
                b = [0, 0, sys.__canvas.width, sys.__canvas.height];
            }
            else if (b.length <= 2) {
                b.unshift(0);
                b.unshift(0);
            }
            sys.__ctx.clearRect(b[0], b[1], b[2], b[3]);
        },
        return_none: true
    },
    '円描画': {
        type: 'func',
        josi: [['へ', 'に'], ['の']],
        pure: true,
        fn: function (xy, r, sys) {
            if (!sys.__ctx) {
                throw new Error(errMsgCanvasInit);
            }
            if (sys.__fillStyle === '' && sys.__strokeStyle === '') {
                return;
            }
            sys.__ctx.beginPath();
            sys.__ctx.arc(xy[0], xy[1], r, 0, 2 * Math.PI, false);
            if (sys.__fillStyle !== '') {
                sys.__ctx.fill();
            }
            if (sys.__strokeStyle !== '') {
                sys.__ctx.stroke();
            }
        },
        return_none: true
    },
    '楕円描画': {
        type: 'func',
        josi: [['へ', 'に', 'の']],
        pure: true,
        fn: function (args, sys) {
            if (!sys.__ctx) {
                throw new Error(errMsgCanvasInit);
            }
            if (!args) {
                throw new Error('楕円描画の引数配列が無効です');
            }
            if (args.length < 4) {
                throw new Error('楕円描画の引数配列が不足しています');
            }
            if (args.length < 7) {
                if (!args[4]) {
                    args[4] = 0;
                }
                if (!args[5]) {
                    args[5] = 0;
                }
                if (!args[6]) {
                    args[6] = Math.PI * 2;
                }
                if (!args[7]) {
                    args[7] = true;
                }
            }
            if (sys.__fillStyle === '' && sys.__strokeStyle === '') {
                return;
            }
            sys.__ctx.beginPath();
            sys.__ctx.ellipse(...args);
            if (sys.__fillStyle !== '') {
                sys.__ctx.fill();
            }
            if (sys.__strokeStyle !== '') {
                sys.__ctx.stroke();
            }
        },
        return_none: true
    },
    '多角形描画': {
        type: 'func',
        josi: [['で', 'の', 'を']],
        pure: true,
        fn: function (a, sys) {
            if (!sys.__ctx) {
                throw new Error(errMsgCanvasInit);
            }
            if (sys.__fillStyle === '' && sys.__strokeStyle === '') {
                return;
            }
            sys.__ctx.beginPath();
            const p = a[0];
            sys.__ctx.moveTo(p[0], p[1]);
            for (let i = 1; i < a.length; i++) {
                const t = a[i];
                sys.__ctx.lineTo(t[0], t[1]);
            }
            sys.__ctx.lineTo(p[0], p[1]);
            if (sys.__fillStyle !== '') {
                sys.__ctx.fill();
            }
            if (sys.__strokeStyle !== '') {
                sys.__ctx.stroke();
            }
        },
        return_none: true
    },
    '画像読': {
        type: 'func',
        josi: [['の', 'を']],
        pure: true,
        fn: function (url, sys) {
            const img = new window.Image();
            img.src = url;
            img.crossOrigin = 'Anonymous';
            return img;
        }
    },
    '画像読待': {
        type: 'func',
        josi: [['の', 'を']],
        pure: true,
        asyncFn: true,
        fn: function (url) {
            return new Promise((resolve, reject) => {
                const img = new window.Image();
                img.src = url;
                img.crossOrigin = 'Anonymous';
                img.onload = () => { resolve(img); };
                img.onerror = () => {
                    reject(new Error(`『画像読待』で読込みエラー。URL=『${url}』`));
                };
            });
        }
    },
    '画像逐次読': {
        type: 'func',
        josi: [['の', 'を']],
        pure: true,
        fn: function (url, sys) {
            if (sys.resolve === undefined) {
                throw new Error('『画像逐次読』は『逐次実行』構文で使ってください。');
            }
            sys.resolveCount++;
            const img = new window.Image();
            img.src = url;
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                sys.__v0['対象'] = img;
                sys.resolve();
            };
            img.onerror = () => {
                sys.__v0['対象'] = '';
                sys.reject();
            };
            return img;
        }
    },
    '画像読時': {
        type: 'func',
        josi: [['で'], ['の', 'を']],
        pure: true,
        fn: function (f, url, sys) {
            // 関数オブジェクトを得る
            const func = sys.__findVar(f, null); // 文字列指定なら関数に変換
            // 画像を読む
            const img = new window.Image();
            img.src = url;
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                sys.__v0['対象'] = img;
                func(sys);
            };
            img.onerror = () => {
                sys.__v0['対象'] = '';
                func(sys);
            };
        },
        return_none: true
    },
    '画像描画': {
        type: 'func',
        josi: [['の', 'を'], ['へ', 'に']],
        pure: true,
        fn: function (img, xy, sys) {
            if (!sys.__ctx) {
                throw new Error(errMsgCanvasInit);
            }
            const drawFunc = (im, ctx) => {
                if (xy.length === 2) {
                    ctx.drawImage(im, xy[0], xy[1]);
                }
                else if (xy.length === 4) {
                    ctx.drawImage(im, xy[0], xy[1], xy[2], xy[3]);
                }
                else if (xy.length === 8) {
                    ctx.drawImage(im, xy[0], xy[1], xy[2], xy[3], xy[4], xy[5], xy[6], xy[7]);
                }
                else {
                    throw new Error('『画像描画』の第二引数の配列要素は2,4,8個のいずれかです。');
                }
            };
            if (typeof img === 'string') {
                const image = new window.Image();
                image.src = img;
                image.crossOrigin = 'Anonymous';
                image.onload = () => {
                    drawFunc(image, sys.__ctx);
                };
                return image;
            }
            else {
                drawFunc(img, sys.__ctx);
                return img;
            }
        },
        return_none: false
    },
    '画像部分描画': {
        type: 'func',
        josi: [['の'], ['を', 'から'], ['へ', 'に']],
        pure: true,
        fn: function (img, sxy, dxy, sys) {
            const errArgLen = '『画像部分描画』に使える引数は画像と、描画する座標へ2つか、' +
                '描画する座標とその位置の4つか、使用する座標と使用する位置と描画する座標と大きさの8つだけです。';
            if (img && sxy) {
                if (!Array.isArray(sxy) && Array.isArray(img)) { // 逆になっていれば入れ替える
                    // eslint-disable-next-line no-proto
                    if (typeof sxy === 'string' || String(sxy.__proto__) === '[object HTMLImageElement]') {
                        const sw = img;
                        img = sxy;
                        sxy = sw;
                    }
                }
            }
            if (!sys.__ctx) {
                throw new Error(errMsgCanvasInit);
            }
            const drawFunc = (im, ctx) => {
                if (!dxy) {
                    if (!sxy) {
                        ctx.drawImage(im);
                    }
                    else if (sxy.length >= 2) { // もしsxyがあるのにdxyがなかったらdxyを代わりにする
                        dxy = sxy;
                        sxy = undefined;
                    }
                }
                if (dxy.length === 2) {
                    ctx.drawImage(im, dxy[0], dxy[1]);
                }
                else if (dxy.length === 4) {
                    if (!sxy) {
                        ctx.drawImage(im, dxy[0], dxy[1], dxy[2], dxy[3]);
                    }
                    else if (sxy.length === 4) {
                        ctx.drawImage(im, sxy[0], sxy[1], sxy[2], sxy[3], dxy[0], dxy[1], dxy[2], dxy[3]);
                    }
                    else {
                        throw new Error(errArgLen);
                    }
                }
                else {
                    throw new Error(errArgLen);
                }
            };
            if (typeof img === 'string') {
                const image = new window.Image();
                image.src = img;
                image.crossOrigin = 'Anonymous';
                image.onload = () => {
                    drawFunc(image, sys.__ctx);
                };
                return image;
            }
            else {
                drawFunc(img, sys.__ctx);
                return img;
            }
        },
        return_none: false
    },
    '描画フォント設定': {
        type: 'func',
        josi: [['を', 'の', 'で', 'に']],
        pure: true,
        fn: function (n, sys) {
            // 数値だけならフォントサイズのみの指定
            if (typeof n === 'number') {
                n = n + 'px sans-serif';
            }
            // ピクセル数のみの指定なら適当にフォントを足す
            if (/^[0-9]+(px|em)$/.test(n)) {
                n = n + ' sans-serif';
            }
            sys.__ctx.font = n;
        },
        return_none: true
    },
    '文字描画': {
        type: 'func',
        josi: [['へ', 'に'], ['の', 'を']],
        pure: true,
        fn: function (xy, s, sys) {
            if (!sys.__ctx) {
                throw new Error(errMsgCanvasInit);
            }
            sys.__ctx.fillText(s, xy[0], xy[1]);
        },
        return_none: true
    },
    '文字描画幅取得': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (s, sys) {
            if (!sys.__ctx) {
                throw new Error(errMsgCanvasInit);
            }
            return sys.__ctx.measureText(s);
        },
        return_none: true
    },
    '描画起点設定': {
        type: 'func',
        josi: [['へ', 'に']],
        pure: true,
        fn: function (xy, sys) {
            if (!sys.__ctx) {
                throw new Error(errMsgCanvasInit);
            }
            sys.__ctx.translate(xy[0], xy[1]);
        },
        return_none: true
    },
    '描画回転': {
        type: 'func',
        josi: [['だけ', 'に', 'へ']],
        pure: true,
        fn: function (a, sys) {
            if (!sys.__ctx) {
                throw new Error(errMsgCanvasInit);
            }
            sys.__ctx.rotate(a * Math.PI / 180);
        },
        return_none: true
    },
    '描画拡大': {
        type: 'func',
        josi: [['だけ', 'に', 'へ']],
        pure: true,
        fn: function (xy, sys) {
            if (!sys.__ctx) {
                throw new Error(errMsgCanvasInit);
            }
            sys.__ctx.scale(xy[0], xy[1]);
        },
        return_none: true
    },
    '描画変換マトリクス設定': {
        type: 'func',
        josi: [['だけ', 'に', 'へ']],
        pure: true,
        fn: function (a, sys) {
            if (!sys.__ctx) {
                throw new Error(errMsgCanvasInit);
            }
            sys.__ctx.setTransform(a[0], a[1], a[2], a[3], a[4], a[5], a[6]);
        },
        return_none: true
    },
    '描画変換マトリクス追加': {
        type: 'func',
        josi: [['だけ', 'に', 'へ']],
        pure: true,
        fn: function (a, sys) {
            if (!sys.__ctx) {
                throw new Error(errMsgCanvasInit);
            }
            sys.__ctx.transform(a[0], a[1], a[2], a[3], a[4], a[5], a[6]);
        },
        return_none: true
    },
    '描画データURL変換': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const cv = sys.__v0['描画中キャンバス'];
            const url = cv.toDataURL('image/png');
            return url;
        }
    },
    '描画データBLOB変換': {
        type: 'func',
        josi: [],
        pure: true,
        asyncFn: true,
        fn: function (sys) {
            return new Promise((resolve, reject) => {
                const cv = sys.__v0['描画中キャンバス'];
                cv.toBlob((result) => { resolve(result); }, 'image/png');
            });
        }
    },
    '描画ダウンロードリンク作成': {
        type: 'func',
        josi: [['へ', 'に']],
        pure: true,
        fn: function (dom, sys) {
            if (typeof dom === 'string') {
                dom = document.querySelector(dom);
            }
            if (!dom) {
                throw new Error('『描画ダウンロードリンク作成』でDOMが見当たりません。');
            }
            const cv = sys.__v0['描画中キャンバス'];
            if (!cv) {
                throw new Error('『描画ダウンロード』で描画中キャンバスが設定されていません。');
            }
            dom.href = cv.toDataURL('image/png');
            dom.download = 'canvas.png';
        },
        return_none: true
    },
    '描画ダウンロード': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const cv = sys.__v0['描画中キャンバス'];
            if (!cv) {
                throw new Error('『描画ダウンロード』で描画中キャンバスが設定されていません。');
            }
            const a = document.createElement('a');
            a.href = cv.toDataURL('image/png');
            a.download = 'canvas.png';
            a.click();
            return true;
        }
    }
};
