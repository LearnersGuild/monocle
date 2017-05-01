const r = require('./rethinkdb')

r
  .table('projects')
  .then(
    users => {
      console.log('users', users)
      process.exit()
    },
    error => {
      console.log('ERROR')
      console.error(error)
      process.exit(1)
    }
  )
