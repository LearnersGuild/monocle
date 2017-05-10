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


routes.use('/cycles', require('./cycles'))


module.exports = routes
