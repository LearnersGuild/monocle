require('./env')
const URL = require('url')
const rethinkdbdash = require('rethinkdbdash')

module.exports = function({url, cert}){
  const { hostname, port, pathname, auth } = URL.parse(url)
  return rethinkdbdash({
    servers: [{
      host: hostname,
      port: parseInt(port, 10),
      db: pathname ? pathname.slice(1) : undefined,
      authKey: auth ? auth.split(':')[1] : undefined,
      ssl: cert ? {ca: cert} : undefined,
    }],
    silent: true,
    max: 100,
    buffer: 10,
  })
}
