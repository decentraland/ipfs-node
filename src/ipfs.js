const execFile = require('child_process').execFile
const Ethereum = require('./ethereum')
const Blacklist = require('./blacklist')
const DB = require('./database')
const request = require('request')

module.exports = class Download {
  constructor () {
    this.download = async (req, res, next) => {
      try {
        const ipfs = req.params.ipfs
        const file = req.params[0] ? `${ipfs}/${req.params[0]}` : ipfs
        await Blacklist.checkIPFS(ipfs)
        request.get(`http://localhost:8080/ipfs/${file}`).pipe(res)
      } catch (error) {
        next(error)
      }
    }
    this.pin = async (req, res, next) => {
      try {
        const [x, y] = [req.params.x, req.params.y]
        const ipns = await Ethereum.getIPNS(x, y)
        await Download.connectPeer(req.params.peerId)
        const ipfs = await Download.resolveIPNS(ipns)
        await Download.publishHash(ipfs)
        const dependencies = await Download.resolveDependencies(ipfs)
        await DB.setIPFS(ipns, ipfs)
        await DB.setParcel({ x, y }, { ipns, ipfs, dependencies })
        return res.json({ ok: true, message: 'Pinning Success' })
      } catch (error) {
        next(error)
      }
    }
    this.resolve = async (req, res, next) => {
      try {
        const [x, y] = [req.params.x, req.params.y]
        if (!req.query.force) { // No cache
          await Blacklist.checkParcel(x, y)
          const cachedResponse = await DB.getParcel(x, y)
          if (cachedResponse) {
            return res.json({ok: true, url: cachedResponse})
          }
        }
        const ipns = await Ethereum.getIPNS(x, y)
        const ipfs = await Download.resolveIPNS(ipns)
        const dependencies = await Download.resolveDependencies(ipfs)
        const url = { ipns, ipfs, dependencies }
        await DB.setParcel({ x, y }, url)
        return res.json({ ok: true, url })
      } catch (error) {
        next(error)
      }
    }
  }

  static publishHash (ipfs) {
    return new Promise((resolve, reject) => {
      execFile('ipfs', ['pin', 'add', ipfs], (err, stdout, stderr) => {
        if (err) {
          return reject(stderr)
        }
        const match = stdout.match(new RegExp('pinned ([a-zA-Z0-9]+) recursively'))
        if (!match) {
          reject(new Error('Can not pin: ' + ipfs))
        }
        return resolve()
      })
    })
  }

  static resolveIPNS (ipns) {
    return new Promise((resolve, reject) => {
      execFile('ipfs', ['name', 'resolve', '--nocache', ipns], async (err, stdout, stderr) => {
        let ipfs
        if (err) {
          // Check it with our dht
          ipfs = await DB.getIPFS(ipns)
          if (!ipfs) {
            return reject(new Error(stderr))
          } else {
            return resolve(ipfs)
          }
        }
        ipfs = stdout.substr(6, stdout.length - 7)
        return resolve(ipfs)
      })
    })
  }

  static resolveDependencies (ipfs) {
    return new Promise((resolve, reject) => {
      execFile('ipfs',
      ['refs', '-r', '--format=<src> <dst> <linkname>', ipfs],
      {maxBuffer: 1024 * 500},
      (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr))
        const dependencies = stdout.split(/\r?\n/).filter(row => row).map(row => {
          const data = row.replace(/\s+/g, ' ').trim().split(' ') // row format: src | ipfsHash | name
          return {
            src: data[0],
            ipfs: data[1],
            name: data[2]
          }
        })
        return resolve(dependencies)
      })
    })
  }

  static connectPeer (peerId) {
    return new Promise((resolve, reject) => {
      execFile('ipfs', ['swarm', 'connect', `/p2p-circuit/ipfs/${peerId}`], (err, stdout, stderr) => {
        if (err) return reject(new Error('Could not connect to peer: ' + peerId))
        return resolve()
      })
    })
  }
}
