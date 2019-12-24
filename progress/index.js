require('dotenv').config();

const EventEmitter = require('events');
const redis = require('redis');

const uuid = require('uuid/v4');
const { reportProducer } = require('../report/producers');

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
redisClient.on('connect', () => {
  console.log('Progress manager connected to Redis');
});

// Event name
const SITEMAP_PARSE_STARTED = 'sitemapParseStarted';
const SITEMAP_PARSE_COMPLETED = 'sitemapParseCompleted';

const PAGE_PARSE_ADDED = 'pageParseAdded';
const PAGE_PARSE_COMPLETED = 'pageParseCompleted';

const PRODUCT_CONNECT_ADDED = 'productConnectAdded';
const PRODUCT_CONNECT_COMPLETED = 'productConnectCompleted';

const PRODUCT_FETCH_ADDED = 'productFetchAdded';
const PRODUCT_FETCH_COMPLETED = 'productFetchCompleted';

const VARIATIONS_FETCH_ADDED = 'variationsFetchAdded';
const VARIATIONS_FETCH_COMPLETED = 'variationsFetchCompleted';

const FULL_SITE_COMPLETED = 'fullSiteCompleted';

class ProgressManager extends EventEmitter {
  sitemapParseStarted(eventInfo) {
    this.emit(SITEMAP_PARSE_STARTED, eventInfo);
  }

  sitemapParseCompleted(eventInfo) {
    this.emit(SITEMAP_PARSE_COMPLETED, eventInfo);
  }

  pageParseAdded(eventInfo) {
    this.emit(PAGE_PARSE_ADDED, eventInfo);
  }

  pageParseCompleted(eventInfo) {
    this.emit(PAGE_PARSE_COMPLETED, eventInfo);
  }

  productConnectAdded(eventInfo) {
    this.emit(PRODUCT_CONNECT_ADDED, eventInfo);
  }

  productConnectCompleted(eventInfo) {
    this.emit(PRODUCT_CONNECT_COMPLETED, eventInfo);
  }

  productFetchAdded(eventInfo) {
    this.emit(PRODUCT_FETCH_ADDED, eventInfo);
  }

  productFetchCompleted(eventInfo) {
    this.emit(PRODUCT_FETCH_COMPLETED, eventInfo);
  }

  variationsFetchAdded(eventInfo) {
    this.emit(VARIATIONS_FETCH_ADDED, eventInfo);
  }

  variationsFetchCompleted(eventInfo) {
    this.emit(VARIATIONS_FETCH_COMPLETED, eventInfo);
  }
}

const progMan = new ProgressManager();

// To trigger report generation
progMan.on(FULL_SITE_COMPLETED, ({ jobId }) => {
  const metaKey = `${jobId}:meta`;
  redisClient.hgetall(metaKey, (err, metaInfo) => {
    const { userId, hostname } = metaInfo;

    console.log(
      `Site complete.\nAdding report generation job for: ${hostname}\nUser: ${userId}\n`
    );

    const taskId = uuid();

    reportProducer.send(
      [
        {
          id: taskId,
          body: JSON.stringify({
            userId,
            hostname,
            jobId,
            taskId,
          }),
        },
      ],
      producerError => {
        if (producerError) console.log(producerError);
      }
    );
  });
});

// Sitemap
progMan.on(SITEMAP_PARSE_STARTED, ({ jobId, userId, hostname }) => {
  if (!userId) {
    console.log(
      'ERROR: No userId on sitemap job. No progress tracking will occur.'
    );
    return;
  }

  console.log(
    `Sitemap starting for jobId: ${jobId}\nuserId: ${userId}\nhostname: ${hostname}\n`
  );

  const metaKey = `${jobId}:meta`;
  redisClient.hmset(metaKey, {
    // Set to nothing completed
    userId,
    hostname,
  });
});

progMan.on(SITEMAP_PARSE_COMPLETED, ({ jobId }) => {
  const metaKey = `${jobId}:meta`;
  redisClient.hlen(metaKey, (err, length) => {
    // Make sure job is being tracked
    if (length > 0) {
      redisClient.hmset(metaKey, {
        sitemapComplete: 'true',
      });
    }
  });
});

progMan.on(PAGE_PARSE_ADDED, ({ jobId, taskId }) => {
  const pagesKey = `${jobId}:pages`;
  redisClient.sadd(pagesKey, taskId);
});

