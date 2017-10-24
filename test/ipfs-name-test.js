const test = require('tape')
const IpfsName = require('../src/ipfs-name')

test('ctor', (t) => {
  const n = new IpfsName()
  t.ok(n)
  t.end()
})
