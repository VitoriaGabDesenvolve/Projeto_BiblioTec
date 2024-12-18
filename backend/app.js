const express = require('express')
const cors = require('cors')
const routerUser = require('../backend/src/routes/userRoutes')
const routerBook = require('../backend/src/routes/bookRoutes')
const routerBookLoad = require('../backend/src/routes/bookLoadRoutes')


const app = express()

app.use(cors());
app.use(express.json());
app.use('/api/users', routerUser)
app.use('/api/book', routerBook)
app.use('/api/bookLoad', routerBookLoad)


app.listen(3030, ()=>{
    console.log("servidor iniciado na porta 3030")
})

module.exports = app;