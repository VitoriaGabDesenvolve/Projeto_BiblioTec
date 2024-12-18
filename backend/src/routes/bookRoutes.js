const express = require('express')
const routerBook = express.Router();
const bookController = require('../controllers/bookControllers');

routerBook.get('/list', bookController.listBook);
routerBook.post('/add', bookController.addBook);


module.exports = routerBook