const { ID } = process.env;

module.exports = {
  EXCHANGE_NAME : 'task_exchange',
  GLOBAL_QUEUE : 'global_tasks',
  REPLICA_QUEUE : `replica-${ID}-tasks`,
  DELETE_QUEUE: `replica-${ID}-del-task`,
  GLOBAL_ROUTING_KEY : 'global',
  REPLICA_ROUTING_KEY : `${ID}.key`,
  DELETE_ROUTING_KEY: `${ID}.del.key`,
  BULL_QUEUE: `Queue-${ID}`
}