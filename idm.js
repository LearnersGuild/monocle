const r = require('./rethinkdb')({
  url: process.env.IDM_RETHINKDB_URL,
  cert: process.env.IDM_RETHINKDB_CERT,
})

const idm = {}

idm.users = () =>
  r
    .table('users')
    .pluck(
      'active',
      'email',
      'handle',
      'id',
      'name',
      'phone',
      'roles',
      'createdAt',
      'updatedAt'
    )

idm.activeUsers = () =>
  idm.users()
    .filter({active: true})

module.exports = idm
