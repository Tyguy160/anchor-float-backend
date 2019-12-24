const { getDataFromMessage } = require('./utils');

async function parseShortlinkHandler({ Body }) {
  const urlStr = getDataFromMessage(Body, 'url');
  if (!urlStr) return;
  // Ensure URL string is a valid URL
  let url;
  try {
    url = new URL(urlStr);
  } catch (err) {
    console.log(`Invalid url: ${urlStr}`);
  }
}

module.exports = { parseShortlinkHandler };
