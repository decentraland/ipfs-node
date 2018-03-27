const Promise = require('bluebird')
const redis = require('redis')

const client = Promise.promisifyAll(redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST))

if (process.env.REDIS_PASSWORD) {
  client.auth(process.env.REDIS_PASSWORD)
}

function setParcel ({ x, y }, url) {
  return client.setAsync(`${x},${y}`, JSON.stringify(url))
}

async function getParcel (x, y) {
  const url = await client.getAsync(`${x},${y}`)
  return JSON.parse(url)
}

function setIPFS (ipns, ipfs) {
  return client.setAsync(ipns, ipfs)
}

async function getIPFS (ipns) {
  const ipfs = await client.getAsync(ipns)
  return ipfs
}

module.exports = {
  setIPFS,
  getIPFS,
  setParcel,
  getParcel
}
