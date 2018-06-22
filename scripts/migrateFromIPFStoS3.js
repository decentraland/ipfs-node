require('dotenv').config('../.env')
const DB = require('../src/database')
const S3Service = require('../src/S3Service')
const Download = require('../src/ipfs')
const { isMultihash } = require('../src/utils')

async function migrateFromIPFStoS3() {
  console.log('THIS SCRIPT IS OUTDATED, DANI SHOULD CHECK THIS')
  DB.connect()

  const keys = await DB.getAll().filter(isMultihash)
  const validKeys = keys.filter(isMultihash)
  console.log(`Processing ${keys.length} keys....`)

  for (let i = 0, len = validKeys.length; i < len; i++) {
    const key = validKeys[i]
    console.log(`Resolving IPNS: ${key}`)
    const ipfs = await DB.getIPFS(key)
    console.log(`Uploading IPFS: ${ipfs}`)
    const dependencies = await Download.resolveDependencies(ipfs)
    console.log(ipfs, dependencies)
    await S3Service.uploadProject(ipfs, dependencies)
  }
  console.log('We are done')
}

Promise.resolve()
  .then(migrateFromIPFStoS3)
  .catch(error => console.error(`An error occurred: ${error.message}\n`, error))
  .then(() => process.exit())
