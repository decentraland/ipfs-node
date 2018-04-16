const chai = require('chai')
const { isMultihash } = require('../src/utils')

const expect = chai.expect

describe('Utils', () => {
  describe('isMultihash', () => {
    it('should return true if it is multihash', () => {
      let res = isMultihash('QmUZ7t5hVXMdt2yWAPkDVBuSPuGc8uNNzSzNWDoZ1i5eLy')
      expect(
        res,
        `expect true when check ipns QmUZ7t5hVXMdt2yWAPkDVBuSPuGc8uNNzSzNWDoZ1i5eLy`
      ).to.be.true

      res = isMultihash('QmU2Pp7HkT8G1P1VsjF9XC5h22XWvvSjVJPiM2Xi2U9ZX3')
      expect(
        res,
        `expect true when check ipfs QmU2Pp7HkT8G1P1VsjF9XC5h22XWvvSjVJPiM2Xi2U9ZX3`
      ).to.be.true
    })
    it('should return false if it is not multihash', () => {
      let res = isMultihash('sha512-zr6QQnzLt3Ja0t0XI8gws2kn7zV2p0l')
      expect(
        res,
        `expect false when check sha512-zr6QQnzLt3Ja0t0XI8gws2kn7zV2p0l`
      ).to.be.false

      res = isMultihash('text inserted here')
      expect(res, `expect false when check text inserted here`).to.be.false

      res = isMultihash('text inserted here')
      expect(res, `expect false when check text inserted here`).to.be.false

      res = isMultihash('"" ) & rm -rf /')
      expect(res, `expect false when check "" ) & rm -rf /`).to.be.false
    })
  })
})
