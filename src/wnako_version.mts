/** なでしこバージョン */
// 型定義
export interface WNakoVersion {
    version: string;
    major: number;
    minor: number;
    patch: number;
}
// 実際のバージョン定義
const wnako3version: WNakoVersion = {
  version: '3.3.23',
  major: 3,
  minor: 3,
  patch: 23
}
export default wnako3version
