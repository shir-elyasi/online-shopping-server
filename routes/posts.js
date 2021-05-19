const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const checkAuth = require("../middleware/check-auth")


router.get('/', postController.findAll);

router.post('/', postController.create);

router.get('/:postId', postController.findOne);

router.patch('/:postId', postController.update);

router.delete('/:postId', postController.delete);


// router.get('/:postId/:commentId', postController.findOne);

router.post('/:postId', postController.createComment);

router.patch('/:postId/:commentId', postController.updateComment);

router.delete('/:postId/:commentId', postController.deleteComment);



module.exports = router;