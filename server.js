const express = require('express')
const ipfsDownload = require('./server/ipfs')
const bodyParser = require('body-parser')
const cors = require('cors')

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

app.listen(process.env.PORT || 3000, () => {
  console.log('Listening on port 3000...')
})
