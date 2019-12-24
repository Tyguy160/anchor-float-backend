const fs = require('fs');
const path = require('path');

const { parseMarkup } = require('../parsers');

const markup = fs.readFileSync(path.resolve(__dirname, './test.html'), 'utf8');

describe('parseMarkup', () => {
  const parsedPageInfo = parseMarkup(markup);

  test('gets page title', () => {
    expect(parsedPageInfo.pageTitle).toBe('Behmor 1600 Plus – Our Review - Triple Bar Coffee');
  });

  test('returns an array of links', () => {
    expect(Array.isArray(parsedPageInfo.links)).toBe(true);
  });

  test('returns a word count', () => {
    expect(parsedPageInfo.wordCount).toBe(1404);
  });

  test('throws if not passed any markup', () => {
    expect(() => parseMarkup()).toThrow();
  });

  test('accepts a CSS selector as an option', () => {
    expect(typeof parseMarkup(markup, { contentSelector: '.entry-content' })).toBe('object');
  });
});
