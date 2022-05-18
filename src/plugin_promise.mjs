// @ts-nocheck
export default {
    '初期化': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            if (sys.__promise == null) {
                sys.__promise = {
                    setLastPromise: function (promise) {
                        sys.__v0['そ'] = promise;
                        return promise;
                    }
                };
            }
        }
    },
    // @非同期処理の保証の定数
    'そ': { type: 'const', value: '' },
    // @非同期処理の保証
    '動時': {
        type: 'func',
        josi: [['を', 'で']],
        pure: true,
        fn: function (callback, sys) {
            return sys.__promise.setLastPromise(new Promise((resolve, reject) => {
                return callback(resolve, reject);
            }));
        },
        return_none: false
    },
    '成功時': {
        type: 'func',
        josi: [['を'], ['の', 'が', 'に']],
        pure: true,
        fn: function (callback, promise, sys) {
            return sys.__promise.setLastPromise(promise.then(result => {
                sys.__v0['対象'] = result;
                return callback(result);
            }));
        },
        return_none: false
    },
    '処理時': {
        type: 'func',
        josi: [['を'], ['の', 'が', 'に']],
        pure: true,
        fn: function (cbFunc, promise, sys) {
            return sys.__promise.setLastPromise(promise.then(result => {
                sys.__v0['対象'] = result;
                return cbFunc(true, result, sys);
            }, reason => {
                sys.__v0['対象'] = reason;
                return cbFunc(false, reason, sys);
            }));
        },
        return_none: false
    },
    '失敗時': {
        type: 'func',
        josi: [['を'], ['の', 'が', 'に']],
        pure: true,
        fn: function (callback, promise, sys) {
            return sys.__promise.setLastPromise(promise.catch(err => {
                sys.__v0['対象'] = err;
                return callback(err);
            }));
        },
        return_none: false
    },
    '終了時': {
        type: 'func',
        josi: [['を'], ['の', 'が', 'に']],
        pure: true,
        fn: function (callback, promise, sys) {
            return sys.__promise.setLastPromise(promise.finally(() => {
                return callback();
            }));
        },
        return_none: false
    },
    '束': {
        type: 'func',
        josi: [['と', 'を']],
        pure: true,
        fn: function (...args) {
            const sys = args.pop();
            return sys.__promise.setLastPromise(Promise.all(args));
        },
        return_none: false
    }
};
