const assert = require('assert');
const NakoCompiler = require('../src/nako3');
const execSync = require('child_process').execSync;

describe('cnako3', () => {
    const debug = true;
    const cmp = (code, ex_res) => {
        const res = execSync(`../src/cnako3 -e "${code}"`);
        const result = res.toString().replace(/\s+$/, '');
        if (debug) {
            console.log("code=" + code);
            console.log("result=" + result);
        }
        assert.equal(result, ex_res);
    };
    // --- test ---
    it('print simple', () => {
        cmp("3を表示", "3");
    });
});
