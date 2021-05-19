const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const checkAuth = require("../middleware/check-auth")


router.get('/', orderController.findAll);

router.get('/:id', orderController.findOne);

router.post('/',checkAuth, orderController.create);

router.patch('/:id', orderController.update);

router.delete('/:id', orderController.delete);


router.get('/user/:userId', orderController.findUserOrders);

module.exports = router;