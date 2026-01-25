import type * as THREENS from './plugin_weykturtle3d_three.mjs'

export class ThreeUtil {
  private static isDisporsal(obj: any): obj is THREENS.Disporsal {
    return 'dispose' in obj && typeof obj.dispose === 'function'
  }

  private static isMesh(obj: THREENS.Object3D): obj is THREENS.Mesh {
    return 'isMesh' in obj && obj.isMesh === true
  }

  static disposeChildObject(obj: THREENS.Object3D) {
    while (obj.children.length > 0) {
      this.disposeChildObject(obj.children[0])
      obj.remove(obj.children[0])
    }
    if (ThreeUtil.isMesh(obj)) {
      if (obj.geometry) { obj.geometry.dispose() }

      if (obj.material) {
        for (const propKey of Object.keys(obj.material)) {
          const prop = (obj.material as {[key: string]: any})[propKey]
          if (ThreeUtil.isDisporsal(prop)) {
            prop.dispose()
          }
        }
        obj.material.dispose()
      }
    }
  }
}
