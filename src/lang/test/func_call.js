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
    it('足す(2,3)を表示。', () => {
        cmp("足す(2,3)を表示。", "5");
    });
    // ---
});
