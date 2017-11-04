const exec = require('child_process').exec
const sanitize = require('./sanitize-name')
const escapeShellArg = require('./escape-shell-arg')

module.exports = class Names {
  constructor () {
    this.resolve = async (req, res) => {
      const name = sanitize(req.params.name)

      try {
        const url = await this.getTarget(name)
        return res.json({ ok: true, url })
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
      const command = `ipfs key gen --type rsa --size 4096 ${escapeShellArg(name)}`
      console.log('Execute', command)
      exec(command, (err, stdout, stderr) => {
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

  getTarget (name) {
    return new Promise((resolve, reject) => {
      exec(`ipfs key list -l`, (err, stdout, stderr) => {
        if (err) return reject(stderr)
        const match = stdout.match(new RegExp(`([a-zA-Z0-9]+) ${name}`))
        if (!match) return reject(new Error('not found'))
        const command = `ipfs name resolve ${escapeShellArg(match[1])}`
        console.log('Execute', command)
        exec(command, (err, stdout, stderr) => {
          if (err) return reject(stderr)
          const ipfs = stdout.substr(6, stdout.length - 7)
          return resolve({ ipns: match[1], ipfs })
        })
      })
    })
  }

  async publishHash (name, hash) {
    await this.idempotentCreateKey(name)
    return new Promise((resolve, reject) => {
      exec(`ipfs name publish --resolve=false --key ${escapeShellArg(name)} ${escapeShellArg(hash)}`, (err, stdout, stderr) => {
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
