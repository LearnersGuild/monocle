const r = require('./rethinkdb')({
  url: process.env.IDM_RETHINKDB_URL,
  cert: process.env.IDM_RETHINKDB_CERT,
})

const idm = {}

idm.users = () =>
  r
    .table('users')
    .limit(999999999)
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

module.exports = idm
