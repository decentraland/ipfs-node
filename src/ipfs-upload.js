const tempy = require('tempy')
const fs = require('fs')
const path = require('path')
const exec = require('child_process').exec
const mkdirp = require('mkdirp')

class Bundle {
  constructor () {
    this.files = []
    this.directory = tempy.directory()
  }

  addFile (file) {
    this.files.push(file)

    return new Promise(
      (resolve, reject) => {
        // todo - check that the resolve correctly sanitizes file paths
        const fn = path.join(this.directory, path.resolve('/', file.path))
        const dir = path.dirname(fn)
        const buf = Buffer.from(file.data, 'base64')

        mkdirp(dir, (err) => {
          if (err) {
            reject(err)
          } else {
            fs.writeFile(fn, buf, (err) => {
              err ? reject(err) : resolve()
            })
          }
        })
      }
    )
  }

  upload () {
    return new Promise(
      (resolve, reject) => {
        console.log(`ipfs add -r ${path.join(this.directory, './*')}`)

        exec(`ipfs add -w -r ${path.join(this.directory, './*')}`, (err, stdout, stderr) => {
          if (err) {
            reject(err)
            return
          }

          const added = stdout.split('\n').slice(-2)[0]
          const url = 'ipfs:' + added.match(/added (\S+)/)[1]
          resolve(url)
        })
      })
  }
}

function handler (req, res) {
  const bundle = new Bundle()

  const promises = []

  req.body.files.forEach((f) => {
    promises.push(bundle.addFile(f))
  })

  Promise.all(promises)
    .then(() => {
      return bundle.upload()
    })
    .then((url) => {
      console.log('Uploading complete...')

      res.json({
        success: true,
        url
      })
    })
}

module.exports = handler
