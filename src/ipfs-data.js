const execFile = require('child_process').execFile
const sanitize = require('./sanitize-name')
const escapeShellArg = require('./escape-shell-arg')

module.exports = class Data {
  constructor () {
    this.resolve = async (req, res) => {
      try {
        const data = await this.getScene(req.params.name)
        const metadata = await this.getMetadata(req.params.name)
        return res.json({ ok: true, data, metadata })
      } catch (error) {
        return res.json({ ok: false, error })
      }
    }
  }
  getScene (name) {
    return new Promise((resolve, reject) => {
      if (!name.match(/[a-z0-9]+/gi)) {
        return reject('invalid argument')
      }
      execFile('ipfs', ['cat', `/ipfs/${name}/parcel.aframe`], (err, stdout, stderr) => {
        if (err) return reject(stderr)
        return resolve(stdout)
      })
    })
  }
  getMetadata (name) {
    return new Promise((resolve, reject) => {
      if (!name.match(/[a-z0-9]+/gi)) {
        return reject('invalid argument')
      }
      execFile('ipfs', ['cat', `/ipfs/${name}/scene.json`], (err, stdout, stderr) => {
        if (err) return reject(stderr)
        return resolve(stdout)
      })
    })
  }
}
