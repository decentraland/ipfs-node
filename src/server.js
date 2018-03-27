const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const IPFS = require('./ipfs')
const { setLogger, errorHandler, notFound } = require('./utils')
const { connectBlockchain } = require('./ethereum')

const app = express()

app.use(cors())

// Parse the huge uploads we may get, still 100mb limit
// though since the VM may run out of memory
app.use(bodyParser.json({ limit: '10kb' }))

setLogger(app)

// IPFS Handler
const ipfs = new IPFS()

app.post('/api/pin/:peerId/:x/:y', ipfs.pin)

app.get('/api/get/:ipfs*?', ipfs.download)

app.get('/api/resolve/:x/:y', ipfs.resolve)

app.use(notFound)

app.use(errorHandler)

const port = process.env.PORT || 3000
app.listen(port, () => {
  connectBlockchain()
  console.log(`Listening on port ${port}...`)
})
