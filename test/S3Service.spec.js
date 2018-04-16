const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const { sandbox } = require('sinon')
const S3Service = require('../src/S3Service')
const AWS = require('aws-sdk')

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
let S3

describe('S3Service', () => {
  beforeEach(() => {
    S3 = ctx.stub(AWS, 'S3').callsFake(() => ({
      headObject: () => true,
      upload: () => true,
    }))
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

  //describe('fileExist', () => {
  //  it('should check if file exist', async () => {
  //    const res = S3Service.fileExist('file')
  //    S3Instance = new S3()
  //    expect(
  //      S3.called,
  //      'expect S3 to be called'
  //    ).to.be.true
  //
  //    expect(
  //      S3.headObject.called,
  //      'expect S3.headObject to be called'
  //    ).to.be.true
  //  })
  //})
})
