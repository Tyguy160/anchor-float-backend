const { getDB } = require('../../prisma/db');
const { getDataFromMessage } = require('./utils');
const {
  createVariationsRequestFromAsin,
  getVariationReq,
} = require('../../amazon/amzApi');
const progress = require('../../progress/index');
const productCache = require('../productCache');

const db = getDB();

async function parseVariationsHandler({ Body }) {
  const asin = getDataFromMessage(Body, 'asin');
  const name = getDataFromMessage(Body, 'name');
  const jobId = getDataFromMessage(Body, 'jobId');
  const taskId = getDataFromMessage(Body, 'taskId');

  const requestUrl = createVariationsRequestFromAsin(asin);

  let apiResponse;
  try {
    apiResponse = await getVariationReq(requestUrl); // call the API
  } catch (err) {
    console.log(`Error in variations request: ${err}`);
    throw Error('API response error'); // Put asin back into the queue
  }

  const { items, errors } = apiResponse;

  // TODO: Send more robust error codes from amzApi.js (instead of true false)
  console.log(errors);
  let availability;
  if (errors && errors[0].Code === 'NoResults') {
    console.log('Unavailable due to no results');
    availability = 'UNAVAILABLE';
  } else if (errors) {
    console.log('Throwing because errors in API response');
    throw Error('Error in API response');
  }

  if (!items || !items.length) {
    availability = 'UNAVAILABLE';
  } else {
    // eslint-disable-next-line max-len
    const varAvailable = items.some(({ offers: variationOffers }) => variationOffers.some(({ DeliveryInfo: variationDeliveryInfo }) => {
      const {
        IsAmazonFulfilled,
        IsFreeShippingEligible,
        IsPrimeEligible,
      } = variationDeliveryInfo;

      return IsAmazonFulfilled || IsFreeShippingEligible || IsPrimeEligible;
    }));

    availability = varAvailable ? 'AMAZON' : 'UNAVAILABLE';
    // availability = 'UNAVAILABLE';
  }

  // Does the product exist?
  const existingProduct = await db.products.findOne({
    where: {
      asin,
    },
  });

  if (!existingProduct) {
    console.log(
      `ERR: Product ${asin} should already exist in DB but was not found`,
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

  progress.variationsFetchCompleted({
    jobId,
    taskId,
  });

  productCache.setProductUpdated(asin);
  productCache.deleteProductQueued(asin);
}

module.exports = { parseVariationsHandler };
