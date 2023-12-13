const MQ = require('../config/rabbitMQ');
const cron = require('../config/cronManager');
const { DELETE_QUEUE } = require('../config/options');

async function removeCron() {
  await MQ.consume(DELETE_QUEUE, async (msg) => {
    if (msg) {
      const jobId = msg.content.toString();
      try {
        await cron.removeJob(jobId);
        MQ.ack(msg);
      } catch (error) {
        //Currently there is no DLQ configured so we just ack message!
        MQ.ack(msg);
        throw error;
      }
    }
  });
}

module.exports = removeCron;
