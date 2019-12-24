const cheerio = require('cheerio');

function parseMarkup(markupString, options = {}) {
  const { contentSelector } = options;

  if (!markupString) {
    throw new Error('No markup was provided');
  }
  if (typeof markupString !== 'string') {
    throw new Error('Provided markup is not a string');
  }
  if (typeof options !== 'object') {
    throw new Error('Options argument should be an object');
  }
  if (contentSelector && typeof contentSelector !== 'string') {
    throw new Error('CSS selector was provided but is not a string');
  }

  const $ = cheerio.load(markupString);
  const pageTitle = $('title').text() || null;
  let content;
  if ($(contentSelector).length) {
    content = $(contentSelector).contents();
  } else {
    content = $('body').contents();
  }

  const str = content
    .map(function getText() {
      return $(this).text();
    })
    .get()
    .join(' ');

  const ALL_WHITESPACE_REGEX = /\s+/g;
  const wordCount = str.replace(ALL_WHITESPACE_REGEX, ' ').split(' ').length;

  // Get links that go somewhere
  const LINK_SELECTOR = 'a[href!=""]:not([href^=#])';
  const links = $(LINK_SELECTOR, content)
    .map(function mapLinkToObject() {
      const node = $(this);
      return {
        href: node.attr('href'),
        text: node
          .text()
          .trim()
          .replace(ALL_WHITESPACE_REGEX, ' '),
        rel: node.attr('rel') || null,
        title: node.attr('title') || null,
      };
    })
    .toArray();

  return { links, pageTitle, wordCount };
}

// Should handle anything that's a valid value to an href attribute
// href refers to the href attribute on the link, origin should include the protocol and host
function parseHref(href, origin) {
  const jsHref = /^javascript/;
  const hashStartHref = /^#/;
  const noProtocolHref = /^\/\/.*/;
  const relativeHref = /^\//;

  let url;
  let isValid;

  try {
    if (jsHref.test(href) || hashStartHref.test(href)) {
      isValid = false;
      return { isValid };
    }
    if (noProtocolHref.test(href)) {
      hrefWithProtocol = `https:${href}`;
      isValid = true;
      url = new URL(hrefWithProtocol);
    } else if (relativeHref.test(href)) {
      isValid = true;
      url = new URL(href, origin);
    } else {
      isValid = true;
      url = new URL(href);
    }
  } catch (err) {
    if (err instanceof TypeError) {
      return { isValid: false };
    }
    throw err;
  }
  const { hostname, pathname, protocol, hash } = url;
  const params = new Map(url.searchParams);
  return {
    isValid,
    hostname,
    pathname,
    protocol,
    hash,
    params,
  };
}

module.exports = {
  parseMarkup,
  parseHref,
};
