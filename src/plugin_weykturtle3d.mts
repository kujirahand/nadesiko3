/**
 * PluginWeykTurtle3D
 * 3d turtle graphics plugin
 */

import type { NakoSystem as NakoSystemBase } from '../core/src/plugin_api.mjs'

import { ThreeUtil } from './plugin_three.mjs' 
import type { THREENS } from './plugin_three.mjs'

declare global {
  interface Navigator {
    nako3: { addPluginObject: (name: string, obj: object) => {} }
  }
  interface Window {
    THREE?: THREENS.THREE
  }
}

interface NakoSystem extends NakoSystemBase {
  tags: { weykturtle3d?: WeykTurtle3DSystem }
}

type NakoRumtimeName = 'wnako'|'cnako'
interface NakoVariables {
  type: 'const'|'var'
  value: any
}
interface NakoFunction {
  type: 'func'
  josi: []|string[][]
  asyncFn?: boolean
  pure?: boolean
  fn: any
  return_none?: boolean
}
interface NakoMeta {
  type: 'const'
  value: {
    pluginName: string
    description: string
    pluginVersion: string
    nakoRuntime: NakoRumtimeName[]
    nakoVersion: string
  }
}
interface NakoPluginObject {
  [ index: string]: NakoVariables|NakoFunction|NakoMeta
}

class DrawLineEventArgs {
  v1: THREENS.Vector3
  v2: THREENS.Vector3
  width: number
  color: THREENS.Color
  constructor (v1: THREENS.Vector3, v2: THREENS.Vector3, width: number, color: THREENS.Color) {
    this.v1 = v1
    this.v2 = v2
    this.width = width
    this.color = color
  }
}

interface Turtle3DEventMap {
  modelChanged: CustomEvent<void>
  drawLine: CustomEvent<DrawLineEventArgs>
}

interface Turtle3D extends EventTarget {
  addEventListener<K extends keyof Turtle3DEventMap>(
     type: K,
     listener: ((this: Turtle3D, evt: Turtle3DEventMap[K]) => any) | null,
     options?: boolean | EventListenerOptions,): void
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void
  dispatchEvent<K extends keyof Turtle3DEventMap>(evt: Turtle3DEventMap[K]): boolean
  removeListener<K extends keyof Turtle3DEventMap>(
     type: K,
     listener: (this: Turtle3D, evt: Turtle3DEventMap[K]) => any,
     options?: boolean | EventListenerOptions,): void
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void
}

class Turtle3D extends EventTarget {
  private three: THREENS.THREE
  id: number
  obj: THREENS.Object3D
  disposal: boolean
  home: { position: THREENS.Vector3, quaternion: THREENS.Quaternion }
  color: THREENS.Color
  lineWidth: number
  flagDown: boolean
  flagLoaded: boolean
  f_visible: boolean
  macros: any[]

  constructor(three: THREENS.THREE, id: number) {
    super()
    this.three = three
    this.id = id
    const modelBase = new three.Group()
    this.obj = modelBase
    this.home = {
      position: new three.Vector3(0, 0, 0),
      quaternion: new three.Quaternion()
    }
    this.color = new three.Color(0xffffff)
    this.disposal = false
    this.lineWidth = 4
    this.flagDown = true
    this.flagLoaded = false
    this.f_visible = true
    this.macros = []

    this.home.position.copy(modelBase.position)
    this.home.quaternion.copy(modelBase.quaternion)
  }

  loadTurtle (model: THREENS.Object3D|string) {
    if (this.isObject3D(model)) {
      if (this.disposal) {
        ThreeUtil.disposeChildObject(this.obj)
      } else {
        this.obj = new this.three.Group()
      }
      const obj = model
      this.obj.add(obj)
      this.disposal = false
      this.flagLoaded = true
      this.raiseModelChanged()
      return
    }
    const url = model
    if (url.length === 0) {
      if (this.disposal) {
        ThreeUtil.disposeChildObject(this.obj)
      } else {
        this.obj = new this.three.Group()
      }
      const obj = this.createDefaultTurtle()
      this.obj.add(obj)
      this.disposal = true
      this.flagLoaded = true
      this.raiseModelChanged()
      return
    }
    const loader = new this.three.ObjectLoader()
    loader.load(url, (obj: THREENS.Object3D) => {
      if (this.disposal) {
        ThreeUtil.disposeChildObject(this.obj)
      } else {
        this.obj = new this.three.Group()
      }
      this.obj.add(obj)
      this.disposal = true
      this.flagLoaded = true
      this.raiseModelChanged()
    }, (xhr: XMLHttpRequest) => {
      // nothing
    }, (xhr: XMLHttpRequest) => {
      this.flagLoaded = true
      this.f_visible = false
      this.obj.visible = false
      if (this.disposal) {
        ThreeUtil.disposeChildObject(this.obj)
      } else {
        this.obj = new this.three.Group()
      }
      this.disposal = false
      this.raiseModelChanged()
    })
  }

