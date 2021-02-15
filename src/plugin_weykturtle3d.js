/**
 * PluginWeykTurtle3D
 */

const PluginWeykTurtle3D = {
  '初期化': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys) {
      if (sys._weykturtle3d) return
      if (typeof THREE === 'undefined') {
        throw new Error('three.jsが読み込まれていません')
      }
      sys._weykturtle3d = {
        containerid: "",
        camera: -1,
        target: -1,
        backalpha: 1.0,
        backcolor: new THREE.Color(0x000000),
        _scene : null,
        _lines: new THREE.Object3D(),
        _camera: null,
        _renderer: null,
        _controls: null,
        _camerahelper: null,
        _axishelper: null,
        list : [],
        clearAll: function() {
          const me = this
          console.log('[TURTLE] clearAll')
          // カメをクリア
          for (let i = 0; i < me.list.length; i++) {
            const tt = me.list[i]
            tt.mlist = [] // ジョブをクリア
            // かめのモデルをカメから削除
            while(tt.obj.children.length > 0){ 
                tt.obj.remove(tt.obj.children[0]); 
            }
          }
          me.list = []
          // 引いた線を線用のバッファからクリア
          while(me._lines.children.length > 0){ 
            me._lines.remove(me._lines.children[0]); 
          }
          // シーンに直接存在する要素をとりあえず全部削除
          const scene = me._scene
          if (scene !== null) {
            while(scene.children.length > 0){ 
                scene.remove(scene.children[0]); 
            }
          }
          me.target = -1
          me.camera = -1
          me.flagSetTimer = false
          scene.add(me._lines)
          if (me._camerahelper !== null) {
            me._camerahelper.visible = false
            scene.add(me._camerahelper)
          }
          if (me._axishelper !== null) {
            me._axishelper.visible = false
            scene.add(me._axishelper)
          }
          me.backcolor = new THREE.Color(0x000000)
          me.initTurtle()
        },
        createDefaultTurtle: function() {
          const obj = new THREE.Object3D()
          const matMiddle = new THREE.LineBasicMaterial({color: 0x00ff00})
          const matTop = new THREE.LineBasicMaterial({color: 0xff0000})
          const matBottom = new THREE.LineBasicMaterial({color: 0x0000ff})
          const geoMiddle = new THREE.Geometry()
          const geoTop = new THREE.Geometry()
          const geoBottom = new THREE.Geometry()
          geoMiddle.vertices.push(
            new THREE.Vector3(0,30,0),
            new THREE.Vector3(-20,-30,0),
            new THREE.Vector3(0,-15,0),
            new THREE.Vector3(20,-30,0)
          )
          let center = new THREE.Vector3(0,0,15)
          geoTop.vertices.push(
            center, new THREE.Vector3(0,30,0),
            center, new THREE.Vector3(-20,-30,0),
            center, new THREE.Vector3(0,-15,0),
            center, new THREE.Vector3(20,-30,0)
          )
          center = new THREE.Vector3(0,0,-15)
          geoBottom.vertices.push(
            center, new THREE.Vector3(0,30,0),
            center, new THREE.Vector3(-20,-30,0),
            center, new THREE.Vector3(0,-15,0),
            center, new THREE.Vector3(20,-30,0)
          )
          const meshMiddle = new THREE.LineLoop(geoMiddle, matMiddle)
          const meshTop = new THREE.Line(geoTop, matTop)
          const meshBottom = new THREE.Line(geoBottom, matBottom)

          obj.add(meshMiddle)
          obj.add(meshTop)
          obj.add(meshBottom)
          return obj
        },
        createTurtle: function(modelUrl) {
          // カメの情報を sys._turtle リストに追加
          const id = this.list.length
          const tt = {
            id: id,
            obj: new THREE.Object3D(),
            home: {
              position: new THREE.Vector3(0,0,0),
              quaternion: new THREE.Quaternion()
            },
            color: new THREE.Color(0xffffff),
            lineWidth: 4,
            flagDown: true,
            flagLoaded: false,
            f_visible: true,
            mlist: []
          }
          this.list.push(tt)
          this.target = id
          tt.home.position.copy(tt.obj.position)
          tt.home.quaternion.copy(tt.obj.quaternion)
          this.loadTurtle(tt, modelUrl)
          this._scene.add(tt.obj)
          return id
        },
        loadTurtle: function(tt, url) {
          const loader = new THREE.ObjectLoader()
          const me = this
          if (url.length == 0) {
            console.log('turtle.default')
            if (tt.obj.children.length > 0) {
              tt.obj.remove(tt.obj.children[0])
            }
            const obj = me.createDefaultTurtle()
            tt.obj.add(obj)
            tt.flagLoaded = true
            me.doDraw()
            return
          }
          loader.load(url, function(obj) {
            console.log('turtle.onload')
            if (tt.obj.children.length > 0) {
              tt.obj.remove(tt.obj.children[0])
            }
            tt.obj.add(obj)
            tt.flagLoaded = true
            me.doDraw()
          }, function(xhr) {
            // nothing
          }, function(xhr) {
            console.log('turtle.onerror')
            tt.flagLoaded = true
            tt.f_visible = false
            tt.obj.visible = false
            if (tt.obj.children.length > 0) {
              tt.obj.remove(tt.obj.children[0])
            }
            me.doDraw()
          })
        },
        initTurtle: function() {
          const index = this.createTurtle("")
          const tt = this.list[index]
          tt.obj.position.set(0,0,1000)
          var axis = new THREE.Vector3(0,0,-1).normalize()
          var angle = 0
          tt.obj.quaternion.setFromAxisAngle(axis,angle)
          tt.home.position.copy(tt.obj.position)
          tt.home.quaternion.copy(tt.obj.quaternion)
          tt.f_visible = false
          tt.obj.visible = false
          this.camera = index
          this.target = -1
        },
        getCur: function() {
          if (this.list.length === 0) {
            throw Error('最初に『T3Dカメ作成』命令を呼び出してください。')
          }
          if (this.target < 0 || this.target >= this.list.length) {
            throw Error('指定された番号のカメはいません。')
          }
          return this.list[this.target]
        },
        doDraw: function() {
          if (this.camera === -1) return
          if (this._renderer === null) {
            this.setRenderTarget()
          }
          const camera = this.list[this.camera]
          if (this._controls !== null) {
          } else {
            this._camera.position.copy(camera.obj.position)
            this._camera.quaternion.copy(camera.obj.quaternion)
          }
          if (this._camerahelper !== null) {
            this._camerahelper.update()
          }
          this._renderer.clear() 
          if (this._controls !== null) {
            this._controls.update()
            camera.obj.position.copy(this._camera.position)
            camera.obj.quaternion.copy(this._camera.quaternion)
          }
          this._renderer.render( this._scene, this._camera );
        },
        setCameraHelper: function(flag) {
          if (flag) {
            if (this._camerahelper === null) {
              if (typeof THREE.CameraHelper === "undefined") {
                throw Error('カメラヘルパの機能が見当たりません。')
              }
              const cameraHelper = new THREE.CameraHelper(this._camera);
              this._camerahelper = cameraHelper
              this._scene.add(cameraHelper);
            }
            this._camerahelper.visible = true
          } else {
            if (this._camerahelper !== null) {
              this._camerahelper.visible = false
            }
          }
        },
        setAxisHelper: function(flag) {
          if (flag) {
            if (this._axishelper === null) {
              if (typeof THREE.AxisHelper === "undefined") {
                throw Error('AXISヘルパの機能が見当たりません。')
              }
              const axisHelper = new THREE.AxisHelper(1000);
              this._axishelper = axisHelper
              this._scene.add(axisHelper);
            }
            this._axishelper.visible = true
          } else {
            if (this._axishelper === null) {
              this._axishelper.visible = false
            }
          }
        },
        setBackgroundAlpha: function(a) {
          this.backalpha = a
          if (this._renderer) {
            this._renderer.setClearAlpha(this.backalpha)
          }
        },
        setBackgroundColor: function(c) {
          this.backcolor = new THREE.Color(c)
          if (this._renderer) {
            this._renderer.setClearColor(this.backcolor,this.backalpha)
          }
        },
        setRenderTarget: function() {
          // 描画先をセットする
          const divId = sys.__getSysValue('T3Dカメ描画先', 'turtle3d_div')
          const div = document.getElementById(divId)
          if (!div) {
            throw new Error('[ERROR] T3Dカメ描画先が見当たりません。' + divId)
            return
          }
          const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
          if (renderer === null) {
            throw new Error('レンダラを作成できません')
          }
          renderer.setClearColor(this.backcolor,this.backalpha)
          renderer.setPixelRatio( window.devicePixelRatio )
          renderer.setSize( div.clientWidth, div.clientHeight )
          this._camera.aspect = div.clientWidth / div.clientHeight
          renderer.autoClear = false
          div.appendChild(renderer.domElement)
          if (this._controls !== null) {
            this._controls.enabled = false
            div.addEventListener('mouseover', function() {
                sys._weykturtle3d._controls.enabled = true
            })
            div.addEventListener('mouseout', function() {
                sys._weykturtle3d._controls.enabled = false
            })
          }
          this._renderer = renderer
        },
        line: function (tt, v1, v2) {
          if (tt) {
            if (!tt.flagDown) return
          }
          const geometry = new THREE.Geometry()
          const material = new THREE.LineBasicMaterial({color: tt.color,linewidth: tt.lineWidth})
          geometry.vertices.push(v1)
          geometry.vertices.push(v2)
          const line = new THREE.Line(geometry, material)
          this._lines.add(line)
        },
        doMacro: function (tt, wait) {
          const me = this
          if (!tt.flagLoaded && wait > 0) {
            console.log('[TURTLE] waiting ...')
            return true
          }
          const m = tt.mlist.shift()
          const cmd = (m !== undefined) ? m[0] : ''
          switch (cmd) {
            case 'xyz':
              // 起点を移動する
              tt.obj.position.copy(m[1])
              break
            case 'mv': {
              const v1 = tt.obj.position.clone()
              const v2 = m[1]
              // 線を引く
              this.line(tt, v1, v2)
              // カメの角度を変更
              tt.obj.lookAt(v2)
              let headup90 = new THREE.Quaternion()
              const axisX = new THREE.Vector3(1, 0, 0)
              headup90.setFromAxisAngle(axisX, Math.PI / 2)
              tt.obj.quaternion.multiply(headup90)
              // カメを移動
              tt.obj.position.copy(v2)
              break
            }
            case 'fd': {
              const v1 = tt.obj.position.clone()
              const v2 = new THREE.Vector3(0,m[1]*m[2],0)
              v2.applyQuaternion(tt.obj.quaternion)
              v2.add(v1)
              this.line(tt, v1, v2)
              tt.obj.position.copy(v2)
              break
            }
            case 'su': {
              const v1 = tt.obj.position.clone()
              const v2 = new THREE.Vector3(0,m[1],0)
              const modifier = new THREE.Quaternion()
              const axis = new THREE.Vector3(1, 0, 0)
              modifier.setFromAxisAngle(axis, (-90) * Math.PI / 180)
              const target = tt.obj.quaternion.clone()
              target.multiply(modifier)
              v2.applyQuaternion(target)
              v2.add(v1)
              this.line(tt, v1, v2)
              tt.obj.position.copy(v2)
              break
            }
            case 'sd': {
              const v1 = tt.obj.position.clone()
              const v2 = new THREE.Vector3(0,m[1],0)
              const modifier = new THREE.Quaternion()
              const axis = new THREE.Vector3(1, 0, 0)
              modifier.setFromAxisAngle(axis, 90 * Math.PI / 180)
              const target = tt.obj.quaternion.clone()
              target.multiply(modifier)
              v2.applyQuaternion(target)
              v2.add(v1)
              this.line(tt, v1, v2)
              tt.obj.position.copy(v2)
              break
            }
            case 'sl': {
              const v1 = tt.obj.position.clone()
              const v2 = new THREE.Vector3(0,m[1],0)
              const modifier = new THREE.Quaternion()
              const axis = new THREE.Vector3(0, 0, 1)
              modifier.setFromAxisAngle(axis, 90 * Math.PI / 180)
              const target = tt.obj.quaternion.clone()
              target.multiply(modifier)
              v2.applyQuaternion(target)
              v2.add(v1)
              this.line(tt, v1, v2)
              tt.obj.position.copy(v2)
              break
            }
            case 'sr': {
              const v1 = tt.obj.position.clone()
              const v2 = new THREE.Vector3(0,m[1],0)
              const modifier = new THREE.Quaternion()
              const axis = new THREE.Vector3(0, 0, 1)
              modifier.setFromAxisAngle(axis, (-90) * Math.PI / 180)
              const target = tt.obj.quaternion.clone()
              target.multiply(modifier)
              v2.applyQuaternion(target)
              v2.add(v1)
              this.line(tt, v1, v2)
              tt.obj.position.copy(v2)
              break
            }
            case 'angle': {
              const euler = new THREE.Euler()
              euler.setArray(m[1])
              const dir = new THREE.Quaternion()
              tt.obj.quaternion.setFromEuler(euler)
              break
            }
            case 'rotr': {
              const rv = m[1]
              const target = new THREE.Quaternion()
              const axis = new THREE.Vector3(0, 0, 1)
              target.setFromAxisAngle(axis, (-rv % 360 ) * Math.PI / 180)
              tt.obj.quaternion.multiply(target)
              break
            }
            case 'rotl': {
              const rv = m[1]
              const target = new THREE.Quaternion()
              const axis = new THREE.Vector3(0, 0, 1)
              target.setFromAxisAngle(axis, (rv % 360 ) * Math.PI / 180)
              tt.obj.quaternion.multiply(target)
              break
            }
            case 'rotu': {
              const rv = m[1]
              const target = new THREE.Quaternion()
              const axis = new THREE.Vector3(1, 0, 0)
              target.setFromAxisAngle(axis, (-rv % 360 ) * Math.PI / 180)
              tt.obj.quaternion.multiply(target)
              break
            }
            case 'rotd': {
              const rv = m[1]
              const target = new THREE.Quaternion()
              const axis = new THREE.Vector3(1, 0, 0)
              target.setFromAxisAngle(axis, (rv % 360 ) * Math.PI / 180)
              tt.obj.quaternion.multiply(target)
              break
            }
            case 'rolr': {
              const rv = m[1]
              const target = new THREE.Quaternion()
              const axis = new THREE.Vector3(0, 1, 0)
              target.setFromAxisAngle(axis, (rv % 360 ) * Math.PI / 180)
              tt.obj.quaternion.multiply(target)
              break
            }
            case 'roll': {
              const rv = m[1]
              const target = new THREE.Quaternion()
              const axis = new THREE.Vector3(0, 1, 0)
              target.setFromAxisAngle(axis, (-rv % 360 ) * Math.PI / 180)
              tt.obj.quaternion.multiply(target)
              break
            }
            case 'color':
              tt.color = new m[1]
              break
            case 'size':
              tt.lineWidth = m[1]
              break
            case 'penOn':
              tt.flagDown = m[1]
              break
            case 'visible':
              tt.f_visible = m[1]
              if (tt.f_visible) {
                tt.obj.visible = true
              } else {
                tt.obj.visible = false
              }
              break
            case 'changeModel':
              tt.flagLoaded = false
              me.loadTurtle(tt, m[1])
              break
            case 'changeCamera':
              me.camera=m[1]
              break
            case 'sethome':
              tt.home.position.copy(tt.obj.position)
              tt.home.quaternion.copy(tt.obj.quaternion)
              break
            case 'gohome':
              tt.obj.position.copy(tt.home.position)
              tt.obj.quaternion.copy(tt.home.quaternion)
              break
          }
          return (tt.mlist.length > 0)
        },
        doMacroAll: function (wait) {
          let hasNext = false
          for (let i = 0; i < this.list.length; i++) {
            const tt = this.list[i]
            if (this.doMacro(tt, wait)) hasNext = true
          }
          return hasNext
        },
        flagSetTimer: false,
        animationStart: function() {
          const wait = this.getWait()
          if (wait === 0) {
            this.animation()
            return
          }
          if (this.flagSetTimer) return
          this.flagSetTimer = true
          this.animationFrame(this.animation)
        },
        getWait: function() {
          return sys.__getSysValue('T3Dカメ速度', 100)
        },
        animation: function() {
          const me = sys._weykturtle3d
          const now = Date.now()
          const elapsedMs = now - me._prevUpdatedTime
          const wait = me.getWait()
          if (wait > 0 && elapsedMs < wait){
            me.doDraw()
            me.animationFrame(me.animation)
            return
          }
          let hasNext = me.doMacroAll(wait)
          if (wait <= 0) {
            while (hasNext) {
              hasNext = me.doMacroAll(wait)
            }
          } else if (hasNext || me._controls !== null) {
            me.doDraw()
            me._prevUpdatedTime = now
            me.animationFrame(me.animation)
            return
          }
          me.doDraw()
          me.flagSetTimer = false
        }
      }
      sys._weykturtle3d.animationFrame = (function(){
            return function(callback, element){
                     window.setTimeout(callback, 1000 / 60)
                   }
                   /* window.requestAnimationFrame       ||
                   window.webkitRequestAnimationFrame ||
                   window.mozRequestAnimationFrame    ||
                   window.oRequestAnimationFrame      ||
                   window.msRequestAnimationFrame     || */
      })()
      const scene = new THREE.Scene()
      if (scene === null) {
        throw new Error('シーンを作成できません')
      }
      sys._weykturtle3d._scene = scene
      const camera = new THREE.PerspectiveCamera(60, 1.0, 1, 65000)
      if (camera === null) {
        throw new Error('カメラを作成できません')
      }
      camera.position.set(0,0,1000)
      if (typeof THREE.OrbitControls !== "undefined") {
        const controls = new THREE.OrbitControls(camera)
        controls.enabled = false
        sys._weykturtle3d._controls = controls
      } else {
        camera.up = new THREE.Vector3(0,1,0)
        camera.lookAt(new THREE.Vector3(0,0,0))
      }
      sys._weykturtle3d._camera = camera
      sys._weykturtle3d._scene.add(sys._weykturtle3d._lines)
      sys._weykturtle3d.initTurtle()
    }
  },
  // @3Dタートルグラフィックス/カメ操作
  'T3Dカメ作成': { // @タートルグラフィックスを開始してカメのIDを返す // @T3Dかめさくせい
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      if (!sys._weykturtle3d) return null
      const modelUrl = sys.__getSysValue('T3DカメモデルURL', '')
      const id = sys._weykturtle3d.createTurtle(modelUrl)
      return id
    },
    return_none: false
  },
  'T3Dカメ操作対象設定': { // @IDを指定して操作対象となるカメを変更する // @T3Dかめそうさたいしょうせってい
    type: 'func',
    josi: [['に', 'へ', 'の']],
    pure: true,
    fn: function (id, sys) {
      if (!sys._weykturtle3d) return null
      sys._weykturtle3d.target = id
    },
    return_none: true
  },
  'T3Dカメ描画先': {type: 'var', value: 'turtle3d_div'}, // @T3Dかめびょうがさき
  'T3DカメモデルURL': {type: 'var', value: ''}, // @T3DかめもでるURL
  'T3Dカメモデル変更': { // @カメのモデルをURLに変更する // @T3Dかめもでるへんこう
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (url, sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      tt.mlist.push(['changeModel', url])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメ速度': {type: 'const', value: 100}, // @T3Dかめそくど
  'T3Dカメ速度設定': { // @カメの動作速度vに設定(大きいほど遅い) // @T3Dかめそくどせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (v, sys) {
      sys.__varslist[0]['T3Dカメ速度'] = v
    },
    return_none: true
  },
  'T3Dカメ移動': { // @カメの位置を[x,y,z]へ移動する // @T3Dかめいどう
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (xyz, sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      tt.mlist.push(['mv', new THREE.Vector3(xyz[0], xyz[1], xyz[2])])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメ原点設定': { // @カメの原点を現在の位置・向きに設定する // @T3Dかめげんてんせってい
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      tt.mlist.push(['sethome'])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメ原点移動': { // @カメを原点の位置・向きに移動する(描画はしない) // @T3Dかめげんてんいどう
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      tt.mlist.push(['gohome'])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメ起点移動': { // @カメの描画起点位置を[x,y,z]へ移動する // @T3Dかめきてんいどう
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (xyz, sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      tt.mlist.push(['xyz', new THREE.Vector3(xyz[0], xyz[1], xyz[2])])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメ進': { // @カメの位置をVだけ進める // @T3Dかめすすむ
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v, sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      tt.mlist.push(['fd', v, 1])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメ戻': { // @カメの位置をVだけ戻す // @T3Dかめもどる
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v, sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      tt.mlist.push(['fd', v, -1])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメ上平行移動': { // @カメの位置を上にVだけ進める // @T3Dかめうえへいこういどう
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v, sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      tt.mlist.push(['su', v])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメ下平行移動': { // @カメの位置を下にVだけ進める // @T3Dかめしたへいこういどう
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v, sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      tt.mlist.push(['sd', v])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメ左平行移動': { // @カメの位置を左にVだけ進める // @T3Dかめひだりへいこういどう
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v, sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      tt.mlist.push(['sl', v])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメ右平行移動': { // @カメの位置を右にVだけ進める // @T3Dかめみぎへいこういどう
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v, sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      tt.mlist.push(['sr', v])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメ動': { // @カメの位置をDIRにVだけ進める // @T3Dかめうごく
    type: 'func',
    josi: [['へ','に'],['だけ']],
    pure: true,
    fn: function (dir, v, sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      let cmd = ''
      if (dir == '前' || dir == '後') {
        if (dir == '前') {
          tt.mlist.push(['fd', v, 1])
        } else {
          tt.mlist.push(['fd', v, -1])
        }
      } else {
        if (dir == '上' || dir == 'UP' || dir == 'うえ') {
          cmd = 'su'
        } else
        if (dir == '下' || dir == 'DOWN' || dir == 'した') {
          cmd = 'sd'
        } else
        if (dir == '右' || dir == 'RIGHT' || dir == 'みぎ') {
          cmd = 'sr'
        } else
        if (dir == '左' || dir == 'LEFT' || dir == 'ひだり') {
          cmd = 'sl'
        } else {
          throw Error('方向の指定が正しくありません。前後上下左右のいずれかで指定してください。')
        }
        tt.mlist.push([cmd, v])
      }
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメ角度設定': { // @カメの向きをオイラー(XYZ)にて設定する // @T3Dかめかくどせってい
    type: 'func',
    josi: [['に', 'へ', 'の']],
    pure: true,
    fn: function (v, sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      tt.mlist.push(['angle', parseFloat(v)])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメ右回転': { // @カメの向きをDEGだけ右に向ける // @T3Dかめみぎかいてん
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v, sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      tt.mlist.push(['rotr', v])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメ左回転': { // @カメの向きをDEGだけ左に向ける // @T3Dかめひだりかいてん
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v, sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      tt.mlist.push(['rotl', v])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメ上回転': { // @カメの向きをDEGだけ上に向ける // @T3Dかめうえかいてん
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v, sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      tt.mlist.push(['rotu', v])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメ下回転': { // @カメの向きをDEGだけ下に向ける // @T3Dかめしたかいてん
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v, sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      tt.mlist.push(['rotd', v])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメ回転': { // @カメの向きをDEGだけDIRに向ける // @T3Dかめかいてん
    type: 'func',
    josi: [['へ','に'],['だけ']],
    pure: true,
    fn: function (dir, v, sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      let cmd = ''
      if (dir == '上' || dir == 'UP' || dir == 'うえ') {
        cmd = 'rotu'
      } else
      if (dir == '下' || dir == 'DOWN' || dir == 'した') {
        cmd = 'rotd'
      } else
      if (dir == '右' || dir == 'RIGHT' || dir == 'みぎ') {
        cmd = 'rotr'
      } else
      if (dir == '左' || dir == 'LEFT' || dir == 'ひだり') {
        cmd = 'rotl'
      } else {
        throw Error('方向の指定が正しくありません。上下左右のいずれかで指定してください。')
      }
      tt.mlist.push([cmd, v])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメ右ロール': { // @カメをDEGだけ右に傾ける // @T3Dかめみぎろーる
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v, sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      tt.mlist.push(['rolr', v])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメ左ロール': { // @カメのDEGだけ左に傾ける // @T3Dかめひだりろーる
    type: 'func',
    josi: [['だけ']],
    pure: true,
    fn: function (v, sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      tt.mlist.push(['roll', v])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメ傾': { // @カメをDEGだけDIRに傾ける // @T3Dかめかたむける
    type: 'func',
    josi: [['に','へ'],['だけ']],
    pure: true,
    fn: function (dir, v, sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      let cmd = ''
      if (dir == '右' || dir == 'RIGHT' || dir == 'みぎ') {
        cmd = 'rolr'
      } else
      if (dir == '左' || dir == 'LEFT' || dir == 'ひだり') {
        cmd = 'roll'
      } else {
        throw Error('向きの指定が正しくありません。左右のどちらかで指定してください。')
      }
      tt.mlist.push([cmd, v])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメペン色設定': { // @カメのペン描画色をCに設定する // @T3Dかめぺんいろせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (c, sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      tt.mlist.push(['color', c])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメペンサイズ設定': { // @カメペンのサイズをWに設定する // @T3Dかめぺんさいずせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (w, sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      tt.mlist.push(['size', w])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメペン設定': { // @カメペンを使うかどうかをV(オン/オフ)に設定する // @T3Dかめぺんせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (w, sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      tt.mlist.push(['penOn', w])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメ全消去': { // @表示しているカメと描画内容を全部消去する // @T3Dかめぜんしょうきょ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      if (!sys._weykturtle3d) return null
      sys._weykturtle3d.clearAll()
    },
    return_none: true
  },
  'T3Dカメ非表示': { // @カメのモデルを非表示にする。描画に影響しない。 // @T3Dかめひひょうじ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      tt.mlist.push(['visible', false])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3Dカメ表示': { // @非表示にしたカメのモデルを表示する。 // @T3Dかめひょうじ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      if (!sys._weykturtle3d) return null
      const tt = sys._weykturtle3d.getCur()
      tt.mlist.push(['visible', true])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  'T3D視点カメ設定': { // @指定したカメを視点として使用する // @T3Dしてんかめせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (w, sys) {
      if (!sys._weykturtle3d) return null
      if (w < 0 || w >= sys._weykturtle3d.list.length) {
        throw Error('指定された番号のカメはいません。')
      }
      tt.mlist.push(['changeCamera', w])
      sys._weykturtle3d.animationStart()
    },
    return_none: true
  },
  // @3Dタートルグラフィックス/基本機能
  'T3D描画': { // @現在の状態を描画する // @T3Dびょうが
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      if (!sys._weykturtle3d) return null
      sys._weykturtle3d.doDraw()
    },
    return_none: true
  },
  'T3D背景色設定': { // @canvasをクリアする際の背景色を設定する // @T3Dはいけいしょくせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (c, sys) {
      if (!sys._weykturtle3d) return null
      if (c==="透明"){
        sys._weykturtle3d.setBackgroundAlpha(0.0)
      }else
      if (c==="不透明"){
        sys._weykturtle3d.setBackgroundAlpha(1.0)
      }else{
        sys._weykturtle3d.setBackgroundColor(c)
      }
    },
    return_none: true
  },
  'T3DJSON取得': { // @描画した線のJSON形式で取得する // @T3DJSONしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      if (!sys._weykturtle3d) return null
      return JSON.stringify(sys._weykturtle3d._lines.toJSON())
    },
    return_none: false
  },
  // @3Dタートルグラフィックス/ヘルパ機能
  'T3Dカメラヘルパ表示': { // @カメラヘルパーを表示する // @T3Dかめらへるぱひょうじ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      if (!sys._weykturtle3d) return null
      sys._weykturtle3d.setCameraHelper(true)
    },
    return_none: true
  },
  'T3Dカメラヘルパ非表示': { // @カメラヘルパーを非表示にする // @T3Dかめらへるぱひひょうじ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      if (!sys._weykturtle3d) return null
      sys._weykturtle3d.setCameraHelper(false)
    },
    return_none: true
  },
  'T3D軸線ヘルパ表示': { // @座標軸ヘルパーを表示する // @T3Dじくせんへるぱひょうじ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      if (!sys._weykturtle3d) return null
      sys._weykturtle3d.setAxisHelper(true)
    },
    return_none: true
  },
  'T3D軸線ヘルパ非表示': { // @座標軸ヘルパーを非表示にする // @T3Dじくせんへるぱひひょうじ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      if (!sys._weykturtle3d) return null
      sys._weykturtle3d.setAxisHelper(false)
    },
    return_none: true
  }
}

if (typeof (global) === "object" && typeof (global.process) === "object") {
  module.exports = PluginWeykTurtle3D
}

// ブラウザからscriptタグで取り込んだ時、自動で登録する
if (typeof (navigator) === 'object') {
  navigator.nako3.addPluginObject('PluginWeykTurtle3D', PluginWeykTurtle3D)
}
