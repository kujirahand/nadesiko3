const assert = require('assert');
const NakoCompiler = require('../src/nako3');

describe('関数呼び出しテスト', () => {
    const nako = new NakoCompiler();
    // nako.debug = true;
    const cmp = (code, res) => {
        if (nako.debug) {
            console.log("code=" + code);
        }
        assert.equal(nako.run_reset(code).log, res);
    };
    // --- test ---
    it('関数式の呼び出し - 足す(2,3)を表示。', () => {
        cmp("足す(2,3)を表示。", "5");
    });
    it('四則演算を連文で', () => {
        cmp("1に2に足して3を掛けて3で割って2を引いて表示", "1");
    });
    // ---
});