  doMacro (wait: number) {
    if (!this.flagLoaded && wait > 0) {
      return true
    }
    const m = this.macros.shift()
    const cmd = (m !== undefined) ? m[0] : ''
    switch (cmd) {
      case 'xyz':
        // 起点を移動する
        this.obj.position.copy(m[1])
        break
      case 'mv': {
        const v1 = this.obj.position.clone()
        const v2 = m[1]
        // 線を引く
        this.line(v1, v2)
        // カメの角度を変更
        this.obj.lookAt(v2)
        const headup90 = new this.three.Quaternion()
        const axisX = new this.three.Vector3(1, 0, 0)
        headup90.setFromAxisAngle(axisX, Math.PI / 2)
        this.obj.quaternion.multiply(headup90)
        // カメを移動
        this.obj.position.copy(v2)
        break
      }
      case 'fd': {
        const v1 = this.obj.position.clone()
        const v2 =new this.three.Vector3(0, m[1] * m[2], 0)
        v2.applyQuaternion(this.obj.quaternion)
        v2.add(v1)
        this.line(v1, v2)
        this.obj.position.copy(v2)
        break
      }
      case 'su': {
        const v1 = this.obj.position.clone()
        const v2 = new this.three.Vector3(0, m[1], 0)
        const modifier = new this.three.Quaternion()
        const axis = new this.three.Vector3(1, 0, 0)
        modifier.setFromAxisAngle(axis, (-90) * Math.PI / 180)
        const target = this.obj.quaternion.clone()
        target.multiply(modifier)
        v2.applyQuaternion(target)
        v2.add(v1)
        this.line(v1, v2)
        this.obj.position.copy(v2)
        break
      }
      case 'sd': {
        const v1 = this.obj.position.clone()
        const v2 = new this.three.Vector3(0, m[1], 0)
        const modifier = new this.three.Quaternion()
        const axis = new this.three.Vector3(1, 0, 0)
        modifier.setFromAxisAngle(axis, 90 * Math.PI / 180)
        const target = this.obj.quaternion.clone()
        target.multiply(modifier)
        v2.applyQuaternion(target)
        v2.add(v1)
        this.line(v1, v2)
        this.obj.position.copy(v2)
        break
      }
      case 'sl': {
        const v1 = this.obj.position.clone()
        const v2 = new this.three.Vector3(0, m[1], 0)
        const modifier = new this.three.Quaternion()
        const axis = new this.three.Vector3(0, 0, 1)
        modifier.setFromAxisAngle(axis, 90 * Math.PI / 180)
        const target = this.obj.quaternion.clone()
        target.multiply(modifier)
        v2.applyQuaternion(target)
        v2.add(v1)
        this.line(v1, v2)
        this.obj.position.copy(v2)
        break
      }
      case 'sr': {
        const v1 = this.obj.position.clone()
        const v2 = new this.three.Vector3(0, m[1], 0)
        const modifier = new this.three.Quaternion()
        const axis = new this.three.Vector3(0, 0, 1)
        modifier.setFromAxisAngle(axis, (-90) * Math.PI / 180)
        const target = this.obj.quaternion.clone()
        target.multiply(modifier)
        v2.applyQuaternion(target)
        v2.add(v1)
        this.line(v1, v2)
        this.obj.position.copy(v2)
        break
      }
      case 'angle': {
        const euler = new this.three.Euler()
        euler.fromArray(m[1])
        // eslint-disable-next-line no-unused-vars
        const dir = new this.three.Quaternion()
        this.obj.quaternion.setFromEuler(euler)
        break
      }
      case 'rotr': {
        const rv = m[1]
        const target = new this.three.Quaternion()
        const axis = new this.three.Vector3(0, 0, 1)
        target.setFromAxisAngle(axis, (-rv % 360) * Math.PI / 180)
        this.obj.quaternion.multiply(target)
        break
      }
      case 'rotl': {
        const rv = m[1]
        const target = new this.three.Quaternion()
        const axis = new this.three.Vector3(0, 0, 1)
        target.setFromAxisAngle(axis, (rv % 360) * Math.PI / 180)
        this.obj.quaternion.multiply(target)
        break
      }
      case 'rotu': {
        const rv = m[1]
        const target = new this.three.Quaternion()
        const axis = new this.three.Vector3(1, 0, 0)
        target.setFromAxisAngle(axis, (-rv % 360) * Math.PI / 180)
        this.obj.quaternion.multiply(target)
        break
      }
      case 'rotd': {
        const rv = m[1]
        const target = new this.three.Quaternion()
        const axis = new this.three.Vector3(1, 0, 0)
        target.setFromAxisAngle(axis, (rv % 360) * Math.PI / 180)
        this.obj.quaternion.multiply(target)
        break
      }
      case 'rolr': {
        const rv = m[1]
        const target = new this.three.Quaternion()
        const axis = new this.three.Vector3(0, 1, 0)
        target.setFromAxisAngle(axis, (rv % 360) * Math.PI / 180)
        this.obj.quaternion.multiply(target)
        break
      }
      case 'roll': {
        const rv = m[1]
        const target = new this.three.Quaternion()
        const axis = new this.three.Vector3(0, 1, 0)
        target.setFromAxisAngle(axis, (-rv % 360) * Math.PI / 180)
        this.obj.quaternion.multiply(target)
        break
      }
      case 'color':
        this.color = new this.three.Color(m[1])
        break
      case 'size':
        this.lineWidth = m[1]
        break
      case 'penOn':
        this.flagDown = m[1]
        break
      case 'visible':
        this.f_visible = m[1]
        if (this.f_visible) {
          this.obj.visible = true
        } else {
          this.obj.visible = false
        }
        break
      case 'changeModel':
        this.flagLoaded = false
        this.loadTurtle(m[1])
        break
/*
      case 'changeCamera':
        this.camera = m[1]
        break
*/
      case 'sethome':
        this.home.position.copy(this.obj.position)
        this.home.quaternion.copy(this.obj.quaternion)
        break
      case 'gohome':
        this.obj.position.copy(this.home.position)
        this.obj.quaternion.copy(this.home.quaternion)
        break
    }
    return (this.macros.length > 0)
  }

  private createDefaultTurtle (): THREENS.Object3D {
    const vertices = new Float32Array([
      0.0, 1.0, 0.0,
      -0.6, -1.0, 0.0,
      0.0, -0.5, 0.0,
      0.6, -1.0, 0.0,

      0.0, 0.0, 0.5,
      0.0, 1.0, 0.0,
      -0.6, -1.0, 0.0,
      0.0, -0.5, 0.0,
      0.6, -1.0, 0.0,

      0.0, 0.0, -0.5,
      0.0, 1.0, 0.0,
      -0.6, -1.0, 0.0,
      0.0, -0.5, 0.0,
      0.6, -1.0, 0.0
    ])

    const colors = new Float32Array([
      0.0, 1.0, 0.0,
      0.0, 1.0, 0.0,
      0.0, 1.0, 0.0,
      0.0, 1.0, 0.0,

      1.0, 0.0, 0.0,
      1.0, 0.0, 0.0,
      1.0, 0.0, 0.0,
      1.0, 0.0, 0.0,
      1.0, 0.0, 0.0,

      0.0, 0.0, 1.0,
      0.0, 0.0, 1.0,
      0.0, 0.0, 1.0,
      0.0, 0.0, 1.0,
      0.0, 0.0, 1.0
    ])

    const indices = [
      0, 1, 1, 2, 2, 3, 3, 0,
      4, 5, 4, 6, 4, 7, 4, 8,
      9, 10, 9, 11, 9, 12, 9, 13
    ]

    const obj = new this.three.Group()
    const material = new this.three.LineBasicMaterial({ vertexColors: true })
    const geometry = new this.three.BufferGeometry()
    geometry.setIndex(indices)
    geometry.setAttribute('position', new this.three.BufferAttribute(vertices, 3))
    geometry.setAttribute('color', new this.three.BufferAttribute(colors, 3))
    geometry.computeBoundingSphere()

    const lineSegments = new this.three.LineSegments(geometry, material)
    lineSegments.scale.set(30.0, 30.0, 30.0)

    obj.add(lineSegments)
    return obj
  }

