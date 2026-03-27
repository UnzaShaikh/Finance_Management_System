const express = require('express');
const router = express.Router();
const { getUploads, deleteUpload } = require('../controllers/uploadController');
const auth = require('../middlewares/authMiddleware');

router.use(auth); // All upload history is protected

router.get('/', getUploads);
router.delete('/:id', deleteUpload);

module.exports = router;
