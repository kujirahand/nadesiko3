const assert = require('assert');
const NakoCompiler = require('../src/nako3');

describe('func_test', () => {
    const nako = new NakoCompiler();
    //nako.debug = true;
    const cmp = (code, res) => {
        if (nako.debug) {
            console.log("code=" + code);
        }
        assert.equal(nako.run_reset(code).log, res);
    };
    // --- test ---
    it('def_func no arg', () => {
        cmp("●HOGE()\n「あ」と表示\n---\nHOGE。", "あ");
    });
    it('def_func with arg', () => {
        cmp("●HOGE(Aに)\nAと表示\n---\n「姫」にHOGE。", "姫");
    });
    it('def_func with arg3', () => {
        cmp("●踊る(AとBがCを)\n「{A}:{B}:{C}」と表示\n---\n「姫」と「殿」が「タンゴ」を踊る。", "姫:殿:タンゴ");
    });
    it('def_func has return', () => {
        cmp("●加算(AにBを)\n(A+B)で戻る\n---\n2に3を加算して表示。", "5");
    });
    it('再帰テスト', () => {
        cmp("●NN(vとlevelで)\n" +
            "もしlevel<=0ならば、vで戻る。\n" +
            "(v+1)と(level-1)でNN。\n" +
            "それで戻る。\n---\n" +
            "0と5でNN。それを表示。", "5");
    });
    it('ローカル変数1', () => {
        cmp("N=30\n" +
            "●テスト\n" +
            "  Nとは変数\n" +
            "  N=10\n" +
            "---\n"+
            "テスト。\n" +
            "Nを表示。", "30");
    });
    it('ローカル変数2', () => {
        cmp("N=30\n" +
            "●テスト\n" +
            "  Nとは変数=10\n" +
            "---\n"+
            "テスト。\n" +
            "Nを表示。", "30");
    });
    it('ローカル変数3', () => {
        cmp("N=300\n" +
            "●テスト(AにBを)\n" +
            "  変数のN=A+B\n" +
            "---\n"+
            "1に2をテスト。\n" +
            "Nを表示。", "300");
    });
    it('ローカル定数1', () => {
        cmp("定数のN=30\n" +
            "Nを表示。", "30");
    });
    it('助詞の複数定義', () => {
        cmp('●加算処理（AにBを|AとBの）\n' +
            '(A+B)を戻す。\n' +
            '---\n' + 
            '10に20を加算処理して表示。\n' +
            '20と10の加算処理して表示。\n', '30\n30');
    });
});
