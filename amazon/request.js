// const fetch = require('node-fetch');
// const parseString = require('xml2js').parseStringPromise;
// const ld = require('lodash');

// function makeApiRequest(url) {
//   return fetch(url)
//     .then(res => res.text());
// }

// function parseRes(body) {
//   return parseString(body); // returns a promise that resolves to a JS object
// }

// function extractDetails(dataObject) {
//   const items = ld.get(dataObject, 'ItemLookupResponse.Items[0].Item', null);
//   if (!items) {
//     return [new Error('No items in response'), null];
//   }
//   const details = items.map(item => ({
//     asin: ld.get(item, 'ASIN[0]', null),
//     amzPageUrl: ld.get(item, 'DetailPageURL[0]', null),
//     totalOffers: parseInt(ld.get(item, 'Offers[0].TotalOffers[0]', 0), 10),
//     newCount: parseInt(ld.get(item, 'OfferSummary[0].TotalNew[0]', 0), 10),
//     usedCount: parseInt(ld.get(item, 'OfferSummary[0].TotalUsed[0]', 0), 10),
//   }));

//   return details;
// }

// async function requestAndExtract(url) {
//   const resBody = await makeApiRequest(url);
//   const responseObject = await parseRes(resBody);
//   return extractDetails(responseObject);
// }

// module.exports = {
//   makeApiRequest,
//   parseRes,
//   extractDetails,
//   requestAndExtract,
// };
