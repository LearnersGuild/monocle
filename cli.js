const idm = require('./idm')
const game = require('./game')

// const r = require('./rethinkdb')
// r
//   .table('projects')
//   .filter({active: true})

// game.getCycleId(13)

game.projectsForLatestCycle()
  .then(
    results => {
      console.log('results', results)
      process.exit()
    },
    error => {
      console.log('ERROR')
      console.error(error)
      process.exit(1)
    }
  )
