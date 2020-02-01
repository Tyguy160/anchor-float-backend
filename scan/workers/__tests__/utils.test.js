const { extractAsinFromUrl } = require('../utils');

describe('extractAsinFromUrl', () => {
  test('accepts a URL object or string', () => {
    const urlString = 'https://www.amazon.com/dp/B004YGRXXI/';

    expect(extractAsinFromUrl(urlString)).toBe('B004YGRXXI');
    expect(extractAsinFromUrl(new URL(urlString))).toBe('B004YGRXXI');
  });

  test('returns correct ASIN from different format URLs', () => {
    const url = new URL('https://www.amazon.com/dp/B004YGRXXI/');
    const noAsinUrl = new URL('https://www.amazon.com/fdasfaf/');

    expect(extractAsinFromUrl(url)).toBe('B004YGRXXI');
    expect(extractAsinFromUrl(noAsinUrl)).toBe(null);
  });
});
