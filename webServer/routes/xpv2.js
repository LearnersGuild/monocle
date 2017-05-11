const express = require('express')
const moment = require('moment')
const csvStringify = require('csv-stringify')
const game = require('../../game')
const idm = require('../../idm')

const routes = module.exports = new express.Router

const report = () =>
   Promise.all([
    idm.activeUsers(),
    game.players(),
  ])
    .then( ([players, users]) => {
      players.forEach(player => {
        const user = users.find(user => user.id === player.id)
        if (user) Object.assign(player, user)
      })
      players = players.filter(player =>
        player.stats &&
        player.roles.includes('player') &&
        !player.roles.includes('staff')
      )
      players.forEach( player => {
        player.stats.levelDelta = (
          typeof player.stats.level === 'number' && typeof player.stats.levelV2 === 'number'
            ? player.stats.levelV2 - player.stats.level
            : '?'
        )
      })
      players = players.sort( (a, b) => {
        if (a.stats.levelDelta === '?' && typeof b.stats.levelDelta === 'number') return -1
        if (b.stats.levelDelta === '?' && typeof a.stats.levelDelta === 'number') return 1
        if (b.stats.levelDelta === a.stats.levelDelta) return b.handle - a.handle
        return b.stats.levelDelta - a.stats.levelDelta
      })
      return players
    })
    .then(players =>
      players.map(player => (
        {
          startDate: moment(player.createdAt).format('YYYY-MM-DD'),
          handle: player.handle,
          level: 'level' in player.stats
            ? player.stats.level
            : '?',
          levelV2: 'levelV2' in player.stats
            ? player.stats.levelV2
            : '?',
          levelDelta: 'levelDelta' in player.stats
            ? player.stats.levelDelta
            : '?',
        }
      ))
    )


routes.get('', (request, response, next) => {
  report()
    .then( players => {
      response.render('xpv2', {players})
    })
    .catch(next)
})

routes.get('/csv', (request, response, next) => {
  report()
    .then( players => {

      const data = [
        [
          'Started At',
          'Player',
          'XP V1',
          'XP V2',
          'XP Delta'
        ]
      ]

      players.forEach(player => {
        data.push([
          player.startDate,
          player.handle,
          player.level,
          player.levelV2,
          player.levelDelta,
        ])
      })

      csvStringify(data, (error, csv) => {
        if (error) {
          response.status(500).send(`Error: ${error.message}`)
        }
        response.set('Content-Type', 'application/octet-stream');
        response.setHeader('Content-disposition', 'attachment; filename=xpv2-impact.csv');

        response.send(csv);
      })

    })
    .catch(next)
})
