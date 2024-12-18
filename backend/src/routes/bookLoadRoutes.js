const express = require('express')
const routerBookLoad = express.Router();
const BookLoadController = require("../controllers/BookLoadController")

routerBookLoad.get("/list", BookLoadController.listBookLoad)
routerBookLoad.post("/add", BookLoadController.addBookLoad)
routerBookLoad.post("/verificar", BookLoadController.verificarAtrasos)
routerBookLoad.post("/returnBookLoad", BookLoadController.returnBookLoad)

module.exports = routerBookLoad;