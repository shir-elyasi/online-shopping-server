const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');


router.get('/', couponController.findAll);

router.get('/:id', couponController.findOne);

router.post('/', couponController.create);

router.delete('/:id', couponController.delete);

module.exports = router;