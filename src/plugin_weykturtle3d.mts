/**
 * PluginWeykTurtle3D
 * 3d turtle graphics plugin
 */

import type { NakoSystem as NakoSystemBase } from '../core/src/plugin_api.mjs'

import { ThreeUtil } from './plugin_weykturtle3d_threeutil.mjs'
import type * as THREENS from './plugin_weykturtle3d_three.mjs'

declare global {
  interface Navigator {
    nako3: { addPluginObject: (name: string, obj: object) => void }
  }
  interface Window {
    THREE?: THREENS.THREE
  }
}

type CallbackType<T> = (a:T) => void
type NumericArray3 = [ number, number, number ]
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

interface Turtle3DEventTarget extends EventTarget {
  addEventListener<K extends keyof Turtle3DEventMap>(
     type: K,
     // eslint-disable-next-line no-use-before-define
     listener: ((this: Turtle3D, evt: Turtle3DEventMap[K]) => any) | null,
     options?: boolean | EventListenerOptions,): void
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void
  dispatchEvent<K extends keyof Turtle3DEventMap>(evt: Turtle3DEventMap[K]): boolean
  removeListener<K extends keyof Turtle3DEventMap>(
     type: K,
     // eslint-disable-next-line no-use-before-define
     listener: (this: Turtle3D, evt: Turtle3DEventMap[K]) => any,
     options?: boolean | EventListenerOptions,): void
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void
}

class Command {

}
class CommandPromise {
  resolve: (result:any) => void
  reject: (err:Error) => void
  command: Command
  constructor (command: Command, resolve: (result: any) => void, reject: (err: Error) => void) {
    this.command = command
    this.resolve = resolve
    this.reject = reject
  }
}
class CommandHome extends Command {
  cmd: string = 'home'
  mode: 'set'|'jump'
  constructor (mode: 'set'|'jump') {
    super()
    this.mode = mode
  }
}
class CommandJump extends Command {
  cmd: string = 'jump'
  v: THREENS.Vector3
  constructor (v: THREENS.Vector3) {
    super()
    this.v = v
  }
}
class CommandMoveAbsolute extends Command {
  cmd: string = 'move'
  v: THREENS.Vector3
  constructor (v: THREENS.Vector3) {
    super()
    this.v = v
  }
}
class CommandAngle extends Command {
  cmd: string = 'angle'
  angle: THREENS.EulerArray
  constructor (angle: THREENS.EulerArray) {
    super()
    this.angle = angle
  }
}
type MoveDirection = 'f'|'b'|'u'|'d'|'l'|'r'
type RotateDirection = 'u'|'d'|'l'|'r'
type RollDirection = 'l'|'r'
class CommandMoveDirection extends Command {
  cmd: string = 'slide'
  direction: MoveDirection
  length: number
  constructor (dir: MoveDirection, l: number) {
    super()
    this.direction = dir
    this.length = l
  }
}
class CommandRotate extends Command {
  cmd: string = 'rotate'
  direction: RotateDirection
  angle: number
  constructor (dir: RotateDirection, a: number) {
    super()
    this.direction = dir
    this.angle = a
  }
}
class CommandRoll extends Command {
  cmd: string = 'roll'
  direction: RollDirection
  angle: number
  constructor (dir: RollDirection, a: number) {
    super()
    this.direction = dir
    this.angle = a
  }
}
class CommandPenEnable extends Command {
  cmd: string = 'pen'
  subcmd: string = 'enable'
  enable: boolean
  constructor (enable: boolean) {
    super()
    this.enable = enable
  }
}
class CommandPenColor extends Command {
  cmd: string = 'pen'
  subcmd: string = 'color'
  color: THREENS.Color
  constructor (color: THREENS.Color) {
    super()
    this.color = color
  }
}
class CommandPenWidth extends Command {
  cmd: string = 'pen'
  subcmd: string = 'width'
  width: number
  constructor (width: number) {
    super()
    this.width = width
  }
}
class CommandVisible extends Command {
  cmd: string = 'attr'
  subcmd: string = 'visible'
  visible: boolean
  constructor (visible: boolean) {
    super()
    this.visible = visible
  }
}
class CommandModel extends Command {
  cmd: string = 'attr'
  subcmd: string = 'model'
  model: any
  constructor (model: any) {
    super()
    this.model = model
  }
}

