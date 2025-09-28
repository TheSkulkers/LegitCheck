const express = require('express');
const router = express.Router();
const multer = require('multer');
const jobDescController = require('../controllers/jobDesccontroller');

const upload = multer({ storage: multer.memoryStorage() });
router.post('/', jobDescController.postJobDesc);
router.post('/upload', upload.single('analysisFile'), jobDescController.analyzeFile);

module.exports = router;