const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const chaiHttp = require('chai-http')
const fs = require('fs')
const axios = require('axios')
const execFile = require('child_process').execFile
const { sandbox } = require('sinon')
const DB = require('../src/database')
const Ethereum = require('../src/ethereum')
const Blacklist = require('../src/blacklist')
const server = require('../src/server')
const IPFS = require('../src/ipfs')

chai.use(chaiAsPromised)
chai.use(chaiHttp)
process.env.BLACKLIST_URL = 'http://blacklist.com/api'

const ctx = sandbox.create()
const expect = chai.expect
const x = 1
const y = 1
let ipfs
let ipns
let url
let getIPNS
let connectPeer
let checkParcel
let checkIPFS
let getParcel
let setParcel

const addFile = () => {
  // fs.mkdirSync('test/tmp')
  fs.writeFileSync('test/test.txt', 'I am using for testing!')
  return new Promise((resolve, reject) => {
    execFile('ipfs', ['add', '-r', `${process.cwd()}/test/test.txt`], (err, stdout, stderr) => {
      if (err) return reject(new Error(`Can not add the file: ${stderr}`))
      return resolve(stdout.split(' ')[1])
    })
  })
}

const publishFile = () => {
  return new Promise((resolve, reject) => {
    execFile('ipfs', ['name', 'publish', `${ipfs}`], (err, stdout, stderr) => {
      if (err) return reject(new Error(`Can not publish ${ipfs}: ${stderr}`))
      return resolve(stdout.split(' ')[2].slice(0, -1))
    })
  })
}

const removeFile = () => {
  fs.unlinkSync('test/test.txt')
  return new Promise((resolve, reject) => {
    execFile('ipfs', ['pin', 'rm', `${ipfs}`], (err, stdout, stderr) => {
      if (err) return reject(new Error(`Can not remove the file: ${stderr}`))
      return resolve()
    })
  })
}

