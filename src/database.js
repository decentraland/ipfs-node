const Promise = require('bluebird')
const redis = require('redis')
let client

class Database {
  static connect() {
    client = Promise.promisifyAll(
      redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST)
    )
    if (process.env.REDIS_PASSWORD) {
      this.client.auth(process.env.REDIS_PASSWORD)
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
    console.log('aaaaa')
    return client.setAsync(ipns, ipfs)
  }

  static async getIPFS(ipns) {
    console.log(ipns)
    const ipfs = await client.getAsync(ipns)
    return ipfs
  }
}

module.exports = Database
