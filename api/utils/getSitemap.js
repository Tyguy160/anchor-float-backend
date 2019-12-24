const axios = require('axios');

async function getRootSitemap(hostname) {
  const url = new URL('http://' + hostname);
  const sitemapExtensions = ['/sitemap.xml', '/sitemap_index.xml'];
  for (const extension of sitemapExtensions) {
    try {
      const proposedUrl = url.origin + extension;
      const res = await axios.head(proposedUrl);
      return res.request.res.responseUrl;
    } catch (err) {
      if (!err.response || !err.response.status) {
        console.log(err);
        // throw new Error();
        return null;
      }
    }
  }

  return null;
}

function handleAxiosError(err) {
  try {
    if (err.response.status) {
      console.log(
        `HTTP Err: ${err.response.status} (${err.response.config.url})`
      );
      return null;
    } else {
      console.log(err);
      return null;
    }
  } catch (err) {
    return null;
  }
}

module.exports = { getRootSitemap };
