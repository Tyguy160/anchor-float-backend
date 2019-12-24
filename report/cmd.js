require('dotenv').config();
const uuid = require('uuid/v4');
const { reportProducer } = require('./producers.js');

const hostnameInput = process.argv.slice(2, 3)[0];
const userId = 'test';

console.log(`Generating a report for: ${hostnameInput}`);

const taskId = uuid();

reportProducer.send(
  [
    {
      id: taskId,
      body: JSON.stringify({ hostname: hostnameInput, userId, taskId }),
    },
  ],
  (err) => {
    if (err) console.log(err);
  },
);
