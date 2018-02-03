const execFile = require('child_process').execFile

module.exports = class Download {
  constructor () {
    this.download = async (req, res) => {
      try {
        const data = await this.get(req.params.name)
        return res.json({ ok: true, data })
      } catch (error) {
        return res.json({ ok: false, error })
      }
    }
    this.pin = async (req, res) => {
      try {
        await this.pin(req.params.name)
        return res.json({ ok: true })
      } catch (error) {
        console.log(error.stack)
        return res.json({ ok: false, error: error.message })
      }
    }
    this.resolve = async (req, res) => {
      try {
        const shouldGetDependencies = req.query.dependencies === 'true'
        const url = await this.getTarget(req.params.name, shouldGetDependencies)
        return res.json({ ok: true, url })
      } catch (error) {
        console.log(error.stack)
        return res.json({ ok: false, error: error.message })
      }
    }
  }

  get (name) {
    return new Promise((resolve, reject) => {
      execFile('ipfs', ['cat', `/ipfs/${name}`],
        (err, stdout, stderr) => {
          if (err) return reject(stderr)
          return resolve(stdout)
        }
      )
    })
  }

  publishHash (name) {
    return new Promise((resolve, reject) => {
      execFile('ipfs', ['pin', 'add', name], (err, stdout, stderr) => {
        if (err) {
          return reject(stderr)
        }
        return resolve()
      })
    })
  }

  getTarget (name, shouldGetDependencies = false) {
    const ipfs = await resolveDependencies(name)
    let dependencies = []
    if (shouldGetDependencies) {
      dependencies = await this.resolveDependencies(ipfs)
    }
    return { ipfs, dependencies }
  }

  async resolveIPNS (input) {
    return new Promise((resolve, reject) => {
      execFile('ipfs', ['name', 'resolve', name], (err, stdout, stderr) => {
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
}
