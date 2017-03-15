const assert = require('assert');
const NakoCompiler = require('../src/nako3');

describe('basic', () => {
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
        cmp("3を表示", "3");
    });
    it('print', () => {
        cmp("3を表示", "3");
        cmp("100を表示", "100");
        cmp("0xFFを表示", "255");
    });
    it('string', () => {
        cmp("「abc」を表示", "abc");
        cmp("\"abc\"を表示", "abc");
    });
    it('rawstring', () => {
        cmp("『abc』を表示", "abc");
        cmp("'abc'を表示", "abc");
    });
    it('exstring', () => {
        cmp("a=30;「abc{a}abc」を表示", "abc30abc");
        cmp("a=30;「abc｛a｝abc」を表示", "abc30abc");
    });
    it('raw string - R{{{ .. }}}', () => {
        cmp("a=R{{{abc}}};aを表示", "abc");
    });
    it('EX string - S{{{{{ .. }}}}}', () => {
        cmp("v=30;a=S{{{{{abc{v}abc}}}}};aを表示", "abc30abc");
    });
    it('string - LF', () => {
        cmp("a=30;「abc\nabc」を表示", "abc\nabc");
    });
    it('string - 文字列{{{ ... }}}', () => {
        cmp("文字列{{{aaa}}}を表示", "aaa");
        cmp("a=30;文字列{{{aaa{a}bbb}}}を表示", "aaa30bbb");
        cmp("a=30;文字列｛｛｛aaa{a}bbb｝｝｝を表示", "aaa30bbb");
    });
    it('システム定数', () => {
        cmp("ナデシコエンジンを表示", "nadesi.com/v3");
    });
    it('JS{{{ .. }}}', () => {
        cmp("A=JS{{{31}}};Aを表示。", "31");
    });
});
