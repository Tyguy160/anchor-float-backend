const uuid = require('uuid/v4');

const { getDB } = require('../../prisma/db');
const { getDataFromMessage } = require('./utils');
const {
  createRequestFromAsins,
  getItemsPromise,
  createVariationsRequestFromAsin,
  getVariationReq,
} = require('../../amazon/amzApi');
const progress = require('../../progress/index');
const productCache = require('../productCache');
const { variationsProducer } = require('../producers');

const db = getDB();

async function parseProductHandler(messages) {
  const parsedMessages = messages.map(({ Body }) => ({
    asin: getDataFromMessage(Body, 'asin'),
    jobId: getDataFromMessage(Body, 'jobId'),
    taskId: getDataFromMessage(Body, 'taskId'),
  }));

  const keyByAsinReducer = (dict, { asin, jobId, taskId }) => {
    if (dict[asin]) {
      return {
        ...dict,
        [asin]: dict[asin].concat({
          asin,
          jobId,
          taskId,
        }),
      };
    }
    return {
      ...dict,
      [asin]: [
        {
          asin,
          jobId,
          taskId,
        },
      ],
    };
  };

  // Make a dictionary of ASIN => jobId & taskId
  const asinToMessageDataMap = parsedMessages.reduce(keyByAsinReducer, {});

  const uniqueAsins = [...new Set(parsedMessages.map(info => info.asin))];
  const requestUrl = createRequestFromAsins(uniqueAsins); // create the request object

  let apiResponse;
  try {
    apiResponse = await getItemsPromise(requestUrl); // call the API
  } catch (err) {
    console.log('There was an error with the API request');
    throw Error('API response error'); // Put all items back into the queue
  }

  const { items, errors } = apiResponse;

  if (items) {
    items.forEach(async item => {
      const { offers, name, asin, parentAsin } = item;

      // The asin IS A PARENT if it does not have a value for parentAsin
      if (parentAsin === null) {
        const variationsTaskId = uuid();

        variationsProducer.send(
          [
            {
              id: variationsTaskId,
              body: JSON.stringify({
                asin,
                name,
                jobId: asinToMessageDataMap[asin][0].jobId,
                taskId: variationsTaskId,
              }),
            },
          ],
          producerError => {
            if (producerError) console.log(producerError);
          }
        );

        progress.variationsFetchAdded({
          jobId: asinToMessageDataMap[asin][0].jobId,
          taskId: variationsTaskId,
        });

        const tasksForProduct = asinToMessageDataMap[asin];
        if (tasksForProduct.length > 0) {
          tasksForProduct.forEach(async task => {
            progress.productFetchCompleted({
              jobId: task.jobId,
              taskId: task.taskId,
            });
          });
        }
        return; // return early without doing any DB updates
      }

      // If it's not a parent asin, do other stuff
      let availability;
      if (offers) {
        const {
          IsAmazonFulfilled,
          IsFreeShippingEligible,
          IsPrimeEligible,
        } = offers[0].DeliveryInfo;
        if (IsAmazonFulfilled || IsFreeShippingEligible || IsPrimeEligible) {
          availability = 'AMAZON'; // HIGH-CONV
        } else {
          availability = 'THIRDPARTY'; // LOW-CONV
        }
      } else {
        availability = 'UNAVAILABLE';
      }

      // Does the product exist?
      const existingProduct = await db.products.findOne({
        where: {
          asin,
        },
      });

      if (!existingProduct) {
        console.log(
          `ERR: Product ${asin} should already exist in DB but was not found`
        );
        return;
      }

      await db.products.update({
        where: { id: existingProduct.id },
        data: {
          asin,
          availability,
          name,
        },
      });

      productCache.setProductUpdated(asin);
      productCache.deleteProductQueued(asin);

      const tasksForProduct = asinToMessageDataMap[asin];

      if (tasksForProduct.length > 0) {
        tasksForProduct.forEach(async task => {
          progress.productFetchCompleted({
            jobId: task.jobId,
            taskId: task.taskId,
          });
        });
      }
    });
  }

  if (errors) {
    // Usually items no longer sold
    errors.forEach(async err => {
      // Update items as unavailable
      const { asin } = err;

      if (!asin) return;

      const existingProduct = await db.products.findOne({
        where: {
          asin,
        },
      });

      if (!existingProduct) {
        console.log(
          `ERR: Product ${asin} should already exist in DB but was not found`
        );
        return;
      }

      await db.products.update({
        where: { id: existingProduct.id },
        data: { availability: 'UNAVAILABLE' },
      });
      productCache.setProductUpdated(asin);

      const tasksForProduct = asinToMessageDataMap[asin];

      if (tasksForProduct.length > 0) {
        tasksForProduct.forEach(async task => {
          progress.productFetchCompleted({
            jobId: task.jobId,
            taskId: task.taskId,
          });
        });
      }
    });
  }
}

module.exports = { parseProductHandler };
