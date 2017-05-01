const game = require('./game')

// const r = require('./rethinkdb')
// r
//   .table('projects')
//   .filter({active: true})
game.getCycleId(13)
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
