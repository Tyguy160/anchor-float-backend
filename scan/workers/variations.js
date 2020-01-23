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

  const { errors } = apiResponse;
  if (errors && errors.length && errors[0].Code !== 'NoResults') {
    console.log(`Errors in API response: ${errors}`);
    throw Error('Error in API response');
  }

  const { items } = apiResponse;
  const productStatus = getProductStatusFromVariationsResponse(items);

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
      availability: productStatus,
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

function getProductStatusFromVariationsResponse(variationItems) {
  if (!variationItems || !variationItems.length) {
    return 'UNAVAILABLE';
  }

  const isStatusAmazon = variationItems.some(({ offers: variationOffers }) => {
    // If offers is null, return false meaning there are no offers for that variation
    if (!variationOffers || !(variationOffers.length > 0)) {
      return false;
    }

    return variationOffers.some(({ DeliveryInfo: variationDeliveryInfo }) => {
      // If there's no delivery info for the variant, return false meaning
      // there are no available/3rd party offers for that variation
      if (!variationDeliveryInfo) {
        return false;
      }

      const {
        IsAmazonFulfilled,
        IsFreeShippingEligible,
        IsPrimeEligible,
      } = variationDeliveryInfo;

      return IsAmazonFulfilled || IsFreeShippingEligible || IsPrimeEligible;
    });
  });

  if (isStatusAmazon) {
    return 'AMAZON';
  }

  const isStatusThirdParty = variationItems.some(
    ({ offers: variationOffers }) => {
      // If offers is null, return false meaning there are no offers for that variation
      if (!variationOffers || !(variationOffers.length > 0)) {
        return false;
      }

      variationOffers.some(({ DeliveryInfo: variationDeliveryInfo }) => {
        // If there's no delivery info for the variant, return false meaning
        // there are no available/3rd party offers for that variation
        if (!variationDeliveryInfo) {
          return false;
        }

        const {
          IsAmazonFulfilled,
          IsFreeShippingEligible,
          IsPrimeEligible,
        } = variationDeliveryInfo;

        return (
          !IsAmazonFulfilled && !IsFreeShippingEligible && !IsPrimeEligible
        );
      });
    }
  );

  if (isStatusThirdParty) {
    return 'THIRDPARTY';
  }

  return 'UNAVAILABLE';
}

module.exports = { parseVariationsHandler };
