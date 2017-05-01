const r = require('./rethinkdb')({
  url: process.env.GAME_RETHINKDB_URL,
  cert: process.env.GAME_RETHINKDB_CERT,
})

const game = {}

game.getOaklandChapterId = () =>
  r
    .table('chapters')
    .filter({'channelName': 'oakland'})
    .nth(0)('id')

game.cycles = () =>
  r
    .table('cycles')
    .filter({
      chapterId: game.getOaklandChapterId()
    })
    .pluck('id', 'cycleNumber')
    .orderBy('cycleNumber')

game.cycleNumberToCycleId = cycleNumber =>
  game.cycles()
    .filter({cycleNumber})
    .nth(0)('id')

game.latestCycleNumber = () =>
  game.cycles()
    .nth(-1)('cycleNumber')

game.projects = () =>
  r.table('projects')

game.projectsForCycle = cycleNumber =>
  game.projects()
    .filter({
      cycleId: game.cycleNumberToCycleId(cycleNumber)
    })

game.projectsForLatestCycle = () =>
  game.projectsForCycle(game.latestCycleNumber())


module.exports = game
