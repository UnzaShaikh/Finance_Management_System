const express = require('express');
const router = express.Router();
const { CATEGORIES } = require('../constants/categories');

// @route   GET /api/categories
router.get('/', (req, res) => {
  res.json(CATEGORIES);
});

module.exports = router;
