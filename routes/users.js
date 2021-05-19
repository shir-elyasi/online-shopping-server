const express = require('express');
const router = express.Router();
const usersController = require('../controllers/UsersController');
const checkAuth = require("../middleware/check-auth")



router.post('/signup', usersController.signup);

router.post('/login', usersController.login);

router.post('/loginGoogle', usersController.loginGoogle);

router.get('/', usersController.findAll);

router.get('/:id', usersController.findOne);

router.patch('/details/:id', checkAuth, usersController.update);

router.patch('/updatePassword/:id', usersController.updatePassword);

// router.delete('/:id', employeesController.delete);

module.exports = router;