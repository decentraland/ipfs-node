const test = require('tape')
const sanitize = require('../src/sanitize-name')

test('sanitize', (t) => {
  t.equal(sanitize('\'"\'\'\\'), '')
  t.equal(sanitize('ABC$D'), 'abcd')
  t.equal(sanitize('beep-boop-robots'), 'beep-boop-robots')
  t.equal(sanitize('\0'), '')
  t.equal(sanitize('🍑'), '')
  t.equal(sanitize(12345), '12345')
  t.equal(sanitize({}), 'objectobject')
  t.equal(sanitize('\'HAX\'\n\n\'HAX\'\r\r\n\n\'MAD HAX'), 'haxhaxmadhax')
  t.end()
})
