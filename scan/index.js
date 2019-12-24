require('dotenv').config();

const { Consumer } = require('sqs-consumer');
const { parseSitemapHandler } = require('./workers/sitemap');
const { parsePageHandler } = require('./workers/page');
const {
  createAndConnectProductHandler,
} = require('./workers/createAndConnectProduct');
const { parseProductHandler } = require('./workers/product');
const { parseVariationsHandler } = require('./workers/variations');
const { parseShortlinkHandler } = require('./workers/shortlink');

const {
  PARSE_PAGE_QUEUE_URL,
  CREATE_CONNECT_PRODUCT_QUEUE_URL,
  PARSE_PRODUCT_QUEUE_URL,
  PARSE_VARIATIONS_QUEUE_URL,
  PARSE_SITEMAP_QUEUE_URL,
  PARSE_SHORTLINK_QUEUE_URL,
  AWS_SECRET_ACCESS_KEY,
  AWS_ACCESS_KEY_ID,
  AWS_REGION,
  AMAZON_ASSOCIATES_PARTNER_TAG,
  AMAZON_ASSOCIATES_PARTNER_TYPE,
  AMAZON_ASSOCIATES_ITEM_CONDITION,
  AMAZON_ASSOCIATES_ACCESS_KEY,
  AMAZON_ASSOCIATES_SECRET_KEY,
  AMAZON_ASSOCIATES_HOST,
  AMAZON_ASSOCIATES_REGION,
} = process.env;

// Validate that they all exist
Object.entries({
  PARSE_PAGE_QUEUE_URL,
  CREATE_CONNECT_PRODUCT_QUEUE_URL,
  PARSE_PRODUCT_QUEUE_URL,
  PARSE_VARIATIONS_QUEUE_URL,
  PARSE_SITEMAP_QUEUE_URL,
  PARSE_SHORTLINK_QUEUE_URL,
  AWS_SECRET_ACCESS_KEY,
  AWS_ACCESS_KEY_ID,
  AWS_REGION,
  AMAZON_ASSOCIATES_PARTNER_TAG,
  AMAZON_ASSOCIATES_PARTNER_TYPE,
  AMAZON_ASSOCIATES_ITEM_CONDITION,
  AMAZON_ASSOCIATES_ACCESS_KEY,
  AMAZON_ASSOCIATES_SECRET_KEY,
  AMAZON_ASSOCIATES_HOST,
  AMAZON_ASSOCIATES_REGION,
}).forEach(([varName, varValue]) => {
  if (!varValue) {
    // value is undefined
    console.error(`\nMissing required environment variable: ${varName}\n`); // eslint-disable-line no-console
    process.exit(1);
  }
});

try {
  const parseSitemapConsumer = Consumer.create({
    queueUrl: PARSE_SITEMAP_QUEUE_URL,
    handleMessage: parseSitemapHandler,
  }).on('error', err => {
    console.error(err.message); // eslint-disable-line no-console
  });

  const parsePageConsumer = Consumer.create({
    queueUrl: PARSE_PAGE_QUEUE_URL,
    handleMessage: parsePageHandler,
  }).on('error', err => {
    console.error(err.message); // eslint-disable-line no-console
  });

  const createAndConnectProductConsumer = Consumer.create({
    queueUrl: CREATE_CONNECT_PRODUCT_QUEUE_URL,
    handleMessage: createAndConnectProductHandler,
  }).on('error', err => {
    console.error(err.message); // eslint-disable-line no-console
  });

  const parseProductConsumer = Consumer.create({
    queueUrl: PARSE_PRODUCT_QUEUE_URL,
    handleMessageBatch: parseProductHandler,
    batchSize: 10,
    pollingWaitTimeMs: 10000, // 10 second wait between requests
  }).on('error', err => {
    console.error(err.message); // eslint-disable-line no-console
  });

  const parseVariationsConsumer = Consumer.create({
    queueUrl: PARSE_VARIATIONS_QUEUE_URL,
    handleMessage: parseVariationsHandler,
  }).on('error', err => {
    console.error(err.message); // eslint-disable-line no-console
  });

  const parseShortlinkConsumer = Consumer.create({
    queueUrl: PARSE_SHORTLINK_QUEUE_URL,
    handleMessage: parseShortlinkHandler,
  }).on('error', err => {
    console.error(err.message); // eslint-disable-line no-console
  });

  parseSitemapConsumer.start();
  console.info('Parse sitemap consumer running...'); // eslint-disable-line no-console

  parsePageConsumer.start();
  console.info('Parse page consumer running...'); // eslint-disable-line no-console

  createAndConnectProductConsumer.start();
  console.info('Create and connect product consumer running...'); // eslint-disable-line no-console

  parseProductConsumer.start();
  console.info('Parse product consumer running...'); // eslint-disable-line no-console

  parseVariationsConsumer.start();
  console.info('Parse variations consumer running...'); // eslint-disable-line no-console

  parseShortlinkConsumer.start();
  console.info('Parse shortlink consumer running...'); // eslint-disable-line no-console
} catch (e) {
  console.error(e); // eslint-disable-line no-console
  console.error('Error starting one of the workers. Exiting with code 1...'); // eslint-disable-line no-console

  process.exit(1);
}
