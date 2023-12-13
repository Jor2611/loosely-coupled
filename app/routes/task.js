const express = require('express');
const { createTask, listTasks, runTasks, deleteTask } = require('../controllers/task');
const router = express.Router();

router.get('/',listTasks);
router.post('/', createTask);
router.post('/run', runTasks);
router.delete('/:taskId', deleteTask);

module.exports = router;