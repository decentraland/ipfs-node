const fs = require('fs')
const path = require('path')
const morgan = require('morgan')
const createError = require('http-errors')

function formatDate (date) {
  const monthNames = [
    'January', 'February', 'March',
    'April', 'May', 'June', 'July',
    'August', 'September', 'October',
    'November', 'December'
  ]

  const day = date.getDate()
  const monthIndex = date.getMonth()
  const year = date.getFullYear()

  return day + '' + monthNames[monthIndex] + '' + year
}

module.exports = {
  setLogger: (app) => {
    let dir = './logs'
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }
    const accessLogStream = fs.createWriteStream(path.join(__dirname, `../logs/${formatDate(new Date())}.log`), {flags: 'a'})
    app.use(morgan('combined', {stream: accessLogStream}))
  },
  errorHandler: (err, req, res, next) => {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    res
    .status(err.statusCode)
    .json({ error: err.message })
  },
  notFound: (req, res, next) => {
    if (!req.route) {
      next(createError(404, `${req.originalUrl} not found`))
    }
    next()
  }
}
