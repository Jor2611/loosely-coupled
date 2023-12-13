const express = require('express');
require('dotenv').config();
const { sequelize } = require('./config/db');
const MQ = require('./config/rabbitMQ');
const Cron = require('./config/cronManager');
require('./workers/taskWorker');
const Model = require('./models');
const gracefulShutdown = require('./utils/gracefulShutdown');
const consumeTask = require('./consumers/taskConsumer');
const removeCronConsumer = require('./consumers/removeCronConsumer');
const taskRouter = require('./routes/task');
const replicaRouter = require('./routes/replica');

const {
    GLOBAL_QUEUE, 
    REPLICA_QUEUE, 
    DELETE_QUEUE,
    GLOBAL_ROUTING_KEY, 
    REPLICA_ROUTING_KEY,
    DELETE_ROUTING_KEY
} = require('./config/options');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/task', taskRouter);
app.use('/api/replica', replicaRouter);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

async function initialize() {
    try {
        await sequelize.authenticate().then(() => console.log('Database connected.')).catch(err => console.log('Error: ' + err));
        await sequelize.sync();
        await Model.registerInstance();
        await MQ.setup();
        await MQ.assertQueue(GLOBAL_QUEUE, GLOBAL_ROUTING_KEY);
        await MQ.assertQueue(REPLICA_QUEUE, REPLICA_ROUTING_KEY);
        await MQ.assertQueue(DELETE_QUEUE, DELETE_ROUTING_KEY);
        await Cron.setup();
        consumeTask(GLOBAL_QUEUE);
        consumeTask(REPLICA_QUEUE);
        removeCronConsumer();
        app.listen(port, () => console.log(`Server running on port ${port}`));
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

initialize();

// Graceful shutdown
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
