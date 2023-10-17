export default {
    // @DOM部品操作
    'DOM親要素': { type: 'const', value: '' },
    'DOM部品個数': { type: 'const', value: 0 },
    'DOM部品オプション': { type: 'const', value: { '自動改行': false, 'テーブル背景色': ['#AA4040', '#ffffff', '#fff0f0'] } },
    'DOM親要素設定': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (el, sys) {
            if (typeof el === 'string') {
                el = document.querySelector(el) || document.getElementById(el);
            }
            sys.__v0['DOM親要素'] = el;
            return el;
        }
    },
    'DOM親部品設定': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (el, sys) {
            return sys.__exec('DOM親要素設定', [el, sys]);
        }
    },
    'DOMスキン': { type: 'const', value: '' },
    'DOMスキン辞書': { type: 'const', value: {} },
    'DOMスキン設定': {
        type: 'func',
        josi: [['を', 'に', 'の']],
        pure: true,
        fn: function (skin, sys) {
            sys.__v0['DOMスキン'] = skin;
        },
        return_none: true
    },
    'DOM部品作成': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (elm, sys) {
            const parent = sys.__v0['DOM親要素'];
            const btn = (typeof (elm) === 'string') ? document.createElement(elm) : elm;
            btn.id = 'nadesi-dom-' + sys.__v0['DOM部品個数'];
            // スキン適用
            const func = sys.__v0['DOMスキン辞書'][sys.__v0['DOMスキン']];
            if (typeof (func) === 'function') {
                func(elm, btn, sys);
            }
            // DOM追加
            parent.appendChild(btn);
            sys.__v0['DOM部品個数']++;
            // オプションを適用
            const opt = sys.__v0['DOM部品オプション'];
            if (opt['自動改行']) {
                parent.appendChild(document.createElement('br'));
            }
            return btn;
        }
    },
    'ボタン作成': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (label, sys) {
            const btn = sys.__exec('DOM部品作成', ['button', sys]);
            btn.innerHTML = label;
            return btn;
        }
    },
    'エディタ作成': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (text, sys) {
            const inp = sys.__exec('DOM部品作成', ['input', sys]);
            inp.type = 'text';
            inp.value = text;
            return inp;
        }
    },
    'テキストエリア作成': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (text, sys) {
            const te = sys.__exec('DOM部品作成', ['textarea', sys]);
            te.value = text;
            return te;
        }
    },
    'ラベル作成': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (text, sys) {
            const lbl = sys.__exec('DOM部品作成', ['span', sys]);
            lbl.innerHTML = text;
            return lbl;
        }
    },
    'キャンバス作成': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (size, sys) {
            const cv = sys.__exec('DOM部品作成', ['canvas', sys]);
            cv.width = size[0];
            cv.height = size[1];
            cv.style.width = size[0];
            cv.style.height = size[1];
            // 描画中キャンバスを移動する
            sys.__exec('描画開始', [cv, sys]);
            return cv;
        }
    },
    '画像作成': {
        type: 'func',
        josi: [['の', 'から']],
        pure: true,
        fn: function (url, sys) {
            const img = sys.__exec('DOM部品作成', ['img', sys]);
            img.src = url;
            return img;
        }
    },
    '改行作成': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const br = sys.__exec('DOM部品作成', ['br', sys]);
            return br;
        }
    },
    'チェックボックス作成': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (text, sys) {
            // チェックボックスは、<span><input><label></span>で成り立つように構築
            const span = document.createElement('span');
            const inp = document.createElement('input');
            inp.type = 'checkbox';
            inp.id = 'nadesi-dom-' + sys.__v0['DOM部品個数'];
            sys.__v0['DOM部品個数']++;
            const label = document.createElement('label');
            label.innerHTML = text;
            label.htmlFor = inp.id;
            span.appendChild(inp);
            span.appendChild(label);
            // 親部品に追加
            sys.__exec('DOM部品作成', [span, sys]);
            return inp;
        }
    },
    'セレクトボックス作成': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (options, sys) {
            const dom = document.createElement('select');
            for (let i = 0; i < options.length; i++) {
                const item = document.createElement('option');
                item.value = options[i];
                item.appendChild(document.createTextNode(options[i]));
                dom.appendChild(item);
            }
            // 親部品に追加
            sys.__exec('DOM部品作成', [dom, sys]);
            return dom;
        }
    },
    'セレクトボックスアイテム設定': {
        type: 'func',
        josi: [['を'], ['へ', 'に']],
        pure: true,
        fn: function (options, dom, sys) {
            if (typeof dom === 'string') {
                dom = document.querySelector(dom);
            }
            // 既存のoptionsをクリア
            dom.options.length = 0;
            // アイテムを追加
            for (let i = 0; i < options.length; i++) {
                const item = document.createElement('option');
                item.value = options[i];
                item.appendChild(document.createTextNode(options[i]));
                dom.appendChild(item);
            }
        },
        return_none: true
    },
    '色選択ボックス作成': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const inp = sys.__exec('DOM部品作成', ['input', sys]);
            inp.type = 'color';
            return inp;
        }
    },
    '日付選択ボックス作成': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const inp = sys.__exec('DOM部品作成', ['input', sys]);
            inp.type = 'date';
            return inp;
        }
    },
    'パスワード入力エディタ作成': {
        type: 'func',
        josi: [['の', 'で']],
        pure: true,
        fn: function (s, sys) {
            const inp = sys.__exec('DOM部品作成', ['input', sys]);
            inp.type = 'password';
            inp.value = s;
            return inp;
        }
    },
    '値指定バー作成': {
        type: 'func',
        josi: [['の', 'で']],
        pure: true,
        fn: function (range, sys) {
            if (!(range instanceof Array) || range.length < 2) {
                range = [0, 100, 50];
            }
            if (range.length <= 2) { // 3つ目を省略したとき
                range.push(Math.floor((range[1] - range[0]) / 2));
            }
            const inp = sys.__exec('DOM部品作成', ['input', sys]);
            inp.type = 'range';
            inp.min = range[0];
            inp.max = range[1];
            inp.value = range[2];
            return inp;
        }
    },
    '送信ボタン作成': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (label, sys) {
            const inp = sys.__exec('DOM部品作成', ['input', sys]);
            inp.type = 'submit';
            inp.value = label;
            return inp;
        }
    },
    'フォーム作成': {
        type: 'func',
        josi: [['で', 'の'], ['を']],
        pure: true,
        fn: function (obj, s, sys) {
            const frm = sys.__exec('DOM部品作成', ['form', sys]);
            // 可能ならformにobjの値を移し替える
            if (obj instanceof Object) {
                for (const key in obj) {
                    if (frm[key]) {
                        frm[key] = obj[key];
                    }
                }
            }
            // 入力項目をtableで作る
            const rows = s.split('\n');
            const table = document.createElement('table');
            for (const rowIndex in rows) {
                let row = '' + (rows[rowIndex]);
                if (row === '') {
                    continue;
                }
                if (row.indexOf('=') < 0) {
                    row += '=';
                }
                const cols = row.split('=');
                const key = cols[0];
                const val = cols[1];
                // key
                const th = document.createElement('th');
                th.innerHTML = sys.__tohtmlQ(key);
                // val
                const td = document.createElement('td');
                if (val.substring(0, 2) === '?(') {
                    // select box
                    const it = val.substring(2) + ')';
                    const ita = it.split(')');
                    const its = ita[0];
                    const def = ita[1];
                    const items = its.split('|');
                    const select = document.createElement('select');
                    select.name = key;
                    for (const it of items) {
                        const option = document.createElement('option');
                        option.value = it;
                        option.text = it;
                        select.appendChild(option);
                    }
                    const idx = items.indexOf(def);
                    if (idx >= 0) {
                        select.selectedIndex = idx;
                    }
                    td.appendChild(select);
                }
                else {
                    // input element
                    const inp = document.createElement('input');
                    td.appendChild(inp);
                    inp.id = 'nako3form_' + key;
                    if (val === '?送信' || val === '?submit') {
                        inp.type = 'submit';
                        inp.value = val.substring(1);
                        if (key !== '') {
                            inp.name = key;
                        }
                    }
                    else if (val.substring(0, 2) === '?c') {
                        inp.type = 'color';
                        inp.value = val.substring(2);
                        inp.name = key;
                    }
                    else {
                        inp.type = 'text';
                        inp.value = val;
                        inp.name = key;
                    }
                }
                const tr = document.createElement('tr');
                tr.appendChild(th);
                tr.appendChild(td);
                table.appendChild(tr);
            }
            frm.appendChild(table);
            return frm;
        }
    },
    'フォーム入力一括取得': {
        type: 'func',
        josi: [['の', 'から']],
        pure: true,
        fn: function (dom) {
            if (typeof (dom) === 'string') {
                dom = document.querySelector(dom);
            }
            const res = {};
            const getChildren = (pa) => {
                if (!pa || !pa.childNodes) {
                    return;
                }
                for (let i = 0; i < pa.childNodes.length; i++) {
                    const el = pa.childNodes[i];
                    if (!el.tagName) {
                        return;
                    }
                    const tag = el.tagName.toLowerCase();
                    if (tag === 'input') {
                        if (el.type === 'checkbox') {
                            res[el.name] = el.checked ? el.value : '';
                            continue;
                        }
                        res[el.name] = el.value;
                        continue;
                    }
                    else if (tag === 'textarea') {
                        res[el.name] = el.value;
                    }
                    else if (tag === 'select') {
                        if (el.selectedIndex >= 0) {
                            res[el.name] = el.options[el.selectedIndex].value;
                        }
                        else {
                            res[el.name] = '';
                        }
                    }
                    getChildren(el);
                }
            };
            getChildren(dom);
            return res;
        }
    },
    'テーブル作成': {
        type: 'func',
        josi: [['の', 'から']],
        pure: true,
        fn: function (aa, sys) {
            if (typeof (aa) === 'string') {
                const rr = [];
                const rows = aa.split('\n');
                for (const row of rows) {
                    rr.push(row.split(','));
                }
                aa = rr;
            }
            const bgColor = JSON.parse(JSON.stringify(sys.__v0['DOM部品オプション']['テーブル背景色']));
            for (let i = 0; i < 3; i++) {
                bgColor.push('');
            }
            const bgHead = bgColor.shift();
            const table = sys.__exec('DOM部品作成', ['table', sys]);
            for (let i = 0; i < aa.length; i++) {
                const rowNo = i;
                const row = aa[rowNo];
                const tr = document.createElement('tr');
                for (let col of row) {
                    col = '' + col;
                    const td = document.createElement((rowNo === 0) ? 'th' : 'td');
                    td.innerHTML = sys.__tohtml(col);
                    // 色指定
                    if (bgHead !== '') {
                        td.style.backgroundColor = (rowNo === 0) ? bgHead : bgColor[rowNo % 2];
                        td.style.color = (rowNo === 0) ? 'white' : 'black';
                    }
                    if (col.match(/^(\+|-)?\d+(\.\d+)?$/)) { // number?
                        td.style.textAlign = 'right';
                    }
                    tr.appendChild(td);
                }
                table.appendChild(tr);
            }
            return table;
        }
    },
    'マーメイド作成': {
        type: 'func',
        josi: [['の']],
        pure: true,
        asyncFn: true,
        fn: async function (src, sys) {
            console.log('aaa');
            const div = sys.__exec('DOM部品作成', ['div', sys]);
            div.classList.add('mermaid');
            div.innerHTML = src;
            // ライブラリを読み込む
            if (typeof sys.__v0.WINDOW.mermaid === 'undefined') {
                console.log('try to load mermaid');
                await sys.__loadScript('https://cdn.jsdelivr.net/npm/mermaid@10.5.0/dist/mermaid.min.js');
                console.log('loaded mermaid');
            }
            await sys.__v0.WINDOW.mermaid.run();
            return div;
        }
    }
};
