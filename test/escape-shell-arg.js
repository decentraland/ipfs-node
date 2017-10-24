const test = require('tape')
const esc = require('../src/escape-shell-arg')

test('sanitize', (t) => {
  t.equal(esc('\'boop'), '"\\\'boop"')
  t.equal(esc('$'), '"\\$"')
  t.end()
})
