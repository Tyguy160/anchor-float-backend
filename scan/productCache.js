require('dotenv').config();

const { promisify } = require('util');
const redis = require('redis');

// Will likely need some config later
const redisClient = redis.createClient({
  host: 'redis',
  retry_strategy(options) {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('The server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      // End reconnecting with built in error
      return undefined;
    }
    // reconnect after
    return Math.min(options.attempt * 100, 3000);
  },
});

const getAsync = promisify(redisClient.get).bind(redisClient);

redisClient.on('connect', () => {
  console.log('Product cache connected to Redis');
});

const PRODUCT_UPDATED_PREFIX = 'product:updated:';

async function isRecentlyUpdated(asin) {
  const key = PRODUCT_UPDATED_PREFIX + asin;

  const value = await getAsync(key);

  if (!value) {
    return false;
  }

  return true;
}

function setProductUpdated(asin) {
  const key = PRODUCT_UPDATED_PREFIX + asin;
  const ONE_DAY = 86400;

  redisClient.setex(key, ONE_DAY, Date.now().toString());
}

const PRODUCT_QUEUED_PREFIX = 'product:queued:';

function setProductQueued(asin) {
  const key = PRODUCT_QUEUED_PREFIX + asin;

  redisClient.set(key, 'true');
}

async function isAlreadyQueued(asin) {
  const key = PRODUCT_QUEUED_PREFIX + asin;

  const value = await getAsync(key);

  if (!value) {
    return false;
  }

  return true;
}

function deleteProductQueued(asin) {
  const key = PRODUCT_QUEUED_PREFIX + asin;

  redisClient.del(key);
}

module.exports = {
  isRecentlyUpdated,
  setProductUpdated,
  setProductQueued,
  isAlreadyQueued,
  deleteProductQueued,
};
