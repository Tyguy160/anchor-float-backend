const fs = require('fs');
const path = require('path');

const {
  extractDetails,
} = require('../request');

describe('Amazon req/res handling functions', () => {
  const dataAsJson = fs.readFileSync(path.resolve(__dirname, './obj.json'));
  const data = JSON.parse(dataAsJson);

  test('extracts data', () => {
    const details = extractDetails(data);
    expect(typeof details).toEqual('object');
    expect(details[0].asin).toEqual('B006MLQHRG');
    expect(details[0].totalOffers).toEqual(0);
  });
});
