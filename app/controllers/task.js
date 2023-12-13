const MQ = require('../config/rabbitMQ');
const cron = require('../config/cronManager');
const { GLOBAL_ROUTING_KEY } = require('../config/options');
const { sequelize, OptimisticLockError } = require('../config/db');
const { Task, Replica } = require('../models');

/**
 * Creates a new task.
 */
async function createTask(req, res) {
  const { name, duration, interval } = req.body;
  try {
    const task = await Task.create({ name, duration, interval });
    res.send(`Task created with ID: ${task.id}`);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).send('Error creating task');
  }
}

/**
 * Lists all tasks.
 */
async function listTasks(req, res) {
  try {
    const tasks = await Task.findAll();
    res.status(200).json({ tasks });
  } catch (error) {
    console.error('Error listing tasks:', error);
    res.status(500).send('Error listing tasks');
  }
}

/**
 * Runs a list of tasks.
 */
async function runTasks(req, res) {
  try {
    const { tasks } = req.body;

    const taskPromises = tasks.map(task => _processTasks(task));

    const results = await Promise.allSettled(taskPromises);

    const successes = results.filter(result => result.status === 'fulfilled');
    const failures = results.filter(result => result.status === 'rejected');

    console.log(`Successfully processed ${successes.length} tasks.`);
    failures.forEach(failure => console.error('Failed task:', failure.reason));

    res.status(200).send(`Tasks processed. Successes: ${successes.length}, Failures: ${failures.length}`);
  } catch (error) {
    console.error('Error running tasks:', error);
    res.status(500).send('Error running tasks');
  }
}

/**
 * Delete task
 */
async function deleteTask(req, res) {
  const transaction = await sequelize.transaction();
  const taskId = parseInt(req.params.taskId);

  try{
    const task = await Task.findByPk(taskId, { transaction });

    if(!task){
      return res.status(400).json({ msg: 'Task not found', success: false });
    }

    if(task.job_id){
      const oldReplica = await Replica.findByPk(task.assigned_to, { transaction });

      if(!oldReplica){
        throw new Error('Unable to fetch task\'s current replica!');
      }

      //Again, this must be configured as transactional message, put currently this is ok!
      MQ.publish(`${oldReplica.name}.del.key`, Buffer.from(task.job_id.toString()))
    }

    await task.destroy({ transaction });
    await transaction.commit();

    res.status(204).send({ msg: `Task ${task.id} removed` });
  }catch(err){
    await transaction.rollback();
    console.error('Error running tasks:', err);
    res.status(500).send('Error running tasks');
  }
}

/**
 * Internal function to process a task.
 */
async function _processTasks(taskObject, attempt = 1) {
  const transaction = await sequelize.transaction();
  
  try {
    const task = await Task.findByPk(taskObject.taskId, { transaction });
    let replica;

    if(!task){
      throw new Error('Task doesn\'t exist!');
    }

    if (task.status === 'active' || task.status === 'pending') {
      throw new Error('Task is on pending or in active state');
    }

    if(task.status === 'inactive'){
      
      const oldReplica = await Replica.findByPk(task.assigned_to, { transaction });

      if(!oldReplica){
        throw new Error('Unable to fetch task\'s current replica!');
      }
      console.log(`${task.id} is going to be removed from ${task.assigned_to}`)
      //This way solving requires transactional messaging configured
      //but currently this is fine.
      MQ.publish(`${oldReplica.name}.del.key`, Buffer.from(task.job_id.toString()))
    }

    if(taskObject.replicaId){
      replica = await Replica.findByPk(taskObject.replicaId, { transaction });
    }

    task.status = 'pending';
    await task.save();
    await transaction.commit();
    console.log(`${task.id} is going to be assigned`);
    const routingKey = replica ? `${replica.name}.key` : GLOBAL_ROUTING_KEY;
    MQ.publish(routingKey, Buffer.from(task.id.toString()));
  } catch (error) {
    console.log(`TASK ID: ${taskObject.taskId}!!!!!`);
    console.log('TASK RUN ERROR!!!!!!!!: ', error);
    if (!(error instanceof OptimisticLockError) || attempt >= 5) {
      await transaction.rollback();
      throw error
    }

    await processTaskWithRetry(taskObject, attempt + 1);
  }
}

module.exports = { createTask, listTasks, runTasks, deleteTask };