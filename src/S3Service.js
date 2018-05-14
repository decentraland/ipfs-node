const request = require('request')
const AWS = require('aws-sdk')
const stream = require('stream')
const bucket = process.env.S3_BUCKET

class S3Service {
  static uploadProject(ipfs, dependencies) {
    return Promise.all(
      this.getProjectStructure(ipfs, dependencies).map(
        file =>
          new Promise(async (resolve, reject) => {
            const fileExist = await this.fileExist(file)
            if (!fileExist) {
              request
                .get(`http://localhost:8080/ipfs/${file}`)
                .pipe(this.upload(file, resolve, reject))
            } else {
              resolve()
            }
          })
      )
    )
  }

  static fileExist(name) {
    const S3 = new AWS.S3()
    return new Promise(resolve =>
      S3.headObject(
        {
          Bucket: bucket,
          Key: name
        },
        err => {
          if (err) {
            resolve(false)
          } else {
            resolve(true)
          }
        }
      )
    )
  }

  static upload(name, resolve, reject) {
    const S3 = new AWS.S3()
    const pass = new stream.PassThrough()
    S3.upload(
      {
        Bucket: bucket,
        Key: name,
        Body: pass,
        ACL: 'public-read'
      },
      (err, data) => (err ? reject(err) : resolve(data))
    )
    return pass
  }

  /**
   *
   * @param ipfs
   * @param dependencies
   * @returns array of filenames with path
   * E.g: ['hash/index.js', 'hash/folder/scene.json',..]
   */
  static getProjectStructure(ipfs, dependencies) {
    let dir = [{ name: ipfs, ipfs }]
    return dependencies.reduce((acc, dependency) => {
      if (dir[dir.length - 1].ipfs !== dependency.src) {
        const index = dir.findIndex((path) => path.ipfs === dependency.src)
        dir = dir.slice(0, index + 1)
      }
      if (dependency.name.indexOf('.') === -1) {
        dir.push(dependency)
      } else {
        acc.push(
          dir
            .map((path) =>  path.name)
            .join('/') +
            '/' +
            dependency.name
        )
      }
      return acc
    }, [])
  }
}

module.exports = S3Service
