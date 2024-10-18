/**
 * Turtle Graphics for Web browser (nadesiko3)
 * plugin_turtle.mts
 */

import { NakoSystem, NakoCallback } from '../core/src/plugin_api.mjs'
import { turtleImage, elephantImage, pandaImage } from './plugin_turtle_images.mjs'

class NakoTurtle {
  id: number
  img: any
  canvas: any
  ctx: any
  dir: number
  cx: number
  cy: number
  x: number
  y: number
  color: string
  lineWidth: number
  flagDown: boolean
  flagBegeinPath: boolean
  f_update: boolean
  flagLoaded: boolean
  f_visible: boolean
  mlist: any[]
  sys: NakoSystem

  constructor (sys: NakoSystem, id: number) {
    this.sys = sys
    this.id = id
    this.img = null
    this.canvas = null
    this.ctx = null
    this.dir = 270 // 上向き
    this.cx = 32
    this.cy = 32
    this.x = 0
    this.y = 0
    this.color = 'black'
    this.lineWidth = 4
    this.flagDown = true
    this.flagBegeinPath = false
    this.f_update = true
    this.flagLoaded = false
    this.f_visible = true
    this.mlist = []
  }

  clear () {
    this.mlist = [] // ジョブをクリア
    document.body.removeChild(this.canvas)
  }

  loadImage (url: string, callback: any) {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')
    this.canvas.id = this.id
    this.img = document.createElement('img')
    this.img.onload = () => {
      this.cx = this.img.width / 2
      this.cy = this.img.height / 2
      this.canvas.width = this.img.width
      this.canvas.height = this.img.height
      this.flagLoaded = true
      this.f_update = true
      this.canvas.style.position = 'absolute'
      document.body.appendChild(this.canvas)
      // console.log('createTurtle::this.turtles=', this)
      callback(this)
    }
    this.img.onerror = () => {
      console.log('カメの読み込みに失敗')
      this.flagLoaded = true
      this.f_visible = false
      this.f_update = true
      callback(this)
    }
    this.img.src = url
  }
}

class NakoTurtleSystem {
  turtles: NakoTurtle[]
  target: number
  ctx: any
  canvas: any
  canvas_r: any
  flagSetTimer: boolean
  timerId: any
  sys: NakoSystem
  instanceCount: number
  // Singleton
  /* eslint-disable no-use-before-define */
  static instance: NakoTurtleSystem
  static getInstance (sys: NakoSystem) {
    if (NakoTurtleSystem.instance === undefined) {
      NakoTurtleSystem.instance = new NakoTurtleSystem(sys)
    }
    const i = NakoTurtleSystem.instance
    i.instanceCount += 1
    return NakoTurtleSystem.instance
  }

  constructor (sys: NakoSystem) {
    this.sys = sys
    this.turtles = [] // カメの一覧
    this.target = -1
    this.ctx = null
    this.canvas = null
    this.canvas_r = { left: 0, top: 0, width: 640, height: 400 }
    this.flagSetTimer = false
    this.instanceCount = 0
    this.timerId = null
  }

  clearAll () {
    // console.log('カメ全消去 turtles=', this.turtles)
    for (let i = 0; i < this.turtles.length; i++) {
      const tt = this.turtles[i]
      tt.clear()
    }
    this.turtles = []
    if (this.canvas !== null) {
      this.ctx.clearRect(0, 0,
        this.canvas.width,
        this.canvas.height)
    }
    this.target = -1
    this.flagSetTimer = false
  }

  drawTurtle (id: number) {
    const tt = this.turtles[id]
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
  }

  getCur () {
    if (this.turtles.length === 0) { throw Error('最初に『カメ作成』命令を呼び出してください。') }
    return this.turtles[this.target]
  }

  setTimer () {
    // コマンド設定後、1度だけこの関数を呼び出す
    if (this.flagSetTimer) { return }
    this.flagSetTimer = true
    // 記録したマクロを再生する
    if (this.timerId) { clearTimeout(this.timerId) }
    this.timerId = setTimeout(() => {
      console.log('[TURTLE] Let\'s go!')
      this.play()
    }, 1)
  }

  line (tt: NakoTurtle, x1: number, y1: number, x2: number, y2: number) {
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
  }

  addMacro (args: Array<any>) {
    const tt: NakoTurtle = this.getCur()
    tt.mlist.push(args)
    this.setTimer()
  }

