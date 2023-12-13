const { Queue, Worker } = require('bullmq');
const { BULL_QUEUE } = require('./options');
const { REDIS_HOST, REDIS_PORT } = process.env;

class CronManager {
  constructor(host, port) {
    if (!CronManager.instance) {
      CronManager.instance = this;
    }
    this.connection = { host, port };
    return CronManager.instance;
  }

  async setup() {
    this.queue = new Queue(BULL_QUEUE, { connection: this.connection });
  }

  async addJob(name, data, options) {
    return this.queue.add(name, data, options);
  }

  startWorker(callback){
    const worker = new Worker(BULL_QUEUE, callback, { connection:this.connection });
    return worker;
  }

  async removeJob(jobId){
    try {
      const job = await this.queue.getJob(jobId);
      await this.queue.removeRepeatableByKey(job.repeatJobKey);
      console.log(`Repeatable job '${jobId}' has been removed from the queue.`);
      return true;
    } catch (err) {
      console.error(`Error removing repeatable job '${jobId}':`, err);
      throw err;
    }
  }

  async shutdown(){
    await this.queue.drain();
    await this.queue.obliterate({ force: true });
    console.log('Cron queue removed!');
  }
}

module.exports = new CronManager(REDIS_HOST,REDIS_PORT);