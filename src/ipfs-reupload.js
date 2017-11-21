const tempy = require('tempy')
const fs = require('fs')
const path = require('path')
const exec = require('child_process').exec
const escapeShellArg = require('./escape-shell-arg')
const glob = require('glob')
const zipName = 'model.zip'

class Bundle {
  constructor () {
    this.files = []
    this.directory = tempy.directory()
    this.zipfile = path.join(this.directory, zipName)
  }

  toString () {
    return ' * ' + this.files.map((f) => f.path).join('\n * ')
  }

  download (url) {
    console.log('[reupload] download...', url)

    return new Promise(
      (resolve, reject) => {
        exec(`curl ${escapeShellArg(url)} -o ${this.zipfile}`, (err, stdout, stderr) => {
          if (err) {
            reject(err)
            return
          }

          resolve(this)
        })
      })
  }

  unzip () {
    console.log('[reupload] unzip...')

    return new Promise(
      (resolve, reject) => {
        const addFiles = (err) => {
          if (err) {
            reject(err)
            return
          }

          glob(path.join(this.directory, '*'), {}, (err, files) => {
            if (err) {
              reject(err)
              return
            }

            this.files = files.map((f) => path.basename(f))

            resolve(this)
          })
        }

        exec(`unzip ${zipName}`, { cwd: this.directory }, (err, stdout, stderr) => {
          if (err) {
            reject(err)
            return
          }

          fs.unlink(this.zipfile, addFiles)
        })
      })
  }

  upload () {
    console.log('[reupload] upload...', this.directory)

    return new Promise(
      (resolve, reject) => {
        console.log(`ipfs add -r ${path.join(this.directory, './*')}`)

        exec(`ipfs add -w -r ${path.join(this.directory, './*')}`, (err, stdout, stderr) => {
          if (err) {
            reject(err)
            return
          }

          const added = stdout.split('\n').slice(-2)[0]
          const url = added.match(/added (\S+)/)[1]
          resolve(url, this.files)
        })
      })
  }
}

function handler (req, res) {
  const url = req.body.url

  console.log('[reupload] url: ', url)

  const bundle = new Bundle()

  bundle
    .download(url)
    .then(() => bundle.unzip())
    .then(() => bundle.upload())
    .then((url) => {
      console.log('Uploading complete...')
      console.log(`Source: ${url}`)
      console.log(`Time: ${new Date().toString()}`)
      console.log(`IP Address: ${req.connection && req.connection.remoteAddress}`)
      console.dir(req.headers)
      console.log(bundle.toString())
      console.log(` * Uploaded as hash ${url}\n\n`)

      res.json({
        success: true,
        url,
        files: bundle.files
      })
    })
}

module.exports = handler
