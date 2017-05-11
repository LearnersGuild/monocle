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

game.cyclesMap = () =>
  game.cycles()
    .then(cycles => {
      const map = {}
      cycles.forEach(cycle => {
        map[cycle.id] = cycle.cycleNumber
        map[cycle.cycleNumber] = cycle.id
      })
      return map
    })

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

game.projectsMissingArtifacts = () =>
  Promise.all([
    game.cyclesMap(),
    game.projects()
      .filter(
        r.row.hasFields('artifactURL').not()
      )
  ])
    .then(([cycles, projects]) => {
      console.log(cycles)
      projects.forEach(project => {
        project.cycleNumber = cycles[project.cycleId]
      })
      return projects.filter(project =>
        project.cycleNumber >= 35
      ).sort((a,b) => b.cycleNumber - a.cycleNumber)
    })


game.players = () =>
  r.table('players')

module.exports = game
