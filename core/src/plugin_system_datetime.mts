/**
 * @fileOverview なでしこ3 plugin_system の分割ファイル
 *
 * 日時処理(簡易)の命令を定義する。
 * このファイルは単独のプラグインではなく、plugin_system.mts へマージされる。(#2351)
 */
import { NakoSystem } from './plugin_api.mjs'

export default {
  // @日時処理(簡易)
  '元号データ': { type: 'const', value: [{ '元号': '令和', '改元日': '2019/05/01' }, { '元号': '平成', '改元日': '1989/01/08' }, { '元号': '昭和', '改元日': '1926/12/25' }, { '元号': '大正', '改元日': '1912/07/30' }, { '元号': '明治', '改元日': '1868/10/23' }] }, // @げんごうでーた
  '今': { // @現在時刻を「HH:mm:ss」の形式で返す // @いま
    type: 'func',
    josi: [],
    pure: true,
    fn: function() {
      const z2 = (n: number): string => {
        const ns = '00' + String(n)
        return ns.substring(ns.length - 2, ns.length)
      }
      const t = new Date()
      return z2(t.getHours()) + ':' + z2(t.getMinutes()) + ':' + z2(t.getSeconds())
    }
  },
  'システム時間': { // @現在のUNIX時間 (UTC(1970/1/1)からの経過秒数) を返す // @しすてむじかん
    type: 'func',
    josi: [],
    pure: true,
    fn: function() {
      const now = new Date()
      return Math.floor(now.getTime() / 1000)
    }
  },
  'システム時間ミリ秒': { // @現在のUNIX時間 (UTC(1970/1/1)からの経過秒数) をミリ秒で返す // @しすてむじかんみりびょう
    type: 'func',
    josi: [],
    pure: true,
    fn: function() {
      const now = new Date()
      return now.getTime()
    }
  },
  '今日': { // @今日の日付を「YYYY/MM/DD」の形式で返す // @きょう
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: NakoSystem) {
      return sys.__formatDate(new Date())
    }
  },
  '明日': { // @明日の日付を「YYYY/MM/DD」の形式で返す // @あした
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: NakoSystem) {
      const t = Date.now() + (24 * 60 * 60 * 1000)
      return sys.__formatDate(new Date(t))
    }
  },
  '昨日': { // @昨日の日付を「YYYY/MM/DD」の形式で返す // @きのう
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: NakoSystem) {
      const t = Date.now() - (24 * 60 * 60 * 1000)
      return sys.__formatDate(new Date(t))
    }
  },
  '今年': { // @今年が何年かを西暦で返す // @ことし
    type: 'func',
    josi: [],
    pure: true,
    fn: function() {
      return (new Date()).getFullYear()
    }
  },
  '来年': { // @来年が何年かを西暦で返す // @らいねん
    type: 'func',
    josi: [],
    pure: true,
    fn: function() {
      return (new Date()).getFullYear() + 1
    }
  },
  '去年': { // @去年が何年かを西暦で返す // @きょねん
    type: 'func',
    josi: [],
    pure: true,
    fn: function() {
      return (new Date()).getFullYear() - 1
    }
  },
  '今月': { // @今月が何月かを返す // @こんげつ
    type: 'func',
    josi: [],
    pure: true,
    fn: function() {
      return (new Date()).getMonth() + 1
    }
  },
  '来月': { // @来月が何月かを返す(12月の場合は1を返す) // @らいげつ
    type: 'func',
    josi: [],
    pure: true,
    fn: function() {
      // 12月の翌月は1月になるように調整する (#2412)
      return ((new Date()).getMonth() + 1) % 12 + 1
    }
  },
  '先月': { // @先月が何月かを返す(1月の場合は12を返す) // @せんげつ
    type: 'func',
    josi: [],
    pure: true,
    fn: function() {
      // 1月の前月は12月になるように調整する (#2412)
      return ((new Date()).getMonth() + 11) % 12 + 1
    }
  },
  '曜日': { // @Sに指定した日付の曜日を返す。不正な日付の場合は今日の曜日を返す。 // @ようび
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(s: string, sys: any) {
      const d = sys.__str2date(s)
      return '日月火水木金土'.charAt(d.getDay() % 7)
    }
  },
  '曜日番号取得': { // @Sに指定した日付の曜日番号を番号で返す。不正な日付の場合は今日の曜日番号を返す。(0=日/1=月/2=火/3=水/4=木/5=金/6=土) // @ようびばんごうしゅとく
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(s: any) {
      const a = s.split('/')
      const t = new Date(a[0], a[1] - 1, a[2])
      return t.getDay()
    }
  },
  'UNIXTIME変換': { // @日時SをUNIX時間 (UTC(1970/1/1)からの経過秒数) に変換して返す(v1非互換) // @UNIXTIMEへんかん
    type: 'func',
    josi: [['の', 'を', 'から']],
    pure: true,
    fn: function(s: string, sys: any) {
      const d = sys.__str2date(s)
      return d.getTime() / 1000
    }
  },
  'UNIX時間変換': { // @日時SをUNIX時間 (UTC(1970/1/1)からの経過秒数) に変換して返す(v1非互換) // @UNIXじかんへんかん
    type: 'func',
    josi: [['の', 'を', 'から']],
    pure: true,
    fn: function(s: string, sys: any) {
      const d = sys.__str2date(s)
      return d.getTime() / 1000
    }
  },
  '日時変換': { // @UNIX時間 (UTC(1970/1/1)からの経過秒数) を「YYYY/MM/DD HH:mm:ss」の形式に変換 // @にちじへんかん
    type: 'func',
    josi: [['を', 'から']],
    pure: true,
    fn: function(tm: any, sys: any) {
      const t = tm * 1000
      return sys.__formatDateTime(new Date(t), '2022/01/01 00:00:00')
    }
  },
  '日時書式変換': { // @UNIX時間TM(または日付文字列)を「YYYY/MM/DD HH:mm:ss」または「YY-M-D H:m:s」その他、W:曜日、WWW:曜日英、MMM:月英、ccc:ミリ秒の書式に変換 // @にちじしょしきへんかん
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function(tm: any, fmt: any, sys: any) {
      const t = sys.__str2date(tm)
      fmt = fmt.replace(/(YYYY|ccc|WWW|MMM|YY|MM|DD|HH|mm|ss|[MDHmsW])/g, (m: string) => {
        switch (m) {
        case 'YYYY': return t.getFullYear()
        case 'YY': return (String(t.getFullYear())).substring(2)
        case 'MM': return sys.__zero2(String(t.getMonth() as number + 1))
        case 'DD': return sys.__zero2(t.getDate())
        case 'M': return (t.getMonth() as number + 1)
        case 'D': return (t.getDate())
        case 'HH': return sys.__zero2(t.getHours())
        case 'mm': return sys.__zero2(t.getMinutes())
        case 'ss': return sys.__zero2(t.getSeconds())
        case 'ccc': return sys.__zero(t.getMilliseconds(), 3)
        case 'H': return (t.getHours())
        case 'm': return (t.getMinutes())
        case 's': return (t.getSeconds())
        case 'W': return '日月火水木金土'.charAt(t.getDay() % 7)
        case 'WWW': return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][t.getDay() % 7]
        case 'MMM': return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][t.getMonth()]
        }
        return m
      })
      return fmt
    }
  },
  '和暦変換': { // @Sを和暦に変換する。Sは明治以降の日付が有効。 // @われきへんかん
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function(s: string, sys: NakoSystem) {
      const d = sys.__str2date(s)
      const t = d.getTime()
      for (const era of sys.__getSysVar('元号データ')) {
        const gengo = String(era['元号'])
        const d2 = sys.__str2date(era['改元日'])
        const t2 = d2.getTime()
        if (t2 <= t) {
          let y: any = (d.getFullYear() - d2.getFullYear()) + 1
          if (y === 1) { y = '元' }
          return gengo + String(y) + '年' + sys.__zero2(d.getMonth() + 1) + '月' + sys.__zero2(d.getDate()) + '日'
        }
      }
      throw new Error('『和暦変換』は明示以前の日付には対応していません。')
    }
  },
  '年数差': { // @日付AとBの差を年数で求めて返す。A<Bなら正の数、そうでないなら負の数を返す (v1非互換)。 // @ねんすうさ
    type: 'func',
    josi: [['と', 'から'], ['の', 'までの']],
    pure: true,
    fn: function(a: any, b: any, sys: any) {
      const t1 = sys.__str2date(a)
      const t2 = sys.__str2date(b)
      return (t2.getFullYear() - t1.getFullYear())
    }
  },
  '月数差': { // @日付AとBの差を月数で求めて返す。A<Bなら正の数、そうでないなら負の数を返す (v1非互換)。 // @げっすうさ
    type: 'func',
    josi: [['と', 'から'], ['の', 'までの']],
    pure: true,
    fn: function(a: any, b: any, sys: any) {
      const t1 = sys.__str2date(a)
      const t2 = sys.__str2date(b)
      return (t2.getFullYear() * 12 + Number(t2.getMonth())) -
        (t1.getFullYear() * 12 + Number(t1.getMonth()))
    }
  },
  '日数差': { // @日付AとBの差を日数で求めて返す。A<Bなら正の数、そうでないなら負の数を返す。 // @にっすうさ
    type: 'func',
    josi: [['と', 'から'], ['の', 'までの']],
    pure: true,
    fn: function(a: any, b: any, sys: any) {
      const t1 = Math.ceil(sys.__str2date(a).getTime() / 1000)
      const t2 = Math.ceil(sys.__str2date(b).getTime() / 1000)
      const days = Math.ceil((t2 - t1) / (60 * 60 * 24))
      return days
    }
  },
  '時間差': { // @時間AとBの時間の差を求めて返す。A<Bなら正の数、そうでないなら負の数を返す。 // @じかんさ
    type: 'func',
    josi: [['と', 'から'], ['の', 'までの']],
    pure: true,
    fn: function(a: any, b: any, sys: any) {
      const t1 = Math.ceil(sys.__str2date(a).getTime() / 1000)
      const t2 = Math.ceil(sys.__str2date(b).getTime() / 1000)
      const hours = Math.ceil((t2 - t1) / (60 * 60))
      return hours
    }
  },
  '分差': { // @時間AとBの分数の差を求めて返す。A<Bなら正の数、そうでないなら負の数を返す。 // @ふんさ
    type: 'func',
    josi: [['と', 'から'], ['の', 'までの']],
    pure: true,
    fn: function(a: any, b: any, sys: any) {
      const t1 = Math.ceil(sys.__str2date(a).getTime() / 1000)
      const t2 = Math.ceil(sys.__str2date(b).getTime() / 1000)
      const min = Math.ceil((t2 - t1) / (60))
      return min
    }
  },
  '秒差': { // @時間AとBの差を秒差で求めて返す。A<Bなら正の数、そうでないなら負の数を返す。 // @びょうさ
    type: 'func',
    josi: [['と', 'から'], ['の', 'までの']],
    pure: true,
    fn: function(a: any, b: any, sys: any) {
      const t1 = Math.ceil(sys.__str2date(a).getTime() / 1000)
      const t2 = Math.ceil(sys.__str2date(b).getTime() / 1000)
      const sec = Math.ceil((t2 - t1))
      return sec
    }
  },
  '日時差': { // @日時AとBの差を種類unitで返す。A<Bなら正の数、そうでないなら負の数を返す (v1非互換)。 // @にちじさ
    type: 'func',
    josi: [['と', 'から'], ['の', 'までの'], ['による']],
    pure: true,
    fn: function(a: any, b: any, unit: string, sys: any): string {
      switch (unit) {
      case '年': return sys.__exec('年数差', [a, b, sys])
      case '月': return sys.__exec('月数差', [a, b, sys])
      case '日': return sys.__exec('日数差', [a, b, sys])
      case '時間': return sys.__exec('時間差', [a, b, sys])
      case '分': return sys.__exec('分差', [a, b, sys])
      case '秒': return sys.__exec('秒差', [a, b, sys])
      }
      throw new Error('『日時差』で不明な単位です。')
    }
  },
  '時間加算': { // @時間SにAを加えて返す。Aには「(+｜-)hh:nn:dd」で指定する。 // @じかんかさん
    type: 'func',
    josi: [['に'], ['を']],
    pure: true,
    fn: function(s: string, a: string, sys: any) {
      const op = a.charAt(0)
      if (op === '-' || op === '+') {
        a = a.substring(1)
      }
      const d = sys.__str2date(s)
      const aa = (a + ':0:0').split(':')
      let sec = parseInt(aa[0]) * 60 * 60 +
        parseInt(aa[1]) * 60 +
        parseInt(aa[2])
      if (op === '-') { sec *= -1 }
      const rd = new Date(Number(d.getTime()) + (sec * 1000))
      return sys.__formatDateTime(rd, s)
    }
  },
  '日付加算': { // @日付SにAを加えて返す。Aには「(+｜-)yyyy/mm/dd」で指定する。 // @ひづけかさん
    type: 'func',
    josi: [['に'], ['を']],
    pure: true,
    fn: function(s: string, a: string, sys: any) {
      let op = 1
      const opc = a.charAt(0)
      if (opc === '-' || opc === '+') {
        a = a.substring(1)
        if (opc === '-') { op *= -1 }
      }
      const d = sys.__str2date(s)
      const aa = (a + '/0/0').split('/')
      const addY = parseInt(aa[0]) * op
      const addM = parseInt(aa[1]) * op
      const addD = parseInt(aa[2]) * op
      d.setFullYear(Number(d.getFullYear()) + addY)
      d.setMonth(Number(d.getMonth()) + addM)
      d.setDate(Number(d.getDate()) + addD)
      return sys.__formatDateTime(d, s)
    }
  },
  '日時加算': { // @日時SにAを加えて返す。Aは「(+｜-)1(年|ヶ月|日|週|時間|分|秒)」のように指定する (v1非互換)。 // @にちじかさん
    type: 'func',
    josi: [['に'], ['を']],
    pure: true,
    fn: function(s: string, a: string, sys: any) {
      const r = ('' + a).match(/([+|-]?)(\d+)(年|ヶ月|日|週間|時間|分|秒)$/)
      if (!r) { throw new Error('『日付加算』は『(+｜-)1(年|ヶ月|日|時間|分|秒)』の書式で指定します。') }
      switch (r[3]) {
      case '年': return sys.__exec('日付加算', [s, `${r[1]}${r[2]}/0/0`, sys])
      case 'ヶ月': return sys.__exec('日付加算', [s, `${r[1]}0/${r[2]}/0`, sys])
      case '週間': return sys.__exec('日付加算', [s, `${r[1]}0/0/${parseInt(r[2]) * 7}`, sys])
      case '日': return sys.__exec('日付加算', [s, `${r[1]}0/0/${r[2]}`, sys])
      case '時間': return sys.__exec('時間加算', [s, `${r[1]}${r[2]}:0:0`, sys])
      case '分': return sys.__exec('時間加算', [s, `${r[1]}0:${r[2]}:0`, sys])
      case '秒': return sys.__exec('時間加算', [s, `${r[1]}0:0:${r[2]}`, sys])
      }
    }
  },
  '時間ミリ秒取得': { // @ミリ秒単位の時間を数値で返す。結果は実装に依存する。 // @じかんみりびょうしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function() {
      if (typeof performance !== 'undefined' && performance.now) {
        return performance.now()
      } else if (Date.now) {
        return Date.now()
      } else {
        const now = new Date()
        return now.getTime()
      }
    }
  },
}
