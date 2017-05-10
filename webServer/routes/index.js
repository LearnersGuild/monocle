const csvStringify = require('csv-stringify')
const express = require('express')
const routes = new express.Router

const game = require('../../game')
const idm = require('../../idm')

routes.get('/', (request, response, next) => {
  response.render('index', {title: 'Home'})
})

routes.get('/missing-artifacts', (request, response, next) => {
  game.projectsMissingArtifacts()
    .then(projects => {
      response.render('missing-artifacts', {projects})
    })
    .catch(next)
})



routes.get('/cycles', (request, response, next) => {
  game.cycles()
    .then(cycles => {
      response.render('cycles/index', {cycles})
    })
    .catch(next)
})

routes.get('/cycles/current', (request, response, next) => {
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

routes.get('/cycles/:cycleNumber/projects.csv', (request, response, next) => {
  projectsTable(request.cycleNumber)
    .then( projects => {
      const headers = [
        'Project Name',
        'Goal Title',
        'Goal Number',
        'Goal URL',
        'Players',
        'Artifact URL',
        'Coach',
      ]
      const data = [headers]
      projects.forEach(project => {
        data.push([
          project.name,
          project.goalTitle,
          project.goalNumber,
          project.goalURL,
          project.players.map(p => p.handle).join(', '),
          project.artifactURL,
          project.coachHandle,
        ])
      })
      csvStringify(data, (error, csv) => {
        if (error) {
          response.status(500).send(`Error: ${error.message}`)
        }
        response.set('Content-Type', 'application/octet-stream');
        response.send(csv);
      })
    })
    .catch(next)
})

routes.get('/cycles/:cycleNumber/missing-artifacts', (request, response, next) => {
  projectsTable(request.cycleNumber)
    .then( projects => {
      projects = projects.filter(project => !project.artifactURL)

      const players = []
      projects.forEach(project => {
        project.players.forEach(player => {
          players.push(player)
        })
      })

      response.render('cycles/projects/missing-artifacts', {
        title: 'Projects With Missing Artifacts',
        cycleNumber: request.cycleNumber,
        projects,
        players,
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
        const coach = users[project.coachId] || {}
        const row = {
          name: project.name,
          goalTitle: project.goal.title,
          goalNumber: project.goal.number,
          goalLevel: project.goal.level,
          artifactURL: project.artifactURL,
          coachHandle: coach.handle,
          goalURL: `https://jsdev.learnersguild.org/goals/${project.goal.number}`,
        }
        row.players = project.playerIds.map(playerId =>
          users[playerId] || playerId
        )
        return row
      })
    })
}



module.exports = routes
