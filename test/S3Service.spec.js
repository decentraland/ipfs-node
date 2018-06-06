const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const { sandbox } = require('sinon')
const request = require('request')
const stream = require('stream')
const S3Service = require('../src/S3Service')

chai.use(chaiAsPromised)

const ctx = sandbox.create()
const ipfs = 'hash'
const dependencies = [
  { src: 'hash', ipfs: 'hash1', name: 'file1.txt' },
  { src: 'hash', ipfs: 'hash2', name: 'directory' },
  { src: 'hash2', ipfs: 'hash3', name: 'file2.txt' },
  { src: 'hash2', ipfs: 'hash4', name: 'subDirectory' },
  { src: 'hash4', ipfs: 'hash5', name: 'file3.txt' },
  { src: 'hash', ipfs: 'hash6', name: 'file4.txt' }
]
const projectStructure = [
  'hash/file1.txt',
  'hash/directory/file2.txt',
  'hash/directory/subDirectory/file3.txt',
  'hash/file4.txt'
]
const expect = chai.expect
let fileExist
let upload

describe('S3Service', () => {
  beforeEach(() => {
    const inStream = new stream.Readable()
    inStream.push('ABCDEFGHIJKLM')
    inStream.push(null)

    fileExist = ctx.stub(S3Service, 'fileExist').callsFake(() => false)
    upload = ctx.stub(S3Service, 'upload').callsFake((name, resolve) => {
      const s = new stream.PassThrough()
      setTimeout(() => resolve(), 5)
      return s
    })
    ctx.stub(request, 'get').returns(inStream)
  })

  afterEach(() => {
    // completely restore all fakes created through the sandbox
    ctx.restore()
  })
  describe('getProjectStructure', () => {
    it('should get project structure', () => {
      expect(
        S3Service.getProjectStructure(ipfs, dependencies).join(','),
        'expect real project structure'
      ).to.be.equal(projectStructure.join(','))
    })
  })

  describe('uploadProject', () => {
    it('should upload files', async () => {
      await S3Service.uploadProject(ipfs, dependencies)

      expect(
        fileExist.callCount,
        'expect fileExist to be called 4 times'
      ).to.be.equal(4)

      expect(upload.callCount, 'expect upload to be called').to.be.equal(4)
    })

    it('should not upload files cause they exist', async () => {
      fileExist.returns(true)
      await S3Service.uploadProject(ipfs, dependencies)
      expect(
        fileExist.callCount,
        'expect fileExist to be called 4 times'
      ).to.be.equal(4)

      expect(upload.callCount, 'expect upload to be called').to.be.equal(0)
    })
  })
})
