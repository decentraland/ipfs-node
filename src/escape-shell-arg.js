// Use greedy quotes to escape shell arguments.
//
// We are also relying on sanitize-name, so don't pass anything that hasn't been
// through sanitize-name.

module.exports = function escapeShellArg (arg) {
  return '"' + arg.toString().replace(/(["\s'$`\\])/g, '\\$1') + '"'
}
