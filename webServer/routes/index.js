const express = require('express')
const routes = new express.Router

const game = require('../../game')
const idm = require('../../idm')

routes.get('/', (request, response, next) => {
  response.render('index', {title: 'Home'})
})


routes.get('/projects', (request, response, next) => {
  projectsTable()
    .then( projects => {
      response.render('projects', {
        title: 'Projects',
        projects,
      })
    })
    .catch(next)
})


const projectsTable = function(){
  return Promise.all([
    idm.users(),
    game.projectsForLatestCycle(),
  ])
    .then(([users, projects]) => {
      const usersById = {}
      users.forEach(user => { usersById[user.id] = user })
      console.log(users.length)
      console.log(...users.map(u => u.handle))

      // projects.map(p => p.playerIds).flatten()

      // console.log(users)
      return projects.map(project => {
        // console.log(project.playerIds)
        const row = {
          name: project.name,
          goalNumber: project.goal.number,
          goalLevel: project.goal.level,
          artifactURL: project.artifactURL,
        }
        row.players = project.playerIds.map(playerId =>
          usersById[playerId] || playerId
        )
        console.log(row)
        return row
      })
    })
}



module.exports = routes