  doMacro (tt: NakoTurtle, wait: number) {
    if (!tt.flagLoaded && wait > 0) {
      // console.log('[TURTLE] waiting ...')
      return true
    }
    const m = tt.mlist.shift()
    const cmd = (m !== undefined) ? m[0] : ''
    // console.log('@@@doMacro', cmd, m, tt.x, tt.y, ': dir=', tt.dir)
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
        this.line(tt, tt.x, tt.y, m[1], m[2])
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
        this.line(tt, tt.x, tt.y, x2, y2)
        tt.x = x2
        tt.y = y2
        // console.log('@@@fd', m, tt.x, tt.y, ': dir=', tt.dir)
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
    if (tt.flagLoaded) { this.drawTurtle(tt.id) }
    return (tt.mlist.length > 0)
  }

  doMacroAll (wait: number) {
    let hasNext = false
    for (let i = 0; i < this.turtles.length; i++) {
      const tt = this.turtles[i]
      if (this.doMacro(tt, wait)) { hasNext = true }
    }
    return hasNext
  }

  play () {
    const wait = this.sys.__getSysVar('カメ速度')
    let hasNext = this.doMacroAll(wait)
    if (wait <= 0) {
      // 待ち時間なしで全部実行
      while (hasNext) { hasNext = this.doMacroAll(wait) }
    } else if (hasNext) {
      // 一つずつ実行
      if (this.timerId) { clearTimeout(this.timerId) }
      this.timerId = setTimeout(() => this.play(), wait)
      return
    }
    console.log('[TURTLE] finished.')
    this.flagSetTimer = false
  }

  setupCanvas () {
    // 描画先をセットする
    let canvasId = this.sys.__getSysVar('カメ描画先')
    if (typeof canvasId === 'string') {
      canvasId = document.getElementById(canvasId) || document.querySelector(canvasId)
      this.sys.__setSysVar('カメ描画先', canvasId)
    }
    console.log('カメ描画先=', canvasId)
    const cv = this.canvas = canvasId
    if (!cv) {
      console.log('[ERROR] カメ描画先が見当たりません。' + canvasId)
      throw Error('カメ描画先が見当たりません。')
    }
    const ctx = this.ctx = cv.getContext('2d')
    ctx.lineWidth = 4
    ctx.strokeStyle = 'black'
    ctx.lineCap = 'round'
    this.resizeCanvas()
  }

  resizeCanvas () {
    const cv = this.canvas
    const rect = cv.getBoundingClientRect()
    const rx = rect.left + window.scrollX
    const ry = rect.top + window.scrollY
    this.canvas_r = {
      'left': rx,
      'top': ry,
      width: rect.width,
      height: rect.height
    }
  }

  createTurtle (imageUrl: string) {
    // キャンバス情報は毎回参照する (#734)
    this.setupCanvas()
    // カメの情報をリストに追加
    const id = this.turtles.length
    const tt: NakoTurtle = new NakoTurtle(this.sys, id)
    this.turtles.push(tt)
    this.target = id
    // 画像を読み込む
    tt.loadImage(imageUrl, (tt: NakoTurtle) => {
      this.drawTurtle(tt.id)
      console.log(`tutrle.onload(id=${tt.id})`)
    })
    // デフォルト位置(中央)の設定
    tt.x = this.canvas_r.width / 2
    tt.y = this.canvas_r.height / 2
    return id
  }
}

