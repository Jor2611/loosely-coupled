const MQ = require('../config/rabbitMQ');
const { sequelize } = require('../config/db');
const { Task, Replica } = require('../models');
const cron = require('../config/cronManager');

async function consumeTask(queueName) {
  await MQ.consume(queueName, async (msg) => {
    if (msg) {
      const taskId = msg.content.toString();
      try {
        const task = await Task.findByPk(taskId);
        const replica = await Replica.findOne({ where: { name: process.env.ID } });

        if (!task) {
          throw new Error('Task doesn\'t exist!');
        }

        if (task.status !== 'pending') {
          throw new Error('Task is not pending!');
        }

        if (task && replica) {
          await cron.addJob(task.name, 
            { taskId: task.id, replicaId: replica.id, duration: task.duration }, 
            { repeat: { every: task.interval } });
        }

        MQ.ack(msg);
      } catch (error) {
        //Currently there is no DLQ configured so we just ack message!
        MQ.ack(msg);
        throw error;
      }
    }
  });
}

module.exports = consumeTask;
