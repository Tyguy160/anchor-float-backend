require('dotenv').config();

const { Consumer } = require('sqs-consumer');

const { reportHandler } = require('./workers/report');

const {
  GENERATE_REPORT_QUEUE_URL,
  GOOGLE_APPLICATION_CREDENTIALS,
  REPORT_BUCKET_NAME,
  AWS_SECRET_ACCESS_KEY,
  AWS_ACCESS_KEY_ID,
  AWS_REGION,
} = process.env;

// // Validate that they all exist
Object.entries({
  GENERATE_REPORT_QUEUE_URL,
  GOOGLE_APPLICATION_CREDENTIALS,
  REPORT_BUCKET_NAME,
  AWS_SECRET_ACCESS_KEY,
  AWS_ACCESS_KEY_ID,
  AWS_REGION,
}).forEach(([varName, varValue]) => {
  if (!varValue) {
    console.error(`\nMissing required environment variable: ${varName}\n`); // eslint-disable-line no-console
    process.exit(1);
  }
});

try {
  const reportConsumer = Consumer.create({
    queueUrl: GENERATE_REPORT_QUEUE_URL,
    handleMessage: reportHandler,
  }).on('error', (err) => {
    console.error(err.message); // eslint-disable-line no-console
  });

  reportConsumer.start();
  console.info('Report consumer running...'); // eslint-disable-line no-console
} catch (e) {
  console.error(e); // eslint-disable-line no-console
  console.error('Error starting one of the workers. Exiting with code 1...'); // eslint-disable-line no-console

  process.exit(1);
}
