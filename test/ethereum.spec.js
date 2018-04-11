const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const { sandbox } = require('sinon')
const { eth, contracts } = require('decentraland-eth')
const Ethereum = require('../src/ethereum')

const web3Eth = eth
const { LANDRegistry } = contracts

chai.use(chaiAsPromised)

const ctx = sandbox.create()
const x = 1
const y = 1
const ipns = 'IPNS'
const expect = chai.expect
let decodeLandData

describe('Ethereum', () => {
  beforeEach(() => {
    process.env.BLACKLIST_URL = 'http://blacklist.com/api'
    getContracts = ctx.stub(web3Eth, 'getContract').callsFake(() => ({
      landData: () => 'metadata'
    }))
    decodeLandData = ctx
      .stub(LANDRegistry, 'decodeLandData')
      .callsFake(() => ({ ipns: `ipns:${ipns}` }))
  })

  afterEach(() => {
    // completely restore all fakes created through the sandbox
    ctx.restore()
  })
  describe('connectBlockchain', () => {
    it('should connect', async () => {
      process.env.RPC_URL = 'https://ropsten.infura.io/'
      expect(Ethereum.connectBlockchain(), `expect connectBlockchain`).to.be.fulfilled
    })

    it('should retry to connect', async () => {
      const web3Connect = ctx.stub(web3Eth, 'connect')
      process.env.RPC_URL = ''
      Ethereum.connectBlockchain()
      process.env.RPC_URL = 'https://ropsten.infura.io/'
      await new Promise(r =>
        setTimeout(() => {
          expect(
           web3Connect.calledTwice,
           `expect web3Eth.connect to be called twice`
          ).be.true
          r()
        }, 4000)
      )
    })
  })
  describe('getIPNS', () => {
    it('should return IPNS from parcel', async () => {
      const res = await Ethereum.getIPNS(x, y)
      expect(res, `expect response to be equal to ${ipns}`).to.be.equal(ipns)
    })

    it('should return IPNS not found if parcel has not IPNS', async () => {
      decodeLandData.callsFake(() => '')
      expect(
        Ethereum.getIPNS(x, y),
        `expect IPNS not found exception`
      ).be.rejectedWith(`IPNS not found`)
    })
  })
})