const PluginTurtle = {
  'meta': {
    type: 'const',
    value: {
      pluginName: 'plugin_turtle', // プラグインの名前
      description: 'タートルグラフィックス用のプラグイン', // 説明
      pluginVersion: '3.6.0', // プラグインのバージョン
      nakoRuntime: ['wnako'], // 対象ランタイム
      nakoVersion: '3.6.3' // 要求なでしこバージョン
    }
  },

  '初期化': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      const turtleSystem: NakoTurtleSystem = NakoTurtleSystem.getInstance(sys)
      sys.tags.turtles = turtleSystem
    }
  },

  '!クリア': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      // console.log('tutle::!クリア')
      sys.tags.turtles.clearAll()
    }
  },

  // @タートルグラフィックス・カメ描画
  'カメ作成': { // @タートルグラフィックスを開始してカメのIDを返す // @かめさくせい
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      const imageUrl = sys.__getSysVar('カメ画像URL')
      return sys.tags.turtles.createTurtle(imageUrl)
    }
  },
  'ゾウ作成': { // @ゾウの画像でタートルグラフィックスを開始してIDを返す // @ぞうさくせい
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      const imageUrl = elephantImage
      return sys.tags.turtles.createTurtle(imageUrl)
    }
  },
  'パンダ作成': { // @パンダの画像でタートルグラフィックスを開始してIDを返す // @ぱんださくせい
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      const imageUrl = pandaImage
      return sys.tags.turtles.createTurtle(imageUrl)
    }
  },
  'カメ操作対象設定': { // @IDを指定して操作対象となるカメを変更する // @かめそうさたいしょうせってい
    type: 'func',
    josi: [['に', 'へ', 'の']],
    pure: true,
    fn: function (id: number, sys: NakoSystem) {
      sys.tags.turtles.target = id
    },
    return_none: true
  },
  'カメ描画先': { type: 'var', value: '#turtle_cv' }, // @かめびょうがさき
  'カメ画像URL': { type: 'var', value: turtleImage }, // @かめがぞうURL
  'カメ画像変更': { // @カメの画像をURLに変更する // @かめがぞうへんこう
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (url: string, sys: NakoSystem) {
      const turtles: NakoTurtleSystem = sys.tags.turtles
      turtles.addMacro(['changeImage', url])
    },
    return_none: true
  },
  'カメ速度': { type: 'const', value: 100 }, // @かめそくど
  'カメ速度設定': { // @カメの動作速度vに設定(大きいほど遅い) // @かめそくどせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (v: number, sys: NakoSystem) {
      sys.__setSysVar('カメ速度', v)
    }
  },
  'カメ移動': { // @カメの位置を[x,y]へ移動する // @かめいどう
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (xy: number[], sys: NakoSystem) {
      const turtles: NakoTurtleSystem = sys.tags.turtles
      turtles.addMacro(['mv', xy[0], xy[1]])
    },
    return_none: true
  },
  'カメ起点移動': { // @カメの描画起点位置を[x,y]へ移動する // @かめきてんいどう
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (xy: number[], sys: NakoSystem) {
      const turtles: NakoTurtleSystem = sys.tags.turtles
      turtles.addMacro(['xy', xy[0], xy[1]])
    },
    return_none: true
  },
  'カメ進': { // @カメの位置をVだけ進める // @かめすすむ
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v: number, sys: NakoSystem) {
      const turtles: NakoTurtleSystem = sys.tags.turtles
      turtles.addMacro(['fd', v, 1])
    },
    return_none: true
  },
  'カメ戻': { // @カメの位置をVだけ戻す // @かめもどる
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v: number, sys: NakoSystem) {
      const turtles: NakoTurtleSystem = sys.tags.turtles
      turtles.addMacro(['fd', v, -1])
    },
    return_none: true
  },
  'カメ角度設定': { // @カメの向きをDEGに設定する // @かめかくどせってい
    type: 'func',
    josi: [['に', 'へ', 'の']],
    pure: true,
    fn: function (v: number, sys: NakoSystem) {
      const turtles: NakoTurtleSystem = sys.tags.turtles
      turtles.addMacro(['angle', v])
    },
    return_none: true
  },
  'カメ右回転': { // @カメの向きをDEGだけ右に向ける // @かめみぎかいてん
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v: number, sys: NakoSystem) {
      const turtles: NakoTurtleSystem = sys.tags.turtles
      turtles.addMacro(['rotr', v])
    },
    return_none: true
  },
  'カメ左回転': { // @カメの向きをDEGだけ左に向ける // @かめひだりかいてん
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v: number, sys: NakoSystem) {
      const turtles: NakoTurtleSystem = sys.tags.turtles
      turtles.addMacro(['rotl', v])
    },
    return_none: true
  },
  'カメペン色設定': { // @カメのペン描画色をCに設定する // @かめぺんいろせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (c: string, sys: NakoSystem) {
      const turtles: NakoTurtleSystem = sys.tags.turtles
      turtles.addMacro(['color', c])
    },
    return_none: true
  },
  'カメペンサイズ設定': { // @カメペンのサイズをWに設定する // @かめぺんさいずせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (w: string, sys: NakoSystem) {
      const turtles: NakoTurtleSystem = sys.tags.turtles
      turtles.addMacro(['size', w])
    }
  },
  'カメペン設定': { // @カメペンを使うかどうかをV(オン/オフ)に設定する // @かめぺんせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (w: string, sys: NakoSystem) {
      const turtles: NakoTurtleSystem = sys.tags.turtles
      turtles.addMacro(['penOn', w])
    }
  },
  'カメパス開始': { // @カメで明示的にパスの描画を開始する // @かめぱすかいし
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      const turtles: NakoTurtleSystem = sys.tags.turtles
      turtles.addMacro(['begin'])
    }
  },
  'カメパス閉': { // @カメでパスを明示的に閉じる(省略可能) // @かめぱすとじる
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      const turtles: NakoTurtleSystem = sys.tags.turtles
      turtles.addMacro(['close'])
    }
  },
  'カメパス線引': { // @カメでパスを閉じて、カメペン色設定で指定した色で枠線を引く // @かめぱすせんひく
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      const turtles: NakoTurtleSystem = sys.tags.turtles
      turtles.addMacro(['stroke'])
    }
  },
  'カメパス塗': { // @カメでパスを閉じて、カメ塗り色設定で指定した色で塗りつぶす // @かめぱすぬる
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      const turtles: NakoTurtleSystem = sys.tags.turtles
      turtles.addMacro(['fill'])
    }
  },
  'カメ文字描画': { // @カメの位置に文字Sを描画 // @かめもじびょうが
    type: 'func',
    josi: [['を', 'と', 'の']],
    pure: true,
    fn: function (s: string, sys: NakoSystem) {
      const turtles: NakoTurtleSystem = sys.tags.turtles
      turtles.addMacro(['text', s])
    }
  },
  'カメ文字設定': { // @カメ文字描画で描画するテキストサイズやフォント(48px serif)などを設定 // @かめもじせってい
    type: 'func',
    josi: [['に', 'へ', 'で']],
    pure: true,
    fn: function (s: string, sys: NakoSystem) {
      s = '' + s // 文字列に
      if (s.match(/^\d+$/)) {
        s = s + 'px serif'
      } else if (s.match(/^\d+(px|em)$/)) {
        s = s + ' serif'
      }
      const turtles: NakoTurtleSystem = sys.tags.turtles
      turtles.addMacro(['textset', s])
    }
  },
  'カメ塗色設定': { // @カメパスの塗り色をCに設定する // @かめぬりいろせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (c: string, sys: NakoSystem) {
      const turtles: NakoTurtleSystem = sys.tags.turtles
      turtles.addMacro(['fillStyle', c])
    },
    return_none: true
  },
  'カメ全消去': { // @表示しているカメと描画内容を全部消去する // @かめぜんしょうきょ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      sys.tags.turtles.clearAll()
    },
    return_none: true
  },
  'カメコマンド実行': { // @カメにコマンドSを実行する。コマンドは改行か「;」で区切る。コマンドと引数は「=」で区切り引数はかカンマで区切る // @かめこまんどじっこう
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (cmd: string, sys: NakoSystem) {
      const turtles: NakoTurtleSystem = sys.tags.turtles
      const a = cmd.split(/(\n|;)/)
      for (let i = 0; i < a.length; i++) {
        let c = a[i]
        c = c.replace(/^([a-zA-Z_]+)\s*(\d+)/, '$1,$2')
        c = c.replace(/^([a-zA-Z_]+)\s*=/, '$1,')
        const ca = c.split(/\s*,\s*/)
        turtles.addMacro(ca)
      }
    },
    return_none: true
  },
  'カメ非表示': { // @カメの画像を非表示にする。描画に影響しない。 // @かめひひょうじ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      const turtles: NakoTurtleSystem = sys.tags.turtles
      turtles.addMacro(['visible', false])
    },
    return_none: true
  },
  'カメ表示': { // @非表示にしたカメを表示する。 // @かめひょうじ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      const turtles: NakoTurtleSystem = sys.tags.turtles
      turtles.addMacro(['visible', true])
    },
    return_none: true
  },
  'カメクリック時': { // @ 操作対象のカメをクリックした時のイベントを設定する // @かめくりっくしたとき
    type: 'func',
    josi: [['を']],
    pure: false,
    fn: function (func: NakoCallback, sys: NakoSystem) {
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      if (typeof func !== 'function') { return }
      const tid = sys.tags.turtles.target
      const tt = sys.tags.turtles.list[tid]
      tt.canvas.onclick = (e: Event) => {
        sys.__setSysVar('対象', e.target)
        return func(e, sys)
      }
    },
    return_none: true
  }
}

// module.exports = PluginTurtle
export default PluginTurtle

// scriptタグで取り込んだ時、自動で登録する
// @ts-ignore TS2339
if (typeof (navigator) === 'object' && typeof (navigator.nako3)) { navigator.nako3.addPluginObject('PluginTurtle', PluginTurtle) }
