const r = require('./rethinkdb')({
  url: process.env.IDM_RETHINKDB_URL,
  cert: process.env.IDM_RETHINKDB_CERT,
})

const idm = {}

idm.users = () =>
  r
    .table('users')

module.exports = idm
