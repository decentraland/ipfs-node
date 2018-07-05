const AWS = require('aws-sdk')
const request = require('request')
const stream = require('stream')
const BUCKET = process.env.S3_BUCKET

class S3Service {
  /**
   * Uploads project to S3
   * @param ipfs the root hash
   * @param dependencies the array of dependencies containing ipfs, src, path, name
   */
  static uploadProject(ipfs, dependencies) {
    return Promise.all(
      dependencies.map(async dep => {
        const fullPath = ipfs + dep.path
        const fileExist = await this.fileExists(fullPath)
        return new Promise((resolve, reject) => {
          if (!fileExist) {
            console.log('uploading', fullPath)
            request
              .get(`http://localhost:8080/ipfs/${fullPath}`)
              .pipe(this.upload(fullPath, resolve, reject))
          } else {
            resolve()
          }
        })
      })
    )
  }

  /**
   * Returns size and content type for existing files or null for inexisting files
   * @param fullPath the path to a file (beggining with the root ipfs hash)
   */
  static fileExists(fullPath) {
    const S3 = new AWS.S3()
    console.log('getFileData', fullPath)

    return new Promise(resolve => {
      S3.headObject(
        {
          Bucket: BUCKET,
          Key: fullPath
        },
        (err, data) => {
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
  static upload(path, resolve, reject) {
    const S3 = new AWS.S3()
    const pass = new stream.PassThrough()
    console.log('s3', path)
    S3.upload(
      {
        Bucket: BUCKET,
        Key: path,
        Body: pass,
        ACL: 'public-read'
      },
      (err, data) => (err ? reject(err) : resolve(data))
    )

    return pass
  }
}

module.exports = S3Service
