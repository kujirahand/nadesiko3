export default {
    // @HTTPとAJAX
    'HTTP取得': {
        type: 'func',
        josi: [['の', 'から', 'を']],
        pure: true,
        asyncFn: true,
        fn: async function (url, sys) {
            return sys.__exec('AJAXテキスト取得', [url, sys]);
        }
    },
    'AJAX受信': {
        type: 'func',
        josi: [['から', 'を']],
        pure: true,
        asyncFn: true,
        fn: async function (url, sys) {
            return sys.__exec('AJAXテキスト取得', [url, sys]);
        }
    },
    'AJAX受信時': {
        type: 'func',
        josi: [['で'], ['から', 'を']],
        pure: true,
        fn: function (callback, url, sys) {
            sys.__exec('AJAX送信時', [callback, url, sys]);
        },
        return_none: true
    },
    'AJAX送信': {
        type: 'func',
        josi: [['まで', 'へ', 'に']],
        pure: true,
        asyncFn: true,
        fn: async function (url, sys) {
            return sys.__exec('AJAXテキスト取得', [url, sys]);
        }
    },
    'AJAX送信時': {
        type: 'func',
        josi: [['の'], ['まで', 'へ', 'に']],
        pure: true,
        fn: function (callback, url, sys) {
            let options = sys.__v0['AJAXオプション'];
            if (options === '') {
                options = { method: 'GET' };
            }
            fetch(url, options).then(res => {
                // もし301であれば自動でリダイレクトするため,200だけをチェックすれば良い
                if (res.status !== 200) {
                    return sys.__v0['AJAX:ONERROR'](res.status);
                }
                return res.text();
            }).then(text => {
                sys.__v0['対象'] = text;
                callback(text, sys);
            }).catch(err => {
                sys.__v0['AJAX:ONERROR'](err);
            });
        },
        return_none: true
    },
    'AJAXオプション': { type: 'const', value: '' },
    'AJAXオプション設定': {
        type: 'func',
        josi: [['に', 'へ', 'と']],
        pure: true,
        fn: function (option, sys) {
            sys.__v0['AJAXオプション'] = option;
        },
        return_none: true
    },
    'AJAXオプションPOST設定': {
        type: 'func',
        josi: [['を', 'で']],
        pure: true,
        fn: function (params, sys) {
            const bodyData = sys.__exec('POSTデータ生成', [params, sys]);
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: bodyData
            };
            sys.__v0['AJAXオプション'] = options;
        },
        return_none: true
    },
    'AJAX失敗時': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (callback, sys) {
            sys.__v0['AJAX:ONERROR'] = callback;
        }
    },
    'AJAXテキスト取得': {
        type: 'func',
        josi: [['から', 'を']],
        pure: true,
        asyncFn: true,
        fn: async function (url, sys) {
            let options = sys.__v0['AJAXオプション'];
            if (options === '') {
                options = { method: 'GET' };
            }
            const res = await fetch(url, options);
            const txt = await res.text();
            return txt;
        },
        return_none: false
    },
    'AJAX_JSON取得': {
        type: 'func',
        josi: [['から']],
        pure: true,
        asyncFn: true,
        fn: async function (url, sys) {
            let options = sys.__v0['AJAXオプション'];
            if (options === '') {
                options = { method: 'GET' };
            }
            const res = await fetch(url, options);
            const txt = await res.json();
            return txt;
        },
        return_none: false
    },
    'AJAXバイナリ取得': {
        type: 'func',
        josi: [['から']],
        pure: true,
        asyncFn: true,
        fn: async function (url, sys) {
            let options = sys.__v0['AJAXオプション'];
            if (options === '') {
                options = { method: 'GET' };
            }
            const res = await fetch(url, options);
            const bin = await res.blob();
            return bin;
        },
        return_none: false
    },
    // @GETとPOST
    'GET送信時': {
        type: 'func',
        josi: [['の'], ['まで', 'へ', 'に']],
        pure: true,
        fn: function (callback, url, sys) {
            sys.__exec('AJAX送信時', [callback, url, sys]);
        },
        return_none: true
    },
    'POST送信時': {
        type: 'func',
        josi: [['の'], ['まで', 'へ', 'に'], ['を']],
        pure: true,
        fn: function (callback, url, params, sys) {
            const bodyData = sys.__exec('POSTデータ生成', [params, sys]);
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: bodyData
            };
            fetch(url, options).then(res => {
                return res.text();
            }).then(text => {
                sys.__v0['対象'] = text;
                callback(text);
            }).catch(err => {
                sys.__v0['AJAX:ONERROR'](err);
            });
        }
    },
    'POSTフォーム送信時': {
        type: 'func',
        josi: [['の'], ['まで', 'へ', 'に'], ['を']],
        pure: true,
        fn: function (callback, url, params, sys) {
            const fd = new FormData();
            for (const key in params) {
                fd.set(key, params[key]);
            }
            const options = {
                method: 'POST',
                body: fd
            };
            fetch(url, options).then(res => {
                return res.text();
            }).then(text => {
                sys.__v0['対象'] = text;
                callback(text);
            }).catch(err => {
                sys.__v0['AJAX:ONERROR'](err);
            });
        }
    },
    'POSTデータ生成': {
        type: 'func',
        josi: [['の', 'を']],
        pure: true,
        fn: function (params, sys) {
            const flist = [];
            for (const key in params) {
                const v = params[key];
                const kv = encodeURIComponent(key) + '=' + encodeURIComponent(v);
                flist.push(kv);
            }
            return flist.join('&');
        }
    },
    'POST送信': {
        type: 'func',
        josi: [['まで', 'へ', 'に'], ['を']],
        pure: true,
        asyncFn: true,
        fn: function (url, params, sys) {
            return new Promise((resolve, reject) => {
                const bodyData = sys.__exec('POSTデータ生成', [params, sys]);
                const options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: bodyData
                };
                fetch(url, options).then(res => {
                    return res.text();
                }).then(text => {
                    resolve(text);
                }).catch(err => {
                    reject(err.message);
                });
            });
        }
    },
    'POSTフォーム送信': {
        type: 'func',
        josi: [['まで', 'へ', 'に'], ['を']],
        pure: true,
        asyncFn: true,
        fn: function (url, params, sys) {
            return new Promise((resolve, reject) => {
                const fd = new FormData();
                for (const key in params) {
                    fd.set(key, params[key]);
                }
                const options = {
                    method: 'POST',
                    body: fd
                };
                fetch(url, options).then(res => {
                    return res.text();
                }).then(text => {
                    resolve(text);
                }).catch(err => {
                    reject(err.message);
                });
            });
        }
    },
    // @HTTPとAJAX(保証)
    'AJAX保障送信': {
        type: 'func',
        josi: [['まで', 'へ', 'に']],
        pure: true,
        fn: function (url, sys) {
            let options = sys.__v0['AJAXオプション'];
            if (options === '') {
                options = { method: 'GET' };
            }
            return fetch(url, options);
        },
        return_none: false
    },
    'HTTP保障取得': {
        type: 'func',
        josi: [['の', 'から', 'を']],
        pure: true,
        fn: function (url, sys) {
            return sys.__exec('AJAX保障送信', [url, sys]);
        },
        return_none: false
    },
    'POST保障送信': {
        type: 'func',
        josi: [['まで', 'へ', 'に'], ['を']],
        pure: true,
        fn: function (url, params, sys) {
            const bodyData = sys.__exec('POSTデータ生成', [params, sys]);
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: bodyData
            };
            return fetch(url, options);
        },
        return_none: false
    },
    'POSTフォーム保障送信': {
        type: 'func',
        josi: [['まで', 'へ', 'に'], ['を']],
        pure: true,
        fn: function (url, params, sys) {
            const fd = new FormData();
            for (const key in params) {
                fd.set(key, params[key]);
            }
            const options = {
                method: 'POST',
                body: fd
            };
            return fetch(url, options);
        },
        return_none: false
    },
    'AJAX内容取得': {
        type: 'func',
        josi: [['から'], ['で']],
        pure: true,
        fn: function (res, type, sys) {
            type = type.toString().toUpperCase();
            if (type === 'TEXT' || type === 'テキスト') {
                return res.text();
            }
            else if (type === 'JSON') {
                return res.json();
            }
            else if (type === 'BLOB') {
                return res.blob();
            }
            else if (type === 'ARRAY' || type === '配列') {
                return res.arrayBuffer();
            }
            else if (type === 'BODY' || type === '本体') {
                return res.body;
            }
            return res.body();
        },
        return_none: false
    },
    // @Blob
    'BLOB作成': {
        type: 'func',
        josi: [['を', 'から'], ['で']],
        pure: true,
        fn: function (data, options) {
            if (!(data instanceof Array)) {
                data = [data];
            }
            return new Blob(data, options);
        }
    },
    // @HTTPとAJAX(非推奨)
    'AJAX逐次送信': {
        type: 'func',
        josi: [['まで', 'へ', 'に']],
        pure: true,
        fn: function (url, sys) {
            if (!sys.resolve) {
                throw new Error('『AJAX逐次送信』は『逐次実行』構文内で利用する必要があります。');
            }
            sys.resolveCount++;
            const resolve = sys.resolve;
            const reject = sys.reject;
            let options = sys.__v0['AJAXオプション'];
            if (options === '') {
                options = { method: 'GET' };
            }
            fetch(url, options).then(res => {
                return res.text();
            }).then(text => {
                sys.__v0['対象'] = text;
                resolve();
            }).catch(err => {
                reject(err.message);
            });
        },
        return_none: true
    },
    'HTTP逐次取得': {
        type: 'func',
        josi: [['の', 'から', 'を']],
        pure: true,
        fn: function (url, sys) {
            if (!sys.resolve) {
                throw new Error('『HTTP逐次取得』は『逐次実行』構文内で利用する必要があります。');
            }
            sys.__exec('AJAX逐次送信', [url, sys]);
        },
        return_none: true
    },
    'POST逐次送信': {
        type: 'func',
        josi: [['まで', 'へ', 'に'], ['を']],
        pure: true,
        fn: function (url, params, sys) {
            if (!sys.resolve) {
                throw new Error('『POST送信』は『逐次実行』構文内で利用する必要があります。');
            }
            sys.resolveCount++;
            const resolve = sys.resolve;
            const reject = sys.reject;
            const bodyData = sys.__exec('POSTデータ生成', [params, sys]);
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: bodyData
            };
            fetch(url, options).then(res => {
                return res.text();
            }).then(text => {
                sys.__v0['対象'] = text;
                resolve(text);
            }).catch(err => {
                reject(err.message);
            });
        },
        return_none: true
    },
    'POSTフォーム逐次送信': {
        type: 'func',
        josi: [['まで', 'へ', 'に'], ['を']],
        pure: true,
        fn: function (url, params, sys) {
            if (!sys.resolve) {
                throw new Error('『POSTフォーム逐次送信』は『逐次実行』構文内で利用する必要があります。');
            }
            sys.resolveCount++;
            const resolve = sys.resolve;
            const reject = sys.reject;
            const fd = new FormData();
            for (const key in params) {
                fd.set(key, params[key]);
            }
            const options = {
                method: 'POST',
                body: fd
            };
            fetch(url, options).then(res => {
                return res.text();
            }).then(text => {
                sys.__v0['対象'] = text;
                resolve(text);
            }).catch(err => {
                reject(err.message);
            });
        },
        return_none: true
    }
};
