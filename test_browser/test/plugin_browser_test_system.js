import { CompareUtil } from './compare_util'

export default (nako) => {
  const cu = new CompareUtil(nako)

  it('終わり', () => {
    cu.cmpex('終', Error, /__終わる__/)
  })
}
