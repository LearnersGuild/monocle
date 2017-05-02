require('../env')
const express = require('express')
const webServer = express()

webServer.set('views', __dirname+'/views')
webServer.set('view engine', 'pug')

webServer.use(express.static(__dirname+'/public'))
webServer.use(require('./routes'))

webServer.listen(process.env.PORT, () => {
  console.log(`http://localhost:${process.env.PORT}`)
})
