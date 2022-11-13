// @ts-nocheck
/**
 * Turtle Graphics for Web browser (nadesiko3)
 * plugin_turtle.js
 */

import turtleImage from './image_turtle64.mjs'
import elephantImage from './image_turtle-elephant.mjs'
import pandaImage from './image_turtle-panda.mjs'

const PluginTurtle = {
  '初期化': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      /* istanbul ignore if */
      if (sys._turtle) { return }
      sys._turtle = {
        list: [],
        target: -1,
        ctx: null,
        canvas: null,
        canvas_r: { left: 0, top: 0, width: 640, height: 400 },
        clearAll: function () {
          const me = this
          console.log('[TURTLE] clearAll')
          for (let i = 0; i < me.list.length; i++) {
            const tt = me.list[i]
            tt.mlist = [] // ジョブをクリア
            document.body.removeChild(tt.canvas)
          }
          me.list = []
          if (me.canvas !== null) {
            me.ctx.clearRect(0, 0,
              me.canvas.width,
              me.canvas.height)
          }

          me.target = -1
          me.flagSetTimer = false
        },
        drawTurtle: function (id) {
          const tt = this.list[id]
          if (!tt) { return }
          const cr = this.canvas_r
          // カメの位置を移動
          tt.canvas.style.left = (cr.left + tt.x - tt.cx) + 'px'
          tt.canvas.style.top = (cr.top + tt.y - tt.cx) + 'px'
          if (!tt.f_update) { return }
          /* istanbul ignore if */
          if (!tt.flagLoaded) { return }
          tt.f_update = false
          tt.ctx.clearRect(0, 0,
            tt.canvas.width,
            tt.canvas.height)
          if (!tt.f_visible) { return }
          if (tt.dir !== 270) {
            const rad = (tt.dir + 90) * 0.017453292519943295
            tt.ctx.save()
            tt.ctx.translate(tt.cx, tt.cy)
            tt.ctx.rotate(rad)
            tt.ctx.translate(-tt.cx, -tt.cy)
            tt.ctx.drawImage(tt.img, 0, 0)
            tt.ctx.restore()
          } else { tt.ctx.drawImage(tt.img, 0, 0) }
        },
        getCur: function () {
          if (this.list.length === 0) { throw Error('最初に『カメ作成』命令を呼び出してください。') }

          return this.list[this.target]
        },
        flagSetTimer: false,
        setTimer: function () {
          if (this.flagSetTimer) { return }
          this.flagSetTimer = true
          console.log('[TURTLE] standby ...')
          setTimeout(() => {
            console.log('[TURTLE] Let\'s go!')
            sys._turtle.play()
          }, 1)
        },
        line: function (tt, x1, y1, x2, y2) {
          /* istanbul ignore else */
          if (tt) { if (!tt.flagDown) { return } }

          const ctx = this.ctx
          if (tt.flagBegeinPath) {
            ctx.lineTo(x2, y2)
          } else {
            ctx.beginPath()
            ctx.lineWidth = tt.lineWidth
            ctx.strokeStyle = tt.color
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()
          }
        },
        doMacro: function (tt, wait) {
          const me = this
          if (!tt.flagLoaded && wait > 0) {
            // console.log('[TURTLE] waiting ...')
            return true
          }
          const m = tt.mlist.shift()
          const cmd = (m !== undefined) ? m[0] : ''
          switch (cmd) {
            case 'xy':
              // 起点を移動する
              tt.x = m[1]
              tt.y = m[2]
              break
            case 'begin':
              // 描画を明示的に開始する
              this.ctx.beginPath()
              this.ctx.moveTo(tt.x, tt.y)
              tt.flagBegeinPath = true
              break
            case 'close':
              // パスを閉じる
              this.ctx.closePath()
              tt.flagBegeinPath = false
              break
            case 'fill':
              if (tt.flagBegeinPath) {
                this.ctx.closePath()
                tt.flagBegeinPath = false
              }
              this.ctx.fill()
              break
            case 'stroke':
              if (tt.flagBegeinPath) {
                this.ctx.closePath()
                tt.flagBegeinPath = false
              }
              this.ctx.stroke()
              break
            case 'text':
              this.ctx.fillText(m[1], tt.x, tt.y)
              break
            case 'textset':
              this.ctx.font = m[1]
              break
            case 'fillStyle':
              this.ctx.fillStyle = m[1]
              break
            case 'mv': {
              // 線を引く
              me.line(tt, tt.x, tt.y, m[1], m[2])
              // カメの角度を変更
              const mvRad = Math.atan2(m[2] - tt.y, m[1] - tt.x)
              tt.dir = mvRad * 57.29577951308232
              tt.f_update = true
              // 実際に位置を移動
              tt.x = m[1]
              tt.y = m[2]
              break
            }
            case 'fd': {
              const fdv = m[1] * m[2]
              const rad = tt.dir * 0.017453292519943295
              const x2 = tt.x + Math.cos(rad) * fdv
              const y2 = tt.y + Math.sin(rad) * fdv
              me.line(tt, tt.x, tt.y, x2, y2)
              tt.x = x2
              tt.y = y2
              break
            }
            case 'angle': {
              const angle = m[1]
              tt.dir = ((angle - 90 + 360) % 360)
              tt.f_update = true
              break
            }
            case 'rotr': {
              const rv = m[1]
              tt.dir = (tt.dir + rv) % 360
              tt.f_update = true
              break
            }
            case 'rotl': {
              const lv = m[1]
              tt.dir = (tt.dir - lv + 360) % 360
              tt.f_update = true
              break
            }
            case 'color':
              tt.color = m[1]
              this.ctx.strokeStyle = tt.color
              break
            case 'size':
              tt.lineWidth = m[1]
              this.ctx.lineWidth = tt.lineWidth
              break
            case 'penOn':
              tt.flagDown = m[1]
              break
            case 'visible':
              tt.f_visible = m[1]
              tt.f_update = true
              break
            case 'changeImage':
              tt.flagLoaded = false
              tt.img.src = m[1]
              break
          }
          if (tt.flagLoaded) { sys._turtle.drawTurtle(tt.id) }
          return (tt.mlist.length > 0)
        },
        doMacroAll: function (wait) {
          let hasNext = false
          for (let i = 0; i < sys._turtle.list.length; i++) {
            const tt = sys._turtle.list[i]
            if (this.doMacro(tt, wait)) { hasNext = true }
          }
          return hasNext
        },
        play: function () {
          const me = this
          const wait = sys.__v0['カメ速度']
          let hasNext = this.doMacroAll(wait)
          if (wait <= 0) {
            while (hasNext) { hasNext = this.doMacroAll(wait) }
          } else if (hasNext) {
            setTimeout(() => me.play(), wait)
            return
          }
          console.log('[TURTLE] finished.')
          me.flagSetTimer = false
        },
        setupCanvas: function (sys) {
          // 描画先をセットする
          let canvasId = sys.__v0['カメ描画先']
          if (typeof canvasId === 'string') {
            canvasId = document.getElementById(canvasId) || document.querySelector(canvasId)
            sys.__v0['カメ描画先'] = canvasId
          }
          console.log('カメ描画先=', canvasId)
          const cv = sys._turtle.canvas = canvasId
          if (!cv) {
            console.log('[ERROR] カメ描画先が見当たりません。' + canvasId)
            throw Error('カメ描画先が見当たりません。')
          }
          const ctx = sys._turtle.ctx = sys._turtle.canvas.getContext('2d')
          ctx.lineWidth = 4
          ctx.strokeStyle = 'black'
          ctx.lineCap = 'round'
          sys._turtle.resizeCanvas(sys)
        },
        resizeCanvas: function (sys) {
          const cv = sys._turtle.canvas
          const rect = cv.getBoundingClientRect()
          const rx = rect.left + window.pageXOffset
          const ry = rect.top + window.pageYOffset
          sys._turtle.canvas_r = {
            'left': rx,
            'top': ry,
            width: rect.width,
            height: rect.height
          }
        },
        createTurtle: function (imageUrl, sys) {
          // キャンバス情報は毎回参照する (#734)
          sys._turtle.setupCanvas(sys)
          // const cv = sys._turtle.canvas
          // カメの情報を sys._turtle リストに追加
          const id = sys._turtle.list.length
          const tt = {
            id: id,
            img: null,
            canvas: null,
            ctx: null,
            dir: 270, // 上向き
            cx: 32,
            cy: 32,
            x: 0,
            y: 0,
            color: 'black',
            lineWidth: 4,
            flagDown: true,
            flagBegeinPath: false,
            f_update: true,
            flagLoaded: false,
            f_visible: true,
            mlist: []
          }
          sys._turtle.list.push(tt)
          sys._turtle.target = id
          // 画像を読み込む
          tt.img = document.createElement('img')
          tt.canvas = document.createElement('canvas')
          tt.ctx = tt.canvas.getContext('2d')
          tt.canvas.id = id
          tt.img.onload = () => {
            tt.cx = tt.img.width / 2
            tt.cy = tt.img.height / 2
            tt.canvas.width = tt.img.width
            tt.canvas.height = tt.img.height
            tt.flagLoaded = true
            tt.f_update = true
            sys._turtle.drawTurtle(tt.id)
            console.log('turtle.onload')
          }
          tt.img.onerror = () => {
            console.log('カメの読み込みに失敗')
            tt.flagLoaded = true
            tt.f_visible = false
            tt.f_update = true
            sys._turtle.drawTurtle(tt.id)
          }
          tt.img.src = imageUrl
          tt.canvas.style.position = 'absolute'
          document.body.appendChild(tt.canvas)
          // デフォルト位置の設定
          tt.x = sys._turtle.canvas_r.width / 2
          tt.y = sys._turtle.canvas_r.height / 2
          return id
        }
      }
    }
  },

  '!クリア': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      sys._turtle.clearAll()
    }
  },

  // @タートルグラフィックス・カメ描画
  'カメ作成': { // @タートルグラフィックスを開始してカメのIDを返す // @かめさくせい
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      const imageUrl = sys.__v0['カメ画像URL']
      return sys._turtle.createTurtle(imageUrl, sys)
    }
  },
  'ゾウ作成': { // @ゾウの画像でタートルグラフィックスを開始してIDを返す // @ぞうさくせい
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      const imageUrl = elephantImage
      return sys._turtle.createTurtle(imageUrl, sys)
    }
  },
  'パンダ作成': { // @パンダの画像でタートルグラフィックスを開始してIDを返す // @ぱんださくせい
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      const imageUrl = pandaImage
      return sys._turtle.createTurtle(imageUrl, sys)
    }
  },
  'カメ操作対象設定': { // @IDを指定して操作対象となるカメを変更する // @かめそうさたいしょうせってい
    type: 'func',
    josi: [['に', 'へ', 'の']],
    pure: true,
    fn: function (id, sys) {
      sys._turtle.target = id
    },
    return_none: true
  },
  'カメ描画先': { type: 'var', value: 'turtle_cv' }, // @かめびょうがさき
  'カメ画像URL': { type: 'var', value: turtleImage }, // @かめがぞうURL
  'カメ画像変更': { // @カメの画像をURLに変更する // @かめがぞうへんこう
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (url, sys) {
      const tt = sys._turtle.getCur()
      tt.mlist.push(['changeImage', url])
      sys._turtle.setTimer()
    },
    return_none: true
  },
  'カメ速度': { type: 'const', value: 100 }, // @かめそくど
  'カメ速度設定': { // @カメの動作速度vに設定(大きいほど遅い) // @かめそくどせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (v, sys) {
      sys.__varslist[0]['カメ速度'] = v
    }
  },
  'カメ移動': { // @カメの位置を[x,y]へ移動する // @かめいどう
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (xy, sys) {
      const tt = sys._turtle.getCur()
      tt.mlist.push(['mv', xy[0], xy[1]])
      sys._turtle.setTimer()
    },
    return_none: true
  },
  'カメ起点移動': { // @カメの描画起点位置を[x,y]へ移動する // @かめきてんいどう
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (xy, sys) {
      const tt = sys._turtle.getCur()
      tt.mlist.push(['xy', xy[0], xy[1]])
      sys._turtle.setTimer()
    },
    return_none: true
  },
  'カメ進': { // @カメの位置をVだけ進める // @かめすすむ
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v, sys) {
      const tt = sys._turtle.getCur()
      tt.mlist.push(['fd', v, 1])
      sys._turtle.setTimer()
    },
    return_none: true
  },
  'カメ戻': { // @カメの位置をVだけ戻す // @かめもどる
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v, sys) {
      const tt = sys._turtle.getCur()
      tt.mlist.push(['fd', v, -1])
      sys._turtle.setTimer()
    },
    return_none: true
  },
  'カメ角度設定': { // @カメの向きをDEGに設定する // @かめかくどせってい
    type: 'func',
    josi: [['に', 'へ', 'の']],
    pure: true,
    fn: function (v, sys) {
      const tt = sys._turtle.getCur()
      tt.mlist.push(['angle', parseFloat(v)])
      sys._turtle.setTimer()
    },
    return_none: true
  },
  'カメ右回転': { // @カメの向きをDEGだけ右に向ける // @かめみぎかいてん
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v, sys) {
      const tt = sys._turtle.getCur()
      tt.mlist.push(['rotr', v])
      sys._turtle.setTimer()
    },
    return_none: true
  },
  'カメ左回転': { // @カメの向きをDEGだけ左に向ける // @かめひだりかいてん
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v, sys) {
      const tt = sys._turtle.getCur()
      tt.mlist.push(['rotl', v])
      sys._turtle.setTimer()
    },
    return_none: true
  },
  'カメペン色設定': { // @カメのペン描画色をCに設定する // @かめぺんいろせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (c, sys) {
      const tt = sys._turtle.getCur()
      tt.mlist.push(['color', c])
      sys._turtle.setTimer()
    },
    return_none: true
  },
  'カメペンサイズ設定': { // @カメペンのサイズをWに設定する // @かめぺんさいずせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (w, sys) {
      const tt = sys._turtle.getCur()
      tt.mlist.push(['size', w])
      sys._turtle.setTimer()
    }
  },
  'カメペン設定': { // @カメペンを使うかどうかをV(オン/オフ)に設定する // @かめぺんせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (w, sys) {
      const tt = sys._turtle.getCur()
      tt.mlist.push(['penOn', w])
      sys._turtle.setTimer()
    }
  },
  'カメパス開始': { // @カメで明示的にパスの描画を開始する // @かめぱすかいし
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      const tt = sys._turtle.getCur()
      tt.mlist.push(['begin'])
      sys._turtle.setTimer()
    }
  },
  'カメパス閉': { // @カメでパスを明示的に閉じる(省略可能) // @かめぱすとじる
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      const tt = sys._turtle.getCur()
      tt.mlist.push(['close'])
      sys._turtle.setTimer()
    }
  },
  'カメパス線引': { // @カメでパスを閉じて、カメペン色設定で指定した色で枠線を引く // @かめぱすせんひく
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      const tt = sys._turtle.getCur()
      tt.mlist.push(['stroke'])
      sys._turtle.setTimer()
    }
  },
  'カメパス塗': { // @カメでパスを閉じて、カメ塗り色設定で指定した色で塗りつぶす // @かめぱすぬる
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      const tt = sys._turtle.getCur()
      tt.mlist.push(['fill'])
      sys._turtle.setTimer()
    }
  },
  'カメ文字描画': { // @カメの位置に文字Sを描画 // @かめもじびょうが
    type: 'func',
    josi: [['を', 'と', 'の']],
    pure: true,
    fn: function (s, sys) {
      const tt = sys._turtle.getCur()
      tt.mlist.push(['text', s])
      sys._turtle.setTimer()
    }
  },
  'カメ文字設定': { // @カメ文字描画で描画するテキストサイズやフォント(48px serif)などを設定 // @かめもじせってい
    type: 'func',
    josi: [['に', 'へ', 'で']],
    pure: true,
    fn: function (s, sys) {
      s = '' + s // 文字列に
      if (s.match(/^\d+$/)) {
        s = s + 'px serif'
      } else if (s.match(/^\d+(px|em)$/)) {
        s = s + ' serif'
      }
      const tt = sys._turtle.getCur()
      tt.mlist.push(['textset', s])
      sys._turtle.setTimer()
    }
  },
  'カメ塗色設定': { // @カメパスの塗り色をCに設定する // @かめぬりいろせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (c, sys) {
      const tt = sys._turtle.getCur()
      tt.mlist.push(['fillStyle', c])
      sys._turtle.setTimer()
    },
    return_none: true
  },
  'カメ全消去': { // @表示しているカメと描画内容を全部消去する // @かめぜんしょうきょ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      sys._turtle.clearAll()
    },
    return_none: true
  },
  'カメコマンド実行': { // @カメにコマンドSを実行する。コマンドは改行か「;」で区切る。コマンドと引数は「=」で区切り引数はかカンマで区切る // @かめこまんどじっこう
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (cmd, sys) {
      const tt = sys._turtle.getCur()
      const a = cmd.split(/(\n|;)/)
      for (let i = 0; i < a.length; i++) {
        let c = a[i]
        c = c.replace(/^([a-zA-Z_]+)\s*(\d+)/, '$1,$2')
        c = c.replace(/^([a-zA-Z_]+)\s*=/, '$1,')
        const ca = c.split(/\s*,\s*/)
        tt.mlist.push(ca)
      }
      sys._turtle.setTimer()
    },
    return_none: true
  },
  'カメ非表示': { // @カメの画像を非表示にする。描画に影響しない。 // @かめひひょうじ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      const tt = sys._turtle.getCur()
      tt.mlist.push(['visible', false])
      sys._turtle.setTimer()
    },
    return_none: true
  },
  'カメ表示': { // @非表示にしたカメを表示する。 // @かめひょうじ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      const tt = sys._turtle.getCur()
      tt.mlist.push(['visible', true])
      sys._turtle.setTimer()
    },
    return_none: true
  },
  'カメクリック時': { // @ 操作対象のカメをクリックした時のイベントを設定する // @かめくりっくしたとき
    type: 'func',
    josi: [['を']],
    pure: false,
    fn: function (func, sys) {
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      const tid = sys._turtle.target
      const tt = sys._turtle.list[tid]
      tt.canvas.onclick = (e) => {
        sys.__v0['対象'] = e.target
        return func(e, sys)
      }
    },
    return_none: true
  }
}

// module.exports = PluginTurtle
export default PluginTurtle

// scriptタグで取り込んだ時、自動で登録する
/* istanbul ignore else */
if (typeof (navigator) === 'object' && typeof (navigator.nako3)) { navigator.nako3.addPluginObject('PluginTurtle', PluginTurtle) }
