const express = require('express')
const routerUser = express.Router();
const userController = require('../controllers/userController');

routerUser.get('/list', userController.listUsers);
routerUser.post('/add', userController.addUser);
routerUser.post('/login', userController.AuthenticateUser);


module.exports = routerUser