  private raiseModelChanged (): void {
    const evt = new CustomEvent<void>('modelChanged')
    this.dispatchEvent(evt)
  }

  private raiseDrawLine(v1: THREENS.Vector3, v2: THREENS.Vector3, width: number, color: THREENS.Color) : void {
    const args = new DrawLineEventArgs(v1, v2, width, color)
    const evt = new CustomEvent<DrawLineEventArgs>('drawLine', { detail: args })
    this.dispatchEvent(evt)
  }

  private line (v1: THREENS.Vector3, v2: THREENS.Vector3) {
    if (!this.flagDown) { return }
    this.raiseDrawLine(v1, v2, this.lineWidth, this.color)
  }

  private isObject3D (obj: any): obj is THREENS.Object3D {
    return obj instanceof this.three.Object3D
  }
}

class WeykTurtle3DSystem {
  private static instance: WeykTurtle3DSystem
  private instanceCount: number
  sys: NakoSystem
  three: null|THREENS.THREE
  containerid: string
  camera: number
  target: number
  _renderer: THREENS.Renderer|null
  _scene: THREENS.Scene|null
  _lines: THREENS.Line|null
  _camera: THREENS.Camera|null
  _controls: THREENS.Controls|null
  _camerahelper: THREENS.CameraHelper|null
  _axishelper: THREENS.AxesHelper|null
  turtles: Turtle3D[]
  flagSetTimer: boolean
  _prevUpdatedTime: number

  static getInstance(sys: NakoSystem) {
    if (WeykTurtle3DSystem.instance === undefined) {
      WeykTurtle3DSystem.instance = new WeykTurtle3DSystem(sys);
    }
    const i = WeykTurtle3DSystem.instance;
    i.instanceCount += 1;
    return WeykTurtle3DSystem.instance;
  }

  constructor(sys: NakoSystem) {
    this.instanceCount = 0
    this.three = null
    this.sys = sys
    this.containerid = ''
    this.camera = -1
    this.target = -1
    this._renderer = null
    this._scene = null
    this._lines = null
    this._camera = null
    this._controls = null
    this._camerahelper = null
    this._axishelper = null
    this.turtles = []
    this.flagSetTimer = false
    this._prevUpdatedTime = 0
  }

