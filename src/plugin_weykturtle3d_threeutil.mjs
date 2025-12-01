export class ThreeUtil {
    static isDisporsal(obj) {
        return 'dispose' in obj && typeof obj.dispose === 'function';
    }
    static isMesh(obj) {
        return 'isMesh' in obj && obj.isMesh === true;
    }
    static disposeChildObject(obj) {
        while (obj.children.length > 0) {
            this.disposeChildObject(obj.children[0]);
            obj.remove(obj.children[0]);
        }
        if (ThreeUtil.isMesh(obj)) {
            if (obj.geometry) {
                obj.geometry.dispose();
            }
            if (obj.material) {
                for (const propKey of Object.keys(obj.material)) {
                    const prop = obj.material[propKey];
                    if (ThreeUtil.isDisporsal(prop)) {
                        prop.dispose();
                    }
                }
                obj.material.dispose();
            }
        }
    }
}
