/** なでしこバージョン */
// 型定義
export interface NakoVersion {
    version: string;
    major: number;
    minor: number;
    patch: number;
}
// 実際のバージョン定義
const nako3version: NakoVersion = {
  version: '3.3.18',
  major: 3,
  minor: 3,
  patch: 18
}
export default nako3version
