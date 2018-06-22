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

  /**
   * Persists a parcel
   * @param coordinates an object that contains x and y number fields
   * @param data an object that contains ipfs (string), ipns (string) and a array of dependencies
   */
  static setParcel({ x, y }, data) {
    return client.setAsync(`${x},${y}`, JSON.stringify(data))
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