  clearAll () {
    this.disposeAllTurtle()
    this.disposeAllLine()
    const scene = this._scene
    if (scene && this._lines) {
      scene.remove(this._lines)
      scene.add(this._lines)
      if (this._camerahelper !== null) {
        this._camerahelper.visible = false
        scene.remove(this._camerahelper)
        scene.add(this._camerahelper)
      }
      if (this._axishelper !== null) {
        this._axishelper.visible = false
        scene.remove(this._axishelper)
        scene.add(this._axishelper)
      }
      this.initTurtle()
    }
  }
  disposeAllTurtle () {
    // カメをクリア
    for (let i = 0; i < this.turtles.length; i++) {
      const tt = this.turtles[i]
      tt.macros = [] // ジョブをクリア
      // かめのモデルをカメから削除
      ThreeUtil.disposeChildObject(tt.obj)
    }
    this.turtles = []
    this.target = -1
    this.camera = -1
    this.flagSetTimer = false
  }
  disposeAllLine () {
    // 引いた線を線用のバッファからクリア
    if (this._lines !== null) {
      ThreeUtil.disposeChildObject(this._lines)
    }
  }
  private getThree(): THREENS.THREE {
    if (!this.three) {
      throw new Error('ThreeJSの準備される前に使用しようとしました')
    }
    return this.three
  }
  createTurtle (modelUrl: string): number {
    // カメの情報を sys._turtle リストに追加
    const three = this.getThree()
    const id = this.turtles.length
    const tt = new Turtle3D(three, id)
    tt.addEventListener('modelChanged', (e) => {
      const redraw = !!this.sys.__getSysVar('T3D自動描画')
      if (redraw) {
        this.doDraw(true)
      }
    })
    tt.addEventListener('drawLine', (e) => {
      this.drawLine(e.detail.v1, e.detail.v2, e.detail.width, e.detail.color)
    })
    this.turtles.push(tt)
    this.target = id
    tt.loadTurtle(modelUrl)
    const scene = this.getScene()
    if (scene) {
      scene.add(tt.obj)
    }
    return id
  }
  initTurtle (): void {
    if (this.turtles.length === 0) {
      if (this._renderer === null) {
        this.initRenderer()
      }
      const three = this.getThree()
      // カメを１つ生成する
      const index = this.createTurtle('')
      // 生成したカメをカメラ用カメとして設定する
      const tt = this.turtles[index]
      tt.obj.position.set(0, 0, 1000)
      const axis = new three.Vector3(0, 0, -1).normalize()
      const angle = 0
      tt.obj.quaternion.setFromAxisAngle(axis, angle)
      tt.home.position.copy(tt.obj.position)
      tt.home.quaternion.copy(tt.obj.quaternion)
      tt.f_visible = false
      tt.obj.visible = false
      this.camera = index
      this.target = -1
    }
  }
  getCur (): Turtle3D {
    if (this.turtles.length === 0) {
      throw Error('最初に『T3Dカメ作成』命令を呼び出してください。')
    }
    if (this.target < 0 || this.target >= this.turtles.length) {
      throw Error('指定された番号のカメはいません。')
    }
    return this.turtles[this.target]
  }
  queCurrentTurtle (cmd: [ string,...any]) {
    const tt = this.getCur()
    tt.macros.push(cmd)
    this.animationStart()
  }
  doDraw (beforeClear: boolean) {
    if (this.camera === -1) { return }
    if (!this._scene) { return }
    this.getRenderer()
    if (!this._renderer) { return }
    this.getCamera()
    if (!this._camera) { return }
    const camera = this.turtles[this.camera]
    if (this._controls === null) {
      this._camera.position.copy(camera.obj.position)
      this._camera.quaternion.copy(camera.obj.quaternion)
    }
    if (this._camerahelper !== null) {
      this._camerahelper.update()
    }
    if (this._controls !== null) {
      this._controls.update()
      camera.obj.position.copy(this._camera.position)
      camera.obj.quaternion.copy(this._camera.quaternion)
    }
    if (beforeClear) {
      this._renderer.clear()
    }
    this._renderer.render(this._scene, this._camera)
  }
  setCameraHelper (flag: boolean) {
    const three = this.getThree()
    if (flag) {
      if (this._camerahelper === null) {
        if (this._scene && this._camera) {
          if (typeof three.CameraHelper === 'undefined') {
            throw Error('カメラヘルパの機能が見当たりません。')
          }
          const cameraHelper = new three.CameraHelper(this._camera)
          this._camerahelper = cameraHelper
          this._scene.add(cameraHelper)
        }
      }
      this._camerahelper!.visible = true
    } else {
      if (this._camerahelper !== null) {
        this._camerahelper.visible = false
      }
   }
  }
  setAxisHelper (flag: boolean) {
    const three = this.getThree()
    if (flag) {
      if (this._axishelper === null) {
        if (this._scene) {
          if (typeof three.AxisHelper === 'undefined') {
            throw Error('AXISヘルパの機能が見当たりません。')
          }
          const axisHelper = new three.AxisHelper(1000)
          this._axishelper = axisHelper
          this._scene.add(axisHelper)
        }
      }
      this._axishelper!.visible = true
    } else {
      if (this._axishelper !== null) {
        this._axishelper.visible = false
      }
    }
  }
  getScene (): THREENS.Scene {
    const three = this.getThree()
    if (this._scene === null) {
      const scene = new three.Scene()
      if (scene === null) {
        throw new Error('シーンを作成できません')
      }
      this._scene = scene
    }
    return this._scene
  }
  getCamera (): THREENS.Camera {
    const three = this.getThree()
    if (this._camera === null) {
      const camera = new three.PerspectiveCamera(60, 1.0, 1, 65000)
      if (camera === null) {
        throw new Error('カメラを作成できません')
      }
      this.resetCamera(camera)
      this._camera = camera
    }
    return this._camera
  }
  resetCamera (camera: THREENS.Camera):void {
    const three = this.getThree()
    camera.position.set(0, 0, 1000)
    if (this._renderer !== null) {
      const rect = new three.Vector2()
      this._renderer.getSize(rect)
      if ('aspect' in camera) {
        camera.aspect = rect.width / rect.height
      }
    }
    camera.up = new three.Vector3(0, 1, 0)
    camera.lookAt(new three.Vector3(0, 0, 0))
  }
  initTrutle3dEnv (renderer: THREENS.WebGLRenderer) {
    renderer.setClearColor(0x000000, 1.0)
    renderer.autoClear = false

    const scene = this.getScene()
    // eslint-disable-next-line no-unused-vars
    const camera = this.getCamera()

    if (scene && this._lines) {
      scene.add(this._lines)
      if (this.turtles.length === 0) {
        this.initTurtle()
      }
    }
  }
  initRenderer ():THREENS.WebGLRenderer {
    // 描画先をセットする
    let to = this.sys.__getSysVar('T3Dカメ描画先')
    if (typeof to === 'string') { to = document.querySelector(to) || document.getElementById(to) }
    if (!to) {
      throw new Error('[ERROR] T3Dカメ描画先が見当たりません。')
    }
    const renderer = this.setRenderer(to)
    this.setupRenderer()
    return renderer
  }
  setRenderer (to: Element|HTMLCanvasElement|THREENS.WebGLRenderer):THREENS.WebGLRenderer {
    const three = this.getThree()
    let renderer: null|THREENS.WebGLRenderer = null
    if (to instanceof three.WebGLRenderer) {
      renderer = to
    } else
    if (to instanceof HTMLCanvasElement) {
      renderer = new three.WebGLRenderer({ antialias: false, alpha: true, canvas:to })
      if (renderer === null) {
        throw new Error('レンダラを作成できません')
      }
      renderer.setSize( to.width, to.height )
    } else
    if (to instanceof Element) {
      renderer = new three.WebGLRenderer({ antialias: false, alpha: true })
      if (renderer === null) {
        throw new Error('レンダラを作成できません')
      }
      renderer.setSize(to.clientWidth, to.clientHeight );
      to.appendChild(renderer.domElement)
    } else [
      // never
    ]
    renderer!.setPixelRatio(window.devicePixelRatio)
    this._renderer = renderer
    return this._renderer!
  }
  clearRenderer () {
    this._renderer = null
    if (this._controls) {
      this._controls.enabled = false
      this._controls = null
    }
  }
  setupRenderer () {
    if (this._renderer) {
      this.initTrutle3dEnv(this._renderer)
    }
  }
  getRenderer (): THREENS.Renderer {
    if (this._renderer === null) {
      this.initRenderer()
    }
    return this._renderer!
  }
  setupControl (controlConstrucor: THREENS.Controls): THREENS.Controls {
    if (typeof controlConstrucor === 'undefined') {
      throw new Error('指定されたコンコントロールが見当たりません。')
    }
    if (this._controls !== null) {
      if (this._controls instanceof controlConstrucor) {
        return this._controls
      } else {
        throw new Error('既にコントロールを適用しています。コントロールの変更はできません。')
      }
    }
    const renderer = this.getRenderer()
    const camera = this.getCamera()
    // eslint-disable-next-line new-cap
    const controls = new controlConstrucor(camera, renderer.domElement)
    controls.enabled = true
    this._controls = controls
    return this._controls
  }
  drawLine (v1: THREENS.Vector3, v2: THREENS.Vector3, width: number, color: THREENS.Color) {
    const three = this.getThree()
    const geometry = new three.BufferGeometry()
    const vertices = new three.Float32BufferAttribute(6, 3)
    vertices.copyArray([v1.x, v1.y, v1.z, v2.x, v2.y, v2.z])
    const material = new three.LineBasicMaterial({ color: color, linewidth: width })
    geometry.setAttribute('position', vertices)
    const line = new three.Line(geometry, material)
    if (this._lines) {
      this._lines.add(line)
    }
  }
  doMacroAllTurtles (wait: number) {
    let hasNext = false
    for (let i = 0; i < this.turtles.length; i++) {
      const tt = this.turtles[i]
      if (tt.doMacro(wait)) { hasNext = true }
    }
    return hasNext
  }
  animationStart () {
    const wait = this.getWait()
    const macrorun = !!this.sys.__getSysVar('T3D自動実行')
    if (!macrorun) {
      return
    }
    if (wait === 0) {
      this.animation()
      return
    }
    if (this.flagSetTimer) { return }
    this.flagSetTimer = true
    this.animationFrame(() => this.animation())
  }
  getWait () {
    return this.sys.__getSysVar('T3Dカメ速度')
  }
  animation () {
    const redraw = !!this.sys.__getSysVar('T3D自動描画')
    const macrorun = !!this.sys.__getSysVar('T3D自動実行')
    const hasNext = this.animationTick()
   if (redraw) {
      this.doDraw(true)
    }
    if ((hasNext || this._controls !== null) && macrorun) {
      this.animationFrame(() => this.animation())
    } else {
      this.flagSetTimer = false
    }
  }
  animationTick () {
    const now = Date.now()
    const elapsedMs = now - this._prevUpdatedTime
    const wait = this.getWait()
    if (wait > 0 && elapsedMs < wait) {
      return true
    }
    this._prevUpdatedTime = now
    let hasNext = this.doMacroAllTurtles(wait)
    if (wait <= 0) {
      while (hasNext) {
        hasNext = this.doMacroAllTurtles(wait)
      }
    } else if (hasNext) {
    }
    return hasNext
  }
  ck (): THREENS.THREE {
    if (this.three === null) {
      if (this.sys.__getSysVar('THREE') !== null) {
        this.three = this.sys.__getSysVar('THREE')
      } else
      if (typeof window.THREE !== 'undefined') {
        this.three = window.THREE
      }
    }
    if (this.three === null) {
      throw new Error('three.module.jsが読み込まれていません')
    }
    if (this.sys.__getSysVar('THREE') === null) {
      this.sys.__setSysVar('THREE', this.three)
    }
    if (this._lines === null) {
      this._lines = new this.three.Group()
    }
    return this.three
  }
  animationFrame (callback: () => void, element?: Element) {
    window.setTimeout(callback, 1000 / 60)
  }
  static getTurtle3D(sys: NakoSystem): WeykTurtle3DSystem {
    if (!sys.tags.weykturtle3d) {
      throw new Error('プラグインの初期化が行われていません')
    }
    return sys.tags.weykturtle3d
  }
  static getEnv(sys: NakoSystem):[ WeykTurtle3DSystem, THREENS.THREE ] {
    const turtle3d = WeykTurtle3DSystem.getTurtle3D(sys)
    const three = turtle3d.ck()
    return [turtle3d, three]
  }
}

