const express = require('express')
const game = require('../../game')
const idm = require('../../idm')
const csvStringify = require('csv-stringify');

const routes = module.exports = new express.Router

routes.get('', (request, response, next) => {
  game.cycles()
    .then(cycles => {
      response.render('cycles/index', {cycles})
    })
    .catch(next)
})

routes.get('/current', (request, response, next) => {
  game.latestCycleNumber()
    .then(latestCycleNumber => {
      response.redirect(`/cycles/${latestCycleNumber}`)
    })
    .catch(next)
})

routes.use('/:cycleNumber', (request, response, next) => {
  request.cycleNumber = Number(request.params.cycleNumber)
  next()
})

routes.get('/:cycleNumber', (request, response, next) => {
  response.render('cycles/show', {
    title: 'Projects',
    cycleNumber: request.cycleNumber,
  })
})

routes.get('/:cycleNumber/projects', (request, response, next) => {
  projectsTable(request.cycleNumber)
    .then( projects => {
      projects.sort((a,b) =>
        a.goalNumber - b.goalNumber
      )
      response.render('cycles/projects', {
        title: 'Projects',
        cycleNumber: request.cycleNumber,
        projects,
      })
    })
    .catch(next)
})

routes.get('/:cycleNumber/projects.csv', (request, response, next) => {
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

routes.get('/:cycleNumber/players', (request, response, next) => {
  playersTable(request.cycleNumber)
    .then( players => {
      response.render('cycles/players', {
        title: 'Projects',
        cycleNumber: request.cycleNumber,
        players,
      })
    })
    .catch(next)
})

routes.get('/:cycleNumber/goals', (request, response, next) => {
  game.projectsForCycle(request.cycleNumber)
    .then(projects => {
      let goals = {}
      projects.forEach(project => {
        const goalNumber = project.goal.number
        const goal = (goals[goalNumber]) || (goals[goalNumber] = project.goal)
        goal.projects = goal.projects || []
        goal.projects.push(project)
      })

      goals = Object.keys(goals).map(goalNumber => goals[goalNumber])

      goals.forEach(goal => {
        goal.playerIds = []
        goal.projects.forEach(project => {
          project.playerIds.forEach(playerId => {
            goal.playerIds.includes(playerId) || goal.playerIds.push(playerId)
          })
        })
        goal.numberOfPlayers = goal.playerIds.length
      })
      return goals.sort((a,b) => b.numberOfPlayers - a.numberOfPlayers)
    })
    .then(goals => {
      response.render('cycles/goals', {
        goals,
      })
    })
    .catch(next)
})

routes.get('/:cycleNumber/missing-artifacts', (request, response, next) => {
  projectsTable(request.cycleNumber)
    .then( projects => {
      projects = projects.filter(project => !project.artifactURL)

      const players = []
      projects.forEach(project => {
        project.players.forEach(player => {
          players.push(player)
        })
      })

      response.render('cycles/missing-artifacts', {
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

const playersTable = function(cycleNumber){
  return projectsTable(cycleNumber)
    .then((projects) => {
      const players = []
      projects.forEach(project => {
        project.players.forEach(player => {
          player.project = project
          players.push(player)
        })
      })
      return players
    })
}
