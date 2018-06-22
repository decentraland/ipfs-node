const AWS = require('aws-sdk')
const BUCKET = process.env.S3_BUCKET

class S3Service {
  /**
   * Uploads project to S3
   * @param ipfs the root hash
   * @param dependencies the array of dependencies containing ipfs, src, size, path, name
   * @param contents a dictionary of { [ipfs: string]: string } for all dependency contents
   */
  static uploadProject(ipfs, dependencies, contents) {
    return Promise.all(
      dependencies.map(async dep => {
        if (dep.type === 'file') {
          const fullPath = ipfs + dep.path
          const fileExist = await this.fileExist(fullPath)
          if (!fileExist) {
            return this.upload(fullPath, contents[dep.ipfs])
          }
        }
      })
    )
  }

  /**
   * Returns true if the given hash matches an 
   * @param path the path to a file (beggining with the root ipfs hash)
   */
  static fileExist(name) {
    return new Promise(resolve => {
      const S3 = new AWS.S3()
      S3.headObject(
        {
          Bucket: BUCKET,
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
    })
  }

  /**
   * Uploads an artifact to S3
   * @param path the path to a file (beggining with the root ipfs hash)
   * @param body string containing file contents
   */
  static upload(path, body) {
    return new Promise((resolve, reject) => {
      const S3 = new AWS.S3()
      S3.upload(
        {
          Bucket: BUCKET,
          Key: path,
          Body: body,
          ACL: 'public-read'
        },
        (err, data) => (err ? reject(err) : resolve(data))
      )
    })
  }
}

module.exports = S3Service
