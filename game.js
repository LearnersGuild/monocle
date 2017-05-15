const moment = require('moment')
const idm = require('./idm')
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
      projects.forEach(project => {
        project.cycleNumber = cycles[project.cycleId]
      })
      return projects.filter(project =>
        project.cycleNumber >= 35
      ).sort((a,b) => b.cycleNumber - a.cycleNumber)
    })


game.projectsByGoalNumber = (goalNumber, projects) => {
  if (projects) {
    return Promise.resolve(
      projects.filter(
        project => project.goal.number === goalNumber)
    )
  }
  return game.projects()
    .then(projects =>
          projects.filter(
            project => project.goal.number === goalNumber)
         )
}

game.players = () =>
  Promise.all([
    r.table('players'),
    idm.users(),
  ])
  .then(([players, users]) => {
    players.forEach(player => {
      const user = users.find(user => user.id === player.id)
      if (user) Object.assign(player, user)
    })
    return players
  })


game.goals = () =>
  game.projects()
    // .limit(100)
    .then(projects => {

      const goals = {}
      projects.forEach(project => {
        const goal = project.goal
        delete project.goal
        if (!(goal.number in goals)){
          goals[goal.number] = {
            number: goal.number,
            title: goal.title,
            url: goal.url,
            projects: [],
          }
        }
        goals[goal.number].projects.push({
          cycleId: project.cycleId,
          playerIds: project.playerIds,
          name: project.name,
          createdAt: project.createdAt,
        })
      })

      Object.keys(goals).forEach(goalNumber => {
        const goal = goals[goalNumber]
        goal.playerIds = []
        goal.projects.forEach(project => {
          project.playerIds.forEach(playerId => {
            goal.playerIds.includes(playerId) ||
              goal.playerIds.push(playerId)
          })
        })
        delete goal.projects
      })

      return Object.keys(goals).map(number => goals[number])
    })

game.goalUsage = () =>
  Promise.all([
    game.players(),
    game.goals(),
  ])
    .then(([players, goals]) => {

      // remove pre-september cohort players
      players = players.filter(player =>
        // moment(player.createdAt).isAfter('2016-09-01')
        moment(player.createdAt).isAfter(moment().subtract(21, 'weeks'))
      )

      const playerIds = players.map(player => player.id)

      // remove all playerIDs for players before september cohort
      goals.forEach(goal => {
        goal.playerIds = goal.playerIds.filter(playerId => playerIds.includes(playerId))
        goal.playerHandles = goal.playerIds.map(playerId =>
          players.find(player => player.id === playerId).handle
        ).sort()
        goal.numberOfPlayers = goal.playerIds.length
      })

      goals = goals.filter(goal => goal.numberOfPlayers > 0)

      goals = goals.sort((a,b) => b.numberOfPlayers - a.numberOfPlayers)

      return goals
    })

module.exports = game
