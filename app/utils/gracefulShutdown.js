const Model = require('../models');
const MQ = require('../config/rabbitMQ');
const Cron = require('../config/cronManager');
const TaskWorker = require('../workers/taskWorker');

async function gracefulShutdown() {
  try {
    console.log('Shutting down gracefully...');

    await MQ.shutDown();
    console.log('Message Queue shut down.');
  
    await TaskWorker.close();
    console.log('Task Worker closed.');
  
    await Cron.shutdown();
    console.log('Cron shutdown.');
  
    await Model.cleanUp();
    console.log('Model cleanup complete.');

  } catch (error) {
    console.error('Error during shutdown:', error);
  } finally {
    process.exit(0);
  }
}

module.exports = gracefulShutdown;