const r = require('./rethinkdb')

const game = () => r.db('game_development')

game.getOaklandChapterId = () =>
  game()
    .table('chapters')
    .filter({'channelName': 'oakland'})
    .nth(0)('id')

game.getCycles = () =>
  game()
    .table('cycles')
    .filter({
      chapterId: game.getOaklandChapterId()
    })
    .pluck('id', 'cycleNumber')
    .orderBy('cycleNumber')

game.getCycleId = cycleNumber =>
  game.getCycles()
    .filter({cycleNumber})
    .nth(0)


module.exports = game
