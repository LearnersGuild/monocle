const express = require('express')
const routes = new express.Router

const game = require('../../game')
const idm = require('../../idm')

routes.get('/', (request, response, next) => {
  response.render('index', {title: 'Home'})
})


routes.get('/cycles', (request, response, next) => {
  game.cycles()
    .then(cycles => {
      response.render('cycles/index', {cycles})
    })
    .catch(next)
})

routes.get('/cycles/latest', (request, response, next) => {
  game.latestCycleNumber()
    .then(latestCycleNumber => {
      response.redirect(`/cycles/${latestCycleNumber}`)
    })
    .catch(next)
})

routes.use('/cycles/:cycleNumber', (request, response, next) => {
  request.cycleNumber = Number(request.params.cycleNumber)
  next()
})

routes.get('/cycles/:cycleNumber', (request, response, next) => {
  response.render('cycles/show', {
    title: 'Projects',
    cycleNumber: request.cycleNumber,
  })
})

routes.get('/cycles/:cycleNumber/projects', (request, response, next) => {
  projectsTable(request.cycleNumber)
    .then( projects => {
      response.render('cycles/projects/index', {
        title: 'Projects',
        cycleNumber: request.cycleNumber,
        projects,
      })
    })
    .catch(next)
})

const usersById = () =>
  idm.users().then(users => {
    const usersById = {}
    users.forEach(user => { usersById[user.id] = user })
    return usersById
  })

const projectsTable = function(cycleNumber){
  return Promise.all([
    usersById(),
    game.projectsForCycle(cycleNumber),
  ])
    .then(([users, projects]) => {
      return projects.map(project => {
        const row = {
          name: project.name,
          goalNumber: project.goal.number,
          goalLevel: project.goal.level,
          artifactURL: project.artifactURL,
        }
        row.players = project.playerIds.map(playerId =>
          users[playerId] || playerId
        )
        console.log(row)
        return row
      })
    })
}



module.exports = routes
