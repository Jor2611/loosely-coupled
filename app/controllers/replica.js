const { Replica } = require('../models');

/**
 * Lists all replicas.
 */
async function listReplicas(req, res) {
  try {
    const replicas = await Replica.findAll();
    res.status(200).json({ replicas });
  } catch (error) {
    console.error('Error listing tasks:', error);
    res.status(500).send('Error listing tasks');
  }
}

module.exports = { listReplicas };
