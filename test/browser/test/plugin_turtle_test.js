/* global __html__ */
import { assert } from 'chai'
import NakoCompiler from 'nako3/nako3.js'
import { importStatus } from './import_plugin_checker.js'
import PluginTurtle from 'nako3/plugin_turtle'

const htmlPath = 'test/html/'
const imagePath = '/test/image/'

const waitTimer = (second) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, second * 1000)
  })
}

const setImageSmoothingEnabledToCtx = (ctx, value) => {
  ctx.mozImageSmoothingEnabled = value
  ctx.webkitImageSmoothingEnabled = value
  ctx.msImageSmoothingEnabled = value
  ctx.imageSmoothingEnabled = value
}

const getImageDataFromUrl = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      img.onload = null
      img.onerror = null
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      document.body.appendChild(canvas)
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.globalCompositeOperation = 'copy'
      setImageSmoothingEnabledToCtx(ctx, false)
      ctx.drawImage(img, 0, 0)

      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height))
    }
    img.onerror = () => {
      img.onload = null
      img.onerror = null
      reject(new Error('load error'))
    }
    img.src = url
  })
}

const getMergedCanvas = (canvasId, turtleIds) => {
  return new Promise((resolve, reject) => {
    const cv = document.getElementById(canvasId)

    if (cv == null) {
      reject(new Error('fail create canvas'))
      return
    }

    const rect = cv.getBoundingClientRect()
    const w = parseInt(cv.width, 10)
    const h = parseInt(cv.height, 10)
    const rx = rect.left + window.pageXOffset
    const ry = rect.top + window.pageYOffset

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    document.body.appendChild(canvas)

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, w, h)

    const ctxm = cv.getContext('2d')
    const imgdtm = ctxm.getImageData(0, 0, w, h)
    ctx.globalCompositeOperation = 'copy'
    setImageSmoothingEnabledToCtx(ctx, false)
    ctx.putImageData(imgdtm, 0, 0)
    ctx.globalCompositeOperation = 'source-over'

    turtleIds.forEach(turtleId => {
      const cvt = document.getElementById(turtleId)
      if (cvt) {
        const dx = parseInt(cvt.style.left, 10) - rx
        const dy = parseInt(cvt.style.top, 10) - ry
        ctx.drawImage(cvt, dx, dy)
      }
    })

    resolve(canvas)
  })
}

const recreateCanvas = src => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      img.onload = null
      img.onerror = null
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      setImageSmoothingEnabledToCtx(ctx, false)
      ctx.clearRect(0, 0, img.width, img.height)
      ctx.globalCompositeOperation = 'copy'
      ctx.drawImage(img, 0, 0)
      ctx.globalCompositeOperation = 'source-over'

      resolve(canvas)
    }
    img.onerror = () => {
      img.onload = null
      img.onerror = null
      reject(new Error('reload image error'))
    }
    img.src = src.toDataURL('image/png')
  })
}

const getBlobFromCanvas = (canvas, type) => {
  const dataurl = canvas.toDataURL(type)
  const bin = atob(dataurl.replace(/^.*,/, ''))
  const buffer = new Uint8Array(bin.length)
  for (let i = 0, l = bin.length; i < l; i++) {
    buffer[i] = bin.charCodeAt(i)
  }
  const blob = new Blob([buffer.buffer], {
    type: type
  })
  return blob
}

const uploadCanvasImage = async (canvas, filename) => {
  const formData = new FormData()
  const blob = getBlobFromCanvas(canvas, 'image/png')
  formData.append('file', blob, filename)
  const response = await fetch('/custom/uploadimage', {
    method: 'POST',
    body: formData
  })
  const result = await response.text()
  return result
}

