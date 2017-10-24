const exec = require('child_process').exec
const sanitize = require('./sanitize-name')

module.exports = class Data {
  constructor () {
    this.resolve = async (req, res) => {
      const name = sanitize(req.params.name)

      try {
        const data = await this.getTarget(name)
        return res.json({ ok: true, data })
      } catch (error) {
        return res.json({ ok: false, error })
      }
    }
  }
  getTarget (name) {
    return new Promise((resolve, reject) => {
      exec(`ipfs cat /ipfs/${name}/parcel.aframe`, (err, stdout, stderr) => {
        if (err) return reject(stderr)
        return resolve(stdout)
      })
    })
  }
}
