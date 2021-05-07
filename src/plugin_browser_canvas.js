const errMsgCanvasInit = '描画を行うためには、HTML内にcanvasを配置し、idを振って『描画開始』命令に指定します。'

module.exports = {
  // @描画
  '描画開始': { // @描画先にCanvas(文字列でクエリの指定も可)を指定して描画API(2D)の利用準備する // @びょうがかいし
    type: 'func',
    josi: [['の', 'へ', 'で']],
    pure: true,
    fn: function (cv, sys) {
      if (typeof cv === 'string')
        {cv = document.querySelector(cv) || document.getElementById(cv)}

      if (!cv) {throw new Error('『描画開始』でCanvasを取得できませんでした。')}
      sys.__canvas = cv
      sys.__ctx = cv.getContext('2d')
      sys.__fillStyle = 'black'
      sys.__strokeStyle = 'black'
      sys.__v0['描画中キャンバス'] = cv
      sys.__v0['描画中コンテキスト'] = sys.__ctx
    },
    return_none: true
  },
  '描画中キャンバス': {type: 'const', value: null}, // @ びょうがちゅうきゃんばす
  '描画中コンテキスト': {type: 'const', value: null}, // @ びょうがちゅうこんてきすと
  'キャンバス状態保存': { // @Canvasの状態を保存(save)   // @ きゃんばすじょうたいほぞん
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      if (!sys.__ctx) {throw new Error(errMsgCanvasInit)}
      sys.__ctx.save()
    },
    return_none: true
  },
  'キャンバス状態復元': { // @Canvasの状態を復元(restore)   // @ きゃんばすじょうたいふくげん
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      if (!sys.__ctx) {throw new Error(errMsgCanvasInit)}
      sys.__ctx.restore()
    },
    return_none: true
  },
  '線色設定': { // @Canvasの線の描画色(lineStyle)を指定する   // @ せんいろしてい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (v, sys) {
      if (!sys.__ctx) {throw new Error(errMsgCanvasInit)}
      sys.__strokeStyle = v
      if (v != '') {
        sys.__ctx.strokeStyle = v
      }
    },
    return_none: true
  },
  '塗色設定': { // @Canvasへの描画色(fillStyle)を指定する   // @ ぬりいろしてい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (v, sys) {
      if (!sys.__ctx) {throw new Error(errMsgCanvasInit)}
      sys.__fillStyle = v
      if (v != '') {
        sys.__ctx.fillStyle = v
      }
    },
    return_none: true
  },
  '線描画': { // @ [x1, y1]から[x2, y2]まで線を描画する // @ せんびょうが
    type: 'func',
    josi: [['から'], ['へ', 'まで']],
    pure: true,
    fn: function (a, b, sys) {
      if (!sys.__ctx) {throw new Error(errMsgCanvasInit)}
      sys.__ctx.beginPath()
      sys.__ctx.moveTo(a[0], a[1])
      sys.__ctx.lineTo(b[0], b[1])
      sys.__ctx.stroke()
    },
    return_none: true
  },
  '線太設定': { // @ vに線の太さ設定 // @ せんふとさせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (v, sys) {
      if (!sys.__ctx) {throw new Error(errMsgCanvasInit)}
      sys.__ctx.lineWidth = v
    },
    return_none: true
  },
  '四角描画': { // @ [x, y, w, h]で矩形を描画する // @ しかくびょうが
    type: 'func',
    josi: [['の', 'へ', 'に']],
    pure: true,
    fn: function (b, sys) {
      if (!sys.__ctx) {throw new Error(errMsgCanvasInit)}
      if (sys.__fillStyle == '' && sys.__strokeStyle == '') {return}
      sys.__ctx.beginPath()
      sys.__ctx.rect(b[0], b[1], b[2], b[3])
      if (sys.__fillStyle != '') {sys.__ctx.fill()}
      if (sys.__strokeStyle != '') {sys.__ctx.stroke()}     
    },
    return_none: true
  },
  '全描画クリア': { // @ 描画中のキャンバスをクリアする。 // @ ぜんびょうがくりあ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      if (!sys.__ctx) {throw new Error(errMsgCanvasInit)}
      sys.__ctx.clearRect(0, 0,
        sys.__canvas.width, sys.__canvas.height)
    },
    return_none: true
  },
  '描画クリア': { // @ [x, y, w, h]の範囲を描画クリア。空配列を指定すると『全描画クリア』と同じ。2要素の配列だと[0,0]を省略したのと同じ。 // @ びょうがくりあ
    type: 'func',
    josi: [['の', 'へ', 'に']],
    pure: true,
    fn: function (b, sys) {
      if (!sys.__ctx) {throw new Error(errMsgCanvasInit)}
      if (!(b instanceof Array)) { b = [] }
      if (b.length == 0) {
        b = [0, 0, sys.__canvas.width, sys.__canvas.height]
      }
      else if (b.length <= 2) {
        b.unshift(0)
        b.unshift(0)
      }
      sys.__ctx.clearRect(b[0], b[1], b[2], b[3])
    },
    return_none: true
  },
  '円描画': { // @ [x, y]へrの円を描画する // @ えんびょうが
    type: 'func',
    josi: [['へ', 'に'], ['の']],
    pure: true,
    fn: function (xy, r, sys) {
      if (!sys.__ctx) {throw new Error(errMsgCanvasInit)}
      if (sys.__fillStyle == '' && sys.__strokeStyle == '') {return}
      sys.__ctx.beginPath()
      sys.__ctx.arc(xy[0], xy[1], r, 0, 2 * Math.PI, false)
      if (sys.__fillStyle != '') {sys.__ctx.fill()}
      if (sys.__strokeStyle != '') {sys.__ctx.stroke()}     
    },
    return_none: true
  },
  '楕円描画': { // @ [x, y, x幅, y幅, 回転, 開始角, 終了角, 左回転か]に楕円を描画する // @ だえんびょうが
    type: 'func',
    josi: [['へ', 'に', 'の']],
    pure: true,
    fn: function (args, sys) {
      console.log(args)
      if (!sys.__ctx) {throw new Error(errMsgCanvasInit)}
      if (!args) {throw new Error('楕円描画の引数配列が無効です')}
      if (args.length < 4) {throw new Error('楕円描画の引数配列が不足しています')}
      if (args.length < 7) {
        if (!args[4]) {args[4] = 0}
        if (!args[5]) {args[5] = 0}
        if (!args[6]) {args[6] = Math.PI * 2}
        if (!args[7]) {args[7] = true}
      }
      if (sys.__fillStyle == '' && sys.__strokeStyle == '') {return}
      sys.__ctx.beginPath()
      sys.__ctx.ellipse.apply(sys.__ctx, args)
      if (sys.__fillStyle != '') {sys.__ctx.fill()}
      if (sys.__strokeStyle != '') {sys.__ctx.stroke()}     
    },
    return_none: true
  },
  '多角形描画': { // @ 座標配列vを指定して多角形を描画する // @ たかっけいびょうが
    type: 'func',
    josi: [['で', 'の', 'を']],
    pure: true,
    fn: function (a, sys) {
      if (!sys.__ctx) {throw new Error(errMsgCanvasInit)}
      if (sys.__fillStyle == '' && sys.__strokeStyle == '') {return}
      sys.__ctx.beginPath()
      const p = a.shift()
      sys.__ctx.moveTo(p[0], p[1])
      while (a.length > 0) {
        const t = a.shift()
        sys.__ctx.lineTo(t[0], t[1])
      }
      sys.__ctx.lineTo(p[0], p[1])
      if (sys.__fillStyle != '') {sys.__ctx.fill()}
      if (sys.__strokeStyle != '') {sys.__ctx.stroke()}     
    },
    return_none: true
  },
  '画像読': { // @ 画像のURLを読み込んでImageオブジェクトを返す。(URLにdataスキームも指定可能) // @ がぞうよむ
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (url, sys) {
      const img = new window.Image()
      img.src = url
      return img
    }
  },
  '画像逐次読': { // @ 画像のURLを読み込んでImageオブジェクトを返す。また完了時『対象』にも代入する。『逐次実行』構文で使う。 // @ がぞうちくじよむ
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (url, sys) {
      if (sys.resolve === undefined) {throw new Error('『画像逐次読』は『逐次実行』構文で使ってください。')}
      sys.resolveCount++
      const img = new window.Image()
      img.src = url
      img.onload = () => {
        sys.__v0['対象'] = img
        sys.resolve()
      }
      img.onerror = () => {
        sys.__v0['対象'] = ''
        sys.reject()
      }
      return img
    }
  },
  '画像読時': { // @ 画像のURLを読み込んでコールバック関数Fを読み込み、変数『対象』にImageオブジェクトを代入する // @ がぞうよんだとき
    type: 'func',
    josi: [['で'], ['の', 'を']],
    pure: true,
    fn: function (f, url, sys) {
      // 関数オブジェクトを得る
      const func = sys.__findVar(f, null) // 文字列指定なら関数に変換
      // 画像を読む
      const img = new window.Image()
      img.src = url
      img.onload = () => {
        sys.__v0['対象'] = img
        func(sys)
      }
      img.onerror = () => {
        sys.__v0['対象'] = ''
        func(sys)
      }
    },
    return_none: true
  },
  '画像描画': { // @ 画像IMG(またはURL)を描画先座標[x,y]へ描画し、Imageオブジェクトを返す。座標には2,4,8個の引数を指定可能。 // @ がぞうびょうが
    type: 'func',
    josi: [['の', 'を'], ['へ', 'に']],
    pure: true,
    fn: function (img, xy, sys) {
      if (!sys.__ctx) {throw new Error(errMsgCanvasInit)}
      const drawFunc = (im, ctx) => {
        if (xy.length === 2){
          ctx.drawImage(im, xy[0], xy[1])
        }
        else if (xy.length === 4) {
          ctx.drawImage(im, xy[0], xy[1], xy[2], xy[3])
        }
        else if (xy.length === 8) {
          ctx.drawImage(im, xy[0], xy[1], xy[2], xy[3], xy[4], xy[5], xy[6], xy[7])
        }
        else {
          throw new Error('『画像描画』の第二引数の配列要素は2,4,8個のいずれかです。')
        }
      }
      if (typeof img === 'string') {
        const image = new window.Image()
        image.src = img
        image.onload = () => {
          drawFunc(image, sys.__ctx)
        }
        return image
      } else {
        drawFunc(img, sys.__ctx)
        return img
      }
    },
    return_none: false
  },
  '画像部分描画': { // @ 画像IMG(またはURL)の座標[sx, sy, sw, sh]を描画先座標[dx, dy, dw, dh]へ描画し、Imageオブジェクトを返す // @ がぞうぶぶんびょうが
    type: 'func',
    josi: [['の'], ['を', 'から'], ['へ', 'に']],
    pure: true,
    fn: function (img, sxy, dxy, sys) {
      const errArgLen = 
        '『画像部分描画』に使える引数は画像と、描画する座標へ2つか、' +
        '描画する座標とその位置の4つか、使用する座標と使用する位置と描画する座標と大きさの8つだけです。'
      if(img && sxy){
        if (!Array.isArray(sxy) && Array.isArray(img)){ //逆になっていれば入れ替える
          if (typeof sxy === 'string' || String(sxy.__proto__) === '[object HTMLImageElement]'){
            let sw = img
            img = sxy
            sxy = sw
          }
        }
      }

      if (!sys.__ctx) {throw new Error(errMsgCanvasInit)}
      const drawFunc = (im, ctx) => {
        if (!dxy){
          if(!sxy){
            ctx.drawImage(im)
          }
          else if(sxy.length >= 2){ //もしsxyがあるのにdxyがなかったらdxyを代わりにする
            dxy = sxy
            sxy = undefined
          }
        }
        if (dxy.length === 2)
          {ctx.drawImage(im, dxy[0], dxy[1])}
        else if (dxy.length === 4) {
          if (!sxy) {
            ctx.drawImage(im, dxy[0], dxy[1], dxy[2], dxy[3])
          }
          else if (sxy.length === 4){
            ctx.drawImage(im, sxy[0], sxy[1], sxy[2], sxy[3], dxy[0], dxy[1], dxy[2], dxy[3])
          }
          else {throw new Error(errArgLen)}
        }
        else {throw new Error(errArgLen)}
      }
      if (typeof img === 'string') {
        const image = new window.Image()
        image.src = img
        image.onload = () => {
          drawFunc(image, sys.__ctx)
        }
        return image
      } else {
        drawFunc(img, sys.__ctx)
        return img
      }
    },
    return_none: false
  },
  '描画フォント設定': { // @ 描画フォントを指定する(CSSのフォント設定と同じ 例「36px Aria」)。フォントサイズのみの指定も可。 // @ びょうがふぉんとせってい
    type: 'func',
    josi: [['を', 'の', 'で', 'に']],
    pure: true,
    fn: function (n, sys) {
      // 数値だけならフォントサイズのみの指定
      if (typeof(n) === 'number') {
        n = n + 'px sans-serif'
      }
      // ピクセル数のみの指定なら適当にフォントを足す
      else if (/^[0-9]+(px|em)$/.test(n)) {
        n = n + ' sans-serif'
      }
      sys.__ctx.font = n
    },
    return_none: true
  },
  '文字描画': { // @ [x, y]へテキストSを描画する(描画フォント設定でサイズなど指定) // @ もじびょうが
    type: 'func',
    josi: [['へ', 'に'], ['の', 'を']],
    pure: true,
    fn: function (xy, s, sys) {
      if (!sys.__ctx) {throw new Error(errMsgCanvasInit)}
      sys.__ctx.fillText(s, xy[0], xy[1])
    },
    return_none: true
  },
  '文字描画幅取得': { // @ テキストSを指定して文字の描画幅を取得する // @ もじびょうがはばしゅとく
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (s, sys) {
      if (!sys.__ctx) {throw new Error(errMsgCanvasInit)}
      return sys.__ctx.measureText(s)
    },
    return_none: true
  },
  '描画起点設定': { // @ 描画位置の起点を[x,y]へ設定する(translate) // @ びょうがきてんせってい
    type: 'func',
    josi: [['へ', 'に']],
    pure: true,
    fn: function (xy, sys) {
      if (!sys.__ctx) {throw new Error(errMsgCanvasInit)}
      sys.__ctx.translate(xy[0],xy[1])
    },
    return_none: true
  },
  '描画回転': { // @ 描画内容をA度だけ回転する(rotate) // @ びょうがかいてん
    type: 'func',
    josi: [['だけ', 'に', 'へ']],
    pure: true,
    fn: function (a, sys) {
      if (!sys.__ctx) {throw new Error(errMsgCanvasInit)}
      sys.__ctx.rotate(a * Math.PI / 180)
    },
    return_none: true
  },
  '描画拡大': { // @ 描画内容を[x方向,y方向]だけ拡大する(scale) // @ びょうがかくだい
    type: 'func',
    josi: [['だけ', 'に', 'へ']],
    pure: true,
    fn: function (xy, sys) {
      if (!sys.__ctx) {throw new Error(errMsgCanvasInit)}
      sys.__ctx.scale(xy[0], xy[1])
    },
    return_none: true
  },
  '描画変換マトリクス設定': { // @ 描画内容を[a,b,c,d,e,f]の変換マトリクスに設定。既存内容を破棄して設定(setTransform) // @ びょうがへんかんまとりくすせってい
    type: 'func',
    josi: [['だけ', 'に', 'へ']],
    pure: true,
    fn: function (a, sys) {
      if (!sys.__ctx) {throw new Error(errMsgCanvasInit)}
      sys.__ctx.setTransform(a[0],a[1],a[2],a[3],a[4],a[5],a[6])
    },
    return_none: true
  },
  '描画変換マトリクス追加': { // @ 描画内容を[a,b,c,d,e,f]のマトリクスで変換。既存のマトリクスに掛け合わせる(transform) // @ びょうがへんかんまとりくすついか
    type: 'func',
    josi: [['だけ', 'に', 'へ']],
    pure: true,
    fn: function (a, sys) {
      if (!sys.__ctx) {throw new Error(errMsgCanvasInit)}
      sys.__ctx.transform(a[0],a[1],a[2],a[3],a[4],a[5],a[6])
    },
    return_none: true
  },
  '描画データURL変換': { // @ 描画内容をPNG形式のデータURLに変換して得る。 // @ びょうがでーたURLへんかん
    type: 'func',
    josi: [],
    pure: false,
    fn: function (sys) {
      const cv = sys.__v0['描画中キャンバス']
      const url = cv.toDataURL('image/png')
      return url
    }
  },
  '描画ダウンロードリンク作成': { // @ 描画内容をPNG形式のデータURLに変換してDOMに設定する。 // @ びょうがだうんろーどりんくさくせい
    type: 'func',
    josi: [['へ', 'に']],
    pure: false,
    fn: function (dom, sys) {
      if (typeof dom === 'string') { dom = document.querySelector(dom)}
      if (!dom){ throw new Error('『描画ダウンロードリンク作成』でDOMが見当たりません。')}
      const cv = sys.__v0['描画中キャンバス']
      dom.href = cv.toDataURL('image/png')
      dom.download = 'canvas.png'
    },
    return_none: true
  }
}
