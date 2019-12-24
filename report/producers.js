require('dotenv').config();
const Producer = require('sqs-producer');

const reportProducer = Producer.create({
  queueUrl: process.env.GENERATE_REPORT_QUEUE_URL,
  region: process.env.AWS_REGION,
});

module.exports = { reportProducer };
