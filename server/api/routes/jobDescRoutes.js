const express = require('express');
const router = express.Router();
const jobDescController = require('../controllers/jobDesccontroller');

router.post('/', jobDescController.postJobDesc);

module.exports = router;