describe('IPFS', () => {
  beforeEach(async () => {
    ipfs = await addFile()
    ipns = 'QmUZ7t5hVXMdt2yWAPkDVBuSPuGc8uNNzSzNWDoZ1i5eLy'
    // ipns = await publishFile()
    url = {
      ipns,
      ipfs,
      dependencies: []
    }
    getIPNS = ctx.stub(Ethereum, 'getIPNS').callsFake(() => ipns)
    checkParcel = ctx.stub(Blacklist, 'checkParcel').callsFake(() => true)
    checkIPFS = ctx.stub(Blacklist, 'checkIPFS').callsFake(() => true)
    connectPeer = ctx.stub(IPFS, 'connectPeer').callsFake(() => true)
    ctx.stub(DB, 'setIPFS').callsFake(() => true)
    setParcel = ctx.stub(DB, 'setParcel').callsFake(() => true)
    ctx.stub(DB, 'getIPFS').callsFake(() => null)
    getParcel = ctx.stub(DB, 'getParcel').callsFake(() => null)
    ctx.stub(axios, 'get').callsFake(
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

  afterEach(async () => {
    // completely restore all fakes created through the sanDBox
    ctx.restore()
    await removeFile()
  })
  describe('Pin', () => {
    it('should pin files', async () => {
      const resExpected = JSON.stringify({ ok: true, message: 'Pinning Success' })
      const res = await chai.request(server).post(`/api/pin/peerId/${x}/${y}`)
      expect(res.status, 'Expect status 200').to.be.equal(200)
      expect(
        JSON.stringify(res.body),
        'Expect body to pinning success'
      ).to.be.equal(resExpected)
    })

    it('should not pin files because peer is down', async () => {
      connectPeer.restore()
      const resExpected = JSON.stringify({ error: 'Could not connect to peer: peerId' })
      const res = await chai.request(server).post(`/api/pin/peerId/${x}/${y}`)
      expect(res.status, 'Expect status 500: could not connect to peer').to.be.equal(500)
      expect(
        JSON.stringify(res.body),
        'Expect body to be could not resolve name'
      ).to.be.equal(resExpected)
    })

    it('should not pin files because IPNS does not exist', async () => {
      getIPNS.callsFake(() => null)
      const resExpected = JSON.stringify({ error: 'Error: Could not resolve name.\n' })
      const res = await chai.request(server).post(`/api/pin/peerId/${x}/${y}`)
      expect(res.status, 'Expect status 500: could not resolve name').to.be.equal(500)
      expect(
        JSON.stringify(res.body),
        'Expect body to be could not resolve name'
      ).to.be.equal(resExpected)
    })

    it('should not pin files because parcel has not IPNS', async () => {
      getIPNS.restore()
      const resExpected = JSON.stringify({ error: 'IPNS not found' })
      const res = await chai.request(server).post(`/api/pin/peerId/${x}/${y}`)
      expect(res.status, 'Expect status 404').to.be.equal(404)
      expect(
        JSON.stringify(res.body),
        'Expect body to be IPNS not found'
      ).to.be.equal(resExpected)
    })
  })

   describe('Resolve', () => {
    it('should resolve without cache', async () => {
      const resExpected = JSON.stringify({ ok: true, url })
      const res = await chai.request(server).get(`/api/resolve/${x}/${y}`)
      expect(res.status, 'Expect status 200').to.be.equal(200)
      expect(getParcel.called, 'Expect getParcel to be called').to.be.true
      expect(setParcel.called,  'Expect setParcel to be called').to.be.true
      expect(
        JSON.stringify(res.body),
        'Expect body to have the ipfs data'
      ).to.be.equal(resExpected)
    })

    it('should resolve with cache', async () => {
      getParcel.callsFake(() => url)
      const resExpected = JSON.stringify({ ok: true, url })
      const res = await chai.request(server).get(`/api/resolve/${x}/${y}`)
      expect(res.status, 'Expect status 200').to.be.equal(200)
      expect(getParcel.called, 'Expect getParcel to be called').to.be.true
      expect(setParcel.called,  'Expect setParcel not to be called').to.be.false
      expect(
        JSON.stringify(res.body),
        'Expect body to have the ipfs data'
      ).to.be.equal(resExpected)
    })

    it('should resolve without cache when is forced', async () => {
      getParcel.callsFake(() => url)
      const resExpected = JSON.stringify({ ok: true, url })
      const res = await chai.request(server).get(`/api/resolve/${x}/${y}?force=true`)
      expect(res.status, 'Expect status 200').to.be.equal(200)
      expect(getParcel.called, 'Expect getParcel not to be called').to.be.false
      expect(setParcel.called, 'Expect setParcel to be called').to.be.true
      expect(
        JSON.stringify(res.body),
        'Expect body to have the ipfs data'
      ).to.be.equal(resExpected)
    })

    it('should not check if IPNS is blacklisted', async () => {
      checkParcel.restore()
      getParcel.callsFake(() => url)
      const resExpected = JSON.stringify({ ok: true, url })
      const res = await chai.request(server).get(`/api/resolve/${x}/${y}?force=true`)
      expect(res.status, 'Expect status 200: unless parcel is blacklisted').to.be.equal(200)
      expect(checkParcel.called, 'Expect checkParcel not to be called').to.be.false
      expect(
        JSON.stringify(res.body),
        `Expect body to have the ipfs data`
      ).to.be.equal(resExpected)
    })

    it('should not resolve because IPNS is blacklisted', async () => {
      checkParcel.restore()
      const resExpected = JSON.stringify({ error: `Parcel (${x},${y}) is blacklisted` })
      const res = await chai.request(server).get(`/api/resolve/${x}/${y}`)
      expect(res.status, 'Expect status 403: parcel is blacklisted').to.be.equal(403)
      expect(
        JSON.stringify(res.body),
        `Expect body to be Parcel (${x},${y}) is blacklisted`
      ).to.be.equal(resExpected)
    })

    it('should not resolve because IPNS not found', async () => {
      getIPNS.restore()
      const resExpected = JSON.stringify({ error: 'IPNS not found' })
      const res = await chai.request(server).get(`/api/resolve/${x}/${y}`)
      expect(res.status, 'Expect status 404').to.be.equal(404)
      expect(
        JSON.stringify(res.body),
        'Expect body to be IPNS not found'
      ).to.be.equal(resExpected)
    })
   })

  describe('Download', () => {
    it('should download', async () => {
      const resExpected = '"I am using for testing!"'
      const res = await chai.request(server).get(`/api/get/${ipfs}`)
      expect(res.status, 'Expect status 200').to.be.equal(200)
      expect(
        JSON.stringify(res.text),
        `Expect body to be the file content`
      ).to.be.equal(resExpected)
    })

    it('should not download because hash is blacklisted', async () => {
      checkIPFS.restore()
      const resExpected = JSON.stringify({ error: `IPFS ${ipfs} is blacklisted` })
      const res = await chai.request(server).get(`/api/get/${ipfs}`)
      expect(res.status, 'Expect status 403: IPFS is blacklisted').to.be.equal(403)
      expect(
        JSON.stringify(res.body),
        `Expect body to be IPFS ${ipfs} is blacklisted`
      ).to.be.equal(resExpected)
    })
  })
})
