/* eslint-disable no-undef */
import { beforeEach, describe, it } from 'node:test'
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'
import { stringify, resetEnv, parse } from '../src/nako_csv.mjs'

/** 密な2次元配列を stringify し、結果と、入力の表が書き換わらないこと・反復変換の安定性を検証する */
const assertStringify = (/** @type {(string|number)[][]} */ ary, /** @type {string} */ expected, /** @type {string|undefined} */ delimiter = undefined) => {
  const before = ary.map((row) => [...row])
  assert.strictEqual(stringify(ary, delimiter), expected)
  assert.deepStrictEqual(ary, before, '入力の表が書き換えられていない')
  assert.strictEqual(stringify(ary, delimiter), expected, '反復変換で結果が変わらない')
}

// eslint-disable-next-line no-undef
describe('plugin_csv_test', () => {
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler()
    nako.logger.debug('code=' + code)
    const g = await nako.runAsync(code)
    assert.strictEqual(g.log, res)
  }

  // グローバルオプション(options)の状態がテスト順序に依存しないよう初期化する
  beforeEach(() => { resetEnv() })

  // --- test ---
  it('CSV取得', async () => {
    await cmp('a=「1,2,3\n4,5,6」のCSV取得。a[1][2]を表示', '6')
    await cmp('a=「"a",b,c\n""a,b,c\na,""b,c\na,b,c""\n"a,\nb",c,d\na,"b,\nc",d\na,b,"c,\nd"」のCSV取得。a[5][1]を表示', 'b,\nc')
    await cmp('a=「1,"a""a",2」のCSV取得。a[0][1]を表示', 'a"a')
    await cmp('a=「1,"2""2",3\n4,5,6」のCSV取得。a[0][1]を表示', '2"2')
    await cmp('a=「1,,3\n4,5,6」のCSV取得。a[0][2]を表示', '3')
    await cmp('a=「1,2,3,\n4,5,6」のCSV取得。a[1][0]を表示', '4') // #353
  })
  it('TSV取得', async () => {
    await cmp('a=「1\t2\t3\n4\t5\t6」のTSV取得。a[1][2]を表示', '6')
    await cmp('a=「"a"\tb\tc\n""a\tb\tc\na\t""b\tc\na\tb\tc""\n"a\t\nb"\tc\td\na\t"b\t\nc"\td\na\tb\t"c\t\nd"」のTSV取得。a[5][1]を表示', 'b\t\nc')
    await cmp('a=「1\t"a""a"\t2」のTSV取得。a[0][1]を表示', 'a"a')
    await cmp('a=「1\t"2""2"\t3\n4\t5\t6」のTSV取得。a[0][1]を表示', '2"2')
    await cmp('a=「1\t\t3\n4\t5\t6」のTSV取得。a[0][2]を表示', '3')
  })
  it('CSV/TSV取得で末尾の空列が失われない #2477', async () => {
    // 行末の空セル(タブ)が保存される
    await cmp('a=「1\t\t」のTSV取得。aをJSONエンコードして表示', '[[1,"",""]]')
    await cmp('a=「1\t2\t」のTSV取得。aをJSONエンコードして表示', '[[1,2,""]]')
    // 全空セル
    await cmp('a=「\t\t」のTSV取得。aをJSONエンコードして表示', '[["","",""]]')
    // 複数行
    await cmp('a=「1\t\t\n2\t\t」のTSV取得。aをJSONエンコードして表示', '[[1,"",""],[2,"",""]]')
    // CRLF混在
    await cmp('a=「1\t2\t\r\n3\t4\t」のTSV取得。aをJSONエンコードして表示', '[[1,2,""],[3,4,""]]')
    // 末尾の改行の後に空白があっても余分な空行を作らない
    await cmp('a=「1,2,3\n 」のCSV取得。aをJSONエンコードして表示', '[[1,2,3]]')
    await cmp('a=「1\t\t\n 」のTSV取得。aをJSONエンコードして表示', '[[1,"",""]]')
    // 単一の末尾タブ・連続する末尾タブ
    await cmp('a=「1\t」のTSV取得。aをJSONエンコードして表示', '[[1,""]]')
    await cmp('a=「1\t\t\t」のTSV取得。aをJSONエンコードして表示', '[[1,"","",""]]')
    // CSVは末尾の空セル(カンマ)が従来どおり保存される
    await cmp('a=「1,,」のCSV取得。aをJSONエンコードして表示', '[[1,"",""]]')
    await cmp('a=「1,2,3,」のCSV取得。aをJSONエンコードして表示', '[[1,2,3,""]]')
    await cmp('a=「1,2,,」のCSV取得。aをJSONエンコードして表示', '[[1,2,"",""]]')
    // CSVでは末尾のタブ・スペースは従来どおりトリムされる
    await cmp('a=「1,2,3\t」のCSV取得。aをJSONエンコードして表示', '[[1,2,3]]')
  })
  it('parseは正規表現メタ文字の区切り文字でも末尾の空列を扱える #2477', () => {
    // 区切り文字の正規表現エスケープと末尾の空列保持を直接検証する
    assert.deepStrictEqual(parse('1|2|', '|'), [[1, 2, '']])
    assert.deepStrictEqual(parse('1]2]', ']'), [[1, 2, '']])
    assert.deepStrictEqual(parse('1\\2\\', '\\'), [[1, 2, '']])
    assert.deepStrictEqual(parse('1-2-', '-'), [[1, 2, '']])
  })
  it('表CSV変換', async () => {
    await cmp('[[1,2,3],[4,5,6]]を表CSV変換して表示', '1,2,3\r\n4,5,6')
    await cmp('[[1,2,"3\r\n,"],[4,5,6]]を表CSV変換して表示', '1,2,"3\r\n,"\r\n4,5,6')
    await cmp('[[1,2,3],[4,5,6]]をCSV変換して表示', '1,2,3\r\n4,5,6')
    await cmp('[[1,2,"3\r\n,"],[4,5,6]]をCSV変換して表示', '1,2,"3\r\n,"\r\n4,5,6')
  })
  it('表TSV変換', async () => {
    await cmp('[[1,2,3],[4,5,6]]を表TSV変換して表示', '1\t2\t3\r\n4\t5\t6')
    await cmp('[[1,2,"3\r\n\t"],[4,5,6]]を表TSV変換して表示', '1\t2\t"3\r\n\t"\r\n4\t5\t6')
    await cmp('[[1,2,3],[4,5,6]]をTSV変換して表示', '1\t2\t3\r\n4\t5\t6')
    await cmp('[[1,2,"3\r\n\t"],[4,5,6]]をTSV変換して表示', '1\t2\t"3\r\n\t"\r\n4\t5\t6')
  })
  it('「2024.01.01」のような日付形式が実数として誤判定する #1910', async () => {
    await cmp('a=「2024.01.01,200,300\n4,5,6」のCSV取得。a[0][0]を表示', '2024.01.01')
    await cmp('a=「3.14,200,300\n4,5,6」のCSV取得。a[0][0]を表示', '3.14')
    await cmp('a=「3.14,200,300\n4,5,6」のCSV取得。TYPEOF(a[0][0])を表示', 'number')
    await cmp('a=「2010.1.5,200,300\n4,5,6」のCSV取得。TYPEOF(a[0][0])を表示', 'string')
  })
  it('「2024.01.01」のような日付形式が実数として誤判定する #1910（auto_convert_numberをOFF）', async () => {
    await cmp('{"auto_convert_number": FALSE}をCSVオプション設定;a=「2024.01,200,300\n4,5,6」のCSV取得。TYPEOF(a[0][0])を表示', 'string')
    await cmp('{"auto_convert_number": FALSE}をCSVオプション設定;a=「2024.01,200,300\n4,5,6」のCSV取得。a[0][0]を表示', '2024.01')
  })
  it('CSV/TSV変換が入力の表を書き換えない #2475', async () => {
    // 変換しても元の表が変化しない
    await cmp('A=[["a,b"]]。AをCSV変換。AをJSONエンコードして表示', '[["a,b"]]')
    await cmp('A=[["a,b"]]。Aを表CSV変換。AをJSONエンコードして表示', '[["a,b"]]')
    await cmp('A=[["a\tb"]]。AをTSV変換。AをJSONエンコードして表示', '[["a\\tb"]]')
    await cmp('A=[["a\tb"]]。Aを表TSV変換。AをJSONエンコードして表示', '[["a\\tb"]]')
    // 引用符を含むセル
    await cmp('A=[[「a"b」]]。AをCSV変換。AをJSONエンコードして表示', '[["a\\"b"]]')
    await cmp('A=[[「a"b」]]。Aを表CSV変換。AをJSONエンコードして表示', '[["a\\"b"]]')
    await cmp('A=[[「a"b」]]。AをTSV変換。AをJSONエンコードして表示', '[["a\\"b"]]')
    await cmp('A=[[「a"b」]]。Aを表TSV変換。AをJSONエンコードして表示', '[["a\\"b"]]')
    // 2回変換しても結果が変わらない
    await cmp('A=[["a,b"]]。AをCSV変換。AをCSV変換して表示', '"a,b"')
    await cmp('A=[["a,b"]]。Aを表CSV変換。Aを表CSV変換して表示', '"a,b"')
    await cmp('A=[[「a"b」]]。AをCSV変換。AをCSV変換して表示', '"a""b"')
    await cmp('A=[["a\tb"]]。AをTSV変換。AをTSV変換して表示', '"a\tb"')
    await cmp('A=[["a\tb"]]。Aを表TSV変換。Aを表TSV変換して表示', '"a\tb"')
  })
  it('stringifyは入力の表を書き換えず、反復変換しても結果が変わらない #2475', () => {
    // 引用符を含むセル
    assertStringify([['a"b']], '"a""b"\r\n')
    // 区切り文字を含むセル
    assertStringify([['a,b']], '"a,b"\r\n')
    // 改行を含むセル
    assertStringify([['a\nb']], '"a\r\nb"\r\n')
    // 空セル
    assertStringify([['', 'a']], ',a\r\n')
    // 数値セル
    assertStringify([[1, 2.5]], '1,2.5\r\n')
    // 引用符・改行・区切り文字が混在するセル
    assertStringify([['a,"b\nc', 'x']], '"a,""b\r\nc",x\r\n')
    // TSV区切り
    assertStringify([['a\tb']], '"a\tb"\r\n', '\t')
    // 疎配列の穴は従来どおり 'undefined' として変換され、入力は書き換わらない
    const sparseRow = []
    sparseRow[1] = 'b'
    assert.strictEqual(stringify([sparseRow], ','), 'undefined,b\r\n')
    assert.strictEqual(0 in sparseRow, false, '入力の表が書き換えられていない')
    assert.strictEqual(stringify([sparseRow], ','), 'undefined,b\r\n', '反復変換で結果が変わらない')
    // 引数が undefined のときは空文字列を返す
    assert.strictEqual(stringify(undefined), '')
    // 空配列
    assertStringify([], '')
  })
})
