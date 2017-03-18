const assert = require('assert');
const NakoCompiler = require('../src/nako3');

describe('debug', () => {
    const nako = new NakoCompiler();
    // nako.debug = true;
    const cmp = (code, res) => {
        if (nako.debug) {
            console.log("code=" + code);
        }
        assert.equal(nako.run_reset(code).log, res);
    };
    // --- test ---
    it('print simple', () => {
        cmp("/* aaa */\n3を表示\n2*3を表示", "3\n6");
        // cmp("/* a\n */\n3を表示\n「テスト」でエラー発生。", "3\n6");
    });
});
