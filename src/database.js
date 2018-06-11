const Promise = require('bluebird')
const redis = require('redis')
let client

class Database {
  static connect() {
    client = Promise.promisifyAll(
      redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST)
    )
    if (process.env.REDIS_PASSWORD) {
      client.auth(process.env.REDIS_PASSWORD)
    }
  }

  static setParcel({ x, y }, url) {
    return client.setAsync(`${x},${y}`, JSON.stringify(url))
  }

  static async getParcel(x, y) {
    const url = await client.getAsync(`${x},${y}`)
    return JSON.parse(url)
  }

  static setIPFS(ipns, ipfs) {
    return client.setAsync(ipns, ipfs)
  }

  static async getIPFS(ipns) {
    const ipfs = await client.getAsync(ipns)
    return ipfs
  }

  static getAll() {
    return client.keysAsync('*')
  }
}

module.exports = Database
