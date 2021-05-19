const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const multer = require('multer');
const checkAuth = require("../middleware/check-auth")

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/product_images');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype == 'image/jpeg' || file.mimetype == 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}
const upload = multer({ storage: storage, fileFilter: fileFilter });


router.get('/', productController.findAll);

router.get('/:id', productController.findOne);

router.post('/', checkAuth, upload.array('product_images'), productController.create);

router.patch('/:id', checkAuth, upload.array('product_images'), productController.update);

router.delete('/:id', checkAuth, productController.delete);

module.exports = router;