const PluginWeykTurtle3D: NakoPluginObject = {
  'meta': {
    type: 'const',
    value: {
      pluginName: 'plugin_weykturtle3d', // プラグインの名前
      description: '3Dでタートルグラフィックス描画プラグイン', // プラグインの説明
      pluginVersion: '3.6.0', // プラグインのバージョン
      nakoRuntime: ['wnako'], // 対象ランタイム
      nakoVersion: '3.6.0' // 要求なでしこバージョン
    }
  },
  '初期化': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      if (sys.tags.weykturtle3d) { return }
      const turtle3dSystem = WeykTurtle3DSystem.getInstance(sys)
      sys.tags.weykturtle3d = turtle3dSystem

      // オブジェクトを初期化
      sys.__setSysVar('THREE', null)
    }
  },
  'THREE': {type: 'const', value: ''}, // @THREE
  'T3DベースURL': {type: 'var', value: 'https://cdn.jsdelivr.net/npm/three@0.127.0'}, // @T3DべーすURL
  'T3D自動描画': {type: 'var', value: true}, // @T3Dじどうびょうが
  'T3D自動実行': {type: 'var', value: true}, // @T3Dじどうじっこう
  // @ライブラリ・プラグイン
  'T3Dライブラリ読込': { // @ThreeJSのライブラリを動的に読み込む // @T3Dらいぶらりよみこむ
    type: 'func',
    josi: [],
    asyncFn: true,
    pure: true,
    fn: async function (sys: NakoSystem): Promise<boolean> {
      const turtle3d = WeykTurtle3DSystem.getTurtle3D(sys)
      if (turtle3d.three === null && sys.__getSysVar('THREE') === null) {
        const baseUrl = sys.__getSysVar('T3DベースURL')
        const moduleUrl = baseUrl === '' ? 'three' : ( baseUrl + '/build/three.module.js' )
        const promise = import(/* webpackIgnore: true */ moduleUrl)
        promise.then(module => {
          turtle3d.three = Object.assign({}, module)
          turtle3d.ck()
          return true
        })
        promise.catch(err => {
          return false
        })
        return await promise
      } else {
        turtle3d.ck()
        return true
      }
    },
    return_none: false
  },
  'T3Dライブラリ読込後': { // @ThreeJSのライブラリを動的に読み込む // @T3Dらいぶらりよみこみご
    type: 'func',
    josi: [['に']],
    pure: true,
    fn: function (callback: (success: boolean) => {}, sys: NakoSystem):void {
      const turtle3d = WeykTurtle3DSystem.getTurtle3D(sys)
      if (turtle3d.three === null && sys.__getSysVar('THREE') === null) {
        const baseUrl = sys.__getSysVar('T3DベースURL')
        const moduleUrl = baseUrl === '' ? 'three' : ( baseUrl + '/build/three.module.js' )
        const promise = import(/* webpackIgnore: true */ moduleUrl)
        promise.then(module => {
          turtle3d.three = Object.assign({}, module)
          turtle3d.ck()
          callback(true)
        })
        promise.catch(err => {
          callback(false)
        })
      } else {
        turtle3d.ck()
        callback(true)
      }
    },
    return_none: true
  },
  'T3Dプラグイン読込': { // @ThreeJSのプラグインを動的に読み込む // @T3Dぷらぐいんよみこむ
    type: 'func',
    josi: [['を']],
    asyncFn: true,
    pure: true,
    fn: async function (plugins: string[], sys: NakoSystem):Promise<void> {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      const l = plugins.length
      if (l === 0) {
        return
      }
      const baseUrl = sys.__getSysVar('T3DベースURL')
      const totalPromise = new Promise<void> ((resolve, reject) => {
        const callbacks = (function (total) {
          let countTotal = 0
          let countSuccess = 0
          return function (success: boolean) {
            countTotal += 1
            if (success) {
              countSuccess += 1
            }
            if (countTotal === total) {
              if (countTotal === countSuccess) {
                resolve()
              } else {
                reject()
              }
            }
          }
        })(l)
        for (const name of plugins) {
          const pluginUrl = baseUrl === '' ? name : ( baseUrl + '/examples/jsm/' + name )
          const promise = import(/* webpackIgnore: true */ pluginUrl)
          promise.then(module => {
            Object.assign<THREENS.THREE, any>(three, module)
            callbacks(true)
          })
          promise.catch(err => {
            callbacks(false)
          })
        }
      })
      return totalPromise
    },
    return_none: true
  },
  'T3Dプラグイン読込後': { // @ThreeJSのプラグインを動的に読み込む // @T3Dぷらぐいんよみこみご
    type: 'func',
    josi: [['に'], ['を']],
    pure: true,
    fn: function (callback: () => {} , plugins: string[], sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      const l = plugins.length
      if (l === 0) {
        callback()
        return
      }
      const baseUrl = sys.__getSysVar('T3DベースURL')
      const callbacks = (function (callback, total) {
        let count = 0
        return function (success: boolean) {
          count+=1
          if (count === total) {
            callback()
          }
        }
      })(callback, l)
      for (let i=0;i < l;i++) {
        const name = plugins[i]
        const pluginUrl = baseUrl === '' ? name : ( baseUrl + '/examples/jsm/' + name )
        const promise = import(/* webpackIgnore: true */ pluginUrl)
        promise.then(module => {
          Object.assign<THREENS.THREE, any>(three, module)
          callbacks(true)
        })
        promise.catch(err => {
          callbacks(false)
        })
      }
    },
    return_none: true
  },
  // @3Dタートルグラフィックス/カメ操作
  'T3Dカメ作成': { // @タートルグラフィックスを開始してカメのIDを返す // @T3Dかめさくせい
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem): number {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.initTurtle()
      const modelUrl = sys.__getSysVar('T3DカメモデルURL')
      const id = turtle3d.createTurtle(modelUrl)
      return id
    },
    return_none: false
  },
  'T3Dカメ操作対象設定': { // @IDを指定して操作対象となるカメを変更する // @T3Dかめそうさたいしょうせってい
    type: 'func',
    josi: [['に', 'へ', 'の']],
    pure: true,
    fn: function (id: number, sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.target = id
    },
    return_none: true
  },
  'T3Dカメ描画先': { type: 'var', value: 'turtle3d_div' }, // @T3Dかめびょうがさき
  'T3DカメモデルURL': { type: 'var', value: '' }, // @T3DかめもでるURL
  'T3Dカメモデル変更': { // @カメのモデルをURLに変更する // @T3Dかめもでるへんこう
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (url: string, sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.queCurrentTurtle(['changeModel', url])
    },
    return_none: true
  },
  'T3Dカメ速度': { type: 'const', value: 100 }, // @T3Dかめそくど
  'T3Dカメ速度設定': { // @カメの動作速度vに設定(大きいほど遅い) // @T3Dかめそくどせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (v: number, sys: NakoSystem):void {
      sys.__setSysVar('T3Dカメ速度', v)
    },
    return_none: true
  },
  'T3Dカメ移動': { // @カメの位置を[x,y,z]へ移動する // @T3Dかめいどう
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (xyz: [number, number, number], sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.queCurrentTurtle(['mv', new three.Vector3(xyz[0], xyz[1], xyz[2])])
    },
    return_none: true
  },
  'T3Dカメ原点設定': { // @カメの原点を現在の位置・向きに設定する // @T3Dかめげんてんせってい
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.queCurrentTurtle(['sethome'])
    },
    return_none: true
  },
  'T3Dカメ原点移動': { // @カメを原点の位置・向きに移動する(描画はしない) // @T3Dかめげんてんいどう
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.queCurrentTurtle(['gohome'])
    },
    return_none: true
  },
  'T3Dカメ起点移動': { // @カメの描画起点位置を[x,y,z]へ移動する // @T3Dかめきてんいどう
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (xyz: [number, number, number], sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.queCurrentTurtle(['xyz', new three.Vector3(xyz[0], xyz[1], xyz[2])])
    },
    return_none: true
  },
  'T3Dカメ進': { // @カメの位置をVだけ進める // @T3Dかめすすむ
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v: number, sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.queCurrentTurtle(['fd', v, 1])
    },
    return_none: true
  },
  'T3Dカメ戻': { // @カメの位置をVだけ戻す // @T3Dかめもどる
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v: number, sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.queCurrentTurtle(['fd', v, -1])
    },
    return_none: true
  },
  'T3Dカメ上平行移動': { // @カメの位置を上にVだけ進める // @T3Dかめうえへいこういどう
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v: number, sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.queCurrentTurtle(['su', v])
    },
    return_none: true
  },
  'T3Dカメ下平行移動': { // @カメの位置を下にVだけ進める // @T3Dかめしたへいこういどう
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v: number, sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.queCurrentTurtle(['sd', v])
    },
    return_none: true
  },
  'T3Dカメ左平行移動': { // @カメの位置を左にVだけ進める // @T3Dかめひだりへいこういどう
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v: number, sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.queCurrentTurtle(['sl', v])
    },
    return_none: true
  },
  'T3Dカメ右平行移動': { // @カメの位置を右にVだけ進める // @T3Dかめみぎへいこういどう
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v: number, sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.queCurrentTurtle(['sr', v])
    },
    return_none: true
  },
  'T3Dカメ動': { // @カメの位置をDIRにVだけ進める // @T3Dかめうごく
    type: 'func',
    josi: [['へ', 'に'], ['だけ']],
    pure: true,
    fn: function (dir: string, v: number, sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      if (dir === '前' || dir === '後') {
        if (dir === '前') {
          turtle3d.queCurrentTurtle(['fd', v, 1])
        } else {
          turtle3d.queCurrentTurtle(['fd', v, -1])
        }
      } else {
        let cmd = ''
        if (dir === '上' || dir === 'UP' || dir === 'うえ') {
          cmd = 'su'
        } else
        if (dir === '下' || dir === 'DOWN' || dir === 'した') {
          cmd = 'sd'
        } else
        if (dir === '右' || dir === 'RIGHT' || dir === 'みぎ') {
          cmd = 'sr'
        } else
        if (dir === '左' || dir === 'LEFT' || dir === 'ひだり') {
          cmd = 'sl'
        } else {
          throw Error('方向の指定が正しくありません。前後上下左右のいずれかで指定してください。')
        }
        turtle3d.queCurrentTurtle([cmd, v])
      }
    },
    return_none: true
  },
  'T3Dカメ角度設定': { // @カメの向きをオイラー(XYZ)にて設定する // @T3Dかめかくどせってい
    type: 'func',
    josi: [['に', 'へ', 'の']],
    pure: true,
    fn: function (v: number|string, sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      if (typeof v === 'string') { v = parseFloat(v) }
      turtle3d.queCurrentTurtle(['angle', v])
    },
    return_none: true
  },
  'T3Dカメ右回転': { // @カメの向きをDEGだけ右に向ける // @T3Dかめみぎかいてん
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v: number, sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.queCurrentTurtle(['rotr', v])
    },
    return_none: true
  },
  'T3Dカメ左回転': { // @カメの向きをDEGだけ左に向ける // @T3Dかめひだりかいてん
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v: number, sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.queCurrentTurtle(['rotl', v])
    },
    return_none: true
  },
  'T3Dカメ上回転': { // @カメの向きをDEGだけ上に向ける // @T3Dかめうえかいてん
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v: number, sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.queCurrentTurtle(['rotu', v])
    },
    return_none: true
  },
  'T3Dカメ下回転': { // @カメの向きをDEGだけ下に向ける // @T3Dかめしたかいてん
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v: number, sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.queCurrentTurtle(['rotd', v])
    },
    return_none: true
  },
  'T3Dカメ回転': { // @カメの向きをDEGだけDIRに向ける // @T3Dかめかいてん
    type: 'func',
    josi: [['へ', 'に'], ['だけ']],
    pure: true,
    fn: function (dir: string, v: number, sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      let cmd = ''
      if (dir === '上' || dir === 'UP' || dir === 'うえ') {
        cmd = 'rotu'
      } else
      if (dir === '下' || dir === 'DOWN' || dir === 'した') {
        cmd = 'rotd'
      } else
      if (dir === '右' || dir === 'RIGHT' || dir === 'みぎ') {
        cmd = 'rotr'
      } else
      if (dir === '左' || dir === 'LEFT' || dir === 'ひだり') {
        cmd = 'rotl'
      } else {
        throw Error('方向の指定が正しくありません。上下左右のいずれかで指定してください。')
      }
      turtle3d.queCurrentTurtle([cmd, v])
    },
    return_none: true
  },
  'T3Dカメ右ロール': { // @カメをDEGだけ右に傾ける // @T3Dかめみぎろーる
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v: number, sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.queCurrentTurtle(['rolr', v])
    },
    return_none: true
  },
  'T3Dカメ左ロール': { // @カメのDEGだけ左に傾ける // @T3Dかめひだりろーる
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v: number, sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.queCurrentTurtle(['roll', v])
    },
    return_none: true
  },
  'T3Dカメ傾': { // @カメをDEGだけDIRに傾ける // @T3Dかめかたむける
    type: 'func',
    josi: [['に', 'へ'], ['だけ']],
    pure: true,
    fn: function (dir: string, v: number, sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      let cmd = ''
      if (dir === '右' || dir === 'RIGHT' || dir === 'みぎ') {
        cmd = 'rolr'
      } else
      if (dir === '左' || dir === 'LEFT' || dir === 'ひだり') {
        cmd = 'roll'
      } else {
        throw Error('向きの指定が正しくありません。左右のどちらかで指定してください。')
      }
      turtle3d.queCurrentTurtle([cmd, v])
    },
    return_none: true
  },
  'T3Dカメペン色設定': { // @カメのペン描画色をCに設定する // @T3Dかめぺんいろせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (c: string|number, sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.queCurrentTurtle(['color', c])
    },
    return_none: true
  },
  'T3Dカメペンサイズ設定': { // @カメペンのサイズをWに設定する // @T3Dかめぺんさいずせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (w: number, sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.queCurrentTurtle(['size', w])
    },
    return_none: true
  },
  'T3Dカメペン設定': { // @カメペンを使うかどうかをV(オン/オフ)に設定する // @T3Dかめぺんせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (w: boolean|number, sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.queCurrentTurtle(['penOn', w])
    },
    return_none: true
  },
  'T3Dカメ全消去': { // @表示しているカメと描画内容を全部消去する // @T3Dかめぜんしょうきょ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.clearAll()
    },
    return_none: true
  },
  'T3Dカメ非表示': { // @カメのモデルを非表示にする。描画に影響しない。 // @T3Dかめひひょうじ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.queCurrentTurtle(['visible', false])
    },
    return_none: true
  },
  'T3Dカメ表示': { // @非表示にしたカメのモデルを表示する。 // @T3Dかめひょうじ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.queCurrentTurtle(['visible', true])
    },
    return_none: true
  },
  'T3D視点カメ設定': { // @指定したカメを視点として使用する // @T3Dしてんかめせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (w: number, sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      if (w < 0 || w >= turtle3d.turtles.length) {
        throw Error('指定された番号のカメはいません。')
      }
      turtle3d.camera = w
      turtle3d.animationStart()
    },
    return_none: true
  },
  // @3Dタートルグラフィックス/基本機能
  'T3D描画準備': { // @指定したDOMのIDに対する描画を準備し、描画オブジェクトを返す // @T3Dびょうがじゅんび
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (to: string|Element|null, sys: NakoSystem):THREENS.WebGLRenderer {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)

      if (typeof to === 'string') { to = document.querySelector(to) || document.getElementById(to) }
      if (!to) { throw new Error('T3D描画準備に指定した描画先に誤りがあります') }

      const renderer = turtle3d.setRenderer(to)
      turtle3d.setupRenderer()
      return renderer
    },
    return_none: false
  },
  'T3D描画': { // @現在の状態を描画する // @T3Dびょうが
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.doDraw(true)
    },
    return_none: true
  },
  'T3D上書描画': { // @現在の状態を元イメージをクリアせずに描画する // @T3Dうわがきびょうが
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.doDraw(false)
    },
    return_none: true
  },
  'T3D実行': { // @各カメの動きを経過時間等に従い実行する // @T3Dじっこう
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.animationTick()
    },
    return_none: true
  },
  'T3D背景色設定': { // @canvasをクリアする際の背景色を設定する // @T3Dはいけいしょくせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (c: number, sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      const renderer = turtle3d.getRenderer()
      renderer.setClearColor(c)
      turtle3d.animationStart()
    },
    return_none: true
  },
  'T3D背景透過設定': { // @canvasをクリアする際の背景のアルファ値を設定する // @T3Dはいけいとうかせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (a: number, sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      const renderer = turtle3d.getRenderer()
      renderer.setClearAlpha(a)
      turtle3d.animationStart()
    },
    return_none: true
  },
  'T3DJSON取得': { // @描画した線のJSON形式で取得する // @T3DJSONしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem): null|string {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      if (!turtle3d._lines) { return null }
      return JSON.stringify(turtle3d._lines.toJSON())
    },
    return_none: false
  },
  'T3Dレンダラ破棄': { // @内部で使用しているレンダラを捨てる // @T3Dれんだらはき
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.clearRenderer()
    },
    return_none: true
  },
  'T3D内部レンダラ取得': { // @本プラグイン内部で使用しているレンダラを返す // @T3Dないぶれんだらしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem): THREENS.WebGLRenderer {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.getRenderer()
    },
    return_none: false
  },
  'T3D内部シーン取得': { // @本プラグイン内部で使用しているシーンを返す // @T3Dないぶしーんしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem): THREENS.Scene {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.getScene()
    },
    return_none: false
  },
  'T3D内部カメラ取得': { // @本プラグイン内部で使用しているカメラを返す // @T3Dないぶかめらしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem): THREENS.Camera {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.getCamera()
    },
    return_none: false
  },
  'T3D内部線描画参照取得': { // @本プラグイン内部で保持している描いた線のデータの参照を返す // @T3Dないぶせんびょうがさんしょうしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem): null|THREENS.Group {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d._lines
    },
    return_none: false
  },
  'T3D内部線描画取出': { // @本プラグイン内部で保持している描いた線のデータを取り出して返す // @T3Dないぶせんびょうがとりだし
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem): null|THREENS.Group {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      const lines = turtle3d._lines
      turtle3d._lines = new three.Group()
      turtle3d.animationStart()
      return lines
    },
    return_none: false
  },
  // @ヘルパ機能
  'T3Dオービットコントロール設定': { // オービットコントロールを組み込む // @T3Dおーびっとこんとろーるせってい
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem): null|THREENS.OrbitControls {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      if (typeof three.OrbitControls !== 'undefined') {
        return turtle3d.setupControl(three.OrbitControls) as THREENS.OrbitControls
      }
      return null
    },
    return_none: false
  },
  'T3Dコントロール有効': { // @組み込んだコントロールを有効にする // @T3Dこんとろーるゆうこう
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      if (turtle3d._controls) {
        turtle3d._controls.enabled = true
      }
    },
    return_none: true
  },
  'T3Dコントロール無効': { // @組み込んだコントロールを無効にする // @T3Dこんとろーるむこう
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      if (turtle3d._controls) {
        turtle3d._controls.enabled = false
      }
    },
    return_none: true
  },
  'T3Dカメラヘルパ表示': { // @カメラヘルパーを表示する // @T3Dかめらへるぱひょうじ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.setCameraHelper(true)
    },
    return_none: true
  },
  'T3Dカメラヘルパ非表示': { // @カメラヘルパーを非表示にする // @T3Dかめらへるぱひひょうじ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.setCameraHelper(false)
    },
    return_none: true
  },
  'T3D軸線ヘルパ表示': { // @座標軸ヘルパーを表示する // @T3Dじくせんへるぱひょうじ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.setAxisHelper(true)
    },
    return_none: true
  },
  'T3D軸線ヘルパ非表示': { // @座標軸ヘルパーを非表示にする // @T3Dじくせんへるぱひひょうじ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem):void {
      const [ turtle3d, three ] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.setAxisHelper(false)
    },
    return_none: true
  }
}

export default PluginWeykTurtle3D

// ブラウザからscriptタグで取り込んだ時、自動で登録する
if (typeof navigator === 'object') {
  navigator.nako3.addPluginObject('PluginWeykTurtle3D', PluginWeykTurtle3D)
}
