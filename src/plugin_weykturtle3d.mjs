/**
 * PluginWeykTurtle3D
 * 3d turtle graphics plugin
 */
import { ThreeUtil } from './plugin_weykturtle3d_threeutil.mjs';
class DrawLineEventArgs {
    constructor(v1, v2, width, color) {
        this.v1 = v1;
        this.v2 = v2;
        this.width = width;
        this.color = color;
    }
}
class Command {
}
class CommandPromise {
    constructor(command, resolve, reject) {
        this.command = command;
        this.resolve = resolve;
        this.reject = reject;
    }
}
class CommandHome extends Command {
    constructor(mode) {
        super();
        this.cmd = 'home';
        this.mode = mode;
    }
}
class CommandJump extends Command {
    constructor(v) {
        super();
        this.cmd = 'jump';
        this.v = v;
    }
}
class CommandMoveAbsolute extends Command {
    constructor(v) {
        super();
        this.cmd = 'move';
        this.v = v;
    }
}
class CommandAngle extends Command {
    constructor(angle) {
        super();
        this.cmd = 'angle';
        this.angle = angle;
    }
}
class CommandMoveDirection extends Command {
    constructor(dir, l) {
        super();
        this.cmd = 'slide';
        this.direction = dir;
        this.length = l;
    }
}
class CommandRotate extends Command {
    constructor(dir, a) {
        super();
        this.cmd = 'rotate';
        this.direction = dir;
        this.angle = a;
    }
}
class CommandRoll extends Command {
    constructor(dir, a) {
        super();
        this.cmd = 'roll';
        this.direction = dir;
        this.angle = a;
    }
}
class CommandPenEnable extends Command {
    constructor(enable) {
        super();
        this.cmd = 'pen';
        this.subcmd = 'enable';
        this.enable = enable;
    }
}
class CommandPenColor extends Command {
    constructor(color) {
        super();
        this.cmd = 'pen';
        this.subcmd = 'color';
        this.color = color;
    }
}
class CommandPenWidth extends Command {
    constructor(width) {
        super();
        this.cmd = 'pen';
        this.subcmd = 'width';
        this.width = width;
    }
}
class CommandVisible extends Command {
    constructor(visible) {
        super();
        this.cmd = 'attr';
        this.subcmd = 'visible';
        this.visible = visible;
    }
}
class CommandModel extends Command {
    constructor(model) {
        super();
        this.cmd = 'attr';
        this.subcmd = 'model';
        this.model = model;
    }
}
const TypedTurtle3DEventTarget = EventTarget;
class Turtle3D extends TypedTurtle3DEventTarget {
    constructor(three, id) {
        super();
        this.three = three;
        this.id = id;
        const modelBase = new three.Group();
        this.obj = modelBase;
        this.home = {
            position: new three.Vector3(0, 0, 0),
            quaternion: new three.Quaternion()
        };
        this.color = new three.Color(0xffffff);
        this.disposal = false;
        this.lineWidth = 4;
        this.flagDown = true;
        this.flagLoaded = false;
        this.f_visible = true;
        this.macros = [];
        this.home.position.copy(modelBase.position);
        this.home.quaternion.copy(modelBase.quaternion);
    }
    clear() {
        // 未実行ジョブのPromiseを全て完了にする
        for (const job of this.macros) {
            job.resolve(0);
        }
        this.macros = []; // ジョブをクリア
        // かめのモデルをカメから削除
        this.discardModel();
        this.f_visible = true;
        this.obj.visible = true;
    }
    discardModel() {
        if (this.disposal) {
            ThreeUtil.disposeChildObject(this.obj);
            this.disposal = false;
        }
        else {
            this.obj.remove(this.obj.children[0]);
        }
        this.flagLoaded = false;
    }
    loadTurtle(model) {
        if (this.isObject3D(model)) {
            this.discardModel();
            this.obj.add(model);
            this.disposal = false;
            this.flagLoaded = true;
            this.raiseModelChanged();
            return;
        }
        const url = model;
        if (url.length === 0) {
            this.discardModel();
            this.obj.add(this.createDefaultTurtle());
            this.disposal = true;
            this.flagLoaded = true;
            this.raiseModelChanged();
            return;
        }
        const loader = new this.three.ObjectLoader();
        loader.load(url, (obj) => {
            this.discardModel();
            this.obj.add(obj);
            this.disposal = true;
            this.flagLoaded = true;
            this.raiseModelChanged();
        }, (xhr) => {
            // nothing
        }, (xhr) => {
            this.discardModel();
            this.f_visible = false;
            this.obj.visible = false;
            this.raiseModelChanged();
        });
    }
    doMacro(noWait) {
        if (!this.flagLoaded && !noWait) {
            return true;
        }
        const que = this.macros.shift();
        if (typeof que === 'undefined') {
            return false;
        }
        const m = que instanceof CommandPromise ? que.command : que;
        if (m instanceof CommandJump) {
            // 起点を移動する
            this.obj.position.copy(m.v);
        }
        else if (m instanceof CommandMoveAbsolute) {
            const v1 = this.obj.position.clone();
            const v2 = m.v;
            // 線を引く
            this.line(v1, v2);
            // カメの角度を変更
            this.obj.lookAt(v2);
            const headup90 = new this.three.Quaternion();
            const axisX = new this.three.Vector3(1, 0, 0);
            headup90.setFromAxisAngle(axisX, Math.PI / 2);
            this.obj.quaternion.multiply(headup90);
            // カメを移動
            this.obj.position.copy(v2);
        }
        else if (m instanceof CommandMoveDirection) {
            const dir = m.direction;
            const l = m.length * ((dir === 'b') ? -1 : 1);
            const v1 = this.obj.position.clone();
            const v2 = new this.three.Vector3(0, l, 0);
            if (dir === 'f' || dir === 'b') {
                v2.applyQuaternion(this.obj.quaternion);
            }
            else {
                // u
                const modifier = new this.three.Quaternion();
                const target = this.obj.quaternion.clone();
                if (dir === 'u' || dir === 'd') {
                    const axis = new this.three.Vector3(1, 0, 0);
                    if (dir === 'u') {
                        modifier.setFromAxisAngle(axis, (-90) * Math.PI / 180);
                    }
                    else { // dir === 'd'
                        modifier.setFromAxisAngle(axis, 90 * Math.PI / 180);
                    }
                }
                else { // dir === 'l' || dir === 'r'
                    const axis = new this.three.Vector3(0, 0, 1);
                    if (dir === 'l') {
                        modifier.setFromAxisAngle(axis, 90 * Math.PI / 180);
                    }
                    else { // dir === 'r'
                        modifier.setFromAxisAngle(axis, (-90) * Math.PI / 180);
                    }
                }
                target.multiply(modifier);
                v2.applyQuaternion(target);
            }
            v2.add(v1);
            this.line(v1, v2);
            this.obj.position.copy(v2);
        }
        else if (m instanceof CommandHome) {
            const mode = m.mode;
            switch (mode) {
                case 'set':
                    this.home.position.copy(this.obj.position);
                    this.home.quaternion.copy(this.obj.quaternion);
                    break;
                case 'jump':
                    this.obj.position.copy(this.home.position);
                    this.obj.quaternion.copy(this.home.quaternion);
                    break;
            }
        }
        else if (m instanceof CommandRotate) {
            const dir = m.direction;
            const rv = m.angle * (dir === 'l' || dir === 'd' ? 1 : -1);
            const target = new this.three.Quaternion();
            let axis;
            if (dir === 'l' || dir === 'r') {
                axis = new this.three.Vector3(0, 0, 1);
            }
            else {
                axis = new this.three.Vector3(1, 0, 0);
            }
            target.setFromAxisAngle(axis, (rv % 360) * Math.PI / 180);
            this.obj.quaternion.multiply(target);
        }
        else if (m instanceof CommandRoll) {
            const dir = m.direction;
            const rv = m.angle * (dir === 'r' ? 1 : -1);
            const axis = new this.three.Vector3(0, 1, 0);
            const target = new this.three.Quaternion();
            target.setFromAxisAngle(axis, (rv % 360) * Math.PI / 180);
            this.obj.quaternion.multiply(target);
        }
        else if (m instanceof CommandPenColor) {
            this.color = m.color;
        }
        else if (m instanceof CommandPenWidth) {
            this.lineWidth = m.width;
        }
        else if (m instanceof CommandPenEnable) {
            this.flagDown = m.enable;
        }
        else if (m instanceof CommandVisible) {
            this.f_visible = m.visible;
            if (this.f_visible) {
                this.obj.visible = true;
            }
            else {
                this.obj.visible = false;
            }
        }
        else if (m instanceof CommandModel) {
            this.flagLoaded = false;
            this.loadTurtle(m.model);
        }
        else if (m instanceof CommandAngle) {
            const euler = new this.three.Euler();
            euler.fromArray(m.angle);
            // eslint-disable-next-line no-unused-vars
            const dir = new this.three.Quaternion();
            this.obj.quaternion.setFromEuler(euler);
        }
        if (que instanceof CommandPromise) {
            que.resolve(0);
        }
        return (this.macros.length > 0);
    }
    createDefaultTurtle() {
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
        ]);
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
        ]);
        const indices = [
            0, 1, 1, 2, 2, 3, 3, 0,
            4, 5, 4, 6, 4, 7, 4, 8,
            9, 10, 9, 11, 9, 12, 9, 13
        ];
        const obj = new this.three.Group();
        const material = new this.three.LineBasicMaterial({ vertexColors: true });
        const geometry = new this.three.BufferGeometry();
        geometry.setIndex(indices);
        geometry.setAttribute('position', new this.three.BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new this.three.BufferAttribute(colors, 3));
        geometry.computeBoundingSphere();
        const lineSegments = new this.three.LineSegments(geometry, material);
        lineSegments.scale.set(30.0, 30.0, 30.0);
        obj.add(lineSegments);
        return obj;
    }
    raiseModelChanged() {
        const evt = new CustomEvent('modelChanged');
        this.dispatchEvent(evt);
    }
    raiseDrawLine(v1, v2, width, color) {
        const args = new DrawLineEventArgs(v1, v2, width, color);
        const evt = new CustomEvent('drawLine', { detail: args });
        this.dispatchEvent(evt);
    }
    line(v1, v2) {
        if (!this.flagDown) {
            return;
        }
        this.raiseDrawLine(v1, v2, this.lineWidth, this.color);
    }
    isObject3D(obj) {
        return obj instanceof this.three.Object3D;
    }
}
class WeykTurtle3DSystem {
    static getInstance(sys) {
        if (WeykTurtle3DSystem.instance === undefined) {
            WeykTurtle3DSystem.instance = new WeykTurtle3DSystem(sys);
        }
        else if (WeykTurtle3DSystem.instance.sys !== sys) {
            console.log('T3D: difference sys instance');
            WeykTurtle3DSystem.instance.sys = sys;
        }
        const i = WeykTurtle3DSystem.instance;
        i.instanceCount += 1;
        return WeykTurtle3DSystem.instance;
    }
    constructor(sys) {
        this.instanceCount = 0;
        this.three = null;
        this.sys = sys;
        this.containerid = '';
        this.camera = -1;
        this.target = -1;
        this._renderer = null;
        this._scene = null;
        this._lines = null;
        this._camera = null;
        this._controls = null;
        this._camerahelper = null;
        this._axishelper = null;
        this.turtles = [];
        this.flagSetTimer = false;
        this._prevUpdatedTime = 0;
    }
    clearAll() {
        this.disposeAllTurtle();
        this.disposeAllLine();
        const scene = this._scene;
        if (scene && this._lines) {
            scene.remove(this._lines);
            scene.add(this._lines);
            if (this._camerahelper !== null) {
                this._camerahelper.visible = false;
                scene.remove(this._camerahelper);
                scene.add(this._camerahelper);
            }
            if (this._axishelper !== null) {
                this._axishelper.visible = false;
                scene.remove(this._axishelper);
                scene.add(this._axishelper);
            }
        }
    }
    disposeAllTurtle() {
        // カメをクリア
        for (const tt of this.turtles) {
            tt.clear();
        }
        this.turtles = [];
        this.target = -1;
        this.camera = -1;
        this.flagSetTimer = false;
    }
    disposeAllLine() {
        // 引いた線を線用のバッファからクリア
        if (this._lines !== null) {
            ThreeUtil.disposeChildObject(this._lines);
        }
    }
    getThree() {
        if (!this.three) {
            throw new Error('ThreeJSの準備される前に使用しようとしました');
        }
        return this.three;
    }
    createTurtle(modelUrl) {
        // カメの情報を sys._turtle リストに追加
        const three = this.getThree();
        const id = this.turtles.length;
        const tt = new Turtle3D(three, id);
        tt.addEventListener('modelChanged', (e) => {
            const redraw = !!this.sys.__getSysVar('T3D自動描画');
            if (redraw) {
                this.doDraw(true);
            }
        });
        tt.addEventListener('drawLine', (e) => {
            this.drawLine(e.detail.v1, e.detail.v2, e.detail.width, e.detail.color);
        });
        this.turtles.push(tt);
        this.target = id;
        tt.loadTurtle(modelUrl);
        const scene = this.getScene();
        scene.add(tt.obj);
        return id;
    }
    initTurtle() {
        if (this.turtles.length === 0) {
            if (this._renderer === null) {
                this.initRenderer();
            }
            const three = this.getThree();
            // カメを１つ生成する
            const index = this.createTurtle('');
            // 生成したカメをカメラ用カメとして設定する
            const tt = this.turtles[index];
            tt.obj.position.set(0, 0, 1000);
            const axis = new three.Vector3(0, 0, -1).normalize();
            const angle = 0;
            tt.obj.quaternion.setFromAxisAngle(axis, angle);
            tt.home.position.copy(tt.obj.position);
            tt.home.quaternion.copy(tt.obj.quaternion);
            tt.f_visible = false;
            tt.obj.visible = false;
            this.camera = index;
            this.target = -1;
        }
    }
    getCur() {
        if (this.turtles.length === 0) {
            throw Error('最初に『T3Dカメ作成』命令を呼び出してください。');
        }
        if (this.target < 0 || this.target >= this.turtles.length) {
            throw Error('指定された番号のカメはいません。');
        }
        return this.turtles[this.target];
    }
    queCurrentTurtle(cmd) {
        const tt = this.getCur();
        const promise = new Promise((resolve, reject) => {
            const que = new CommandPromise(cmd, resolve, reject);
            tt.macros.push(que);
            this.animationStart();
        });
        return promise;
    }
    doDraw(beforeClear) {
        if (this.camera === -1) {
            return;
        }
        if (!this._scene) {
            return;
        }
        this.getRenderer();
        if (!this._renderer) {
            return;
        }
        this.getCamera();
        if (!this._camera) {
            return;
        }
        const camera = this.turtles[this.camera];
        if (this._controls === null) {
            this._camera.position.copy(camera.obj.position);
            this._camera.quaternion.copy(camera.obj.quaternion);
        }
        if (this._camerahelper !== null) {
            this._camerahelper.update();
        }
        if (this._controls !== null) {
            this._controls.update();
            camera.obj.position.copy(this._camera.position);
            camera.obj.quaternion.copy(this._camera.quaternion);
        }
        if (beforeClear) {
            this._renderer.clear();
        }
        this._renderer.render(this._scene, this._camera);
    }
    setCameraHelper(flag) {
        const three = this.getThree();
        if (flag) {
            if (this._camerahelper === null) {
                if (this._scene && this._camera) {
                    if (typeof three.CameraHelper === 'undefined') {
                        throw Error('カメラヘルパの機能が見当たりません。');
                    }
                    const cameraHelper = new three.CameraHelper(this._camera);
                    this._camerahelper = cameraHelper;
                    this._scene.add(cameraHelper);
                }
            }
            this._camerahelper.visible = true;
        }
        else {
            if (this._camerahelper !== null) {
                this._camerahelper.visible = false;
            }
        }
    }
    setAxisHelper(flag) {
        const three = this.getThree();
        if (flag) {
            if (this._axishelper === null) {
                if (this._scene) {
                    if (typeof three.AxisHelper === 'undefined') {
                        throw Error('AXISヘルパの機能が見当たりません。');
                    }
                    const axisHelper = new three.AxisHelper(1000);
                    this._axishelper = axisHelper;
                    this._scene.add(axisHelper);
                }
            }
            this._axishelper.visible = true;
        }
        else {
            if (this._axishelper !== null) {
                this._axishelper.visible = false;
            }
        }
    }
    getScene() {
        const three = this.getThree();
        if (this._scene === null) {
            this._scene = new three.Scene();
        }
        return this._scene;
    }
    getCamera() {
        const three = this.getThree();
        if (this._camera === null) {
            const camera = new three.PerspectiveCamera(60, 1.0, 1, 65000);
            this.resetCamera(camera);
            this._camera = camera;
        }
        return this._camera;
    }
    resetCamera(camera) {
        const three = this.getThree();
        camera.position.set(0, 0, 1000);
        if (this._renderer !== null) {
            const rect = new three.Vector2();
            this._renderer.getSize(rect);
            if ('aspect' in camera) {
                camera.aspect = rect.width / rect.height;
            }
        }
        camera.up = new three.Vector3(0, 1, 0);
        camera.lookAt(new three.Vector3(0, 0, 0));
    }
    initTrutle3dEnv(renderer) {
        renderer.setClearColor(0x000000, 1.0);
        renderer.autoClear = false;
        const scene = this.getScene();
        // eslint-disable-next-line no-unused-vars
        const camera = this.getCamera();
        if (scene && this._lines) {
            scene.add(this._lines);
            if (this.turtles.length === 0) {
                this.initTurtle();
            }
        }
    }
    initRenderer() {
        // 描画先をセットする
        let to = this.sys.__getSysVar('T3Dカメ描画先');
        if (typeof to === 'string') {
            to = document.querySelector(to) || document.getElementById(to);
        }
        if (!to) {
            throw new Error('[ERROR] T3Dカメ描画先が見当たりません。');
        }
        const renderer = this.setRenderer(to);
        this.setupRenderer();
        return renderer;
    }
    setRenderer(to) {
        const three = this.getThree();
        let renderer = null;
        if (to instanceof three.WebGLRenderer) {
            renderer = to;
        }
        else if (to instanceof HTMLCanvasElement) {
            renderer = new three.WebGLRenderer({ antialias: false, alpha: true, canvas: to });
            if (renderer === null) {
                throw new Error('レンダラを作成できません。指定したCanvas要素は使用できません');
            }
            renderer.setSize(to.width, to.height);
        }
        else if (to instanceof Element) {
            renderer = new three.WebGLRenderer({ antialias: false, alpha: true });
            if (renderer === null) {
                throw new Error('レンダラを作成できません。指定したDOM要素は使用できません');
            }
            renderer.setSize(to.clientWidth, to.clientHeight);
            to.appendChild(renderer.domElement);
        }
        else {
            // never
            throw new Error('レンダラを作成できません。それは作成先に指定できません');
        }
        renderer.setPixelRatio(window.devicePixelRatio);
        this._renderer = renderer;
        return this._renderer;
    }
    clearRenderer() {
        this._renderer = null;
        if (this._controls) {
            this._controls.enabled = false;
            this._controls = null;
        }
    }
    setupRenderer() {
        if (this._renderer) {
            this.initTrutle3dEnv(this._renderer);
        }
    }
    getRenderer() {
        if (this._renderer === null) {
            this.initRenderer();
        }
        return this._renderer;
    }
    setupControl(controlConstrucor) {
        if (typeof controlConstrucor === 'undefined') {
            throw new Error('指定されたコンコントロールが見当たりません。');
        }
        if (this._controls !== null) {
            if (this._controls instanceof controlConstrucor) {
                return this._controls;
            }
            else {
                throw new Error('既にコントロールを適用しています。コントロールの変更はできません。');
            }
        }
        const renderer = this.getRenderer();
        const camera = this.getCamera();
        // eslint-disable-next-line new-cap
        const controls = new controlConstrucor(camera, renderer.domElement);
        controls.enabled = true;
        this._controls = controls;
        return this._controls;
    }
    drawLine(v1, v2, width, color) {
        const three = this.getThree();
        const geometry = new three.BufferGeometry();
        const vertices = new three.Float32BufferAttribute(6, 3);
        vertices.copyArray([v1.x, v1.y, v1.z, v2.x, v2.y, v2.z]);
        const material = new three.LineBasicMaterial({ color, linewidth: width });
        geometry.setAttribute('position', vertices);
        const line = new three.Line(geometry, material);
        if (this._lines) {
            this._lines.add(line);
        }
    }
    doMacroAllTurtles() {
        let hasNext = false;
        for (const tt of this.turtles) {
            if (tt.doMacro(this.isNoWait())) {
                hasNext = true;
            }
        }
        return hasNext;
    }
    animationStart() {
        const wait = this.getWait();
        const macrorun = !!this.sys.__getSysVar('T3D自動実行');
        if (!macrorun) {
            return;
        }
        if (this.isNoWait()) {
            this.animation();
            return;
        }
        if (this.flagSetTimer) {
            return;
        }
        this.flagSetTimer = true;
        this.animationFrame(() => this.animation());
    }
    getWait() {
        return this.sys.__getSysVar('T3Dカメ速度');
    }
    isNoWait() {
        return this.sys.__getSysVar('T3Dカメ速度') === 0;
    }
    animation() {
        const redraw = !!this.sys.__getSysVar('T3D自動描画');
        const macrorun = !!this.sys.__getSysVar('T3D自動実行');
        const hasNext = this.animationTick();
        if (redraw) {
            this.doDraw(true);
        }
        if ((hasNext || this._controls !== null) && macrorun) {
            this.animationFrame(() => this.animation());
        }
        else {
            this.flagSetTimer = false;
        }
    }
    animationTick() {
        const now = Date.now();
        const noWait = this.isNoWait();
        // ノーウエイトではない場合の時間待ち処理
        if (!noWait) {
            const elapsedMs = now - this._prevUpdatedTime;
            const wait = this.getWait();
            if (wait > 0 && elapsedMs < wait) {
                return true;
            }
        }
        this._prevUpdatedTime = now;
        let hasNext;
        if (noWait) {
            while (this.doMacroAllTurtles()) {
                // no-op
            }
            hasNext = false;
        }
        else {
            hasNext = this.doMacroAllTurtles();
        }
        return hasNext;
    }
    animationFrame(callback, element) {
        window.setTimeout(callback, 1000 / 60);
    }
    ck() {
        if (this.three === null) {
            if (this.sys.__getSysVar('THREE') !== null) {
                this.three = this.sys.__getSysVar('THREE');
            }
            else if (typeof window.THREE !== 'undefined') {
                this.three = window.THREE;
            }
        }
        if (this.three === null) {
            throw new Error('three.module.jsが読み込まれていません');
        }
        if (this.sys.__getSysVar('THREE') === null) {
            this.sys.__setSysVar('THREE', this.three);
        }
        if (this._lines === null) {
            this._lines = new this.three.Group();
        }
        return this.three;
    }
    static getTurtle3D(sys) {
        if (!sys.tags.weykturtle3d) {
            throw new Error('プラグインの初期化が行われていません');
        }
        return sys.tags.weykturtle3d;
    }
    static getEnv(sys) {
        const turtle3d = WeykTurtle3DSystem.getTurtle3D(sys);
        const three = turtle3d.ck();
        return [turtle3d, three];
    }
}
const PluginWeykTurtle3D = {
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
        fn: function (sys) {
            if (sys.tags.weykturtle3d) {
                return;
            }
            const turtle3dSystem = WeykTurtle3DSystem.getInstance(sys);
            sys.tags.weykturtle3d = turtle3dSystem;
            // オブジェクトを初期化
            sys.__setSysVar('THREE', null);
        }
    },
    '!クリア': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            if (sys.tags.weykturtle3d) {
                sys.tags.weykturtle3d.clearAll();
                sys.tags.weykturtle3d.clearRenderer();
            }
        }
    },
    // @3Dタートルグラフィックス・ライブラリとプラグイン
    'THREE': { type: 'const', value: '' }, // @THREE
    'T3DベースURL': { type: 'var', value: 'https://cdn.jsdelivr.net/npm/three@0.127.0' }, // @T3DべーすURL
    'T3Dライブラリ読込': {
        type: 'func',
        josi: [],
        asyncFn: true,
        pure: true,
        fn: async function (sys) {
            const turtle3d = WeykTurtle3DSystem.getTurtle3D(sys);
            if (turtle3d.three === null && sys.__getSysVar('THREE') === null) {
                const baseUrl = sys.__getSysVar('T3DベースURL');
                const moduleUrl = baseUrl === '' ? 'three' : (baseUrl + '/build/three.module.js');
                const promise = import(/* webpackIgnore: true */ moduleUrl);
                promise.then(module => {
                    turtle3d.three = Object.assign({}, module);
                    turtle3d.ck();
                    return true;
                });
                promise.catch(err => {
                    console.error('T3D:ThreeJSのライブラリの読み込みに失敗しました');
                    console.error(err);
                    return false;
                });
                return await promise;
            }
            else {
                turtle3d.ck();
                return true;
            }
        },
        return_none: false
    },
    'T3Dライブラリ読込後': {
        type: 'func',
        josi: [['に']],
        pure: true,
        fn: function (callback, sys) {
            const turtle3d = WeykTurtle3DSystem.getTurtle3D(sys);
            if (turtle3d.three === null && sys.__getSysVar('THREE') === null) {
                const baseUrl = sys.__getSysVar('T3DベースURL');
                const moduleUrl = baseUrl === '' ? 'three' : (baseUrl + '/build/three.module.js');
                const promise = import(/* webpackIgnore: true */ moduleUrl);
                promise.then(module => {
                    turtle3d.three = Object.assign({}, module);
                    turtle3d.ck();
                    callback(turtle3d.three !== null);
                });
                promise.catch(err => {
                    console.error('T3D:ThreeJSのライブラリの読み込みに失敗しました');
                    console.error(err);
                    callback(turtle3d.three !== null);
                });
            }
            else {
                turtle3d.ck();
                callback(turtle3d.three !== null);
            }
        },
        return_none: true
    },
    'T3Dプラグイン読込': {
        type: 'func',
        josi: [['を']],
        asyncFn: true,
        pure: true,
        fn: async function (plugins, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            const l = plugins.length;
            if (l === 0) {
                return;
            }
            const baseUrl = sys.__getSysVar('T3DベースURL');
            const totalPromise = new Promise((resolve, reject) => {
                const callbacks = (function (total) {
                    let countTotal = 0;
                    let countSuccess = 0;
                    return function (success) {
                        countTotal += 1;
                        if (success) {
                            countSuccess += 1;
                        }
                        if (countTotal === total) {
                            if (countTotal === countSuccess) {
                                resolve();
                            }
                            else {
                                reject(new Error('読み込みに失敗したプラグインがあります'));
                            }
                        }
                    };
                })(l);
                for (const name of plugins) {
                    const pluginUrl = baseUrl === '' ? name : (baseUrl + '/examples/jsm/' + name);
                    const promise = import(/* webpackIgnore: true */ pluginUrl);
                    promise.then(module => {
                        Object.assign(three, module);
                        callbacks(true);
                    });
                    promise.catch(err => {
                        console.error('T3D:ThreeJSのプラグインの読み込みに失敗しました');
                        console.error(err);
                        callbacks(false);
                    });
                }
            });
            return totalPromise;
        },
        return_none: true
    },
    'T3Dプラグイン読込後': {
        type: 'func',
        josi: [['に'], ['を']],
        pure: true,
        fn: function (callback, plugins, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            const l = plugins.length;
            if (l === 0) {
                callback();
                return;
            }
            const baseUrl = sys.__getSysVar('T3DベースURL');
            const callbacks = (function (callback, total) {
                let count = 0;
                return function (success) {
                    count += 1;
                    if (count === total) {
                        callback();
                    }
                };
            })(callback, l);
            for (let i = 0; i < l; i++) {
                const name = plugins[i];
                const pluginUrl = baseUrl === '' ? name : (baseUrl + '/examples/jsm/' + name);
                const promise = import(/* webpackIgnore: true */ pluginUrl);
                promise.then(module => {
                    Object.assign(three, module);
                    callbacks(true);
                });
                promise.catch(err => {
                    console.error('T3D:ThreeJSのプラグインの読み込みに失敗しました');
                    console.error(err);
                    callbacks(false);
                });
            }
        },
        return_none: true
    },
    // @3Dタートルグラフィックス・カメ操作
    'T3Dカメ作成': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            turtle3d.initTurtle();
            const modelUrl = sys.__getSysVar('T3DカメモデルURL');
            const id = turtle3d.createTurtle(modelUrl);
            return id;
        },
        return_none: false
    },
    'T3Dカメ操作対象設定': {
        type: 'func',
        josi: [['に', 'へ', 'の']],
        pure: true,
        fn: function (id, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            turtle3d.target = id;
        },
        return_none: true
    },
    'T3Dカメ描画先': { type: 'var', value: 'turtle3d_div' }, // @T3Dかめびょうがさき
    'T3DカメモデルURL': { type: 'var', value: '' }, // @T3DかめもでるURL
    'T3Dカメモデル変更': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (url, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.queCurrentTurtle(new CommandModel(url));
        },
        return_none: false
    },
    'T3Dカメ速度': { type: 'const', value: 100 }, // @T3Dかめそくど
    'T3Dカメ速度設定': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (v, sys) {
            sys.__setSysVar('T3Dカメ速度', v);
        },
        return_none: true
    },
    'T3Dカメ移動': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (xyz, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.queCurrentTurtle(new CommandMoveAbsolute(new three.Vector3(xyz[0], xyz[1], xyz[2])));
        },
        return_none: false
    },
    'T3Dカメ原点設定': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.queCurrentTurtle(new CommandHome('set'));
        },
        return_none: false
    },
    'T3Dカメ原点移動': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.queCurrentTurtle(new CommandHome('jump'));
        },
        return_none: false
    },
    'T3Dカメ起点移動': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (xyz, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.queCurrentTurtle(new CommandJump(new three.Vector3(xyz[0], xyz[1], xyz[2])));
        },
        return_none: false
    },
    'T3Dカメ進': {
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (l, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.queCurrentTurtle(new CommandMoveDirection('f', l));
        },
        return_none: false
    },
    'T3Dカメ戻': {
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (l, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.queCurrentTurtle(new CommandMoveDirection('b', l));
        },
        return_none: false
    },
    'T3Dカメ上平行移動': {
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (l, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.queCurrentTurtle(new CommandMoveDirection('u', l));
        },
        return_none: false
    },
    'T3Dカメ下平行移動': {
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (l, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.queCurrentTurtle(new CommandMoveDirection('d', l));
        },
        return_none: false
    },
    'T3Dカメ左平行移動': {
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (l, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.queCurrentTurtle(new CommandMoveDirection('l', l));
        },
        return_none: false
    },
    'T3Dカメ右平行移動': {
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (l, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.queCurrentTurtle(new CommandMoveDirection('r', l));
        },
        return_none: false
    },
    'T3Dカメ動': {
        type: 'func',
        josi: [['へ', 'に'], ['だけ']],
        pure: true,
        fn: function (dir, l, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            let cmd;
            if (dir === '前' || dir === 'FORWARD' || dir === 'まえ') {
                cmd = 'f';
            }
            else if (dir === '後' || dir === 'BACK' || dir === 'うしろ' || dir === 'BACKWARD' || dir === 'あと') {
                cmd = 'b';
            }
            else if (dir === '上' || dir === 'UP' || dir === 'うえ') {
                cmd = 'u';
            }
            else if (dir === '下' || dir === 'DOWN' || dir === 'した') {
                cmd = 'd';
            }
            else if (dir === '右' || dir === 'RIGHT' || dir === 'みぎ') {
                cmd = 'r';
            }
            else if (dir === '左' || dir === 'LEFT' || dir === 'ひだり') {
                cmd = 'l';
            }
            else {
                throw Error('方向の指定が正しくありません。前後上下左右のいずれかで指定してください。');
            }
            return turtle3d.queCurrentTurtle(new CommandMoveDirection(cmd, l));
        },
        return_none: false
    },
    'T3Dカメ角度設定': {
        type: 'func',
        josi: [['に', 'へ', 'の']],
        pure: true,
        fn: function (angle, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.queCurrentTurtle(new CommandAngle(angle));
        },
        return_none: false
    },
    'T3Dカメ右回転': {
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (a, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.queCurrentTurtle(new CommandRotate('r', a));
        },
        return_none: false
    },
    'T3Dカメ左回転': {
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (a, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.queCurrentTurtle(new CommandRotate('l', a));
        },
        return_none: false
    },
    'T3Dカメ上回転': {
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (a, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.queCurrentTurtle(new CommandRotate('u', a));
        },
        return_none: false
    },
    'T3Dカメ下回転': {
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (a, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.queCurrentTurtle(new CommandRotate('d', a));
        },
        return_none: false
    },
    'T3Dカメ回転': {
        type: 'func',
        josi: [['へ', 'に'], ['だけ']],
        pure: true,
        fn: function (dir, a, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            let cmd;
            if (dir === '上' || dir === 'UP' || dir === 'うえ') {
                cmd = 'u';
            }
            else if (dir === '下' || dir === 'DOWN' || dir === 'した') {
                cmd = 'd';
            }
            else if (dir === '右' || dir === 'RIGHT' || dir === 'みぎ') {
                cmd = 'r';
            }
            else if (dir === '左' || dir === 'LEFT' || dir === 'ひだり') {
                cmd = 'l';
            }
            else {
                throw Error('方向の指定が正しくありません。上下左右のいずれかで指定してください。');
            }
            return turtle3d.queCurrentTurtle(new CommandRotate(cmd, a));
        },
        return_none: false
    },
    'T3Dカメ右ロール': {
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (a, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.queCurrentTurtle(new CommandRoll('r', a));
        },
        return_none: false
    },
    'T3Dカメ左ロール': {
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (a, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.queCurrentTurtle(new CommandRoll('l', a));
        },
        return_none: false
    },
    'T3Dカメ傾': {
        type: 'func',
        josi: [['に', 'へ'], ['だけ']],
        pure: true,
        fn: function (dir, a, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            let cmd;
            if (dir === '右' || dir === 'RIGHT' || dir === 'みぎ') {
                cmd = 'r';
            }
            else if (dir === '左' || dir === 'LEFT' || dir === 'ひだり') {
                cmd = 'l';
            }
            else {
                throw Error('向きの指定が正しくありません。左右のどちらかで指定してください。');
            }
            return turtle3d.queCurrentTurtle(new CommandRoll(cmd, a));
        },
        return_none: false
    },
    'T3Dカメペン色設定': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (c, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            if (typeof c === 'number') {
                c = new three.Color(c);
            }
            return turtle3d.queCurrentTurtle(new CommandPenColor(c));
        },
        return_none: false
    },
    'T3Dカメペンサイズ設定': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (w, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.queCurrentTurtle(new CommandPenWidth(w));
        },
        return_none: false
    },
    'T3Dカメペン設定': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (w, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.queCurrentTurtle(new CommandPenEnable(!!w));
        },
        return_none: false
    },
    'T3Dカメ全消去': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            turtle3d.clearAll();
        },
        return_none: true
    },
    'T3Dカメ非表示': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.queCurrentTurtle(new CommandVisible(false));
        },
        return_none: false
    },
    'T3Dカメ表示': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.queCurrentTurtle(new CommandVisible(true));
        },
        return_none: false
    },
    'T3D視点カメ設定': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (n, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            if (n < 0 || n >= turtle3d.turtles.length) {
                throw Error('指定された番号のカメはいません。');
            }
            turtle3d.camera = n;
            turtle3d.animationStart();
        },
        return_none: true
    },
    // @3Dタートルグラフィックス・基本機能
    'T3D自動描画': { type: 'var', value: true }, // @T3Dじどうびょうが
    'T3D自動実行': { type: 'var', value: true }, // @T3Dじどうじっこう
    'T3D描画準備': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (to, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            if (typeof to === 'string') {
                to = document.querySelector(to) || document.getElementById(to);
            }
            if (!to) {
                throw new Error('T3D描画準備に指定した描画先に誤りがあります');
            }
            const renderer = turtle3d.setRenderer(to);
            turtle3d.setupRenderer();
            return renderer;
        },
        return_none: false
    },
    'T3D描画': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            turtle3d.doDraw(true);
        },
        return_none: true
    },
    'T3D上書描画': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            turtle3d.doDraw(false);
        },
        return_none: true
    },
    'T3D実行': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            turtle3d.animationTick();
        },
        return_none: true
    },
    'T3D背景色設定': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (c, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            const renderer = turtle3d.getRenderer();
            renderer.setClearColor(c);
            turtle3d.animationStart();
        },
        return_none: true
    },
    'T3D背景透過設定': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (a, sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            const renderer = turtle3d.getRenderer();
            renderer.setClearAlpha(a);
            turtle3d.animationStart();
        },
        return_none: true
    },
    'T3DJSON取得': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            if (!turtle3d._lines) {
                return null;
            }
            return JSON.stringify(turtle3d._lines.toJSON());
        },
        return_none: false
    },
    'T3Dレンダラ破棄': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            turtle3d.clearRenderer();
        },
        return_none: true
    },
    'T3D内部レンダラ取得': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.getRenderer();
        },
        return_none: false
    },
    'T3D内部シーン取得': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.getScene();
        },
        return_none: false
    },
    'T3D内部カメラ取得': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d.getCamera();
        },
        return_none: false
    },
    'T3D内部線描画参照取得': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            return turtle3d._lines;
        },
        return_none: false
    },
    'T3D内部線描画取出': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            const lines = turtle3d._lines;
            turtle3d._lines = new three.Group();
            turtle3d.animationStart();
            return lines;
        },
        return_none: false
    },
    'T3D待': {
        type: 'func',
        josi: [['を']],
        asyncFn: true,
        pure: true,
        fn: function (p, sys) {
            return p;
        },
        return_none: false
    },
    // @3Dタートルグラフィックス・ヘルパ機能
    'T3Dオービットコントロール設定': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            if (typeof three.OrbitControls !== 'undefined') {
                return turtle3d.setupControl(three.OrbitControls);
            }
            return null;
        },
        return_none: false
    },
    'T3Dコントロール有効': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            if (turtle3d._controls) {
                turtle3d._controls.enabled = true;
            }
        },
        return_none: true
    },
    'T3Dコントロール無効': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            if (turtle3d._controls) {
                turtle3d._controls.enabled = false;
            }
        },
        return_none: true
    },
    'T3Dカメラヘルパ表示': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            turtle3d.setCameraHelper(true);
        },
        return_none: true
    },
    'T3Dカメラヘルパ非表示': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            turtle3d.setCameraHelper(false);
        },
        return_none: true
    },
    'T3D軸線ヘルパ表示': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            turtle3d.setAxisHelper(true);
        },
        return_none: true
    },
    'T3D軸線ヘルパ非表示': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const [turtle3d, three] = WeykTurtle3DSystem.getEnv(sys);
            turtle3d.setAxisHelper(false);
        },
        return_none: true
    }
};
export default PluginWeykTurtle3D;
// ブラウザからscriptタグで取り込んだ時、自動で登録する
if (typeof navigator === 'object') {
    navigator.nako3.addPluginObject('PluginWeykTurtle3D', PluginWeykTurtle3D);
}
