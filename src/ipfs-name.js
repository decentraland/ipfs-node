const exec = require('child_process').exec

export default class Names {
  constructor() {
    this.handlePublish = async (req, res) => {
      const { name, hash } = req.json

      try {
        const published = await this.publish(name, hash)
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

  async publish(name, hash) {
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
