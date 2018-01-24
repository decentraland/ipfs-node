const execFile = require('child_process').execFile
const sanitize = require('./sanitize-name')

module.exports = class Names {
  constructor () {
    this.resolve = async (req, res) => {
      const shouldGetDependencies = req.query.dependencies === 'true'
      try {
        let ipns = req.params.ipns
        if (req.params.key) {
          const key = sanitize(req.params.key)
          ipns = await this.getIPNSByKey(key)
        }
        const url = await this.getTarget(ipns, shouldGetDependencies)
        return res.json({ ok: true, ipns, ...url })
      } catch (error) {
        console.log(error.stack)
        return res.json({ ok: false, error: error.message })
      }
    }
    this.publish = async (req, res) => {
      const { name, content } = req.params

      try {
        const published = await this.publishHash(name, content)
        return res.json({ ok: true, address: published })
      } catch (error) {
        console.log(error.stack)
        return res.json({ ok: false, error: error.message })
      }
    }
  }

  createKey (name) {
    return new Promise((resolve, reject) => {
      execFile('ipfs', ['key', 'gen', '--type', 'rsa', '--size', '4096', name], (err, stdout, stderr) => {
        if (err && !err.message.includes('key by that name already exists')) return reject(stderr)
        return resolve(stdout)
      })
    })
  }

  async idempotentCreateKey (name) {
    try {
      await this.createKey(name)
    } catch (err) {
      if (err === 'Error: key by that name already exists, refusing to overwrite') {
        // do nothing
      } else {
        throw err
      }
    }
  }

  async resolveIPNS (input) {
    return new Promise((resolve, reject) => {
      execFile('ipfs', ['name', 'resolve', input], (err, stdout, stderr) => {
        if (err) return reject(stderr)
        const ipfs = stdout.substr(6, stdout.length - 7)
        return resolve(ipfs)
      })
    })
  }

  async resolveDependencies (ipfs) {
    return new Promise((resolve, reject) => {
      execFile('ipfs', ['refs', '-u=true', '-r', ipfs], {maxBuffer: 1024 * 500}, (err, stdout, stderr) => {
        if (err) return reject(stderr)
        const dependencies = stdout.split(/\r?\n/).filter(ipfs => ipfs)
        return resolve(dependencies)
      })
    })
  }

  async getIPNSByKey (key) {
    return new Promise((resolve, reject) => {
      execFile('ipfs', ['key', 'list', '-l'], (err, stdout, stderr) => {
        if (err) return reject(stderr)
        const match = stdout.match(new RegExp(`([a-zA-Z0-9]+) ${key}`))
        if (!match) return reject(new Error('not found'))
        const ipns = match[1]
        return resolve(ipns)
      })
    })
  }

  async getTarget (ipns, shouldGetDependencies) {
    const ipfs = await this.resolveIPNS(ipns)
    let dependencies = []
    if (shouldGetDependencies) {
      dependencies = await this.resolveDependencies(ipfs)
    }
    return { ipfs, dependencies }
  }

  async publishHash (name, hash) {
    await this.idempotentCreateKey(name)
    return new Promise((resolve, reject) => {
      execFile('ipfs', ['name', 'publish', '--resolve=false', '--key', name, hash], (err, stdout, stderr) => {
        if (err) {
          return reject(stderr)
        }
        const match = stdout.match(new RegExp('to ([a-zA-Z0-9]+):'))
        if (!match) {
          return reject(new Error('No result found:' + stdout))
        }
        return resolve(match[1])
      })
    })
  }
}
