const axios = require('axios')
const createError = require('http-errors')

async function checkIPFS (ipfs) {
  if (process.env.BLACKLIST_URL) {
    const res = await axios.get(`${process.env.BLACKLIST_URL}/blacklist/${ipfs}`)
    const { blacklisted } = res.data
    if (blacklisted) {
      throw createError(403, `IPFS ${ipfs} is blacklisted`)
    }
  }
}

async function checkParcel (x, y) {
  if (process.env.BLACKLIST_URL) {
    const res = await axios.get(`${process.env.BLACKLIST_URL}/blacklist/${x}/${y}`)
    const { blacklisted } = res.data
    if (blacklisted) {
      throw createError(403, `Parcel (${x},${y}) is blacklisted`)
    }
  }
}

module.exports = {
  checkIPFS,
  checkParcel
}