const TypedTurtle3DEventTarget = EventTarget as { new(): Turtle3DEventTarget; prototype: Turtle3DEventTarget }

class Turtle3D extends TypedTurtle3DEventTarget implements Turtle3DEventTarget {
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
  macros: CommandPromise[]

  constructor (three: THREENS.THREE, id: number) {
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

  clear (): void {
    // 未実行ジョブのPromiseを全て完了にする
    for (const job of this.macros) {
      job.resolve(0)
    }
    this.macros = [] // ジョブをクリア
    // かめのモデルをカメから削除
    this.discardModel()
    this.f_visible = true
    this.obj.visible = true
  }

  discardModel (): void {
    if (this.disposal) {
      ThreeUtil.disposeChildObject(this.obj)
      this.disposal = false
    } else {
      this.obj.remove(this.obj.children[0])
    }
    this.flagLoaded = false
  }

  loadTurtle (model: THREENS.Object3D|string) {
    if (this.isObject3D(model)) {
      this.discardModel()
      this.obj.add(model)
      this.disposal = false
      this.flagLoaded = true
      this.raiseModelChanged()
      return
    }
    const url = model
    if (url.length === 0) {
      this.discardModel()
      this.obj.add(this.createDefaultTurtle())
      this.disposal = true
      this.flagLoaded = true
      this.raiseModelChanged()
      return
    }
    const loader = new this.three.ObjectLoader()
    loader.load(url, (obj: THREENS.Object3D) => {
      this.discardModel()
      this.obj.add(obj)
      this.disposal = true
      this.flagLoaded = true
      this.raiseModelChanged()
    }, (xhr: XMLHttpRequest) => {
      // nothing
    }, (xhr: XMLHttpRequest) => {
      this.discardModel()
      this.f_visible = false
      this.obj.visible = false
      this.raiseModelChanged()
    })
  }

  doMacro (noWait: boolean): boolean {
    if (!this.flagLoaded && !noWait) {
      return true
    }
    const que = this.macros.shift()
    if (typeof que === 'undefined') { return false }
    const m = que instanceof CommandPromise ? que.command : que
    if (m instanceof CommandJump) {
      // 起点を移動する
      this.obj.position.copy(m.v)
    } else if (m instanceof CommandMoveAbsolute) {
      const v1 = this.obj.position.clone()
      const v2 = m.v
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
    } else if (m instanceof CommandMoveDirection) {
      const dir = m.direction
      const l = m.length * ((dir === 'b') ? -1 : 1)
      const v1 = this.obj.position.clone()
      const v2 = new this.three.Vector3(0, l, 0)
      if (dir === 'f' || dir === 'b') {
        v2.applyQuaternion(this.obj.quaternion)
      } else {
        // u
        const modifier = new this.three.Quaternion()
        const target = this.obj.quaternion.clone()
        if (dir === 'u' || dir === 'd') {
          const axis = new this.three.Vector3(1, 0, 0)
          if (dir === 'u') {
            modifier.setFromAxisAngle(axis, (-90) * Math.PI / 180)
          } else { // dir === 'd'
            modifier.setFromAxisAngle(axis, 90 * Math.PI / 180)
          }
        } else { // dir === 'l' || dir === 'r'
          const axis = new this.three.Vector3(0, 0, 1)
          if (dir === 'l') {
            modifier.setFromAxisAngle(axis, 90 * Math.PI / 180)
          } else { // dir === 'r'
            modifier.setFromAxisAngle(axis, (-90) * Math.PI / 180)
          }
        }
        target.multiply(modifier)
        v2.applyQuaternion(target)
      }
      v2.add(v1)
      this.line(v1, v2)
      this.obj.position.copy(v2)
    } else if (m instanceof CommandHome) {
      const mode = m.mode
      switch (mode) {
        case 'set':
          this.home.position.copy(this.obj.position)
          this.home.quaternion.copy(this.obj.quaternion)
          break
        case 'jump':
          this.obj.position.copy(this.home.position)
          this.obj.quaternion.copy(this.home.quaternion)
          break
      }
    } else if (m instanceof CommandRotate) {
      const dir = m.direction
      const rv = m.angle * (dir === 'l' || dir === 'd' ? 1 : -1)
      const target = new this.three.Quaternion()
      let axis:THREENS.Vector3
      if (dir === 'l' || dir === 'r') {
        axis = new this.three.Vector3(0, 0, 1)
      } else {
        axis = new this.three.Vector3(1, 0, 0)
      }
      target.setFromAxisAngle(axis, (rv % 360) * Math.PI / 180)
      this.obj.quaternion.multiply(target)
    } else if (m instanceof CommandRoll) {
      const dir = m.direction
      const rv = m.angle * (dir === 'r' ? 1 : -1)
      const axis = new this.three.Vector3(0, 1, 0)
      const target = new this.three.Quaternion()
      target.setFromAxisAngle(axis, (rv % 360) * Math.PI / 180)
      this.obj.quaternion.multiply(target)
    } else if (m instanceof CommandPenColor) {
      this.color = m.color
    } else if (m instanceof CommandPenWidth) {
      this.lineWidth = m.width
    } else if (m instanceof CommandPenEnable) {
      this.flagDown = m.enable
    } else if (m instanceof CommandVisible) {
      this.f_visible = m.visible
      if (this.f_visible) {
        this.obj.visible = true
      } else {
        this.obj.visible = false
      }
    } else if (m instanceof CommandModel) {
      this.flagLoaded = false
      this.loadTurtle(m.model)
    } else if (m instanceof CommandAngle) {
      const euler = new this.three.Euler()
      euler.fromArray(m.angle)
      // eslint-disable-next-line no-unused-vars
      const dir = new this.three.Quaternion()
      this.obj.quaternion.setFromEuler(euler)
    }
    if (que instanceof CommandPromise) {
      que.resolve(0)
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

  private raiseDrawLine (v1: THREENS.Vector3, v2: THREENS.Vector3, width: number, color: THREENS.Color) : void {
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

interface NakoSystem extends NakoSystemBase {
  // eslint-disable-next-line no-use-before-define
  tags: { weykturtle3d?: WeykTurtle3DSystem }
}

class WeykTurtle3DSystem {
  // eslint-disable-next-line no-use-before-define
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

  static getInstance (sys: NakoSystem) {
    if (WeykTurtle3DSystem.instance === undefined) {
      WeykTurtle3DSystem.instance = new WeykTurtle3DSystem(sys)
    } else if (WeykTurtle3DSystem.instance.sys !== sys) {
      console.log('T3D: difference sys instance')
      WeykTurtle3DSystem.instance.sys = sys
    }
    const i = WeykTurtle3DSystem.instance
    i.instanceCount += 1
    return WeykTurtle3DSystem.instance
  }

  private constructor (sys: NakoSystem) {
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
    }
  }

  disposeAllTurtle () {
    // カメをクリア
    for (const tt of this.turtles) {
      tt.clear()
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

  private getThree (): THREENS.THREE {
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
    scene.add(tt.obj)
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

  queCurrentTurtle (cmd: Command): Promise<number> {
    const tt = this.getCur()
    const promise = new Promise<number>((resolve, reject) => {
      const que = new CommandPromise(cmd, resolve, reject)
      tt.macros.push(que)
      this.animationStart()
    })
    return promise
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
      this._scene = new three.Scene()
    }
    return this._scene
  }

  getCamera (): THREENS.Camera {
    const three = this.getThree()
    if (this._camera === null) {
      const camera = new three.PerspectiveCamera(60, 1.0, 1, 65000)
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
    } else if (to instanceof HTMLCanvasElement) {
      renderer = new three.WebGLRenderer({ antialias: false, alpha: true, canvas: to })
      if (renderer === null) {
        throw new Error('レンダラを作成できません。指定したCanvas要素は使用できません')
      }
      renderer.setSize(to.width, to.height)
    } else if (to instanceof Element) {
      renderer = new three.WebGLRenderer({ antialias: false, alpha: true })
      if (renderer === null) {
        throw new Error('レンダラを作成できません。指定したDOM要素は使用できません')
      }
      renderer.setSize(to.clientWidth, to.clientHeight)
      to.appendChild(renderer.domElement)
    } else {
      // never
      throw new Error('レンダラを作成できません。それは作成先に指定できません')
    }
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

  drawLine (v1: THREENS.Vector3, v2: THREENS.Vector3, width: number, color: THREENS.Color):void {
    const three = this.getThree()
    const geometry = new three.BufferGeometry()
    const vertices = new three.Float32BufferAttribute(6, 3)
    vertices.copyArray([v1.x, v1.y, v1.z, v2.x, v2.y, v2.z])
    const material = new three.LineBasicMaterial({ color, linewidth: width })
    geometry.setAttribute('position', vertices)
    const line = new three.Line(geometry, material)
    if (this._lines) {
      this._lines.add(line)
    }
  }

  doMacroAllTurtles (): boolean {
    let hasNext = false
    for (const tt of this.turtles) {
      if (tt.doMacro(this.isNoWait())) { hasNext = true }
    }
    return hasNext
  }

  animationStart ():void {
    const wait = this.getWait()
    const macrorun = !!this.sys.__getSysVar('T3D自動実行')
    if (!macrorun) {
      return
    }
    if (this.isNoWait()) {
      this.animation()
      return
    }
    if (this.flagSetTimer) { return }
    this.flagSetTimer = true
    this.animationFrame(() => this.animation())
  }

  getWait (): number {
    return this.sys.__getSysVar('T3Dカメ速度')
  }

  isNoWait (): boolean {
    return this.sys.__getSysVar('T3Dカメ速度') === 0
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
    const noWait = this.isNoWait()
    // ノーウエイトではない場合の時間待ち処理
    if (!noWait) {
      const elapsedMs = now - this._prevUpdatedTime
      const wait = this.getWait()
      if (wait > 0 && elapsedMs < wait) {
        return true
      }
    }
    this._prevUpdatedTime = now
    let hasNext:boolean
    if (noWait) {
      while (this.doMacroAllTurtles()) {
        // no-op
      }
      hasNext = false
    } else {
      hasNext = this.doMacroAllTurtles()
    }
    return hasNext
  }

  animationFrame (callback: () => void, element?: Element) {
    window.setTimeout(callback, 1000 / 60)
  }

  ck (): THREENS.THREE {
    if (this.three === null) {
      if (this.sys.__getSysVar('THREE') !== null) {
        this.three = this.sys.__getSysVar('THREE')
      } else if (typeof window.THREE !== 'undefined') {
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

  static getTurtle3D (sys: NakoSystem): WeykTurtle3DSystem {
    if (!sys.tags.weykturtle3d) {
      throw new Error('プラグインの初期化が行われていません')
    }
    return sys.tags.weykturtle3d
  }

  static getEnv (sys: NakoSystem):[ WeykTurtle3DSystem, THREENS.THREE ] {
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
    fn: function (sys: NakoSystem):void {
      if (sys.tags.weykturtle3d) { return }
      const turtle3dSystem = WeykTurtle3DSystem.getInstance(sys)
      sys.tags.weykturtle3d = turtle3dSystem

      // オブジェクトを初期化
      sys.__setSysVar('THREE', null)
    }
  },
  '!クリア': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem):void {
      if (sys.tags.weykturtle3d) {
        sys.tags.weykturtle3d.clearAll()
        sys.tags.weykturtle3d.clearRenderer()
      }
    }
  },
  // @3Dタートルグラフィックス・ライブラリとプラグイン
  'THREE': { type: 'const', value: '' }, // @THREE
  'T3DベースURL': { type: 'var', value: 'https://cdn.jsdelivr.net/npm/three@0.127.0' }, // @T3DべーすURL
  'T3Dライブラリ読込': { // @ThreeJSのライブラリを動的に読み込む // @T3Dらいぶらりよみこむ
    type: 'func',
    josi: [],
    asyncFn: true,
    pure: true,
    fn: async function (sys: NakoSystem): Promise<boolean> {
      const turtle3d = WeykTurtle3DSystem.getTurtle3D(sys)
      if (turtle3d.three === null && sys.__getSysVar('THREE') === null) {
        const baseUrl = sys.__getSysVar('T3DベースURL')
        const moduleUrl = baseUrl === '' ? 'three' : (baseUrl + '/build/three.module.js')
        const promise = import(/* webpackIgnore: true */ moduleUrl)
        promise.then(module => {
          turtle3d.three = Object.assign({}, module)
          turtle3d.ck()
          return true
        })
        promise.catch(err => {
          console.error('T3D:ThreeJSのライブラリの読み込みに失敗しました')
          console.error(err)
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
    fn: function (callback: CallbackType<boolean>, sys: NakoSystem):void {
      const turtle3d = WeykTurtle3DSystem.getTurtle3D(sys)
      if (turtle3d.three === null && sys.__getSysVar('THREE') === null) {
        const baseUrl = sys.__getSysVar('T3DベースURL')
        const moduleUrl = baseUrl === '' ? 'three' : (baseUrl + '/build/three.module.js')
        const promise = import(/* webpackIgnore: true */ moduleUrl)
        promise.then(module => {
          turtle3d.three = Object.assign({}, module)
          turtle3d.ck()
          callback(turtle3d.three !== null)
        })
        promise.catch(err => {
          console.error('T3D:ThreeJSのライブラリの読み込みに失敗しました')
          console.error(err)
          callback(turtle3d.three !== null)
        })
      } else {
        turtle3d.ck()
        callback(turtle3d.three !== null)
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
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      const l = plugins.length
      if (l === 0) {
        return
      }
      const baseUrl = sys.__getSysVar('T3DベースURL')
      const totalPromise = new Promise<void>((resolve, reject) => {
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
                reject(new Error('読み込みに失敗したプラグインがあります'))
              }
            }
          }
        })(l)
        for (const name of plugins) {
          const pluginUrl = baseUrl === '' ? name : (baseUrl + '/examples/jsm/' + name)
          const promise = import(/* webpackIgnore: true */ pluginUrl)
          promise.then(module => {
            Object.assign<THREENS.THREE, any>(three, module)
            callbacks(true)
          })
          promise.catch(err => {
            console.error('T3D:ThreeJSのプラグインの読み込みに失敗しました')
            console.error(err)
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
    fn: function (callback: CallbackType<void>, plugins: string[], sys: NakoSystem):void {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      const l = plugins.length
      if (l === 0) {
        callback()
        return
      }
      const baseUrl = sys.__getSysVar('T3DベースURL')
      const callbacks = (function (callback, total) {
        let count = 0
        return function (success: boolean) {
          count += 1
          if (count === total) {
            callback()
          }
        }
      })(callback, l)
      for (let i = 0; i < l; i++) {
        const name = plugins[i]
        const pluginUrl = baseUrl === '' ? name : (baseUrl + '/examples/jsm/' + name)
        const promise = import(/* webpackIgnore: true */ pluginUrl)
        promise.then(module => {
          Object.assign<THREENS.THREE, any>(three, module)
          callbacks(true)
        })
        promise.catch(err => {
          console.error('T3D:ThreeJSのプラグインの読み込みに失敗しました')
          console.error(err)
          callbacks(false)
        })
      }
    },
    return_none: true
  },
  // @3Dタートルグラフィックス・カメ操作
  'T3Dカメ作成': { // @タートルグラフィックスを開始してカメのIDを返す // @T3Dかめさくせい
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem): number {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
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
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
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
    fn: function (url: string, sys: NakoSystem):Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.queCurrentTurtle(new CommandModel(url))
    },
    return_none: false
  },
  'T3Dカメ速度': { type: 'const', value: 100 }, // @T3Dかめそくど
  'T3Dカメ速度設定': { // @カメの動作速度Vに設定(大きいほど遅い) // @T3Dかめそくどせってい
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
    fn: function (xyz: NumericArray3, sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.queCurrentTurtle(new CommandMoveAbsolute(new three.Vector3(xyz[0], xyz[1], xyz[2])))
    },
    return_none: false
  },
  'T3Dカメ原点設定': { // @カメの原点を現在の位置・向きに設定する // @T3Dかめげんてんせってい
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.queCurrentTurtle(new CommandHome('set'))
    },
    return_none: false
  },
  'T3Dカメ原点移動': { // @カメを原点の位置・向きに移動する(描画はしない) // @T3Dかめげんてんいどう
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.queCurrentTurtle(new CommandHome('jump'))
    },
    return_none: false
  },
  'T3Dカメ起点移動': { // @カメの描画起点位置を[x,y,z]へ移動する // @T3Dかめきてんいどう
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (xyz: NumericArray3, sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.queCurrentTurtle(new CommandJump(new three.Vector3(xyz[0], xyz[1], xyz[2])))
    },
    return_none: false
  },
  'T3Dカメ進': { // @カメの位置をLだけ進める // @T3Dかめすすむ
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (l: number, sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.queCurrentTurtle(new CommandMoveDirection('f', l))
    },
    return_none: false
  },
  'T3Dカメ戻': { // @カメの位置をLだけ戻す // @T3Dかめもどる
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (l: number, sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.queCurrentTurtle(new CommandMoveDirection('b', l))
    },
    return_none: false
  },
  'T3Dカメ上平行移動': { // @カメの位置を上にLだけ進める // @T3Dかめうえへいこういどう
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (l: number, sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.queCurrentTurtle(new CommandMoveDirection('u', l))
    },
    return_none: false
  },
  'T3Dカメ下平行移動': { // @カメの位置を下にLだけ進める // @T3Dかめしたへいこういどう
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (l: number, sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.queCurrentTurtle(new CommandMoveDirection('d', l))
    },
    return_none: false
  },
  'T3Dカメ左平行移動': { // @カメの位置を左にLだけ進める // @T3Dかめひだりへいこういどう
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (l: number, sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.queCurrentTurtle(new CommandMoveDirection('l', l))
    },
    return_none: false
  },
  'T3Dカメ右平行移動': { // @カメの位置を右にLだけ進める // @T3Dかめみぎへいこういどう
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (l: number, sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.queCurrentTurtle(new CommandMoveDirection('r', l))
    },
    return_none: false
  },
  'T3Dカメ動': { // @カメの位置をDIRにLだけ進める // @T3Dかめうごく
    type: 'func',
    josi: [['へ', 'に'], ['だけ']],
    pure: true,
    fn: function (dir:string, l: number, sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      let cmd:MoveDirection
      if (dir === '前' || dir === 'FORWARD' || dir === 'まえ') {
        cmd = 'f'
      } else if (dir === '後' || dir === 'BACK' || dir === 'うしろ' || dir === 'BACKWARD' || dir === 'あと') {
        cmd = 'b'
      } else if (dir === '上' || dir === 'UP' || dir === 'うえ') {
        cmd = 'u'
      } else if (dir === '下' || dir === 'DOWN' || dir === 'した') {
        cmd = 'd'
      } else if (dir === '右' || dir === 'RIGHT' || dir === 'みぎ') {
        cmd = 'r'
      } else if (dir === '左' || dir === 'LEFT' || dir === 'ひだり') {
        cmd = 'l'
      } else {
        throw Error('方向の指定が正しくありません。前後上下左右のいずれかで指定してください。')
      }
      return turtle3d.queCurrentTurtle(new CommandMoveDirection(cmd, l))
    },
    return_none: false
  },
  'T3Dカメ角度設定': { // @カメの向きをオイラー([x,y,z,XYZ])にて設定する // @T3Dかめかくどせってい
    type: 'func',
    josi: [['に', 'へ', 'の']],
    pure: true,
    fn: function (angle: THREENS.EulerArray, sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.queCurrentTurtle(new CommandAngle(angle))
    },
    return_none: false
  },
  'T3Dカメ右回転': { // @カメの向きをAだけ右に向ける // @T3Dかめみぎかいてん
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (a: number, sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.queCurrentTurtle(new CommandRotate('r', a))
    },
    return_none: false
  },
  'T3Dカメ左回転': { // @カメの向きをAだけ左に向ける // @T3Dかめひだりかいてん
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (a: number, sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.queCurrentTurtle(new CommandRotate('l', a))
    },
    return_none: false
  },
  'T3Dカメ上回転': { // @カメの向きをAだけ上に向ける // @T3Dかめうえかいてん
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (a: number, sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.queCurrentTurtle(new CommandRotate('u', a))
    },
    return_none: false
  },
  'T3Dカメ下回転': { // @カメの向きをAだけ下に向ける // @T3Dかめしたかいてん
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (a: number, sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.queCurrentTurtle(new CommandRotate('d', a))
    },
    return_none: false
  },
  'T3Dカメ回転': { // @カメの向きをAだけDIRに向ける // @T3Dかめかいてん
    type: 'func',
    josi: [['へ', 'に'], ['だけ']],
    pure: true,
    fn: function (dir: string, a: number, sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      let cmd:RotateDirection
      if (dir === '上' || dir === 'UP' || dir === 'うえ') {
        cmd = 'u'
      } else if (dir === '下' || dir === 'DOWN' || dir === 'した') {
        cmd = 'd'
      } else if (dir === '右' || dir === 'RIGHT' || dir === 'みぎ') {
        cmd = 'r'
      } else if (dir === '左' || dir === 'LEFT' || dir === 'ひだり') {
        cmd = 'l'
      } else {
        throw Error('方向の指定が正しくありません。上下左右のいずれかで指定してください。')
      }
      return turtle3d.queCurrentTurtle(new CommandRotate(cmd, a))
    },
    return_none: false
  },
  'T3Dカメ右ロール': { // @カメをAだけ右に傾ける // @T3Dかめみぎろーる
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (a: number, sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.queCurrentTurtle(new CommandRoll('r', a))
    },
    return_none: false
  },
  'T3Dカメ左ロール': { // @カメのAだけ左に傾ける // @T3Dかめひだりろーる
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (a: number, sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.queCurrentTurtle(new CommandRoll('l', a))
    },
    return_none: false
  },
  'T3Dカメ傾': { // @カメをAだけDIRに傾ける // @T3Dかめかたむける
    type: 'func',
    josi: [['に', 'へ'], ['だけ']],
    pure: true,
    fn: function (dir: string, a: number, sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      let cmd:RollDirection
      if (dir === '右' || dir === 'RIGHT' || dir === 'みぎ') {
        cmd = 'r'
      } else if (dir === '左' || dir === 'LEFT' || dir === 'ひだり') {
        cmd = 'l'
      } else {
        throw Error('向きの指定が正しくありません。左右のどちらかで指定してください。')
      }
      return turtle3d.queCurrentTurtle(new CommandRoll(cmd, a))
    },
    return_none: false
  },
  'T3Dカメペン色設定': { // @カメのペン描画色をCに設定する // @T3Dかめぺんいろせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (c: number|THREENS.Color, sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      if (typeof c === 'number') { c = new three.Color(c) }
      return turtle3d.queCurrentTurtle(new CommandPenColor(c))
    },
    return_none: false
  },
  'T3Dカメペンサイズ設定': { // @カメペンのサイズをWに設定する // @T3Dかめぺんさいずせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (w: number, sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.queCurrentTurtle(new CommandPenWidth(w))
    },
    return_none: false
  },
  'T3Dカメペン設定': { // @カメペンを使うかどうかをV(オン/オフ)に設定する // @T3Dかめぺんせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (w: boolean|number, sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.queCurrentTurtle(new CommandPenEnable(!!w))
    },
    return_none: false
  },
  'T3Dカメ全消去': { // @表示しているカメと描画内容を全部消去する // @T3Dかめぜんしょうきょ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem):void {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.clearAll()
    },
    return_none: true
  },
  'T3Dカメ非表示': { // @カメのモデルを非表示にする。描画に影響しない。 // @T3Dかめひひょうじ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.queCurrentTurtle(new CommandVisible(false))
    },
    return_none: false
  },
  'T3Dカメ表示': { // @非表示にしたカメのモデルを表示する。 // @T3Dかめひょうじ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem): Promise<number> {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.queCurrentTurtle(new CommandVisible(true))
    },
    return_none: false
  },
  'T3D視点カメ設定': { // @指定したカメを視点として使用する // @T3Dしてんかめせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (n: number, sys: NakoSystem):void {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      if (n < 0 || n >= turtle3d.turtles.length) {
        throw Error('指定された番号のカメはいません。')
      }
      turtle3d.camera = n
      turtle3d.animationStart()
    },
    return_none: true
  },
  // @3Dタートルグラフィックス・基本機能
  'T3D自動描画': { type: 'var', value: true }, // @T3Dじどうびょうが
  'T3D自動実行': { type: 'var', value: true }, // @T3Dじどうじっこう
  'T3D描画準備': { // @指定したDOMのIDに対する描画を準備し、描画オブジェクトを返す // @T3Dびょうがじゅんび
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (to: string|Element|null, sys: NakoSystem):THREENS.WebGLRenderer {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)

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
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.doDraw(true)
    },
    return_none: true
  },
  'T3D上書描画': { // @現在の状態を元イメージをクリアせずに描画する // @T3Dうわがきびょうが
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem):void {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.doDraw(false)
    },
    return_none: true
  },
  'T3D実行': { // @各カメの動きを経過時間等に従い実行する // @T3Dじっこう
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem):void {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.animationTick()
    },
    return_none: true
  },
  'T3D背景色設定': { // @canvasをクリアする際の背景色を設定する // @T3Dはいけいしょくせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (c: number, sys: NakoSystem):void {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
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
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
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
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
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
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.clearRenderer()
    },
    return_none: true
  },
  'T3D内部レンダラ取得': { // @本プラグイン内部で使用しているレンダラを返す // @T3Dないぶれんだらしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem): THREENS.WebGLRenderer {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.getRenderer()
    },
    return_none: false
  },
  'T3D内部シーン取得': { // @本プラグイン内部で使用しているシーンを返す // @T3Dないぶしーんしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem): THREENS.Scene {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.getScene()
    },
    return_none: false
  },
  'T3D内部カメラ取得': { // @本プラグイン内部で使用しているカメラを返す // @T3Dないぶかめらしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem): THREENS.Camera {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d.getCamera()
    },
    return_none: false
  },
  'T3D内部線描画参照取得': { // @本プラグイン内部で保持している描いた線のデータの参照を返す // @T3Dないぶせんびょうがさんしょうしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem): null|THREENS.Group {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      return turtle3d._lines
    },
    return_none: false
  },
  'T3D内部線描画取出': { // @本プラグイン内部で保持している描いた線のデータを取り出して返す // @T3Dないぶせんびょうがとりだし
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem): null|THREENS.Group {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      const lines = turtle3d._lines
      turtle3d._lines = new three.Group()
      turtle3d.animationStart()
      return lines
    },
    return_none: false
  },
  'T3D待': { // @Promiseの終了を待って結果を返す // @T3Dまつ
    type: 'func',
    josi: [['を']],
    asyncFn: true,
    pure: true,
    fn: function (p: Promise<any>, sys: NakoSystem): Promise<any> {
      return p
    },
    return_none: false
  },
  // @3Dタートルグラフィックス・ヘルパ機能
  'T3Dオービットコントロール設定': { // オービットコントロールを組み込む // @T3Dおーびっとこんとろーるせってい
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem): null|THREENS.OrbitControls {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
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
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
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
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
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
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.setCameraHelper(true)
    },
    return_none: true
  },
  'T3Dカメラヘルパ非表示': { // @カメラヘルパーを非表示にする // @T3Dかめらへるぱひひょうじ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem):void {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.setCameraHelper(false)
    },
    return_none: true
  },
  'T3D軸線ヘルパ表示': { // @座標軸ヘルパーを表示する // @T3Dじくせんへるぱひょうじ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem):void {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
      turtle3d.setAxisHelper(true)
    },
    return_none: true
  },
  'T3D軸線ヘルパ非表示': { // @座標軸ヘルパーを非表示にする // @T3Dじくせんへるぱひひょうじ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem):void {
      const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys)
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
