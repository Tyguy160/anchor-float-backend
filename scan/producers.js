require('dotenv').config();
const Producer = require('sqs-producer');

const sitemapProducer = Producer.create({
  queueUrl: process.env.PARSE_SITEMAP_QUEUE_URL,
  region: process.env.AWS_REGION,
});

const pageProducer = Producer.create({
  queueUrl: process.env.PARSE_PAGE_QUEUE_URL,
  region: process.env.AWS_REGION,
});

const createAndConnectProducer = Producer.create({
  queueUrl: process.env.CREATE_CONNECT_PRODUCT_QUEUE_URL,
  region: process.env.AWS_REGION,
});

const productProducer = Producer.create({
  queueUrl: process.env.PARSE_PRODUCT_QUEUE_URL,
  region: process.env.AWS_REGION,
});

const variationsProducer = Producer.create({
  queueUrl: process.env.PARSE_VARIATIONS_QUEUE_URL,
  region: process.env.AWS_REGION,
});

module.exports = {
  sitemapProducer,
  pageProducer,
  createAndConnectProducer,
  productProducer,
  variationsProducer,
};
