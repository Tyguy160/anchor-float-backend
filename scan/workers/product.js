const uuid = require('uuid/v4');

const { getDB } = require('../../prisma/db');
const { getDataFromMessage } = require('./utils');
const {
  createRequestFromAsins,
  getItemsPromise,
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

  const { items } = apiResponse;

  if (items) {
    items.forEach(async item => {
      const { name, asin } = item;

      const productStatus = getProductStatusFromItemResponse(item); // AMAZON, THIRDPARTY, or NOTFOUND

      console.log('Product request:')
      console.log(JSON.stringify({asin, productStatus}, null, 2))

      if (!productStatus) {
        // Do variations and early return
        return createVariationsTask({
          asin,
          name,
          jobId: asinToMessageDataMap[asin][0].jobId, // FIXME: we be updating other jobs and not assuming there's only one jobId
        });
      }

      try {
        await updateProductInDB({ asin, availability: productStatus, name });
      } catch (error) {
        console.log('Error trying to update DB');
        console.log(error);
      }

      const tasksForProduct = asinToMessageDataMap[asin];
      if (tasksForProduct.length > 0) {
        tasksForProduct.forEach(async task => {
          progress.productFetchCompleted({
            jobId: task.jobId,
            taskId: task.taskId,
          });
        });
      }

      productCache.setProductUpdated(asin);
      productCache.deleteProductQueued(asin);
    });
  }
}

async function updateProductInDB({ asin, availability, name }) {
  if (!asin) {
    return Promise.reject({ error: `Must call this function with an ASIN` });
  }

  // Make sure the product exists in the database (it should by now)
  const existingProduct = await db.products.findOne({
    where: {
      asin,
    },
  });

  if (!existingProduct) {
    return Promise.reject({ error: `Product ${asin} not found in DB` });
  }

  return db.products.update({
    where: { id: existingProduct.id },
    data: {
      asin,
      availability,
      name,
    },
  });
}

function getProductStatusFromItemResponse(itemResponse) {
  const { offers, errors } = itemResponse;

  if (
    !offers &&
    !errors.some(errorCode => errorCode === 'InvalidParameterValue')
  ) {
    return null; // we don't have certainty about status yet
  }

  if (errors.some(errorCode => errorCode === 'InvalidParameterValue')) {
    return 'NOTFOUND';
  }

  if (offers) {
    const {
      IsAmazonFulfilled,
      IsFreeShippingEligible,
      IsPrimeEligible,
    } = offers[0].DeliveryInfo;

    // If any of the following conditions are true,
    // the product will be marked as available through Amazon
    if (IsAmazonFulfilled || IsFreeShippingEligible || IsPrimeEligible) {
      return 'AMAZON'; // HIGH-CONV
    } else if (
      [IsAmazonFulfilled, IsFreeShippingEligible, IsPrimeEligible].every(
        info => info === 'false'
      )
    ) {
      // Otherwise, since an offer exists and the conditions aren't met,
      // the product must be from a 3rd party seller
      return 'THIRDPARTY';
    }

    return null;
  }
}

function createVariationsTask({ asin, name, jobId }) {
  const variationsTaskId = uuid();

  variationsProducer.send(
    [
      {
        id: variationsTaskId,
        body: JSON.stringify({
          asin,
          name,
          jobId,
          taskId: variationsTaskId,
        }),
      },
    ],

    producerError => {
      if (producerError) console.log(producerError);
    }
  );

  progress.variationsFetchAdded({
    jobId,
    taskId: variationsTaskId,
  });
}

module.exports = { parseProductHandler };
