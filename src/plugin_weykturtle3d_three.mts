 
/* eslint-disable @typescript-eslint/no-misused-new */

export type EulerOrder = string
export type EulerArray = [number, number, number]|[number, number, number, EulerOrder]
  interface RendererOptions {
  antialias?: boolean
  alpha?: boolean
  canvas?: HTMLCanvasElement
}
export interface ArrowHelper extends LineSegments {
  new (dir: Vector3, origin: Vector3, len: number, c: Color|number): ArrowHelper
  setDirection (dir: Vector3): void
}
export interface AxesHelper extends LineSegments {
  new (n: number): AxesHelper
}
interface AxisHelper extends LineSegments {
  new (n: number): AxisHelper
}
interface BufferAttribute {
  new (v: Float32Array, n: number): BufferAttribute
  copyArray (a: number[]): void
}
export interface BufferGeometry {
  new (): BufferGeometry
  computeBoundingSphere (): void
  dispose (): void
  setAttribute (name: string, attr: BufferAttribute): void
  setIndex(a: number[]): void
}
export interface Camera extends Object3D {
  up: Vector3
}
export interface CameraHelper extends LineSegments {
  new (c: Camera): CameraHelper
  update (): void
}
export interface Color {
  new (c: number): Color
}
export interface Controls {
  enabled: boolean
  new (c: Camera, e: Element): Controls
  update (): void
}
export interface Disporsal {
  dispose (): void
}
interface Euler {
  new (): Euler
  fromArray (a:[number, number, number]|[number, number, number, string]): void
}
interface Float32BufferAttribute extends BufferAttribute {
  new (n: number, m: number): Float32BufferAttribute
}
export interface Fog {
  new (c: number|Color, near?:number, far?: number): Fog
}
export interface FogExp2 {
  new (c: number|Color, d?:number): FogExp2
}
export interface Group extends Object3D {
  new (): Group
}
export interface Line extends Object3D {
  new (g: BufferGeometry, m: Material): Line
}
interface LineSegments extends Line {
  new (): LineSegments
}
interface LineBasicMaterial extends Material {
  new (opt: any): LineBasicMaterial
}
interface Matrix3 {
  new (): Matrix3
}
export interface Matrix4 {
  new (): Matrix4
}
interface Material {
  dispose (): void
}
export interface Mesh extends Object3D {
  geometry: BufferGeometry
  material: Material
}
export interface Object3D {
  new (): Object3D
  children: Object3D[]
  matrixWorld: Matrix4
  position: Vector3
  quaternion: Quaternion
  rotation: Euler
  scale: Vector3
  visible: boolean
  add (obj:Object3D|Object3D[]): void
  applyMatrix3 (mat: Matrix3): void
  applyMatrix4 (mat: Matrix4): void
  applyQuaternion (q: Quaternion): void
  getWorldDirection (v: Vector3): void
  getWorldQuaternion (q: Quaternion): void
  getWorldPosition (v: Vector3): void
  lookAt(v: Vector3): void
  remove (obj:Object3D|Object3D[]): void
  toJSON (): string
  translateOnAxis (axis: Vector3, distance: number): void
}
interface ObjectLoader {
  new (): ObjectLoader
  load (url: string, callback: (obj: Object3D) => void,
                      progress: (xhr: XMLHttpRequest) => void,
                      err: (xhr: XMLHttpRequest) => void): void
}
export interface OrbitControls extends Controls {
  new (): OrbitControls
}
export interface PerspectiveCamera extends Camera {
  aspect: number
  far: number
  focus: number
  fov: number
  near: number
  zoom: number
  new (w: number, raito: number, near: number, far: number): PerspectiveCamera
}
export interface Quaternion {
  new (): Quaternion
  new (x: number, y: number, z: number, w:number): Quaternion
  angleTo (q: Quaternion): number
  clone(): Quaternion
  copy (q: Quaternion): void
  multiply (q: Quaternion): void
  set (x: number, y: number, z: number, w:number): void
  setFromAxisAngle (v: Vector3, a: number): void
  setFromEuler(e: Euler): void
}
export interface Renderer {
  autoClear: boolean
  domElement: Element
  shadowMap: ShadowMap
  new (): Renderer
  clear (): void
  render (s: Scene, c: Camera): void
  setClearColor (c: Color|number, a?: number): void
  setClearAlpha (a: number): void
  setPixelRatio (ratio: number): void
  setSize(w: number, h: number): void
  getSize(rect: Vector2): void
}
export interface Scene extends Object3D {
  new (): Scene
  background: number|Color
  fog: Fog
}
export interface ShadowMap {
  enabled: boolean
  new () : ShadowMap
}
export interface Vector2 {
  width: number
  height: number
  new (): Vector2
  new (x: number, y: number): Vector2
  set (x: number, y: number): void
}
export interface Vector3 {
  x: number
  y: number
  z: number
  new (): Vector3
  new (x: number, y: number, z: number): Vector3
  add (v: Vector3): void
  applyQuaternion(q: Quaternion): void
  clone(): Vector3
  copy (v: Vector3): void
  multiplyScalar (n: number): void
  normalize (): Vector3
  set (x: number, y: number, z: number): void
}

export interface WebGLRenderer extends Renderer {
  new (opt: RendererOptions): WebGLRenderer
}

export interface THREE {
  ArrowHelper?: ArrowHelper
  AxesHelper?: AxesHelper
  AxisHelper?: AxisHelper
  BufferAttribute: BufferAttribute
  BufferGeometry: BufferGeometry
  CameraHelper?: CameraHelper
  Color: Color
  Euler: Euler
  Float32BufferAttribute: Float32BufferAttribute
  Fog: Fog
  FogExp2: FogExp2
  Group: Group
  Line: Line
  LineBasicMaterial: LineBasicMaterial
  LineSegments: LineSegments
  Matrix3: Matrix3
  Matrix4: Matrix4
  Object3D: Object3D
  ObjectLoader: ObjectLoader
  OrbitControls?: OrbitControls
  PerspectiveCamera: PerspectiveCamera
  Quaternion: Quaternion
  Renderer: Renderer
  Scene: Scene
  Vector2: Vector2
  Vector3: Vector3
  WebGLRenderer: WebGLRenderer
}
