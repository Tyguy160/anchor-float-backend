const ProductAdvertisingAPIv1 = require('./src/index');

function createRequestFromAsins(asins) {
  const configuredRequest = new ProductAdvertisingAPIv1.GetItemsRequest();

  configuredRequest.PartnerTag = process.env.AMAZON_ASSOCIATES_PARTNER_TAG;
  configuredRequest.PartnerType = 'Associates';

  configuredRequest.ItemIds = asins; // Items to request as an array of ASINs

  configuredRequest.Condition = 'New';

  configuredRequest.Resources = [
    'ItemInfo.Title',
    'Offers.Listings.Availability.Message',
    'Offers.Listings.Availability.Type',
    'Offers.Listings.Condition',
    'Offers.Listings.DeliveryInfo.IsAmazonFulfilled',
    'Offers.Listings.DeliveryInfo.IsFreeShippingEligible',
    'Offers.Listings.DeliveryInfo.IsPrimeEligible',
    'Offers.Summaries.OfferCount',
    'ParentASIN',
  ];

  return configuredRequest;
}

function createVariationsRequestFromAsin(asin) {
  const configuredRequest = new ProductAdvertisingAPIv1.GetVariationsRequest();

  configuredRequest.PartnerTag = process.env.AMAZON_ASSOCIATES_PARTNER_TAG;
  configuredRequest.PartnerType = 'Associates';

  configuredRequest.ASIN = asin; // Single ASIN to request

  configuredRequest.Condition = 'New';

  configuredRequest.Resources = [
    'ItemInfo.Title',
    'Offers.Listings.Availability.Message',
    'Offers.Listings.Availability.Type',
    'Offers.Listings.Condition',
    'Offers.Listings.DeliveryInfo.IsAmazonFulfilled',
    'Offers.Listings.DeliveryInfo.IsFreeShippingEligible',
    'Offers.Listings.DeliveryInfo.IsPrimeEligible',
    'Offers.Summaries.OfferCount',
    'ParentASIN',
  ];

  return configuredRequest;
}

async function getItemsPromise(apiRequest) {
  const defaultClient = ProductAdvertisingAPIv1.ApiClient.instance;

  defaultClient.accessKey = process.env.AMAZON_ASSOCIATES_ACCESS_KEY;
  defaultClient.secretKey = process.env.AMAZON_ASSOCIATES_SECRET_KEY;

  defaultClient.host = process.env.AMAZON_ASSOCIATES_HOST;
  defaultClient.region = process.env.AMAZON_ASSOCIATES_REGION;

  const api = new ProductAdvertisingAPIv1.DefaultApi();
  return new Promise((resolve, reject) => {
    api.getItems(apiRequest, (error, data) => {
      if (error) {
        // Usually a 429 error (too many requests)
        return reject(error);
      }

      let items = null;
      if (data.ItemsResult && data.ItemsResult.Items) {
        items = data.ItemsResult.Items.map(item => ({
          asin: item.ASIN,
          name: item.ItemInfo.Title.DisplayValue,
          offers: item.Offers ? item.Offers.Listings : null,
          parentAsin: item.ParentASIN ? item.ParentASIN : null,
          errors: [],
        }));
      }

      // errors relating to specific products requested
      const errors = data.Errors
        ? data.Errors.map((amazonError) => {
          const { Code: code } = amazonError;
          const asin = amazonError.Message.match(/ItemId\s(\S+)/)[1]; // get the ASIN from the error message
          return {
            asin,
            code, // only seen `InvalidParameterValue`
          };
        })
        : null;

      if (errors && items && items.length) {
        errors.forEach(({ asin: errorAsin, code }) => {
          items = items.map((item) => {
            if (item.asin === errorAsin) {
              return {
                ...item,
                errors: item.errors.concat(code),
              };
            }

            return item;
          });
        });
      }

      return resolve({ items, errors });
    });
  });
}

async function getVariationReq(apiRequest) {
  const defaultClient = ProductAdvertisingAPIv1.ApiClient.instance;

  defaultClient.accessKey = process.env.AMAZON_ASSOCIATES_ACCESS_KEY;
  defaultClient.secretKey = process.env.AMAZON_ASSOCIATES_SECRET_KEY;

  defaultClient.host = process.env.AMAZON_ASSOCIATES_HOST;
  defaultClient.region = process.env.AMAZON_ASSOCIATES_REGION;

  const api = new ProductAdvertisingAPIv1.DefaultApi();
  return new Promise((resolve, reject) => {
    api.getVariations(apiRequest, (error, data) => {
      if (error) {
        // Usually a 429 error (too many requests)
        return reject(error);
      }

      let items = null;
      if (data.VariationsResult && data.VariationsResult.Items) {
        items = data.VariationsResult.Items.map(item => ({
          asin: item.ASIN,
          name: item.ItemInfo.Title.DisplayValue,
          offers: item.Offers ? item.Offers.Listings : null,
          parentAsin: item.ParentASIN ? item.ParentASIN : null,
        }));
      }

      if (data.Errors && data.Errors[0].Code === 'NoResults') {
        return resolve({ items, errors: data.Errors });
      }

      return resolve({ items, errors: null });
    });
  });
}

module.exports = {
  createRequestFromAsins,
  getItemsPromise,
  createVariationsRequestFromAsin,
  getVariationReq,
};
