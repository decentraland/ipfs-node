const test = require('tape')
const sanitize = require('../src/sanitize-name')

test('sanitize', (t) => {
  t.equal(sanitize('\'"\'\'\\'), '')
  t.equal(sanitize('ABC$D'), 'abcd')
  t.equal(sanitize('beep-boop-robots'), 'beep-boop-robots')
  t.end()
})
