require('babel-polyfill')
require('dotenv').config({path: './.env'})
const { eth, contracts } = require('decentraland-commons')
const createError = require('http-errors')
const web3Eth = eth
const { LANDRegistry } = contracts

async function connectBlockchain () {
  try {
    await web3Eth.disconnect() // clean if it is a retry
    let connected = await web3Eth.connect({
      contracts: [LANDRegistry]
    })
    if (!connected) {
      throw new Error('Could not connect to the blockchain')
    }
  } catch (e) {
    console.log(`${e.message}. Retry in 3s...`)
    setTimeout(connectBlockchain, 3000)
  }
}

async function getIPNS (x, y) {
  try {
    const land = web3Eth.getContract('LANDRegistry')
    const metadata = await land.landData(x, y)
    const ipns = await LANDRegistry.decodeLandData(metadata).ipns
    return ipns.split(':')[1]
  } catch (e) {
    throw createError(404, 'IPNS not found')
  }
}

module.exports = {
  connectBlockchain,
  getIPNS
}
