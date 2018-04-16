const chai = require('chai')
const redis = require('redis')
const { sandbox } = require('sinon')
const Database = require('../src/database')

const expect = chai.expect
const ctx = sandbox.create()
const ipfs = 'ipfsHash'
const ipns = 'ipnsHash'
const dependencies = []
const x = 1
const y = 1
process.env.REDIS_PASSWORD = ''

describe('Database', () => {
  let store = {}
  beforeEach(async () => {
    ctx.stub(redis, 'createClient').returns({
      setAsync: (key, value) => (store[key] = value),
      getAsync: key => store[key]
    })

    Database.connect()
  })

  afterEach(async () => {
    // completely restore all fakes created through the sanDBox
    ctx.restore()
  })
  describe('Save & update Parcel Data', () => {
    it('should save Parcel', async () => {
      await Database.setParcel({ x, y }, { ipns, ipfs, dependencies })
      const res = await Database.getParcel(x, y)
      expect(res.toString(), 'expect parcel data to be saved').to.be.equal(
        { ipns, ipfs, dependencies }.toString()
      )
    })

    it('should update Parcel', async () => {
      await Database.setParcel({ x, y }, { ipns, ipfs, dependencies })
      let res = await Database.getParcel(x, y)
      expect(res.toString(), 'expect parcel data to be saved').to.be.equal(
        { ipns, ipfs, dependencies }.toString()
      )

      await Database.setParcel(
        { x, y },
        { ipns, ipfs, dependencies: ['dependency1'] }
      )
      res = await Database.getParcel(x, y)
      expect(
        res.toString(),
        'expect parcel data updated to be saved'
      ).to.be.equal({ ipns, ipfs, dependencies: ['dependency1'] }.toString())
    })
  })

  describe('Save & Update IPFS', () => {
    it('should save IPFS', async () => {
      await Database.setIPFS(ipns, ipfs)
      const res = await Database.getIPFS(ipns)
      expect(res, 'expect IPFS data to be saved').to.be.equal(ipfs)
    })

    it('should update IPFS', async () => {
      await Database.setIPFS(ipns, ipfs)
      let res = await Database.getIPFS(ipns)
      expect(res, 'expect IPFS data to be saved').to.be.equal(ipfs)

      await Database.setIPFS(ipns, 'newIPFShash')
      res = await Database.getIPFS(ipns)
      expect(res, 'expect IPFS data to be updated').to.be.equal('newIPFShash')
    })
  })
})
