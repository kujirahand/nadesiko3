import { CompareUtil } from './compare_util'

export default (nako) => {
  const cu = new CompareUtil(nako)

  describe('色', () => {
    it('RGB', () => {
      cu.cmp('CODE=RGB(255,255,255);CODEを大文字変換して表示', '#FFFFFF')
      cu.cmp('CODE=RGB(0,255,255);CODEを大文字変換して表示', '#00FFFF')
      cu.cmp('CODE=RGB(0,0,0);CODEを大文字変換して表示', '#000000')
      cu.cmp('CODE=22と25と255のRGB;CODEを大文字変換して表示', '#1619FF')
      cu.cmp('22と25と255のRGBを大文字変換して表示', '#1619FF')
    })
    it('色混ぜる', () => {
      cu.cmp('[255,255,255]の色混ぜして大文字変換して表示', '#FFFFFF')
    })
  })
}
