const Sitemapper = require('sitemapper');
const uuid = require('uuid/v4');
const { getDataFromMessage } = require('./utils');
const { pageProducer } = require('../producers');
const progress = require('../../progress/index');

async function parseSitemapHandler({ Body }) {
  // Get the sitemap using the URL and queue up pages based on the sitemap
  // Could be recursive
  const userId = getDataFromMessage(Body, 'userId');
  const urlStr = getDataFromMessage(Body, 'url');

  if (!urlStr) {
    console.log('No urlStr in sitemapHandler job. This is required.');
    return;
  }

  if (!userId) {
    console.log('No userId in sitemapHandler job. This is now required for tracking progress.');
    return;
  }

  let url;
  try {
    url = new URL(urlStr);
  } catch (err) {
    console.log(`Invalid url: ${urlStr}`);
    return;
  }

  const jobId = uuid(); // Create the jobId for the entire report process

  progress.sitemapParseStarted({ jobId, userId, hostname: url.hostname });

  const sitemap = new Sitemapper();
  const pageUrls = new Set();
  const { sites } = await sitemap.fetch(url.href);
  console.log(`Sitemap: ${url.href} has ${sites.length} pages`);
  sites.forEach(site => pageUrls.add(site));

  pageUrls.forEach((pageUrl) => {
    console.log(`Adding to page parse queue:\n${pageUrl}\n`);

    const taskId = uuid();

    pageProducer.send(
      [
        {
          id: taskId,
          body: JSON.stringify({ url: pageUrl, jobId, taskId }),
        },
      ],
      (err) => {
        if (err) console.log(err);
      },
    );

    progress.pageParseAdded({ jobId, taskId });
  });

  progress.sitemapParseCompleted({ jobId });
}

module.exports = { parseSitemapHandler };
