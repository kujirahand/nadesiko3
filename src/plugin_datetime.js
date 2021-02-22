const { NakoRuntimeError } = require('../src/nako_errors')
const PluginDateTime = {
  '初期化': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
    }
  },
  // @日時処理
  '元号データ': {type: 'const', value: require('./era.json')}, // @げんごうでーた
  '今': { // @現在時刻を「HH:mm:ss」の形式で返す // @いま
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      const dayjs = require('dayjs')
      return dayjs().format('HH:mm:ss')
    }
  },
  'システム時間': { // @現在のUNIX時間 (UTC(1970/1/1)からの経過秒数) を返す // @しすてむじかん
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      const dayjs = require('dayjs')
      return dayjs().unix()
    }
  },
  '今日': { // @今日の日付を「YYYY/MM/DD」の形式で返す // @きょう
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      const dayjs = require('dayjs')
      return dayjs().format('YYYY/MM/DD')
    }
  },
  '明日': { // @明日の日付を「YYYY/MM/DD」の形式で返す (v1非互換) // @あす
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      const dayjs = require('dayjs')
      return dayjs().add(1, 'days').format('YYYY/MM/DD')
    }
  },
  '昨日': { // @昨日の日付を「YYYY/MM/DD」の形式で返す (v1非互換) // @きのう
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      const dayjs = require('dayjs')
      return dayjs().subtract(1, 'days').format('YYYY/MM/DD')
    }
  },
  '今年': { // @今年が何年かを西暦で返す // @ことし
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      const dayjs = require('dayjs')
      return dayjs().year()
    }
  },
  '来年': { // @来年が何年かを西暦で返す // @らいねん
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      const dayjs = require('dayjs')
      return dayjs().add(1, 'years').year()
    }
  },
  '去年': { // @去年が何年かを西暦で返す // @きょねん
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      const dayjs = require('dayjs')
      return dayjs().subtract(1, 'years').year()
    }
  },
  '今月': { // @今月が何月かを返す // @こんげつ
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      const dayjs = require('dayjs')
      return dayjs().month() + 1
    }
  },
  '来月': { // @来月が何月かを返す // @らいげつ
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      const dayjs = require('dayjs')
      return dayjs().add(1, 'months').month() + 1
    }
  },
  '先月': { // @先月が何月かを返す // @せんげつ
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      const dayjs = require('dayjs')
      return dayjs().subtract(1, 'months').month() + 1
    }
  },
  '曜日': { // @日付Sの曜日を返す // @ようび
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (s) {
      const dayjs = require('dayjs')
      require('dayjs/locale/ja')
      return dayjs(s, 'YYYY/MM/DD').locale('ja').format('ddd')
    }
  },
  '曜日番号取得': { // @Sに指定した日付の曜日番号をで返す。不正な日付の場合は今日の曜日番号を返す。(0=日/1=月/2=火/3=水/4=木/5=金/6=土) // @ようびばんごうしゅとく
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (s) {
      const dayjs = require('dayjs')
      require('dayjs/locale/ja')

      let t = dayjs(s, 'YYYY/MM/DD')

      if (!t.isValid()) {
        t = dayjs()
      }

      return t.locale('ja').format('d')
    }
  },
  'UNIX時間変換': { // @日時SをUNIX時間 (UTC(1970/1/1)からの経過秒数) に変換して返す(v1非互換) // @UNIXじかんへんかん
    type: 'func',
    josi: [['の', 'を', 'から']],
    pure: false,
    fn: function (s, sys) {
      return sys.__exec('UNIXTIME変換', [s])
    }
  },
  'UNIXTIME変換': { // @日時SをUNIX時間 (UTC(1970/1/1)からの経過秒数) に変換して返す // @UNIXTIMEへんかん
    type: 'func',
    josi: [['の', 'を', 'から']],
    pure: true,
    fn: function (s) {
      const dayjs = require('dayjs')
      return dayjs(s, 'YYYY/MM/DD HH:mm:ss').unix()
    }
  },
  '日時変換': { // @UNIX時間 (UTC(1970/1/1)からの経過秒数) を「YYYY/MM/DD HH:mm:ss」の形式に変換 // @にちじへんかん
    type: 'func',
    josi: [['を', 'から']],
    pure: true,
    fn: function (tm) {
      const dayjs = require('dayjs')
      return dayjs.unix(tm).format('YYYY/MM/DD HH:mm:ss')
    }
  },
  '和暦変換': { // @Sを和暦に変換する。Sは明治以降の日付が有効。 // @われきへんかん
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (s, sys) {
      const dayjs = require('dayjs')
      const date = dayjs(s, 'YYYY/MM/DD')

      for (const era of sys.__v0['元号データ']) {
        const eraBeginDate = dayjs(era['改元日'], 'YYYY/MM/DD')
        if (eraBeginDate <= date) {
          let eraYear = date.format('YYYY') - eraBeginDate.format('YYYY') + 1

          if (eraYear === 1) {
            eraYear = '元'
          }

          return era['元号'] + eraYear + '/' + date.format('MM/DD')
        }
      }

      throw new NakoRuntimeError(
        '『和暦変換』は明治以前の日付には対応していません。',
        sys.__v0 ? sys.__v0.line : undefined,
      )
    }
  },
  '年数差': { // @日付AとBの差を年数で求めて返す。A<Bなら正の数、そうでないなら負の数を返す (v1非互換)。 // @ねんすうさ
    type: 'func',
    josi: [['と', 'から'], ['の', 'までの']],
    pure: false,
    fn: function (a, b, sys) {
      return sys.__exec('日時差', [a, b, '年'])
    }
  },
  '月数差': { // @日付AとBの差を月数で求めて返す。A<Bなら正の数、そうでないなら負の数を返す (v1非互換)。 // @げっすうさ
    type: 'func',
    josi: [['と', 'から'], ['の', 'までの']],
    pure: false,
    fn: function (a, b, sys) {
      return sys.__exec('日時差', [a, b, '月'])
    }
  },
  '日数差': { // @日付AとBの差を日数で求めて返す。A<Bなら正の数、そうでないなら負の数を返す。 // @にっすうさ
    type: 'func',
    josi: [['と', 'から'], ['の', 'までの']],
    pure: false,
    fn: function (a, b, sys) {
      return sys.__exec('日時差', [a, b, '日'])
    }
  },
  '日時差': { // @日時AとBの差を種類unitで返す。A<Bなら正の数、そうでないなら負の数を返す (v1非互換)。 // @にちじさ
    type: 'func',
    josi: [['と', 'から'], ['の', 'までの'], ['による']],
    pure: true,
    fn: function (a, b, unit) {
      const dayjs = require('dayjs')

      switch (unit) {
        case '年':
          unit = 'years'
          break
        case '月':
          unit = 'months'
          break
        case '日':
          unit = 'days'
          break
        case '時間':
          unit = 'hours'
          break
        case '分':
          unit = 'minutes'
          break
        case '秒':
          unit = 'seconds'
          break
        default:
          break
      }

      const maxCount = 2

      for (let i = 0; i < maxCount; i++) {
        const dts = []

        for (let s of [b, a]) {
          let s_ = s

          if (i === maxCount - 1) {
            s_ = '1980/01/01 ' + s_
          }

          let t = dayjs(s_, 'YYYY/MM/DD HH:mm:ss')

          if (t.isValid()) {
            dts.push(t)
          }
        }

        if (dts.length === 2) {
          return dts[0].diff(dts[1], unit)
        }
      }

      throw new Error('時間差が正常に算出できませんでした。')
    }
  },
  '時間差': { // @時間AとBの時間の差を求めて返す。A<Bなら正の数、そうでないなら負の数を返す。 // @じかんさ
    type: 'func',
    josi: [['と', 'から'], ['の', 'までの']],
    pure: false,
    fn: function (a, b, sys) {
      return sys.__exec('日時差', [a, b, '時間'])
    }
  },
  '分差': { // @時間AとBの分数の差を求めて返す。A<Bなら正の数、そうでないなら負の数を返す。 // @ふんさ
    type: 'func',
    josi: [['と', 'から'], ['の', 'までの']],
    pure: false,
    fn: function (a, b, sys) {
      return sys.__exec('日時差', [a, b, '分'])
    }
  },
  '秒差': { // @時間AとBの差を秒差で求めて返す。A<Bなら正の数、そうでないなら負の数を返す。 // @びょうさ
    type: 'func',
    josi: [['と', 'から'], ['の', 'までの']],
    pure: false,
    fn: function (a, b, sys) {
      return sys.__exec('日時差', [a, b, '秒'])
    }
  },
  '時間加算': { // @時間SにAを加えて返す。Aには「(+｜-)hh:nn:dd」で指定する。 // @じかんかさん
    type: 'func',
    josi: [['に'], ['を']],
    pure: false,
    fn: function (s, a, sys) {
      const pm = a.slice(0, 1)

      if (pm !== '+' && pm !== '-') {
        throw new Error('『時間加算』命令の引数Aは「(+｜-)hh:nn:dd」で指定します。')
      }

      const n = a.slice(1).split(':')
      const units = ['時間', '分', '秒']

      for (let i = 0; i < n.length; i++) {
        s = sys.__exec('日時加算', [s, pm + n[i] + units[i]])
      }

      return s
    }
  },
  '日付加算': { // @日付SにAを加えて返す。Aには「(+｜-)yyyy/mm/dd」で指定する。 // @ひづけかさん
    type: 'func',
    josi: [['に'], ['を']],
    pure: false,
    fn: function (s, a, sys) {
      const pm = a.slice(0, 1)

      if (pm !== '+' && pm !== '-') {
        throw new Error('『日付加算』命令の引数Aは「(+｜-)yyyy/mm/dd」で指定します。')
      }

      const n = a.slice(1).split('/')
      const units = ['年', 'ヶ月', '日']

      for (let i = 0; i < n.length; i++) {
        s = sys.__exec('日時加算', [s, pm + n[i] + units[i]])
      }

      return s
    }
  },

  '日時加算': { // @日時SにAを加えて返す。Aは「(+｜-)1(年|ヶ月|日|時間|分|秒)」のように指定する (v1非互換)。 // @にちじかさん
    type: 'func',
    josi: [['に'], ['を']],
    pure: true,
    fn: function (s, a) {
      const dayjs = require('dayjs')

      let unit

      switch (a.match(/(年|ヶ月|日|時間|分|秒)$/)[0]) {
        case '年':
          unit = 'years'
          break
        case 'ヶ月':
          unit = 'months'
          break
        case '日':
          unit = 'days'
          break
        case '時間':
          unit = 'hours'
          break
        case '分':
          unit = 'minutes'
          break
        case '秒':
          unit = 'seconds'
          break
        default:
          break
      }

      const dateFormat = 'YYYY/MM/DD'
      const timeFormat = 'HH:mm:ss'
      const datetimeFormat = [dateFormat, timeFormat].join(' ')
      const maxCount = 2

      for (let i = 0; i < maxCount; i++) {
        let s_ = s
        let outputFormat

        if (i === maxCount - 1) {
          s_ = '1980/01/01 ' + s_
          outputFormat = timeFormat
        } else if (s_.indexOf(':') === -1) {
          outputFormat = dateFormat
        } else {
          outputFormat = datetimeFormat
        }

        let t = dayjs(s_, datetimeFormat)

        if (t.isValid()) {
          const n = a.match(/[0-9]+/)[0]

          switch (a.slice(0, 1)) {
            case '+':
              t = t.add(n, unit)
              break
            case '-':
              t = t.subtract(n, unit)
              break
            default:
              throw new Error('『日時加算』命令の引数Aは「(+｜-)1(年|ヶ月|日|時間|分|秒)」のように指定します。')
          }

          return t.format(outputFormat)
        }
      }
      throw new Error('日時を正常に加算できませんでした。')
    }
  }
}

module.exports = PluginDateTime
// scriptタグで取り込んだ時、自動で登録する
/* istanbul ignore else */
if (typeof (navigator) === 'object' && typeof (navigator.nako3)) 
  {navigator.nako3.addPluginObject('PluginDateTime', PluginDateTime)}

