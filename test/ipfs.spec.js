const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const chaiHttp = require('chai-http')
const fs = require('fs')
const execFile = require('child_process').execFile
const { sandbox } = require('sinon')
const DB = require('../src/database')
const Ethereum = require('../src/ethereum')
const S3Service = require('../src/S3Service')
const server = require('../src/server')
const IPFS = require('../src/ipfs')

chai.use(chaiAsPromised)
chai.use(chaiHttp)

const ctx = sandbox.create()
const expect = chai.expect
const x = 1
const y = 1
const peerId = 'QmUZ7t5hVXMdt2yWAPkDVBuSPuGc8uNNzSzNWDoZ1i5eLa'
let ipfs
let ipns
let url
let getIPNS
let connectPeer
let getParcel
let setParcel

const addFile = () => {
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
    console.log('ipfs', ipfs)
    execFile('ipfs', ['name', 'publish', `${ipfs}`], (err, stdout, stderr) => {
      console.log('resolvin')

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
    console.log('add file')
    ipfs = await addFile()
    console.log('publish file')

    ipns = await publishFile()
    console.log('continue')

    url = {
      ipns,
      ipfs,
      dependencies: []
    }
    console.log('stubs')

    getIPNS = ctx.stub(Ethereum, 'getIPNS').callsFake(() => ipns)
    connectPeer = ctx.stub(IPFS, 'connectPeer').callsFake(() => true)
    ctx.stub(DB, 'setIPFS').callsFake(() => true)
    setParcel = ctx.stub(DB, 'setParcel').callsFake(() => true)
    ctx.stub(DB, 'getIPFS').callsFake(() => null)
    getParcel = ctx.stub(DB, 'getParcel').callsFake(() => null)
    ctx.stub(S3Service, 'uploadProject').callsFake(() => true)
  })

  afterEach(async () => {
    // completely restore all fakes created through the sanDBox
    ctx.restore()
    await removeFile()
  })

  describe('Pin', () => {
    it('should pin files', async () => {
      const resExpected = JSON.stringify({
        ok: true,
        message: 'Pinning Success'
      })
      const res = await chai
        .request(server)
        .post(`/api/v1/pin/${x}/${y}`)
        .send({ peerId, ipfs })
      console.log('body', res.body)

      expect(res.status, 'Expect status 200').to.be.equal(200)
      expect(JSON.stringify(res.body), 'Expect body to pinning success').to.be.equal(resExpected)
    })

    it('should always pin if no expected hash is provided', async () => {
      const expectedIPFS = undefined
      const resExpected = JSON.stringify({
        ok: true,
        message: 'Pinning Success'
      })
      const res = await chai
        .request(server)
        .post(`/api/v1/pin/${x}/${y}`)
        .send({ peerId, ipfs: expectedIPFS })
      expect(res.status, 'Expect status 200').to.be.equal(200)
      expect(JSON.stringify(res.body), 'Expect body to pinning success').to.be.equal(resExpected)
    })

    it('should not pin files if ipfs expected is different from resolved', async () => {
      const expectedIPFS = '1'
      const resExpected = JSON.stringify({
        error: `The resolved IPFS hash doesn't match the expected IPFS hash ${expectedIPFS}. Please wait a few minutes and pin again`
      })
      const res = await chai
        .request(server)
        .post(`/api/v1/pin/${x}/${y}`)
        .send({ peerId, ipfs: expectedIPFS })
      expect(res.status, 'Expect status 404').to.be.equal(404)
      expect(
        JSON.stringify(res.body),
        `The resolved IPFS hash doesn't match the expected IPFS hash ${expectedIPFS}. Please wait a few minutes and pin again`
      ).to.be.equal(resExpected)
    })

    it('should not pin files because peer has not a valid format', async () => {
      connectPeer.restore()
      const resExpected = JSON.stringify({
        error: 'Invalid peerId: peerId'
      })
      const res = await chai
        .request(server)
        .post(`/api/v1/pin/${x}/${y}`)
        .send({ peerId: 'peerId', ipfs })
      expect(res.status, 'Expect status 400: Invalid peerId format').to.be.equal(400)
      expect(JSON.stringify(res.body), 'Expect body to be Invalid peerId').to.be.equal(resExpected)
    })

    it('should not pin files because peer is down', async () => {
      connectPeer.restore()
      const resExpected = JSON.stringify({
        error: `Could not connect to peer: ${peerId}`
      })
      const res = await chai
        .request(server)
        .post(`/api/v1/pin/${x}/${y}`)
        .send({ peerId, ipfs })
      expect(res.status, 'Expect status 500: could not connect to peer').to.be.equal(500)
      expect(JSON.stringify(res.body), 'Expect body to be could not resolve name').to.be.equal(resExpected)
    })

    it('should not pin files because IPNS does not exist', async () => {
      getIPNS.callsFake(() => null)
      const resExpected = JSON.stringify({
        error: 'Error: Could not resolve name.\n'
      })
      const res = await chai
        .request(server)
        .post(`/api/v1/pin/${x}/${y}`)
        .send({ peerId, ipfs })
      expect(res.status, 'Expect status 500: could not resolve name').to.be.equal(500)
      expect(JSON.stringify(res.body), 'Expect body to be could not resolve name').to.be.equal(resExpected)
    })

    it('should not pin files because parcel has not IPNS', async () => {
      getIPNS.restore()
      const resExpected = JSON.stringify({ error: 'IPNS not found' })
      const res = await chai
        .request(server)
        .post(`/api/v1/pin/${x}/${y}`)
        .send({ peerId, ipfs })
      expect(res.status, 'Expect status 404').to.be.equal(404)
      expect(JSON.stringify(res.body), 'Expect body to be IPNS not found').to.be.equal(resExpected)
    })
  })

  describe('Resolve', () => {
    it('should resolve', async () => {
      getParcel.callsFake(() => url)
      const resExpected = JSON.stringify({ ok: true, url })
      const res = await chai.request(server).get(`/api/v1/resolve/${x}/${y}`)
      expect(res.status, 'Expect status 200').to.be.equal(200)
      expect(getParcel.called, 'Expect getParcel to be called').to.be.true
      expect(setParcel.called, 'Expect setParcel not to be called').to.be.false
      expect(JSON.stringify(res.body), 'Expect body to have the ipfs data').to.be.equal(resExpected)
    })

    it('should not resolve because Parcel was not pinned', async () => {
      const resExpected = JSON.stringify({
        error: `Parcel ${x},${y} is not pinned`
      })
      const res = await chai.request(server).get(`/api/v1/resolve/${x}/${y}`)
      expect(res.status, 'Expect status 404').to.be.equal(404)
      expect(JSON.stringify(res.body), 'Expect body to be IPNS was not pinned').to.be.equal(resExpected)
    })
  })

  describe('Download', () => {
    it('should redirect to S3', async () => {
      const res = await chai.request(server).get(`/api/v1/get/${ipfs}`)
      expect(res, 'Expect status 302').to.redirectTo(`${process.env.S3_URL}/${process.env.S3_BUCKET}/${ipfs}`)
    })
  })
})
