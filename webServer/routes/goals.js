const express = require('express')
const game = require('../../game')
const idm = require('../../idm')

const routes = module.exports = new express.Router

routes.get('/', (request, response, next) => {
  response.render('goals/index')
})


routes.get('/usage', (request, response, next) => {
  game.goalUsage()
    .then(goalUsage => {
      response.render('goals/usage', {
        goalUsage,
        wtf: require('util').inspect(goalUsage),
      })
    })
    .catch(next)
})
