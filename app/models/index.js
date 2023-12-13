const Replica = require('./Replica');
const Task = require('./Task');

Replica.hasMany(Task, { foreignKey: 'assigned_to', onDelete: 'CASCADE' });
Task.belongsTo(Replica, { foreignKey: 'assigned_to' });

async function registerInstance() {
  try {
    const replica = await Replica.create({ name: process.env.ID });
    console.log('Replica registered:', replica.name);
  } catch (error) {
    console.error('Error registering replica:', error);
  }
}

async function cleanUp() {
  try {
    const replica = await Replica.findOne({ where: { name: process.env.ID } });
    if (replica) {
      await replica.destroy(); 
      console.log('Replica and associated tasks removed from the database.');
    }
  } catch (error) {
    console.error('Error during replica removal:', error);
  }
}

module.exports = { Replica, Task, cleanUp, registerInstance };