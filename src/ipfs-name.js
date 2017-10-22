const exec = require('child_process').exec

export default class Names {
  constructor() {
    this.resolve = async (req, res) => {
      try {
        const url = await this.getTarget(req.params.name)
        return res.json({ ok: true, url })
      } catch (error) {
        return res.json({ ok: false, error })
      }
    }
    this.publish = async (req, res) => {
      const { name, content } = req.params

      try {
        const published = await this.publishHash(name, content)
        return res.json({ ok: true, address: published })
      } catch (error) {
        return res.json({ ok: false, error })
      }
    }
  }

  createKey(name) {
    return new Promise((resolve, reject) => {
      exec(`ipfs key gen --type rsa --size 4096 ${name}`, (err, stdout, stderr) => {
        if (err) return reject(stderr)
        return resolve(stdout)
      })
    })
  }

  async idempotentCreateKey(name) {
    try {
      await this.createKey(name)
    } catch (err) {
      if (err === 'Error: key by that name already exists, refusing to overwrite') return
      else throw err
    }
  }

  getTarget(name) {
    return new Promise((resolve, reject) => {
      exec(`ipfs name resolve ${name}`, (err, stdout, stderr) => {
        if (err) return reject(stderr)
        return resolve(stdout)
      })
    })
  }

  async publishHash(name, hash) {
    await this.idempotentCreateKey(name)
    return new Promise((resolve, reject) => {
      exec(`ipfs name publish --key ${name} ${hash}`, (err, stdout, stderr) => {
        if (err) {
          return reject(stderr)
        }
        return resolve(stdout.match('to (\S+):')[1])
      })
    })
  }
}
