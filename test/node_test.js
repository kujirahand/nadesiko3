const assert = require('assert');
const NakoCompiler = require('../src/nako3');
const execSync = require('child_process').execSync;
const path = require('path');

const cnako3 = path.dirname(__dirname) + '/src/cnako3';

describe('node_test(cnako)', () => {
    const debug = false;
    const cmp = (code, ex_res) => {
        const res = execSync(`${cnako3} -e "${code}"`);
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
        cmp("1+2*3を表示", "7");
        cmp("A=30;「--{A}--」を表示", "--30--");
    });
});
