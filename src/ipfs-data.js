const exec = require('child_process').exec

module.exports = class Data {
  constructor() {
    this.resolve = async (req, res) => {
      try {
        const data = await this.getTarget(req.params.name)
        return res.json({ ok: true, data })
      } catch (error) {
        return res.json({ ok: false, error })
      }
    }
  }
  getTarget(name) {
    return new Promise((resolve, reject) => {
      exec(`ipfs cat ${name}`, (err, stdout, stderr) => {
        if (err) return reject(stderr)
        return resolve(stdout)
      })
    })
  }
}
