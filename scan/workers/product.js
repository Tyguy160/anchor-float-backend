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

async function updateProductInDB({ asin, availability, name }) {
  if (!asin) {
    return Promise.reject(new Error('Must call with an ASIN'));
  }

  // Make sure the product exists in the database (it should by now)
  const existingProduct = await db.products.findOne({
    where: {
      asin,
    },
  });

  if (!existingProduct) {
    return Promise.reject(new Error(`Product ${asin} not found in DB`));
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
    errors
    && errors.length
    && errors.some(errorCode => errorCode === 'InvalidParameterValue')
  ) {
    return 'NOTFOUND';
  }

  if (!offers || !offers[0].DeliveryInfo) {
    return null; // we don't have certainty about status yet
  }

  const {
    IsAmazonFulfilled,
    IsFreeShippingEligible,
    IsPrimeEligible,
  } = offers[0].DeliveryInfo; // Amazon only ever returns 1 offer

  if (IsAmazonFulfilled || IsFreeShippingEligible || IsPrimeEligible) {
    return 'AMAZON';
  }
  if (!IsAmazonFulfilled && !IsFreeShippingEligible && !IsPrimeEligible) {
    return 'THIRDPARTY';
  }

  return null;
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

    (producerError) => {
      if (producerError) console.log(producerError);
    },
  );

  progress.variationsFetchAdded({
    jobId,
    taskId: variationsTaskId,
  });
}

function keyByAsinReducer(dict, { asin, jobId, taskId }) {
  if (dict[asin]) {
    return {
      ...dict,
      [asin]: dict[asin].concat({ asin, jobId, taskId }),
    };
  }

  return {
    ...dict,
    [asin]: [{ asin, jobId, taskId }],
  };
}

async function parseProductHandler(messages) {
  const parsedMessages = messages.map(({ Body }) => ({
    asin: getDataFromMessage(Body, 'asin'),
    jobId: getDataFromMessage(Body, 'jobId'),
    taskId: getDataFromMessage(Body, 'taskId'),
  }));

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
    items.forEach(async (item) => {
      // eslint-disable-line consistent-return
      const { name, asin } = item;

      const productStatus = getProductStatusFromItemResponse(item);
      if (!productStatus) {
        return createVariationsTask({
          asin,
          name,
          // FIXME: we be updating other jobs and not assuming there's only one jobId
          jobId: asinToMessageDataMap[asin][0].jobId,
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
        tasksForProduct.forEach(async (task) => {
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

  const { errors } = apiResponse;
  if (errors && errors.length) {
    errors.forEach(async ({ asin }) => {
      // We are assuming code is `InvalidParameterValue`
      if (!asin) {
        return;
      }

      try {
        await updateProductInDB({ asin, availability: 'NOTFOUND', name: null });
      } catch (error) {
        console.log('Error trying to update DB');
        console.log(error);
      }

      const tasksForProduct = asinToMessageDataMap[asin];
      if (tasksForProduct.length > 0) {
        tasksForProduct.forEach(async (task) => {
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

module.exports = { parseProductHandler };
