require('dotenv').config();

const {
  createRequestFromAsins,
  getItemsPromise,
  createVariationsRequestFromAsin,
  getVariationReq,
} = require('./amzApi');

const asins = ['B0793HHZF7'];

async function main() {
  const requestUrl = createRequestFromAsins(asins);
  let apiResp;
  try {
    apiResp = await getItemsPromise(requestUrl);
  } catch (err) {
    console.log(err);
  }

  console.log('getItems results:');
  console.log(JSON.stringify(apiResp, null, 1));

  const variationReq = createVariationsRequestFromAsin(asins[0]);
  let varRes;
  try {
    varRes = await getVariationReq(variationReq);
    const { items, errors } = varRes;
    console.log('getVariations results:');
    console.log(JSON.stringify(items, null, 1));
  } catch (err) {
    console.log(err);
  }

  // const { items, errors } = apiResp;

  // if (items) {
  //   items.forEach(async (item) => {
  //     const { offers, name, asin } = item;

  //     // If the product doesn't exist yet, we're going to create it
  //     let availability;

  //     if (offers) {
  //       const {
  //         IsAmazonFulfilled,
  //         IsFreeShippingEligible,
  //         IsPrimeEligible,
  //       } = offers[0].DeliveryInfo;
  //       if (IsAmazonFulfilled || IsFreeShippingEligible || IsPrimeEligible) {
  //         availability = 'AMAZON'; // HIGH-CONV
  //       } else {
  //         availability = 'THIRDPARTY'; // LOW-CONV
  //       }
  //     } else {
  //       availability = 'UNAVAILABLE';
  //     }
  //     console.log(`Availability: ${availability}`);
  //   });
  // }
}

main();
