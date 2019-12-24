function getDataFromMessage(messageBody, dataKey) {
  const body = JSON.parse(messageBody);
  if (!(dataKey in body)) {
    console.log(`Key "${dataKey}" not found in message body`);
    return null;
  }
  return body[dataKey];
}

const csvFields = [
  {
    label: 'Link URL',
    value: 'links.href',
  },
  {
    label: 'Anchor Text',
    value: 'links.anchorText',
  },
  {
    label: 'Page URL',
    value: 'url',
  },
  {
    label: 'Page Title',
    value: 'pageTitle',
  },
  {
    label: 'Affiliate Tagged',
    value: 'links.affiliateTagged',
  },
  {
    label: 'Affiliate Tag Name',
    value: 'links.affiliateTagName',
  },
  {
    label: 'ASIN',
    value: 'links.product.asin',
  },
  {
    label: 'Product Name',
    value: 'links.product.name',
  },
  {
    label: 'Product Availability',
    value: 'links.product.availability',
  },
];

module.exports = { getDataFromMessage, csvFields };