// Page
progMan.on(PAGE_PARSE_COMPLETED, ({ jobId, taskId }) => {
  const pagesKey = `${jobId}:pages`;

  redisClient.srem(pagesKey, taskId);

  redisClient.scard(pagesKey, (err, pagesRemainingCount) => {
    if (pagesRemainingCount === 0) {
      const metaKey = `${jobId}:meta`;

      redisClient.hexists(
        metaKey,
        'sitemapComplete',
        (errFromHget, isComplete) => {
          if (isComplete) {
            redisClient.hmset(metaKey, {
              pagesComplete: 'true',
            });
          }
        }
      );
    }
  });
});

// Create Product and link to Link
progMan.on(PRODUCT_CONNECT_ADDED, ({ jobId, taskId }) => {
  const connectKey = `${jobId}:connections`;

  redisClient.sadd(connectKey, taskId);
});

progMan.on(PRODUCT_CONNECT_COMPLETED, ({ jobId, taskId }) => {
  const connectKey = `${jobId}:connections`;

  redisClient.srem(connectKey, taskId);

  redisClient.scard(connectKey, (err, connectionsRemainingCount) => {
    if (connectionsRemainingCount === 0) {
      const metaKey = `${jobId}:meta`;

      redisClient.hexists(
        metaKey,
        'pagesComplete',
        (errFromHget, isPageParsingComplete) => {
          if (isPageParsingComplete) {
            redisClient.hmset(metaKey, {
              connectionsComplete: 'true', // connections only complete if page parsing is
            });

            // Check if product fetching is already done
            redisClient.hexists(
              metaKey,
              'productsComplete',
              (errFromOtherHget, isProductFetchingComplete) => {
                if (isProductFetchingComplete) {
                  redisClient.hexists(
                    metakey,
                    'variationsComplete',
                    (errFromVariationsHget, variationsComplete) => {
                      console.log(`FULL SITE COMPLETE (connections): ${jobId}`);
                      progMan.emit(FULL_SITE_COMPLETED, { jobId });
                    }
                  );
                }
              }
            );

            // Check if no products were added to fetch (recently updated)
            const productsKey = `${jobId}:products`;
            redisClient.scard(
              productsKey,
              (errFromScard, productsRemainingCount) => {
                if (productsRemainingCount === 0) {
                  console.log(
                    `FULL SITE COMPLETE (no products fetched): ${jobId}`
                  );
                  progMan.emit(FULL_SITE_COMPLETED, { jobId });
                }
              }
            );
          }
        }
      );
    }
  });
});

// Product
progMan.on(PRODUCT_FETCH_ADDED, ({ jobId, taskId }) => {
  const productsKey = `${jobId}:products`;

  redisClient.sadd(productsKey, taskId);
});

progMan.on(PRODUCT_FETCH_COMPLETED, ({ jobId, taskId }) => {
  const productsKey = `${jobId}:products`;

  redisClient.srem(productsKey, taskId);

  redisClient.scard(productsKey, (err, productsRemainingCount) => {
    if (productsRemainingCount === 0) {
      const metaKey = `${jobId}:meta`;

      redisClient.hexists(
        metaKey,
        'connectionsComplete',
        (errFromHget, connectionsComplete) => {
          if (connectionsComplete) {
            redisClient.hmset(metaKey, {
              productsComplete: 'true',
            });

            redisClient.hexists(
              metaKey,
              'variationsComplete',
              (errFromVariationsHget, variationsComplete) => {
                if (variationsComplete) {
                  console.log(`FULL SITE COMPLETE (products): ${jobId}`);
                  progMan.emit(FULL_SITE_COMPLETED, { jobId });
                }
              }
            );
          }
        }
      );
    }
  });
});

// Variations
progMan.on(VARIATIONS_FETCH_ADDED, ({ jobId, taskId }) => {
  const variationsKey = `${jobId}:variations`;

  redisClient.sadd(variationsKey, taskId);
});

progMan.on(VARIATIONS_FETCH_COMPLETED, ({ jobId, taskId }) => {
  const variationsKey = `${jobId}:variations`;

  redisClient.srem(variationsKey, taskId);

  redisClient.scard(variationsKey, (err, variationsRemainingCount) => {
    if (variationsRemainingCount === 0) {
      const metaKey = `${jobId}:meta`;

      redisClient.hexists(
        metaKey,
        'connectionsComplete',
        (errFromHget, connectionsComplete) => {
          if (connectionsComplete) {
            redisClient.hexists(
              metaKey,
              'productsComplete',
              (errFromProductsHget, productsComplete) => {
                if (productsComplete) {
                  redisClient.hmset(metaKey, {
                    variationsComplete: 'true',
                  });

                  console.log(`FULL SITE COMPLETE (variations): ${jobId}`);
                  progMan.emit(FULL_SITE_COMPLETED, { jobId });
                }
              }
            );
          }
        }
      );
    }
  });
});

module.exports = progMan;
