const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const ipfsDownload = require('./ipfs-upload')
const ipfsName = require('./ipfs-name')
const ipfsData = require('./ipfs-data')

const app = express()

// Allow other domains to connect, todo, limit to DCL domains
app.use(cors())

// Parse the huge uploads we may get, still 100mb limit
// though since the VM may run out of memory
app.use(bodyParser.json({ limit: '100mb' }))

// IPFS Handler
app.post('/api/ipfs', (req, res) => {
  ipfsDownload(req, res)
})

const names = new ipfsName()
app.post('/api/name/:name/:content', names.publish)
app.get('/api/name/:name', names.resolve)

const data = new ipfsData()
app.get('/api/data/:name', data.resolve)

app.listen(process.env.PORT || 3000, () => {
  console.log('Listening on port 3000...')
})
