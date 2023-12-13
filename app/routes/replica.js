const express = require('express');
const { listReplicas } = require('../controllers/replica');
const router = express.Router();

router.get('/',listReplicas);

module.exports = router;