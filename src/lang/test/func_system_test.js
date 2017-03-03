const assert = require('assert');
const NakoCompiler = require('../src/nako3.js');

describe('PluginSystem test', ()=>{
  const nako = new NakoCompiler();
  nako.debug = true;
  const cmp = (code, res) => {
    if (nako.debug) {
      console.log("code=" + code);
    }
    assert.equal(nako.run_reset(code).log, res);
  };
  // --- test ---
  it('ナデシコエンジンを表示', ()=> {
    cmp("ナデシコエンジンを表示", "nadesi.com/v3");
  });
  it('四則演算', ()=> {
    cmp("1に2を足して3を掛けて表示", "9");
    cmp("10を2で割って表示", "5");
    cmp("10を2で割った余り;それを表示", "0");
  });
  it('JS実行', ()=> {
    cmp("「3+6」をJS実行して表示", "9");
    cmp("「Math.floor(3.5)」をJS実行して表示", "3");
  });
  it('型変換', ()=> {
    cmp("「3.14」を文字列変換して表示", "3.14");
    cmp("「0xFF」を整数変換して表示", "255");
  });
  it('変数型確認', ()=> {
    cmp("30の変数型確認して表示。", "number");
  });
  it('SIN/COS/TAN', ()=> {
    cmp("SIN(1)を表示。", Math.sin(1));
    cmp("COS(1)を表示。", Math.cos(1));
    cmp("TAN(1)を表示。", Math.tan(1));
  });
  it('RGB', ()=> {
    cmp("RGB(255,255,0)を表示。", "#ffff00");
  });
  it('LOGN', ()=> {
    cmp("LOGN(10,10)を表示。", Math.LOG10E * Math.log(10));
    cmp("LOGN(2,10)を表示。", Math.LOG2E * Math.log(10));
  });
  it('文字挿入', ()=> {
    cmp("「12345」の2に「**」を文字挿入して表示", "1**2345");
    cmp("「12345」の1に「**」を文字挿入して表示", "**12345");
    cmp("「12345」の6に「**」を文字挿入して表示", "12345**");
    cmp("「12345」の0に「**」を文字挿入して表示", "**12345");
  });
  it('出現回数', ()=> {
    cmp("「aabbccaabbcc」で「aa」の出現回数。表示", "2");
    cmp("「aa**bb**cc」で「**」の出現回数。表示", "2");
    cmp("「aa.+bb.+cc」で「.+」の出現回数。表示", "2");
  });
  it('シングル文字列', ()=> {
    cmp("'abcd'を表示。", "abcd");
  });
  it('文字抜き出す', ()=> {
    cmp("MID('abcdef',1,2)を表示", "ab");
    cmp("MID('abcdefg',3,2)を表示", "cd");
    cmp("MID('abcd',4,2)を表示", "d");
  });
});

