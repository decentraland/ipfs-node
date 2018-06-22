const request = require('request')
const execFile = require('child_process').execFile
const createError = require('http-errors')
const Ethereum = require('./ethereum')
const DB = require('./database')
const Blacklist = require('./blacklist')
const S3Service = require('./S3Service')
const { isMultihash } = require('./utils')

class Download {
  constructor() {
    this.download = async (req, res, next) => {
      try {
        const ipfs = req.params.ipfs
        const file = req.params[0] ? `${ipfs}${req.params[0]}` : ipfs
        await Blacklist.checkIPFS(ipfs)
        return res.redirect(
          `${process.env.S3_URL}/${process.env.S3_BUCKET}/${file}`
        )
      } catch (error) {
        next(error)
      }
    }

    this.pin = async (req, res, next) => {
      try {
        const { x, y } = req.params
        const [expectedIPFS, peerId] = [req.body.ipfs, req.body.peerId]

        if (!isMultihash(peerId)) {
          throw createError(400, `Invalid peerId: ${peerId}`)
        }

        const ipns = await Ethereum.getIPNS(x, y)
        await Download.connectPeer(peerId)
        const ipfs = await Download.resolveIPNS(ipns)

        if (expectedIPFS && ipfs !== expectedIPFS) {
          throw createError(
            404,
            `The resolved IPFS hash doesn't match the expected IPFS hash ${expectedIPFS}. Please wait a few minutes and pin again`
          )
        }

        await Download.publishHash(ipfs)
        const { dependencies, contents } = await Download.getProjectStructure(ipfs, await Download.resolveDependencies(ipfs))
        await S3Service.uploadProject(ipfs, dependencies, contents)
        await DB.setIPFS(ipns, ipfs)
        await DB.setParcel({ x, y }, { version: 2, ipns, ipfs, dependencies, lastModified: new Date().toISOString() })
        return res.json({ ok: true, message: 'Pinning Success' })
      } catch (error) {
        next(error)
      }
    }

    this.resolve = async (req, res, next) => {
      try {
        const [x, y] = [req.params.x, req.params.y]
        if (!req.query.force) {
          // Force does not check if parcel is blacklisted
          await Blacklist.checkParcel(x, y)
        }
        const cachedResponse = await DB.getParcel(x, y)
        if (!cachedResponse) {
          throw createError(404, `Parcel ${x},${y} is not pinned`)
        }
        return res.json({
          ok: true,
          url: Download.mapResponse(cachedResponse)
        })
      } catch (error) {
        next(error)
      }
    }
  }

  static mapResponse(entry) {
    if (entry.version === 2) {
      return {
        ipfs: entry.ipfs,
        ipns: entry.ipns,
        lastModified: entry.lastModified,
        dependencies: entry.dependencies
          .filter(dep => dep.type === 'file')
          .map(dep => {
            const { type, ...data } = dep // eslint-disable-line 
            return data
          })
      }
    }

    return entry
  }

  static publishHash(ipfs) {
    return new Promise((resolve, reject) => {
      execFile('ipfs', ['pin', 'add', ipfs], (err, stdout, stderr) => {
        if (err) {
          return reject(stderr)
        }
        const match = stdout.match(
          new RegExp('pinned ([a-zA-Z0-9]+) recursively')
        )
        if (!match) {
          reject(new Error('Can not pin: ' + ipfs))
        }
        return resolve()
      })
    })
  }

  static resolveIPNS(ipns) {
    return new Promise((resolve, reject) => {
      execFile(
        'ipfs',
        ['name', 'resolve', '--nocache', ipns],
        async (err, stdout, stderr) => {
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
        }
      )
    })
  }

  static resolveDependencies(ipfs) {
    return new Promise((resolve, reject) => {
      execFile(
        'ipfs',
        ['refs', '-r', '--format=<src> <dst> <linkname>', ipfs],
        { maxBuffer: 1024 * 500 },
        (err, stdout, stderr) => {
          if (err) return reject(new Error(stderr))
          const dependencies = stdout
            .split(/\r?\n/)
            .filter(row => row)
            .map(
              row =>
                row
                  .replace(/\s+/g, ' ')
                  .trim()
                  .split(' ') // row format: src | ipfsHash | name
            )
            .reduce((dependencies, data) => {
              if (data.length > 2) {
                dependencies[data[1]] = {
                  src: data[0],
                  ipfs: data[1],
                  name: data.slice(2, data.length).join(' ') // files with spaces in the name
                }
              }
              return dependencies
            }, {})
          return resolve(dependencies)
        }
      )
    })
  }

  static connectPeer(peerId) {
    return new Promise((resolve, reject) => {
      execFile(
        'ipfs',
        ['swarm', 'connect', `/p2p-circuit/ipfs/${peerId}`],
        err => {
          if (err) {
            return reject(new Error('Could not connect to peer: ' + peerId))
          }
          return resolve()
        }
      )
    })
  }

  static async getProjectStructure(rootHash, dependencies) {
    let deps = []
    let contents = {}

    await Promise.all(Object.values(dependencies).map(async dep => {
      // If we have a parent
      if (dep.src.trim().length) {
        let path = ''

        // If the parent is the root hash, we are done
        if (dep.src === rootHash) {
          path = `/${dep.name}`
        } else {
          // If the parent is something else, we will find the absolute path up until rootHash
          path = Download.resolvePath(dep.ipfs, dependencies, rootHash)
        }

        const { content, ...data } = await Download.getDependency(rootHash + path)
        contents[dep.ipfs] = content
        deps.push({ ...dep, ...data, path })
      } else {
        console.log(`Skipping malformed parent ipfs hash: "${dep.src}"`)
      }
    }))

    return { dependencies: deps, contents }
  }

  static getDependency(path) {
    return new Promise((resolve, reject) => {
      request
        .get(`http://localhost:8080/ipfs/${path}`, (e, response, body) => {
          if (!response.headers['accept-ranges']) {
            // ^ Directories don't contain this header
            resolve({
              type: 'directory',
              size: 0,
              contentType: 'text/directory',
              content: null
            })
          } else {
            resolve({
              type: 'file',
              size: parseInt(response.headers['content-length'], 10) || 0,
              contentType: response.headers['content-type'],
              content: response.body
            })
          }
        })
    })
  }

  static resolvePath(hash, dependencies, rootHash) {
    let path = ''

    if (dependencies[hash].src !== rootHash) {
      path = path + Download.resolvePath(dependencies[hash].src, dependencies, rootHash)
    }

    path = path + '/' + dependencies[hash].name

    return path
  }
}

module.exports = Download