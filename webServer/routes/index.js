const express = require('express')
const routes = new express.Router
const game = require('../../game')
const idm = require('../../idm')

routes.get('/', (request, response, next) => {
  response.render('index', {title: 'Home'})
})

routes.get('/players', (request, response, next) => {
  idm.activeUsers()
    .then(players => {
      response.render('players', {players})
    })
    .catch(next)
})

routes.get('/missing-artifacts', (request, response, next) => {
  game.projectsMissingArtifacts()
    .then(projects => {
      response.render('missing-artifacts', {projects})
    })
    .catch(next)
})

routes.use('/cycles', require('./cycles'))
routes.use('/xpv2', require('./xpv2'))
routes.use('/projects', require('./projects'))

module.exports = routes
