const amqp = require('amqplib');
const { DELETE_QUEUE, DELETE_ROUTING_KEY, REPLICA_QUEUE, REPLICA_ROUTING_KEY } =  require('./options');
const { RABBITMQ_HOST, EXCHANGE_NAME } = process.env;

class RabbitMQ {
  constructor(server, exchangeName) {
    this.server = server;
    this.exchangeName = exchangeName;
    this.channel = null;
    this.connection = null;
  }

  async setup() {
    const conn = await amqp.connect(`amqp://${this.server}`);
    this.connection = conn;
    this.channel = await conn.createChannel();
    await this.channel.assertExchange(this.exchangeName, 'direct', { durable: true });
  }

  async assertQueue(queueName, routingKey) {
    await this.channel.assertQueue(queueName, { durable: true });
    await this.channel.bindQueue(queueName, this.exchangeName, routingKey);
  }

  async publish(routingKey, message) {
    this.channel.publish(this.exchangeName, routingKey, Buffer.from(message));
  }

  async consume(queueName, callback) {
    await this.channel.consume(queueName, callback);
  }

  ack(msg) {
    this.channel.ack(msg);
  }  

  async shutDown() {
    try {
      await this.channel.unbindQueue(REPLICA_QUEUE, this.exchangeName, REPLICA_ROUTING_KEY);
      await this.channel.unbindQueue(DELETE_QUEUE, this.exchangeName, DELETE_ROUTING_KEY);
      console.log('Queues unbinded');
      await this.channel.deleteQueue(REPLICA_QUEUE);
      console.log('REPLICA_QUEUE removed');
      await this.channel.deleteQueue(DELETE_QUEUE);
      console.log('DELETE_QUEUE removed');

      await this.channel.close();
      console.log('Channel closed');
      await this.connection.close();
      console.log('Connection closed');
    } catch (err) {
      console.error('Error during shutdown:', err);
    }
  }
}

module.exports = new RabbitMQ(RABBITMQ_HOST, EXCHANGE_NAME);
