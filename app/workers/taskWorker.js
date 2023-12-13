const Cron = require('../config/cronManager');
const { sequelize } = require('../config/db');
const { Task } = require('../models');

const TaskWorker = Cron.startWorker(async (job) => {
  const { duration, taskId, replicaId } = job.data;
  
  try {
    const isAssigned = await assignJobToTask(taskId, replicaId, job.id);
    
    if (isAssigned) {
      console.log(`Processing job ${taskId}`);
      await delayedJob(taskId, duration);
    }
  } catch (err) {
    console.error('Error processing job:', err);
  }
});

async function assignJobToTask(taskId, replicaId, jobId) {
  const transaction = await sequelize.transaction();
  try {
    const task = await Task.findByPk(taskId, { transaction });
    if (!task) {
      await transaction.rollback();
      await Cron.removeJob(jobId);
      return false;
    }
    task.status = 'active';
    task.assigned_to = replicaId;
    task.job_id = jobId;
    await task.save({ transaction });
    await transaction.commit();
    console.log('Job assigned to task');
    return true;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function delayedJob(taskId, duration) {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const marked = await markTaskAsInactive(taskId);
        if (!marked) {
          console.log(`Task ${taskId} is already inactive or removed.`);
          return resolve();
        }
        console.log(`Task ${taskId} finished!`);
        resolve();
      } catch (err) {
        console.error('Error finishing task:', err);
        reject(err);
      }
    }, duration);
  });
}

async function markTaskAsInactive(taskId) {
  const transaction = await sequelize.transaction();
  try {
    const task = await Task.findByPk(taskId, { transaction });
    if (!task) {
      console.log('Task removed when job was active');
      await transaction.rollback();
      return false;
    }
    task.status = 'inactive';
    await task.save({ transaction });
    await transaction.commit();
    return true;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

module.exports = TaskWorker;
