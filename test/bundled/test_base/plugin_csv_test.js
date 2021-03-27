const TestEnv = require('./test_utils').TestEnv

describe('plugin_csv_test', () => {
  const env = new TestEnv()
  before( function () {
    env.getEnv()
  })

  const cmp = (code, res) => {
    env.cmpInfo(code, res)
  }

  // --- test ---
  it('CSV取得', () => {
    cmp('a=「1,2,3\n4,5,6」のCSV取得。a[1][2]を表示', '6')
    cmp('a=「"a",b,c\n""a,b,c\na,""b,c\na,b,c""\n"a,\nb",c,d\na,"b,\nc",d\na,b,"c,\nd"」のCSV取得。a[5][1]を表示', 'b,\nc')
    cmp('a=「1,"a""a",2」のCSV取得。a[0][1]を表示', 'a"a')
    cmp('a=「1,"2""2",3\n4,5,6」のCSV取得。a[0][1]を表示', '2"2')
    cmp('a=「1,,3\n4,5,6」のCSV取得。a[0][2]を表示', '3')
    cmp('a=「1,2,3,\n4,5,6」のCSV取得。a[1][0]を表示', '4') // #353
  })
  it('TSV取得', () => {
    cmp('a=「1\t2\t3\n4\t5\t6」のTSV取得。a[1][2]を表示', '6')
    cmp('a=「"a"\tb\tc\n""a\tb\tc\na\t""b\tc\na\tb\tc""\n"a\t\nb"\tc\td\na\t"b\t\nc"\td\na\tb\t"c\t\nd"」のTSV取得。a[5][1]を表示', 'b\t\nc')
    cmp('a=「1\t"a""a"\t2」のTSV取得。a[0][1]を表示', 'a"a')
    cmp('a=「1\t"2""2"\t3\n4\t5\t6」のTSV取得。a[0][1]を表示', '2"2')
    cmp('a=「1\t\t3\n4\t5\t6」のTSV取得。a[0][2]を表示', '3')
  })
  it('表CSV変換', () => {
    env.cmpReport('[[1,2,3],[4,5,6]]を表CSV変換して報告', ["1,2,3\r\n4,5,6\r\n"])
    env.cmpReport('[[1,2,"3\r\n,"],[4,5,6]]を表CSV変換して報告', ['1,2,"3\r\n,"\r\n4,5,6\r\n'])
  })
  it('表TSV変換', () => {
    env.cmpReport('[[1,2,3],[4,5,6]]を表TSV変換して報告', ['1\t2\t3\r\n4\t5\t6\r\n'])
    env.cmpReport('[[1,2,"3\r\n\t"],[4,5,6]]を表TSV変換して報告', ['1\t2\t"3\r\n\t"\r\n4\t5\t6\r\n'])
  })
})
