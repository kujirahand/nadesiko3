/**
 * @fileOverview なでしこ3 plugin_system の分割ファイル
 *
 * 配列操作・二次元配列処理の命令を定義する。
 * このファイルは単独のプラグインではなく、plugin_system.mts へマージされる。(#2351)
 */
export default {
  // @配列操作
  '配列結合': { // @配列Aを文字列Sでつなげて文字列で返す // @はいれつけつごう
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function(a: any, s: string): string {
      // 配列ならOK
      if (a instanceof Array) { return a.join('' + s) }

      const a2 = String(a).split('\n') // 配列でなければ無理矢理改行で区切ってみる
      return a2.join('' + s)
    }
  },
  '配列只結合': { // @配列Aの要素をただ結合して文字列で返す。(「」で配列結合と同じ) // @はいれつただけつごう
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function(a: any): string {
      if (a instanceof Array) { return a.join('') }
      const a2 = String(a).split('\n') // 配列でなければ無理矢理改行で区切ってみる
      return a2.join('')
    }
  },
  '配列検索': { // @配列Aから文字列Sを探してインデックス番号(0起点)を返す。見つからなければ-1を返す。 // @はいれつけんさく
    type: 'func',
    josi: [['の', 'から'], ['を']],
    pure: true,
    fn: function(a: any, s: any) {
      if (a instanceof Array) { return a.indexOf(s) }// 配列ならOK

      return -1
    }
  },
  '配列要素数': { // @配列Aの要素数を返す // @はいれつようそすう
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(a: any) {
      if (a instanceof Array) { return a.length }// 配列ならOK
      if (a instanceof Object) { return Object.keys(a).length } // オブジェクト
      if (typeof a === 'string') { return String(a).length } // 文字列
      return 1
    }
  },
  '要素数': { // @Aの要素数を返す。Aには配列/辞書型/文字列を指定する。 // @ようそすう
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(a: any, sys: any) {
      return sys.__exec('配列要素数', [a])
    }
  },
  'LEN': { // @Aの要素数を返す。Aには配列/辞書型/文字列を指定する。 // @LEN
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(a: any, sys: any) {
      return sys.__exec('配列要素数', [a])
    }
  },
  '配列挿入': { // @配列AのI番目(0起点)に要素Sを追加して返す(v1非互換) // @はいれつそうにゅう
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    pure: true,
    fn: function(a: any, i: any, s: any) {
      if (a instanceof Array) { return a.splice(i, 0, s) } // 配列ならOK

      throw new Error('『配列挿入』で配列以外の要素への挿入。')
    }
  },
  '配列一括挿入': { // @配列AのI番目(0起点)に配列bを追加して返す(v1非互換) // @はいれついっかつそうにゅう
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    pure: true,
    fn: function(a: any, i: number, b: any) {
      if (a instanceof Array && b instanceof Array) { // 配列ならOK
        for (let j = 0; j < b.length; j++) { a.splice(i + j, 0, b[j]) }

        return a
      }
      throw new Error('『配列一括挿入』で配列以外の要素への挿入。')
    }
  },
  '配列ソート': { // @配列Aをソートして返す(A自体を変更) // @はいれつそーと
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function(a: any) {
      if (a instanceof Array) { return a.sort() } // 配列ならOK

      throw new Error('『配列ソート』で配列以外が指定されました。')
    }
  },
  '配列数値変換': { // @配列Aの各要素を数値に変換して返す(変数A自体を変更) // @はいれつすうちへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function(a: any) {
      // 配列ならOK
      if (a instanceof Array) {
        for (let i = 0; i < a.length; i++) {
          a[i] = parseFloat(a[i])
        }
        return a
      }
      throw new Error('『配列数値変換』で配列以外が指定されました。')
    }
  },
  '配列数値ソート': { // @配列Aをソートして返す(A自体を変更) // @はいれつすうちそーと
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function(a: any) {
      // 配列ならOK
      if (a instanceof Array) {
        return a.sort((a, b) => {
          return parseFloat(a) - parseFloat(b)
        })
      }

      throw new Error('『配列数値ソート』で配列以外が指定されました。')
    }
  },
  '配列カスタムソート': { // @関数Fで配列Aをソートして返す(引数A自体を変更) // @はいれつかすたむそーと
    type: 'func',
    josi: [['で'], ['の', 'を']],
    pure: false,
    fn: function(f: any, a: any, sys: any) {
      let ufunc = f
      if (typeof f === 'string') {
        ufunc = sys.__findFunc(f, '配列カスタムソート')
      }
      if (a instanceof Array) {
        return a.sort(ufunc)
      }
      throw new Error('『配列カスタムソート』で配列以外が指定されました。')
    }
  },
  '配列逆順': { // @配列Aを逆にして返す。Aを書き換える(A自体を変更)。 // @はいれつぎゃくじゅん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function(a: any) {
      if (a instanceof Array) { return a.reverse() } // 配列ならOK
      throw new Error('『配列ソート』で配列以外が指定されました。')
    }
  },
  '配列シャッフル': { // @配列Aをシャッフルして返す。Aを書き換える // @はいれつしゃっふる
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function(a: any) {
      if (a instanceof Array) { // 配列ならOK
        for (let i = a.length - 1; i > 0; i--) {
          const r = Math.floor(Math.random() * (i + 1))
          const tmp = a[i]
          a[i] = a[r]
          a[r] = tmp
        }
        return a
      }
      throw new Error('『配列シャッフル』で配列以外が指定されました。')
    }
  },
  '配列削除': { // @配列AのI番目(0起点)の要素を削除して返す。Aの内容を書き換える。辞書型変数ならキーIを削除する。 // @はいれつさくじょ
    type: 'func',
    josi: [['の', 'から'], ['を']],
    pure: true,
    fn: function(a: any, i: any, sys: any) {
      return sys.__exec('配列切取', [a, i, sys])
    }
  },
  '配列切取': { // @配列AのI番目(0起点)の要素を切り取って返す。Aの内容を書き換える。引数Iには範囲オブジェクトを指定できる。その場合戻り値は配列型となる。辞書型変数ならキーIを削除する。 // @はいれつきりとる
    type: 'func',
    josi: [['の', 'から'], ['を']],
    pure: true,
    fn: function(a: any, i: any) {
      // 配列変数のとき
      if (a instanceof Array) {
        if (typeof i === 'number') {
          const b = a.splice(i, 1)
          if (b instanceof Array) { return b[0] } // 切り取った戻り値は必ずArrayになるので。
        }
        if (typeof i === 'object' && typeof i['先頭'] === 'number') {
          const idx = i['先頭']
          const cnt = i['末尾'] - i['先頭'] + 1
          return a.splice(idx, cnt)
        }
        return null
      }
      // 辞書型変数のとき
      if (a instanceof Object && typeof (i) === 'string') { // 辞書型変数も許容
        if (a[i]) {
          const old = a[i]
          delete a[i]
          return old
        }
        return undefined
      }
      throw new Error('『配列切取』で配列以外を指定。')
    }
  },
  '配列取出': { // @配列AのI番目(0起点)からCNT個の要素を取り出して返す。Aの内容を書き換える // @はいれつとりだし
    type: 'func',
    josi: [['の'], ['から'], ['を']],
    pure: true,
    fn: function(a: any, i: any, cnt: any) {
      if (a instanceof Array) { return a.splice(i, cnt) }
      throw new Error('『配列取出』で配列以外を指定。')
    }
  },
  '配列ポップ': { // @配列Aの末尾を取り出して返す。Aの内容を書き換える。 // @はいれつぽっぷ
    type: 'func',
    josi: [['の', 'から']],
    pure: true,
    fn: function(a: any) {
      if (a instanceof Array) { return a.pop() }
      throw new Error('『配列ポップ』で配列以外の処理。')
    }
  },
  '配列プッシュ': { // @配列Aの末尾にNを追加。Aの内容を書き換える。(『配列追加』と同じ) // @はいれつぷっしゅ
    type: 'func',
    josi: [['に', 'へ'], ['を']],
    pure: true,
    fn: function(a: any, b: any, sys: any) {
      return sys.__exec('配列追加', [a, b, sys])
    }
  },
  '配列追加': { // @配列Aの末尾にBを追加して返す。Aの内容を書き換える。 // @はいれつついか
    type: 'func',
    josi: [['に', 'へ'], ['を']],
    pure: true,
    fn: function(a: any, b: any) {
      if (a instanceof Array) { // 配列ならOK
        a.push(b)
        return a
      }
      throw new Error('『配列追加』で配列以外の処理。')
    }
  },
  '配列複製': { // @配列Aを複製して返す。 // @はいれつふくせい
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function(a: any) {
      return JSON.parse(JSON.stringify(a))
    }
  },
  '配列範囲コピー': { // @配列Aの範囲I(数値化範囲オブジェクト)を複製して返す。 // @はいれつはんいこぴー
    type: 'func',
    josi: [['の', 'から'], ['を']],
    pure: true,
    fn: function(a: any, i: any) {
      if (!Array.isArray(a)) {
        throw new Error('『配列範囲コピー』で配列以外の値が指定されました。')
      }
      if (typeof i === 'number') {
        if (typeof a[i] === 'object') {
          return JSON.parse(JSON.stringify(a[i]))
        }
        return a[i]
      }
      // 範囲オブジェクトのとき
      if (typeof i === 'object' && typeof i['先頭'] === 'number') {
        const start = i['先頭']
        const last = Number(i['末尾']) + 1
        return JSON.parse(JSON.stringify(a.slice(start, last)))
      }
      return undefined
    }
  },
  '参照': { // @値A(配列/文字列/辞書型)の範囲I(キーまたは範囲オブジェクト)を参照して(コピーせず)返す // @さんしょう
    type: 'func',
    josi: [['から', 'の'], ['を']],
    pure: true,
    fn: function(a: any, i: any, _sys: any) {
      // 文字列のとき
      if (typeof a === 'string') {
        if (typeof i === 'number') {
          return a.charAt(i)
        }
        // 範囲オブジェクトのとき
        if (typeof i === 'object' && typeof i['先頭'] === 'number') {
          const start = i['先頭']
          const last = Number(i['末尾']) + 1
          return a.substring(start, last)
        }
        throw new Error(`『参照』で文字列型の範囲指定(${JSON.stringify(i)})が不正です。`)
      }
      // 配列型のとき
      if (Array.isArray(a)) {
        if (typeof i === 'number') {
          return a[i]
        }
        // 範囲オブジェクトのとき
        if (typeof i === 'object' && typeof i['先頭'] === 'number') {
          const start = i['先頭']
          const last = Number(i['末尾']) + 1
          return a.slice(start, last)
        }
      }
      // 辞書型のとき
      if (typeof a === 'object') {
        return a[i]
      }
      throw new Error('『参照』で文字列/配列/辞書型以外の値が指定されました。')
    }
  },
  '配列参照': { // @値A(配列/文字列/辞書型)の範囲I(キーまたは範囲オブジェクト)を参照して(コピーせず)返す(『参照』と同じ) // @はいれつはんいさんしょう
    type: 'func',
    josi: [['の', 'から'], ['を']],
    pure: true,
    fn: function(a: any, i: any, sys: any) {
      return sys.__exec('参照', [a, i, sys])
    }
  },
  '配列足': { // @配列Aに配列Bを足し合わせて返す。 // @はいれつたす
    type: 'func',
    josi: [['に', 'へ', 'と'], ['を']],
    pure: true,
    fn: function(a: any, b: any) {
      if (a instanceof Array) {
        return a.concat(b)
      }
      return JSON.parse(JSON.stringify(a))
    }
  },
  '配列最大値': { // @配列Aの値の最大値を調べて返す。 // @はいれつさいだいち
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(a: any) {
      return a.reduce((x: any, y: any) => Math.max(x, y))
    }
  },
  '配列最小値': { // @配列Aの値の最小値を調べて返す。 // @はいれつさいしょうち
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(a: any) {
      return a.reduce((x: any, y: any) => Math.min(x, y))
    }
  },
  '配列合計': { // @配列Aの値を全て足して返す。配列の各要素を数値に変換して計算する。数値に変換できない文字列は0になる。 // @はいれつごうけい
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(a: any) {
      if (a instanceof Array) {
        let v = 0
        a.forEach((n) => {
          const nn = parseFloat(n)
          if (isNaN(nn)) { return }
          v += nn
        })
        return v
      }
      throw new Error('『配列合計』で配列変数以外の値が指定されました。')
    }
  },
  '配列入替': { // @配列Aの(0から数えて)I番目とJ番目の要素を入れ替えて返す。Aの内容を書き換える。// @はいれついれかえ
    type: 'func',
    josi: [['の'], ['と'], ['を']],
    pure: true,
    fn: function(a: any, i: number, j: number) {
      if (!(a instanceof Array)) {
        throw new Error('『配列入替』の第1引数には配列を指定してください。')
      }
      const tmp = a[i]
      a[i] = a[j]
      a[j] = tmp
      return a
    }
  },
  '配列連番作成': { // @AからBまでの連番配列を生成して返す。 // @はいれつれんばんさくせい
    type: 'func',
    josi: [['から'], ['までの', 'まで', 'の']],
    pure: true,
    fn: function(a: number, b: number) {
      const result: number[] = []
      for (let i = a; i <= b; i++) {
        result.push(i)
      }
      return result
    }
  },
  '配列要素作成': { // @値AをB個持つ配列を生成して返す。引数Bに配列を指定すると二次元以上の配列を生成する。// @はいれつようそさくせい
    type: 'func',
    josi: [['を'], ['だけ', 'で']],
    pure: true,
    fn: function(a: any, b: number | number[]) {
      // value が配列やオブジェクトでも深くコピーするヘルパー
      const cloneValue = (v: any): any => {
        if (Array.isArray(v)) {
          return (v).map(item => cloneValue(item)) as any
        }
        if (v instanceof Date) {
          return new Date(v.getTime())
        }
        if (typeof v === 'object' && v !== null) {
          return JSON.parse(JSON.stringify(v))
        }
        return v
      }
      // 再帰的に配列を生成する関数
      const full = function(value: any, shape: number | number[]): any {
        // 1次元：shape が数値
        if (!Array.isArray(shape)) {
          return Array.from({ length: shape }, () => cloneValue(value))
        }
        // 1次元：shape が数値
        if (Array.isArray(shape) && shape.length === 1) {
          return Array.from({ length: shape[0] }, () => cloneValue(value))
        }
        // 多次元：shape が配列
        const [first, ...rest] = shape
        return Array.from(
          { length: first },
          () => full(cloneValue(value), rest)
        )
      }
      return full(a, b)
    }
  },
  '配列関数適用': { // @引数を1つ持つ関数Fを、配列Aの全要素に適用した、新しい配列を返す。 // @はいれつかんすうてきよう
    type: 'func',
    josi: [['を'], ['へ', 'に']],
    pure: true,
    fn: function(f: any, a: any, sys: any) {
      let ufunc: any = f
      if (typeof f === 'string') { ufunc = sys.__findFunc(f, '配列関数適用') }
      const result: any = []
      for (const e of a) {
        result.push(ufunc(e))
      }
      return result
    }
  },
  '配列マップ': { // @引数を1つ持つ関数Fを、配列Aの全要素に適用した、新しい配列を返す。(『配列関数適用』と同じ) // @はいれつまっぷ
    type: 'func',
    josi: [['を'], ['へ', 'に']],
    pure: true,
    fn: function(f: any, a: any, sys: any) {
      return sys.__exec('配列関数適用', [f, a, sys])
    }
  },
  '配列フィルタ': { // @引数を1つ持ち真偽を返す関数Fを利用して、配列Aの要素をフィルタして、新しい配列として返す。 // @はいれつふぃるた
    type: 'func',
    josi: [['で', 'の'], ['を', 'について']],
    pure: true,
    fn: function(f: any, a: any, sys: any) {
      let ufunc: any = f
      if (typeof f === 'string') { ufunc = sys.__findFunc(f, '配列フィルタ') }
      const result: any = []
      for (const e of a) {
        if (ufunc(e)) { result.push(e) }
      }
      return result
    }
  },

  // @二次元配列処理
  '表ソート': { // @二次元配列AでB列目(0起点)(あるいはキー名)をキーに文字列順にソートする。Aの内容を書き換える。 // @ひょうそーと
    type: 'func',
    josi: [['の'], ['を']],
    pure: true,
    fn: function(a: any, no: any) {
      if (!(a instanceof Array)) {
        throw new Error('『表ソート』には配列を指定する必要があります。')
      }
      a.sort((n, m) => {
        const ns = n[no]
        const ms = m[no]

        if (ns === ms) {
          return 0
        } else if (ns < ms) {
          return -1
        } else {
          return 1
        }
      })
      return a
    }
  },
  '表数値ソート': { // @二次元配列AでB列目(0起点)(あるいはキー名)をキーに数値順にソートする。Aの内容を書き換える。 // @ひょうすうちそーと
    type: 'func',
    josi: [['の'], ['を']],
    pure: true,
    fn: function(a: any, no: number) {
      if (!(a instanceof Array)) {
        throw new Error('『表数値ソート』には配列を指定する必要があります。')
      }
      a.sort((n, m) => {
        const ns = n[no]
        const ms = m[no]
        return ns - ms
      })
      return a
    }
  },
  '表ピックアップ': { // @配列Aの列番号B(0起点)(あるいはキー名)で検索文字列Sを含む行を返す // @ひょうぴっくあっぷ
    type: 'func',
    josi: [['の'], ['から'], ['を', 'で']],
    pure: true,
    fn: function(a: any, no: number, s: any) {
      if (!(a instanceof Array)) { throw new Error('『表ピックアップ』には配列を指定する必要があります。') }
      return a.filter((row) => String(row[no]).indexOf(s) >= 0)
    }
  },
  '表完全一致ピックアップ': { // @配列Aの列番号B(0起点)(あるいはキー名)で検索文字列Sと一致する行を返す // @ひょうかんぜんいっちぴっくあっぷ
    type: 'func',
    josi: [['の'], ['から'], ['を', 'で']],
    pure: true,
    fn: function(a: any, no: number, s: any) {
      if (!(a instanceof Array)) { throw new Error('『表完全ピックアップ』には配列を指定する必要があります。') }
      return a.filter((row) => row[no] === s)
    }
  },
  '表検索': { // @二次元配列AでCOL列目(0起点)からキーSを含む行をROW行目から検索して何行目にあるか返す。見つからなければ-1を返す。 // @ひょうけんさく
    type: 'func',
    josi: [['の'], ['で', 'に'], ['から'], ['を']],
    pure: true,
    fn: function(a: any, col: number, row: number, s: any) {
      if (!(a instanceof Array)) { throw new Error('『表検索』には配列を指定する必要があります。') }
      for (let i = row; i < a.length; i++) {
        if (a[i][col] === s) { return i }
      }
      return -1
    }
  },
  '表列数': { // @二次元配列Aの列数を調べて返す。 // @ひょうれつすう
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(a: any) {
      if (!(a instanceof Array)) { throw new Error('『表列数』には配列を指定する必要があります。') }
      let cols = 1
      for (let i = 0; i < a.length; i++) {
        if (a[i].length > cols) { cols = a[i].length }
      }
      return cols
    }
  },
  '表行数': { // @二次元配列Aの行数を調べて返す。 // @ひょうぎょうすう
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(a: any) {
      if (!(a instanceof Array)) { throw new Error('『表行数』には配列を指定する必要があります。') }
      return a.length
    }
  },
  '表行列交換': { // @二次元配列Aの行と列を交換して返す。 // @ひょうぎょうれつこうかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function(a: any, sys: any) {
      if (!(a instanceof Array)) { throw new Error('『表行列交換』には配列を指定する必要があります。') }
      const cols = sys.__exec('表列数', [a])
      const rows = a.length
      const res = []
      for (let r = 0; r < cols; r++) {
        const row: any[] = []
        res.push(row)
        for (let c = 0; c < rows; c++) {
          row[c] = (a[c][r] !== undefined) ? a[c][r] : ''
        }
      }
      return res
    }
  },
  '表右回転': { // @二次元配列Aを90度回転して返す。 // @ひょうみぎかいてん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function(a: any, sys: any) {
      if (!(a instanceof Array)) { throw new Error('『表右回転』には配列を指定する必要があります。') }
      const cols = sys.__exec('表列数', [a])
      const rows = a.length
      const res = []
      for (let r = 0; r < cols; r++) {
        const row: any[] = []
        res.push(row)
        for (let c = 0; c < rows; c++) {
          row[c] = a[rows - c - 1][r]
        }
      }
      return res
    }
  },
  '表重複削除': { // @二次元配列AのI列目にある重複項目を削除して返す。 // @ひょうじゅうふくさくじょ
    type: 'func',
    josi: [['の'], ['を', 'で']],
    pure: true,
    fn: function(a: any, i: any) {
      if (!(a instanceof Array)) { throw new Error('『表重複削除』には配列を指定する必要があります。') }
      const res: any[] = []
      const keys:{[key: string]: boolean} = {}
      for (let n = 0; n < a.length; n++) {
        const k = a[n][i]
        if (undefined === keys[k]) {
          keys[k] = true
          res.push(a[n])
        }
      }
      return res
    }
  },
  '表列取得': { // @二次元配列AのI列目を返す。 // @ひょうれつしゅとく
    type: 'func',
    josi: [['の'], ['を']],
    pure: true,
    fn: function(a: any, i: number) {
      if (!(a instanceof Array)) { throw new Error('『表列取得』には配列を指定する必要があります。') }
      const res = a.map(row => row[i])
      return res
    }
  },
  '表列挿入': { // @二次元配列Aの(0から数えて)I列目に配列Sを挿入して返す // @ひょうれつそうにゅう
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    pure: true,
    fn: function(a: any, i: any, s: any) {
      if (!(a instanceof Array)) { throw new Error('『表列挿入』には配列を指定する必要があります。') }
      const res: any[] = []
      a.forEach((row, idx) => {
        let nr: any[] = []
        if (i > 0) { nr = nr.concat(row.slice(0, i)) }
        nr.push(s[idx])
        nr = nr.concat(row.slice(i))
        res.push(nr)
      })
      return res
    }
  },
  '表列削除': { // @二次元配列Aの(0から数えて)I列目削除して返す // @ひょうれつそうにゅう
    type: 'func',
    josi: [['の'], ['を']],
    pure: true,
    fn: function(a: any, i: any) {
      if (!(a instanceof Array)) { throw new Error('『表列削除』には配列を指定する必要があります。') }
      const res: any[] = []
      a.forEach((row) => {
        const nr = row.slice(0)
        nr.splice(i, 1)
        res.push(nr)
      })
      return res
    }
  },
  '表列合計': { // @二次元配列Aの(0から数えて)I列目を合計して返す。 // @ひょうれつごうけい
    type: 'func',
    josi: [['の'], ['を', 'で']],
    pure: true,
    fn: function(a: any, i: any) {
      if (!(a instanceof Array)) { throw new Error('『表列合計』には配列を指定する必要があります。') }
      let sum = 0
      a.forEach((row) => { sum += row[i] })
      return sum
    }
  },
  '表曖昧検索': { // @二次元配列AのROW行目からCOL列目(0起点)で正規表現Sにマッチする行を検索して何行目にあるか返す。見つからなければ-1を返す。(v1非互換) // @ひょうあいまいけんさく
    type: 'func',
    josi: [['の'], ['から'], ['で'], ['を']],
    pure: true,
    fn: function(a: any, row: any, col: any, s: any) {
      if (!(a instanceof Array)) { throw new Error('『表曖昧検索』には配列を指定する必要があります。') }
      const re = new RegExp(s)
      for (let i = row; i < a.length; i++) {
        const line = a[i]
        if (re.test(line[col])) { return i }
      }
      return -1
    }
  },
  '表正規表現ピックアップ': { // @二次元配列AでI列目(0起点)から正規表現パターンSにマッチする行をピックアップして返す。 // @ひょうせいきひょうげんぴっくあっぷ
    type: 'func',
    josi: [['の', 'で'], ['から'], ['を']],
    pure: true,
    fn: function(a: any, col: any, s: any) {
      if (!(a instanceof Array)) { throw new Error('『表正規表現ピックアップ』には配列を指定する必要があります。') }
      const re = new RegExp(s)
      const res = []
      for (let i = 0; i < a.length; i++) {
        const row = a[i]
        if (re.test(row[col])) { res.push(row.slice(0)) }
      }
      return res
    }
  },
}
