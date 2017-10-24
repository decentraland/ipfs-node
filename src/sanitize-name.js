// Name can only be lower case a-z 0-9 and hyphen, so we can safely pass it into exec
module.exports = function sanitize (paramName) {
  return paramName.toString().toLowerCase().replace(/[^a-z0-9-]/g, '')
}
