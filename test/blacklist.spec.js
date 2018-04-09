const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const axios = require('axios')
const { sandbox } = require('sinon')
const createError = require('http-errors')
const { checkIPFS, checkParcel } = require('../src/blacklist')

chai.use(chaiAsPromised)

const ctx = sandbox.create()
const ipfs = 'hash'
const x = 1
const y = 1
const expect = chai.expect
let axiosGet

beforeEach(() => {
  process.env.BLACKLIST_URL = 'http://blacklist.com/api'
  axiosGet = ctx.stub(axios, 'get').callsFake(
    () =>
      new Promise(resolve =>
        resolve({
          data: {
            blacklisted: true
          }
        })
      )
  )
})

afterEach(() => {
  // completely restore all fakes created through the sandbox
  ctx.restore()
})

describe('Blacklist', () => {
  describe('checkIPFS', () => {
    it('should fulfilled if env is not loaded', () => {
      process.env.BLACKLIST_URL = ''
      expect(checkIPFS(ipfs), 'expect isBlacklisted to be false').be.fulfilled
      expect(axiosGet.called, 'expect axios.get have not been called').to.be.false
    })

    it('should throw 403 if ipfs is blacklisted', () => {
      expect(
        checkIPFS(ipfs),
        `expect IPFS ${ipfs} is blacklisted exception`
      ).be.rejectedWith(`IPFS ${ipfs} is blacklisted`)
      expect(axiosGet.called, 'expect axios.get have been called').to.be.true
    })

    it('should fulfilled if ipfs it not blacklisted', () => {
      axiosGet.callsFake(
        () =>
          new Promise(resolve =>
            resolve({
              data: {
                blacklisted: false
              }
            })
          )
      )
      expect(checkIPFS(ipfs), 'expect isBlacklisted to be false').be.fulfilled
      expect(axiosGet.called, 'expect axios.get have not been called').to.be.true
    })
  })

  describe('checkParcel', () => {
    it('should fulfilled if env is not loaded', () => {
      process.env.BLACKLIST_URL = ''
      expect(checkParcel(x, y), 'expect isBlacklisted to be false').be.fulfilled
      expect(axiosGet.called, 'expect axios.get have not been called').to.be.false
    })

    it('should throw 403 if parcel is blacklisted', () => {
      expect(
        checkParcel(x, y),
        `expect IPFS ${ipfs} is blacklisted exception`
      ).be.rejectedWith(`Parcel (${x},${y}) is blacklisted`)
      expect(axiosGet.called, 'expect axios.get have been called').to.be.true
    })

    it('should fulfilled if parcel it not blacklisted', () => {
      axiosGet.callsFake(
        () =>
          new Promise(resolve =>
            resolve({
              data: {
                blacklisted: false
              }
            })
          )
      )
      expect(checkParcel(x, y), 'expect isBlacklisted to be false').be.fulfilled
      expect(axiosGet.called, 'expect axios.get have not been called').to.be.true
    })
  })
})
