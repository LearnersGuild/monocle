require('./env')

const url = require('url')
const rethinkdbdash = require('rethinkdbdash')

const dbUrl = process.env.RETHINKDB_URL
const dbCert = process.env.RETHINKDB_CERT
console.log('dbCert', dbCert)
const { hostname, port, pathname, auth } = url.parse(dbUrl)

module.exports = rethinkdbdash({
  servers: [{
    host: hostname,
    port: parseInt(port, 10),
    db: pathname ? pathname.slice(1) : undefined,
    authKey: auth ? auth.split(':')[1] : undefined,
    ssl: dbCert ? {ca: dbCert} : undefined,
  }],
  silent: true,
  max: 100,
  buffer: 10,
})
