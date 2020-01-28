require('dotenv').config();

const {
  createRequestFromAsins,
  getItemsPromise,
  createVariationsRequestFromAsin,
  getVariationReq,
} = require('./amzApi');

const asins = process.argv.slice(2);

async function main() {
  const requestUrl = createRequestFromAsins(asins);
  let apiResp;
  try {
    apiResp = await getItemsPromise(requestUrl);
  } catch (err) {
    console.log(`getItems Errors:\n${err}`);
  }

  console.log('getItems Results:');
  console.log(JSON.stringify(apiResp, null, 1));

  const variationReq = createVariationsRequestFromAsin(asins[0]);
  let varRes;
  try {
    varRes = await getVariationReq(variationReq);
    console.log('getVariations results:');
    console.log(JSON.stringify(varRes, null, 1));
  } catch (err) {
    console.log(`getVariations Errors:\n${err}`);
  }
}

main();
