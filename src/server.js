require('newrelic')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const IPFS = require('./ipfs')
const { setLogger, errorHandler, notFound } = require('./utils')
const Ethereum = require('./ethereum')
const DB = require('./database')

const app = express()
const ipfs = new IPFS()
const v1 = express.Router();

app.use(cors())

// Parse the huge uploads we may get, still 100mb limit
// though since the VM may run out of memory
app.use(bodyParser.json({ limit: '10kb' }))

setLogger(app)

v1.post('/pin/:x/:y', ipfs.pin)
v1.get('/get/:ipfs*?', ipfs.download)
v1.get('/resolve/:x/:y', ipfs.resolve)
v1.get('/ping', (req, res, next) => res.json({ message: 'pong' }))
v1.use(notFound)
v1.use(errorHandler)

app.use('/api/v1', v1);

const port = process.env.PORT || 3000
const server = app.listen(port, () => {
  if (process.env.NODE_ENV !== 'test') {
    Ethereum.connectBlockchain()
    DB.connect()
  }
  console.log(`Listening on port ${port}...`)
})

server.timeout = 1000 * 60 * 60 // 60 minutes
module.exports = server