describe('plugin_turtle_test', () => {
  let nako = null
  const matchmode = 'lazzy3'
  const cmpImageData = (imgData1, imgData2, invert) => {
    if (typeof invert === 'undefined') { invert = false }
    assert.strictEqual(imgData1.width, imgData2.width, 'images width unmatch')
    assert.strictEqual(imgData1.height, imgData2.height, 'images height unmatch')

    console.log(`brute match(${matchmode})`)
    let allmatch = true
    let i = 0
    for (let y = 0; y < imgData1.height; y++) {
      for (let x = 0; x < imgData1.width; x++, i += 4) {
        let nomatch = false
        if (matchmode === 'lazzy') {
          if ((imgData2.data[i + 3] !== 0 &&
               (Math.abs(imgData1.data[i + 0] - imgData2.data[i + 0]) > 10 ||
                Math.abs(imgData1.data[i + 1] - imgData2.data[i + 1]) > 10 ||
                Math.abs(imgData1.data[i + 2] - imgData2.data[i + 2]) > 10 ||
                Math.abs(imgData1.data[i + 3] - imgData2.data[i + 3]) > 10)) ||
              (imgData2.data[i + 3] === 0 && imgData1.data[i + 3] > 5)) {
            nomatch = true
          }
        } else
        if (matchmode === 'lazzy2') {
          if (imgData1.data[i + 3] === 255 &&
              imgData2.data[i + 3] === 255 &&
              (Math.abs(imgData1.data[i + 0] - imgData2.data[i + 0]) > 1 ||
               Math.abs(imgData1.data[i + 1] - imgData2.data[i + 1]) > 1 ||
               Math.abs(imgData1.data[i + 2] - imgData2.data[i + 2]) > 1)) {
            // 両画像が不透明なら、差異は各パレットで1まで
            nomatch = true
          } else
          if (imgData1.data[i + 3] === 0 &&
              imgData2.data[i + 3] === 255) {
            // 画像１が完全透明なら、画像２が不透明ではいけない。
            nomatch = true
          } else
          if (imgData1.data[i + 3] === 255 &&
              imgData2.data[i + 3] === 0) {
            // 画像１が不透明なら、画像２が完全透明ではいけない。
            nomatch = true
          }
        } else
        if (matchmode === 'lazzy3') {
          if (imgData1.data[i + 3] === 255 &&
              imgData2.data[i + 3] === 255 &&
              (Math.abs(imgData1.data[i + 0] - imgData2.data[i + 0]) > 48 ||
               Math.abs(imgData1.data[i + 1] - imgData2.data[i + 1]) > 48 ||
               Math.abs(imgData1.data[i + 2] - imgData2.data[i + 2]) > 48)) {
            // 両画像が不透明なら、差異は各パレットで48まで
            nomatch = true
          } else
          if (imgData1.data[i + 3] === 0 &&
              imgData2.data[i + 3] === 255) {
            // 画像１が完全透明なら、画像２が不透明ではいけない。
            nomatch = true
          } else
          if (imgData1.data[i + 3] === 255 &&
              imgData2.data[i + 3] === 0) {
            // 画像１が不透明なら、画像２が完全透明ではいけない。
            nomatch = true
          }
        } else {
          if (imgData1.data[i + 0] !== imgData2.data[i + 0] ||
              imgData1.data[i + 1] !== imgData2.data[i + 1] ||
              imgData1.data[i + 2] !== imgData2.data[i + 2] ||
              imgData1.data[i + 3] !== imgData2.data[i + 3]) {
            nomatch = true
          }
        }
        if (nomatch) {
          allmatch = false
          if (!invert) {
            console.log('unmacth(' + x + ',' + y + '):' +
                        (imgData1.data[i + 0] < 16 ? '0' : '') + (0 + imgData1.data[i + 0]).toString(16) +
                        (imgData1.data[i + 1] < 16 ? '0' : '') + (0 + imgData1.data[i + 1]).toString(16) +
                        (imgData1.data[i + 2] < 16 ? '0' : '') + (0 + imgData1.data[i + 2]).toString(16) +
                        (imgData1.data[i + 3] < 16 ? '0' : '') + (0 + imgData1.data[i + 3]).toString(16) +
                        ':' +
                        (imgData2.data[i + 0] < 16 ? '0' : '') + (0 + imgData2.data[i + 0]).toString(16) +
                        (imgData2.data[i + 1] < 16 ? '0' : '') + (0 + imgData2.data[i + 1]).toString(16) +
                        (imgData2.data[i + 2] < 16 ? '0' : '') + (0 + imgData2.data[i + 2]).toString(16) +
                        (imgData2.data[i + 3] < 16 ? '0' : '') + (0 + imgData2.data[i + 3]).toString(16) +
                        ',' + i)
          }
        }
      }
    }
    if (!invert) {
      assert.ok(allmatch, 'image nomatch')
    } else {
      assert.ok(!allmatch, 'image match')
    }
  }
  afterEach(() => {
    nako = null
  })
  beforeEach(() => {
    nako = new NakoCompiler()
    // const pluginClone = Object.assign({}, PluginTurtle)
    // nako.addPluginFile('PluginTurtle', 'plugin_turtle.js', pluginClone)
    nako.addPluginFile('PluginTurtle', 'plugin_turtle.js', PluginTurtle)
    nako.addFunc('getElementyID', [['の']], (id, sys) => {
      return document.getElementById(id)
    })
    nako.addFunc('smoothオフ', [['の']], (id, sys) => {
      let ctx = null
      if (id >= 0) {
        if (id < sys._turtle.list.length) {
          ctx = sys._turtle.list[id].ctx
        }
      } else {
        ctx = sys._turtle.ctx
      }
      if (ctx) {
        setImageSmoothingEnabledToCtx(ctx, false)
      }
      return id
    })
  })

  // --- test ---
  it('check env(canvas_basic.html)', () => {
    document.body.innerHTML = __html__[htmlPath + 'canvas_basic.html']
    const canvasElement = document.getElementById('turtle_cv')
    assert.strictEqual(typeof (canvasElement), 'object')
  })

  it('auto import for browser', () => {
    const pluginName = 'PluginTurtle'
    const imported = importStatus.hasImport(pluginName)
    assert.ok(imported, 'was import')
    const autoImport = importStatus.getAutoImport(pluginName)
    assert.strictEqual(typeof (autoImport.obj), 'object')
  })

  it('set origin and direcion', async () => {
    document.body.innerHTML = __html__[htmlPath + 'canvas_basic.html']
    const imgname = 'canvas_test1.png'
    const code = `カメ描画先=「turtle_cv」
０にカメ速度設定。
カメ画像URLは、「turtle.png」
カメ作成。それのsmoothオフ。-1のsmoothオフ。
[30,30]にカメ起点移動。
180にカメ角度設定。
`
    nako.run(code)

    await waitTimer(1)

    const dataPromise = getImageDataFromUrl(imagePath + imgname)
    const cvPromise = getMergedCanvas('turtle_cv', ['0'])
    const [data, cv] = await Promise.all([dataPromise, cvPromise])

    const cv2 = await recreateCanvas(cv)
    const w = parseInt(cv2.width, 10)
    const h = parseInt(cv2.height, 10)
    const ctx = cv2.getContext('2d')

    const actData = ctx.getImageData(0, 0, w, h)

    try {
      const rslt = await uploadCanvasImage(cv, imgname)
      if (rslt !== 'OK') {
        console.log('upload result:' + rslt)
      }
    } catch (ex) {
      console.log('upload error')
      console.log(ex)
    }

    cmpImageData(actData, data)
  }).timeout(5000)

  it('incorrect canvasid', () => {
    document.body.innerHTML = __html__[htmlPath + 'canvas_basic.html']
    const code = `カメ描画先=「no_cv」
０にカメ速度設定。
カメ作成。
`
    assert.throws(() => { nako.run(code) }, Error)
  })

  it('incorrect command', () => {
    document.body.innerHTML = __html__[htmlPath + 'canvas_basic.html']
    const code = `カメ描画先=「turtle_cv」
０にカメ速度設定。
[25,25]にカメ起点移動。
`
    assert.throws(() => { nako.run(code) }, Error)
  })

  it('set origin and direcion turtles', async () => {
    document.body.innerHTML = __html__[htmlPath + 'canvas_basic.html']
    const imgname = 'canvas_test2.png'
    const code = `カメ描画先=「#turtle_cv」
０にカメ速度設定。
カメ画像URLは、「turtle.png」
カメ作成。それのsmoothオフ。-1のsmoothオフ。
[25,25]にカメ起点移動。
180にカメ角度設定。
カメ画像URLは、「turtle-elephant.png」
カメ作成。それのsmoothオフ。それにカメ操作対象設定。
[75,25]にカメ起点移動。
90にカメ角度設定。
カメ画像URLは、「turtle-panda.png」
カメ作成。それのsmoothオフ。それにカメ操作対象設定。
[50,75]にカメ起点移動。
0にカメ角度設定。
`
    nako.run(code)

    await waitTimer(1.8)

    const dataPromise = getImageDataFromUrl(imagePath + imgname)
    const cvPromise = getMergedCanvas('turtle_cv', ['0', '1', '2'])
    const [data, cv] = await Promise.all([dataPromise, cvPromise])

    const cv2 = await recreateCanvas(cv)
    const w = parseInt(cv2.width, 10)
    const h = parseInt(cv2.height, 10)
    const ctx = cv2.getContext('2d')

    const actData = ctx.getImageData(0, 0, w, h)

    try {
      const rslt = await uploadCanvasImage(cv, imgname)
      if (rslt !== 'OK') {
        console.log('upload result:' + rslt)
      }
    } catch (ex) {
      console.log('upload error')
      console.log(ex)
    }

    cmpImageData(actData, data)
  }).timeout(5000)

  it('move direct position turtles', async () => {
    document.body.innerHTML = __html__[htmlPath + 'canvas_basic.html']
    const imgname = 'canvas_test3.png'
    const code = `カメ描画先=「turtle_cv」のgetElementyID
０にカメ速度設定。
カメ画像URLは、「turtle.png」
カメ作成。それのsmoothオフ。-1のsmoothオフ。
[25,75]にカメ起点移動。
[25,25]にカメ移動。
カメ画像URLは、「turtle-elephant.png」
カメ作成。それのsmoothオフ。それにカメ操作対象設定。
[25,75]にカメ起点移動。
[75,75]にカメ移動。
カメ画像URLは、「turtle-panda.png」
カメ作成。それのsmoothオフ。それにカメ操作対象設定。
[25,75]にカメ起点移動。
[75,25]にカメ移動。
`
    nako.run(code)

    await waitTimer(2.0)

    const dataPromise = getImageDataFromUrl(imagePath + imgname)
    const cvPromise = getMergedCanvas('turtle_cv', ['0', '1', '2'])
    const [data, cv] = await Promise.all([dataPromise, cvPromise])

    const cv2 = await recreateCanvas(cv)
    const w = parseInt(cv2.width, 10)
    const h = parseInt(cv2.height, 10)
    const ctx = cv2.getContext('2d')

    const actData = ctx.getImageData(0, 0, w, h)

    try {
      const rslt = await uploadCanvasImage(cv, imgname)
      if (rslt !== 'OK') {
        console.log('upload result:' + rslt)
      }
    } catch (ex) {
      console.log('upload error')
      console.log(ex)
    }

    cmpImageData(actData, data)
  }).timeout(5000)

  it('check move,rotate,visible,color,width', async () => {
    document.body.innerHTML = __html__[htmlPath + 'canvas_basic.html']
    const imgname = 'canvas_test4.png'
    const code = `カメ描画先=「turtle_cv」
１０にカメ速度設定。
カメ画像URLは、「turtle.png」
カメ作成。それのsmoothオフ。-1のsmoothオフ。
[10,10]にカメ起点移動。90にカメ角度設定。
3にカメペンサイズ設定。
「#000」にカメペン色設定。
10だけカメ進む。
30だけカメ右回転。
15だけカメ進む。
45だけカメ左回転。
0にカメペン設定。
15だけカメ戻る。
1にカメペン設定。
2にカメペンサイズ設定。
「#F00」にカメペン色設定。
15だけカメ右回転。
30だけカメ進む。
カメ非表示。
カメ画像URLは、「turtle-elephant.png」
カメ作成。それのsmoothオフ。それにカメ操作対象設定。
[75,75]にカメ起点移動。
カメ非表示。
カメ表示。
`
    nako.run(code)

    await waitTimer(2.0)

    const dataPromise = getImageDataFromUrl(imagePath + imgname)
    const cvPromise = getMergedCanvas('turtle_cv', ['0', '1'])
    const [data, cv] = await Promise.all([dataPromise, cvPromise])

    const cv2 = await recreateCanvas(cv)
    const w = parseInt(cv2.width, 10)
    const h = parseInt(cv2.height, 10)
    const ctx = cv2.getContext('2d')

    const actData = ctx.getImageData(0, 0, w, h)

    try {
      const rslt = await uploadCanvasImage(cv, imgname)
      if (rslt !== 'OK') {
        console.log('upload result:' + rslt)
      }
    } catch (ex) {
      console.log('upload error')
      console.log(ex)
    }

    cmpImageData(actData, data)
  }).timeout(5000)

  it('check all clear', async () => {
    document.body.innerHTML = __html__[htmlPath + 'canvas_basic.html']
    const imgname = 'canvas_test5_wasblank.png'
    const code = `カメ描画先=「turtle_cv」
０にカメ速度設定。
カメ画像URLは、「turtle.png」
カメ作成。それのsmoothオフ。-1のsmoothオフ。
[25,75]にカメ起点移動。
[75,25]にカメ移動。
135だけカメ左回転
50だけカメ進む
90だけカメ左回転
25だけカメ進む
カメ表示。
カメ全消去。
`
    nako.run(code)

    await waitTimer(1.0)

    const dataPromise = getImageDataFromUrl(imagePath + 'canvas_test_blank.png')
    const cvPromise = getMergedCanvas('turtle_cv', ['0', '1', '2'])
    const [data, cv] = await Promise.all([dataPromise, cvPromise])

    const cv2 = await recreateCanvas(cv)
    const w = parseInt(cv2.width, 10)
    const h = parseInt(cv2.height, 10)
    const ctx = cv2.getContext('2d')

    const actData = ctx.getImageData(0, 0, w, h)

    try {
      const rslt = await uploadCanvasImage(cv, imgname)
      if (rslt !== 'OK') {
        console.log('upload result:' + rslt)
      }
    } catch (ex) {
      console.log('upload error')
      console.log(ex)
    }

    cmpImageData(actData, data)
  })

  it('check all clear before use', async () => {
    document.body.innerHTML = __html__[htmlPath + 'canvas_basic.html']
    const imgname = 'canvas_test6_wasblank.png'
    const code = `カメ描画先=「turtle_cv」
カメ画像URLは、「turtle.png」
０にカメ速度設定。
カメ全消去。
`
    nako.run(code)

    await waitTimer(1.0)

    const dataPromise = getImageDataFromUrl(imagePath + 'canvas_test_blank.png')
    const cvPromise = getMergedCanvas('turtle_cv', ['0', '1', '2'])
    const [data, cv] = await Promise.all([dataPromise, cvPromise])

    const cv2 = await recreateCanvas(cv)
    const w = parseInt(cv2.width, 10)
    const h = parseInt(cv2.height, 10)
    const ctx = cv2.getContext('2d')

    const actData = ctx.getImageData(0, 0, w, h)

    try {
      const rslt = await uploadCanvasImage(cv, imgname)
      if (rslt !== 'OK') {
        console.log('upload result:' + rslt)
      }
    } catch (ex) {
      console.log('upload error')
      console.log(ex)
    }

    cmpImageData(actData, data)
  }).timeout(5000)

  it('change turtle image delayed', async () => {
    document.body.innerHTML = __html__[htmlPath + 'canvas_basic.html']
    const imgname = 'canvas_test7.png'
    const code = `カメ描画先=「turtle_cv」
１にカメ速度設定。
カメ画像URLは、「turtle.png」
カメ作成。それのsmoothオフ。-1のsmoothオフ。
「/custom/delayedimage/turtle-elephant.png」にカメ画像変更
[50,50]にカメ起点移動。270にカメ角度設定。
`
    nako.run(code)

    await waitTimer(2.0)

    const dataPromise = getImageDataFromUrl(imagePath + imgname)
    const cvPromise = getMergedCanvas('turtle_cv', ['0'])
    const [data, cv] = await Promise.all([dataPromise, cvPromise])

    const cv2 = await recreateCanvas(cv)
    const w = parseInt(cv2.width, 10)
    const h = parseInt(cv2.height, 10)
    const ctx = cv2.getContext('2d')

    const actData = ctx.getImageData(0, 0, w, h)

    try {
      const rslt = await uploadCanvasImage(cv, imgname)
      if (rslt !== 'OK') {
        console.log('upload result:' + rslt)
      }
    } catch (ex) {
      console.log('upload error')
      console.log(ex)
    }

    cmpImageData(actData, data)
  }).timeout(5000)

  it('change turtle image', async () => {
    document.body.innerHTML = __html__[htmlPath + 'canvas_basic.html']
    const imgname = 'canvas_test8.png'
    const code = `カメ描画先=「turtle_cv」
０にカメ速度設定。
カメ画像URLは、「turtle.png」
カメ作成。それのsmoothオフ。-1のsmoothオフ。
[50,50]にカメ起点移動。270にカメ角度設定。
「turtle-elephant.png」にカメ画像変更
`
    nako.run(code)

    await waitTimer(2.0)

    const dataPromise = getImageDataFromUrl(imagePath + imgname)
    const cvPromise = getMergedCanvas('turtle_cv', ['0'])
    const [data, cv] = await Promise.all([dataPromise, cvPromise])

    const cv2 = await recreateCanvas(cv)
    const w = parseInt(cv2.width, 10)
    const h = parseInt(cv2.height, 10)
    const ctx = cv2.getContext('2d')

    const actData = ctx.getImageData(0, 0, w, h)

    try {
      const rslt = await uploadCanvasImage(cv, imgname)
      if (rslt !== 'OK') {
        console.log('upload result:' + rslt)
      }
    } catch (ex) {
      console.log('upload error')
      console.log(ex)
    }

    cmpImageData(actData, data)
  }).timeout(5000)

  it('load fail turtle image', async () => {
    document.body.innerHTML = __html__[htmlPath + 'canvas_basic.html']
    const imgname = 'canvas_test9_wasblank.png'
    const code = `カメ描画先=「turtle_cv」
０にカメ速度設定。
カメ画像URLは、「no_exists.png」
カメ作成。
[50,50]にカメ起点移動。270にカメ角度設定。
`
    nako.run(code)

    await waitTimer(2.0)

    const dataPromise = getImageDataFromUrl(imagePath + 'canvas_test_blank.png')
    const cvPromise = getMergedCanvas('turtle_cv', ['0'])
    const [data, cv] = await Promise.all([dataPromise, cvPromise])

    const cv2 = await recreateCanvas(cv)
    const w = parseInt(cv2.width, 10)
    const h = parseInt(cv2.height, 10)
    const ctx = cv2.getContext('2d')

    const actData = ctx.getImageData(0, 0, w, h)

    try {
      const rslt = await uploadCanvasImage(cv, imgname)
      if (rslt !== 'OK') {
        console.log('upload result:' + rslt)
      }
    } catch (ex) {
      console.log('upload error')
      console.log(ex)
    }

    cmpImageData(actData, data)
  }).timeout(5000)

  it('click turtle', async () => {
    document.body.innerHTML = __html__[htmlPath + 'canvas_basic.html']
    const code = `カメ描画先=「turtle_cv」
０にカメ速度設定。
カメ作成。
[50,50]にカメ起点移動。270にカメ角度設定。
カメクリック時には、
対象を報告
ここまで
`
    let funcCalled = false
    let target = -1
    nako.addFunc('報告', [['を']], (ttcanvas) => {
      funcCalled = true
      target = ttcanvas
    })
    nako.run(code)

    await waitTimer(1.0)
    const e = document.getElementById('0')
    if (e) {
      e.click()
    }
    await waitTimer(1.0)

    assert.ok(funcCalled, 'イベント呼び出し')
    assert.strictEqual(target.id, '0', 'イベント対象のカメID')
  }).timeout(5000)

  it('turtle image basic(turtle)', async () => {
    document.body.innerHTML = __html__[htmlPath + 'canvas_basic.html']
    const imgname = 'canvas_test10_wasnotblank.png'
    const code = `カメ描画先=「turtle_cv」
０にカメ速度設定。
カメ作成。
[50,50]にカメ起点移動。90にカメ角度設定。
`
    nako.run(code)

    await waitTimer(1.0)

    const dataPromise = getImageDataFromUrl(imagePath + 'canvas_test_blank.png')
    const cvPromise = getMergedCanvas('turtle_cv', ['0'])
    const [data, cv] = await Promise.all([dataPromise, cvPromise])

    const cv2 = await recreateCanvas(cv)
    const w = parseInt(cv2.width, 10)
    const h = parseInt(cv2.height, 10)
    const ctx = cv2.getContext('2d')

    const actData = ctx.getImageData(0, 0, w, h)

    try {
      const rslt = await uploadCanvasImage(cv, imgname)
      if (rslt !== 'OK') {
        console.log('upload result:' + rslt)
      }
    } catch (ex) {
      console.log('upload error')
      console.log(ex)
    }

    cmpImageData(actData, data, true)
  }).timeout(5000)

  it('turtle image extend(elephant)', async () => {
    document.body.innerHTML = __html__[htmlPath + 'canvas_basic.html']
    const imgname = 'canvas_test11_wasnotblank.png'
    const code = `カメ描画先=「turtle_cv」
０にカメ速度設定。
ゾウ作成。
[50,50]にカメ起点移動。270にカメ角度設定。
`
    nako.run(code)

    await waitTimer(1.0)

    const dataPromise = getImageDataFromUrl(imagePath + 'canvas_test_blank.png')
    const cvPromise = getMergedCanvas('turtle_cv', ['0'])
    const [data, cv] = await Promise.all([dataPromise, cvPromise])

    const cv2 = await recreateCanvas(cv)
    const w = parseInt(cv2.width, 10)
    const h = parseInt(cv2.height, 10)
    const ctx = cv2.getContext('2d')

    const actData = ctx.getImageData(0, 0, w, h)

    try {
      const rslt = await uploadCanvasImage(cv, imgname)
      if (rslt !== 'OK') {
        console.log('upload result:' + rslt)
      }
    } catch (ex) {
      console.log('upload error')
      console.log(ex)
    }

    cmpImageData(actData, data, true)
  }).timeout(5000)

  it('turtle image extend(panda)', async () => {
    document.body.innerHTML = __html__[htmlPath + 'canvas_basic.html']
    const imgname = 'canvas_test12_wasnotblank.png'
    const code = `カメ描画先=「turtle_cv」
０にカメ速度設定。
パンダ作成。
[50,50]にカメ起点移動。180にカメ角度設定。
`
    nako.run(code)

    await waitTimer(1.0)

    const dataPromise = getImageDataFromUrl(imagePath + 'canvas_test_blank.png')
    const cvPromise = getMergedCanvas('turtle_cv', ['0'])
    const [data, cv] = await Promise.all([dataPromise, cvPromise])

    const cv2 = await recreateCanvas(cv)
    const w = parseInt(cv2.width, 10)
    const h = parseInt(cv2.height, 10)
    const ctx = cv2.getContext('2d')

    const actData = ctx.getImageData(0, 0, w, h)

    try {
      const rslt = await uploadCanvasImage(cv, imgname)
      if (rslt !== 'OK') {
        console.log('upload result:' + rslt)
      }
    } catch (ex) {
      console.log('upload error')
      console.log(ex)
    }

    cmpImageData(actData, data, true)
  }).timeout(5000)
})
